#!/usr/bin/env node
// Candle Climber — build the 15s X/social trailer cuts from a master take.
//
//   node scripts/trailer/build.mjs                                  # capture + build → /tmp/cc-trailer
//   node scripts/trailer/build.mjs --take master.webm                # reuse an existing take
//   node scripts/trailer/build.mjs --out docs/assets/x-launch        # publish kit-named files
//
// Pipeline: master take → loop-seam anchor (auto) → per-hook cut window → procedural
// audio (audio.mjs) → burned-in captions + end card → H.264/AAC MP4 + poster, with the
// cut point and output streams checked. See scripts/trailer/README.md.
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../..');
const require = createRequire(join(REPO, 'package.json'));

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 ? argv[i + 1] : def;
};
const WORK = opt('dir', process.env.TRAILER_DIR || '/tmp/cc-trailer');
const TAKE = opt('take', process.env.TRAILER_TAKE || null);
const OUT = opt('out', null);
const LOOP_OVERRIDE = opt('loop', null);
const TIMELINE = opt('timeline', join(WORK, 'timeline.json'));

const DUR = 15; // cut length
const CARD = DUR - 2.1; // end card fades in here
const FPS = 25; // recording + output frame rate

// --- the cuts -------------------------------------------------------------
// loopStart is seconds into the demo's 30s loop (see timeline.ts); each cut runs DUR.
// `file` is the name used when publishing into the kit (docs/assets/x-launch).
const VARIANTS = [
  {
    id: 'A-crumble',
    file: 'x-08-trailer-15s-crumble',
    hook: 'crumble',
    loopStart: 3.10,
    posterAt: 0.62,
    captions: [
      { t0: 0.15, t1: 2.45, text: 'RED CANDLES CRUMBLE' },
      { t0: 4.95, t1: 7.65, text: 'THE TERRAIN IS THE CHART' },
    ],
  },
  {
    id: 'B-leap',
    file: 'x-09-trailer-15s-leap',
    hook: 'leap',
    loopStart: 6.85,
    posterAt: 0.50,
    captions: [
      { t0: 0.10, t1: 2.30, text: 'GREEN CANDLES HOLD' },
      { t0: 8.85, t1: 11.55, text: 'THE TERRAIN IS THE CHART' },
    ],
  },
  {
    id: 'C-storm',
    file: 'x-10-trailer-15s-storm',
    hook: 'storm',
    loopStart: 14.50,
    posterAt: 0.95,
    captions: [
      { t0: 0.30, t1: 2.90, text: 'THE WEATHER FOLLOWS THE MARKET' },
      { t0: 8.70, t1: 11.40, text: 'THE TERRAIN IS THE CHART' },
    ],
  },
];

// --- tools ----------------------------------------------------------------
const run = (bin, args, opts = {}) => {
  const r = spawnSync(bin, args, { maxBuffer: 1 << 26, ...opts });
  if (r.error) throw r.error;
  if (r.status !== 0) throw new Error(`${bin} ${args[0]} failed:\n${String(r.stderr).slice(-900)}`);
  return r;
};
function resolveBin(name, envKey, mod) {
  if (process.env[envKey]) return process.env[envKey];
  try {
    const p = require(mod);
    if (p) return typeof p === 'string' ? p : p.path;
  } catch {}
  if (!spawnSync(name, ['-version']).error) return name;
  throw new Error(`no ${name} found — set ${envKey}=/path/to/${name}, or install one: npm i -D ${mod}`);
}
const FFMPEG = resolveBin('ffmpeg', 'FFMPEG', 'ffmpeg-static');
const FFPROBE = resolveBin('ffprobe', 'FFPROBE', 'ffprobe-static');
const log = (m) => process.stderr.write(m + '\n');

mkdirSync(WORK, { recursive: true });

// --- crop: the canvas box the capture recorded ----------------------------
let CROP = opt('crop', process.env.TRAILER_CROP || '1600:960:40:20');
const captureJson = join(WORK, 'capture.json');
if (!opt('crop', null) && existsSync(captureJson)) {
  const box = JSON.parse(readFileSync(captureJson, 'utf8')).box;
  if (box) CROP = `${box.width}:${box.height}:${box.x}:${box.y}`;
}

// --- master take ----------------------------------------------------------
let take = TAKE;
if (!take) {
  log(`[capture] recording ${DUR}-window master take (needs the dev server up)…`);
  run('node', [join(HERE, 'capture.mjs'), '--dir', WORK]).stdout.toString();
  take = JSON.parse(readFileSync(captureJson, 'utf8')).take;
}
if (!take || !existsSync(take)) throw new Error(`master take not found: ${take}`);
const takeProbe = JSON.parse(run(FFPROBE, ['-v', 'error', '-show_entries', 'stream=width,height,r_frame_rate:format=duration', '-of', 'json', take]).stdout.toString());
const takeDur = Number(takeProbe.format.duration);

// --- timeline: the demo's own biome changes + sfx --------------------------
function timeline() {
  if (existsSync(TIMELINE)) return JSON.parse(readFileSync(TIMELINE, 'utf8'));
  log('[timeline] running scripts/trailer/timeline.ts in the web container…');
  const r = spawnSync('docker', ['compose', '-f', 'docker-compose.base44.yml', 'exec', '-T', 'web', 'bun', 'scripts/trailer/timeline.ts'], { cwd: REPO, maxBuffer: 1 << 26 });
  const text = r.stdout ? r.stdout.toString() : '';
  const json = text.slice(text.indexOf('{'));
  if (r.status !== 0 || !json.startsWith('{')) {
    throw new Error(`could not generate the timeline. Run it by hand and pass --timeline:\n  docker compose -f docker-compose.base44.yml exec -T web bun scripts/trailer/timeline.ts > ${TIMELINE}\n${String(r.stderr || '').slice(-400)}`);
  }
  const tl = JSON.parse(json);
  writeFileSync(TIMELINE, JSON.stringify(tl, null, 1));
  return tl;
}
const tl = timeline();
if (tl.died) throw new Error('the demo run died inside the loop — capture a new take (--seconds bigger)');

// --- loop seam: the demo fades to the frame colour across the seam ---------
const SEAM_W = 160, SEAM_H = 96;
function detectLoopSeam() {
  const raw = join(WORK, 'seam.raw');
  run(FFMPEG, ['-v', 'error', '-i', take, '-vf', `crop=${CROP},scale=${SEAM_W}:${SEAM_H}`, '-r', String(FPS), '-f', 'rawvideo', '-pix_fmt', 'gray', raw]);
  const b = readFileSync(raw);
  const N = SEAM_W * SEAM_H;
  const F = Math.floor(b.length / N);
  const bright = new Int32Array(F);
  const flat = new Float64Array(F);
  for (let f = 0; f < F; f++) {
    let c = 0, s = 0, s2 = 0;
    for (let y = 0; y < SEAM_H; y++) {
      for (let x = 0; x < SEAM_W; x++) {
        const v = b[f * N + y * SEAM_W + x];
        if (v > 100 && x < 110) c++; // the biome HUD chip sits top-right and is not faded
        s += v; s2 += v * v;
      }
    }
    bright[f] = c;
    flat[f] = Math.sqrt(Math.max(0, s2 / N - (s / N) ** 2));
  }
  // the fade empties the frame of bright gameplay for ~0.5s: find that run, then take
  // the flattest frame around it (the fade apex is the loop start)
  const runs = [];
  let from = -1;
  for (let f = 0; f < F; f++) {
    if (bright[f] <= 8) { if (from < 0) from = f; continue; }
    if (from >= 0) { runs.push([from, f - 1]); from = -1; }
  }
  if (from >= 0) runs.push([from, F - 1]);
  // a seam fade is a SHORT dark gap with real gameplay on BOTH sides: the dark lead-in
  // before the demo paints has nothing before it and must not qualify
  const win = Math.round(2 * FPS);
  const mean = (from, to) => {
    if (to <= from) return 0;
    let s = 0;
    for (let f = from; f < to; f++) s += bright[f];
    return s / (to - from);
  };
  const seam = runs.filter(([a, z]) => {
    const len = (z - a + 1) / FPS;
    if (len < 0.15 || len > 1.2) return false;
    if (a < win || z + win >= F) return false;
    return mean(a - win, a) > 20 && mean(z + 1, z + win) > 20;
  });
  if (!seam.length) throw new Error(`loop seam not found in the take (${runs.length} dark gaps seen) — pass --loop <seconds into the loop>`);
  const [a, z] = seam[0];
  // the flattest frame INSIDE the gap is the fade apex = the loop start
  let best = a, bestV = Infinity;
  for (let f = a; f <= z; f++) if (flat[f] < bestV) { bestV = flat[f]; best = f; }
  return { loopStart: best / FPS, flatness: +bestV.toFixed(2), candidates: seam.length };
}
const seam = LOOP_OVERRIDE ? { loopStart: Number(LOOP_OVERRIDE), flatness: null } : detectLoopSeam();
log(`[seam] loop start at ${seam.loopStart.toFixed(2)}s of ${takeDur.toFixed(2)}s take (${seam.flatness === null ? 'from --loop' : 'flatness ' + seam.flatness + ', ' + seam.candidates + ' candidate gap(s)'})`);

const maxLoopEnd = Math.max(...VARIANTS.map((v) => v.loopStart + DUR));
if (seam.loopStart + maxLoopEnd > takeDur - 0.05) {
  throw new Error(`take is too short: the cuts reach ${maxLoopEnd}s into the loop but it ends at ${(takeDur - seam.loopStart).toFixed(2)}s — capture again with a bigger --seconds`);
}

// --- captions + end card ---------------------------------------------------
const ASS_HEAD = `[Script Info]
ScriptType: v4.00+
PlayResX: 1600
PlayResY: 960
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Hook,DejaVu Sans Mono,32,&H00F0EDE8,&H000000FF,&H50141012,&H00000000,1,0,0,0,100,100,2,0,1,7,0,2,60,60,120,1
Style: Plate,DejaVu Sans Mono,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1
Style: Mark,DejaVu Sans Mono,66,&H0000FFCC,&H000000FF,&H00000000,&H00000000,1,0,0,0,100,100,8,0,1,0,0,5,0,0,0,1
Style: Tag,DejaVu Sans Mono,26,&H00D9D1C9,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,4,0,1,0,0,5,0,0,0,1
Style: Cta,DejaVu Sans Mono,19,&H008A9299,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,6,0,1,0,0,5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
const assTime = (t) => {
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
};
function writeAss(v) {
  const lines = v.captions.map((c) => `Dialogue: 0,${assTime(c.t0)},${assTime(c.t1)},Hook,,0,0,0,,{\\fad(180,200)}${c.text}`);
  lines.push(`Dialogue: 0,${assTime(CARD)},${assTime(DUR)},Plate,,0,0,0,,{\\p1\\1c&H0E0B08&\\alpha&H47&\\fad(250,0)}m 0 0 l 1600 0 l 1600 960 l 0 960{\\p0}`);
  lines.push(`Dialogue: 1,${assTime(CARD + 0.10)},${assTime(DUR)},Plate,,0,0,0,,{\\p1\\1c&H00FFCC&\\alpha&H10&\\fad(300,0)}m 700 452 l 900 452 l 900 455 l 700 455{\\p0}`);
  lines.push(`Dialogue: 1,${assTime(CARD + 0.08)},${assTime(DUR)},Mark,,0,0,0,,{\\pos(800,392)\\fad(260,60)}CANDLE CLIMBER`);
  lines.push(`Dialogue: 1,${assTime(CARD + 0.40)},${assTime(DUR)},Tag,,0,0,0,,{\\pos(800,478)\\fad(260,80)}READ THE CHART. DON'T FALL.`);
  lines.push(`Dialogue: 1,${assTime(CARD + 0.80)},${assTime(DUR)},Cta,,0,0,0,,{\\pos(800,582)\\fad(260,120)}NEW CHART EVERY DAY · 00:00 UTC`);
  const path = join(WORK, `${v.id}.ass`);
  writeFileSync(path, ASS_HEAD + lines.join('\n') + '\n');
  return path;
}

// --- build -----------------------------------------------------------------
const biomeAt = (t) => { let b = tl.zones[0].biome; for (const z of tl.zones) if (z.t <= t) b = z.biome; return b; };
const report = [];

for (const v of VARIANTS) {
  const start = seam.loopStart + v.loopStart;
  log(`[${v.id}] cutting ${start.toFixed(2)}s → ${(start + DUR).toFixed(2)}s`);

  const zones = [{ t: 0, biome: biomeAt(v.loopStart) }];
  for (const z of tl.zones) if (z.t > v.loopStart && z.t < v.loopStart + DUR) zones.push({ t: +(z.t - v.loopStart).toFixed(3), biome: z.biome });
  const events = tl.events
    .filter((e) => e.t >= v.loopStart - 0.05 && e.t < v.loopStart + DUR)
    .map((e) => ({ t: +(e.t - v.loopStart).toFixed(3), name: e.name }));

  const cfg = join(WORK, `${v.id}.json`);
  writeFileSync(cfg, JSON.stringify({ duration: DUR, hook: v.hook, zones, events }));
  const wav = join(WORK, `${v.id}.wav`);
  const audio = JSON.parse(run('node', [join(HERE, 'audio.mjs'), cfg, wav]).stdout.toString().trim());

  const ass = writeAss(v);
  const mp4 = join(WORK, `${v.id}.mp4`);
  const poster = join(WORK, `${v.id}-poster.jpg`);
  run(FFMPEG, ['-y', '-ss', String(start), '-t', String(DUR), '-i', take, '-i', wav,
    '-filter_complex', `[0:v]crop=${CROP},ass=${ass},format=yuv420p[v]`,
    '-map', '[v]', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level', '4.2', '-r', String(FPS), '-g', '50',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', mp4]);
  run(FFMPEG, ['-y', '-ss', String(v.posterAt), '-i', mp4, '-frames:v', '1', '-update', '1', '-q:v', '3', poster]);

  // checks: the cut must start on the intended frame of the master, and the file must be sound
  const grab = (args) => run(FFMPEG, args).stdout;
  const head = grab(['-v', 'error', '-i', mp4, '-frames:v', '1', '-vf', `scale=${SEAM_W}:${SEAM_H}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-']);
  const src = grab(['-v', 'error', '-ss', String(start), '-i', take, '-frames:v', '1', '-vf', `crop=${CROP},scale=${SEAM_W}:${SEAM_H}`, '-f', 'rawvideo', '-pix_fmt', 'gray', '-']);
  let diff = 0;
  for (let i = 0; i < Math.min(head.length, src.length); i++) diff += Math.abs(head[i] - src[i]);
  const cutPointDiff = +(diff / Math.min(head.length, src.length)).toFixed(2);
  if (cutPointDiff > 3) throw new Error(`${v.id}: cut point does not match the master (mean abs diff ${cutPointDiff})`);

  const probe = JSON.parse(run(FFPROBE, ['-v', 'error', '-show_entries', 'format=duration,size:stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels', '-of', 'json', mp4]).stdout.toString());
  const vol = run(FFMPEG, ['-hide_banner', '-i', mp4, '-af', 'volumedetect', '-f', 'null', '-']).stderr.toString()
    .split('\n').filter((l) => /mean_volume|max_volume/.test(l)).map((l) => l.trim().split('] ')[1]);

  if (OUT) {
    mkdirSync(OUT, { recursive: true });
    copyFileSync(mp4, join(OUT, `${v.file}.mp4`));
    copyFileSync(poster, join(OUT, `${v.file}-poster.jpg`));
  }

  report.push({
    id: v.id, hook: v.hook, seconds: Number(probe.format.duration), sizeMB: +(probe.format.size / 1048576).toFixed(2),
    video: `${probe.streams.find((s) => s.codec_type === 'video').width}x${probe.streams.find((s) => s.codec_type === 'video').height}@${probe.streams.find((s) => s.codec_type === 'video').r_frame_rate}`,
    audio: `${probe.streams.find((s) => s.codec_type === 'audio').codec_name} ${probe.streams.find((s) => s.codec_type === 'audio').sample_rate}Hz stereo`,
    audioBed: audio.rmsDb + 'dB rms / peak ' + audio.peak, vol, zones, events: events.length,
    cutPointDiff, cutFrom: +start.toFixed(2), mp4, ...(OUT ? { published: join(OUT, `${v.file}.mp4`) } : {}),
  });
}

console.log(JSON.stringify({ take, crop: CROP, seam, outputs: report }, null, 1));
