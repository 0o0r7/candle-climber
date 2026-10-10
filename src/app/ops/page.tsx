// /ops — E4.1 economy dashboard v0 (ECONOMY-CHECKLIST: "one internal page").
// Server-rendered aggregates ONLY: counts, wei, percentages, opaque ref stamps.
// No names, no addresses, no keys — nothing here is personal data, and the page
// is noindex. Every read is fail-open: a dead source renders "n/a", never a
// wrong number (ECONOMY-SPEC §8 honesty rule applies to ops surfaces too).
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getBoard } from "@/lib/leaderboard-store";
import { getWeights } from "@/lib/weights-store";
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
      <table style={{ borderCollapse: "collapse", fontSize: 14 }}>{children}</table>
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

      <p style={{ color: "#777", fontSize: 12, marginTop: 32 }}>
        runbook: docs/council/2026-10-10-GRADUATION-RUNBOOK.md · laws: docs/ECONOMY-LAWS.md ·
        metrics definitions: docs/ECONOMY-CHECKLIST.md (E4.2)
      </p>
    </main>
  );
}
