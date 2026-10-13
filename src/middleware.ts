// G5 prelaunch hardening (closes DELIVERY-READINESS §5 D-7): strict CSP with
// per-request nonces. The app has ZERO app-authored inline scripts, no eval,
// no third-party script CDNs (wallet layer is the injected window.ethereum
// provider) — the only inline script is Next's own RSC flight bootstrap,
// which Next nonces automatically when middleware sets a nonce header.
// Sentry's client needs connect-src to its ingest host; shadcn's chart
// component injects a static <style>, hence style-src 'unsafe-inline'
// (styles only — no script exposure; the unused chart is not imported).
// canvas/game rendering needs nothing beyond 'self'.
import { NextResponse, type NextRequest } from "next/server";

const SENTRY_INGEST = "https://o4512112704028672.ingest.us.sentry.io";

export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    // strict-dynamic + nonce: Next's flight bootstrap carries the nonce; any
    // script it loads inherits trust. Dev needs 'unsafe-eval' (React refresh).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'", // shadcn chart <style> injection (static config, no user input)
    `connect-src 'self' ${SENTRY_INGEST}`,
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    // Deployments on Vercel already ship HSTS at the platform; this covers self-host.
    "upgrade-insecure-requests",
  ].join("; ");

  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-nonce", nonce);
  reqHeaders.set("content-security-policy", csp);

  const res = NextResponse.next({ request: { headers: reqHeaders } });
  res.headers.set("content-security-policy", csp);
  return res;
}

export const config = {
  // All app routes + pages; Next static assets under /_next already carry
  // self-hosted origins. Excluding /_next/static keeps the nonce off cached
  // immutable assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
