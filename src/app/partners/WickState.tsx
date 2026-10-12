"use client";

// WickState — the "$WICK is live" strip on /partners: the direct trade link,
// the live graduation meter, and the exact figures the partner gate uses.
// Data: /api/wick/state (public aggregate, 1h-cached reader, 5min CDN cache).
// Honesty rules (LAW 4): the meter is labeled with its source, the price is
// labeled display vs realizable, and a failed read renders honestly ("n/a")
// — never a placeholder promise.
import { useEffect, useState } from "react";

interface WickStateShape {
  ok: boolean;
  lifecycle: string | null;
  graduated: boolean | null;
  meterPct: number;
  priceEthWad: string | null;
  realizablePriceEthWad: string | null;
  source: string | null;
  poolId: string | null;
  curvePhaseMinUnits: string;
  tradeUrl: string;
  error: string | null;
}

function wadToGwei(wad: string | null): string | null {
  if (!wad) return null;
  const n = Number(wad);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (n / 1e9).toFixed(3); // 1e9 wad = 1 gwei — curve prices are gwei-scale
}

function fmtTokens(units: string): string {
  const n = Number(units) / 1e18;
  if (!Number.isFinite(n)) return units;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function WickState() {
  const [state, setState] = useState<WickStateShape | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/wick/state")
      .then((r) => r.json())
      .then((j: WickStateShape) => {
        if (alive) setState(j);
      })
      .catch(() => {
        if (alive) setState(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  const displayGwei = wadToGwei(state?.priceEthWad ?? null);
  const realizableGwei = wadToGwei(state?.realizablePriceEthWad ?? null);

  return (
    <section className="mt-8 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.04] p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-white">$WICK is live</h2>
        <a
          href={state?.tradeUrl ?? "https://testnet.vibevibe.fun/token/0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c"}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-emerald-400"
        >
          Buy / trade $WICK ↗
        </a>
      </div>
      <p className="mt-2 text-sm text-white/60">
        Launched 2026-10-05 on the vibe launchpad (launch #5963). The direct
        buy/trade page for the token is linked above — that is also where a
        partner wallet buys the curve position the gate below asks for.
      </p>
      <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <dt className="text-xs uppercase tracking-wide text-white/40">Graduation meter</dt>
          <dd className="mt-1 text-white">
            {state ? (
              state.ok ? (
                state.graduated
                  ? "100% — GRADUATED · DEX pool trading"
                  : `${state.meterPct.toFixed(2)}% of the 4 ETH cap`
              )
              : "n/a (feed down — honest gap)"
            ) : (
              "…"
            )}
          </dd>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <dt className="text-xs uppercase tracking-wide text-white/40">
            {state?.graduated ? "DEX pool price (display)" : "Curve price (display)"}
          </dt>
          <dd className="mt-1 text-white">
            {displayGwei ? `${displayGwei} gwei / $WICK` : "n/a"}
            {realizableGwei && (
              <span className="block text-xs text-white/40">realizable ≈ {realizableGwei} gwei (after worst-case sell fees)</span>
            )}
          </dd>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
          <dt className="text-xs uppercase tracking-wide text-white/40">
            {state?.graduated ? "Post-graduation gate" : "Curve-phase gate"}
          </dt>
          <dd className="mt-1 text-white">
            {state?.graduated
              ? "1.25 ETH of $WICK value at the realizable price"
              : `${fmtTokens(state?.curvePhaseMinUnits ?? "19600000000000000000000000")} $WICK held`}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-white/40">
        {state?.source === "dex-pool"
          ? "Source: the launch's own V4 pool, read live on-chain (PoolManager slot0); sell-fee haircut measured from the platform's own fee events. "
          : "Source: the launch platform's own public feed and its own curve formula, cross-checked against the on-chain reserve on every read. "}
        {state?.source === "env-override" ? "Owner-verified price override active. " : ""}
        {state?.poolId ? `Pool ${state.poolId.slice(0, 10)}…${state.poolId.slice(-6)}. ` : ""}
        Testnet — no real funds.
      </p>
    </section>
  );
}
