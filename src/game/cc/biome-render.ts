// BIOME RENDERER — draws environment-specific particles and tints.
// Pure draw functions: consume engine time + biome config, never mutate state.
// Layered INTO render-v2's sky and foreground passes.
import type { Engine } from "./engine";
import { VIEW_W, VIEW_H } from "./engine";
import { hashString } from "./rng";
import type { Biome } from "./biome";

interface BioParticle {
  x: number;
  y: number;
  sp: number;
  s: number;
  a: number;
  ph: number;
}

// Pre-computed particle field per biome (deterministic from seed)
let _lastSeed = "";
let _lastBiome = "";
let _particles: BioParticle[] = [];

function getParticles(seedStr: string, biome: Biome): BioParticle[] {
  if (_lastSeed === seedStr && _lastBiome === biome.id) return _particles;
  _lastSeed = seedStr;
  _lastBiome = biome.id;
  _particles = [];
  for (let k = 0; k < biome.particleCount; k++) {
    const h1 = hashString(`cc-bio:${biome.id}:${seedStr}:${k}`);
    const h2 = hashString(`cc-bio2:${biome.id}:${seedStr}:${k}`);
    _particles.push({
      x: (h1 % 1000) / 1000 * VIEW_W,
      y: (h2 % 1000) / 1000 * VIEW_H,
      sp: 7 + ((h1 >>> 5) % 20),
      s: 1 + ((h2 >>> 3) % 3),
      a: 0.06 + ((h1 >>> 7) % 5) * 0.04,
      ph: ((h2 >>> 9) % 1000) / 1000 * Math.PI * 2,
    });
  }
  return _particles;
}

/** Draw biome sky tint over the base sky gradient. */
export function drawBiomeSky(ctx: CanvasRenderingContext2D, biome: Biome) {
  if (biome.skyTint === "rgba(16,18,20,0)") return;
  ctx.fillStyle = biome.skyTint;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

/** Draw biome-specific ambient particles (dust/snow/rain/spark). */
export function drawBiomeParticles(ctx: CanvasRenderingContext2D, e: Engine, biome: Biome, seedStr: string) {
  const ps = getParticles(seedStr, biome);
  const t = e.time;
  const tint = biome.particleColor;

  for (const q of ps) {
    let xx: number;
    let yy: number;
    let sz: number;

    switch (biome.particleType) {
      case "dust":
        // slow horizontal drift, settles near the floor
        xx = (q.x + t * q.sp * biome.particleSpeed * 0.4) % (VIEW_W + 40) - 20;
        yy = q.y + Math.sin(t * 0.5 + q.ph) * 14;
        sz = q.s * 1.5;
        break;
      case "snow":
        // falling snow with sway
        yy = ((q.y + t * q.sp * biome.particleSpeed * 1.5) % (VIEW_H + 8)) - 4;
        xx = q.x + Math.sin(t * 0.8 + q.ph) * 18;
        sz = q.s * 1.6;
        break;
      case "rain":
        // diagonal rain streaks
        yy = ((q.y + t * q.sp * biome.particleSpeed * 3) % (VIEW_H + 20)) - 10;
        xx = q.x - t * 8 % 40;
        sz = q.s;
        break;
      default:
        // spark — rising ambient (temperate default, same as v2 amb)
        yy = ((q.y - t * q.sp * biome.particleSpeed) % VIEW_H + VIEW_H) % VIEW_H;
        xx = q.x + Math.sin(t * 0.6 + q.ph) * 10;
        sz = q.s;
        break;
    }

    ctx.globalAlpha = q.a;

    if (biome.particleType === "rain") {
      // draw a short streak instead of a dot
      ctx.strokeStyle = tint;
      ctx.lineWidth = sz * 0.8;
      ctx.beginPath();
      ctx.moveTo(xx, yy);
      ctx.lineTo(xx - 3, yy + 8);
      ctx.stroke();
    } else {
      ctx.fillStyle = tint;
      ctx.fillRect(xx, yy, sz, sz);
    }
  }
  ctx.globalAlpha = 1;
}

/** Draw biome-specific abyss (bottom gradient) and vignette. */
export function drawBiomeVignette(ctx: CanvasRenderingContext2D, biome: Biome) {
  // abyss gradient at bottom
  const g = ctx.createLinearGradient(0, VIEW_H - 130, 0, VIEW_H);
  g.addColorStop(0, "rgba(12,14,16,0)");
  g.addColorStop(1, biome.abyssColor);
  ctx.fillStyle = g;
  ctx.fillRect(0, VIEW_H - 130, VIEW_W, 130);

  // vignette
  const v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
  v.addColorStop(0, "rgba(12,14,16,0)");
  v.addColorStop(1, biome.vignetteColor);
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}
