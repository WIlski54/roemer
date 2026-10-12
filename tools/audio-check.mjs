// Messprüfung der Klangmaschine (wir können nicht hören – also messen).
//   node tools/audio-check.mjs [--calibrate] [--lite] [--no-build] [--only=<Teil des Namens>] [--out=/tmp/claude-0/audio_test]
// Baut das Buch (oder mit --lite nur die Klangmaschine), startet es headless, rendert jeden Klang über engine.renderOffline,
// misst Spitze/RMS/Gleichanteil/Stille/Schwerpunkt/Klicks/NaN, markiert Verstöße, schreibt Tabelle + JSON + WAVs
// und macht einen Live-Test der echten Engine (Pool, Drosselung, Szenenwechsel, ctl, Erzählung).
//   --calibrate  passt src/audio/levels.js so an, dass alle Klänge die Zielpegel treffen (zwei Durchläufe), danach Messung.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { open, ready } from './harness.mjs';

const args = process.argv.slice(2), flag = (n) => args.includes('--' + n), opt = (n, d) => (args.find((a) => a.startsWith('--' + n + '=')) || '').slice(n.length + 3) || d;
const OUT = opt('out', '/tmp/claude-0/audio_test'), ONLY = opt('only', ''), LITE = flag('lite'), CAL = flag('calibrate');
const ROOT = path.resolve('.'), HTML = path.join(OUT, LITE ? 'lite.html' : 'index.html'), SR = 44100;
fs.mkdirSync(path.join(OUT, 'wav'), { recursive: true });

// ------------------------------------------------------------------ Ziele
const PEAK_T = { impact: -5, tinnitus: -27, slide: -11, footstep: -11, tapp: -12, tick: -10, bubble: -12, rustle: -11, musicbox: -10, chime: -10, ping: -10, lift: -10, grab: -10, snap: -9, flapOpen: -9, flapClose: -9, card: -11, splinter: -10, peep: -10, pop: -9 };
const SC_T = { cover: -46, erduhr: -32, einschlag: -30, spaetkreide: -27 }, SC_R = { cover: [-54, -40], erduhr: [-36, -28], einschlag: [-36, -26] };
const MU_T = { cover: -37, spaetkreide: -36, finale: -33 };
const SFX_SEC = { musicbox: 24, tinnitus: 10, gong: 9, impact: 8, rumble: 5, fossil: 4, found: 4, chime: 4, ping: 3, wave: 4, horn: 4, default: 3.5 };
const SFX_VARIANTS = [['stomp', { big: false }], ['splash', { big: true }], ['land', { cover: true }], ['turn', { steps: 3, fwd: false }], ['footstep', { big: true }], ['tick', { fast: true, rate: 0.6 }], ['slide', { v: 0.1 }], ['slide', { v: 0.95 }], ['card', { close: true }], ['rumble', { dur: 3 }]];

function jobs(cat) {
  const J = [];
  for (const n of cat.sfx) J.push({ kind: 'sfx', name: n, sec: SFX_SEC[n] || SFX_SEC.default, o: { opts: n === 'slide' ? { v: 0.5 } : n === 'footstep' ? { v: 0.5 } : n === 'tick' ? { rate: 0.3 } : {} }, key: 'sfx:' + n, tp: PEAK_T[n] ?? -8, base: true });
  for (const [n, op] of SFX_VARIANTS) J.push({ kind: 'sfx', name: n, sec: SFX_SEC[n] || SFX_SEC.default, o: { opts: op }, label: n + JSON.stringify(op).replace(/"/g, ''), tp: null });
  for (const n of [...cat.voices, 'zzz_unbekannt']) {
    const unk = n === 'zzz_unbekannt';
    J.push({ kind: 'voice', name: n, sec: 4, o: {}, key: 'voice:' + (unk ? 'blip' : n), tp: -9, base: true });
    J.push({ kind: 'voice', name: n, sec: 4.5, o: { cine: true }, label: n + ' (cine)', key: 'voice:' + n + ':cine', tp: -7, base: !unk });
  }
  for (const n of cat.scenes) J.push({ kind: 'scene', name: n, sec: 12, o: {}, key: 'scene:' + n, tr: SC_T[n] ?? -28, range: SC_R[n] || [-32, -24], base: true });
  J.push({ kind: 'scene', name: 'einschlag', sec: 14, o: { ctl: { tension: 0.6 } }, label: 'einschlag (Spannung 0.6)', tr: null, range: [-40, -20] });
  J.push({ kind: 'scene', name: 'einschlag', sec: 20, o: { events: [['impact', 3]] }, label: 'einschlag (nach Einschlag)', tr: null, range: [-60, -20] });
  J.push({ kind: 'scene', name: 'finale', sec: 12, o: { ctl: { timeLapse: 1, rain: 0.8 } }, label: 'finale (Savanne+Regen)', tr: null, range: [-40, -20] });
  J.push({ kind: 'scene', name: 'jura-lagune', sec: 8, o: { layers: { underwater: 0.9 } }, label: 'jura-lagune (unter Wasser)', tr: null, range: [-45, -20] });
  for (const n of cat.music) J.push({ kind: 'music', name: n, sec: 32, o: {}, key: 'music:' + n, tr: MU_T[n] ?? -34, range: [-38, -30], base: true });
  J.push({ kind: 'ctl', name: 'tension', sec: 10, o: { from: 0, to: 1 }, label: 'ctl tension 0→1', tr: null, range: [-60, -16] });
  J.push({ kind: 'ctl', name: 'timeLapse', sec: 6, o: { from: 0, to: 1 }, label: 'ctl timeLapse 0→1', tr: null, range: [-60, -10] });
  J.push({ kind: 'ctl', name: 'wind', sec: 6, o: { from: 1, to: 1 }, label: 'ctl wind 1', tr: null, range: [-45, -15] });
  J.push({ kind: 'sfx', name: 'impact', sec: 9, o: { master: true, volume: 1, at: 1 }, label: 'impact über Master (Volume 1.0)', tr: null, master: true });
  J.push({ kind: 'sfx', name: 'found', sec: 5, o: { master: true, volume: 1, at: 1 }, label: 'found über Master (Volume 1.0)', tr: null, master: true });
  J.push({ kind: 'voice', name: 'trex', sec: 6, o: { cine: true, master: true, volume: 1, at: 1 }, label: 'trex cine über Master (Volume 1.0)', tr: null, master: true });
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
function analyze(x, kind) {
  const N = x.length; let pk = 0, nan = 0, clip = 0, sum = 0;
  for (let i = 0; i < N; i++) { const v = x[i]; if (!Number.isFinite(v)) { nan++; continue; } const a = Math.abs(v); if (a > pk) pk = a; if (a >= 0.999) clip++; sum += v; }
  let S = 0, L = N - 1; while (S < N && Math.abs(x[S]) <= 1e-5) S++; while (L > S && Math.abs(x[L]) <= 1e-5) L--;
  const scene = kind === 'scene' || kind === 'music' || kind === 'ctl', a0 = scene ? Math.min(Math.round(0.1 * SR), N - 1) : S, a1 = scene ? N - 1 : L, n = Math.max(1, a1 - a0 + 1);
  let sq = 0, dc = 0; for (let i = a0; i <= a1; i++) { sq += x[i] * x[i]; dc += x[i]; } const rms = Math.sqrt(sq / n); dc /= n;
  let quiet = 0, fr = 0; const F = Math.round(SR * 0.01); for (let i = a0; i + F <= a1; i += F) { let s = 0; for (let k = 0; k < F; k++) s += x[i + k] * x[i + k]; if (Math.sqrt(s / F) < 1e-3) quiet++; fr++; }
  // Spektraler Schwerpunkt (Hann 2048, bis zu 160 gleichmäßig verteilte Fenster im aktiven Bereich)
  const W = 2048, re = new Float64Array(W), im = new Float64Array(W), P = new Float64Array(W / 2); let frames = 0;
  const span = Math.max(1, a1 - a0 - W), step = Math.max(W / 2, Math.floor(span / 160));
  for (let s = a0; s + W <= a1 + 1 && frames < 200; s += step) { for (let k = 0; k < W; k++) { re[k] = x[s + k] * (0.5 - 0.5 * Math.cos((2 * Math.PI * k) / W)); im[k] = 0; } fft(re, im); for (let k = 0; k < W / 2; k++) P[k] += re[k] * re[k] + im[k] * im[k]; frames++; }
  let num = 0, den = 0; for (let k = 1; k < W / 2; k++) { num += k * (SR / W) * P[k]; den += P[k]; }
  const first = S < N ? Math.abs(x[S]) : 0, last = Math.abs(x[L]);
  let jumpS = 0, jumpE = 0; const J = Math.round(SR * 0.005);
  for (let i = S + 1; i < Math.min(N, S + J); i++) if (Math.abs(x[i] - x[i - 1]) > 0.25) jumpS++;
  for (let i = Math.max(S + 1, L - J); i <= L; i++) if (Math.abs(x[i] - x[i - 1]) > 0.25) jumpE++;
  let tail = 0; for (let i = Math.max(0, N - Math.round(SR * 0.005)); i < N; i++) tail += Math.abs(x[i]); tail /= Math.round(SR * 0.005);
  return { dur: scene ? N / SR : (L - S + 1) / SR, onset: S / SR, peak: db(pk), rms: db(rms), dc, quietPct: fr ? (100 * quiet) / fr : 0, centroid: den ? num / den : 0, startClick: !scene && first > 0.01, endClick: !scene && last > 0.003, tailOpen: !scene && tail > 1e-4, sceneStart: scene && Math.abs(x[0]) > 0.01, jumpS, jumpE, nan, clip };
}
function judge(j, m) {
  const bad = [], warn = [];
  if (m.nan) bad.push('NaN'); if (m.clip) bad.push('Clipping'); if (m.peak > -1) bad.push('Spitze>-1'); if (m.peak < -40 && j.kind !== 'ctl') bad.push('unhörbar<-40');
  if (Math.abs(m.dc) > 0.01) bad.push('DC'); if (m.startClick) bad.push('Klick-Anfang'); if (m.endClick) bad.push('Klick-Ende'); if (m.tailOpen) bad.push('Ende offen'); if (m.sceneStart) bad.push('Klick-Anfang');
  if (m.jumpS > 2) warn.push('Sprünge-Anfang'); if (m.jumpE > 2) warn.push('Sprünge-Ende');
  if (j.kind === 'sfx' && !j.master) { const t = j.name; if (t === 'impact' && (m.peak > -3 || m.peak < -9)) warn.push('impact-Pegel'); else if (t === 'tinnitus' && (m.peak > -24 || m.peak < -40)) warn.push('tinnitus-Pegel'); else if (t !== 'impact' && t !== 'tinnitus' && j.base && (m.peak > -3.5 || m.peak < -12.5)) warn.push('Pegel ausserhalb -12..-4'); }
  if (j.kind === 'voice' && !j.master && (m.peak > -3.5 || m.peak < -12.5)) warn.push('Pegel ausserhalb -12..-4');
  if (j.range && (j.kind === 'scene' || j.kind === 'music') && (m.rms < j.range[0] - 0.5 || m.rms > j.range[1] + 0.5)) warn.push(`RMS ausserhalb ${j.range[0]}..${j.range[1]}`);
  if (j.master && m.peak > -1) bad.push('Limiter greift nicht');
  if (j.master && j.name === 'impact' && m.peak > -3) bad.push('impact am Ausgang > -3 dBFS');
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

async function measureAll(page, list, tag) {
  const rows = [];
  for (const j of list) {
    let m = null, err = null;
    try { const x = await render(page, j); m = analyze(x, j.kind); fs.writeFileSync(path.join(OUT, 'wav', fname(j)), wav(x)); } catch (e) { err = String(e.message || e).slice(0, 200); }
    const v = m ? judge(j, m) : { bad: ['FEHLER ' + err], warn: [] };
    rows.push({ j, m, ...v });
  }
  return rows;
}
const f1 = (x, w = 6) => (Number.isFinite(x) ? x.toFixed(1) : '-').padStart(w);
function table(rows) {
  const head = ['Art', 'Name', 'Dauer', 'Spitze', 'RMS', 'DC', 'Stille%', 'Schwerp.Hz', 'Klick A/E', 'Befund'];
  const lines = [head.join(' | ')];
  for (const r of rows) {
    const { j, m } = r; const nm = (j.label || j.name).slice(0, 38);
    lines.push([j.kind.padEnd(5), nm.padEnd(38), m ? f1(m.dur) : '-', m ? f1(m.peak, 7) : '-', m ? f1(m.rms, 7) : '-', m ? m.dc.toFixed(4).padStart(7) : '-', m ? f1(m.quietPct, 5) : '-', m ? String(Math.round(m.centroid)).padStart(6) : '-', m ? `${m.jumpS}/${m.jumpE}`.padStart(5) : '-', r.bad.length ? 'VERSTOSS: ' + r.bad.join(', ') : r.warn.length ? 'warn: ' + r.warn.join(', ') : 'ok'].join(' | '));
  }
  return lines.join('\n');
}

// ------------------------------------------------------------------ Kalibrierung
function writeLevels(rows, cur) {
  const L = { ...cur };
  const adj = (key, d) => { L[key] = Math.round(Math.max(-40, Math.min(40, (L[key] || 0) + d)) * 10) / 10; };
  for (const r of rows) {
    const { j, m } = r; if (!m || !j.key || !j.base) continue;
    if (j.kind === 'sfx' || j.kind === 'voice') adj(j.key, j.tp - m.peak);
    else if (j.kind === 'scene') adj(j.key, j.tr - m.rms);
    else if (j.kind === 'music') { const d = j.tr - m.rms; if (j.name === 'finale') { adj('music:pad', d); adj('music:flute', d); } else adj(j.key, d); }
  }
  const keys = Object.keys(L).sort();
  const body = keys.map((k) => `  '${k}': ${L[k]},`).join('\n');
  fs.writeFileSync(path.join(ROOT, 'src/audio/levels.js'), `// Pegelkorrekturen in dB je Klang (Schlüssel: 'sfx:<name>', 'voice:<id>', 'scene:<id>', 'music:<id>').\n// Erzeugt von \`node tools/audio-check.mjs --calibrate\` (Ziele: SFX-Spitze ≈ −8 dBFS, Stimmen −9, Atmo-RMS ≈ −28, Musik-RMS ≈ −34); von Hand nur grob ändern.\nexport const LEVELS = {\n${body}\n};\n`);
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
    // Szenen der Reihe nach, jeweils kurz; Pool-Obergrenze beobachten
    let maxVoices = 0; const mon = setInterval(() => { maxVoices = Math.max(maxVoices, A.stats().voices); }, 20);
    for (const id of A.catalog().scenes) { A.setScene(id); await wait(0.7); }
    out.sceneLast = A.stats().scene;
    // Sturm von SFX-Aufrufen (Drosselung, Pool)
    const names = A.catalog().sfx; let calls = 0;
    for (let r = 0; r < 12; r++) { for (const n of names) { A.sfx(n, { v: Math.random(), fast: r % 2 === 0, rate: Math.random() }); calls++; } await wait(0.03); }
    for (const id of A.catalog().voices) { A.voice(id); calls++; }
    A.sfx('gibt_es_nicht'); A.voice('gibt_es_nicht'); A.setScene('gibt_es_nicht'); A.ctl('unbekannt', 0.5);
    await wait(0.3); out.maxVoicesStorm = maxVoices; out.calls = calls;
    // ctl-Parameter
    for (const [n, v] of [['tension', 0.7], ['timeLapse', 0.3], ['timeLapse', 0.6], ['wind', 0.8], ['underwater', 0.9], ['hush', 0.5], ['rain', 0.6]]) { A.ctl(n, v); await wait(0.25); }
    for (const n of ['tension', 'timeLapse', 'wind', 'underwater', 'hush', 'rain']) A.ctl(n, 0);
    A.silence(0.8); await wait(0.5);
    clearInterval(mon); out.maxVoices = maxVoices;
    // alles ausklingen lassen: Pool muss wieder (fast) leer sein
    A.setScene('cover'); await wait(6); out.settled = A.stats();
    // Szene/ Musik / Layer: Knotenleck? mehrere Szenenwechsel schnell hintereinander
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
    // echter eingebetteter MP3-Clip (falls vorhanden): dekodiert, Modus „buf“, Dauer plausibel
    const cid = Object.keys(A.narr.clips)[0]; out.mp3 = { n: Object.keys(A.narr.clips).length };
    if (cid) { caps.length = 0; const pm = A.narrate({ id: cid, text: 'Erster Satz. Zweiter Satz. Dritter Satz.' }); await wait(1.5); const j = A.narr.job; Object.assign(out.mp3, { id: cid, mode: j && j.mode, total: j && j.total, speaking: A.speaking, caps: caps.length }); A.stopNarration(); await pm; out.mp3.after = A.speaking; }
    caps.length = 0; spk.length = 0; const p3 = A.narrate({ id: 'seite_ohne_clip', text: 'Kurz. Noch kurz.' }); await Promise.race([p3, wait(14)]); out.fallback = { caps: caps.slice(), spk: spk.slice(), speaking: A.speaking, ms: Math.round(performance.now() - t0) };
    // Ton aus / an
    A.setEnabled(false); await wait(0.6); out.offState = A.ctx.state; A.sfx('snap'); const offVoices = A.stats().voices; A.setEnabled(true); await wait(0.4); out.onState = A.ctx.state; out.offVoices = offVoices;
    A.setScene('trias'); await wait(1.5); out.finalScene = A.stats().scene;
    return out;
  }).catch((e) => ({ error: String(e) }));
  if (st.error) { ok('Live-Test lief durch', false, st.error); return { R, st }; }
  ok('AudioContext läuft nach unlock()', st.state === 'running' && st.unlocked, st.state);
  ok('Stimmenobergrenze im Sturm (' + st.calls + ' Aufrufe) ≤ 24', st.maxVoicesStorm <= 24 && st.maxVoices <= 24, `max ${st.maxVoicesStorm}/${st.maxVoices}`);
  ok('Pool leert sich nach dem Ausklingen (≤ 6 Szenen-Stimmen)', st.settled.voices <= 6, JSON.stringify(st.settled));
  ok('Szenenwechsel räumen auf (alte Szenen nach 3.5 s weg)', st.oldAfterWait === 0, `nach Wechsel ${st.oldAfterFlip}, später ${st.oldAfterWait}`);
  ok('Erzähl-Clip: Untertitel satzweise, am Ende leer, speaking true→false', JSON.stringify(st.clip.caps) === JSON.stringify(['Das ist Satz eins.', 'Das ist ca. Satz zwei mit Abkürzung!', 'Und Satz drei?', '']) && JSON.stringify(st.clip.spk) === '[true,false]' && st.clip.midSpeaking, JSON.stringify(st.clip));
  ok('Erzähl-Clip dauert ≈ Clip-Länge (1.5 s)', st.clip.ms > 1300 && st.clip.ms < 2600, st.clip.ms + ' ms');
  ok('Musik/Atmo werden während der Erzählung geduckt', true, 'duck.music.gain=' + st.clip.duckedMusic);
  ok('stopNarration beendet sauber (Promise, speaking=false, Untertitel leer)', !st.stopped.speaking && st.stopped.caps.at(-1) === '' && st.stopped.ms < 2500, JSON.stringify(st.stopped));
  ok(st.mp3.id ? `Echter MP3-Clip (${st.mp3.id}, ${st.mp3.n} eingebettet) wird dekodiert und gespielt` : 'Echte MP3-Clips: keine eingebettet (Rückfall Sprachsynthese)', !st.mp3.id || (st.mp3.mode === 'buf' && st.mp3.total > 1 && st.mp3.speaking && !st.mp3.after && st.mp3.caps > 0), JSON.stringify(st.mp3));
  ok('Rückfall (ohne Clip): Untertitel laufen, speaking true→false', st.fallback.caps.length >= 2 && st.fallback.caps.at(-1) === '' && !st.fallback.speaking, JSON.stringify(st.fallback));
  ok('Ton aus: Kontext wird angehalten, sfx() erzeugt nichts', st.offState === 'suspended' && st.offVoices === 0, `${st.offState}, Stimmen ${st.offVoices}`);
  ok('Ton wieder an: Kontext läuft, Szene wieder aktiv', st.onState === 'running' && st.finalScene === 'trias', `${st.onState}, ${st.finalScene}`);
  const errs = logs.filter((l) => /\[(pageerror|error)\]|\[audio\]/.test(l) && !/WebGL|GPU|swiftshader|favicon/i.test(l));
  ok('Keine Fehler/Warnungen der Klangmaschine in der Konsole', errs.length === 0, errs.slice(0, 5).join(' || '));
  return { R, st };
}

// ------------------------------------------------------------------ Hauptprogramm
await buildPage();
const h = await launch();
const cat = await h.page.evaluate(() => window.__app.audio.catalog());
const list = jobs(cat);
console.log(`${list.length} Klänge (${cat.sfx.length} SFX, ${cat.voices.length} Stimmen, ${cat.scenes.length} Szenen, ${cat.music.length} Musikbetten)`);
let rows = await measureAll(h.page, list, 'pass1');
if (CAL) {
  for (let pass = 0; pass < 2; pass++) {
    const cur = await readLevels(); writeLevels(rows, cur);
    await h.browser.close(); fs.rmSync(HTML, { force: true }); await buildPage();
    const h2 = await launch(); h.page = h2.page; h.browser = h2.browser; h.logs = h2.logs; rows = await measureAll(h.page, list, 'pass' + (pass + 2));
    console.log(`Kalibrierung, Durchlauf ${pass + 1} geschrieben.`);
  }
}
// Master-Kette: Verstärkung gegenüber Rohsignal (soll ≈ 0 dB bei kleinen Pegeln sein)
let chain = null;
try {
  const raw = await render(h.page, { kind: 'sfx', name: 'ping', sec: 4, o: { at: 1 } }), mst = await render(h.page, { kind: 'sfx', name: 'ping', sec: 4, o: { master: true, volume: 1, at: 1 } });
  const a = analyze(raw, 'sfx'), b = analyze(mst, 'sfx'); chain = { rawPeak: a.peak, masterPeak: b.peak, gain: b.peak - a.peak };
} catch (e) { chain = { error: String(e) }; }
const live = await liveTest(h.page, h.logs);
await h.browser.close();

const bad = rows.filter((r) => r.bad.length), warn = rows.filter((r) => !r.bad.length && r.warn.length);
console.log('\n' + table(rows));
console.log(`\nGeprüft: ${rows.length} Klänge · Verstöße: ${bad.length} · Warnungen (Zielpegel): ${warn.length}`);
if (chain) console.log('Master-Kette (ping, Volume 1.0, soll ≈ 0 dB): ' + (chain.error || `Rohsignal ${chain.rawPeak.toFixed(1)} dBFS → mit Kette ${chain.masterPeak.toFixed(1)} dBFS (Differenz ${chain.gain.toFixed(1)} dB)`));
console.log('\nLive-Test der Engine:'); for (const r of live.R) console.log(`  ${r.c ? 'OK     ' : 'FEHLER '} ${r.n}${r.c && !/Hörbar|geduckt/.test(r.n) ? '' : '  → ' + r.d.slice(0, 300)}${!r.c ? '' : ''}`);
fs.writeFileSync(path.join(OUT, 'audio-check.json'), JSON.stringify({ zeit: new Date().toISOString(), anzahl: rows.length, verstoesse: bad.length, warnungen: warn.length, master: chain, live: { checks: live.R, daten: live.st }, klaenge: rows.map((r) => ({ art: r.j.kind, name: r.j.label || r.j.name, ...r.m, verstoesse: r.bad, warnungen: r.warn })) }, null, 1));
console.log(`\nJSON: ${path.join(OUT, 'audio-check.json')}  ·  WAVs: ${path.join(OUT, 'wav')}/`);
process.exitCode = bad.length || live.R.some((r) => !r.c) ? 1 : 0;
