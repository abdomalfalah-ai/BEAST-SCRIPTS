const { app, BrowserWindow, shell, protocol, ipcMain, safeStorage, net } = require("electron");
const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");

// The UI is served from the bundled public/ folder over a private beast:// scheme,
// and /api/generate is answered here in the main process. No server, no hosting.
protocol.registerSchemesAsPrivileged([
  { scheme: "beast", privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true } },
]);

const APP_ORIGIN = "beast://app";
const PUBLIC_DIR = app.isPackaged
  ? path.join(process.resourcesPath, "public")
  : path.join(__dirname, "..", "public");

// ─── Settings (stored in the user's AppData folder) ───
const DEFAULTS = {
  provider: "groq",
  groqKey: "",
  ollamaUrl: "http://localhost:11434/v1",
  ollamaModel: "qwen2.5:7b",
};

function settingsPath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function loadSettings() {
  try {
    const raw = JSON.parse(fs.readFileSync(settingsPath(), "utf8"));
    let groqKey = "";
    if (raw.groqKeyEnc && safeStorage.isEncryptionAvailable()) {
      groqKey = safeStorage.decryptString(Buffer.from(raw.groqKeyEnc, "base64"));
    } else if (raw.groqKey) {
      groqKey = raw.groqKey;
    }
    return { ...DEFAULTS, ...raw, groqKey };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function saveSettings(s) {
  const out = { provider: s.provider, ollamaUrl: s.ollamaUrl, ollamaModel: s.ollamaModel };
  if (s.groqKey && safeStorage.isEncryptionAvailable()) {
    out.groqKeyEnc = safeStorage.encryptString(s.groqKey).toString("base64");
  } else {
    out.groqKey = s.groqKey;
  }
  fs.mkdirSync(path.dirname(settingsPath()), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(out, null, 2));
}

// The key itself never goes back to the page, only whether one is saved
function publicSettings(s) {
  return { provider: s.provider, hasGroqKey: !!s.groqKey, ollamaUrl: s.ollamaUrl, ollamaModel: s.ollamaModel };
}

ipcMain.handle("settings:get", () => publicSettings(loadSettings()));
ipcMain.handle("settings:set", (_e, patch) => {
  const s = loadSettings();
  if (patch.provider === "groq" || patch.provider === "ollama") s.provider = patch.provider;
  if (typeof patch.groqKey === "string" && patch.groqKey.trim()) s.groqKey = patch.groqKey.trim();
  if (patch.clearGroqKey) s.groqKey = "";
  if (typeof patch.ollamaUrl === "string" && patch.ollamaUrl.trim()) s.ollamaUrl = patch.ollamaUrl.trim().replace(/\/+$/, "");
  if (typeof patch.ollamaModel === "string" && patch.ollamaModel.trim()) s.ollamaModel = patch.ollamaModel.trim();
  saveSettings(s);
  return publicSettings(s);
});

// ─── /api/generate: same request and stream format as server.js ───
function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function handleGenerate(request) {
  const { system, messages } = await request.json();
  const s = loadSettings();

  let url, model, headers = { "Content-Type": "application/json" };
  if (s.provider === "ollama") {
    url = `${s.ollamaUrl}/chat/completions`;
    model = s.ollamaModel;
  } else {
    if (!s.groqKey) return jsonResponse(400, { error: "Add your free Groq API key in Settings (⚙️) first." });
    url = "https://api.groq.com/openai/v1/chat/completions";
    model = "llama-3.3-70b-versatile";
    headers.Authorization = `Bearer ${s.groqKey}`;
  }

  let upstream;
  try {
    upstream = await net.fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: system }, ...messages],
        max_tokens: 2500,
        temperature: 0.9,
        stream: true,
      }),
    });
  } catch (err) {
    const msg = s.provider === "ollama"
      ? "Can't reach Ollama. Make sure the Ollama app is installed and running, then try again."
      : "Can't reach Groq. Check your internet connection, or switch to Local AI in Settings.";
    return jsonResponse(503, { error: msg });
  }

  if (!upstream.ok) {
    let errMsg = `AI error (${upstream.status})`;
    try {
      const errData = await upstream.json();
      errMsg = errData?.error?.message || errData?.error || errMsg;
    } catch (e) {}
    if (upstream.status === 401) errMsg = "Your Groq API key was rejected. Paste a new one in Settings (⚙️).";
    if (upstream.status === 404 && s.provider === "ollama") {
      errMsg = `Model "${s.ollamaModel}" isn't installed. Open a terminal and run: ollama pull ${s.ollamaModel}`;
    }
    return jsonResponse(upstream.status, { error: errMsg });
  }

  // Re-emit the OpenAI-style stream in the shape the page already understands
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = upstream.body.getReader();
  let buffer = "";
  const stream = new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const text = JSON.parse(jsonStr)?.choices?.[0]?.delta?.content;
          if (text) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "content_block_delta", delta: { text } })}\n\n`));
          }
        } catch (e) {}
      }
    },
    cancel() { reader.cancel(); },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
}

function serveFile(pathname) {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, "") || "index.html";
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    return net.fetch(pathToFileURL(path.join(PUBLIC_DIR, "index.html")).toString());
  }
  return net.fetch(pathToFileURL(file).toString());
}

// ─── Window ───
let win;

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
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Links that leave the app (WhatsApp share, Groq console, Ollama download) open in the browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(APP_ORIGIN)) {
      event.preventDefault();
      if (url.startsWith("https://") || url.startsWith("http://")) shell.openExternal(url);
    }
  });

  win.loadURL(`${APP_ORIGIN}/index.html`);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  app.whenReady().then(() => {
    protocol.handle("beast", (request) => {
      const { pathname } = new URL(request.url);
      if (pathname === "/api/generate" && request.method === "POST") return handleGenerate(request);
      return serveFile(pathname);
    });
    createWindow();
  });
  app.on("window-all-closed", () => app.quit());
}
