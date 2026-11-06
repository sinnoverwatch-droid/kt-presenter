const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "ktDesktop",
  Object.freeze({
    platform: process.platform,
    openAudience: (id) => ipcRenderer.invoke("kt:open-audience", id),
  }),
);
