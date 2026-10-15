/**
 * Real-browser device matrix (Playwright) — PRODUCTION first-run QA.
 *
 * Rebuilt 2026-10-15 (the 2026-10-13 original was sandbox-local and lost in
 * the sandbox reset; this commit makes it a REPO artifact so it can never be
 * lost again). Walks the REAL player path against PRODUCTION per device
 * profile: fresh context -> tutorial wizard gate -> mode tabs -> dialogs ->
 * run start -> input path (touch RUSH / keyboard pause) -> natural death ->
 * results panel -> Sentry wiring -> console audit.
 *
 * 2026-10-15 owner request: Apple-device dimension sweep — iPhone (SE / 13 /
 * 15 Pro Max) and iPad (mini / Air / Pro 12.9) join the existing profiles so
 * every coarse-pointer class and every practical viewport is covered.
 *
 * 2026-10-15 R-1 EXECUTED (docs/RETIRED-FEATURES.md): the character-selection
 * roster was removed from the product by owner directive, so the roster checks
 * (char_chips_rendered / venom_select) were retired with it; the hydration
 * signal moved from .cc-char-chip to the mode tablist (also client-rendered).
 *
 * Checks per touch profile (12): wizard_gate, page_title, mode_tabs_present,
 * corner_tools_visible, settings_dialog_opens, achievements_dialog_opens,
 * run_started, mobile_rush_button, gameplay_then_death_card,
 * results_home_affordance, sentry_sdk_loaded, no_severe_console_errors.
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
      // App-hydration signal FIRST: the entry card renders only after the
      // client bundle boots (canvas app). ATTACHED (not visible) is the right
      // signal: the panel is covered while the tutorial wizard is up, so the
      // tablist only becomes visible AFTER the wizard is dismissed below.
      // (R-1: was .cc-char-chip — that surface no longer exists.)
      await page.waitForSelector(".cc-mode-btn", { timeout: 60_000, state: "attached" });

      // WIZARD SECOND — fresh context sees the step-by-step tutorial overlay;
      // it appears right after hydration and absorbs every click beneath it,
      // so dismiss before anything else. While it is up, capture the geometric
      // truth: are SKIP/NEXT actually on top (hit-test) and inside viewport?
      try {
        await page.waitForSelector(".cc-tutorial-overlay", { timeout: 12_000 });
        const skip = page.locator(".cc-tutorial-overlay button", { hasText: /^SKIP$/i }).first();
        if (await skip.count()) {
          const geom = await page.evaluate(() => {
            const pick = (sel: string) => {
              const el = document.querySelector(sel) as HTMLElement | null;
              if (!el) return null;
              const r = el.getBoundingClientRect();
              const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
                       hit_ok: !!(top && (el === top || el.contains(top) || (top as HTMLElement).contains?.(el))),
                       hit_tag: top ? `${(top as HTMLElement).className || top.tagName}`.slice(0, 60) : "none" };
            };
            const btns = Array.from(document.querySelectorAll(".cc-tutorial-overlay button"));
            const next = btns.find((b) => /^(NEXT|GOT IT)$/i.test(b.textContent || ""));
            return { viewport: `${innerWidth}x${innerHeight}`, scroll_y: scrollY,
                     skip: pick(".cc-tutorial-overlay button.cc-btn-ghost"),
                     next: next ? ((): ReturnType<typeof JSON.parse> => {
                       const r = next!.getBoundingClientRect();
                       const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                       return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
                                hit_ok: !!(top && (next === top || next!.contains(top))),
                                hit_tag: top ? `${(top as HTMLElement).className || top.tagName}`.slice(0, 60) : "none" } as never;
                     })() : null };
          });
          console.log(`    wizard geom ${prof.label}: ${JSON.stringify(geom)}`);
          await shot(page, "00-wizard");
          await skip.click();
          await page.waitForTimeout(1_000);
          const gone = (await page.locator(".cc-tutorial-overlay").count()) === 0;
          const hitOk = Boolean((geom as { skip?: { hit_ok?: boolean } | null })?.skip?.hit_ok);
          check("wizard_gate", gone, `SKIP dismissed=${gone} skip_hit_ok=${hitOk}`);
        } else check("wizard_gate", false, "overlay shown but SKIP not found");
      } catch {
        // Honest reporting: a thrown SKIP flow with the overlay still up is a
        // FAILURE (D15 class), not a passable "already seen" state.
        const stillThere = await page.locator(".cc-tutorial-overlay").count();
        check("wizard_gate", stillThere === 0,
          stillThere ? "SKIP flow threw and the overlay is STILL up (D15 trap?)"
                     : "overlay not shown (progress flag already set)");
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

      // R-1 2026-10-15: character roster + venom_select checks retired with
      // the selection UI itself (docs/RETIRED-FEATURES.md).
      await shot(page, "01-boot");

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

      // D2 regression guard: HOME affordance on the results panel — and it
      // must actually OWN the click at its center (D15 stacking-trap guard:
      // a visible button buried under the footer/wallet chip is a failure).
      const homes = page.locator(".cc-btn-home");
      const nHomes = await homes.count();
      let visHomes = 0, homeHitOk = false, homeHitTag = "";
      for (let i = 0; i < nHomes; i++) {
        if (await homes.nth(i).isVisible()) {
          visHomes++;
          if (!homeHitOk) {
            const probe = await homes.nth(i).evaluate((el) => {
              const r = el.getBoundingClientRect();
              const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
              return { ok: !!(top && (el === top || el.contains(top) || (top as HTMLElement).contains?.(el))),
                       tag: top ? `${(top as HTMLElement).className || top.tagName}`.slice(0, 60) : "none" };
            }).catch(() => ({ ok: false, tag: "probe-failed" }));
            homeHitOk = probe.ok; homeHitTag = probe.tag;
          }
        }
      }
      check("results_home_affordance", visHomes > 0 && homeHitOk,
        `${visHomes} visible, hit_ok=${homeHitOk} hit_tag=${homeHitTag}`);

      // Production monitoring wired.
      const sentry = await page.evaluate(() => !!(window as unknown as { __SENTRY__?: unknown }).__SENTRY__);
      check("sentry_sdk_loaded", sentry, `window.__SENTRY__=${sentry}`);

      if (!prof.touch) {
        // Full landing surface: $WICK strip + the footer lane links.
        // 2026-10-15 reality check: the landing footer carries PARTNERS +
        // AIRDROP (G5 restructure); /stats is linked from the in-game footer
        // only — so the bar is strip + partners + airdrop, with the full link
        // census recorded in the detail for the ledger.
        try {
          await page.goto(LANDING, { waitUntil: "domcontentloaded", timeout: 30_000 });
          await page.waitForSelector(".lp-wick-strip", { timeout: 30_000 });
          const partners = await page.locator('footer a[href="/partners"]').count();
          const airdrop = await page.locator('footer a[href="/airdrop"]').count();
          const stats = await page.locator('a[href="/stats"]').count();
          const stripVis = await page.locator(".lp-wick-strip").first().isVisible();
          check("landing_surface", stripVis && partners >= 1 && airdrop >= 1,
            `strip=${stripVis} partners=${partners} airdrop=${airdrop} stats_anywhere=${stats}`);
        } catch (e) {
          check("landing_surface", false, `probe failed: ${String(e).slice(0, 140)}`);
        }
        await shot(page, "06-landing");
      }

      check("no_severe_console_errors", consoleErrors.length === 0, `${consoleErrors.length} severe: ${consoleErrors.slice(0, 2).join(" | ")}`);
      report["console_severe"] = consoleErrors.length;
    } catch (e) {
      // Failure forensics: what did the page actually look like when it died?
      try {
        if (context) {
          const pages = context.pages();
          const pg = pages[pages.length - 1];
          if (pg) {
            await pg.screenshot({ path: join(out, `rd-99-fatal-${STAMP}.png`) }).catch(() => {});
            const state = await pg.evaluate(() => ({
              url: location.href, title: document.title,
              ready: document.readyState,
              mode_btns: document.querySelectorAll(".cc-mode-btn").length,
              overlay: document.querySelectorAll(".cc-tutorial-overlay").length,
              body_chars: document.body.innerText.length,
              body_head: document.body.innerText.slice(0, 200),
            })).catch(() => null);
            console.log(`    FATAL state: ${JSON.stringify(state)}`);
          }
        }
      } catch { /* forensics best-effort */ }
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
