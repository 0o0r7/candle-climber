// LU-1 Turnstile pins — optional-by-default, fail-closed when enabled,
// fail-open only on Cloudflare network errors (play is never blocked by an
// infra blip; the limiter + nonce + anomaly layers still hold).
import { describe, test, expect, afterEach } from "bun:test";
import { verifyTurnstileToken, isTurnstileEnabled } from "../src/lib/turnstile";

const REAL_FETCH = globalThis.fetch;
const SECRET = "test-secret-key";

afterEach(() => {
  globalThis.fetch = REAL_FETCH;
  delete process.env.TURNSTILE_SECRET_KEY;
});

describe("turnstile (LU-1)", () => {
  test("disabled by default — verification always passes, zero config", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    expect(isTurnstileEnabled()).toBe(false);
    expect(await verifyTurnstileToken(null)).toBe(true);
    expect(await verifyTurnstileToken("any-token")).toBe(true);
  });

  test("enabled + missing token → reject (fail-closed)", async () => {
    process.env.TURNSTILE_SECRET_KEY = SECRET;
    expect(isTurnstileEnabled()).toBe(true);
    expect(await verifyTurnstileToken(null)).toBe(false);
    expect(await verifyTurnstileToken(undefined)).toBe(false);
    expect(await verifyTurnstileToken("")).toBe(false);
  });

  test("enabled + valid token (Cloudflare says success) → accept", async () => {
    process.env.TURNSTILE_SECRET_KEY = SECRET;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: true }), { status: 200 })) as unknown as typeof fetch;
    expect(await verifyTurnstileToken("good-token", "1.2.3.4")).toBe(true);
  });

  test("enabled + Cloudflare says failed → reject", async () => {
    process.env.TURNSTILE_SECRET_KEY = SECRET;
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ success: false }), { status: 200 })) as unknown as typeof fetch;
    expect(await verifyTurnstileToken("bad-token")).toBe(false);
  });

  test("enabled + Cloudflare HTTP error → reject", async () => {
    process.env.TURNSTILE_SECRET_KEY = SECRET;
    globalThis.fetch = (async () => new Response("nope", { status: 500 })) as unknown as typeof fetch;
    expect(await verifyTurnstileToken("token")).toBe(false);
  });

  test("enabled + network error → fail-open (infra blip never blocks play)", async () => {
    process.env.TURNSTILE_SECRET_KEY = SECRET;
    globalThis.fetch = (async () => {
      throw new Error("network down");
    }) as unknown as typeof fetch;
    expect(await verifyTurnstileToken("token")).toBe(true);
  });
});
