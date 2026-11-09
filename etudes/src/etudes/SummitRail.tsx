import { useState } from "react";
import { Annotations } from "../components/Annotations";
import CandleChart from "../components/CandleChart";
import StageFrame from "../components/StageFrame";
import { CANDLES } from "../lib/synthetic";
import type { EtudeProps } from "./types";

const RAIL_X = 754;
const RAIL_TOP = 48;
const RAIL_BOTTOM = 432;
const RAIL_HEIGHT = RAIL_BOTTOM - RAIL_TOP;
/** 30% from the top of the 480px stage — the real game's fixed camera anchor. */
const INITIAL_ALTITUDE = 75;
const STEP = 5;

const altitudeToY = (altitude: number) =>
  RAIL_BOTTOM - (altitude / 100) * RAIL_HEIGHT;
const clampAltitude = (value: number) => Math.min(100, Math.max(0, value));

const MAJOR_TICKS = [0, 25, 50, 75, 100];
const MINOR_TICKS = Array.from({ length: 11 }, (_, i) => i * 10).filter(
  (altitude) => !MAJOR_TICKS.includes(altitude),
);

export default function SummitRail({ showAnnotations }: EtudeProps) {
  const [altitude, setAltitude] = useState(INITIAL_ALTITUDE);
  const handleY = altitudeToY(altitude);

  const move = (delta: number) =>
    setAltitude((current) => clampAltitude(current + delta));

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowUp" || event.key === "+") {
      event.preventDefault();
      move(STEP);
    } else if (event.key === "ArrowDown" || event.key === "-") {
      event.preventDefault();
      move(-STEP);
    }
  };

  return (
    <StageFrame label="Etude 1: Summit Rail">
      <CandleChart
        candles={CANDLES}
        x={44}
        y={44}
        width={624}
        height={396}
        mode="mono"
        dim
        showAxis
      />

      <div
        className="absolute text-[9px] uppercase tracking-[0.22em] text-muted"
        style={{ left: 14, top: 250, transform: "rotate(-90deg)", transformOrigin: "left top" }}
      >
        Altitude
      </div>

      <div
        tabIndex={0}
        role="group"
        aria-label="Summit rail altitude marker. Use the buttons or up and down arrow keys."
        onKeyDown={onKeyDown}
        className="absolute inset-0 rounded-[8px] outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-teal/50"
      >
        {/* Progress fill — transitions as the marker moves (300ms ease-out). */}
        <div
          className="absolute rounded-full bg-teal/45"
          style={{
            left: RAIL_X - 1.5,
            width: 3,
            top: handleY,
            height: Math.max(0, RAIL_BOTTOM - handleY),
            transition: "top 300ms ease-out, height 300ms ease-out",
          }}
        />

        <svg
          className="pointer-events-none absolute inset-0"
          width={800}
          height={480}
          aria-hidden="true"
          focusable="false"
        >
          <rect
            x={RAIL_X - 1.5}
            y={RAIL_TOP}
            width={3}
            height={RAIL_HEIGHT}
            rx={1.5}
            fill="rgba(230,237,243,0.14)"
          />

          {MINOR_TICKS.map((tick) => (
            <line
              key={`minor-${tick}`}
              x1={RAIL_X - 6}
              x2={RAIL_X}
              y1={altitudeToY(tick)}
              y2={altitudeToY(tick)}
              stroke="#45525C"
              strokeWidth={1}
            />
          ))}

          {MAJOR_TICKS.map((tick) => (
            <g key={`major-${tick}`}>
              <line
                x1={RAIL_X - 13}
                x2={RAIL_X}
                y1={altitudeToY(tick)}
                y2={altitudeToY(tick)}
                stroke="#6B7A86"
                strokeWidth={1}
              />
              <text
                x={RAIL_X - 18}
                y={altitudeToY(tick) + 3}
                textAnchor="end"
                fontSize={9}
                fill="#8B98A5"
                className="tabular-nums"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Summit flag at 100 */}
          <line
            x1={RAIL_X}
            y1={RAIL_TOP}
            x2={RAIL_X}
            y2={26}
            stroke="#2DD4BF"
            strokeWidth={1.5}
          />
          <polygon
            points={`${RAIL_X + 1},26 ${RAIL_X + 22},32 ${RAIL_X + 1},38`}
            fill="#2DD4BF"
          />
          <text
            x={RAIL_X - 18}
            y={30}
            textAnchor="end"
            fontSize={8}
            letterSpacing={1.2}
            fill="#8B98A5"
          >
            SUMMIT
          </text>
          <text
            x={RAIL_X - 18}
            y={447}
            textAnchor="end"
            fontSize={8}
            letterSpacing={1.2}
            fill="#8B98A5"
          >
            BASE
          </text>
        </svg>

        {/* Current-position handle + readout */}
        <div
          className="absolute inset-x-0 z-20"
          style={{ top: handleY, transition: "top 300ms ease-out" }}
          aria-hidden="true"
        >
          <div
            className="absolute h-3.5 w-3.5 rounded-full border-2 border-teal bg-page shadow-[0_0_12px_rgba(45,212,191,0.65)]"
            style={{ left: RAIL_X - 7, top: -7 }}
          />
          <div
            className="absolute flex h-[22px] w-[86px] items-center justify-between rounded-[6px] border border-teal/55 bg-[#0c1115] px-1.5 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.9)]"
            style={{ left: RAIL_X - 102, top: -11 }}
          >
            <span className="text-[8px] uppercase tracking-[0.12em] text-muted">
              Alt
            </span>
            <span className="tabular-nums text-[11px] font-medium text-teal">
              {altitude.toFixed(0)}
            </span>
          </div>
        </div>

        <div className="absolute z-20 flex flex-col gap-1.5" style={{ left: RAIL_X + 10, top: 362 }}>
          <button
            type="button"
            aria-label="Raise altitude"
            onClick={() => move(STEP)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-white/15 bg-panel text-[10px] text-ink transition-colors hover:border-teal/60 hover:text-teal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
          >
            ▲
          </button>
          <button
            type="button"
            aria-label="Lower altitude"
            onClick={() => move(-STEP)}
            className="flex h-[26px] w-[26px] items-center justify-center rounded-[6px] border border-white/15 bg-panel text-[10px] text-ink transition-colors hover:border-teal/60 hover:text-teal focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
          >
            ▼
          </button>
        </div>
        <div className="absolute text-[8px] leading-tight text-muted" style={{ left: RAIL_X + 10, top: 420 }}>
          keys
          <br />
          ↑↓
        </div>

        <div className="absolute bottom-3 left-6 text-[9px] text-muted">
          ↑ / ↓ or the buttons move the marker · 300ms ease-out · no physics
        </div>

        <span className="sr-only" role="status" aria-live="polite">
          Altitude {altitude}
        </span>
      </div>

      {showAnnotations && (
        <Annotations
          items={[
            { x: RAIL_X - 26, y: 76, text: "Summit flag · altitude 100", align: "right" },
            { x: RAIL_X - 26, y: 288, text: "Tick every 10 · labelled every 25", align: "right" },
            { x: RAIL_X - 102, y: 144, text: "Handle · camera anchor starts 30% from top", align: "right" },
            { x: RAIL_X - 26, y: 458, text: "Base · altitude 0", align: "right" },
          ]}
        />
      )}
    </StageFrame>
  );
}
