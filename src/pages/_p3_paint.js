// Station 3 „Die Legion“: Seitengeometrie (Positionen im Seitenrahmen) und gemalte Seitenflächen.
import { PAGES_DE } from '../data/pages.de.js';
import { textCard, printLabel, blotches, speckles, grassTufts, pebbles, roundRect, SERIF } from '../engine/pagepaint.js';
import { mulberry32, TAU } from '../engine/util.js';
import { dither, softLight } from './common.js';
import { ANIMALS } from '../art/registry.js';
import { specBBox } from '../engine/popup.js';

// ctx.stand(h:…) bemisst die GANZE Figur (mit Speer, Adler, Helmbusch). bodyH liefert das h, bei dem der Körper bodyM groß wird.
const _bb = {};
export function bodyH(id, bodyM) {
  if (!_bb[id]) { const sp = ANIMALS[id](); _bb[id] = { h: specBBox(sp).h, m: (sp.meta && sp.meta.heightM) || 1.7 }; }
  return bodyM * _bb[id].h / _bb[id].m;
}

// Alle Positionen im Seitenrahmen (links x −12…0, rechts 0…12; z + = zum Betrachter)
export const LAY = {
  // Querschnitt durch den Lagerrand (links hinten): Erdblock, Graben (V), Wall, Pfähle, Wachturm
  qs: { x: -9.3, z: -0.92, w: 4.8, h: 0.62 },
  ditch: { x: -10.55, z: -0.88 },
  wall: { x: -8.48, z: -0.86 },
  stakes: { x: -8.48, z: -0.82, y: 1.07 },
  tower: { x: -6.2, z: -1.5, guardY: 2.66 },
  // Zeltreihen (vorn = Reihe A, hinten = Reihe C), len = Breite in Weltmaß
  tents: [
    { row: 0, x: -3.95, z: 0.05, v: 0 }, { row: 0, x: -1.7, z: 0.1, v: 1 },
    { row: 1, x: -3.4, z: -0.8, v: 1 }, { row: 1, x: -1.2, z: -0.85, v: 0 },
    { row: 2, x: -3.7, z: -1.65, v: 2 }, { row: 2, x: -1.5, z: -1.7, v: 0 },
    { row: 2, x: 3.3, z: -1.6, v: 1 }, { row: 2, x: 5.7, z: -1.9, v: 0 },
  ],
  tentLen: 2.1,
  fire: { x: -2.65, z: 0.95 },
  signum: { x: -0.85, z: 0.75 }, vexillum: { x: -5.0, z: 0.55 },
  // Schildkröte: Anführer vorn rechts, die anderen reihen sich nach links
  soldiers: { n: 5, lead: -0.85, z: 1.95, gap0: 0.96, gap1: 0.6, h: 1.9 },
  // rechts
  zenturio: { x: 1.55, z: 1.45 }, aquilifer: { x: 3.45, z: 1.25 }, gepaeck: { x: 5.2, z: 1.85 },
  gear: { xMid: 8.97, z: 1.0, ws: 1.75 },
  sun: { x: 9.0, z: -3.8 },
  goose: { dx: -0.3, z: -2.1 },
};

// ---- Kulissenstreifen
export const SKY_STOPS = [[0, '#5a4f8f'], [0.28, '#a9608f'], [0.55, '#ea8c6e'], [0.8, '#fbbd78'], [1, '#fee3a6']];

export function skyDeco(side) {
  return (c, bb) => {
    softLight(c, bb, { color: 'rgba(255,214,140,.55)', cx: side === 'L' ? 0.98 : 0.69, cy: 0.18, r: 0.75 });
    dither(c, bb, '#fff', { n: 50, alpha: 0.1, size: 0.04, seed: side === 'L' ? 5 : 6 });
  };
}
export function hillDeco(c, bb) {
  dither(c, bb, '#3a2040', { n: 90, alpha: 0.1, size: 0.05, seed: 8 });
  softLight(c, bb, { color: 'rgba(255,170,110,.22)', cx: 0.8, cy: 1.0, r: 0.9 });
}
export function nearDeco(c, bb) {
  dither(c, bb, '#fff0c0', { n: 60, alpha: 0.12, size: 0.05, seed: 9 });
  dither(c, bb, '#3a1c10', { n: 80, alpha: 0.14, size: 0.05, seed: 10 });
}

// ---- gemalte Seitenflächen
export function baseDefs() {
  return {
    L: {
      paper: '#f4e3c3', ground: { back: '#d19a63', front: '#b77848' }, margin: 0.3, pageNo: 7, seed: 31,
      draw(ctx, m) {
        const S = m.S;
        blotches(m, { x0: -12, x1: 0, z0: -4.3, z1: 4.3, n: 20, rmin: 0.8, rmax: 2.2, colors: ['rgba(255,226,170,.16)', 'rgba(120,60,30,.08)'], seed: 14 });
        speckles(m, { x0: -11.8, x1: -0.2, z0: -4, z1: 4, n: 420, color: 'rgba(100,55,25,.2)', size: 0.028, seed: 15 });
        pebbles(m, { x0: -11, x1: -0.6, z0: 0.2, z1: 2.4, n: 8, seed: 21 });
        grassTufts(m, { x0: -11.5, x1: -0.5, z0: -3.8, z1: 0.1, n: 14, color: '#8a8a3e', h: 0.2, seed: 22, blades: 4, alpha: 0.5 });
        // Lagergasse zwischen den Zeltreihen und den Schilden: festgetretener, hellerer Weg
        const gasse = (x0, x1, z0, z1, a) => {
          ctx.save(); ctx.fillStyle = `rgba(238,206,154,${a})`; ctx.beginPath();
          const r = mulberry32(3); ctx.moveTo(m.x(x0), m.z(z0));
          for (let x = x0; x <= x1; x += 0.4) ctx.lineTo(m.x(x), m.z(z0 + (r() - 0.5) * 0.12));
          for (let x = x1; x >= x0; x -= 0.4) ctx.lineTo(m.x(x), m.z(z1 + (r() - 0.5) * 0.12));
          ctx.closePath(); ctx.fill(); ctx.restore();
        };
        gasse(-5.2, -0.3, 0.55, 1.25, 0.5);
        gasse(-5.2, -0.3, 0.7, 1.1, 0.3);
        // Spuren der Marschtritte
        ctx.save(); ctx.strokeStyle = 'rgba(110,60,30,.2)'; ctx.lineWidth = 0.05 * S; ctx.lineCap = 'round';
        const r2 = mulberry32(9);
        for (let i = 0; i < 28; i++) { const x = -5.0 + i * 0.17, z = 0.78 + (i % 2) * 0.22 + (r2() - 0.5) * 0.06; ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z)); ctx.lineTo(m.x(x + 0.07), m.z(z)); ctx.stroke(); }
        ctx.restore();
        // Beschriftung des Querschnitts (auf das Papier gedruckt)
        const cap = (t, x, z, w = 0.2) => printLabel(m, t, x, z, { size: w, color: 'rgba(86,44,20,.9)', italic: true, bold: true });
        cap('Graben', LAY.ditch.x, -0.2); cap('Wall mit Pfählen', LAY.wall.x + 0.1, -0.2); cap('Wachturm', LAY.tower.x, -0.2);
        const arrow = (x, z) => { ctx.save(); ctx.fillStyle = 'rgba(86,44,20,.8)'; ctx.beginPath(); ctx.moveTo(m.x(x), m.z(z - 0.09)); ctx.lineTo(m.x(x - 0.1), m.z(z + 0.05)); ctx.lineTo(m.x(x + 0.1), m.z(z + 0.05)); ctx.closePath(); ctx.fill(); ctx.restore(); };
        arrow(LAY.ditch.x, -0.42); arrow(LAY.wall.x + 0.1, -0.42); arrow(LAY.tower.x, -0.42);
        printLabel(m, 'außen', -11.3, -0.62, { size: 0.19, color: 'rgba(86,44,20,.7)', italic: true, bold: false });
        // Textkarte
        const d = PAGES_DE[3];
        textCard(m, { x: -11.35, z: 0.62, w: 5.9, h: 3.2, kicker: d.kicker || d.era, title: d.title, body: d.card, size: 0.275, titleSize: 0.4, sub: d.years });
      },
    },
    R: {
      paper: '#f4e3c3', ground: { back: '#dba96c', front: '#bf8250' }, margin: 0.3, pageNo: 8, seed: 41,
      draw(ctx, m) {
        const S = m.S;
        blotches(m, { x0: 0, x1: 12, z0: -4.3, z1: 4.3, n: 22, rmin: 0.6, rmax: 1.9, colors: ['rgba(255,226,170,.16)', 'rgba(120,60,30,.08)'], seed: 16 });
        speckles(m, { x0: 0.3, x1: 11.8, z0: -4, z1: 4, n: 420, color: 'rgba(100,55,25,.2)', size: 0.028, seed: 17 });
        pebbles(m, { x0: 0.5, x1: 11.5, z0: 2.3, z1: 3.9, n: 10, seed: 23 });
        grassTufts(m, { x0: 0.5, x1: 11.6, z0: -3.8, z1: 0.0, n: 14, color: '#8a8a3e', h: 0.2, seed: 24, blades: 4, alpha: 0.5 });
        // festgetretener Platz vor dem Waffenständer
        ctx.save(); ctx.fillStyle = 'rgba(238,206,154,.42)'; ctx.beginPath(); ctx.ellipse(m.x(8.3), m.z(1.35), 3.6 * S, 1.05 * S, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = 'rgba(238,206,154,.28)'; ctx.beginPath(); ctx.ellipse(m.x(3.0), m.z(1.5), 3.0 * S, 0.8 * S, 0, 0, TAU); ctx.fill(); ctx.restore();
      },
    },
  };
}
