// P0 deep-link family regression tests (2026-10-29).
//
// Backstory: every shareable link (archive rows, duel invites, ?ref= share
// links) was minted against "/" while the ONLY parser of those params is the
// GameCanvas init effect on /play — and duel invites joined ?duel= with
// ?ref= producing "?duel=X?ref=Y", which URLSearchParams reads as ONE
// malformed duel param (failing DUEL_CODE_RE) with the ref lost entirely.
//
// These round-trip tests simulate the EXACT landing-side parse (the regexes
// and whitelists GameCanvas applies) so a regression in any builder fails
// here, not in the wild.

import { describe, test, expect } from "bun:test";
import { GAME_URL, refSlug, shareRef, shareUrl } from "@/game/cc/share";
import { duelUrl, DUEL_CODE_RE } from "@/game/cc/duel";
import { archiveHref } from "@/game/cc/archive";

// The landing-side validators (mirrored from GameCanvas init effect) —
// if GameCanvas tightens these, update here so round-trips stay honest.
const REF_LANDING_RE = /^[A-Za-z0-9_-]{1,24}$/;

describe("P0 share links — ref slug sanitization", () => {
  test("lowercases, strips hostile chars, keeps [a-z0-9_-]", () => {
    expect(refSlug("Yaser")).toBe("yaser");
    expect(refSlug("Big-Whale_99")).toBe("big-whale_99");
    expect(refSlug("<script>alert(1)</script>")).toBe("scriptalert1script");
    expect(refSlug("  spaced  out  ")).toBe("spacedout");
  });

  test("empty or fully-hostile input degrades to the 'cc' fallback", () => {
    expect(refSlug("")).toBe("cc");
    expect(refSlug("???!!!")).toBe("cc");
    expect(refSlug("///***")).toBe("cc");
  });

  test("clamps to the 24-char landing limit", () => {
    expect(refSlug("a".repeat(40)).length).toBe(24);
    expect(refSlug("a".repeat(24))).toBe("a".repeat(24));
    expect(refSlug("a".repeat(25))).toBe("a".repeat(24));
  });
});

describe("P0 share links — builders mint /play links with correct joining", () => {
  test("shareRef joins with & (never a second ?)", () => {
    expect(shareRef("bob")).toBe("&ref=bob");
    expect(shareRef("bob").startsWith("?")).toBe(false);
  });

  test("shareUrl is the standalone measurable link at /play", () => {
    expect(shareUrl("bob")).toBe(`${GAME_URL}/play?ref=bob`);
    expect(shareUrl("")).toBe(`${GAME_URL}/play?ref=cc`);
    // GAME_URL itself must never carry a query (that was the duel bug's shape)
    expect(GAME_URL.includes("?")).toBe(false);
  });

  test("ROUND-TRIP: shareUrl parses on the landing side exactly as GameCanvas reads it", () => {
    for (const name of ["Yaser", "Big-Whale_99", "", "???!!!", "x".repeat(40)]) {
      const u = new URL(shareUrl(name));
      expect(u.pathname).toBe("/play");
      const ref = u.searchParams.get("ref");
      expect(ref).not.toBeNull();
      expect(REF_LANDING_RE.test(ref as string)).toBe(true);
    }
  });

  test("ROUND-TRIP: duel link + ref parses as TWO independent params (the original P0 bug)", () => {
    // This is the exact composition GameCanvas.tsx mints for duel invites:
    //   duelUrl(origin, code) + shareRef(name)
    const link = `${duelUrl("https://candle-climber.vercel.app", "A2B3C4")}${shareRef("Yaser")}`;
    const u = new URL(link);
    expect(u.pathname).toBe("/play");
    expect(u.search).not.toContain("??"); // the old double-? smell
    const duel = (u.searchParams.get("duel") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    expect(DUEL_CODE_RE.test(duel)).toBe(true); // the invite actually loads
    const ref = u.searchParams.get("ref");
    expect(ref).toBe("yaser"); // the attribution actually lands
    expect(REF_LANDING_RE.test(ref as string)).toBe(true);
  });

  test("ROUND-TRIP: archive link parses on the landing side with symbol+date intact", () => {
    const TODAY = "2026-10-29";
    const href = archiveHref({ symbol: "BTCUSDT", date: "2020-03-12" }, TODAY);
    expect(href.startsWith("/play?")).toBe(true);
    const u = new URL(`https://candle-climber.vercel.app${href}`);
    expect(u.pathname).toBe("/play");
    expect(u.searchParams.get("symbol")).toBe("BTCUSDT");
    expect(u.searchParams.get("date")).toBe("2020-03-12");
  });
});
