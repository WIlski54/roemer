// Station 3: Regler „Lagerbau“ (Graben, Wall, Pfähle, Wachturm, Zelte, Feldzeichen, Feuer entstehen nacheinander)
// und Schieber „Schildkröte“ (Testudo: die Soldaten rücken zusammen und heben die Schilde zu einem Dach, ohne Kampf).
import { clamp, lerp, smooth, easeOutBack, easeOutCubic } from '../engine/util.js';
import { LAY, bodyH } from './_p3_paint.js';

const seg = (v, a, b) => clamp((v - a) / (b - a));
const TINY = 0.0004;

// ============================================================================================== Lager
export function* buildLager(ctx, T) {
  const app = ctx.app;
  const Q = LAY;
  const items = [];
  const reg = (pop, kind, a, b, o = {}) => { const it = { pop, kind, a, b, k: -1, ...o }; items.push(it); return it; };
  const tapMeshes = (pop, fn) => { const ms = pop.fig.hit.slice(); ms.forEach((m) => { m.userData.tap = fn; }); return ms; };
  const openLager = () => { app.audio.sfx('tapp'); app.openCardById('leg_lager'); };

  // ---------------- Querschnitt: Erdblock (immer da), Graben, Wall, Pfähle
  ctx.prop('leg_erdblock', { x: Q.qs.x, z: Q.qs.z, len: Q.qs.w, delay: 0.04 });
  const ditch = ctx.prop('leg_graben', { x: Q.ditch.x, z: Q.ditch.z, y: Q.qs.h, len: 1.24, delay: 0.08 });
  const wall = ctx.prop('leg_wall', { x: Q.wall.x, z: Q.wall.z, len: 2.96, delay: 0.1 });
  const stakes = ctx.prop('leg_palisade', { x: Q.stakes.x, z: Q.stakes.z, y: Q.stakes.y, len: 1.4, delay: 0.14 });
  reg(ditch, 'y', 0.0, 0.2, { ease: smooth });
  reg(wall, 'y', 0.16, 0.34, { ease: easeOutCubic });
  reg(stakes, 'y', 0.3, 0.5, { ease: (t) => easeOutBack(t, 1.1) });
  for (const p of [ditch, wall, stakes]) p.pickMeshes = tapMeshes(p, openLager);
  yield;

  // ---------------- Wachturm mit Wache
  const tower = ctx.prop('leg_turm', { x: Q.tower.x, z: Q.tower.z, h: 5.14, delay: 0.16 });
  tower.pickMeshes = tapMeshes(tower, openLager);
  reg(tower, 'y', 0.42, 0.6, { ease: easeOutCubic });
  const guard = ctx.stand('leg_soldat', { x: Q.tower.x + 0.12, z: Q.tower.z + 0.2, y: Q.tower.guardY, h: bodyH('leg_soldat', 1.42), facing: -1, card: 'leg_legionaer', id: 'person', name: 'Wache', hint: false, delay: 0.2 });
  reg(guard.popup, 'all', 0.56, 0.68, { ease: (t) => easeOutBack(t, 1.4), actor: guard });
  yield;

  // ---------------- Zelte (Reihe A vorn, B, C hinten)
  const tents = Q.tents.map((t, i) => {
    const pop = ctx.prop('leg_zelt', { x: t.x, z: t.z, len: Q.tentLen, variant: t.v, delay: 0.2 + i * 0.01 });
    pop.pickMeshes = []; const meshes = tapMeshes(pop, () => { if (it.k > 0.7) openLager(); });
    const row = t.row, a = 0.58 + (t.x < 0 ? row : 2) * 0.115 + (i % 2) * 0.03;
    const it = reg(pop, 'all', a, a + 0.14, { ease: (k) => easeOutBack(k, 1.5), meshes, tent: t });
    return it;
  });
  yield;

  // ---------------- Feldzeichen, Feuer
  const signum = ctx.prop('leg_signum', { x: Q.signum.x, z: Q.signum.z, h: 3.95, delay: 0.22 });
  const vex = ctx.prop('leg_vexillum', { x: Q.vexillum.x, z: Q.vexillum.z, h: 3.2, delay: 0.24 });
  reg(signum, 'y', 0.84, 0.94, { ease: easeOutCubic });
  reg(vex, 'y', 0.86, 0.96, { ease: easeOutCubic });
  const fire = ctx.prop('leg_feuer', { x: Q.fire.x, z: Q.fire.z, len: 1.2, delay: 0.26 });
  const fireIt = reg(fire, 'all', 0.9, 1.0, { ease: (k) => easeOutBack(k, 1.3) });
  yield;

  // ---------------- die versteckte Gans: erscheint, wenn das Zelt der dritten Reihe steht, und duckt sich dahinter
  const t3 = tents[5];
  const gx = Q.tents[5].x + Q.goose.dx;
  const goose = ctx.stand('gans3', { x: gx, z: Q.goose.z, len: 1.2, facing: -1, card: 'gans3', hidden: true, hint: false, hitPad: 0.2, delay: 0.3 });
  reg(goose.popup, 'all', 0, 1, { actor: goose, follow: t3 });
  yield;

  // ---------------- Regler „Lagerbau“
  const ctl = ctx.control('L', { id: 'lagerbau', label: 'Lagerbau', a: [-3.8, 3.6], b: [-2.1, 3.6], size: [2.3, 0.95], color: '#8a5a32', value: 0, springBack: false, hold: true, ticks: 10 });
  T.lager = ctl;
  let v = 0, lastV = -1, doneHorn = false, lastSfx = 0, dustT = 0;
  const apply = (val) => {
    v = val;
    for (const it of items) {
      let kk;
      if (it.follow) kk = Math.max(TINY, seg(Math.min(1, it.follow.k), 0.55, 1.0));
      else { const k0 = seg(v, it.a, it.b), k = it.ease ? it.ease(k0) : k0; kk = k0 <= 0 ? TINY : Math.max(TINY, k); }
      if (Math.abs(kk - it.k) < 1e-4) continue; it.k = kk;
      const s = it.pop.pivot.scale;
      if (it.kind === 'y') s.set(1, kk, 1); else s.setScalar(kk);
      if (it.meshes) it.pop.pickMeshes = kk > 0.7 ? it.meshes : [];
    }
  };
  // die Gans geht nur mit, solange das Zelt davor steht; ihre Hit-Fläche ist erst dann aktiv
  ctl.on((val) => apply(val));
  ctl.onGrab = () => { app.audio.sfx('grab'); T.intro = false; };
  ctl.onTick = (val) => {
    const now = app.t;
    if (now - lastSfx < 0.12) return; lastSfx = now;
    app.audio.sfx(val < 0.3 ? 'thud' : val < 0.58 ? 'hammer' : 'rustle', { v: val });
  };
  ctl.onRelease = () => app.audio.sfx('snap');
  apply(0);

  ctx.onUpdate((dt, t) => {
    const act = ctx.spread.active;
    // Hinweis-Lauf: beim ersten Mal baut sich das Lager vor deinen Augen auf
    if (T.intro) {
      T.introT += dt; const k = clamp(T.introT / 7.0); const e = smooth(k);
      ctl.touched = true; ctl.setValue(e, { snap: true });
      if (k >= 1) { T.intro = false; T.introDone = true; }
    }
    if (v > 0.985 && !doneHorn && act && ctl.sp.x > 0.985) { doneHorn = true; app.audio.sfx('cornu'); }
    if (v < 0.9) doneHorn = false;
    // Feuer flackert und glüht
    if (fireIt.k > 0.9) {
      fire.pivot.scale.set(1 + Math.sin(t * 9.1) * 0.035, 1 + Math.sin(t * 7.3) * 0.06 + Math.sin(t * 13.7) * 0.03, 1);
      if (act && !app.calm && app.fx) {
        dustT += dt; const fxk = (app.stage && app.stage.tier ? app.stage.tier.fx : 1);
        if (dustT > 0.32 / fxk) {
          dustT = 0; const w = ctx.world(Q.fire.x + (Math.random() - 0.5) * 0.3, 0.9, Q.fire.z);
          app.fx.glow.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.25, vy: 0.55 + Math.random() * 0.4, vz: 0, life: 1.5, size: 0.09, alpha: 0.9, color: [1, 0.62, 0.22], drag: 0.4, grow: -0.02 });
        }
      }
    }
    // Staub beim Graben und Wallbau
    if (act && !app.calm && app.fx && ctl.dragging && v < 0.34) {
      if (Math.random() < 0.35) { const w = ctx.world(Q.ditch.x + (Math.random() - 0.5) * 1.1, Q.qs.h, Q.ditch.z + 0.3); app.fx.dust.emit({ x: w.x, y: w.y, z: w.z, vx: (Math.random() - 0.5) * 0.4, vy: 0.4, vz: 0.2, life: 0.9, size: 0.2, alpha: 0.35, color: [0.7, 0.5, 0.33], drag: 1.2, grav: -0.2, grow: 0.4 }); }
    }
  });
  T.items = items; T.goose = goose; T.tower = tower; T.guard = guard;
  return { ctl, items, apply, getV: () => v };
}

// ============================================================================================== Schildkröte
export function* buildTestudo(ctx, T) {
  const app = ctx.app, S = LAY.soldiers;
  const men = [];
  for (let i = 0; i < S.n; i++) {
    const a = ctx.stand('leg_soldat', { x: S.lead - i * S.gap0, z: S.z + i * 0.015, h: bodyH('leg_soldat', S.h), facing: 1, delay: 0.3 + i * 0.03, card: 'leg_testudo', id: 'person', name: 'Legionär', hint: i === 0 });
    const f = a.fig;
    men.push({ a, f, i, ph: i * 0.9, dist: 0, last: a.popup.group.position.x, sh: f.parts.shield, armA: f.parts.armA, armB: f.parts.armB });
    a.onWake = () => { a.tw.add(0.45, (t) => { a.hop = Math.sin(t * Math.PI) * 0.12; }, { done: () => { a.hop = 0; } }); };
  }
  yield;
  const ctl = ctx.control('L', { id: 'schildkroete', label: 'Schildkröte', a: [-3.6, 2.6], b: [-2.1, 2.6], size: [2.7, 0.9], color: '#6c727a', value: 0, springBack: false, hold: true, ticks: 10 });
  T.testudo = ctl;
  let clink = false, lastSfx = 0;
  const set = (val, dt) => {
    const e = smooth(clamp(val));
    const gap = lerp(S.gap0, S.gap1, e);
    for (const m of men) {
      const nx = S.lead - m.i * gap, dx = nx - m.a.popup.group.position.x;
      m.a.popup.group.position.x = nx;
      if (Math.abs(dx) > 0.0004 && dt > 0) { m.dist += Math.abs(dx); const ph = m.dist * 5.5 + m.ph; m.f.rotatePart('legA', Math.sin(ph) * 0.4); m.f.rotatePart('legB', -Math.sin(ph) * 0.4); m.a.hop = Math.abs(Math.sin(ph)) * 0.05; }
      else if (dt > 0) { m.f.rotatePart('legA', 0); m.f.rotatePart('legB', 0); m.a.hop = 0; }
      // Schild und Arme: der Vordermann hält den Schild vor sich, alle anderen heben ihn über den Kopf (Dach)
      const ws = m.f.ws, g = m.sh;
      if (g) {
        const r = g.userData.rest;
        if (m.i === 0) { g.rotation.z = -0.04 * e; g.position.x = r.px + 0.16 * e * ws; g.position.y = r.py + 0.0 * ws; }
        else { const th = 1.42 + (m.i % 2 ? 0.05 : -0.03); g.rotation.z = th * e; g.position.x = r.px + 0.095 * e * ws; g.position.y = r.py + 1.07 * e * ws; }
      }
      if (m.armA) m.armA.rotation.z = (m.i === 0 ? 0.5 : 2.5) * e;
      if (m.armB) m.armB.rotation.z = (m.i === 0 ? 0.3 : 2.35) * e;
    }
    if (e > 0.97 && !clink) { clink = true; app.audio.sfx('ping'); }
    if (e < 0.9) clink = false;
  };
  ctl.on((val) => set(val, 1 / 60));
  ctl.onGrab = () => app.audio.sfx('grab');
  ctl.onTick = (val) => { const n = app.t; if (n - lastSfx < 0.16) return; lastSfx = n; app.audio.sfx('marsch', { n: 2, v: val }); };
  ctl.onRelease = () => app.audio.sfx('snap');
  set(0, 0);
  return { ctl, men, set };
}
