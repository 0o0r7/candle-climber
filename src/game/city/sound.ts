// Chain City — WebAudio SFX
let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  return audioCtx;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.08, delay = 0) {
  const ctx = getCtx();
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

export const sfx = {
  place() {
    tone(220, 0.15, 'square', 0.06);
    tone(440, 0.12, 'sine', 0.04, 0.05);
  },
  upgrade() {
    tone(330, 0.1, 'square', 0.05);
    tone(550, 0.1, 'sine', 0.04, 0.06);
    tone(770, 0.15, 'sine', 0.03, 0.12);
  },
  income() {
    tone(880, 0.05, 'sine', 0.02);
  },
  error() {
    tone(150, 0.15, 'sawtooth', 0.05);
  },
  graduation() {
    tone(261, 0.2, 'sine', 0.08, 0);
    tone(329, 0.2, 'sine', 0.08, 0.12);
    tone(392, 0.2, 'sine', 0.08, 0.24);
    tone(523, 0.4, 'sine', 0.1, 0.36);
  },
  click() {
    tone(600, 0.03, 'sine', 0.03);
  },
};
