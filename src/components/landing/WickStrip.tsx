"use client";

// WickStrip — the compact "$WICK is live" strip on the LANDING page.
// Delivery addition (2026-10-13): the landing previously carried zero $WICK
// facts — the launch date, the token address and the testnet disclosure lived
// only on /partners. The ecosystem review reads the landing first, so the
// same live aggregate endpoint (/api/wick/state, no PII, 5-min CDN cache)
// now feeds a one-row strip here. Same honesty rules as /partners WickState:
// every figure is labeled with its source; a failed read renders "n/a",
// never a placeholder promise. Testnet — no real funds, by law (LAW 4).
import { useEffect, useState } from "react";

interface WickStateShape {
  ok: boolean;
  graduated: boolean | null;
  meterPct: number;
  priceEthWad: string | null;
  source: string | null;
  tradeUrl: string;
  error: string | null;
}

function wadToGwei(wad: string | null): string | null {
  if (!wad) return null;
  const n = Number(wad);
  if (!Number.isFinite(n) || n <= 0) return null;
  return (n / 1e9).toFixed(3);
}

export default function WickStrip() {
  const [state, setState] = useState<WickStateShape | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/wick/state")
      .then((r) => r.json())
      .then((j: WickStateShape) => {
        if (alive) setState(j);
      })
      .catch(() => {
        /* honest empty strip on failure */
      });
    return () => {
      alive = false;
    };
  }, []);

  const gwei = wadToGwei(state?.priceEthWad ?? null);

  return (
    <section className="lp-wick-strip" aria-label="$WICK token live status">
      <div className="lp-wick-strip-title">$WICK · LIVE ON ROBINHOOD CHAIN <b>TESTNET</b> — NO REAL FUNDS</div>
      <div className="lp-wick-strip-facts">
        <span>Launched 2026-10-05 · launch #5963</span>
        <span aria-hidden>·</span>
        <span>
          Graduation meter:{" "}
          {state?.ok && Number.isFinite(state.meterPct) ? `${state.meterPct.toFixed(2)}%` : "n/a"}
        </span>
        <span aria-hidden>·</span>
        <span>
          Curve price: {gwei ? `${gwei} ETH` : "n/a"}
          {state?.source ? ` (${state.source})` : ""}
        </span>
        <span aria-hidden>·</span>
        <a
          href={state?.tradeUrl ?? "https://testnet.vibevibe.fun/token/0xe2ce0be4e3d420c1e4b5c46493b3d5e03595216c"}
          target="_blank"
          rel="noopener noreferrer"
        >
          Buy / trade $WICK ↗
        </a>
        <span aria-hidden>·</span>
        <a href="/partners">Partner lane →</a>
      </div>
      <div className="lp-wick-strip-addr">
        token 0xE2cE0Be4e3D420C1e4b5C46493b3d5e03595216c
      </div>
    </section>
  );
}
