// sfx.js – Einmal-Geräusche. Jede Funktion: (R = Rig, t = Startzeit, o = Optionen). Jedes Geräusch ist ein einziger Voice (ein Pool-Platz).
// Alle Einsätze haben mindestens 1.5 ms Anstieg (Ticks) bzw. 3–10 ms (Dumpfes/Lautes); nichts startet oder endet mit einem Sprung.
// Zusätzlich zu den eigenen Optionen verstehen alle Geräusche die Ereignis-Optionen der Atmosphären: dest, gain, dist, pan, prio (siehe Voice.setup).
import { clamp, mtof, env } from './synth.js';
import { playBird, vocal, gooseSyl, gooseF } from './voices.js';
import { playMelody } from './music.js';
import { playCall } from './horns.js';
import { lyraNote, drumHit, stepSound, hammerHit, creak, coin, sheepBell, coo } from './parts.js';

const PENT = [0, 2, 4, 7, 9];
const pent = (i, root = 72) => root + PENT[((i % 5) + 5) % 5] + 12 * Math.floor(i / 5);
/** Im Ruhigen Modus (app.calm) um 22 % leiser: alles Lautere, Schlagende, Blecherne. */
const LOUD = new Set(['cornu', 'tuba', 'fanfare', 'trommel', 'menge', 'gong', 'impact', 'hammer', 'kran', 'stomp', 'honk', 'horn', 'saege', 'marsch', 'woodcrack', 'crack', 'thud', 'muenze']);
/** „Kräftigere Klänge“ (audio.cine, Schalter in den Einstellungen): +2 dB für Hörner und Trommeln (Spitze bleibt ≤ −6 dBFS). */
const CINE = new Set(['cornu', 'tuba', 'fanfare', 'trommel', 'horn', 'marsch', 'menge', 'gong']);
const mk = (R, name, o = {}, prio = 1) => {
  const v = R.voice(o.prio ?? prio, o.dest || 'fx', 'sfx:' + name); if (!v) return null;
  v.setup({ gain: (o.gain ?? 1) * (R.calm && LOUD.has(name) ? 0.78 : !R.calm && R.cine && CINE.has(name) ? 1.26 : 1), dist: o.dist, lpHi: o.lpHi, pan: o.pan });
  return v;
};

export const SFX = {
  // ---------- Papier und Mechanik
  turn(R, t, o) { // Umblättern: Rauschen mit Bandpass-Sweep (vorwärts aufwärts, rückwärts abwärts), bei mehreren Seiten gestaffelt
    const v = mk(R, 'turn', o); if (!v) return; const n = clamp(o.steps || 1, 1, 3), up = o.fwd !== false, kk = n > 1 ? 0.72 : 1; // überlappende Seiten sollen nicht lauter werden als eine
    for (let i = 0; i < n; i++) {
      const s = t + i * 0.26;
      v.nz(s, { f: up ? 600 : 3200, f2: up ? 3400 : 700, q: 1.1, a: 0.16, d: 0.38, peak: 0.55 * kk });
      v.nz(s + 0.05, { kind: 'white', type: 'highpass', f: 5200, a: 0.1, d: 0.25, peak: 0.06 * kk });
    }
    v.tone(t + (n - 1) * 0.26 + 0.36, { f: 190, f2: 110, a: 0.005, d: 0.09, peak: 0.16 });
  },
  lift(R, t, o) { const v = mk(R, 'lift', o); if (!v) return; v.nz(t, { f: 900, f2: 1800, q: 1, a: 0.05, d: 0.16, peak: 0.25 }); },
  land(R, t, o) { // Seite fällt auf: weiches Plumpsen; Einband schwerer
    const v = mk(R, 'land', o); if (!v) return;
    if (o.cover) { v.tone(t, { f: 72, f2: 40, a: 0.006, d: 0.32, peak: 0.38 }); v.nz(t, { kind: 'brown', type: 'lowpass', f: 320, a: 0.004, d: 0.2, peak: 0.3 }); }
    else { v.tone(t, { f: 96, f2: 58, a: 0.005, d: 0.16, peak: 0.5 }); v.nz(t, { type: 'lowpass', f: 520, a: 0.003, d: 0.09, peak: 0.3 }); }
  },
  grab(R, t, o) { const v = mk(R, 'grab', o); if (!v) return; v.nz(t, { kind: 'white', f: 2800, q: 2, a: 0.003, d: 0.05, peak: 0.22 }); v.tone(t, { f: 520, f2: 380, a: 0.003, d: 0.05, peak: 0.16 }); },
  snap(R, t, o) { // Einrasten: weicher Klick
    const v = mk(R, 'snap', o); if (!v) return;
    v.tone(t, { f: 1250, f2: 900, a: 0.002, d: 0.045, peak: 0.28 }); v.nz(t, { kind: 'white', type: 'highpass', f: 3500, a: 0.002, d: 0.02, peak: 0.16 }); v.tone(t, { f: 240, f2: 160, a: 0.002, d: 0.07, peak: 0.4 });
  },
  card(R, t, o) { // Karte auf/zu: leises Papier
    const v = mk(R, 'card', o); if (!v) return; const up = !o.close;
    v.nz(t, { f: up ? 1500 : 2600, f2: up ? 2600 : 1500, q: 1.2, a: 0.05, d: 0.22, peak: 0.2 }); v.tone(t + 0.02, { f: up ? 660 : 500, f2: up ? 880 : 400, a: 0.004, d: 0.05, peak: 0.08 });
  },
  found(R, t, o) { // Gans gefunden: kleine Leier-Kaskade (D-Dur-Pentatonik aufwärts) mit Glitzern
    const v = mk(R, 'found', o, 3); if (!v) return;
    [74, 78, 81, 86, 90].forEach((m, i) => lyraNote(v, t + i * 0.085, m, 0.95 - i * 0.06));
    v.bell(t + 0.4, mtof(98), [[1, 1, 1.0], [4, 0.2, 0.4]], 0.1); v.send(0.4);
  },
  tick(R, t, o) { // Uhrticken (Tick/Tack im Wechsel); schneller beim Drehen
    const v = mk(R, 'tick', o); if (!v) return; R.tickPar = !R.tickPar; const k = (R.tickPar ? 1 : 0.78) * (1 + Math.min(0.4, (o.rate || 0) * 0.8)), s = o.fast ? 0.7 : 1;
    v.tone(t, { f: 2400 * k, f2: 1900 * k, a: 0.0015, d: 0.018 * s, peak: 0.3 }); v.nz(t, { kind: 'white', f: 3800 * k, q: 3, a: 0.0015, d: 0.012 * s, peak: 0.22 }); v.tone(t, { f: 520 * k, a: 0.002, d: 0.03 * s, peak: 0.12 });
  },
  gong(R, t, o) { // weicher Bronzegong (Zeitrad am Ende)
    const v = mk(R, 'gong', o, 3); if (!v) return; const f = 98;
    v.bell(t, f, [[1, 0.5, 5], [1.51, 0.35, 4.2], [2.02, 0.3, 3.4], [2.76, 0.18, 2.4], [3.13, 0.14, 2], [4.1, 0.08, 1.2]], 0.7);
    v.nz(t, { kind: 'brown', type: 'lowpass', f: 300, a: 0.012, d: 0.25, peak: 0.25 }); v.send(0.35);
  },
  slide(R, t, o) { // Reibung beim Ziehen: Tonhöhe folgt der Zugstrecke v (0…1)
    const v = mk(R, 'slide', o, 0); if (!v) return; const x = clamp(o.v ?? 0.5, 0, 1);
    v.nz(t, { f: 380 + x * 2200, q: 3.5, a: 0.015, d: 0.08, peak: 0.22 }); v.nz(t, { kind: 'white', type: 'highpass', f: 4500, a: 0.01, d: 0.05, peak: 0.03 });
  },
  flapOpen(R, t, o) { const v = mk(R, 'flapOpen', o); if (!v) return; v.tone(t, { f: 330, f2: 220, a: 0.005, d: 0.08, peak: 0.15 }); v.nz(t, { f: 700, f2: 2400, q: 1.2, a: 0.08, d: 0.17, peak: 0.35 }); },
  flapClose(R, t, o) { const v = mk(R, 'flapClose', o); if (!v) return; v.nz(t, { f: 2400, f2: 700, q: 1.2, a: 0.05, d: 0.12, peak: 0.3 }); v.tone(t + 0.1, { f: 160, f2: 100, a: 0.004, d: 0.08, peak: 0.25 }); },
  pop(R, t, o) { const v = mk(R, 'pop', o); if (!v) return; v.tone(t, { f: 340, f2: 900, gl: 0.04, a: 0.003, d: 0.1, peak: 0.4 }); v.nz(t, { kind: 'white', type: 'highpass', f: 4000, a: 0.002, d: 0.012, peak: 0.07 }); },

  // ---------- Schritte und Wucht
  footstep(R, t, o) { // leichte Sandalenschritte (o.big → schwer); o.v 0…1 = Tempo/Tonhöhe
    if (o.big) return SFX.stomp(R, t, { ...o, big: false });
    const v = mk(R, 'footstep', o, 0); if (!v) return; const k = 0.85 + clamp(o.v ?? 0.5, 0, 1) * 0.3, n = 1 + (R.rng() < 0.5 ? 1 : 0);
    for (let i = 0; i < n; i++) stepSound(v, t + i * 0.27, { k: 0.8, p: k * (0.92 + R.rng() * 0.16) });
  },
  stomp(R, t, o) { // dumpfer Tritt mit minimalem Bodenbeben
    const v = mk(R, 'stomp', o, 2); if (!v) return; const b = o.big !== false ? 1 : 0.6;
    v.tone(t, { f: 58 * (b > 0.9 ? 1 : 1.3), f2: 34, gl: 0.3, a: 0.008, d: 0.4 * b + 0.18, peak: 0.8 });
    v.tone(t, { f: 118, f2: 62, gl: 0.2, a: 0.008, d: 0.22, peak: 0.34 }); // Oberton, damit kleine Lautsprecher es hören
    v.nz(t, { kind: 'brown', type: 'lowpass', f: 140, f2: 60, a: 0.01, d: 0.45 * b, peak: 0.6 }); v.nz(t, { type: 'lowpass', f: 900, a: 0.003, d: 0.06, peak: 0.22 });
  },
  swing(R, t, o) { const v = mk(R, 'swing', o); if (!v) return; v.nz(t, { f: 300, f2: 1400, q: 1, a: 0.2, d: 0.12, peak: 0.4 }); v.nz(t + 0.28, { f: 1400, f2: 380, q: 1, a: 0.01, d: 0.25, peak: 0.34 }); v.tone(t, { f: 120, f2: 90, a: 0.1, d: 0.3, peak: 0.1 }); },
  flap(R, t, o) { // Flügel-/Tuchschlag: zwei weiche „Fwup“ (Taubenflügel, Segel)
    const v = mk(R, 'flap', o); if (!v) return;
    for (let i = 0; i < 2; i++) { const s = t + i * 0.15, p = 0.9 + R.rng() * 0.2; v.nz(s, { type: 'lowpass', f: 1200 * p, f2: 500, q: 0.8, a: 0.03, d: 0.1, peak: 0.35 }); v.tone(s, { f: 140 * p, f2: 90, a: 0.01, d: 0.1, peak: 0.15 }); }
  },
  splash(R, t, o) { // Platschen (o.big → größer, länger)
    const v = mk(R, 'splash', o); if (!v) return; const b = o.big ? 1 : 0.6;
    v.nz(t, { kind: 'white', f: 2000, f2: 900, q: 0.8, a: 0.005, d: 0.5 * b + 0.2, peak: 0.5 }); v.nz(t, { type: 'highpass', f: 4000, a: 0.004, d: 0.2 * b + 0.1, peak: 0.15 });
    const n = o.big ? 6 : 3; for (let i = 0; i < n; i++) { const s = t + 0.03 + R.rng() * 0.4 * b, f = 350 + R.rng() * 700; v.tone(s, { f, f2: f * 1.9, gl: 0.05, a: 0.004, d: 0.07, peak: 0.14 }); }
  },
  bubble(R, t, o) { const v = mk(R, 'bubble', o, 0); if (!v) return; const f = 400 + R.rng() * 500; v.tone(t, { f, f2: f * 1.8, gl: 0.05, a: 0.004, d: 0.07, peak: 0.3 }); },
  dive(R, t, o) { const v = mk(R, 'dive', o); if (!v) return; v.nz(t, { kind: 'white', f: 3000, f2: 500, q: 2, a: 0.08, d: 0.55, peak: 0.35 }); v.tone(t, { f: 1500, f2: 450, a: 0.05, d: 0.6, peak: 0.12 }); },
  wave(R, t, o) { const v = mk(R, 'wave', o); if (!v) return; v.nz(t, { type: 'lowpass', f: 400, f2: 1800, q: 0.7, a: 0.5, d: 0.9, peak: 0.45 }); v.nz(t + 0.3, { kind: 'white', type: 'highpass', f: 3000, a: 0.5, d: 0.8, peak: 0.12 }); },
  chomp(R, t, o) { // Biss/Happs: Bums + Holzklack, ein leichtes Nachklappen
    const v = mk(R, 'chomp', o); if (!v) return;
    v.tone(t, { f: 170, f2: 70, a: 0.004, d: 0.12, peak: 0.6 }); v.nz(t, { f: 900, q: 1, a: 0.003, d: 0.05, peak: 0.5 });
    v.tone(t + 0.11, { f: 120, f2: 60, a: 0.004, d: 0.08, peak: 0.3 }); v.nz(t + 0.11, { f: 700, q: 1, a: 0.003, d: 0.04, peak: 0.22 });
  },
  crack(R, t, o) { // Knacken: drei kleine Brüche
    const v = mk(R, 'crack', o); if (!v) return;
    for (let i = 0; i < 3; i++) { const s = t + R.rng() * 0.1; v.nz(s, { kind: 'white', f: 2500 + R.rng() * 2000, q: 5, a: 0.001, d: 0.012, peak: 0.4 }); v.tone(s, { f: 900, f2: 500, a: 0.0015, d: 0.02, peak: 0.12 }); }
  },
  splinter(R, t, o) { // viele winzige helle Tickser (Splitter, Kiesel)
    const v = mk(R, 'splinter', o); if (!v) return;
    for (let i = 0; i < 9; i++) { const s = t + R.rng() * 0.32; v.tone(s, { f: 1500 + R.rng() * 2500, a: 0.001, d: 0.025, peak: 0.1 + R.rng() * 0.08 }); v.nz(s, { kind: 'white', type: 'highpass', f: 3000, a: 0.001, d: 0.01, peak: 0.06 }); }
  },
  peep(R, t, o) { // kleines Piepsen: hohe Sinus-Blips mit Vibrato
    const v = mk(R, 'peep', o); if (!v) return;
    for (let i = 0; i < 2; i++) { const s = t + i * 0.19, f = 2700 + R.rng() * 500, p = v.tone(s, { f, f2: f * 1.2, gl: 0.05, a: 0.008, d: 0.1, peak: 0.3 }); v.vib(p, 9, 45, s, s + 0.15); }
  },
  hatch(R, t, o) { // Klappe/Luke öffnet: Holz knarrt, kurzes Klacken
    const v = mk(R, 'hatch', o, 2); if (!v) return;
    creak(v, t, { d: 0.42, f: 110, f2: 150, bp: 900, k: 0.8 }); hammerHit(v, t + 0.46, { k: 0.5, p: 0.8 }); v.nz(t + 0.1, { f: 700, f2: 1800, q: 1.2, a: 0.08, d: 0.2, peak: 0.12 });
  },
  whoosh(R, t, o) { const v = mk(R, 'whoosh', o); if (!v) return; v.nz(t, { type: 'lowpass', f: 220, f2: 1100, q: 0.8, a: 0.25, d: 0.65, peak: 0.6 }); v.tone(t, { f: 100, f2: 55, a: 0.2, d: 0.7, peak: 0.35 }); v.nz(t + 0.1, { kind: 'white', type: 'highpass', f: 2500, a: 0.3, d: 0.4, peak: 0.07 }); },
  rumble(R, t, o) { // tiefes Grollen mit langsamem Zittern (Gewitter-Donner im Wetter-Modus; AM über eigenen Gain, damit das Ende sauber ausläuft)
    const d = o.dur || 1.8, v = mk(R, 'rumble', o, 2); if (!v) return;
    const am = v.g(0.75), l = v.osc('sine', 7.5, t, t + d + 0.5), lg = v.g(0.25); l.connect(lg); lg.connect(am.gain); am.connect(v.out);
    v.nz(t, { kind: 'brown', type: 'lowpass', f: 90, q: 0.7, a: 0.2, d, peak: 0.8, dest: am }); v.tone(t, { f: 41, a: 0.25, d, peak: 0.25, dest: am });
  },
  impact(R, t, o) { // dumpfer, weicher Schlag (Tor fällt zu, Stein kippt): kein Knall, nur Wucht
    const v = mk(R, 'impact', o, 2); if (!v) return;
    v.tone(t, { f: 78, f2: 46, gl: 0.5, a: 0.01, d: 0.9, peak: 0.8 }); v.tone(t, { f: 156, f2: 92, gl: 0.4, a: 0.01, d: 0.5, peak: 0.3 });
    v.nz(t, { kind: 'brown', type: 'lowpass', f: 600, f2: 90, a: 0.012, d: 0.7, peak: 0.6 }); v.nz(t, { f: 1200, f2: 400, q: 0.7, a: 0.008, d: 0.12, peak: 0.12 }); v.send(0.25);
  },
  thud(R, t, o) { const v = mk(R, 'thud', o); if (!v) return; v.tone(t, { f: 105, f2: 52, a: 0.005, d: 0.2, peak: 0.6 }); v.nz(t, { type: 'lowpass', f: 400, a: 0.003, d: 0.08, peak: 0.3 }); },
  chime(R, t, o) { const v = mk(R, 'chime', o); if (!v) return; const m = o.note != null ? pent(o.note, 79) : pent((R.rng() * 7) | 0, 79); v.bell(t, mtof(m), [[1, 1, 1.6], [2.76, 0.25, 0.4], [5.4, 0.1, 0.15]], 0.3); v.send(0.3); },
  grow(R, t, o) { // „WACHSE!“: Rascheln + aufsteigende Töne
    const v = mk(R, 'grow', o, 2); if (!v) return;
    v.nz(t, { f: 1200, f2: 3600, q: 1.5, a: 0.35, d: 0.5, peak: 0.3 });
    for (let i = 0; i < 6; i++) v.bell(t + 0.08 + i * 0.1, mtof(pent(i, 74)), [[1, 1, 0.5], [4, 0.15, 0.1]], 0.16);
    v.bell(t + 0.75, mtof(91), [[1, 1, 1.2], [2.76, 0.2, 0.3]], 0.14); v.send(0.25);
  },
  rustle(R, t, o) { // Blätter, Stoff, Papyrus rascheln
    const v = mk(R, 'rustle', o); if (!v) return;
    v.nz(t, { f: 2000, q: 0.7, a: 0.08, d: 0.3, peak: 0.12 });
    for (let i = 0; i < 5; i++) v.nz(t + R.rng() * 0.4, { kind: 'white', f: 2800 + R.rng() * 1800, q: 2.5, a: 0.01, d: 0.06, peak: 0.1 + R.rng() * 0.12 });
  },
  horn(R, t, o) { playCall(R, 'horn', t, { ...o, key: 'sfx:horn', prio: 2, rev: 0.4, dist: o.dist ?? 0.25, calm: R.calm }); }, // Wachhorn: ein langer, tiefer, runder Ruf
  tapp(R, t, o) { const v = mk(R, 'tapp', o, 0); if (!v) return; const p = 0.92 + R.rng() * 0.16; v.tone(t, { f: 190 * p, f2: 120 * p, a: 0.003, d: 0.06, peak: 0.28 }); v.nz(t, { type: 'lowpass', f: 900, a: 0.003, d: 0.05, peak: 0.22 }); v.nz(t, { kind: 'white', type: 'highpass', f: 4000, a: 0.005, d: 0.08, peak: 0.04 }); },
  fossil(R, t, o) { // „Klack“ auf Stein (Steintafel) mit kurzem Hall
    const v = mk(R, 'fossil', o, 2); if (!v) return;
    v.nz(t, { kind: 'white', f: 1900, q: 3, a: 0.0015, d: 0.012, peak: 0.5 }); v.tone(t, { f: 820, f2: 380, a: 0.0015, d: 0.035, peak: 0.35 }); v.tone(t, { f: 260, f2: 150, a: 0.002, d: 0.06, peak: 0.3 }); v.send(0.6);
  },
  woodcrack(R, t, o) { // Holzkrachen
    const v = mk(R, 'woodcrack', o, 2); if (!v) return;
    v.nz(t, { f: 1400, f2: 500, q: 1.5, a: 0.002, d: 0.06, peak: 0.55 });
    for (let i = 0; i < 3; i++) v.nz(t + 0.06 + i * 0.11 + R.rng() * 0.05, { f: 800 - i * 150, f2: 350, q: 2, a: 0.002, d: 0.08 + i * 0.03, peak: 0.35 - i * 0.07 });
    v.tone(t, { f: 90, f2: 50, a: 0.004, d: 0.22, peak: 0.5 });
  },
  ping(R, t, o) { const v = mk(R, 'ping', o); if (!v) return; v.tone(t, { f: 1760, a: 0.003, d: 0.55, peak: 0.28 }); v.tone(t, { f: 3520, a: 0.003, d: 0.2, peak: 0.06 }); v.send(0.2); },
  musicbox(R, t, o) { playMelody(R, t, o); }, // Leier-Melodie (erfunden), ca. 14 s
  tinnitus(R, t, o) { // sehr leises, weiches Schimmern (zwei fast gleiche hohe Töne schweben); klingt in ca. 4 s aus
    const v = mk(R, 'tinnitus', o, 3); if (!v) return; const g = v.g(0), a = v.osc('sine', 1320, t, t + 5), b = v.osc('sine', 1331, t, t + 5);
    a.connect(g); b.connect(g); g.connect(v.out); env(g.gain, t, [[0, 0], [0.9, 0.5], [1.4, 0.5]]); g.gain.exponentialRampToValueAtTime(0.0005, t + 4.6); g.gain.linearRampToValueAtTime(0, t + 4.8);
  },
  tweet(R, t, o) { playBird(R, t, o); },

  // ---------- Römer: Horn, Trompete, Trommel, Schritt
  cornu(R, t, o) { playCall(R, 'cornu', t, { ...o, key: 'sfx:cornu', prio: 3, rev: 0.35 }); }, // Cornu-Signal „ta – ta – taaa“
  tuba(R, t, o) { playCall(R, 'tuba', t, { ...o, key: 'sfx:tuba', prio: 3, rev: 0.3 }); }, // gerade Trompete: heller, schneller
  fanfare(R, t, o) { playCall(R, 'fanfare', t, { ...o, key: 'sfx:fanfare', prio: 3, rev: 0.35 }); }, // Tuba und Cornu im Wechsel, kleiner Wirbel, ca. 4.5 s
  trommel(R, t, o) { // Handtrommel; o.n Schläge (Wirbel), o.gap Abstand
    const v = mk(R, 'trommel', o, 1); if (!v) return; const n = clamp(o.n || 1, 1, 12), sp = o.gap ?? 0.1;
    for (let i = 0; i < n; i++) drumHit(v, t + i * sp, { k: (i & 1 ? 0.8 : 1) * (n > 1 ? 0.55 + (0.45 * i) / (n - 1) : 1), f: i & 1 ? 140 : 150, d: R.cine ? 0.3 : 0.22 });
  },
  marsch(R, t, o) { // Marschschritte der Legion; o.n Schritte (Standard 2), o.v 0…1 (Schieberstellung → Tonhöhe/Dichte)
    const v = mk(R, 'marsch', o, 0); if (!v) return; const n = clamp(o.n || 2, 1, 6), x = clamp(o.v ?? 0.5, 0, 1);
    for (let i = 0; i < n; i++) { const left = ((i + (o.foot || 0)) & 1) === 0; stepSound(v, t + i * 0.24 + (R.rng() - 0.5) * 0.012, { k: (left ? 1 : 0.8) * (0.85 + R.rng() * 0.3), p: (left ? 1 : 0.93) * (0.96 + 0.1 * x) }); }
    if (R.rng() < 0.6) for (let i = 0; i < 3; i++) v.bell(t + 0.02 + i * 0.03 + R.rng() * 0.02, 3500 + R.rng() * 2500, [[1, 1, 0.07], [2.4, 0.4, 0.04]], 0.05); // leises Klirren der Ausrüstung
  },
  hammer(R, t, o) { // Hammerschläge; o.n (Standard 3), o.iron (Eisen auf Amboss statt Holz)
    const v = mk(R, 'hammer', o, 1); if (!v) return; const n = clamp(o.n || 3, 1, 6); let s = t;
    for (let i = 0; i < n; i++) { hammerHit(v, s, { k: (i === 0 ? 1 : 0.88 - 0.05 * i) * (o.iron ? 0.6 : 1), p: 0.95 + R.rng() * 0.1, iron: !!o.iron }); s += 0.26 + R.rng() * 0.18; }
  },
  saege(R, t, o) { // Säge: o.n Striche (Standard 3), rau mit Zahnrhythmus
    const v = mk(R, 'saege', o, 1); if (!v) return; const n = clamp(o.n || 3, 1, 6), L = 0.4;
    for (let i = 0; i < n; i++) {
      const s = t + i * L, up = (i & 1) === 0, e = s + L + 0.06, nn = v.noise('white', s, e), bp = v.f('bandpass', 2300, 1.3), am = v.g(0.5), g = v.g(0), teeth = v.pulseOsc(0.5, 92 + R.rng() * 8, s, e), tg = v.g(0.4);
      bp.frequency.setValueAtTime(up ? 2000 : 3000, s); bp.frequency.linearRampToValueAtTime(up ? 3000 : 2000, s + L);
      teeth.connect(tg); tg.connect(am.gain); nn.connect(bp); bp.connect(am); am.connect(g); g.connect(v.out); env(g.gain, s, [[0, 0], [0.05, 0.5], [L * 0.8, 0.4], [L, 0]]);
      v.tone(s, { f: 1180 + R.rng() * 60, a: 0.04, d: L * 0.8, peak: 0.03 });
    }
  },
  seil(R, t, o) { // Seilknarren: drei Knarrer, hölzern-faserig
    const v = mk(R, 'seil', o, 1); if (!v) return;
    creak(v, t, { d: 0.55, f: 80, f2: 110, bp: 900 }); creak(v, t + 0.5, { d: 0.7, f: 105, f2: 78, bp: 760, k: 0.8 }); creak(v, t + 1.15, { d: 0.4, f: 90, f2: 120, bp: 1000, k: 0.6 });
    v.nz(t, { f: 1800, q: 0.7, a: 0.1, d: 1.2, peak: 0.03 });
  },
  wasser(R, t, o) { // plätscherndes, fließendes Wasser (ca. 1.5 s): Rauschen mit Blubbern, kleine Tropfen
    const v = mk(R, 'wasser', o, 1); if (!v) return; const d = o.dur || 1.5, e = t + d + 0.3;
    const n = v.noise('pink', t, e), bp = v.f('bandpass', 1100, 0.8), g = v.g(0), m = v.noise('pink', t, e), ml = v.f('lowpass', 14, 0.7), mg = v.g(0.5); n.connect(bp); bp.connect(g); g.connect(v.out);
    env(g.gain, t, [[0, 0], [0.2, 0.34], [d - 0.1, 0.34], [d + 0.25, 0]]); m.connect(ml); ml.connect(mg); mg.connect(g.gain); // zufälliges Auf und Ab = Blubbern
    v.nz(t, { kind: 'white', type: 'highpass', f: 4200, a: 0.25, d: d - 0.2, peak: 0.05 });
    for (let i = 0; i < 9; i++) { const s = t + 0.05 + R.rng() * (d - 0.1), f = 500 + R.rng() * 1200; v.tone(s, { f, f2: f * 1.5, gl: 0.05, a: 0.003, d: 0.06, peak: 0.14 }); }
  },
  muenze(R, t, o) { const v = mk(R, 'muenze', o, 1); if (!v) return; coin(v, t, {}); coin(v, t + 0.085, { p: 1.12, k: 0.7 }); coin(v, t + 0.17, { p: 0.94, k: 0.5 }); v.send(0.25); }, // klimpernde Denare
  griffel(R, t, o) { // Griffel kratzt über die Wachstafel
    const v = mk(R, 'griffel', o, 0); if (!v) return; const n = 4 + ((R.rng() * 3) | 0); let s = t;
    for (let i = 0; i < n; i++) { const d = 0.05 + R.rng() * 0.06; v.nz(s, { kind: 'white', f: 3800 + R.rng() * 1500, q: 0.9, a: 0.006, d, peak: 0.3 }); v.nz(s, { kind: 'white', type: 'highpass', f: 6000, a: 0.004, d: d * 0.7, peak: 0.08 }); s += d + 0.04 + R.rng() * 0.05; }
  },
  menge(R, t, o) { // Menschenmenge jubelt: „Aaah“-Schwall mit Beifall (ca. 2.6 s)
    const v = mk(R, 'menge', o, 2); if (!v) return; const d = o.dur || 2.6, N = R.low ? 5 : 8, e = t + d + 0.3;
    for (let i = 0; i < N; i++) {
      const f0 = 110 + R.rng() * 120, s0 = t + R.rng() * 0.25, osc = v.osc('sawtooth', f0, s0, e);
      osc.frequency.setValueAtTime(f0, s0); osc.frequency.linearRampToValueAtTime(f0 * 1.12, s0 + 0.5); osc.frequency.linearRampToValueAtTime(f0 * 0.95, t + d); v.vib(osc, 5.5 + R.rng() * 2, f0 * 0.02, s0, e);
      const f1 = v.f('bandpass', 700 + R.rng() * 200, 3), f2 = v.f('bandpass', 1250 + R.rng() * 300, 3.5), g = v.g(0), m = v.g(0.3);
      osc.connect(f1); osc.connect(f2); f1.connect(m); f2.connect(m); m.connect(g); g.connect(v.out); env(g.gain, s0, [[0, 0], [0.7, 0.5], [d - 0.4, 0.45], [d + 0.2, 0]]);
    }
    v.nz(t, { f: 2600, q: 0.6, a: 0.5, d: d - 0.4, peak: 0.08 });
    for (let i = 0; i < (R.low ? 8 : 16); i++) v.nz(t + 0.3 + R.rng() * (d - 0.6), { kind: 'white', f: 1800 + R.rng() * 2200, q: 1.2, a: 0.001, d: 0.012 + R.rng() * 0.01, peak: 0.05 + R.rng() * 0.05 }); // Klatschen
    v.send(0.3);
  },
  kran(R, t, o) { // Tretradkran hebt eine Last: Holztritte, Seilknarren, zum Schluss ein Klack
    const v = mk(R, 'kran', o, 2); if (!v) return;
    for (let i = 0; i < 4; i++) { const s = t + i * 0.5; hammerHit(v, s, { k: 0.5, p: 0.55 }); v.nz(s, { f: 300, q: 1, a: 0.01, d: 0.12, peak: 0.12 }); }
    creak(v, t, { d: 1.6, f: 70, f2: 130, bp: 700, k: 0.9 }); creak(v, t + 1.5, { d: 0.5, f: 120, f2: 95, bp: 820, k: 0.6 });
    v.tone(t + 2.05, { f: 110, f2: 70, a: 0.004, d: 0.12, peak: 0.4 }); hammerHit(v, t + 2.05, { k: 0.5, p: 0.8 });
  },
  rad(R, t, o) { // Tretrad/Kurbel: kurzes Ratschen aus Holzzähnen mit leisem Rollen (o.v 0…1 → Tonhöhe); für Kurbeln und Schieber geeignet
    const v = mk(R, 'rad', o, 0); if (!v) return; const x = clamp(o.v ?? 0.5, 0, 1), p = 0.85 + 0.3 * x;
    for (let i = 0; i < 3; i++) hammerHit(v, t + i * 0.055, { k: 0.45 - i * 0.08, p: p * (1 + i * 0.03) });
    v.nz(t, { kind: 'brown', type: 'lowpass', f: 260, a: 0.02, d: 0.22, peak: 0.28 }); v.nz(t + 0.01, { f: 900, q: 0.8, a: 0.03, d: 0.2, peak: 0.06 });
  },
  kutsche(R, t, o) { // Pferdekarren fährt vorbei (ca. 2.6 s): Hufe, rumpelnde Räder, Geschirr; zieht durchs Stereobild
    const v = mk(R, 'kutsche', o, 1); if (!v) return; const d = 2.6;
    if (o.pan == null) v.panSweep(-0.7, 0.7, t, t + d);
    for (let i = 0; i < 8; i++) { const s = t + i * 0.31 + (R.rng() - 0.5) * 0.01, k = 0.25 + 0.75 * Math.sin((Math.PI * (i + 0.5)) / 8), p = i & 1 ? 0.82 : 1; v.tone(s, { f: 520 * p, f2: 360 * p, a: 0.002, d: 0.07, peak: 0.4 * k }); v.nz(s, { f: 1500 * p, q: 1.4, a: 0.002, d: 0.03, peak: 0.3 * k }); v.tone(s, { f: 150 * p, a: 0.003, d: 0.06, peak: 0.15 * k }); }
    v.nz(t, { type: 'bandpass', f: 260, q: 0.6, a: 1.0, d: 1.5, peak: 0.4 }); v.nz(t + 0.2, { f: 800, q: 0.8, a: 1.0, d: 1.2, peak: 0.08 });
    for (let i = 0; i < 7; i++) { const s = t + 0.2 + i * 0.33 + R.rng() * 0.05; v.bell(s, 4200 + R.rng() * 1200, [[1, 1, 0.08], [2.4, 0.4, 0.04]], 0.03 * Math.sin((Math.PI * (i + 0.5)) / 7)); }
  },
  feuer(R, t, o) { // Signalfeuer / Herd (ca. 2.2 s): fauchendes Aufflammen, Knistern
    const v = mk(R, 'feuer', o, 1); if (!v) return; const d = o.dur || 2.2;
    v.nz(t, { kind: 'brown', type: 'lowpass', f: 420, a: 0.35, d: d - 0.3, peak: 0.3 }); v.nz(t, { f: 300, f2: 900, q: 0.8, a: 0.2, d: 0.5, peak: 0.18 });
    for (let i = 0; i < 16; i++) { const s = t + 0.1 + R.rng() * (d - 0.3), big = R.rng() < 0.25; v.nz(s, { kind: 'white', f: 1200 + R.rng() * 3800, q: 1.8, a: 0.001, d: 0.004 + R.rng() * 0.012, peak: big ? 0.3 : 0.14 }); if (big) v.tone(s, { f: 700 + R.rng() * 500, f2: 400, a: 0.001, d: 0.02, peak: 0.07 }); }
  },
  schiff(R, t, o) { // Handelsschiff legt an/ab (ca. 2.8 s): Rumpfknarren, Wellenklatschen, Tuchschlag; zieht durchs Stereobild
    const v = mk(R, 'schiff', o, 1); if (!v) return; const d = 2.8;
    if (o.pan == null) v.panSweep(-0.5, 0.5, t, t + d);
    creak(v, t, { d: 0.7, f: 70, f2: 95, bp: 600, k: 0.8 }); creak(v, t + 0.95, { d: 0.8, f: 95, f2: 70, bp: 720, k: 0.7 }); creak(v, t + 1.9, { d: 0.6, f: 78, f2: 100, bp: 640, k: 0.6 });
    const lap = v.noise('pink', t, t + d + 0.2), lp = v.f('lowpass', 520, 0.6), lg = v.g(0), l = v.osc('sine', 0.62, t, t + d + 0.2), lm = v.g(0.25); lap.connect(lp); lp.connect(lg); lg.connect(v.out); l.connect(lm); lm.connect(lg.gain);
    env(lg.gain, t, [[0, 0], [0.5, 0.3], [d - 0.3, 0.3], [d, 0]]);
    for (let i = 0; i < 2; i++) v.nz(t + 0.4 + i * 1.2, { type: 'lowpass', f: 1000, f2: 400, q: 0.8, a: 0.03, d: 0.14, peak: 0.12 });
  },
  ruder(R, t, o) { // Ruderschläge (3, ca. 2.7 s): Dolle klackt, Blatt taucht ein, Tropfen
    const v = mk(R, 'ruder', o, 1); if (!v) return; const n = clamp(o.n || 3, 1, 5);
    for (let i = 0; i < n; i++) {
      const s = t + i * 0.9; hammerHit(v, s, { k: 0.4, p: 0.62 });
      v.nz(s + 0.12, { f: 900, f2: 400, q: 0.7, a: 0.05, d: 0.32, peak: 0.3 }); v.nz(s + 0.25, { type: 'lowpass', f: 700, a: 0.12, d: 0.4, peak: 0.16 });
      for (let k = 0; k < 3; k++) { const f = 1200 + R.rng() * 1000; v.tone(s + 0.45 + R.rng() * 0.3, { f, f2: f * 1.5, gl: 0.03, a: 0.002, d: 0.04, peak: 0.07 }); }
    }
  },
  honk(R, t, o) { // freundliches Gänse-„Hoonk“ (o.n = Gans 1…8 bestimmt die Tonhöhe, sonst Zufall)
    const v = mk(R, 'honk', o, 2); if (!v) return; const F = gooseF(o.n ?? 1 + ((R.rng() * 8) | 0));
    vocal(v, t, gooseSyl(F, 0, 0.42, 0.95, 0.82), v.out); vocal(v, t + 0.5, gooseSyl(F, 0, 0.3, 1.0, 0.85), v.out);
  },
};
export const SFX_NAMES = Object.keys(SFX);

/** Nur für Atmosphären: zusätzliche Ereignis-Klänge (nicht über sfx() abrufbar). Gleiche Form wie SFX; Schlüssel 'ev:<name>' in levels.js. */
const mkEv = (R, name, o = {}, prio = 0) => { const v = R.voice(o.prio ?? prio, o.dest || 'fx', 'ev:' + name); if (!v) return null; v.setup({ gain: o.gain, dist: o.dist, lpHi: o.lpHi, pan: o.pan }); return v; };
export const EV = {
  schaf(R, t, o) { // Schafglöckchen: ein bis drei „tonk“, unregelmäßig wie beim Weiden
    const v = mkEv(R, 'schaf', o); if (!v) return; const f = 700 + R.rng() * 700, n = 1 + ((R.rng() * 3) | 0); let s = t;
    for (let i = 0; i < n; i++) { sheepBell(v, s, { f: f * (0.9 + R.rng() * 0.2), k: 1 - i * 0.2 }); s += 0.16 + R.rng() * 0.3; } v.send(0.3);
  },
  taube(R, t, o) { const v = mkEv(R, 'taube', o); if (!v) return; coo(v, t, { f: 360 + R.rng() * 90 }); v.send(0.2); }, // Taubengurren
  kinder(R, t, o) { // Kinderlachen: zwei Kinder, 4–7 kurze „ha“-Silben, die Tonhöhe fällt, die Stimmen sind leicht versetzt
    const v = mkEv(R, 'kinder', o); if (!v) return; const n = 4 + ((R.rng() * 4) | 0);
    for (const [dt, p, g] of [[0, 1, 1], [0.07, 1.2, 0.7]]) {
      const f0 = (470 + R.rng() * 160) * p;
      for (let i = 0; i < n; i++) vocal(v, t + dt + i * (0.115 + R.rng() * 0.03), { d: 0.075, f: [[0, f0 * (1.05 - i * 0.03)], [1, f0 * (0.9 - i * 0.03)]], nz: 0.35, low: 0, jit: 0.02, g: g * (1 - i * 0.07), lp: 5200, F: [[[850, 750], 5, 1], [[1500, 1650], 5, 0.6], [3100, 5, 0.15]] }, v.out);
    }
    v.send(0.25);
  },
  klirr(R, t, o) { // leises Metallklirren der Ausrüstung (Panzer, Schnallen)
    const v = mkEv(R, 'klirr', o); if (!v) return; const n = 2 + ((R.rng() * 4) | 0);
    for (let i = 0; i < n; i++) v.bell(t + i * (0.02 + R.rng() * 0.05), 3200 + R.rng() * 3200, [[1, 1, 0.09], [2.4, 0.4, 0.05]], 0.3 * (0.6 + R.rng() * 0.4));
  },
  tok(R, t, o) { // ein Tritt im Tretrad: hohler Holzton mit kurzem Knarren; o.p Tonhöhenfaktor
    const v = mkEv(R, 'tok', o, 1); if (!v) return; const p = o.p ?? 1;
    hammerHit(v, t, { k: 0.8, p: 0.5 * p }); v.nz(t, { f: 260 * p, q: 1, a: 0.01, d: 0.14, peak: 0.12 }); creak(v, t + 0.04, { d: 0.35, f: 70, f2: 90, bp: 700, k: 0.3 });
  },
};
export const EV_NAMES = Object.keys(EV);

/** Mindestabstand je Name (s), damit häufiges Aufrufen (Ziehen, Schritte) nicht zuklebt. */
export const GAP = {
  turn: 0.15, lift: 0.1, land: 0.1, grab: 0.1, snap: 0.06, card: 0.1, found: 0.3, tick: 0.035, gong: 0.5, slide: 0.05, flapOpen: 0.2, flapClose: 0.2, pop: 0.06,
  footstep: 0.08, stomp: 0.15, swing: 0.25, flap: 0.12, splash: 0.1, bubble: 0.06, dive: 0.3, wave: 0.4, chomp: 0.12, crack: 0.04, splinter: 0.08, peep: 0.06,
  hatch: 0.2, whoosh: 0.3, rumble: 0.5, impact: 0.5, thud: 0.06, chime: 0.08, grow: 0.4, rustle: 0.12, horn: 0.8, tapp: 0.07, fossil: 0.2, woodcrack: 0.15, ping: 0.08,
  musicbox: 2, tinnitus: 2, tweet: 0.1,
  cornu: 0.8, tuba: 0.6, fanfare: 2, trommel: 0.1, marsch: 0.4, hammer: 0.3, saege: 0.4, seil: 0.3, wasser: 0.4, muenze: 0.12, griffel: 0.25, menge: 1,
  kran: 0.6, rad: 0.1, kutsche: 1.5, feuer: 0.8, schiff: 1.5, ruder: 1, honk: 0.25,
};
/** Spitzenpegel-Ziele (dBFS, Rohsignal vor Lautstärke-Regler und Limiter) – Standard −8; kleine, häufige Geräusche leiser. Werte > −6 gibt es nicht. */
export const PEAK = {
  tinnitus: -27, slide: -11, footstep: -11, tapp: -12, tick: -10, bubble: -12, rustle: -11, musicbox: -10, chime: -10, ping: -10, lift: -10, grab: -10, snap: -9, flapOpen: -9, flapClose: -9,
  card: -11, splinter: -10, peep: -10, pop: -9, impact: -9, marsch: -10, hammer: -9, saege: -10, seil: -10, griffel: -12, rad: -11, muenze: -9, wasser: -10, menge: -9, trommel: -9, feuer: -10,
  kutsche: -9, schiff: -10, ruder: -10, kran: -9, hatch: -9, horn: -9, gong: -8.5, cornu: -9.2, tuba: -9.2, fanfare: -9.2, // Hörner: im Modus „Kräftigere Klänge“ kommen ca. +2.6 dB dazu (bleibt unter −6)
};
export const PEAK_DEFAULT = -8;
