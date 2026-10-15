"use client";

// 2026-10-16 — Privy auth gate (3rd-party embedded-wallet lane).
// WHY: vibe/vibe founder ask #3 ("make sure to have a 3rd party wallet like
// privy … so people don't need to connect to your site with their own wallets")
// + the Project Spotlight form whitelists exactly this pattern, and the team
// has stated untrusted (raw injected) wallet connections will not be featured.
// FLAG CONTRACT: absent NEXT_PUBLIC_PRIVY_APP_ID = children render unchanged
// and the Privy chunk is never imported at runtime (code-split: zero Privy
// bytes execute on the legacy path). Present = the provider mounts once at the
// root so WalletChip's Privy lane can consume usePrivy()/useWallets().
// Laws untouched: this gate NEVER gates gameplay — guest mode stays free and
// walletless (ECONOMY-LAWS LAW 1.2); a wallet remains an optional cosmetic /
// official-competitive identity (D4 dated note).

import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyAuthGate({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) return <>{children}</>;
  return (
    <PrivyProvider
      appId={appId}
      config={{
        // Only the methods enabled on the Privy dashboard for this app
        // (email_auth + wallet_auth are ON; everything else stays OFF there).
        loginMethods: ["email", "wallet"],
        embeddedWallets: {
          // The compliance core: an email user gets an embedded EVM wallet
          // automatically — they never need their own injected wallet to
          // participate. External-wallet users keep their linked wallet.
          ethereum: { createOnLogin: "users-without-wallets" },
        },
        appearance: { theme: "dark" },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
