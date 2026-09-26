// Screenshot the real Beast Coaching site (running locally) at a phone viewport,
// into ./_shots, for the reel's phone frames. Start the app first:
//   HOST=0.0.0.0 PORT=5000 python app.py
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, '_shots');
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.BEAST_BASE || 'http://localhost:5000';
// Demo client used for the portal screenshot. Override via env if you prefer a
// real (consenting) client: PORTAL_CODE=EGxx PORTAL_PIN=1234 node shoot_site.mjs
const CODE = process.env.PORTAL_CODE || 'DEMO01';
const PIN = process.env.PORTAL_PIN || '2026';

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const snap = async (n) => { await p.screenshot({ path: path.join(OUT, n) }); console.log('shot', n); };

await p.goto(BASE + '/', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
await snap('choose.png');

try {
  await p.getByText('BOOK A FREE CALL', { exact: false }).first().click();
  await p.waitForTimeout(700);
  await snap('book.png');
} catch (e) { console.log('book click failed:', e.message); }

await p.goto(BASE + '/checkout', { waitUntil: 'networkidle' });
await p.waitForTimeout(900);
await snap('checkout.png');

await p.goto(BASE + '/portal', { waitUntil: 'networkidle' });
await p.fill('#inp-code', CODE);
await p.fill('#inp-pin', PIN);
await p.click('#btn-login');
await p.waitForTimeout(3500);
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
await snap('portal.png');

await b.close();
console.log('done -> _shots/');
