// Session mode lives in storage.session (cleared when the browser closes).
const ss = chrome.storage.session;
chrome.runtime.onMessage.addListener((m, _s, reply) => {
  if (m.cmd === "getSession") { ss.get("on", (r) => reply({ on: !!(r && r.on) })); return true; }
  if (m.cmd === "setSession") {
    ss.set({ on: !!m.on }, () => {
      chrome.tabs.query({}, (tabs) => tabs.forEach((t) => chrome.tabs.sendMessage(t.id, { cmd: m.on ? "read" : "exit", auto: true }, () => void chrome.runtime.lastError)));
      reply({ on: !!m.on });
    });
    return true;
  }
});
chrome.commands.onCommand.addListener((c) => {
  if (c !== "toggle-reader") return;
  chrome.tabs.query({ active: true, currentWindow: true }, ([t]) => t && chrome.tabs.sendMessage(t.id, { cmd: "toggle" }, () => void chrome.runtime.lastError));
});
chrome.runtime.onInstalled.addListener((d) => { if (d.reason === "install") chrome.tabs.create({ url: "https://nidhi-bhai.github.io/calmpage/welcome.html" }); });
