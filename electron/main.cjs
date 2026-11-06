const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const isDev = process.argv.includes("--dev");
function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 640,
    minHeight: 560,
    backgroundColor: "#101218",
    title: "KT Presenter",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event) => event.preventDefault());
  if (!isDev)
    window.webContents.session.webRequest.onHeadersReceived(
      (details, callback) =>
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'none'; object-src 'none'; base-uri 'self'; frame-src 'none'",
            ],
          },
        }),
    );
  if (isDev) window.loadURL("http://127.0.0.1:5173");
  else window.loadFile(path.join(__dirname, "../dist/index.html"));
}
app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
