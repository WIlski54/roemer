// Schnelles Werkzeug zum Anhören-ohne-Ohren: rendert Klänge offline, schreibt WAV + Spektrogramm-PNG + Kennzahlen.
//   node tools/arender.mjs [--out=DIR] sfx:cornu voice:gans1 scene:legion:12 music:titel:30 sfx:marsch:3:'{"opts":{"n":2}}'
// Format je Auftrag: art:name[:sekunden[:o-als-JSON]]  (art = sfx|voice|scene|music|xfade|mix)
import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';
import { open, ready } from './harness.mjs';

const args = process.argv.slice(2);
const OUT = (args.find((a) => a.startsWith('--out=')) || '--out=/tmp/claude-0/audio_rom/r').slice(6);
const jobsArg = args.filter((a) => !a.startsWith('--'));
fs.mkdirSync(OUT, { recursive: true });
const ROOT = path.resolve('.'), HTML = path.join(OUT, 'lite.html');
const r = await build({ stdin: { contents: `import { AudioEngine } from '${ROOT}/src/audio/audio.js'; const audio = new AudioEngine({ calm: false, station: -1 }); window.__app = { calm: false, station: -1, audio }; window.__bookReady = true;`, resolveDir: ROOT }, bundle: true, write: false, format: 'iife', target: ['es2020', 'safari15'], logLevel: 'warning' });
fs.writeFileSync(HTML, `<!doctype html><meta charset="utf-8"><body><script>${r.outputFiles[0].text.replace(/<\/script/gi, '<\\/script')}</script>`);
const h = await open({ w: 1100, h: 500, url: 'file://' + HTML });
await ready(h.page, 60000);

for (const spec of jobsArg) {
  const m = spec.match(/^([a-z]+):([^:]+)(?::([\d.]+))?(?::(.*))?$/); if (!m) { console.log('?', spec); continue; }
  const [, kind, name, secS, oS] = m, sec = secS ? +secS : kind === 'scene' ? 12 : kind === 'music' ? 30 : 4, o = oS ? JSON.parse(oS) : {};
  const res = await h.page.evaluate(async ([kind, name, sec, o]) => {
    const A = window.__app.audio, x = await A.renderOffline(kind, name, sec, o), sr = o.sr || 44100;
    // Kennzahlen
    let pk = 0, sq = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > pk) pk = a; sq += x[i] * x[i]; }
    // Spektrogramm
    const W = 1000, HS = 300, HW = 70, cv = document.createElement('canvas'); cv.width = W; cv.height = HS + HW + 14; const g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
    const N = 2048, hop = Math.max(256, Math.floor((x.length - N) / W)), re = new Float64Array(N), im = new Float64Array(N);
    const fft = () => { for (let i = 1, j = 0; i < N; i++) { let b = N >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; } }
      for (let len = 2; len <= N; len <<= 1) { const a = -2 * Math.PI / len, wr = Math.cos(a), wi = Math.sin(a); for (let i = 0; i < N; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const u = i + k, v = i + k + len / 2, xr = re[v] * cr - im[v] * ci, xi = re[v] * ci + im[v] * cr; re[v] = re[u] - xr; im[v] = im[u] - xi; re[u] += xr; im[u] += xi; const t = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = t; } } } };
    const fmax = 12000, fmin = 40, ys = []; for (let y = 0; y < HS; y++) { const f = fmin * Math.pow(fmax / fmin, 1 - y / (HS - 1)); ys.push(Math.min(N / 2 - 1, Math.round(f / (sr / N)))); }
    const img = g.createImageData(W, HS), px = img.data;
    const col = (d, o) => { const t = Math.max(0, Math.min(1, (d + 90) / 70)); px[o] = Math.round(255 * Math.min(1, t * 1.6)); px[o + 1] = Math.round(255 * Math.max(0, Math.min(1, (t - 0.35) * 1.8))); px[o + 2] = Math.round(255 * Math.max(0, 1 - Math.abs(t - 0.25) * 3.2) * 0.9); px[o + 3] = 255; };
    for (let c = 0; c < W; c++) {
      const s0 = Math.min(x.length - N, Math.floor(c * (x.length - N) / W)); if (s0 < 0) break;
      for (let k = 0; k < N; k++) { re[k] = x[s0 + k] * (0.5 - 0.5 * Math.cos(2 * Math.PI * k / N)); im[k] = 0; } fft();
      for (let y = 0; y < HS; y++) { const k = ys[y], p = (re[k] * re[k] + im[k] * im[k]) / (N * N / 4); col(10 * Math.log10(p + 1e-14), (y * W + c) * 4); }
      // Hüllkurve oben
      let mx = 0; const a0 = Math.floor(c * x.length / W), a1 = Math.floor((c + 1) * x.length / W); for (let i = a0; i < a1; i++) { const a = Math.abs(x[i]); if (a > mx) mx = a; }
      const hh = Math.min(HW - 2, Math.max(0, (20 * Math.log10(mx + 1e-6) + 80) / 80 * (HW - 2))); g.fillStyle = '#4af'; g.fillRect(c, HW - hh, 1, hh);
    }
    g.putImageData(img, 0, HW);
    g.fillStyle = '#fff'; g.font = '10px sans-serif';
    for (const f of [100, 200, 500, 1000, 2000, 5000, 10000]) { const y = HW + (HS - 1) * (1 - Math.log(f / fmin) / Math.log(fmax / fmin)); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y, W, 1); g.fillStyle = '#fff'; g.fillText(f >= 1000 ? f / 1000 + 'k' : String(f), 2, y - 1); }
    const T = x.length / sr, st = T > 40 ? 5 : T > 12 ? 2 : 1; for (let s = 0; s <= T; s += st) { const xx = s / T * W; g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(xx, HW, 1, HS); g.fillStyle = '#fff'; g.fillText(s + 's', xx + 2, HW + HS + 11); }
    const png = cv.toDataURL('image/png').split(',')[1];
    let s = ''; const u = new Uint8Array(x.buffer, x.byteOffset, x.byteLength); for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
    return { b64: btoa(s), png, pk, rms: Math.sqrt(sq / x.length), n: x.length };
  }, [kind, name, sec, o]).catch((e) => ({ err: String(e) }));
  if (res.err) { console.log(spec, 'FEHLER', res.err.slice(0, 300)); continue; }
  const tag = (kind + '_' + name + (o.opts ? '_' + JSON.stringify(o.opts).replace(/[^\w]+/g, '') : '')).replace(/[^\wäöü.\-]+/g, '_');
  const buf = Buffer.from(res.b64, 'base64'), x = new Float32Array(buf.buffer, buf.byteOffset, buf.length / 4), SR = o.sr || 44100;
  const wb = Buffer.alloc(44 + x.length * 2); wb.write('RIFF', 0); wb.writeUInt32LE(36 + x.length * 2, 4); wb.write('WAVEfmt ', 8); wb.writeUInt32LE(16, 16); wb.writeUInt16LE(1, 20); wb.writeUInt16LE(1, 22); wb.writeUInt32LE(SR, 24); wb.writeUInt32LE(SR * 2, 28); wb.writeUInt16LE(2, 32); wb.writeUInt16LE(16, 34); wb.write('data', 36); wb.writeUInt32LE(x.length * 2, 40);
  for (let i = 0; i < x.length; i++) wb.writeInt16LE(Math.round(Math.max(-1, Math.min(1, x[i])) * 32767), 44 + i * 2);
  fs.writeFileSync(path.join(OUT, tag + '.wav'), wb); fs.writeFileSync(path.join(OUT, tag + '.png'), Buffer.from(res.png, 'base64'));
  const db = (v) => (20 * Math.log10(v + 1e-9)).toFixed(1);
  console.log(`${spec.padEnd(34)} Spitze ${db(res.pk)} dBFS  RMS ${db(res.rms)} dBFS  -> ${path.join(OUT, tag)}.png`);
}
const errs = h.logs.filter((l) => /\[(pageerror|error|warning)\]/.test(l) && !/WebGL|GPU|swiftshader/i.test(l)); if (errs.length) console.log('KONSOLE:', errs.slice(0, 6).join('\n'));
await h.browser.close();
