const { contextBridge } = require("electron");
contextBridge.exposeInMainWorld(
  "ktDesktop",
  Object.freeze({ platform: process.platform }),
);
