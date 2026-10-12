// Ereignis-gegen-Bett-Messung (Verdeckung): je Szene das Bett (ohne Ereignisse) und jeder Strom / die Musik einzeln.
// Für jedes Drittel-Oktav-Band (125 Hz … 8 kHz) wird der Pegel des Ereignisses in 93-ms-Fenstern mit dem mittleren Bettpegel im selben Band verglichen:
//   Überschuss = Ereignis − Bett (dB). ≥ +6 dB: deutlich hörbar, 0…+6: knapp, < 0: verdeckt.  Nur Bänder mit Ereignispegel > −66 dBFS zählen.
//   node tools/ameter.mjs [--out=DIR] [--sec=40] [szene …]
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { open, ready } from './harness.mjs';

const args = process.argv.slice(2);
const OUT = (args.find((a) => a.startsWith('--out=')) || '--out=/tmp/claude-0/audio_rom/m').slice(6);
const SEC = +((args.find((a) => a.startsWith('--sec=')) || '--sec=40').slice(6));
const only = args.filter((a) => !a.startsWith('--'));
fs.mkdirSync(OUT, { recursive: true });
const ROOT = path.resolve('.'), HTML = path.join(OUT, 'lite.html');
const src = fs.readFileSync(path.join(ROOT, 'src/audio/scenes.js'), 'utf8').split('export const BUILD = {')[1].split('export const SCENE_IDS')[0];
const scenes = {}; let cur = '';
for (const line of src.split('\n')) {
  const m = line.match(/^  ('?)([\w-]+)\1\(S\) \{/); if (m) { cur = m[2]; scenes[cur] = []; continue; }
  const s = line.match(/S\.stream\('([\w-]+)'/); if (s && cur) scenes[cur].push(s[1]);
}
const r = await build({ stdin: { contents: `import { AudioEngine } from '${ROOT}/src/audio/audio.js'; const audio = new AudioEngine({ calm: false, station: -1 }); window.__app = { calm: false, station: -1, audio }; window.__bookReady = true;`, resolveDir: ROOT }, bundle: true, write: false, format: 'iife', target: ['es2020', 'safari15'], logLevel: 'warning' });
fs.writeFileSync(HTML, `<!doctype html><meta charset="utf-8"><body><script>${r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);
const h = await open({ w: 600, h: 300, url: 'file://' + HTML });
await ready(h.page, 60000);

// rendert und liefert Bandleistungen je Fenster (Float32 [Fenster × Bänder] als Array) + Spitze/Effektivwert
const run = (kind, scene, o, sec) => h.page.evaluate(async ([kind, scene, o, sec]) => {
  const x = await window.__app.audio.renderOffline(kind, scene, sec, o), SR = 44100, N = 4096, HOP = 2048;
  const centers = [125, 160, 200, 250, 315, 400, 500, 630, 800, 1000, 1250, 1600, 2000, 2500, 3150, 4000, 5000, 6300, 8000];
  const bins = centers.map((c) => [Math.max(1, Math.round(c * 2 ** (-1 / 6) * N / SR)), Math.max(2, Math.round(c * 2 ** (1 / 6) * N / SR))]);
  const re = new Float64Array(N), im = new Float64Array(N), hann = new Float64Array(N); for (let i = 0; i < N; i++) hann[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  const fft = () => { for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
    for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < N; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const u = i + k, v = i + k + len / 2, xr = re[v] * cr - im[v] * ci, xi = re[v] * ci + im[v] * cr; re[v] = re[u] - xr; im[v] = im[u] - xi; re[u] += xr; im[u] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } };
  const frames = []; let pk = 0, sq = 0;
  for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > pk) pk = a; sq += x[i] * x[i]; }
  for (let s = Math.round(0.2 * SR); s + N <= x.length; s += HOP) {
    for (let k = 0; k < N; k++) { re[k] = x[s + k] * hann[k]; im[k] = 0; } fft();
    const row = bins.map(([a, b]) => { let p = 0; for (let k = a; k <= b; k++) p += (re[k] * re[k] + im[k] * im[k]) / (N * N / 4); return p; }); frames.push(row);
  }
  return { frames, pk: 20 * Math.log10(pk + 1e-9), rms: 10 * Math.log10(sq / x.length + 1e-18), centers };
}, [kind, scene, o, sec]).catch((e) => ({ err: String(e).slice(0, 200) }));

const db = (v) => 10 * Math.log10(v + 1e-18), f1 = (v) => (v > -170 ? v.toFixed(1) : '-∞').padStart(6);
function compare(bed, ev) {
  const nb = bed.centers.length, bp = new Array(nb).fill(0); for (const fr of bed.frames) for (let b = 0; b < nb; b++) bp[b] += fr[b] / bed.frames.length;
  let best = -999, at = 0, bb = 0; const per = [];
  ev.frames.forEach((fr, i) => { let m = -999, mb = 0; for (let b = 0; b < nb; b++) { if (db(fr[b]) < -66) continue; const e = db(fr[b]) - db(bp[b]); if (e > m) { m = e; mb = b; } } per.push(m); if (m > best) { best = m; at = i; bb = mb; } });
  const live = per.filter((v) => v > -900).sort((a, b) => a - b), med = live.length ? live[live.length >> 1] : -999;
  return { best, med, hz: bed.centers[bb], t: at * 2048 / 44100 + 0.2 };
}
console.log('Szene / Teil'.padEnd(26), ' Spitze  Effektiv | Überschuss über dem Bett (max / Median der hörbaren Fenster, Band, Zeit)');
for (const sc of Object.keys(scenes)) {
  if (only.length && !only.includes(sc)) continue;
  const bed = await run('scene', sc, { noStreams: true }, 16); console.log((sc + ' · Bett').padEnd(26), f1(bed.pk), f1(bed.rms));
  for (const st of scenes[sc]) {
    const e = await run('scene', sc, { solo: st }, SEC); if (e.err) { console.log(('  ' + st).padEnd(26), e.err); continue; }
    const c = compare(bed, e); console.log(('  ' + st).padEnd(26), f1(e.pk), f1(e.rms), '|', (c.best >= 0 ? '+' : '') + c.best.toFixed(1), '/', (c.med >= 0 ? '+' : '') + c.med.toFixed(1), 'dB  bei', c.hz, 'Hz,', c.t.toFixed(1), 's');
  }
  if (sc !== 'cover') { const mu = await run('music', sc, {}, 30); const c = compare(bed, mu); console.log('  Musik'.padEnd(26), f1(mu.pk), f1(mu.rms), '|', (c.best >= 0 ? '+' : '') + c.best.toFixed(1), '/', (c.med >= 0 ? '+' : '') + c.med.toFixed(1), 'dB  bei', c.hz, 'Hz,', c.t.toFixed(1), 's'); }
}
await h.browser.close();
