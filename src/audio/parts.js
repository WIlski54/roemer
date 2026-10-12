// parts.js – gemeinsame Klang-Bausteine („Atome“) für sfx.js, scenes.js und music.js.
// Jeder Baustein schreibt in eine bestehende Voice `v` (ein Pool-Platz) und kennt das Ziel `dest` (Standard: v.out).
// Alles ist erfunden und synthetisch; die Römer haben keine Klangaufnahmen hinterlassen.
import { mtof, env, clamp } from './synth.js';

// ------------------------------------------------------------------ Instrumente (Musik und Jingles)
/** Leier / Kithara-artig: gezupfte Saite aus harmonischen Teiltönen; tiefe Töne klingen länger, die Höhen verklingen schneller. */
export function lyraNote(v, t, m, vel = 1, dest) {
  const f = mtof(m), k = clamp(Math.pow(262 / f, 0.35), 0.6, 1.5);
  v.bell(t, f, [[1, 1, 1.5 * k], [2, 0.5, 0.85 * k], [3, 0.28, 0.5 * k], [4, 0.14, 0.32 * k], [5, 0.07, 0.2 * k], [6, 0.035, 0.12 * k]], 0.3 * vel, dest);
  v.nz(t, { f: Math.min(f * 5, 6000), q: 1.4, a: 0.0015, d: 0.012, peak: 0.05 * vel, dest }); // Zupfgeräusch
}
/** Flöte (Hirtenflöte/Aulos-artig): Sinus + Dreieck, weicher Anblas-Schwung, spätes Vibrato, Hauch. d = Tondauer in s. o: breath, vib, rel */
export function fluteNote(v, t, m, d, vel = 1, o = {}, dest) {
  const f = mtof(m), br = o.breath ?? 1, rel = o.rel ?? 0.2, att = o.att ?? 0.09, e = t + d + rel + 0.15;
  const s = v.osc('sine', f, t, e), s2 = v.osc('triangle', f, t, e), s3 = v.osc('sine', f * 2, t, e), g = v.g(0), g2 = v.g(0.2), g3 = v.g(0.06);
  for (const [x, k] of [[s, 1], [s2, 1], [s3, 2]]) { x.frequency.setValueAtTime(f * k * 0.985, t); x.frequency.linearRampToValueAtTime(f * k, t + 0.07); } // kleiner Anblas-Schwung
  if (d > 0.5) v.vib(s, 5.2, f * 0.0045 * (o.vib ?? 1), t + 0.28, e);
  s.connect(g); s2.connect(g2); g2.connect(g); s3.connect(g3); g3.connect(g);
  env(g.gain, t, [[0, 0], [att, 0.13 * vel], [Math.max(att + 0.04, d * 0.7), 0.105 * vel], [d + rel, 0]]);
  const nn = v.noise('white', t, e), bp = v.f('bandpass', f * 2.2, 2.4), ng = v.g(0); nn.connect(bp); bp.connect(ng); ng.connect(dest || v.out);
  env(ng.gain, t, [[0, 0], [0.05, 0.03 * br * vel], [d * 0.7, 0.016 * br * vel], [d + rel, 0]]);
  g.connect(dest || v.out);
}

// ------------------------------------------------------------------ Schlag und Schritt
/** Trommel (Handtrommel/Tympanum-artig): Fellton mit kurzem Anschlag. o: k (Stärke), f (Grundton), d, dest */
export function drumHit(v, t, o = {}) {
  const k = o.k ?? 1, f = o.f ?? 150, d = o.d ?? 0.22, dest = o.dest;
  v.tone(t, { f: f * 1.5, f2: f * 0.8, gl: 0.07, a: 0.003, d, peak: 0.6 * k, dest });
  v.tone(t, { f: f * 2.3, f2: f * 1.6, gl: 0.05, a: 0.002, d: d * 0.4, peak: 0.12 * k, dest });
  v.nz(t, { f: 1600, q: 0.9, a: 0.002, d: 0.04, peak: 0.22 * k, dest });
}
/** Ein Schritt in Nagelsandalen auf Stein/Kies. o: k (Stärke), p (Tonhöhenfaktor), dest */
export function stepSound(v, t, o = {}) {
  const k = o.k ?? 1, p = o.p ?? 1, dest = o.dest;
  v.tone(t, { f: 125 * p, f2: 70 * p, gl: 0.06, a: 0.003, d: 0.07, peak: 0.5 * k, dest });
  v.nz(t, { f: 1700 * p, q: 0.9, a: 0.002, d: 0.045, peak: 0.45 * k, dest });
  v.nz(t + 0.014, { f: 2600 * p, q: 1.4, a: 0.002, d: 0.03, peak: 0.22 * k, dest }); // Nägel
  v.tone(t + 0.003, { f: 3900 * p, a: 0.001, d: 0.02, peak: 0.035 * k, dest });
}
/** Hammerschlag: Holz („tok“) oder Eisen auf Amboss (o.iron). o: k, p, dest */
export function hammerHit(v, t, o = {}) {
  const k = o.k ?? 1, p = o.p ?? 1, dest = o.dest;
  if (o.iron) { v.bell(t, 1050 * p, [[1, 1, 0.34], [2.32, 0.5, 0.2], [4.1, 0.25, 0.1], [6.7, 0.1, 0.05]], 0.4 * k, dest); v.nz(t, { kind: 'white', type: 'highpass', f: 3000, a: 0.001, d: 0.01, peak: 0.18 * k, dest }); }
  else { v.tone(t, { f: 560 * p, f2: 380 * p, a: 0.0015, d: 0.05, peak: 0.4 * k, dest }); v.nz(t, { f: 1900 * p, q: 1.6, a: 0.0015, d: 0.02, peak: 0.5 * k, dest }); v.tone(t, { f: 210 * p, a: 0.002, d: 0.05, peak: 0.2 * k, dest }); }
}
/** Holz- oder Seilknarren (Stick-Slip): gepulster Träger, der durch einen schmalen Resonanzfilter gleitet. o: d, f, f2, bp, k, dest */
export function creak(v, t, o = {}) {
  const d = o.d ?? 0.6, f0 = o.f ?? 85, f1 = o.f2 ?? f0 * 1.35, k = o.k ?? 1, dest = o.dest || v.out, e = t + d + 0.1;
  const s = v.pulseOsc(0.2, f0, t, e); s.frequency.setValueAtTime(f0, t); s.frequency.linearRampToValueAtTime(f1, t + d); v.vib(s, 27, f0 * 0.1, t, e);
  const bp = v.f('bandpass', o.bp ?? 850, 7), g = v.g(0); s.connect(bp); bp.connect(g); g.connect(dest);
  env(g.gain, t, [[0, 0], [d * 0.15, 0.55 * k], [d * 0.5, 0.3 * k], [d * 0.75, 0.5 * k], [d, 0]]);
}
/** Münzklang: heller Metallton mit unharmonischen Obertönen. o: f, p, k, dest */
export function coin(v, t, o = {}) {
  const k = o.k ?? 1, f = (o.f ?? 2900) * (o.p ?? 1), dest = o.dest;
  v.bell(t, f, [[1, 1, 0.5], [2.42, 0.55, 0.28], [3.9, 0.3, 0.15], [6.1, 0.12, 0.08]], 0.3 * k, dest);
  v.nz(t, { kind: 'white', type: 'highpass', f: 4000, a: 0.001, d: 0.008, peak: 0.1 * k, dest });
}
/** Schafglöckchen (kleine Blechglocke, „tonk“). o: f, p, k, dest */
export function sheepBell(v, t, o = {}) {
  const k = o.k ?? 1, f = (o.f ?? 980) * (o.p ?? 1), dest = o.dest;
  v.bell(t, f, [[1, 1, 0.24], [1.5, 0.7, 0.17], [2.12, 0.4, 0.1], [3.3, 0.15, 0.06]], 0.3 * k, dest);
  v.nz(t, { f: 2600, q: 2, a: 0.001, d: 0.01, peak: 0.1 * k, dest });
}
/** Taubengurren („gu-ruu-guu“): weiche Dreieckstöne, im Tiefpass, abwärts gleitend. o: f, k, dest */
export function coo(v, t, o = {}) {
  const k = o.k ?? 1, f = o.f ?? 400, dest = o.dest || v.out;
  for (const [at, d, r] of [[0, 0.13, 1], [0.19, 0.13, 1], [0.39, 0.36, 0.92]]) {
    const s = v.osc('triangle', f * r * 1.16, t + at, t + at + d + 0.06), lp = v.f('lowpass', 950, 0.7), g = v.g(0);
    s.frequency.setValueAtTime(f * r * 1.16, t + at); s.frequency.exponentialRampToValueAtTime(f * r * 0.94, t + at + d);
    s.connect(lp); lp.connect(g); g.connect(dest); env(g.gain, t + at, [[0, 0], [0.03, 0.5 * k], [d * 0.8, 0.4 * k], [d, 0]]);
  }
}
