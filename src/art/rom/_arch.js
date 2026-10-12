// Römer-Baukasten: Bauwerke und Oberflächen (Ziegel, Quader, Marmor, Dachziegel, Putz ...).
//   import { archWall, columnPoly, rectP, brickwork, ashlar, marbleVeins, roofTiles, plaster, woodGrain } from './_arch.js';
// Alle Koordinaten in Metern (Modellraum der Figur, y nach oben). Shapes werden vom Papierschnitt zu EINEM Umriss vereinigt;
// Öffnungen (Bögen, Fenster) entstehen, indem man Wandstücke um die Öffnung herum baut (archWall) statt zu "stanzen".
import { poly, blob } from '../dsl.js';
import { line, dot } from '../paint.js';
import { mulberry32 } from '../../engine/util.js';

export const rectP = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

// Wand mit n Rundbogen-Öffnungen: liefert Polygone (Pfeiler samt Zwickeln), dazwischen bleibt es offen.
//   open: Öffnungsbreite / Jochbreite (0.5–0.8)   crown: Scheitelhöhe der Öffnung als Anteil von (y1−y0)
export function archWall(x0, x1, y0, y1, n, { open = 0.62, crown = 0.82, seg = 9 } = {}) {
  const bw = (x1 - x0) / n, ow = bw * open, r = ow / 2, yc = y0 + (y1 - y0) * crown, ys = yc - r;
  const out = [], cx = (i) => x0 + bw * (i + 0.5);
  const arcR = (i) => { const a = []; for (let k = 0; k <= seg; k++) { const t = (k / seg) * Math.PI / 2; a.push([cx(i) + r * Math.cos(t), ys + r * Math.sin(t)]); } return a; }; // rechte Hälfte, von der Kämpferlinie zum Scheitel
  const arcL = (i) => { const a = []; for (let k = 0; k <= seg; k++) { const t = Math.PI / 2 + (k / seg) * Math.PI / 2; a.push([cx(i) + r * Math.cos(t), ys + r * Math.sin(t)]); } return a; }; // linke Hälfte, vom Scheitel zur Kämpferlinie
  for (let i = 0; i <= n; i++) {
    const pts = [];
    if (i === 0) pts.push([x0, y0], [x0, y1]); else { pts.push([cx(i - 1) + r, y0], [cx(i - 1) + r, ys], ...arcR(i - 1), [cx(i - 1), y1]); }
    if (i === n) pts.push([x1, y1], [x1, y0]); else { pts.push([cx(i), y1], ...arcL(i), [cx(i) - r, ys], [cx(i) - r, y0]); }
    out.push(pts);
  }
  return out;
}
// Säule: Schaft (leicht verjüngt) + Basis + Kapitell; liefert Polygone
export function columnPoly(cx, y0, h, w, { cap = true } = {}) {
  const s = w / 2, t = s * 0.85, bh = h * 0.05, ch = h * 0.07;
  const o = [poly([[cx - s * 1.25, y0], [cx + s * 1.25, y0], [cx + s * 1.1, y0 + bh], [cx - s * 1.1, y0 + bh]]), poly([[cx - s, y0 + bh], [cx + s, y0 + bh], [cx + t, y0 + h - ch], [cx - t, y0 + h - ch]])];
  if (cap) o.push(poly([[cx - t, y0 + h - ch], [cx + t, y0 + h - ch], [cx + s * 1.3, y0 + h - ch * 0.5], [cx + s * 1.3, y0 + h], [cx - s * 1.3, y0 + h], [cx - s * 1.3, y0 + h - ch * 0.5]]));
  return o;
}
// Dreiecksgiebel
export const pediment = (x0, x1, y0, rise) => poly([[x0, y0], [x1, y0], [(x0 + x1) / 2, y0 + rise]]);

// ----------------------------------------------------------------- Oberflächen (in layer.deco(c, bb))
export function brickwork(c, bb, { brick = 'rgba(120,50,25,.28)', mortar = 'rgba(245,225,190,.55)', h = 0.09, w = 0.2, seed = 3 } = {}) {
  const r = mulberry32(seed);
  for (let y = bb.y0, row = 0; y < bb.y1; y += h, row++) {
    line(c, [[bb.x0, y], [bb.x1, y]], mortar, h * 0.14);
    for (let x = bb.x0 + (row % 2 ? w / 2 : 0); x < bb.x1; x += w) {
      line(c, [[x, y], [x, y + h]], mortar, h * 0.12);
      if (r() < 0.35) dot(c, x + w * 0.5, y + h * 0.5, h * 0.35, brick, 0.5);
    }
  }
}
export function ashlar(c, bb, { tone = 'rgba(90,70,50,.25)', line: lc = 'rgba(70,55,40,.4)', h = 0.18, w = 0.38, seed = 5 } = {}) {
  const r = mulberry32(seed);
  for (let y = bb.y0, row = 0; y < bb.y1; y += h, row++) {
    line(c, [[bb.x0, y], [bb.x1, y]], lc, h * 0.08);
    for (let x = bb.x0 + (row % 2 ? w / 2 : 0); x < bb.x1; x += w * (0.8 + r() * 0.4)) { line(c, [[x, y], [x, y + h]], lc, h * 0.07); if (r() < 0.3) dot(c, x + w * 0.4, y + h * 0.5, h * 0.4, tone, 0.6); }
  }
}
export function marbleVeins(c, bb, { color = 'rgba(120,120,140,.28)', n = 7, seed = 9 } = {}) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    let x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h; const pts = [[x, y]];
    for (let k = 0; k < 5; k++) { x += (r() - 0.3) * bb.w * 0.25; y += (r() - 0.5) * bb.h * 0.25; pts.push([x, y]); }
    line(c, pts, color, Math.max(0.006, bb.h * 0.006));
  }
}
export function roofTiles(c, bb, { a = 'rgba(150,50,25,.45)', b = 'rgba(255,200,150,.25)', h = 0.12, w = 0.14 } = {}) {
  for (let y = bb.y0, row = 0; y < bb.y1; y += h, row++) for (let x = bb.x0 + (row % 2 ? w / 2 : 0); x < bb.x1; x += w) { line(c, [[x, y + h], [x + w / 2, y], [x + w, y + h]], a, h * 0.1); line(c, [[x + w * 0.1, y + h * 0.8], [x + w * 0.5, y + h * 0.15]], b, h * 0.07); }
}
export function plaster(c, bb, { color = 'rgba(120,80,50,.16)', n = 120, seed = 4 } = {}) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.01 + r() * 0.025, color, 0.6);
}
export function woodGrain(c, bb, { color = 'rgba(60,30,10,.35)', n = 8, seed = 2, vertical = false } = {}) {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) {
    const t = (i + r() * 0.6) / n;
    if (vertical) line(c, [[bb.x0 + t * bb.w, bb.y0], [bb.x0 + t * bb.w + (r() - 0.5) * 0.04, bb.y1]], color, 0.01);
    else line(c, [[bb.x0, bb.y0 + t * bb.h], [bb.x1, bb.y0 + t * bb.h + (r() - 0.5) * 0.04]], color, 0.01);
  }
}
