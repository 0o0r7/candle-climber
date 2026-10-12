import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Airdrop Board — Candle Climber",
  description:
    "$WICK airdrop rehearsal board: capped weights, Merkle inclusion proofs verified in-browser. Testnet rehearsal — nothing claimable yet.",
};

export default function AirdropLayout({ children }: { children: React.ReactNode }) {
  return children;
}
