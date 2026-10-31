// /chart/[date] — THE CHART IS A PLACE (reference-study P1).
//
// Every shareable thing this product emitted so far required you to have
// already played: a death card, a duel code, a board rank. The level itself —
// the one object that is identical for every player on earth and different
// every day — had no address. This page gives it one: the day, the terrain
// drawn as a poster, the crowd's numbers, and a button that puts you on that
// exact chart.
//
// What the server renders is everything that does NOT depend on a live feed:
// the day, the crowd, the call to play, the honesty labels. The ticker,
// mutation and provenance are rendered by ChartDay from the one response the
// game itself uses — see src/lib/day-chart.ts for why a server-side symbol
// would be a lie.
//
// Honesty rules this page obeys (docs/TRUTH-TABLE.md):
//   · the provenance badge comes from the feed that actually answered, so a
//     synthetic fallback is labelled as one;
//   · past days are labelled practice/archive terrain, because archive runs are
//     unscored by design;
//   · the crowd block reads ONE named lane (guest) and says it is unverified;
//   · an unreachable field says exactly that — it never renders as "no climbs".
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ChartDay from "@/components/chart/ChartDay";
import { getBoard, type BoardEntry } from "@/lib/leaderboard-store";
import { summarizeField, type FieldSummary } from "@/lib/field";
import { resolveDay as resolveDayAt } from "@/lib/day-chart";
import { utcDateStr } from "@/game/cc/rng";

export const dynamic = "force-dynamic"; // live store reads + today's date

const FIELD_LIMIT = 500;
const TOP_N = 3;

function resolveDay(date: string) {
  return resolveDayAt(date, utcDateStr());
}

type FieldView = FieldSummary & { top: Pick<BoardEntry, "name" | "score" | "candlesPassed">[] };

/** null = the store did not answer (rendered as "unreachable", never as empty). */
async function readField(date: string): Promise<FieldView | null> {
  try {
    const rows = await getBoard().top(date, FIELD_LIMIT, "1w", "guest");
    return {
      ...summarizeField(rows),
      top: rows.slice(0, TOP_N).map((r) => ({
        name: r.name,
        score: r.score,
        candlesPassed: r.candlesPassed,
      })),
    };
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const day = resolveDay(date);
  if (!day) return { title: "Chart not found — Candle Climber" };
  const title = day.isToday
    ? `Today's chart · ${date} — Candle Climber`
    : `The chart · ${date} — Candle Climber`;
  const description = day.isToday
    ? "Today's Candle Climber level: one chart, identical for every player worldwide, reset at 00:00 UTC. Green candles hold your weight, red ones crumble. See where the crowd stopped, then climb it."
    : `Replay the ${date} chart: real candlesticks as terrain, with the crowd's numbers. Archive terrain is practice — unscored, but identical for everyone.`;
  return {
    title,
    description,
    alternates: { canonical: `/chart/${date}` },
    openGraph: { type: "article", title, description, url: `/chart/${date}` },
    twitter: { card: "summary_large_image", title, description },
  };
}

function wallSentence(field: FieldSummary): string {
  if (field.count === 0 || !field.wall) {
    return "No scored climbs recorded on this chart yet — the field is open.";
  }
  if (field.count < 3) {
    return "Too few climbs to say where the crowd stops — one more run would already change it.";
  }
  const { from, to } = field.wall;
  return to === null
    ? `Most climbs on this chart got past candle ${from}.`
    : `Most climbs on this chart ended between candle ${from} and ${to}.`;
}

export default async function ChartPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const day = resolveDay(date);
  if (!day) notFound();
  const { isToday } = day;
  const field = await readField(date);
  const playHref = isToday ? "/play?mode=crypto" : `/play?date=${date}&mode=crypto`;

  return (
    <main className="cc-page">
      <div className="cc-page-card cc-chart-page">
        <p className="cc-page-eyebrow">THE CHART · {isToday ? "TODAY" : "ARCHIVE"} · UTC</p>
        <h1 className="cc-chart-title">{date}</h1>
        <p className="cc-page-updated">
          {isToday
            ? "one level, identical for every player worldwide · resets at 00:00 UTC"
            : "replayed terrain from a past day · practice only, never scored"}
        </p>

        <ChartDay date={date} isToday={isToday} />

        <h2>THE FIELD</h2>
        <p className="cc-chart-sub">
          Every scored climb on this chart, in the guest lane. Where the crowd stopped is the
          closest thing to a difficulty rating this game has — and it is not a fixed target: it
          moves as people play.
        </p>

        {field === null ? (
          <p className="cc-chart-empty">
            The field is unreachable right now — the board store did not answer, so there are no
            honest numbers to show. The chart below and the climb link still work.
          </p>
        ) : field.count === 0 ? (
          <p className="cc-chart-empty">
            No scored climbs yet. The first one sets the median, the wall and the bar everybody else
            has to clear.
          </p>
        ) : (
          <>
            <div className="cc-chart-stats">
              <div className="cc-chart-stat">
                <b>{field.count.toLocaleString()}</b>
                <span>climbs</span>
              </div>
              <div className="cc-chart-stat">
                <b>{field.medianCandles?.toLocaleString() ?? "—"}</b>
                <span>median candles</span>
              </div>
              <div className="cc-chart-stat">
                <b>{field.p90Candles?.toLocaleString() ?? "—"}</b>
                <span>top 10% reach</span>
              </div>
              <div className="cc-chart-stat">
                <b>{field.bestCandles?.toLocaleString() ?? "—"}</b>
                <span>best climb</span>
              </div>
            </div>

            <p className="cc-chart-wall">{wallSentence(field)}</p>

            <div
              className="cc-chart-bands"
              role="img"
              aria-label="Where climbs ended, by candle band"
            >
              {field.bands.map((b) => (
                <div key={b.label} className="cc-chart-band">
                  <span className="cc-chart-band-label">{b.label}</span>
                  <span className="cc-chart-band-track">
                    <span className="cc-chart-band-fill" style={{ width: `${b.pct}%` }} />
                  </span>
                  <span className="cc-chart-band-count">{b.count}</span>
                </div>
              ))}
            </div>

            {field.top.length > 0 ? (
              <div className="cc-lb-table cc-chart-top">
                {field.top.map((e, i) => (
                  <div key={`${e.name}-${i}`} className="cc-lb-row">
                    <span className={`cc-lb-rank${i === 0 ? " top" : ""}`}>#{i + 1}</span>
                    <span className="cc-lb-name">{e.name}</span>
                    <span className="cc-lb-score">{e.score.toLocaleString()}</span>
                    <span className="cc-lb-sub">{e.candlesPassed.toLocaleString()} candles</span>
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}

        <div className="cc-stats-actions">
          <Link className="cc-page-btn" href={playHref}>
            {isToday ? "CLIMB TODAY'S CHART" : "CLIMB THIS ARCHIVE CHART"}
          </Link>
          <Link className="cc-page-btn cc-chart-btn-ghost" href="/leaderboard">
            THE FULL BOARD
          </Link>
        </div>

        <p className="cc-page-foot">
          the field is the <b>guest lane</b> — typed names, self-reported, unverified. wallet-proven
          climbs live on the official board and are never mixed in here. no real funds.
        </p>
      </div>
    </main>
  );
}
