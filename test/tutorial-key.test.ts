import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { TUTORIAL_KEY } from "../src/lib/tutorial-key";

// 2026-10-15 onboarding fix (owner flag): returning players carried the old
// v1 seen-flag, so after the 2026-10-14 entry-card cleanup removed the inline
// how-to block, the tutorial wizard never reached them again — the owner
// reasonably read that as "the wizard was deleted". The fix bumps the key to
// v2 (exactly one re-show for every returning player) and centralizes the
// string so the writer (Tutorial.finish) and reader (GameCanvas auto-show
// gate) can never disagree again. These pins hold that wiring in place.

describe("tutorial seen-key wiring", () => {
  test("key is the v2 bump (one re-show for returning players)", () => {
    // If you are touching this: you are re-deciding who sees the wizard.
    // Bumping to v3 = one more re-show for everyone; downgrading the string
    // without a deliberate product decision is a regression (returns players
    // to a wizard-less entry card — the exact defect this fixes).
    expect(TUTORIAL_KEY).toBe("cc_tutorial_seen_v2");
  });

  test("GameCanvas auto-show gate imports the shared constant, never hardcodes a version", () => {
    const src = readFileSync(new URL("../src/components/cc/GameCanvas.tsx", import.meta.url), "utf8");
    expect(src).toContain('from "@/lib/tutorial-key"');
    expect(src).toContain("localStorage.getItem(TUTORIAL_KEY)");
    // A hardcoded version string here would desynchronize reader vs writer:
    // the wizard would either never auto-show again (writer ahead) or loop
    // forever (reader ahead of what finish() writes).
    expect(src).not.toMatch(/cc_tutorial_seen_v\d+/);
  });

  test("Tutorial finish writes the same shared constant", () => {
    const src = readFileSync(new URL("../src/components/cc/Tutorial.tsx", import.meta.url), "utf8");
    expect(src).toContain('from "@/lib/tutorial-key"');
    expect(src).toContain("localStorage.setItem(TUTORIAL_KEY");
    expect(src).not.toMatch(/cc_tutorial_seen_v\d+/);
  });
});
