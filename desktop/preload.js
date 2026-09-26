const { contextBridge, ipcRenderer } = require("electron");

// Lets the page read and change the desktop app's AI settings
contextBridge.exposeInMainWorld("beastDesktop", {
  getSettings: () => ipcRenderer.invoke("settings:get"),
  saveSettings: (patch) => ipcRenderer.invoke("settings:set", patch),
});
