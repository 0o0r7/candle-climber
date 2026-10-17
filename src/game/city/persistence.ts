// Chain City — local persistence (v0)
// Saves the authoritative game state to localStorage so a refresh never
// destroys a player's city. Guests are local-only by design; a server save
// bound to a wallet proof is a later phase.
//
// Key: cc_city_save_v1   Shape: { v: 1, savedAt, state }
// Corrupt JSON or an unknown version never crashes — the caller starts fresh.

import type {
  GameState,
  Building,
  BuildingType,
  BuildingTier,
  StockFeed,
  CityStats,
} from "./types";
import { BUILDINGS } from "./buildings";
import { setBuildingIdFloor, type CityEngine } from "./engine";

export const CITY_SAVE_KEY = "cc_city_save_v1";
export const CITY_SAVE_VERSION = 1;

export interface CitySaveBuilding {
  id: string;
  type: BuildingType;
  tier: BuildingTier;
  level: number;
  col: number;
  row: number;
}

export interface CitySaveState {
  phase: "playing" | "graduated";
  buildings: CitySaveBuilding[];
  wickBalance: number;
  time: number;
  dayNight: number;
  feeds: StockFeed[];
  stats: CityStats;
  guild?: string | null; // sanitized guild tag (Phase 2) — decoration + buff lookup
}

export interface CitySave {
  v: typeof CITY_SAVE_VERSION;
  savedAt: number;
  state: CitySaveState;
}

/** Extract the durable subset of the live game state. */
export function serializeCity(state: GameState): CitySave {
  return {
    v: CITY_SAVE_VERSION,
    savedAt: Date.now(),
    state: {
      phase: state.phase === "graduated" ? "graduated" : "playing",
      buildings: state.buildings.map((b) => ({
        id: b.id,
        type: b.type,
        tier: b.tier,
        level: b.level,
        col: b.pos.col,
        row: b.pos.row,
      })),
      wickBalance: state.wickBalance,
      time: state.time,
      dayNight: state.dayNight,
      feeds: Array.from(state.feeds.values()),
      stats: { ...state.stats },
      ...(state.guild ? { guild: state.guild } : {}),
    },
  };
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

/** Validate a parsed save. Anything unexpected ⇒ null (caller starts fresh). */
export function isValidSave(raw: unknown): raw is CitySave {
  if (!raw || typeof raw !== "object") return false;
  const s = raw as Partial<CitySave>;
  if (s.v !== CITY_SAVE_VERSION) return false;
  const st = s.state as Partial<CitySaveState> | undefined;
  if (!st || typeof st !== "object") return false;
  if (st.phase !== "playing" && st.phase !== "graduated") return false;
  if (!Array.isArray(st.buildings)) return false;
  if (!isFiniteNumber(st.wickBalance)) return false;
  if (!isFiniteNumber(st.time)) return false;
  if (!isFiniteNumber(st.dayNight)) return false;
  if (!st.stats || typeof st.stats !== "object") return false;
  if (!isFiniteNumber((st.stats as CityStats).cityLevel)) return false;
  if (!Array.isArray(st.feeds)) return false;
  for (const b of st.buildings) {
    if (!b || typeof b !== "object") return false;
    const bb = b as Partial<CitySaveBuilding>;
    if (typeof bb.id !== "string") return false;
    if (typeof bb.type !== "string" || !(bb.type in BUILDINGS)) return false;
    if (!isFiniteNumber(bb.level) || !isFiniteNumber(bb.col) || !isFiniteNumber(bb.row)) return false;
  }
  return true;
}

/** Persist the current state. Returns false when storage is unavailable. */
export function saveCity(state: GameState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(CITY_SAVE_KEY, JSON.stringify(serializeCity(state)));
    return true;
  } catch {
    return false;
  }
}

/** Read + validate the stored save. Never throws. */
export function loadCity(): CitySave | null {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(CITY_SAVE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isValidSave(parsed)) {
      console.warn("[chain-city] save ignored (corrupt or unknown version)");
      return null;
    }
    return parsed;
  } catch {
    console.warn("[chain-city] save ignored (unparseable JSON)");
    return null;
  }
}

export function clearCity(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(CITY_SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/** Restore a validated save into a fresh engine's state. */
export function applyCitySave(engine: CityEngine, save: CitySave): void {
  const s = save.state;

  const buildings: Building[] = s.buildings
    .filter((b) => b.type in BUILDINGS)
    .map((b, i) => ({
      id: b.id,
      type: b.type,
      tier: b.tier,
      pos: { col: b.col, row: b.row },
      placedAt: 0,
      lastIncome: 0,
      totalEarned: 0,
      level: b.level,
      animOffset: i * 1.7,
      glowPulse: 1,
    }));

  engine.state.phase = s.phase;
  engine.state.buildings = buildings;
  engine.state.wickBalance = s.wickBalance;
  engine.state.time = s.time;
  engine.state.dayNight = s.dayNight;
  engine.state.guild = s.guild ?? null;
  engine.state.stats = { ...s.stats };
  if (s.feeds.length > 0) {
    engine.state.feeds = new Map(s.feeds.map((f) => [f.symbol, f]));
  }

  // Keep future building ids from colliding with restored ones.
  const maxId = buildings.reduce((m, b) => {
    const n = parseInt(b.id.replace(/\D/g, ""), 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, 0);
  setBuildingIdFloor(maxId);

  // Transient visual/UI fields start clean.
  engine.state.particles = [];
  engine.state.floats = [];
  engine.state.events = [];
  engine.state.graduationPulse = 0;
  engine.state.selectedType = null;
  engine.state.hoveredCell = null;
}
