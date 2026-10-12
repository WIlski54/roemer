// Das große Popup-Buch vom Römischen Reich – Hauptprogramm
import * as THREE from 'three';
import { Stage, TIERS, PAGE_W as W, PAGE_D as D } from './engine/scene.js';
import { CamRig } from './engine/camera.js';
import { Book, N_LEAVES, COVER_W, COVER_D } from './engine/book.js';
import { Spreads } from './engine/spreads.js';
import { TimeWindow } from './ui/timewin.js';
import { Q } from './engine/popup.js';
import { Particles, Motes } from './engine/fx.js';
import { Weather, WEATHER_LABEL } from './engine/weather.js';
import { paintCover, toTexture, roundRect, SERIF, RED } from './engine/pagepaint.js';
import { UI } from './ui/ui.js';
import { AudioEngine } from './audio/audio.js';
import { DEFS } from './pages/index.js';
import { ANIMALS } from './art/registry.js';
import { animalPicture } from './engine/thumbs.js'; // Gänse-Album
import { ANIMALS_DE } from './data/animals.de.js';
import { PAGES_DE, CARDS_DE } from './data/pages.de.js';
import { COVER_SPEECH } from './data/speech.js';
import { clamp, lerp, isTouch, reducedMotion } from './engine/util.js';

const store = {
  get(k, d) { try { const v = localStorage.getItem('rpb.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('rpb.' + k, JSON.stringify(v)); } catch (e) { /* ignore */ } },
};
const QUALITY = { high: 190, med: 150, low: 120 };
const HIDDEN_IDS = Object.keys(ANIMALS_DE).filter((k) => ANIMALS_DE[k].hidden);

class App {
  constructor() {
    const qs = new URLSearchParams(location.search); this.qs = qs;
    const touch = isTouch();
    const tierName = qs.get('tier') || (touch ? 'med' : 'high');
    this.t = 0; this.station = -1; this.reading = false; this.panMode = false;
    this.canvas = document.getElementById('stage');
    this.stage = new Stage(this.canvas, { tier: tierName, lockTier: qs.has('tier') });
    this.q = { ppu: 190, maxTex: 1024, pageTex: 1536 };
    this.stage.onTier = (t) => this.applyQ(t);
    this.applyQ(this.stage.tier);
    this.maxAniso = Math.min(8, this.stage.renderer.capabilities.getMaxAnisotropy());
    this.cam = new CamRig(this.stage.camera);
    this.cam.calm = this.calm = store.get('calm', reducedMotion());
    this.cam.bias.snap(0.8);
    this.found = new Set(store.get('found', []).filter((x) => HIDDEN_IDS.includes(x)));
    this.audio = new AudioEngine(this);
    this.audio.cine = store.get('cine', false); this.audio.captions = store.get('cap', true); this.audio.autoNarrate = store.get('auto', true); this.audio.volume = store.get('vol', 0.6);
    this.soundOn = store.get('sound', true); this.audio.setEnabled(this.soundOn);

    // ---- UI
    this.ui = new UI(document.getElementById('ui'), {
      view: () => this.toggleReading(), sound: () => this.toggleSound(), prev: () => this.prev(), next: () => this.next(), go: (i) => this.goTo(i),
      weather: () => this.cycleWeather(), pan: () => this.setPanMode(!this.panMode), resetView: () => this.resetView(), narrate: () => this.narratePage(), readCard: (d) => this.readCard(d), album: () => this.openCardById('album'),
      volume: (v) => { this.audio.setVolume(v); store.set('vol', v); }, calm: (b) => this.setCalm(b), cine: (b) => { this.audio.cine = b; store.set('cine', b); },
      auto: (b) => { this.audio.autoNarrate = b; store.set('auto', b); if (!b) this.audio.stopNarration(); },
      captions: (b) => { this.audio.captions = b; store.set('cap', b); if (!b) this.ui.showCaption(''); },
      helpOpened: () => this.audio.unlock(), cardOpened: () => {}, cardClosed: () => this.onCardClosed(),
    });
    this.timewin = new TimeWindow(this, document.getElementById('ui'));
    this.ui.setStops(PAGES_DE.map((p) => ({ name: p.name, color: p.color })));
    this.ui.setSound(this.soundOn);
    const hp = this.ui.help;
    hp.querySelector('#vol').value = Math.round(this.audio.volume * 100); hp.querySelector('#calm').checked = this.calm; hp.querySelector('#cine').checked = this.audio.cine; hp.querySelector('#cap').checked = this.audio.captions; hp.querySelector('#auto').checked = this.audio.autoNarrate;
    this.ui.setHint('Tippe auf das Buch, um es zu öffnen'); this.ui.setHeader('');
    if (this.found.size) this.ui.setFound(this.found.size, HIDDEN_IDS.length);
    this.audio.onCaption = (t) => this.ui.showCaption(this.audio.captions ? t : '');
    this.audio.onSpeaking = (on) => this.ui.setSpeaking(on);

    // ---- world
    this.book = new Book(this.stage);
    this.fx = {
      dust: new Particles(this.stage.scene, 900), glow: new Particles(this.stage.scene, 700, { additive: true }),
      motes: new Motes(this.stage.scene, TIERS.high.motes),
    };
    this.weather = new Weather(this);
    this.stage.onResize = (w, h) => this.onResize(w, h);
    this.onResize(innerWidth, innerHeight);
    this.paintCoverArt();
    this.makeOpenTag();
    this.stage.setMood(DEFS[0].mood, true);
    this.spreads = new Spreads(this, DEFS);
    this.book.hooks = {
      turnStart: (from, to, fwd) => this.onTurnStart(from, to, fwd),
      turnEnd: (n, from) => this.afterTurn(n, from),
      dragStart: (leaf, fwd) => this.onDragStart(leaf, fwd),
      dragCancel: () => this.onDragCancel(),
      leafLift: (leaf, dir, dur) => this.audio.sfx('lift', { dir }),
      leafLand: (leaf, dir) => this.audio.sfx('land', { dir, cover: leaf.i === 0 }),
    };
    this.setupInput();
    this.last = performance.now();
    this.ready = false;
    this.ui.setLoading(0.15);
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
    this.spreads.ensure(0).then(() => {
      this.ui.setLoading(1); this.ready = true;
      setTimeout(() => this.ui.hideLoading(), 250);
      window.__bookReady = true;
    });
    window.__app = this;
  }

  applyQ(t) {
    this.q.ppu = QUALITY[t.name] || 150; this.q.maxTex = t.cutTex; this.q.pageTex = t.pageTex;
    Q.ppu = this.q.ppu; Q.maxTex = t.cutTex;
    if (this.fx) { this.fx.dust.limit = Math.floor(this.fx.dust.max * t.fx); this.fx.glow.limit = Math.floor(this.fx.glow.max * t.fx); this.fx.motes.count = t.motes; }
    this.fxScale();
    if (this.weather) this.weather.applyTier(t);
  }
  fxScale() {
    if (!this.fx) return;
    const r = this.stage.renderer, h = innerHeight;
    for (const p of [this.fx.dust, this.fx.glow, this.fx.motes.p]) p.setScale(h, this.stage.camera.fov, r.getPixelRatio());
  }
  onResize(w, h) { this.cam.fit(w / h); this.fxScale(); if (this.weather) this.weather.onResize(h); }

  // ------------------------------------------------------------ cover
  paintCoverArt() {
    const specs = { saeule: ANIMALS.cover_saeule(), kolosseum: ANIMALS.cover_kolosseum(), bogen: ANIMALS.cover_bogen() };
    const { canvas } = paintCover({ pxW: Math.min(2048, this.q.pageTex * 1.3), specs });
    const tex = toTexture(canvas, { aniso: this.maxAniso });
    this.book.setFaceTexture(0, 'front', tex);
    this.coverTex = tex;
  }
  makeOpenTag() {
    const c = document.createElement('canvas'); c.width = 640; c.height = 140;
    const g = c.getContext('2d');
    g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 14; g.shadowOffsetY = 5;
    g.fillStyle = '#f3e6c8'; roundRect(g, 14, 10, 612, 104, 38); g.fill(); g.shadowColor = 'transparent';
    g.strokeStyle = 'rgba(139,30,30,.55)'; g.lineWidth = 3; g.setLineDash([12, 9]); roundRect(g, 26, 22, 588, 80, 30); g.stroke(); g.setLineDash([]);
    g.fillStyle = RED; g.font = `bold 62px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('Öffne mich  ▸', 320, 64);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.72), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(COVER_W / 2, 0.012, 3.7); m.renderOrder = 4;
    this.book.faceMount(0, 'front').add(m); this.openTag = m;
  }

  // ------------------------------------------------------------ navigation
  get n() { return this.book.cur; }
  async goTo(s) {
    s = clamp(Math.round(s), -1, DEFS.length - 1);
    this.audio.unlock();
    this.ui.closeCard();
    const n = s + 1;
    if (this.book.busy) { this.book.turnTo(n); return; }
    if (n === this.book.cur) return;
    if (s >= 0 && !this.spreads.list[s].built) { this.ui.setHint('Seite wird gefaltet …'); await this.spreads.ensure(s); }
    this.book.turnTo(n, { mode: Math.abs(n - this.book.cur) > 1 ? 'quick' : 'normal' });
  }
  next() { const n = this.book.busy ? (this.book.queue ? this.book.queue.n : this.book.cur) : this.book.cur; if (n < DEFS.length) this.goTo(n); }
  prev() { const n = this.book.busy ? (this.book.queue ? this.book.queue.n : this.book.cur) : this.book.cur; if (n > 0) this.goTo(n - 2); }

  onTurnStart(from, to, fwd) {
    this.audio.stopNarration();
    this.ui.closeCard(); this.ui.showCaption('');
    const cs = this.spreads.current; if (cs) cs.deactivate();
    this.spreads.turning(from - 1, to - 1);
    this.audio.sfx('turn', { fwd, steps: Math.abs(to - from) });
    this.cam.setClosed(to === 0);
    this.weather.setPage(to - 1);
    if (to > 0) this.applyAtmosphere(to - 1);
    this.ui.setHint('');
    if (this.reading && to === 0) this.toggleReading();
  }
  onDragStart(leaf, fwd) {
    const cs = this.spreads.current; if (cs) cs.deactivate();
    const k = this.book.cur - 1;
    this.spreads.turning(k, fwd ? k + 1 : k - 1);
    this.ui.setHint('');
  }
  onDragCancel() { const cs = this.spreads.current; if (cs && cs.built) cs.activate(this.t); this.ui.setHint(this.currentHint()); }
  currentHint() { return this.station >= 0 ? PAGES_DE[this.station].hint : 'Tippe auf das Buch, um es zu öffnen'; }

  applyAtmosphere(s) {
    const def = DEFS[s];
    this.stage.setMood(def.mood);
    this.fx.motes.setPreset(def.motes || null);
    this.audio.setScene(def.atmo || def.id);
  }
  afterTurn(n) {
    const s = n - 1; this.station = s;
    this.weather.setPage(s);
    this.ui.setActive(Math.max(0, s), n === 0);
    this.cam.setClosed(n === 0);
    if (n === 0) {
      this.spreads.closeAll();
      this.ui.setHeader(''); this.ui.setHint(this.currentHint());
      this.stage.setMood(DEFS[0].mood); this.fx.motes.setPreset(null); this.audio.setScene('cover');
    } else {
      this.spreads.setCurrent(s, this.t);
      this.applyAtmosphere(s);
      const p = PAGES_DE[s];
      this.ui.setHeader(p.era, p.years, p.color); this.ui.setHint(p.hint);
      this.audio.onPageShown && this.audio.onPageShown(s);
    }
    if (n >= 1 && !this.unlockedOnce) this.unlockedOnce = true;
  }
  // test helper: jump without animation
  async snapTo(s) {
    if (s >= 0) await this.spreads.ensure(s);
    const n = s + 1, b = this.book;
    b.leaves.forEach((l, i) => { l.anim = null; l.drag = false; l.theta = i < n ? Math.PI : 0; l.apply(); });
    b.cur = b.settled = n; b.busy = false; b.queue = null; b.update(0);
    this.cam.bias.snap(n === 0 ? 0.8 : 1);
    this.afterTurn(n);
  }

  // ------------------------------------------------------------ UI actions
  toggleReading() {
    this.reading = !this.reading; const c = this.cam;
    if (this.reading) { c.autoReturn = false; c.az.set(0); c.el.set(1.34); c.setZoom(0.86); c.nudge.x = 0; c.nudge.y = 0; c.nudge.z = 0; c.hold = false; this.ui.showToast('Leseansicht: von oben. Noch einmal tippen, um zurückzukehren.'); }
    else { c.autoReturn = true; c.reset(); }
    this.ui.btnView.classList.toggle('on', this.reading);
  }
  cycleWeather() {
    this.audio.unlock();
    const before = this.weather.mode, m = this.weather.cycle();
    this.ui.setWeather(m, WEATHER_LABEL[m]);
    if (m !== before) this.ui.showToast('Wetter: ' + WEATHER_LABEL[m] + (m === 'storm' && this.calm ? ' (ohne Blitze im Ruhigen Modus)' : ''), 1800);
  }
  toggleSound() { this.soundOn = !this.soundOn; this.audio.unlock(); this.audio.setEnabled(this.soundOn); this.ui.setSound(this.soundOn); store.set('sound', this.soundOn); }
  setCalm(b) { this.calm = b; this.cam.calm = b; store.set('calm', b); document.documentElement.classList.toggle('calm', b); if (this.weather) { this.weather.audioKey = ''; this.weather.syncAudio(); } }
  narratePage() {
    this.audio.unlock();
    if (this.audio.speaking) { this.audio.stopNarration(); return; }
    const s = this.station; if (s < 0) { this.audio.narrate({ id: 'cover', text: COVER_SPEECH }); return; }
    const p = PAGES_DE[s]; this.audio.narrate({ id: 'page' + s, text: p.narr });
  }
  readCard(d) {
    this.audio.unlock();
    if (this.audio.speaking) { this.audio.stopNarration(); return; }
    const txt = [d.name, d.tts && d.tts !== d.name ? '' : '', d.wow, d.text].filter(Boolean).join('. ');
    this.audio.narrate({ id: 'card:' + (d.id || d.name), text: d.speak || txt });
  }
  onCardClosed() {
    this.audio.stopNarration();
    if (this.pendingAlbum) { this.pendingAlbum = false; setTimeout(() => this.openCardById('album'), 300); }
  }
  openCardById(id, worldX, over) {
    const raw = ANIMALS_DE[id] || CARDS_DE[id]; if (!raw) return;
    const d = { ...raw, id, ...(over || {}) }; // optionale Überschreibungen
    if (id === 'album') d.extra = this.albumHtml();
    const side = worldX === undefined ? null : worldX > 0 ? 'left' : null;
    if (d.hidden && !this.found.has(id)) {
      this.found.add(id); store.set('found', [...this.found]);
      this.ui.setFound(this.found.size, HIDDEN_IDS.length); this.audio.sfx('found');
      if (this.found.size === HIDDEN_IDS.length) { this.pendingAlbum = true; }
    }
    this.audio.sfx('card');
    this.ui.showCard(d, { side });
  }
  albumHtml() { // Gänse-Album mit kleinen Papierschnitt-Bildern (nicht Gefundene als dunkle Silhouette mit Fragezeichen)
    const items = HIDDEN_IDS.map((k) => {
      const got = this.found.has(k);
      let src = '';
      try { src = animalPicture(k, 168, 112, { dark: !got }).toDataURL('image/png'); } catch (e) { /* ignore */ }
      return `<li class="${got ? 'got' : ''}" style="list-style:none;text-align:center;background:rgba(255,255,255,.5);border-radius:10px;padding:6px 4px 7px;font-size:13.5px;line-height:1.2;position:relative;box-shadow:0 1px 0 rgba(120,80,30,.25)">`
        + `<div style="position:relative;height:66px"><img alt="" src="${src}" style="width:100%;height:66px;object-fit:contain">${got ? '' : '<b style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:30px;color:#f3e6c8;text-shadow:0 1px 3px rgba(0,0,0,.6)">?</b>'}</div>`
        + `<span style="display:block;margin-top:3px;color:${got ? '#3a2615' : '#8a6b3f'};font-weight:${got ? 'bold' : 'normal'}">${got ? ANIMALS_DE[k].name : 'noch nicht gefunden'}</span></li>`;
    }).join('');
    return `<ul class="album" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:8px;margin:10px 0 4px;padding:0">${items}</ul>`;
  }
  // ------------------------------------------------------------ input
  setupInput() {
    const c = this.canvas;
    this.ptrs = new Map(); this.ray = new THREE.Raycaster(); this.ndc = new THREE.Vector2(); this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); this.hitP = new THREE.Vector3();
    this.drag = null;
    c.addEventListener('pointerdown', (e) => this.onDown(e));
    c.addEventListener('pointermove', (e) => this.onMove(e));
    c.addEventListener('pointerup', (e) => this.onUp(e));
    c.addEventListener('pointercancel', (e) => this.onUp(e, true));
    c.addEventListener('wheel', (e) => {
      e.preventDefault();
      const f = e.ctrlKey ? Math.exp(clamp(e.deltaY, -40, 40) * 0.012) : 1 + Math.sign(e.deltaY) * 0.07;
      this.zoomAtPointer(this.cam.zoom * f, e.clientX, e.clientY);
    }, { passive: false });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
    addEventListener('blur', () => { if (this.drag && this.drag.type === 'control') this.drag.ctl.endDrag(); this.drag = null; });
  }
  setRay(e) { this.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); this.ray.setFromCamera(this.ndc, this.stage.camera); }
  zoomAtPointer(z, cx, cy) { this.cam.zoomAt(z, (cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1, innerWidth / innerHeight); }
  // Seitenfläche unter dem Zeiger? -> { fwd, r0, wx } (r0: Abstand zum Falz)
  surfaceHit(e) {
    const b = this.book, n = b.cur;
    if (n < 1 || b.busy) return null;
    const pr = this.onPlane(e, this.pagePlaneY('R'));
    if (pr && n < N_LEAVES - 1 && pr.x > 0.1 && pr.x < W + 0.4 && Math.abs(pr.z) < D / 2 + 0.4) return { fwd: true, r0: pr.x, wx: pr.wx };
    const pl = this.onPlane(e, this.pagePlaneY('L'));
    if (pl && pl.x < -0.1 && pl.x > -W - 0.4 && Math.abs(pl.z) < D / 2 + 0.4) return { fwd: false, r0: -pl.x, wx: pl.wx };
    return null;
  }
  emptyDrag(e) { return this.panMode ? { type: 'pan' } : { type: 'orbit', x0: e.clientX, y0: e.clientY, moved: false }; }
  setPanMode(on) {
    this.panMode = on; this.ui.btnPan.classList.toggle('on', on); this.ui.btnPan.setAttribute('aria-pressed', on ? 'true' : 'false');
    this.canvas.style.cursor = on ? 'grab' : '';
    if (on) this.ui.showToast('Verschieben: Zieh das Buch mit einem Finger. Mit zwei Fingern geht es immer, auch zoomen.', 3600);
  }
  resetView() { this.reading = false; this.ui.btnView.classList.remove('on'); this.cam.autoReturn = true; this.cam.reset(); this.updateViewBtn(true); }
  updateViewBtn(force) { const v = this.cam.viewChanged || this.reading; if (force || v !== this._vb) { this._vb = v; this.ui.setViewDirty(v); } }
  // pointer -> page frame on plane y
  onPlane(e, y) {
    this.setRay(e); this.plane.constant = -y;
    const p = this.ray.ray.intersectPlane(this.plane, this.hitP); if (!p) return null;
    return { wx: p.x, wz: p.z, x: p.x - this.book.group.position.x, z: p.z - this.book.group.position.z };
  }
  pagePlaneY(side) { const n = this.book.cur; return this.book.pageTopY(side, Math.max(0, n - 1)); }
  pick(e) {
    this.setRay(e);
    const objs = this.spreads.pickables(); if (!objs.length) return null;
    const hits = this.ray.intersectObjects(objs, false);
    for (const h of hits) {
      const o = h.object;
      if (o.userData.control) return { type: 'control', ctl: o.userData.control, hit: h };
      if (o.userData.actor) return { type: 'actor', actor: o.userData.actor, hit: h };
      if (o.userData.tap) return { type: 'tap', fn: o.userData.tap, hit: h };
    }
    return null;
  }
  cornerHit(e) {
    const b = this.book, n = b.cur;
    if (n < 1 || b.busy) return 0;
    const pr = this.onPlane(e, this.pagePlaneY('R')); if (!pr) return 0;
    if (n < N_LEAVES - 1 && pr.x > W - 2.5 && pr.x < W + 0.5 && pr.z > D / 2 - 2.1 && pr.z < D / 2 + 0.4) return 1;
    const pl = this.onPlane(e, this.pagePlaneY('L')); if (!pl) return 0;
    if (pl.x < -W + 2.5 && pl.x > -W - 0.5 && pl.z > D / 2 - 2.1 && pl.z < D / 2 + 0.4) return -1;
    return 0;
  }
  onCover(e) {
    this.setRay(e); const l = this.book.leaves[0];
    return this.ray.intersectObjects([l.cloth, l.front.mesh], false).length > 0;
  }
  onDown(e) {
    this.audio.unlock();
    this.canvas.setPointerCapture && this.canvas.setPointerCapture(e.pointerId);
    this.ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY });
    if (this.ptrs.size === 2) { // pinch
      const [a, b] = [...this.ptrs.values()]; this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: this.cam.zoom, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
      if (this.drag && this.drag.type === 'control') this.drag.ctl.endDrag();
      if (this.drag && this.drag.type === 'page') this.book.endDrag();
      this.drag = { type: 'pinch' }; this.cam.dragging = true; return;
    }
    if (this.ui.cardOpen) { this.ui.closeCard(); this.drag = { type: 'none' }; return; }
    if (!this.ready) { this.drag = { type: 'none' }; return; }
    const b = this.book;
    if (e.button === 1 || e.button === 2 || e.shiftKey) { this.drag = { type: 'pan' }; this.cam.dragging = true; return; }
    if (b.cur === 0 && !b.busy) { this.drag = this.onCover(e) ? { type: 'cover', x0: e.clientX, y0: e.clientY, moved: false } : this.emptyDrag(e); this.cam.dragging = this.drag.type !== 'cover'; return; }
    const pk = this.pick(e);
    if (pk && pk.type === 'control') {
      const side = pk.ctl.side; const pos = this.onPlane(e, this.pagePlaneY(side.side));
      pk.ctl.beginDrag(pos.x, pos.z); this.drag = { type: 'control', ctl: pk.ctl, y: this.pagePlaneY(side.side) }; return;
    }
    if (pk) { this.drag = { type: pk.type, pk, x0: e.clientX, y0: e.clientY, moved: false }; return; }
    const corner = this.cornerHit(e);
    if (corner) {
      const leaf = b.beginDrag(corner > 0);
      if (leaf) { this.drag = { type: 'page', fwd: corner > 0 }; this.audio.sfx('grab'); return; }
    }
    if (!this.panMode) {
      const sh = this.surfaceHit(e);
      if (sh) { this.drag = { type: 'surface', x0: e.clientX, y0: e.clientY, fwd: sh.fwd, r: Math.max(4.4, sh.r0), px0: sh.wx, moved: false }; this.cam.dragging = true; return; }
    }
    this.drag = this.emptyDrag(e); this.cam.dragging = true;
  }
  onMove(e) {
    const p = this.ptrs.get(e.pointerId);
    const dx = p ? e.clientX - p.x : 0, dy = p ? e.clientY - p.y : 0;
    if (p) { p.x = e.clientX; p.y = e.clientY; }
    const d = this.drag;
    if (!d) { this.hover(e); return; }
    if (d.type === 'pinch' && this.ptrs.size >= 2) {
      const [a, b] = [...this.ptrs.values()], pn = this.pinch, nd = Math.hypot(a.x - b.x, a.y - b.y), cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
      this.cam.panScreen(cx - pn.cx, cy - pn.cy, innerHeight); pn.cx = cx; pn.cy = cy;
      this.zoomAtPointer(pn.z * pn.d / Math.max(30, nd), cx, cy); return;
    }
    if (d.type === 'pan') { this.cam.panScreen(dx, dy, innerHeight); return; }
    if (d.type === 'surface') {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 9) return;
      const tx = e.clientX - d.x0, ty = e.clientY - d.y0;
      if (Math.abs(tx) > 1.15 * Math.abs(ty) && (d.fwd ? tx < 0 : tx > 0) && this.book.beginDrag(d.fwd)) {
        this.drag = { type: 'page', fwd: d.fwd, grab: true, r: d.r, px0: d.px0 }; this.audio.sfx('grab'); this.cam.dragging = false;
        const pos = this.onPlane(e, this.pagePlaneY(d.fwd ? 'R' : 'L')); if (pos) this.book.dragBy(d.fwd ? d.px0 - pos.wx : pos.wx - d.px0, d.r, 0.016);
        return;
      }
      this.drag = { type: 'orbit', x0: d.x0, y0: d.y0, moved: true }; this.cam.orbit(tx, ty); return;
    }
    if (d.type === 'control') { const pos = this.onPlane(e, d.y); if (pos) d.ctl.dragTo(pos.x, pos.z); return; }
    if (d.type === 'page') { const pos = this.onPlane(e, this.pagePlaneY(d.fwd ? 'R' : 'L')); if (pos) { if (d.grab) this.book.dragBy(d.fwd ? d.px0 - pos.wx : pos.wx - d.px0, d.r, 0.016); else this.book.dragTo(pos.wx, 0.016); } return; }
    if (d.type === 'orbit') {
      if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < 5) return;
      d.moved = true; this.cam.orbit(dx, dy); return;
    }
    if (d.x0 !== undefined && !d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 9) {
      d.moved = true;
      if (d.type === 'actor' || d.type === 'tap') { // Ziehen, das auf einem Tier oder einer Klappe beginnt: wie auf freier Fläche (Seite greifen, Schwenken, Verschieben)
        const sh = this.panMode ? null : this.surfaceHit({ clientX: d.x0, clientY: d.y0 });
        this.drag = this.panMode ? { type: 'pan' } : sh ? { type: 'surface', x0: d.x0, y0: d.y0, fwd: sh.fwd, r: Math.max(4.4, sh.r0), px0: sh.wx, moved: false } : { type: 'orbit', x0: d.x0, y0: d.y0, moved: false };
        this.cam.dragging = true; this.onMove(e);
      }
    }
  }
  onUp(e, cancel) {
    this.audio.unlock(); // iOS entsperrt Audio erst bei Loslassen (touchend/pointerup), nicht beim Aufsetzen
    const d = this.drag; this.ptrs.delete(e.pointerId);
    if (this.canvas.releasePointerCapture) { try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ } }
    if (d && d.type === 'pinch') { if (this.ptrs.size < 2) { this.cam.dragging = false; this.drag = this.ptrs.size ? { type: 'none' } : null; } return; }
    this.drag = null; this.cam.dragging = false;
    if (!d) return;
    if (d.type === 'control') { d.ctl.endDrag(); return; }
    if (d.type === 'page') { this.book.endDrag(); return; }
    if (cancel) return;
    if (d.type === 'cover' && !d.moved) { this.goTo(0); return; }
    if (d.type === 'actor' && !d.moved) { this.tapActor(d.pk.actor); return; }
    if (d.type === 'tap' && !d.moved) { d.pk.fn(d.pk.hit); return; }
  }
  hover(e) {
    if (e.pointerType === 'touch' || !this.ready) return;
    let cur = '';
    if (this.book.cur === 0) { cur = this.onCover(e) ? 'pointer' : ''; this.canvas.style.cursor = cur; return; }
    const pk = this.pick(e);
    for (const a of (this.spreads.current ? [...this.spreads.current.L.actors, ...this.spreads.current.R.actors] : [])) a.setHover(!!(pk && pk.type === 'actor' && pk.actor === a));
    if (pk) cur = pk.type === 'control' ? 'grab' : 'pointer';
    else if (this.cornerHit(e)) cur = 'pointer';
    this.canvas.style.cursor = cur;
  }
  tapActor(a) {
    a.wake(); this.audio.voice(a.id);
    if (a.card) { const w = this.fx && a.popup ? a.popup.group.getWorldPosition(new THREE.Vector3()).x : 0; this.openCardById(a.card, w); }
    if (a.cover && a.cover.fig) { /* hidden animals peek out from behind their cover */ }
  }

  // ------------------------------------------------------------ frame
  loop(now) {
    requestAnimationFrame(this.loop);
    let dt = (now - this.last) / 1000; this.last = now; this.frames = (this.frames || 0) + 1;
    dt = clamp(dt, 0, 0.05); this.t += dt;
    const st = this.stage;
    st.sample(dt);
    this.spreads.pump(this.ready ? 6 : 14);
    this.book.update(dt);
    this.spreads.update(dt, this.t);
    this.updateOpenTag(dt);
    this.cam.update(dt); this.updateViewBtn();
    this.weather.update(dt, this.t);
    st.updateMood(dt);
    const fxs = st.tier.fx * (this.calm ? 0.7 : 1);
    this.fx.motes.update(dt, this.t, st.tier.motes / TIERS.high.motes);
    this.fx.dust.update(dt); this.fx.glow.update(dt);
    this.audio.update(dt, this.t);
    if (this.timewin) this.timewin.update(dt);
    st.render();
  }
  updateOpenTag(dt) {
    const l = this.book.leaves[0], m = this.openTag; if (!m) return;
    const show = l.theta < 0.02 && this.book.cur === 0 && !this.book.busy && this.ready;
    const target = show ? 1 : 0; m.userData.k = lerp(m.userData.k ?? 0, target, 1 - Math.exp(-dt * 6));
    m.visible = m.userData.k > 0.01; m.material.opacity = m.userData.k;
    const pul = 1 + Math.sin(this.t * 2.6) * 0.035; m.scale.set(pul, pul, 1);
  }
}

const app = new App();
export default app;
