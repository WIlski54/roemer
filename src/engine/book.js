// The book: cover + leaves with real thickness, page stacks, curl-deforming leaf turn animation.
// Frame: spine along z at x=0. Right pages x in [0,W], left pages x in [-W,0], page depth z in [-D/2, D/2] (+z towards viewer).
// leaf 0 = cover (front: cover art, back: spread-0 left). leaf i (>=1): front = spread (i-1) right, back = spread i left.
import * as THREE from 'three';
import { PAGE_W as W, PAGE_D as D } from './scene.js';
import { clamp, lerp, smooth, smoother, mulberry32 } from './util.js';

export const N_LEAVES = 10;
export const G = 0.026;           // visual paper thickness
export const COVER_T = 0.2;
export const Y_BOARD = -(9 * G) / 2;
export const COVER_W = W + 0.24;
export const COVER_D = D + 0.4;
const NS = 28;

const TMP = new THREE.Vector3();

export function paperTexture(base = '#f4ead2', seed = 3) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  const r = mulberry32(seed); g.globalAlpha = 0.05;
  for (let i = 0; i < 400; i++) { g.fillStyle = r() > 0.5 ? '#fff' : '#8a7550'; g.fillRect(r() * 256, r() * 256, 1 + r() * 2, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ---- a deformable page face (strip of columns along x, two rows in z)
class Face {
  constructor({ back = false, width = W, depth = D, cols = NS, y = 0 }) {
    this.back = back; this.width = width; this.depth = depth; this.cols = cols; this.y = y;
    const n = (cols + 1) * 2;
    this.pos = new Float32Array(n * 3); this.nor = new Float32Array(n * 3); const uv = new Float32Array(n * 2);
    for (let j = 0; j <= cols; j++) for (let k = 0; k < 2; k++) {
      const i = j * 2 + k;
      const u = j / cols; uv[i * 2] = back ? 1 - u : u; uv[i * 2 + 1] = k === 0 ? 1 : 0;
      this.pos[i * 3 + 2] = k === 0 ? -depth / 2 : depth / 2;
    }
    const idx = [];
    for (let j = 0; j < cols; j++) {
      const a = j * 2, b = a + 1, c = (j + 1) * 2, d = c + 1;
      if (!back) idx.push(a, b, c, b, d, c); else idx.push(a, c, b, b, c, d);
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3));
    this.geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    this.geo.setIndex(idx);
    this.mat = new THREE.MeshLambertMaterial({ map: null, color: 0xffffff });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
    this.mesh.receiveShadow = true; this.mesh.castShadow = false; this.mesh.frustumCulled = false;
    this.mesh.userData.face = this;
  }
  setTexture(tex) { this.mat.map = tex; this.mat.needsUpdate = true; }
  // phi per column given angle theta and curl
  shape(theta, curl, dir, half) {
    const ds = this.width / this.cols;
    let x = 0, y = 0;
    const sgn = this.back ? -1 : 1;
    const off = this.y;
    for (let j = 0; j <= this.cols; j++) {
      if (j > 0) {
        const tm = (j - 0.5) / this.cols;
        const phi = theta - dir * curl * Math.sin(theta) * (tm - 0.5);
        x += Math.cos(phi) * ds; y += Math.sin(phi) * ds;
      }
      const t = j / this.cols;
      const phiN = theta - dir * curl * Math.sin(theta) * (t - 0.5);
      const nx = -Math.sin(phiN) * sgn, ny = Math.cos(phiN) * sgn;
      for (let k = 0; k < 2; k++) {
        const i = (j * 2 + k) * 3;
        // leaf mid-plane at (x,y); offset along normal by half thickness (face lives at +-half)
        this.pos[i] = x + nx * half; this.pos[i + 1] = y + ny * half;
        this.nor[i] = nx; this.nor[i + 1] = ny; this.nor[i + 2] = 0;
      }
    }
    this.geo.attributes.position.needsUpdate = true; this.geo.attributes.normal.needsUpdate = true;
  }
}

export class Leaf {
  constructor(book, i) {
    this.book = book; this.i = i;
    this.theta = 0; this.dir = 1; this.anim = null; this.drag = false;
    this.group = new THREE.Group(); this.group.name = 'leaf' + i;
    this.frontGroup = new THREE.Group(); this.backGroup = new THREE.Group();
    this.group.add(this.frontGroup, this.backGroup);
    this.cover = i === 0;
    if (this.cover) {
      const cw = COVER_W, cd = COVER_D;
      const cloth = new THREE.Mesh(new THREE.BoxGeometry(cw, COVER_T, cd), book.clothMat);
      cloth.position.set(cw / 2, 0, 0); cloth.castShadow = true; cloth.receiveShadow = true;
      this.group.add(cloth); this.cloth = cloth;
      this.front = new Face({ width: cw, depth: cd, cols: 1 }); this.back = new Face({ back: true, width: cw, depth: cd, cols: 1 });
      this.halfT = COVER_T / 2 + 0.003;
    } else {
      this.front = new Face({}); this.back = new Face({ back: true });
      this.halfT = G / 2 + 0.0015;
    }
    this.group.add(this.front.mesh, this.back.mesh);
    this.front.setTexture(book.blankTex); this.back.setTexture(book.blankTex);
    this.apply();
  }
  // y of leaf mid-plane resting on right / left
  yRight() { return this.cover ? Y_BOARD + 9 * G + COVER_T / 2 : Y_BOARD + (N_LEAVES - 1 - this.i) * G + G / 2; }
  yLeft() { return this.cover ? Y_BOARD - COVER_T / 2 : Y_BOARD + (this.i - 1) * G + G / 2; }
  apply() {
    const th = this.theta, t = th / Math.PI;
    this.group.position.y = lerp(this.yRight(), this.yLeft(), smooth(clamp(t * 1.15)));
    const half = this.halfT;
    const curl = this.cover ? 0 : (this.drag ? 1.0 : 1.25);
    this.front.shape(th, curl, this.dir, half); this.back.shape(th, curl, this.dir, half);
    // content frames follow rigidly (contents are flat while the leaf is in motion)
    const fy = this.cover ? COVER_T / 2 + 0.004 : G / 2 + 0.003;
    this.frontGroup.rotation.z = th; this.backGroup.rotation.z = th + Math.PI;
    // positions: front content sits on the front face; back content under the back face
    const c = Math.cos(th), s = Math.sin(th);
    this.frontGroup.position.set(-s * fy, c * fy, 0);
    this.backGroup.position.set(s * fy, -c * fy, 0);
    const moving = th > 0.001 && th < Math.PI - 0.001;
    this.front.mesh.castShadow = this.back.mesh.castShadow = moving;
    if (this.cover) { this.cloth.rotation.z = th; this.cloth.position.set((COVER_W / 2) * Math.cos(th), (COVER_W / 2) * Math.sin(th), 0); }
  }
  // flatness of a face (1 flat & visible, 0 tilted away) used to scrub pop-ups
  scrub(face) { const th = this.theta; return clamp(1 - (face === 'front' ? th : Math.PI - th) / 0.55); }
  get resting() { return !this.anim && !this.drag && (this.theta < 1e-3 || this.theta > Math.PI - 1e-3); }
}

export class Book {
  constructor(stage) {
    this.stage = stage;
    this.group = new THREE.Group(); this.group.name = 'book';
    stage.scene.add(this.group);
    stage.table.position.y = Y_BOARD - COVER_T - 0.002;
    this.blankTex = paperTexture();
    this.clothMat = new THREE.MeshLambertMaterial({ map: makeCloth(), color: 0xffffff });
    this.edgeMat = new THREE.MeshLambertMaterial({ map: makeEdges(), color: 0xffffff });
    this.leaves = [];
    for (let i = 0; i < N_LEAVES; i++) { const l = new Leaf(this, i); this.leaves.push(l); this.group.add(l.group); }
    // back board + spine
    const bb = new THREE.Mesh(new THREE.BoxGeometry(COVER_W, COVER_T, COVER_D), this.clothMat);
    bb.position.set(COVER_W / 2, Y_BOARD - COVER_T / 2, 0); bb.castShadow = true; bb.receiveShadow = true;
    this.group.add(bb); this.backBoard = bb;
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.34, COVER_T * 0.9, COVER_D), this.clothMat);
    spine.position.set(0, Y_BOARD - COVER_T / 2 - 0.01, 0); this.group.add(spine);
    // page blocks (edges of the stacks)
    this.blockR = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.edgeMat.clone());
    this.blockL = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), this.edgeMat.clone());
    for (const b of [this.blockR, this.blockL]) { b.material.map = b.material.map.clone(); b.material.map.needsUpdate = true; b.castShadow = true; b.receiveShadow = true; this.group.add(b); }
    this.cur = 0; this.settled = 0; this.busy = false; this.queue = null;
    this.hooks = {};
    this.updateBlocks();
  }

  leafTheta(i) { return this.leaves[i].theta; }
  coverTheta() { return this.leaves[0].theta; }
  get spread() { return this.settled - 1; }         // -1 = closed

  updateBlocks() {
    // non-cover leaves on right / left (by half-turned status)
    let nl = 0, nr = 0;
    // only leaves that rest flat belong to a block (a leaf in motion hovers above it)
    for (let i = 1; i < N_LEAVES; i++) { const th = this.leaves[i].theta; if (th < 1e-3) nr++; else if (th > Math.PI - 1e-3) nl++; }
    const w = W - 0.03, d = D - 0.03;
    const setBlock = (b, count, left) => {
      const h = Math.max(0.001, count * G - 0.004);
      b.visible = count > 0;
      b.scale.set(w, h, d);
      b.position.set(left ? -W / 2 : W / 2, Y_BOARD + h / 2, 0);
      b.material.map.repeat.set(1, Math.max(1, h / 0.09));
      b.material.map.wrapS = b.material.map.wrapT = THREE.RepeatWrapping;
    };
    setBlock(this.blockR, nr, false); setBlock(this.blockL, nl, true);
    // closed: back cover alone is on the right; left block hidden if cover not opened
    this.blockL.visible = nl > 0 && this.coverTheta() > Math.PI * 0.5;
  }

  // visual centring: closed book is centred, opens towards the middle
  centre() {
    const s = smooth(clamp(this.coverTheta() / Math.PI));
    this.group.position.x = -(COVER_W / 2) * (1 - s);
  }

  // ---- animation primitives
  animateLeaf(i, to, dur, { delay = 0, ease = smoother, onDone } = {}) {
    const l = this.leaves[i];
    l.drag = false;
    l.dir = to > l.theta ? 1 : -1;
    l.anim = { from: l.theta, to, t: -delay, dur, ease, onDone };
    if (delay <= 0) this.hooks.leafLift && this.hooks.leafLift(l, l.dir, dur);
    else l.anim.pendingLift = true;
  }

  update(dt) {
    let anyMoving = false;
    for (const l of this.leaves) {
      const a = l.anim;
      if (a) {
        a.t += dt;
        if (a.t >= 0 && a.pendingLift) { a.pendingLift = false; this.hooks.leafLift && this.hooks.leafLift(l, l.dir, a.dur); }
        if (a.t >= 0) {
          const k = clamp(a.t / a.dur);
          l.theta = lerp(a.from, a.to, a.ease(k));
          anyMoving = true;
          if (k >= 1) { l.theta = a.to; l.anim = null; l.apply(); this.hooks.leafLand && this.hooks.leafLand(l, l.dir); a.onDone && a.onDone(); }
          else l.apply();
        }
      } else if (l.drag) { l.apply(); anyMoving = true; }
    }
    this.updateBlocks(); this.centre();
    return anyMoving;
  }

  // ---- high level: go to `n` turned leaves (0 closed, k+1 shows spread k)
  turnTo(n, { mode = 'normal' } = {}) {
    n = clamp(Math.round(n), 0, N_LEAVES - 1);
    if (this.busy) { this.queue = { n, mode }; return Promise.resolve(); }
    if (n === this.cur) return Promise.resolve();
    this.busy = true;
    const from = this.cur; this.cur = n;
    const fwd = n > from, steps = Math.abs(n - from);
    const dur = mode === 'quick' || steps > 1 ? (steps > 1 ? 0.62 : 0.8) : 1.3;
    const gap = steps > 1 ? Math.max(0.1, Math.min(0.2, 1.2 / steps)) : 0;
    this.hooks.turnStart && this.hooks.turnStart(from, n, fwd);
    return new Promise((res) => {
      let left = steps;
      for (let s = 0; s < steps; s++) {
        const i = fwd ? from + s : from - 1 - s;
        this.animateLeaf(i, fwd ? Math.PI : 0, dur, {
          delay: s * gap,
          onDone: () => { if (--left === 0) { this.busy = false; this.settled = n; this.hooks.turnEnd && this.hooks.turnEnd(n, from); res(); if (this.queue) { const q = this.queue; this.queue = null; this.turnTo(q.n, { mode: q.mode }); } } },
        });
      }
    });
  }

  // ---- direct manipulation (drag corner)
  beginDrag(forward) {
    if (this.busy) return null;
    const i = forward ? this.cur : this.cur - 1;
    if (i < 0 || i >= N_LEAVES) return null;
    if (forward && this.cur >= N_LEAVES - 1) return null;
    const l = this.leaves[i];
    l.anim = null; l.drag = true; l.dir = forward ? 1 : -1;
    this.dragLeaf = l; this.dragFwd = forward; this.dragVel = 0; this.dragLast = l.theta; this._ft = 0;
    this.hooks.dragStart && this.hooks.dragStart(l, forward);
    return l;
  }
  dragTo(px, dt = 0.016) {
    const l = this.dragLeaf; if (!l) return;
    const th = Math.acos(clamp((px - this.group.position.x) / W, -1, 1));
    this._follow(l, th, dt);
  }
  // Seite an beliebiger Stelle gegriffen: delta = Weg in Blätterrichtung (Welteinheiten), r = Abstand des Griffpunkts vom Falz
  dragBy(delta, r, dt = 0.016) {
    const l = this.dragLeaf; if (!l) return;
    const a = Math.acos(clamp(1 - delta / Math.max(1, r), -1, 1));
    this._follow(l, this.dragFwd ? a : Math.PI - a, dt);
  }
  _follow(l, th, dt) {
    const target = clamp(th, 0.02, Math.PI - 0.02);
    const nt = lerp(l.theta, target, 0.55);
    const now = performance.now(), rdt = this._ft ? clamp((now - this._ft) / 1000, 0.004, 0.05) : dt; this._ft = now;   // echte Zeit zwischen Zeigerereignissen
    this.dragVel = lerp(this.dragVel, (nt - l.theta) / rdt, 0.4);
    l.theta = nt; l.dir = this.dragVel >= 0 ? 1 : -1;
  }
  endDrag() {
    const l = this.dragLeaf; if (!l) return Promise.resolve();
    this.dragLeaf = null;
    const fwd = this.dragFwd;
    const flick = performance.now() - this._ft > 140 ? 0 : this.dragVel;   // wer innehält und dann loslässt, schnippt nicht
    let complete = fwd ? (l.theta > Math.PI * 0.5 || flick > 2.2) : (l.theta < Math.PI * 0.5 || flick < -2.2);
    if (fwd && flick < -2.2) complete = false; if (!fwd && flick > 2.2) complete = false;
    l.drag = false;
    this.busy = true;
    const from = this.cur;
    const to = complete ? (fwd ? from + 1 : from - 1) : from;
    if (complete) { this.cur = to; this.hooks.turnStart && this.hooks.turnStart(from, to, fwd); }
    const target = complete ? (fwd ? Math.PI : 0) : (fwd ? 0 : Math.PI);
    const dur = 0.35 + 0.35 * Math.abs(target - l.theta) / Math.PI;
    return new Promise((res) => {
      l.dir = target > l.theta ? 1 : -1; l.anim = { from: l.theta, to: target, t: 0, dur, ease: smooth, onDone: () => { this.busy = false; if (complete) { this.settled = to; this.hooks.turnEnd && this.hooks.turnEnd(to, from); } else this.hooks.dragCancel && this.hooks.dragCancel(l); res(); } };
    });
  }

  // face lookups
  faceMount(leafIndex, face) { const l = this.leaves[leafIndex]; return face === 'front' ? l.frontGroup : l.backGroup; }
  setFaceTexture(leafIndex, face, tex) { const l = this.leaves[leafIndex]; (face === 'front' ? l.front : l.back).setTexture(tex || this.blankTex); }
  // which (leaf,face) pairs make up spread k
  static spreadFaces(k) { return { left: { leaf: k, face: 'back' }, right: { leaf: k + 1, face: 'front' } }; }
  // world position -> page frame (account for centring shift)
  toPage(wx, wz) { return { x: wx - this.group.position.x, z: wz - this.group.position.z }; }
  pageTopY(side, spread) { const f = Book.spreadFaces(spread); const l = this.leaves[side === 'L' ? f.left.leaf : f.right.leaf]; return l.group.position.y + (l.cover ? COVER_T / 2 : G / 2) + 0.003; }
}

// ---------- textures for cloth & page edges
function makeCloth() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#7a2b1c'; g.fillRect(0, 0, 256, 256);
  const r = mulberry32(11);
  g.globalAlpha = 0.22;
  for (let y = 0; y < 256; y += 2) { g.fillStyle = r() > 0.5 ? '#3d0f08' : '#c26a45'; g.fillRect(0, y, 256, 1); }
  for (let x = 0; x < 256; x += 2) { g.fillStyle = r() > 0.5 ? '#3d0f08' : '#c26a45'; g.fillRect(x, 0, 1, 256); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
  return t;
}
function makeEdges() {
  const c = document.createElement('canvas'); c.width = 64; c.height = 128;
  const g = c.getContext('2d'); g.fillStyle = '#f6efdb'; g.fillRect(0, 0, 64, 128);
  const r = mulberry32(5);
  for (let y = 0; y < 128; y += 4) { g.fillStyle = `rgba(120,95,60,${0.18 + r() * 0.18})`; g.fillRect(0, y, 64, 1); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
