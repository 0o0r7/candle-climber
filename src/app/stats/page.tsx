"use client";

// /stats — per-device lifetime stats (audit P2: a player-facing stats
// destination). Honest-local by construction: everything here is read from
// THIS browser's localStorage (ledger, best, duel tally, self-ghosts, wreck
// markers) and the page says so. The only network call is a best-effort
// official-board lookup when a wallet is linked, matched by the same masked
// short form the API returns — a missing/failed fetch is an honest empty lane.
// Guest runs stay anonymous and never appear here.
import { useEffect, useState } from "react";
import { loadLedger, type StatsLedger } from "@/lib/stats-ledger";
import { loadSelfGhostDB, SELF_GHOST_KEY } from "@/game/cc/self-ghost";
import { loadWreckDB } from "@/game/cc/wreckage";
import { parseTally, tallyLabel, EMPTY_TALLY, type DuelTally } from "@/game/cc/duel";
import { isValidAddress, shortAddress, WALLET_ADDRESS_KEY } from "@/lib/wallet";
import { utcDateStr } from "@/game/cc/rng";

const RUNS_KEY = "cc_runs_v1";
const BEST_KEY = "cc_best_v1";

interface OfficialRow {
  name: string;
  score: number;
  candlesPassed: number;
  wallet?: string | null;
}

export default function StatsPage() {
  const [ledger, setLedger] = useState<StatsLedger | null>(null);
  const [runsStarted, setRunsStarted] = useState<number | null>(null);
  const [best, setBest] = useState(0);
  const [tally, setTally] = useState<DuelTally>(EMPTY_TALLY);
  const [ghostTerrains, setGhostTerrains] = useState(0);
  const [wreckCount, setWreckCount] = useState(0);
  const [wallet, setWallet] = useState<string | null>(null);
  const [mine, setMine] = useState<OfficialRow[] | null>(null);
  const [armed, setArmed] = useState(false); // two-step local wipe

  useEffect(() => {
    try {
      setLedger(loadLedger(localStorage.getItem("cc_stats_v1")));
      setRunsStarted(Number(localStorage.getItem(RUNS_KEY) ?? 0));
      setBest(Number(localStorage.getItem(BEST_KEY) ?? 0));
      setTally(parseTally(localStorage.getItem("cc_duel_v1")));
      setGhostTerrains(Object.keys(loadSelfGhostDB(localStorage.getItem(SELF_GHOST_KEY))).length);
      setWreckCount(Object.values(loadWreckDB()).reduce((n, arr) => n + arr.length, 0));
      const w = localStorage.getItem(WALLET_ADDRESS_KEY);
      if (isValidAddress(w)) {
        setWallet(shortAddress(w));
        // best-effort: today's official lane rows for THIS wallet (masked match)
        fetch(`/api/leaderboard?date=${utcDateStr()}&board=official`)
          .then((r) => r.json())
          .then((b: { entries?: OfficialRow[] }) => {
            const short = shortAddress(w);
            setMine((b.entries ?? []).filter((e) => e.wallet === short));
          })
          .catch(() => setMine(null));
      }
    } catch {
      // private mode / storage blocked — the page still renders honest zeros
      setLedger((l) => l ?? loadLedger(null));
    }
  }, []);

  const clearLocal = () => {
    if (!armed) { setArmed(true); return; }
    for (const k of ["cc_stats_v1", BEST_KEY, RUNS_KEY, SELF_GHOST_KEY, "cc_duel_v1", "cc_name_v1", "cc_rival_v1"]) {
      try { localStorage.removeItem(k); } catch { /* noop */ }
    }
    window.location.reload();
  };

  const num = (v: number | null | undefined) => (typeof v === "number" ? v.toLocaleString() : "…");

  return (
    <main className="cc-page">
      <div className="cc-page-card">
        <p className="cc-page-eyebrow">CANDLE CLIMBER</p>
        <h1 className="cc-page-title">YOUR STATS</h1>
        <p className="cc-page-updated">
          stored in this browser only — clearing site data erases it · nothing here is uploaded
        </p>

        <div className="cc-stats-grid">
          <div className="cc-stats-tile">
            <span className="cc-stats-k">RUNS FINISHED</span>
            <b className="cc-stats-v">{num(ledger?.runs)}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">RUNS STARTED</span>
            <b className="cc-stats-v">{num(runsStarted)}</b>
          </div>
          <div className="cc-stats-tile cc-stats-hi">
            <span className="cc-stats-k">PERSONAL BEST</span>
            <b className="cc-stats-v">{best > 0 ? best.toLocaleString() : num(0)}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">LIFETIME SCORE</span>
            <b className="cc-stats-v">{num(ledger?.totalScore)}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">CANDLES CLIMBED</span>
            <b className="cc-stats-v">{num(ledger?.totalCandles)}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">BEST STREAK</span>
            <b className="cc-stats-v">{ledger ? `×${ledger.bestStreak.toLocaleString()}` : "…"}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">BEST CLIMB</span>
            <b className="cc-stats-v">{ledger ? `${ledger.bestCandles.toLocaleString()} candles` : "…"}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">GRADUATIONS</span>
            <b className="cc-stats-v">{num(ledger?.graduations)}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">DUELS W-L-D</span>
            <b className="cc-stats-v">{tallyLabel(tally)}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">GHOSTS SAVED</span>
            <b className="cc-stats-v">{`${ghostTerrains} terrains`}</b>
          </div>
          <div className="cc-stats-tile">
            <span className="cc-stats-k">WRECKS FROZEN</span>
            <b className="cc-stats-v">{num(wreckCount)}</b>
          </div>
        </div>
        <p className="cc-stats-note">
          runs finished counts each run once, at its true end — a climb abandoned
          at the summit panel counts too. guest runs are anonymous; this page
          never shows another player&apos;s data.
        </p>

        {wallet && (
          <section className="cc-stats-card">
            <div className="cc-stats-card-title">OFFICIAL LANE · TODAY</div>
            {mine === null ? (
              <p className="cc-stats-note">checking today&apos;s official board…</p>
            ) : mine.length === 0 ? (
              <p className="cc-stats-note">
                no official runs today for <b>{wallet}</b> — submit a run with your
                wallet linked to land here (best run per wallet is kept).
              </p>
            ) : (
              mine.map((e, i) => (
                <div key={`${e.wallet}-${i}`} className="cc-stats-row">
                  <span>{e.name}</span>
                  <b>{e.score.toLocaleString()} pts · {e.candlesPassed} candles</b>
                </div>
              ))
            )}
            <p className="cc-stats-note">
              wallet-bound board rows only — guest lanes stay name-only. airdrop
              weights live on the <a href="/airdrop">airdrop board</a>.
            </p>
          </section>
        )}

        <div className="cc-stats-actions">
          <a className="cc-page-btn" href="/">PLAY TODAY&apos;S CHART</a>
          <button className="cc-stats-wipe" onClick={clearLocal}>
            {armed ? "SURE? CLICK AGAIN TO ERASE" : "CLEAR LOCAL STATS"}
          </button>
        </div>
      </div>
    </main>
  );
}
