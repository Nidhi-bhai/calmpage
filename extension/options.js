const CP = window.__calmpage, $ = (id) => document.getElementById(id);
const F = ["theme", "font", "size", "width", "line", "bg", "fg", "link"];
let S;
function preview() {
  const s = read(); const t = CP.THEMES[s.theme] || s;
  $("preview").srcdoc = `<body style="margin:0;background:${t.bg};color:${t.fg};font-family:${CP.FONTS[s.font]};font-size:${s.size}px;line-height:${s.line}"><div style="max-width:${s.width}ch;margin:0 auto;padding:18px"><h2 style="margin-top:0">This is how every article will look</h2><p>Same font, size and colors on every site, with no cookie banner, newsletter pop-up or "open in app" bar. <a href="#" style="color:${t.link}">Links look like this.</a></p></div></body>`;
}
function read() { const o = {}; F.forEach((k) => (o[k] = $(k).type === "number" ? parseFloat($(k).value) : $(k).value)); o.sticky = $("sticky").checked; o.autoClean = $("autoClean").checked; return o; }
chrome.storage.sync.get(null, (got) => {
  S = Object.assign({}, CP.DEFAULTS, { autoClean: true }, got || {});
  F.forEach((k) => ($(k).value = S[k])); $("sticky").checked = S.sticky !== false; $("autoClean").checked = S.autoClean !== false; $("key").value = S.key || "";
  preview();
});
F.forEach((k) => $(k).addEventListener("input", preview));
$("save").onclick = () => chrome.storage.sync.set(read(), () => { $("msg").textContent = CalmLicense.valid($("key").value) ? "Saved." : "Saved. Free uses Paper or Dark until you add a Pro key."; });
$("saveKey").onclick = () => {
  const k = CalmLicense.normalize($("key").value);
  if (!CalmLicense.valid(k)) { $("keyMsg").textContent = "That doesn't look like a PayPal subscription ID (I- plus 12 characters)."; return; }
  chrome.storage.sync.set({ key: k }, () => ($("keyMsg").textContent = "Pro unlocked. Thank you ✨"));
};
