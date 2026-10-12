// LU-1: Cloudflare Turnstile — optional bot prevention for the guest lane.
// When TURNSTILE_SECRET_KEY is set, guest-lane leaderboard POSTs must carry a
// valid Turnstile token (verified server-side via the siteverify endpoint).
// When unset, verification is skipped entirely — the app boots and works with
// zero config, same as every other optional integration in this repo.
//
// Turnstile is free (1M req/month) and invisible to the user (no CAPTCHA UX),
// making it the cheapest effective defense against automated guest-board
// flooding. The client renders the widget only when NEXT_PUBLIC_TURNSTILE_SITE_KEY
// is present; the server verifies only when TURNSTILE_SECRET_KEY is present.
import { captureError } from "@/lib/telemetry";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True when Turnstile is configured (server-side secret present). */
export function isTurnstileEnabled(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

/**
 * Verify a Turnstile token against Cloudflare's siteverify API.
 * Returns true on success, false on any failure (fail-closed: when enabled,
 * a missing/invalid token is rejected; when NOT enabled, always true).
 *
 * `remoteip` is forwarded when available for Cloudflare's IP-based signals.
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteip?: string,
): Promise<boolean> {
  // When not configured, skip — the app works without Turnstile
  if (!isTurnstileEnabled()) return true;
  // When configured but token missing → reject (fail-closed)
  if (!token || typeof token !== "string") return false;

  try {
    const form = new FormData();
    form.append("secret", process.env.TURNSTILE_SECRET_KEY as string);
    form.append("response", token);
    if (remoteip) form.append("remoteip", remoteip);

    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: form,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    // Network error talking to Cloudflare — fail-open (don't block play on
    // an infra blip; the rate limiter + nonce + anomaly detection still hold)
    captureError(err, { component: "turnstile", op: "siteverify" });
    return true;
  }
}
