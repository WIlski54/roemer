// Spread manager: builds spreads lazily (generator based, frame-budgeted), attaches them to leaf faces, activates/deactivates.
import * as THREE from 'three';
import { Book } from './book.js';
import { PAGE_W as W, PAGE_D as D } from './scene.js';
import { PageSide, Popup, Actor, Control, makeFigure, makeFlat, FOLD } from './popup.js';
import { paintPageBase, toTexture, makeMap, rectFor, coverRect } from './pagepaint.js';
import { clamp, lerp } from './util.js';

// ----------------------------------------------------------------- context given to page definitions
export class SpreadCtx {
  constructor(app, spread) {
    this.app = app; this.spread = spread; this.book = app.book; this.def = spread.def; this.k = spread.k;
    this.L = spread.L; this.R = spread.R;
    this.t = 0;
  }
  sideAt(x) { return x < 0 ? this.L : this.R; }
  sideKey(k) { return k === 'L' ? this.L : this.R; }
  fig(id, o) { return makeFigure(id, o); }

  // tappable standing animal. o: {x,z,len|h,facing,delay,lean,card,hint,variant,name,y,ox}
  stand(idOrFig, o = {}) {
    const fig = typeof idOrFig === 'string' ? makeFigure(idOrFig, o) : idOrFig;
    const side = this.sideAt(o.x ?? 0);
    const pop = new Popup(side, { x: o.x ?? 0, z: o.z ?? 0, y: o.y || 0, delay: o.delay || 0, lean: o.lean || 0, k: o.k || 150, d: o.d || 12.5, name: 'pop-' + fig.id });
    const midx = ((fig.bbox.x0 + fig.bbox.x1) / 2) * fig.ws * fig.facing;
    fig.group.position.set(-midx + (o.ox || 0), 0, 0);
    pop.add(fig.group); side.addPopup(pop);
    const act = new Actor(side, fig, pop, { id: o.id || fig.id, card: o.card === undefined ? fig.id : o.card, name: o.name || fig.meta.name || fig.id, hint: o.hint !== false, hitPad: o.hitPad });
    act.hidden = !!o.hidden;
    if (o.card === null) { act.card = null; act.hint = false; }
    side.addActor(act);
    return act;
  }
  // scenery prop from the art registry (plants, rocks, sun ...). o: {x,z,y,len|h,facing,delay,lean,variant,receive}
  prop(id, o = {}) {
    const fig = makeFigure(id, { thickness: 0.02, border: o.border ?? 0.03, ...o });
    const side = this.sideAt(o.x ?? 0);
    const pop = new Popup(side, { x: o.x ?? 0, z: o.z ?? 0, y: o.y || 0, delay: o.delay || 0, lean: o.lean || 0, yaw: o.yaw || 0, k: o.k || 120, d: o.d || 11, name: 'prop-' + id });
    const midx = ((fig.bbox.x0 + fig.bbox.x1) / 2) * fig.ws * fig.facing;
    fig.group.position.set(-midx + (o.ox || 0), 0, 0);
    if (o.cast === false) fig.setCast(false);
    pop.add(fig.group); side.addPopup(pop); pop.fig = fig; side.own(fig);
    return pop;
  }
  // scenery flat from a part spec. o: {x,z,ws,delay,lean,yaw,thickness,border,ppu,name}
  flat(part, o = {}) {
    const side = this.sideAt(o.x ?? 0);
    const pop = new Popup(side, { x: o.x ?? 0, z: o.z ?? 0, y: o.y || 0, delay: o.delay || 0, lean: o.lean || 0, yaw: o.yaw || 0, k: o.k || 120, d: o.d || 11, name: o.name || 'flat' });
    const cut = makeFlat(part, { ws: o.ws || 1, ppu: o.ppu || this.app.q.ppu, thickness: o.thickness || 0.02, border: o.border ?? 0.03, name: (this.def.id || 'p') + ':' + (o.name || 'flat') + ':' + Math.round((o.x || 0) * 10) + ':' + Math.round((o.z || 0) * 10), maxTex: o.maxTex || this.app.q.maxTex });
    cut.mesh.position.x += o.ox || 0;
    cut.mesh.receiveShadow = !!o.receive;
    pop.add(cut.mesh); side.addPopup(pop); side.own(cut);
    pop.cut = cut;
    return pop;
  }
  // two crossed flats (pseudo-3D volume): volcano, rocks
  cross(part, o = {}) {
    const a = this.flat(part, { ...o, yaw: (o.yaw || 0) + 0.62, name: (o.name || 'cross') + 'A' });
    const b = this.flat(part, { ...o, yaw: (o.yaw || 0) - 0.62, name: (o.name || 'cross') + 'B', delay: (o.delay || 0) + 0.04 });
    return [a, b];
  }
  control(sideKey, o) { const side = typeof sideKey === 'string' ? this.sideKey(sideKey) : sideKey; return side.addControl(new Control(side, o)); }
  onUpdate(fn) { this.spread.updaters.push(fn); }
  addTo(sideKey, obj) { return this.sideKey(sideKey).add(obj); }
  // world position of a page-frame point (page is flat when active)
  world(x, y, z) { const s = x < 0 ? this.L : this.R; return new THREE.Vector3(x + this.book.group.position.x, this.book.pageTopY(x < 0 ? 'L' : 'R', this.k) + y, z + this.book.group.position.z); }
}

// ----------------------------------------------------------------- one spread
export class Spread {
  constructor(app, def, k) {
    this.app = app; this.def = def; this.k = k; this.built = false; this.building = false;
    this.updaters = []; this.active = false; this.promise = null;
    const f = Book.spreadFaces(k);
    this.fl = f.left; this.fr = f.right;
    this.L = new PageSide('L', k, app.book.leaves[f.left.leaf], f.left.face, app.book);
    this.R = new PageSide('R', k, app.book.leaves[f.right.leaf], f.right.face, app.book);
    this.L.group.visible = this.R.group.visible = false;
    // lite textures (always present)
    this.lite = {};
  }
  get sides() { return [this.L, this.R]; }
  setPresent(on) { this.L.present = on; this.R.present = on; }
  mount() {
    const b = this.app.book;
    b.faceMount(this.fl.leaf, this.fl.face).add(this.L.group);
    b.faceMount(this.fr.leaf, this.fr.face).add(this.R.group);
  }

  *load() {
    const app = this.app, def = this.def, b = app.book;
    this.building = true;
    this.mount();
    const pageTex = app.q.pageTex;
    const baseDefs = typeof def.base === 'function' ? def.base() : (def.base || {});
    for (const sk of ['L', 'R']) {
      const side = sk === 'L' ? this.L : this.R;
      const bd = baseDefs[sk] || {};
      const isCoverBack = sk === 'L' && this.k === 0;
      const rect = isCoverBack ? coverRect('L') : rectFor(sk);
      const pp = paintPageBase({ pxW: pageTex * (isCoverBack ? (rect.x1 - rect.x0) / W : 1), side: sk, rect, ...bd });
      const tex = toTexture(pp.canvas, { aniso: app.maxAniso }); side.textures.push(tex);
      side.base = pp;
      const face = sk === 'L' ? this.fl : this.fr;
      b.setFaceTexture(face.leaf, face.face, tex);
      yield;
    }
    const ctx = new SpreadCtx(app, this);
    this.ctx = ctx;
    if (def.build) { const g = def.build(ctx); if (g && g.next) { let r; while (!(r = g.next()).done) yield; } }
    this.built = true; this.building = false;
    this.setPresent(true);
    // folded until activated
    for (const s of this.sides) for (const p of s.popups) p.snap(0);
  }

  activate(now) {
    this.active = true; this.setPresent(true);
    for (const s of this.sides) s.setActive(true, now);
    this.def.onActivate && this.def.onActivate(this.ctx, now);
  }
  deactivate() {
    if (!this.active) return;
    this.active = false;
    for (const s of this.sides) s.setActive(false, 0);
    this.def.onDeactivate && this.def.onDeactivate(this.ctx);
  }
  update(dt, now) {
    if (!this.built) return;
    for (const s of this.sides) s.update(dt, now);
    for (const u of this.updaters) u(dt, now, this);
    if (this.def.update) this.def.update(dt, now, this.ctx);
  }
  dispose() {
    if (!this.built && !this.building) return;
    this.setPresent(false);
    const b = this.app.book;
    for (const s of this.sides) s.dispose();
    this.def.dispose && this.def.dispose(this.ctx);
    b.setFaceTexture(this.fl.leaf, this.fl.face, this.lite.L); b.setFaceTexture(this.fr.leaf, this.fr.face, this.lite.R);
    this.L = new PageSide('L', this.k, b.leaves[this.fl.leaf], this.fl.face, b); this.R = new PageSide('R', this.k, b.leaves[this.fr.leaf], this.fr.face, b);
    this.updaters = []; this.built = false; this.building = false; this.active = false; this.ctx = null;
  }
}

// ----------------------------------------------------------------- manager
export class Spreads {
  constructor(app, defs) {
    this.app = app; this.defs = defs; this.list = defs.map((d, i) => new Spread(app, d, i));
    this.cur = -1; this.jobs = []; this.running = null;
    this.makeLite();
  }
  makeLite() {
    const b = this.app.book;
    for (const s of this.list) {
      const baseDefs = typeof s.def.base === 'function' ? s.def.base() : (s.def.base || {});
      for (const sk of ['L', 'R']) {
        const bd = baseDefs[sk] || {}; const g = bd.ground || { back: '#d9b27a', front: '#c08a52' };
        const c = document.createElement('canvas'); c.width = 128; c.height = 91;
        const x = c.getContext('2d'); x.fillStyle = bd.paper || '#f4ead2'; x.fillRect(0, 0, 128, 91);
        const gr = x.createLinearGradient(0, 4, 0, 87); gr.addColorStop(0, g.back); gr.addColorStop(1, g.front);
        x.fillStyle = gr; x.fillRect(4, 4, 120, 83);
        const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; s.lite[sk] = t;
        const face = sk === 'L' ? s.fl : s.fr; b.setFaceTexture(face.leaf, face.face, t);
      }
    }
  }
  // request a spread (resolves once built)
  ensure(k) {
    const s = this.list[k]; if (!s) return Promise.resolve();
    if (s.built) return Promise.resolve();
    if (s.promise) return s.promise;
    s.promise = new Promise((res) => { this.jobs.push({ s, res, gen: s.load() }); });
    s.promise.then(() => { s.promise = null; });
    return s.promise;
  }
  // frame-budgeted work: call every frame (ms budget)
  pump(budget = 8) {
    const t0 = performance.now();
    while (this.jobs.length && performance.now() - t0 < budget) {
      const j = this.jobs[0];
      let r;
      try { r = j.gen.next(); } catch (e) { console.error('spread load failed', j.s.k, e); this.jobs.shift(); j.res(); continue; }
      if (r.done) { this.jobs.shift(); j.res(); }
    }
    return this.jobs.length > 0;
  }
  // set which spread is settled/current, keep neighbours, dispose the rest
  setCurrent(k, now) {
    const prev = this.cur;
    if (prev >= 0 && prev !== k && this.list[prev]) this.list[prev].deactivate();
    this.cur = k;
    for (const s of this.list) s.setPresent(s.k === k && s.built);
    const s = this.list[k];
    if (s && s.built) s.activate(now);
    // neighbours
    for (const d of [1, -1]) if (this.list[k + d]) this.ensure(k + d);
    for (const o of this.list) if (o.built && Math.abs(o.k - k) > 1 && !o.promise) o.dispose();
  }
  closeAll() {
    const c = this.list[this.cur]; if (c) c.deactivate();
    for (const s of this.list) s.setPresent(false);
    this.cur = -1; this.ensure(0); this.ensure(1);
  }
  // mark both spreads as present while a turn is in flight
  turning(from, to) { for (const i of [from, to]) { const s = this.list[i]; if (s && s.built) s.setPresent(true); } }
  update(dt, now) { for (const s of this.list) if (s.built) s.update(dt, now); }
  pickables() { const s = this.list[this.cur]; return s && s.built ? [...s.L.pickables(), ...s.R.pickables()] : []; }
  get current() { return this.list[this.cur]; }
}
