// Station 2: Bauten und Kulissen als Part-Specs (für ctx.flat): Senatsgebäude, Sitzbank, Rednerbühne (Rostra), Hafenmauer von Karthago,
// Papier-Alpen (fern und nah, mit Pfad), Segelschiffe, Zypresse und Schirmpinie. Alle in Weltmetern (ws = 1), Boden bei y = 0.
import { blob, limb, poly } from '../dsl.js';
import { line, dot, eye, volume } from '../paint.js';
import { archWall, columnPoly, rectP, ashlar, marbleVeins, roofTiles, plaster } from './_arch.js';
import { mulberry32, TAU } from '../../engine/util.js';

const MARBLE = { top: '#f6f0e0', bottom: '#dccfb3' };
const STONE = { top: '#ece0c2', bottom: '#d3c19a' };
const PURPLE = '#7b2d5b', GOLD = '#e8c46a', TERRA = '#c8693a';
const EDGE = 'rgba(70,50,30,.45)';

// kleiner Hilfsmaler: Polygonfläche in Modellkoordinaten
function fillPoly(c, pts, fill, alpha = 1) {
  const g = c.ctx; g.save(); g.globalAlpha = alpha; g.fillStyle = fill; g.beginPath();
  pts.forEach(([x, y], i) => { const [X, Y] = c.tf(x, y); if (i) g.lineTo(X, Y); else g.moveTo(X, Y); }); g.closePath(); g.fill(); g.restore();
}
const arcPts = (cx, cy, r, a0, a1, n = 14) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };

// ------------------------------------------------------------------ Senatsgebäude (Fassade, 5,6 m breit, 4,4 m hoch)
export function curiaPart() {
  const steps = [rectP(-2.9, 0, 2.9, 0.15), rectP(-2.7, 0.15, 2.7, 0.3), rectP(-2.5, 0.3, 2.5, 0.45)];
  const wall = archWall(-2.35, 2.35, 0.45, 3.0, 1, { open: 0.3, crown: 0.74 });
  const hw = 0.7, ys = 0.45 + (3.0 - 0.45) * 0.74 - hw;                          // Tür: Halbbogen
  const door = poly([[-hw, 0.45], [hw, 0.45], ...arcPts(0, ys, hw, 0, Math.PI), [-hw, ys]]);
  const cols = [-2.15, -0.8, 0.8, 2.15].flatMap((x) => columnPoly(x, 0.45, 2.55, 0.4));
  return { layers: [
    { shapes: steps, fill: MARBLE, deco(c, bb) { volume(c, bb); ashlar(c, bb, { h: 0.15, w: 0.8, seed: 3, tone: 'rgba(120,100,70,.12)' }); } },
    { shapes: wall, fill: { top: '#efe3c4', bottom: '#d9c79c' }, deco(c, bb) { ashlar(c, bb, { h: 0.2, w: 0.55, seed: 7 }); plaster(c, bb, { n: 80, seed: 2 }); volume(c, bb); } },
    { shapes: [door], fill: { top: '#7a4a28', bottom: '#4a2c16' }, stroke: 'rgba(30,15,5,.75)',
      deco(c, bb) {
        line(c, [[0, 0.45], [0, ys + hw]], '#2a1608', 0.04);
        for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) dot(c, sx * (0.18 + i * 0.13), 0.9 + (i % 2) * 0.55, 0.035, GOLD);
        line(c, [[-hw, 1.5], [hw, 1.5]], 'rgba(232,196,106,.7)', 0.03);
        dot(c, -0.14, 1.2, 0.05, GOLD); dot(c, 0.14, 1.2, 0.05, GOLD);
      } },
    { shapes: cols, fill: { top: '#fbf6e8', bottom: '#d9ccb0' }, deco(c, bb) { volume(c, bb); for (const x of [-2.15, -0.8, 0.8, 2.15]) for (let k = -2; k <= 2; k++) line(c, [[x + k * 0.07, 0.75], [x + k * 0.065, 2.8]], 'rgba(120,100,80,.22)', 0.012); } },
    { shapes: [rectP(-2.7, 3.0, 2.7, 3.42)], fill: MARBLE, deco(c, bb) {
      volume(c, bb); line(c, [[-2.7, 3.12], [2.7, 3.12]], 'rgba(120,100,80,.35)', 0.02);
      for (let x = -2.5; x < 2.55; x += 0.28) { line(c, [[x, 3.16], [x, 3.4]], PURPLE, 0.045, { alpha: 0.85 }); line(c, [[x + 0.1, 3.16], [x + 0.1, 3.4]], 'rgba(120,100,80,.3)', 0.015); }
    } },
    { shapes: [poly([[-2.85, 3.42], [2.85, 3.42], [0, 4.42]])], fill: { top: '#f1e5c8', bottom: '#e0cfa5' }, stroke: 'rgba(90,70,45,.7)',
      deco(c, bb) {
        fillPoly(c, [[-2.45, 3.55], [2.45, 3.55], [0, 4.2]], '#d9a35a');       // Giebelfeld
        fillPoly(c, [[-2.45, 3.55], [2.45, 3.55], [0, 4.2]], 'rgba(200,105,58,.55)');
        dot(c, 0, 3.86, 0.3, GOLD); dot(c, 0, 3.86, 0.2, '#7b2d5b'); dot(c, 0, 3.86, 0.1, GOLD);
        for (const sx of [-1, 1]) { line(c, [[sx * 0.4, 3.7], [sx * 1.4, 3.64]], GOLD, 0.05); dot(c, sx * 1.55, 3.64, 0.07, GOLD); }
        line(c, [[-2.85, 3.44], [0, 4.4], [2.85, 3.44]], TERRA, 0.07);
      } },
  ] };
}

// ------------------------------------------------------------------ Seitenwand des Senatsgebäudes (2,6 m tief, 3,0 m hoch; wird im Winkel dazugestellt)
export function curiaSidePart() {
  const wall = archWall(-1.3, 1.3, 0.0, 3.0, 2, { open: 0.4, crown: 0.82 });
  return { layers: [
    { shapes: wall, fill: { top: '#e2d1ab', bottom: '#c9b488' }, deco(c, bb) { ashlar(c, bb, { h: 0.2, w: 0.55, seed: 4 }); volume(c, bb, { dark: 'rgba(60,40,20,.4)', light: 'rgba(255,248,220,.1)' }); } },
    { shapes: [rectP(-1.3, 3.0, 1.3, 3.2)], fill: { top: '#c8693a', bottom: '#a7502a' }, deco(c, bb) { roofTiles(c, bb, { h: 0.1, w: 0.12 }); } },
  ] };
}

// ------------------------------------------------------------------ Sitzbank (Marmor, 0,8 m hoch) für die Senatoren
export function bankPart(len = 5.2, h = 0.8) {
  const x1 = len / 2;
  return { layers: [{ shapes: [poly([[-x1, 0], [x1, 0], [x1, h - 0.1], [x1 - 0.06, h], [-x1 + 0.06, h], [-x1, h - 0.1]])], fill: MARBLE,
    deco(c, bb) {
      volume(c, bb); marbleVeins(c, bb, { n: 8, seed: 5 });
      line(c, [[-x1, h - 0.14], [x1, h - 0.14]], PURPLE, 0.07, { alpha: 0.9 }); line(c, [[-x1, h - 0.22], [x1, h - 0.22]], GOLD, 0.025);
      line(c, [[-x1, 0.16], [x1, 0.16]], 'rgba(120,100,80,.4)', 0.02);
      for (let x = -x1 + 0.45; x < x1 - 0.2; x += 0.9) { line(c, [[x, 0.04], [x, h - 0.26]], 'rgba(120,100,80,.25)', 0.015); }
    } }] };
}

// ------------------------------------------------------------------ Rednerbühne (Rostra): Vorderseite 3,8 m, 1,25 m hoch, mit Schiffsschnäbeln
export function rostraPart() {
  const face = poly([[-1.9, 0], [1.9, 0], [1.9, 1.15], [2.0, 1.15], [2.0, 1.3], [-2.0, 1.3], [-2.0, 1.15], [-1.9, 1.15]]);
  const stairs = poly([[1.9, 0], [3.05, 0], [3.05, 0.34], [2.62, 0.34], [2.62, 0.68], [2.2, 0.68], [2.2, 1.02], [1.9, 1.02]]);
  return { layers: [
    { shapes: [stairs], fill: { top: '#e9dfc6', bottom: '#cfc19d' }, deco(c, bb) { line(c, [[2.2, 0.68], [3.05, 0.68]], 'rgba(100,80,50,.4)', 0.02); line(c, [[2.62, 0.34], [3.05, 0.34]], 'rgba(100,80,50,.4)', 0.02); } },
    { shapes: [face], fill: STONE,
      deco(c, bb) {
        volume(c, bb); ashlar(c, bb, { h: 0.22, w: 0.7, seed: 6, tone: 'rgba(110,90,60,.14)' });
        line(c, [[-2.0, 1.16], [2.0, 1.16]], GOLD, 0.04); line(c, [[-1.9, 0.14], [1.9, 0.14]], 'rgba(100,80,50,.4)', 0.03);
        // Schiffsschnäbel (Bronze): Vordersteven mit Sporn, auf Holzbohlen montiert
        for (const x of [-1.3, -0.45, 0.45, 1.3]) {
          fillPoly(c, [[x - 0.42, 0.28], [x + 0.42, 0.28], [x + 0.42, 0.98], [x - 0.42, 0.98]], 'rgba(90,60,30,.35)');
          fillPoly(c, [[x - 0.38, 0.34], [x + 0.28, 0.34], [x + 0.36, 0.46], [x + 0.5, 0.52], [x + 0.28, 0.58], [x + 0.3, 0.74], [x + 0.2, 0.92], [x + 0.06, 0.9], [x + 0.1, 0.72], [x - 0.38, 0.6]], '#c99637');
          fillPoly(c, [[x + 0.28, 0.46], [x + 0.62, 0.5], [x + 0.28, 0.54]], '#e6bb55');
          for (const dy of [-0.05, 0.03]) line(c, [[x - 0.32, 0.47 + dy], [x + 0.26, 0.5 + dy]], '#7a5418', 0.02);
          line(c, [[x - 0.34, 0.6], [x + 0.2, 0.74], [x + 0.14, 0.9]], 'rgba(255,240,180,.75)', 0.018);
          dot(c, x - 0.3, 0.72, 0.03, '#3a2410'); dot(c, x - 0.3, 0.42, 0.03, '#3a2410');
        }
      } },
  ] };
}

// ------------------------------------------------------------------ Hafenmauer von Karthago (5,4 m breit, 3,7 m hoch): Wasser-Tor, zwei Türme, Wimpel
export function hafenPart() {
  const wall = archWall(-2.5, 2.5, 0, 2.15, 1, { open: 0.38, crown: 0.82 });
  const hw = 0.95, ys = 2.15 * 0.82 - hw;
  const water = poly([[-hw, 0], [hw, 0], [hw, ys], ...arcPts(0, ys, hw, 0, Math.PI), [-hw, ys]]);
  const merlons = []; for (let x = -2.45; x < 2.4; x += 0.5) merlons.push(rectP(x, 2.15, x + 0.28, 2.45));
  const towerL = rectP(-3.0, 0, -2.0, 3.3), towerR = rectP(2.0, 0, 3.0, 3.1);
  const capL = poly([...arcPts(-2.5, 3.3, 0.68, 0, Math.PI, 12), [-3.18, 3.3]]), capR = poly([...arcPts(2.5, 3.1, 0.62, 0, Math.PI, 12), [1.88, 3.1]]);
  const top = (cx, y, w) => rectP(cx - w - 0.06, y, cx + w + 0.06, y + 0.12);
  return { layers: [
    { shapes: wall.concat(merlons), fill: { top: '#ecd6a4', bottom: '#d2b57c' }, deco(c, bb) { ashlar(c, bb, { h: 0.24, w: 0.6, seed: 11 }); plaster(c, bb, { n: 90, seed: 4 }); volume(c, bb); } },
    { shapes: [water], fill: { top: '#58a6d2', bottom: '#2d6c9d' }, stroke: 'rgba(30,50,80,.6)',
      deco(c, bb) {
        for (let i = 0; i < 6; i++) line(c, [[-0.8 + (i % 2) * 0.15, 0.2 + i * 0.22], [0.8 - (i % 3) * 0.1, 0.2 + i * 0.22]], 'rgba(235,248,255,.5)', 0.025);
        // ein kleines Schiff im Tor
        fillPoly(c, [[-0.5, 0.35], [0.5, 0.35], [0.38, 0.18], [-0.4, 0.18]], '#a83a2c'); line(c, [[0, 0.35], [0, 1.2]], '#6b4a2a', 0.04);
        fillPoly(c, [[0.04, 1.15], [0.5, 0.45], [0.04, 0.45]], '#f4efe4'); fillPoly(c, [[-0.04, 1.1], [-0.4, 0.5], [-0.04, 0.5]], '#7b2d5b');
      } },
    { shapes: [towerL, towerR, top(-2.5, 3.3, 0.62), top(2.5, 3.1, 0.62)], fill: { top: '#efdcae', bottom: '#d6bb82' },
      deco(c, bb) {
        ashlar(c, bb, { h: 0.24, w: 0.5, seed: 13 }); volume(c, bb);
        for (const [x, y] of [[-2.5, 2.4], [2.5, 2.2], [-2.5, 1.3], [2.5, 1.2]]) { fillPoly(c, [[x - 0.12, y - 0.2], [x + 0.12, y - 0.2], [x + 0.12, y + 0.08], ...arcPts(x, y + 0.08, 0.12, 0, Math.PI, 6)], '#5a3a22'); }
      } },
    { shapes: [capL, capR], fill: { top: '#d9784a', bottom: '#b3512a' }, stroke: 'rgba(80,30,10,.7)', deco(c, bb) { roofTiles(c, bb, { h: 0.14, w: 0.16 }); } },
    { shapes: [limb([[-2.5, 3.95, 0.05], [-2.5, 4.7, 0.05]]), limb([[2.5, 3.7, 0.05], [2.5, 4.4, 0.05]]), poly([[-2.5, 4.7], [-1.95, 4.55], [-2.5, 4.4]]), poly([[2.5, 4.4], [3.05, 4.25], [2.5, 4.1]])], fill: PURPLE, stroke: 'rgba(40,10,30,.7)' },
  ] };
}

// ------------------------------------------------------------------ Papier-Alpen
// Pfad der Elefanten (Seitenkoordinaten x → y der Füße): erst flach, dann hoch zum Sattel, dann hinunter.
const TRAIL = [[0.9, 0.42], [2.4, 0.5], [3.1, 0.95], [3.8, 1.75], [4.5, 2.55], [5.0, 2.9], [5.6, 2.35], [6.2, 1.55], [6.7, 0.95], [7.3, 0.5]];
export function trailY(x) {
  if (x <= TRAIL[0][0]) return TRAIL[0][1]; if (x >= TRAIL[TRAIL.length - 1][0]) return TRAIL[TRAIL.length - 1][1];
  let i = 0; while (TRAIL[i + 1][0] < x) i++;
  const a = TRAIL[i], b = TRAIL[i + 1], t = (x - a[0]) / (b[0] - a[0]), s = t * t * (3 - 2 * t);
  return a[1] + (b[1] - a[1]) * (0.5 * t + 0.5 * s);
}
export const TRAIL_PTS = TRAIL;

function ridgePoly(pts, x0, x1) { return poly([[x0, 0], ...pts, [x1, 0]]); }
function shade(c, pts, x0, x1, lightA, darkA) {                // Papierfalten: je Gipfel eine helle linke und eine dunkle rechte Fläche mit schräger Gratlinie
  const n = pts.length;
  for (let i = 1; i < n - 1; i++) {
    if (!(pts[i][1] > pts[i - 1][1] && pts[i][1] >= pts[i + 1][1])) continue;
    const P = pts[i]; let l = i; while (l > 0 && pts[l - 1][1] < pts[l][1]) l--; let r = i; while (r < n - 1 && pts[r + 1][1] < pts[r][1]) r++;
    const L = pts[l], R = pts[r], spineX = P[0] + (R[0] - P[0]) * 0.18;
    fillPoly(c, [...pts.slice(i, r + 1), [R[0], 0], [spineX, 0]], 'rgb(25,45,95)', darkA);
    fillPoly(c, [...pts.slice(l, i + 1), [spineX, 0], [L[0], 0]], 'rgb(255,255,255)', lightA);
    line(c, [P, [spineX, 0]], 'rgba(30,50,100,.28)', 0.03);
  }
}
function snowcap(c, pts, level, seed, col = '#fbfdff') {       // Schnee: alles oberhalb einer gezackten Linie
  const r = mulberry32(seed), x0 = pts[0][0], x1 = pts[pts.length - 1][0];
  const line1 = []; for (let x = x0; x <= x1 + 0.2; x += 0.16) line1.push([x, level + (r() - 0.5) * 0.5 + (Math.floor(x / 0.16) % 2 ? -0.14 : 0.1)]);
  fillPoly(c, [...line1, [x1 + 0.2, 7], [x0, 7]], col, 0.95);
  c.ctx.save(); c.ctx.strokeStyle = 'rgba(120,150,190,.5)'; c.ctx.lineWidth = Math.max(1, c.S * 0.02); c.ctx.beginPath(); line1.forEach(([x, y], i) => { const [X, Y] = c.tf(x, y); if (i) c.ctx.lineTo(X, Y); else c.ctx.moveTo(X, Y); }); c.ctx.stroke(); c.ctx.restore();
}

const FAR = [[0.0, 0.5], [0.6, 1.8], [1.2, 3.2], [1.8, 4.3], [2.3, 5.25], [2.9, 4.1], [3.5, 4.6], [4.2, 5.4], [4.9, 4.5], [5.5, 4.9], [6.1, 4.0], [6.8, 3.0], [7.4, 1.8], [8.0, 0.6]];
export function alpenFarPart() {
  const x0 = 0.0, x1 = 8.0, cx = 4.0;
  const pts = FAR.map(([x, y]) => [x - cx, y]);
  return { cx: 4.3, part: { layers: [{ shapes: [ridgePoly(pts, x0 - cx, x1 - cx)], fill: { top: '#a9bfd6', bottom: '#cfdbe6' }, deco(c) {
    shade(c, pts, x0 - cx, x1 - cx, 0.1, 0.2); snowcap(c, pts, 3.7, 4);
    const r = mulberry32(8); for (let i = 0; i < 30; i++) dot(c, -4 + r() * 8, r() * 3, 0.03 + r() * 0.04, 'rgba(255,255,255,.35)');
  } }] } };
}

// Nahe Alpenkette (breiter, dunkler, mit gemaltem Pfad); Fenster x ∈ [0.3, 8.9] → Mitte 4.6
export function alpenNearPart() {
  const cx = 4.6, x0 = 0.3, x1 = 8.9;
  const raw = [[0.3, 0.0], [0.3, 0.55], [1.0, 0.95], [1.8, 0.8], [2.6, 1.3], [3.2, 2.2], [3.6, 3.4], [3.95, 4.35], [4.3, 3.7], [4.7, 3.55], [5.1, 3.45], [5.55, 3.9], [5.95, 4.55], [6.35, 5.1], [6.7, 4.4], [7.1, 3.4], [7.5, 2.4], [7.9, 1.4], [8.4, 0.8], [8.9, 0.5]];
  // Sattel bei x ≈ 5.0 (y ≈ 3.45); der Pfad führt darunter her
  const pts = raw.slice(1).map(([x, y]) => [x - cx, y]);
  return { cx, trailY, part: { layers: [{ shapes: [ridgePoly(pts, x0 - cx, x1 - cx)], fill: { top: '#8a9fbf', bottom: '#b4c2d6' },
    deco(c) {
      shade(c, pts, x0 - cx, x1 - cx, 0.16, 0.24); snowcap(c, pts, 3.9, 9);
      // Tannen am Fuß
      const r = mulberry32(5); for (const [x, y] of [[1.2, 0.95], [1.6, 0.85], [2.2, 1.1], [7.8, 1.45], [8.3, 0.9], [8.6, 0.75]]) { fillPoly(c, [[x - cx - 0.16, y - 0.05], [x - cx + 0.16, y - 0.05], [x - cx, y + 0.5 + r() * 0.12]], '#35704f'); }
    } }] } };
}

// ------------------------------------------------------------------ Segelschiffe (Seitenansicht, schauen nach +x; dir = −1 spiegelt)
// o: { hull, trim, sail, stripe, pole (Bugmast für die Enterbrücke), eyes, flag }
export function shipPart(o = {}) {
  const { hull = '#a83a2c', trim = GOLD, sail = '#f6f1e4', stripe = PURPLE, pole = false, flag = PURPLE, dir = 1 } = o;
  const X = (x) => x * dir;
  const P = (pts, sm = 0) => poly(pts.map(([x, y]) => [X(x), y]), sm);
  const hullPoly = P([[-1.95, 1.3], [-2.05, 0.95], [-1.7, 0.4], [-1.1, 0.03], [0, -0.03], [1.1, 0.12], [1.72, 0.5], [2.05, 0.95], [2.2, 1.3], [2.0, 1.28], [1.7, 1.0], [-1.6, 1.0], [-1.85, 1.2]], 1);
  const rail = P([[-1.75, 1.0], [1.75, 1.0], [1.75, 1.1], [-1.75, 1.1]]);
  const shields = []; for (let x = -1.45; x <= 1.5; x += 0.37) shields.push(blob(X(x), 1.2, 0.17, 0.17, 0, 16));
  const oars = []; for (let x = -1.2; x <= 1.3; x += 0.42) oars.push(limb([[X(x), 0.78, 0.05], [X(x - 0.5), 0.1, 0.06], [X(x - 0.62), -0.15, 0.13]], { per: 4 }));
  const mast = limb([[X(-0.1), 1.0, 0.15], [X(-0.1), 3.75, 0.1]], { per: 4 }), yard = limb([[X(-1.05), 3.3, 0.08], [X(0.85), 3.3, 0.08]], { per: 4 });
  const sailP = P([[-1.0, 3.28], [0.8, 3.28], [0.95, 2.4], [0.85, 1.55], [-0.15, 1.45], [-0.95, 1.55], [-1.05, 2.4]], 2);
  const stern = P([[-1.9, 1.25], [-2.35, 1.65], [-2.25, 2.1], [-1.95, 1.8], [-1.75, 1.3]], 1);
  const layers = [
    { shapes: [stern], fill: { top: trim, bottom: '#b88a2a' }, stroke: 'rgba(80,50,10,.7)' },
    { shapes: oars, fill: '#8a5a34', stroke: 'rgba(40,20,8,.6)' },
    { shapes: [hullPoly], fill: { top: hull, bottom: mixHex(hull, '#2a0a08', 0.35) }, stroke: 'rgba(40,12,8,.75)',
      deco(c, bb) {
        volume(c, bb); line(c, [[X(-1.8), 0.9], [X(1.9), 0.92]], trim, 0.07); line(c, [[X(-1.5), 0.55], [X(1.5), 0.62]], 'rgba(255,240,200,.35)', 0.03);
        for (let x = -1.2; x <= 1.3; x += 0.42) dot(c, X(x), 0.75, 0.035, '#2a1608');           // Ruderpforten
        eye(c, X(1.55), 0.72, 0.1, { look: dir * 0.3 });                                          // aufgemaltes Auge am Bug
      } },
    { shapes: [rail], fill: '#8a5a34', stroke: 'rgba(40,20,8,.6)' },
    { shapes: shields, fill: { top: '#f1e6c8', bottom: '#d3c39b' }, stroke: 'rgba(60,40,20,.7)', deco(c) { for (let x = -1.45; x <= 1.5; x += 0.37) { dot(c, X(x), 1.2, 0.07, PURPLE); dot(c, X(x), 1.2, 0.025, GOLD); } } },
    { shapes: [mast, yard, ...(pole ? [limb([[X(1.35), 1.0, 0.18], [X(1.35), 3.1, 0.12]], { per: 4 }), blob(X(1.35), 3.12, 0.12, 0.12, 0, 14)] : [])], fill: '#7a4a24', stroke: 'rgba(40,20,8,.7)' },
    { shapes: [sailP], fill: sail, stroke: 'rgba(60,40,30,.6)',
      deco(c, bb) {
        volume(c, bb, { dark: 'rgba(60,40,70,.28)', light: 'rgba(255,255,255,.2)' });
        for (let i = -2; i <= 2; i++) { const x = X(-0.1 + i * 0.36); fillPoly(c, [[x - 0.09, 3.3], [x + 0.09, 3.3], [x + 0.09, 1.4], [x - 0.09, 1.4]], stripe, 0.9); }
        line(c, [[X(-1.05), 2.35], [X(0.95), 2.4]], trim, 0.03, { alpha: 0.9 });
      } },
    { shapes: [P([[-0.1, 3.72], [-0.1, 3.95], [-0.85, 3.84]]), blob(X(-0.1), 3.78, 0.07, 0.07, 0, 12)], fill: flag, stroke: 'rgba(40,10,30,.7)' },
  ];
  return { layers };
}
function mixHex(a, b, t) { const A = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), B = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16)); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); }

// Maße des Schiffs (Modellraum, dir = +1): Bug, Pfostenspitze, Deckhöhe
export const SHIP = { bowX: 2.2, poleX: 1.35, hingeY: 1.7, deckY: 1.05, len: 4.5 };

// ------------------------------------------------------------------ Bäume: Zypresse und Schirmpinie (Spec für ctx.prop)
export function zypresse(o = {}) {
  const h = 3, r = mulberry32((o.seed || 1) * 7 + 3);
  const half = [[0.0, 0.25], [0.2, 0.3], [0.34, 0.8], [0.4, 1.5], [0.34, 2.2], [0.2, 2.75], [0.0, 3.05]];
  const flame = poly([...half, ...half.slice(1, -1).reverse().map(([x, y]) => [-x, y])], 2);
  return { id: 's2_zypresse', parts: { body: { z: 1, layers: [
    { shapes: [limb([[0, 0, 0.14], [0, 0.4, 0.12]]), flame], fill: { top: '#2f6f4a', bottom: '#1c4a35' }, stroke: 'rgba(15,40,25,.6)',
      deco(c, bb) { volume(c, bb); for (let i = 0; i < 30; i++) { const y = 0.5 + r() * 2.3; const w = 0.34 * Math.sqrt(Math.max(0, 1 - ((y - 1.5) / 1.6) ** 2)); const x = (r() - 0.5) * w * 1.5; line(c, [[x, y], [x + (r() - 0.5) * 0.08, y + 0.3]], r() > 0.5 ? 'rgba(160,210,140,.4)' : 'rgba(10,40,25,.35)', 0.03); } } }] } },
    anchors: {}, meta: { name: 'Zypresse', lengthM: 1, heightM: h } };
}
export function pinie(o = {}) {
  const r = mulberry32((o.seed || 1) * 11 + 1);
  const trunk = limb([[0, 0, 0.28], [0.06, 1.2, 0.2], [-0.05, 2.2, 0.17], [0.0, 2.7, 0.12]], { per: 8 });
  const crown = [blob(0, 3.05, 1.35, 0.42, 0, 30), blob(-0.9, 2.85, 0.7, 0.3, 0, 20), blob(0.95, 2.9, 0.7, 0.3, 0, 20), blob(0.1, 3.4, 0.75, 0.28, 0, 20)];
  return { id: 's2_pinie', parts: { body: { z: 1, layers: [
    { shapes: [trunk], fill: { top: '#8a5a3a', bottom: '#5a3a24' }, stroke: 'rgba(40,20,10,.6)', deco(c, bb) { for (let i = 0; i < 6; i++) line(c, [[-0.08, 0.3 + i * 0.4], [0.08, 0.5 + i * 0.4]], 'rgba(40,20,10,.35)', 0.02); } },
    { shapes: crown, fill: { top: '#4f8f55', bottom: '#2f6a43' }, stroke: 'rgba(20,50,30,.6)', deco(c, bb) { volume(c, bb); for (let i = 0; i < 30; i++) dot(c, -1.2 + r() * 2.4, 2.7 + r() * 0.7, 0.04 + r() * 0.05, r() > 0.5 ? 'rgba(190,230,150,.4)' : 'rgba(10,50,30,.3)'); } },
  ] } }, anchors: {}, meta: { name: 'Schirmpinie', lengthM: 1, heightM: 3.8 } };
}
