import { useState } from "react";
import { Annotations } from "../components/Annotations";
import CandleChart, { type ChartMode } from "../components/CandleChart";
import StageFrame from "../components/StageFrame";
import { contrastRatio, formatRatio } from "../lib/color";
import { CANDLES } from "../lib/synthetic";
import type { EtudeProps } from "./types";

const CHART = { x: 64, y: 64, width: 470, height: 352 };
const PANEL = { x: 560, y: 64, width: 224, height: 352 };

type Encoding = "colorblind" | "default";

const ENCODINGS: {
  value: Encoding;
  label: string;
  up: string;
  down: string;
}[] = [
  { value: "colorblind", label: "Colorblind-safe", up: "#0072B2", down: "#D55E00" },
  { value: "default", label: "Default (green/red)", up: "#3FB950", down: "#E5534B" },
];

/** Text/label pairs — every one must clear 4.5:1 (WCAG 2.1 AA normal text). */
const CONTRAST_PAIRS = [
  { label: "Body text / stage", fg: "#E6EDF3", bg: "#1A2026" },
  { label: "Axis label / stage", fg: "#8B98A5", bg: "#1A2026" },
  { label: "Panel label / panel", fg: "#C3CED8", bg: "#151B21" },
  { label: "Accent text / stage", fg: "#2DD4BF", bg: "#1A2026" },
];

export default function ColorblindSafe({ showAnnotations }: EtudeProps) {
  const [encoding, setEncoding] = useState<Encoding>("colorblind");
  const active = ENCODINGS.find((option) => option.value === encoding)!;

  const ratios = CONTRAST_PAIRS.map((pair) => ({
    ...pair,
    ratio: contrastRatio(pair.fg, pair.bg),
  }));
  const passing = ratios.filter((row) => row.ratio >= 4.5).length;

  return (
    <StageFrame label="Etude 3: Colorblind-safe contrast">
      <CandleChart
        candles={CANDLES}
        x={CHART.x}
        y={CHART.y}
        width={CHART.width}
        height={CHART.height}
        mode={encoding as ChartMode}
        showAxis
      />

      <div
        className="absolute text-[9px] uppercase tracking-[0.22em] text-muted"
        style={{ left: 22, top: 290, transform: "rotate(-90deg)", transformOrigin: "left top" }}
      >
        Altitude
      </div>

      <div className="absolute left-6 top-[34px] text-[10px] text-muted">
        Synthetic OHLC · altitude 0–100 · shape + hue
      </div>

      <div
        className="absolute rounded-[8px] border border-white/10 bg-panel p-3"
        style={{
          left: PANEL.x,
          top: PANEL.y,
          width: PANEL.width,
          height: PANEL.height,
        }}
      >
        <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink">
          Colour encoding
        </h2>

        <div
          role="radiogroup"
          aria-label="Candle colour encoding"
          className="mt-2 grid gap-1"
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            setEncoding((current) =>
              current === "colorblind" ? "default" : "colorblind",
            );
          }}
        >
          {ENCODINGS.map((option) => {
            const selected = encoding === option.value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setEncoding(option.value)}
                className={`flex items-center gap-2 rounded-[6px] border px-2 py-1.5 text-left text-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal ${
                  selected
                    ? "border-teal/55 bg-teal/10 text-ink"
                    : "border-white/10 bg-white/[0.02] text-muted hover:border-white/25"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{
                    background: selected ? "#2DD4BF" : "transparent",
                    border: "1px solid #8B98A5",
                  }}
                />
                {option.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="text-[9px] uppercase tracking-[0.12em] text-muted">
            Shape is the primary cue
          </div>
          <div className="mt-1.5 grid gap-1.5">
            <div className="flex items-center gap-2 text-[10px] text-ink">
              <span
                className="h-3.5 w-2.5 rounded-[1px] border-2"
                style={{ borderColor: active.up, background: "transparent" }}
              />
              Up · hollow body
            </div>
            <div className="flex items-center gap-2 text-[10px] text-ink">
              <span
                className="h-3.5 w-2.5 rounded-[1px] border-2"
                style={{ borderColor: active.down, background: active.down }}
              />
              Down · filled body
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] uppercase tracking-[0.12em] text-muted">
              Contrast (computed)
            </span>
            <span
              className="text-[9px] font-medium"
              style={{ color: passing === ratios.length ? "#2DD4BF" : "#E5534B" }}
            >
              {passing}/{ratios.length} ≥ 4.5:1
            </span>
          </div>
          <div className="mt-1 grid gap-0.5">
            {ratios.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-1 text-[9px]"
              >
                <span className="flex items-center gap-1 text-muted">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ background: row.fg }}
                  />
                  {row.label}
                </span>
                <span className="flex items-center gap-1 tabular-nums">
                  <span className="text-ink">{formatRatio(row.ratio)}</span>
                  <span
                    className="font-medium"
                    style={{
                      color: row.ratio >= 4.5 ? "#2DD4BF" : "#E5534B",
                    }}
                  >
                    {row.ratio >= 4.5 ? "PASS" : "FAIL"}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-6 text-[9px] text-muted">
        Hover states never rely on hue · ratios computed from the exact tokens shown
      </div>

      {showAnnotations && (
        <Annotations
          items={[
            { x: 300, y: 34, text: "Hollow = up · filled = down (hue is redundant)" },
            { x: 672, y: 442, text: "Text pairs must clear 4.5:1" },
          ]}
        />
      )}
    </StageFrame>
  );
}
