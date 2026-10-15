"use client";

// 2026-10-16 — Privy lane of WalletChip (3rd-party embedded wallet).
// Founder ask #3 compliance: users sign in with EMAIL or any wallet via the
// Privy modal; an embedded EVM wallet is created for users without one, so
// nobody is required to expose their own injected wallet to this site.
// Contract parity with WalletChipInjected (same classes, same states, same
// localStorage key + cc-wallet-changed broadcast so the official lane and
// GameCanvas listeners work unchanged) — but the chip is available to EVERY
// visitor (no window.ethereum required).
// STRICTLY display-only: never writes score, rank, or access. The badge is a
// cosmetic identity sticker (ECONOMY-LAWS); balance read is server-side
// (/api/wallet) — the wallet itself is only used for the chain check.
// Laws: docs/ECONOMY-LAWS.md · copy rules: WICK-LAUNCH-FORM-PACK §8.

import { useCallback, useEffect, useRef, useState } from "react";
import { useLogin, usePrivy, useWallets } from "@privy-io/react-auth";
import {
  WALLET_ADDRESS_KEY,
  balanceToTier,
  ensureRobinhoodChain,
  formatWick,
  isValidAddress,
  type WalletTier,
} from "@/lib/wallet";

type ChipState = "idle" | "busy" | "wrongnet" | "rpcdown" | "confirm";

const WALLET_CHANGED_EVENT = "cc-wallet-changed";

export default function WalletChipPrivy() {
  const { ready, authenticated, user, logout } = usePrivy();
  const { wallets } = useWallets();
  const { login } = useLogin({
    onComplete: () => {
      // Modal finished → the effect below picks the wallet and links it.
      linkRef.current?.();
    },
  });

  const [addr, setAddr] = useState<string | null>(null);
  const [wei, setWei] = useState<bigint | null>(null);
  const [tier, setTier] = useState<WalletTier>("none");
  const [state, setState] = useState<ChipState>("idle");
  const [netMsg, setNetMsg] = useState<string | null>(null);
  const queried = useRef<string | null>(null);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const linkRef = useRef<(() => void) | null>(null);
  // Concurrency guard for link() itself — chip state must never gate the
  // linker: a "busy" left over from the connect→modal sequence would
  // otherwise freeze the chip on the WALLET… label forever (2026-10-16 fix).
  const linkBusy = useRef(false);

  const query = useCallback(async (a: string) => {
    if (queried.current === a) return;
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

  // Pick the user's wallet: embedded Privy wallet first, else linked external.
  const pickWallet = useCallback(() => {
    const embedded = wallets.find((w) => w.walletClientType === "privy");
    const w = embedded ?? wallets[0];
    const a = w?.address ?? user?.wallet?.address;
    return isValidAddress(a) ? { wallet: w, address: a } : null;
  }, [wallets, user]);

  // Link: verify the wallet sits on Robinhood Chain testnet (add/switch when
  // needed — the embedded wallet handles this without popups for most paths),
  // persist the identity key, broadcast, query the cosmetic balance.
  // Idempotent by design: fires from the login onComplete, the auth-state
  // effect and manual clicks — re-runs with the same address are no-ops.
  const link = useCallback(async () => {
    if (linkBusy.current) return;
    const picked = pickWallet();
    if (!picked) {
      // Wallets can still be hydrating right after a first login (embedded
      // wallet creation is async) — clear any pending busy so the chip stays
      // clickable instead of freezing on the WALLET… label.
      setState((s) => (s === "busy" ? "idle" : s));
      return;
    }
    if (addr === picked.address) return; // already linked
    linkBusy.current = true;
    setState("busy");
    try {
      if (picked.wallet) {
        const provider = await picked.wallet.getEthereumProvider();
        const net = await ensureRobinhoodChain(provider);
        if (!net.ok) {
          setNetMsg(net.message);
          setState("wrongnet");
          return;
        }
      }
      localStorage.setItem(WALLET_ADDRESS_KEY, picked.address);
      queried.current = null;
      setAddr(picked.address);
      window.dispatchEvent(new Event(WALLET_CHANGED_EVENT));
      await query(picked.address);
    } catch {
      setState("idle");
    } finally {
      linkBusy.current = false;
    }
  }, [addr, pickWallet, query]);
  // Keep the latest linker reachable for the login-modal onComplete callback
  // (assigned in an effect — refs must not be written during render).
  useEffect(() => {
    linkRef.current = () => void link();
  }, [link]);

  // Session restore + post-login auto-link: once Privy is ready —
  //  · authenticated → auto-link (mirrors the legacy boot restore);
  //  · not authenticated → clear any stale local identity so the official
  //    lane never outlives the actual auth state.
  // link IS in the deps on purpose: it re-runs when the wallet list hydrates
  // (pickWallet identity), covering the async embedded-wallet creation that
  // lands a beat after the login modal's onComplete. Safe: link is idempotent
  // and ref-guarded.
  useEffect(() => {
    if (!ready) return;
    if (authenticated) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- link() is async: its setStates all run after awaits, never synchronously in this effect body (same boot-restore pattern as GameCanvas)
      void link();
    } else if (localStorage.getItem(WALLET_ADDRESS_KEY)) {
      localStorage.removeItem(WALLET_ADDRESS_KEY);
      window.dispatchEvent(new Event(WALLET_CHANGED_EVENT));
    }
  }, [ready, authenticated, link]);

  const connect = useCallback(() => {
    if (!authenticated) {
      // No pre-set busy here: the Privy modal owns the pending UX. Setting
      // chip-busy before the modal and clearing it only inside link() is
      // exactly what froze the chip on WALLET… after a successful login
      // (link() early-returned on the busy guard). The modal itself blocks
      // double-opens, and link() is ref-guarded against concurrency.
      login(); // modal; onComplete → linkRef → link()
      return;
    }
    void link();
  }, [authenticated, link, login]);

  const doDisconnect = useCallback(async () => {
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = null;
    localStorage.removeItem(WALLET_ADDRESS_KEY);
    queried.current = null;
    setAddr(null);
    setWei(null);
    setTier("none");
    setNetMsg(null);
    setState("idle");
    window.dispatchEvent(new Event(WALLET_CHANGED_EVENT));
    try {
      await logout(); // Privy session end; the embedded wallet stays with the user
    } catch {
      // app-side disconnect already happened — stay quiet, play continues
    }
  }, [logout]);

  const onBadgeClick = useCallback(() => {
    if (state === "confirm") {
      void doDisconnect();
      return;
    }
    setState("confirm");
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setState("idle"), 5000);
  }, [state, doDisconnect]);

  // Not ready yet: render nothing (avoids a connect-button flash that would
  // open the modal against a half-mounted provider).
  if (!ready) return null;

  if (state === "wrongnet") {
    const tip = netMsg
      ? `Robinhood Chain testnet (46630) — ${netMsg}. Click to retry the switch/add request.`
      : "Switch your wallet to Robinhood Chain testnet (46630) — adds the network automatically if missing. Cosmetic badge only, never affects rank.";
    return (
      <button
        type="button"
        className="cc-chip cc-wallet-chip"
        onClick={() => void link()}
        title={tip}
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
    return (
      <button
        type="button"
        className="cc-chip cc-wallet-chip"
        onClick={connect}
        title="Sign in with email or a wallet — an embedded wallet is created for you if you don't have one. Display-only badge, never affects rank (ECONOMY-LAWS)."
      >
        {state === "busy" ? "WALLET…" : "CONNECT WALLET"}
      </button>
    );
  }

  const short = `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  const label = tier === "whale" ? "WICK WHALE" : tier === "holder" ? "WICK HOLDER" : "NO TIER YET";
  if (state === "confirm") {
    return (
      <button
        type="button"
        className="cc-chip cc-wallet-chip cc-wallet-disconnect"
        onClick={onBadgeClick}
        title="Click again to disconnect — the badge clears, play continues as guest (ECONOMY-LAWS)."
      >
        DISCONNECT?
      </button>
    );
  }
  const tip =
    "Display-only $WICK badge · holder value is cosmetic (routes/archive) and never changes rank or access — ECONOMY-LAWS. Click to disconnect.";
  return (
    <button
      type="button"
      className={`cc-chip cc-wallet-chip cc-tier-${tier}`}
      onClick={onBadgeClick}
      title={tip}
    >
      {tier !== "none" ? <b>{label}</b> : null} {formatWick(wei)} <i>{short}</i>
    </button>
  );
}
