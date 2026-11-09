import { useEffect, useRef, useState } from "react";
import { STAGE_HEIGHT, STAGE_WIDTH } from "./components/StageFrame";
import CandleCall from "./etudes/CandleCall";
import ColorblindSafe from "./etudes/ColorblindSafe";
import DepthScene from "./etudes/DepthScene";
import ReducedMotion from "./etudes/ReducedMotion";
import SummitRail from "./etudes/SummitRail";
import type { EtudeProps } from "./etudes/types";

type EtudeTab = {
  id: string;
  label: string;
  caption: string;
  stageLabel: string;
  Component: React.ComponentType<EtudeProps>;
};

const TABS: EtudeTab[] = [
  {
    id: "summit-rail",
    label: "1 · Summit Rail",
    caption:
      "Summit Rail — altitude progress rail with a camera handle that starts 30% from the top. Buttons or ↑/↓ move it; no physics.",
    stageLabel: "Etude 1: Summit Rail",
    Component: SummitRail,
  },
  {
    id: "candle-call",
    label: "2 · Candle Call",
    caption:
      "Candle Call — hover or Tab to any of the 60 synthetic candles. Enter pins, Esc closes, and the callout flips side near the edges.",
    stageLabel: "Etude 2: Candle Call",
    Component: CandleCall,
  },
  {
    id: "colorblind",
    label: "3 · Colorblind-safe",
    caption:
      "Colorblind-safe — hue plus body fill/border shape. Contrast ratios are computed live from the rendered text tokens.",
    stageLabel: "Etude 3: Colorblind-safe contrast",
    Component: ColorblindSafe,
  },
  {
    id: "reduced-motion",
    label: "4 · Reduced motion",
    caption:
      "Reduced motion — clouds, summit glow and the rail handle follow the Auto/Full/Reduced toggle and prefers-reduced-motion.",
    stageLabel: "Etude 4: Reduced motion",
    Component: ReducedMotion,
  },
  {
    id: "depth",
    label: "5 · 2.5D bounded",
    caption:
      "2.5D bounded — three CSS-transformed layers clamped inside the frame. The climber stays fixed while the world pans.",
    stageLabel: "Etude 5: 2.5D bounded scene",
    Component: DepthScene,
  },
];

const GUARDRAILS = [
  "No network calls · no fetch/XHR · no external APIs",
  "Seeded PRNG — mulberry32(1337) · no Math.random()",
  "No game logic — no physics, collision, scoring or terrain",
  "Fixed 800 × 480 stage · scaled only by CSS transform",
  "Synthetic data only · no market feed, no advice",
];

function useStageScale() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const update = () => {
      const available = node.clientWidth;
      setScale(Math.min(1, Math.max(0.32, available / STAGE_WIDTH)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale };
}

export default function App() {
  const [active, setActive] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const { containerRef, scale } = useStageScale();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = TABS[active];
  const Stage = tab.Component;

  const onTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="mx-auto w-full max-w-[880px] px-4 pb-10 pt-7">
        <header>
          <p className="text-[10px] uppercase tracking-[0.24em] text-teal">
            UI Etudes · design mockups
          </p>
          <h1 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight">
            Candle Climber — UI Etudes
          </h1>
          <p className="mt-1 text-[11px] text-muted">
            Synthetic data · Seed 1337 · Design mockup only
          </p>
        </header>

        <nav className="mt-5">
          <div
            role="tablist"
            aria-label="Etude tabs"
            className="flex gap-1 overflow-x-auto rounded-[8px] border border-white/10 bg-panel p-1"
          >
            {TABS.map((item, index) => {
              const selected = index === active;
              return (
                <button
                  key={item.id}
                  ref={(node) => {
                    tabRefs.current[index] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`etude-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`etude-panel-${item.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActive(index)}
                  onKeyDown={(event) => onTabKeyDown(event, index)}
                  className={`whitespace-nowrap rounded-[6px] border px-2.5 py-1.5 text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal ${
                    selected
                      ? "border-teal/50 bg-teal/10 text-teal"
                      : "border-transparent text-muted hover:border-white/15 hover:text-ink"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <main>
          <div
            id={`etude-panel-${tab.id}`}
            role="tabpanel"
            aria-labelledby={`etude-tab-${tab.id}`}
            tabIndex={0}
            className="mt-4 rounded-[8px] outline-none focus-visible:ring-1 focus-visible:ring-teal/40"
          >
            <div ref={containerRef} className="flex w-full justify-center">
              <div
                style={{
                  width: STAGE_WIDTH * scale,
                  height: STAGE_HEIGHT * scale,
                }}
              >
                <div
                  style={{
                    width: STAGE_WIDTH,
                    height: STAGE_HEIGHT,
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                  }}
                >
                  <Stage showAnnotations={showAnnotations} />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
              <p className="max-w-[600px] text-[11px] leading-relaxed text-muted">
                {tab.caption}
              </p>
              <button
                type="button"
                role="switch"
                aria-checked={showAnnotations}
                onClick={() => setShowAnnotations((value) => !value)}
                className="flex shrink-0 items-center gap-2 rounded-[6px] border border-white/10 bg-panel px-2 py-1 text-[10px] text-muted transition-colors hover:border-white/25 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal"
              >
                <span
                  className={`relative h-4 w-7 rounded-full border transition-colors ${
                    showAnnotations
                      ? "border-teal/60 bg-teal/20"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  <span
                    className={`absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full transition-all ${
                      showAnnotations
                        ? "left-[13px] bg-teal"
                        : "left-[3px] bg-muted"
                    }`}
                  />
                </span>
                Show annotations
              </button>
            </div>
          </div>
        </main>

        <footer className="mt-6 rounded-[8px] border border-white/10 bg-panel p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
            <span className="text-[10px] uppercase tracking-[0.16em] text-muted">
              Audit panel
            </span>
            <span className="font-mono text-[10px] text-teal">etude-v1</span>
          </div>

          <div className="mt-3 grid gap-5 text-[10px] leading-relaxed sm:grid-cols-3">
            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-muted">
                Build
              </div>
              <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-muted">Version</dt>
                <dd className="font-mono text-ink">etude-v1</dd>
                <dt className="text-muted">PRNG seed</dt>
                <dd className="font-mono text-ink">1337 · mulberry32</dd>
                <dt className="text-muted">Candles</dt>
                <dd className="font-mono text-ink">60 · synthetic</dd>
                <dt className="text-muted">Stage</dt>
                <dd className="font-mono text-ink">800 × 480</dd>
                <dt className="text-muted">Backend</dt>
                <dd className="font-mono text-ink">none · client-only</dd>
              </dl>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-muted">
                Etudes
              </div>
              <ol className="mt-1.5 grid gap-1">
                {TABS.map((item) => (
                  <li key={item.id} className="flex items-center gap-1.5 text-muted">
                    <span className="text-teal">▪</span>
                    {item.label}
                  </li>
                ))}
              </ol>
            </div>

            <div>
              <div className="text-[9px] uppercase tracking-[0.12em] text-muted">
                Guardrails
              </div>
              <ul className="mt-1.5 grid gap-1">
                {GUARDRAILS.map((item) => (
                  <li key={item} className="flex items-start gap-1.5 text-muted">
                    <span className="mt-px text-teal">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
