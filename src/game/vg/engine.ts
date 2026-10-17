// Signal Forge — game engine
// Top-down arena survival: movement, margin, collision, scoring, waves.

import type { ArenaCell, SignalFragment, VolatilityWave, Particle, RunResult, MutationMods } from "./types";
import { GRID_COLS, GRID_ROWS, CELL_SIZE, flipCell } from "./arena";
import { hashString, mulberry32 } from "@/game/cc/rng";

export const VIEW_W = GRID_COLS * CELL_SIZE; // 704
export const VIEW_H = GRID_ROWS * CELL_SIZE; // 528

// Physics
export const PLAYER_SPEED = 180; // px/sec
export const PLAYER_SPRINT = 280;
export const PLAYER_DASH_SPEED = 500;
export const PLAYER_DASH_DURATION = 0.18; // seconds
export const PLAYER_DASH_COOLDOWN = 3.0;
export const PLAYER_RADIUS = 14; // px

// Margin
export const MARGIN_MAX = 100;
export const MARGIN_REGEN = 2.0; // % per sec on green
export const MARGIN_DRAIN = 3.0; // % per sec on red
export const MARGIN_POOL_BONUS = 15; // instant from pool
export const MARGIN_SPRINT_DRAIN = 0.5; // extra drain per sec while sprinting

// Signals
export const SIGNAL_LIFETIME = 4.0; // seconds
export const SIGNAL_SPAWN_INTERVAL = [2.5, 4.0] as const; // seconds
export const SIGNAL_CHAIN_THRESHOLD = 5;

// Waves
export const WAVE_TELEGRAPH = 1.5; // seconds of warning
export const WAVE_SPEED = 0.8; // progress per second (crosses arena in ~1.25s)

// Scoring
export const SURVIVAL_SCORE = 1; // per second
export const DODGE_SCORE = 25;

// Liquidation causes (funny)
const LIQUIDATION_CAUSES = [
  "Your margin was decorative.",
  "You held through the flash crash. Bold.",
  "The bid wall was a mirage.",
  "Stop loss? Never heard of her.",
  "You diamond-handed straight into liquidation.",
  "The market called. It's not interested.",
  "Your risk management was vibes-based.",
  "You fought the tape. The tape won.",
  "Liquidity? In THIS economy?",
  "You paper-handed the green, diamond-handed the red.",
];

export interface EngineCallbacks {
  onDeath: (r: RunResult) => void;
  onScore: (score: number, margin: number, chain: number) => void;
  onSfx?: (name: string) => void;
}

export class ForgeEngine {
  grid: ArenaCell[][];
  mods: MutationMods;
  signals: SignalFragment[] = [];
  waves: VolatilityWave[] = [];
  particles: Particle[] = [];

  // Player
  px = CELL_SIZE * 1.5;
  py = CELL_SIZE * 1.5;
  vx = 0;
  vy = 0;
  margin = MARGIN_MAX;
  dashTimer = 0;
  dashCooldown = 0;
  sprinting = false;
  invulnerable = 0;

  // Input
  inputX = 0;
  inputY = 0;
  dashRequested = false;

  // Run state
  time = 0;
  score = 0;
  signalsCollected = 0;
  chain = 0;
  maxChain = 0;
  marginSum = MARGIN_MAX; // for avg margin
  marginSamples = 1;
  dead = false;
  deathT = 0;
  shake = 0;

  // Wave scheduling
  nextWaveTimer: number;
  nextFlashCrash: number;
  nextSignalTimer: number;

  private seedStr: string;
  private cb: EngineCallbacks;
  private waveRnd: () => number;
  private signalRnd: () => number;

  constructor(grid: ArenaCell[][], mods: MutationMods, cb: EngineCallbacks, seedStr = "") {
    this.grid = grid;
    this.mods = mods;
    this.cb = cb;
    this.seedStr = seedStr;
    this.waveRnd = mulberry32(hashString("vg-waves:" + seedStr));
    this.signalRnd = mulberry32(hashString("vg-signals:" + seedStr));
    this.nextWaveTimer = this.mods.waveInterval[0] + this.waveRnd() * (this.mods.waveInterval[1] - this.mods.waveInterval[0]);
    this.nextFlashCrash = this.mods.flashCrashInterval;
    this.nextSignalTimer = SIGNAL_SPAWN_INTERVAL[0];
  }

  setInput(x: number, y: number) {
    const len = Math.hypot(x, y);
    if (len > 1) { x /= len; y /= len; }
    this.inputX = x;
    this.inputY = y;
  }

  requestDash() {
    if (this.dashCooldown <= 0) {
      this.dashRequested = true;
    }
  }

  setSprint(s: boolean) {
    this.sprinting = s;
  }

  private spawnSignal() {
    // Find a random green cell
    const greenCells: { r: number; c: number }[] = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c].type === "green" || this.grid[r][c].type === "pool") {
          greenCells.push({ r, c });
        }
      }
    }
    if (greenCells.length === 0) return;
    const pick = greenCells[Math.floor(this.signalRnd() * greenCells.length)];
    // Don't spawn if one already exists there
    if (this.signals.some(s => s.row === pick.r && s.col === pick.c && !s.collected)) return;
    this.signals.push({
      row: pick.r,
      col: pick.c,
      life: SIGNAL_LIFETIME,
      collected: false,
    });
  }

  private spawnWave() {
    const isRow = this.waveRnd() < 0.5;
    const index = Math.floor(this.waveRnd() * (isRow ? GRID_ROWS : GRID_COLS));
    this.waves.push({
      axis: isRow ? "row" : "col",
      index,
      progress: 0,
      speed: WAVE_SPEED,
      telegraph: WAVE_TELEGRAPH,
      active: false,
    });
  }

  private flashCrashAll() {
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c].type !== "neutral") {
          flipCell(this.grid[r][c]);
        }
      }
    }
    this.shake = 12;
    this.cb.onSfx?.("flashcrash");
    // Spawn particles across the arena
    for (let i = 0; i < 60; i++) {
      this.particles.push({
        x: this.waveRnd() * VIEW_W,
        y: this.waveRnd() * VIEW_H,
        vx: (this.waveRnd() - 0.5) * 200,
        vy: (this.waveRnd() - 0.5) * 200,
        life: 0.6,
        maxLife: 0.6,
        size: 2 + this.waveRnd() * 3,
        color: "#FF00FF",
      });
    }
  }

  private spawnParticles(n: number, x: number, y: number, color: string, spread = 120) {
    for (let i = 0; i < n; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * spread,
        vy: (Math.random() - 0.5) * spread,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.7,
        size: 2 + Math.random() * 3,
        color,
      });
    }
  }

  get playerCell(): { row: number; col: number } {
    return {
      col: Math.floor(this.px / CELL_SIZE),
      row: Math.floor(this.py / CELL_SIZE),
    };
  }

  update(dt: number) {
    if (this.dead) {
      this.deathT += dt;
      return;
    }

    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 30);

    // Dash
    if (this.dashRequested && this.dashCooldown <= 0) {
      this.dashTimer = PLAYER_DASH_DURATION;
      this.dashCooldown = PLAYER_DASH_COOLDOWN;
      this.invulnerable = PLAYER_DASH_DURATION + 0.1;
      this.dashRequested = false;
      this.cb.onSfx?.("dash");
      this.spawnParticles(8, this.px, this.py, "#00FF9D", 80);
    }
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.dashCooldown = Math.max(0, this.dashCooldown - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);

    // Movement
    let speed = this.sprinting ? PLAYER_SPRINT : PLAYER_SPEED;
    if (this.dashTimer > 0) speed = PLAYER_DASH_SPEED;
    this.vx = this.inputX * speed;
    this.vy = this.inputY * speed;
    this.px += this.vx * dt;
    this.py += this.vy * dt;

    // Clamp to arena bounds
    this.px = Math.max(PLAYER_RADIUS, Math.min(VIEW_W - PLAYER_RADIUS, this.px));
    this.py = Math.max(PLAYER_RADIUS, Math.min(VIEW_H - PLAYER_RADIUS, this.py));

    // Cell effects
    const { row, col } = this.playerCell;
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      const cell = this.grid[row][col];
      cell.pulse += dt * 3;

      if (this.invulnerable <= 0) {
        if (cell.type === "green") {
          this.margin = Math.min(MARGIN_MAX, this.margin + MARGIN_REGEN * dt);
        } else if (cell.type === "red") {
          this.margin -= MARGIN_DRAIN * dt;
          if (this.sprinting) this.margin -= MARGIN_SPRINT_DRAIN * dt;
        } else if (cell.type === "pool") {
          this.margin = Math.min(MARGIN_MAX, this.margin + MARGIN_POOL_BONUS);
          cell.type = "neutral"; // pool is one-time
          this.spawnParticles(12, this.px, this.py, "#70F3FF", 150);
          this.cb.onSfx?.("pool");
        }
      }
    }

    // Green shrink for drain mutation
    if (this.mods.greenShrinkRate > 0) {
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const cell = this.grid[r][c];
          if (cell.type === "green" && this.waveRnd() < this.mods.greenShrinkRate * dt) {
            cell.type = "neutral";
          }
        }
      }
    }

    // Signal spawning
    this.nextSignalTimer -= dt;
    if (this.nextSignalTimer <= 0) {
      this.spawnSignal();
      this.nextSignalTimer = SIGNAL_SPAWN_INTERVAL[0] + this.signalRnd() * (SIGNAL_SPAWN_INTERVAL[1] - SIGNAL_SPAWN_INTERVAL[0]);
    }

    // Signal collection and lifetime
    for (const sig of this.signals) {
      if (sig.collected) continue;
      sig.life -= dt;
      const dx = this.px - (sig.col * CELL_SIZE + CELL_SIZE / 2);
      const dy = this.py - (sig.row * CELL_SIZE + CELL_SIZE / 2);
      if (Math.hypot(dx, dy) < PLAYER_RADIUS + 12) {
        sig.collected = true;
        this.signalsCollected++;
        this.chain++;
        this.maxChain = Math.max(this.maxChain, this.chain);
        this.score += this.mods.signalValue * (this.chain >= SIGNAL_CHAIN_THRESHOLD ? 2 : 1) * this.mods.scoreMultiplier;
        this.spawnParticles(10, this.px, this.py, "#B28DFF", 100);
        this.cb.onSfx?.("signal");
      }
    }
    this.signals = this.signals.filter(s => !s.collected && s.life > 0);

    // Chain reset on red cell
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      const cell = this.grid[row][col];
      if (cell.type === "red" && this.chain > 0) {
        this.chain = 0;
      }
    }

    // Wave scheduling
    this.nextWaveTimer -= dt;
    if (this.nextWaveTimer <= 0) {
      this.spawnWave();
      this.nextWaveTimer = this.mods.waveInterval[0] + this.waveRnd() * (this.mods.waveInterval[1] - this.mods.waveInterval[0]);
    }

    // Flash crash
    if (this.mods.flashCrash) {
      this.nextFlashCrash -= dt;
      if (this.nextFlashCrash <= 0) {
        this.flashCrashAll();
        this.nextFlashCrash = this.mods.flashCrashInterval;
      }
    }

    // Wave updates
    for (const wave of this.waves) {
      if (wave.telegraph > 0) {
        wave.telegraph -= dt;
        if (wave.telegraph <= 0) {
          wave.active = true;
          this.cb.onSfx?.("wave");
        }
      } else {
        wave.progress += wave.speed * dt;
        // Flip cells as the wave passes
        const cellProgress = wave.progress * (wave.axis === "row" ? GRID_COLS : GRID_ROWS);
        const cellIdx = Math.floor(cellProgress);
        if (wave.axis === "row" && cellIdx < GRID_COLS && cellIdx >= 0) {
          const cell = this.grid[wave.index][cellIdx];
          if (cell && cell.type !== "neutral" && !cell._flippedThisWave) {
            flipCell(cell);
            cell._flippedThisWave = true;
          }
        } else if (wave.axis === "col" && cellIdx < GRID_ROWS && cellIdx >= 0) {
          const cell = this.grid[cellIdx][wave.index];
          if (cell && cell.type !== "neutral" && !cell._flippedThisWave) {
            flipCell(cell);
            cell._flippedThisWave = true;
          }
        }
      }
    }
    // Remove completed waves and reset flip flags
    this.waves = this.waves.filter(w => {
      const totalCells = w.axis === "row" ? GRID_COLS : GRID_ROWS;
      return w.progress < totalCells + 1;
    });
    // Reset _flippedThisWave for next wave cycle
    if (this.waves.length === 0) {
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          this.grid[r][c]._flippedThisWave = false;
        }
      }
    }

    // Particles
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    // Scoring
    this.score += SURVIVAL_SCORE * dt * this.mods.scoreMultiplier;

    // Margin tracking
    this.marginSum += this.margin;
    this.marginSamples++;

    // Death check
    if (this.margin <= 0) {
      this.margin = 0;
      this.die();
    }

    // Callbacks
    this.cb.onScore(Math.floor(this.score), this.margin, this.chain);
  }

  private die() {
    if (this.dead) return;
    this.dead = true;
    this.deathT = 0;
    this.shake = 20;
    this.spawnParticles(30, this.px, this.py, "#FF4D6D", 200);
    this.cb.onSfx?.("liquidation");

    const causeIdx = Math.floor(mulberry32(hashString("vg-cause:" + this.seedStr + this.time))() * LIQUIDATION_CAUSES.length);
    const avgMargin = this.marginSum / this.marginSamples;

    const result: RunResult = {
      score: Math.floor(this.score),
      survivalTime: Math.floor(this.time),
      signalsCollected: this.signalsCollected,
      maxChain: this.maxChain,
      marginAtDeath: 0,
      avgMargin: Math.round(avgMargin),
      mutation: this.mods.name,
      symbol: "",
      date: "",
      cause: LIQUIDATION_CAUSES[causeIdx],
    };
    this.cb.onDeath(result);
  }
}
