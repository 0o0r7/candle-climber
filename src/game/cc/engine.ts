// Candle Climber engine — fixed-timestep physics, auto-scroll runner over candle platforms
import type { Platform, Particle, RunResult, DeathCause } from "./types";
import { CANDLE_W, PLATFORM_W, WORLD2_CHUNK, genWorld2Chunk } from "./level";
import { BASE_MODS, type MutationMods } from "./mutations";
import { BASE_GAIN, WORLD2_GAIN, COMBO_CAP, COMBO_STEP, RUSH_GAIN } from "@/lib/scoring";
import { hashString, mulberry32 } from "./rng";

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
// CAMERA-FRAME fix v2 (owner report 2026-10-11, second pass): even with the
// asymmetric follow, the ground still slid toward the frame bottom during very
// high jumps (reach 310-387px vs a 480px view). Final architecture:
//   · while RISING, the camera may drift up by at most CAM_RISE_BUDGET px per
//     airborne arc (CAM_RISE_RATE px/s, engaged only once the player nears the
//     top margin) — the terrain barely moves;
//   · the RENDERER covers the remainder with a ground-pinned zoom-out
//     (render-only, see GameCanvas/render-v2) so neither the player nor the
//     playfield can leave the frame — geometry math forbids it otherwise;
//   · hard floor: the takeoff platform strip (CAM_GROUND_STRIP) can never
//     leave the frame regardless;
//   · falling/grounded keep the classic CAM_LERP follow (re-center after
//     landing, chase the fall).
export const CAM_LERP = 4.2;         // falling/grounded follow (unchanged feel)
export const CAM_RISE_BUDGET = 100;  // max px the camera drifts up per airborne arc
export const CAM_RISE_RATE = 240;    // px/s at which that budget is spent
export const CAM_RISE_ENGAGE = 84;   // player-top screen-y that arms the drift
export const CAM_GROUND_STRIP = 24;  // takeoff platform keeps this strip visible at the frame bottom

export type SfxName = "jump" | "land" | "crumble" | "milestone" | "victory";

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
  // P3.6 RUSH: opt-in risk input — hold to trade safety for height-speed.
  // Deterministic (input state + fixed timestep), W5-pinned.
  rush = false;
  // camera / world
  camX = 0; camY = 0; speed = CAM_BASE;
  // CAMERA-FRAME fix: y of the last platform the player left the ground from.
  // The camera may never rise so far that this platform leaves the frame —
  // "where did I jump from" is terrain the player MUST keep reading. Also the
  // renderer's zoom pivot (render-only zoom pins THIS line on screen).
  lastGroundY: number;
  // per-airborne-arc upward drift budget (see CAM_RISE_BUDGET); refilled on
  // every landing — deterministic, fixed-timestep only
  riseBudget = CAM_RISE_BUDGET;
  time = 0;
  // run stats
  score = 0; candlesPassed = 0; streak = 0; bestStreak = 0;
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

  // player world x is always locked to the screen anchor (30% of view)
  get px(): number {
    return this.camX + VIEW_W * PLAYER_X_FRAC - PLAYER_W / 2;
  }

  constructor(plats: Platform[], cb: EngineCallbacks, mods: MutationMods = BASE_MODS, seedStr = "") {
    this.plats = plats;
    this.cb = cb;
    this.mods = mods;
    this.seedStr = seedStr;
    // start ON the first platform: camera aligned so the player anchor
    // sits right on the platform center (safe runway)
    const start = plats.find((p) => p.state === "solid") ?? plats[0];
    this.py = start.y - 140;
    this.camY = this.py - VIEW_H * 0.55;
    this.camX = start.x + PLATFORM_W / 2 - VIEW_W * PLAYER_X_FRAC;
    this.lastGroundY = start.y;
  }

  get playerScreenX() { return this.px - this.camX; }

  press() { this.buffer = BUFFER; this.jumpHeld = true; this.jumpCut = false; }
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
    });
  }

  // ---- W4 graduation arc ----

  // Summit reached: a milestone, not a death. Idempotent.
  private graduate() {
    if (this.graduated) return;
    this.graduated = true;
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
          if (!this.grounded) this.spawnParticles(5, this.px + PLAYER_W / 2, p.y, p.up ? "#5BD08A" : "#E07856", 90);
          this.lastLandUp = p.up;
          if (!this.grounded) this.cb.onSfx?.("land");
          this.grounded = true;
          this.coyote = COYOTE;
          this.groundPlat = p;
          this.lastGroundY = p.y;
          this.riseBudget = CAM_RISE_BUDGET;
          if (p.summit) this.graduate();
          if (p.crumble && p.state === "solid") { p.state = "crumbling"; p.crumbleT = 0; this.cb.onSfx?.("crumble"); }
          break;
        }
      }
    }
    if (this.grounded) {
      const p = this.groundPlat;
      const stillOn = p && this.solidUnder(this.px, p) && Math.abs(this.py + PLAYER_H - p.y) < 4 && this.vy === 0;
      if (!stillOn) { this.grounded = false; this.groundPlat = null; }
    }

    // crumble update
    for (const p of this.plats) {
      if (p.state === "crumbling") {
        p.crumbleT += dt;
        if (p.crumbleT >= this.mods.crumbleTime) {
          p.state = "gone";
          this.spawnParticles(10, p.x + p.w / 2, p.y, "#E07856", 140);
          if (this.groundPlat === p) { this.grounded = false; this.groundPlat = null; this.coyote = 0; }
        }
      }
    }

    // buffered jump execution
    if (this.buffer > 0 && (this.grounded || this.coyote > 0)) {
      this.vy = -JUMP_V * this.mods.jump;
      this.grounded = false; this.groundPlat = null; this.coyote = 0; this.buffer = 0; this.jumpCut = false;
      this.cb.onSfx?.("jump");
    }

    // death: fell below view
    if (this.py > this.camY + VIEW_H + 80) {
      this.die(this.lastLandUp === false ? "crumbled" : "fell");
    }

    const desired = this.py - VIEW_H * 0.52;
    const rising = this.vy < 0 && !this.grounded;
    if (
      rising &&
      this.py - this.camY < CAM_RISE_ENGAGE &&
      this.riseBudget > 0 &&
      desired < this.camY
    ) {
      // airborne rise: capped, rate-limited drift — terrain stays readable
      const use = Math.min(this.riseBudget, CAM_RISE_RATE * dt, this.camY - desired);
      this.camY -= use;
      this.riseBudget -= use;
    } else if (!rising) {
      // falling / grounded: classic follow (re-centers after landing)
      const prevY = this.camY;
      this.camY += (desired - this.camY) * Math.min(1, dt * CAM_LERP);
      // airborne upward follow (early-fall apex chase) spends the SAME arc
      // budget — the total per-arc upward drift can never exceed CAM_RISE_BUDGET
      if (!this.grounded && this.camY < prevY) {
        const used = Math.min(this.riseBudget, prevY - this.camY);
        this.camY = prevY - used;
        this.riseBudget -= used;
      }
    }
    // hard guarantee: the takeoff platform never slides out of the bottom of
    // the frame (a CAM_GROUND_STRIP-wide strip of it stays visible)
    const camFloor = this.lastGroundY - VIEW_H + CAM_GROUND_STRIP;
    if (this.camY < camFloor) this.camY = camFloor;
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
