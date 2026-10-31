"use client";

// The live half of /chart/[date]: fetch the day's terrain, name it, draw it as
// the poster it is, label the real provenance, and hand out the link.
//
// Everything the page says about the LEVEL — ticker, mutation, source — comes
// from this one response. That is deliberate: /api/candles picks the symbol at
// request time (volatility-scored), so a server-rendered ticker would be a
// guess that can disagree with the chart below it.
import { useEffect, useMemo, useRef, useState } from "react";
import ChartPoster from "./ChartPoster";
import type { Candle, CandleData } from "@/game/cc/types";
import { provenanceLabel } from "@/game/cc/level-source";
import { dailyMutation } from "@/game/cc/mutations";

type Load =
  | { state: "loading" }
  | { state: "error"; message: string }
  | { state: "ready"; candles: Candle[]; seed: CandleData["seed"] };

function movePct(candles: Candle[]): number | null {
  if (candles.length < 2) return null;
  const first = candles[0].o;
  const last = candles[candles.length - 1].c;
  if (!Number.isFinite(first) || !Number.isFinite(last) || first === 0) return null;
  return ((last - first) / first) * 100;
}

export default function ChartDay({ date, isToday }: { date: string; isToday: boolean }) {
  const [load, setLoad] = useState<Load>({ state: "loading" });
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const linkRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let alive = true;
    setLoad({ state: "loading" });
    // Today: the CRYPTO-mode default, exactly what /play asks for. Past day:
    // the archive deep link, which the game plays without a pool param — so the
    // poster always shows the terrain a player will actually land on.
    const qs = isToday ? "?pool=crypto" : `?date=${date}`;
    fetch(`/api/candles${qs}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: CandleData) => {
        if (!alive) return;
        if (!Array.isArray(d.candles) || d.candles.length === 0) {
          setLoad({ state: "error", message: "no candles served for this day" });
          return;
        }
        setLoad({ state: "ready", candles: d.candles, seed: d.seed });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setLoad({ state: "error", message: err instanceof Error ? err.message : "feed unreachable" });
      });
    return () => {
      alive = false;
    };
  }, [date, isToday]);

  const ready = load.state === "ready" ? load : null;
  const mutation = ready ? dailyMutation(ready.seed.date + ready.seed.symbol) : null;
  const provenance = ready ? provenanceLabel(ready.seed.source, ready.seed.symbol) : null;
  const move = useMemo(() => (ready ? movePct(ready.candles) : null), [ready]);

  const shareUrl = () =>
    typeof window === "undefined" ? `/chart/${date}` : `${window.location.origin}/chart/${date}`;

  const shareText = () =>
    ready
      ? `The ${date} chart: ${ready.seed.symbol} (${provenance?.short ?? "chart"}). ${mutation?.name ?? ""} Green candles hold, red ones crumble. Same chart, every player worldwide.`
      : `The ${date} chart — Candle Climber.`;

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl());
      setCopied("copied");
      setTimeout(() => setCopied("idle"), 2000);
    } catch {
      // Clipboard access can be denied (permissions, non-secure contexts). Do
      // not leave the player with a dead button: reveal the link, selected, so
      // one keystroke copies it.
      setCopied("failed");
    }
  }

  // When the clipboard refuses, put the link in the player's hands.
  useEffect(() => {
    if (copied === "failed" && linkRef.current) {
      linkRef.current.focus();
      linkRef.current.select();
    }
  }, [copied]);

  async function onShare() {
    const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> };
    if (!nav.share) {
      void onCopy();
      return;
    }
    try {
      await nav.share({ title: `Candle Climber — ${date}`, text: shareText(), url: shareUrl() });
    } catch {
      /* the user dismissed the sheet — not an error worth reporting */
    }
  }

  return (
    <section className="cc-chart-live" aria-label="The day's chart">
      <div className="cc-chart-ident">
        <span className="cc-chart-symbol">{ready ? ready.seed.symbol : "—"}</span>
        {provenance ? (
          <span className={`cc-chart-badge cc-chart-badge-${provenance.kind}`}>{provenance.long}</span>
        ) : (
          <span className="cc-chart-badge">reading the feed…</span>
        )}
        {ready ? (
          <span className="cc-chart-fact">
            {ready.candles.length} {ready.seed.interval} candles
          </span>
        ) : null}
        {move !== null ? (
          <span className={`cc-chart-fact ${move >= 0 ? "up" : "down"}`}>
            window move {move >= 0 ? "+" : ""}
            {move.toFixed(1)}%
          </span>
        ) : null}
      </div>

      {mutation ? (
        <div className="cc-chart-mutation">
          <b>{mutation.name}</b>
          <span>{mutation.tagline}</span>
        </div>
      ) : null}

      {load.state === "loading" ? (
        <div className="cc-chart-loading" role="status">
          loading the chart…
        </div>
      ) : null}

      {load.state === "error" ? (
        <div className="cc-chart-error" role="status">
          <b>The feed did not answer for this chart right now.</b>
          <span>
            That is a market-rail problem, not a different level — the game retries the same feeds
            when you open it ({load.message}).
          </span>
        </div>
      ) : null}

      {ready ? <ChartPoster candles={ready.candles} /> : null}

      <div className="cc-chart-share">
        <button type="button" className="cc-chart-btn" onClick={onShare}>
          SHARE THIS CHART
        </button>
        <button type="button" className="cc-chart-btn cc-chart-btn-ghost" onClick={onCopy}>
          {copied === "copied" ? "LINK COPIED ✓" : "COPY LINK"}
        </button>
      </div>

      {copied === "failed" ? (
        <div className="cc-chart-manual">
          <span>your browser blocked the clipboard — the link is selected, copy it:</span>
          <input
            ref={linkRef}
            readOnly
            value={shareUrl()}
            onFocus={(e) => e.currentTarget.select()}
            aria-label="Link to this chart"
          />
        </div>
      ) : null}
    </section>
  );
}
