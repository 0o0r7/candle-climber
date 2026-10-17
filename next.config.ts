import { execSync } from "node:child_process";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone output is for self-hosted/sandbox production runs (`bun run
  // build:standalone` + `bun run start`). On Vercel the platform runtime is
  // used instead — keep the default output there.
  output: process.env.VERCEL ? undefined : "standalone",
  typescript: {
    // AUDIT F7: build must be authoritative for type safety (CI runs tsc too,
    // but a red build locally should stop the ship).
    ignoreBuildErrors: false,
  },
  // Delivery hardening (2026-10-13): baseline security headers on every route.
  // Deliberately NO strict CSP yet — the game canvas and Sentry inject inline
  // scripts; a nonce-based CSP is a follow-up, not a ship blocker.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
  // Base44 sandbox preview: the app is served through a proxy on a different
  // origin (https://3000-<suffix>) and a different Host header, so Next's dev
  // server must allow those for /_next/* dev assets and HMR. Applied ONLY when
  // BASE44_PREVIEW_MODE === "1" (the platform sets it in the sandbox); with the
  // flag unset or any other value the config is unchanged.
  ...(process.env.BASE44_PREVIEW_MODE === "1"
    ? {
        allowedDevOrigins: [
          ...(process.env.BASE44_PUBLIC_HOST_SUFFIX
            ? [`3000-${process.env.BASE44_PUBLIC_HOST_SUFFIX}`]
            : []),
          ...(process.env.BASE44_SANDBOX_HOST_DOMAIN
            ? [`.${process.env.BASE44_SANDBOX_HOST_DOMAIN}`]
            : []),
        ],
      }
    : {}),
  reactStrictMode: false,
  // Emit client-side source maps so @sentry/nextjs can upload them (Next 16
  // does NOT emit .map for client chunks by default — without this the Sentry
  // upload ran with 0 client files and stack traces were minified).
  productionBrowserSourceMaps: true,
};

// Release identity must be identical at build time (sourcemap upload) and
// runtime (event attribution). Vercel provides VERCEL_GIT_COMMIT_SHA; local
// builds fall back to git rev-parse; explicit SENTRY_RELEASE always wins.
const GIT_SHA = (() => {
  try {
    // stderr suppressed: where git is absent (e.g. the sandbox dev image) the
    // shell would otherwise print "/bin/sh: git: not found" on every startup.
    return execSync("git rev-parse HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown-release";
  }
})();
const SENTRY_RELEASE_NAME =
  process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA || GIT_SHA;

export default withSentryConfig(nextConfig, {
  // Sentry CI wiring — org/project created 2026-10-01 (docs/INFRASTRUCTURE.md §Sentry).
  // authToken comes from SENTRY_AUTH_TOKEN (local .env / Vercel env); without it the
  // build still passes and only skips source-map upload with a warning.
  org: "james-thomas-st",
  project: "candle-climber",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Explicit release: without this the bundler plugin could not resolve a
  // release name on Vercel and silently skipped the source-map upload
  // (release 42078f9 landed with 0 artifacts on 2026-10-01).
  release: { name: SENTRY_RELEASE_NAME },
  telemetry: false,
  // loud so Vercel build logs show the upload outcome (evidence for O7)
  silent: false,
  debug: process.env.SENTRY_DEBUG === "1",
  widenClientFileUpload: true,
});
