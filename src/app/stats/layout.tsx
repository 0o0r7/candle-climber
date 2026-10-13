import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Stats — Candle Climber",
  description:
    "Per-device lifetime stats for Candle Climber — honest local data from this browser only.",
  // G5 (Lighthouse is-crawlable): this is a linked public page with an honest
  // description — the old blanket noindex was a crawl inconsistency (nav-link
  // to a blocked page). The page content is per-device local by design.
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
