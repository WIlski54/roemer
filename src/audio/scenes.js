// scenes.js – Atmosphären je Seite des Römer-Buchs (Schleifen, die überblenden) mit Ereignisströmen (Rufe, Hammerschläge, Glöckchen …)
// und die globalen ctl-Schichten (Wind, Regen, Unterwasser).
// Dauerquellen laufen über `body` (Pegel der Szene, kalibriert); Ereignisse laufen über `ev` (absolute Spitzenpegel in dBFS, unabhängig von der Kalibrierung).
import { clamp, LEVELS_LIN } from './synth.js';
import { playVoice, playBird, VOICE_PEAK, VOICE_PEAK_DEFAULT } from './voices.js';
import { SFX, EV, PEAK, PEAK_DEFAULT } from './sfx.js';

const PI2 = Math.PI / 2;
/** Gleichleistungs-Überblendung in 6 Linienstücken (hoch: 0→1, runter: aktuell→0); überschreibt noch ausstehende Rampen. */
function xfade(p, t, sec, up, cur) {
  p.cancelScheduledValues(t); p.setValueAtTime(cur, t);
  for (let i = 1; i <= 6; i++) { const x = (i / 6) * PI2; p.linearRampToValueAtTime(up ? cur + (1 - cur) * Math.sin(x) : cur * Math.cos(x), t + (sec * i) / 6); }
}

/** Eine laufende Atmosphäre: Dauerquellen + Ereignisströme; alle Ausgaben laufen über `out` (Überblendung), `body` (Kalibrierung) und `ev` (Ereignisse). */
export class Scene {
  constructor(R, id, dest, t0, fade, solo) {
    this.R = R; this.c = R.ctx; this.id = id; this.t0 = t0; this.srcs = []; this.nodes = []; this.str = []; this.cv = {}; this.onCtl = {}; this.onEvent = null; this.dead = false; this.fading = false; this.solo = solo || '';
    this.out = this.g(0); this.out.connect(dest); xfade(this.out.gain, t0, fade, true, 0);
    this.trim = LEVELS_LIN('scene:' + id); this.body = this.g(this.trim); this.body.connect(this.out);
    this.ev = this.g(1); this.ev.connect(this.out);
  }
  g(v = 1) { const n = this.c.createGain(); n.gain.value = v; this.nodes.push(n); return n; }
  f(type, freq, q = 0.7) { const n = this.c.createBiquadFilter(); n.type = type; n.frequency.value = freq; n.Q.value = q; this.nodes.push(n); return n; }
  loop(kind, rate = 1) { const s = this.c.createBufferSource(); s.buffer = this.R.noiseBuf(kind); s.loop = true; if (rate !== 1) s.playbackRate.value = rate; s.start(this.t0, this.R.rng() * 2.5); this.srcs.push(s); return s; }
  osc(type, f, delay = 0) { const o = this.c.createOscillator(); o.type = type; o.frequency.value = f; o.start(this.t0 + delay); this.srcs.push(o); return o; }
  /** Langsamer Modulator: Sinus (rate Hz) mit ± depth auf einen AudioParam. */
  lfo(rate, depth, param, delay = 0) { const o = this.osc('sine', rate, delay), g = this.g(depth); o.connect(g); g.connect(param); return o; }
  /** Teil der Atmosphäre bauen; mit `solo` (nur Tests) läuft nur der gewählte Teil. */
  part(name, fn) { if (!this.solo || this.solo === name) fn(); }
  /** Ereignisstrom: fn(t) im Abstand a…b s (Zufall); k() skaliert den Abstand (große Werte = pausiert, <0 = aus). first = Zeit des ersten Ereignisses ab Szenenstart. */
  stream(name, fn, a, b, first, k) { if (this.solo && this.solo !== name) return; this.str.push({ fn, a, b, k, next: this.t0 + (first ?? this.R.rng() * b) }); }
  tick(from, to) {
    if (this.fading || this.dead) return;
    const R = this.R;
    for (const s of this.str) {
      while (s.next < to) {
        const kk = s.k ? s.k() : 1;
        if (kk < 0) { s.next = to + 0.4; break; } // pausiert: später erneut prüfen
        if (R.list.length < R.max * 0.75) s.fn(Math.max(s.next, from));
        s.next += (s.a + R.rng() * (s.b - s.a)) * Math.max(kk, 0.05);
      }
    }
  }
  setCtl(name, v) { this.cv[name] = v; if (this.onCtl[name]) this.onCtl[name](v, this.c.currentTime); }
  fadeOut(t, sec) {
    this.fading = true; xfade(this.out.gain, t, sec, false, this.out.gain.value);
    const e = t + sec + 0.1; for (const s of this.srcs) { try { s.stop(e); } catch (x) { /* egal */ } }
    if (this.srcs.length) this.srcs[0].onended = () => this.free(); else this.free();
    setTimeout(() => this.free(), Math.max(0, e - this.c.currentTime) * 1000 + 800);
  }
  free() { this.dead = true; for (const n of this.nodes) { try { n.disconnect(); } catch (e) { /* egal */ } } this.nodes.length = 0; this.srcs.length = 0; }
}

// ------------------------------------------------------------------ Dauerklänge (Bausteine)
/** Wind: zwei gegeneinander versetzte Rauschquellen (links/rechts) → Filter → Pegel mit unregelmäßigen Böen (zwei LFOs). */
function wind(S, { lvl, f, q = 0.7, type = 'bandpass', gust = 0.5, rate = 0.12, fm = 0.3, kind = 'pink', dest }) {
  const flt = S.f(type, f, q), ga = S.g(1), g = S.g(lvl);
  for (const pan of [-0.7, 0.7]) {
    let n = S.loop(kind);
    if (S.c.createStereoPanner) { const p = S.c.createStereoPanner(); p.pan.value = pan; S.nodes.push(p); n.connect(p); n = p; }
    n.connect(flt);
  }
  gust = Math.min(gust, 0.65); flt.connect(ga); ga.connect(g); g.connect(dest || S.body);
  S.lfo(rate, gust, ga.gain); S.lfo(rate * 1.618, gust * 0.5, ga.gain, 0.7); S.lfo(rate * 0.71, f * fm, flt.frequency);
  return g;
}
/** Brandung/Wellen: Rauschen, dessen Pegel und Tiefpass einer asymmetrischen Welle folgen (schneller Anstieg, langes Ausrollen) + Gischt. */
function surf(S, { lvl, rate, dest }) {
  const out = dest || S.body, s = S.loop('pink'), lp = S.f('lowpass', 900, 0.6), g = S.g(lvl * 0.56), w = S.c.createOscillator(), wg = S.g(lvl * 0.49), wf = S.g(630);
  w.setPeriodicWave(S.R.surf()); w.frequency.value = rate; w.start(S.t0); S.srcs.push(w);
  s.connect(lp); lp.connect(g); g.connect(out); w.connect(wg); wg.connect(g.gain); w.connect(wf); wf.connect(lp.frequency);
  const fs = S.loop('white'), hp = S.f('highpass', 2500, 0.5), fl = S.f('lowpass', 8000, 0.5), fg = S.g(lvl * 0.1), w2 = S.c.createOscillator(), w2g = S.g(lvl * 0.1);
  w2.setPeriodicWave(S.R.surf()); w2.frequency.value = rate; w2.start(S.t0 + 0.8); S.srcs.push(w2);
  fs.connect(hp); hp.connect(fl); fl.connect(fg); fg.connect(out); w2.connect(w2g); w2g.connect(fg.gain);
}
/** Fließendes Wasser (Bach, Brunnen, Kanal): Bandpassrauschen mit zufälligem Blubbern und feinem Zischen. */
function water(S, { lvl, f = 1100, q = 0.7, flutter = 0.5, fizz = 0.05, dest }) {
  const out = dest || S.body, n = S.loop('pink'), bp = S.f('bandpass', f, q), g = S.g(lvl), m = S.loop('pink'), ml = S.f('lowpass', 13, 0.7), mg = S.g(lvl * flutter * 4);
  n.connect(bp); bp.connect(g); g.connect(out); m.connect(ml); ml.connect(mg); mg.connect(g.gain); S.lfo(0.17, f * 0.2, bp.frequency);
  const h = S.loop('white'), hp = S.f('highpass', 4500, 0.5), hg = S.g(lvl * fizz); h.connect(hp); hp.connect(hg); hg.connect(out);
  return g;
}
/**
 * Stimmengewirr (Markt, Forum, Menschenmenge): n Sprecher aus Sägezahn (Stimmton) durch zwei wandernde Formantfilter (Vokalfarbe),
 * Silbentakt (≈ 3–6 Hz) und Sprechpausen; dazu Zischlaute. Es sind keine Wörter, nur das Gefühl von vielen Menschen.
 */
function babble(S, { n = 6, lvl = 1, fLo = 100, fHi = 220, rate = [3.2, 5.6], hiss = 0.04, dest }) {
  if (S.R.low) n = Math.max(3, n - 2);
  const r = S.R.rng, out = S.g(lvl); out.connect(dest || S.body);
  for (let i = 0; i < n; i++) {
    const f0 = fLo + r() * (fHi - fLo), o = S.osc('sawtooth', f0, r()), f1 = S.f('bandpass', 380 + r() * 420, 4.5), f2 = S.f('bandpass', 1100 + r() * 1100, 5);
    const g1 = S.g(1), g2 = S.g(0.55), mix = S.g(0.3), syl = S.g(0.5), gate = S.g(0.5);
    o.connect(f1); o.connect(f2); f1.connect(g1); f2.connect(g2); g1.connect(mix); g2.connect(mix); mix.connect(syl); syl.connect(gate); gate.connect(out);
    S.lfo(0.35 + r() * 0.5, f0 * 0.05, o.frequency, r()); // Satzmelodie
    S.lfo(0.5 + r() * 0.9, 130, f1.frequency, r()); S.lfo(0.4 + r() * 0.8, 300, f2.frequency, r()); // Vokalfarbe
    S.lfo(rate[0] + r() * (rate[1] - rate[0]), 0.5, syl.gain, r()); S.lfo(0.13 + r() * 0.25, 0.5, gate.gain, r()); // Silben, Sprechpausen
  }
  const ns = S.loop('pink'), nb = S.f('bandpass', 3600, 0.8), ng = S.g(hiss), am = S.g(0.5); ns.connect(nb); nb.connect(am); am.connect(ng); ng.connect(out); S.lfo(4.3, 0.5, am.gain);
  return out;
}

// ------------------------------------------------------------------ Ereignisse
const dbG = (pk, base) => Math.pow(10, (pk - base) / 20); // Faktor, mit dem ein auf `base` dBFS kalibrierter Klang auf `pk` dBFS kommt
const pan = (S, pw) => (S.c.createStereoPanner ? (S.R.rng() * 2 - 1) * pw : undefined);
/**
 * Ereignis aus einem SFX (name) oder EV: o = Optionen des Klangs, pk = Spitzenpegel in dBFS (vor Ferndämpfung), dist 0…1, pw Panorama-Weite, gate(t) = darf jetzt, calm = im Ruhigen Modus weglassen/leiser.
 */
function sfxEv(S, name, { o = {}, pk = -24, dist = 0, pw = 0.8, gate, skipCalm } = {}) {
  const fn = SFX[name] || EV[name], base = PEAK[name] ?? PEAK_DEFAULT;
  return (t) => { if ((gate && !gate(t - S.t0)) || (skipCalm && S.R.calm)) return; fn(S.R, t, { ...o, dest: S.ev, prio: 0, gain: dbG(pk, base), dist, pan: pan(S, pw) }); };
}
const voiceEv = (S, ids, { pk = -24, dist = 0.5, pw = 0.8, gate } = {}) => (t) => {
  if (gate && !gate(t - S.t0)) return; const id = ids[(S.R.rng() * ids.length) | 0];
  playVoice(S.R, id, t, { dest: S.ev, prio: 0, gain: dbG(pk, VOICE_PEAK[id] ?? VOICE_PEAK_DEFAULT), dist, pan: pan(S, pw) });
};
const birdEv = (S, kinds, { pk = -26, dist = 0.2, rev = 0.25 } = {}) => (t) => { playBird(S.R, t, { dest: S.ev, prio: 0, kind: kinds[(S.R.rng() * kinds.length) | 0], gain: dbG(pk, PEAK.tweet ?? PEAK_DEFAULT), dist, rev, pan: pan(S, 0.8) }); };
/** Eine marschierende Gruppe: pro Taktschlag `men` Schritte mit kleinem Versatz, linker Fuß betont. */
function marchEv(S, { men = 3, spread = 0.035, pk = -27, dist = 0.5, gate }) {
  let par = 0;
  return (t) => {
    par ^= 1; if (gate && !gate(t - S.t0)) return;
    const gp = pan(S, 0.5);
    for (let i = 0; i < men; i++) SFX.marsch(S.R, t + S.R.rng() * spread, { n: 1, foot: par ? 0 : 1, dest: S.ev, prio: 0, gain: dbG(pk, PEAK.marsch ?? PEAK_DEFAULT) * (par ? 1 : 0.8) * (0.75 + 0.25 * S.R.rng()), dist, pan: gp });
  };
}

// ------------------------------------------------------------------ Szenen (Builder: S → Dauerquellen und Ströme einrichten)
export const BUILD = {
  cover(S) { // geschlossenes Buch: kaum mehr als Raumton und ein Hauch Luft
    S.part('raum', () => { const s = S.loop('brown'), lp = S.f('lowpass', 200, 0.5), g = S.g(0.6); s.connect(lp); lp.connect(g); g.connect(S.body); });
    S.part('wind', () => wind(S, { lvl: 0.1, f: 420, q: 0.5, gust: 0.4, rate: 0.08 }));
  },
  titel(S) { // Wind, ferne Marschtritte, Stadtrauschen
    S.part('wind', () => { wind(S, { lvl: 0.5, f: 650, q: 0.5, gust: 0.5, rate: 0.1 }); wind(S, { lvl: 0.1, f: 2400, q: 1, gust: 0.6, rate: 0.17 }); });
    S.part('stadt', () => {
      const far = S.f('lowpass', 950, 0.5); far.connect(S.body); babble(S, { n: 5, lvl: 1.5, fLo: 100, fHi: 210, dest: far });
      const b = S.loop('brown'), lp = S.f('lowpass', 260, 0.5), bg = S.g(0.5); b.connect(lp); lp.connect(bg); bg.connect(S.body); S.lfo(0.11, 0.2, bg.gain);
    });
    S.stream('marsch', marchEv(S, { men: 3, pk: -13, dist: 0.65, gate: (t) => ((t + 6) % 34) < 18 }), 0.56, 0.56, 4); // ca. 18 s Marsch, dann Pause
  },
  'rom-entsteht'(S) { // Tiber-Ufer am Morgen: Wasserplätschern, Schafglocken, Hirtenflöte (Musik), ganz leise ein freundliches Wolfsheulen
    S.part('wasser', () => {
      const s = S.loop('pink'), lp = S.f('lowpass', 800, 0.6), g = S.g(0.3); s.connect(lp); lp.connect(g); g.connect(S.body); S.lfo(0.33, 0.12, g.gain); S.lfo(0.21, 0.08, g.gain, 1.3); S.lfo(0.17, 250, lp.frequency);
      const sp = S.loop('white'), hp = S.f('highpass', 3500, 0.5), sg = S.g(0.03); sp.connect(hp); hp.connect(sg); sg.connect(S.body); S.lfo(0.29, 0.02, sg.gain);
    });
    S.part('wind', () => wind(S, { lvl: 0.1, f: 600, q: 0.5, type: 'lowpass', gust: 0.5, rate: 0.1 }));
    S.stream('plop', sfxEv(S, 'bubble', { pk: -22, dist: 0.2 }), 0.25, 0.9, 0.5);
    S.stream('schaf', sfxEv(S, 'schaf', { pk: -22, dist: 0.45, pw: 0.9 }), 1.6, 4.5, 1.2);
    S.stream('vogel', birdEv(S, [0, 1, 2, 3], { pk: -32, dist: 0.3 }), 3.5, 8, 2.5);
    S.stream('wolfin', voiceEv(S, ['wolfin'], { pk: -20, dist: 0.8 }), 45, 70, 24 + S.R.rng() * 10); // selten, leise, freundlich
  },
  grossmacht(S) { // Forum und Hafen: Stimmengewirr, Wellen, ferne Tuba-Fanfare, freundliche Elefantentrompete
    S.part('stimmen', () => babble(S, { n: 6, lvl: 1.2, fLo: 100, fHi: 225 }));
    S.part('wellen', () => { surf(S, { lvl: 0.4, rate: 0.115 }); surf(S, { lvl: 0.18, rate: 0.083 }); });
    S.part('wind', () => wind(S, { lvl: 0.1, f: 650, q: 0.5, gust: 0.5, rate: 0.11 }));
    S.stream('tuba', sfxEv(S, 'tuba', { pk: -13, dist: 0.5, pw: 0.5 }), 26, 40, 8);
    S.stream('elefant', voiceEv(S, ['elefant'], { pk: -12, dist: 0.6 }), 40, 70, 20);
    S.stream('moewe', birdEv(S, [1], { pk: -30, dist: 0.4 }), 9, 20, 5);
  },
  legion(S) { // Marschlager: gleichmäßiger Marschtritt, Metallklirren, Cornu-Signal
    S.part('wind', () => wind(S, { lvl: 0.12, f: 600, q: 0.5, type: 'lowpass', gust: 0.5, rate: 0.09 }));
    S.stream('tritt', marchEv(S, { men: 4, spread: 0.04, pk: -26, dist: 0.25 }), 0.52, 0.52, 0.3); // der Taktschlag der Legion: immer gleich
    S.stream('klirr', sfxEv(S, 'klirr', { pk: -39, dist: 0.3 }), 0.35, 1.2, 0.5);
    S.stream('cornu', sfxEv(S, 'cornu', { pk: -11, dist: 0.45, pw: 0.5 }), 28, 42, 9);
  },
  kaiser(S) { // Platz mit Menschenmenge, Fanfare, danach beruhigt sich alles für das Leier-Motiv (Musik)
    const crowd = S.g(0.8); crowd.connect(S.body);
    S.part('menge', () => { babble(S, { n: 8, lvl: 1.4, fLo: 100, fHi: 230, dest: crowd }); crowd.gain.setValueAtTime(0.8, S.t0 + 3); crowd.gain.linearRampToValueAtTime(0.5, S.t0 + 9); });
    S.part('wind', () => wind(S, { lvl: 0.08, f: 700, q: 0.5, type: 'lowpass', gust: 0.5, rate: 0.1 }));
    S.stream('fanfare', sfxEv(S, 'fanfare', { pk: -11, dist: 0.3, pw: 0.3 }), 1e6, 1e6, 1.2); // einmal zu Beginn
    S.stream('jubel', sfxEv(S, 'menge', { pk: -13, dist: 0.5, pw: 0.3 }), 1e6, 1e6, 4.2, null);
  },
  hoehepunkt(S) { // Markt in der Hauptstadt: Marktgewirr, Tauben, ferne Fanfare vom Kolosseum, Schritte auf Stein
    S.part('markt', () => babble(S, { n: 7, lvl: 1.2, fLo: 100, fHi: 240, rate: [3.6, 6.2] }));
    S.part('wind', () => wind(S, { lvl: 0.07, f: 650, q: 0.5, type: 'lowpass', gust: 0.5, rate: 0.1 }));
    S.stream('taube', sfxEv(S, 'taube', { pk: -23, dist: 0.3 }), 3, 8, 1.5);
    S.stream('flug', sfxEv(S, 'flap', { pk: -21, dist: 0.3 }), 12, 25, 9);
    S.stream('fanfare', sfxEv(S, 'fanfare', { pk: -15, dist: 0.6, pw: 0.5 }), 45, 70, 10);
    S.stream('stein', sfxEv(S, 'footstep', { pk: -22, dist: 0.2, pw: 0.9 }), 0.4, 1.3, 0.6);
  },
  stadtleben(S) { // Straße einer Stadt: Marktstimmen, Brunnen, Hämmer, Griffelkratzen, Kinderlachen
    S.part('stimmen', () => babble(S, { n: 5, lvl: 1.0, fLo: 105, fHi: 235 }));
    S.part('brunnen', () => water(S, { lvl: 0.28, f: 1300, q: 0.7, flutter: 0.6, fizz: 0.07 }));
    S.part('wind', () => wind(S, { lvl: 0.05, f: 700, q: 0.5, type: 'lowpass', gust: 0.5, rate: 0.1 }));
    S.stream('tropf', sfxEv(S, 'bubble', { pk: -20, dist: 0.2 }), 0.15, 0.6, 0.4);
    S.stream('hammer', sfxEv(S, 'hammer', { o: { n: 3 }, pk: -10, dist: 0.45 }), 4, 9, 2);
    S.stream('griffel', sfxEv(S, 'griffel', { pk: -11, dist: 0.2 }), 7, 14, 4);
    S.stream('kinder', sfxEv(S, 'kinder', { pk: -12, dist: 0.4 }), 10, 22, 6);
    S.stream('hund', voiceEv(S, ['hund'], { pk: -16, dist: 0.7 }), 45, 80, 30);
  },
  ingenieure(S) { // Baustelle am Aquädukt: Wasserrauschen, Seilknarren, Hammerschläge, Tretrad-Takt
    S.part('kanal', () => water(S, { lvl: 0.5, f: 900, q: 0.6, flutter: 0.4, fizz: 0.06 }));
    S.part('wind', () => wind(S, { lvl: 0.08, f: 600, q: 0.5, type: 'lowpass', gust: 0.5, rate: 0.09 }));
    S.stream('tretrad', sfxEv(S, 'tok', { pk: -16, dist: 0.3, pw: 0.2 }), 0.85, 0.85, 0.5); // gleichmäßiger Takt
    S.stream('seil', sfxEv(S, 'seil', { pk: -16, dist: 0.3 }), 3, 7, 2);
    S.stream('hammer', sfxEv(S, 'hammer', { o: { n: 3, iron: true }, pk: -10, dist: 0.5 }), 4, 9, 3.5);
  },
  rhein(S) { // Rheinufer im Morgendunst: Wellen, Wind im Wald, Wachhorn in der Ferne; am Ende fast Stille
    const fadeG = S.g(1), ctlG = S.g(1); fadeG.connect(ctlG); ctlG.connect(S.body); // fadeG: langsames Ausklingen, ctlG: ctl 'ausklang'
    fadeG.gain.setValueAtTime(1, S.t0 + 5); fadeG.gain.linearRampToValueAtTime(0.35, S.t0 + 100);
    S.ev.gain.setValueAtTime(1, S.t0 + 5); S.ev.gain.linearRampToValueAtTime(0.5, S.t0 + 100); // auch die Einzelklänge werden mit der Zeit leiser und seltener
    const slow = () => ((S.cv.ausklang || 0) > 0.5 ? -1 : 1 + 1.5 * Math.min(1, Math.max(0, (S.c.currentTime - S.t0) / 100))); // −1 = pausiert
    S.part('wellen', () => { surf(S, { lvl: 0.34, rate: 0.23, dest: fadeG }); surf(S, { lvl: 0.12, rate: 0.17, dest: fadeG }); });
    S.part('wald', () => { wind(S, { lvl: 0.28, f: 520, q: 0.5, type: 'lowpass', gust: 0.55, rate: 0.085, dest: fadeG }); wind(S, { lvl: 0.1, f: 2200, q: 0.8, gust: 0.6, rate: 0.13, dest: fadeG }); });
    S.stream('platsch', sfxEv(S, 'bubble', { pk: -20, dist: 0.3 }), 1.2, 3.5, 1, slow);
    S.stream('horn', sfxEv(S, 'horn', { pk: -12, dist: 0.55, pw: 0.6 }), 40, 60, 12, slow);
    S.stream('vogel', birdEv(S, [0, 2, 4], { pk: -24, dist: 0.4 }), 6, 14, 4, slow);
    S.onCtl.ausklang = (v, now) => ctlG.gain.setTargetAtTime(1 - 0.82 * v, now, 1.5);
  },
};
export const SCENE_IDS = Object.keys(BUILD);
/** Ziel-Lautheit (dBFS, K-gewichtet; Rohsignal) je Szene – alle Szenen gleich laut, das geschlossene Buch nur ein Hauch. */
export const SCENE_T = { default: -27, cover: -46 };

/** Verwaltung: aktuelle Szene + auslaufende; Überblendung ≈ 1.2 s. */
export class Scenes {
  constructor(R) { this.R = R; this.cur = null; this.old = []; this.params = {}; this.solo = ''; }
  set(id, t, fade = 1.2, dest) {
    const B = BUILD[id]; if (!B) return false;
    if (this.cur) { if (this.cur.id === id && !this.cur.fading) return true; this.cur.fadeOut(t, fade); this.old.push(this.cur); }
    while (this.old.length > 2) this.old.shift().fadeOut(t, 0.15);
    const S = (this.cur = new Scene(this.R, id, dest || this.R.bus.atmo, t, fade, this.solo)); B(S);
    for (const k in this.params) S.setCtl(k, this.params[k]);
    return true;
  }
  tick(from, to) {
    if (this.cur) this.cur.tick(from, to);
    for (let i = this.old.length - 1; i >= 0; i--) if (this.old[i].dead) this.old.splice(i, 1);
  }
  ctl(name, v) { this.params[name] = v; if (this.cur) this.cur.setCtl(name, v); }
  event(name, t) { if (this.cur && this.cur.onEvent) this.cur.onEvent(name, t); }
  clear(fade = 0.3) { const t = this.R.ctx.currentTime; if (this.cur) { this.cur.fadeOut(t, fade); this.old.push(this.cur); this.cur = null; } }
}

// ------------------------------------------------------------------ ctl-Schichten (unabhängig von der Szene): Wind, Regen, Unterwasser
export class Layers {
  constructor(R) { this.R = R; this.v = { wind: 0, underwater: 0, rainfall: 0 }; this.wd = null; this.rn = null; this.nextDrop = 0; this.nextBub = 0; this.idle = { wd: 0, rn: 0 }; }
  mk(extra) { // gemeinsame Hülle: Ausgangs-Gain auf dem Atmo-Bus, Quellenliste
    const c = this.R.ctx, L = { out: c.createGain(), srcs: [], nodes: [], ...extra }; L.out.gain.value = 0; L.nodes.push(L.out); return L;
  }
  src(L, n, t) { n.start(t); L.srcs.push(n); return n; }
  node(L, n) { L.nodes.push(n); return n; }
  dispose(L) {
    if (!L) return; const now = this.R.ctx.currentTime;
    for (const s of L.srcs) { try { s.stop(now + 0.05); } catch (e) { /* egal */ } }
    setTimeout(() => { for (const n of L.nodes) { try { n.disconnect(); } catch (e) { /* egal */ } } }, 200);
  }
  noiseNode(L, kind, t) { const s = this.R.ctx.createBufferSource(); s.buffer = this.R.noiseBuf(kind); s.loop = true; return this.src(L, s, t); }
  /** Steuerwert setzen (now = Planzeit; Tests planen damit in die Zukunft). */
  set(name, v, now) {
    const R = this.R, c = R.ctx; now = now ?? c.currentTime; this.v[name] = v;
    if (name === 'wind') {
      if (!this.wd && v < 0.002) return;
      if (!this.wd) {
        const L = (this.wd = this.mk({})), t = now; L.out.connect(R.bus.atmo);
        const bp = this.node(L, c.createBiquadFilter()), g = this.node(L, c.createGain()); bp.type = 'bandpass'; bp.frequency.value = 650; bp.Q.value = 0.5; g.gain.value = 0.5;
        for (let i = 0; i < 2; i++) { const s = this.noiseNode(L, 'pink', t); s.connect(bp); }
        bp.connect(g); g.connect(L.out);
        for (const [r, d] of [[0.11, 0.35], [0.18, 0.2]]) { const o = this.src(L, c.createOscillator(), t), og = this.node(L, c.createGain()); o.frequency.value = r; og.gain.value = d; o.connect(og); og.connect(g.gain); }
      }
      this.wd.out.gain.setTargetAtTime(0.16 * v, now, 0.4);
    } else if (name === 'rainfall') { // Wetter-Knopf: Regenrauschen auf jeder Seite
      if (!this.rn && v < 0.002) return;
      if (!this.rn) {
        const L = (this.rn = this.mk({})), t = now; L.out.connect(R.bus.atmo);
        const hi = this.noiseNode(L, 'white', t), hp = this.node(L, c.createBiquadFilter()), lp = this.node(L, c.createBiquadFilter()), g1 = this.node(L, c.createGain());
        hp.type = 'highpass'; hp.frequency.value = 1500; hp.Q.value = 0.5; lp.type = 'lowpass'; lp.frequency.value = 7800; lp.Q.value = 0.5; g1.gain.value = 0.085;
        hi.connect(hp); hp.connect(lp); lp.connect(g1); g1.connect(L.out);
        const lo = this.noiseNode(L, 'pink', t), bp = this.node(L, c.createBiquadFilter()), g2 = this.node(L, c.createGain());
        bp.type = 'bandpass'; bp.frequency.value = 520; bp.Q.value = 0.6; g2.gain.value = 0.05; lo.connect(bp); bp.connect(g2); g2.connect(L.out);
      }
      this.rn.out.gain.setTargetAtTime(v, now, 0.6);
    } else if (name === 'underwater') {
      const f = 22000 * Math.pow(450 / 22000, v);
      R.bus.atmo.frequency.setTargetAtTime(f, now, 0.25); R.bus.music.frequency.setTargetAtTime(f, now, 0.25);
    }
  }
  /** Pro Frame: ungenutzte Schichten abbauen. */
  update(dt) {
    if (this.rn) { this.idle.rn = this.v.rainfall < 0.002 ? this.idle.rn + dt : 0; if (this.idle.rn > 3) { this.dispose(this.rn); this.rn = null; } }
    if (this.wd) { this.idle.wd = this.v.wind < 0.002 ? this.idle.wd + dt : 0; if (this.idle.wd > 3) { this.dispose(this.wd); this.wd = null; } }
  }
  /** Ereignisse mit Vorausschau: Regentropfen auf Papier. */
  tick(from, to) {
    const R = this.R;
    if (this.rn && this.v.rainfall > 0.1) {
      while (this.nextDrop < to) {
        const t = Math.max(this.nextDrop, from), v = R.voice(0, 'fx', 'sfx:tapp');
        if (v) { const f = 1500 + R.rng() * 1900; v.tone(t, { f, f2: f * 1.3, gl: 0.025, a: 0.002, d: 0.05 + R.rng() * 0.04, peak: 0.045 * this.v.rainfall }); }
        this.nextDrop = t + (0.05 + R.rng() * 0.16) / (0.4 + this.v.rainfall);
      }
    } else this.nextDrop = Math.max(this.nextDrop, from);
    if (this.v.underwater > 0.15) {
      while (this.nextBub < to) {
        const t = Math.max(this.nextBub, from), v = R.voice(0, 'fx', 'sfx:bubble');
        if (v) { const f = 350 + R.rng() * 600; v.tone(t, { f, f2: f * 1.7, gl: 0.06, a: 0.004, d: 0.08, peak: 0.12 * this.v.underwater }); }
        this.nextBub = t + (0.18 + R.rng() * 0.5) * (1.4 - this.v.underwater);
      }
    } else this.nextBub = Math.max(this.nextBub, from);
  }
  stopAll() { for (const k of ['wd', 'rn']) { this.dispose(this[k]); this[k] = null; } }
}
