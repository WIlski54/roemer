// music.js – sehr leise, einfache, ERFUNDENE Musik: Leier- und Flötenmotive in Pentatonik oder Dorisch, je Szene eine eigene Stimmung.
// Wichtig: Von der echten römischen Musik ist fast nichts überliefert. Das hier ist eine Erfindung im Geist von Flöte und Leier, keine Rekonstruktion.
// Mehrere „Spieler“ (Zeilen, lines) laufen unabhängig; jede Zeile plant Phrasen mit Vorausschau (tick(von, bis)).
import { clamp } from './synth.js';
import { lyraNote, fluteNote } from './parts.js';

const SC = { pent: [0, 2, 4, 7, 9], minp: [0, 3, 5, 7, 10], dor: [0, 2, 3, 5, 7, 9, 10], mix: [0, 2, 4, 5, 7, 9, 10] };
const midi = (c, d) => { const s = SC[c.sc], n = s.length; return c.root + s[((d % n) + n) % n] + 12 * Math.floor(d / n); };

/** Das Straßenmotiv der Titelseite (D-dorisch): [Stufe, Schläge]. Kommt am Rhein als Abschied wieder. */
export const TITEL_MOTIF = [[0, 1], [2, 1], [4, 2], [3, 1], [2, 1], [1, 2], [0, 4]];

// Zeile: inst 'lyra'|'flote', root (MIDI), sc (Tonleiter), deg [min,max] (Stufen), st [min,max] (Notenabstand s), len [min,max] (Noten je Phrase), gap [min,max] (Pause s),
//        vel, rev (Hall-Send), delay (Start s), oct (Oktavversatz), motif [[Stufe, Schläge]] + beat (s je Schlag), arp [Stufen] (Leier-Begleitfigur), breath/vib (Flöte), fade [Sekunden, Rest] (leiser werden)
export const MUSIC = {
  cover: { lines: [{ inst: 'lyra', root: 62, sc: 'pent', deg: [0, 6], st: [0.7, 1.1], len: [3, 4], gap: [6, 11], vel: 0.5, rev: 0.7 }] },
  titel: { lines: [ // Flötenmotiv über leisen Leierklängen
    { inst: 'flote', root: 62, sc: 'dor', oct: 12, motif: TITEL_MOTIF, beat: 0.6, gap: [8, 13], vel: 0.9, rev: 0.5, delay: 0.8 },
    { inst: 'lyra', root: 50, sc: 'dor', arp: [0, 4, 2, 4], st: [0.6, 0.6], len: [4, 8], gap: [3, 7], vel: 0.4, rev: 0.5, delay: 2.5 }] },
  'rom-entsteht': { lines: [{ inst: 'flote', root: 67, sc: 'pent', oct: 12, deg: [0, 5], st: [0.7, 1.2], len: [3, 5], gap: [3, 7], vel: 0.85, rev: 0.45, breath: 2, vib: 0.6 }] }, // einfache Hirtenflöte, luftig
  grossmacht: { lines: [
    { inst: 'lyra', root: 57, sc: 'dor', deg: [0, 9], st: [0.32, 0.5], len: [4, 7], gap: [2.5, 5], vel: 0.65, rev: 0.45 },
    { inst: 'flote', root: 57, sc: 'dor', oct: 12, deg: [2, 9], st: [0.6, 1.0], len: [3, 5], gap: [6, 12], vel: 0.75, rev: 0.5, delay: 3 }] },
  legion: { lines: [
    { inst: 'lyra', root: 50, sc: 'dor', deg: [0, 7], st: [0.52, 0.52], len: [4, 6], gap: [3, 6], vel: 0.6, rev: 0.35 }, // gleichmäßig wie ein Marschschritt
    { inst: 'flote', root: 50, sc: 'dor', oct: 12, deg: [0, 4], st: [0.9, 1.3], len: [2, 4], gap: [10, 18], vel: 0.6, rev: 0.4, delay: 6 }] },
  kaiser: { lines: [{ inst: 'lyra', root: 65, sc: 'pent', deg: [0, 6], st: [0.8, 1.3], len: [4, 5], gap: [3, 6], vel: 0.65, rev: 0.6, delay: 8 }] }, // ruhiges Leier-Motiv erst nach der Fanfare
  hoehepunkt: { lines: [
    { inst: 'lyra', root: 67, sc: 'mix', deg: [0, 9], st: [0.25, 0.42], len: [5, 8], gap: [2, 4.5], vel: 0.7, rev: 0.4 },
    { inst: 'flote', root: 67, sc: 'mix', oct: 12, deg: [2, 9], st: [0.4, 0.8], len: [3, 6], gap: [5, 9], vel: 0.75, rev: 0.45, delay: 2 }] },
  stadtleben: { lines: [
    { inst: 'flote', root: 69, sc: 'pent', oct: 12, deg: [0, 8], st: [0.28, 0.5], len: [4, 7], gap: [3, 6], vel: 0.75, rev: 0.35 },
    { inst: 'lyra', root: 57, sc: 'pent', deg: [0, 7], st: [0.35, 0.35], len: [5, 9], gap: [3, 7], vel: 0.5, rev: 0.35, delay: 1.5 }] },
  ingenieure: { lines: [
    { inst: 'lyra', root: 57, sc: 'dor', arp: [0, 2, 4, 2], st: [0.5, 0.5], len: [6, 10], gap: [2.5, 5], vel: 0.55, rev: 0.35 }, // gleichmäßiges Werk-Ostinato
    { inst: 'flote', root: 57, sc: 'dor', oct: 12, deg: [0, 7], st: [0.6, 1.0], len: [3, 5], gap: [6, 10], vel: 0.75, rev: 0.4, delay: 4 }] },
  rhein: { lines: [ // das Motiv der Titelseite kommt zurück – langsamer, seltener, am Ende fast still
    { inst: 'flote', root: 62, sc: 'dor', oct: 12, motif: TITEL_MOTIF, beat: 0.95, gap: [16, 24], vel: 0.8, rev: 0.6, delay: 14, fade: [100, 0.5] },
    { inst: 'lyra', root: 50, sc: 'dor', arp: [0, 4], st: [1.1, 1.1], len: [2, 4], gap: [10, 16], vel: 0.35, rev: 0.6, delay: 6, fade: [100, 0.35] }] },
};
export const MUSIC_IDS = Object.keys(MUSIC);
/** Ziel-Effektivwerte (dBFS, Rohsignal) je Szene: Musik liegt ca. 6 dB unter der Atmosphäre. */
export const MUSIC_T = { default: -34, cover: -37 };

export class Music {
  constructor(R) { this.R = R; this.id = ''; this.cfg = null; this.lines = []; this.live = []; this.t0 = 0; }
  /** Szene wechseln: laufende Phrasen sanft ausblenden, neue Zeilen starten. */
  setScene(id, t, fade = 1.2) {
    this.stop(fade); this.id = id; this.cfg = MUSIC[id] || null; this.t0 = t;
    if (!this.cfg) return;
    this.lines = this.cfg.lines.map((c) => ({ c, next: t + fade + 0.6 + (c.delay || 0) + this.R.rng() * 1.5, motif: null, n: 0 }));
  }
  stop(fade = 1.2) {
    for (const v of this.live) if (!v.dead) v.kill(fade);
    this.live.length = 0; this.lines = [];
  }
  tick(from, to) {
    for (const L of this.lines) {
      while (L.next < to) { this.phrase(L); if (this.live.length > 14) this.live = this.live.filter((v) => !v.dead); }
    }
  }
  /** Notenfolge einer Phrase: [Zeit relativ, MIDI, Dauer-Schläge|null]. */
  notes(L) {
    const c = L.c, r = this.R.rng, out = [];
    if (c.motif) { // festes Motiv, selten leicht verändert (Wiedererkennung)
      let m = c.motif.map((x) => x.slice()); if (L.n > 0 && r() < 0.3) { const i = 1 + ((r() * (m.length - 2)) | 0); m[i][0] += r() < 0.5 ? -1 : 1; }
      let x = 0; for (const [d, b] of m) { out.push([x, midi(c, d), b * c.beat]); x += b * c.beat; } return out;
    }
    if (c.arp) { // Begleitfigur: gebrochener Akkord in gleichmäßigem Takt
      const n = c.len[0] + ((r() * (c.len[1] - c.len[0] + 1)) | 0); let x = 0; for (let i = 0; i < n; i++) { out.push([x, midi(c, c.arp[i % c.arp.length] + (i % 7 === 6 ? 2 : 0)), c.st[0] * 2]); x += c.st[0]; } return out;
    }
    const lo = c.deg[0], hi = c.deg[1], n = c.len[0] + ((r() * (c.len[1] - c.len[0] + 1)) | 0);
    let m = L.motif && r() < 0.55 ? L.motif.slice() : null; // Motiv wiederholen und leicht verändern
    if (m) { const i = (r() * m.length) | 0; m[i] = clamp(m[i] + (r() < 0.5 ? -1 : 1), lo, hi); }
    else { m = []; let d = lo + ((r() * (hi - lo)) | 0); for (let i = 0; i < n; i++) { m.push(d); d = clamp(d + [-2, -1, -1, 0, 1, 1, 2][(r() * 7) | 0], lo, hi); } }
    L.motif = m; let x = 0;
    for (let i = 0; i < m.length; i++) { const s = c.st[0] + r() * (c.st[1] - c.st[0]); out.push([x, midi(c, m[i]), s * 1.25]); x += s; }
    return out;
  }
  phrase(L) {
    const c = L.c, R = this.R, r = R.rng, v = R.voice(2, 'music', 'music:' + this.id);
    if (!v) { L.next += 2; return; }
    let vel = c.vel; if (c.fade) vel *= Math.max(c.fade[1], 1 - (L.next - this.t0) / c.fade[0] * (1 - c.fade[1]));
    const ns = this.notes(L); L.n++; let end = 0;
    for (const [x, m, d] of ns) {
      const t = L.next + x, k = vel * (0.8 + 0.2 * r());
      if (c.inst === 'flote') fluteNote(v, t, m + (c.oct || 0), Math.max(0.3, d * 0.95), k, { breath: c.breath, vib: c.vib }, v.out);
      else lyraNote(v, t, m + (c.oct || 0), k, v.out);
      end = Math.max(end, x + (c.inst === 'flote' ? d : 0.1));
    }
    if (c.rev) v.send(c.rev);
    this.live.push(v); L.next += end + c.gap[0] + r() * (c.gap[1] - c.gap[0]) * (c.fade ? 1 + 0.6 * clamp((L.next - this.t0) / c.fade[0], 0, 1) : 1);
  }
}

/** Leier-Melodie „musicbox“ (sfx beim Antippen der Leier): kleine, erfundene Weise in D-dorisch, ca. 14 s, gegen Ende langsamer. */
export function playMelody(R, t, o = {}) {
  const v = R.voice(3, 'music', 'sfx:musicbox'); if (!v) return null;
  v.setup(o);
  // D-dorisch: D4=62 E4=64 F4=65 G4=67 A4=69 B4=71 C5=72 D5=74
  const M = [[0, 62], [1, 65], [2, 69], [3, 67], [4, 65], [5, 64], [6, 62], [8, 64], [9, 65], [10, 69], [11, 71], [12, 69], [13, 67], [14, 65], [16, 69], [17, 72], [18, 74], [19, 72], [20, 69], [21, 67], [22, 65], [23, 64], [24, 62], [25, 65], [26, 64], [28, 62], [28, 50]];
  const beat = o.beat || 0.5;
  for (const [b, m] of M) { const tt = t + (b + (b > 20 ? (b - 20) * (b - 20) * 0.012 : 0)) * beat; lyraNote(v, tt, m, 0.85, v.out); }
  lyraNote(v, t + 28.9 * beat, 74, 0.4, v.out);
  v.send(0.5); return v;
}
