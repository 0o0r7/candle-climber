// P0 deep-link fix (2026-10-29) — legacy "/" link forwarding rules.
//
// middleware.ts consults shouldForwardToPlay() before serving "/": links
// already shared in the wild (X posts, clipboard texts) still target
// "/?duel=…" etc. and must heal into /play?… so their params are parsed.

import { describe, test, expect } from "bun:test";
import { shouldForwardToPlay, GAME_LINK_PARAMS } from "@/lib/deep-link-forward";

describe("P0 legacy deep-link forwarding — shouldForwardToPlay", () => {
  test("forwards '/' when any game param is present", () => {
    expect(shouldForwardToPlay("/", ["duel"])).toBe(true);
    expect(shouldForwardToPlay("/", ["ref"])).toBe(true);
    expect(shouldForwardToPlay("/", ["symbol", "date"])).toBe(true);
    expect(shouldForwardToPlay("/", ["utm_source", "ref"])).toBe(true); // mixed traffic still heals
    expect(shouldForwardToPlay("/", ["mode"])).toBe(true);
    expect(shouldForwardToPlay("/", ["interval"])).toBe(true);
    expect(shouldForwardToPlay("/", ["source"])).toBe(true);
    expect(shouldForwardToPlay("/", ["renderer"])).toBe(true);
  });

  test("does NOT touch bare '/', utm-only, or non-'/' routes", () => {
    expect(shouldForwardToPlay("/", [])).toBe(false);
    expect(shouldForwardToPlay("/", ["utm_source", "utm_campaign"])).toBe(false);
    expect(shouldForwardToPlay("/", ["fbclid"])).toBe(false);
    expect(shouldForwardToPlay("/play", ["duel"])).toBe(false); // already correct
    expect(shouldForwardToPlay("/leaderboard", ["ref"])).toBe(false);
    expect(shouldForwardToPlay("/partners", ["mode"])).toBe(false);
  });

  test("the game-param set covers exactly what GameCanvas parses (no more)", () => {
    // The 8 params the /play init effect reads: duel, ref, symbol, date,
    // source, mode, interval, renderer. Anything else is not ours to move.
    expect(GAME_LINK_PARAMS.size).toBe(8);
    for (const k of ["duel", "ref", "symbol", "date", "source", "mode", "interval", "renderer"]) {
      expect(GAME_LINK_PARAMS.has(k)).toBe(true);
    }
    for (const k of ["utm_source", "key", "code", "gclid"]) {
      expect(GAME_LINK_PARAMS.has(k)).toBe(false);
    }
  });
});
