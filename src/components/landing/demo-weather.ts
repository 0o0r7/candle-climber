// Landing-demo weather fronts — a weather zone change is a cross-fade, not a cut.
//
// The demo climbs through four biome zones. Swapping the whole environment in a
// single frame (sky wash + fog + particles + palette) reads as a rendering bug
// on video — a coloured flash the audience cannot explain. This module holds the
// zone the demo is leaving and how far the new one has arrived, so the arriving
// weather fades in over ZONE_BLEND_S like a front passing over the mountain.
//
// Demo-only + cosmetic: it interpolates what the renderer draws, and never
// touches engine state, terrain, physics or determinism.
import type { Biome } from "@/game/cc/biome";
import { biomeById } from "@/game/cc/biome";
import { windLabelOf, fogLabelOf, type Weather } from "@/game/cc/weather";
import type { DemoZone } from "./demo-chart";

/** Seconds the arriving zone takes to fully land. */
export const ZONE_BLEND_S = 1.4;

/** ease-in-out — a front arrives softly, settles firmly. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/** Biome colours are the only "rgba(r,g,b,a)" strings the renderer consumes. */
function parseRgba(s: string): [number, number, number, number] {
  const m = /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)/.exec(s);
  if (!m) return [16, 18, 20, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])];
}

function mixRgba(a: string, b: string, t: number): string {
  const [ar, ag, ab, aa] = parseRgba(a);
  const [br, bg, bb, ba] = parseRgba(b);
  const mix = (x: number, y: number) => Math.round(x + (y - x) * t);
  return `rgba(${mix(ar, br)},${mix(ag, bg)},${mix(ab, bb)},${(aa + (ba - aa) * t).toFixed(3)})`;
}

/**
 * Blend two biomes. The arriving biome owns the particle field (id) and type
 * from the start of the front, so flakes/streaks never re-seed mid-fade — only
 * their colour density and the ambient light are interpolated.
 */
export function blendBiome(a: Biome, b: Biome, t: number): Biome {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    id: b.id,
    name: t < 0.5 ? a.name : b.name,
    skyTint: mixRgba(a.skyTint, b.skyTint, t),
    particleColor: mixRgba(a.particleColor, b.particleColor, t),
    vignetteColor: mixRgba(a.vignetteColor, b.vignetteColor, t),
    abyssColor: mixRgba(a.abyssColor, b.abyssColor, t),
    particleCount: b.particleCount,
    particleSpeed: a.particleSpeed + (b.particleSpeed - a.particleSpeed) * t,
    particleType: t < 0.5 ? a.particleType : b.particleType,
  };
}

/** Blend the H2 weather numbers (wind/fog/tremor) — all continuous drivers. */
export function blendWeather(a: Weather, b: Weather, t: number): Weather {
  const wind = a.wind + (b.wind - a.wind) * t;
  const fog = a.fog + (b.fog - a.fog) * t;
  return {
    wind,
    windDir: t < 0.5 ? a.windDir : b.windDir,
    fog,
    tremor: a.tremor + (b.tremor - a.tremor) * t,
    atr: a.atr + (b.atr - a.atr) * t,
    windLabel: windLabelOf(wind),
    fogLabel: fogLabelOf(fog),
  };
}

export interface ZoneEnv {
  /** Zone the HUD label reports (the arriving one once it is more than half in). */
  zone: DemoZone;
  biome: Biome;
  weather: Weather;
}

/** Tracks the zone the demo is in and how far the next one has arrived. */
export class ZoneBlender {
  private from: DemoZone;
  private to: DemoZone;
  private t = 1;

  constructor(zone: DemoZone) {
    this.from = zone;
    this.to = zone;
  }

  /** Jump straight into a zone with no transition (fresh run / loop restart). */
  reset(zone: DemoZone) {
    this.from = zone;
    this.to = zone;
    this.t = 1;
  }

  /** Advance one fixed step and return the environment to draw. */
  step(zone: DemoZone, dt: number): ZoneEnv {
    if (zone !== this.to) {
      this.from = this.to;
      this.to = zone;
      this.t = 0;
    } else if (this.t < 1) {
      this.t = Math.min(1, this.t + dt / ZONE_BLEND_S);
    }
    const m = smooth(this.t);
    return {
      zone: m < 0.5 ? this.from : this.to,
      biome: blendBiome(biomeById(this.from.biome), biomeById(this.to.biome), m),
      weather: blendWeather(this.from.weather, this.to.weather, m),
    };
  }
}
