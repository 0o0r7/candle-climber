// Candle Climber engine — fixed-timestep physics, auto-scroll runner over candle platforms
import type { Platform, Particle, RunResult, DeathCause } from "./types";
import { CANDLE_W, PLATFORM_W, WORLD2_CHUNK, genWorld2Chunk } from "./level";
import { BASE_MODS, type MutationMods } from "./mutations";
import { BASE_GAIN, WORLD2_GAIN, COMBO_CAP, COMBO_STEP, RUSH_GAIN } from "@/lib/scoring";
import { hashString, mulberry32 } from "./rng";
import { STYLE_COLOR, STYLE_LATE_RUNWAY, styleGain, type StyleEvent } from "./style";
import { PLATFORM_DOWN, platformColor } from "./palette";

export const VIEW_W = 800; // logical units (canvas is scaled to fit)
export const VIEW_H = 480;

// P7.1: physics constants are exported (read-only) so the rival-bot planner
// mirrors the EXACT engine math from one source of truth. Values untouched.
export const GRAVITY = 2100;
// G2 owner feedback (2026-10-01): runs died in the first 1–2 candles — the speed
// curve ramped too hot and jumps felt undelivered. New curve: gentler start,
// slower ramp, lower cap; higher jump + wider coyote/buffer windows for
// readable, forgiving control. Terrain fairness clamps (MAX_UP) unchanged.
export const JUMP_V = 815;      // was 760 — reach ≈ 158px, more margin over MAX_UP 112
export const JUMP_CUT = 0.72;   // release early = short hop (variable-height jump)
export const COYOTE = 0.12;     // was 0.09
export const BUFFER = 0.16;     // was 0.12
// P0.3 air jump (second jump): ONE recovery impulse per airborne period.
// Deliberately WEAKER than the ground jump, and the fairness law is arithmetic:
//   air reach = AIR_JUMP_V² / (2·GRAVITY) ≈ 104px  <  MAX_UP (112px, level.ts)
// So the second jump can never substitute for the first one the level was
// authored around: every authored step still needs the ground jump, and the air
// jump only buys forgiveness (fix a bad arc, catch a lower platform). That is
// what keeps the daily chart comparable — same terrain, same difficulty priors,
// no MAX_UP re-tune — see docs/AIR-JUMP.md.
export const AIR_JUMPS = 1;
export const AIR_JUMP_V = 660;  // ≈ 104px of rise — under MAX_UP by design
export const AIR_JUMP_COLOR = "#8FB9FF"; // distinct from score (lime) and STYLE (gold)
const CRUMBLE_TIME = 0.26;
// P3.6 skill-jump controls (PLATFORMER-UX-RESEARCH §5/§6 contract):
export const RUSH_SPEED = 1.28;   // SHIFT held → camera ×1.28 (opt-in risk, may exceed the un-rushed cap)
export const HANG_GRAVITY = 0.5;  // half gravity while RISING with jump held (Celeste #3 "hang")
export const PLAYER_X_FRAC = 0.3; // screen anchor
export const PLAYER_W = 34;
export const PLAYER_H = 40;
export const CAM_BASE = 148; // was 175 — readable start, learn the chart first
export const CAM_ACCEL = 3.2; // was 5.5 — the climb heats up slower
export const CAM_MAX = 400; // was 470 — late-game still tense, no longer frantic
// CAMERA-FRAME v3 (owner report 2026-10-11, third pass): the v2 machinery
// (per-arc drift budget + render-time zoom-out) made the frame lag and feel
// unnatural — owner: «تصویر دیگه روان نیست و لگ میزنه». Reverted to the ONE
// law the game shipped with: a single CAM_LERP chase toward `desired`, with
// the takeoff-platform guard folded INTO the target via Math.max —
//   desired = max(py - 0.52*VIEW_H, lastGroundY - VIEW_H + CAM_GROUND_STRIP)
// Math.max is continuous: whenever the guard is inactive (all normal play)
// the motion is BIT-IDENTICAL to the original camera; on very high jumps
// (reach up to ~387px vs the 480px view) the camera simply eases into the
// static floor line and holds the takeoff platform's CAM_GROUND_STRIP strip
// visible — no drift budget, no rate caps, no mode switches, no snap clamps,
// and NO render zoom. Geometry: apex player top = 416 - reach ≥ 29px below
// the frame top even when the camera is pinned at the floor (reach ≤ 416px
// always fits) — the frame can hold BOTH the player and the terrain.
export const CAM_LERP = 4.2;         // the original single follow rate
export const CAM_GROUND_STRIP = 24;  // takeoff platform keeps this strip visible at the frame bottom

// P0.6 audio variety (ten-pattern #10): every verb gets its own voice. `air`
// and `style` are deliberately separate from `jump` — a second jump that sounds
// like the first one is invisible, and a STYLE event that sounds like a landing
// is a missed reward (Jonasson/Purho, "Juice it or lose it").
export type SfxName = "jump" | "air" | "land" | "crumble" | "style" | "milestone" | "victory";

/** Per-run forgiveness windows. Defaults ARE the shipped constants; a loadout
 *  (P0.6, practice lane only) may trade one window for another — never adds
 *  reach, so terrain difficulty priors stay intact (see docs/PRACTICE-LOADOUTS.md). */
export interface RecoveryProfile {
  coyote: number;
  buffer: number;
  airJumps: number;
}

export const DEFAULT_RECOVERY: RecoveryProfile = { coyote: COYOTE, buffer: BUFFER, airJumps: AIR_JUMPS };

/** P0.7: seconds a platform survives once it starts folding. A closing-bell
 *  candle carries its own `fuse`; `Math.max` keeps the finale at least as
 *  forgiving as the day's mutation, so "PAPER HANDS" cannot make the authored
 *  set-piece harder than the level around it. */
export function crumbleFuse(p: Pick<Platform, "fuse">, mods: MutationMods): number {
  return p.fuse ? Math.max(p.fuse, mods.crumbleTime) : mods.crumbleTime;
}

export interface EngineCallbacks {
  onDeath: (r: RunResult) => void;
  onScore: (score: number, combo: number) => void;
  onSfx?: (name: SfxName) => void;
  /** W4: fired once when the player lands on / passes the summit platform.
   *  The run does NOT end here — graduation is a milestone, not a death. */
  onGraduate?: () => void;
}

export interface FloatText {
  x: number; y: number; text: string; color: string;
  life: number; maxLife: number;
}

export class Engine {
  plats: Platform[];
  particles: Particle[] = [];
  floats: FloatText[] = [];
  mods: MutationMods;
  // player (px is camera-locked: world x derived from camX)
  py = 0; vy = 0;
  grounded = false; groundPlat: Platform | null = null;
  coyote = 0; buffer = 0; jumpHeld = false; jumpCut = false;
  // P0.3: second jumps left in this airborne period (refilled on every landing).
  airJumpsLeft = AIR_JUMPS;
  // P3.6 RUSH: opt-in risk input — hold to trade safety for height-speed.
  // Deterministic (input state + fixed timestep), W5-pinned.
  rush = false;
  // camera / world
  camX = 0; camY = 0; speed = CAM_BASE;
  // CAMERA-FRAME fix: y of the last platform the player left the ground from.
  // The camera follow target never dips below the line that keeps a
  // CAM_GROUND_STRIP strip of this platform visible (soft Math.max guard —
  // see the constant block above; no clamps, no zoom).
  lastGroundY: number;
  time = 0;
  // run stats
  score = 0; candlesPassed = 0; streak = 0; bestStreak = 0;
  // P0.4 STYLE (quality axis): LATE hops + forgiveness SAVEs. Input-derived
  // only, so the tally is replay-exact and never touches `score`.
  style = 0; styleLate = 0; styleSave = 0;
  private pressedAirborne = false; // last press started off the ground
  lastLandUp: boolean | null = null;
  dead = false; deathCause: DeathCause = 'fell'; deathT = 0;
  shake = 0;
  showHints = false; // first-run onboarding bubbles (set by GameCanvas)
  // W4 graduation arc: reached the summit (run keeps going) / entered the
  // post-graduation "buyback world" (doubled gains, endless procedural sky).
  graduated = false;
  world2 = false;
  private w2rnd: (() => number) | null = null;
  private seedStr: string;
  private cb: EngineCallbacks;
  /** P0.6: forgiveness windows for THIS run (practice loadouts override them). */
  recovery: RecoveryProfile;

  // player world x is always locked to the screen anchor (30% of view)
  get px(): number {
    return this.camX + VIEW_W * PLAYER_X_FRAC - PLAYER_W / 2;
  }

  constructor(
    plats: Platform[],
    cb: EngineCallbacks,
    mods: MutationMods = BASE_MODS,
    seedStr = "",
    recovery: RecoveryProfile = DEFAULT_RECOVERY,
  ) {
    this.plats = plats;
    this.cb = cb;
    this.mods = mods;
    this.seedStr = seedStr;
    this.recovery = recovery;
    this.airJumpsLeft = recovery.airJumps;
    // start ON the first platform: camera aligned so the player anchor
    // sits right on the platform center (safe runway)
    const start = plats.find((p) => p.state === "solid") ?? plats[0];
    this.py = start.y - 140;
    this.camY = this.py - VIEW_H * 0.55;
    this.camX = start.x + PLATFORM_W / 2 - VIEW_W * PLAYER_X_FRAC;
    this.lastGroundY = start.y;
  }

  get playerScreenX() { return this.px - this.camX; }

  press() {
    // P0.4: remember where the press STARTED. A jump that only fires because
    // of coyote time / the input buffer is a SAVE (see grantStyle).
    this.pressedAirborne = !this.grounded;
    this.buffer = this.recovery.buffer; this.jumpHeld = true; this.jumpCut = false;
  }
  release() {
    this.jumpHeld = false;
    if (this.vy < 0 && !this.jumpCut) { this.vy *= JUMP_CUT; this.jumpCut = true; }
  }
  pressRush() { this.rush = true; }
  releaseRush() { this.rush = false; }

  private spawnFloat(x: number, y: number, text: string, color: string) {
    this.floats.push({ x, y, text, color, life: 0.9, maxLife: 0.9 });
    if (this.floats.length > 24) this.floats.shift();
  }

  private spawnParticles(n: number, x: number, y: number, color: string, spread = 180) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * spread,
        vy: -Math.random() * spread * 0.8,
        life: 0.5 + Math.random() * 0.4,
        maxLife: 0.9,
        size: 2 + Math.random() * 4,
        color,
      });
    }
  }

  /** P0.4: add one STYLE event and telegraph it in gold. Score is untouched. */
  private grantStyle(kind: StyleEvent) {
    const pts = styleGain(kind);
    this.style += pts;
    if (kind === "late") this.styleLate++; else this.styleSave++;
    this.spawnFloat(
      this.px + PLAYER_W / 2,
      this.py - 20,
      `${kind === "late" ? "LATE" : "SAVE"} +${pts}`,
      STYLE_COLOR,
    );
    this.cb.onSfx?.("style");
  }

  private die(cause: DeathCause) {
    if (this.dead) return;
    this.dead = true;
    this.deathCause = cause;
    this.deathT = 0;
    this.shake = 14;
    this.spawnParticles(26, this.px + PLAYER_W / 2, this.py + PLAYER_H / 2, "#CCFF00", 320);
    this.cb.onDeath({
      score: Math.floor(this.score),
      candlesPassed: this.candlesPassed,
      bestStreak: this.bestStreak,
      cause,
      candleIndex: this.candlesPassed,
      graduated: this.graduated,
      world2: this.world2,
      style: this.style,
      styleLate: this.styleLate,
      styleSave: this.styleSave,
    });
  }

  // ---- W4 graduation arc ----

  // Summit reached: a milestone, not a death. Idempotent.
  private graduate() {
    if (this.graduated) return;
    this.graduated = true;
    // P0.7 set-piece payoff: the summit is a MOMENT, not just a flag. A gold
    // burst + a beat of shake fire inside the live run before the panel opens,
    // so the climb ends on a hit rather than a screen change. Presentation
    // only — nothing here touches score, physics or determinism.
    this.spawnParticles(30, this.px + PLAYER_W / 2, this.py + PLAYER_H / 2, STYLE_COLOR, 380);
    this.spawnFloat(this.px + PLAYER_W / 2, this.py - 34, "SUMMIT", STYLE_COLOR);
    this.shake = Math.max(this.shake, 10);
    this.cb.onSfx?.("victory");
    this.cb.onGraduate?.();
  }

  // Enter the post-graduation "buyback world": doubled per-candle gains and an
  // endless deterministic sky beyond the summit. Idempotent.
  enterWorld2() {
    if (this.world2) return;
    this.world2 = true;
    if (!this.w2rnd) this.w2rnd = mulberry32(hashString(this.seedStr + ":world2"));
    this.ensureWorld2Terrain();
    this.cb.onSfx?.("milestone");
  }

  // Chunked generation: extend the level whenever the camera nears the current
  // terrain edge. Trigger points are pure functions of camX (deterministic),
  // and the chunk RNG is consumed sequentially, so the same seed + same
  // advance steps always yield identical platforms.
  private ensureWorld2Terrain() {
    if (!this.w2rnd) return;
    while (this.camX + VIEW_W + 480 > (this.plats.length - 1) * CANDLE_W) {
      const last = this.plats[this.plats.length - 1];
      const chunk = genWorld2Chunk(this.plats.length, WORLD2_CHUNK, last.y, this.w2rnd);
      this.plats.push(...chunk);
    }
  }

  private solidUnder(px: number, plat: Platform): boolean {
    return (
      plat.state === "solid" &&
      px + PLAYER_W > plat.x + 6 &&
      px < plat.x + plat.w - 2
    );
  }

  step(dt: number) {
    if (this.dead) {
      // brief slow-mo beat right after death, then normal decay
      const d = this.deathT < 0.5 ? dt * 0.35 : dt;
      this.deathT += d;
      this.stepParticles(d);
      this.stepFloats(d);
      this.shake = Math.max(0, this.shake - d * 40);
      return;
    }
    this.time += dt;
    // P3.6: composition order is FIXED (W5 byte-determinism) — mutation mods
    // shape the base curve first, the rush multiplier applies AFTER, so rush
    // can push past the un-rushed cap (that headroom IS the risk).
    const rushK = this.rush ? RUSH_SPEED : 1;
    const speedCap = CAM_MAX * this.mods.camSpeed;
    const speedBase = CAM_BASE * this.mods.camSpeed;
    this.speed = Math.min(speedCap, speedBase + this.time * CAM_ACCEL) * rushK;
    this.camX += this.speed * dt;
    if (this.world2) this.ensureWorld2Terrain();

    // jump input
    this.buffer = Math.max(0, this.buffer - dt);
    this.coyote = Math.max(0, this.coyote - dt);

    // gravity — P3.6 gravity-hang: half gravity while RISING with the jump
    // still held (release ends both the hang and the rise). Mods first, hang
    // factor after, fixed order.
    const hangK = this.jumpHeld && this.vy < 0 ? HANG_GRAVITY : 1;
    this.vy += GRAVITY * this.mods.gravity * hangK * dt;
    this.py += this.vy * dt;

    // platform pass detection (world x under player anchor)
    const focus = this.camX + VIEW_W * PLAYER_X_FRAC;
    for (const p of this.plats) {
      if (!p.passed && p.x + p.w < focus) {
        p.passed = true;
        if (p.summit) this.graduate();
        if (p.w > 0) {
          this.candlesPassed = p.i + 1;
          if (p.up) { this.streak++; this.bestStreak = Math.max(this.bestStreak, this.streak); }
          else this.streak = 0;
          const mult = 1 + Math.min(this.streak, COMBO_CAP) * COMBO_STEP;
          // P3.6: rush premium composes AFTER the mode/combo multipliers,
          // rounded last — score stays float; the floor happens once, at death.
          const gain = (this.world2 ? WORLD2_GAIN : BASE_GAIN) * mult * (this.rush ? RUSH_GAIN : 1);
          this.score += gain;
          this.spawnFloat(
            p.x + p.w / 2,
            p.y - 26,
            this.streak > 1 ? `+${gain}  x${mult.toFixed(1)}` : `+${gain}`,
            p.up ? "#CCFF00" : "#5E636B",
          );
          if (this.streak === 5 || this.streak === 10) this.cb.onSfx?.("milestone");
          this.cb.onScore(Math.floor(this.score), this.streak);
        }
      }
    }

    // landing check (falling only)
    if (this.vy >= 0) {
      const feet = this.py + PLAYER_H;
      for (const p of this.plats) {
        if (!this.solidUnder(this.px, p)) continue;
        if (feet >= p.y && feet - this.vy * dt <= p.y + 14) {
          this.py = p.y - PLAYER_H;
          this.vy = 0;
          if (!this.grounded) this.spawnParticles(5, this.px + PLAYER_W / 2, p.y, platformColor(p.up), 90);
          this.lastLandUp = p.up;
          if (!this.grounded) this.cb.onSfx?.("land");
          this.grounded = true;
          this.coyote = this.recovery.coyote;
          this.airJumpsLeft = this.recovery.airJumps; // P0.3: the recovery verb is per airborne period
          this.groundPlat = p;
          this.lastGroundY = p.y;
          if (p.summit) this.graduate();
          if (p.crumble && p.state === "solid") { p.state = "crumbling"; p.crumbleT = 0; this.cb.onSfx?.("crumble"); }
          break;
        }
      }
    }
    if (this.grounded) {
      const p = this.groundPlat;
      // A candle the player just landed on may be FOLDING: red candles start
      // crumbling on contact (that tell + its fuse ARE the mechanic). A folding
      // candle is still a surface, so this "did I slip off the edge?" re-check
      // must not ask `state === "solid"` (solidUnder's question): reading it the
      // strict way un-grounded the player on the very tick it landed on a red
      // candle, so a red candle could never be stood on — its fuse and tell were
      // unreachable, and any red candle the arc came down on was a fall-through
      // death no input could avoid. The candle now holds until its fuse runs
      // out; `state === "gone"` (crumble update below) is what ends it.
      const onSurface = !!p && p.state !== "gone"
        && this.px + PLAYER_W > p.x + 6 && this.px < p.x + p.w - 2;
      const stillOn = onSurface && Math.abs(this.py + PLAYER_H - p.y) < 4 && this.vy === 0;
      if (!stillOn) { this.grounded = false; this.groundPlat = null; }
    }

    // crumble update
    for (const p of this.plats) {
      if (p.state === "crumbling") {
        p.crumbleT += dt;
        // P0.7: a closing-bell candle burns on its OWN fixed fuse (floored
        // against the day's mutation) so the finale is identical on every
        // mutation — same tell, same window, no surprise.
        if (p.crumbleT >= crumbleFuse(p, this.mods)) {
          p.state = "gone";
          this.spawnParticles(10, p.x + p.w / 2, p.y, PLATFORM_DOWN, 140);
          if (this.groundPlat === p) { this.grounded = false; this.groundPlat = null; this.coyote = 0; }
        }
      }
    }

    // buffered jump execution
    if (this.buffer > 0 && (this.grounded || this.coyote > 0)) {
      // P0.4 STYLE, measured BEFORE the takeoff platform is cleared: runway is
      // the px of platform left ahead of the player's right edge — a jump from
      // the last STYLE_LATE_RUNWAY px is a LATE hop (rode it to the edge).
      const takeoff = this.grounded ? this.groundPlat : null;
      const runway = takeoff ? takeoff.x + takeoff.w - (this.px + PLAYER_W) : Infinity;
      const rescue = this.pressedAirborne; // press began off the ground
      this.vy = -JUMP_V * this.mods.jump;
      this.grounded = false; this.groundPlat = null; this.coyote = 0; this.buffer = 0; this.jumpCut = false;
      this.pressedAirborne = false;
      if (rescue) this.grantStyle("save");
      else if (runway <= STYLE_LATE_RUNWAY) this.grantStyle("late");
      this.cb.onSfx?.("jump");
    } else if (this.buffer > 0 && this.airJumpsLeft > 0) {
      // P0.3 air jump. Same forgiveness order as the ground jump: the buffer is
      // read AFTER coyote, so a press coyote cannot save still gets the second
      // jump, and a press with no jump left stays buffered for the landing.
      // No STYLE event: this is a verb the player spent, not a fudged timing
      // window — minting SAVE for it would pay out for a double-press every hop.
      this.airJumpsLeft--;
      this.vy = -AIR_JUMP_V * this.mods.jump;
      this.buffer = 0; this.jumpCut = false; this.pressedAirborne = false;
      this.spawnFloat(this.px + PLAYER_W / 2, this.py - 18, "AIR", AIR_JUMP_COLOR);
      this.cb.onSfx?.("air");
    }

    // death: fell below view
    if (this.py > this.camY + VIEW_H + 80) {
      this.die(this.lastLandUp === false ? "crumbled" : "fell");
    }

    // CAMERA-FRAME v3: the original single-lerp follow. The takeoff-platform
    // guard lives INSIDE the target (Math.max is continuous — no mode switch,
    // no velocity discontinuity): normal play tracks py - 0.52*VIEW_H exactly
    // like the shipped original; a very high arc eases the camera into the
    // static floor line, holding the takeoff strip visible without any snap.
    const camFloor = this.lastGroundY - VIEW_H + CAM_GROUND_STRIP;
    const desired = Math.max(this.py - VIEW_H * 0.52, camFloor);
    this.camY += (desired - this.camY) * Math.min(1, dt * CAM_LERP);
    if (this.camY > 0) this.camY = 0;
    this.shake = Math.max(0, this.shake - dt * 30);
    this.stepParticles(dt);
    this.stepFloats(dt);
  }

  private stepFloats(dt: number) {
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y -= 46 * dt;
      if (f.life <= 0) this.floats.splice(i, 1);
    }
  }

  private stepParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.life -= dt;
      if (q.life <= 0) { this.particles.splice(i, 1); continue; }
      q.vy += GRAVITY * 0.4 * dt;
      q.x += q.vx * dt; q.y += q.vy * dt;
    }
  }
}
