"use client";

/**
 * Mode selector — toggles between Market Mode and Launchpad Mode.
 *
 * Market Mode: established crypto assets (Binance watchlist + CoinGecko broader pool)
 *   and stock rails (Yahoo/Stooq/Robinhood Chain).
 * Launchpad Mode: VibeVibe on-chain token launches — terrain derived from
 *   real CurveBuy/CurveSell trade events.
 *
 * The toggle persists the player's choice and calls back so GameCanvas can
 * re-fetch the level from the appropriate data source.
 */

export type GameMode = "market" | "launchpad";

const MODE_KEY = "cc_mode_v1";

export function loadMode(): GameMode {
  try {
    const saved = localStorage.getItem(MODE_KEY);
    return saved === "launchpad" ? "launchpad" : "market";
  } catch {
    return "market";
  }
}

export function saveMode(mode: GameMode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    // private mode — cosmetic only
  }
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
        aria-selected={mode === "market"}
        className={`cc-mode-btn${mode === "market" ? " cc-mode-active" : ""}`}
        onClick={() => onChange("market")}
      >
        <span className="cc-mode-icon" aria-hidden>📈</span>
        MARKET
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
