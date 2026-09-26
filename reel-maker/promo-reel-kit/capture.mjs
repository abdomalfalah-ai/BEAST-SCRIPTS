// Deterministic frame capture of reel.html via Playwright/Chromium.
// Usage:
//   node capture.mjs preview          -> one PNG per scene into preview/
//   node capture.mjs frames <fps> <dur> -> sequential frames into frames/
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const fileUrl = 'file://' + path.join(DIR, 'reel.html').replace(/\\/g, '/');
const mode = process.argv[2] || 'preview';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await page.goto(fileUrl);
await page.waitForTimeout(400); // let font + images decode

async function shot(t, file) {
  await page.evaluate((tt) => window.seek(tt), t);
  await page.screenshot({ path: file });
}

if (mode === 'preview') {
  const outDir = path.join(DIR, 'preview');
  fs.mkdirSync(outDir, { recursive: true });
  const times = [1.6, 6.6, 11.2, 16.2, 20.2, 24.8, 28.4];
  for (let i = 0; i < times.length; i++) {
    await shot(times[i], path.join(outDir, `scene${i + 1}.png`));
  }
  console.log('preview done:', times.length, 'frames');
} else {
  const fps = +(process.argv[3] || 30);
  const dur = +(process.argv[4] || 30);
  const outDir = path.join(DIR, 'frames');
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
  const total = Math.round(fps * dur);
  for (let f = 0; f < total; f++) {
    const t = f / fps;
    await shot(t, path.join(outDir, String(f).padStart(4, '0') + '.png'));
    if (f % 60 === 0) console.log('frame', f, '/', total);
  }
  console.log('frames done:', total);
}
await browser.close();
