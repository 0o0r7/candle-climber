// P1 — fire-and-forget funnel ping from the game surface.
//
// Three gates only: a run starting, the tutorial being finished (or dismissed),
// and a retry from an end panel. Nothing identifying is sent, the caller never
// awaits, and a failure is silent — the same posture as the run lane, so a dead
// telemetry endpoint can never delay a start (LAW 1).
import type { FunnelEventName } from "@/lib/funnel-telemetry";

export function trackFunnel(
  name: FunnelEventName,
  extra?: { steps?: number; skipped?: boolean },
): void {
  if (typeof window === "undefined") return;
  void fetch("/api/telemetry/event", {
    method: "POST",
    headers: { "content-type": "application/json" },
    keepalive: true,
    body: JSON.stringify({ name, ...extra }),
  }).catch(() => {});
}
