// /ops — E4.1 economy dashboard v0 (ECONOMY-CHECKLIST: "one internal page").
// Server-rendered aggregates ONLY: counts, wei, percentages, opaque ref stamps.
// No names, no addresses, no keys — nothing here is personal data, and the page
// is noindex. Every read is fail-open: a dead source renders "n/a", never a
// wrong number (ECONOMY-SPEC §8 honesty rule applies to ops surfaces too).
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getBoard } from "@/lib/leaderboard-store";
import { getWeights } from "@/lib/weights-store";
import { getScoreReports } from "@/lib/score-report-store"; // LU-15 review queue
import { detectAnomalies } from "@/lib/anomaly-detection"; // LU-7 live flags
import { fetchBurnedWick } from "@/lib/burn";
import { fetchMeter, ethHuman } from "@/lib/meter";
import { graduationState, weightsFrozen, POST_GRAD_LANES } from "@/lib/graduation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Candle Climber — ops",
  robots: { index: false, follow: false },
};

const NA = "n/a";

function Row({ k, v, note }: { k: string; v: string; note?: string }) {
  return (
    <tr>
      <td style={{ padding: "4px 12px 4px 0", whiteSpace: "nowrap", color: "#888" }}>{k}</td>
      <td style={{ padding: "4px 0", fontWeight: 600 }}>{v}</td>
      <td style={{ padding: "4px 0", color: "#999", fontSize: 12 }}>{note ?? ""}</td>
    </tr>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 15, marginBottom: 6, borderBottom: "1px solid #333", paddingBottom: 4 }}>{title}</h2>
      {/* sweep 4 (2026-10-14): rows MUST live in a <tbody> — bare <tr> under
          <table> is invalid HTML and broke React hydration on this page */}
      <table style={{ borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>{children}</tbody>
      </table>
    </section>
  );
}

export default async function OpsPage() {
  const now = Date.now();
  const [meter, burn, laneS, wStats, grad] = await Promise.all([
    fetchMeter(),
    fetchBurnedWick(),
    getBoard().laneStats(now),
    getWeights().stats(now),
    graduationState(now),
  ]);

  // LU-15/LU-7 moderation surfaces — fail-open: any failure renders "n/a",
  // never a wrong number (ECONOMY-SPEC §8 applies to ops surfaces too).
  let reports: Awaited<ReturnType<ReturnType<typeof getScoreReports>["recent"]>> = [];
  let reportStore = NA;
  let flaggedGuest = NA;
  let flaggedOfficial = NA;
  try {
    const rs = getScoreReports();
    reports = await rs.recent(10);
    reportStore = rs.kind;
  } catch { /* fail-open */ }
  try {
    const board = getBoard();
    const g = await board.top(null, 100, "1w", "guest");
    const o = await board.top(null, 100, "1w", "official");
    flaggedGuest = String(detectAnomalies(g).size);
    flaggedOfficial = String(detectAnomalies(o).size);
  } catch { /* fail-open */ }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "32px 20px", fontFamily: "ui-monospace, monospace", color: "#ddd" }}>
      <h1 style={{ fontSize: 18, marginBottom: 4 }}>CANDLE CLIMBER — OPS / ECONOMY v0</h1>
      <p style={{ color: "#888", fontSize: 12, marginBottom: 24 }}>
        internal · noindex · aggregate counts only (E4.1) · generated {new Date(now).toISOString()}
      </p>

      <Block title="GRADUATION METER (pad API)">
        <Row k="lifecycle" v={meter.ok ? (meter.lifecycle ?? NA) : NA} note={meter.ok ? undefined : meter.error} />
        <Row k="reserve" v={meter.ok ? `${ethHuman(meter.reserveWei)} ETH` : NA} />
        <Row k="target" v={meter.ok ? `${ethHuman(meter.targetWei)} ETH` : NA} />
        <Row k="fill" v={meter.ok ? `${meter.pct.toFixed(2)}%` : NA} />
        <Row k="burned" v={burn.ok ? `${burn.burned} WICK` : NA} note={burn.ok ? "0x…dEaD balance" : "rpc-unavailable"} />
      </Block>

      <Block title="GRADUATION GATE (E6.2)">
        <Row k="graduated" v={String(grad.graduated)} note={`source: ${grad.source}`} />
        <Row k="weights frozen" v={weightsFrozen() ? "YES (snapshot window)" : "no"} note="WEIGHTS_FROZEN env" />
        <Row
          k="staged lanes"
          v={POST_GRAD_LANES.map((l) => l.id).join(", ")}
          note="all flip only after the graduation tx (E6.2)"
        />
      </Block>

      <Block title="LEADERBOARD LANES (Option B)">
        <Row k="guest rows (all-time)" v={String(laneS.guestRows)} note={`${laneS.distinctGuests} distinct names`} />
        <Row k="official records" v={String(laneS.officialRows)} note={`${laneS.distinctWallets} distinct wallets`} />
        <Row k="submissions today" v={`${laneS.todayGuest} guest · ${laneS.todayOfficial} official`} />
        <Row
          k="top refs (7d)"
          v={laneS.topRefs.length ? laneS.topRefs.map((r) => `${r.ref}:${r.count}`).join(" · ") : "(none yet)"}
          note="E5.5 attribution — Gate G5 evidence"
        />
      </Block>

      <Block title="WEIGHTS LEDGER (E2.2–E2.6)">
        <Row k="run rows" v={String(wStats.runRows)} note={`${wStats.todayRuns} today · ${wStats.weekRuns} last-7d`} />
        <Row k="event rows" v={String(wStats.eventRows)} note="practice / prediction / vault" />
        <Row k="identities" v={String(wStats.identities)} />
        <Row k="linked wallets" v={String(wStats.linkedWallets)} />
        <Row k="total points" v={String(wStats.totalPoints)} />
        <Row k="connect-rate" v={NA} note="needs analytics (SimpleAnalytics) — E4.2 defines the KPI" />
      </Block>

      <Block title="MODERATION (LU-7 anomalies + LU-15 reports)">
        <Row k="anomaly flags · guest" v={flaggedGuest} note="top-100 all-time, >2× median" />
        <Row k="anomaly flags · official" v={flaggedOfficial} note="wallet-proven lane" />
        <Row k="community reports" v={String(reports.length)} note={`store: ${reportStore} · latest below`} />
        {reports.length > 0 && (
          <tr>
            <td colSpan={3} style={{ padding: "6px 0" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 12, width: "100%" }}>
                <thead>
                  <tr style={{ color: "#888", textAlign: "left" }}>
                    <th style={{ padding: "2px 10px 2px 0" }}>when</th>
                    <th style={{ padding: "2px 10px 2px 0" }}>name</th>
                    <th style={{ padding: "2px 10px 2px 0" }}>score</th>
                    <th style={{ padding: "2px 10px 2px 0" }}>lane</th>
                    <th style={{ padding: "2px 0" }}>reason / reporter</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r, i) => (
                    <tr key={`${r.ts}-${i}`}>
                      <td style={{ padding: "2px 10px 2px 0", whiteSpace: "nowrap", color: "#888" }}>{new Date(r.ts).toISOString().slice(0, 16).replace("T", " ")}</td>
                      <td style={{ padding: "2px 10px 2px 0" }}>{r.name}</td>
                      <td style={{ padding: "2px 10px 2px 0" }}>{r.score.toLocaleString()}</td>
                      <td style={{ padding: "2px 10px 2px 0", color: "#888" }}>{r.board}{r.date ? ` · ${r.date}` : ""}</td>
                      <td style={{ padding: "2px 0", color: "#bbb" }}>{r.reason || "(no reason)"}{r.reporter ? ` — via ${r.reporter}` : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </td>
          </tr>
        )}
      </Block>

      <p style={{ color: "#777", fontSize: 12, marginTop: 32 }}>
        runbook: docs/council/2026-10-10-GRADUATION-RUNBOOK.md · laws: docs/ECONOMY-LAWS.md ·
        metrics definitions: docs/ECONOMY-CHECKLIST.md (E4.2)
      </p>
    </main>
  );
}
