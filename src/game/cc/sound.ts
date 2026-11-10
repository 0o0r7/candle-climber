// WebAudio synth — zero-asset sound design
let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterVolume = 1; // 0..1, set by SettingsPanel

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AC) {
      ctx = new AC();
      // Master gain node — every oscillator/noise passes through it
      masterGain = ctx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(ctx.destination);
    }
  }
  // resume() rejects (NotAllowedError) when called outside a user-gesture
  // window — e.g. setTimeout-deferred sfx (milestone/victory). A bare `void`
  // leaves the rejection unhandled (CANDLE-CLIMBER-2: DOMException carries
  // exactly the keys code/message/stack). Swallow: sound is best-effort.
  if (ctx?.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function unlockAudio() { ac(); }

export function setMuted(m: boolean) {
  if (ctx) ctx.suspend().catch(() => {});
  if (!m) ctx?.resume().catch(() => {});
}

/** Set master volume (0..1). Called by SettingsPanel when the slider changes. */
export function setVolume(level: number) {
  masterVolume = Math.max(0, Math.min(1, level));
  if (masterGain && ctx) {
    masterGain.gain.setValueAtTime(masterVolume, ctx.currentTime);
  }
}

function blip(freq0: number, freq1: number, dur: number, type: OscillatorType, vol = 0.12) {
  const a = ac();
  if (!a) return;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq0, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(1, freq1), a.currentTime + dur);
  g.gain.setValueAtTime(vol, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  // Route through master gain (if available) for volume control,
  // otherwise fall back to the destination directly.
  const dest = masterGain ?? a.destination;
  o.connect(g).connect(dest);
  o.start();
  o.stop(a.currentTime + dur + 0.02);
}

function noise(dur: number, vol = 0.14) {
  const a = ac();
  if (!a) return;
  const len = Math.floor(a.sampleRate * dur);
  const buf = a.createBuffer(1, len, a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const g = a.createGain();
  g.gain.value = vol;
  const dest = masterGain ?? a.destination;
  src.connect(g).connect(dest);
  src.start();
}

/** Ten-pattern #10 — sector transitions (the last missing audio cue).
 *  Each authored sector gets a two-note motif from ONE instrument family
 *  (triangle, the same family as `land`), so a run still sounds like a single
 *  voice and only the INTERVAL carries meaning. Deterministic (a table, no
 *  randomness — same sector always sounds the same) and zero-asset, which is
 *  what keeps the whole soundtrack consistent with this file's design. */
export type SectorCue = "intro" | "trend" | "squeeze" | "breather" | "summit" | "finale";

export const SECTOR_MOTIFS: Record<SectorCue, readonly [number, number]> = {
  intro: [392, 523],    // G4 -> C5  · rising third: the safe opening
  trend: [440, 587],    // A4 -> D5  · one step up: the first idea arrives
  squeeze: [523, 466],  // C5 -> Bb4 · narrow, descending: the walls close
  breather: [330, 392], // E4 -> G4  · low and soft: the release
  summit: [587, 784],   // D5 -> G5  · bright: the cap is in sight
  finale: [784, 523],   // G5 -> C5  · the bell: bright, then down
};

export const sfx = {
  jump: () => blip(300, 540, 0.12, "square", 0.08),
  // P0.6 audio variety: the second jump reads as a DIFFERENT verb — quieter,
  // higher, shorter (air, not ground). Same instrument family so the run still
  // sounds like one voice (docs/AUDIO.md).
  air: () => blip(430, 760, 0.09, "square", 0.055),
  // STYLE is gold in the HUD, so it is gold in the ear too: a clean fifth up.
  // Short and low-volume because it can fire several times per second on a
  // master run — variety must never become noise.
  style: () => blip(880, 1320, 0.08, "triangle", 0.05),
  land: () => blip(180, 140, 0.06, "triangle", 0.07),
  crumble: () => noise(0.22, 0.12),
  death: () => { blip(320, 60, 0.5, "sawtooth", 0.12); noise(0.3, 0.1); },
  milestone: () => { blip(520, 780, 0.1, "square", 0.08); setTimeout(() => blip(660, 990, 0.12, "square", 0.08), 90); },
  // W4: summit graduation fanfare (summit land) — short rising arpeggio
  victory: () => {
    blip(523, 523, 0.09, "square", 0.09);
    setTimeout(() => blip(659, 659, 0.09, "square", 0.09), 100);
    setTimeout(() => blip(784, 784, 0.09, "square", 0.09), 200);
    setTimeout(() => blip(1046, 1568, 0.22, "square", 0.09), 300);
  },
  // Sector boundary: the banner's beat, made audible (see SECTOR_MOTIFS).
  // Quiet on purpose — it fires mid-run over the jump/land rhythm and must
  // read as a chapter marker, never as a hazard warning.
  sector: (kind: SectorCue) => {
    const m = SECTOR_MOTIFS[kind] ?? SECTOR_MOTIFS.intro;
    blip(m[0], m[0], 0.09, "triangle", 0.055);
    setTimeout(() => blip(m[1], m[1], 0.16, "triangle", 0.055), 90);
  },
};
