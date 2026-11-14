"use client";

// P2 — the diagnosis block on the death panel (see game/cc/death-hints.ts for
// the contract). Presentational only: every word comes from the fixed mapping,
// every position from the engine's own result + the director's sector.
import type { RunResult } from "@/game/cc/types";
import { explainDeath } from "@/game/cc/death-hints";

export default function DeathDiagnosis({
  result,
  total = 0,
}: {
  result: Pick<RunResult, "cause" | "candlesPassed">;
  /** Candles in the day's level — the director needs it for the summit band. */
  total?: number;
}) {
  const d = explainDeath(result, total);
  return (
    <div className="cc-diag" data-cause={d.cause} role="status">
      <p className="cc-diag-head">
        <b className={`cc-diag-cause cc-diag-${d.cause}`}>{d.label}</b>
        <span className="cc-diag-place">
          CANDLE {d.candle} · {d.sector}
        </span>
      </p>
      <p className="cc-diag-what">{d.what}</p>
      <p className="cc-diag-hint">
        <span className="cc-diag-next">NEXT</span> {d.hint}
      </p>
    </div>
  );
}
