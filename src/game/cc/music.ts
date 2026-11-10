// PROCEDURAL MUSIC BED — the trailer's score, ported into the game.
//
// Why a bed and not an .mp3: the whole soundtrack here is synthesised (sound.ts,
// zero assets), and the X trailer (scripts/trailer/audio.mjs) already proved the
// material — one section per biome, a fixed tempo and key per section, bars that
// can be cross-faded when the weather changes. This module is that idea at game
// scale: same four sections, scheduled bar by bar, so a biome change lands on a
// bar line instead of a cut.
//
// Laws it keeps:
// - DETERMINISTIC: `barPlan()` is a pure function of (biome, bar index). No
//   Math.random, no Date.now — a recorded run sounds like the run it recorded.
//   (Only the percussion TEXTURE uses noise, exactly like sound.ts's `noise()`.)
// - CANNOT TOUCH GAMEPLAY: nothing here is read by the engine; the bed never
//   gates a press. Music is atmosphere; the sfx are the signal.
// - ONE AUDIO CONTRACT: the shared AudioContext and master gain from sound.ts,
//   so the existing mute switch and volume slider already apply (no new UI).
// - QUIET ON PURPOSE: ~ −20 dB under the jump/land transients. A bed that
//   competes with the rhythm turns a rhythm game into noise.
import { audioOut } from "./sound";
import type { BiomeId } from "./biome";

/** Equal-tempered MIDI → Hz (A4 = 69 = 440 Hz). */
export const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export type MusicEvent =
  | { at: number; dur: number; kind: "tone"; midi: number; type: OscillatorType; gain: number }
  | { at: number; dur: number; kind: "hit"; gain: number };

export interface MusicBar {
  bpm: number;
  beats: number;
  events: MusicEvent[];
}

const tone = (at: number, midi: number, dur: number, type: OscillatorType, gain: number): MusicEvent =>
  ({ at, dur, kind: "tone", midi, type, gain });
const hit = (at: number, gain: number, dur = 0.05): MusicEvent => ({ at, dur, kind: "hit", gain });

// The four progressions / cells below are the trailer's, kept sparse enough for
// play: a pad, one bass, one moving line, and (only where the trailer has them)
// a soft pulse. Every section is 4 beats except tundra (2), matching 76 BPM.
const TEMPERATE = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]];
const DESERT = [[52, 55, 59], [53, 57, 60], [52, 55, 59], [48, 52, 55]];
const DESERT_MEL = [[64, 67, 69, 71], [72, 71, 69, 67], [64, 67, 69, 71], [64, 62, 60, 59]];
const RIFF = [40, 40, 46, 40, 40, 40, 45, 40];
const TUNDRA = [[52, 59, 64, 66], [48, 55, 62, 64]];
const BELLS = [76, 71, 78, 81];

/**
 * One bar of the bed, as data. Pure: same (biome, bar) ⇒ same events, so the
 * schedule is testable without a browser and a replay cannot drift.
 */
export function barPlan(biome: BiomeId, bar: number): MusicBar {
  switch (biome) {
    case "temperate": {
      // 100 BPM · root/fifth pad, a walking eighth line, a click on the beat.
      const bpm = 100;
      const beat = 60 / bpm;
      const chord = TEMPERATE[bar % 4];
      const events: MusicEvent[] = [
        tone(0, chord[0] - 12, beat * 3.6, "sawtooth", 0.05),
        tone(0, chord[1], beat * 3.4, "triangle", 0.032),
        tone(0, chord[0] - 24, beat * 0.7, "sine", 0.075),
        tone(beat * 2.5, chord[0] - 24, beat * 0.5, "sine", 0.05),
      ];
      for (let e = 0; e < 8; e++) {
        events.push(tone(e * beat * 0.5, chord[(e + bar) % 3] + (e > 3 ? 12 : 0), beat * 0.34, "triangle", 0.028));
        if (e % 2 === 0) events.push(hit(e * beat * 0.5, 0.02));
      }
      return { bpm, beats: 4, events };
    }
    case "desert": {
      // 108 BPM · drone + hand-drum pulse + the trailer's 4-note cell.
      const bpm = 108;
      const beat = 60 / bpm;
      const chord = DESERT[bar % 4];
      const mel = DESERT_MEL[bar % 4];
      const events: MusicEvent[] = [
        tone(0, chord[0] - 12, beat * 4, "sine", 0.05),
        tone(0, chord[1] - 12, beat * 3.9, "triangle", 0.028),
        tone(0, 40, 0.12, "sine", 0.07),
        tone(beat * 2.5, 40, 0.1, "sine", 0.05),
      ];
      for (let s = 0; s < 16; s++) events.push(hit(s * beat * 0.25, s % 4 === 0 ? 0.02 : 0.012, 0.04));
      for (let m = 0; m < mel.length; m++) {
        events.push(tone(beat * (0.25 + m * 0.75), mel[m] - 12, beat * 0.55, "triangle", 0.03));
      }
      return { bpm, beats: 4, events };
    }
    case "storm": {
      // 132 BPM · the riff, a kick/snare backbeat and a thin square line.
      const bpm = 132;
      const beat = 60 / bpm;
      const events: MusicEvent[] = [];
      for (let e = 0; e < 8; e++) {
        events.push(tone(e * beat * 0.5, RIFF[(e + bar * 3) % 8] - 12, beat * 0.45, "sawtooth", 0.05));
        events.push(tone(e * beat * 0.5, [64, 67, 70, 67][e % 4], beat * 0.35, "square", 0.018));
      }
      events.push(tone(0, 33, 0.22, "sine", 0.08), tone(beat * 2, 33, 0.22, "sine", 0.075));
      events.push(hit(beat, 0.05), hit(beat * 3, 0.055));
      for (let s = 0; s < 8; s++) events.push(hit(beat * (3 + s * 0.125), 0.025, 0.04));
      return { bpm, beats: 4, events };
    }
    case "tundra": {
      // 76 BPM · slow pad, a muffled heartbeat, two bells per bar.
      const bpm = 76;
      const beat = 60 / bpm;
      const chord = TUNDRA[bar % 2];
      const events: MusicEvent[] = [
        tone(0, chord[0] - 12, beat * 2.2, "sawtooth", 0.05),
        tone(0, chord[3], beat * 2.1, "triangle", 0.03),
        tone(0, 33, 0.26, "sine", 0.06),
        tone(0.24, 33, 0.22, "sine", 0.045),
        tone(beat * 0.5, BELLS[bar % 4], beat * 0.6, "sine", 0.03),
        tone(beat * 1.25, BELLS[(bar + 2) % 4], beat * 0.6, "sine", 0.026),
      ];
      return { bpm, beats: 2, events };
    }
    default:
      return { bpm: 100, beats: 4, events: [] };
  }
}

const MUSIC_LEVEL = 0.5; // bed gain on the shared master bus (sfx stay on top)
const LOOKAHEAD = 0.35; // seconds of audio scheduled ahead of the clock
const TICK_MS = 60;

let bus: GainNode | null = null;
let timer: ReturnType<typeof setInterval> | null = null;
let section: BiomeId | null = null;
let bar = 0;
let nextAt = 0;

const barSeconds = (b: MusicBar) => (60 / b.bpm) * b.beats;

function ensureBus(): { ctx: AudioContext; gain: GainNode } | null {
  const out = audioOut();
  if (!out) return null;
  if (!bus) {
    bus = out.ctx.createGain();
    bus.gain.value = 0;
    bus.connect(out.dest);
  }
  return { ctx: out.ctx, gain: bus };
}

function playTone(ctx: AudioContext, dest: AudioNode, ev: Extract<MusicEvent, { kind: "tone" }>, t0: number) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = ev.type;
  o.frequency.setValueAtTime(hz(ev.midi), t0);
  const atk = Math.min(0.04, ev.dur * 0.25);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(ev.gain, t0 + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + ev.dur);
  o.connect(g).connect(dest);
  o.start(t0);
  o.stop(t0 + ev.dur + 0.02);
}

function playHit(ctx: AudioContext, dest: AudioNode, ev: Extract<MusicEvent, { kind: "hit" }>, t0: number) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * ev.dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.value = ev.gain;
  src.connect(g).connect(dest);
  src.start(t0);
}

/** Fill the schedule up to the lookahead window, one whole bar at a time. */
function pump() {
  const out = audioOut();
  if (!out || !bus || !section) return;
  const ctx = out.ctx;
  while (nextAt < ctx.currentTime + LOOKAHEAD) {
    const plan = barPlan(section, bar);
    for (const ev of plan.events) {
      if (ev.kind === "tone") playTone(ctx, bus, ev, nextAt + ev.at);
      else playHit(ctx, bus, ev, nextAt + ev.at);
    }
    nextAt += barSeconds(plan);
    bar += 1;
  }
}

/**
 * Start (or re-section) the bed. Safe to call on every render: a repeat call
 * with the same biome is a no-op, and a new biome cross-fades across the seam.
 */
export function startMusic(biome: BiomeId = "temperate") {
  const out = ensureBus();
  if (!out) return;
  const now = out.ctx.currentTime;
  if (timer === null) {
    section = biome;
    bar = 0;
    nextAt = now + 0.06;
    timer = setInterval(pump, TICK_MS);
    pump();
    out.gain.gain.cancelScheduledValues(now);
    out.gain.gain.setValueAtTime(0.0001, now);
    out.gain.gain.exponentialRampToValueAtTime(MUSIC_LEVEL, now + 0.8);
    return;
  }
  if (section !== biome) {
    section = biome;
    const g = out.gain.gain;
    g.cancelScheduledValues(now);
    g.setValueAtTime(Math.max(g.value, 0.0001), now);
    g.exponentialRampToValueAtTime(MUSIC_LEVEL * 0.4, now + 0.22);
    g.exponentialRampToValueAtTime(MUSIC_LEVEL, now + 0.9);
  }
}

/** Fade out and stop scheduling. Called on death, graduation, pause and unmount. */
export function stopMusic() {
  if (timer !== null) {
    clearInterval(timer);
    timer = null;
  }
  section = null;
  const out = audioOut();
  if (!out || !bus) return;
  const now = out.ctx.currentTime;
  bus.gain.cancelScheduledValues(now);
  bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), now);
  bus.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
}

/** Test/telemetry hook: is the bed currently scheduling? (no audio side effects) */
export function musicPlaying(): boolean {
  return timer !== null;
}
