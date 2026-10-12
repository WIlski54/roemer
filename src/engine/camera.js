// Orbit camera for the reading view: limited, damped, returns home after ~3 s of rest.
import * as THREE from 'three';
import { Spring, clamp, mulberry32 } from './util.js';

export class CamRig {
  constructor(camera) {
    this.cam = camera;
    this.home = { az: 0, el: 0.86, dist: 22, tx: 0, ty: 2.4, tz: 1.5 };
    this.az = new Spring(0, 55, 10); this.el = new Spring(this.home.el, 55, 10); this.dist = new Spring(this.home.dist, 55, 11);
    this.tx = new Spring(0, 50, 11); this.ty = new Spring(this.home.ty, 50, 11); this.tz = new Spring(this.home.tz, 50, 11);
    this.bias = new Spring(1, 38, 10);
    this.zoom = 1;                // user zoom multiplier (0.55 .. 1.25)
    this.idle = 0; this.dragging = false; this.returnAfter = 3.0; this.autoReturn = true;
    this.shakeAmp = 0; this.shakeT = 0; this.shakeDur = 0; this.calm = false;
    this.rnd = mulberry32(5);
    this.focus = null;            // optional {x,y,z, dist} override (e.g. finale)
    this._v = new THREE.Vector3();
    this.nudge = { x: 0, y: 0, z: 0 };
    this.hold = false;            // Nutzer hat die Ansicht bewusst verschoben/gezoomt: keine automatische Rückkehr
  }

  fit(aspect) {
    const vfov = (this.cam.fov * Math.PI) / 180;
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * aspect);
    const needW = 27.2, needH = 14.2;
    const dw = needW / 2 / Math.tan(hfov / 2);
    const dh = needH / 2 / Math.tan(vfov / 2);
    this.home.dist = Math.max(dw, dh, 17);
    // portrait: look more from above so depth is used
    this.home.el = aspect < 0.9 ? 1.05 : aspect < 1.25 ? 0.95 : 0.86;
    this.dist.set(this.home.dist * this.zoom); this.el.set(this.home.el);
  }

  orbit(dx, dy) {
    this.idle = 0;
    const t = this.az.target - dx * 0.0042, e = this.el.target + dy * 0.0036;
    this.az.set(clamp(t, -0.75, 0.75));
    this.el.set(clamp(e, 0.38, 1.36));
  }
  setZoom(z, user = false) {
    this.idle = 0;
    this.zoom = clamp(z, 0.3, 1.22);
    this.dist.set(this.home.dist * this.zoom);
    if (user) this.hold = true;
  }
  // Verschieben in der Tischebene: der Inhalt folgt dem Finger (dx, dy in Bildschirmpixeln, h = Fensterhöhe)
  panScreen(dx, dy, h) {
    this.idle = 0; this.hold = true;
    const k = (2 * this.dist.x * Math.tan((this.cam.fov * Math.PI) / 360)) / Math.max(200, h);
    const az = this.az.x, sn = Math.max(0.35, Math.sin(this.el.x));
    const fx = dy * k / sn;
    this.nudge.x = clamp(this.nudge.x - dx * k * Math.cos(az) - fx * Math.sin(az), -16, 16);
    this.nudge.z = clamp(this.nudge.z + dx * k * Math.sin(az) - fx * Math.cos(az), -10, 10);
  }
  // Zoom, bei dem der Punkt unter dem Finger/Mauszeiger (ndc) an Ort und Stelle bleibt
  zoomAt(z, nx, ny, aspect) {
    const p0 = this._ground(nx, ny, aspect);
    this.setZoom(z, true);
    const p1 = this._ground(nx, ny, aspect);
    if (p0 && p1) { this.nudge.x = clamp(this.nudge.x + p0.x - p1.x, -16, 16); this.nudge.z = clamp(this.nudge.z + p0.z - p1.z, -10, 10); }
  }
  _ground(nx, ny, aspect) {
    const f = this.focus, az = this.az.target, el = this.el.target, ce = Math.cos(el);
    const d = (f && f.dist ? f.dist : this.home.dist) * this.zoom * this.bias.target;
    const T = { x: (f ? f.x : this.home.tx) + this.nudge.x, y: (f ? f.y : this.home.ty) + this.nudge.y, z: (f ? f.z : this.home.tz) + this.nudge.z };
    const dir = { x: Math.sin(az) * ce, y: Math.sin(el), z: Math.cos(az) * ce };      // von T zur Kamera
    const fw = { x: -dir.x, y: -dir.y, z: -dir.z }, rt = { x: Math.cos(az), y: 0, z: -Math.sin(az) };
    const up = { x: rt.y * fw.z - rt.z * fw.y, y: rt.z * fw.x - rt.x * fw.z, z: rt.x * fw.y - rt.y * fw.x };
    const th = Math.tan((this.cam.fov * Math.PI) / 360);
    const r = { x: fw.x + rt.x * nx * th * aspect + up.x * ny * th, y: fw.y + rt.y * nx * th * aspect + up.y * ny * th, z: fw.z + rt.z * nx * th * aspect + up.z * ny * th };
    if (r.y > -0.02) return null;
    const o = { x: T.x + dir.x * d, y: T.y + dir.y * d, z: T.z + dir.z * d }, t = -o.y / r.y;
    return { x: o.x + r.x * t, z: o.z + r.z * t };
  }
  get viewChanged() { return this.hold || Math.abs(this.zoom - 1) > 0.02 || Math.abs(this.nudge.x) > 0.05 || Math.abs(this.nudge.z) > 0.05; }
  reset(instant = false) {
    this.idle = 0; this.zoom = 1; this.nudge.x = 0; this.nudge.y = 0; this.nudge.z = 0; this.hold = false;
    this.az.set(0); this.el.set(this.home.el); this.dist.set(this.home.dist);
    if (instant) { this.az.snap(0); this.el.snap(this.home.el); this.dist.snap(this.home.dist); }
  }
  shake(amp, dur = 0.7) {
    if (this.calm) amp *= 0.12;
    this.shakeAmp = amp; this.shakeT = 0; this.shakeDur = dur;
  }
  setFocus(f) { this.focus = f; }
  setClosed(c) { this.bias.set(c ? 0.8 : 1); }

  update(dt) {
    if (!this.dragging) this.idle += dt;
    const away = !this.hold && (Math.abs(this.az.target) > 0.01 || Math.abs(this.el.target - this.home.el) > 0.01 || Math.abs(this.zoom - 1) > 0.01 || Math.abs(this.nudge.x) > 0.02 || Math.abs(this.nudge.y) > 0.02);
    if (this.autoReturn && !this.dragging && this.idle > this.returnAfter && away) {
      this.zoom = 1; this.az.set(0); this.el.set(this.home.el); this.dist.set(this.home.dist);
      this.nudge.x *= 0.9; this.nudge.y *= 0.9; this.nudge.z *= 0.9;
    }
    const f = this.focus;
    this.tx.set((f ? f.x : this.home.tx) + this.nudge.x); this.ty.set((f ? f.y : this.home.ty) + this.nudge.y); this.tz.set((f ? f.z : this.home.tz) + this.nudge.z);
    if (f && f.dist) this.dist.set(f.dist * this.zoom);
    const az = this.az.update(dt), el = this.el.update(dt), d = this.dist.update(dt) * this.bias.update(dt);
    const tx = this.tx.update(dt), ty = this.ty.update(dt), tz = this.tz.update(dt);
    const ce = Math.cos(el);
    let px = tx + Math.sin(az) * ce * d, py = ty + Math.sin(el) * d, pz = tz + Math.cos(az) * ce * d;
    let lx = tx, ly = ty, lz = tz;
    if (this.shakeDur > 0) {
      this.shakeT += dt;
      const k = Math.max(0, 1 - this.shakeT / this.shakeDur);
      const a = this.shakeAmp * k * k, tt = this.shakeT * 38;
      px += Math.sin(tt * 1.3) * a * 0.5; py += Math.cos(tt * 1.7) * a * 0.5; pz += Math.sin(tt * 0.9) * a * 0.3;
      if (this.shakeT >= this.shakeDur) this.shakeDur = 0;
    }
    this.cam.position.set(px, py, pz);
    this.cam.lookAt(lx, ly, lz);
  }
}
