"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { CityEngine } from "@/game/city/engine";
import { BUILDING_LIST } from "@/game/city/buildings";
import { sfx } from "@/game/city/sound";
import type { GridPos } from "@/game/city/types";
import type { BuildingType, GameState } from "@/game/city/types";
import GameplayWalkthrough from "@/components/city/GameplayWalkthrough";
import { loadCity, saveCity, clearCity, applyCitySave, serializeCity } from "@/game/city/persistence";
import { WALLET_ADDRESS_KEY, isValidAddress } from "@/lib/wallet";
import { buildCitySaveProofMessage } from "@/lib/proof-message";
import { sanitizeGuild, guildBuff, findGuild } from "@/lib/guild-registry";

const GUILD_KEY = "cc_guild_v1";

// The 3D scene is code-split and client-only: three.js never enters the landing
// bundle (CityBanner doesn't import it), so the CC landing LCP is untouched.
const CityScene3D = dynamic(() => import("./scene3d/CityScene3D"), {
  ssr: false,
  loading: () => <div className="city-scene3d city-scene-loading" />,
});

export default function CityCanvas() {
  const engineRef = useRef<CityEngine | null>(null);
  // Same instance as engineRef, exposed as state so the 3D scene mounts once the
  // engine exists (and remounts after a reset).
  const [engineInstance, setEngineInstance] = useState<CityEngine | null>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const [uiState, setUiState] = useState<GameState | null>(null);
  const [selectedType, setSelectedType] = useState<BuildingType | null>(null);
  const [started, setStarted] = useState(false);
  const [showBuildMenu, setShowBuildMenu] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [eventLog, setEventLog] = useState<{ id: string; message: string; color: string }[]>([]);
  const [guild, setGuild] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);
  const lastEventCount = useRef(0);
  const lastSigRef = useRef<string>("");
  const guildRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Persistence (cc_city_save_v1) ─────────────────────────
  const saveNow = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const phase = engine.state.phase;
    if (phase === "playing" || phase === "graduated") saveCity(engine.state);
  }, []);

  // Autosave, debounced ≤1s after any durable state change.
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) return;
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      saveNow();
    }, 1000);
  }, [saveNow]);

  // Immediate save (visibilitychange / beforeunload / reset).
  const flushSave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    saveNow();
  }, [saveNow]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flushSave();
    };
    const onUnload = () => flushSave();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onUnload);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onUnload);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [flushSave]);

  // Init engine
  useEffect(() => {
    const engine = new CityEngine();
    engineRef.current = engine;
    // Mounting the scene needs the engine in state; this runs once on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEngineInstance(engine);
    // Restore a previous session — a refresh must never delete the city.
    const saved = loadCity();
    if (saved) {
      applyCitySave(engine, saved);
      // Post-hydration restore (localStorage is client-only) — same pattern as src/app/stats/page.tsx.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStarted(true);
    }
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      const engine = engineRef.current;
      if (!engine) return;

      // State tick only — rendering now belongs to the R3F scene.
      engine.step(dt);

      // Sync UI state periodically (every ~6 frames)
      if (Math.floor(now / 100) !== Math.floor((now - 16) / 100)) {
        setUiState({ ...engine.state, feeds: new Map(engine.state.feeds), buildings: [...engine.state.buildings] });
        // New events?
        if (engine.state.events.length !== lastEventCount.current) {
          lastEventCount.current = engine.state.events.length;
          const recent = engine.state.events.slice(-5).reverse();
          setEventLog(recent.map(e => ({ id: e.id, message: e.message, color: e.color })));
        }
      }

      // Autosave trigger: a durable change (build/upgrade/income/phase) marks dirty.
      const sig = `${engine.state.buildings.length}:${Math.floor(engine.state.wickBalance)}:${engine.state.phase}`;
      if (sig !== lastSigRef.current) {
        lastSigRef.current = sig;
        scheduleSave();
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  // Fetch live feeds on mount
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.fetchLiveFeeds();
    }
  }, []);

  // ── Guild tag (?guild=) + buff (Phase 2) ──────────────────
  // Same pattern as the shipped ?ref= referral stamp: a sanitized code rides
  // the link, is remembered locally, and is decoration + buff lookup only —
  // it never touches scoring. Unknown codes are still valid tags (no buff).
  useEffect(() => {
    let tag: string | null = null;
    try {
      const param = sanitizeGuild(new URLSearchParams(window.location.search).get("guild"));
      if (param) {
        localStorage.setItem(GUILD_KEY, param);
        tag = param;
      } else {
        tag = sanitizeGuild(localStorage.getItem(GUILD_KEY)) ?? null;
      }
    } catch { /* private mode — guild is cosmetic + buff only */ }
    guildRef.current = tag;
    // Post-hydration restore (URL/localStorage are client-only) — same pattern
    // as the saved-city restore above.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuild(tag);
    if (engineRef.current) engineRef.current.state.guild = tag;
  }, []);

  // ── Server save (Phase 2) — wallet-gated, identity-proofed ──
  // Signs the purpose-separated city-save message and upserts this city under
  // the linked wallet. No wallet/provider/signature ⇒ nothing is written and an
  // honest note explains why (the local save is unaffected).
  const syncCity = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    let walletAddr: string | null = null;
    try { walletAddr = localStorage.getItem(WALLET_ADDRESS_KEY); } catch { /* private mode */ }
    if (!walletAddr || !isValidAddress(walletAddr)) {
      setSyncNote("link a wallet to save online");
      return;
    }
    const eth = (window as unknown as { ethereum?: { request: (a: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) {
      setSyncNote("no wallet provider in this browser");
      return;
    }
    const save = serializeCity(engine.state);
    const ts = Date.now();
    const msg = buildCitySaveProofMessage(
      {
        wallet: walletAddr.toLowerCase(),
        cityLevel: save.state.stats.cityLevel,
        buildingsCount: save.state.buildings.length,
        savedAt: save.savedAt,
      },
      ts,
    );
    const msgHex = "0x" + [...new TextEncoder().encode(msg)].map((b) => b.toString(16).padStart(2, "0")).join("");
    let signature: string | undefined;
    try {
      const s = await eth.request({ method: "personal_sign", params: [msgHex, walletAddr] });
      if (typeof s === "string" && /^0x[0-9a-fA-F]{130}$/.test(s)) signature = s;
    } catch { /* rejected — explained below */ }
    if (!signature) {
      setSyncNote("signature rejected — not saved");
      return;
    }
    try {
      const res = await fetch("/api/city/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: save.state,
          savedAt: save.savedAt,
          guild: guildRef.current ?? undefined,
          address: walletAddr,
          signature,
          ts,
        }),
      });
      const j = await res.json();
      setSyncNote(
        typeof j.rank === "number"
          ? `saved — city rank #${j.rank}`
          : typeof j.error === "string" ? `not saved: ${j.error}` : "not saved",
      );
    } catch {
      setSyncNote("not saved — network error");
    }
  }, []);

  const handleStart = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.start();
    engine.state.guild = guildRef.current; // Phase 2: guild tag survives a fresh city
    setStarted(true);
    sfx.click();
    // Try to fetch live stock data
    engine.fetchLiveFeeds();
  }, []);

  const handleReset = useCallback(() => {
    if (typeof window !== "undefined" && !window.confirm("Reset your city? This deletes the local save.")) {
      return;
    }
    clearCity();
    engineRef.current = new CityEngine();
    engineRef.current.state.guild = guildRef.current;
    setEngineInstance(engineRef.current);
    lastSigRef.current = "";
    lastEventCount.current = 0;
    setUiState(null);
    setSelectedType(null);
    setShowBuildMenu(false);
    setEventLog([]);
    setStarted(false);
    sfx.click();
  }, []);

  // The 3D scene resolves the cursor ray to a grid cell (see game/city/math3d);
  // this is the single place a placement actually happens.
  const handlePlace = useCallback((pos: GridPos) => {
    const engine = engineRef.current;
    const type = engine?.state.selectedType;
    if (!engine || !type) return;
    if (engine.placeBuilding(type, pos)) sfx.place();
    else sfx.error();
  }, []);

  const selectBuilding = useCallback((type: BuildingType) => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.selectBuilding(type);
    setSelectedType(type);
    setShowBuildMenu(false);
    sfx.click();
  }, []);

  const wickBalance = uiState?.wickBalance ?? 5000;
  const stats = uiState?.stats;
  const graduated = uiState?.phase === 'graduated';

  return (
    <div className="city-root">
      {engineInstance && (
        <CityScene3D
          engine={engineInstance}
          buildings={uiState?.buildings ?? []}
          selectedType={selectedType}
          onPlace={handlePlace}
        />
      )}

      {/* Tutorial video */}
      {showTutorial && <GameplayWalkthrough onClose={() => setShowTutorial(false)} />}

      {/* Start overlay */}
      {!started && !showTutorial && (
        <div className="city-overlay">
          <div className="city-panel">
            <div className="city-panel-eyebrow">vibe/vibe ecosystem · robinhood chain testnet</div>
            <h1 className="city-title">CHAIN CITY</h1>
            <p className="city-tagline">Build a city. Power it with real market data.<br />Watch your treasury grow.</p>
            <div className="city-compliance">
              robinhood chain testnet · no real funds · nothing is guaranteed
            </div>
            <div className="city-start-actions">
              <button className="city-btn-start" onClick={handleStart}>
                FOUND CITY
              </button>
              <button className="city-btn-tutorial" onClick={() => { setShowTutorial(true); sfx.click(); }}>
                ▶ GAMEPLAY WALKTHROUGH
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Graduation overlay */}
      {graduated && (
        <div className="city-overlay city-grad-overlay">
          <div className="city-panel city-grad-panel">
            <div className="city-grad-spark">★</div>
            <h1 className="city-grad-title">MILESTONE REACHED</h1>
            <p className="city-grad-text">
              Your city has reached the treasury milestone.<br />
              This is an in-game goal — no token launch is live.<br />
              Keep building to grow your city further.
            </p>
            <div className="city-grad-stats">
              <div className="city-grad-stat">
                <span className="city-grad-stat-num">{stats?.buildingsCount}</span>
                <span className="city-grad-stat-label">BUILDINGS</span>
              </div>
              <div className="city-grad-stat">
                <span className="city-grad-stat-num">{stats?.population.toLocaleString()}</span>
                <span className="city-grad-stat-label">POPULATION</span>
              </div>
              <div className="city-grad-stat">
                <span className="city-grad-stat-num">${Math.floor(wickBalance).toLocaleString()}</span>
                <span className="city-grad-stat-label">TREASURY</span>
              </div>
            </div>
            <button className="city-btn-start" onClick={() => {
              if (engineRef.current) {
                engineRef.current.state.phase = 'playing';
                engineRef.current.state.graduationPulse = 0;
              }
            }}>
              CONTINUE BUILDING
            </button>
          </div>
        </div>
      )}

      {/* Bottom build bar */}
      {started && !graduated && (
        <>
          <div className="city-bottom-bar">
            <button
              className={`city-build-toggle ${showBuildMenu ? 'active' : ''}`}
              onClick={() => setShowBuildMenu(!showBuildMenu)}
            >
              <span className="city-build-icon">⊞</span> BUILD
            </button>
            <div className="city-selected-info">
              {selectedType ? (
                <span>{BUILDING_LIST.find(b => b.type === selectedType)?.name}</span>
              ) : (
                <span className="city-muted">Select a building…</span>
              )}
            </div>
            <div className="city-wick-display">
              <span className="city-wick-label">$WICK</span>
              <span className="city-wick-num">{Math.floor(wickBalance).toLocaleString()}</span>
            </div>
            <button
              className="city-sync-btn"
              onClick={syncCity}
              title="Save this city online under your linked wallet"
            >
              ⇪ SAVE ONLINE
            </button>
            <button
              className="city-reset-btn"
              onClick={handleReset}
              title="Reset city (clears the local save)"
            >
              ⟲ RESET
            </button>
          </div>

          {syncNote && <div className="city-sync-note">{syncNote}</div>}

          {/* Build menu */}
          {showBuildMenu && (
            <div className="city-build-menu">
              {BUILDING_LIST.map(b => (
                <button
                  key={b.type}
                  className={`city-build-card ${selectedType === b.type ? 'selected' : ''} ${wickBalance < b.cost ? 'disabled' : ''}`}
                  onClick={() => selectBuilding(b.type)}
                  disabled={wickBalance < b.cost}
                >
                  <div className="city-build-card-color" style={{ background: b.color, boxShadow: `0 0 12px ${b.glow}` }} />
                  <div className="city-build-card-info">
                    <div className="city-build-card-name">{b.name}</div>
                    <div className="city-build-card-ticker">{b.ticker} · {b.sector}</div>
                  </div>
                  <div className="city-build-card-cost">{b.cost}</div>
                </button>
              ))}
            </div>
          )}

          {/* Event log */}
          {eventLog.length > 0 && (
            <div className="city-event-log">
              {eventLog.map(e => (
                <div key={e.id} className="city-event-line" style={{ color: e.color }}>
                  {e.message}
                </div>
              ))}
            </div>
          )}

          {/* Stats sidebar */}
          <div className="city-stats-bar">
            <div className="city-stat-item">
              <span className="city-stat-label">CITY LV</span>
              <span className="city-stat-value">{stats?.cityLevel}</span>
            </div>
            <div className="city-stat-item">
              <span className="city-stat-label">POP</span>
              <span className="city-stat-value">{stats?.population.toLocaleString()}</span>
            </div>
            <div className="city-stat-item">
              <span className="city-stat-label">INCOME</span>
              <span className="city-stat-value">{stats?.dailyIncome.toFixed(1)}k</span>
            </div>
            <div className="city-stat-item">
              <span className="city-stat-label">RANK</span>
              <span className="city-stat-value">#{stats?.guildRank}</span>
            </div>
            {guild && (
              <div className="city-stat-item" title="Guild tag — registered guilds grant an income buff">
                <span className="city-stat-label">GUILD</span>
                <span className="city-stat-value">
                  {findGuild(guild)?.name ?? guild}
                  {guildBuff(guild) > 1 ? ` +${Math.round((guildBuff(guild) - 1) * 100)}%` : ""}
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
