"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { CityEngine } from "@/game/city/engine";
import { render } from "@/game/city/render";
import { TutorialMusic } from "@/game/city/tutorialMusic";
import { BUILDINGS } from "@/game/city/buildings";
import type { BuildingType, GridPos } from "@/game/city/types";

/* ============================================================
   GameplayWalkthrough — bot plays Chain City from founding
   to graduation on a live engine, with commentary overlays.
   ============================================================ */

// ── Types ──────────────────────────────────────────────────

interface Commentary {
  title: string;
  body: string;
  icon: string;
  color: string;
  duration: number;
}

interface TimelineStep {
  t: number; // seconds from start
  kind: "place" | "upgrade" | "market" | "comment";
  building?: BuildingType;
  pos?: GridPos;
  upgradeIdx?: number;
  symbol?: string;
  pump?: boolean;
  magnitude?: number;
  comment: Commentary;
}

// ── Config ─────────────────────────────────────────────────

const SPEED = 45;
const FAST_FORWARD_SPEED = 120;
const FAST_FORWARD_AT = 62;
const GHOST_DURATION = 0.8; // seconds ghost shows before placing
const ESTIMATED_TOTAL = 75;

// ── Timeline ───────────────────────────────────────────────
// The bot places buildings in a strategic layout, upgrades key
// buildings, triggers market events, and earns passive income
// all the way to the 50 000 $WICK graduation milestone.

const TIMELINE: TimelineStep[] = [
  {
    t: 0.5,
    kind: "comment",
    comment: {
      title: "WELCOME TO CHAIN CITY",
      body: "Watch our bot build a city from scratch — powered by real stock prices — all the way to the in-game treasury milestone.",
      icon: "▶",
      color: "#22d3ee",
      duration: 5,
    },
  },
  {
    t: 3.0,
    kind: "place",
    building: "market_plaza",
    pos: { col: 3, row: 3 },
    comment: {
      title: "Market Plaza",
      body: "First building placed. ETH-backed, providing steady baseline income for the city.",
      icon: "⊞",
      color: "#627eea",
      duration: 3,
    },
  },
  {
    t: 5.5,
    kind: "place",
    building: "residential",
    pos: { col: 4, row: 3 },
    comment: {
      title: "Residential",
      body: "Growing population. More residents means more economic activity across the city.",
      icon: "⌂",
      color: "#34d399",
      duration: 3,
    },
  },
  {
    t: 7.5,
    kind: "place",
    building: "device_store",
    pos: { col: 5, row: 3 },
    comment: {
      title: "Device Store",
      body: "AAPL-powered. Low volatility, reliable daily earnings — a safe income anchor.",
      icon: "▢",
      color: "#a2aaad",
      duration: 3,
    },
  },
  {
    t: 10.0,
    kind: "place",
    building: "vehicle_depot",
    pos: { col: 6, row: 3 },
    comment: {
      title: "Vehicle Depot",
      body: "TSLA income. High volatility means bigger swings — both up and down.",
      icon: "▤",
      color: "#e82127",
      duration: 3.5,
    },
  },
  {
    t: 12.5,
    kind: "place",
    building: "tech_foundry",
    pos: { col: 3, row: 4 },
    comment: {
      title: "Tech Foundry",
      body: "NVDA chip production. Highest base income in the game — a revenue powerhouse.",
      icon: "◆",
      color: "#76b900",
      duration: 3.5,
    },
  },
  {
    t: 16.0,
    kind: "comment",
    comment: {
      title: "REAL MARKET DATA",
      body: "Each building's income scales with live stock price action. When NVDA pumps, the Foundry earns more. When TSLA dumps, the Depot takes a hit.",
      icon: "↕",
      color: "#22d3ee",
      duration: 4.5,
    },
  },
  {
    t: 20.5,
    kind: "place",
    building: "bank_tower",
    pos: { col: 5, row: 4 },
    comment: {
      title: "Bank Tower",
      body: "Generates $WICK reflections and gives +10% adjacency bonus to all nearby buildings. Position matters!",
      icon: "⬛",
      color: "#ccff00",
      duration: 3.5,
    },
  },
  {
    t: 23.5,
    kind: "place",
    building: "residential",
    pos: { col: 6, row: 5 },
    comment: {
      title: "Expanding",
      body: "Adding more residential to boost population and economic output.",
      icon: "⌂",
      color: "#34d399",
      duration: 3,
    },
  },
  {
    t: 25.5,
    kind: "place",
    building: "market_plaza",
    pos: { col: 7, row: 5 },
    comment: {
      title: "Market Plaza #2",
      body: "Diversifying income streams with another ETH-backed plaza.",
      icon: "⊞",
      color: "#627eea",
      duration: 3,
    },
  },
  {
    t: 28.0,
    kind: "place",
    building: "guild_hall",
    pos: { col: 8, row: 3 },
    comment: {
      title: "Guild Hall",
      body: "15% city-wide income multiplier. A strategic powerhouse — build it early for maximum impact.",
      icon: "⬢",
      color: "#a855f7",
      duration: 3.5,
    },
  },
  {
    t: 31.0,
    kind: "place",
    building: "space_port",
    pos: { col: 6, row: 6 },
    comment: {
      title: "Space Port",
      body: "SPCX aerospace. Explosive upside potential on launch news — high risk, high reward.",
      icon: "▲",
      color: "#ff6b35",
      duration: 3.5,
    },
  },
  {
    t: 34.5,
    kind: "comment",
    comment: {
      title: "PASSIVE INCOME",
      body: "The city now generates $WICK automatically. Income ticks every 3 seconds — watch it flow in above each building.",
      icon: "$",
      color: "#ccff00",
      duration: 4,
    },
  },
  {
    t: 38.5,
    kind: "upgrade",
    upgradeIdx: 0,
    comment: {
      title: "Upgrade: Market Plaza",
      body: "Upgrading multiplies income tier. Lv.1 → Lv.2 = 1.8× base income. Lv.3 = 3.0×.",
      icon: "↑",
      color: "#627eea",
      duration: 3.5,
    },
  },
  {
    t: 41.0,
    kind: "upgrade",
    upgradeIdx: 4,
    comment: {
      title: "Upgrade: Tech Foundry",
      body: "NVDA Foundry upgraded to Lv.2. Income multiplier now 1.8× base — a major revenue boost.",
      icon: "↑",
      color: "#76b900",
      duration: 3.5,
    },
  },
  {
    t: 44.0,
    kind: "market",
    symbol: "TSLA",
    pump: true,
    magnitude: 5.5,
    comment: {
      title: "MARKET EVENT",
      body: "TSLA pumps +5.5%! The Vehicle Depot's income is surging right now.",
      icon: "▲",
      color: "#5bd08a",
      duration: 4,
    },
  },
  {
    t: 48.0,
    kind: "market",
    symbol: "NVDA",
    pump: true,
    magnitude: 6.0,
    comment: {
      title: "MARKET EVENT",
      body: "NVDA pumps +6%! The Tech Foundry's income is through the roof!",
      icon: "▲",
      color: "#5bd08a",
      duration: 4,
    },
  },
  {
    t: 52.0,
    kind: "place",
    building: "device_store",
    pos: { col: 8, row: 5 },
    comment: {
      title: "Reinvesting",
      body: "Reinvesting accumulated income into more buildings to accelerate treasury growth.",
      icon: "▢",
      color: "#a2aaad",
      duration: 3,
    },
  },
  {
    t: 54.5,
    kind: "place",
    building: "residential",
    pos: { col: 9, row: 5 },
    comment: {
      title: "More Residents",
      body: "Population growing steadily — more economic activity means more income per tick.",
      icon: "⌂",
      color: "#34d399",
      duration: 3,
    },
  },
  {
    t: 57.5,
    kind: "comment",
    comment: {
      title: "APPROACHING GRADUATION",
      body: "Treasury is growing rapidly. The 50,000 $WICK graduation target is within reach.",
      icon: "★",
      color: "#e0b04e",
      duration: 4,
    },
  },
];

// ── Component ──────────────────────────────────────────────

export default function GameplayWalkthrough({ onClose }: { onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CityEngine | null>(null);
  const musicRef = useRef<TutorialMusic | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Frame-by-frame state in refs (don't trigger re-renders)
  const elapsedRef = useRef(0);
  const stepIdxRef = useRef(0);
  const ghostStepRef = useRef<number | null>(null);
  const ghostTimerRef = useRef(0);
  const activeCommentRef = useRef<Commentary | null>(null);
  const commentTimerRef = useRef(0);
  const graduationShownRef = useRef(false);
  const finishedRef = useRef(false);
  const playingRef = useRef(true);
  const lastBotActionRef = useRef("INITIALIZING");
  const fastForwardRef = useRef(false);

  // React state for UI updates
  const [, setUiTick] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [finished, setFinished] = useState(false);

  // ── Main loop ──────────────────────────────────────────

  useEffect(() => {
    // Create engine — skip menu, no starter buildings (bot places everything)
    const engine = new CityEngine();
    engine.state.phase = "playing";
    engineRef.current = engine;

    // Ambient music
    const music = new TutorialMusic();
    music.start();
    musicRef.current = music;

    lastTimeRef.current = performance.now();

    function processTimeline(dt: number) {
      const eng = engineRef.current;
      if (!eng) return;

      // Handle ghost preview countdown
      if (ghostStepRef.current !== null) {
        ghostTimerRef.current -= dt;
        if (ghostTimerRef.current <= 0) {
          const step = TIMELINE[ghostStepRef.current];
          if (step.building && step.pos) {
            eng.placeBuilding(step.building, step.pos);
          }
          eng.selectBuilding(null);
          eng.setHover(null);
          activeCommentRef.current = step.comment;
          commentTimerRef.current = step.comment.duration;
          if (step.building) {
            lastBotActionRef.current = `PLACED ${BUILDINGS[step.building].name.toUpperCase()}`;
          }
          stepIdxRef.current = ghostStepRef.current + 1;
          ghostStepRef.current = null;
        }
        return; // don't process next step while ghosting
      }

      const step = TIMELINE[stepIdxRef.current];
      if (!step) return;
      if (elapsedRef.current < step.t) return;

      if (step.kind === "place" && step.building && step.pos) {
        // Start ghost preview — bot "hovers" before placing
        eng.selectBuilding(step.building);
        eng.setHover(step.pos);
        ghostStepRef.current = stepIdxRef.current;
        ghostTimerRef.current = GHOST_DURATION;
        lastBotActionRef.current = `PLACING ${BUILDINGS[step.building].name.toUpperCase()}…`;
      } else if (step.kind === "upgrade" && step.upgradeIdx !== undefined) {
        const b = eng.state.buildings[step.upgradeIdx];
        if (b) {
          eng.upgradeBuilding(b.id);
          lastBotActionRef.current = `UPGRADED ${BUILDINGS[b.type].name.toUpperCase()}`;
        }
        activeCommentRef.current = step.comment;
        commentTimerRef.current = step.comment.duration;
        stepIdxRef.current++;
      } else if (step.kind === "market" && step.symbol) {
        // Manipulate stock feed directly
        const feed = eng.state.feeds.get(step.symbol);
        if (feed) {
          const mag = step.magnitude ?? 5;
          const newChange = step.pump ? feed.change24h + mag : feed.change24h - mag;
          eng.state.feeds.set(step.symbol, {
            ...feed,
            change24h: Math.max(-15, Math.min(15, newChange)),
          });
        }
        lastBotActionRef.current = `MARKET EVENT: ${step.symbol}`;
        activeCommentRef.current = step.comment;
        commentTimerRef.current = step.comment.duration;
        stepIdxRef.current++;
      } else if (step.kind === "comment") {
        activeCommentRef.current = step.comment;
        commentTimerRef.current = step.comment.duration;
        stepIdxRef.current++;
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const eng = engineRef.current;
      if (!eng) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      if (playingRef.current && !finishedRef.current) {
        elapsedRef.current += dt;

        // Speed: normal until fast-forward threshold, then accelerate
        const shouldFF =
          elapsedRef.current > FAST_FORWARD_AT && eng.state.phase !== "graduated";
        fastForwardRef.current = shouldFF;
        const speed = shouldFF ? FAST_FORWARD_SPEED : SPEED;

        // Step the actual game engine
        eng.step(dt * speed);

        // Run bot timeline
        processTimeline(dt);

        // Commentary countdown
        if (commentTimerRef.current > 0) {
          commentTimerRef.current -= dt;
          if (commentTimerRef.current <= 0) {
            activeCommentRef.current = null;
          }
        }

        // Detect graduation
        if (eng.state.phase === "graduated" && !graduationShownRef.current) {
          graduationShownRef.current = true;
          fastForwardRef.current = false;
          activeCommentRef.current = {
            title: "MILESTONE REACHED!",
            body: "Treasury crossed the milestone target. The city has graduated — an in-game goal, not a token launch.",
            icon: "★",
            color: "#ccff00",
            duration: 6,
          };
          commentTimerRef.current = 6;
        }

        // Safety: force graduation if taking too long
        if (
          elapsedRef.current > ESTIMATED_TOTAL &&
          eng.state.phase === "playing" &&
          !graduationShownRef.current
        ) {
          eng.state.wickBalance = Math.max(eng.state.wickBalance, 50000);
        }

        // Finished after graduation commentary ends
        if (
          graduationShownRef.current &&
          commentTimerRef.current <= 0 &&
          !finishedRef.current
        ) {
          finishedRef.current = true;
          setFinished(true);
        }
      }

      // Render the live game
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const dpr = Math.min(2, window.devicePixelRatio || 1);
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
            canvas.width = w * dpr;
            canvas.height = h * dpr;
          }
          ctx.save();
          ctx.scale(dpr, dpr);
          render(ctx, eng.state, w, h);
          ctx.restore();
        }
      }

      // Sync React UI ~10×/s
      if (Math.floor(now / 100) !== Math.floor((now - 16) / 100)) {
        setUiTick((t) => t + 1);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      music.stop();
    };
  }, []);

  // ── Controls ───────────────────────────────────────────

  const togglePlay = useCallback(() => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  }, []);

  const replay = useCallback(() => {
    // Fresh engine
    const fresh = new CityEngine();
    fresh.state.phase = "playing";
    engineRef.current = fresh;

    // Reset all refs
    elapsedRef.current = 0;
    stepIdxRef.current = 0;
    ghostStepRef.current = null;
    ghostTimerRef.current = 0;
    activeCommentRef.current = null;
    commentTimerRef.current = 0;
    graduationShownRef.current = false;
    finishedRef.current = false;
    fastForwardRef.current = false;
    lastBotActionRef.current = "RESTARTING";
    playingRef.current = true;
    setFinished(false);
    setPlaying(true);
    lastTimeRef.current = performance.now();
  }, []);

  // ── Derived UI values (read from refs on each re-render) ──

  const elapsed = elapsedRef.current;
  const activeComment = activeCommentRef.current;
  const botAction = lastBotActionRef.current;
  const isFastForward = fastForwardRef.current;
  const progress = Math.min(1, elapsed / ESTIMATED_TOTAL);
  const commentProgress =
    activeComment && activeComment.duration > 0
      ? Math.max(0, commentTimerRef.current / activeComment.duration)
      : 0;

  const chapter =
    elapsed < 15
      ? "CHAPTER 1 · FOUNDATION"
      : elapsed < 35
        ? "CHAPTER 2 · GROWTH"
        : elapsed < 55
          ? "CHAPTER 3 · EXPANSION"
          : "CHAPTER 4 · GRADUATION";

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="gw-root">
      {/* Live game canvas */}
      <canvas ref={canvasRef} className="gw-canvas" />

      {/* Cinematic letterbox */}
      <div className="gw-letterbox gw-letterbox-top" />
      <div className="gw-letterbox gw-letterbox-bottom" />

      {/* Vignette + scanline overlays */}
      <div className="gw-vignette" />
      <div className="gw-scanlines" />

      {/* Close */}
      <button className="gw-close" onClick={onClose} aria-label="Close walkthrough">
        ✕
      </button>

      {/* Chapter label */}
      <div className="gw-chapter">{chapter}</div>

      {/* Bot status badge */}
      <div className="gw-bot-badge">
        <span className="gw-bot-dot" />
        <span className="gw-bot-label">BOT PLAYING</span>
        <span className="gw-bot-action">{botAction}</span>
      </div>

      {/* Speed indicator */}
      <div className={`gw-speed-badge ${isFastForward ? "ff" : ""}`}>
        {isFastForward ? "⏩ 120× FAST FORWARD" : `▶ ${SPEED}× SPEED`}
      </div>

      {/* Commentary box */}
      {activeComment && !finished && (
        <div
          className="gw-commentary"
          key={activeComment.title + elapsed.toFixed(0)}
          style={{ ["--gw-accent" as string]: activeComment.color } as React.CSSProperties}
        >
          <div
            className="gw-commentary-icon"
            style={{ background: activeComment.color }}
          >
            {activeComment.icon}
          </div>
          <div className="gw-commentary-content">
            <div
              className="gw-commentary-title"
              style={{ color: activeComment.color }}
            >
              {activeComment.title}
            </div>
            <div className="gw-commentary-body">{activeComment.body}</div>
          </div>
          {/* Timer bar */}
          <div className="gw-commentary-timer">
            <div
              className="gw-commentary-timer-fill"
              style={{
                width: `${commentProgress * 100}%`,
                background: activeComment.color,
              }}
            />
          </div>
        </div>
      )}

      {/* Finished overlay */}
      {finished && (
        <div className="gw-finished">
          <div className="gw-finished-title">WALKTHROUGH COMPLETE</div>
          <div className="gw-finished-sub">
            You&apos;ve seen the full Chain City experience — from founding to graduation.
          </div>
          <div className="gw-finished-btns">
            <button className="gw-btn-replay" onClick={replay}>
              ↻ REPLAY
            </button>
            <button className="gw-btn-play" onClick={onClose}>
              FOUND CITY →
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {!finished && (
        <div className="gw-controls">
          <div className="gw-progress-track">
            <div className="gw-progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="gw-btn-row">
            <button className="gw-ctrl-btn" onClick={togglePlay} aria-label="Play/Pause">
              {playing ? "⏸ PAUSE" : "▶ PLAY"}
            </button>
            <span className="gw-time">
              {Math.floor(elapsed)}s / ~{ESTIMATED_TOTAL}s
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
