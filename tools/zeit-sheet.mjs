// Kontaktbögen der Zeitfenster-Szenen (ohne das ganze Buch zu laden): usage node tools/zeit-sheet.mjs [t1,t2,t3] [sceneIds,komma]
import { build } from 'esbuild';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';
const times = (process.argv[2] || '2,5.5,9').split(',').map(Number);
const only = process.argv[3] ? process.argv[3].split(',') : null;
const outDir = process.env.OUT_DIR || 'test-out'; fs.mkdirSync(outDir, { recursive: true });
const r = await build({ entryPoints: ['src/ui/zeitszenen.js'], bundle: true, format: 'iife', globalName: 'ZS', write: false });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1480, height: 900 } });
const errs = []; page.on('pageerror', (e) => errs.push(e.message + '\n' + e.stack)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
await page.setContent('<body style="margin:0;background:#222"></body>');
await page.addScriptTag({ content: r.outputFiles[0].text });
const info = await page.evaluate(({ times, only }) => {
  const res = [];
  for (const sc of ZS.SCENES) {
    if (only && !only.includes(sc.id)) continue;
    const row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;margin:4px;align-items:center;color:#fff;font:12px sans-serif';
    const lab = document.createElement('div'); lab.style.width = '70px'; lab.textContent = sc.id; row.append(lab);
    for (const t of times) { const c = document.createElement('canvas'); c.width = 480; c.height = 300; c.style.width = '360px'; c.style.height = '225px'; row.append(c); const g = c.getContext('2d'); try { sc.draw(g, t, { calm: false }); } catch (e) { res.push(sc.id + ' @' + t + ': ' + e.message + ' ' + (e.stack || '').split('\n')[1]); } }
    document.body.append(row);
  }
  return res;
}, { times, only });
console.log(info.join('\n') || 'keine Zeichenfehler', errs.join('\n'));
const tag = (process.argv[4] || 'sheet');
const rows = await page.$$('body > div');
const n = Math.ceil(rows.length / 4);
for (let i = 0; i < 4 && i * n < rows.length; i++) {
  const first = rows[i * n], last = rows[Math.min(rows.length, (i + 1) * n) - 1];
  const a = await first.boundingBox(), b = await last.boundingBox();
  await page.screenshot({ path: path.join(outDir, `zeit-${tag}-${i}.png`), fullPage: true, clip: { x: 0, y: a.y - 4, width: 1480, height: b.y + b.height - a.y + 8 } });
}
await browser.close();
