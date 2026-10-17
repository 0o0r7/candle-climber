"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ForgeEngine, VIEW_W, VIEW_H, PLAYER_SPEED, PLAYER_SPRINT } from "@/game/vg/engine";
import { buildArena, GRID_COLS, GRID_ROWS, CELL_SIZE } from "@/game/vg/arena";
import { dailyMutation } from "@/game/vg/mutations";
import { render } from "@/game/vg/render";
import { sfx, setMuted, unlockAudio } from "@/game/vg/sound";
import { hashString, mulberry32, utcDateStr } from "@/game/cc/rng";
import type { Candle, CandleData } from "@/game/cc/types";
import type { RunResult, MutationMods } from "@/game/vg/types";
import { buildForgeProofMessage } from "@/lib/proof-message";
import { WALLET_ADDRESS_KEY, isValidAddress } from "@/lib/wallet";
import type { ForgeBoardEntry } from "@/lib/forge-board-validation";

const NAME_KEY = "vg_name_v1";

type Phase = "loading" | "ready" | "running" | "dead";

// Synthetic candle generator for offline play (same approach as cc/level-source)
function syntheticCandles(seedStr: string, count = 80): Candle[] {
  const rnd = mulberry32(hashString("vg-synth:" + seedStr));
  let price = 100;
  const candles: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const o = price;
    const change = (rnd() - 0.48) * 8;
    const c = Math.max(1, o + change);
    const h = Math.max(o, c) + rnd() * 4;
    const l = Math.min(o, c) - rnd() * 4;
    candles.push({ t: i * 86400000, o, h, l, c, v: rnd() * 1000 });
    price = c;
  }
  return candles;
}

export default function ArenaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ForgeEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const touchRef = useRef<{ active: boolean; x: number; y: number }>({ active: false, x: 0, y: 0 });

  const [phase, setPhase] = useState<Phase>("loading");
  const [mutation, setMutation] = useState<MutationMods | null>(null);
  const [hud, setHud] = useState({ score: 0, margin: 100, chain: 0 });
  const [result, setResult] = useState<RunResult | null>(null);
  const [best, setBest] = useState(0);
  const [muted, setMutedState] = useState(false);
  const [seedInfo, setSeedInfo] = useState<{ symbol: string; date: string } | null>(null);
  const [name, setName] = useState("ANON");
  const [board, setBoard] = useState<ForgeBoardEntry[]>([]);
  const [officialBoard, setOfficialBoard] = useState<ForgeBoardEntry[]>([]);
  const [rank, setRank] = useState<number | null>(null);
  const [laneNote, setLaneNote] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // server-issued arena token (absent on the offline/synthetic fallback)
  const runTokenRef = useRef<string | undefined>(undefined);
  const mutationIdRef = useRef<string>("");

  // Load best from localStorage
  useEffect(() => {
    const b = localStorage.getItem("vg_best_v1");
    if (b) setBest(parseInt(b, 10) || 0);
    const m = localStorage.getItem("vg_muted_v1");
    if (m === "1") { setMutedState(true); setMuted(true); }
    const n = localStorage.getItem(NAME_KEY);
    if (n) setName(n);
  }, []);

  // Refresh the daily Forge board (guest + official lanes)
  const refreshBoard = useCallback(async (date: string) => {
    try {
      const b = await fetch(`/api/forge/leaderboard?date=${date}`).then((r) => r.json());
      setBoard(b.entries ?? []);
      if (b.official) setOfficialBoard(b.official);
    } catch { /* board stays empty — the run itself is unaffected */ }
  }, []);

  // Submit a finished run to the Forge board. The run token (issued with the
  // arena) is mandatory for scoring; without it the run stays local-only.
  // A linked wallet that signs the canonical forge proof lands on the OFFICIAL
  // lane — no provider/rejection/timeout degrades to the GUEST lane (fail-open).
  const submitRun = useCallback(async (r: RunResult) => {
    const token = runTokenRef.current;
    if (!token) return; // offline/synthetic arena — unscored by construction
    setSubmitted(true);
    const finalName = (localStorage.getItem(NAME_KEY) || "ANON").slice(0, 14);
    const walletAddr = localStorage.getItem(WALLET_ADDRESS_KEY);
    let signature: string | undefined;
    let ts: number | undefined;
    if (walletAddr && isValidAddress(walletAddr)) {
      const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
      if (eth) {
        ts = Date.now();
        const msg = buildForgeProofMessage(
          {
            score: Math.floor(r.score),
            survivalTime: Math.floor(r.survivalTime),
            signalsCollected: Math.floor(r.signalsCollected),
            date: r.date,
            wallet: walletAddr.toLowerCase(),
          },
          ts,
        );
        const msgHex = "0x" + [...new TextEncoder().encode(msg)].map((b) => b.toString(16).padStart(2, "0")).join("");
        try {
          const s = await eth.request({ method: "personal_sign", params: [msgHex, walletAddr] });
          if (typeof s === "string" && /^0x[0-9a-fA-F]{130}$/.test(s)) signature = s;
        } catch { /* rejected / unavailable — guest lane, note explains honestly */ }
      }
    }
    try {
      const res = await fetch("/api/forge/leaderboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalName,
          score: r.score,
          survivalTime: r.survivalTime,
          signalsCollected: r.signalsCollected,
          maxChain: r.maxChain,
          mutation: mutationIdRef.current,
          runToken: token,
          address: walletAddr ?? undefined,
          signature,
          ts,
          nonce: crypto.randomUUID().replace(/-/g, "") + Date.now().toString(36),
        }),
      });
      const j = await res.json();
      if (typeof j.rank === "number") setRank(j.rank);
      setLaneNote(
        typeof j.note === "string" && j.note
          ? j.note
          : j.board === "guest" && isValidAddress(walletAddr ?? "")
            ? "no signature — run posted to the GUEST board"
            : null,
      );
    } catch { /* score stays in the local best */ }
    await refreshBoard(r.date);
  }, [refreshBoard]);

  // Initialize the arena
  const initArena = useCallback(async () => {
    setPhase("loading");
    const date = utcDateStr();
    // Try to fetch real candles from the API
    let candles: Candle[] = [];
    let symbol = "BTCUSDT";
    let forgeToken: string | undefined;
    try {
      const resp = await fetch("/api/candles");
      if (resp.ok) {
        const data = (await resp.json()) as CandleData & { forgeRunToken?: string };
        candles = data.candles;
        symbol = data.seed.symbol;
        forgeToken = data.forgeRunToken;
      }
    } catch { /* fallback to synthetic */ }
    runTokenRef.current = forgeToken;
    // fresh run — clear the previous run's board state
    setResult(null);
    setRank(null);
    setLaneNote(null);
    setSubmitted(false);

    if (candles.length < 20) {
      candles = syntheticCandles(date);
      symbol = "SYNTHETIC";
    }

    const seedStr = `${date}:${symbol}`;
    const grid = buildArena(candles, seedStr);
    const mods = dailyMutation(date, symbol);
    mutationIdRef.current = mods.id;

    setMutation(mods);
    setSeedInfo({ symbol, date });
    void refreshBoard(date);

    const eng = new ForgeEngine(grid, mods, {
      onDeath: (r) => {
        r.symbol = symbol;
        r.date = date;
        setResult(r);
        setPhase("dead");
        if (r.score > best) {
          setBest(r.score);
          localStorage.setItem("vg_best_v1", String(r.score));
        }
        void submitRun(r);
      },
      onScore: (score, margin, chain) => {
        setHud({ score, margin: Math.round(margin), chain });
      },
      onSfx: (name) => sfx(name),
    }, seedStr);

    engineRef.current = eng;
    setPhase("ready");
  }, [best, submitRun, refreshBoard]);

  useEffect(() => {
    initArena();
  }, [initArena]);

  // Game loop
  useEffect(() => {
    if (phase !== "running") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (now: number) => {
      const eng = engineRef.current;
      if (!eng) return;
      const dt = Math.min(0.033, (now - lastRef.current) / 1000);
      lastRef.current = now;

      // Read keyboard input
      const keys = keysRef.current;
      let ix = 0, iy = 0;
      if (keys.has("w") || keys.has("arrowup")) iy -= 1;
      if (keys.has("s") || keys.has("arrowdown")) iy += 1;
      if (keys.has("a") || keys.has("arrowleft")) ix -= 1;
      if (keys.has("d") || keys.has("arrowright")) ix += 1;

      // Touch input
      if (touchRef.current.active) {
        ix = touchRef.current.x;
        iy = touchRef.current.y;
      }

      eng.setInput(ix, iy);
      eng.setSprint(keys.has("shift"));
      eng.update(dt);
      render(ctx, eng, eng.time);

      if (!eng.dead) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Keyboard handlers
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysRef.current.add(key);
      if (key === " " && phase === "running") {
        e.preventDefault();
        engineRef.current?.requestDash();
      }
      if (key === "enter" && phase === "ready") {
        startGame();
      }
      if (key === "enter" && phase === "dead") {
        initArena();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [phase]);

  const startGame = useCallback(() => {
    unlockAudio();
    setPhase("running");
    setHud({ score: 0, margin: 100, chain: 0 });
  }, []);

  const toggleMute = useCallback(() => {
    const m = !muted;
    setMutedState(m);
    setMuted(m);
    localStorage.setItem("vg_muted_v1", m ? "1" : "0");
  }, [muted]);

  // Touch joystick
  const onTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const t = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    touchRef.current = {
      active: true,
      x: ((t.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((t.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!touchRef.current.active) return;
    const t = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    touchRef.current.x = ((t.clientX - rect.left) / rect.width - 0.5) * 2;
    touchRef.current.y = ((t.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    touchRef.current = { active: false, x: 0, y: 0 };
  };

  const canvasStyle = useMemo(() => ({
    width: "100%",
    height: "auto",
    maxWidth: `${VIEW_W}px`,
    aspectRatio: `${VIEW_W} / ${VIEW_H}`,
    touchAction: "none" as const,
  }), []);

  return (
    <div className="vg-stage">
      <div className="vg-hud-top">
        {seedInfo && (
          <div className="vg-hud-seed">
            <span className="vg-hud-symbol">{seedInfo.symbol}</span>
            <span className="vg-hud-date">{seedInfo.date}</span>
          </div>
        )}
        {mutation && (
          <div className="vg-hud-mutation">{mutation.name}</div>
        )}
        <button className="vg-mute-btn" onClick={toggleMute}>
          {muted ? "🔇" : "🔊"}
        </button>
      </div>

      <div className="vg-canvas-wrap" style={canvasStyle}>
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          style={canvasStyle}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />

        {phase === "loading" && (
          <div className="vg-overlay">
            <div className="vg-loading">LOADING ARENA…</div>
          </div>
        )}

        {phase === "ready" && (
          <div className="vg-overlay" onClick={startGame}>
            <div className="vg-ready">
              <h2 className="vg-ready-title">SIGNAL FORGE</h2>
              {mutation && <div className="vg-ready-mutation">{mutation.name}</div>}
              {seedInfo && <div className="vg-ready-seed">{seedInfo.symbol} · {seedInfo.date}</div>}
              <div className="vg-ready-instructions">
                <p>Move to <span className="vg-green-text">GREEN</span> cells to regenerate margin.</p>
                <p>Avoid <span className="vg-red-text">RED</span> cells — they drain your margin.</p>
                <p>Collect <span className="vg-purple-text">SIGNALS</span> for score. Chain 5 for 2× multiplier.</p>
                <p>Watch for <span className="vg-magenta-text">VOLATILITY WAVES</span> — they flip cells.</p>
              </div>
              <div className="vg-ready-controls">
                <span>WASD / ARROWS — MOVE</span>
                <span>SPACE — DASH</span>
                <span>SHIFT — SPRINT</span>
              </div>
              <input
                className="vg-name-input"
                value={name}
                maxLength={14}
                placeholder="YOUR NAME"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 14);
                  setName(v);
                  localStorage.setItem(NAME_KEY, v.trim() || "ANON");
                }}
              />
              <button className="vg-play-btn" onClick={(e) => { e.stopPropagation(); startGame(); }}>
                ENTER ARENA
              </button>
              <div className="vg-ready-hint">Press ENTER or click to start</div>
            </div>
          </div>
        )}

        {phase === "running" && (
          <div className="vg-hud-running">
            <div className="vg-hud-score">{hud.score.toLocaleString()}</div>
            <div className="vg-hud-margin-bar">
              <div
                className="vg-hud-margin-fill"
                style={{
                  width: `${hud.margin}%`,
                  background: hud.margin > 50 ? "#00FF9D" : hud.margin > 20 ? "#E0B04E" : "#FF4D6D",
                }}
              />
            </div>
            {hud.chain >= 5 && (
              <div className="vg-hud-chain">CHAIN ×{Math.floor(hud.chain / 5) + 1}</div>
            )}
          </div>
        )}

        {phase === "dead" && result && (
          <div className="vg-overlay">
            <div className="vg-death">
              <div className="vg-death-cause">"{result.cause}"</div>
              <div className="vg-death-score">{result.score.toLocaleString()}</div>
              <div className="vg-death-label">FINAL SCORE</div>
              <div className="vg-death-stats">
                <div><span>SURVIVED</span><strong>{result.survivalTime}s</strong></div>
                <div><span>SIGNALS</span><strong>{result.signalsCollected}</strong></div>
                <div><span>MAX CHAIN</span><strong>{result.maxChain}</strong></div>
                <div><span>AVG MARGIN</span><strong>{result.avgMargin}%</strong></div>
              </div>
              {result.score >= best && result.score > 0 && (
                <div className="vg-death-best">NEW PERSONAL BEST</div>
              )}
              {result.score < best && best > 0 && (
                <div className="vg-death-best-2">BEST: {best.toLocaleString()}</div>
              )}
              <div className="vg-death-buttons">
                <button className="vg-play-btn" onClick={() => initArena()}>RETRY</button>
              </div>
              <div className="vg-ready-hint">Press ENTER to retry</div>

              {submitted && (
                <div className="vg-board">
                  <div className="vg-board-head">
                    <span>DAILY FORGE BOARD</span>
                    {rank !== null && <span className="vg-board-rank">#{rank}</span>}
                  </div>
                  {laneNote && <div className="vg-board-note">{laneNote}</div>}
                  {officialBoard.length > 0 && (
                    <>
                      <div className="vg-board-label">OFFICIAL — wallet-verified</div>
                      <ol className="vg-board-list">
                        {officialBoard.slice(0, 5).map((e, i) => (
                          <li key={`o${i}`}>
                            <span className="vg-board-name">
                              {e.name}
                              {e.wallet ? ` · ${e.wallet}` : ""}
                            </span>
                            <span className="vg-board-score">{e.score.toLocaleString()}</span>
                          </li>
                        ))}
                      </ol>
                    </>
                  )}
                  <div className="vg-board-label">
                    {officialBoard.length > 0 ? "GUEST — unofficial" : "GUEST BOARD"}
                  </div>
                  {board.length === 0 ? (
                    <div className="vg-board-empty">No scores yet today — be the first.</div>
                  ) : (
                    <ol className="vg-board-list">
                      {board.slice(0, 5).map((e, i) => (
                        <li key={`g${i}`}>
                          <span className="vg-board-name">{e.name}</span>
                          <span className="vg-board-score">{e.score.toLocaleString()}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {phase === "running" && (
        <button
          className="vg-dash-btn"
          onClick={() => engineRef.current?.requestDash()}
        >DASH</button>
      )}
    </div>
  );
}
