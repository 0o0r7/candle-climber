"use client";

import { useEffect, useRef, useState } from "react";
import { VIEW_W, VIEW_H, PLAYER_W } from "@/game/cc/engine";
import { CANDLE_W } from "@/game/cc/level";
import { renderV2 } from "@/game/cc/render-v2";
import { biomeById } from "@/game/cc/biome";
import { DEFAULT_CHAR_ID } from "@/game/cc/characters";
import { FIXED_DT } from "@/game/cc/rival/planner";
import { DEMO_SEED, demoCandles, zoneAt } from "./demo-chart";
import { DemoPilot } from "./demo-pilot";
import { ZoneBlender, type ZoneEnv } from "./demo-weather";

// Skip most of the flat launch pad, then show one ~30s loop that crosses all
// four weather zones (calm → desert → storm → tundra) before restarting.
const PREROLL_S = 2.5;
const LOOP_S = 30;
const RESPAWN_S = 1.2;
// Inside the canvas the loop seam teleports the run from the snowy summit back
// to the launch pad. Dip to the frame colour across the seam so a recorded (or
// repeated) clip plays as one continuous take instead of a hard visual jump.
const SEAM_FADE_S = 0.5;
const FRAME_RGB = "16,18,20"; // matches .lp-demo-canvas-wrap background

/** 1 = frame colour, 0 = fully visible; only non-zero around the loop seam. */
function seamFade(t: number): number {
  const out = (t - (LOOP_S - SEAM_FADE_S)) / SEAM_FADE_S;
  const ina = 1 - t / SEAM_FADE_S;
  return Math.min(1, Math.max(0, Math.max(out, ina)));
}

export default function GameplayDemo() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [zone, setZone] = useState({ name: biomeById("temperate").name, n: 0 });
  const playingRef = useRef(false);
  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const candles = demoCandles();
    let pilot: DemoPilot;
    let blender: ZoneBlender;
    let env: ZoneEnv;
    let loopT = 0;
    let deadFor = 0;

    const zoneNow = () => zoneAt(Math.floor((pilot.eng.px + PLAYER_W / 2) / CANDLE_W));

    const restart = () => {
      pilot = new DemoPilot(candles, DEMO_SEED);
      for (let i = 0; i < Math.round(PREROLL_S / FIXED_DT); i++) pilot.tick();
      blender = new ZoneBlender(zoneNow());
      env = blender.step(zoneNow(), 0);
      loopT = 0;
      deadFor = 0;
    };
    restart();

    let raf = 0;
    let last = 0;
    let acc = 0;
    let shownZone = "";

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (last === 0) last = now;
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;

      while (acc >= FIXED_DT) {
        acc -= FIXED_DT;
        if (!playingRef.current) continue;
        const e = pilot.eng;
        if (e.dead) {
          deadFor += FIXED_DT;
          e.step(FIXED_DT); // death slow-mo + particles
          if (deadFor > RESPAWN_S) restart();
        } else if (e.time >= PREROLL_S + LOOP_S) {
          restart();
        } else {
          pilot.tick();
          loopT += FIXED_DT;
        }
        env = blender.step(zoneNow(), FIXED_DT); // weather front, one fixed step
      }

      if (env.biome.name !== shownZone) {
        shownZone = env.biome.name;
        setZone((p) => ({ name: env.biome.name, n: p.n + 1 }));
      }

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      const s = Math.min(rect.width / VIEW_W, rect.height / VIEW_H);
      const ox = (rect.width - VIEW_W * s) / 2;
      const oy = (rect.height - VIEW_H * s) / 2;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * ox, dpr * oy);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, VIEW_W, VIEW_H);
      ctx.clip();
      renderV2(ctx, pilot.eng, DEMO_SEED, env.weather, [], undefined, DEFAULT_CHAR_ID, null, null, env.biome);
      ctx.restore();

      const fade = playingRef.current ? seamFade(loopT) : 0;
      if (fade > 0) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.fillStyle = `rgba(${FRAME_RGB},${fade})`;
        ctx.fillRect(0, 0, w, h);
      }
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Auto-start the bot after mount
  useEffect(() => {
    const timer = setTimeout(() => setPlaying(true), 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="lp-demo-wrapper">
      <div className="lp-demo-canvas-wrap">
        <canvas ref={canvasRef} className="lp-demo-canvas" />
        <div className={`lp-demo-badge ${playing ? "lp-demo-badge-live" : ""}`}>
          {playing ? "▶ BOT PLAYING" : "BOT DEMO LOADING…"}
        </div>
        {/* key = zone change: the arriving weather beats once in the HUD */}
        <div key={zone.n} className="lp-demo-zone lp-demo-zone-in" aria-live="polite">{zone.name}</div>
      </div>
    </div>
  );
}
