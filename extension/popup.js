const $ = (id) => document.getElementById(id);
let tab, S, pro, host;
function send(cmd, cb) { chrome.tabs.sendMessage(tab.id, { cmd }, (r) => { void chrome.runtime.lastError; cb && cb(r); }); }
function render(st) {
  if (!st) { $("status").textContent = "Calmpage can't run on this page (browser pages and web stores are off-limits)."; ["toggle","clean","site","session","always"].forEach((i) => ($(i).disabled = true)); return; }
  host = st.host; $("host").textContent = host;
  $("status").textContent = (st.killed ? `Removed ${st.killed} pop-up${st.killed > 1 ? "s" : ""} here. ` : "No pop-ups removed here. ") + (st.readerable ? "Article found." : "No main article found.");
  $("toggle").textContent = st.reading ? "Back to the original" : "Read this page calmly";
  $("site").checked = S.autoClean !== false && !(S.offSites || []).includes(host);
  $("always").checked = (S.alwaysRead || []).includes(host);
}
chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => {
  tab = t;
  chrome.storage.sync.get(null, (got) => {
    S = got || {}; pro = CalmLicense.valid(S.key);
    $("upsell").hidden = pro;
    chrome.runtime.sendMessage({ cmd: "getSession" }, (r) => ($("session").checked = !!(r && r.on)));
    send("state", render);
  });
});
$("toggle").onclick = () => send("toggle", () => send("state", render));
$("clean").onclick = () => send("clean", () => send("state", render));
$("site").onchange = (e) => {
  const off = new Set(S.offSites || []); e.target.checked ? off.delete(host) : off.add(host);
  S.offSites = [...off]; chrome.storage.sync.set({ offSites: S.offSites });
};
function needPro(e) { if (!pro) { e.target.checked = false; $("upsell").hidden = false; $("upsell").style.fontWeight = "600"; return true; } return false; }
$("session").onchange = (e) => { if (needPro(e)) return; chrome.runtime.sendMessage({ cmd: "setSession", on: e.target.checked }); };
$("always").onchange = (e) => {
  if (needPro(e)) return;
  const s = new Set(S.alwaysRead || []); e.target.checked ? s.add(host) : s.delete(host);
  S.alwaysRead = [...s]; chrome.storage.sync.set({ alwaysRead: S.alwaysRead });
};
