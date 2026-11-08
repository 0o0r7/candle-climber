// Public-page technical and visual evidence capture for 40 sample games.
// Loads each public URL normally, captures five states, and records visible
// page/resource metadata. Selected JavaScript is scanned in memory only;
// complete game bundles are never retained.
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const BASE = path.join(ROOT, 'analysis', 'studio-sample-catalog');
const INPUT = path.join(BASE, 'catalog.json');
const SCREENSHOTS = path.join(BASE, 'screenshots');
const TIMEOUT_MS = Math.max(10000, Number(process.env.PAGE_TIMEOUT_MS || 45000));
const SETTLE_MS = Math.max(0, Number(process.env.SETTLE_MS || 3000));
const CONCURRENCY = Math.max(1, Math.min(2, Number(process.env.CONCURRENCY || 2)));
const MAX_RESOURCES = 500;
const MAX_SCRIPT_BODIES = 30;
const MAX_SCRIPT_BYTES_EACH = 4 * 1024 * 1024;
const MAX_SCRIPT_BYTES_TOTAL = 16 * 1024 * 1024;
const MAX_CONSTANTS = 120;
const MAX_VISIBLE_TEXT = 8000;

const ENGINE_MARKERS = [
  ['Phaser', /\bPhaser(?:\.|\s)/i], ['PixiJS', /\bPIXI\./],
  ['Three.js', /\bTHREE\./], ['Babylon.js', /\bBABYLON\./],
  ['PlayCanvas', /\bpc\.Application\b|\bplaycanvas\b/i],
  ['Unity WebGL', /\bUnityLoader\b|\bcreateUnityInstance\b/],
  ['Godot Web', /\bGodot\b|\bEngine\.create\b/],
  ['Kaboom', /\bkaboom\b/i], ['Kaplay', /\bkaplay\b/i],
  ['Konva', /\bKonva\./],
  ['Canvas 2D API', /getContext\s*\(\s*['"]2d['"]\s*\)/],
  ['WebGL API', /getContext\s*\(\s*['"]webgl2?['"]\s*\)/i],
];
const CONSTANT_RX = /\b(gravity|grav|jumpVel\w*|jumpForce|jumpSpeed|jumpPower|coyote\w*|buffer\w*|dashSpeed|dash\w*|moveSpeed|runSpeed|walkSpeed|friction|bounce|restitution|airControl|maxFall|terminalVel\w*|checkpoint\w*|respawn\w*|combo\w*|rescue\w*|zoneCount|windForce|gustSpeed)\b\s*[:=]\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)/gi;
const START_BUTTON_RX = /^(play|start|begin|start game|play game|new game|new run|continue|resume)$/i;

function slug(value) {
  return String(value || 'game').normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 64) || 'game';
}
function safeUrl(raw) {
  try { const u = new URL(raw); return `${u.origin}${u.pathname}`; }
  catch { return String(raw || '').slice(0, 500); }
}
function parseLength(headers) {
  const n = Number(headers['content-length']);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function isJavaScript(resourceType, contentType, url) {
  return resourceType === 'script' || /(?:java|ecma)script/i.test(contentType) || /\.m?js(?:$|[?#])/i.test(url);
}
function digest(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

const catalog = JSON.parse(await fs.readFile(INPUT, 'utf8'));
const games = Array.isArray(catalog.games) ? catalog.games : [];
if (games.length !== 40) throw new Error(`Expected exactly 40 catalog games; found ${games.length}.`);
if (new Set(games.map(g => g.id)).size !== 40) throw new Error('Duplicate game IDs in catalog.');
if (new Set(games.map(g => g.launch_url)).size !== 40) throw new Error('Duplicate launch URLs in catalog.');
await fs.mkdir(SCREENSHOTS, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const reports = new Array(games.length);
let cursor = 0;

async function captureOne(game, index) {
  const id = String(game.id || `game-${index + 1}`);
  const imageDir = path.join(SCREENSHOTS, slug(id));
  await fs.mkdir(imageDir, { recursive: true });
  const report = {
    id, index: game.index ?? index + 1, title: String(game.title || ''),
    category: String(game.category || ''), is_template: Boolean(game.is_template),
    launch_url: safeUrl(game.launch_url), status: 'not_started', http_status: null,
    captured_at: new Date().toISOString(), page_title: '',
    stage_text: {}, screenshots: [], controls_attempted: [], start_action: 'none',
    interaction_visual_change_signal: null,
    canvas_inventory: [], visible_images: [], resource_inventory: [],
    resource_type_totals: {}, engine_markers: [],
    engine_marker_caveat: 'Static markers are clues only; they do not prove which library is actively driving the game.',
    script_inventory: [], tuning_constant_candidates: [], console_messages: [],
    page_errors: [], request_failures: [], limitations: [],
  };
  if (!/^https?:\/\//i.test(game.launch_url || '')) {
    report.status = 'invalid_url';
    report.limitations.push('No public HTTP(S) launch URL was available.');
    return report;
  }

  let context;
  let page;
  const pending = [];
  const markers = new Set();
  let scannedScriptCount = 0;
  let scannedScriptBytes = 0;
  let constantsStored = 0;
  const stageDigests = {};
  const isFormFocused = async () => page.evaluate(() => ['input','textarea','select'].includes((document.activeElement?.tagName || '').toLowerCase())).catch(() => true);
  const bodyText = async () => (await page.locator('body').innerText({ timeout: 3000 }).catch(() => '')).slice(0, MAX_VISIBLE_TEXT);
  const snap = async (key, filename) => {
    report.stage_text[key] = await bodyText();
    const filepath = path.join(imageDir, filename);
    try {
      await page.screenshot({ path: filepath, fullPage: false, animations: 'disabled' });
      const bytes = await fs.readFile(filepath);
      stageDigests[key] = digest(bytes);
      report.screenshots.push({ stage: key, path: path.relative(ROOT, filepath), sha256: stageDigests[key] });
    } catch (err) {
      report.limitations.push(`Screenshot ${key} unavailable: ${String(err).slice(0, 220)}`);
    }
  };

  try {
    context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    page = await context.newPage();
    page.on('console', msg => {
      if (report.console_messages.length < 60) report.console_messages.push({ type: msg.type(), text: msg.text().slice(0, 400) });
    });
    page.on('pageerror', err => {
      if (report.page_errors.length < 40) report.page_errors.push(String(err).slice(0, 700));
    });
    page.on('requestfailed', req => {
      if (report.request_failures.length < 60) report.request_failures.push({ url: safeUrl(req.url()), error: String(req.failure()?.errorText || 'unknown').slice(0, 250) });
    });
    page.on('response', res => {
      const task = (async () => {
        let headers = {};
        try { headers = await res.allHeaders(); } catch { /* response may close */ }
        const rawUrl = res.url();
        const resourceType = res.request().resourceType();
        const contentType = String(headers['content-type'] || '').slice(0, 160);
        const entry = {
          url: safeUrl(rawUrl), status: res.status(), resource_type: resourceType,
          content_type: contentType, content_length_header: parseLength(headers),
          body_bytes_scanned: null, sha256: null, scan_status: 'not_scanned',
        };
        if (report.resource_inventory.length < MAX_RESOURCES) report.resource_inventory.push(entry);
        report.resource_type_totals[resourceType] = (report.resource_type_totals[resourceType] || 0) + 1;
        if (!isJavaScript(resourceType, contentType, rawUrl)) return;
        if (scannedScriptCount >= MAX_SCRIPT_BODIES || scannedScriptBytes >= MAX_SCRIPT_BYTES_TOTAL) {
          entry.scan_status = 'skipped_limit'; return;
        }
        if (entry.content_length_header !== null && entry.content_length_header > MAX_SCRIPT_BYTES_EACH) {
          entry.scan_status = 'skipped_large'; return;
        }
        try {
          const body = await res.body();
          if (body.length > MAX_SCRIPT_BYTES_EACH || scannedScriptBytes + body.length > MAX_SCRIPT_BYTES_TOTAL) {
            entry.scan_status = 'skipped_large'; return;
          }
          scannedScriptCount++;
          scannedScriptBytes += body.length;
          entry.body_bytes_scanned = body.length;
          entry.sha256 = digest(body);
          entry.scan_status = 'scanned_in_memory_only';
          const source = body.toString('utf8');
          for (const [name, rx] of ENGINE_MARKERS) if (rx.test(source)) markers.add(name);
          if (report.script_inventory.length < MAX_SCRIPT_BODIES) {
            report.script_inventory.push({ url: entry.url, bytes: body.length, sha256: entry.sha256, note: 'Source body was scanned in memory and not saved.' });
          }
          CONSTANT_RX.lastIndex = 0;
          let match;
          while ((match = CONSTANT_RX.exec(source)) && constantsStored < MAX_CONSTANTS) {
            const candidate = { symbol: match[1], value: match[2], source_url: entry.url, evidence_type: 'static textual candidate; requires gameplay corroboration' };
            if (!report.tuning_constant_candidates.some(x => x.symbol === candidate.symbol && x.value === candidate.value && x.source_url === candidate.source_url)) {
              report.tuning_constant_candidates.push(candidate); constantsStored++;
            }
          }
        } catch (err) {
          entry.scan_status = 'body_unavailable';
          entry.scan_error = String(err).slice(0, 250);
        }
      })().catch(err => {
        if (report.limitations.length < 20) report.limitations.push(`Resource inspection issue: ${String(err).slice(0, 250)}`);
      });
      pending.push(task);
    });

    const response = await page.goto(game.launch_url, { waitUntil: 'domcontentloaded', timeout: TIMEOUT_MS });
    report.http_status = response?.status() ?? null;
    await page.waitForTimeout(SETTLE_MS);
    report.status = 'page_loaded';
    report.page_title = (await page.title().catch(() => '')).slice(0, 300);
    await snap('load', '01-load.png');

    // Safe start attempt: click only a visible canvas or a button whose entire
    // accessible name is a basic start verb. Never click links or arbitrary UI.
    try {
      const buttons = page.getByRole('button', { name: START_BUTTON_RX });
      const buttonCount = await buttons.count();
      if (buttonCount > 0 && await buttons.first().isVisible().catch(() => false)) {
        await buttons.first().click({ timeout: 1500 });
        report.start_action = 'clicked_exact_start_button';
      } else {
        const canvas = page.locator('canvas').first();
        if (await canvas.count() && await canvas.isVisible().catch(() => false)) {
          const box = await canvas.boundingBox();
          if (box && box.width > 0 && box.height > 0) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
            report.start_action = 'clicked_canvas_center';
          }
        }
      }
    } catch (err) {
      report.limitations.push(`Safe start attempt unavailable: ${String(err).slice(0, 220)}`);
    }
    if (!(await isFormFocused())) {
      await page.keyboard.press('Enter').catch(() => {});
      report.controls_attempted.push('Enter');
    }
    await page.waitForTimeout(900);
    await snap('after_start', '02-after-start.png');

    if (!(await isFormFocused())) {
      for (const key of ['Space', 'ArrowUp', 'KeyW', 'ArrowRight']) {
        await page.keyboard.press(key).catch(() => {});
        report.controls_attempted.push(key);
        await page.waitForTimeout(250);
      }
    } else {
      report.limitations.push('Generic keyboard sequence skipped because a text/select input was focused.');
    }
    await page.waitForTimeout(500);
    await snap('after_key_burst', '03-after-key-burst.png');

    if (!(await isFormFocused())) {
      await page.keyboard.down('ArrowRight').catch(() => {});
      await page.keyboard.down('Space').catch(() => {});
      report.controls_attempted.push('hold ArrowRight + Space for 1800ms');
      await page.waitForTimeout(1800);
      await page.keyboard.up('Space').catch(() => {});
      await page.keyboard.up('ArrowRight').catch(() => {});
    }
    await snap('after_combined_input', '04-after-combined-input.png');
    await page.waitForTimeout(3500);
    await snap('late', '05-late.png');
    report.interaction_visual_change_signal = stageDigests.load && stageDigests.after_combined_input
      ? stageDigests.load !== stageDigests.after_combined_input
      : null;
    report.interaction_visual_change_caveat = 'A changed screenshot may reflect animation or elapsed time; it is not proof that the inputs were understood.';

    await Promise.allSettled(pending);
    const pageSnapshot = await page.evaluate(() => ({
      canvases: [...document.querySelectorAll('canvas')].slice(0, 20).map(c => ({ width: c.width, height: c.height, css_width: Math.round(c.getBoundingClientRect().width), css_height: Math.round(c.getBoundingClientRect().height) })),
      images: [...document.querySelectorAll('img')].slice(0, 100).map(img => ({ src: img.currentSrc || img.src || '', alt: img.alt || '', natural_width: img.naturalWidth, natural_height: img.naturalHeight, visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length) })),
    })).catch(() => ({ canvases: [], images: [] }));
    report.canvas_inventory = pageSnapshot.canvases;
    report.visible_images = pageSnapshot.images.map(img => ({ ...img, src: safeUrl(img.src) }));
    report.engine_markers = [...markers].sort();
    report.script_bytes_scanned = scannedScriptBytes;
    report.script_count_scanned = scannedScriptCount;
  } catch (err) {
    report.status = /timeout/i.test(String(err)) ? 'navigation_timeout' : 'navigation_failed';
    report.limitations.push(String(err).slice(0, 1000));
    report.engine_markers = [...markers].sort();
    report.script_bytes_scanned = scannedScriptBytes;
    report.script_count_scanned = scannedScriptCount;
    await Promise.allSettled(pending);
  } finally {
    await context?.close().catch(() => {});
  }
  return report;
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= games.length) return;
    reports[index] = await captureOne(games[index], index);
    process.stdout.write(`[${index + 1}/${games.length}] ${reports[index].id}: ${reports[index].status}\n`);
  }
}

try {
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, games.length) }, () => worker()));
} finally {
  await browser.close();
}

const statusCounts = reports.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});
const output = {
  generated_at: new Date().toISOString(), catalog_count: games.length,
  category_counts: catalog.category_counts, template_count: catalog.template_count,
  methodology: 'Normal public page navigation. Five screenshots record load, a safe start attempt, a short generic key burst, a combined input hold, and a late frame. Resource metadata is collected from the browser session; selected JavaScript is scanned in memory only.',
  caveat: 'Generic input is not a complete or game-specific playtest. Visual changes can be animation only. Static library markers and numeric-name matches are candidates, not proof of active engine use or runtime physics. Complete game bundles are not retained.',
  status_counts: statusCounts, games: reports,
};
await fs.writeFile(path.join(BASE, 'technical-audit.json'), JSON.stringify(output, null, 2) + '\n', 'utf8');

const lines = [
  '# گزارش گذر فنی و قاب‌های ورودیِ نمونه‌بازی‌ها', '',
  `تعداد رکوردهای کاتالوگ: ${games.length}؛ صفحه‌های بارگذاری‌شده: ${statusCounts.page_loaded || 0}؛ خطا/timeout: ${games.length - (statusCounts.page_loaded || 0)}.`, '',
  '## مرز شواهد', '',
  'این گذر پنج تصویر از بارگذاری، تلاش امن برای آغاز، چند کلید عمومی و یک قاب دیرتر می‌گیرد. این ورودی‌ها آزمون کامل یا اختصاصیِ هر بازی نیستند؛ تغییر تصویر نیز می‌تواند فقط انیمیشن باشد. نام کتابخانه‌ها و ثابت‌های عددیِ یافت‌شده در JavaScript صرفاً «نشانه/نامزد» هستند، نه اثبات موتور فعال یا فیزیک اجرا. متن کامل باندل‌های بازی ذخیره نشده است. برای رفتار، هدف، پاداش و جریمه، تحلیل هر بازی باید تصاویر و متن مرحله‌ای را جداگانه بررسی کند.', '',
  '| شناسه | بازی | صفحه | نشانه‌های کتابخانه | JS اسکن‌شده | نامزد ثابت‌ها | تغییر قاب پس از ورودی |',
  '|---|---|---|---|---:|---:|---|',
];
for (const r of reports) lines.push(`| ${r.id} | ${r.title.replaceAll('|', '\\|')} | ${r.status} | ${(r.engine_markers || []).join(', ') || 'نامشخص'} | ${r.script_count_scanned || 0} | ${(r.tuning_constant_candidates || []).length} | ${r.interaction_visual_change_signal === null ? 'نامشخص' : r.interaction_visual_change_signal ? 'بله (غیرقطعی)' : 'خیر'} |`);
lines.push('', '## محدودیت‌ها', '', '- صفحه‌ی آغازین ممکن است کتابخانه یا حالت گیم‌پلی را بارگیری نکند؛ نبودن نشانه به‌معنای نبودن قابلیت نیست.', '- توالی کلیدها عمومی است و برای تمام بازی‌ها مناسب نیست؛ گزارش هر بازی باید کنترل‌های واقعی را فقط از شاهد آشکار ثبت کند.', '- regex ممکن است false positive/negative بدهد؛ نامزدهای ثابت باید با رفتار بازی تطبیق داده شوند.', '- هیچ ورود، پرداخت، فرم، خرید، انتشار یا API خصوصی انجام نمی‌شود؛ باندل کامل یا دارایی بازتوزیع‌پذیر ذخیره نمی‌شود.', '', 'فایل JSON کامل و پنج قاب هر بازی در همین پوشه هستند؛ شناسه‌ی game-id آن‌ها را به پایگاه تجربه‌ی بازی پیوند می‌دهد.', '');
await fs.writeFile(path.join(BASE, 'technical-summary-fa.md'), lines.join('\n'), 'utf8');
process.stdout.write(`Wrote ${path.join(BASE, 'technical-audit.json')} and technical-summary-fa.md\n`);
