const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const isDev = process.argv.includes("--dev");
let presenterWindow;
let audienceWindow;
function createWindow(audienceId) {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 640,
    minHeight: 560,
    backgroundColor: "#101218",
    title: audienceId ? "KT Presenter · Audiencia" : "KT Presenter",
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
              "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self'; img-src 'self' data: blob:; font-src 'self' data: blob:; connect-src 'self' blob:; object-src 'none'; base-uri 'self'; frame-src 'none'",
            ],
          },
        }),
    );
  const hash = audienceId ? `audience=${encodeURIComponent(audienceId)}` : "";
  if (isDev)
    void window.loadURL(`http://127.0.0.1:5173/${hash ? "#" + hash : ""}`);
  else
    void window.loadFile(path.join(__dirname, "../dist/index.html"), { hash });
  return window;
}
app.whenReady().then(() => {
  presenterWindow = createWindow();
  ipcMain.handle("kt:open-audience", (event, id) => {
    if (
      event.sender !== presenterWindow?.webContents ||
      typeof id !== "string" ||
      !/^[a-zA-Z0-9-]{1,128}$/.test(id)
    )
      throw new Error("Solicitud de audiencia inválida.");
    if (audienceWindow && !audienceWindow.isDestroyed()) audienceWindow.close();
    const next = createWindow(id);
    audienceWindow = next;
    next.on("closed", () => {
      if (audienceWindow === next) audienceWindow = undefined;
    });
  });
  app.on("activate", () => {
    if (!BrowserWindow.getAllWindows().length) presenterWindow = createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
