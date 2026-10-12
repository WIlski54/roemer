// voices.js – Figuren- und Tierstimmen (FM + subtraktive Synthese mit Formantfiltern) und Vogelrufe.
// Stimmen des Römer-Buchs: gans1…gans8 (freundliches Schnattern), wolfin (leise), elefant (Trompete), pferd, hund, esel, person (kurzes „Hm“).
// Alle anderen ids bleiben still (keine Behauptung, was ein Gegenstand „sagt“).
import { clamp, env } from './synth.js';

// Stützpunkte [[tn, Hz], …] (tn 0…1) → Float32Array mit n Werten, geometrisch interpoliert, mit etwas Zittern (jit).
function contour(pts, n, jit, rnd) {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 0 : i / (n - 1); let k = 1; while (k < pts.length - 1 && pts[k][0] < x) k++;
    const a = pts[k - 1], b = pts[k], u = b[0] === a[0] ? 1 : clamp((x - a[0]) / (b[0] - a[0]), 0, 1);
    out[i] = a[1] * Math.pow(b[1] / a[1], u) * (1 + (jit ? (rnd() - 0.5) * 2 * jit : 0));
  }
  return out;
}
const AMP = [[0, 0], [0.14, 1], [0.7, 0.8], [1, 0]];

/**
 * Stimmsynthese: Sägezahn/Dreieck (+FM, +Sub, +Hauch) → Formantfilter (parallele Bandpässe) → Hüllkurve → Rauigkeit (AM)
 * → Sättigung → Tiefpass. p: d f w saw vib fm sub nz low lc F amp rough drive lp g
 */
export function vocal(v, t, p, dest) {
  const d = p.d, e = t + d + 0.06, n = Math.max(6, Math.round(d * 48)), saw = p.saw ?? 1, f0 = saw > 0 ? contour(p.f, n, p.jit ?? 0.012, v.R.rng) : null; // saw 0 = nur Hauch
  let mean = 0; if (f0) { for (let i = 0; i < n; i++) mean += f0[i]; mean /= n; }
  const src = v.g(1);
  if (saw > 0) {
    const o = v.osc(p.w || 'sawtooth', 100, t, e); o.frequency.setValueCurveAtTime(f0, t, d);
    if (p.vib) v.vib(o, p.vib[0], p.vib[1] * mean, t, e);
    if (p.fm) { // FM: Modulator folgt der Tonhöhe, der Index wandert von fm[1] nach fm[2]
      const m = v.osc('sine', 100, t, e), mg = v.g(0), r = p.fm[0];
      m.frequency.setValueCurveAtTime(f0.map((x) => x * r), t, d);
      env(mg.gain, t, [[0, p.fm[1] * mean * r], [d, p.fm[2] * mean * r]]); m.connect(mg); mg.connect(o.frequency);
    }
    const og = v.g(saw); o.connect(og); og.connect(src);
    if (p.sub) { const s = v.osc('sine', 100, t, e), sg = v.g(p.sub); s.frequency.setValueCurveAtTime(f0.map((x) => x * 0.5), t, d); s.connect(sg); sg.connect(src); }
  }
  if (p.nz) { const nn = v.noise('white', t, e), ng = v.g(p.nz); nn.connect(ng); ng.connect(src); }
  const mix = v.g(1);
  for (const [fr, q, gn] of p.F) { // Formanten: Mittenfrequenz kann gleiten (Vokalfärbung)
    const bp = v.f('bandpass', Array.isArray(fr) ? fr[0] : fr, q), fg = v.g(gn);
    if (Array.isArray(fr)) { bp.frequency.setValueAtTime(fr[0], t); bp.frequency.linearRampToValueAtTime(fr[1], t + d); }
    src.connect(bp); bp.connect(fg); fg.connect(mix);
  }
  if (p.low !== 0 && saw > 0) { const lf = v.f('lowpass', p.lc || 260, 0.7), lg = v.g(p.low ?? 0.6); src.connect(lf); lf.connect(lg); lg.connect(mix); } // Grundton bleibt erhalten
  const amp = v.g(0); env(amp.gain, t, (p.amp || AMP).map(([x, a]) => [x * d, a * (p.g ?? 1)]));
  mix.connect(amp); let n2 = amp;
  if (p.rough) { const rg = v.g(1 - p.rough[1] / 2), l = v.osc('sine', p.rough[0], t, e), lg = v.g(p.rough[1] / 2); l.connect(lg); lg.connect(rg.gain); n2.connect(rg); n2 = rg; }
  if (p.drive) { const sh = v.shaper(p.drive), hp = v.f('highpass', 22, 0.7); n2.connect(sh); sh.connect(hp); n2 = hp; }
  if (p.lp) { const lp = v.f('lowpass', p.lp, 0.6); n2.connect(lp); n2 = lp; }
  n2.connect(dest);
}

/** Zwitschern/Pfeifen: Sinus mit Gleiten (f0→f1[→f2]) und optionaler FM. Note: [Beginn, Dauer, f0, f1, Amp, FM-Index, f2] */
function chirps(v, t, p, dest) {
  for (const [dt, d, f0, f1, a, idx, f2] of p.n) {
    const s = t + dt, e = s + d + 0.05, te = s + (f2 ? d * 0.5 : d), o = v.osc('sine', f0, s, e);
    o.frequency.setValueAtTime(f0, s); o.frequency.exponentialRampToValueAtTime(f1, te); if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + d);
    if (p.vr) v.vib(o, p.vr, f0 * 0.02, s, e);
    if (idx) {
      const r = p.fmr || 2, m = v.osc('sine', f0 * r, s, e), mg = v.g(idx * f0 * r * 0.4);
      m.frequency.setValueAtTime(f0 * r, s); m.frequency.exponentialRampToValueAtTime(f1 * r, te); if (f2) m.frequency.exponentialRampToValueAtTime(f2 * r, s + d);
      m.connect(mg); mg.connect(o.frequency);
    }
    const g = v.g(0); env(g.gain, s, [[0, 0], [Math.min(0.012, d * 0.25), a], [d * 0.65, a * 0.85], [d, 0]]); o.connect(g); g.connect(dest);
  }
}

// ------------------------------------------------------------------ Vogelrufe (Atmosphären und sfx 'tweet')
/** Zufälliger kurzer Vogelruf als Notenliste für chirps(). kind 0 Strophe, 1 zwei Pfeiftöne, 2 Triller, 3 Zirpen, 4 tiefer Ruf. */
export function birdNotes(R, kind) {
  const r = R.rng, out = [];
  if (kind === 0) { let f = 3600 + r() * 1400, x = 0; const n = 5 + ((r() * 4) | 0); for (let i = 0; i < n; i++) { const d = 0.06 + r() * 0.06; out.push([x, d, f, f * (0.7 + r() * 0.6), 0.8, 0.35]); x += d + 0.03 + r() * 0.04; f *= 0.9 + r() * 0.16; } }
  else if (kind === 1) { const f = 2800 + r() * 800; out.push([0, 0.2, f * 1.15, f * 1.3, 0.9, 0, f * 1.05], [0.3, 0.3, f * 1.05, f * 0.8, 0.8, 0]); }
  else if (kind === 2) { const f = 3800 + r() * 800; for (let i = 0; i < 7; i++) out.push([i * 0.065, 0.04, f, f * 1.25, 0.7, 0.3]); }
  else if (kind === 3) { const f = 4200 + r() * 900; out.push([0, 0.06, f, f * 1.2, 0.8, 0.2], [0.11, 0.05, f * 1.05, f * 1.3, 0.6, 0.2]); }
  else { const f = 700 + r() * 300; out.push([0, 0.18, f * 0.8, f * 1.25, 0.9, 0.5], [0.26, 0.3, f * 1.25, f * 0.7, 0.9, 0.5]); }
  return out;
}

// ------------------------------------------------------------------ Gänse
// Acht Gänse mit leicht verschiedener Tonhöhe und je eigenem Schnatter-Muster (immer gleich je Gans, damit man sie wiedererkennt).
const GOOSE_PITCH = [1.0, 0.9, 1.11, 0.82, 1.2, 0.95, 1.06, 0.87];
const GOOSE_PAT = [ // Silben: [Beginn s, Dauer s, Tonhöhe Anfang, Ende] (Faktoren)
  [[0, 0.1, 1.12, 0.95], [0.15, 0.1, 1.14, 0.93], [0.31, 0.3, 1.0, 0.86]],            // „gak – gak – gaaak“
  [[0, 0.08, 0.92, 1.0], [0.13, 0.38, 1.04, 0.82]],                                      // „ha – hoonk“
  [[0, 0.07, 1.1, 0.98], [0.1, 0.07, 1.12, 0.97], [0.2, 0.07, 1.1, 0.95], [0.34, 0.22, 1.02, 0.84]], // „gagaga – gaak“
  [[0, 0.26, 0.96, 1.1], [0.34, 0.34, 1.08, 0.8]],                                       // „hoonk – hoonk“
];
/** Eine Gänse-Silbe (Spezifikation für vocal): Grundton F, Beginn at, Dauer d, Tonhöhe von a nach b (Faktoren). */
export const gooseSyl = (F, at, d, a, b) => ({ k: 'v', at, d, f: [[0, F * a], [0.35, F * (a + b) / 2 * 1.04], [1, F * b]], w: 'sawtooth', rough: [48, 0.4], nz: 0.07, jit: 0.01,
  F: [[780, 5, 1], [1750, 4, 0.55], [3000, 4, 0.1]], low: 0.45, lc: 900, lp: 3800, amp: [[0, 0], [0.12, 1], [0.6, 0.85], [1, 0]] });
export const gooseF = (n) => 440 * GOOSE_PITCH[(((n | 0) - 1) % 8 + 8) % 8]; // Grundton der Gans Nr. n (1…8)
const gooseSpec = (i) => GOOSE_PAT[i % 4].map(([at, d, a, b]) => gooseSyl(gooseF(i + 1), at, d, a, b));

// ------------------------------------------------------------------ Arten
const S = (...a) => a;
const SP = {
  wolfin: S({ k: 'v', d: 2.3, f: [[0, 300], [0.3, 470], [0.62, 530], [1, 380]], vib: [5, 0.008], nz: 0.05, F: [[[460, 540], 6, 1], [[950, 900], 6, 0.4]], low: 0.4, lc: 700, lp: 2400, amp: [[0, 0], [0.3, 1], [0.75, 0.85], [1, 0]] }), // sanftes, langes „Uuuu“
  elefant: S({ k: 'v', d: 1.25, f: [[0, 330], [0.12, 700], [0.5, 640], [1, 450]], fm: [2, 0.5, 0.14], vib: [7, 0.015], nz: 0.08, rough: [26, 0.25], F: [[1000, 4, 1], [2200, 4, 0.7], [3500, 3, 0.2]], low: 0.3, lc: 500, lp: 4200, amp: [[0, 0], [0.1, 1], [0.7, 0.85], [1, 0]] }), // freundliche Trompete
  pferd: S({ k: 'v', d: 1.0, f: [[0, 700], [0.15, 1450], [0.4, 1250], [0.75, 820], [1, 520]], rough: [17, 0.55], nz: 0.1, F: [[1300, 5, 1], [2700, 4, 0.5]], low: 0, lp: 4500 }),
  hund: S({ k: 'v', d: 0.17, f: [[0, 430], [0.3, 340], [1, 240]], nz: 0.3, rough: [30, 0.3], F: [[640, 5, 1], [1400, 4, 0.6], [2600, 3, 0.15]], low: 0.3, lc: 500, lp: 3800, amp: [[0, 0], [0.08, 1], [0.45, 0.7], [1, 0]] },
    { k: 'v', at: 0.27, d: 0.17, f: [[0, 450], [0.3, 350], [1, 250]], nz: 0.3, rough: [30, 0.3], F: [[640, 5, 1], [1400, 4, 0.6], [2600, 3, 0.15]], low: 0.3, lc: 500, lp: 3800, amp: [[0, 0], [0.08, 1], [0.45, 0.7], [1, 0]] }),
  esel: S({ k: 'v', d: 0.62, f: [[0, 380], [0.7, 940], [1, 880]], vib: [8, 0.01], rough: [24, 0.35], nz: 0.08, F: [[900, 5, 1], [2000, 4, 0.5]], low: 0, lp: 3800 }, // „I–“
    { k: 'v', at: 0.66, d: 0.95, f: [[0, 640], [0.3, 530], [1, 230]], vib: [7, 0.012], rough: [20, 0.4], nz: 0.08, F: [[[780, 640], 5, 1], [1500, 4, 0.6]], low: 0.3, lc: 500, lp: 3400 }),      // „–Ah“
  person: S({ k: 'v', d: 0.38, f: [[0, 178], [0.4, 196], [1, 168]], nz: 0.03, F: [[300, 5, 1], [1000, 4, 0.3]], low: 0.9, lc: 500, lp: 1800, amp: [[0, 0], [0.2, 1], [0.7, 0.85], [1, 0]] }),
};
for (let i = 0; i < 8; i++) SP['gans' + (i + 1)] = gooseSpec(i);
export const VOICE_IDS = Object.keys(SP);
/** Spitzenpegel-Ziele (dBFS, Rohsignal): Standard −9; wolfin ganz leise, person sehr zurückhaltend. */
export const VOICE_PEAK = { wolfin: -14, person: -11 };
export const VOICE_PEAK_DEFAULT = -9;
const CALM_K = { elefant: 0.8, pferd: 0.8, esel: 0.8, hund: 0.8 }; // im Ruhigen Modus lauteres etwas leiser

/**
 * Stimme abspielen. o: dist (0…1: fern und dumpf, für Atmosphären), dest (Zielknoten statt fx-Bus), prio, gain (Faktor), pan.
 * Gibt die Voice zurück oder null. Unbekannte ids → null (still).
 */
export function playVoice(R, id, t, o = {}) {
  const sp = SP[id]; if (!sp) return null;
  const v = R.voice(o.prio ?? 2, o.dest || 'fx', 'voice:' + id, o.dest ? '' : id);
  if (!v) return null;
  v.setup({ gain: (o.gain ?? 1) * (R.calm ? CALM_K[id] ?? 1 : 1), dist: o.dist, lpHi: 2600, pan: o.pan });
  for (const it of sp) vocal(v, t + (it.at || 0), it, v.out);
  return v;
}
/** Kurzer Vogelruf (sfx 'tweet' und Atmosphären). o: dest, prio, kind, gain, dist, pan, rev */
export function playBird(R, t, o = {}) {
  const v = R.voice(o.prio ?? 1, o.dest || 'fx', 'sfx:tweet'); if (!v) return null;
  v.setup(o);
  chirps(v, t, { n: birdNotes(R, o.kind ?? ((R.rng() * 4) | 0)), fmr: 2 }, v.out);
  if (o.rev) v.send(o.rev);
  return v;
}
