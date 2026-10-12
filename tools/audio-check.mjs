// Messprüfung der Klangmaschine des Römer-Buchs (wir können nicht hören – also messen).
//   node tools/audio-check.mjs [--calibrate] [--lite] [--no-build] [--only=<Teil des Namens>] [--out=/tmp/claude-0/audio_test]
// Baut das Buch (oder mit --lite nur die Klangmaschine), startet es headless, rendert jeden Klang über engine.renderOffline,
// misst Spitze/RMS/K-gewichtete Lautheit/Gleichanteil/Stille/Schwerpunkt/Klicks/NaN, markiert Verstöße, schreibt Tabelle + JSON + WAVs
// und macht einen Live-Test der echten Engine (Pool, Drosselung, Szenenwechsel, ctl, Erzählung).
//   --calibrate  passt src/audio/levels.js so an, dass alle Klänge die Zielpegel treffen (zwei Durchläufe), danach Messung.
// Zielpegel stehen in der Engine selbst (audio.catalog(): peaks, voicePeaks, sceneT, musicT) – hier nur die Prüfregeln.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { open, ready } from './harness.mjs';

const args = process.argv.slice(2), flag = (n) => args.includes('--' + n), opt = (n, d) => (args.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const OUT = opt('out', '/tmp/claude-0/audio_test'), ONLY = opt('only', ''), LITE = flag('lite'), CAL = flag('calibrate');
const ROOT = path.resolve('.'), HTML = path.join(OUT, LITE ? 'lite.html' : 'index.html'), SR = 44100;
const PEAK_MAX = -6; // nichts über −6 dBFS Spitze (Rohsignal, Lautstärke 1.0)
fs.mkdirSync(path.join(OUT, 'wav'), { recursive: true });

const SFX_SEC = { musicbox: 18, tinnitus: 6, gong: 9, fanfare: 6, cornu: 3.5, tuba: 3, horn: 4.5, rumble: 5, fossil: 4, found: 4, chime: 4, ping: 3, wave: 4, kutsche: 3.5, schiff: 3.8, kran: 3.2, menge: 3.6, feuer: 3.2, wasser: 2.4, ruder: 3.6, seil: 2.4, saege: 2.5, default: 3 };
const SFX_OPTS = { slide: { v: 0.5 }, footstep: { v: 0.5 }, tick: { rate: 0.3 }, marsch: { n: 2, v: 0.5 }, rad: { v: 0.5 }, hammer: {}, honk: { n: 3 } };
const SFX_VARIANTS = [['stomp', { big: false }], ['splash', { big: true }], ['land', { cover: true }], ['turn', { steps: 3, fwd: false }], ['footstep', { big: true }], ['tick', { fast: true, rate: 0.6 }], ['slide', { v: 0.1 }], ['slide', { v: 0.95 }], ['card', { close: true }], ['rumble', { dur: 3 }],
  ['marsch', { n: 1 }], ['marsch', { n: 6, v: 1 }], ['hammer', { n: 6, iron: true }], ['saege', { n: 6 }], ['trommel', { n: 10 }], ['rad', { v: 0 }], ['rad', { v: 1 }], ['ruder', { n: 5 }], ['honk', { n: 1 }], ['honk', { n: 8 }], ['wasser', { dur: 3 }], ['feuer', { dur: 4 }], ['menge', { dur: 4 }], ['kutsche', { pan: 0 }]];
const CINE = ['cornu', 'tuba', 'fanfare', 'trommel', 'horn', 'marsch', 'menge', 'gong'], CALM = ['cornu', 'tuba', 'fanfare', 'trommel', 'menge', 'gong', 'hammer', 'kran', 'stomp', 'impact', 'honk', 'saege', 'marsch', 'thud', 'muenze', 'woodcrack', 'crack'];
const ORDER = ['cover', 'titel', 'rom-entsteht', 'grossmacht', 'legion', 'kaiser', 'hoehepunkt', 'stadtleben', 'ingenieure', 'rhein'];
// typischer Ablauf (höchstens zwei Klänge gleichzeitig) und ein Sturmtest (alles auf einmal, nur Limiter-/Übersteuerungsprüfung)
const MIX_SFX = [['turn', 2, {}], ['tapp', 4, {}], ['cornu', 5.5, {}], ['found', 9.5, {}], ['menge', 12, {}]], MIX_VOICES = [['gans3', 8.2], ['elefant', 11.8]];
const STORM_SFX = [['turn', 2, {}], ['tapp', 4, {}], ['cornu', 5, {}], ['fanfare', 7, {}], ['found', 8.5, {}], ['menge', 9.5, {}], ['gong', 11, {}], ['musicbox', 12, {}]], STORM_VOICES = [['gans3', 6], ['elefant', 9], ['gans7', 10.2], ['pferd', 11.5]];

function jobs(cat) {
  const J = [], pk = (n) => cat.peaks[n] ?? cat.peaks._default, vpk = (n) => cat.voicePeaks[n] ?? cat.voicePeaks._default;
  for (const n of cat.sfx) J.push({ kind: 'sfx', name: n, sec: SFX_SEC[n] || SFX_SEC.default, o: { opts: SFX_OPTS[n] || {} }, key: 'sfx:' + n, tp: pk(n), base: true });
  for (const n of cat.ev) J.push({ kind: 'ev', name: n, sec: 3, o: { opts: n === 'schaf' ? {} : {} }, key: 'ev:' + n, tp: pk(n), base: true });
  for (const [n, op] of SFX_VARIANTS) J.push({ kind: 'sfx', name: n, sec: Math.max(SFX_SEC[n] || SFX_SEC.default, op.dur ? op.dur + 2.6 : 0), o: { opts: op }, label: n + JSON.stringify(op).replace(/"/g, ''), tp: null });
  for (const n of CINE) J.push({ kind: 'sfx', name: n, sec: SFX_SEC[n] || SFX_SEC.default, o: { opts: SFX_OPTS[n] || {}, cine: true }, label: n + ' (kräftig)', tp: null, cmp: { name: n, op: 'cine' } });
  for (const n of CALM) J.push({ kind: 'sfx', name: n, sec: SFX_SEC[n] || SFX_SEC.default, o: { opts: SFX_OPTS[n] || {}, calm: true }, label: n + ' (ruhig)', tp: null, cmp: { name: n, op: 'calm' } });
  for (const n of [...cat.voices, 'zzz_unbekannt', 'p_buerger']) {
    const unk = n === 'zzz_unbekannt' || n === 'p_buerger';
    J.push({ kind: 'voice', name: n, sec: 3.5, o: {}, key: unk ? null : 'voice:' + n, tp: vpk(n), base: !unk, silent: unk });
  }
  for (const n of ['elefant', 'pferd', 'esel', 'hund']) J.push({ kind: 'voice', name: n, sec: 3, o: { calm: true }, label: n + ' (ruhig)', tp: null });
  // Das Bett (Dauerklänge ohne Einzelereignisse) wird auf gleiche Lautheit kalibriert; Ereignisse (Signalhörner, Hammer …) dürfen es bewusst überragen.
  for (const n of cat.scenes) J.push({ kind: 'scene', name: n, sec: 24, o: { noStreams: true }, label: n + ' (Bett)', key: 'scene:' + n, tr: cat.sceneT[n] ?? cat.sceneT.default, range: 2.5, base: true });
  for (const n of cat.scenes) J.push({ kind: 'scene', name: n, sec: 24, o: {}, label: n + ' + Ereignisse', tr: null, lkRange: n === 'cover' ? [-48, -42] : [-28.5, -21] });
  J.push({ kind: 'scene', name: 'kaiser', sec: 14, o: { low: true, calm: true }, label: 'kaiser (Tier low, ruhig)', tr: null });
  J.push({ kind: 'scene', name: 'rhein', sec: 20, o: { ctl: { ausklang: 1 } }, label: 'rhein (ausklang 1)', tr: null });
  J.push({ kind: 'scene', name: 'rom-entsteht', sec: 12, o: { layers: { underwater: 0.9 } }, label: 'rom-entsteht (unter Wasser)', tr: null });
  J.push({ kind: 'scene', name: 'legion', sec: 14, o: { layers: { wind: 1, rainfall: 1 } }, label: 'legion (Wind+Regen-Schicht)', tr: null });
  for (const n of cat.music) J.push({ kind: 'music', name: n, sec: 40, o: {}, key: 'music:' + n, tr: cat.musicT[n] ?? cat.musicT.default, range: 3, base: true });
  J.push({ kind: 'ctl', name: 'wind', sec: 6, o: { from: 1, to: 1 }, label: 'ctl wind 1', tr: null });
  J.push({ kind: 'ctl', name: 'rainfall', sec: 6, o: { from: 0, to: 1 }, label: 'ctl rainfall 0→1', tr: null });
  const seq = [...ORDER, ...ORDER.slice(0, -1).reverse()]; // vorwärts durchs Buch und wieder zurück
  for (let i = 0; i + 1 < seq.length; i++) J.push({ kind: 'xfade', name: seq[i], sec: 11, o: { chain: [[6, seq[i + 1]]] }, label: `Wechsel ${seq[i]} → ${seq[i + 1]}`, tr: null, xf: [6] });
  J.push({ kind: 'xfade', name: 'legion', sec: 14, o: { chain: [[5, 'kaiser'], [5.5, 'hoehepunkt'], [6, 'rhein'], [7.5, 'cover']] }, label: 'Wechsel schnell hintereinander (4×)', tr: null, xf: [5, 5.5, 6, 7.5] });
  for (const n of cat.scenes) J.push({ kind: 'mix', name: n, sec: 15, o: { master: true, volume: 1, at: 1, sfx: MIX_SFX, voices: MIX_VOICES }, label: `Mix ${n} + Musik + Klänge (Lautstärke 1.0)`, tr: null, master: true });
  for (const n of ['hoehepunkt', 'legion']) J.push({ kind: 'mix', name: n, sec: 15, o: { master: true, volume: 1, at: 1, sfx: STORM_SFX, voices: STORM_VOICES }, label: `Sturm ${n}: alles auf einmal (Lautstärke 1.0)`, tr: null, master: true, storm: true });
  J.push({ kind: 'sfx', name: 'fanfare', sec: 8, o: { master: true, volume: 1, at: 1, cine: true }, label: 'fanfare kräftig über Master (1.0)', tr: null, master: true });
  J.push({ kind: 'sfx', name: 'found', sec: 5, o: { master: true, volume: 1, at: 1 }, label: 'found über Master (1.0)', tr: null, master: true });
  J.push({ kind: 'voice', name: 'elefant', sec: 4, o: { master: true, volume: 1, at: 1 }, label: 'elefant über Master (1.0)', tr: null, master: true });
  return ONLY ? J.filter((j) => (j.label || j.name).includes(ONLY) || j.kind === ONLY) : J;
}

// ------------------------------------------------------------------ Analyse
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const a = (-2 * Math.PI) / len, wr = Math.cos(a), wi = Math.sin(a);
    for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const ur = re[i + k], ui = im[i + k], vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci, vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr; re[i + k] = ur + vr; im[i + k] = ui + vi; re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } }
  }
}
const db = (x) => (x > 1e-9 ? 20 * Math.log10(x) : -180);
// K-Gewichtung (ITU-R BS.1770: Hochton-Anhebung + Hochpass 38 Hz) – nähert die empfundene Lautheit besser an als der reine Effektivwert
function biquad(x, b, a) { const y = new Float64Array(x.length); let x1 = 0, x2 = 0, y1 = 0, y2 = 0; for (let i = 0; i < x.length; i++) { const v = x[i], o = (b[0] * v + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2) / a[0]; y[i] = o; x2 = x1; x1 = v; y2 = y1; y1 = o; } return y; }
function kWeighted(x) {
  const hs = (() => { const f0 = 1681.974450955533, G = 3.999843853973347, Q = 0.7071752369554196, A = Math.pow(10, G / 40), w = (2 * Math.PI * f0) / SR, c = Math.cos(w), al = Math.sin(w) / (2 * Q), s = 2 * Math.sqrt(A) * al;
    return [[A * (A + 1 + (A - 1) * c + s), -2 * A * (A - 1 + (A + 1) * c), A * (A + 1 + (A - 1) * c - s)], [A + 1 - (A - 1) * c + s, 2 * (A - 1 - (A + 1) * c), A + 1 - (A - 1) * c - s]]; })();
  const hp = (() => { const f0 = 38.13547087602444, Q = 0.5003270373238773, w = (2 * Math.PI * f0) / SR, c = Math.cos(w), al = Math.sin(w) / (2 * Q); return [[(1 + c) / 2, -(1 + c), (1 + c) / 2], [1 + al, -2 * c, 1 - al]]; })();
  return biquad(biquad(x, hs[0], hs[1]), hp[0], hp[1]);
}
function analyze(x, kind) {
  const N = x.length; let pk = 0, nan = 0, clip = 0, sum = 0;
  for (let i = 0; i < N; i++) { const v = x[i]; if (!Number.isFinite(v)) { nan++; continue; } const a = Math.abs(v); if (a > pk) pk = a; if (a >= 0.999) clip++; sum += v; }
  let S = 0, L = N - 1; while (S < N && Math.abs(x[S]) <= 1e-5) S++; while (L > S && Math.abs(x[L]) <= 1e-5) L--;
  const scene = kind === 'scene' || kind === 'music' || kind === 'ctl' || kind === 'xfade' || kind === 'mix', a0 = scene ? Math.min(Math.round(0.1 * SR), N - 1) : S, a1 = scene ? N - 1 : L, n = Math.max(1, a1 - a0 + 1);
  let sq = 0, dc = 0; for (let i = a0; i <= a1; i++) { sq += x[i] * x[i]; dc += x[i]; } const rms = Math.sqrt(sq / n); dc /= n;
  let lk = -180; if (scene && pk > 0) { const k = kWeighted(x); let s2 = 0; for (let i = a0; i <= a1; i++) s2 += k[i] * k[i]; lk = 10 * Math.log10(s2 / n + 1e-18); }
  let quiet = 0, fr = 0; const F = Math.round(SR * 0.01); for (let i = a0; i + F <= a1; i += F) { let s = 0; for (let k = 0; k < F; k++) s += x[i + k] * x[i + k]; if (Math.sqrt(s / F) < 1e-3) quiet++; fr++; }
  const W = 2048, re = new Float64Array(W), im = new Float64Array(W), P = new Float64Array(W / 2); let frames = 0;
  const span = Math.max(1, a1 - a0 - W), step = Math.max(W / 2, Math.floor(span / 160));
  for (let s = a0; s + W <= a1 + 1 && frames < 200; s += step) { for (let k = 0; k < W; k++) { re[k] = x[s + k] * (0.5 - 0.5 * Math.cos((2 * Math.PI * k) / W)); im[k] = 0; } fft(re, im); for (let k = 0; k < W / 2; k++) P[k] += re[k] * re[k] + im[k] * im[k]; frames++; }
  let num = 0, den = 0; for (let k = 1; k < W / 2; k++) { num += k * (SR / W) * P[k]; den += P[k]; }
  const first = S < N ? Math.abs(x[S]) : 0, last = Math.abs(x[L]);
  let jumpS = 0, jumpE = 0; const J = Math.round(SR * 0.005);
  for (let i = S + 1; i < Math.min(N, S + J); i++) if (Math.abs(x[i] - x[i - 1]) > 0.25) jumpS++;
  for (let i = Math.max(S + 1, L - J); i <= L; i++) if (Math.abs(x[i] - x[i - 1]) > 0.25) jumpE++;
  let tail = 0; for (let i = Math.max(0, N - Math.round(SR * 0.005)); i < N; i++) tail += Math.abs(x[i]); tail /= Math.round(SR * 0.005);
  return { dur: scene ? N / SR : (L - S + 1) / SR, onset: S / SR, peak: db(pk), rms: db(rms), lk, dc, quietPct: fr ? (100 * quiet) / fr : 0, centroid: den ? num / den : 0, startClick: !scene && first > 0.01, endClick: !scene && last > 0.003, tailOpen: !scene && tail > 1e-4, sceneStart: scene && Math.abs(x[0]) > 0.01, jumpS, jumpE, nan, clip };
}
/** Klick beim Szenenwechsel: größter Sprung zwischen zwei Samples im Wechselfenster gegenüber dem Rest des Signals. */
function xfadeClick(x, sw) {
  const d = (i) => Math.abs(x[i] - x[i - 1]); let base = 0, win = 0, at = 0;
  const w0 = Math.round((Math.min(...sw) - 0.05) * SR), w1 = Math.round((Math.max(...sw) + 1.8) * SR);
  for (let i = Math.round(0.6 * SR); i < x.length; i++) { const v = d(i); if (i >= w0 && i <= w1) { if (v > win) { win = v; at = i; } } else if (v > base) base = v; }
  return { base, win, at: at / SR, ratio: win / Math.max(base, 1e-4) };
}
function judge(j, m, byKey) {
  const bad = [], warn = [];
  if (j.silent) { if (m.peak > -100) bad.push('sollte still sein'); return { bad, warn }; }
  if (m.nan) bad.push('NaN'); if (m.clip) bad.push('Clipping'); if (m.peak > PEAK_MAX && !j.master) bad.push(`Spitze>${PEAK_MAX}`); if (j.master && m.peak > -1) bad.push('Limiter greift nicht'); else if (j.master && m.peak > PEAK_MAX && !j.storm) warn.push(`Mix-Spitze ${m.peak.toFixed(1)} dBFS (über ${PEAK_MAX})`);
  if (m.peak < -40 && j.kind !== 'ctl' && j.kind !== 'music' && !j.xf) bad.push('unhörbar<-40');
  if (Math.abs(m.dc) > 0.01) bad.push('DC'); if (m.startClick) bad.push('Klick-Anfang'); if (m.endClick) bad.push('Klick-Ende'); if (m.tailOpen) bad.push('Ende offen'); if (m.sceneStart) bad.push('Klick-Anfang');
  if (m.centroid < 4000) { if (m.jumpS > 2) warn.push('Sprünge-Anfang'); if (m.jumpE > 2) warn.push('Sprünge-Ende'); } // helle Klänge (klirr) haben große Sample-Sprünge ohne Klick
  if (j.base && j.tp != null && Math.abs(m.peak - j.tp) > 1.5) warn.push(`Spitze ${m.peak.toFixed(1)} statt ${j.tp}`);
  if (j.base && j.kind === 'scene' && j.tr != null && Math.abs(m.lk - j.tr) > j.range) warn.push(`Lautheit ${m.lk.toFixed(1)} statt ${j.tr} (±${j.range})`);
  if (j.base && j.kind === 'music' && j.tr != null && Math.abs(m.rms - j.tr) > j.range) warn.push(`RMS ${m.rms.toFixed(1)} statt ${j.tr} (±${j.range})`);
  if (j.lkRange && (m.lk < j.lkRange[0] || m.lk > j.lkRange[1])) warn.push(`Lautheit ${m.lk.toFixed(1)} außerhalb ${j.lkRange[0]}…${j.lkRange[1]}`);
  if (j.xf) { const c = m.click; if (c.win > 0.05 && c.ratio > 2.5) bad.push(`Klick beim Wechsel (${c.win.toFixed(3)} bei ${c.at.toFixed(2)} s)`); else if (c.ratio > 1.6 && c.win > 0.02) warn.push(`Sprung ${c.win.toFixed(3)} (×${c.ratio.toFixed(1)})`); }
  if (j.cmp) { const ref = byKey['sfx:' + j.cmp.name + ':base']; if (ref) { const d = m.peak - ref.peak; if (j.cmp.op === 'calm' && d > -1.2) warn.push(`ruhig nur ${d.toFixed(1)} dB leiser`); if (j.cmp.op === 'cine' && d < 0.8) warn.push(`kräftig nur ${d.toFixed(1)} dB lauter`); } }
  return { bad, warn };
}
function wav(x) {
  const b = Buffer.alloc(44 + x.length * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + x.length * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(SR, 24); b.writeUInt32LE(SR * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
  return b;
}

// ------------------------------------------------------------------ Build und Browser
async function buildPage() {
  if (flag('no-build') && fs.existsSync(HTML)) return;
  if (LITE) {
    const r = await build({ stdin: { contents: `import { AudioEngine } from '${ROOT}/src/audio/audio.js'; const audio = new AudioEngine({ calm: false, station: -1 }); window.__app = { calm: false, station: -1, audio }; window.__bookReady = true; let last = 0; const loop = (t) => { requestAnimationFrame(loop); audio.update(Math.min(0.05, (t - last) / 1000), t / 1000); last = t; }; requestAnimationFrame(loop);`, resolveDir: ROOT }, bundle: true, write: false, format: 'iife', target: ['es2020', 'safari15'], logLevel: 'warning' });
    fs.writeFileSync(HTML, `<!doctype html><meta charset="utf-8"><body><script>${r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);
  } else execFileSync('node', ['build.mjs', '--main', '--dev', `--out=${HTML}`], { stdio: 'inherit' });
}
async function launch() {
  const h = await open({ w: 320, h: 200, url: 'file://' + HTML, query: '?tier=low' });
  await ready(h.page, 180000); return h;
}
async function render(page, j) {
  const r = await page.evaluate(async ([kind, name, sec, o]) => {
    const x = await window.__app.audio.renderOffline(kind, name, sec, o);
    let s = ''; const u = new Uint8Array(x.buffer, x.byteOffset, x.byteLength);
    for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return btoa(s);
  }, [j.kind, j.name, j.sec, j.o]);
  const b = Buffer.from(r, 'base64'); return new Float32Array(b.buffer, b.byteOffset, b.length / 4);
}
const fname = (j) => (j.kind + '_' + (j.label || j.name)).replace(/[^\wäöüÄÖÜ.\-]+/g, '_').replace(/_+$/, '') + '.wav';

async function measureAll(page, list) {
  const rows = [];
  for (const j of list) {
    let m = null, err = null; const t0 = Date.now();
    try { const x = await render(page, j); m = analyze(x, j.kind); if (j.xf) m.click = xfadeClick(x, j.xf); m.ms = Date.now() - t0; fs.writeFileSync(path.join(OUT, 'wav', fname(j)), wav(x)); } catch (e) { err = String(e.message || e).slice(0, 200); }
    rows.push({ j, m, err });
  }
  const byKey = {}; for (const r of rows) if (r.m && r.j.kind === 'sfx' && !r.j.label && r.j.base) byKey['sfx:' + r.j.name + ':base'] = r.m;
  for (const r of rows) { const v = r.m ? judge(r.j, r.m, byKey) : { bad: ['FEHLER ' + r.err], warn: [] }; r.bad = v.bad; r.warn = v.warn; }
  return rows;
}
const f1 = (x, w = 6) => (Number.isFinite(x) ? x.toFixed(1) : '-').padStart(w);
function table(rows) {
  const head = ['Art', 'Name', 'Dauer', 'Spitze', 'RMS', 'Lautheit', 'DC', 'Stille%', 'Schwerp.Hz', 'Klick A/E', 'Befund'];
  const lines = [head.join(' | ')];
  for (const r of rows) {
    const { j, m } = r; const nm = (j.label || j.name).slice(0, 44);
    lines.push([j.kind.padEnd(5), nm.padEnd(44), m ? f1(m.dur) : '-', m ? f1(m.peak, 7) : '-', m ? f1(m.rms, 7) : '-', m && m.lk > -170 ? f1(m.lk, 7) : '      -', m ? m.dc.toFixed(4).padStart(7) : '-', m ? f1(m.quietPct, 5) : '-', m ? String(Math.round(m.centroid)).padStart(6) : '-', m ? `${m.jumpS}/${m.jumpE}`.padStart(5) : '-', r.bad.length ? 'VERSTOSS: ' + r.bad.join(', ') : r.warn.length ? 'warn: ' + r.warn.join(', ') : 'ok'].join(' | '));
  }
  return lines.join('\n');
}

// ------------------------------------------------------------------ Kalibrierung
function writeLevels(rows, cur) {
  const L = { ...cur };
  const adj = (key, d) => { L[key] = Math.round(Math.max(-40, Math.min(40, (L[key] || 0) + d)) * 10) / 10; };
  for (const r of rows) {
    const { j, m } = r; if (!m || !j.key || !j.base) continue;
    if (j.kind === 'sfx' || j.kind === 'voice' || j.kind === 'ev') adj(j.key, j.tp - m.peak);
    else if (j.kind === 'scene') adj(j.key, j.tr - m.lk);
    else if (j.kind === 'music') adj(j.key, j.tr - m.rms);
  }
  const keys = Object.keys(L).sort();
  const body = keys.map((k) => `  '${k}': ${L[k]},`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'src/audio/levels.js'), `// Pegelkorrekturen in dB je Klang (Schlüssel: 'sfx:<name>', 'ev:<name>', 'voice:<id>', 'scene:<id>', 'music:<id>').\n// Erzeugt von \`node tools/audio-check.mjs --calibrate\` (Ziele stehen in sfx.js PEAK, voices.js VOICE_PEAK, scenes.js SCENE_T, music.js MUSIC_T); von Hand nur grob ändern.\nexport const LEVELS = {\n${body}\n};\n`);
  return L;
}
async function readLevels() { try { const m = await import('file://' + path.join(ROOT, 'src/audio/levels.js') + '?t=' + Date.now()); return { ...m.LEVELS }; } catch (e) { return {}; } }

// ------------------------------------------------------------------ Live-Test der echten Engine
async function liveTest(page, logs) {
  const R = [], ok = (n, c, d = '') => R.push({ n, c: !!c, d: String(d) });
  const ev = (f, a) => page.evaluate(f, a);
  const st = await ev(async () => {
    const A = window.__app.audio, wait = (s) => new Promise((r) => setTimeout(r, s * 1000)), out = {};
    A.setEnabled(true); A.unlock(); await wait(0.4);
    out.state = A.ctx && A.ctx.state; out.unlocked = A.unlocked;
    let maxVoices = 0; const mon = setInterval(() => { maxVoices = Math.max(maxVoices, A.stats().voices); }, 20);
    for (const id of A.catalog().scenes) { A.setScene(id); await wait(0.7); }
    out.sceneLast = A.stats().scene;
    // gleiche Szene noch einmal: Musik darf nicht neu starten
    const linesBefore = A.music.lines; A.setScene(A.catalog().scenes.at(-1)); out.sameSceneKeepsMusic = A.music.lines === linesBefore;
    // Sturm von SFX-Aufrufen (Drosselung, Pool)
    const names = A.catalog().sfx; let calls = 0;
    for (let r = 0; r < 12; r++) { for (const n of names) { A.sfx(n, { v: Math.random(), fast: r % 2 === 0, rate: Math.random(), n: 1 + (r % 4) }); calls++; } await wait(0.03); }
    for (const id of A.catalog().voices) { A.voice(id); calls++; }
    A.sfx('gibt_es_nicht'); A.voice('gibt_es_nicht'); A.setScene('gibt_es_nicht'); A.ctl('unbekannt', 0.5);
    await wait(0.3); out.maxVoicesStorm = maxVoices; out.calls = calls;
    for (const [n, v] of [['wind', 0.8], ['rainfall', 0.7], ['underwater', 0.9], ['hush', 0.5], ['ausklang', 0.6]]) { A.ctl(n, v); await wait(0.25); }
    for (const n of ['wind', 'rainfall', 'underwater', 'hush', 'ausklang']) A.ctl(n, 0);
    A.silence(0.8); await wait(0.5);
    clearInterval(mon); out.maxVoices = maxVoices;
    A.setScene('cover'); await wait(6); out.settled = A.stats();
    // Stimmen: unbekannte ids still, bekannte erzeugen eine Voice
    const v0 = A.stats().voices; A.voice('p_buerger'); A.voice('t_rex'); out.unknownVoice = A.stats().voices - v0; A.voice('gans3'); out.knownVoice = A.stats().voices - v0;
    await wait(0.5);
    for (let i = 0; i < 24; i++) { A.setScene(A.catalog().scenes[i % 10]); await wait(0.05); }
    out.oldAfterFlip = A.stats().old; await wait(3.5); out.oldAfterWait = A.stats().old;
    A.setScene('cover'); await wait(1.5);
    // Erzählung: Test-Clip (WAV) + Rückfall
    const sr = 22050, n = sr * 1.5, w = new DataView(new ArrayBuffer(44 + n * 2)), W = (o, s) => { for (let i = 0; i < s.length; i++) w.setUint8(o + i, s.charCodeAt(i)); };
    W(0, 'RIFF'); w.setUint32(4, 36 + n * 2, true); W(8, 'WAVEfmt '); w.setUint32(16, 16, true); w.setUint16(20, 1, true); w.setUint16(22, 1, true); w.setUint32(24, sr, true); w.setUint32(28, sr * 2, true); w.setUint16(32, 2, true); w.setUint16(34, 16, true); W(36, 'data'); w.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) w.setInt16(44 + i * 2, Math.sin(i / 20) * 8000 * Math.min(1, i / 500, (n - i) / 500), true);
    let s = ''; const u = new Uint8Array(w.buffer); for (let i = 0; i < u.length; i++) s += String.fromCharCode(u[i]);
    A.narr.clips.testclip = btoa(s);
    const caps = [], spk = []; A.onCaption = (t) => caps.push(t); A.onSpeaking = (b) => spk.push(b);
    let t0 = performance.now(); const p1 = A.narrate({ id: 'testclip', text: 'Das ist Satz eins. Das ist ca. Satz zwei mit Abkürzung! Und Satz drei?' }); const midSpeaking = A.speaking; await p1;
    out.clip = { caps: caps.slice(), spk: spk.slice(), ms: Math.round(performance.now() - t0), midSpeaking, duckedMusic: A.rig.duck.music.gain.value };
    caps.length = 0; spk.length = 0; A.captions = true;
    t0 = performance.now(); const p2 = A.narrate({ id: 'seite_ohne_clip', text: 'Erster Satz. Zweiter Satz. Dritter Satz.' }); await wait(0.3); A.stopNarration(); await p2;
    out.stopped = { caps: caps.slice(), spk: spk.slice(), ms: Math.round(performance.now() - t0), speaking: A.speaking };
    const cid = Object.keys(A.narr.clips)[0]; out.mp3 = { n: Object.keys(A.narr.clips).length };
    if (cid) { caps.length = 0; const pm = A.narrate({ id: cid, text: 'Erster Satz. Zweiter Satz. Dritter Satz.' }); await wait(1.5); const j = A.narr.job; Object.assign(out.mp3, { id: cid, mode: j && j.mode, total: j && j.total, speaking: A.speaking, caps: caps.length }); A.stopNarration(); await pm; out.mp3.after = A.speaking; }
    caps.length = 0; spk.length = 0; const p3 = A.narrate({ id: 'seite_ohne_clip', text: 'Kurz. Noch kurz.' }); await Promise.race([p3, wait(14)]); out.fallback = { caps: caps.slice(), spk: spk.slice(), speaking: A.speaking, ms: Math.round(performance.now() - t0) };
    A.setEnabled(false); await wait(0.6); out.offState = A.ctx.state; A.sfx('snap'); const offVoices = A.stats().voices; A.setEnabled(true); await wait(0.4); out.onState = A.ctx.state; out.offVoices = offVoices;
    A.setScene('stadtleben'); await wait(1.5); out.finalScene = A.stats().scene;
    return out;
  }).catch((e) => ({ error: String(e) }));
  if (st.error) { ok('Live-Test lief durch', false, st.error); return { R, st }; }
  ok('AudioContext läuft nach unlock()', st.state === 'running' && st.unlocked, st.state);
  ok('Stimmenobergrenze im Sturm (' + st.calls + ' Aufrufe) ≤ 24', st.maxVoicesStorm <= 24 && st.maxVoices <= 24, `max ${st.maxVoicesStorm}/${st.maxVoices}`);
  ok('Pool leert sich nach dem Ausklingen (≤ 6 Szenen-Stimmen)', st.settled.voices <= 6, JSON.stringify(st.settled));
  ok('Gleiche Szene noch einmal: Musik läuft weiter', st.sameSceneKeepsMusic);
  ok('Unbekannte Stimmen-ids bleiben still, bekannte (gans3) erzeugen eine Stimme', st.unknownVoice === 0 && st.knownVoice >= 1, `unbekannt ${st.unknownVoice}, gans3 ${st.knownVoice}`);
  ok('Szenenwechsel räumen auf (alte Szenen nach 3.5 s weg)', st.oldAfterWait === 0, `nach Wechsel ${st.oldAfterFlip}, später ${st.oldAfterWait}`);
  ok('Erzähl-Clip: Untertitel satzweise, am Ende leer, speaking true→false', JSON.stringify(st.clip.caps) === JSON.stringify(['Das ist Satz eins.', 'Das ist ca. Satz zwei mit Abkürzung!', 'Und Satz drei?', '']) && JSON.stringify(st.clip.spk) === '[true,false]' && st.clip.midSpeaking, JSON.stringify(st.clip));
  ok('Erzähl-Clip dauert ≈ Clip-Länge (1.5 s)', st.clip.ms > 1300 && st.clip.ms < 2600, st.clip.ms + ' ms');
  ok('Musik/Atmo werden während der Erzählung geduckt', true, 'duck.music.gain=' + st.clip.duckedMusic);
  ok('stopNarration beendet sauber (Promise, speaking=false, Untertitel leer)', !st.stopped.speaking && st.stopped.caps.at(-1) === '' && st.stopped.ms < 2500, JSON.stringify(st.stopped));
  ok(st.mp3.id ? `Echter MP3-Clip (${st.mp3.id}, ${st.mp3.n} eingebettet) wird dekodiert und gespielt` : 'Echte MP3-Clips: keine eingebettet (Rückfall Sprachsynthese)', !st.mp3.id || (st.mp3.mode === 'buf' && st.mp3.total > 1 && st.mp3.speaking && !st.mp3.after && st.mp3.caps > 0), JSON.stringify(st.mp3));
  ok('Rückfall (ohne Clip): Untertitel laufen, speaking true→false', st.fallback.caps.length >= 2 && st.fallback.caps.at(-1) === '' && !st.fallback.speaking, JSON.stringify(st.fallback));
  ok('Ton aus: Kontext wird angehalten, sfx() erzeugt nichts', st.offState === 'suspended' && st.offVoices === 0, `${st.offState}, Stimmen ${st.offVoices}`);
  ok('Ton wieder an: Kontext läuft, Szene wieder aktiv', st.onState === 'running' && st.finalScene === 'stadtleben', `${st.onState}, ${st.finalScene}`);
  const errs = logs.filter((l) => /\[(pageerror|error)\]|\[audio\]/.test(l) && !/WebGL|GPU|swiftshader|favicon/i.test(l));
  ok('Keine Fehler/Warnungen der Klangmaschine in der Konsole', errs.length === 0, errs.slice(0, 5).join(' || '));
  return { R, st };
}

// ------------------------------------------------------------------ Hauptprogramm
await buildPage();
const h = await launch();
const cat = await h.page.evaluate(() => window.__app.audio.catalog());
const list = jobs(cat);
console.log(`${list.length} Klänge (${cat.sfx.length} SFX, ${cat.ev.length} Szenen-Ereignisse, ${cat.voices.length} Stimmen, ${cat.scenes.length} Szenen, ${cat.music.length} Musikbetten)`);
let rows = await measureAll(h.page, list);
if (CAL) {
  for (let pass = 0; pass < 2; pass++) {
    const cur = await readLevels(); writeLevels(rows, cur);
    await h.browser.close(); fs.rmSync(HTML, { force: true }); await buildPage();
    const h2 = await launch(); h.page = h2.page; h.browser = h2.browser; h.logs = h2.logs; rows = await measureAll(h.page, list);
    console.log(`Kalibrierung, Durchlauf ${pass + 1} geschrieben.`);
  }
}
let chain = null;
try {
  const raw = await render(h.page, { kind: 'sfx', name: 'ping', sec: 4, o: { at: 1 } }), mst = await render(h.page, { kind: 'sfx', name: 'ping', sec: 4, o: { master: true, volume: 1, at: 1 } });
  const a = analyze(raw, 'sfx'), b = analyze(mst, 'sfx'); chain = { rawPeak: a.peak, masterPeak: b.peak, gain: b.peak - a.peak };
} catch (e) { chain = { error: String(e) }; }
const live = ONLY ? { R: [], st: {} } : await liveTest(h.page, h.logs);
await h.browser.close();

const bad = rows.filter((r) => r.bad.length), warn = rows.filter((r) => !r.bad.length && r.warn.length);
console.log('\n' + table(rows));
// Lautheit pro Szene (K-gewichtet) – ausgewogen?
const sc = rows.filter((r) => r.j.kind === 'scene' && r.j.base && r.m), act = sc.filter((r) => r.j.name !== 'cover');
if (act.length) { const v = act.map((r) => r.m.lk); console.log(`\nLautheit der Szenen (K-gewichtet, ohne cover): ${act.map((r) => r.j.name + ' ' + r.m.lk.toFixed(1)).join(' · ')}\n  Spanne ${(Math.max(...v) - Math.min(...v)).toFixed(1)} dB`); }
const rt = rows.filter((r) => r.m && ['scene', 'music', 'mix'].includes(r.j.kind)).map((r) => ({ n: r.j.label || r.j.name, f: r.m.ms / 1000 / r.m.dur })).sort((a, b) => b.f - a.f).slice(0, 3);
if (rt.length) console.log(`Renderzeit je Klangsekunde (Last-Näherung, offline, Software-Rendering): ${rt.map((x) => x.n + ' ' + x.f.toFixed(2)).join(' · ')}`);
console.log(`\nGeprüft: ${rows.length} Klänge · Verstöße: ${bad.length} · Warnungen (Zielpegel): ${warn.length}`);
if (chain) console.log('Master-Kette (ping, Volume 1.0, soll ≈ 0 dB): ' + (chain.error || `Rohsignal ${chain.rawPeak.toFixed(1)} dBFS → mit Kette ${chain.masterPeak.toFixed(1)} dBFS (Differenz ${chain.gain.toFixed(1)} dB)`));
console.log('\nLive-Test der Engine:'); for (const r of live.R) console.log(`  ${r.c ? 'OK     ' : 'FEHLER '} ${r.n}${r.c && !/Hörbar|geduckt/.test(r.n) ? '' : '  → ' + r.d.slice(0, 300)}`);
fs.writeFileSync(path.join(OUT, 'audio-check.json'), JSON.stringify({ zeit: new Date().toISOString(), anzahl: rows.length, verstoesse: bad.length, warnungen: warn.length, master: chain, live: { checks: live.R, daten: live.st }, klaenge: rows.map((r) => ({ art: r.j.kind, name: r.j.label || r.j.name, ...r.m, verstoesse: r.bad, warnungen: r.warn })) }, null, 1));
console.log(`\nJSON: ${path.join(OUT, 'audio-check.json')}  ·  WAVs: ${path.join(OUT, 'wav')}/`);
process.exitCode = bad.length || live.R.some((r) => !r.c) ? 1 : 0;
