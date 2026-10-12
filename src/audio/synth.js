// synth.js – Kern der Klangmaschine (Römer-Popup-Buch): Hilfsfunktionen, Rauschpuffer, Hüllkurven, Stimmen-Pool (Voice) und Audiograph (Rig).
// Nichts hier hängt davon ab, ob ein echter AudioContext oder ein OfflineAudioContext (Tests) darunter liegt.
import { LEVELS } from './levels.js';

export const TAU = Math.PI * 2;
export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
export const lin = (db) => Math.pow(10, db / 20);
/** Kalibrierter Pegel-Faktor (siehe levels.js) für einen Schlüssel wie 'sfx:turn'. */
export const LEVELS_LIN = (key) => (key && LEVELS[key] ? lin(LEVELS[key]) : 1);
/** Kleiner, reproduzierbarer Zufallsgenerator (Tests rendern damit immer dieselben Klänge). */
export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ Rauschen (einmal erzeugt, gecacht)
const NDATA = new Map();
/** 3 s lange, nahtlos loopende Rauschpuffer (weiß / rosa / braun), Effektivwert 0.3, ohne Gleichanteil. */
function noiseData(kind, sr) {
  const key = kind + sr; let d = NDATA.get(key); if (d) return d;
  const N = Math.round(sr * 3), X = Math.round(sr * 0.25), r = mulberry32(kind === 'white' ? 11 : kind === 'pink' ? 22 : 33);
  const gen = new Float32Array(N + X);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < gen.length; i++) {
    const w = r() * 2 - 1;
    if (kind === 'white') gen[i] = w;
    else if (kind === 'pink') { // Paul Kellet
      b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
      b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
      gen[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
    } else { last = (last + 0.02 * w) / 1.02; gen[i] = last; }
  }
  d = new Float32Array(N); // Loop-Naht: Anfang mit dem Material hinter dem Ende gleichleistig überblenden
  for (let i = 0; i < N; i++) { if (i < X) { const k = i / X; d[i] = Math.sqrt(k) * gen[i] + Math.sqrt(1 - k) * gen[N + i]; } else d[i] = gen[i]; }
  let m = 0; for (let i = 0; i < N; i++) m += d[i]; m /= N;
  let e = 0; for (let i = 0; i < N; i++) { d[i] -= m; e += d[i] * d[i]; }
  const s = 0.3 / Math.sqrt(e / N); for (let i = 0; i < N; i++) d[i] *= s;
  NDATA.set(key, d); return d;
}
const SAT = new Map();
/** Sanfte Sättigungskurve tanh(k·x)/tanh(k) für WaveShaper (cached). */
export function satCurve(k) {
  let c = SAT.get(k);
  if (!c) { c = new Float32Array(1025); const n = Math.tanh(k); for (let i = 0; i < 1025; i++) c[i] = Math.tanh(k * (i / 512 - 1)) / n; SAT.set(k, c); }
  return c;
}
let IRDATA = new Map();
function irData(sr) { // synthetischer Raum: abklingendes Rauschen, Höhen dunkeln mit der Zeit ab (RT60 ≈ 1.5 s)
  let ir = IRDATA.get(sr); if (ir) return ir;
  const len = Math.round(sr * 1.6), r = mulberry32(777); ir = [new Float32Array(len), new Float32Array(len)];
  for (const d of ir) {
    let lp = 0;
    for (let i = 0; i < len; i++) { const t = i / sr, k = 0.75 * Math.exp(-t * 2.4) + 0.1; lp += ((r() * 2 - 1) - lp) * k; d[i] = lp * Math.exp(-t * 4.6) * Math.min(1, t / 0.012); }
  }
  IRDATA.set(sr, ir); return ir;
}

// ------------------------------------------------------------------ Hüllkurven
/** Weicher Einsatz (a s linear) und exponentielles Abklingen auf −60 dB in d s, danach 20 ms linear auf 0 (kein Knacken). */
export function perc(p, t, a, d, peak = 1) {
  peak = Math.max(peak, 1e-5);
  p.setValueAtTime(0, t); p.linearRampToValueAtTime(peak, t + a);
  p.exponentialRampToValueAtTime(peak * 1e-3, t + a + d); p.linearRampToValueAtTime(0, t + a + d + 0.02);
}
/** Linienzug [[dt, wert], …] ab t. */
export function env(p, t, pts) {
  p.setValueAtTime(pts[0][1], t + pts[0][0]);
  for (let i = 1; i < pts.length; i++) p.linearRampToValueAtTime(pts[i][1], t + pts[i][0]);
}

// ------------------------------------------------------------------ Stimme (ein Klang = ein Voice, belegt einen Pool-Platz)
export class Voice {
  constructor(R, dest, prio, key, id) {
    const c = R.ctx; this.R = R; this.c = c; this.prio = prio; this.id = id || ''; this.t0 = c.currentTime; this.n = 0; this.dead = false;
    this.nodes = []; this.srcs = []; this.dest = dest;
    this.out = this.g(LEVELS_LIN(key)); this.out.connect(dest); this.end = this.out; // end = Knoten, der gerade am Ziel hängt (Pan/Fernfilter werden davor eingefügt)
  }
  g(v = 1) { const n = this.c.createGain(); n.gain.value = v; this.nodes.push(n); return n; }
  f(type, freq, q = 0.7) { const n = this.c.createBiquadFilter(); n.type = type; n.frequency.value = freq; n.Q.value = q; this.nodes.push(n); return n; }
  shaper(k) { const n = this.c.createWaveShaper(); n.curve = satCurve(k); this.nodes.push(n); return n; }
  /** Knoten vor das Ziel schalten (Hall-Sends am Ausgang bleiben unberührt). */
  insert(node) { this.end.disconnect(this.dest); this.end.connect(node); node.connect(this.dest); this.end = node; return node; }
  /** Stereo-Lage (−1…1); ohne StereoPanner (altes Safari) bleibt es mono. */
  panTo(x) { if (!this.c.createStereoPanner) return; const p = this.c.createStereoPanner(); p.pan.value = x; this.nodes.push(p); this.insert(p); }
  /** Stereo-Fahrt von a nach b (−1…1) zwischen t0 und t1 (vorbeifahrender Karren, Schiff). */
  panSweep(a, b, t0, t1) { if (!this.c.createStereoPanner) return; const p = this.c.createStereoPanner(); p.pan.setValueAtTime(a, t0); p.pan.linearRampToValueAtTime(b, t1); this.nodes.push(p); this.insert(p); }
  /**
   * Gemeinsame Ereignis-Optionen (Szenen-Klänge, Fernrufe): gain (Faktor), dist 0…1 (fern: Tiefpass, leiser, mehr Hall), lpHi (Obergrenze des Fern-Tiefpasses), pan −1…1.
   * Muss einmal direkt nach dem Anlegen der Voice gerufen werden.
   */
  setup(o) {
    if (!o) return this;
    if (o.gain != null) this.out.gain.value *= o.gain;
    if (o.dist > 0) { const lp = this.f('lowpass', (o.lpHi ?? 3600) * (1 - o.dist) + 450, 0.6); this.insert(lp); this.out.gain.value *= 1 - 0.5 * o.dist; this.send(0.12 + 0.4 * o.dist); }
    if (o.pan != null) this.panTo(o.pan);
    return this;
  }
  /** Quelle starten, planmäßig stoppen und im Pool mitzählen; räumt sich nach dem letzten Ende selbst auf. */
  run(src, t0, t1, off) {
    if (off === undefined) src.start(t0); else src.start(t0, off);
    src.stop(t1); this.n++; this.srcs.push(src);
    src.onended = () => { if (--this.n <= 0) this.free(); };
    return src;
  }
  osc(type, freq, t0, t1) { const o = this.c.createOscillator(); o.type = type; o.frequency.value = freq; return this.run(o, t0, t1); }
  /** Oszillator mit gepulster Wellenform (Tastverhältnis duty, siehe Rig.pulse). */
  pulseOsc(duty, freq, t0, t1) { const o = this.c.createOscillator(); o.setPeriodicWave(this.R.pulse(duty)); o.frequency.value = freq; return this.run(o, t0, t1); }
  noise(kind, t0, t1, rate = 1) {
    const s = this.c.createBufferSource(); s.buffer = this.R.noiseBuf(kind); s.loop = true; if (rate !== 1) s.playbackRate.value = rate;
    return this.run(s, t0, t1, this.R.rng() * 2.6);
  }
  /** Rauschstoß: Rauschen → Filter (Sweep f→f2) → Hüllkurve (a Anstieg, d Abklingen). o: kind type f f2 q a d peak dest */
  nz(t, o) {
    const a = o.a ?? 0.005, d = o.d ?? 0.1, e = t + a + d + 0.03;
    let n = this.noise(o.kind || 'pink', t, e);
    if (o.kind === 'brown') { const hp = this.f('highpass', 24, 0.7); n.connect(hp); n = hp; } // kein Gleichanteil aus dem tiefen Rauschen
    if (o.f) {
      const fl = this.f(o.type || 'bandpass', o.f, o.q ?? 1);
      if (o.f2) { fl.frequency.setValueAtTime(o.f, t); fl.frequency.exponentialRampToValueAtTime(o.f2, t + a + d); }
      n.connect(fl); n = fl;
    }
    const g = this.g(0); perc(g.gain, t, a, d, o.peak ?? 0.3); n.connect(g); g.connect(o.dest || this.out); return g;
  }
  /** Ton mit Tonhöhen-Gleiten (f→f2 in gl s) und Hüllkurve. o: w f f2 gl a d peak dest */
  tone(t, o) {
    const a = o.a ?? 0.004, d = o.d ?? 0.2, s = this.osc(o.w || 'sine', o.f, t, t + a + d + 0.03);
    if (o.f2) { s.frequency.setValueAtTime(o.f, t); s.frequency.exponentialRampToValueAtTime(o.f2, t + (o.gl ?? a + d)); }
    const g = this.g(0); perc(g.gain, t, a, d, o.peak ?? 0.3); s.connect(g); g.connect(o.dest || this.out); return s;
  }
  /** Glocken-/Spieluhrklang aus Teiltönen [[Verhältnis, Amplitude, Abklingzeit], …]. */
  bell(t, f, parts, peak, dest) { for (const [r, a, d] of parts) if (f * r < 15000) this.tone(t, { f: f * r, a: 0.002, d, peak: peak * a, dest }); }
  /** Vibrato: LFO (rate Hz, ± depth Hz) auf osc.frequency. */
  vib(osc, rate, depth, t0, t1) { const l = this.osc('sine', rate, t0, t1), g = this.g(depth); l.connect(g); g.connect(osc.frequency); return l; }
  /** Anteil des Klangs in den gemeinsamen Hall schicken. */
  send(amt) { const s = this.g(amt); this.out.connect(s); s.connect(this.R.reverbIn()); return s; }
  /** Sanft ausblenden und stoppen (für Stehlen im Pool und Szenenwechsel). */
  kill(sec = 0.012) {
    if (this.dead) return;
    const R = this.R, now = this.c.currentTime, i = R.list.indexOf(this); if (i >= 0) R.list.splice(i, 1);
    const p = this.out.gain, cur = p.value; p.cancelScheduledValues(now); p.setValueAtTime(cur, now); p.linearRampToValueAtTime(0, now + sec);
    for (const s of this.srcs) { try { s.stop(now + sec + 0.02); } catch (e) { /* schon gestoppt */ } }
    if (this.n === 0) this.free();
  }
  free() {
    if (this.dead) return; this.dead = true;
    const i = this.R.list.indexOf(this); if (i >= 0) this.R.list.splice(i, 1);
    for (const n of this.nodes) { try { n.disconnect(); } catch (e) { /* egal */ } }
    this.nodes.length = 0; this.srcs.length = 0;
  }
}

// ------------------------------------------------------------------ Audiograph
/**
 * Busse:  music, atmo (je mit Tiefpass für „unter Wasser“), fx  →  pre → lull (Stille/Hush)  →  mix
 *         over (Einschlag, Ohrensausen: von Stille/Hush ausgenommen) und voice (Erzählung)  →  mix
 * mix → [Hochpass 14 Hz → Master-Gain → Limiter (DynamicsCompressor, hartes Knie)] → Ausgang   (raw: mix → Ausgang, für Messungen)
 */
export class Rig {
  constructor(ctx, o = {}) {
    this.ctx = ctx; this.sr = ctx.sampleRate; this.rng = mulberry32(o.seed ?? ((Math.random() * 4e9) >>> 0));
    this.max = o.max || 24; this.low = this.max <= 16; this.list = []; this.nb = {}; this.pw = {}; this.calm = false; this.cine = false; // calm: Ruhiger Modus; cine: „Kräftigere Klänge“ (Signalhörner, Trommeln)
    this._rv = null;
    const g = (v = 1) => { const n = ctx.createGain(); n.gain.value = v; return n; };
    const lp = () => { const n = ctx.createBiquadFilter(); n.type = 'lowpass'; n.frequency.value = 22000; n.Q.value = 0.5; return n; };
    this.bus = { music: lp(), atmo: lp(), fx: g(), voice: g(), over: g() };
    this.duck = { music: g(), atmo: g(), fx: this.bus.fx };
    this.pre = g(); this.lull = g(); this.mix = g();
    this.bus.music.connect(this.duck.music); this.duck.music.connect(this.pre);
    this.bus.atmo.connect(this.duck.atmo); this.duck.atmo.connect(this.pre);
    this.bus.fx.connect(this.pre); this.pre.connect(this.lull); this.lull.connect(this.mix);
    this.bus.over.connect(this.mix); this.bus.voice.connect(this.mix);
    this.master = null;
    if (o.raw) this.mix.connect(ctx.destination);
    else {
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 14; hp.Q.value = 0.5; // Gleichanteil/Infraschall raus
      this.master = g(0);
      const lim = ctx.createDynamicsCompressor(); // Limiter: harte Kante, 20:1, schneller Einsatz (Chrome/Safari hängen dabei automatisch Makeup-Gain an → unten ausgeglichen)
      lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
      const comp = g(o.limComp ?? 0.82); // gemessen, siehe docs/AUDIO.md
      this.mix.connect(hp); hp.connect(this.master); this.master.connect(lim); lim.connect(comp); comp.connect(ctx.destination);
    }
  }
  noiseBuf(kind) {
    let b = this.nb[kind];
    if (!b) { const d = noiseData(kind, this.sr); b = this.ctx.createBuffer(1, d.length, this.sr); b.getChannelData(0).set(d); this.nb[kind] = b; }
    return b;
  }
  /** Eingang des gemeinsamen Halls (wird erst bei Bedarf gebaut); Rückweg über den Effektbus. */
  reverbIn() {
    if (this._rv) return this._rv;
    const c = this.ctx, ir = irData(this.sr), buf = c.createBuffer(2, ir[0].length, this.sr);
    buf.getChannelData(0).set(ir[0]); buf.getChannelData(1).set(ir[1]);
    const cv = c.createConvolver(); cv.normalize = true; cv.buffer = buf;
    const inp = c.createGain(), out = c.createGain(); out.gain.value = 0.5;
    inp.connect(cv); cv.connect(out); out.connect(this.bus.fx); return (this._rv = inp);
  }
  /** Gepulste Wellenform (für Grillen): Rechteck mit Tastverhältnis duty, bandbegrenzt; 0…1 nach Offset duty. */
  pulse(duty, K = 12) {
    const key = 'p' + duty + ':' + K;
    if (!this.pw[key]) { const re = new Float32Array(K + 1), im = new Float32Array(K + 1); for (let k = 1; k <= K; k++) re[k] = (2 * Math.sin(k * Math.PI * duty)) / (k * Math.PI); this.pw[key] = this.ctx.createPeriodicWave(re, im, { disableNormalization: true }); }
    return this.pw[key];
  }
  /** Asymmetrische Brandungswelle (schneller Anstieg, langsames Abklingen), Amplitude ca. ±0.9. */
  surf() {
    if (!this.pw.surf) {
      const K = 6, re = new Float32Array(K + 1), im = new Float32Array(K + 1);
      for (let k = 1; k <= K; k++) im[k] = 1 / Math.pow(k, 1.2); // fallende Sägezahn-Reihe: Sprung nach oben, danach langsames Abklingen
      let m = 0; for (let i = 0; i < 128; i++) { let s = 0; for (let k = 1; k <= K; k++) s += im[k] * Math.sin((k * i * TAU) / 128); m = Math.max(m, Math.abs(s)); }
      for (let k = 1; k <= K; k++) im[k] *= 0.9 / m;
      this.pw.surf = this.ctx.createPeriodicWave(re, im, { disableNormalization: true });
    }
    return this.pw.surf;
  }
  /** Neue Stimme anfordern. bus = Busname oder Zielknoten. Ist der Pool voll, wird die älteste/leiseste Stimme ersetzt; ist alles wichtiger, → null. */
  voice(prio, bus, key, id) {
    const L = this.list;
    if (L.length >= this.max) {
      let vic = null;
      for (let i = 0; i < L.length; i++) { const x = L[i]; if (!vic || x.prio < vic.prio || (x.prio === vic.prio && x.t0 < vic.t0)) vic = x; }
      if (vic.prio > prio) return null;
      vic.kill();
    }
    const v = new Voice(this, typeof bus === 'string' ? this.bus[bus] : bus, prio, key, id); L.push(v); return v;
  }
  killId(id) { for (let i = this.list.length - 1; i >= 0; i--) if (this.list[i].id === id) this.list[i].kill(0.04); }
  /** Aufräumen verwaister Stimmen (Quellen, die nie starteten, oder gestrandete); billig, ca. 2×/s aufrufen. */
  sweep(now) { const L = this.list; for (let i = L.length - 1; i >= 0; i--) { const v = L[i]; if ((v.n === 0 && now > v.t0 + 0.5) || now > v.t0 + 90) v.free(); } }
}
