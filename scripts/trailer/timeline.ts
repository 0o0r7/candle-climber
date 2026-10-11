// Candle Climber — deterministic timeline of the landing demo, in loop-relative seconds.
//
//   docker compose -f docker-compose.base44.yml exec -T web \
//     bun scripts/trailer/timeline.ts > /tmp/cc-trailer/timeline.json
//
// Runs the same modules the demo renders with (seed, pilot, level), so the trailer's
// audio and captions land on the same beats as the recorded video. Build.mjs calls this
// itself when it has no timeline yet. `died: true` means the demo run broke mid-loop and
// the take is unusable — capture again.
//
// PREROLL_S / LOOP_S mirror src/components/landing/GameplayDemo.tsx (keep in sync).
import { DemoPilot } from "../../src/components/landing/demo-pilot";
import { DEMO_SEED, demoCandles, zoneAt } from "../../src/components/landing/demo-chart";
import { FIXED_DT } from "../../src/game/cc/rival/planner";
import { PLAYER_W } from "../../src/game/cc/engine";
import { CANDLE_W } from "../../src/game/cc/level";

const PREROLL_S = 2.5;
const LOOP_S = 30;

const candles = demoCandles();
const pilot = new DemoPilot(candles, DEMO_SEED);
const eng = pilot.eng as any;
const cb = eng.cb as any; // TS-private, present at runtime: carries the demo's sfx hooks

const events: { t: number; name: string }[] = [];
const at = () => +(eng.time - PREROLL_S).toFixed(4);
const record = (name: string) => events.push({ t: at(), name });
cb.onSfx = record;
cb.onDeath = () => record("death");
cb.onGraduate = () => record("graduate");

for (let i = 0; i < Math.round(PREROLL_S / FIXED_DT); i++) pilot.tick();

let last = zoneAt(Math.floor((eng.px + PLAYER_W / 2) / CANDLE_W)).biome;
const zones: { t: number; biome: string }[] = [{ t: 0, biome: last }];
let steps = 0;
let died = false;
for (let i = 0; i < Math.round(LOOP_S / FIXED_DT) + 2; i++) {
  if (eng.dead) { died = true; break; }
  pilot.tick();
  steps++;
  const z = zoneAt(Math.floor((eng.px + PLAYER_W / 2) / CANDLE_W)).biome;
  if (z !== last) { last = z; zones.push({ t: +(steps * FIXED_DT).toFixed(3), biome: z }); }
}

const counts: Record<string, number> = {};
for (const e of events) counts[e.name] = (counts[e.name] ?? 0) + 1;

console.log(JSON.stringify({ fixedDt: FIXED_DT, loopS: +(steps * FIXED_DT).toFixed(3), died, counts, zones, events }, null, 1));
