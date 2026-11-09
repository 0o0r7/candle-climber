import { useState } from "react";
import { Annotations } from "../components/Annotations";
import CandleChart from "../components/CandleChart";
import StageFrame from "../components/StageFrame";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";
import { CANDLES } from "../lib/synthetic";
import type { EtudeProps } from "./types";

type MotionMode = "auto" | "full" | "reduced";

const RAIL_X = 720;
const RAIL_TOP = 150;
const RAIL_BOTTOM = 410;
const HANDLE_ALTITUDE = 62;

const altitudeToY = (altitude: number) =>
  RAIL_BOTTOM - (altitude / 100) * (RAIL_BOTTOM - RAIL_TOP);

const CLOUD_PUFFS_A = [
  { left: 0, top: 26, width: 152, height: 34, opacity: 0.11 },
  { left: 82, top: 4, width: 118, height: 42, opacity: 0.13 },
  { left: 186, top: 22, width: 132, height: 30, opacity: 0.09 },
];

const CLOUD_PUFFS_B = [
  { left: 10, top: 18, width: 104, height: 24, opacity: 0.08 },
  { left: 104, top: 2, width: 88, height: 30, opacity: 0.07 },
];

function StaticCue({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <div
      className="pointer-events-none absolute z-20 flex items-center gap-1.5 rounded-[6px] border border-white/15 bg-[#0c1115]/92 px-1.5 py-1 text-[9px] text-muted"
      style={{ left: x, top: y }}
    >
      <span className="text-teal">■</span>
      {text}
    </div>
  );
}

export default function ReducedMotion({ showAnnotations }: EtudeProps) {
  const [mode, setMode] = useState<MotionMode>("auto");
  const prefersReduced = usePrefersReducedMotion();

  const effective: "full" | "reduced" =
    mode === "auto" ? (prefersReduced ? "reduced" : "full") : mode;

  const handleY = altitudeToY(HANDLE_ALTITUDE);

  return (
    <StageFrame label="Etude 4: Reduced motion">
      <div
        className="rm-scene absolute inset-0"
        data-motion={effective}
        style={{
          background:
            "linear-gradient(180deg, #16212A 0%, #1A2026 52%, #151C22 100%)",
        }}
      >
        <CandleChart
          candles={CANDLES}
          x={48}
          y={208}
          width={600}
          height={248}
          mode="mono"
          dim
        />

        {/* Summit glow (pulsing) */}
        <div
          className="cc-glow pointer-events-none absolute"
          style={{
            left: 306,
            top: 54,
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle, rgba(45,212,191,0.42) 0%, rgba(45,212,191,0.12) 46%, transparent 70%)",
          }}
        />
        <svg
          className="pointer-events-none absolute"
          style={{ left: 372, top: 112 }}
          width={72}
          height={44}
          viewBox="0 0 72 44"
          aria-hidden="true"
        >
          <path d="M2 42 L28 10 L44 30 L56 18 L70 42 Z" fill="#20333B" />
          <path d="M28 10 L28 2" stroke="#2DD4BF" strokeWidth={1.4} />
          <polygon points="29,2 43,6 29,10" fill="#2DD4BF" />
        </svg>

        {/* Two drifting cloud layers */}
        <div className="cc-drift-a pointer-events-none absolute" style={{ left: 58, top: 96, width: 330, height: 70 }}>
          {CLOUD_PUFFS_A.map((puff, index) => (
            <div
              key={index}
              className="absolute rounded-full bg-[#E6EDF3]"
              style={{ ...puff, filter: "blur(3px)" }}
            />
          ))}
        </div>
        <div className="cc-drift-b pointer-events-none absolute" style={{ left: 430, top: 226, width: 220, height: 50 }}>
          {CLOUD_PUFFS_B.map((puff, index) => (
            <div
              key={index}
              className="absolute rounded-full bg-[#8B98A5]"
              style={{ ...puff, filter: "blur(3px)" }}
            />
          ))}
        </div>

        {/* Mini summit rail with a bobbing handle */}
        <svg
          className="pointer-events-none absolute"
          style={{ left: RAIL_X - 26, top: RAIL_TOP }}
          width={52}
          height={RAIL_BOTTOM - RAIL_TOP}
          viewBox={`0 0 52 ${RAIL_BOTTOM - RAIL_TOP}`}
          aria-hidden="true"
        >
          <rect x={25} y={0} width={2} height={RAIL_BOTTOM - RAIL_TOP} fill="rgba(230,237,243,0.16)" />
          {[0, 20, 40, 60, 80, 100].map((tick) => {
            const y = RAIL_BOTTOM - RAIL_TOP - (tick / 100) * (RAIL_BOTTOM - RAIL_TOP);
            return (
              <line
                key={tick}
                x1={tick % 50 === 0 ? 15 : 20}
                x2={25}
                y1={y}
                y2={y}
                stroke={tick % 50 === 0 ? "#6B7A86" : "#45525C"}
                strokeWidth={1}
              />
            );
          })}
        </svg>
        <div
          className="pointer-events-none absolute z-10"
          style={{ left: RAIL_X - 150, top: handleY - 11 }}
        >
          <div className="cc-bob">
            <div className="flex h-[22px] w-[118px] items-center justify-between rounded-[6px] border border-teal/55 bg-[#0c1115] px-2">
              <span className="text-[8px] uppercase tracking-[0.12em] text-muted">
                Alt
              </span>
              <span className="tabular-nums text-[11px] text-teal">
                {HANDLE_ALTITUDE}
              </span>
            </div>
          </div>
        </div>
        <div
          className="pointer-events-none absolute z-10 flex h-3.5 w-3.5 items-center justify-center"
          style={{ left: RAIL_X - 7, top: handleY - 7 }}
        >
          <div className="cc-bob h-2.5 w-2.5 rounded-full border-2 border-teal bg-page" />
        </div>

        <div className="absolute left-6 top-[38px] z-10">
          <h2 className="text-[13px] font-medium tracking-wide text-ink">
            Reduced motion
          </h2>
          <p className="mt-1 text-[10px] text-muted">
            Two cloud layers · pulsing summit glow · bobbing handle
          </p>
        </div>

        {/* Motion control */}
        <div className="absolute right-4 top-3.5 z-20 w-[248px] rounded-[8px] border border-white/12 bg-[#0c1115]/88 p-2.5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.14em] text-muted">
              Motion
            </span>
            <span className="text-[8px] text-muted">
              system: {prefersReduced ? "reduce" : "no-preference"}
            </span>
          </div>
          <div className="mt-1.5 grid grid-cols-3 gap-1">
            {(["auto", "full", "reduced"] as MotionMode[]).map((option) => {
              const selected = mode === option;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setMode(option)}
                  className={`rounded-[5px] border px-1 py-1 text-[9px] capitalize transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal ${
                    selected
                      ? "border-teal/60 bg-teal/12 text-teal"
                      : "border-white/10 bg-white/[0.02] text-muted hover:border-white/25"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[9px] leading-snug text-ink">
            In effect:{" "}
            <span className="text-teal">
              {effective === "reduced" ? "Reduced — static" : "Full motion"}
            </span>
            {mode === "auto" ? " (auto)" : " (manual)"}
          </p>
        </div>

        {effective === "reduced" && (
          <>
            <StaticCue x={236} y={168} text="Clouds paused" />
            <StaticCue x={452} y={92} text="Glow steady" />
            <StaticCue x={548} y={286} text="Handle locked" />
          </>
        )}

        <div className="absolute bottom-2.5 left-6 z-10 text-[9px] text-muted">
          Zero transitions and zero animations when reduced · static cues replace movement
        </div>

        {showAnnotations && (
          <Annotations
            items={[
              { x: 208, y: 74, text: "Cloud layer A · 26s drift" },
              { x: 424, y: 250, text: "Cloud layer B · 38s drift" },
              { x: 782, y: 118, text: "Manual override always wins", align: "right" },
            ]}
          />
        )}
      </div>
    </StageFrame>
  );
}
