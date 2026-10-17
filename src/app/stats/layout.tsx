import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Your Stats — Candle Climber",
  description:
    "Per-device lifetime stats for Candle Climber — honest local data from this browser only.",
  robots: { index: false },
};

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
