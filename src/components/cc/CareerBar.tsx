"use client";

// P0.7 CAREER bar — the visible half of the meta-progression lane.
// Presentation only: it reads a Career (lib/career.ts) and draws rank + progress.
// Never rendered on a surface that implies a gameplay advantage; XP is cosmetic.

import { rankFor, type Career } from "@/lib/career";

export default function CareerBar({ career, gained }: { career: Career; gained?: number }) {
  const rank = rankFor(career.xp);
  const pct = Math.round(rank.share * 100);
  return (
    <div className="cc-career">
      <div className="cc-career-row">
        <span className="cc-career-rank">
          LV {rank.level} · {rank.name}
        </span>
        <span className="cc-career-xp">
          {career.xp.toLocaleString()} XP
          {gained ? <b> +{gained.toLocaleString()}</b> : null}
        </span>
      </div>
      <div
        className="cc-career-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={rank.next ? `Progress to ${rank.next}` : "Maximum rank reached"}
      >
        <i style={{ width: `${pct}%` }} />
      </div>
      <div className="cc-career-next">
        {rank.next ? `${rank.next} IN ${rank.toNext.toLocaleString()} XP` : "MAX RANK · THE CHART IS YOURS"}
      </div>
    </div>
  );
}
