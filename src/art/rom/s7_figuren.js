// Station 7: Menschen der Baustelle (alle über person() aus dem gemeinsamen Baukasten, mit eigenen Werkzeug-Layern in parts) und eine Zypresse.
// Ausrichtung: schauen nach +x. Werkzeuge hängen im Arm-Teil (armA, Pivot Schulter) und drehen sich mit ihm; Hand-Punkt (0.03, 0.89).
import { person, mixHex } from './_people.js';
import { blob, limb, poly } from '../dsl.js';
import { line, dot, volume } from '../paint.js';

const WOOD = '#9a6d3a', IRON = { top: '#c9ced4', bottom: '#80868e' };
const OUT = 'rgba(40,20,8,.7)';

// Rührhacke für den Mörtel (Stiel bis zum Boden, breites Blatt)
const hacke = [
  { shapes: [limb([[0.04, 1.02, 0.04], [0.04, 0.12, 0.034]], { per: 4 })], fill: WOOD, stroke: OUT },
  { shapes: [poly([[-0.1, 0.0], [0.2, 0.0], [0.2, 0.2], [-0.1, 0.2]], 1)], fill: IRON, stroke: 'rgba(50,55,65,.75)', deco: (c) => { line(c, [[-0.06, 0.1], [0.16, 0.1]], 'rgba(40,45,55,.5)', 0.012); } },
];
// Schaufel (Blatt unten, Stiel bis über die Hand)
const schaufel = [
  { shapes: [limb([[0.04, 1.08, 0.04], [0.04, 0.2, 0.034]], { per: 4 })], fill: WOOD, stroke: OUT },
  { shapes: [poly([[-0.07, 0.24], [0.15, 0.24], [0.17, 0.08], [0.04, -0.04], [-0.09, 0.08]], 1)], fill: IRON, stroke: 'rgba(50,55,65,.75)' },
];
// Schlägel (Holzhammer) mit Meißel-Kopf
const schlaegel = [
  { shapes: [limb([[0.04, 0.98, 0.04], [0.04, 0.5, 0.034]], { per: 3 })], fill: WOOD, stroke: OUT },
  { shapes: [poly([[-0.1, 0.44], [0.18, 0.44], [0.18, 0.62], [-0.1, 0.62]], 1)], fill: { top: '#b98a52', bottom: '#7e5628' }, stroke: OUT, deco: (c) => { line(c, [[-0.1, 0.53], [0.18, 0.53]], '#4b5058', 0.03); } },
];
// Glasbläserpfeife: vom Mund schräg nach vorn unten, vorn der glühende Glasklumpen mit Kolben
const pfeife = [
  { shapes: [limb([[0.12, 1.49, 0.034], [0.72, 1.23, 0.03], [1.2, 1.03, 0.03]], { per: 6 })], fill: { top: '#a7adb5', bottom: '#6c727a' }, stroke: 'rgba(40,45,55,.8)' },
  { shapes: [blob(1.3, 0.96, 0.17, 0.2, -0.4, 24)], fill: { top: '#ffe08a', bottom: '#ff7a2a' }, stroke: 'rgba(150,50,10,.7)',
    deco: (c, bb) => { dot(c, 1.25, 1.0, 0.07, 'rgba(255,250,210,.9)'); line(c, [[1.2, 1.1], [1.33, 0.9]], 'rgba(255,255,230,.7)', 0.025); } },
];

export const s7_treter = (o = {}) => person({ kind: 'handwerker', id: 's7_treter', name: 'Arbeiter im Tretrad', skin: '#d9a77c', hair: { style: 'short', color: '#4a2f1d' }, tunic: { color: '#cdb98c', color2: '#9a7a48', len: 'short', sleeves: false, belt: '#6b4a2a' }, shoes: 'bare', mood: 'open', ...o });
export const s7_maurer = (o = {}) => person({ kind: 'handwerker', id: 's7_maurer', name: 'Maurer mit Mörtelhacke', skin: '#c99468', hair: { style: 'cap', color: '#3a2a1c' }, tunic: { color: '#d9cfa8', color2: '#a68a52', len: 'short', sleeves: true, belt: '#6b4a2a' }, shoes: 'sandals', parts: { armA: hacke }, ...o });
export const s7_soldat = (o = {}) => person({ kind: 'legionaer', id: 's7_soldat', name: 'Soldat beim Straßenbau', armor: null, helmet: 'galea', near: null, far: null, sword: false,
  tunic: { color: '#d8cba4', color2: '#b8a574', len: 'knee', sleeves: true, belt: '#4a3020' }, shoes: 'caligae', parts: { armA: schaufel }, ...o });
export const s7_steinmetz = (o = {}) => person({ kind: 'handwerker', id: 's7_steinmetz', name: 'Steinmetz', skin: '#b98258', hair: { style: 'curly', color: '#2f2018' }, beard: true,
  tunic: { color: '#bcae86', color2: '#8c7a4e', len: 'short', sleeves: false, belt: '#5a3a1f' }, shoes: 'sandals', parts: { armA: schlaegel }, ...o });
export const s7_glas = (o = {}) => person({ kind: 'handwerker', id: 's7_glas', name: 'Glasbläser', height: 1.7, skin: '#cf9a70', hair: { style: 'bald', color: '#3a2a1c' }, beard: true,
  tunic: { color: '#9bb7a3', color2: '#5f8a76', len: 'knee', sleeves: true, belt: '#5a3a1f' }, shoes: 'sandals', parts: { body: pfeife }, ...o });

// Zypresse (schmale Spindel) – Kulisse
export function zypresse7() {
  const dark = '#2f5f33';
  return { id: 'zypresse7', parts: { body: { z: 1, layers: [
    { shapes: [limb([[0, 0, 0.1], [0, 0.4, 0.1]], { per: 3 })], fill: '#6b4a2a' },
    { shapes: [limb([[0, 0.25, 0.16], [0, 0.9, 0.7], [0.02, 1.9, 0.62], [0, 2.7, 0.3], [0.02, 3.15, 0.02]], { per: 8 })], fill: { top: '#4d8a44', bottom: dark }, stroke: 'rgba(25,55,28,.7)',
      deco: (c, bb) => { volume(c, bb, { dark: 'rgba(10,30,12,.45)', light: 'rgba(210,240,150,.25)' }); for (let i = 0; i < 16; i++) { const y = bb.y0 + 0.2 + i * 0.18; line(c, [[-0.18, y], [0.02, y + 0.22], [0.2, y + 0.04]], 'rgba(20,60,24,.45)', 0.025); } } },
  ] } }, anchors: { top: [0, 3.1] }, meta: { name: 'Zypresse', lengthM: 0.8, heightM: 8 } };
}
