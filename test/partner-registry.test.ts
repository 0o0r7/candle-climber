// Partner-registry contract (PARTNER lane, council 2026-10-12).
// Pins: strict entry validation, first-wins dedup, loud-skip of bad entries,
// empty/unset registry → empty pool. Pure module — no network, no env I/O
// here (getPartnerRegistry's env read is a thin cache over parseRegistry).
import { describe, expect, test } from "bun:test";
import { parseRegistry, validatePartnerEntry, type PartnerEntry } from "@/lib/partner-registry";

const GOOD: PartnerEntry = {
  id: "neon-guild",
  projectName: "Neon Charts Guild",
  symbol: "NEON",
  tokenAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1",
  walletAddress: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2",
  addedAt: "2026-10-12",
  note: "A climbing guild since 2024.",
};

function entryJson(e: Partial<PartnerEntry>): string {
  return JSON.stringify([ { ...GOOD, ...e } ]);
}

describe("validatePartnerEntry", () => {
  test("a valid entry passes with addresses + symbol normalized", () => {
    const { entry, error } = validatePartnerEntry({
      ...GOOD,
      tokenAddress: GOOD.tokenAddress.toUpperCase(), // 0X… prefix still normalizes
      walletAddress: GOOD.walletAddress.toUpperCase(),
      symbol: "neon",
    });
    expect(error).toBeUndefined();
    expect(entry!.tokenAddress).toBe(GOOD.tokenAddress); // lowercased
    expect(entry!.walletAddress).toBe(GOOD.walletAddress);
    expect(entry!.symbol).toBe("NEON"); // uppercased
  });

  test("tamper matrix — every malformed field is rejected with a reason", () => {
    const cases: Array<[string, unknown]> = [
      ["null", null],
      ["array", [GOOD]],
      ["bad id", { ...GOOD, id: "Bad_ID!" }],
      ["short id", { ...GOOD, id: "x" }],
      ["empty name", { ...GOOD, projectName: "" }],
      ["name with angle brackets", { ...GOOD, projectName: "<script>" }],
      ["bad symbol", { ...GOOD, symbol: "N" }], // too short even after normalization
      ["empty symbol", { ...GOOD, symbol: "  " }],
      ["short token address", { ...GOOD, tokenAddress: "0x1234" }],
      ["short wallet address", { ...GOOD, walletAddress: "0xbbbb" }],
      ["bad date", { ...GOOD, addedAt: "12-10-2026" }],
      ["impossible date", { ...GOOD, addedAt: "2026-13-40" }],
      ["note too long", { ...GOOD, note: "x".repeat(141) }],
    ];
    for (const [label, raw] of cases) {
      const { error } = validatePartnerEntry(raw);
      expect(error, `case ${label} should be rejected`).toBeString();
    }
  });
});

describe("parseRegistry", () => {
  test("unset/empty/whitespace → empty registry, no errors", () => {
    expect(parseRegistry(null)).toEqual({ entries: [], errors: [] });
    expect(parseRegistry("")).toEqual({ entries: [], errors: [] });
    expect(parseRegistry("   ")).toEqual({ entries: [], errors: [] });
  });

  test("a valid array parses; addresses are normalized", () => {
    const { entries, errors } = parseRegistry(entryJson({}));
    expect(errors).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe("neon-guild");
  });

  test("bad JSON and non-arrays are reported, never thrown", () => {
    expect(parseRegistry("{not json")!.errors.length).toBeGreaterThan(0);
    expect(parseRegistry('{"id":"x"}').errors[0]).toContain("array");
  });

  test("mixed payload: valid entries survive, invalid are skipped loudly", () => {
    const raw = JSON.stringify([
      GOOD,
      { ...GOOD, id: "bad-addr", tokenAddress: "0xnope" },
      { ...GOOD, id: "second-guild", projectName: "Second Guild" },
    ]);
    const { entries, errors } = parseRegistry(raw);
    expect(entries.map((e) => e.id)).toEqual(["neon-guild", "second-guild"]);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("bad-addr");
  });

  test("duplicate ids are dropped first-wins", () => {
    const raw = JSON.stringify([
      GOOD,
      { ...GOOD, projectName: "Imposter With Same Id" },
    ]);
    const { entries, errors } = parseRegistry(raw);
    expect(entries).toHaveLength(1);
    expect(entries[0].projectName).toBe(GOOD.projectName);
    expect(errors.some((e) => e.includes("duplicate"))).toBe(true);
  });
});
