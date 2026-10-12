// horns.js – Blechinstrumente: Cornu (großes, rundes Horn), Tuba (gerade Trompete), Fanfaren und Wachhorn.
// Synthese: zwei leicht verstimmte Sägezähne → Tiefpass, dessen Grenzfrequenz beim Anblasen aufgeht (das „Bwah“) → Hüllkurve;
// dazu ein Körper-Resonanzfilter und ein winziger Atemstoß. Alles erfunden, die Töne liegen auf der Naturtonreihe (kein Schreck, kein Dröhnen).
import { mtof, env } from './synth.js';
import { drumHit } from './parts.js';

/** Ein Blechton. t Start, f Hz, d Dauer (s), o: kind 'cornu'|'tuba', vel. */
export function brassNote(v, t, f, d, o = {}, dest) {
  const tuba = o.kind === 'tuba', vel = o.vel ?? 1, br = o.bright ?? 1, a = tuba ? 0.035 : 0.065, rel = tuba ? 0.14 : 0.2, dd = Math.max(d, a + 0.14), e = t + dd + rel + 0.1;
  const o1 = v.osc('sawtooth', f, t, e), o2 = v.osc('sawtooth', f * 1.004, t, e), mix = v.g(0.5);
  for (const [x, k] of [[o1, 1], [o2, 1.004]]) { x.frequency.setValueAtTime(f * k * 0.965, t); x.frequency.exponentialRampToValueAtTime(f * k, t + 0.055); } // Lippen-Anstoß von unten
  if (dd > 0.6) v.vib(o1, 5.1, f * 0.0035, t + 0.35, e);
  o1.connect(mix); o2.connect(mix);
  const lp = v.f('lowpass', f * 1.5, tuba ? 1.1 : 0.8), lp2 = v.f('lowpass', f * 1.5, 0.6); // zwei Tiefpässe hintereinander (24 dB/Okt.): rund statt schnarrend
  for (const l of [lp, lp2]) { l.frequency.setValueAtTime(f * 1.5, t); l.frequency.linearRampToValueAtTime(f * (tuba ? 7 : 5) * br, t + a + 0.05); l.frequency.linearRampToValueAtTime(f * (tuba ? 4.6 : 3.2) * br, t + a + 0.3); } // Helligkeit: öffnet beim Ansatz, schließt leicht im Halten
  mix.connect(lp); lp.connect(lp2);
  const bp = v.f('bandpass', tuba ? 1500 : 700, 1.3), bg = v.g(0.45); mix.connect(bp); bp.connect(bg); // Körperresonanz
  const amp = v.g(0); env(amp.gain, t, [[0, 0], [a, vel], [a + 0.09, vel * 0.88], [dd, vel * 0.82], [dd + rel, 0]]);
  lp2.connect(amp); bg.connect(amp); amp.connect(dest || v.out);
  v.nz(t, { f: f * 3, q: 1.5, a: 0.01, d: 0.07, peak: 0.05 * vel, dest }); // Atemstoß
}

const C = (m) => m; // lesbare Noten (MIDI): 48 = C3, 55 = G3, 60 = C4, 64 = E4, 67 = G4, 72 = C5

/** Notenlisten: [Beginn s, MIDI-Note(n), Dauer s, Art, Stärke]. */
export const CALLS = {
  cornu: [[0, C(55), 0.26], [0.34, C(55), 0.26], [0.68, C(60), 1.15]], // „ta – ta – taaa“
  tuba: [[0, C(60), 0.2, 'tuba'], [0.27, C(64), 0.2, 'tuba'], [0.54, C(67), 0.2, 'tuba'], [0.81, C(72), 0.95, 'tuba']],
  horn: [[0, C(45), 1.5, 'cornu', 0.9], [1.8, C(52), 1.0, 'cornu', 0.8]], // Wachhorn: ein langer tiefer Ruf, eine kurze Antwort
  fanfare: [
    [0.45, C(60), 0.2, 'tuba'], [0.72, C(64), 0.2, 'tuba'], [0.99, C(67), 0.2, 'tuba'], [1.26, C(72), 1.0, 'tuba'],
    [2.0, C(55), 0.2, 'cornu'], [2.27, C(60), 0.2, 'cornu'], [2.54, C(64), 0.2, 'cornu'],
    [2.81, C(67), 1.5, 'tuba', 0.8], [2.81, C(72), 1.5, 'tuba', 0.8], [2.81, C(48), 1.6, 'cornu', 0.9],
  ],
};

/**
 * Hornruf spielen (eine Voice). name: Schlüssel in CALLS; o: dest (Szene), dist 0…1 (fern & dumpf), gain, pan, prio, key, k (Stärke), rev (Hall), drums, calm.
 * Gibt die Voice zurück (oder null, wenn der Pool voll ist).
 */
export function playCall(R, name, t, o = {}) {
  const v = R.voice(o.prio ?? 3, o.dest || 'fx', o.key ?? '', o.id); if (!v) return null;
  const calm = o.calm ?? R.calm, cine = !calm && (o.cine ?? R.cine), k = (o.k ?? 1) * (calm ? 0.78 : cine ? 1.26 : 1), bright = cine ? 1.25 : 1, dest = v.out; // cine = „Kräftigere Klänge“: +2 dB, heller, mehr Trommel
  v.setup(o);
  if (calm && !o.dist) v.insert(v.f('lowpass', 2600, 0.5)); // Ruhiger Modus: runder, weniger Glanz
  for (const [at, m, d, kind, vel] of CALLS[name]) for (const mm of [].concat(m)) brassNote(v, t + at, mtof(mm), d, { kind: kind || (name === 'tuba' ? 'tuba' : 'cornu'), vel: (vel ?? 1) * k, bright }, dest);
  if (name === 'fanfare' && o.drums !== false) { // weicher Trommelwirbel und zwei Akzente (im Ruhigen Modus nur die Akzente)
    if (!calm) for (let i = 0; i < 7; i++) drumHit(v, t + i * 0.06, { k: (0.18 + i * 0.07) * k, f: 170, d: 0.1, dest });
    drumHit(v, t + 1.26, { k: 0.5 * k, f: 120, d: 0.3, dest }); drumHit(v, t + 2.81, { k: 0.6 * k, f: 105, d: 0.45, dest });
    if (cine) for (const x of [0.45, 0.72, 0.99, 2.0, 2.27, 2.54]) drumHit(v, t + x, { k: 0.3 * k, f: 140, d: 0.16, dest }); // zusätzlich: Schlag zu jedem Hornton
  }
  v.send(o.rev ?? 0.3);
  return v;
}
