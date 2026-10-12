// Station 3: Aufklappfigur „Legionär ausrüsten“. Der große Legionär steht neben einem Rüstungsständer. Fünf Laschen
// (Helm, Panzer, Schwert, Schild, Speer) lassen je ein Teil vom Ständer an seinen Platz am Körper fahren (Bogenflug).
// Jedes Teil, die Füße (Nagelsandalen) und der Körper sind einzeln antippbar und öffnen ihre Karte.
import { clamp, smooth } from '../engine/util.js';
import { ANIMALS } from '../art/registry.js';
import { specBBox } from '../engine/popup.js';
import { AUS } from '../art/rom/s3_equip.js';
import { LAY } from './_p3_paint.js';

// Reihenfolge der Laschen (von links nach rechts), Beschriftung wie im Hinweistext
const TABS = [
  { key: 'helm', label: 'Helm', parts: ['helm', 'helmInner'], sfx: 'ping' },
  { key: 'panzer', label: 'Panzer', parts: ['panzer'], sfx: 'ping' },
  { key: 'gladius', label: 'Schwert', parts: ['gladius'], sfx: 'ping' },
  { key: 'scutum', label: 'Schild', parts: ['scutum'], sfx: 'thud' },
  { key: 'pilum', label: 'Speer', parts: ['pilum'], sfx: 'tick' },
];
const CENTERS = [1.65, 3.85, 6.05, 8.25, 10.45];

export function buildGear(ctx, T) {
  const app = ctx.app, G = LAY.gear;
  const bb = specBBox(ANIMALS.leg_ausruest());
  const a = ctx.stand('leg_ausruest', { x: G.xMid, z: G.z, h: bb.h * G.ws, card: 'leg_legionaer', id: 'person', name: 'Legionär', hint: true, hitPad: 0.2, delay: 0.25 });
  const fig = a.fig, ws = fig.ws;
  T.gearFig = a;
  const E = { helm: 0, panzer: 0, gladius: 0, scutum: 0, pilum: 0 };
  T.gear = E;

  // ---- Teile aus der Ruhelage am Ständer an den Körper fahren: e = 0 (am Ständer) … 1 (getragen)
  const place = (key, e) => {
    const pc = AUS.pieces[key], k = 1 - e;
    const tab = TABS.find((t) => t.key === key);
    const dx = (pc.rest[0] - pc.pivot[0]) * k, dy = (pc.rest[1] - pc.pivot[1]) * k + pc.arc * Math.sin(Math.PI * e);
    for (const pn of tab.parts) {
      const g = fig.parts[pn]; if (!g) continue;
      const r = g.userData.rest;
      g.position.x = r.px + dx * ws; g.position.y = r.py + dy * ws;
      g.rotation.z = pc.rot * k + Math.sin(Math.PI * e) * (key === 'helm' ? -0.25 : key === 'scutum' ? 0.12 : 0.1);
    }
  };
  for (const t of TABS) place(t.key, 0);

  // ---- Antippen: jedes Teil öffnet seine Karte (Pro-Teil-Treffer statt Sammelfläche)
  const tapCard = (id) => () => { app.audio.sfx('tapp'); app.openCardById(id, undefined); };
  const meshOf = (n) => (fig.parts[n] ? fig.parts[n].children[0] : null);
  a.hitMeshes = a.hitMeshes.filter((m) => m !== a.proxy);
  const wall = meshOf('wand');
  if (wall) { a.hitMeshes = a.hitMeshes.filter((m) => m !== wall); }
  for (const t of TABS) for (const pn of t.parts) { const m = meshOf(pn); if (m) { m.userData.actor = null; m.userData.tap = tapCard(AUS.pieces[t.key].card); } }
  for (const pn of ['legA', 'legB']) { const m = meshOf(pn); if (m) { m.userData.actor = null; m.userData.tap = tapCard('leg_caligae'); } }
  a.onWake = () => { a.tw.add(0.45, (t) => { a.hop = Math.sin(t * Math.PI) * 0.12; }, { done: () => { a.hop = 0; } }); };

  // ---- die fünf Laschen
  const on = {}; let all = false;
  const ctls = TABS.map((t, i) => {
    const c = CENTERS[i];
    const ctl = ctx.control('R', { id: t.key, label: t.label, a: [c - 0.2, 3.58], b: [c + 0.2, 3.58], size: [1.7, 0.85], color: '#a8412c', value: 0, springBack: false, hold: true, ticks: 0 });
    ctl.on((v) => {
      const e = smooth(clamp(v)); E[t.key] = e; place(t.key, e);
      if (e > 0.97 && !on[t.key]) {
        on[t.key] = true; app.audio.sfx(t.sfx);
        if (!app.calm && app.fx) { const w = ctx.world(G.xMid - 2.0, 2.2, G.z + 0.3); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: 0, vy: 0.2, vz: 0, life: 0.5, size: 0.3, alpha: 0.18, color: [1, 0.95, 0.8], grow: 0.8 }); }
        if (TABS.every((x) => E[x.key] > 0.97) && !all) { all = true; app.audio.sfx('chime'); a.tw.add(0.6, (tt) => { a.hop = Math.sin(tt * Math.PI) * 0.18; }, { done: () => { a.hop = 0; } }); }
      }
      if (e < 0.9) { on[t.key] = false; all = false; }
    });
    ctl.onGrab = () => app.audio.sfx('grab'); ctl.onTick = (v) => app.audio.sfx('slide', { v }); ctl.onRelease = () => app.audio.sfx('snap');
    return ctl;
  });
  T.gearCtls = ctls;
  return { actor: a, ctls, place };
}
