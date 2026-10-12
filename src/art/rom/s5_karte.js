// Station 5: Reichskarte „um 117 n. Chr.“ als Bildkarte (Canvas). Küstenlinien und grobe Gebietsgrenzen sind aus der Titelseiten-Karte
// (rom/titel_karte.js) KOPIERT (Station 5 ändert gemeinsame Dateien nicht). Kinderbuch-Stil: erkennbare Form, keine Landesgrenzen im Detail.
// createKarte() -> { canvas, W, H, draw(v), rMax }: v = 0..1 lässt das Reich von Rom aus „nachzeichnen“ (Kreis wächst, Rand wird gezogen).
// Kein THREE hier: das Canvas wird in der Seite als Textur auf eine Kartentafel gelegt.
import ClipperLib from 'clipper-lib';

const SC = 1000; // Grad -> Clipper-Ganzzahl
const P = (pts) => pts.map(([x, y]) => ({ X: Math.round(x * SC), Y: Math.round(y * SC) }));
const fromP = (path) => path.map((q) => [q.X / SC, q.Y / SC]);

function op(type, subj, clip) {
  const c = new ClipperLib.Clipper();
  for (const s of subj) c.AddPath(s, ClipperLib.PolyType.ptSubject, true);
  for (const s of clip) c.AddPath(s, ClipperLib.PolyType.ptClip, true);
  const out = new ClipperLib.Paths();
  c.Execute(type, out, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  return out;
}
const union = (a, b) => op(ClipperLib.ClipType.ctUnion, a, b);
const diff = (a, b) => op(ClipperLib.ClipType.ctDifference, a, b);
const inter = (a, b) => op(ClipperLib.ClipType.ctIntersection, a, b);
const paths = (...rings) => rings.map((r) => P(r));

// ---- Rahmen (Grad)
const LON0 = -10.5, LON1 = 40.5, LAT0 = 29.8, LAT1 = 54.8;
const FRAME = [[LON0, LAT0], [LON1, LAT0], [LON1, LAT1], [LON0, LAT1]];

// ---- Meere
const MED = [
  [-6.1, 35.9], [-6.1, 36.15], [-5.4, 36.0], [-4.4, 36.7], [-2.4, 36.75], [-1.6, 37.2], [-0.7, 37.6], [0.1, 38.7], [-0.3, 39.5], [0.3, 40.2], [0.9, 40.7], [1.3, 41.1], [2.2, 41.4], [3.2, 41.9], [3.3, 42.3],
  [3.0, 43.1], [4.0, 43.5], [4.8, 43.4], [5.4, 43.3], [6.2, 43.1], [7.3, 43.7], [8.1, 43.9], [8.9, 44.4], [9.8, 44.1], [10.3, 43.5], [10.6, 42.9], [11.1, 42.4], [11.8, 42.1], [12.4, 41.7], [13.1, 41.3], [13.7, 41.2],
  [14.2, 40.8], [14.5, 40.6], [15.0, 40.6], [15.3, 40.0], [15.8, 39.9], [16.0, 39.35], [15.8, 38.7], [15.65, 38.1], [16.0, 37.95], [16.5, 38.4], [16.55, 38.9], [17.1, 39.0], [16.7, 39.7], [17.2, 40.4], [17.9, 40.3],
  [18.4, 39.8], [18.5, 40.15], [18.0, 40.65], [16.9, 41.1], [16.1, 41.45], [16.2, 41.95], [15.4, 41.9], [14.6, 42.0], [14.2, 42.45], [13.7, 42.9], [13.5, 43.6], [12.7, 44.0], [12.3, 44.5], [12.3, 45.0], [12.4, 45.3],
  [13.0, 45.65], [13.75, 45.65], [13.6, 45.1], [13.85, 44.85], [14.2, 44.95], [14.4, 45.3], [14.5, 45.0], [15.2, 44.1], [16.0, 43.55], [16.4, 43.5], [17.2, 43.0], [18.1, 42.65], [18.7, 42.4], [19.3, 41.85], [19.45, 41.3],
  [19.4, 40.45], [19.9, 39.8], [20.2, 39.5], [20.7, 39.0], [21.1, 38.8], [21.7, 38.3], [21.4, 37.9], [21.7, 37.2], [21.7, 36.8], [22.5, 36.4], [23.1, 36.45], [22.9, 36.9], [22.7, 37.5], [23.1, 37.95], [23.5, 37.9],
  [24.0, 37.7], [24.1, 38.0], [23.9, 38.4], [23.4, 38.6], [23.0, 39.3], [22.8, 39.8], [22.7, 40.3], [22.9, 40.6], [23.9, 40.6], [24.4, 40.9], [25.4, 40.95], [26.1, 40.8], [26.3, 40.4], [26.2, 40.0], [26.2, 39.9],
  [26.7, 39.0], [26.9, 38.4], [27.1, 38.2], [27.4, 37.1], [28.2, 36.8], [29.1, 36.6], [30.0, 36.2], [30.6, 36.85], [31.5, 36.7], [32.0, 36.5], [32.8, 36.05], [33.6, 36.15], [34.6, 36.75], [35.4, 36.6], [36.2, 36.6],
  [35.9, 35.8], [35.8, 35.2], [35.9, 34.6], [35.5, 33.9], [35.2, 33.2], [34.95, 32.8], [34.5, 31.9], [34.2, 31.3], [33.3, 31.1], [32.3, 31.25], [31.5, 31.5], [30.7, 31.5], [29.9, 31.2], [28.9, 30.9], [27.2, 31.3],
  [25.2, 31.6], [24.1, 32.0], [23.0, 32.65], [22.0, 32.9], [21.0, 32.8], [20.1, 32.1], [20.5, 30.9], [19.3, 30.3], [18.0, 30.45], [16.6, 31.2], [15.1, 32.4], [14.0, 32.7], [13.2, 32.9], [12.0, 32.9], [11.0, 33.6],
  [10.1, 33.9], [10.4, 34.4], [10.8, 34.7], [10.5, 35.5], [11.05, 36.0], [11.0, 37.05], [10.3, 36.8], [10.2, 37.3], [9.4, 37.3], [8.6, 36.95], [7.8, 36.9], [6.5, 37.0], [5.1, 36.7], [3.1, 36.8],
  [1.2, 36.5], [0.0, 35.9], [-0.65, 35.75], [-1.8, 35.1], [-2.95, 35.3], [-4.4, 35.2], [-5.3, 35.85],
];
const BLACK = [[29.1, 41.2], [27.5, 42.5], [27.9, 43.2], [28.65, 44.2], [29.7, 45.2], [30.7, 46.5], [32.5, 46.7], [33.5, 46.0], [33.7, 44.6], [35.5, 45.2], [36.5, 45.4], [37.5, 44.8], [38.5, 44.3], [39.7, 43.4], [41.6, 42.0], [41.6, 41.5],
  [39.7, 41.0], [37.0, 41.1], [35.1, 42.0], [33.0, 42.0], [31.5, 41.1]];
const ATLANTIC = [[-11, 29.6], [-9.8, 29.6], [-9.6, 30.4], [-9.8, 31.5], [-7.6, 33.6], [-6.8, 34.0], [-6.2, 35.2], [-5.9, 35.8], [-5.6, 36.0], [-6.3, 36.5], [-7.0, 37.2], [-7.9, 37.0], [-9.0, 37.0], [-9.5, 38.7], [-8.8, 41.1],
  [-8.9, 42.2], [-9.3, 43.0], [-8.3, 43.4], [-7.0, 43.75], [-5.0, 43.5], [-3.5, 43.5], [-1.8, 43.4], [-1.3, 44.5], [-1.2, 46.0], [-2.2, 47.2], [-3.0, 47.6], [-4.7, 47.9], [-4.7, 48.5], [-3.0, 48.8], [-1.6, 48.7],
  [-1.6, 49.6], [-0.2, 49.3], [1.2, 49.9], [1.6, 50.8], [2.5, 51.1], [3.4, 51.4], [4.2, 52.0], [4.7, 52.8], [5.0, 53.3], [6.8, 53.4], [8.4, 53.6], [8.7, 54.0], [8.6, 55.0], [8.2, 55.6], [-11, 55.6]];
const BALTIC = [[10.2, 55.6], [10.0, 54.9], [10.9, 54.3], [12.5, 54.4], [14.0, 54.0], [16.0, 54.5], [18.6, 54.7], [19.9, 54.45], [21.2, 55.2], [22.5, 55.6]];

// ---- Inseln und Britannien
const SICILY = [[12.45, 37.8], [13.0, 38.1], [13.4, 38.15], [14.1, 38.0], [15.0, 38.1], [15.65, 38.25], [15.2, 37.5], [15.3, 37.0], [15.0, 36.7], [14.4, 36.9], [13.6, 37.1], [12.7, 37.55]];
const SARDINIA = [[8.2, 40.9], [8.3, 40.3], [8.4, 39.6], [8.5, 39.0], [8.9, 38.9], [9.6, 39.1], [9.6, 39.9], [9.8, 40.5], [9.6, 41.0], [9.2, 41.25], [8.5, 41.0]];
const CORSICA = [[8.6, 42.4], [9.35, 43.0], [9.5, 42.6], [9.4, 41.9], [9.2, 41.4], [8.7, 41.6], [8.6, 42.1]];
const CRETE = [[23.5, 35.3], [24.3, 35.45], [25.2, 35.35], [26.2, 35.2], [26.3, 35.0], [25.0, 34.95], [24.0, 35.1]];
const CYPRUS = [[32.3, 35.05], [32.4, 34.7], [33.0, 34.65], [34.0, 34.97], [34.6, 35.7], [33.5, 35.35], [32.9, 35.4], [32.3, 35.1]];
const MALLORCA = [[2.4, 39.55], [3.0, 39.9], [3.45, 39.7], [3.1, 39.3], [2.6, 39.35]];
const BRITAIN = [[-5.7, 50.1], [-3.5, 50.2], [-1.2, 50.7], [0.8, 50.8], [1.4, 51.3], [0.5, 51.5], [1.7, 52.6], [0.3, 52.9], [0.2, 53.6], [-0.2, 54.0], [-1.2, 54.6], [-1.6, 55.5], [-2.1, 55.9], [-3.0, 55.9],
  [-5.0, 55.0], [-3.2, 54.7], [-3.0, 53.4], [-4.6, 53.2], [-4.3, 52.1], [-5.2, 51.8], [-3.1, 51.4], [-4.2, 51.2]];
const IRELAND = [[-10, 51.7], [-8.4, 51.6], [-6.3, 52.2], [-6.0, 53.3], [-6.1, 54.0], [-5.6, 54.5], [-6.2, 55.2], [-7.5, 55.3], [-8.6, 54.6], [-10.1, 54.2], [-9.9, 53.3], [-9.4, 52.2]];

// ---- Gebiete (grobe Binnengrenzen; die Küste kommt aus dem Land selbst)
const ell = (cx, cy, rx, ry, n = 20) => Array.from({ length: n }, (_, i) => { const a = (i / n) * 6.2832; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const REG = {
  rom: ell(12.55, 41.85, 0.95, 0.75),
  italia: [[7.5, 44.0], [10.2, 44.4], [12.5, 44.6], [13.3, 44.0], [14.5, 42.6], [16.0, 41.7], [17.9, 40.2], [19, 39.0], [19, 37.6], [7.5, 37.6]],
  nordit: [[6.8, 43.6], [6.8, 46.4], [13.8, 46.7], [14.0, 45.3], [13.3, 44.6], [12.5, 44.6], [10.2, 44.4], [7.5, 44.0]],
  hispanien: [[-11, 36.0], [-6.5, 35.9], [-2.0, 36.3], [3.4, 38.0], [3.4, 42.5], [0.5, 42.7], [-1.8, 43.4], [-11, 44.5]],
  afrika: [[7.4, 37.8], [11.8, 37.8], [19.0, 33.6], [19.0, 29.5], [9.5, 29.5], [7.4, 33]],
  griechenland: [[18.2, 42.9], [26.6, 42.0], [26.6, 34.5], [18.2, 34.5]],
  asia: [[25.8, 35.8], [25.8, 41.3], [30.3, 41.3], [30.3, 36.0]],
  narbo: [[2.8, 42.3], [2.8, 43.9], [4.6, 45.4], [7.3, 44.9], [7.3, 43.0]],
  gallien: [[-6, 43.2], [-6, 51.8], [2.5, 51.8], [6.3, 51.9], [8.1, 50.3], [8.1, 47.6], [7.3, 46.3], [7.3, 44.9], [4.6, 45.4], [2.8, 43.9], [2.8, 42.3], [-1.8, 43.4]],
  orient: [[25.8, 35.3], [25.8, 43.5], [41.5, 43.5], [41.5, 29.5], [19.0, 29.5], [19.0, 33.0]],
  nordafrika: [[-11, 29.5], [7.4, 29.5], [7.4, 38], [-11, 38]],
  donau: [[6.8, 46.4], [8.5, 47.7], [10, 48.3], [13, 48.8], [17, 48.2], [19.2, 47.8], [21.0, 45.3], [22.5, 44.7], [25.0, 43.9], [28.7, 44.2], [28.7, 38.0], [6.8, 38.0]],
  dakien: [[21.0, 45.3], [22.5, 44.7], [25.0, 43.9], [28.7, 44.2], [28.7, 46.6], [27.0, 48.0], [24.5, 48.2], [22.4, 47.6], [21.0, 46.6]],
};
// Reihenfolge = Reihenfolge des Auftauchens. group = Stufe der Karte (0..4), from = Jahr (negativ = v. Chr.), mainOnly: Inseln nicht mitnehmen
const PIECES = [
  { id: 'rom', group: 0, from: -753, mainOnly: true },
  { id: 'italia', group: 1, from: -264, mainOnly: true },
  { id: 'inseln', group: 2, from: -146, islands: true },
  { id: 'nordit', group: 2, from: -146, mainOnly: true },
  { id: 'hispanien', group: 2, from: -146 },
  { id: 'afrika', group: 2, from: -146, mainOnly: true },
  { id: 'griechenland', group: 2, from: -146 },
  { id: 'asia', group: 2, from: -146, mainOnly: true },
  { id: 'narbo', group: 2, from: -146, mainOnly: true },
  { id: 'gallien', group: 3, from: -51 },
  { id: 'orient', group: 3, from: -30 },
  { id: 'nordafrika', group: 3, from: -30, mainOnly: true },
  { id: 'donau', group: 3, from: -9 },
  { id: 'britannia', group: 3, from: 43, britain: true },
  { id: 'dakien', group: 4, from: 117 },
];


// ================================================================================================ Bildkarte
const TAU = Math.PI * 2;
const SERIF = "Georgia,'Palatino Linotype',Palatino,'Book Antiqua',serif";
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (t) => t * t * (3 - 2 * t);

// Namen auf der Karte: [Länge, Breite, Text, Größe]
const LABELS = [
  [-3.0, 53.1, 'Britannien', 27], [1.6, 47.4, 'Gallien', 29], [-5.6, 39.6, 'Hispanien', 28], [3.2, 32.4, 'Nordafrika', 27],
  [23.5, 46.0, 'Dakien', 26], [31.5, 39.0, 'Kleinasien', 26], [20.2, 38.7, 'Griechenland', 22], [27.6, 30.6, 'Ägypten', 25], [35.2, 30.9, 'Naher Osten', 23],
  [12.4, 45.3, 'Italien', 26],
];

export function createKarte({ W = 1100, H = 820 } = {}) {
  // ---- Geografie vorbereiten
  const frame = paths(FRAME);
  const water = union(union(paths(MED), paths(BLACK)), union(paths(ATLANTIC), paths(BALTIC)));
  const mainland = diff(frame, water);
  const isl = union(union(union(paths(SICILY), paths(SARDINIA)), union(paths(CORSICA), paths(CRETE))), union(paths(CYPRUS), paths(MALLORCA)));
  const brit = inter(paths(BRITAIN), paths([[-11, 29], [41, 29], [41, 55.0], [-11, 55.0]]));   // Britannien bis zum Hadrianswall
  const landAll = union(union(mainland, isl), union(paths(BRITAIN), paths(IRELAND)));
  let taken = [], empire = [];
  for (const def of PIECES) {
    let region;
    if (def.islands) region = isl; else if (def.britain) region = brit;
    else region = inter(paths(REG[def.id]), def.mainOnly ? mainland : union(mainland, isl));
    region = diff(region, taken); taken = union(taken, region); empire = union(empire, region);
  }
  // zwei schmale Lücken der groben Gebietsgrenzen schließen (Südrand Tunesiens, Pyrenäen)
  empire = union(empire, inter(paths([[7.3, 29.5], [9.6, 29.5], [7.3, 33.1]], [[-2.2, 42.0], [3.0, 42.0], [3.0, 43.6], [-2.2, 43.6]]), mainland));
  empire = inter(empire, paths([[LON0 - 1, 20], [38.6, 20], [38.6, 60], [LON0 - 1, 60]]));    // Ostgrenze: etwa der Euphrat; Mesopotamien nur als Pfeil

  // ---- Abbildung Länge/Breite -> Pixel
  const mx0 = 46, mx1 = W - 46, my0 = 86;
  const cphi = Math.cos(((LAT0 + LAT1) / 2) * Math.PI / 180);
  const kx = (mx1 - mx0) / ((LON1 - LON0) * cphi);
  const mh = (LAT1 - LAT0) * kx, my1 = my0 + mh;
  const X = (lon) => mx0 + (lon - LON0) * cphi * kx, Y = (lat) => my0 + (LAT1 - lat) * kx;
  const toPx = (ps) => ps.map((p) => fromP(p).map(([lo, la]) => [X(lo), Y(la)]));
  const trace = (g, rings) => { g.beginPath(); for (const r of rings) { r.forEach(([x, y], i) => { if (i) g.lineTo(x, y); else g.moveTo(x, y); }); g.closePath(); } };
  const land = toPx(landAll), emp = toPx(empire);
  const romeX = X(12.5), romeY = Y(41.9);
  let rMax = 0; for (const r of emp) for (const [x, y] of r) rMax = Math.max(rMax, Math.hypot(x - romeX, y - romeY));
  rMax += 12;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };

  // ---- statische Grundkarte: Papier, Meer, Land
  const base = mk(), b = base.getContext('2d');
  b.fillStyle = '#f4e9cc'; b.fillRect(0, 0, W, H);
  const rnd = (() => { let s = 7; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; })();
  for (let i = 0; i < 500; i++) { b.fillStyle = rnd() > 0.5 ? 'rgba(150,110,60,.07)' : 'rgba(255,255,255,.25)'; b.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1 + rnd() * 3); }
  b.save(); b.beginPath(); b.rect(mx0, my0, mx1 - mx0, mh); b.clip();
  const sea = b.createLinearGradient(0, my0, 0, my1); sea.addColorStop(0, '#79a9c9'); sea.addColorStop(1, '#4b83ae');
  b.fillStyle = sea; b.fillRect(mx0, my0, mx1 - mx0, mh);
  b.strokeStyle = 'rgba(240,250,255,.34)'; b.lineWidth = 2.2; b.lineCap = 'round';
  for (let i = 0; i < 150; i++) { const x = mx0 + rnd() * (mx1 - mx0), y = my0 + rnd() * mh, l = 16 + rnd() * 18; b.beginPath(); b.moveTo(x, y); b.quadraticCurveTo(x + l * 0.25, y - 5, x + l * 0.5, y); b.quadraticCurveTo(x + l * 0.75, y + 5, x + l, y); b.stroke(); }
  // Land mit Schlagschatten wie aufgeklebtes Papier
  b.save(); b.shadowColor = 'rgba(25,45,70,.45)'; b.shadowBlur = 9; b.shadowOffsetY = 4;
  trace(b, land); b.fillStyle = '#efe0b6'; b.fill('evenodd'); b.restore();
  trace(b, land); b.clip('evenodd');
  const lg = b.createLinearGradient(0, my0, 0, my1); lg.addColorStop(0, 'rgba(255,250,225,.35)'); lg.addColorStop(1, 'rgba(190,140,80,.22)'); b.fillStyle = lg; b.fillRect(mx0, my0, mx1 - mx0, mh);
  for (let i = 0; i < 700; i++) { b.fillStyle = rnd() > 0.5 ? 'rgba(140,100,50,.10)' : 'rgba(255,255,240,.28)'; b.beginPath(); b.arc(mx0 + rnd() * (mx1 - mx0), my0 + rnd() * mh, 1 + rnd() * 3.2, 0, TAU); b.fill(); }
  b.restore();
  b.save(); b.beginPath(); b.rect(mx0, my0, mx1 - mx0, mh); b.clip(); trace(b, land); b.strokeStyle = 'rgba(110,75,40,.75)'; b.lineWidth = 2.4; b.lineJoin = 'round'; b.stroke(); b.restore();
  // Kartenrand
  b.strokeStyle = '#8a5a2a'; b.lineWidth = 4; b.strokeRect(mx0, my0, mx1 - mx0, mh);
  b.strokeStyle = 'rgba(138,90,42,.45)'; b.lineWidth = 1.5; b.strokeRect(mx0 - 8, my0 - 8, mx1 - mx0 + 16, mh + 16);
  // Titel
  b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillStyle = '#7a1f1f'; b.font = `bold 46px ${SERIF}`; b.fillText('Das Reich um 117 n. Chr.', W / 2, 48);
  // Windrose klein
  b.save(); b.translate(mx0 + 58, my1 - 58); b.fillStyle = 'rgba(255,244,210,.92)'; b.strokeStyle = 'rgba(90,55,25,.7)'; b.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) { b.rotate(Math.PI / 2); b.beginPath(); b.moveTo(0, -34); b.lineTo(8, -8); b.lineTo(-8, -8); b.closePath(); b.fill(); b.stroke(); }
  b.fillStyle = '#7a1f1f'; b.font = `bold 20px ${SERIF}`; b.fillText('N', 0, -46); b.restore();

  // ---- Reichsfläche (eigene Ebene, wird per Kreis um Rom aufgedeckt)
  const layer = mk(), l = layer.getContext('2d');
  l.save(); l.beginPath(); l.rect(mx0, my0, mx1 - mx0, mh); l.clip();
  trace(l, emp); const eg = l.createLinearGradient(mx0, 0, mx1, 0); eg.addColorStop(0, '#e0a24a'); eg.addColorStop(0.5, '#d4743c'); eg.addColorStop(1, '#c0502f');
  l.globalAlpha = 0.82; l.fillStyle = eg; l.fill('evenodd'); l.globalAlpha = 1;
  l.save(); trace(l, emp); l.clip('evenodd'); l.strokeStyle = 'rgba(255,240,200,.22)'; l.lineWidth = 3;
  for (let x = -mh; x < W; x += 15) { l.beginPath(); l.moveTo(x, my1); l.lineTo(x + mh, my0); l.stroke(); }
  l.restore();
  trace(l, emp); l.lineJoin = 'round'; l.strokeStyle = 'rgba(255,236,170,.7)'; l.lineWidth = 11; l.stroke();
  trace(l, emp); l.strokeStyle = '#7d2418'; l.lineWidth = 4.2; l.stroke();
  l.restore();

  // ---- Zeichnen
  const canvas = mk(), g = canvas.getContext('2d');
  const halo = (txt, x, y) => { g.lineWidth = 6; g.strokeStyle = 'rgba(255,248,226,.85)'; g.lineJoin = 'round'; g.strokeText(txt, x, y); g.fillText(txt, x, y); };
  function draw(v) {
    v = clamp01(v);
    const e = smooth(v), r = e * rMax;
    g.clearRect(0, 0, W, H); g.drawImage(base, 0, 0);
    g.save(); g.beginPath(); g.rect(mx0, my0, mx1 - mx0, mh); g.clip();
    if (r > 1) {
      g.save(); g.beginPath(); g.arc(romeX, romeY, r, 0, TAU); g.clip(); g.drawImage(layer, 0, 0); g.restore();
      if (v < 0.995) { g.setLineDash([14, 10]); g.lineDashOffset = -v * 360; g.strokeStyle = 'rgba(125,36,24,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(romeX, romeY, r, 0, TAU); g.stroke(); g.setLineDash([]); }
    }
    // Namen erscheinen, wenn der Kreis sie erreicht
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [lo, la, txt, sz] of LABELS) {
      const x = X(lo), y = Y(la), d = Math.hypot(x - romeX, y - romeY), a = clamp01((r - d) / 50 + 0.05);
      if (a <= 0.02) continue;
      g.globalAlpha = a; g.font = `italic bold ${sz}px ${SERIF}`; g.fillStyle = '#4a2410'; halo(txt, x, y);
    }
    g.globalAlpha = 1;
    // Rom
    g.beginPath(); g.arc(romeX, romeY, 11, 0, TAU); g.fillStyle = '#fff6da'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#7a1f1f'; g.stroke();
    g.beginPath(); g.arc(romeX, romeY, 4.5, 0, TAU); g.fillStyle = '#7a1f1f'; g.fill();
    g.font = `bold 32px ${SERIF}`; g.fillStyle = '#7a1f1f'; g.textAlign = 'left'; halo('Rom', romeX + 17, romeY + 4);
    g.restore();
    // Mesopotamien: nur als Pfeil über den Rand hinaus (kurz erobert, 115 bis 117)
    const ma = clamp01((v - 0.9) / 0.1);
    if (ma > 0.01) {
      g.save(); g.globalAlpha = ma; const ay = Y(34.3);
      g.strokeStyle = '#7d2418'; g.lineWidth = 4.5; g.setLineDash([12, 8]); g.beginPath(); g.moveTo(X(36.6), ay); g.lineTo(mx1 + 24, ay); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#7d2418'; g.beginPath(); g.moveTo(mx1 + 38, ay); g.lineTo(mx1 + 16, ay - 12); g.lineTo(mx1 + 16, ay + 12); g.closePath(); g.fill();
      g.textAlign = 'right'; g.font = `italic bold 24px ${SERIF}`; g.fillStyle = '#4a2410'; halo('Mesopotamien', mx1 - 10, ay - 30); g.font = `italic 21px ${SERIF}`; halo('nur 115 bis 117', mx1 - 10, ay + 30);
      g.restore();
    }
    // Fußzeile
    g.textAlign = 'left'; g.textBaseline = 'middle';
    g.fillStyle = '#d4743c'; g.fillRect(mx0 + 100, my1 + 30, 38, 24); g.strokeStyle = '#7d2418'; g.lineWidth = 3; g.strokeRect(mx0 + 100, my1 + 30, 38, 24);
    g.font = `bold 25px ${SERIF}`; g.fillStyle = '#4a2410'; g.fillText('Römisches Reich', mx0 + 150, my1 + 43);
    g.textAlign = 'right'; g.font = `italic 22px ${SERIF}`; g.fillStyle = '#6b4a2a'; g.fillText(v > 0.97 ? 'größte Ausdehnung' : 'Zieh den Schieber!', mx1, my1 + 43);
  }
  draw(0);
  return { canvas, W, H, draw, rMax, aspect: H / W };
}
