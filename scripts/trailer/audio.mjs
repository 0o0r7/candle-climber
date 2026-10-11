// Candle Climber — X trailer audio bed (15s, NOT looped: hook-first, buttoned ending).
// Same procedural instruments as the landing-demo soundtrack, restructured for a
// single trailer cut: hard hook transient at frame 0, one music section per biome
// with a 1.4s cross-fade on each weather change, sfx from the deterministic action
// timeline, and a cadence landing on the end card.
// Produced by scripts/trailer/build.mjs (cfg = {duration, hook, zones, events});
// usage: node scripts/trailer/audio.mjs <cfg.json> <out.wav>
import { readFileSync, writeFileSync } from 'node:fs';

const cfg = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const OUT = process.argv[3];
const SR = 48000;
const DUR = cfg.duration;
const N = Math.round(DUR * SR);

const mulberry32 = (a) => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let rnd = mulberry32(1337);

const bus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const MUS = bus(), SFX = bus();

// straight additive write, clipped to the buffer (no loop wrap in a trailer cut)
function mix(b, t0, s, pan, gain) {
  const g0 = Math.round(t0 * SR);
  const gl = gain * (1 - Math.max(0, pan || 0)), gr = gain * (1 + Math.min(0, pan || 0));
  for (let i = 0; i < s.length; i++) {
    const g = g0 + i;
    if (g < 0 || g >= N) continue;
    b.L[g] += s[i] * gl; b.R[g] += s[i] * gr;
  }
}

const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
const wave = (type, ph) => {
  const x = ph - Math.floor(ph);
  if (type === 'saw') return 2 * x - 1;
  if (type === 'tri') return 4 * Math.abs(x - 0.5) - 1;
  if (type === 'sine') return Math.sin(2 * Math.PI * x);
  return x < 0.5 ? 1 : -1;
};

function tone(o) {
  const dur = o.dur, n = Math.max(1, Math.round(dur * SR));
  const out = new Float32Array(n);
  const att = o.att ?? 0.004, rel = o.rel ?? 0.05, dec = o.dec ?? 0;
  const f0 = o.freq, f1 = o.freq2 ?? o.freq;
  const det = o.detune ?? 0, vib = o.vib ?? 0, vibHz = o.vibHz ?? 5;
  let p1 = 0, p2 = 0, lp = 0, hp = 0;
  const aLp = o.lp ? 1 - Math.exp(-2 * Math.PI * o.lp / SR) : 0;
  const aHp = o.hp ? 1 - Math.exp(-2 * Math.PI * o.hp / SR) : 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, u = dur > 0 ? t / dur : 0;
    const f = f0 + (f1 - f0) * u;
    const v = vib ? 1 + vib * Math.sin(2 * Math.PI * vibHz * t) : 1;
    p1 += f * v / SR; p2 += f * v * (1 + det) / SR;
    let s = wave(o.type || 'square', p1);
    if (det) s = 0.55 * s + 0.55 * wave(o.type || 'square', p2);
    if (o.noise) s += o.noise * (rnd() * 2 - 1);
    let a = 1;
    if (att > 0 && t < att) a = t / att;
    else if (dec > 0) a = Math.exp(-(t - att) / dec);
    if (rel > 0 && t > dur - rel) a *= Math.max(0, (dur - t) / rel);
    s *= a;
    if (aLp) { lp += aLp * (s - lp); s = lp; }
    if (aHp) { hp += aHp * (s - hp); s = s - hp; }
    if (o.drive) s = Math.tanh(s * o.drive) / Math.tanh(o.drive);
    out[i] = s;
  }
  return out;
}

function noiseBurst(o) {
  const dur = o.dur, n = Math.max(1, Math.round(dur * SR));
  const out = new Float32Array(n);
  const aLp = o.lp ? 1 - Math.exp(-2 * Math.PI * o.lp / SR) : 0;
  const aHp = o.hp ? 1 - Math.exp(-2 * Math.PI * o.hp / SR) : 0;
  let lp = 0, hp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = rnd() * 2 - 1;
    if (aLp) { lp += aLp * (s - lp); s = lp; }
    if (aHp) { hp += aHp * (s - hp); s = s - hp; }
    let a = o.att && t < o.att ? t / o.att : Math.exp(-t / (o.dec || dur * 0.3));
    if (o.rel && t > dur - o.rel) a *= Math.max(0, (dur - t) / o.rel);
    out[i] = s * a;
  }
  return out;
}

// ---- instruments (identical to the landing-demo soundtrack) ------------
const kick = (v = 1, d = 0.20) => tone({ freq: 138, freq2: 44, dur: d, type: 'sine', att: 0.001, dec: d * 0.45, rel: 0.02 }).map((x) => x * v);
const snare = (v = 1, d = 0.19) => {
  const a = noiseBurst({ dur: d, hp: 1400, dec: d * 0.28 });
  const b = tone({ freq: 205, freq2: 170, dur: d * 0.5, type: 'tri', att: 0.001, dec: d * 0.2, rel: 0.02 });
  return a.map((x, i) => (x + (b[i] || 0) * 0.7) * v);
};
const hat = (v = 0.35, d = 0.05) => noiseBurst({ dur: d, hp: 7000, dec: d * 0.35 });
const crash = (v = 1, d = 1.6) => noiseBurst({ dur: d, hp: 3200, dec: d * 0.3, att: 0.002 });
const djembe = (f, v = 1, slap = false, d = 0.3) => {
  const t = tone({ freq: f, freq2: f * 0.72, dur: d, type: 'sine', att: 0.001, dec: d * 0.22, rel: 0.02 });
  const s = noiseBurst({ dur: slap ? 0.06 : 0.02, hp: slap ? 2600 : 900, dec: 0.02 });
  return t.map((x, i) => (x + (s[i] || 0) * (slap ? 0.8 : 0.35)) * v);
};
const bell = (f, v = 1) => {
  const a = tone({ freq: f, dur: 1.5, type: 'tri', att: 0.002, dec: 0.42, rel: 0.6 });
  const b = tone({ freq: f * 2.02, dur: 0.9, type: 'sine', att: 0.002, dec: 0.18, rel: 0.4 });
  return a.map((x, i) => (x + (b[i] || 0) * 0.32) * v);
};
const thunder = (v = 1) => {
  const low = noiseBurst({ dur: 2.4, lp: 220, dec: 0.75, att: 0.01 });
  const crack = noiseBurst({ dur: 0.16, hp: 1800, dec: 0.05 });
  return low.map((x, i) => (x * 1.1 + (crack[i] || 0) * 0.8) * v);
};
const rain = (dur) => noiseBurst({ dur, hp: 2200, lp: 9000, att: 0.6, rel: 0.8, dec: dur });
const wind = (dur) => {
  const s = noiseBurst({ dur, lp: 700, att: 1.2, rel: 1.4, dec: dur });
  for (let i = 0; i < s.length; i++) s[i] *= 0.65 + 0.35 * Math.sin(2 * Math.PI * 0.13 * i / SR + Math.sin(i / SR * 0.7));
  return s;
};
const riser = (dur, v = 1) => {
  const s = noiseBurst({ dur, hp: 400, dec: dur * 0.9, att: 0.02 });
  for (let i = 0; i < s.length; i++) s[i] *= (i / s.length) ** 1.6;
  return s;
};

// ---- one music section per biome --------------------------------------
const S = cfg.zones.map((z, i) => ({ biome: z.biome, start: z.t, end: i + 1 < cfg.zones.length ? cfg.zones[i + 1].t : DUR }));
const XF = 1.4; // matches the visual weather cross-fade

function renderSection(sec) {
  const b = bus();
  const t0 = sec.start, len = sec.end - sec.start;
  const put = (t, s, pan, g) => mix(b, t, s, pan, g ?? 1);
  const beat = (bpm) => 60 / bpm;

  if (sec.biome === 'temperate') {
    const bt = beat(100), bars = Math.ceil((len + 1.5) / (bt * 4));
    const prog = [[57, 60, 64], [53, 57, 60], [48, 55, 60], [55, 59, 62]];
    for (let k = 0; k < bars; k++) {
      const at = t0 + k * bt * 4, ch = prog[k % 4];
      put(at, tone({ freq: hz(ch[0] - 12), dur: bt * 3.6, type: 'saw', detune: 0.006, lp: 900, att: 0.45, dec: 0, rel: 0.6 }), -0.15, 0.16);
      put(at, tone({ freq: hz(ch[1]), dur: bt * 3.4, type: 'tri', detune: 0.004, lp: 1600, att: 0.5, dec: 0, rel: 0.7 }), 0.15, 0.11);
      put(at, kick(0.85), 0, 0.5); put(at + bt * 2, kick(0.7), 0, 0.42);
      put(at, tone({ freq: hz(ch[0] - 24), dur: 0.7, type: 'sine', att: 0.004, dec: 0.22, rel: 0.05 }), 0, 0.32);
      put(at + bt * 2.5, tone({ freq: hz(ch[0] - 24), dur: 0.5, type: 'sine', att: 0.004, dec: 0.18, rel: 0.05 }), 0, 0.22);
      for (let e = 0; e < 8; e++) {
        put(at + e * bt * 0.5, hat(e % 2 ? 0.14 : 0.2, 0.04), 0.25, 0.5);
        const note = ch[(e + k) % 3] + (e > 3 ? 12 : 0);
        put(at + e * bt * 0.5, tone({ freq: hz(note), dur: 0.34, type: 'tri', att: 0.004, dec: 0.12, rel: 0.08 }), -0.2, 0.30);
      }
    }
  } else if (sec.biome === 'desert') {
    const bt = beat(108), bars = Math.ceil((len + 1.5) / (bt * 4));
    const prog = [[52, 55, 59], [53, 57, 60], [52, 55, 59], [48, 52, 55]];
    const melody = [[64, 67, 69, 71], [72, 71, 69, 67], [64, 67, 69, 71], [64, 62, 60, 59]];
    for (let k = 0; k < bars; k++) {
      const at = t0 + k * bt * 4, ch = prog[k % 4];
      put(at, tone({ freq: hz(ch[0] - 12), dur: bt * 4, type: 'sine', att: 0.15, dec: 0, rel: 0.5 }), 0, 0.20);
      put(at, tone({ freq: hz(ch[1] - 12), dur: bt * 3.9, type: 'tri', detune: 0.005, lp: 1200, att: 0.5, dec: 0, rel: 0.6 }), 0.1, 0.10);
      put(at + bt * 2, tone({ freq: hz(ch[0] - 12) * 1.06, dur: bt * 1.6, type: 'sine', att: 0.05, dec: 0.6, rel: 0.3 }), 0, 0.14);
      put(at, djembe(150, 1.0, false, 0.35), -0.1, 0.42);
      put(at + bt * 0.5, djembe(210, 0.85, true, 0.16), -0.1, 0.4);
      put(at + bt * 1.5, djembe(165, 0.7, false, 0.28), -0.1, 0.34);
      put(at + bt * 2.5, djembe(230, 0.8, true, 0.14), -0.1, 0.36);
      put(at + bt * 3.0, djembe(150, 0.9, false, 0.3), -0.1, 0.38);
      put(at + bt * 3.5, djembe(200, 0.55, true, 0.12), -0.1, 0.3);
      for (let e = 0; e < 16; e++) put(at + e * bt * 0.25, noiseBurst({ dur: 0.05, hp: 5000, dec: 0.02 }), 0.3, e % 4 === 0 ? 0.09 : 0.05);
      const mel = melody[k % 4];
      for (let m = 0; m < mel.length; m++) {
        const at2 = at + m * bt * 0.75 + bt * 0.25;
        put(at2, tone({ freq: hz(mel[m] - 12), freq2: hz(mel[m] - 10), dur: 0.55, type: 'tri', noise: 0.05, vib: 0.006, vibHz: 5.5, att: 0.06, dec: 0.3, rel: 0.2 }), 0.15, 0.16);
      }
    }
  } else if (sec.biome === 'storm') {
    const bt = beat(132), bars = Math.ceil((len + 1.5) / (bt * 4));
    put(t0, thunder(0.55), 0, 1.0);
    put(t0, crash(0.5), 0.2, 0.45);
    put(t0, rain(len + 0.8), 0, 0.30);
    put(t0 - 1.2, riser(1.2, 0.6), 0, 0.5);
    const riff = [40, 40, 46, 40, 40, 40, 45, 40];
    for (let k = 0; k < bars; k++) {
      const at = t0 + k * bt * 4;
      for (let e = 0; e < 8; e++) {
        put(at + e * bt * 0.5, tone({ freq: hz(riff[(e + k * 3) % 8] - 12), dur: bt * 0.45, type: 'saw', drive: 2.6, lp: 2200, att: 0.003, dec: 0.14, rel: 0.03 }), -0.05, 0.24);
        for (let h = 0; h < 2; h++) put(at + e * bt * 0.5 + h * bt * 0.25, hat(h ? 0.10 : 0.19, 0.035), 0.25, 0.7);
      }
      put(at, kick(1.0, 0.22), 0, 0.62); put(at + bt * 2, kick(0.95, 0.22), 0, 0.58);
      put(at + bt * 1, snare(0.5), 0, 0.42); put(at + bt * 3, snare(0.55), 0, 0.46);
      for (let s2 = 0; s2 < 8; s2++) put(at + bt * (3 + s2 * 0.125), snare(0.16 + s2 * 0.02, 0.12), 0, 0.3);
      for (let s2 = 0; s2 < 8; s2++) {
        const n = [64, 67, 70, 67][s2 % 4];
        put(at + s2 * bt * 0.5, tone({ freq: hz(n), dur: bt * 0.35, type: 'square', drive: 2.0, lp: 2600, att: 0.002, dec: 0.1, rel: 0.03 }), 0.18, 0.115);
      }
      put(at + bt * 2, tone({ freq: 41, dur: bt * 2, type: 'sine', att: 0.02, dec: 0.7, rel: 0.4 }), 0, 0.3);
    }
  } else {
    const bt = beat(76), bars = Math.ceil((len + 1.5) / (bt * 2));
    put(t0 - 1.4, wind(len + 2.4), 0, 0.5);
    const pad = [[52, 59, 64, 66], [48, 55, 62, 64]];
    for (let k = 0; k < bars; k++) {
      const at = t0 + k * bt * 2, ch = pad[k % 2];
      put(at, tone({ freq: hz(ch[0] - 12), dur: bt * 2.2, type: 'saw', detune: 0.008, lp: 520, att: 0.9, dec: 0, rel: 0.9 }), -0.1, 0.20);
      put(at, tone({ freq: hz(ch[3]), dur: bt * 2.1, type: 'tri', detune: 0.006, lp: 1500, att: 0.8, dec: 0, rel: 0.9 }), 0.15, 0.10);
      put(at + 0.02, kick(0.55, 0.26), 0, 0.42); put(at + 0.24, kick(0.4, 0.24), 0, 0.34);
    }
    const notes = [[76, 0], [71, 1.2], [78, 2.4], [81, 3.4], [76, 4.6], [74, 5.6], [71, 6.3], [66, 7.0]];
    for (const [n, dt] of notes) if (t0 + dt < sec.end + 1.6) put(t0 + dt, bell(hz(n), 0.13), 0.05 + 0.1 * Math.sin(dt), 1);
    for (let k = 0; k < 24; k++) put(t0 + rnd() * len, tone({ freq: 2000 + rnd() * 2600, dur: 0.06, type: 'sine', att: 0.002, dec: 0.02, rel: 0.02 }), (rnd() * 2 - 1) * 0.7, 0.05);
  }
  return { buf: b, start: sec.start, len };
}

function mixSections(list) {
  for (const s of list) {
    const t0 = s.start - XF, t1 = s.start + s.len + XF;
    for (let i = Math.max(0, Math.round(t0 * SR)); i < Math.min(N, Math.round(t1 * SR)); i++) {
      const t = (i - Math.round(s.start * SR)) / SR;
      let w = 1;
      if (t < -XF) w = 0;
      else if (t < 0) w = Math.sin((Math.PI / 2) * ((t + XF) / XF));
      else if (t > s.len) w = t > s.len + XF ? 0 : Math.cos((Math.PI / 2) * ((t - s.len) / XF));
      if (w <= 0) continue;
      MUS.L[i] += s.buf.L[i] * w; MUS.R[i] += s.buf.R[i] * w;
    }
  }
}
mixSections(S.map(renderSection));

// ---- hook transient on frame 0 (the on-screen action starts here) -------
const hook = cfg.hook;
const H = 0;
mix(MUS, H, kick(1.0, 0.3), 0, 0.62);
mix(MUS, H, tone({ freq: hz(33), freq2: hz(28), dur: 1.1, type: 'sine', att: 0.002, dec: 0.35, rel: 0.3 }), 0, 0.34);
if (hook === 'crumble') {
  mix(SFX, H, noiseBurst({ dur: 0.5, lp: 5200, hp: 200, dec: 0.14 }), 0.05, 0.30);
  mix(SFX, H, tone({ freq: 190, freq2: 62, dur: 0.34, type: 'sine', att: 0.001, dec: 0.12, rel: 0.05 }), -0.05, 0.22);
  mix(SFX, H + 0.06, crash(0.5, 1.1), 0.15, 0.20);
} else if (hook === 'leap') {
  mix(SFX, H, tone({ freq: 240, freq2: 880, dur: 0.16, type: 'square', att: 0.001, dec: 0.06, rel: 0.04 }), 0, 0.20);
  mix(SFX, H, riser(0.32, 1), 0.1, 0.24);
} else {
  mix(SFX, H, thunder(1.0), 0, 0.46);
  mix(SFX, H, noiseBurst({ dur: 0.4, hp: 2600, dec: 0.14 }), 0.2, 0.16);
}

// ---- gameplay sfx from the deterministic action timeline ----------------
const sfxOf = {
  jump: () => ({ s: tone({ freq: 300, freq2: 545, dur: 0.12, type: 'square', att: 0.002, dec: 0.05, rel: 0.04 }), g: 0.115, pan: 0 }),
  land: () => ({ s: tone({ freq: 185, freq2: 138, dur: 0.08, type: 'tri', att: 0.002, dec: 0.03, rel: 0.03 }), g: 0.13, pan: -0.05 }),
  thud: () => ({ s: tone({ freq: 96, freq2: 62, dur: 0.13, type: 'sine', att: 0.001, dec: 0.05, rel: 0.03 }), g: 0.12, pan: -0.05 }),
  crumble: () => ({ s: noiseBurst({ dur: 0.24, lp: 3800, hp: 250, dec: 0.07 }), g: 0.11, pan: 0.08 }),
  crack: () => ({ s: noiseBurst({ dur: 0.05, hp: 1200, dec: 0.02 }), g: 0.05, pan: 0.15 }),
  milestone: () => ({ s: tone({ freq: 520, freq2: 790, dur: 0.1, type: 'square', att: 0.002, dec: 0.04, rel: 0.03 }), g: 0.1, pan: 0.1 }),
  milestone2: () => ({ s: tone({ freq: 660, freq2: 1000, dur: 0.14, type: 'square', att: 0.002, dec: 0.06, rel: 0.04 }), g: 0.1, pan: 0.1 }),
  victory: () => ({ s: tone({ freq: 523, freq2: 1568, dur: 0.5, type: 'square', att: 0.002, dec: 0.2, rel: 0.15 }), g: 0.12, pan: 0 }),
};
for (const e of cfg.events) {
  const f = sfxOf[e.name];
  if (!f) continue;
  const { s, g, pan } = f();
  mix(SFX, e.t, s, pan, g);
  if (e.name === 'land') mix(SFX, e.t, sfxOf.thud().s, -0.05, 0.1);
  if (e.name === 'crumble') for (let k = 0; k < 3; k++) mix(SFX, e.t + 0.03 + k * 0.045, sfxOf.crack().s, 0.15 - k * 0.1, 0.045);
  if (e.name === 'milestone') mix(SFX, e.t + 0.09, sfxOf.milestone2().s, 0.1, 0.1);
}

// ---- weather fronts: riser into the change, impact on it ----------------
const zoneFx = { desert: { riser: 0.5, impact: 'g', imp: 0.5, shaker: true }, storm: { riser: 0.75, impact: 't', imp: 0.6 }, tundra: { riser: 0.6, impact: 'w', imp: 0.55 } };
for (const z of cfg.zones) {
  if (z.t <= 0.05) continue;
  const fx = zoneFx[z.biome] || { riser: 0.5, impact: 'g', imp: 0.4 };
  mix(SFX, z.t - 0.9 * (fx.riser + 0.3), riser(0.9 * (fx.riser + 0.3), 1), -0.15, 0.17);
  if (fx.impact === 't') mix(SFX, z.t, thunder(1), 0, 0.5);
  else if (fx.impact === 'w') { mix(SFX, z.t, wind(2.2), 0, 0.3); mix(SFX, z.t + 0.1, bell(hz(88), 0.5), 0.3, 0.28); }
  else mix(SFX, z.t, noiseBurst({ dur: 0.5, hp: 2800, dec: 0.18 }), 0.2, 0.18);
  if (fx.shaker) for (let k = 0; k < 6; k++) mix(SFX, z.t + 0.05 + k * 0.07, noiseBurst({ dur: 0.05, hp: 5200, dec: 0.02 }), 0.25, 0.07);
}

// ---- end card cadence: duck the loop music, land the button -------------
const CARD = DUR - 2.1; // 12.90s — the plate fades in here
for (let i = Math.round(CARD * SR); i < N; i++) {
  const t = (i - CARD * SR) / SR;
  const w = Math.max(0.22, 1 - t / 1.3);
  MUS.L[i] *= w; MUS.R[i] *= w;
}
mix(MUS, CARD, kick(1.0, 0.3), 0, 0.6);
mix(MUS, CARD, crash(0.8, 2.1), 0.1, 0.34);
mix(MUS, CARD, tone({ freq: hz(45), dur: 2.0, type: 'saw', detune: 0.006, lp: 1600, drive: 1.7, att: 0.004, dec: 0.5, rel: 0.9 }), -0.12, 0.16);
mix(MUS, CARD, tone({ freq: hz(57), dur: 2.0, type: 'saw', detune: 0.007, lp: 1800, drive: 1.7, att: 0.004, dec: 0.5, rel: 0.9 }), 0.12, 0.15);
mix(MUS, CARD, tone({ freq: hz(69), dur: 1.9, type: 'tri', lp: 2600, att: 0.004, dec: 0.45, rel: 0.9 }), 0, 0.13);
mix(MUS, CARD, tone({ freq: hz(33), freq2: hz(28), dur: 1.6, type: 'sine', att: 0.002, dec: 0.5, rel: 0.6 }), 0, 0.30);

// ---- master ------------------------------------------------------------
const tmpL = new Float32Array(N), tmpR = new Float32Array(N);
let peak = 0;
for (let i = 0; i < N; i++) {
  let l = MUS.L[i] * 0.88 + SFX.L[i] * 1.5;
  let r = MUS.R[i] * 0.88 + SFX.R[i] * 1.5;
  l = Math.tanh(l * 1.05) / Math.tanh(1.05); r = Math.tanh(r * 1.05) / Math.tanh(1.05);
  const t = i / SR;
  const fin = t < 0.008 ? t / 0.008 : 1;
  const fout = t > DUR - 0.18 ? Math.max(0, (DUR - t) / 0.18) : 1;
  l *= fin * fout; r *= fin * fout;
  tmpL[i] = l; tmpR[i] = r;
  peak = Math.max(peak, Math.abs(l), Math.abs(r));
}
const g = peak > 0 ? 0.84 / peak : 1;
let sum = 0;
for (let i = 0; i < N; i++) { tmpL[i] *= g; tmpR[i] *= g; sum += tmpL[i] * tmpL[i] + tmpR[i] * tmpR[i]; }
writeFileSync(OUT, Buffer.concat([wavHeader(N, SR), pcm16(tmpL, tmpR)]));
const rms = Math.sqrt(sum / (N * 2));
console.log(JSON.stringify({ file: OUT, seconds: +(N / SR).toFixed(3), peak: +(peak * g).toFixed(3), rmsDb: +(20 * Math.log10(rms)).toFixed(1) }));

function pcm16(l, r) {
  const b = Buffer.alloc(N * 4);
  for (let i = 0; i < N; i++) {
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(l[i] * 32767))), i * 4);
    b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(r[i] * 32767))), i * 4 + 2);
  }
  return b;
}
function wavHeader(n, sr) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + n * 4, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(n * 4, 40);
  return h;
}
