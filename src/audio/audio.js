// audio.js – Klangmaschine des Römer-Popup-Buchs (reines Web Audio, keine Audiodateien außer den eingebetteten Erzähl-Clips).
// Öffentliche API: siehe docs/AUDIO.md. Module: synth (Kern/Pool), parts (Klang-Bausteine), horns (Cornu/Tuba/Fanfare), sfx, voices (Gänse & Co.),
// scenes (Atmosphären + ctl-Schichten), music (erfundene Leier-/Flötenmotive), narration.
import { Rig, clamp } from './synth.js';
import { SFX, SFX_NAMES, GAP, EV, EV_NAMES, PEAK, PEAK_DEFAULT } from './sfx.js';
import { playVoice, VOICE_IDS, VOICE_PEAK, VOICE_PEAK_DEFAULT } from './voices.js';
import { Scenes, Layers, SCENE_IDS, SCENE_T } from './scenes.js';
import { Music, MUSIC, MUSIC_IDS, MUSIC_T } from './music.js';
import { Narrator } from './narration.js';
import { PAGES_DE } from '../data/pages.de.js';

const LOOK = 0.35; // Vorausschau der Scheduler in Sekunden

// iOS/iPadOS: Web Audio folgt sonst dem Stumm-Schalter. Neuere Safari-Versionen kennen navigator.audioSession ('playback');
// für ältere läuft ein (hörbar stummes) HTML-Audio-Element, das die Sitzung auf „Wiedergabe“ stellt.
function silentWavUri(sec = 1, rate = 8000) {
  const n = sec * rate, b = new Uint8Array(44 + n), v = new DataView(b.buffer);
  const w = (o, t) => { for (let i = 0; i < t.length; i++) b[o + i] = t.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  b.fill(128, 44);
  let t = ''; for (let i = 0; i < b.length; i += 0x2000) t += String.fromCharCode.apply(null, b.subarray(i, i + 0x2000));
  return 'data:audio/wav;base64,' + btoa(t);
}

export class AudioEngine {
  constructor(app) {
    this.app = app; this.enabled = true; this.volume = 0.6; this.cine = false; this.captions = true; this.speaking = false; this.autoNarrate = true; this.unlocked = false;
    this.onCaption = null; this.onSpeaking = null;
    this.ctx = null; this.rig = null; this.scenes = null; this.layers = null; this.music = null; this.narr = new Narrator(this);
    this.sceneId = ''; this.cv = {}; this.last = {}; this.vlast = {}; this.silUntil = 0; this._pageTok = 0; this._nextSweep = 0; this._warned = {}; this._failed = false; this._kick = false;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => { // Tab im Hintergrund: Audio anhalten, Erzählung beenden
        const c = this.ctx; if (!c) return;
        if (document.hidden) { this.stopNarration(); try { c.suspend(); } catch (e) { /* egal */ } } else if (this.enabled && this.unlocked) { try { c.resume(); } catch (e) { /* egal */ } }
      });
      setInterval(() => { if (this.live()) this._pump(this.ctx.currentTime); }, 150); // Sicherheitsnetz, falls Frames kurz ausbleiben
    }
  }
  /** Klänge dürfen geplant werden (auch solange der Kontext nach der ersten Geste noch „suspended“ ist – dann starten sie beim Fortsetzen). */
  live() { return !!(this.rig && this.enabled && this.ctx.state !== 'closed' && !document.hidden); }

  // ---------------------------------------------------------------- Start / Schalter
  /** Erste Geste (iOS): AudioContext erzeugen bzw. fortsetzen, Stille-Puffer spielen, Sprachsynthese wecken. */
  _playbackSession(on) {
    try {
      if (navigator.audioSession) { if (on) navigator.audioSession.type = 'playback'; return; }
      if (!/iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) || !('ontouchend' in document)) return; // nur iOS/iPadOS ohne audioSession-API
      if (!this._sil && !on) return;
      if (!this._sil) { const a = document.createElement('audio'); a.setAttribute('playsinline', ''); a.loop = true; a.src = silentWavUri(); a.volume = 1; this._sil = a; }
      if (on) { const p = this._sil.play(); if (p && p.catch) p.catch(() => {}); } else if (this._sil) this._sil.pause();
    } catch (e) { /* egal */ }
  }
  unlock() {
    if (!this._sess) { this._sess = true; this._playbackSession(true); }
    if (!this.ctx && !this._failed) this._create();
    const c = this.ctx; if (!c) return;
    if (this.enabled && c.state !== 'running' && c.state !== 'closed') { try { const p = c.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* egal */ } }
    if (!this._kick) { this._kick = true; try { const s = c.createBufferSource(); s.buffer = c.createBuffer(1, 1, 22050); s.connect(c.destination); s.start(0); } catch (e) { /* egal */ } }
    this.unlocked = true; this.narr.warm();
  }
  _create() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) { this._failed = true; return; }
    try {
      let c; try { c = new AC({ latencyHint: 'interactive' }); } catch (e) { c = new AC(); }
      const low = this.app && this.app.stage && this.app.stage.tier && this.app.stage.tier.name === 'low';
      this.ctx = c; this.rig = new Rig(c, { max: low ? 16 : 24 });
      this.scenes = new Scenes(this.rig); this.layers = new Layers(this.rig); this.music = new Music(this.rig);
      this._applyAll();
      if (!this.enabled) { try { c.suspend(); } catch (e) { /* egal */ } }
    } catch (e) { this._failed = true; this.ctx = null; this.rig = null; this._warn('create', e); }
  }
  /** Gespeicherten Zustand (Lautstärke, ctl-Werte, Szene) auf den Graphen anwenden – nach dem Erzeugen und beim Einschalten. */
  _applyAll() {
    const R = this.rig, now = this.ctx.currentTime; if (!R) return;
    R.master.gain.setTargetAtTime(this.enabled ? clamp(this.volume, 0, 1) : 0, now, 0.06);
    if (!this.enabled) return;
    for (const k in this.cv) this._ctlApply(k, this.cv[k]);
    if (this.sceneId) this._startScene(this.sceneId);
  }
  setEnabled(b) {
    this.enabled = !!b; this._playbackSession(this.enabled && !!this._sess); const R = this.rig; if (!R) return;
    const c = this.ctx, now = c.currentTime;
    if (this.enabled) { try { c.resume(); } catch (e) { /* egal */ } this._applyAll(); }
    else {
      this.stopNarration(); R.master.gain.setTargetAtTime(0, now, 0.04);
      this.scenes.clear(0.1); this.music.stop(0.1); this.layers.stopAll();
      setTimeout(() => { if (!this.enabled && this.ctx.state === 'running') { try { this.ctx.suspend(); } catch (e) { /* egal */ } } }, 350);
    }
  }
  setVolume(v) { this.volume = clamp(+v || 0, 0, 1); if (this.rig && this.enabled) this.rig.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.03); }

  // ---------------------------------------------------------------- Klänge
  /** Einmal-Geräusch; unbekannte Namen werden still ignoriert; Aufrufe werden je Name gedrosselt. */
  sfx(name, o) {
    if (!this.live()) return;
    const fn = SFX[name]; if (!fn) return;
    o = o || {}; const now = this.ctx.currentTime, gap = name === 'tick' && o.fast ? 0.02 : GAP[name] ?? 0.05;
    if (now - (this.last[name] ?? -9) < gap) return; this.last[name] = now;
    this.rig.calm = !!(this.app && this.app.calm); this.rig.cine = !!this.cine;
    try { fn(this.rig, now + 0.012, o); } catch (e) { this._warn(name, e); }
  }
  /** Stimme einer Figur (gans1…gans8, wolfin, elefant, pferd, hund, esel, person); gleiche Stimmen unterbrechen sich, alle anderen ids bleiben still. */
  voice(id) {
    if (!this.live() || !VOICE_IDS.includes(id)) return;
    const now = this.ctx.currentTime; if (now - (this.vlast[id] ?? -9) < 0.25) return; this.vlast[id] = now;
    this.rig.killId(id); this.rig.calm = !!(this.app && this.app.calm);
    try { playVoice(this.rig, id, now + 0.012, {}); } catch (e) { this._warn('voice:' + id, e); }
  }
  setScene(id) {
    this.sceneId = id; if (this.live()) this._startScene(id);
  }
  _startScene(id) {
    const t = this.ctx.currentTime + 0.02, cur = this.scenes.cur;
    if (cur && cur.id === id && !cur.fading && this.music.id === id) return; // dieselbe Szene noch einmal: nichts neu starten
    if (this.scenes.set(id, t, 1.2)) this.music.setScene(id, t, 1.2);
  }
  /** Kontinuierliche Parameter 0…1: wind rainfall underwater hush; ausklang (Szene 'rhein': Atmosphäre geht gegen Stille). Unbekannte Namen: still ignoriert. */
  ctl(name, v) {
    v = clamp(+v || 0, 0, 1);
    if (Math.abs((this.cv[name] ?? -1) - v) < 0.003) return;
    this.cv[name] = v; if (this.rig) this._ctlApply(name, v);
  }
  _ctlApply(name, v) {
    const now = this.ctx.currentTime;
    if (name === 'hush') { if (now >= this.silUntil) this.rig.lull.gain.setTargetAtTime(1 - v, now, 0.25); }
    else {
      if (this.enabled || name === 'underwater') this.layers.set(name, v, now);
      this.scenes.ctl(name, v);
    }
  }
  /** Alle Busse außer Stimme sanft auf ~0 (0.5 s), sec Sekunden halten, dann 1.8 s zurück. delay: Verzögerung in s. */
  silence(sec = 3, delay = 0) {
    const R = this.rig; if (!R || !this.enabled || !(sec > 0)) return;
    const c = this.ctx, p = R.lull.gain, n0 = c.currentTime, t = n0 + delay, cur = p.value, back = 1 - (this.cv.hush || 0);
    p.cancelScheduledValues(n0); p.setValueAtTime(cur, n0); p.setValueAtTime(cur, t); p.linearRampToValueAtTime(0, t + 0.5);
    p.setValueAtTime(0, t + Math.max(sec, 0.5)); p.linearRampToValueAtTime(back, t + Math.max(sec, 0.5) + 1.8);
    this.silUntil = t + Math.max(sec, 0.5) + 1.8;
  }

  // ---------------------------------------------------------------- Erzählung
  narrate(req) { return this.narr.play(req || {}); }
  stopNarration() { this._pageTok++; this.narr.stop(); }
  /** main.js ruft das nach der Landung jeder Seite: nach ≈0.9 s spricht die Erzählstimme den Seitentext. */
  onPageShown(i) {
    const tok = ++this._pageTok;
    if (!this.enabled || !this.unlocked || !this.autoNarrate) return;
    setTimeout(() => {
      if (tok !== this._pageTok || !this.enabled || this.speaking) return;
      if (this.app && this.app.station !== i) return;
      const p = PAGES_DE[i]; if (p) this.narr.play({ id: 'page' + i, text: p.narr });
    }, 900);
  }
  _speaking(on) { // Erzählung ducken: Musik/Atmo ≈ 35 %, Effekte ≈ 70 %
    this.speaking = on; if (this.onSpeaking) this.onSpeaking(on);
    const R = this.rig; if (!R) return; const now = this.ctx.currentTime, tc = on ? 0.08 : 0.25;
    R.duck.music.gain.setTargetAtTime(on ? 0.35 : 1, now, tc); R.duck.atmo.gain.setTargetAtTime(on ? 0.35 : 1, now, tc); R.duck.fx.gain.setTargetAtTime(on ? 0.7 : 1, now, tc);
  }
  _caption(t) { if (this.onCaption) this.onCaption(t); }

  // ---------------------------------------------------------------- Frame
  /** Pro Frame: Untertitel, Scheduler (Szene, Musik, ctl-Schichten), Aufräumen. Keine Allokationen im Normalfall. */
  update(dt) {
    this.narr.tick();
    if (!this.live()) return;
    const now = this.ctx.currentTime; this.rig.calm = !!(this.app && this.app.calm); this.rig.cine = !!this.cine;
    this._pump(now); this.layers.update(dt, now);
    if (now > this._nextSweep) { this.rig.sweep(now); this._nextSweep = now + 0.5; if (this.silUntil && now > this.silUntil) this.silUntil = 0; }
  }
  _pump(now) { const to = now + LOOK; this.rig.calm = !!(this.app && this.app.calm); this.rig.cine = !!this.cine; this.scenes.tick(now, to); this.music.tick(now, to); this.layers.tick(now, to); }
  _warn(k, e) { if (!this._warned[k]) { this._warned[k] = 1; console.warn('[audio] ' + k, e); } }

  // ---------------------------------------------------------------- Test- und Diagnosehilfen
  catalog() {
    return { sfx: SFX_NAMES.slice(), voices: VOICE_IDS.slice(), scenes: SCENE_IDS.slice(), music: MUSIC_IDS.filter((k) => MUSIC[k]), ev: EV_NAMES.slice(), ctl: ['wind', 'rainfall', 'underwater', 'hush', 'ausklang'],
      peaks: { ...PEAK, _default: PEAK_DEFAULT }, voicePeaks: { ...VOICE_PEAK, _default: VOICE_PEAK_DEFAULT }, sceneT: { ...SCENE_T }, musicT: { ...MUSIC_T } };
  }
  stats() { const R = this.rig; return { voices: R ? R.list.length : 0, max: R ? R.max : 0, state: this.ctx ? this.ctx.state : 'none', scene: this.scenes && this.scenes.cur ? this.scenes.cur.id : '', old: this.scenes ? this.scenes.old.length : 0 }; }
  /**
   * Klang offline in einen OfflineAudioContext rendern (Mono, Float32Array) – für tools/audio-check.mjs.
   * kind: 'sfx' | 'ev' | 'voice' | 'scene' | 'music' | 'ctl' | 'xfade' | 'mix' | 'sine'
   * o: seed, sr, cine, calm, low, opts (sfx-/voice-Optionen), ctl {name:wert}, layers {name:wert}, solo (nur ein Teil der Szene), noStreams (Szene ohne Ereignisse),
   *    master (true = mit Kompressor/Limiter/Master-Gain), volume, at (Vorlauf), from/to (kind 'ctl': Verlauf des Steuerwerts),
   *    xfade: name = Szene A, o.to = Szene B, o.switchAt = Sekunde des Wechsels (mit Musik, wie live: Kontext wird dort angehalten und fortgesetzt);
   *    mix: Szene `name` + Musik + o.sfx [[name, t, opts]] + o.voices [[id, t]] in einem Graphen.
   */
  async renderOffline(kind, name, seconds = 4, o = {}) {
    const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext, sr = o.sr || 44100, N = Math.max(1, Math.ceil(seconds * sr));
    const c = new OC(1, N, sr), R = new Rig(c, { seed: o.seed ?? 4242, raw: !o.master, max: o.low ? 16 : 600, limComp: o.limComp }), t = 0.02 + (o.at || 0); // o.at: Vorlauf in Stille (Tests der Master-Kette)
    if (R.master) R.master.gain.value = o.volume ?? 0.6;
    R.calm = !!o.calm; R.cine = !!o.cine;
    if (kind === 'sfx') { const fn = SFX[name]; if (!fn) throw new Error('unbekannter sfx: ' + name); fn(R, t, o.opts || {}); }
    else if (kind === 'ev') { const fn = EV[name]; if (!fn) throw new Error('unbekannter ev: ' + name); fn(R, t, o.opts || {}); }
    else if (kind === 'sine') { const v = R.voice(1, 'fx', ''), g = v.g(Math.pow(10, (o.level ?? -20) / 20)), s = v.osc('sine', o.freq || 1000, t, t + seconds - 0.1); s.connect(g); g.connect(v.out); } // Messton für die Master-Kette
    else if (kind === 'voice') playVoice(R, name, t, o.opts || {});
    else if (kind === 'scene') {
      const L = new Layers(R); for (const k in o.layers || {}) L.set(k, o.layers[k], 0);
      const S = new Scenes(R); S.solo = o.solo || ''; for (const k in o.ctl || {}) S.params[k] = o.ctl[k];
      if (!S.set(name, t, 0.03)) throw new Error('unbekannte Szene: ' + name);
      if (o.noStreams) S.cur.str.length = 0;
      for (const [en, et] of o.events || []) S.event(en, et);
      S.tick(0, seconds + 0.1);
    } else if (kind === 'music') { const M = new Music(R); M.setScene(name, t, 0); M.tick(0, seconds + 0.1); }
    else if (kind === 'mix') {
      const S = new Scenes(R), M = new Music(R); S.set(name, t, 0.03); M.setScene(name, t, 0);
      for (const [n, et, op] of o.sfx || []) SFX[n](R, t + et, op || {}); for (const [n, et] of o.voices || []) playVoice(R, n, t + et, {});
      S.tick(0, seconds + 0.1); M.tick(0, seconds + 0.1);
    } else if (kind === 'xfade') { // Szenenwechsel wie live: bis zum Wechsel vorausplanen, dort anhalten, umschalten, weiterrendern (o.chain [[Sekunde, Szene], …])
      const S = new Scenes(R), M = new Music(R), fade = o.fade ?? 1.2, ch = o.chain || [[o.switchAt ?? 6, o.to]]; S.set(name, t, fade); M.setScene(name, t, fade); S.tick(0, ch[0][0]); M.tick(0, ch[0][0]);
      ch.forEach(([T, to], i) => c.suspend(T).then(() => { const now = c.currentTime, nx = ch[i + 1] ? ch[i + 1][0] : seconds + 0.1; S.set(to, now + 0.02, fade); M.setScene(to, now + 0.02, fade); S.tick(now, nx); M.tick(now, nx); c.resume(); }));
    } else if (kind === 'ctl') { // Steuerwert linear von o.from nach o.to fahren (60 Bilder/s) – simuliert die Frame-Schleife
      const L = new Layers(R), a = o.from ?? 0, b = o.to ?? 1, n = Math.floor(seconds * 60);
      for (let i = 0; i <= n; i++) { const now = i / 60; L.set(name, a + (b - a) * (i / n), now); L.update(1 / 60, now); L.tick(now, now + LOOK); }
    } else throw new Error('unbekannte Art: ' + kind);
    const buf = await c.startRendering();
    return buf.getChannelData(0).slice();
  }
}
