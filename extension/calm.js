/* Calmpage core: kill overlays, restore scrolling, render any page in one readable design.
   Runs in a content script (extension) or from the bookmarklet. No network calls. */
(function () {
  if (window.__calmpage) return;
  const CP = (window.__calmpage = {});
  const DEFAULTS = { theme: "paper", font: "serif", size: 19, width: 68, line: 1.65, bg: "#fbf8f1", fg: "#1d1c1a", link: "#1a5fb4", sticky: true };
  const THEMES = {
    paper: { bg: "#fbf8f1", fg: "#1d1c1a", link: "#1a5fb4" },
    white: { bg: "#ffffff", fg: "#111111", link: "#0b57d0" },
    sepia: { bg: "#f4ecd8", fg: "#3b2f1e", link: "#8a4b08" },
    dark: { bg: "#16171a", fg: "#e6e3dc", link: "#8ab4f8" },
    black: { bg: "#000000", fg: "#d8d8d8", link: "#9ecbff" },
  };
  const FONTS = {
    serif: 'Charter, "Bitstream Charter", "Iowan Old Style", Georgia, Cambria, serif',
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: 'ui-monospace, "SF Mono", Menlo, Consolas, monospace',
    dyslexic: '"OpenDyslexic", "Comic Sans MS", Verdana, sans-serif',
  };
  CP.DEFAULTS = DEFAULTS; CP.THEMES = THEMES; CP.FONTS = FONTS;

  // ---------- 1. Overlay killer ----------
  const KNOWN = [
    "#onetrust-consent-sdk", "#onetrust-banner-sdk", ".onetrust-pc-dark-filter", "#CybotCookiebotDialog", "#CybotCookiebotDialogBodyUnderlay",
    ".fc-consent-root", ".qc-cmp2-container", "#qc-cmp2-container", "#usercentrics-root", "#didomi-host", ".didomi-popup-backdrop",
    ".osano-cm-window", ".truste_overlay", ".truste_box_overlay", "#truste-consent-track", "[id^='sp_message_container']", ".sp_veil",
    ".tp-modal", ".tp-backdrop", ".cc-window", ".cc-banner", "#cookie-law-info-bar", ".cookie-notice-container", "#cookie-notice",
    "#gdpr-consent-tool-wrapper", ".gdpr-banner", "#cmpbox", "#cmpbox2", ".cmp-root", "#iubenda-cs-banner", ".klaro", "#axeptio_overlay",
    ".smartbanner", "#smartbanner", ".smart-app-banner", "[class*='app-banner']", "[id*='app-banner']", ".branch-banner-iframe", "#branch-banner-iframe",
    "iframe[src*='consent']", "iframe[id*='google_ads_iframe'][style*='fixed']", ".modal-backdrop", ".fancybox-overlay",
  ];
  const WORDS = /(cookie|consent|gdpr|ccpa|privacy-?(banner|notice)|newsletter|subscribe|signup|sign-up|paywall|regwall|modal|popup|pop-up|overlay|lightbox|interstitial|backdrop|app-?banner|smart-?banner|open-in-app|get-?the-?app|push-?notif|onesignal|adblock|offer|promo)/i;
  let killed = 0;
  function hide(el) {
    if (!el || el.__cpHidden || el === document.body || el === document.documentElement) return;
    if (el.id === "calmpage-root" || (el.closest && el.closest("#calmpage-root"))) return;
    el.__cpHidden = true;
    el.style.setProperty("display", "none", "important");
    killed++;
  }
  function unlockScroll() {
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      const cs = getComputedStyle(el);
      if (cs.overflow === "hidden" || cs.overflowY === "hidden") { el.style.setProperty("overflow", "auto", "important"); el.style.setProperty("overflow-y", "auto", "important"); }
      if (cs.position === "fixed" && el === document.body) { el.style.setProperty("position", "static", "important"); }
      el.classList.remove("modal-open", "no-scroll", "noscroll", "overflow-hidden", "is-locked", "scroll-lock", "has-modal", "tp-modal-open");
    }
    document.querySelectorAll("[style*='blur(']").forEach((el) => { if (el !== document.body) el.style.setProperty("filter", "none", "important"); });
  }
  function scan(opts) {
    opts = opts || {};
    const vw = innerWidth, vh = innerHeight, area = vw * vh;
    for (const sel of KNOWN) { try { document.querySelectorAll(sel).forEach(hide); } catch (e) {} }
    const all = document.body ? document.body.getElementsByTagName("*") : [];
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.__cpHidden || el.__cpSeen) continue;
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed" && cs.position !== "sticky") continue;
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const cover = (Math.min(r.right, vw) - Math.max(r.left, 0)) * (Math.min(r.bottom, vh) - Math.max(r.top, 0)) / area;
      const name = (el.id + " " + (typeof el.className === "string" ? el.className : "") + " " + (el.getAttribute("aria-label") || "") + " " + (el.getAttribute("role") || "")).toLowerCase();
      const z = parseInt(cs.zIndex, 10) || 0;
      const isNav = el.tagName === "NAV" || el.tagName === "HEADER" || /(^|\s|-)(nav|navbar|header|masthead|toolbar)(\s|-|$)/.test(name);
      if (cs.position === "fixed" && cover > 0.35) { hide(el); continue; }                         // full/large overlays and backdrops
      if (WORDS.test(name) || el.getAttribute("role") === "dialog" || el.getAttribute("aria-modal") === "true") {
        if (!isNav || cover > 0.2) { hide(el); continue; }
      }
      if (cs.position === "fixed" && !isNav && z > 1 && (r.bottom >= vh - 4 || r.top <= 4) && r.height < vh * 0.4 && /\b(button|a)\b/.test(el.innerHTML.slice(0, 4000)) && /(accept|agree|allow|subscribe|sign up|download|open app|get the app|continue|got it|close)/i.test(el.innerText.slice(0, 600))) { hide(el); continue; }
      if (opts.sticky && (isNav || cs.position === "sticky") && r.height < vh * 0.25) { el.style.setProperty("position", "static", "important"); el.__cpSeen = true; continue; }
      el.__cpSeen = true;
    }
    unlockScroll();
    return killed;
  }
  let obs = null, stopAt = 0, pending = false;
  CP.clean = function (opts) {
    scan(opts);
    stopAt = Date.now() + 20000;
    if (!obs && document.body) {
      obs = new MutationObserver(() => {
        if (pending) return; pending = true;
        setTimeout(() => { pending = false; scan(opts); if (Date.now() > stopAt) { obs.disconnect(); obs = null; } }, 250);
      });
      obs.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["class", "style"] });
    }
    return killed;
  };
  CP.killedCount = () => killed;

  // ---------- 2. Reader: one design on every page ----------
  let root = null, saved = null;
  function cssFor(s) {
    const t = THEMES[s.theme] || { bg: s.bg, fg: s.fg, link: s.link };
    const font = FONTS[s.font] || s.font || FONTS.serif;
    return `:host{all:initial}
.cp{position:fixed;inset:0;z-index:2147483647;overflow:auto;background:${t.bg};color:${t.fg};font-family:${font};font-size:${s.size}px;line-height:${s.line};-webkit-font-smoothing:antialiased}
.cp *{box-sizing:border-box;max-width:100%}
.bar{position:sticky;top:0;display:flex;gap:8px;align-items:center;justify-content:flex-end;padding:8px 14px;background:${t.bg};border-bottom:1px solid color-mix(in srgb,${t.fg} 12%,transparent);font:13px system-ui,sans-serif;z-index:2}
.bar .brand{margin-right:auto;opacity:.65}
.bar button{font:inherit;color:${t.fg};background:transparent;border:1px solid color-mix(in srgb,${t.fg} 25%,transparent);border-radius:6px;padding:4px 10px;cursor:pointer}
.bar button:hover{background:color-mix(in srgb,${t.fg} 8%,transparent)}
article{max-width:${s.width}ch;margin:0 auto;padding:28px 22px 120px}
h1{font-size:1.9em;line-height:1.2;margin:.2em 0 .3em}
h2{font-size:1.4em;line-height:1.25;margin:1.6em 0 .5em}h3{font-size:1.15em;margin:1.4em 0 .4em}
.meta{opacity:.65;font-size:.82em;margin-bottom:2em;font-family:system-ui,sans-serif}
p,li{margin:0 0 1em}a{color:${t.link}}svg{max-height:2.5em;width:auto}figure svg,picture svg{max-height:none}img,video,figure,iframe{max-width:100%;height:auto;margin:1em auto;display:block;border-radius:4px}
figcaption{font-size:.8em;opacity:.7;text-align:center}
pre,code{font-family:${FONTS.mono};font-size:.85em;background:color-mix(in srgb,${t.fg} 7%,transparent);border-radius:4px}
pre{padding:12px;overflow:auto;white-space:pre-wrap}code{padding:1px 4px}
blockquote{margin:1em 0;padding-left:1em;border-left:3px solid color-mix(in srgb,${t.fg} 30%,transparent);opacity:.9}
table{border-collapse:collapse;display:block;overflow:auto}td,th{border:1px solid color-mix(in srgb,${t.fg} 20%,transparent);padding:4px 8px}
hr{border:0;border-top:1px solid color-mix(in srgb,${t.fg} 20%,transparent);margin:2em 0}
.empty{max-width:60ch;margin:15vh auto;padding:0 22px;font-family:system-ui,sans-serif}`;
  }
  function esc(s) { return String(s || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
  CP.parse = function () {
    if (typeof Readability === "undefined") return null;
    const clone = document.cloneNode(true);
    const AD = /^(ad|ads|advert|advertisement|adslot|adunit|adsbygoogle|ad[-_].*|.*[-_]ads?|sponsor.*|.*[-_]sponsor.*|sponsored|promo|promoted|dfp.*|taboola.*|outbrain.*|newsletter.*|related-?posts?|share-?(bar|buttons)|social-?share)$/i;
    clone.querySelectorAll("[class],[id]").forEach((el) => {
      const toks = ((typeof el.className === "string" ? el.className : "") + " " + (el.id || "")).split(/\s+/).filter(Boolean);
      if (toks.some((t) => AD.test(t))) el.remove();
    });
    clone.querySelectorAll("ins.adsbygoogle,[id^='google_ads'],[data-ad],[data-ad-slot],[aria-label='Advertisement']").forEach((el) => el.remove());
    try { return new Readability(clone, { charThreshold: 400 }).parse(); } catch (e) { return null; }
  };
  CP.isReaderable = function () {
    try { return typeof isProbablyReaderable === "function" ? isProbablyReaderable(document, { minContentLength: 140, minScore: 20 }) : true; } catch (e) { return false; }
  };
  CP.read = function (settings) {
    if (root) return true;
    const s = Object.assign({}, DEFAULTS, settings || {});
    const art = CP.parse();
    root = document.createElement("div");
    root.id = "calmpage-root";
    const sh = root.attachShadow({ mode: "open" });
    const host = location.hostname.replace(/^www\./, "");
    const txtLen = art ? (art.textContent || "").trim().length : 0;
    const good = art && art.content && (txtLen > 1200 || (txtLen > 300 && CP.isReaderable()));
    const body = good
      ? `<article><h1>${esc(art.title || document.title)}</h1><div class="meta">${esc([art.byline, art.siteName || host].filter(Boolean).join(" · "))} · ${Math.max(1, Math.round((art.length || 0) / 1100))} min read</div>${art.content}</article>`
      : `<div class="empty"><h2>No article on this page</h2><p>Calmpage could not find a main article here, so it cleaned the pop-ups and left the page as is.</p></div>`;
    sh.innerHTML = `<style>${cssFor(s)}</style><div class="cp" role="document"><div class="bar"><span class="brand">Calmpage · ${esc(host)}</span><button data-a="smaller" title="Smaller text">A−</button><button data-a="bigger" title="Bigger text">A+</button><button data-a="exit" title="Back to the original page (Esc)">Original</button></div>${body}</div>`;
    // strip scripts/inline handlers that Readability may have kept
    sh.querySelectorAll("script,style:not(:first-child),noscript").forEach((n) => n.remove());
    sh.querySelectorAll("*").forEach((n) => { for (const a of [...n.attributes]) if (/^on/i.test(a.name)) n.removeAttribute(a.name); });
    const h = sh.querySelector("article h1"), first = sh.querySelector("article h1 ~ * h1, article h1 ~ * h2, article .page h1, article .page h2");
    if (h && first && first.textContent.trim().toLowerCase() === h.textContent.trim().toLowerCase()) first.remove();
    sh.querySelectorAll("a[href]").forEach((a) => { a.target = "_top"; });
    sh.querySelector(".bar").addEventListener("click", (e) => {
      const a = e.target.getAttribute && e.target.getAttribute("data-a");
      if (a === "exit") CP.exit();
      if (a === "bigger" || a === "smaller") { const c = sh.querySelector(".cp"); const cur = parseFloat(getComputedStyle(c).fontSize); c.style.fontSize = (cur + (a === "bigger" ? 1 : -1)) + "px"; }
    });
    saved = { overflow: document.documentElement.style.overflow };
    document.documentElement.style.setProperty("overflow", "hidden", "important");
    (document.body || document.documentElement).appendChild(root);
    document.addEventListener("keydown", onKey, true);
    return !!good;
  };
  function onKey(e) { if (e.key === "Escape" && root) { CP.exit(); } }
  CP.exit = function () {
    if (!root) return;
    root.remove(); root = null;
    document.documentElement.style.overflow = saved ? saved.overflow : "";
    document.removeEventListener("keydown", onKey, true);
  };
  CP.isReading = () => !!root;
  CP.toggle = function (settings) { if (root) { CP.exit(); return false; } CP.clean(settings); CP.read(settings); return true; };
})();
