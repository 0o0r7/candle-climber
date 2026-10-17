// Signal Forge — WebAudio synth SFX (zero assets)
// Same approach as Candle Climber's sound.ts: synthesized blips, no audio files.

let ctx: AudioContext | null = null;
let muted = false;
let volume = 0.3;

export function unlockAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch { /* no audio */ }
  }
  if (ctx?.state === "suspended") ctx.resume();
}

export function setMuted(m: boolean) { muted = m; }
export function setVolume(v: number) { volume = v; }
export function isMuted() { return muted; }

function blip(freq: number, dur: number, type: OscillatorType = "square", gain = 0.15) {
  if (muted || !ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(gain * volume, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

function sweep(from: number, to: number, dur: number, type: OscillatorType = "sawtooth", gain = 0.12) {
  if (muted || !ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(from, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(to, ctx.currentTime + dur);
  g.gain.setValueAtTime(gain * volume, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

export function sfx(name: string) {
  if (muted) return;
  switch (name) {
    case "signal":
      blip(880, 0.08, "square");
      setTimeout(() => blip(1320, 0.06, "square"), 50);
      break;
    case "pool":
      sweep(440, 1760, 0.2, "sine", 0.15);
      break;
    case "dash":
      sweep(220, 660, 0.1, "sawtooth", 0.1);
      break;
    case "wave":
      sweep(120, 60, 0.3, "sawtooth", 0.08);
      break;
    case "flashcrash":
      sweep(880, 80, 0.4, "sawtooth", 0.15);
      setTimeout(() => blip(60, 0.2, "square", 0.1), 100);
      break;
    case "liquidation":
      sweep(440, 55, 0.6, "sawtooth", 0.2);
      setTimeout(() => blip(55, 0.3, "square", 0.15), 200);
      break;
    case "chain":
      blip(660, 0.05, "square");
      setTimeout(() => blip(880, 0.05, "square"), 40);
      setTimeout(() => blip(1100, 0.08, "square"), 80);
      break;
  }
}
