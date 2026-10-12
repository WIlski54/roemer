// Zeitrad: lineare Zeitachse 753 v. Chr. bis 476 n. Chr. (es gibt kein Jahr 0).
// Jahre werden vorzeichenbehaftet gespeichert: v. Chr. = negativ (−753), n. Chr. = positiv (476).
export const Y_MIN = -753, Y_MAX = 476;
const N_MAX = 752 + 476; // Anzahl Schritte von 753 v. Chr. bis 476 n. Chr.
const toN = (y) => (y < 0 ? 753 + y : 752 + y);
const fromN = (n) => { n = Math.round(n); return n <= 752 ? n - 753 : n - 752; };
export const valueOfYear = (y) => Math.max(0, Math.min(1, toN(y) / N_MAX));   // Jahr -> Zeigerstellung 0..1
export const yearOfValue = (v) => fromN(Math.max(0, Math.min(1, v)) * N_MAX); // Zeigerstellung 0..1 -> Jahr
export function fmtYear(y) { return y < 0 ? `${-y} v. Chr.` : `${y} n. Chr.`; }
export const ERAS = [
  { name: 'Königszeit', from: -753, to: -509, col: '#c8693a' },
  { name: 'Republik', from: -509, to: -27, col: '#8b2a4a' },
  { name: 'Kaiserzeit', from: -27, to: 284, col: '#c99a2e' },
  { name: 'Spätantike', from: 284, to: 476, col: '#3d6e9e' },
];
export const eraOf = (y) => (ERAS.find((e) => y < e.to) || ERAS[ERAS.length - 1]);
// Ereignisse für die Anzeige am Zeitrad (nur Jahre, die im Buch vorkommen)
export const EVENTS = [
  { y: -753, label: 'Rom wird gegründet (nach der Sage)' },
  { y: -509, label: 'Die Römer jagen ihren König fort' },
  { y: -218, label: 'Hannibal zieht über die Alpen' },
  { y: -146, label: 'Karthago fällt' },
  { y: -27, label: 'Augustus wird erster Kaiser' },
  { y: 79, label: 'Der Vesuv und Pompeji' },
  { y: 80, label: 'Das Kolosseum wird eingeweiht' },
  { y: 117, label: 'Größte Ausdehnung des Reiches' },
  { y: 313, label: 'Christen dürfen ihren Glauben frei leben' },
  { y: 395, label: 'Das Reich wird geteilt' },
  { y: 476, label: 'Das Ende des Kaisers im Westen' },
];
