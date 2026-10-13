"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// ─── types ───────────────────────────────────────────────────────────

export interface GameSettings {
  volume: number; // 0..1
  muted: boolean;
  colorblind: boolean;
  reducedMotion: boolean;
  haptics: boolean;
  ghostOn: boolean;
  botOn: boolean;
}

export const DEFAULT_SETTINGS: GameSettings = {
  volume: 1,
  muted: false,
  colorblind: false,
  reducedMotion: false,
  haptics: true,
  ghostOn: true,
  botOn: false,
};

const SETTINGS_KEY = "cc_settings_v1";

// ─── pure helpers (testable without React) ───────────────────────────

export function loadSettings(raw: string | null): GameSettings {
  if (!raw) return { ...DEFAULT_SETTINGS };
  try {
    const j = JSON.parse(raw) as Partial<GameSettings> | null;
    if (!j || typeof j !== "object") return { ...DEFAULT_SETTINGS };
    const b = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
    const n = (v: unknown, d: number) => {
      const x = Number(v);
      return Number.isFinite(x) && x >= 0 && x <= 1 ? x : d;
    };
    return {
      volume: n(j.volume, DEFAULT_SETTINGS.volume),
      muted: b(j.muted, DEFAULT_SETTINGS.muted),
      colorblind: b(j.colorblind, DEFAULT_SETTINGS.colorblind),
      reducedMotion: b(j.reducedMotion, DEFAULT_SETTINGS.reducedMotion),
      haptics: b(j.haptics, DEFAULT_SETTINGS.haptics),
      ghostOn: b(j.ghostOn, DEFAULT_SETTINGS.ghostOn),
      botOn: b(j.botOn, DEFAULT_SETTINGS.botOn),
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: GameSettings): string {
  return JSON.stringify(s);
}

/** Detect OS-level reduced-motion preference (not the toggle). */
export function detectReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

// ─── React context ───────────────────────────────────────────────────

interface SettingsContextValue {
  settings: GameSettings;
  update: (patch: Partial<GameSettings>) => void;
  toggle: (key: keyof GameSettings) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  // Lazy initialization reads from localStorage on first client render —
  // avoids the setState-in-effect anti-pattern entirely.
  const [settings, setSettings] = useState<GameSettings>(() => {
    if (typeof window === "undefined") return { ...DEFAULT_SETTINGS };
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const loaded = loadSettings(raw);
      if (raw === null) {
        // First run after the settings-store introduction — carry over the
        // legacy per-key preferences so nothing user-chosen resets silently.
        try {
          if (localStorage.getItem("cc_mute_v1") === "1") loaded.muted = true;
          if (localStorage.getItem("cc_ghost_v1") === "0") loaded.ghostOn = false;
          if (localStorage.getItem("cc_vsbot_v1") === "1") loaded.botOn = true;
        } catch { /* private mode */ }
      }
      if (!loaded.reducedMotion && detectReducedMotion()) {
        // G5 (129-c #11): the OS preference only seeds the DEFAULT — once the
        // user has explicitly chosen a reduced-motion value (explicit bit set
        // in update/toggle below), their choice wins over the OS on every
        // reload (the old code re-forced the OS preference over an explicit
        // "off" on every load).
        let rmExplicit: string | null = null;
        try {
          rmExplicit = localStorage.getItem("cc_rm_explicit_v1");
        } catch { /* private mode */ }
        if (rmExplicit === null) loaded.reducedMotion = true;
      }
      return loaded;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  const update = useCallback((patch: Partial<GameSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, saveSettings(next));
        // G5 (129-c #11): an explicit user choice beats the OS preference forever
        if (patch.reducedMotion !== undefined) localStorage.setItem("cc_rm_explicit_v1", "1");
      } catch {
        // ignore storage errors
      }
      return next;
    });
  }, []);

  const toggle = useCallback((key: keyof GameSettings) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(SETTINGS_KEY, saveSettings(next));
        if (key === "reducedMotion") localStorage.setItem("cc_rm_explicit_v1", "1");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ settings, update, toggle }), [settings, update, toggle]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // Fallback for components outside the provider — returns static defaults
    return {
      settings: DEFAULT_SETTINGS,
      update: () => {},
      toggle: () => {},
    };
  }
  return ctx;
}
