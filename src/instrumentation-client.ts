// Client-side Sentry init (Next.js 15+ / Turbopack entry — replaces sentry.client.config.ts).
import * as Sentry from "@sentry/nextjs";

const DSN =
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  "https://059663a5fc68fe45cbcf425ebaaea26e@o4512112704028672.ingest.us.sentry.io/4512177773608960";

Sentry.init({
  dsn: DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || (process.env.NODE_ENV === "production" ? "production" : "development"),
  // Performance: 10% of navigations/transactions — enough signal for a canvas game, low noise.
  tracesSampleRate: 0.1,
  // Session Replay: full replay ONLY when an error occurs (canvas itself is not recorded,
  // but the DOM UI — panels, leaderboard, death card — is). Zero session-weight otherwise.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  integrations: [Sentry.replayIntegration()],
  // v11 privacy group — equivalent of the old sendDefaultPii:false
  dataCollection: { userInfo: false, cookies: false },
  // Third-party wallet-extension noise (2026-10-31 Sentry investigation, issue
  // 13b746954f37470ab773d12a57d57669 "Failed to connect to MetaMask"): these
  // rejections originate INSIDE the injected provider / its SDK connector —
  // e.g. MetaMask's own SDK literally catches and ignores this exact error
  // ("Ignore error if metamask extension not found", metamask-sdk
  // setupExtensionPreferences.ts) — on devices where the extension/app session
  // is missing or torn down mid-handshake (Chrome Mobile has no extensions at
  // all). The wallet lane is cosmetic-only (ECONOMY-LAWS): none of these can
  // affect gameplay, scores or rank, so they are observability noise, not app
  // errors. Same filter pattern ships in kortix-ai/suna, gitroomhq/postiz-app,
  // kody-hq/kody sentry browser configs. Strings = substring match in
  // @sentry/javascript v11. No gameplay/sign-in path is filtered here.
  ignoreErrors: [
    "MetaMask extension not found",
    "Failed to connect to MetaMask",
    // Extension reloaded/updated mid-session → its old inpage script is orphaned.
    "Extension context invalidated",
  ],
});

// App Router navigation instrumentation (required by @sentry/nextjs v11)
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
