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

// 2026-10-16 — Privy lane (build-time flag, inlined for the edge runtime):
// when NEXT_PUBLIC_PRIVY_APP_ID is set the chip uses Privy (embedded-wallet
// auth), so the CSP must admit exactly Privy's auth/config hosts, the
// embedded-wallet iframe hosts, and WalletConnect's relay/modal hosts.
// Flag absent = byte-identical legacy CSP (no Privy origins, no loosening).
const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
const PRIVY_CONNECT = PRIVY_APP_ID
  ? " https://auth.privy.io https://api.privy.io wss://relay.walletconnect.com https://relay.walletconnect.com"
  : "";
const PRIVY_FRAMES = PRIVY_APP_ID
  ? ["frame-src https://privy-io.web.app https://auth.privy.io https://verify.walletconnect.com https://iframe.walletconnect.com"]
  : [];
const PRIVY_IMG = PRIVY_APP_ID ? " https://api.privy.io https://auth.privy.io" : "";

export function middleware(req: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    // strict-dynamic + nonce: Next's flight bootstrap carries the nonce; any
    // script it loads inherits trust. Dev needs 'unsafe-eval' (React refresh).
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    // fontshare stylesheet + font files are first-party brand assets loaded cross-origin
    "style-src 'self' 'unsafe-inline' https://api.fontshare.com",
    `connect-src 'self' ${SENTRY_INGEST}${PRIVY_CONNECT}`,
    `img-src 'self' data: blob:${PRIVY_IMG}`,
    // fontshare: the stylesheet is api.fontshare.com, the font binaries load from cdn.fontshare.com
    "font-src 'self' data: https://api.fontshare.com https://cdn.fontshare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    // Privy embedded-wallet iframe + WalletConnect modal frames (flag-gated above).
    ...PRIVY_FRAMES,
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
