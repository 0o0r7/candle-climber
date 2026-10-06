"use client";

// P4.2 (E2) — WalletChip: connect + cosmetic $WICK balance badge.
// STRICTLY display-only: this component never writes score, rank, or access.
// Laws: docs/ECONOMY-LAWS.md · copy rules: WICK-LAUNCH-FORM-PACK §8 (no earnings
// verbs, no value promises — the badge is an identity sticker, nothing more).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ROBINHOOD_CHAIN_ID,
  WALLET_ADDRESS_KEY,
  balanceToTier,
  formatWick,
  isValidAddress,
  type WalletTier,
} from "@/lib/wallet";

type EthProvider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type ChipState = "idle" | "busy" | "wrongnet" | "rpcdown";

export default function WalletChip() {
  // Launch-day default: wallet layer fully INERT unless explicitly enabled
  // (contract in .env.example — absent flag = no chip, no calls, no UI).
  // NOTE: the flag check happens AFTER all hooks (Rules of Hooks) — hooks stay
  // unconditional; only the render output is gated.
  const enabled = process.env.NEXT_PUBLIC_WALLET_ENABLED === "on";
  const [addr, setAddr] = useState<string | null>(null);
  const [wei, setWei] = useState<bigint | null>(null);
  const [tier, setTier] = useState<WalletTier>("none");
  const [state, setState] = useState<ChipState>("idle");
  const [hasProvider, setHasProvider] = useState(false);
  const queried = useRef<string | null>(null);

  const query = useCallback(async (a: string) => {
    if (queried.current === a) return; // mount-race guard
    queried.current = a;
    setState("busy");
    try {
      const r = await fetch("/api/wallet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ address: a }),
      });
      const j = await r.json();
      if (j?.ok) {
        const w = BigInt(j.balance ?? "0");
        setWei(w);
        setTier(balanceToTier(w));
        setState("idle");
      } else {
        setState("rpcdown");
      }
    } catch {
      setState("rpcdown");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    // provider/localStorage reads are async callbacks (react-hooks: no sync
    // setState in effect body) — mount-time one-shot, not a subscription.
    void (async () => {
      const eth = (window as unknown as { ethereum?: EthProvider }).ethereum;
      const saved = localStorage.getItem(WALLET_ADDRESS_KEY);
      if (alive) setHasProvider(!!eth);
      if (alive && isValidAddress(saved)) {
        setAddr(saved);
        void query(saved);
      }
    })();
    return () => {
      alive = false;
    };
  }, [query]);

  const connect = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: EthProvider }).ethereum;
    if (!eth || state === "busy") return;
    setState("busy");
    try {
      const accounts = (await eth.request({ method: "eth_requestAccounts" })) as string[];
      const chain = (await eth.request({ method: "eth_chainId" })) as string;
      if (parseInt(chain, 16) !== ROBINHOOD_CHAIN_ID) {
        setState("wrongnet");
        return;
      }
      const a = accounts?.[0];
      if (!isValidAddress(a)) {
        setState("idle");
        return;
      }
      localStorage.setItem(WALLET_ADDRESS_KEY, a);
      queried.current = null;
      setAddr(a);
      await query(a);
    } catch {
      setState("idle"); // user rejected — stay quiet, play continues
    }
  }, [query, state]);

  if (!enabled) return null;

  // No injected provider (most testnet visitors): render nothing, keep footer clean.
  if (!hasProvider && !addr) return null;

  if (state === "wrongnet") {
    return (
      <button
        type="button"
        className="cc-chip cc-wallet-chip"
        onClick={connect}
        title="Switch your wallet to Robinhood Chain testnet (46630) — cosmetic badge only, never affects rank."
      >
        WRONG NETWORK
      </button>
    );
  }
  if (state === "rpcdown") {
    return (
      <span className="cc-chip cc-wallet-chip" title="Balance feed unavailable — badge offline, play and scores unaffected.">
        $WICK · OFFLINE
      </span>
    );
  }
  if (!addr || wei === null) {
    return hasProvider ? (
      <button
        type="button"
        className="cc-chip cc-wallet-chip"
        onClick={connect}
        title="Connect to show your $WICK balance badge — display-only, never affects rank (ECONOMY-LAWS)."
      >
        {state === "busy" ? "WALLET…" : "CONNECT WALLET"}
      </button>
    ) : null;
  }

  const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  const label = tier === "whale" ? "WICK WHALE" : tier === "holder" ? "WICK HOLDER" : "NO TIER YET";
  const tip =
    "Display-only $WICK badge · holder value is cosmetic (routes/archive) and never changes rank or access — ECONOMY-LAWS.";
  return (
    <span className={`cc-chip cc-wallet-chip cc-tier-${tier}`} title={tip}>
      {tier !== "none" ? <b>{label}</b> : null} {formatWick(wei)} <i>{short}</i>
    </span>
  );
}
