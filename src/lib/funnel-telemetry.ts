// P1 — the funnel: the three gates BEFORE a finished run.
//
// WHY: the run lane (`run-telemetry.ts`) only records how a run ENDED, so the
// question "where do new players leave?" had no data behind it at all
// (PROPOSALS-PRO-VISION §1 verdict 2). Every tuning proposal that changes the
// first session — session length, the tutorial, retry pressure — is a guess
// until start → finish is measurable.
//
// CONTRACT: one aggregate event per gate crossed, PII-free by construction —
// no id, name, wallet, IP or client clock; events are never joinable to a
// person, only countable against each other.
//
// This module is PURE (normalizer + summary math) so the contract is unit-
// testable; src/lib/funnel-telemetry-store.ts persists it and
// /api/telemetry/event accepts it from the client.
/** The three gates. Client imports this type only (erased at build), so the
 *  browser bundle never pulls in the store's filesystem code. */
export type FunnelEventName = "run_start" | "tutorial_complete" | "retry";

export interface FunnelEvent {
  name: FunnelEventName;
  /** tutorial_complete only: how many of the 5 steps were actually shown. */
  steps?: number;
  /** tutorial_complete only: dismissed before the last step (SKIP / Escape). */
  skipped?: boolean;
  /** server-side receive time (client clock is never trusted) */
  ts: number;
}

export const TUTORIAL_STEPS = 5;

const NAMES: readonly FunnelEventName[] = ["run_start", "tutorial_complete", "retry"];

const clampInt = (v: unknown, max: number): number => {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(n, max);
};

/** Validate one untrusted event. Returns null when the payload carries no
 *  recognised name — the route rejects it and the game never notices (the lane
 *  is fire-and-forget, same posture as the run lane). */
export function normalizeFunnelEvent(raw: unknown, now = Date.now()): FunnelEvent | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== "string" || !(NAMES as readonly string[]).includes(r.name)) return null;
  const name = r.name as FunnelEventName;
  return {
    name,
    steps: name === "tutorial_complete" ? clampInt(r.steps, TUTORIAL_STEPS) : undefined,
    skipped: name === "tutorial_complete" ? r.skipped === true : undefined,
    ts: now,
  };
}

export interface FunnelSummary {
  total: number;
  counts: Record<FunnelEventName, number>;
  /** tutorial_complete events split by how they ended. */
  tutorialDone: number;
  tutorialSkipped: number;
  /** Median steps shown to players who reached the tutorial's last gate. */
  medianTutorialSteps: number | null;
}

export const EMPTY_FUNNEL_SUMMARY: FunnelSummary = {
  total: 0,
  counts: { run_start: 0, tutorial_complete: 0, retry: 0 },
  tutorialDone: 0,
  tutorialSkipped: 0,
  medianTutorialSteps: null,
};

export function summarizeFunnelEvents(events: readonly FunnelEvent[]): FunnelSummary {
  if (events.length === 0) return EMPTY_FUNNEL_SUMMARY;
  const counts: Record<FunnelEventName, number> = { run_start: 0, tutorial_complete: 0, retry: 0 };
  const steps: number[] = [];
  let skipped = 0;
  for (const e of events) {
    counts[e.name] = (counts[e.name] ?? 0) + 1;
    if (e.name === "tutorial_complete") {
      if (e.skipped) skipped++;
      if (typeof e.steps === "number") steps.push(e.steps);
    }
  }
  steps.sort((a, b) => a - b);
  return {
    total: events.length,
    counts,
    tutorialDone: counts.tutorial_complete,
    tutorialSkipped: skipped,
    medianTutorialSteps: steps.length > 0 ? steps[Math.ceil(0.5 * steps.length) - 1] : null,
  };
}
