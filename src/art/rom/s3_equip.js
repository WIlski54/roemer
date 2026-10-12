// Station 3: „Legionär ausrüsten“ – der große Legionär (ohne Ausrüstung) vor einer Waffenwand, dazu die fünf Ausrüstungsteile
// (Helm, Schienenpanzer, Gladius, Scutum, Pilum) als eigene Figurenteile, die per Lasche von der Wand an ihren Platz am Körper fahren.
// Maße in Metern (Soldat 1,70 m, schaut nach +x). Die Teile sind in ihrer ENDLAGE am Körper gezeichnet; AUS.pieces nennt Drehpunkt und
// Ruheposition (an der Wand) – die Seite verschiebt/dreht die Teile aus der Ruhelage in die Endlage (Offset = Ruhe − Drehpunkt).
// Kopf- und Körpermaße stammen aus person() (_people.js), Formen für Helm, Panzer, Schild und Pilum sind daran angelehnt (hier nachgebaut).
import { blob, poly, limb } from '../dsl.js';
import { line, dot, volume } from '../paint.js';
import { person } from './_people.js';
import { rect, spec, COL, woodDeco, nail } from './s3_kit.js';

// Kopf wie in person() (height 1,70 → s = 1, headScale 1,14)
const HX = 0.03, HR = 0.125 * 1.14, HD = HR * 1.03, HY = 1.7 - HD;

// ------------------------------------------------------------------------------------------------ Teile (Endlage am Körper)
function helmPart() {
  const dome = poly([[HX - HD * 1.05, HY - 0.02], [HX - HD * 0.95, HY + HD * 0.6], [HX - 0.02, HY + HD * 1.12], [HX + HD * 0.7, HY + HD * 0.7], [HX + HD * 1.0, HY + HD * 0.34], [HX + HD * 1.0, HY + HD * 0.2], [HX - HD * 0.1, HY + HD * 0.22]], 2);
  const neck = poly([[HX - HD * 1.05, HY - 0.02], [HX - HD * 1.1, HY - HD * 0.7], [HX - HD * 0.4, HY - HD * 0.85], [HX - HD * 0.2, HY - 0.02]], 1);
  const cheek = poly([[HX - HD * 0.05, HY + HD * 0.1], [HX + HD * 0.5, HY + HD * 0.1], [HX + HD * 0.6, HY - HD * 0.8], [HX + HD * 0.2, HY - HD * 0.7]], 1);
  const knob = blob(HX - 0.02, HY + HD * 1.16, 0.03, 0.027);
  return { z: 2.8, pivot: [HX, HY + 0.03], layers: [{
    shapes: [dome, neck, cheek, knob], fill: { top: COL.bronzeL, bottom: COL.bronzeD }, stroke: 'rgba(80,50,10,.8)',
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(90,50,5,.3)', light: 'rgba(255,250,200,.2)' });
      line(c, [[HX - HD, HY + 0.1], [HX + HD * 0.98, HY + 0.1]], 'rgba(255,245,200,.55)', 0.012);               // Stirnband
      for (let i = 0; i < 6; i++) dot(c, HX - HD * 0.8 + i * HD * 0.33, HY + 0.1, 0.0075, 'rgba(110,70,10,.8)');  // Nieten
      line(c, [[HX - HD * 0.65, HY + HD * 0.62], [HX - HD * 0.1, HY + HD * 0.98]], 'rgba(255,255,255,.65)', 0.016); // Glanz
      line(c, [[HX + HD * 0.15, HY - 0.05], [HX + HD * 0.22, HY - HD * 0.6]], 'rgba(90,55,10,.5)', 0.01);           // Rand Wangenklappe
    },
  }] };
}

// Innenschale: liegt hinter dem Kopf (unsichtbar, solange der Helm getragen wird) und macht den Helm auf dem Ständer rund
function helmInner() {
  const shell = poly([[HX - HD * 1.0, HY - 0.02], [HX - HD * 0.9, HY + HD * 0.7], [HX - 0.02, HY + HD * 1.0], [HX + HD * 0.75, HY + HD * 0.5], [HX + HD * 0.8, HY - HD * 0.4], [HX + HD * 0.2, HY - HD * 0.85], [HX - HD * 0.9, HY - HD * 0.7]], 2);
  return { z: 1.5, pivot: [HX, HY + 0.03], layers: [{ shapes: [shell], fill: { top: COL.bronze, bottom: COL.bronzeD }, stroke: 'rgba(80,50,10,.8)' }] };
}

function panzerPart() {
  const ch = 0.17;
  const vest = poly([[-ch - 0.02, 1.37], [ch + 0.03, 1.37], [ch + 0.06, 1.2], [ch + 0.05, 0.95], [-ch - 0.05, 0.95], [-ch - 0.06, 1.2]], 2);
  const sh = poly([[-0.15, 1.42], [0.2, 1.42], [0.22, 1.33], [-0.17, 1.33]], 1);
  return { z: 2.3, pivot: [0, 1.18], layers: [{
    shapes: [vest, sh], fill: { top: COL.ironL, bottom: '#8f949b' }, stroke: 'rgba(50,55,65,.75)',
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(30,40,60,.28)', light: 'rgba(255,255,255,.2)' });
      for (let i = 0; i < 9; i++) {                                           // Schienen: abwechselnd hell/dunkel, mit Kante
        const y = 1.34 - i * 0.045;
        line(c, [[-0.3, y], [0.3, y]], 'rgba(40,45,58,.6)', 0.011);
        line(c, [[-0.3, y - 0.012], [0.3, y - 0.012]], 'rgba(255,255,255,.28)', 0.008);
        if (i % 2) line(c, [[-0.3, y - 0.022], [0.3, y - 0.022]], 'rgba(40,45,58,.1)', 0.04);
      }
      for (const y of [1.27, 1.14, 1.02]) dot(c, 0.2, y, 0.016, COL.bronze);  // Schnallen vorn
      line(c, [[0.0, 1.4], [0.01, 0.96]], 'rgba(255,255,255,.35)', 0.02);
      line(c, [[-0.12, 1.4], [-0.1, 1.33]], 'rgba(60,35,15,.8)', 0.03);       // Lederriemen an der Schulter
    },
  }] };
}

function scutumPart() {
  const sh = poly([[-0.2, 1.2], [0.2, 1.2], [0.24, 0.6], [0.2, 0.15], [-0.2, 0.15], [-0.24, 0.6]], 2).map(([x, y]) => [x + 0.2, y]);
  return { z: 2.6, pivot: [0.22, 0.675], layers: [{
    shapes: [sh], fill: { top: '#c9402f', bottom: COL.scarletD }, stroke: 'rgba(50,10,10,.75)',
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(60,10,5,.3)', light: 'rgba(255,200,170,.18)' });
      const cx = 0.22, cy = 0.68;
      line(c, [[cx, 1.15], [cx, 0.2]], '#e8c35a', 0.03);                                           // Mittelrippe
      for (const dy of [0.5, -0.5]) line(c, [[cx - 0.15, cy + dy], [cx + 0.15, cy + dy]], '#e8c35a', 0.02);
      line(c, [[cx - 0.04, cy + 0.08], [cx - 0.14, cy + 0.2], [cx - 0.2, cy + 0.12]], '#e8c35a', 0.016); // Flügelzeichen
      line(c, [[cx + 0.04, cy + 0.08], [cx + 0.14, cy + 0.2], [cx + 0.2, cy + 0.12]], '#e8c35a', 0.016);
      dot(c, cx, cy, 0.075, '#e8c35a'); dot(c, cx, cy, 0.045, '#fff1b0'); dot(c, cx - 0.015, cy + 0.015, 0.012, 'rgba(255,255,255,.8)'); // Schildbuckel
      line(c, [[0.0, 1.2], [0.4, 1.2], [0.44, 0.6], [0.4, 0.15], [0.0, 0.15], [-0.04, 0.6], [0.0, 1.2]], '#7a1a10', 0.02);
    },
  }] };
}

// Gladius in der Scheide am Gürtel (Griff oben); Teil im Rumpf-Bereich links der Körpermitte
function gladiusPart() {
  const scab = limb([[-0.072, 0.985, 0.075], [-0.094, 0.56, 0.064], [-0.1, 0.5, 0.032]], { per: 8 });
  const hilt = [blob(-0.07, 1.003, 0.05, 0.017), limb([[-0.07, 1.0, 0.036], [-0.066, 1.1, 0.038]], { per: 4 }), blob(-0.064, 1.137, 0.032, 0.03)];
  return { z: 2.7, pivot: [-0.07, 0.82], layers: [
    { shapes: [scab], fill: { top: '#8a5f3a', bottom: '#5e3d22' }, stroke: 'rgba(40,20,8,.75)',
      deco(c) { line(c, [[-0.11, 0.95], [-0.04, 0.95]], COL.bronze, 0.022); line(c, [[-0.108, 0.72], [-0.082, 0.72]], COL.bronze, 0.018); line(c, [[-0.1, 0.55], [-0.095, 0.5]], COL.bronze, 0.03); line(c, [[-0.1, 0.9], [-0.093, 0.58]], 'rgba(255,230,190,.25)', 0.012); } },
    { shapes: hilt, fill: { top: '#eadfc4', bottom: '#b9a57c' }, stroke: 'rgba(60,40,15,.75)',
      deco(c) { for (let i = 0; i < 3; i++) line(c, [[-0.085, 1.03 + i * 0.028], [-0.05, 1.03 + i * 0.028]], 'rgba(90,60,20,.5)', 0.008); dot(c, -0.064, 1.137, 0.016, COL.bronzeD); } },
  ] };
}

function pilumPart() {
  const shaft = limb([[0.05, 0.12, 0.036], [0.05, 1.3, 0.036]], { per: 4 });
  const shank = limb([[0.05, 1.26, 0.017], [0.05, 1.98, 0.013]], { per: 6 });
  const head = poly([[0.05, 2.15], [0.082, 1.97], [0.018, 1.97]]);
  const sock = rect(0.03, 1.25, 0.07, 1.37);
  return { z: 2.9, pivot: [0.05, 1.14], layers: [
    { shapes: [shaft], fill: { top: '#b98a52', bottom: '#8a5a34' }, stroke: 'rgba(40,20,8,.75)', deco: woodDeco({ n: 3, vertical: true, w: 0.008 }) },
    { shapes: [shank, head, sock], fill: { top: '#d9dde2', bottom: '#8f949b' }, stroke: 'rgba(50,55,65,.8)', deco(c) { line(c, [[0.044, 1.4], [0.044, 1.95]], 'rgba(255,255,255,.55)', 0.005); } },
  ] };
}

// Rüstungsständer (Mittelpfosten mit Querholz für den Panzer, Knauf für den Helm), Waffenpfosten mit Haken, Fußbalken.
const BW = { x0: 0.55, x1: 2.75, h: 2.05 };
function wandPart() {
  const wood = { top: '#c08a50', bottom: '#8a5c32' };
  const stand = [rect(1.36, 0.05, 1.44, 1.62), limb([[1.02, 1.36, 0.07], [1.22, 1.45, 0.07], [1.4, 1.5, 0.08], [1.58, 1.45, 0.07], [1.78, 1.36, 0.07]], { per: 5 }), blob(1.4, 1.58, 0.07, 0.07, 0, 14), blob(1.02, 1.36, 0.045, 0.045, 0, 10), blob(1.78, 1.36, 0.045, 0.045, 0, 10), rect(1.02, 0, 1.78, 0.07), rect(1.06, 0.0, 1.2, 0.1), rect(1.6, 0.0, 1.74, 0.1)];
  const post = [rect(2.06, 0.05, 2.14, 1.2), limb([[2.1, 1.16, 0.06], [1.99, 1.12, 0.05]], { per: 3 }), rect(1.84, 0, 2.62, 0.07), rect(1.88, 0.0, 2.02, 0.1), rect(2.44, 0.0, 2.58, 0.1), blob(2.1, 1.22, 0.05, 0.05, 0, 12)];
  return { z: 0.4, layers: [
    { shapes: [...stand, ...post], fill: wood, stroke: 'rgba(50,25,10,.75)',
      deco(c, bb) {
        line(c, [[1.4, 0.1], [1.4, 1.6]], 'rgba(60,32,12,.3)', 0.012); line(c, [[2.1, 0.1], [2.1, 1.18]], 'rgba(60,32,12,.3)', 0.012);
        line(c, [[1.1, 1.47], [1.4, 1.52], [1.7, 1.47]], 'rgba(255,225,170,.3)', 0.012); line(c, [[1.04, 0.045], [1.76, 0.045]], 'rgba(255,225,170,.3)', 0.012); line(c, [[1.86, 0.045], [2.6, 0.045]], 'rgba(255,225,170,.3)', 0.012);
        nail(c, 1.4, 1.5, 0.014); nail(c, 1.2, 0.035, 0.012); nail(c, 1.6, 0.035, 0.012); nail(c, 2.0, 0.035, 0.012); nail(c, 2.5, 0.035, 0.012);
      } },
  ] };
}

// ------------------------------------------------------------------------------------------------ Ruhelage der Teile an der Wand
// pivot = Drehpunkt in der Endlage (am Körper), rest = Lage des Drehpunkts an der Wand, rot = Ruhedrehung, arc = Flughöhe, tap = Karte
export const AUS = {
  wand: BW,
  pieces: {
    panzer: { pivot: [0, 1.18], rest: [1.4, 1.13], rot: 0, arc: 0.2, label: 'Panzer', card: 'leg_lorica' },
    helm: { pivot: [HX, HY + 0.03], rest: [1.4, 1.93], rot: 0, arc: 0.32, label: 'Helm', card: 'leg_galea' },
    gladius: { pivot: [-0.07, 0.82], rest: [1.93, 0.84], rot: 0, arc: 0.25, label: 'Schwert', card: 'leg_gladius' },
    scutum: { pivot: [0.22, 0.675], rest: [0.98, 0.54], rot: -0.14, arc: 0.18, label: 'Schild', card: 'leg_scutum' },
    pilum: { pivot: [0.05, 1.14], rest: [2.38, 1.09], rot: 0.03, arc: 0.14, label: 'Speer', card: 'leg_pilum' },
  },
};

// Teil samt Malerei um (dx,dy) verschieben (nur für die Vorschau der Ruhelage in der Galerie)
function shiftPart(part, dx, dy) {
  return { ...part, layers: part.layers.map((l) => ({ ...l, shapes: l.shapes.map((sh) => sh.map(([x, y]) => [x + dx, y + dy])),
    deco: l.deco && ((c, bb) => l.deco({ ...c, tf: (x, y) => c.tf(x + dx, y + dy) }, { ...bb, x0: bb.x0 - dx, x1: bb.x1 - dx, y0: bb.y0 - dy, y1: bb.y1 - dy })) })) };
}
export function ausruest(o = {}) {
  const base = person({ kind: 'legionaer', height: 1.7, armor: null, helmet: null, near: null, far: null, sword: false, id: 'leg_ausruest', ...(o.person || {}) });
  const parts = { ...base.parts, wand: wandPart(), panzer: panzerPart(), scutum: scutumPart(), gladius: gladiusPart(), helmInner: helmInner(), helm: helmPart(), pilum: pilumPart() };
  if (o.rest) for (const [k, pc] of Object.entries(AUS.pieces)) for (const pk of k === 'helm' ? ['helm', 'helmInner'] : [k]) parts[pk] = shiftPart(parts[pk], pc.rest[0] - pc.pivot[0], pc.rest[1] - pc.pivot[1]);
  return spec('leg_ausruest', 'Legionär beim Ausrüsten', parts, base.anchors, { ...base.meta, kind: 'ausruest' });
}

// ------------------------------------------------------------------------------------------------ Einzelstücke für die Karten (Größenvergleich mit dem Menschen)
export function pilumSpec() {
  const p = pilumPart();
  return spec('leg_pilum', 'Pilum', { body: { z: 1, layers: p.layers } }, {}, { sizeH: 1.9 });
}
// Gladius ohne Scheide: Klinge mit Spitze, Griff, Knauf (aufrecht gezeichnet, ca. 0,6 m)
export function gladiusSpec() {
  const blade = poly([[0, 0.0], [0.035, 0.1], [0.04, 0.32], [0.032, 0.42], [-0.032, 0.42], [-0.04, 0.32], [-0.035, 0.1]], 1);
  const guard = blob(0, 0.44, 0.075, 0.018);
  const grip = limb([[0, 0.44, 0.04], [0, 0.55, 0.042]], { per: 4 });
  const pommel = blob(0, 0.585, 0.034, 0.032);
  return spec('leg_gladius', 'Gladius', { body: { z: 1, layers: [
    { shapes: [blade], fill: { top: '#e6e8ea', bottom: '#a9aeb5' }, stroke: 'rgba(50,55,65,.8)', deco(c) { line(c, [[0, 0.04], [0, 0.4]], 'rgba(255,255,255,.55)', 0.01); line(c, [[0.018, 0.1], [0.02, 0.38]], 'rgba(60,65,75,.3)', 0.006); } },
    { shapes: [guard, grip, pommel], fill: { top: '#eadfc4', bottom: '#b9a57c' }, stroke: 'rgba(60,40,15,.8)', deco(c) { for (let i = 0; i < 4; i++) line(c, [[-0.02, 0.46 + i * 0.026], [0.02, 0.46 + i * 0.026]], 'rgba(90,60,20,.5)', 0.007); dot(c, 0, 0.585, 0.017, COL.bronzeD); } },
  ] } }, {}, { sizeH: 0.6 });
}
