// Meteor-Ablauf in Bildern: usage [TIER=med] [BOOK_HTML] [OUT_DIR] node tools/meteor-seq.mjs [w h] [t1,t2,...]
import { open, ready, out } from './harness.mjs';
const [w = '1280', h = '720', list = '3.0,3.9,4.7,5.3,5.55,5.9,6.5,8.5,12'] = process.argv.slice(2);
const { browser, page, logs } = await open({ w: +w, h: +h, query: '?tier=' + (process.env.TIER || 'med') });
await ready(page, 200000);
await page.evaluate(async () => { await window.__app.snapTo(7); });
await page.evaluate(() => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > 3 ? res() : setTimeout(f, 100)); f(); }));
const P = () => page.evaluate(() => { const d = window.__app.spreads.current.p7dbg; return d ? { ts: d.S.ts, ph: d.S.phase } : null; });
console.log('p7dbg', JSON.stringify(await P()));
await page.evaluate(() => { window.__app.spreads.current.p7dbg.ctl.setValue(1); });
for (const t of list.split(',').map(Number)) {
  for (let i = 0; i < 4000; i++) { const p = await P(); if (p && (p.ts >= t || (p.ph === 'done'))) break; await new Promise((r) => setTimeout(r, 60)); }
  const p = await P(); if (process.env.FLASH) await page.evaluate(() => document.getAnimations().forEach((a) => { try { a.pause(); a.currentTime = 150; } catch (e) {} })); await page.screenshot({ path: out(`met-${String(t).replace('.', '_')}.png`) }); console.log('shot', t, JSON.stringify(p));
}
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l));
console.log(errs.slice(0, 20).join('\n') || 'no errors/warnings');
await browser.close();
