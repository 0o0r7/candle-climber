"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { TutorialMusic } from "@/game/city/tutorialMusic";

interface TutorialScene {
  duration: number; // ms
  eyebrow: string;
  title: string;
  body: string;
  visual: string;
}

const SCENES: TutorialScene[] = [
  {
    duration: 5000,
    eyebrow: "WELCOME TO",
    title: "CHAIN CITY",
    body: "An economy-driven city builder where every building runs on real stock token prices. Build, earn, and graduate your city onto the open market.",
    visual: "intro",
  },
  {
    duration: 5500,
    eyebrow: "YOUR MISSION",
    title: "Grow to Graduation",
    body: "Start with 5,000 $WICK. Build revenue-generating buildings, earn passive income, and grow your treasury to 50,000 $WICK to graduate your city onto Uniswap v4.",
    visual: "mission",
  },
  {
    duration: 5000,
    eyebrow: "THE GRID",
    title: "Your City Canvas",
    body: "Your city sits on a 12×12 isometric grid. Hover over tiles to preview placements — a ghost preview shows exactly where your building will land.",
    visual: "grid",
  },
  {
    duration: 7000,
    eyebrow: "BUILDING TYPES",
    title: "Eight Buildings · Eight Tickers",
    body: "Each building is tied to a real stock or crypto token. Their income scales with live price action — volatility determines how much.",
    visual: "buildings",
  },
  {
    duration: 5000,
    eyebrow: "REAL MARKET DATA",
    title: "Prices Drive Income",
    body: "When NVDA pumps, your Tech Foundry earns more. When TSLA dumps, your Vehicle Depot takes a hit. Every building's volatility multiplier amplifies or dampens the move.",
    visual: "market",
  },
  {
    duration: 5000,
    eyebrow: "PLACING BUILDINGS",
    title: "Build Your City",
    body: "Click BUILD to open the menu. Select a building type, then click any valid tile to place it. Each placement costs $WICK — spend wisely.",
    visual: "building",
  },
  {
    duration: 5000,
    eyebrow: "PASSIVE INCOME",
    title: "Earn Every 3 Seconds",
    body: "Your buildings generate $WICK automatically. Watch the floating numbers rise above each building. Higher volatility means bigger swings — both up and down.",
    visual: "income",
  },
  {
    duration: 5000,
    eyebrow: "UPGRADES & SYNERGY",
    title: "Multiply Your Earnings",
    body: "Upgrade buildings to boost their income tier. Place a Bank Tower near other buildings for a 10% adjacency bonus. Build a Guild Hall for a 15% city-wide multiplier.",
    visual: "upgrade",
  },
  {
    duration: 5000,
    eyebrow: "MARKET EVENTS",
    title: "Pumps & Dumps",
    body: "Random market events shift stock prices in real time. Watch the event log for breaking moves — a sudden TSLA pump could send your income soaring.",
    visual: "events",
  },
  {
    duration: 4500,
    eyebrow: "CAMERA CONTROLS",
    title: "Explore Your City",
    body: "Right-click and drag to pan across the grid. Scroll the mouse wheel to zoom in and out. Take in the neon skyline as your empire grows.",
    visual: "camera",
  },
  {
    duration: 4500,
    eyebrow: "DAY & NIGHT",
    title: "A Living City",
    body: "Your city cycles through day and night. As darkness falls, building windows light up and stars fill the sky — your city never sleeps.",
    visual: "daynight",
  },
  {
    duration: 5000,
    eyebrow: "GRADUATION",
    title: "Go Public",
    body: "When your treasury crosses 50,000 $WICK, your city graduates. $WICK tokens list on Uniswap v4, and you can continue building your empire.",
    visual: "graduation",
  },
  {
    duration: 5000,
    eyebrow: "STRATEGY",
    title: "Build Smart",
    body: "Balance high-risk buildings like Space Ports with stable Device Stores. Cluster buildings around Bank Towers. Prioritize a Guild Hall early for that 15% boost.",
    visual: "strategy",
  },
  {
    duration: 4000,
    eyebrow: "READY TO BUILD",
    title: "Found Your City",
    body: "You now know everything you need. Start with 5,000 $WICK, build strategically, and graduate your city to the open market.",
    visual: "ready",
  },
];

const TOTAL_MS = SCENES.reduce((s, sc) => s + sc.duration, 0);
const FADE_MS = 400;

export default function CityTutorial({ onClose }: { onClose: () => void }) {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0); // 0–1 within current scene
  const [overallProgress, setOverallProgress] = useState(0); // 0–1 overall
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);
  const [fading, setFading] = useState(false);

  const musicRef = useRef<TutorialMusic | null>(null);
  const rafRef = useRef<number>(0);
  const sceneStartRef = useRef<number>(0);
  const pausedRemainRef = useRef<number>(0);

  const scene = SCENES[sceneIdx];

  const advanceTo = useCallback(
    (idx: number) => {
      if (idx >= SCENES.length) {
        setFinished(true);
        setPlaying(false);
        return;
      }
      setFading(true);
      setTimeout(() => {
        setSceneIdx(idx);
        setSceneProgress(0);
        setFading(false);
        sceneStartRef.current = performance.now();
      }, FADE_MS);
    },
    [],
  );

  // rAF loop for smooth progress + auto-advance
  useEffect(() => {
    if (!playing || finished) return;
    sceneStartRef.current = performance.now() - pausedRemainRef.current;

    const loop = (now: number) => {
      const elapsed = now - sceneStartRef.current;
      const dur = SCENES[sceneIdx].duration;
      const p = Math.min(1, elapsed / dur);

      setSceneProgress(p);

      // overall progress
      let before = 0;
      for (let i = 0; i < sceneIdx; i++) before += SCENES[i].duration;
      setOverallProgress(Math.min(1, (before + elapsed) / TOTAL_MS));

      if (p >= 1) {
        advanceTo(sceneIdx + 1);
        return;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, finished, sceneIdx, advanceTo]);

  // music lifecycle
  useEffect(() => {
    const m = new TutorialMusic();
    musicRef.current = m;
    m.start();
    return () => m.stop();
  }, []);

  const togglePlay = useCallback(() => {
    setPlaying((prev) => {
      const next = !prev;
      if (next) {
        // resuming
        pausedRemainRef.current = 0;
      } else {
        // pausing — record remaining
        const elapsed = performance.now() - sceneStartRef.current;
        pausedRemainRef.current = elapsed;
      }
      return next;
    });
  }, []);

  const skipForward = useCallback(() => advanceTo(sceneIdx + 1), [sceneIdx, advanceTo]);
  const skipBack = useCallback(() => {
    if (sceneIdx === 0) return;
    advanceTo(sceneIdx - 1);
  }, [sceneIdx, advanceTo]);

  const replay = useCallback(() => {
    setFinished(false);
    setSceneIdx(0);
    setSceneProgress(0);
    setOverallProgress(0);
    setPlaying(true);
    pausedRemainRef.current = 0;
    sceneStartRef.current = performance.now();
  }, []);

  return (
    <div className="ct-root">
      {/* Cinematic letterbox */}
      <div className="ct-letterbox ct-letterbox-top" />
      <div className="ct-letterbox ct-letterbox-bottom" />

      {/* Close button */}
      <button className="ct-close" onClick={onClose} aria-label="Close tutorial">
        ✕
      </button>

      {/* Scene content */}
      <div className={`ct-stage ${fading ? "ct-fade-out" : "ct-fade-in"}`} key={sceneIdx}>
        <SceneVisual visual={scene.visual} />
        <div className="ct-text-block">
          <div className="ct-eyebrow">{scene.eyebrow}</div>
          <h2 className="ct-title">{scene.title}</h2>
          <p className="ct-body">{scene.body}</p>
        </div>
      </div>

      {/* Scene counter */}
      <div className="ct-scene-counter">
        {String(sceneIdx + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
      </div>

      {/* Finished overlay */}
      {finished && (
        <div className="ct-finished">
          <div className="ct-finished-title">TUTORIAL COMPLETE</div>
          <div className="ct-finished-sub">You&apos;re ready to build.</div>
          <div className="ct-finished-btns">
            <button className="ct-btn-replay" onClick={replay}>
              ↻ REPLAY
            </button>
            <button className="ct-btn-play" onClick={onClose}>
              FOUND CITY →
            </button>
          </div>
        </div>
      )}

      {/* Controls bar */}
      <div className="ct-controls">
        {/* Progress bar */}
        <div className="ct-progress-track" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = (e.clientX - rect.left) / rect.width;
          const targetMs = ratio * TOTAL_MS;
          let acc = 0;
          let target = 0;
          for (let i = 0; i < SCENES.length; i++) {
            if (acc + SCENES[i].duration >= targetMs) {
              target = i;
              break;
            }
            acc += SCENES[i].duration;
          }
          setSceneIdx(target);
          pausedRemainRef.current = Math.max(0, targetMs - acc);
          setPlaying(true);
          setFinished(false);
        }}>
          <div className="ct-progress-fill" style={{ width: `${overallProgress * 100}%` }} />
          {/* Scene markers */}
          {SCENES.map((_, i) => {
            let off = 0;
            for (let j = 0; j < i; j++) off += SCENES[j].duration;
            return (
              <div
                key={i}
                className={`ct-progress-marker ${i === sceneIdx ? "active" : ""} ${i < sceneIdx ? "done" : ""}`}
                style={{ left: `${(off / TOTAL_MS) * 100}%` }}
              />
            );
          })}
        </div>

        {/* Buttons */}
        <div className="ct-btn-row">
          <button className="ct-ctrl-btn" onClick={skipBack} disabled={sceneIdx === 0} aria-label="Previous">
            ⏮
          </button>
          <button className="ct-ctrl-btn ct-ctrl-play" onClick={togglePlay} aria-label="Play/Pause">
            {playing ? "⏸" : "▶"}
          </button>
          <button className="ct-ctrl-btn" onClick={skipForward} disabled={finished} aria-label="Next">
            ⏭
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- Scene visuals ---------- */

function SceneVisual({ visual }: { visual: string }) {
  switch (visual) {
    case "intro":
      return (
        <div className="ct-vis ct-vis-intro">
          <div className="ct-intro-grid" />
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="ct-particle"
              style={{
                left: `${(i * 37) % 100}%`,
                animationDelay: `${i * 0.15}s`,
                animationDuration: `${3 + (i % 4)}s`,
              }}
            />
          ))}
          <div className="ct-intro-glow" />
        </div>
      );

    case "mission":
      return (
        <div className="ct-vis ct-vis-mission">
          <div className="ct-mission-counter">
            <span className="ct-mission-wick">$WICK</span>
            <span className="ct-mission-num">
              <CounterAnim target={50000} />
            </span>
          </div>
          <div className="ct-mission-bar-wrap">
            <div className="ct-mission-bar-track">
              <div className="ct-mission-bar-fill" />
            </div>
            <div className="ct-mission-bar-label">GRADUATION PROGRESS</div>
          </div>
        </div>
      );

    case "grid":
      return (
        <div className="ct-vis ct-vis-grid">
          <div className="ct-iso-grid">
            {[...Array(36)].map((_, i) => {
              const col = i % 6;
              const row = Math.floor(i / 6);
              return (
                <div
                  key={i}
                  className="ct-iso-tile"
                  style={{
                    animationDelay: `${(col + row) * 0.08}s`,
                    transform: `translate(${(col - row) * 28}px, ${(col + row) * 14}px)`,
                  }}
                />
              );
            })}
          </div>
        </div>
      );

    case "buildings":
      return (
        <div className="ct-vis ct-vis-buildings">
          {[
            { name: "Tech Foundry", ticker: "NVDA", cost: 500, color: "#76b900", glow: "rgba(118,185,0,.5)" },
            { name: "Device Store", ticker: "AAPL", cost: 300, color: "#a2aaad", glow: "rgba(162,170,173,.4)" },
            { name: "Space Port", ticker: "SPCX", cost: 800, color: "#ff6b35", glow: "rgba(255,107,53,.5)" },
            { name: "Vehicle Depot", ticker: "TSLA", cost: 400, color: "#e82127", glow: "rgba(232,33,39,.4)" },
            { name: "Market Plaza", ticker: "ETH", cost: 200, color: "#627eea", glow: "rgba(98,126,234,.4)" },
            { name: "Bank Tower", ticker: "WICK", cost: 600, color: "#ccff00", glow: "rgba(204,255,0,.5)" },
            { name: "Guild Hall", ticker: "GUILD", cost: 1000, color: "#a855f7", glow: "rgba(168,85,247,.5)" },
            { name: "Residential", ticker: "HOME", cost: 150, color: "#34d399", glow: "rgba(52,211,153,.4)" },
          ].map((b, i) => (
            <div
              key={b.ticker}
              className="ct-building-card"
              style={{
                animationDelay: `${i * 0.12}s`,
                borderColor: b.color + "55",
              }}
            >
              <div className="ct-building-swatch" style={{ background: b.color, boxShadow: `0 0 10px ${b.glow}` }} />
              <div className="ct-building-info">
                <div className="ct-building-name">{b.name}</div>
                <div className="ct-building-ticker">{b.ticker}</div>
              </div>
              <div className="ct-building-cost">{b.cost}</div>
            </div>
          ))}
        </div>
      );

    case "market":
      return (
        <div className="ct-vis ct-vis-market">
          <div className="ct-ticker-tape">
            {[
              { sym: "NVDA", chg: "+2.4%" },
              { sym: "AAPL", chg: "+0.8%" },
              { sym: "TSLA", chg: "+3.1%" },
              { sym: "ETH", chg: "-0.5%" },
              { sym: "SPCX", chg: "-1.2%" },
              { sym: "WICK", chg: "+5.2%" },
            ].map((s, i) => (
              <div key={i} className="ct-ticker-item">
                <span className="ct-ticker-sym">{s.sym}</span>
                <span className={`ct-ticker-chg ${s.chg.startsWith("+") ? "up" : "down"}`}>{s.chg}</span>
              </div>
            ))}
          </div>
          <div className="ct-market-arrows">
            <div className="ct-market-arrow up">▲ NVDA +2.4%</div>
            <div className="ct-market-arrow down">▼ TSLA -1.8%</div>
          </div>
        </div>
      );

    case "building":
      return (
        <div className="ct-vis ct-vis-building">
          <div className="ct-build-mock">
            <div className="ct-build-mock-btn">⊞ BUILD</div>
            <div className="ct-build-mock-arrow">↓</div>
            <div className="ct-build-mock-menu">
              <div className="ct-build-mock-card selected">
                <div className="ct-build-mock-swatch" style={{ background: "#76b900" }} />
                <span>Tech Foundry</span>
                <span className="ct-build-mock-cost">500</span>
              </div>
            </div>
          </div>
        </div>
      );

    case "income":
      return (
        <div className="ct-vis ct-vis-income">
          <div className="ct-income-grid">
            {[0, 1, 2].map((row) =>
              [0, 1, 2].map((col) => (
                <div
                  key={`${row}-${col}`}
                  className="ct-income-building"
                  style={{
                    animationDelay: `${(row + col) * 0.3}s`,
                    background: ["#76b900", "#e82127", "#627eea"][col],
                  }}
                >
                  <div className="ct-income-float" style={{ animationDelay: `${(row + col) * 0.3 + 0.5}s` }}>
                    +{(4 + Math.random() * 8).toFixed(1)}
                  </div>
                </div>
              )),
            )}
          </div>
        </div>
      );

    case "upgrade":
      return (
        <div className="ct-vis ct-vis-upgrade">
          <div className="ct-upgrade-scene">
            <div className="ct-upgrade-building lv1">
              <div className="ct-upgrade-level">LV.1</div>
            </div>
            <div className="ct-upgrade-arrow">→</div>
            <div className="ct-upgrade-building lv2">
              <div className="ct-upgrade-level">LV.2</div>
              <div className="ct-upgrade-star">★</div>
            </div>
            <div className="ct-upgrade-arrow">→</div>
            <div className="ct-upgrade-building lv3">
              <div className="ct-upgrade-level">LV.3</div>
              <div className="ct-upgrade-star">★★</div>
            </div>
          </div>
        </div>
      );

    case "events":
      return (
        <div className="ct-vis ct-vis-events">
          <div className="ct-event-card pump" style={{ animationDelay: "0s" }}>
            <div className="ct-event-icon">▲</div>
            <div className="ct-event-text">
              <div className="ct-event-title">TSLA PUMPS +4.2%</div>
              <div className="ct-event-sub">Vehicle Depot income surging</div>
            </div>
          </div>
          <div className="ct-event-card dump" style={{ animationDelay: "1.2s" }}>
            <div className="ct-event-icon">▼</div>
            <div className="ct-event-text">
              <div className="ct-event-title">NVDA DUMPS -2.1%</div>
              <div className="ct-event-sub">Tech Foundry income dropping</div>
            </div>
          </div>
        </div>
      );

    case "camera":
      return (
        <div className="ct-vis ct-vis-camera">
          <div className="ct-camera-pad">
            <div className="ct-camera-arrow up">↑</div>
            <div className="ct-camera-row">
              <div className="ct-camera-arrow left">←</div>
              <div className="ct-camera-center">PAN</div>
              <div className="ct-camera-arrow right">→</div>
            </div>
            <div className="ct-camera-arrow down">↓</div>
          </div>
          <div className="ct-camera-zoom">
            <div className="ct-camera-zoom-btn">−</div>
            <div className="ct-camera-zoom-label">ZOOM</div>
            <div className="ct-camera-zoom-btn">+</div>
          </div>
        </div>
      );

    case "daynight":
      return (
        <div className="ct-vis ct-vis-daynight">
          <div className="ct-daynight-bar">
            <div className="ct-daynight-sun" />
            <div className="ct-daynight-moon" />
            <div className="ct-daynight-stars">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="ct-daynight-star"
                  style={{ left: `${(i * 23) % 100}%`, top: `${(i * 17) % 60}%`, animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>
          </div>
          <div className="ct-daynight-labels">
            <span>☀ DAY</span>
            <span>NIGHT ☾</span>
          </div>
        </div>
      );

    case "graduation":
      return (
        <div className="ct-vis ct-vis-graduation">
          <div className="ct-grad-sparkles">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="ct-grad-sparkle"
                style={{
                  left: `${(i * 37 + 10) % 100}%`,
                  top: `${(i * 53 + 5) % 80}%`,
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </div>
          <div className="ct-grad-badge">★ GOES PUBLIC ★</div>
          <div className="ct-grad-confetti">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                className="ct-grad-confetti-piece"
                style={{
                  left: `${i * 10}%`,
                  background: ["#ccff00", "#22d3ee", "#a855f7", "#fbbf24"][i % 4],
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      );

    case "strategy":
      return (
        <div className="ct-vis ct-vis-strategy">
          <div className="ct-strat-card">
            <div className="ct-strat-icon">⚖</div>
            <div className="ct-strat-text">Balance high-risk buildings with stable earners</div>
          </div>
          <div className="ct-strat-card">
            <div className="ct-strat-icon">🏦</div>
            <div className="ct-strat-text">Cluster around Bank Towers for +10% adjacency bonus</div>
          </div>
          <div className="ct-strat-card">
            <div className="ct-strat-icon">🏰</div>
            <div className="ct-strat-text">Build a Guild Hall early for +15% city-wide income</div>
          </div>
        </div>
      );

    case "ready":
      return (
        <div className="ct-vis ct-vis-ready">
          <div className="ct-ready-pulse" />
          <div className="ct-ready-btn-mock">FOUND CITY</div>
          <div className="ct-ready-balance">STARTING BALANCE: 5,000 $WICK</div>
        </div>
      );

    default:
      return null;
  }
}

function CounterAnim({ target }: { target: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const dur = 3000;
    let raf = 0;
    const loop = (now: number) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return <>{val.toLocaleString()}</>;
}
