// Skybound Academy forensics — network capture + bundle download + static constants extraction
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const GAME_URL = process.env.GAME_URL || 'https://skybound-myc8c9et.manus.game/';
const OUT = 'analysis/skybound-remote';
for (const d of ['', '/bundles', '/screenshots']) fs.mkdirSync(path.join(OUT + d), { recursive: true });

const network = [], logs = [];
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

page.on('response', async (res) => {
  const u = res.url(); const ct = res.headers()['content-type'] || '';
  const e = { url: u, status: res.status(), type: ct, size: 0 };
  try { const b = await res.body(); e.size = b.length;
    const fname = decodeURIComponent(u.split('/').pop().split('?')[0]).slice(0, 80) || 'bundle.js';
    if (/\.js(on)?(\?|$)/.test(u) || ct.includes('javascript')) fs.writeFileSync(path.join(OUT, 'bundles', fname), b);
  } catch {}
  network.push(e);
});
page.on('console', m => logs.push(`console.${m.type()}: ${m.text().slice(0, 300)}`));
page.on('pageerror', e => logs.push(`PAGEERROR: ${String(e).slice(0, 500)}`));

try {
  const r = await fetch(GAME_URL); fs.writeFileSync(path.join(OUT, 'index.html'), await r.text());
  await page.goto(GAME_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(8000); await page.screenshot({ path: `${OUT}/screenshots/01-load.png` });
  await page.mouse.click(640, 400); await page.keyboard.press('Enter'); await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/screenshots/02-after-enter.png` });
  for (const k of ['Space', 'ArrowUp', 'KeyW', 'ArrowRight']) { await page.keyboard.press(k); await page.waitForTimeout(600); }
  await page.screenshot({ path: `${OUT}/screenshots/03-attempt-play.png` });
  await page.keyboard.down('ArrowRight'); await page.keyboard.press('Space'); await page.waitForTimeout(2000);
  await page.keyboard.up('ArrowRight'); await page.screenshot({ path: `${OUT}/screenshots/04-run.png` });
  await page.waitForTimeout(6000); await page.screenshot({ path: `${OUT}/screenshots/05-late.png` });
} catch (e) { fs.writeFileSync(path.join(OUT, 'load-error.txt'), String(e)); }
try { fs.writeFileSync(path.join(OUT, 'dom-snapshot.html'), await page.content()); } catch {}
fs.writeFileSync(path.join(OUT, 'network-log.json'), JSON.stringify(network, null, 2));
fs.writeFileSync(path.join(OUT, 'console-log.txt'), logs.join('\n'));
await browser.close();

// ---------- static analysis of captured bundles ----------
const markers = {
  Phaser: /Phaser\.\w+/i, PixiJS: /\bPIXI\.\w+/, ThreeJS: /\bTHREE\.\w+/, Kaboom: /\bkaboom\b/i,
  Kaplay: /\bkaplay\b/i, LittleJS: /\bLittleJS\b/i, Canvas2D: /getContext\(\s*['"]2d['"]\s*\)/,
  WebGL: /getContext\(\s*['"]webgl/i, Matter: /\bMatter\.\w+/, Planck: /\bplanck\b/i,
};
const constRx = /\b(gravity|grav|jumpVel\w*|jumpForce|jumpSpeed|jumpPower|coyote\w*|buffer\w*|dashSpeed|dash\w*|moveSpeed|runSpeed|walkSpeed|friction|bounce|restitution|airControl|maxFall|terminalVel\w*|checkpoint\w*|respawn\w*|combo\w*|rescue\w*|badge\w*|medal\w*|zoneCount|windForce|gustSpeed)\b\s*[:=]\s*[-.\d]+/gi;
const constHits = {}, markerHits = {};
let total = 0;
for (const f of fs.readdirSync(path.join(OUT, 'bundles'))) {
  const p = path.join(OUT, 'bundles', f); let src = '';
  try { src = fs.readFileSync(p, 'utf8'); } catch { continue; }
  total += src.length;
  for (const [k, rx] of Object.entries(markers)) if (rx.test(src)) markerHits[k] = markerHits[k] || f;
  let m; while ((m = constRx.exec(src)) && Object.keys(constHits).length < 300) {
    const ctx = src.slice(Math.max(0, m.index - 50), m.index + m[0].length + 40).replace(/\s+/g, ' ');
    constHits[m[0]] = constHits[m[0]] || ctx;
  }
}
const byType = {};
for (const e of network) { const t = e.asset || (e.type.split(';')[0] || 'other'); byType[t] = (byType[t] || 0) + e.size; }
const bundles = fs.readdirSync(path.join(OUT, 'bundles')).map(f => { const s = fs.statSync(path.join(OUT, 'bundles', f)); return `${f} — ${(s.size / 1024).toFixed(1)} KB`; });

let rep = `# Skybound Academy — forensics report (remote hands)\n\nGenerated: ${new Date().toISOString()}\nGame: ${GAME_URL}\n\n`;
rep += `## Engine markers (first bundle hitting each)\n${Object.entries(markerHits).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- none found'}\n\n`;
rep += `## Bundles captured (${bundles.length}, ${(total / 1024).toFixed(1)} KB total)\n${bundles.slice(0, 40).map(s => '- ' + s).join('\n')}\n\n`;
rep += `## Network traffic by type (bytes)\n${Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `- ${k}: ${(v / 1024).toFixed(1)} KB`).join('\n')}\n\n`;
rep += `## Constant candidates (${Object.keys(constHits).length} unique)\n`;
for (const [k, v] of Object.entries(constHits).slice(0, 120)) rep += `- \`${k}\`\n  context: \`${v}\`\n`;
rep += `\n## Console/page errors (first 40)\n${logs.slice(0, 40).map(l => '- ' + l).join('\n') || '- none'}\n\n`;
rep += `## Screenshots\n01-load / 02-after-enter / 03-attempt-play / 04-run / 05-late (see screenshots/)\n\n## Load error\n${fs.existsSync(path.join(OUT, 'load-error.txt')) ? fs.readFileSync(path.join(OUT, 'load-error.txt'), 'utf8') : 'none'}\n`;
fs.writeFileSync(path.join(OUT, 'constants-report.md'), rep);
console.log('REPORT WRITTEN');
