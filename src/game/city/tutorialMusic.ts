// Chain City — synthwave ambient music engine for the tutorial video
// Procedurally generated Am–F–C–G progression with bass, pads, arpeggio, and hats.

export class TutorialMusic {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private playing = false;

  private readonly BPM = 78;
  private readonly STEP_MS = (60 / this.BPM / 2) * 1000; // 8th note

  // Am – F – C – G (vi–IV–I–V in C major), each chord = 2 bars = 16 steps
  private chords = [
    { root: 55.0, notes: [220.0, 261.63, 329.63] }, // Am
    { root: 43.65, notes: [174.61, 220.0, 261.63] }, // F
    { root: 65.41, notes: [261.63, 329.63, 392.0] }, // C
    { root: 49.0, notes: [196.0, 246.94, 293.66] }, // G
  ];

  start() {
    if (this.playing) return;
    this.playing = true;
    this.step = 0;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(0.22, this.ctx.currentTime + 1.5);

      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = "lowpass";
      this.filter.frequency.value = 2200;
      this.filter.Q.value = 0.4;

      this.masterGain.connect(this.filter);
      this.filter.connect(this.ctx.destination);

      this.timer = setInterval(() => this.tick(), this.STEP_MS);
    } catch {
      // audio unavailable
    }
  }

  private tick() {
    if (!this.ctx || !this.masterGain) return;
    const t = this.ctx.currentTime;
    const chordIdx = Math.floor(this.step / 16) % this.chords.length;
    const chord = this.chords[chordIdx];
    const s = this.step % 16;

    // Bass on beats 1 and 9
    if (s === 0 || s === 8) this.playBass(chord.root, t, 1.9);
    // Pad chord at start of each bar
    if (s === 0) for (const n of chord.notes) this.playPad(n, t, 2.1);
    // Arpeggio every 8th note
    this.playArp(chord.notes[this.step % chord.notes.length] * 2, t, 0.35);
    // Hat on off-beats
    if (s % 2 === 1) this.playHat(t, 0.08);

    this.step++;
  }

  private playBass(freq: number, t: number, dur: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  private playPad(freq: number, t: number, dur: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const lpf = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc2.type = "sawtooth";
    osc2.frequency.value = freq * 1.006;
    lpf.type = "lowpass";
    lpf.frequency.value = 900;
    lpf.Q.value = 0.8;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.035, t + 0.4);
    gain.gain.setValueAtTime(0.035, t + dur - 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(lpf);
    osc2.connect(lpf);
    lpf.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur);
    osc2.stop(t + dur);
  }

  private playArp(freq: number, t: number, dur: number) {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + dur);
  }

  private playHat(t: number, dur: number) {
    if (!this.ctx || !this.masterGain) return;
    const sz = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, sz, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < sz; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / sz, 4);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const hpf = this.ctx.createBiquadFilter();
    hpf.type = "highpass";
    hpf.frequency.value = 7000;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.025;
    src.connect(hpf);
    hpf.connect(gain);
    gain.connect(this.masterGain);
    src.start(t);
  }

  stop() {
    this.playing = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      const ctx = this.ctx;
      setTimeout(() => {
        ctx.close();
      }, 600);
      this.ctx = null;
      this.masterGain = null;
      this.filter = null;
    }
  }
}
