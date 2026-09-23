# Beast Scripts for Windows

A small Electron app that opens the live Beast Scripts site in its own desktop window.
The Groq API key stays on the server, and anything deployed to Render shows up in the app automatically.

## Get the installer

1. On GitHub, open **Actions → Build Windows desktop app**.
2. Open the latest green run, or click **Run workflow** to build a fresh one.
3. Download **Beast-Scripts-Windows-Installer** at the bottom of the run page, unzip it and run `Beast-Scripts-Setup-<version>.exe`.

The installer isn't code-signed, so Windows SmartScreen will warn the first time: click **More info → Run anyway**.

## Change the server address

The app loads `https://beast-scripts.onrender.com`. To point it somewhere else, change `APP_URL` in `main.js` and rebuild.
For local testing: `BEAST_SCRIPTS_URL=http://localhost:3000 npm start`.

## Develop

```
cd desktop
npm install
npm start      # run the app
npm run dist   # build the Windows installer (on Windows)
```
