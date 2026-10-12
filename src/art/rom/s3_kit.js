// Station 3 „Die Legion“: kleine gemeinsame Helfer für die Figuren-Specs dieser Station (Farben, Holz, Leder, Spec-Hülle).
//   import { rect, spec, COL, woodDeco, mixHex } from './s3_kit.js';
// Alle Maße in Metern, y nach oben, Boden bei y = 0.
import { blob, poly, limb } from '../dsl.js';
import { line, dot } from '../paint.js';
import { mulberry32 } from '../../engine/util.js';
import { mixHex } from './_people.js';
export { mixHex };

export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export const spec = (id, name, parts, anchors = {}, meta = {}) => ({ id, parts, anchors, meta: { name, ...meta } });

export const COL = {
  rust: '#a8412c', rustD: '#7a2a1c', scarlet: '#b3352a', scarletD: '#8e2418',
  ironL: '#e6e8ea', iron: '#aeb3ba', ironD: '#7d848c', ironDD: '#4a5058',
  bronzeL: '#f3d78a', bronze: '#d3a443', bronzeD: '#9c7226',
  woodL: '#c9985a', wood: '#a8793f', woodD: '#6b4a2a', woodDD: '#4a301b',
  leatherL: '#ecd3a0', leather: '#c9a572', leatherD: '#8f6a3e',
  earthL: '#b08256', earth: '#8a5a3a', earthD: '#5e3b26',
  edge: 'rgba(50,30,15,.55)',
};

// Holzmaserung als deco-Funktion für Layer (Linien entlang x oder y)
export function woodDeco({ n = 7, seed = 2, vertical = true, color = 'rgba(60,30,10,.32)', w = 0.012, light = 'rgba(255,230,180,.16)', plank = 0 } = {}) {
  return (c, bb) => {
    const r = mulberry32(seed);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.2 + r() * 0.6) / n;
      if (vertical) {
        const x = bb.x0 + t * bb.w;
        line(c, [[x, bb.y0], [x + (r() - 0.5) * 0.03, bb.y0 + bb.h * 0.5], [x + (r() - 0.5) * 0.03, bb.y1]], i % 2 ? color : light, w);
      } else {
        const y = bb.y0 + t * bb.h;
        line(c, [[bb.x0, y], [bb.x0 + bb.w * 0.5, y + (r() - 0.5) * 0.03], [bb.x1, y + (r() - 0.5) * 0.03]], i % 2 ? color : light, w);
      }
    }
    if (plank) for (let x = bb.x0 + plank; x < bb.x1 - 0.01; x += plank) line(c, [[x, bb.y0], [x, bb.y1]], 'rgba(40,20,8,.55)', w * 1.3);
  };
}

// Nagelkopf / Niete
export const nail = (c, x, y, r = 0.014, col = 'rgba(40,40,45,.8)') => { dot(c, x, y, r, col); dot(c, x - r * 0.25, y + r * 0.25, r * 0.4, 'rgba(255,255,255,.4)'); };

// Seil als dünner Strang
export const rope = (pts, w = 0.03) => limb(pts.map(([x, y]) => [x, y, w]), { per: 6 });

export { blob, poly, limb };
