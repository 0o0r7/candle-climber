"use client";

// PartnerPool — the live PUBLIC view of the partner-chart pool.
// Reads /api/partners/pool (aggregate-only: registry + live gates, zero
// application PII) and renders it honestly:
//   · listed partners (verified hold + ready feed) with their on-chain hold
//     wallet so anyone can verify independently
//   · an honest empty state in v0 — the pool opens when the first curated
//     partners are approved, and this page says exactly that
// Red lines (council 2026-10-12): free for all players; no buy surface here.
import { useEffect, useState } from "react";

interface PoolPartner {
  id: string;
  projectName: string;
  symbol: string;
  walletAddress: string;
  note?: string | null;
  status: string;
  meets: boolean | null;
  feedReady: boolean;
  listed: boolean;
  reason?: string | null;
}

interface PoolResp {
  ok?: boolean;
  updatedAt?: string;
  count?: number;
  listedCount?: number;
  partners?: PoolPartner[];
}

const shortAddr = (a: string) => (a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a);

export default function PartnerPool() {
  const [pool, setPool] = useState<PoolResp | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/partners/pool")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j: PoolResp) => { if (alive) setPool(j); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const partners = pool?.partners ?? [];
  const listed = partners.filter((p) => p.listed);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-white">The pool today</h2>
      {failed && (
        <p className="mt-2 text-sm text-white/50">
          The pool status is temporarily unavailable — it only ever reflects live on-chain checks.
        </p>
      )}
      {!failed && pool === null && <p className="mt-2 text-sm text-white/40">checking the pool…</p>}
      {!failed && pool !== null && listed.length === 0 && (
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          No partner charts are listed yet. The pool opens when the first communities are approved —
          every listing will appear here with its on-chain hold wallet, so anyone can verify that
          the requirement is genuinely met. Nothing in this pool is ever bought: a listing exists
          only while the verified hold and a live token feed are both real.
        </p>
      )}
      {listed.length > 0 && (
        <ul className="mt-3 space-y-2">
          {listed.map((p) => (
            <li key={p.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-semibold text-white">
                  {p.projectName} <span className="text-white/50">({p.symbol})</span>
                </span>
                <span className="font-mono text-xs text-emerald-300">LISTED · free for all players</span>
              </div>
              {p.note && <p className="mt-1 text-white/60">{p.note}</p>}
              <p className="mt-1 font-mono text-xs text-white/40">
                hold wallet: {shortAddr(p.walletAddress)} · verified on-chain · feed live
              </p>
            </li>
          ))}
        </ul>
      )}
      {!failed && pool !== null && partners.length > listed.length && (
        <p className="mt-3 text-xs text-white/40">
          {partners.length - listed.length} application(s) in review or below the live threshold — status is checked on-chain, never assumed.
        </p>
      )}
    </section>
  );
}
