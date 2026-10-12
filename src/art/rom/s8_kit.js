// Station 8: gemeinsame Hilfen für Bauten, Städte und Schiffe (nur Malen und Formen, keine Engine).
import { poly, blob, limb } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { brickwork, ashlar, roofTiles, plaster, woodGrain, rectP } from './_arch.js';
import { mulberry32 } from '../../engine/util.js';
import { mixHex } from './_people.js';

export { mixHex, rectP, brickwork, ashlar, roofTiles, plaster, woodGrain, volume, line, dot };

export const COL = {
  stone: '#d8cfb6', stoneD: '#a99f86', stoneLight: '#ece4cc', mortar: 'rgba(90,75,50,.35)',
  roof: '#b5553a', roofD: '#8a3a26', roofL: '#d4764f',
  wood: '#8a5f3a', woodD: '#5f3d22', woodL: '#b88a58',
  plasterA: '#f1e6c8', plasterB: '#ead7a0', plasterC: '#d9e2e8', plasterD: '#f0cfc0', plasterE: '#e9eed6',
  dark: '#2c2218', grass: '#6f9a58', grassD: '#4d7a3e',
};
export const stroke = 'rgba(60,45,28,.6)';

// ---- Polygon-Zeichnen in Modellkoordinaten (innerhalb von deco)
export const pathM = (c, pts, close = true) => { const { ctx, tf } = c; ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); if (close) ctx.closePath(); };
export const fillM = (c, pts, fill, st, lw = 0.012) => { const { ctx, S } = c; pathM(c, pts); ctx.fillStyle = fill; ctx.fill(); if (st) { ctx.strokeStyle = st; ctx.lineWidth = Math.max(1, lw * S); ctx.lineJoin = 'round'; ctx.stroke(); } };
export const circM = (c, x, y, r, fill, st, lw = 0.01) => { const { ctx, tf, S } = c; const [X, Y] = tf(x, y); ctx.beginPath(); ctx.arc(X, Y, Math.max(0.5, r * S), 0, 6.2832); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (st) { ctx.strokeStyle = st; ctx.lineWidth = Math.max(1, lw * S); ctx.stroke(); } };
export const gradM = (c, x0, y0, x1, y1, stops) => { const { ctx, tf } = c; const a = tf(x0, y0), b = tf(x1, y1); const g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); stops.forEach(([t, col]) => g.addColorStop(t, col)); return g; };

// Zinnen (Rechtecke) entlang einer Oberkante
export function merlons(x0, x1, y, w = 0.14, gap = 0.1, h = 0.13) {
  const out = []; let x = x0 + gap / 2;
  while (x + w <= x1 + 1e-6) { out.push(rectP(x, y - 0.01, x + w, y + h)); x += w + gap; }
  return out;
}
// Spitzdach (Zeltdach) über einer Breite
export const gable = (x0, x1, y, rise, over = 0.06) => poly([[x0 - over, y], [x1 + over, y], [(x0 + x1) / 2, y + rise]]);

// ---- Hausfassade (Seitenansicht), liefert Layer-Liste. o: {x0, w, h, y0, roof: 'gable'|'flat'|'hip', rise, wall, roofCol, floors, seed, shop}
export function houseLayers(o) {
  const { x0, w, h, y0 = 0.1, roof = 'gable', rise = 0.35, wall = COL.plasterA, roofCol = COL.roof, floors = 2, seed = 1, lit = 0.35, shop = null, shutters = false } = o;
  const x1 = x0 + w, r = mulberry32(seed * 131 + 7);
  const layers = [];
  layers.push({
    shapes: [rectP(x0, y0, x1, y0 + h)], fill: { top: mixHex(wall, '#ffffff', 0.25), bottom: mixHex(wall, '#7a6a52', 0.18) }, stroke,
    deco(c) {
      const fl = floors, fh = h / fl;
      for (let f = 0; f < fl; f++) {
        const cols = Math.max(1, Math.round(w / 0.42));
        for (let i = 0; i < cols; i++) {
          const wx = x0 + (w * (i + 0.5)) / cols, wy = y0 + fh * f + fh * 0.5, ww = Math.min(0.17, w / cols * 0.42), wh = fh * 0.44;
          if (f === 0 && i === Math.floor(cols / 2) && !shop) { fillM(c, rectP(wx - 0.07, y0, wx + 0.07, y0 + fh * 0.72), COL.woodD, stroke, 0.008); dot(c, wx + 0.04, y0 + fh * 0.36, 0.01, '#e8c46a'); continue; }
          const on = r() < lit;
          fillM(c, rectP(wx - ww / 2, wy - wh / 2, wx + ww / 2, wy + wh / 2), on ? gradM(c, 0, wy + wh / 2, 0, wy - wh / 2, [[0, '#ffe9a0'], [1, '#f3b95a']]) : gradM(c, 0, wy + wh / 2, 0, wy - wh / 2, [[0, '#cfe3ee'], [1, '#7fa7bf']]), 'rgba(50,35,20,.75)', 0.008);
          line(c, [[wx, wy - wh / 2], [wx, wy + wh / 2]], 'rgba(50,35,20,.7)', 0.007); line(c, [[wx - ww / 2, wy], [wx + ww / 2, wy]], 'rgba(50,35,20,.7)', 0.007);
          if (shutters) { fillM(c, rectP(wx - ww / 2 - 0.05, wy - wh / 2, wx - ww / 2, wy + wh / 2), '#4f7d6a', null); fillM(c, rectP(wx + ww / 2, wy - wh / 2, wx + ww / 2 + 0.05, wy + wh / 2), '#4f7d6a', null); }
        }
      }
      plaster(c, { x0, x1, y0, y1: y0 + h, w, h }, { color: 'rgba(120,90,60,.14)', n: Math.round(w * 30), seed });
      if (shop) {
        fillM(c, rectP(x0 + 0.04, y0 + 0.02, x1 - 0.04, y0 + fh0(h, floors) * 0.62), gradM(c, 0, y0 + 0.4, 0, y0, [[0, '#fff3c0'], [1, '#f0c870']]), 'rgba(50,35,20,.8)', 0.008);
        fillM(c, rectP(x0 + 0.02, y0 + fh0(h, floors) * 0.62, x1 - 0.02, y0 + fh0(h, floors) * 0.8), shop.col || '#2f6f5a', 'rgba(30,20,10,.7)', 0.008);
        const { ctx, tf, S } = c; const [X, Y] = tf((x0 + x1) / 2, y0 + fh0(h, floors) * 0.71);
        ctx.save(); ctx.font = `bold ${0.075 * S}px Georgia,serif`; ctx.fillStyle = '#fff6d8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(shop.text, X, Y); ctx.restore();
      }
    },
  });
  const yt = y0 + h;
  if (roof === 'gable') layers.push({ shapes: [gable(x0, x1, yt, rise, 0.07)], fill: { top: mixHex(roofCol, '#ffffff', 0.12), bottom: mixHex(roofCol, '#3a1208', 0.2) }, stroke, deco(c, bb) { roofTiles(c, bb, { h: 0.08, w: 0.1 }); } });
  else if (roof === 'hip') layers.push({ shapes: [poly([[x0 - 0.06, yt], [x1 + 0.06, yt], [x1 - 0.12, yt + rise], [x0 + 0.12, yt + rise]])], fill: { top: mixHex(roofCol, '#ffffff', 0.12), bottom: mixHex(roofCol, '#3a1208', 0.2) }, stroke, deco(c, bb) { roofTiles(c, bb, { h: 0.08, w: 0.1 }); } });
  else layers.push({ shapes: [rectP(x0 - 0.03, yt, x1 + 0.03, yt + 0.05)], fill: '#8c8578', stroke });
  return layers;
}
const fh0 = (h, floors) => h / floors;

// Rauch/Dunst-Schwaden als Dekor sind Sache der Seite; hier nur Hilfsfunktion für Gras auf Mauerkronen
export function grassTop(c, x0, x1, y, n, seed = 1, col = '#6f9a58') {
  const r = mulberry32(seed);
  for (let i = 0; i < n; i++) { const x = x0 + r() * (x1 - x0); line(c, [[x, y], [x + (r() - 0.5) * 0.05, y + 0.05 + r() * 0.07]], col, 0.014); }
}
