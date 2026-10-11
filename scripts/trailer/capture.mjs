#!/usr/bin/env node
// Candle Climber — record the landing page's deterministic bot demo as the trailer
// master take (Playwright video → webm), isolated to the game canvas.
//
//   node scripts/trailer/capture.mjs [--seconds 38] [--dir /tmp/cc-trailer]
//
// Needs the dev server up (docker compose -f docker-compose.base44.yml up -d) and
// Playwright's chromium installed (it is a devDependency; `bunx playwright install chromium`
// if the browser is missing).
//
// An injected stylesheet hides the rest of the page and the demo's "BOT PLAYING" badge,
// so the recording is pure gameplay — the app itself is untouched. Writes
// <dir>/capture.json (canvas box → used as the build's crop, video path, console errors).
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const require = createRequire(join(REPO, 'package.json'));
const { chromium } = require('playwright');

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const OUT = opt('dir', process.env.TRAILER_DIR || '/tmp/cc-trailer');
const URL = opt('url', process.env.TRAILER_URL || 'http://localhost:3000/');
const SECONDS = Number(opt('seconds', 38));

// The demo loops every 30s; windows in build.mjs sit inside the first loop, so the
// recording must cover the 2.5s preroll + a full loop with headroom.
const VW = 1680;
const VH = 1000;
const ISOLATE = [
  'html, body { background:#0b0d0e !important; }',
  'body * { visibility: hidden !important; }',
  '.lp-demo-wrapper, .lp-demo-wrapper * { visibility: visible !important; }',
  '.lp-demo-badge { display:none !important; }',
  '.lp-demo-canvas-wrap { border:0 !important; border-radius:0 !important; }',
  '.lp-demo-wrapper { position: fixed !important; left:50% !important; top:50% !important; transform: translate(-50%,-50%) !important; margin:0 !important; max-width:none !important; width:1600px !important; z-index:2147483000 !important; }',
].join('\n');

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--hide-scrollbars', '--force-device-scale-factor=1'] });
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, recordVideo: { dir: OUT, size: { width: VW, height: VH } } });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e.message || e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForSelector('.lp-demo-canvas', { state: 'visible', timeout: 30000 });
// isolate only once the demo is actually running: hiding the page around an un-painted
// canvas leaves a dark gap in the take that the loop-seam detector cannot tell from a fade
await page.waitForFunction(() => {
  const b = document.querySelector('.lp-demo-badge');
  return !!b && /BOT PLAYING/.test(b.textContent || '');
}, { timeout: 30000 });
await page.addStyleTag({ content: ISOLATE });
const box = await page.locator('.lp-demo-canvas-wrap').boundingBox();
await page.waitForTimeout(SECONDS * 1000);
const video = page.video();
await ctx.close();
const take = video ? await video.path() : null;
await browser.close();

writeFileSync(join(OUT, 'capture.json'), JSON.stringify({ box, take, errors, viewport: { width: VW, height: VH }, seconds: SECONDS, url: URL }, null, 1));
console.log(JSON.stringify({ take, box, errors: errors.slice(0, 6) }, null, 1));
if (!take) process.exitCode = 1;
