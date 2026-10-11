// Self-ghost — the device's OWN best run per terrain, stored locally so the
// ghost replay works even when nobody has ever uploaded a ghost for a terrain
// (fresh rotation days, archive practice, offline synthetic terrain).
//
// POSTURE (mirrors ghost.ts exactly):
// - Pure functions, ZERO network. localStorage is touched only by the caller
//   (GameCanvas), in try/catch — private mode simply plays without a ghost.
// - COSMETIC ONLY: a self-ghost can never affect scores, ranks, or submission.
//   It reuses the GhostEntry replay path (same 30 Hz position-stream lookup),
//   so the renderer does not know or care where the ghost came from.
// - Storage hygiene: the DB keeps the best ghost for at most the N most
//   recently played terrains (oldest evicted) so the map can never bloat.

import type { GhostEntry, GhostSamples } from "./ghost";
import { MAX_GHOST_SAMPLES } from "./ghost";

/** localStorage key for the per-device self-ghost DB. */
export const SELF_GHOST_KEY = "cc_selfghost_v1";
/** Keep at most this many terrains (best ghost each) — evict by oldest ts. */
export const SELF_GHOST_TERRAINS = 10;

export interface SelfGhostEntry {
  charId: string;
  candlesPassed: number;
  score: number;
  ts: number;
  samples: GhostSamples;
}

/** Terrain key — same triple the server ghosts are pinned by. */
export function selfGhostKey(date: string, symbol: string, interval: string): string {
  return `${date}|${symbol}|${interval}`;
}

export type SelfGhostDB = Record<string, SelfGhostEntry>;

/** Parse the persisted DB — garbage/oversized samples are dropped per-terrain. */
export function loadSelfGhostDB(raw: string | null): SelfGhostDB {
  if (!raw) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
  const out: SelfGhostDB = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    const e = v as Partial<SelfGhostEntry> | null;
    if (!e || typeof e !== "object") continue;
    if (!Array.isArray(e.samples) || e.samples.length === 0) continue;
    if (e.samples.length % 2 !== 0) continue;
    if (e.samples.length > MAX_GHOST_SAMPLES * 2) continue;
    if (!e.samples.every((s) => typeof s === "number" && Number.isFinite(s))) continue;
    const candles = Math.floor(Number(e.candlesPassed));
    if (!Number.isFinite(candles) || candles < 0) continue;
    out[k] = {
      charId: typeof e.charId === "string" && e.charId.length <= 24 ? e.charId : "default",
      candlesPassed: candles,
      score: Math.max(0, Math.floor(Number(e.score) || 0)),
      ts: Math.floor(Number(e.ts) || 0),
      samples: e.samples.slice(),
    };
  }
  return out;
}

/** Evict to the newest SELF_GHOST_TERRAINS terrains (by entry ts). Pure. */
export function pruneSelfGhostDB(db: SelfGhostDB): SelfGhostDB {
  const keys = Object.keys(db);
  if (keys.length <= SELF_GHOST_TERRAINS) return db;
  const keep = keys
    .sort((a, b) => (db[b].ts || 0) - (db[a].ts || 0))
    .slice(0, SELF_GHOST_TERRAINS);
  const out: SelfGhostDB = {};
  for (const k of keep) out[k] = db[k];
  return out;
}

export interface SelfGhostRecordResult {
  db: SelfGhostDB;
  /** true when the candidate BEAT the stored ghost and was saved */
  saved: boolean;
}

/**
 * Record a finished run's stream if it beats the stored ghost for the terrain
 * (strictly more candles — a tie keeps the older ghost, mirroring the server's
 * best-run-per-wallet stability). Pure: returns the NEXT db; the caller saves.
 */
export function recordSelfGhost(
  db: SelfGhostDB,
  key: string,
  candidate: SelfGhostEntry,
): SelfGhostRecordResult {
  if (!Number.isFinite(candidate.candlesPassed) || candidate.candlesPassed < 0) {
    return { db, saved: false };
  }
  if (candidate.samples.length === 0 || candidate.samples.length % 2 !== 0) {
    return { db, saved: false };
  }
  const prev = db[key];
  if (prev && candidate.candlesPassed <= prev.candlesPassed) {
    return { db, saved: false };
  }
  const next: SelfGhostDB = {
    ...db,
    [key]: {
      charId: candidate.charId || "default",
      candlesPassed: Math.floor(candidate.candlesPassed),
      score: Math.max(0, Math.floor(candidate.score) || 0),
      ts: candidate.ts,
      samples: candidate.samples.slice(0, MAX_GHOST_SAMPLES * 2),
    },
  };
  return { db: pruneSelfGhostDB(next), saved: true };
}

/** Shape a stored self-ghost as a GhostEntry so the replay path is shared. */
export function selfGhostAsEntry(
  key: string,
  e: SelfGhostEntry,
): GhostEntry | null {
  const [date, symbol, interval] = key.split("|");
  if (!date || !symbol || !interval) return null;
  return {
    name: "YOUR BEST",
    charId: e.charId,
    candlesPassed: e.candlesPassed,
    symbol,
    date,
    interval,
    ts: e.ts,
    samples: e.samples,
  };
}
