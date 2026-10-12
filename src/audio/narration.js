// narration.js – Erzählstimme: eingebettete MP3-Clips (lazy dekodiert) oder Sprachsynthese des Browsers als Rückfall.
// Untertitel kommen satzweise über engine.onCaption. Ohne Ton (Sound aus) laufen die Untertitel zeitgesteuert weiter.
import NARR from '../data/narration.generated.js';
import { normalizeForSpeech } from '../data/speech.js';
import { clamp } from './synth.js';

const ABBR = new Set(['ca', 'Mio', 'Mrd', 'z', 'B', 'u', 'a', 'd', 'h', 'usw', 'bzw', 'Nr', 'Dr', 'vgl', 'ggf', 'etc', 'St', 'sog', 'inkl', 'evtl', 'Std', 'Jh', 'Tsd', 'S']);
/** Text in Sätze teilen, ohne bei Abkürzungen („ca.“, „Mio.“, „z. B.“) zu trennen. Ohne Lookbehind (ältere Safari-Versionen). */
export function splitSentences(text) {
  const out = []; let start = 0, m; const re = /[.!?…]+["“”»)]*\s+/g;
  while ((m = re.exec(text))) {
    if (m[0][0] === '.') {
      const w = /(\S+)$/.exec(text.slice(start, m.index)), word = w ? w[1].replace(/^[„"(]/, '') : '';
      const next = text.charAt(m.index + m[0].length);
      if (ABBR.has(word) || (/^\d+$/.test(word) && next && next === next.toLowerCase())) continue;
    }
    out.push(text.slice(start, m.index + m[0].length).trim()); start = m.index + m[0].length;
  }
  const rest = text.slice(start).trim(); if (rest) out.push(rest);
  return out;
}
const synth = () => (typeof window !== 'undefined' && window.speechSynthesis && window.SpeechSynthesisUtterance ? window.speechSynthesis : null);

export class Narrator {
  constructor(e) {
    this.e = e; this.job = null; this.cache = new Map(); this.clips = NARR; this.deVoice = null; this.bad = 0;
    const s = synth();
    if (s) { const pick = () => { this.pick(); this.bad = 0; }; this.pick(); try { s.addEventListener('voiceschanged', pick); } catch (x) { s.onvoiceschanged = pick; } }
  }
  /** Beste deutsche Stimme wählen (de-DE bevorzugt, „natürlich“ klingende zuerst). */
  pick() {
    const s = synth(); if (!s) return; const vs = s.getVoices ? s.getVoices() : []; let best = null, bs = -1;
    for (const v of vs) {
      if (!/^de/i.test(v.lang || '')) continue;
      let sc = /de[-_]DE/i.test(v.lang) ? 10 : 5; if (/premium|enhanced|neural|natural|online|google/i.test(v.name)) sc += 6; if (/anna|helena|katja|petra|markus|conrad|amala|hedda|stefan|yannick|viktoria/i.test(v.name)) sc += 3;
      if (sc > bs) { bs = sc; best = v; }
    }
    this.deVoice = best;
  }
  /** Beim ersten Tippen: Sprachsynthese „aufwecken“ (iOS verlangt eine Geste). */
  warm() {
    if (this._warm) return; this._warm = true; const s = synth(); if (!s) return;
    try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; s.speak(u); } catch (x) { /* egal */ }
  }
  get ids() { return this.clips; }
  play(req) {
    this.stop(true);
    const e = this.e, cid = String(req.id || '').replace(/^card:/, 'card_');
    const sents = splitSentences(String(req.text || '')).map((raw) => { const say = normalizeForSpeech(raw); return { raw, say, w: say.length + 8 }; });
    return new Promise((resolve) => {
      const job = { resolve, sents, idx: -1, mode: '', t0: 0, bounds: null, total: 0, src: null, gain: null };
      this.job = job; e._speaking(true);
      if (!sents.length) { this._end(job); return; }
      const b64 = this.clips[cid];
      if (b64 && e.rig && e.ctx && e.enabled) {
        this._decode(cid, b64).then((buf) => { if (this.job === job) this._playBuf(job, buf); }, () => { if (this.job === job) this._fallback(job); });
      } else this._fallback(job);
    });
  }
  _decode(cid, b64) {
    const hit = this.cache.get(cid); if (hit) { this.cache.delete(cid); this.cache.set(cid, hit); return Promise.resolve(hit); }
    return new Promise((res, rej) => {
      try {
        const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
        const p = this.e.ctx.decodeAudioData(u.buffer, res, rej); // Safari: Callback-Variante; neuere Browser liefern zusätzlich ein Promise
        if (p && p.then) p.then(res, rej);
      } catch (err) { rej(err); }
    }).then((b) => { this.cache.set(cid, b); if (this.cache.size > 4) this.cache.delete(this.cache.keys().next().value); return b; });
  }
  _bounds(job, total) { // Satzanfänge nach Zeichenanteil über die Dauer verteilen
    let sum = 0; for (const s of job.sents) sum += s.w;
    job.bounds = []; let acc = 0; for (const s of job.sents) { job.bounds.push((acc / sum) * total); acc += s.w; }
    job.total = total;
  }
  _playBuf(job, buf) {
    const e = this.e, c = e.ctx, src = c.createBufferSource(), g = c.createGain(), t = c.currentTime + 0.05;
    src.buffer = buf; src.connect(g); g.connect(e.rig.bus.voice);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.03);
    job.mode = 'buf'; job.src = src; job.gain = g; job.t0 = t; this._bounds(job, buf.duration);
    src.onended = () => this._end(job); src.start(t);
  }
  _fallback(job) {
    const s = synth(), e = this.e;
    if (s && e.enabled && this.bad < 2) { job.mode = 'tts'; this._tts(job, s); return; }
    job.mode = 'timed'; job.t0 = performance.now() / 1000; let tot = 0; for (const x of job.sents) tot += x.say.length / 14 + 0.5; this._bounds(job, tot);
  }
  /** Satzweise sprechen (lange Äußerungen bricht Chrome gern ab); ohne installierte Stimme nach 2 s auf Untertitel-Takt umschalten. */
  _tts(job, s) {
    try { s.cancel(); } catch (x) { /* egal */ }
    const next = () => {
      if (this.job !== job) return;
      if (++job.idx >= job.sents.length) { this._end(job); return; }
      const sn = job.sents[job.idx]; this.e._caption(sn.raw);
      const u = new SpeechSynthesisUtterance(sn.say); u.lang = 'de-DE'; u.rate = 0.95; u.pitch = 1; u.volume = clamp(this.e.volume / 0.6, 0.2, 1); if (this.deVoice) u.voice = this.deVoice;
      let started = false, done = false, w1 = 0, w2 = 0; const est = Math.max(1.2, sn.say.length / 12);
      const fin = () => { if (done) return; done = true; clearTimeout(w1); clearTimeout(w2); next(); };
      u.onstart = () => { started = true; }; u.onend = fin; u.onerror = fin;
      w1 = setTimeout(() => { if (started || done) return; this.bad++; done = true; clearTimeout(w2); try { s.cancel(); } catch (x) { /* egal */ } setTimeout(next, est * 1000); }, 2000);
      w2 = setTimeout(fin, (est * 2.5 + 3) * 1000);
      try { s.speak(u); } catch (x) { fin(); }
    };
    next();
  }
  /** Pro Frame: Untertitel an die Wiedergabezeit koppeln (MP3 über die Audiouhr, sonst über die Systemuhr). */
  tick() {
    const j = this.job; if (!j || !j.bounds) return;
    const el = (j.mode === 'buf' ? this.e.ctx.currentTime : performance.now() / 1000) - j.t0;
    while (j.idx + 1 < j.sents.length && el >= j.bounds[j.idx + 1]) this.e._caption(j.sents[++j.idx].raw);
    if (j.mode === 'timed' && el >= j.total) this._end(j);
  }
  _end(job) {
    if (this.job !== job) return; this.job = null;
    if (job.src) { try { job.src.disconnect(); job.gain.disconnect(); } catch (x) { /* egal */ } }
    job.resolve(); this.e._speaking(false); this.e._caption('');
  }
  /** Abbrechen (Umblättern, Karte schließen, Ton aus). quiet: nur auflösen, keine Rückmeldung an die Oberfläche. */
  stop(quiet) {
    const j = this.job; if (!j) return; this.job = null;
    if (j.src) {
      const c = this.e.ctx, now = c.currentTime;
      try { const p = j.gain.gain, cur = p.value; p.cancelScheduledValues(now); p.setValueAtTime(cur, now); p.linearRampToValueAtTime(0, now + 0.06); j.src.stop(now + 0.08); } catch (x) { /* egal */ }
    }
    if (j.mode === 'tts') { try { synth().cancel(); } catch (x) { /* egal */ } }
    j.resolve();
    if (!quiet) { this.e._speaking(false); this.e._caption(''); }
  }
}
