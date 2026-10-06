const { contextBridge, ipcRenderer } = require("electron");

// Lets the page read and change the desktop app's AI settings
contextBridge.exposeInMainWorld("beastDesktop", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (patch) => ipcRenderer.invoke("settings:set", patch),
});

// The bundled Tscaps editor is shipped unmodified and has no way back to
// Beast Scripts, so add a small floating button on its pages.
if (location.pathname.startsWith("/captions")) {
  window.addEventListener("DOMContentLoaded", () => {
    const back = document.createElement("a");
    back.href = "/";
    back.textContent = "← Scripts";
    back.style.cssText =
      "position:fixed;left:12px;bottom:12px;z-index:2147483647;padding:8px 14px;border-radius:10px;" +
      "background:#FF4500;color:#fff;font:700 13px system-ui,sans-serif;text-decoration:none;" +
      "box-shadow:0 4px 14px rgba(0,0,0,.4);";
    document.body.appendChild(back);
  });
}
