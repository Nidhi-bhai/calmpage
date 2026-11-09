(function () {
  const CP = window.__calmpage;
  if (!CP || window.__calmpageContent) return;
  window.__calmpageContent = true;
  const host = location.hostname.replace(/^www\./, "");
  let S = Object.assign({}, CP.DEFAULTS, { autoClean: true, offSites: [], alwaysRead: [], key: "" });
  let pro = false;
  function design() {
    if (pro) return S;
    // Free: Paper or Dark theme, default font and size.
    return Object.assign({}, CP.DEFAULTS, { theme: S.theme === "dark" ? "dark" : "paper", sticky: S.sticky });
  }
  function boot(sessionOn) {
    if (S.offSites.includes(host)) return;
    if (S.autoClean) CP.clean({ sticky: S.sticky });
    if (pro && (sessionOn || S.alwaysRead.includes(host)) && CP.isReaderable()) CP.read(design());
  }
  chrome.storage.sync.get(null, (got) => {
    S = Object.assign(S, got || {});
    pro = CalmLicense.valid(S.key);
    chrome.runtime.sendMessage({ cmd: "getSession" }, (r) => { void chrome.runtime.lastError; boot(!!(r && r.on)); });
  });
  chrome.runtime.onMessage.addListener((m, _s, reply) => {
    if (m.cmd === "toggle") { const on = CP.toggle(design()); reply({ reading: on, killed: CP.killedCount() }); }
    else if (m.cmd === "read") {
      if (m.auto && (!pro || S.offSites.includes(host) || !CP.isReaderable())) { reply({ reading: CP.isReading() }); return true; }
      CP.clean({ sticky: S.sticky }); CP.read(design()); reply({ reading: true });
    }
    else if (m.cmd === "exit") { CP.exit(); reply({ reading: false }); }
    else if (m.cmd === "clean") { reply({ killed: CP.clean({ sticky: true }) }); }
    else if (m.cmd === "state") { reply({ reading: CP.isReading(), killed: CP.killedCount(), host, readerable: CP.isReaderable() }); }
    return true;
  });
})();
