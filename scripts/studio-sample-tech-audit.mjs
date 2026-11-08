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
const AUDIT_PATH = path.join(BASE, 'technical-audit.json');
const SUMMARY_PATH = path.join(BASE, 'technical-summary-fa.md');
const PAGE_TIMEOUT_MS = Math.max(10000, Number(process.env.PAGE_TIMEOUT_MS || 30000));
const GAME_BUDGET_MS = Math.max(20000, Number(process.env.GAME_BUDGET_MS || 60000));
const SETTLE_MS = Math.max(0, Number(process.env.SETTLE_MS || 1200));
const BODY_TIMEOUT_MS = Math.max(250, Number(process.env.BODY_TIMEOUT_MS || 1500));
const DRAIN_TIMEOUT_MS = Math.max(500, Number(process.env.DRAIN_TIMEOUT_MS || 3000));
const CONCURRENCY = Math.max(1, Math.min(2, Number(process.env.CONCURRENCY || 2)));
const MAX_RESOURCES = 300;
const MAX_SCRIPT_BODIES = 8;
const MAX_SCRIPT_BYTES_EACH = 1 * 1024 * 1024;
const MAX_SCRIPT_BYTES_TOTAL = 4 * 1024 * 1024;
const MAX_CONSTANTS = 80;
const MAX_VISIBLE_TEXT = 6000;
const STAGES = [
  ['load', '01-load.png'],
  ['after_start', '02-after-start.png'],
  ['after_key_burst', '03-after-key-burst.png'],
  ['after_combined_input', '04-after-combined-input.png'],
  ['late', '05-late.png'],
];

const ENGINE_MARKERS = [
  ['Phaser', /\bPhaser(?:\.|\s)/i], ['PixiJS', /\bPIXI\./],
  ['Three.js', /\bTHREE\./], ['Babylon.js', /\bBABYLON\./],
  ['PlayCanvas', /\bpc\.Application\b|\bplaycanvas\b/i],
  ['Unity WebGL', /\bUnityLoader\b|\bcreateUnityInstance\b/],
  ['Godot Web', /\bGodot\b|\bEngine\.create\b/],
  ['Kaboom', /\bkaboom\b/i], ['Kaplay', /\bkaplay\b/i], ['Konva', /\bKonva\./],
  ['Canvas 2D API', /getContext\s*\(\s*['"]2d['"]\s*\)/],
  ['WebGL API', /getContext\s*\(\s*['"]webgl2?['"]\s*\)/i],
];
const CONSTANT_RX = /\b(gravity|grav|jumpVel\w*|jumpForce|jumpSpeed|jumpPower|coyote\w*|buffer\w*|dashSpeed|dash\w*|moveSpeed|runSpeed|walkSpeed|friction|bounce|restitution|airControl|maxFall|terminalVel\w*|checkpoint\w*|respawn\w*|combo\w*|rescue\w*|badge\w*|medal\w*|zoneCount|windForce|gustSpeed)\b\s*[:=]\s*([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)/gi;
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
function withTimeout(promise, ms, fallback = null) {
  return new Promise(resolve => {
    let settled = false;
    const timer = setTimeout(() => { if (!settled) { settled = true; resolve(fallback); } }, ms);
    Promise.resolve(promise).then(value => {
      if (!settled) { settled = true; clearTimeout(timer); resolve(value); }
    }, () => {
      if (!settled) { settled = true; clearTimeout(timer); resolve(fallback); }
    });
  });
}
function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

const catalog = JSON.parse(await fs.readFile(INPUT, 'utf8'));
const games = Array.isArray(catalog.games) ? catalog.games : [];
if (games.length !== 40) throw new Error(`Expected exactly 40 catalog games; found ${games.length}.`);
if (new Set(games.map(g => g.id)).size !== 40) throw new Error('Duplicate game IDs in catalog.');
if (new Set(games.map(g => g.launch_url)).size !== 40) throw new Error('Duplicate launch URLs in catalog.');
await fs.mkdir(SCREENSHOTS, { recursive: true });

function emptyReport(game, index) {
  return {
    id: String(game.id || `game-${index + 1}`), index: game.index ?? index + 1,
    title: String(game.title || ''), category: String(game.category || ''),
    is_template: Boolean(game.is_template), launch_url: safeUrl(game.launch_url),
    page_status: 'pending', capture_status: 'pending', http_status: null,
    captured_at: null, page_title: '', stage_text: {}, screenshots: [],
    completed_stages: [], controls_attempted: [], start_action: 'none',
    interaction_visual_change_signal: null,
    canvas_inventory: [], visible_images: [], resource_inventory: [],
    resource_type_totals: {}, engine_markers: [],
    engine_marker_caveat: 'Static markers are clues only; they do not prove which library is actively driving the game.',
    script_inventory: [], script_bytes_scanned: 0, script_count_scanned: 0,
    tuning_constant_candidates: [], console_messages: [], page_errors: [],
    request_failures: [], limitations: [],
  };
}
const reports = games.map(emptyReport);
let writeChain = Promise.resolve();

function outputObject() {
  const captureCounts = reports.reduce((acc, r) => { acc[r.capture_status] = (acc[r.capture_status] || 0) + 1; return acc; }, {});
  const pageCounts = reports.reduce((acc, r) => { acc[r.page_status] = (acc[r.page_status] || 0) + 1; return acc; }, {});
  const finished = reports.filter(r => !['pending', 'in_progress'].includes(r.capture_status)).length;
  return {
    generated_at: new Date().toISOString(), catalog_count: games.length,
    processed_count: finished, complete: finished === games.length,
    category_counts: catalog.category_counts, template_count: catalog.template_count,
    methodology: 'Normal public page navigation. Five screenshots record load, a safe start attempt, a short generic key burst, a combined input hold, and a late frame. Resource metadata is captured from browser responses; small JavaScript resources with known content length are scanned in memory only.',
    caveat: 'Generic input is not a complete or game-specific playtest. A changed image may be animation only. Static library markers and numeric-name matches are candidates, not proof of active engine use or runtime physics. Complete game bundles are not retained.',
    capture_status_counts: captureCounts, page_status_counts: pageCounts, games: reports,
  };
}
function summaryText(output) {
  const lines = [
    '# گذر فنی و قاب‌های ورودیِ نمونه‌بازی‌ها', '',
    `پیشرفت: ${output.processed_count}/${output.catalog_count} بازی؛ پایان کامل: ${output.complete ? 'بله' : 'خیر'}.`,
    `وضعیت ثبت: ${JSON.stringify(output.capture_status_counts)}؛ وضعیت صفحه: ${JSON.stringify(output.page_status_counts)}.`, '',
    '## مرز شواهد', '',
    'این گذر پنج قاب از بارگذاری، تلاش امن برای آغاز، کلیدهای عمومی و قاب دیرتر می‌گیرد. این ورودی‌ها آزمون کامل یا اختصاصی هر بازی نیستند؛ تغییر تصویر نیز ممکن است فقط انیمیشن باشد. نشانه‌های کتابخانه و ثابت‌های عددی صرفاً نامزدند. باندل کامل ذخیره نمی‌شود. هر بازی تا زمان مرور قاب‌ها باید «صفحه‌مشاهده‌شده» یا «مشاهده‌ی جزئی» محسوب شود، نه گیم‌پلی کامل.', '',
    '| شناسه | بازی | وضعیت صفحه | ثبت قاب | تعداد قاب | نشانه‌های کتابخانه | نامزد ثابت‌ها |',
    '|---|---|---|---|---:|---|---:|',
  ];
  for (const r of output.games) lines.push(`| ${r.id} | ${r.title.replaceAll('|', '\\|')} | ${r.page_status} | ${r.capture_status} | ${r.screenshots.length} | ${(r.engine_markers || []).join(', ') || 'نامشخص'} | ${(r.tuning_constant_candidates || []).length} |`);
  lines.push('', '## محدودیت‌ها', '',
    '- صفحه‌ی آغازین ممکن است کتابخانه یا حالت بازی را بارگیری نکند؛ نبودن نشانه به‌معنای نبودن قابلیت نیست.',
    '- توالی کلیدها عمومی است و برای همه‌ی بازی‌ها مناسب نیست؛ کنترل واقعی فقط با شاهد آشکار ثبت می‌شود.',
    '- regex ممکن است false positive/negative بدهد؛ ثابت‌های نامزد باید با تجربه‌ی بازی تطبیق داده شوند.',
    '- هیچ ورود، پرداخت، فرم، خرید، API خصوصی یا تغییر حساب انجام نمی‌شود؛ فقط صفحه‌ی عمومی و منابعی که خود صفحه بارگیری کرده است دیده می‌شوند.',
    '- تصاویر در artifact اجرای Actions نگهداری می‌شوند؛ JSON و این خلاصه به‌صورت مرحله‌ای نوشته می‌شوند.', '');
  return lines.join('\n');
}
function persistProgress() {
  writeChain = writeChain.catch(() => {}).then(async () => {
    const output = outputObject();
    const jsonTmp = `${AUDIT_PATH}.tmp`;
    const mdTmp = `${SUMMARY_PATH}.tmp`;
    await fs.writeFile(jsonTmp, JSON.stringify(output, null, 2) + '\n', 'utf8');
    await fs.rename(jsonTmp, AUDIT_PATH);
    await fs.writeFile(mdTmp, summaryText(output), 'utf8');
    await fs.rename(mdTmp, SUMMARY_PATH);
  });
  return writeChain;
}

async function captureOne(game, index) {
  const report = reports[index];
  report.captured_at = new Date().toISOString();
  report.capture_status = 'in_progress';
  const imageDir = path.join(SCREENSHOTS, slug(report.id));
  await fs.mkdir(imageDir, { recursive: true });
  if (!/^https?:\/\//i.test(game.launch_url || '')) {
    report.page_status = 'invalid_url';
    report.capture_status = 'invalid_url';
    report.limitations.push('No public HTTP(S) launch URL was available.');
    return;
  }

  let context;
  let page;
  let budgetExceeded = false;
  let budgetTimer;
  const pending = [];
  const markers = new Set();
  let scannedScriptCount = 0;
  let scannedScriptBytes = 0;
  let constantsStored = 0;
  const stageDigests = {};
  const closeContext = () => context?.close().catch(() => {});
  const formFocused = async () => Boolean(await withTimeout(
    page.evaluate(() => ['input','textarea','select'].includes((document.activeElement?.tagName || '').toLowerCase())),
    1000, true,
  ));
  const bodyText = async () => (await withTimeout(
    page.locator('body').innerText({ timeout: 2000 }), 2500, '',
  )).slice(0, MAX_VISIBLE_TEXT);
  const snap = async (key, filename) => {
    if (budgetExceeded) return;
    report.stage_text[key] = await bodyText();
    const filepath = path.join(imageDir, filename);
    const shotPromise = page.screenshot({ path: filepath, fullPage: false, animations: 'disabled', timeout: 7000 });
    const shot = await withTimeout(shotPromise, 8000, null);
    if (!shot) { report.limitations.push(`Screenshot ${key} timed out.`); return; }
    try {
      const bytes = await fs.readFile(filepath);
      stageDigests[key] = digest(bytes);
      report.screenshots.push({ stage: key, path: path.relative(ROOT, filepath), sha256: stageDigests[key] });
      report.completed_stages.push(key);
    } catch (err) {
      report.limitations.push(`Screenshot ${key} unavailable: ${String(err).slice(0, 200)}`);
    }
  };

  try {
    context = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    budgetTimer = setTimeout(() => {
      budgetExceeded = true;
      closeContext();
    }, GAME_BUDGET_MS);
    page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(PAGE_TIMEOUT_MS);
    page.on('console', msg => {
      if (report.console_messages.length < 40) report.console_messages.push({ type: msg.type(), text: msg.text().slice(0, 300) });
    });
    page.on('pageerror', err => {
      if (report.page_errors.length < 25) report.page_errors.push(String(err).slice(0, 500));
    });
    page.on('requestfailed', req => {
      if (report.request_failures.length < 40) report.request_failures.push({ url: safeUrl(req.url()), error: String(req.failure()?.errorText || 'unknown').slice(0, 200) });
    });
    page.on('response', res => {
      const task = (async () => {
        const headers = await withTimeout(res.allHeaders(), 800, {});
        const rawUrl = res.url();
        const resourceType = res.request().resourceType();
        const contentType = String(headers['content-type'] || '').slice(0, 140);
        const entry = {
          url: safeUrl(rawUrl), status: res.status(), resource_type: resourceType,
          content_type: contentType, content_length_header: parseLength(headers),
          body_bytes_scanned: null, sha256: null, scan_status: 'not_scanned',
        };
        if (report.resource_inventory.length < MAX_RESOURCES) report.resource_inventory.push(entry);
        report.resource_type_totals[resourceType] = (report.resource_type_totals[resourceType] || 0) + 1;
        if (!isJavaScript(resourceType, contentType, rawUrl)) return;
        if (scannedScriptCount >= MAX_SCRIPT_BODIES || scannedScriptBytes >= MAX_SCRIPT_BYTES_TOTAL) { entry.scan_status = 'skipped_limit'; return; }
        if (entry.content_length_header === null) { entry.scan_status = 'skipped_unknown_length'; return; }
        if (entry.content_length_header > MAX_SCRIPT_BYTES_EACH) { entry.scan_status = 'skipped_large'; return; }
        const body = await withTimeout(res.body(), BODY_TIMEOUT_MS, null);
        if (!body) { entry.scan_status = 'body_timeout'; return; }
        if (body.length > MAX_SCRIPT_BYTES_EACH || scannedScriptBytes + body.length > MAX_SCRIPT_BYTES_TOTAL) { entry.scan_status = 'skipped_large'; return; }
        scannedScriptCount++;
        scannedScriptBytes += body.length;
        entry.body_bytes_scanned = body.length;
        entry.sha256 = digest(body);
        entry.scan_status = 'scanned_in_memory_only';
        const source = body.toString('utf8');
        for (const [name, rx] of ENGINE_MARKERS) if (rx.test(source)) markers.add(name);
        if (report.script_inventory.length < MAX_SCRIPT_BODIES) report.script_inventory.push({ url: entry.url, bytes: body.length, sha256: entry.sha256, note: 'Source body scanned in memory only; not saved.' });
        CONSTANT_RX.lastIndex = 0;
        let match;
        while ((match = CONSTANT_RX.exec(source)) && constantsStored < MAX_CONSTANTS) {
          const candidate = { symbol: match[1], value: match[2], source_url: entry.url, evidence_type: 'static textual candidate; requires gameplay corroboration' };
          if (!report.tuning_constant_candidates.some(x => x.symbol === candidate.symbol && x.value === candidate.value && x.source_url === candidate.source_url)) {
            report.tuning_constant_candidates.push(candidate); constantsStored++;
          }
        }
      })().catch(err => {
        if (report.limitations.length < 12) report.limitations.push(`Resource inspection issue: ${String(err).slice(0, 200)}`);
      });
      pending.push(task);
    });

    process.stdout.write(`[start] ${index + 1}/${games.length} ${report.id}\n`);
    const response = await page.goto(game.launch_url, { waitUntil: 'domcontentloaded', timeout: PAGE_TIMEOUT_MS });
    report.http_status = response?.status() ?? null;
    report.page_status = 'loaded';
    report.page_title = (await withTimeout(page.title(), 2000, '')).slice(0, 250);
    await delay(SETTLE_MS);
    await snap('load', '01-load.png');

    // Safe start attempt: click only a visible canvas or a button whose entire
    // accessible name is a basic start verb. Never click links or arbitrary UI.
    try {
      const buttons = page.getByRole('button', { name: START_BUTTON_RX });
      const buttonCount = await withTimeout(buttons.count(), 1000, 0);
      if (buttonCount > 0 && await buttons.first().isVisible().catch(() => false)) {
        await buttons.first().click({ timeout: 1000 });
        report.start_action = 'clicked_exact_start_button';
      } else {
        const canvas = page.locator('canvas').first();
        if (await withTimeout(canvas.count(), 1000, 0) && await canvas.isVisible().catch(() => false)) {
          const box = await withTimeout(canvas.boundingBox(), 1000, null);
          if (box && box.width > 0 && box.height > 0) {
            await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2, { timeout: 1000 });
            report.start_action = 'clicked_canvas_center';
          }
        }
      }
    } catch (err) { report.limitations.push(`Safe start attempt unavailable: ${String(err).slice(0, 180)}`); }
    if (!(await formFocused())) { await page.keyboard.press('Enter').catch(() => {}); report.controls_attempted.push('Enter'); }
    await delay(400);
    await snap('after_start', '02-after-start.png');

    if (!(await formFocused())) {
      for (const key of ['Space', 'ArrowUp', 'w', 'ArrowRight']) {
        await page.keyboard.press(key).catch(() => {});
        report.controls_attempted.push(key);
        await delay(120);
      }
    } else report.limitations.push('Generic keyboard sequence skipped because a text/select input was focused.');
    await delay(250);
    await snap('after_key_burst', '03-after-key-burst.png');

    if (!(await formFocused())) {
      await page.keyboard.down('ArrowRight').catch(() => {});
      await page.keyboard.down('Space').catch(() => {});
      report.controls_attempted.push('hold ArrowRight + Space for 900ms');
      await delay(900);
      await page.keyboard.up('Space').catch(() => {});
      await page.keyboard.up('ArrowRight').catch(() => {});
    }
    await snap('after_combined_input', '04-after-combined-input.png');
    await delay(1000);
    await snap('late', '05-late.png');
    report.interaction_visual_change_signal = stageDigests.load && stageDigests.after_combined_input
      ? stageDigests.load !== stageDigests.after_combined_input : null;
    report.interaction_visual_change_caveat = 'A changed screenshot may reflect animation or elapsed time; it is not proof that the inputs were understood.';

    const drain = await withTimeout(Promise.allSettled(pending), DRAIN_TIMEOUT_MS, null);
    if (!drain) report.limitations.push('Some resource inspection tasks exceeded the bounded drain window.');
    const snapshot = await withTimeout(page.evaluate(() => ({
      canvases: [...document.querySelectorAll('canvas')].slice(0, 15).map(c => ({ width: c.width, height: c.height, css_width: Math.round(c.getBoundingClientRect().width), css_height: Math.round(c.getBoundingClientRect().height) })),
      images: [...document.querySelectorAll('img')].slice(0, 60).map(img => ({ src: img.currentSrc || img.src || '', alt: img.alt || '', natural_width: img.naturalWidth, natural_height: img.naturalHeight, visible: !!(img.offsetWidth || img.offsetHeight || img.getClientRects().length) })),
    })), 1500, { canvases: [], images: [] });
    report.canvas_inventory = snapshot.canvases;
    report.visible_images = snapshot.images.map(img => ({ ...img, src: safeUrl(img.src) }));
    report.engine_markers = [...markers].sort();
    report.script_bytes_scanned = scannedScriptBytes;
    report.script_count_scanned = scannedScriptCount;
    report.capture_status = budgetExceeded ? 'budget_timeout' : report.screenshots.length === STAGES.length ? 'completed' : 'partial';
  } catch (err) {
    const message = String(err).slice(0, 600);
    report.limitations.push(message);
    report.page_status = report.page_status === 'pending'
      ? (/timeout/i.test(message) ? 'navigation_timeout' : 'navigation_failed')
      : 'loaded_partial';
    report.capture_status = budgetExceeded ? 'budget_timeout' : 'partial';
    report.engine_markers = [...markers].sort();
    report.script_bytes_scanned = scannedScriptBytes;
    report.script_count_scanned = scannedScriptCount;
    await withTimeout(Promise.allSettled(pending), DRAIN_TIMEOUT_MS, null);
  } finally {
    clearTimeout(budgetTimer);
    await closeContext();
  }
  if (budgetExceeded) report.capture_status = 'budget_timeout';
  else if (report.capture_status === 'in_progress') report.capture_status = 'partial';
}

let cursor = 0;
async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= games.length) return;
    try { await captureOne(games[index], index); }
    catch (err) {
      reports[index].page_status = 'worker_error';
      reports[index].capture_status = 'failed';
      reports[index].limitations.push(String(err).slice(0, 500));
    }
    await persistProgress();
    process.stdout.write(`[done] ${index + 1}/${games.length} ${reports[index].id}: ${reports[index].page_status}/${reports[index].capture_status}, ${reports[index].screenshots.length} screenshots\n`);
  }
}

// Persist all 40 IDs before the first navigation; then atomically update after
// each game so cancellation never erases the completed work.
await persistProgress();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, games.length) }, () => worker()));
} finally {
  await browser.close();
  await persistProgress();
}
process.stdout.write(`Wrote ${AUDIT_PATH} and ${SUMMARY_PATH}; complete=${outputObject().complete}\n`);
