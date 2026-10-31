// Link preview for /chart/[date] (reference-study P2). The study's most
// concrete failure was a product page nobody designed; a shared day link that
// unfurls as a grey box would repeat it in miniature.
//
// The card shows the day and the crowd — both known server-side — and never a
// ticker: /api/candles picks the symbol at request time from live tickers, so
// printing one here could disagree with the level. An unreachable field
// degrades to a card without numbers, never to invented numbers.
import { ImageResponse } from "next/og";
import { resolveDay } from "@/lib/day-chart";
import { utcDateStr } from "@/game/cc/rng";
import { getBoard } from "@/lib/leaderboard-store";
import { summarizeField } from "@/lib/field";

export const dynamic = "force-dynamic";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Candle Climber — the day's chart";

const BG = "#101214";
const CARD = "#16191C";
const LIME = "#CCFF00";
const UP = "#5BD08A";
const DOWN = "#E07856";
const FAINT = "#8A9099";

// A decorative silhouette of a chart — no data is implied by these bars.
const MOTIF = [26, 44, 34, 58, 41, 72, 52, 30, 64, 49, 83, 61];

export default async function ChartOg({ params }: { params: Promise<{ date: string }> }) {
  const { date: raw } = await params;
  const today = utcDateStr();
  const day = resolveDay(raw ?? today, today);

  if (!day) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: BG,
            color: LIME,
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          CANDLE CLIMBER
        </div>
      ),
      size,
    );
  }

  let field: ReturnType<typeof summarizeField> | null = null;
  try {
    field = summarizeField(await getBoard().top(day.date, 500, "1w", "guest"));
  } catch {
    field = null; // a card without numbers beats a card with wrong numbers
  }
  const crowd = field && field.count > 0 ? field : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BG,
          padding: 64,
          color: "#fff",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", color: LIME, fontSize: 24, fontWeight: 700, letterSpacing: 4 }}>
              {`THE CHART · ${day.isToday ? "TODAY" : "ARCHIVE"} · UTC`}
            </div>
            <div style={{ display: "flex", fontSize: 104, fontWeight: 800, letterSpacing: -2, marginTop: 14 }}>
              {day.date}
            </div>
            <div style={{ display: "flex", fontSize: 30, color: "#d7dbe2", marginTop: 16 }}>
              Green candles hold. Red ones crumble. One chart, every player.
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end", height: 210, marginTop: 6 }}>
            {MOTIF.map((h, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  width: 16,
                  height: h * 2,
                  marginLeft: 10,
                  background: i % 3 === 2 ? DOWN : UP,
                  borderRadius: 3,
                }}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingTop: 26,
            borderTop: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              background: CARD,
              fontSize: 26,
              color: FAINT,
            }}
          >
            {crowd ? (
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ display: "flex", color: "#fff", fontWeight: 700, marginRight: 10 }}>
                  {String(crowd.count)}
                </span>
                <span style={{ display: "flex" }}>climbs</span>
                <span style={{ display: "flex", color: "#fff", fontWeight: 700, marginLeft: 28, marginRight: 10 }}>
                  {crowd.medianCandles === null ? "—" : String(crowd.medianCandles)}
                </span>
                <span style={{ display: "flex" }}>median candles</span>
              </div>
            ) : (
              <span style={{ display: "flex" }}>no scored climbs yet — be the first</span>
            )}
          </div>
          <div style={{ display: "flex", fontSize: 24, color: FAINT }}>
            {`candle-climber.vercel.app/chart/${day.date}`}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
