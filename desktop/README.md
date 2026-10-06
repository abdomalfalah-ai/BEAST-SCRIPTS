# Beast Scripts for Windows

A standalone desktop app. It carries its own copy of the Beast Scripts screens and talks to the AI directly,
so there is no server and no hosting bill. Scripts, history and favorites are saved on your PC.

Two video tools sit under **Video Tools** on the home screen:

- **🎬 Reel Builder** (from `reel-maker/builder`) turns your workout clips into a 30-second reel, entirely on your PC.
- **💬 Auto Captions** is [Tscaps](https://github.com/francozanardi/tscaps), bundled unmodified. Drop in a video,
  it transcribes your voice with Whisper on your PC and burns styled Arabic captions into the MP4.
  The first transcription downloads the speech model once (internet needed that one time); after that it works offline.
  For Egyptian Arabic, pick the **small** or **medium** model; the tiny ones make many mistakes.

### Tscaps license
The Tscaps editor is AGPL-3.0 (its engine and templates are MIT). It is built unmodified from the commit pinned in
`scripts/build-captions.mjs`, and the installer carries `captions/SOURCE.txt` pointing to that exact source.
If you ever change Tscaps itself, you must publish your changed source too.

## Pick an AI (both free)

Open **Settings (⚙️)** in the app:

- **☁️ Groq** – free online AI with the best Arabic. Needs internet.
  Create a key at [console.groq.com/keys](https://console.groq.com/keys) and paste it in. The key is stored encrypted on your PC.
- **💻 Local AI (Ollama)** – runs entirely on your PC, no internet needed.
  1. Install [Ollama](https://ollama.com/download).
  2. Run `ollama pull qwen2.5:7b` once (about 5 GB).
  3. Keep Ollama running while you use the app.

  Needs a decent PC (16 GB RAM recommended). Arabic quality is weaker than Groq, and it's slow without a graphics card.
  You can type a different Ollama model name in Settings.

## Get the installer

1. On GitHub, open **Actions → Build Windows desktop app**.
2. Open the latest green run, or click **Run workflow** to build a fresh one.
3. Download **Beast-Scripts-Windows-Installer** at the bottom of the run page, unzip it and run the `.exe`.

The installer isn't code-signed, so Windows SmartScreen will warn the first time: click **More info → Run anyway**.

## Develop

```
cd desktop
npm install
npm run build-captions   # download + build the pinned Tscaps once (needs git and corepack/pnpm)
npm start                # run the app (uses ../public for the screens)
npm run dist             # build the Windows installer (on Windows)
```
