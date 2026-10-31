"use client";

// The day's chart drawn as the poster it is — the shareable face of the level
// (reference-study P1). Real candles, no decoration invented: bodies coloured
// by direction, wicks as the feed gave them. Nothing here claims provenance;
// the caller labels the feed from `seed.source`.
import { useEffect, useRef } from "react";
import type { Candle } from "@/game/cc/types";

const UP = "#5BD08A";
const DOWN = "#E07856";
const GRID = "rgba(255,255,255,0.05)";
const PAD_Y = 18;
const PAD_X = 10;

export default function ChartPoster({
  candles,
  height = 300,
}: {
  candles: Candle[];
  height?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const draw = () => {
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, cv.clientWidth);
      const h = Math.max(1, cv.clientHeight);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const slice = candles.filter((c) => Number.isFinite(c.h) && Number.isFinite(c.l));
      if (!slice.length) return;

      let min = Infinity;
      let max = -Infinity;
      for (const c of slice) {
        if (c.l < min) min = c.l;
        if (c.h > max) max = c.h;
      }
      const span = max - min || 1;
      const top = PAD_Y;
      const bottom = h - PAD_Y;
      const y = (v: number) => top + (1 - (v - min) / span) * (bottom - top);

      // horizontal grid (thirds) — reads as a chart, adds no data
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      for (let i = 1; i < 3; i++) {
        const gy = Math.round(top + ((bottom - top) * i) / 3) + 0.5;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      const usable = w - PAD_X * 2;
      const slot = usable / slice.length;
      const bodyW = Math.max(2, Math.min(14, slot * 0.6));
      ctx.lineWidth = Math.max(1, Math.min(2, slot * 0.12));

      slice.forEach((c, i) => {
        const up = c.c >= c.o;
        const cx = PAD_X + i * slot + slot / 2;
        const colour = up ? UP : DOWN;
        // wick
        ctx.strokeStyle = colour;
        ctx.beginPath();
        ctx.moveTo(cx, y(c.h));
        ctx.lineTo(cx, y(c.l));
        ctx.stroke();
        // body (minimum 2px so a doji stays visible)
        const bodyTop = y(Math.max(c.o, c.c));
        const bodyBottom = y(Math.min(c.o, c.c));
        ctx.fillStyle = colour;
        ctx.fillRect(cx - bodyW / 2, bodyTop, bodyW, Math.max(2, bodyBottom - bodyTop));
      });
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(cv);
    return () => ro.disconnect();
  }, [candles]);

  return (
    <canvas
      ref={canvasRef}
      className="cc-chart-poster"
      style={{ height }}
      role="img"
      aria-label={`Candlestick chart of today's level, ${candles.length} candles`}
    />
  );
}
