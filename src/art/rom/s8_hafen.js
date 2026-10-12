// Station 8: Hafen mit Speicher, Kran und Kisten; Inschriftenstein (Weihestein); Meilenstein mit Jahreszahl; Konstantin-Statue.
import { poly, blob, limb, xf } from '../dsl.js';
import { person } from './_people.js';
import {
  stroke, rectP, mixHex, merlons, fillM, circM, gradM, houseLayers,
  brickwork, ashlar, roofTiles, plaster, woodGrain, volume, line, dot,
} from './s8_kit.js';
import { mulberry32 } from '../../engine/util.js';

const SERIF = "Georgia,'Palatino Linotype',Palatino,'Book Antiqua',serif";
const shade = (a, t) => mixHex(a, '#1c1410', t);
const lite = (a, t) => mixHex(a, '#ffffff', t);
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- Hafen
export function hafen() {
  const wood = '#8c6a48';
  const layers = [];
  // Speicherhaus (Horreum) hinten links
  layers.push({
    shapes: [rectP(-1.56, 0.4, -0.2, 1.38)], fill: { top: '#f0e4c8', bottom: '#d8c496' }, stroke,
    deco(c, bb) {
      plaster(c, bb, { color: 'rgba(120,90,60,.16)', n: 60, seed: 3 });
      fillM(c, [[-1.36, 0.4], [-0.9, 0.4], [-0.9, 1.0], [-1.13, 1.12], [-1.36, 1.0]], '#4a3422', 'rgba(30,20,10,.8)', 0.015);
      line(c, [[-1.13, 0.4], [-1.13, 1.1]], 'rgba(255,220,170,.35)', 0.012);
      fillM(c, rectP(-0.72, 0.85, -0.42, 1.1), '#3a2a1c', 'rgba(30,20,10,.8)', 0.012);
      for (let i = 0; i < 4; i++) line(c, [[-1.55 + i * 0.01, 0.46 + i * 0.22], [-0.2, 0.46 + i * 0.22]], 'rgba(120,90,60,.12)', 0.01);
      volume(c, bb, { dark: 'rgba(40,40,50,.2)', light: 'rgba(255,255,255,.12)' });
    },
  });
  layers.push({
    shapes: [poly([[-1.66, 1.36], [-0.1, 1.36], [-0.88, 1.84]])], fill: { top: '#c9694a', bottom: '#8f402c' }, stroke,
    deco(c, bb) { roofTiles(c, bb, { h: 0.1, w: 0.14 }); },
  });
  // Kaimauer (Stein)
  layers.push({
    shapes: [rectP(-1.6, 0, 1.6, 0.4), rectP(-1.64, 0.4, 1.64, 0.49)], fill: { top: '#d6cdb4', bottom: '#a29880' }, stroke,
    deco(c, bb) {
      ashlar(c, bb, { tone: 'rgba(90,70,50,.16)', line: 'rgba(70,58,42,.45)', h: 0.2, w: 0.42, seed: 13 });
      plaster(c, bb, { color: 'rgba(60,100,70,.3)', n: 36, seed: 6 });
      for (const x of [0.2, 0.95, 1.45]) { fillM(c, [[x - 0.05, 0.06], [x + 0.05, 0.06], [x + 0.05, 0.12], [x - 0.05, 0.12]], '#4a3a2c', null); }
      volume(c, bb, { dark: 'rgba(30,40,60,.3)', light: 'rgba(255,255,255,.1)' });
    },
  });
  // Poller
  const poller = (x) => poly([[x - 0.07, 0.49], [x + 0.07, 0.49], [x + 0.06, 0.62], [x + 0.09, 0.66], [x - 0.09, 0.66], [x - 0.06, 0.62]]);
  layers.push({ shapes: [poller(1.3), poller(0.55)], fill: '#3f352c', stroke });
  // Tretradkran: Mast, Ausleger, Rad, Seil, hängende Kiste
  const mast = limb([[0.35, 0.49, 0.2], [0.35, 2.35, 0.14]], { per: 3, caps: false });
  const jib = limb([[0.3, 2.28, 0.13], [1.5, 2.1, 0.09]], { per: 3, caps: false });
  const brace = limb([[0.35, 1.6, 0.09], [1.0, 2.15, 0.07]], { per: 3, caps: false });
  layers.push({
    shapes: [mast, jib, brace, rectP(0.18, 0.49, 0.52, 0.58)], fill: { top: lite(wood, 0.15), bottom: shade(wood, 0.25) }, stroke,
    deco(c, bb) { woodGrain(c, bb, { color: 'rgba(50,28,10,.35)', n: 8, seed: 3, vertical: true }); },
  });
  // Tretrad: Reifen mit Speichen
  layers.push({
    shapes: [blob(0.35, 1.2, 0.46, 0.46, 0, 36)], fill: { top: lite(wood, 0.1), bottom: shade(wood, 0.2) }, stroke,
    deco(c) {
      const { ctx, tf, S } = c;
      for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.2; line(c, [[0.35, 1.2], [0.35 + Math.cos(a) * 0.42, 1.2 + Math.sin(a) * 0.42]], 'rgba(50,28,10,.75)', 0.04); }
      const [X, Y] = tf(0.35, 1.2); ctx.beginPath(); ctx.arc(X, Y, 0.37 * S, 0, TAU); ctx.strokeStyle = 'rgba(50,28,10,.7)'; ctx.lineWidth = 0.035 * S; ctx.stroke();
      dot(c, 0.35, 1.2, 0.06, '#3a2a1c');
    },
  });
  layers.push({ shapes: [limb([[1.46, 2.1, 0.02], [1.46, 1.55, 0.02]], { per: 2, caps: false }), rectP(1.28, 1.2, 1.64, 1.56)], fill: { top: '#b98a52', bottom: '#8a6030' }, stroke, deco(c, bb) { woodGrain(c, bb, { color: 'rgba(50,28,10,.4)', n: 4, seed: 9 }); line(c, [[1.28, 1.2], [1.64, 1.56]], 'rgba(50,28,10,.35)', 0.02); line(c, [[1.28, 1.56], [1.64, 1.2]], 'rgba(50,28,10,.35)', 0.02); } });
  // Kisten und Fässer auf dem Kai
  const crate = (x, y, w, h) => rectP(x, y, x + w, y + h);
  layers.push({
    shapes: [crate(-0.1, 0.49, 0.36, 0.32), crate(-0.05, 0.81, 0.28, 0.26), crate(0.62, 0.49, 0.3, 0.26)], fill: { top: '#c19a62', bottom: '#8f6a38' }, stroke,
    deco(c, bb) { woodGrain(c, bb, { color: 'rgba(50,28,10,.38)', n: 8, seed: 5 }); for (const [x, y, w, h] of [[-0.1, 0.49, 0.36, 0.32], [-0.05, 0.81, 0.28, 0.26], [0.62, 0.49, 0.3, 0.26]]) { line(c, [[x, y], [x + w, y + h]], 'rgba(50,28,10,.35)', 0.018); line(c, [[x, y + h], [x + w, y]], 'rgba(50,28,10,.35)', 0.018); } },
  });
  const barrel = (x, y) => blob(x, y + 0.2, 0.17, 0.2, 0, 20);
  layers.push({
    shapes: [barrel(1.0, 0.49), barrel(1.0 + 0.0, 0.89)].slice(0, 1), fill: { top: '#a8744a', bottom: '#74482a' }, stroke,
    deco(c) { for (const y of [0.57, 0.69, 0.8]) line(c, [[0.84, y], [1.16, y]], 'rgba(40,30,25,.65)', 0.022); },
  });
  return { id: 's8_hafen', parts: { body: { z: 1, layers } }, anchors: { crane: [1.46, 2.1], quay: [1.3, 0.5], top: [0.35, 2.4] }, meta: { name: 'Hafen', lengthM: 3.3, heightM: 2.4 } };
}

// ---------------------------------------------------------------- Inschriftenstein (Weihestein / Altar mit Widmung, erfundene Zeilen)
export function inschriftenstein() {
  const W = 0.9, stone = '#d2cbb6';
  const body = [rectP(-0.5, 0, 0.5, 0.2), rectP(-0.42, 0.2, 0.42, 0.34), rectP(-0.36, 0.34, 0.36, 1.46), rectP(-0.44, 1.46, 0.44, 1.56), rectP(-0.5, 1.56, 0.5, 1.7), blob(-0.4, 1.78, 0.14, 0.13, 0, 14), blob(0.4, 1.78, 0.14, 0.13, 0, 14), rectP(-0.4, 1.7, 0.4, 1.8)];
  return {
    id: 's8_inschrift',
    parts: {
      body: {
        z: 1,
        layers: [{
          shapes: body, fill: { top: lite(stone, 0.2), bottom: shade(stone, 0.2) }, stroke,
          deco(c, bb) {
            const { ctx, tf, S } = c; const r = mulberry32(7);
            for (let i = 0; i < 70; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.008 + r() * 0.016, r() > 0.5 ? 'rgba(90,80,62,.2)' : 'rgba(255,252,240,.32)');
            for (let i = 0; i < 18; i++) dot(c, -0.4 + r() * 0.8, 0.02 + r() * 0.16, 0.012 + r() * 0.02, 'rgba(98,130,70,.38)');
            // Inschriftenfeld
            fillM(c, rectP(-0.3, 0.46, 0.3, 1.38), gradM(c, 0, 1.38, 0, 0.46, [[0, '#bbb39d'], [1, '#d2cab5']]), 'rgba(60,50,35,.6)', 0.012);
            const lines = ['I·O·M', 'AVRELIVS', 'V·S·L·M'];
            ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            lines.forEach((t, i) => {
              const y = 1.2 - i * 0.28, [X, Y] = tf(0, y), size = (i === 1 ? 0.15 : 0.19) * S;
              ctx.font = `bold ${size}px ${SERIF}`;
              let sc = 1; const mw = ctx.measureText(t).width; if (mw > 0.52 * S) sc = (0.52 * S) / mw;
              ctx.save(); ctx.translate(X, Y); ctx.scale(sc, 1);
              ctx.fillStyle = 'rgba(255,250,232,.65)'; ctx.fillText(t, 0.012 * S, 0.012 * S);
              ctx.fillStyle = '#3d362a'; ctx.fillText(t, 0, 0); ctx.restore();
            });
            ctx.restore();
            line(c, [[-0.36, 1.46], [0.36, 1.46]], 'rgba(60,50,35,.5)', 0.012); line(c, [[-0.42, 0.34], [0.42, 0.34]], 'rgba(60,50,35,.5)', 0.012);
            // kleine Rosette im Giebelfeld
            circM(c, 0, 1.63, 0.06, 'rgba(150,140,118,.7)', 'rgba(60,50,35,.5)', 0.008);
            volume(c, bb, { dark: 'rgba(30,30,40,.2)', light: 'rgba(255,255,255,.1)' });
          },
        }],
      },
    },
    anchors: { top: [0, 1.85], mid: [0, 0.9] }, meta: { name: 'Inschriftenstein', lengthM: W, heightM: 1.85 },
  };
}

// ---------------------------------------------------------------- Meilenstein mit Jahreszahl (variant.year)
export function meilenstein(o = {}) {
  const year = String(o.year || '395');
  const shapes = [rectP(-0.3, 0, 0.3, 0.14), rectP(-0.24, 0.14, 0.24, 0.26), poly([[-0.17, 0.26], [0.17, 0.26], [0.15, 1.32], [-0.15, 1.32]]), rectP(-0.21, 1.32, 0.21, 1.4), blob(0, 1.5, 0.15, 0.13, 0, 18)];
  return {
    id: 's8_meilenstein',
    parts: {
      body: {
        z: 1,
        layers: [{
          shapes, fill: { stops: [[0, '#b0a890'], [0.3, '#e0d9c4'], [0.7, '#cfc8b2'], [1, '#a09882']], dir: 'h' }, stroke,
          deco(c, bb) {
            const { ctx, tf, S } = c; const r = mulberry32(year.length * 51 + +year % 97);
            for (let i = 0; i < 40; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.006 + r() * 0.012, r() > 0.5 ? 'rgba(90,80,62,.2)' : 'rgba(255,252,240,.3)');
            for (let i = 0; i < 10; i++) dot(c, -0.25 + r() * 0.5, 0.15 + r() * 0.1, 0.01 + r() * 0.016, 'rgba(98,130,70,.4)');
            ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            const [X, Y] = tf(0, 1.0); ctx.font = `bold ${0.135 * S}px ${SERIF}`; ctx.fillStyle = 'rgba(255,250,232,.7)'; ctx.fillText(year, X + 0.008 * S, Y + 0.01 * S); ctx.fillStyle = '#3d362a'; ctx.fillText(year, X, Y);
            const [X2, Y2] = tf(0, 0.82); ctx.font = `italic ${0.065 * S}px ${SERIF}`; ctx.fillStyle = '#4c4536'; ctx.fillText('n. Chr.', X2, Y2);
            ctx.restore();
            line(c, [[-0.15, 0.68], [0.15, 0.68]], 'rgba(60,50,35,.45)', 0.01); line(c, [[-0.15, 1.18], [0.15, 1.18]], 'rgba(60,50,35,.45)', 0.01);
            volume(c, bb, { dark: 'rgba(30,30,40,.2)', light: 'rgba(255,255,255,.08)' });
          },
        }],
      },
    },
    anchors: { top: [0, 1.65] }, meta: { name: 'Meilenstein ' + year, lengthM: 0.6, heightM: 1.65 },
  };
}

// ---------------------------------------------------------------- Konstantin als Bronzestatue auf Sockel (variant: keine)
export function konstantin() {
  const ph = 0.72;
  const sp = person({
    kind: 'kaiser', height: 1.7, skin: '#c9a25a', hair: { style: 'curly', color: '#8a6a30' },
    toga: { color: '#c7a24c', border: '#9a7a30' }, tunic: { color: '#c7a24c', color2: '#9a7a30', len: 'ankle', sleeves: true, belt: null }, shoes: 'shoes', mood: 'serious',
  });
  const parts = {};
  for (const [k, p] of Object.entries(sp.parts)) {
    parts[k] = { ...p, z: (p.z ?? 0) + 1, pivot: p.pivot ? [p.pivot[0], p.pivot[1] + ph] : undefined, layers: p.layers.map((l) => ({ ...l, shapes: l.shapes.map((sh) => sh.map(([x, y]) => [x, y + ph])), deco: l.deco ? (c, bb) => { const { tf } = c; const tf2 = (x, y) => tf(x, y + ph); l.deco({ ...c, tf: tf2, px: tf2 }, { ...bb, y0: bb.y0 - ph, y1: bb.y1 - ph }); } : undefined })) };
    if (!p.pivot) delete parts[k].pivot;
  }
  parts.sockel = {
    z: 0,
    layers: [{
      shapes: [rectP(-0.5, 0, 0.5, 0.14), rectP(-0.42, 0.14, 0.42, 0.6), rectP(-0.5, 0.6, 0.5, ph)], fill: { top: '#e6e0d0', bottom: '#b9b19a' }, stroke,
      deco(c, bb) {
        const { ctx, tf, S } = c; const r = mulberry32(3);
        for (let i = 0; i < 40; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.008 + r() * 0.016, r() > 0.5 ? 'rgba(90,80,62,.2)' : 'rgba(255,252,240,.3)');
        fillM(c, rectP(-0.32, 0.22, 0.32, 0.52), 'rgba(120,112,92,.2)', 'rgba(60,50,35,.5)', 0.01);
        ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; const [X, Y] = tf(0, 0.37);
        ctx.font = `bold ${0.2 * S}px ${SERIF}`; ctx.fillStyle = 'rgba(255,250,232,.7)'; ctx.fillText('313', X + 0.01 * S, Y + 0.012 * S); ctx.fillStyle = '#3d362a'; ctx.fillText('313', X, Y); ctx.restore();
        volume(c, bb, { dark: 'rgba(30,30,40,.2)', light: 'rgba(255,255,255,.1)' });
      },
    }],
  };
  return { id: 's8_konstantin', parts, anchors: { top: [0, ph + 1.75], head: [0.03, ph + 1.55] }, meta: { ...(sp.meta || {}), name: 'Kaiser Konstantin', lengthM: 1.2, heightM: ph + 1.78 } };
}
