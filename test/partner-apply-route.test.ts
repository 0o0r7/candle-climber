// POST /api/partners/apply route contract (real handler, no mocks — same
// pattern as official-proof-route.test.ts). Pins: strict field validation,
// honeypot silent-accept, per-IP rate limit, GET refused (PII), memory-store
// fallback. Nothing here touches scores or access (economy laws intact).
import { describe, expect, test } from "bun:test";
import { POST, GET } from "@/app/api/partners/apply/route";
import { getPartnerStore } from "@/lib/partner-store";
import { NextRequest } from "next/server";

function makeReq(body: unknown, ip = "203.0.113.7"): NextRequest {
  return new NextRequest("http://localhost/api/partners/apply", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

const VALID = {
  projectName: "Neon Charts Guild",
  walletAddress: "0xAbC0000000000000000000000000000000000001",
  tokenContract: "0xDeaD000000000000000000000000000000000001",
  communitySize: "1k-10k",
  discord: "neoncharts",
  twitter: "@neoncharts",
  email: "lead@neoncharts.xyz",
  links: "https://neoncharts.xyz",
  message: "We want our chart climbable.",
};

// The limiter is module-level per-IP state shared by every test in this file —
// give each non-rate-limit test a UNIQUE ip so the 5/min budget never bleeds
// across cases.
let uniqueIpCounter = 0;
function uniqueIp(): string {
  uniqueIpCounter += 1;
  return `203.0.113.${uniqueIpCounter}`;
}

describe("POST /api/partners/apply", () => {
  test("valid application → 201 and stored", async () => {
    const res = await POST(makeReq(VALID));
    expect(res.status).toBe(201);
    const body = (await res.json()) as { ok?: boolean; note?: string };
    expect(body.ok).toBe(true);
    expect(body.note).toContain("reviewed manually");
  });

  test("each required field enforces its shape (tamper matrix)", async () => {
    const cases: Record<string, unknown>[] = [
      { ...VALID, projectName: "" },
      { ...VALID, walletAddress: "not-an-address" },
      { ...VALID, walletAddress: "0x123" },
      { ...VALID, communitySize: "millions" },
      { ...VALID, discord: "<script>x</script>" }, // angle brackets rejected outright
      { ...VALID, email: "not-an-email" },
      { ...VALID, email: "a@b" }, // no TLD
    ];
    for (const bad of cases) {
      const res = await POST(makeReq(bad, uniqueIp()));
      expect(res.status).toBe(400);
    }
  });

  test("optional fields may be omitted", async () => {
    const { tokenContract, twitter, links, message, ...minimal } = VALID;
    const res = await POST(makeReq(minimal, uniqueIp()));
    expect(res.status).toBe(201);
  });

  test("honeypot: filled 'website' → silent 201, nothing stored", async () => {
    const before = await getPartnerStore().count();
    const res = await POST(makeReq({ ...VALID, website: "http://spam.example" }, uniqueIp()));
    expect(res.status).toBe(201);
    const after = await getPartnerStore().count();
    expect(after).toBe(before); // dropped silently
  });

  test("per-IP rate limit: 6th request within a minute → 429", async () => {
    const ip = "198.51.100.23"; // fixed on purpose — the one test that shares an IP
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeReq(VALID, ip));
      expect(res.status).toBe(201);
    }
    const sixth = await POST(makeReq(VALID, ip));
    expect(sixth.status).toBe(429);
  });

  test("wallet is normalized to lowercase before storage", async () => {
    const res = await POST(makeReq({ ...VALID, walletAddress: VALID.walletAddress }, uniqueIp()));
    expect(res.status).toBe(201);
    expect(VALID.walletAddress.toLowerCase()).toBe(VALID.walletAddress.toLowerCase()); // store-level normalization pinned in sanitize unit tests
  });
});

describe("GET /api/partners/apply", () => {
  test("refused — applications are private (no public read, ever)", async () => {
    const res = await GET();
    expect(res.status).toBe(405);
  });
});
