// Signal Forge — core types
// Top-down arena survival game where market data becomes a grid battlefield.

export type CellType = "green" | "red" | "neutral" | "pool";

export interface ArenaCell {
  row: number;
  col: number;
  type: CellType;
  intensity: number; // 0-1, derived from candle body size
  flipped: boolean; // true if a volatility wave flipped this cell
  pulse: number; // animation phase for rendering
  _flippedThisWave?: boolean; // internal: tracks per-wave flip state
}

export interface SignalFragment {
  row: number;
  col: number;
  life: number; // remaining seconds before despawn
  collected: boolean;
}

export interface VolatilityWave {
  axis: "row" | "col";
  index: number; // which row or column
  progress: number; // 0-1, how far across the arena
  speed: number; // progress per second
  telegraph: number; // seconds of warning remaining before wave starts
  active: boolean;
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number; color: string;
}

export interface RunResult {
  score: number;
  survivalTime: number; // seconds
  signalsCollected: number;
  maxChain: number;
  marginAtDeath: number;
  avgMargin: number;
  mutation: string;
  symbol: string;
  date: string;
  cause: string; // funny liquidation cause
}

export type MutationId = "calm" | "volatile" | "bearraid" | "bullrun" | "flashcrash" | "drain";

export interface MutationMods {
  id: MutationId;
  name: string;
  waveInterval: [number, number]; // min/max seconds between waves
  greenRatio: number; // base ratio of green cells
  redRatio: number; // base ratio of red cells
  scoreMultiplier: number;
  signalValue: number;
  greenShrinkRate: number; // for drain mutation: green cells shrink over time
  flashCrash: boolean; // periodic full-arena flips
  flashCrashInterval: number; // seconds between flash crashes
}
