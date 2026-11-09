import { useState } from "react";
import { Annotations } from "../components/Annotations";
import StageFrame from "../components/StageFrame";
import type { EtudeProps } from "./types";

const LAYERS = {
  far: { bleed: 10, rate: 0.2 },
  mid: { bleed: 22, rate: 0.6 },
  fg: { bleed: 36, rate: 1 },
} as const;

const LAYER_TOP = -48;
const LAYER_HEIGHT = 576;

const clamp = (value: number, limit: number) =>
  Math.min(limit, Math.max(-limit, value));

const CANDLE_SPECS = [
  { cx: 104, height: 188, up: true },
  { cx: 258, height: 118, up: false },
  { cx: 414, height: 232, up: true },
  { cx: 572, height: 92, up: false },
  { cx: 742, height: 166, up: true },
];
const BODY_WIDTH = 74;
const BASE_Y = 556;

function FarArt() {
  return (
    <svg viewBox="0 0 820 576" width={820} height={576} aria-hidden="true" className="block">
      <defs>
        <linearGradient id="depth-far-a" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#25454F" />
          <stop offset="100%" stopColor="#152730" />
        </linearGradient>
        <linearGradient id="depth-far-b" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1C3540" />
          <stop offset="100%" stopColor="#111F26" />
        </linearGradient>
      </defs>
      <path
        d="M0 372 L70 316 L132 356 L206 282 L268 340 L344 296 L420 352 L500 300 L566 348 L640 310 L716 356 L790 322 L820 338 L820 576 L0 576 Z"
        fill="url(#depth-far-a)"
      />
      <path
        d="M0 432 L96 380 L170 424 L252 372 L330 420 L410 386 L492 432 L574 392 L652 428 L736 388 L820 420 L820 576 L0 576 Z"
        fill="url(#depth-far-b)"
        opacity="0.92"
      />
      <path
        d="M206 282 L226 300 L246 292"
        fill="none"
        stroke="rgba(230,237,243,0.18)"
        strokeWidth="2"
      />
      <path
        d="M500 300 L524 316 L548 306"
        fill="none"
        stroke="rgba(230,237,243,0.14)"
        strokeWidth="2"
      />
    </svg>
  );
}

function MidArt() {
  return (
    <svg viewBox="0 0 844 576" width={844} height={576} aria-hidden="true" className="block">
      <path
        d="M0 470 L58 430 L118 468 L182 412 L240 460 L302 418 L358 468 L422 428 L482 474 L542 434 L606 468 L670 422 L732 464 L790 432 L844 460 L844 576 L0 576 Z"
        fill="#0C1216"
      />
      <path
        d="M0 516 L84 486 L152 518 L232 480 L308 520 L388 488 L470 522 L552 486 L630 520 L712 484 L792 518 L844 494 L844 576 L0 576 Z"
        fill="#080D11"
      />
    </svg>
  );
}

function ForegroundArt() {
  return (
    <svg viewBox="0 0 872 576" width={872} height={576} aria-hidden="true" className="block">
      {CANDLE_SPECS.map((spec) => {
        const bodyTop = BASE_Y - spec.height;
        const stroke = spec.up ? "rgba(45,212,191,0.8)" : "rgba(160,175,185,0.55)";
        return (
          <g key={spec.cx}>
            <line
              x1={spec.cx}
              x2={spec.cx}
              y1={bodyTop - 26}
              y2={BASE_Y + 18}
              stroke={stroke}
              strokeWidth={2.5}
            />
            <rect
              x={spec.cx - BODY_WIDTH / 2}
              y={bodyTop}
              width={BODY_WIDTH}
              height={spec.height}
              rx={3}
              fill={spec.up ? "rgba(45,212,191,0.16)" : "#0E1A20"}
              stroke={stroke}
              strokeWidth={1.8}
            />
          </g>
        );
      })}
    </svg>
  );
}

function SceneryLayer({
  name,
  bleed,
  shift,
  children,
}: {
  name: string;
  bleed: number;
  shift: number;
  children: React.ReactNode;
}) {
  return (
    <div
      data-layer={name}
      className="absolute left-0"
      style={{
        left: -bleed,
        top: LAYER_TOP,
        width: 800 + bleed * 2,
        height: LAYER_HEIGHT,
        transform: `translateX(${shift}px)`,
      }}
    >
      {children}
    </div>
  );
}

export default function DepthScene({ showAnnotations }: EtudeProps) {
  const [pan, setPan] = useState(0);
  const [depth, setDepth] = useState(65);

  const factor = depth / 100;
  const tilt = Math.min(4, 4 * factor);
  const shifts = {
    far: clamp(pan * LAYERS.far.rate * factor, LAYERS.far.bleed),
    mid: clamp(pan * LAYERS.mid.rate * factor, LAYERS.mid.bleed),
    fg: clamp(pan * LAYERS.fg.rate * factor, LAYERS.fg.bleed),
  };

  return (
    <StageFrame label="Etude 5: 2.5D bounded scene">
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ perspective: "900px", perspectiveOrigin: "50% 42%" }}
      >
        <div
          className="absolute inset-0"
          style={{
            transform: `rotateX(${tilt.toFixed(2)}deg)`,
            transformOrigin: "50% 66%",
          }}
        >
          <SceneryLayer name="far" bleed={LAYERS.far.bleed} shift={shifts.far}>
            <FarArt />
          </SceneryLayer>
          <SceneryLayer name="mid" bleed={LAYERS.mid.bleed} shift={shifts.mid}>
            <MidArt />
          </SceneryLayer>
          <SceneryLayer name="fg" bleed={LAYERS.fg.bleed} shift={shifts.fg}>
            <ForegroundArt />
          </SceneryLayer>
        </div>

        {/* The climber is outside the transformed world — fixed at 30% height. */}
        <div
          className="pointer-events-none absolute z-20"
          style={{
            left: "50%",
            top: "30%",
            transform: "translate(-50%, -50%)",
            filter: "drop-shadow(0 0 6px rgba(45,212,191,0.45))",
          }}
          aria-hidden="true"
        >
          <svg width={38} height={50} viewBox="0 0 38 50" className="block">
            <circle cx="19" cy="7" r="5.2" fill="#05090B" />
            <path
              d="M19 13 C15 13 12.5 17 12.4 21 L11.4 31 L8 46 L12.6 46 L16.4 33 L19 24 L21.6 33 L25.4 46 L30 46 L26.6 31 L25.6 20 C25.4 15 23 13 19 13 Z"
              fill="#05090B"
            />
            <path
              d="M13 19 L5 27"
              stroke="#05090B"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
            <path
              d="M5 27 L2 21"
              stroke="#05090B"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="absolute left-6 top-[34px] z-20">
          <h2 className="text-[13px] font-medium tracking-wide text-ink">
            2.5D bounded
          </h2>
          <p className="mt-1 text-[10px] text-muted">
            Three CSS-transformed layers · the world moves, the climber doesn&apos;t
          </p>
        </div>

        <div className="absolute right-4 top-3 z-20 rounded-[6px] border border-white/10 bg-[#0c1115]/80 px-2 py-1 text-[9px] tabular-nums text-muted">
          far ×0.2 · mid ×0.6 · fg ×1.0
          <span className="ml-2 text-teal">tilt {tilt.toFixed(1)}°</span>
        </div>

        <div
          className="absolute z-30 rounded-[8px] border border-white/12 bg-[#0c1115]/88 p-2.5 backdrop-blur-sm"
          style={{ left: 16, top: 350, width: 330 }}
        >
          <div className="flex items-baseline justify-between">
            <label htmlFor="camera-pan" className="text-[9px] uppercase tracking-[0.12em] text-muted">
              Camera pan
            </label>
            <span className="tabular-nums text-[10px] text-teal">
              {pan > 0 ? `+${pan}` : pan}
            </span>
          </div>
          <input
            id="camera-pan"
            type="range"
            min={-30}
            max={30}
            step={1}
            value={pan}
            onChange={(event) => setPan(Number(event.target.value))}
            className="cc-range mt-0.5 w-full"
          />

          <div className="mt-1 flex items-baseline justify-between">
            <label htmlFor="depth-intensity" className="text-[9px] uppercase tracking-[0.12em] text-muted">
              Depth intensity
            </label>
            <span className="tabular-nums text-[10px] text-teal">{depth}%</span>
          </div>
          <input
            id="depth-intensity"
            type="range"
            min={0}
            max={100}
            step={1}
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
            className="cc-range mt-0.5 w-full"
          />

          <div className="mt-1 flex items-center justify-between border-t border-white/10 pt-1 text-[8px] tabular-nums text-muted">
            <span>
              shift {shifts.far.toFixed(1)} / {shifts.mid.toFixed(1)} /{" "}
              {shifts.fg.toFixed(1)}px
            </span>
            <span className={depth === 0 ? "text-teal" : ""}>
              {depth === 0 ? "flat 2D" : "clamped in frame"}
            </span>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-2.5 right-4 z-20 text-[9px] text-muted">
          Clamped at ±30 · rotateX only · no orbit, no drag
        </div>
      </div>

      {showAnnotations && (
        <Annotations
          items={[
            { x: 210, y: 118, text: "Far · gradient mountains · ×0.2" },
            { x: 560, y: 176, text: "Climber fixed at 30% · world moves" },
            { x: 660, y: 300, text: "Foreground candles · ×1.0", align: "right" },
          ]}
        />
      )}
    </StageFrame>
  );
}
