// /leaderboard — the public board surface (side 3 of the leaderboard plan:
// Task 158 audit found the board lived only inside the game panel).
// Server-rendered from the SAME store the API reads (no self-fetch): the guest
// lane is unverified typed names, the official lane is wallet-proven records
// (LAW 1.2 Option B — lanes never mix). Career scopes (season / all-time) read
// the best run per identity across dates; equal scores keep the earliest run
// ("first to set it"). Season scaffolding comes from src/lib/seasons.ts.
import type { Metadata } from "next";
import { getBoard, type BoardEntry } from "@/lib/leaderboard-store";
import { SEASONS, currentSeason } from "@/lib/seasons";
import { isInterval } from "@/game/cc/level-source";

export const dynamic = "force-dynamic"; // live store reads — never prerender at build

export const metadata: Metadata = {
  title: "Leaderboard — Candle Climber",
  description:
    "Public Candle Climber boards: wallet-proven official records, guest runs, season S1 standings and all-time career bests.",
};

const SCOPES = ["daily", "season", "alltime"] as const;
const LANES = ["guest", "official"] as const;
const INTERVALS = ["1w", "1d", "4h"] as const;
type Scope = (typeof SCOPES)[number];
type Lane = (typeof LANES)[number];

function pick(raw: string | string[] | undefined, allowed: readonly string[], fallback: string): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v && allowed.includes(v) ? v : fallback;
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const scope = pick(sp.scope, SCOPES, "daily") as Scope;
  const board = pick(sp.board, LANES, "official") as Lane;
  const intervalRaw = pick(sp.interval, INTERVALS, "1w");
  const interval = isInterval(intervalRaw) ? intervalRaw : "1w";

  const store = getBoard();
  const today = new Date().toISOString().slice(0, 10);
  const seasonId = currentSeason();
  const season = SEASONS.find((s) => s.id === seasonId) ?? SEASONS[SEASONS.length - 1];

  let entries: BoardEntry[] = [];
  try {
    if (scope === "daily") entries = await store.top(today, 50, interval, board);
    else entries = await store.topCareer(50, interval, board, scope === "season" ? season.start : null);
  } catch {
    entries = []; // honest empty lane — the store already logs/Sentries the cause
  }

  const href = (over: Record<string, string>) => {
    const p = new URLSearchParams({ scope, board, interval, ...over });
    return `/leaderboard?${p.toString()}`;
  };

  const scopeLabel = scope === "daily" ? "TODAY" : scope === "season" ? `SEASON ${season.id}` : "ALL-TIME";
  const laneNote =
    board === "official"
      ? "wallet-proven · best run per wallet per day"
      : "unverified — typed names, no proof";

  return (
    <main className="cc-page">
      <div className="cc-page-card">
        <p className="cc-page-eyebrow">CANDLE CLIMBER</p>
        <h1 className="cc-page-title">LEADERBOARD</h1>
        <p className="cc-page-updated">
          {scope === "daily" && <>today&apos;s runs on the current chart · resets at midnight UTC</>}
          {scope === "season" && <>season {season.id} window — runs since {season.start} (UTC)</>}
          {scope === "alltime" && <>best run per player across every recorded day</>}
        </p>

        <nav className="cc-lb-tabs" aria-label="scope">
          {SCOPES.map((s) => (
            <a key={s} className={`cc-lb-tab${s === scope ? " on" : ""}`} href={href({ scope: s })}>
              {s === "daily" ? "TODAY" : s === "season" ? `SEASON ${season.id}` : "ALL-TIME"}
            </a>
          ))}
        </nav>
        <nav className="cc-lb-tabs" aria-label="lane">
          {LANES.map((l) => (
            <a key={l} className={`cc-lb-tab${l === board ? " on" : ""}`} href={href({ board: l })}>
              {l.toUpperCase()}
            </a>
          ))}
        </nav>
        <nav className="cc-lb-tabs" aria-label="timeframe">
          {INTERVALS.map((iv) => (
            <a key={iv} className={`cc-lb-tab${iv === interval ? " on" : ""}`} href={href({ interval: iv })}>
              {iv.toUpperCase()}
            </a>
          ))}
        </nav>

        <p className="cc-lb-meta">
          {scopeLabel} · {board.toUpperCase()} lane — {laneNote}
          {board === "official" ? " · wallets masked" : ""}
        </p>

        {entries.length === 0 ? (
          <p className="cc-lb-empty">no runs recorded here yet — be the first.</p>
        ) : (
          <div className="cc-lb-table">
            {entries.map((e, i) => (
              <div key={`${e.ts}-${e.name}-${i}`} className="cc-lb-row">
                <span className={`cc-lb-rank${i < 3 ? " top" : ""}`}>#{i + 1}</span>
                <span className="cc-lb-name">
                  {e.name}
                  {board === "official" && e.wallet ? <i>{e.wallet}</i> : null}
                </span>
                <span className="cc-lb-score">{e.score.toLocaleString()}</span>
                <span className="cc-lb-sub">{e.candlesPassed.toLocaleString()} candles</span>
              </div>
            ))}
          </div>
        )}

        <p className="cc-lb-foot">
          guest scores are self-reported and unverified — official rows carry a
          cryptographic wallet proof. seasons never gate play (free, walletless,
          forever). no real funds.
        </p>
        <div className="cc-stats-actions">
          <a className="cc-page-btn" href="/">PLAY TODAY&apos;S CHART</a>
          <a className="cc-page-btn" href="/stats">YOUR STATS</a>
        </div>
      </div>
    </main>
  );
}
