/// <reference types="bun-types" />
// Chain City local-persistence contract (cc_city_save_v1).
// Pure serialization + validation only — no DOM, no localStorage.
import { describe, test, expect } from "bun:test";
import { serializeCity, isValidSave, CITY_SAVE_VERSION } from "@/game/city/persistence";
import type { GameState, StockFeed } from "@/game/city/types";

function state(over: Partial<GameState> = {}): GameState {
  return {
    phase: "playing",
    buildings: [
      {
        id: "b1",
        type: "market_plaza",
        tier: 1,
        pos: { col: 5, row: 5 },
        placedAt: 0,
        lastIncome: 0,
        totalEarned: 0,
        level: 1,
        animOffset: 0,
        glowPulse: 0,
      },
    ],
    wickBalance: 4650,
    stats: {
      population: 150,
      treasury: 4650,
      dailyIncome: 0,
      buildingsCount: 1,
      guildRank: 100,
      cityLevel: 1,
      graduationProgress: 0,
    },
    events: [],
    feeds: new Map<string, StockFeed>(),
    selectedType: null,
    hoveredCell: null,
    cameraX: 0,
    cameraY: 0,
    zoom: 1,
    time: 12,
    dayNight: 0.3,
    particles: [],
    floats: [],
    graduationPulse: 0,
    ...over,
  };
}

describe("chain city persistence (cc_city_save_v1)", () => {
  test("serialize → validate roundtrip preserves the durable fields", () => {
    const save = serializeCity(state());
    expect(save.v).toBe(CITY_SAVE_VERSION);
    expect(isValidSave(save)).toBe(true);
    expect(save.state.buildings.length).toBe(1);
    expect(save.state.buildings[0]).toMatchObject({
      type: "market_plaza",
      level: 1,
      col: 5,
      row: 5,
    });
    expect(save.state.wickBalance).toBe(4650);
    expect(save.state.time).toBe(12);
    expect(save.state.phase).toBe("playing");
  });

  test("feeds serialize as a JSON-safe array (Map → array)", () => {
    const feeds = new Map<string, StockFeed>([
      ["NVDA", { symbol: "NVDA", price: 875, change24h: 2.4, source: "synthetic", lastUpdate: 0 }],
    ]);
    const save = serializeCity(state({ feeds }));
    expect(Array.isArray(save.state.feeds)).toBe(true);
    expect(save.state.feeds[0].symbol).toBe("NVDA");
    expect(isValidSave(save)).toBe(true);
  });

  test("a graduated city persists its phase", () => {
    expect(serializeCity(state({ phase: "graduated" })).state.phase).toBe("graduated");
  });

  test("menu/paused phases collapse to 'playing' (a menu is never persisted)", () => {
    expect(serializeCity(state({ phase: "menu" })).state.phase).toBe("playing");
    expect(serializeCity(state({ phase: "paused" })).state.phase).toBe("playing");
  });

  test("a zero-building save is valid (fresh city)", () => {
    const save = serializeCity(state({ buildings: [] }));
    expect(isValidSave(save)).toBe(true);
    expect(save.state.buildings.length).toBe(0);
  });

  test("rejects corrupt or wrong-shape saves", () => {
    expect(isValidSave(null)).toBe(false);
    expect(isValidSave("nope")).toBe(false);
    expect(isValidSave({})).toBe(false);
    expect(isValidSave({ v: 2, savedAt: 0, state: {} })).toBe(false); // unknown version
    expect(
      isValidSave({
        v: 1,
        savedAt: 0,
        state: {
          phase: "playing",
          buildings: [],
          wickBalance: Number.NaN,
          time: 0,
          dayNight: 0,
          feeds: [],
          stats: { cityLevel: 1 },
        },
      }),
    ).toBe(false);
  });

  test("rejects an unknown building type (forward-compat safety)", () => {
    const save = serializeCity(state());
    (save.state.buildings[0] as { type: string }).type = "not_a_building";
    expect(isValidSave(save)).toBe(false);
  });
});
