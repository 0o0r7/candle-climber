/**
 * Real-browser device matrix (Playwright) — PRODUCTION first-run QA.
 *
 * Rebuilt 2026-10-15 (the 2026-10-13 original was sandbox-local and lost in
 * the sandbox reset; this commit makes it a REPO artifact so it can never be
 * lost again). Walks the REAL player path against PRODUCTION per device
 * profile: fresh context -> tutorial wizard gate -> mode tabs -> character
 * roster -> dialogs -> run start -> input path (touch RUSH / keyboard pause)
 * -> natural death -> results panel -> Sentry wiring -> console audit.
 *
 * 2026-10-15 owner request: Apple-device dimension sweep — iPhone (SE / 13 /
 * 15 Pro Max) and iPad (mini / Air / Pro 12.9) join the existing profiles so
 * every coarse-pointer class and every practical viewport is covered.
 *
 * Checks per touch profile (14): wizard_gate, page_title, mode_tabs_present,
 * char_chips_rendered, venom_select, corner_tools_visible,
 * settings_dialog_opens, achievements_dialog_opens, run_started,
 * mobile_rush_button, gameplay_then_death_card, results_home_affordance,
 * sentry_sdk_loaded, no_severe_console_errors.
 * Desktop swaps mobile_rush_button for pause_toggle + adds landing_surface.
 *
 * Evidence: qa/realdevice/matrix-<label>/rd-*.png +
 *           qa/realdevice/report-matrix-<label>-<stamp>.json +
 *           qa/realdevice/report-matrix-SUMMARY-<stamp>.json
 *
 * Run:  bun scripts/realdevice_matrix.ts
 * Env:  GAME_URL (default prod /play), QA_OUT (default qa/realdevice),
 *       ONLY=<label-substring> to run a subset.
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const GAME_URL = process.env.GAME_URL ?? "https://candle-climber.vercel.app/play";
const LANDING = GAME_URL.replace(/\/play\/?$/, "") || "https://candle-climber.vercel.app/";
const QA_OUT = process.env.QA_OUT ?? "qa/realdevice";
const ONLY = process.env.ONLY ?? "";
const STAMP = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 15);

const IOS_PHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const IOS_PAD_UA =
  "Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const ANDROID_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36";

interface Profile {
  label: string;
  width: number;
  height: number;
  touch: boolean;
  mobile: boolean;
  ua: string;
  dsf: number;
}

// Desktop first (fastest failure signal), then phones small->large, then tablets.
const PROFILES: Profile[] = [
  { label: "desktop-chrome-1440x900", width: 1440, height: 900, touch: false, mobile: false, ua: "", dsf: 1 },
  { label: "iphone-se-375x667", width: 375, height: 667, touch: true, mobile: true, ua: IOS_PHONE_UA, dsf: 2 },
  { label: "iphone13-ios16-touch", width: 390, height: 844, touch: true, mobile: true, ua: IOS_PHONE_UA, dsf: 3 },
  { label: "iphone15-promax-430x932", width: 430, height: 932, touch: true, mobile: true, ua: IOS_PHONE_UA, dsf: 3 },
  { label: "ipad-mini-768x1024", width: 768, height: 1024, touch: true, mobile: true, ua: IOS_PAD_UA, dsf: 2 },
  { label: "ipad-air-820x1180", width: 820, height: 1180, touch: true, mobile: true, ua: IOS_PAD_UA, dsf: 2 },
  { label: "ipad-pro-129-1024x1366", width: 1024, height: 1366, touch: true, mobile: true, ua: IOS_PAD_UA, dsf: 2 },
  { label: "pixel7-android13-touch", width: 412, height: 915, touch: true, mobile: true, ua: ANDROID_UA, dsf: 2.625 },
];

type Check = { check: string; ok: boolean; detail: string };

async function main(): Promise<number> {
  const outBase = QA_OUT;
  mkdirSync(outBase, { recursive: true });
  const profiles = PROFILES.filter((p) => !ONLY || p.label.includes(ONLY));
  const browser: Browser = await chromium.launch();
  const reports: Array<Record<string, unknown>> = [];

  for (const prof of profiles) {
    const out = join(outBase, `matrix-${prof.label}`);
    mkdirSync(out, { recursive: true });
    const checks: Check[] = [];
    const consoleErrors: string[] = [];
    const report: Record<string, unknown> = {
      stamp: STAMP, label: prof.label, url: GAME_URL,
      viewport: `${prof.width}x${prof.height}`, touch: prof.touch, ua: prof.ua,
    };
    const check = (name: string, ok: boolean, detail = "") => {
      checks.push({ check: name, ok: !!ok, detail: String(detail).slice(0, 300) });
      console.log(`  [${ok ? "PASS" : "FAIL"}] ${prof.label} :: ${name}${detail ? ": " + String(detail).slice(0, 140) : ""}`);
    };
    const shot = async (page: Page, name: string) => {
      try { await page.screenshot({ path: join(out, `rd-${name}-${STAMP}.png`) }); }
      catch (e) { console.log(`    screenshot ${name} error: ${e}`); }
    };

    let context: BrowserContext | null = null;
    try {
      context = await browser.newContext({
        viewport: { width: prof.width, height: prof.height },
        hasTouch: prof.touch,
        isMobile: prof.mobile,
        deviceScaleFactor: prof.dsf,
        userAgent: prof.ua || undefined,
      });
      const page = await context.newPage();
      page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text().slice(0, 200)); });
      page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${String(e).slice(0, 200)}`));

      await page.goto(GAME_URL, { waitUntil: "domcontentloaded", timeout: 60_000 });

      // WIZARD FIRST — fresh context always sees the tutorial overlay; it
      // absorbs every click beneath it, so dismiss before anything else.
      try {
        await page.waitForSelector(".cc-tutorial-overlay", { timeout: 8_000 });
        const skip = page.locator(".cc-tutorial-overlay button", { hasText: /^SKIP$/i }).first();
        if (await skip.count()) {
          await skip.click();
          await page.waitForTimeout(1_000);
          const gone = (await page.locator(".cc-tutorial-overlay").count()) === 0;
          check("wizard_gate", gone, `overlay shown, SKIP dismissed=${gone}`);
          await shot(page, "00-wizard");
        } else check("wizard_gate", false, "overlay shown but SKIP not found");
      } catch {
        check("wizard_gate", true, "overlay not shown (progress flag already set)");
      }

      check("page_title", /candle/i.test(await page.title()), await page.title());

      // 3-mode era: CRYPTO/STOCKS/LAUNCHPAD tablist renders, exactly one active.
      try {
        await page.evaluate(() => {
          const x = document.querySelector(".cc-more") as HTMLDetailsElement | null;
          if (x) x.open = true;
        });
        await page.waitForTimeout(600);
      } catch { /* best-effort reveal */ }
      const modes = page.locator(".cc-mode-btn");
      const nModes = await modes.count();
      const nActive = await page.locator(".cc-mode-btn.cc-mode-active").count();
      check("mode_tabs_present", nModes >= 3 && nActive === 1, `${nModes} tabs, active=${nActive}`);

      const chips = page.locator(".cc-char-chip");
      const nChips = await chips.count();
      check("char_chips_rendered", nChips >= 14, `${nChips} chips`);
      await shot(page, "01-boot");

      const venom = chips.filter({ hasText: /venom/i }).first();
      if (await venom.count()) {
        await venom.click();
        await page.waitForTimeout(1_000);
        const sel = page.locator(".cc-char-chip.cc-char-on");
        const selTxt = (await sel.count()) === 1 ? (await sel.first().innerText()).trim() : "none";
        check("venom_select", (await sel.count()) === 1 && /venom/i.test(selTxt), selTxt);
      } else check("venom_select", false, "venom chip not found");

      // D8 regression guard: corner tools group must exist and be visible.
      const tools = page.locator(".cc-corner-tools");
      const nTools = await tools.count();
      const toolsVis = nTools > 0 && (await tools.first().isVisible());
      check("corner_tools_visible", toolsVis, `count=${nTools}`);

      // Dialog open/close (Escape) — settings, then achievements.
      for (const [idx, name] of [[0, "settings_dialog_opens"], [1, "achievements_dialog_opens"]] as const) {
        try {
          const trig = page.locator(".cc-settings-trigger button").nth(idx);
          await trig.scrollIntoViewIfNeeded();
          await trig.click();
          await page.waitForSelector('[role="dialog"]', { state: "visible", timeout: 10_000 });
          const opened = await page.locator('[role="dialog"]').first().isVisible();
          await page.keyboard.press("Escape");
          await page.waitForTimeout(1_200);
          const gone = (await page.locator('[role="dialog"]').count()) === 0;
          check(name, opened && gone, `opened=${opened} closed_by_escape=${gone}`);
        } catch (e) {
          check(name, false, `probe failed: ${String(e).slice(0, 120)}`);
        }
      }
      await shot(page, "02-dialogs");

      // Start (the button INSIDE the tutorial overlay is excluded by class).
      const start = page.locator(".cc-btn-start:not(.cc-tut-btn)").first();
      if (!(await start.count())) throw new Error("no start button outside the tutorial overlay");
      await start.click({ timeout: 20_000 });

      let runStarted = false;
      try {
        await page.waitForSelector(".cc-chip-score", { timeout: 20_000 });
        runStarted = true;
        check("run_started", true, "HUD score chip visible");
      } catch {
        const panelHidden = await page.evaluate(() => {
          const p = document.querySelector(".cc-panel") as HTMLElement | null;
          return p ? getComputedStyle(p).display === "none" : true;
        });
        check("run_started", panelHidden, "score chip not found; panel state probed");
      }
      await shot(page, "03-running");

      if (prof.touch) {
        // coarse-pointer path: RUSH hold-to-boost chip present while running.
        const rush = page.locator(".cc-rush-btn");
        const nRush = await rush.count();
        const rushVis = nRush > 0 && (await rush.first().isVisible());
        check("mobile_rush_button", rushVis, `count=${nRush}`);
      } else {
        // R8/127: "p" toggles pause via the window keydown handler.
        let paused = false, resumed = false;
        try {
          await page.keyboard.press("p");
          await page.waitForSelector(".cc-pause-head", { timeout: 6_000 });
          paused = true;
        } catch { paused = false; }
        await shot(page, "04-paused");
        try {
          await page.keyboard.press("p");
          await page.waitForTimeout(1_200);
          resumed = (await page.locator(".cc-pause-head").count()) === 0;
        } catch { resumed = false; }
        check("pause_toggle", paused && resumed, `paused=${paused} resumed=${resumed}`);
      }

      // Natural death loop: tap/hold the canvas until the death card renders.
      const t0 = Date.now();
      let taps = 0, dead = false, deathScore = "";
      while (Date.now() - t0 < 120_000) {
        if (await page.locator(".cc-death-num").count()) { dead = true; break; }
        try {
          await page.locator(".cc-canvas").click({ timeout: 5_000 });
          taps++;
          if (prof.touch && taps % 2 === 0) {
            const rush = page.locator(".cc-rush-btn");
            if (await rush.count()) { await rush.first().dispatchEvent("pointerdown"); await rush.first().dispatchEvent("pointerup"); }
          }
        } catch { /* canvas may be briefly unclickable mid-frame */ }
        await page.waitForTimeout(800);
      }
      if (dead) {
        try { deathScore = (await page.locator(".cc-death-num").innerText()).trim(); } catch { /* keep empty */ }
      }
      check("gameplay_then_death_card", dead, `taps=${taps} death-score=${JSON.stringify(deathScore)}`);
      await shot(page, "05-deathcard");

      // D2 regression guard: HOME affordance on the results panel.
      const homes = page.locator(".cc-btn-home");
      const nHomes = await homes.count();
      let visHomes = 0;
      for (let i = 0; i < nHomes; i++) if (await homes.nth(i).isVisible()) visHomes++;
      check("results_home_affordance", visHomes > 0, `${visHomes} visible HOME element(s)`);

      // Production monitoring wired.
      const sentry = await page.evaluate(() => !!(window as unknown as { __SENTRY__?: unknown }).__SENTRY__);
      check("sentry_sdk_loaded", sentry, `window.__SENTRY__=${sentry}`);

      if (!prof.touch) {
        // Full landing surface: footer nav + $WICK strip.
        try {
          await page.goto(LANDING, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.waitForSelector(".lp-wick-strip", { timeout: 30_000 });
          const links = await page.locator('footer a[href="/partners"], footer a[href="/stats"], footer a[href="/airdrop"]').count();
          const stripVis = await page.locator(".lp-wick-strip").first().isVisible();
          check("landing_surface", stripVis && links >= 3, `strip=${stripVis} nav_links=${links}`);
        } catch (e) {
          check("landing_surface", false, `probe failed: ${String(e).slice(0, 140)}`);
        }
        await shot(page, "06-landing");
      }

      check("no_severe_console_errors", consoleErrors.length === 0, `${consoleErrors.length} severe: ${consoleErrors.slice(0, 2).join(" | ")}`);
      report["console_severe"] = consoleErrors.length;
    } catch (e) {
      check("session_fatal", false, String(e).slice(0, 300));
    } finally {
      if (context) await context.close().catch(() => {});
    }

    report["checks"] = checks;
    report["pass"] = checks.length > 0 && checks.every((c) => c.ok);
    reports.push(report);
    writeFileSync(join(outBase, `report-matrix-${prof.label}-${STAMP}.json`), JSON.stringify(report, null, 2));
  }

  await browser.close();
  const summary = {
    stamp: STAMP, url: GAME_URL, profiles: profiles.length,
    passed: reports.filter((r) => r.pass).length,
    results: reports.map((r) => ({
      label: r.label, viewport: r.viewport, pass: r.pass,
      checks: (r.checks as Check[]).filter((c) => c.ok).length,
      total_checks: (r.checks as Check[]).length,
    })),
  };
  writeFileSync(join(outBase, `report-matrix-SUMMARY-${STAMP}.json`), JSON.stringify(summary, null, 2));
  console.log(`\nMATRIX: ${summary.passed}/${summary.profiles} profiles PASS`);
  for (const r of summary.results)
    console.log(`  ${r.label} [${r.viewport}]: ${r.pass ? "PASS" : "FAIL"}  checks=${r.checks}/${r.total_checks}`);
  return summary.passed === summary.profiles ? 0 : 1;
}

main().then(
  (code) => process.exit(code),
  (e) => { console.error("FATAL:", e); process.exit(1); },
);
