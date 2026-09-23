const { app, BrowserWindow, shell } = require("electron");
const path = require("path");

// The live site on Render. Everything (UI, API key, updates) is served from there.
const APP_URL = process.env.BEAST_SCRIPTS_URL || "https://beast-scripts.onrender.com";
const APP_ORIGIN = new URL(APP_URL).origin;

let win;

function loadApp() {
  win.loadURL(APP_URL).catch(() => {});
}

function createWindow() {
  win = new BrowserWindow({
    width: 480,
    height: 900,
    minWidth: 380,
    minHeight: 600,
    title: "Beast Scripts",
    backgroundColor: "#0a0a0a",
    icon: path.join(__dirname, "icon.png"),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Links that leave the app (e.g. WhatsApp share) open in the default browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (url.startsWith("file://")) return;
    if (new URL(url).origin !== APP_ORIGIN) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Server unreachable or suspended → offline screen with a Retry button
  win.webContents.on("did-fail-load", (_e, code, _desc, url, isMainFrame) => {
    if (!isMainFrame || code === -3) return; // -3 = navigation aborted
    showOffline(`Could not connect (${code}).`, url);
  });
  win.webContents.on("did-navigate", (_e, url, httpStatus) => {
    if (url.startsWith(APP_ORIGIN) && httpStatus >= 500) {
      showOffline(`The server responded with an error (${httpStatus}).`, url);
    }
  });

  loadApp();
}

function showOffline(reason) {
  win.loadFile(path.join(__dirname, "offline.html"), {
    query: { reason, url: APP_URL },
  });
}

// "Retry" on the offline screen navigates to beast-retry://, which we intercept
app.on("web-contents-created", (_e, contents) => {
  contents.on("will-navigate", (event, url) => {
    if (url.startsWith("beast-retry:")) {
      event.preventDefault();
      loadApp();
    }
  });
});

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(createWindow);
  app.on("window-all-closed", () => app.quit());
}
