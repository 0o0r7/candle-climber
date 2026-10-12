"use client";

/**
 * Mode selector — three chart pools (council 2026-10-12, ruling B):
 *
 * CRYPTO    — established crypto assets (Binance watchlist + CoinGecko top-30)
 * STOCKS    — real equities (Yahoo/Stooq weekly rails, on-chain Chainlink check)
 * LAUNCHPAD — VibeVibe on-chain token launches (CurveBuy/CurveSell terrain)
 *
 * The toggle persists the player's choice (cc_mode_v2) and calls back so
 * GameCanvas can re-fetch the level from the appropriate data source.
 * v1 migration: "market" → "crypto", "launchpad" → "launchpad" — one-time,
 * read-only, so old saved prefs and old deep links keep working.
 */

export type GameMode = "crypto" | "stocks" | "launchpad";

export const GAME_MODES: readonly GameMode[] = ["crypto", "stocks", "launchpad"];

export function isGameMode(v: unknown): v is GameMode {
  return typeof v === "string" && (GAME_MODES as readonly string[]).includes(v);
}

const MODE_KEY = "cc_mode_v2";
const LEGACY_KEY = "cc_mode_v1";

export function loadMode(): GameMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    if (isGameMode(saved)) return saved;
    // One-time v1 migration — read the legacy key, translate, persist under v2.
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === "launchpad") {
      localStorage.setItem(MODE_KEY, "launchpad");
      return "launchpad";
    }
    if (legacy === "market") {
      localStorage.setItem(MODE_KEY, "crypto");
      return "crypto";
    }
  } catch {
    // private mode — cosmetic only
  }
  return "crypto";
}

export function saveMode(mode: GameMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // private mode — cosmetic only
  }
}

/** Legacy v1 values that may still arrive via deep links (?mode=market). */
export function normalizeModeParam(v: string | null): GameMode | null {
  if (isGameMode(v)) return v;
  if (v === "market") return "crypto"; // v1 deep-link compat
  return null;
}

interface ModeSelectorProps {
  mode: GameMode;
  onChange: (mode: GameMode) => void;
}

export default function ModeSelector({ mode, onChange }: ModeSelectorProps) {
  return (
    <div className="cc-mode-selector" role="tablist" aria-label="Game mode">
      <button
        role="tab"
        aria-selected={mode === "crypto"}
        className={`cc-mode-btn${mode === "crypto" ? " cc-mode-active" : ""}`}
        onClick={() => onChange("crypto")}
      >
        <span className="cc-mode-icon" aria-hidden>🪙</span>
        CRYPTO
      </button>
      <button
        role="tab"
        aria-selected={mode === "stocks"}
        className={`cc-mode-btn${mode === "stocks" ? " cc-mode-active" : ""}`}
        onClick={() => onChange("stocks")}
      >
        <span className="cc-mode-icon" aria-hidden>🏦</span>
        STOCKS
      </button>
      <button
        role="tab"
        aria-selected={mode === "launchpad"}
        className={`cc-mode-btn${mode === "launchpad" ? " cc-mode-active" : ""}`}
        onClick={() => onChange("launchpad")}
      >
        <span className="cc-mode-icon" aria-hidden>🚀</span>
        LAUNCHPAD
      </button>
    </div>
  );
}
