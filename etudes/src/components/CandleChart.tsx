import type { Candle } from "../lib/synthetic";

export type ChartMode = "default" | "colorblind" | "mono";

/** Up = hollow body with coloured border, down = filled body. Shape always
 *  differs, so hue is never the only cue (etude 3 relies on this). */
const PALETTE: Record<ChartMode, { up: string; down: string }> = {
  default: { up: "#3FB950", down: "#E5534B" },
  colorblind: { up: "#0072B2", down: "#D55E00" },
  mono: { up: "#5C6B75", down: "#43525C" },
};

interface CandleChartProps {
  candles: Candle[];
  /** Position inside the 800×480 stage. */
  x: number;
  y: number;
  width: number;
  height: number;
  mode?: ChartMode;
  dim?: boolean;
  highlight?: number | null;
  showAxis?: boolean;
}

export default function CandleChart({
  candles,
  x,
  y,
  width,
  height,
  mode = "default",
  dim = false,
  highlight = null,
  showAxis = false,
}: CandleChartProps) {
  const colors = PALETTE[mode];
  const slot = width / candles.length;
  const bodyWidth = Math.max(2.5, Math.min(8, slot * 0.62));
  const priceY = (price: number) =>
    height - (Math.min(100, Math.max(0, price)) / 100) * height;
  const ticks = [0, 25, 50, 75, 100];

  return (
    <svg
      className="pointer-events-none absolute overflow-visible"
      style={{ left: x, top: y }}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      focusable="false"
    >
      {showAxis &&
        ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={0}
              x2={width}
              y1={priceY(tick)}
              y2={priceY(tick)}
              stroke="rgba(230,237,243,0.07)"
              strokeDasharray="2 5"
            />
            <text
              x={-8}
              y={priceY(tick) + 3}
              textAnchor="end"
              fontSize={9}
              fill="#8B98A5"
            >
              {tick}
            </text>
          </g>
        ))}

      {highlight !== null && highlight >= 0 && (
        <rect
          x={slot * highlight}
          y={0}
          width={slot}
          height={height}
          fill="rgba(45,212,191,0.10)"
          stroke="rgba(45,212,191,0.45)"
          strokeWidth={1}
        />
      )}

      {candles.map((candle) => {
        const up = candle.state === "up";
        const color = up ? colors.up : colors.down;
        const bodyTop = priceY(Math.max(candle.open, candle.close));
        const bodyBottom = priceY(Math.min(candle.open, candle.close));
        const bodyHeight = Math.max(1, bodyBottom - bodyTop);
        const centerX = slot * candle.index + slot / 2;

        return (
          <g key={candle.index} opacity={dim ? 0.55 : 1}>
            <line
              x1={centerX}
              x2={centerX}
              y1={priceY(candle.high)}
              y2={priceY(candle.low)}
              stroke={color}
              strokeWidth={1}
            />
            <rect
              x={centerX - bodyWidth / 2}
              y={bodyTop}
              width={bodyWidth}
              height={bodyHeight}
              rx={0.6}
              fill={mode === "mono" || !up ? color : "transparent"}
              stroke={color}
              strokeWidth={mode === "mono" ? 0.8 : 1.2}
            />
          </g>
        );
      })}
    </svg>
  );
}
