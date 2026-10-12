// Haptics — mobile vibration feedback (best-effort, never throws).
// Gate: caller checks `hapticsEnabled` before calling; this module just
// vibrates if the API exists. Desktop browsers without the API are no-ops.

export function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(pattern);
    }
  } catch {
    // silently ignore — haptics is always best-effort
  }
}

/** Check if the device supports vibration. */
export function hapticsSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/** Check if the current device is a touch/coarse-pointer device. */
export function isCoarsePointer(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(pointer: coarse)")?.matches ?? false;
}
