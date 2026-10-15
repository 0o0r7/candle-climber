"use client";

// 2026-10-16 — WalletChip dispatcher (Privy lane switch).
// · NEXT_PUBLIC_WALLET_ENABLED absent/off → nothing renders (launch-day
//   contract, unchanged).
// · Flag on + NO NEXT_PUBLIC_PRIVY_APP_ID → legacy injected-wallet lane
//   (WalletChipInjected) — byte-identical to the pre-2026-10-16 behavior.
// · Flag on + Privy App ID → Privy lane (WalletChipPrivy): email/wallet
//   sign-in with an embedded EVM wallet (founder ask #3 / Spotlight form:
//   "third-party like Privy OK") — no injected wallet ever required.
// Both lanes are code-split (next/dynamic, ssr:false): the Privy SDK chunk is
// never downloaded on the legacy path, and vice versa. Laws untouched: the
// chip is display-only in BOTH lanes (docs/ECONOMY-LAWS.md).

import dynamic from "next/dynamic";

const PrivyChip = dynamic(() => import("./WalletChipPrivy"), { ssr: false });
const InjectedChip = dynamic(() => import("./WalletChipInjected"), { ssr: false });

export default function WalletChip() {
  if (process.env.NEXT_PUBLIC_WALLET_ENABLED !== "on") return null;
  if (process.env.NEXT_PUBLIC_PRIVY_APP_ID) return <PrivyChip />;
  return <InjectedChip />;
}
