// Station 8: Laubbaum (Eiche/Buche am Rhein) und Weide mit hängenden Zweigen.
import { poly, blob, limb } from '../dsl.js';
import { stroke as S0, mixHex, line, dot, volume } from './s8_kit.js';
import { mulberry32 } from '../../engine/util.js';

const stroke = 'rgba(25,55,40,.5)';

export function baum(o = {}) {
  const seed = o.seed || 1, r = mulberry32(seed * 17 + 3), tone = o.tone || 0;
  const g1 = mixHex('#7aa862', '#5f8f70', tone), g2 = mixHex('#4d7a3e', '#3a6a52', tone);
  const trunk = [limb([[0, 0, 0.34], [0.03, 0.9, 0.26], [0.0, 1.6, 0.2]], { per: 6 }), limb([[0.0, 1.3, 0.16], [-0.5, 2.0, 0.1]], { per: 4 }), limb([[0.0, 1.4, 0.16], [0.55, 2.1, 0.1]], { per: 4 })];
  const crown = [blob(0, 2.6, 0.95, 0.75, 0, 26), blob(-0.7, 2.25, 0.62, 0.5, 0, 20), blob(0.72, 2.3, 0.64, 0.5, 0, 20), blob(-0.25, 3.15, 0.55, 0.42, 0, 18), blob(0.4, 3.05, 0.5, 0.4, 0, 18)];
  return {
    id: 's8_baum',
    parts: {
      body: {
        z: 1,
        layers: [
          { shapes: trunk, fill: { top: '#6a4f3a', bottom: '#46321f' }, stroke: 'rgba(30,20,10,.6)', deco(c, bb) { for (let i = 0; i < 6; i++) line(c, [[-0.1 + i * 0.04, 0.05], [-0.08 + i * 0.04, 1.4]], 'rgba(30,20,10,.3)', 0.014); } },
          {
            shapes: crown, fill: { top: g1, bottom: g2 }, stroke,
            deco(c, bb) { for (let i = 0; i < 70; i++) dot(c, bb.x0 + r() * bb.w, bb.y0 + r() * bb.h, 0.03 + r() * 0.05, r() > 0.5 ? 'rgba(200,235,150,.4)' : 'rgba(20,60,40,.35)'); volume(c, bb, { dark: 'rgba(10,30,30,.3)', light: 'rgba(255,255,230,.14)' }); },
          },
        ],
      },
    },
    anchors: { top: [0, 3.6] }, meta: { name: 'Laubbaum', lengthM: 2.7, heightM: 3.6 },
  };
}
