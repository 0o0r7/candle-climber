import { useState } from "react";
import { Annotations } from "../components/Annotations";
import CandleChart from "../components/CandleChart";
import StageFrame from "../components/StageFrame";
import {
  CANDLES,
  candleAriaLabel,
  deltaPercent,
  shapeWord,
} from "../lib/synthetic";
import type { EtudeProps } from "./types";

const CHART = { x: 64, y: 168, width: 704, height: 284 };
const SLOT = CHART.width / CANDLES.length;
const BODY_WIDTH = Math.max(2.5, Math.min(8, SLOT * 0.62));
const CARD_WIDTH = 200;
const CARD_HEIGHT = 140;

export default function CandleCall({ showAnnotations }: EtudeProps) {
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);

  const displayed = active ?? pinned;

  const closeAll = () => {
    setActive(null);
    setPinned(null);
  };

  const togglePin = (index: number) => {
    setPinned((current) => (current === index ? null : index));
    setActive(index);
  };

  const candle = displayed === null ? null : CANDLES[displayed];

  const callout = (() => {
    if (!candle) return null;
    const centerX = CHART.x + SLOT * (candle.index + 0.5);
    const nearLeftEdge = centerX < 400;
    const rawLeft = nearLeftEdge
      ? centerX + BODY_WIDTH / 2 + 12
      : centerX - BODY_WIDTH / 2 - 12 - CARD_WIDTH;
    const left = Math.min(800 - CARD_WIDTH - 8, Math.max(8, rawLeft));
    const bodyTop =
      CHART.y + (1 - Math.max(candle.open, candle.close) / 100) * CHART.height;
    const top = Math.min(
      480 - CARD_HEIGHT - 8,
      Math.max(8, bodyTop - 28),
    );
    return { left, top, side: nearLeftEdge ? "right of candle" : "left of candle" };
  })();

  return (
    <StageFrame label="Etude 2: Candle Call">
      <div
        className="absolute inset-0"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeAll();
          }
        }}
      >
      <CandleChart
        candles={CANDLES}
        x={CHART.x}
        y={CHART.y}
        width={CHART.width}
        height={CHART.height}
        mode="default"
        highlight={displayed}
        showAxis
      />

      <div
        className="absolute text-[9px] uppercase tracking-[0.22em] text-muted"
        style={{ left: 22, top: 308, transform: "rotate(-90deg)", transformOrigin: "left top" }}
      >
        Altitude
      </div>

      <div className="absolute z-20" style={{ left: 24, top: 30 }}>
        <h2 className="text-[13px] font-medium tracking-wide text-ink">
          Candle Call
        </h2>
        <p className="mt-1 text-[10px] text-muted">
          Hover or Tab through candles · Enter pins · Esc closes
        </p>
      </div>

      <div className="absolute right-6 top-9 text-right text-[10px] leading-relaxed text-muted">
        60 candles · lower two-thirds
        <br />
        synthetic OHLC · seed 1337
        {pinned !== null && (
          <span className="mt-1 block rounded-[4px] border border-teal/45 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.12em] text-teal">
            pinned · #{String(pinned + 1).padStart(2, "0")}
          </span>
        )}
      </div>

      {/* Invisible per-candle hit areas: hover, Tab focus, click/Enter to pin. */}
      <div
        className="absolute z-10"
        style={{
          left: CHART.x,
          top: CHART.y,
          width: CHART.width,
          height: CHART.height,
        }}
        onMouseLeave={() => setActive(null)}
      >
        {CANDLES.map((item) => (
          <button
            key={item.index}
            type="button"
            aria-label={candleAriaLabel(item)}
            aria-pressed={pinned === item.index}
            onClick={() => togglePin(item.index)}
            onMouseEnter={() => setActive(item.index)}
            onFocus={() => setActive(item.index)}
            onBlur={() =>
              setActive((current) => (current === item.index ? null : current))
            }
            className="absolute top-0 h-full rounded-[2px] outline-none transition-colors hover:bg-white/[0.035] focus-visible:bg-teal/10"
            style={{ left: item.index * SLOT, width: SLOT }}
          />
        ))}
      </div>

      {candle && callout && (
        <div
          id="candle-callout"
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute z-30 rounded-[8px] border border-white/12 bg-[#0d1317]/95 p-2.5 shadow-[0_14px_32px_-18px_rgba(0,0,0,0.95)] backdrop-blur-sm"
          style={{
            left: callout.left,
            top: callout.top,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-ink">
              Candle #{String(candle.index + 1).padStart(2, "0")}
            </span>
            <span className="rounded-[4px] border border-white/15 bg-white/5 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.1em] text-muted">
              {shapeWord(candle)}
            </span>
          </div>
          <div className="mt-2 grid gap-1 text-[10px]">
            {[
              ["Open", candle.open],
              ["High", candle.high],
              ["Low", candle.low],
              ["Close", candle.close],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-muted">{label}</span>
                <span className="tabular-nums text-ink">
                  {(value as number).toFixed(1)}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-white/10 pt-1">
              <span className="text-muted">Delta</span>
              <span
                className="tabular-nums font-medium"
                style={{ color: candle.state === "up" ? "#2DD4BF" : "#E5534B" }}
              >
                {deltaPercent(candle) >= 0 ? "+" : ""}
                {deltaPercent(candle).toFixed(2)}%
              </span>
            </div>
          </div>
          <p className="mt-1.5 text-[8px] leading-snug text-muted">
            Shape descriptor only · not advice · card flips {callout.side}
          </p>
        </div>
      )}

      <div className="absolute bottom-2.5 left-6 text-[9px] text-muted">
        Callout never covers the focused candle · Tab order follows candle index
      </div>

      {showAnnotations && (
        <Annotations
          items={[
            { x: 360, y: 122, text: "Wicks + bodies · shared seeded data" },
            { x: 782, y: 122, text: "Callout flips side near edges", align: "right" },
            { x: 150, y: 330, text: "Focus column follows Tab" },
          ]}
        />
      )}
      </div>
    </StageFrame>
  );
}
