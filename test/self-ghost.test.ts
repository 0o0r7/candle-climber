// Self-ghost store — purity, keep-best semantics, eviction, robust parsing.
import { describe, expect, test } from "bun:test";
import {
  pruneSelfGhostDB,
  recordSelfGhost,
  selfGhostAsEntry,
  selfGhostKey,
  SELF_GHOST_KEY,
  SELF_GHOST_TERRAINS,
  loadSelfGhostDB,
  type SelfGhostDB,
  type SelfGhostEntry,
} from "../src/game/cc/self-ghost";
import { ghostViewAt } from "../src/game/cc/ghost";

const entry = (candles: number, over: Partial<SelfGhostEntry> = {}): SelfGhostEntry => ({
  charId: "default",
  candlesPassed: candles,
  score: candles * 10,
  ts: 1_700_000_000_000 + candles,
  samples: Array.from({ length: Math.max(2, candles * 2) }, (_, i) => i),
  ...over,
});

describe("self-ghost key", () => {
  test("terrain key is the server ghost triple", () => {
    expect(selfGhostKey("2026-10-11", "XRPUSDT", "1w")).toBe("2026-10-11|XRPUSDT|1w");
  });
});

describe("recordSelfGhost", () => {
  test("saves into an empty db", () => {
    const r = recordSelfGhost({}, selfGhostKey("2026-10-11", "XRPUSDT", "1w"), entry(13));
    expect(r.saved).toBe(true);
    expect(r.db[selfGhostKey("2026-10-11", "XRPUSDT", "1w")].candlesPassed).toBe(13);
  });

  test("keeps the best run — tie keeps the older ghost", () => {
    const key = selfGhostKey("2026-10-11", "XRPUSDT", "1w");
    const first = recordSelfGhost({}, key, entry(13));
    const tie = recordSelfGhost(first.db, key, entry(13, { ts: 9_999_999_999_999 }));
    expect(tie.saved).toBe(false);
    expect(tie.db[key].ts).toBe(first.db[key].ts);
    const better = recordSelfGhost(first.db, key, entry(20));
    expect(better.saved).toBe(true);
    expect(better.db[key].candlesPassed).toBe(20);
  });

  test("rejects empty/odd samples and non-finite candles", () => {
    const r1 = recordSelfGhost({}, "k", entry(5, { samples: [] }));
    expect(r1.saved).toBe(false);
    const r2 = recordSelfGhost({}, "k", entry(5, { samples: [1, 2, 3] }));
    expect(r2.saved).toBe(false);
    const r3 = recordSelfGhost({}, "k", entry(Number.NaN));
    expect(r3.saved).toBe(false);
  });

  test("evicts oldest terrains beyond the cap", () => {
    let db: SelfGhostDB = {};
    for (let i = 0; i < SELF_GHOST_TERRAINS + 3; i++) {
      db = recordSelfGhost(db, `2026-01-0${(i % 9) + 1}|SYM${i}|1w`, entry(5, { ts: i })).db;
    }
    const pruned = pruneSelfGhostDB(db);
    expect(Object.keys(pruned).length).toBe(SELF_GHOST_TERRAINS);
    // the OLDEST terrain (ts 0) must be gone
    expect(pruned["2026-01-01|SYM0|1w"]).toBeUndefined();
  });
});

describe("loadSelfGhostDB", () => {
  test("null/garbage → empty", () => {
    expect(loadSelfGhostDB(null)).toEqual({});
    expect(loadSelfGhostDB("not json")).toEqual({});
    expect(loadSelfGhostDB("[1,2,3]")).toEqual({});
    expect(loadSelfGhostDB("42")).toEqual({});
  });

  test("drops malformed terrains, keeps good ones", () => {
    const good = entry(7);
    const raw = JSON.stringify({
      "2026-10-11|XRPUSDT|1w": good,
      bad1: { candlesPassed: 3, samples: [1, 2, 3] }, // odd samples
      bad2: { candlesPassed: 3, samples: [] }, // empty
      bad3: { candlesPassed: -1, samples: [1, 2] }, // negative candles
      bad4: { samples: ["a", "b"] }, // non-numeric samples
    });
    const db = loadSelfGhostDB(raw);
    expect(Object.keys(db).length).toBe(1);
    expect(db["2026-10-11|XRPUSDT|1w"].candlesPassed).toBe(7);
  });
});

describe("selfGhostAsEntry + replay path", () => {
  test("shapes a GhostEntry the shared replay lookup accepts", () => {
    const key = selfGhostKey("2026-10-11", "XRPUSDT", "1w");
    const e = selfGhostAsEntry(key, entry(30, { samples: [0, 0, 10, -10, 20, -20] }));
    expect(e).not.toBeNull();
    expect(e!.symbol).toBe("XRPUSDT");
    expect(e!.name).toBe("YOUR BEST");
    const v = ghostViewAt(e!, 0); // t=0 → first sample
    expect(v).not.toBeNull();
    expect(v!.x).toBe(0);
    expect(v!.y).toBe(0);
    const v2 = ghostViewAt(e!, 1000); // far past the end → frozen at last
    expect(v2!.frozen).toBe(true);
    expect(v2!.x).toBe(20);
  });

  test("malformed key → null", () => {
    expect(selfGhostAsEntry("noseparator", entry(3))).toBeNull();
  });
});

describe("storage posture", () => {
  test("module never touches fetch/localStorage calls (pure core)", async () => {
    const src = await Bun.file(new URL("../src/game/cc/self-ghost.ts", import.meta.url)).text();
    expect(src).not.toContain("fetch(");
    expect(src).not.toMatch(/localStorage\.(getItem|setItem|removeItem)/);
  });

  test("key constant is the documented one", () => {
    expect(SELF_GHOST_KEY).toBe("cc_selfghost_v1");
  });
});
