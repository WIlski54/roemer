// Pop-up toolkit: PageSide (content of one page face), Popup (hinged fold with spring), Actor (tappable animal), Control (pull tab / slider).
import * as THREE from 'three';
import { Figure } from './figure.js';
import { buildCut } from './papercut.js';
import { ANIMALS } from '../art/registry.js';
import { Spring, Tweens, clamp, lerp, smooth, easeOutBack, easeOutCubic, TAU, mulberry32, hashStr } from './util.js';
import { PAGE_W as W, PAGE_D as D } from './scene.js';

export const FOLD = Math.PI / 2;

// ------------------------------------------------------------------ spec helpers
export function specBBox(spec) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const p of Object.values(spec.parts || {})) for (const l of p.layers) for (const poly of l.shapes) for (const [x, y] of poly) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
}

// quality knobs set once by main
export const Q = { ppu: 190, maxTex: 1024 };

export function makeFigure(id, { len, h, w, facing = 1, thickness = 0.026, border = 0.034, variant, ppu, maxTex } = {}) {
  const f = ANIMALS[id]; if (!f) throw new Error('unknown animal ' + id);
  const spec = f(variant);
  const bb = specBBox(spec);
  let ws = 1;
  if (len) ws = len / bb.w; else if (h) ws = h / bb.h; else if (w) ws = w / bb.w;
  const meta = spec.meta || {};
  const pw = Math.max(bb.w, bb.h) * ws;
  const fig = new Figure(spec, { worldScale: ws, ppu: ppu || Math.min(Q.ppu, (maxTex || Q.maxTex) / Math.max(pw, 0.5)) , facing, thickness, border, maxTex: maxTex || Q.maxTex });
  fig.meta = meta; fig.ws = ws; fig.id = id;
  return fig;
}

// pose helpers (honours per-animal sign conventions in meta.ranges: [rest, max])
export function poseAmt(fig, part, amt) {
  const r = fig.meta.ranges && fig.meta.ranges[part]; if (!r) return;
  fig.rotatePart(part, lerp(r[0], r[1], amt));
}
export function poseRad(fig, part, rad) { fig.rotatePart(part, rad); }

// A paper "flat" from a part spec {layers:[...]}, standing on y=0 with its base at its local y=0.
export function makeFlat(part, { ws = 1, ppu = 120, thickness = 0.02, border = 0.03, name = 'flat', maxTex = Q.maxTex } = {}) {
  const cut = buildCut(part, { worldScale: ws, ppu, thickness, border, maxTex, name });
  return cut;
}

// ------------------------------------------------------------------ Popup (hinged element)
export class Popup {
  constructor(side, { x = 0, z = 0, y = 0, delay = 0, lean = 0, k = 150, d = 12.5, yaw = 0, name = 'popup' } = {}) {
    this.side = side; this.name = name;
    this.group = new THREE.Group(); this.group.position.set(x, y, z); this.group.name = name;
    this.yawG = new THREE.Group(); this.yawG.rotation.y = yaw; this.group.add(this.yawG);
    this.pivot = new THREE.Group(); this.yawG.add(this.pivot);
    this.spring = new Spring(0, k, d);
    this.delay = delay; this.lean = lean; this.t0 = -1; this.on = false;
    this.eff = 0; this.always = false; this.wob = 0;
    this.objects = [];
    this.update(0, 1);
  }
  add(o) { this.pivot.add(o); this.objects.push(o); return o; }
  setActive(on, now) { this.on = on; if (on) { this.t0 = now + this.delay; } else { this.t0 = -1; this.spring.set(0); } }
  snap(open) { this.spring.snap(open); this.on = open > 0; this.t0 = -1; }
  update(dt, scrub, now = 0) {
    if (this.on && this.t0 >= 0 && now >= this.t0) { this.spring.set(1); if (!this._popped) { this._popped = true; this.onPop && this.onPop(); } }
    if (!this.on) this._popped = false;
    const sx = this.spring.update(dt);
    let o = sx;
    if (scrub < 1) o = Math.min(o, scrub);
    this.eff = o;
    this.group.visible = o > 0.004 || this.always;
    this.pivot.rotation.x = (1 - clamp(o, 0, 1.18)) * FOLD + this.lean * Math.min(o, 1);
  }
}

// ------------------------------------------------------------------ Actor (tappable animal)
export class Actor {
  constructor(side, fig, popup, { id, card, name, hint = true, hitPad = 0.6 } = {}) {
    this.side = side; this.fig = fig; this.popup = popup; this.id = id || fig.id; this.card = card || this.id; this.name = name || this.id;
    this.tw = new Tweens(); this.phase = Math.random() * 6; this.t = 0;
    this.hint = hint; this.hoverK = 0; this.hover = false; this.pulse = 0;
    this.base = { x: fig.group.position.x, y: fig.group.position.y, z: fig.group.position.z };
    this.behaviors = [];
    this.awake = 0;
    // generous invisible hit proxy
    const w = Math.max(fig.width + hitPad, 1.1), h = Math.max(fig.height + hitPad, 1.1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    m.position.set((fig.bbox.x0 + fig.bbox.x1) / 2 * fig.ws * fig.facing + fig.group.position.x, h / 2 - hitPad * 0.25, 0.1);
    m.userData.actor = this; this.proxy = m; fig.root.parent.parent && 0;
    popup.add(m);
    for (const c of fig.hit) c.userData.actor = this;
    this.mats = fig.cuts.map((c) => c.material);
    this.hitMeshes = [m, ...fig.hit];
  }
  get active() { return this.popup.eff > 0.7; }
  setFacing(dir) { const f = this.fig; const cx = ((f.bbox.x0 + f.bbox.x1) / 2) * f.ws; f.group.scale.x = dir; f.group.position.x = -cx * dir; this.dir = dir; }
  setHover(on) { this.hover = on; }
  pulseHint() { this.pulse = 1; }
  wake() {
    this.awake = 1;
    if (this.onWake) this.onWake(this); else this.defaultWake();
  }
  defaultWake() {
    const f = this.fig;
    const jaw = f.meta.ranges && f.meta.ranges.jaw;
    this.tw.add(0.5, (t) => { const s = Math.sin(t * Math.PI); this.hop = s * 0.35; if (jaw) poseAmt(f, 'jaw', s); }, { done: () => { this.hop = 0; if (jaw) poseAmt(f, 'jaw', 0); } });
  }
  update(dt, t) {
    this.t = t; this.tw.update(dt);
    const f = this.fig;
    // breathing + pulse hint
    const br = 1 + Math.sin(t * 1.9 + this.phase) * 0.008;
    this.pulse = Math.max(0, this.pulse - dt * 1.4);
    const pk = this.pulse > 0 ? Math.sin((1 - this.pulse) * Math.PI) * 0.07 : 0;
    const wk = (this.awake = Math.max(0, this.awake - dt * 0.8));
    f.root.scale.set(1 + pk * 0.4, br + pk, 1);
    f.root.position.y = (this.hop || 0);
    // hover glow
    this.hoverK = lerp(this.hoverK, this.hover ? 1 : 0, 0.25);
    const e = this.hoverK * 0.28 + this.pulse * 0.18;
    for (const m of this.mats) m.emissive.setRGB(e * 1.0, e * 0.85, e * 0.5);
    for (const b of this.behaviors) b(dt, t, this);
  }
}

// ------------------------------------------------------------------ Controls
export function roundRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0); s.lineTo(x + w, y + h - r);
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2); s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5); return s;
}

const SERIF = "Georgia,'Palatino Linotype',Palatino,'Book Antiqua',serif";
export const FONT = SERIF;

function handleCanvas(label, w, h, { color = '#c8452c', text = '#fff6df', arrow = 'both', axis = 'x' } = {}) {
  const S = 160;
  const c = document.createElement('canvas'); c.width = Math.ceil(w * S); c.height = Math.ceil(h * S);
  const g = c.getContext('2d');
  const r = 0.22 * S;
  const rr = (x, y, ww, hh, rad) => { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + ww, y, x + ww, y + hh, rad); g.arcTo(x + ww, y + hh, x, y + hh, rad); g.arcTo(x, y + hh, x, y, rad); g.arcTo(x, y, x + ww, y, rad); g.closePath(); };
  // paper with colored print
  g.fillStyle = '#f6edd6'; rr(0, 0, c.width, c.height, r); g.fill();
  const m = 0.07 * S;
  const grad = g.createLinearGradient(0, 0, 0, c.height); grad.addColorStop(0, shade(color, 1.12)); grad.addColorStop(1, shade(color, 0.86));
  g.fillStyle = grad; rr(m, m, c.width - 2 * m, c.height - 2 * m, r * 0.75); g.fill();
  g.strokeStyle = 'rgba(255,240,210,.55)'; g.lineWidth = 2; g.setLineDash([7, 6]); rr(m * 2, m * 2, c.width - 4 * m, c.height - 4 * m, r * 0.55); g.stroke(); g.setLineDash([]);
  // grip dots
  g.fillStyle = 'rgba(40,10,5,.28)';
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { g.beginPath(); g.arc(c.width * 0.12 + i * 0.07 * S, c.height * (0.4 + j * 0.2), 0.022 * S, 0, 7); g.fill(); }
  // label
  g.fillStyle = text; g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = c.height * 0.46; g.font = `bold ${fs}px ${SERIF}`;
  const maxW = c.width * 0.62; while (g.measureText(label).width > maxW && fs > 10) { fs -= 2; g.font = `bold ${fs}px ${SERIF}`; }
  g.shadowColor = 'rgba(60,10,5,.5)'; g.shadowBlur = 3; g.shadowOffsetY = 2;
  g.fillText(label, c.width * 0.57, c.height * 0.52);
  g.shadowColor = 'transparent';
  // arrows
  g.fillStyle = 'rgba(255,246,223,.9)';
  const ah = c.height * 0.2;
  const tri = (x, dir) => { g.beginPath(); g.moveTo(x, c.height / 2); g.lineTo(x - dir * ah * 0.9, c.height / 2 - ah); g.lineTo(x - dir * ah * 0.9, c.height / 2 + ah); g.closePath(); g.fill(); };
  if (arrow === 'both' || arrow === 'right') tri(c.width - 0.1 * S, 1);
  if (arrow === 'both' || arrow === 'left') tri(0.34 * S, -1);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

function slotCanvas(len, wid, ticks = 0, snaps = null, label = '', axis = 'x') {
  const S = 120; const L = Math.ceil(len * S), Wd = Math.ceil(wid * S);
  const c = document.createElement('canvas'); c.width = L; c.height = Wd;
  const g = c.getContext('2d');
  const rr = (x, y, ww, hh, rad) => { g.beginPath(); g.moveTo(x + rad, y); g.arcTo(x + ww, y, x + ww, y + hh, rad); g.arcTo(x + ww, y + hh, x, y + hh, rad); g.arcTo(x, y + hh, x, y, rad); g.arcTo(x, y, x + ww, y, rad); g.closePath(); };
  g.clearRect(0, 0, L, Wd);
  g.fillStyle = 'rgba(40,18,8,.38)'; rr(2, Wd * 0.25, L - 4, Wd * 0.5, Wd * 0.25); g.fill();
  g.fillStyle = 'rgba(20,8,3,.55)'; rr(6, Wd * 0.34, L - 12, Wd * 0.32, Wd * 0.16); g.fill();
  g.strokeStyle = 'rgba(255,240,210,.5)'; g.lineWidth = 2;
  const m = 0.5 * Wd;
  for (let i = 0; i <= ticks; i++) { const x = m + (L - 2 * m) * (i / ticks); g.beginPath(); g.moveTo(x, Wd * 0.08); g.lineTo(x, Wd * 0.2); g.moveTo(x, Wd * 0.8); g.lineTo(x, Wd * 0.92); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export class Control {
  // a: [x,z] start, b: [x,z] end (page frame). value 0..1
  constructor(side, { id, label, a, b, size = [2.5, 1.05], color = '#c8452c', value = 0, snaps = null, springBack = true, ticks = 0, arrow = 'both', slotLabel = '', steps = 0, hold = false, vertical = false } = {}) {
    this.side = side; this.id = id; this.label = label; this.a = new THREE.Vector2(...a); this.b = new THREE.Vector2(...b);
    this.snaps = snaps; this.springBack = springBack && !snaps && !hold; this.hold = hold;
    this.v = value; this.sp = new Spring(value, 140, 15); this.dragging = false; this.touched = false; this.t = 0;
    this.listeners = []; this.last = value; this.lastTick = value; this.steps = steps;
    this.group = new THREE.Group(); this.group.name = 'ctrl-' + id;
    const len = this.a.distanceTo(this.b);
    const ang = Math.atan2(this.b.y - this.a.y, this.b.x - this.a.x);
    // slot
    const slotLen = len + size[0] + 0.3, slotW = size[1] * 1.1;
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(slotLen, slotW), new THREE.MeshBasicMaterial({ map: slotCanvas(slotLen, slotW, ticks), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    slot.rotation.x = -Math.PI / 2; slot.rotation.z = -ang * 0 ; // lies on page
    const slotG = new THREE.Group(); slotG.position.set((a[0] + b[0]) / 2, 0.008, (a[1] + b[1]) / 2); slotG.rotation.y = -ang; slotG.add(slot);
    this.group.add(slotG); this.slotG = slotG;
    // handle: rounded paper slab with printed label
    const depth = 0.1;
    const shape = roundRectShape(size[0], size[1], 0.2);
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 6 });
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + size[0] / 2) / size[0], (pos.getY(i) + size[1] / 2) / size[1]);
    const tex = handleCanvas(label, size[0], size[1], { color, arrow: vertical ? 'both' : arrow });
    this.tex = tex;
    const capMat = new THREE.MeshLambertMaterial({ map: tex });
    const sideMat = new THREE.MeshLambertMaterial({ color: 0xf1e7cf });
    const mesh = new THREE.Mesh(geo, [capMat, sideMat]);
    mesh.rotation.x = -Math.PI / 2; mesh.castShadow = true; mesh.receiveShadow = false;
    const hg = new THREE.Group(); hg.add(mesh); this.handle = hg; this.mesh = mesh; hg.position.y = 0.02;
    this.group.add(hg);
    mesh.userData.control = this; this.capMat = capMat;
    // generous hit proxy
    const pr = new THREE.Mesh(new THREE.PlaneGeometry(size[0] + 0.6, size[1] + 0.6), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    pr.rotation.x = -Math.PI / 2; pr.position.y = 0.12; pr.userData.control = this; hg.add(pr);
    this.hitMeshes = [mesh, pr];
    this.size = size;
    this.place(value, true);
  }
  place(v, snap) {
    const p = new THREE.Vector2().lerpVectors(this.a, this.b, v);
    this.handle.position.set(p.x, 0.02 + (this.dragging ? 0.05 : 0), p.y);
    this.handle.rotation.y = 0;
  }
  on(fn) { this.listeners.push(fn); return this; }
  setValue(v, { silent = false, snap = false } = {}) { this.v = clamp(v, 0, 1); if (snap) this.sp.snap(this.v); else this.sp.set(this.v); if (!silent) this.emit(); }
  emit() { for (const f of this.listeners) f(this.sp.x, this); }
  project(px, pz) {
    const ab = new THREE.Vector2().subVectors(this.b, this.a);
    const ap = new THREE.Vector2(px, pz).sub(this.a);
    return clamp(ap.dot(ab) / ab.lengthSq(), 0, 1);
  }
  beginDrag(px, pz) {
    this.dragging = true; this.touched = true; this.grab = this.project(px, pz) - this.sp.x; this.sp.k = 220; this.sp.d = 24;
    this.onGrab && this.onGrab(this);
  }
  dragTo(px, pz) {
    let t = clamp(this.project(px, pz) - this.grab, 0, 1);
    if (this.steps) { /* stepped */ }
    this.v = t; this.sp.set(t);
  }
  endDrag() {
    this.dragging = false; this.sp.k = 140; this.sp.d = 15;
    if (this.snaps) {
      let best = this.snaps[0], bd = 9; for (const s of this.snaps) { const d = Math.abs(s - this.v); if (d < bd) { bd = d; best = s; } }
      this.v = best; this.sp.set(best); this.onSnap && this.onSnap(best, this);
    } else if (this.springBack) { this.v = 0; this.sp.set(0); }
    this.onRelease && this.onRelease(this.v, this);
  }
  update(dt, t) {
    this.t = t;
    const x = this.sp.update(dt);
    this.place(x);
    // idle wiggle hint (until touched)
    if (!this.touched && !this.dragging && this.hintOn) {
      const ph = (t * 0.55 + this.seed) % 4.0;
      if (ph < 0.8) { const w = Math.sin(ph / 0.8 * Math.PI) * 0.06; const p = new THREE.Vector2().lerpVectors(this.a, this.b, clamp(x + w, 0, 1)); this.handle.position.set(p.x, 0.02, p.y); }
    }
    if (Math.abs(x - this.last) > 1e-4) { this.last = x; this.emit(); }
    if (this.onTick && Math.abs(x - this.lastTick) > 0.035) { this.lastTick = x; this.onTick(x, this); }
  }
  setLabel(l) { /* labels are printed on the texture; rebuild */ }
}
Control.prototype.hintOn = true;
Control.prototype.seed = 0;

// ------------------------------------------------------------------ PageSide
export class PageSide {
  constructor(side, spreadIndex, leaf, face, book) {
    this.side = side; this.k = spreadIndex; this.leaf = leaf; this.face = face; this.book = book;
    this.group = new THREE.Group(); this.group.name = `page-${spreadIndex}${side}`;
    this.popups = []; this.actors = []; this.controls = []; this.updaters = []; this.disposables = []; this.textures = []; this.taps = [];
    this.now = 0; this.activeFlag = false; this.present = false;
    this.mood = null;
    // the leaf that comes down on top of this page (folds the pop-ups as it lands)
    this.coverLeaf = side === 'L' ? book.leaves[spreadIndex + 1] : book.leaves[spreadIndex];
  }
  coverScrub() {
    const l = this.coverLeaf; if (!l) return 1;
    return this.side === 'L' ? clamp((Math.PI - l.theta) / 0.55) : clamp(l.theta / 0.55);
  }
  scrub() { return Math.min(this.leaf.scrub(this.face), this.coverScrub()); }
  add(o) { this.group.add(o); return o; }
  addPopup(p) { this.popups.push(p); this.group.add(p.group); return p; }
  addActor(a) { this.actors.push(a); return a; }
  addTap(mesh, fn, enabled) { mesh.userData.tap = fn; this.taps.push({ mesh, enabled }); return mesh; }
  addControl(c) { this.controls.push(c); this.group.add(c.group); c.seed = this.controls.length * 1.3; return c; }
  onUpdate(fn) { this.updaters.push(fn); }
  own(d) { this.disposables.push(d); return d; }
  setActive(on, now) {
    this.activeFlag = on;
    // stagger: back to front
    const ps = this.popups.slice().sort((a, b) => a.group.position.z - b.group.position.z);
    ps.forEach((p, i) => { p.setActive(on, now + (p.delay || 0) + i * 0.045); });
    if (on) for (const a of this.actors) if (a.hint) a.pulseHint();
  }
  update(dt, now) {
    this.now = now;
    const scrub = this.scrub();
    this.group.visible = this.present && (scrub > 0.001 || this.activeFlag);
    for (const p of this.popups) p.update(dt, scrub, now);
    for (const a of this.actors) a.update(dt, now);
    for (const c of this.controls) c.update(dt, now);
    for (const u of this.updaters) u(dt, now, this);
  }
  // meshes that may be hit by the pointer, only while the page is flat & active
  pickables() {
    if (!this.activeFlag || this.scrub() < 0.95) return [];
    const out = [];
    for (const c of this.controls) out.push(...c.hitMeshes);
    for (const a of this.actors) if (a.popup.eff > 0.6) out.push(...a.hitMeshes);
    for (const p of this.popups) if (p.pickMeshes && p.eff > 0.6) out.push(...p.pickMeshes);
    for (const t of this.taps) if (!t.enabled || t.enabled()) out.push(t.mesh);
    return out;
  }
  dispose() {
    this.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) { const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) { if (m.map && m.map.dispose) m.map.dispose(); m.dispose(); } }
    });
    for (const t of this.textures) t.dispose();
    for (const d of this.disposables) d.dispose && d.dispose();
    this.group.removeFromParent();
  }
}

// a thin double-sided paper card lying flat, hinged at its back edge (z=0), extending to +z. Both faces get a texture.
export function paperCard(w, h, texTop, texBottom, { depth = 0.05 } = {}) {
  const g = new THREE.Group();
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: texTop }));
  top.rotation.x = -Math.PI / 2; top.position.set(0, depth, h / 2); top.castShadow = true; top.receiveShadow = true;
  const bot = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: texBottom }));
  bot.rotation.x = Math.PI / 2; bot.rotation.y = Math.PI; bot.position.set(0, 0, h / 2); bot.castShadow = true;
  const rim = new THREE.Mesh(new THREE.BoxGeometry(w, depth, h), new THREE.MeshLambertMaterial({ color: 0xf1e7cf }));
  rim.position.set(0, depth / 2, h / 2); rim.scale.set(0.998, 0.96, 0.998);
  g.add(top, bot, rim); g.userData.top = top; g.userData.bottom = bot; g.userData.hit = [top, bot, rim];
  return g;
}
