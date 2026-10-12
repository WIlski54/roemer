// Station 5: Regler „Tagesablauf“ – Lichtstimmungen (Morgen, Mittag, Abend), Himmelsfarben und Sonnenbahn.
import { mood } from '../engine/scene.js';
import { clamp, lerp, smooth } from '../engine/util.js';
import { cloneMood, blendMood } from './_p5_kit.js';

// Lichtstimmungen: Der Hauptstrahler wandert von links (Morgen, lange Schatten nach rechts) über hoch oben (Mittag) nach rechts (Abend, Schatten nach links).
export const MORGEN = mood({ key: '#ffd3a0', keyI: 3.0, sky: '#ffe8cf', gnd: '#8a5a44', hemiI: 1.55, pos: [-17, 8.8, 5.5], rim: 0.1 });
export const MITTAG = mood({ key: '#fff1d6', keyI: 2.45, sky: '#fff4e4', gnd: '#7a5236', hemiI: 1.8, pos: [-5, 23, 9], rim: 0.0 });
export const ABEND = mood({ key: '#ffa866', keyI: 3.1, sky: '#ffd8b8', gnd: '#8a4a3a', hemiI: 1.62, pos: [17, 8.2, 5.5], rim: 0.28 });
export const TAG0 = 0.4;                                    // Reglerstellung beim Aufschlagen: später Vormittag

export function moodAt(u, out) {
  u = clamp(u); out = out || cloneMood(MITTAG);
  if (u <= 0.5) blendMood(out, MORGEN, MITTAG, smooth(u / 0.5)); else blendMood(out, MITTAG, ABEND, smooth((u - 0.5) / 0.5));
  return out;
}
export const MOOD_START = moodAt(TAG0);

// Anteile für die Himmels-Überblendungen
export const dawnK = (u) => smooth(clamp(1 - u / 0.34));
export const duskK = (u) => smooth(clamp((u - 0.58) / 0.42));
// Sonnenbahn (Seitenkoordinaten): steigt links hinter den Hügeln auf, steht mittags hoch, geht rechts unter
export function sunPos(u) { return { x: lerp(-9.4, 9.4, clamp(u)), y: 1.0 + 2.3 * Math.pow(Math.sin(Math.PI * clamp(u)), 0.85) }; }
// Farbton der Sonnenscheibe und des Scheins: tief orange am Rand des Tages, mittags hellgelb
export function sunTint(u, out = [1, 1, 1]) { const e = Math.abs(clamp(u) - 0.5) * 2; const k = Math.pow(e, 1.5); out[0] = 1; out[1] = lerp(1, 0.66, k); out[2] = lerp(1, 0.46, k); return out; }
