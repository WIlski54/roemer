// Zeitfenster: Bildfenster neben dem Buch, das zum Zeitrad (Titelseite) passende Szenen zeigt (Zeitrad am Meilenstein).
// Rahmenlos: das Bild schwebt mit weichen, organischen Rändern auf dem Tisch (kein Kartenrahmen).
// Breites Fenster: rechts neben dem Buch. Schmales (iPad quer/hoch): kompakt links oben über dem Buch.
import * as THREE from 'three';
import { SCENES, sceneIndexAt } from './zeitszenen.js';
import { SW, SH, TAU } from './zeitkit.js';
import { valueOfYear, yearOfValue, eraOf, ERAS } from '../data/zeit.js';
import { PAGE_W, PAGE_D } from '../engine/scene.js';

const el = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
const ERA_COL = Object.fromEntries(ERAS.map((e) => [e.name, e.col]));

export class TimeWindow {
  constructor(app, root) {
    this.app = app; this.active = false; this.min = false; this.idx = -1; this.hour = 0; this.ctl = null;
    this.t = 0; this.trans = 1; this.frame = 0; this.compact = false; this.lastLay = -9; this.shown = false;
    const e = this.el = el('section', 'zf'); e.setAttribute('aria-label', 'Zeitfenster: Bilder zum Zeitrad'); e.style.display = 'none';
    const h = el('header', 'zf-h'); this.eraDot = el('i'); this.eraTxt = el('span', 'zf-era'); this.eraWhen = el('span', 'zf-erawhen'); this.minBtn = el('button', 'zf-min', '–');
    this.minBtn.type = 'button'; this.minBtn.setAttribute('aria-label', 'Zeitfenster einklappen'); this.minBtn.addEventListener('click', () => this.setMin(!this.min));
    this.eraTxt.append(this.eraName = document.createTextNode(''), this.eraWhen);
    h.append(this.eraDot, this.eraTxt, this.minBtn);
    this.view = el('div', 'zf-view'); this.cv = el('canvas'); this.cv.setAttribute('role', 'img'); this.view.append(this.cv);
    this.over = el('div', 'zf-over'); this.overT = el('b'); this.overC = el('p'); this.overF = el('p'); this.over.append(this.overT, this.overC, this.overF); this.view.append(this.over);
    this.sceneT = 0; this.pin = false; this.txtOff = false;
    this.view.addEventListener('click', () => { if (!this.compact) return; if (this.el.classList.contains('txt')) { this.pin = false; this.txtOff = true; } else { this.pin = true; } this.sceneT = Math.min(this.sceneT, 7); });
    this.g = this.cv.getContext('2d'); this.prev = document.createElement('canvas'); this.pg = this.prev.getContext('2d');
    this.when = el('div', 'zf-when'); this.title = el('h3', 'zf-title'); this.cap = el('p', 'zf-cap'); this.cap.setAttribute('aria-live', 'polite'); this.fact = el('p', 'zf-fact');
    this.body = el('div', 'zf-body'); this.body.append(this.when, this.title, this.cap, this.fact);
    this.nav = el('nav', 'zf-nav'); this.nav.setAttribute('aria-label', 'Szenen');
    this.bPrev = el('button', 'zf-arrow', '‹'); this.bNext = el('button', 'zf-arrow', '›'); this.bPrev.type = this.bNext.type = 'button';
    this.bPrev.setAttribute('aria-label', 'Vorherige Szene'); this.bNext.setAttribute('aria-label', 'Nächste Szene');
    this.bPrev.addEventListener('click', () => this.go(this.idx - 1)); this.bNext.addEventListener('click', () => this.go(this.idx + 1));
    this.dots = el('div', 'zf-dots'); this.dotEls = SCENES.map((s, i) => { const b = el('button', 'zf-dot'); b.type = 'button'; b.setAttribute('aria-label', s.short + ', ' + s.when); b.title = s.short; b.style.setProperty('--c', ERA_COL[s.era] || '#c9a96a'); b.append(el('i')); b.addEventListener('click', () => this.go(i)); this.dots.append(b); return b; });
    this.cnt = el('div', 'zf-cnt'); this.cntT = el('span'); this.cnt.append(this.cntT);
    this.nav.append(this.bPrev, this.dots, this.cnt, this.bNext);
    e.append(h, this.view, this.body, this.nav);
    root.append(e);
    this.setScene(sceneIndexAt(yearOfValue(0)), true);
  }
  // Uhr verbinden (Zeiger-Steuerung des Zeitrads)
  attach(ctl) { this.ctl = ctl; }
  setMin(on) { this.min = on; this.el.classList.toggle('min', on); this.minBtn.textContent = on ? '+' : '–'; this.minBtn.setAttribute('aria-label', on ? 'Zeitfenster aufklappen' : 'Zeitfenster einklappen'); this.lastLay = -9; this.lkey = ''; }
  show() { this.active = true; this.lastLay = -9; this.lkey = ''; }
  hide() { this.active = false; this.el.style.display = 'none'; this.shown = false; }
  go(i) {
    i = Math.max(0, Math.min(SCENES.length - 1, i)); const c = this.ctl; if (!c) return;
    c.touched = true; c.setValue(valueOfYear(SCENES[i].at), { silent: false });
    if (this.app.audio && this.app.audio.sfx) this.app.audio.sfx('tick', { fast: true });
  }
  setHour(h) { this.setV(h / 24); } // Kompatibilität: Stunde 0..24 -> Wert 0..1
  setV(v) {
    this.v = v; const i = sceneIndexAt(yearOfValue(v));
    if (i !== this.idx) this.setScene(i, false);
  }
  setScene(i, first) {
    if (i === this.idx) return;
    if (!first && this.active && this.shown && !this.min) { // altes Bild als Papier wegschieben
      if (this.prev.width !== this.cv.width || this.prev.height !== this.cv.height) { this.prev.width = this.cv.width; this.prev.height = this.cv.height; }
      this.pg.clearRect(0, 0, this.prev.width, this.prev.height); this.pg.drawImage(this.cv, 0, 0); this.trans = 0;
      if (this.app.audio && this.app.audio.sfx) this.app.audio.sfx('slide', { v: 0.25 });
    }
    this.idx = i; const s = SCENES[i];
    this.eraName.nodeValue = s.era; this.eraWhen.textContent = ' · ' + s.when; this.eraDot.style.background = ERA_COL[s.era] || '#c9a96a';
    this.title.textContent = s.title; this.cap.textContent = s.cap; this.fact.textContent = s.fact; this.overT.textContent = s.title; this.overC.textContent = s.cap; this.overF.textContent = s.fact; this.sceneT = 0; this.pin = false; this.txtOff = false; this.when.textContent = s.when;
    this.cv.setAttribute('aria-label', s.title + '. ' + s.cap);
    this.body.classList.remove('in'); void this.body.offsetWidth; this.body.classList.add('in');
    this.dotEls.forEach((d, k) => { d.classList.toggle('on', k === i); d.classList.toggle('past', k < i); }); this.cntT.textContent = s.title;
    this.bPrev.disabled = i === 0; this.bNext.disabled = i === SCENES.length - 1;
  }
  // Weicher, leicht unregelmäßiger Rand: Maske (Superellipse mit Wellen, per Schattenunschärfe ausgeblendet)
  buildMask(cw, ch) {
    const m = this.mask || (this.mask = document.createElement('canvas')); m.width = cw; m.height = ch;
    const c = m.getContext('2d'); c.clearRect(0, 0, cw, ch);
    const cx = cw / 2, cy = ch / 2, rx = cw * 0.42, ry = ch * 0.445, n = 3.3, off = cw * 2;
    c.save(); c.shadowColor = '#000'; c.shadowBlur = cw * 0.04; c.shadowOffsetX = off; c.translate(-off, 0);
    c.fillStyle = '#000'; c.beginPath();
    for (let i = 0; i <= 120; i++) {
      const a = i / 120 * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const w = 1 + 0.03 * Math.sin(3 * a + 1.3) + 0.022 * Math.sin(5 * a + 0.4) + 0.016 * Math.sin(2 * a + 2.2);
      const x = cx + rx * w * Math.sign(ca) * Math.pow(Math.abs(ca), 2 / n), y = cy + ry * w * Math.sign(sa) * Math.pow(Math.abs(sa), 2 / n);
      if (i) c.lineTo(x, y); else c.moveTo(x, y);
    }
    c.closePath(); c.fill(); c.restore();
  }
  // Bildgröße (CSS) + Auflösung; der weiche Rand blendet den Überstand (5 % je Seite) aus
  sizeCanvas(w, hires) {
    const ov = Math.round(w * 0.05), px = Math.round(w) + 2 * ov, cv = this.cv, v = Math.round(w * 0.045);
    cv.style.width = px + 'px'; cv.style.height = Math.round(px * SH / SW) + 'px'; cv.style.margin = `${-v}px 0 ${-v}px ${-ov}px`;
    if (!hires) return;
    const dpr = Math.min(this.app.stage.tier.name === 'low' ? 1 : 2, devicePixelRatio || 1), cw = Math.round(px * dpr), ch = Math.round(px * dpr * SH / SW);
    if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; this.buildMask(cw, ch); }
  }
  // Anordnung setzen: 'right' (Platz rechts vom Buch), 'side' (Bild und Text nebeneinander), 'stack' (Bild über Text), 'over' (kleinster Platz: Text über dem Bild)
  place(mode, w, left, top, boxW) {
    const e = this.el; this.mode = mode; this.compact = mode === 'over';
    e.classList.toggle('compact', mode === 'over'); e.classList.toggle('wide', mode !== 'over'); e.classList.toggle('side', mode === 'side');
    const fs = mode === 'side' ? Math.max(11, Math.min(17, w / 420 * 16)) : Math.max(11.5, Math.min(26, w / 420 * 16));
    e.style.fontSize = fs.toFixed(2) + 'px'; e.style.setProperty('--pw', Math.round(w) + 'px');
    e.style.width = Math.round(boxW || w) + 'px'; e.style.left = Math.round(left) + 'px'; e.style.top = Math.round(top) + 'px';
    this.sizeCanvas(w, false); return fs;
  }
  layout() {
    const app = this.app, W = innerWidth, H = innerHeight, e = this.el, cam = app.stage.camera;
    // Buch auf den Bildschirm projizieren: Seitenfläche (y=0) und Höhe mit Pop-ups (y=6)
    const v = new THREE.Vector3(), gx = app.book.group.position.x, gz = app.book.group.position.z;
    let l = 1e9, r = -1e9, t0 = 1e9, b = -1e9, tTop = 1e9;
    for (const x of [-PAGE_W, PAGE_W]) for (const z of [-PAGE_D / 2, PAGE_D / 2]) for (const y of [0, 6]) {
      v.set(gx + x, y, gz + z).project(cam); const sx = (v.x * 0.5 + 0.5) * W, sy = (-v.y * 0.5 + 0.5) * H;
      if (y === 0) { l = Math.min(l, sx); r = Math.max(r, sx); t0 = Math.min(t0, sy); b = Math.max(b, sy); }
      tTop = Math.min(tTop, sy);
    }
    // stehender Meilenstein samt Zeitrad (Standardwerte; p0 setzt app.timewin.avoid): hier darf das Zeitfenster nicht hinein
    const av = this.avoid || { x0: 3.35, x1: 9.45, y1: 6.4, z: -1.2 };
    let cl = 1e9;
    for (const x of [av.x0, av.x1]) for (const y of [0, av.y1]) { v.set(gx + x, y, gz + av.z).project(cam); cl = Math.min(cl, (v.x * 0.5 + 0.5) * W); }
    const key = [W, H, l | 0, r | 0, t0 | 0, b | 0, cl | 0, this.min ? 1 : 0].join();
    if (key === this.lkey) return; this.lkey = key;
    if (this.min && this.mode) return; // eingeklappt: Platz und Größe bleiben
    const gap = Math.max(16, W * 0.012), free = W - r - gap - 14;
    let done = false;
    // Größe nach der längsten Szene bemessen, damit das Bild beim Drehen der Uhr nicht springt
    if (this.longest == null) { let m = -1; SCENES.forEach((sc, k) => { const n = (sc.title + sc.cap + sc.fact).length; if (n > m) { m = n; this.longest = k; } }); }
    const ls = SCENES[this.longest], cur = SCENES[this.idx];
    this.title.textContent = ls.title; this.cap.textContent = ls.cap; this.fact.textContent = ls.fact;
    if (free >= 280) { // rechts direkt neben dem Buch, etwa so hoch wie das Buch (mit Pop-ups)
      const hp = Math.max(300, b - Math.max(tTop, 50));
      const w = Math.max(280, Math.min(free, hp / 1.22, 1100)); this.place('right', w, r + gap, Math.max(66, tTop)); this.sizeCanvas(w, true); done = true;
    }
    if (!done) { // oben links über dem Buch bis zur Uhr: erst nebeneinander, dann untereinander, zuletzt Text über dem Bild
      const top = 54, left = 10, roomH = Math.max(150, t0 + 18 - top), avail = Math.max(200, cl - 14 - left);
      for (let w = Math.min(470, avail - 215); w >= 220 && !done; w -= 12) {
        const fs = this.place('side', w, left, top, avail);
        if (e.offsetHeight <= roomH && e.scrollWidth <= avail + 2) { this.sizeCanvas(w, true); done = true; }
      }
      for (let w = Math.min(440, avail); w >= 200 && !done; w -= 12) {
        this.place('stack', w, left, top);
        if (e.offsetHeight <= roomH) { this.sizeCanvas(w, true); done = true; }
      }
      if (!done) { // sehr kleiner Bildschirm: Bild mit antippbarem Text darüber
        const w = Math.max(240, Math.min(440, avail, (t0 - 40) / 0.6425)); this.place('over', w, 10, 54); this.sizeCanvas(w, true);
      }
    }
    this.title.textContent = cur.title; this.cap.textContent = cur.cap; this.fact.textContent = cur.fact;
  }
  update(dt) {
    const app = this.app, e = this.el;
    const busy = app.ui && (app.ui.cardOpen || app.ui.helpOpen);
    const want = this.active && !busy;
    if (!want) { if (this.shown) { e.style.opacity = '0'; e.style.pointerEvents = 'none'; this.shown = false; } if (!this.active) e.style.display = 'none'; else e.style.display = ''; return; }
    if (e.style.display === 'none') e.style.display = '';
    if (!this.shown) { this.shown = true; e.style.opacity = '1'; e.style.pointerEvents = ''; this.lastLay = -9; this.lkey = ''; }
    this.t += dt; this.lastLay += dt; this.sceneT += dt;
    if (this.compact) { const on = this.pin || (this.sceneT > 1.5 && this.sceneT < 9 && !this.txtOff); e.classList.toggle('txt', on); } else e.classList.remove('txt');
    if (this.lastLay > 0.4 || this.lastLay < 0) { this.layout(); this.lastLay = 0; }
    if (this.min) return;
    this.frame++; if (app.stage.tier.name === 'low' && (this.frame & 1)) return;
    const g = this.g, s = SCENES[this.idx], k = this.cv.width / SW;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, this.cv.width, this.cv.height);
    g.setTransform(k, 0, 0, k, 0, 0);
    try { s.draw(g, this.t, { calm: app.calm }); } catch (err) { g.fillStyle = '#244'; g.fillRect(0, 0, SW, SH); }
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (this.mask) { g.globalCompositeOperation = 'destination-in'; g.drawImage(this.mask, 0, 0); g.globalCompositeOperation = 'source-over'; } // weicher Rand
    if (this.trans < 1) { // altes Bild löst sich sanft auf und schwebt leicht davon
      this.trans = Math.min(1, this.trans + dt / 0.9); const p = this.trans * this.trans * (3 - 2 * this.trans), cw = this.cv.width, ch = this.cv.height, sc = 1 + 0.05 * p;
      g.save(); g.globalAlpha = 1 - p; g.translate(cw / 2, ch / 2 - p * ch * 0.02); g.scale(sc, sc); g.drawImage(this.prev, -cw / 2, -ch / 2); g.restore();
    }
  }
}
