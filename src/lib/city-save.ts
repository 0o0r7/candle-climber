// Chain City — server-side save validation (Phase 2, v1).
//
// PURE decision core (mirrors forge-board-validation's posture): the route
// keeps transport concerns (rate limit, wallet proof, storage) and hands this
// function the RAW body + the PROVEN wallet. Nothing here touches the network,
// the DOM or a store, so test/city-board.test.ts can pin the contract.
//
// SCOPE / HONESTY
// The city simulation runs client-side, so this is a CONVENIENCE + IDENTITY
// save, not a competitive-integrity gate: the wallet proof exists so nobody can
// overwrite another player's city under their address. Caps below still reject
// obviously impossible payloads (a hand-crafted 10^9-building city).
//
// Shapes mirror src/game/city/persistence.ts on purpose — the server must not
// import the client persistence module (it pulls in the engine), so the durable
// subset is re-declared here and validated strictly.
import { BUILDINGS } from "@/game/city/buildings";
import { GRID_COLS, GRID_ROWS } from "@/game/city/grid";
import { sanitizeGuild } from "@/lib/guild-registry";
import type { BuildingType } from "@/game/city/types";

export const CITY_SAVE_VERSION = 1;

// ---- caps ------------------------------------------------------------------
export const MAX_CITY_BUILDINGS = 400;
export const MAX_CITY_LEVEL = 999;
export const MAX_WICK_BALANCE = 1e12;
export const MAX_CITY_TIME = 1e9; // seconds of simulated time
export const MAX_CITY_FEEDS = 40;

export interface CitySaveBuilding {
  id: string;
  type: BuildingType;
  tier: 1 | 2 | 3;
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
  feeds: { symbol: string; price: number; change24h: number; source: string; lastUpdate: number }[];
  stats: { cityLevel: number; treasury: number; population: number; buildingsCount: number };
}

/** A stored city row: the durable state + the board-relevant summary + identity. */
export interface CitySaveEntry {
  wallet: string; // lowercase proven address
  guild?: string; // sanitized tag (decoration; buff is resolved from the registry)
  savedAt: number; // client-supplied save time (ms)
  ts: number; // server receipt time (ms)
  cityLevel: number;
  treasury: number;
  buildingsCount: number;
  state: CitySaveState;
}

export type CitySaveVerdict =
  | { ok: true; entry: CitySaveEntry }
  | { ok: false; error: string; status: number };

const finite = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

/** Board ranking: city level first, treasury as the tie-break. */
export function cityScore(level: number, treasury: number): number {
  return level * 1e9 + Math.max(0, treasury);
}

/**
 * Validate a submitted save against a PROVEN wallet. `wallet` is already
 * normalized + proof-verified by the route; `guild` is the sanitized tag.
 */
export function validateCitySave(
  body: unknown,
  wallet: string,
  guild: string | undefined,
  now: number = Date.now(),
): CitySaveVerdict {
  if (!body || typeof body !== "object") {
    return { ok: false, error: "bad request", status: 400 };
  }
  const b = body as Record<string, unknown>;
  const raw = (b.state ?? b) as Record<string, unknown>; // accept {state} or a bare state
  if (!raw || typeof raw !== "object") return { ok: false, error: "bad request", status: 400 };

  const phase = raw.phase === "graduated" ? "graduated" : raw.phase === "playing" ? "playing" : null;
  if (!phase) return { ok: false, error: "invalid phase", status: 400 };

  if (!Array.isArray(raw.buildings)) return { ok: false, error: "invalid buildings", status: 400 };
  if (raw.buildings.length > MAX_CITY_BUILDINGS) {
    return { ok: false, error: "too many buildings", status: 400 };
  }

  const buildings: CitySaveBuilding[] = [];
  const seenIds = new Set<string>();
  for (const item of raw.buildings) {
    if (!item || typeof item !== "object") return { ok: false, error: "invalid building", status: 400 };
    const bb = item as Record<string, unknown>;
    if (typeof bb.id !== "string" || !bb.id || seenIds.has(bb.id)) {
      return { ok: false, error: "invalid building id", status: 400 };
    }
    if (typeof bb.type !== "string" || !(bb.type in BUILDINGS)) {
      return { ok: false, error: "invalid building type", status: 400 };
    }
    if (bb.tier !== 1 && bb.tier !== 2 && bb.tier !== 3) {
      return { ok: false, error: "invalid building tier", status: 400 };
    }
    if (!finite(bb.level) || bb.level < 1 || bb.level > 99) {
      return { ok: false, error: "invalid building level", status: 400 };
    }
    if (
      !finite(bb.col) || !finite(bb.row) ||
      bb.col < 0 || bb.col >= GRID_COLS || bb.row < 0 || bb.row >= GRID_ROWS
    ) {
      return { ok: false, error: "building out of bounds", status: 400 };
    }
    seenIds.add(bb.id);
    buildings.push({
      id: bb.id,
      type: bb.type as BuildingType,
      tier: bb.tier,
      level: Math.floor(bb.level),
      col: Math.floor(bb.col),
      row: Math.floor(bb.row),
    });
  }

  if (!finite(raw.wickBalance) || raw.wickBalance < 0 || raw.wickBalance > MAX_WICK_BALANCE) {
    return { ok: false, error: "invalid balance", status: 400 };
  }
  if (!finite(raw.time) || raw.time < 0 || raw.time > MAX_CITY_TIME) {
    return { ok: false, error: "invalid time", status: 400 };
  }
  const dayNight = finite(raw.dayNight) ? Math.max(0, Math.min(1, raw.dayNight)) : 0;

  const statsRaw = (raw.stats ?? {}) as Record<string, unknown>;
  const cityLevel = finite(statsRaw.cityLevel) ? Math.floor(statsRaw.cityLevel) : 1;
  if (cityLevel < 1 || cityLevel > MAX_CITY_LEVEL) {
    return { ok: false, error: "invalid city level", status: 400 };
  }
  const treasury = finite(statsRaw.treasury)
    ? statsRaw.treasury
    : finite(raw.wickBalance) ? raw.wickBalance : 0;
  if (treasury < 0 || treasury > MAX_WICK_BALANCE) {
    return { ok: false, error: "invalid treasury", status: 400 };
  }

  const feedsRaw = Array.isArray(raw.feeds) ? raw.feeds.slice(0, MAX_CITY_FEEDS) : [];
  const feeds = feedsRaw
    .filter((f): f is Record<string, unknown> => !!f && typeof f === "object")
    .map((f) => ({
      symbol: String(f.symbol ?? "").slice(0, 16),
      price: finite(f.price) ? f.price : 0,
      change24h: finite(f.change24h) ? f.change24h : 0,
      source: typeof f.source === "string" ? f.source.slice(0, 16) : "synthetic",
      lastUpdate: finite(f.lastUpdate) ? f.lastUpdate : 0,
    }));

  const savedAt = finite(b.savedAt) ? b.savedAt : now;

  const entry: CitySaveEntry = {
    wallet,
    ...(sanitizeGuild(guild) ? { guild: sanitizeGuild(guild)! } : {}),
    savedAt,
    ts: now,
    cityLevel,
    treasury,
    buildingsCount: buildings.length,
    state: {
      phase,
      buildings,
      wickBalance: Math.floor(raw.wickBalance),
      time: raw.time,
      dayNight,
      feeds,
      stats: {
        cityLevel,
        treasury,
        population: finite(statsRaw.population) ? Math.max(0, Math.floor(statsRaw.population)) : 0,
        buildingsCount: buildings.length,
      },
    },
  };
  return { ok: true, entry };
}
