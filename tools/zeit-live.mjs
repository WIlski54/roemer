// Zeitfenster im echten Buch: usage node tools/zeit-live.mjs w h [Uhrwerte 0..1 komma] ; TIER, OUT_DIR, BOOK_HTML
import { open, ready, out } from './harness.mjs';
const [w = '1920', h = '700', vals = '0,0.45,0.99999'] = process.argv.slice(2);
const { browser, page, logs } = await open({ w: +w, h: +h, query: '?tier=' + (process.env.TIER || 'med') });
await ready(page, 200000);
const wait = (s) => page.evaluate((sim) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > sim ? res() : setTimeout(f, 100)); f(); }), s);
const tw = () => page.evaluate(() => { const t = window.__app.timewin; return { active: t.active, shown: t.shown, idx: t.idx, compact: t.compact, rect: t.el.getBoundingClientRect().toJSON(), disp: t.el.style.display, op: t.el.style.opacity }; });
console.log('closed', JSON.stringify(await tw())); await page.screenshot({ path: out(`zl-${w}-closed.png`) });
await page.evaluate(async () => { await window.__app.snapTo(0); }); await wait(3);
console.log('station0', JSON.stringify(await tw())); await page.screenshot({ path: out(`zl-${w}-s0.png`) });
for (const v of vals.split(',').map(Number)) {
  await page.evaluate((v) => { window.__app.timewin.ctl.setValue(v); }, v); await wait(2.2);
  console.log('v', v, JSON.stringify(await tw())); await page.screenshot({ path: out(`zl-${w}-v${String(v).replace('.', '_')}.png`) });
}
// Punkt anklicken (Lucy)
const ok = await page.evaluate(() => { const d = [...document.querySelectorAll('.zf-dot')].find((b) => /Lucy/.test(b.title)); if (d) { d.click(); return true; } const n = document.querySelector('.zf-arrow:not([disabled]):last-of-type'); return false; });
await wait(3); console.log('click Lucy', ok, JSON.stringify(await tw())); await page.screenshot({ path: out(`zl-${w}-lucy.png`) });
await page.evaluate(async () => { await window.__app.snapTo(2); }); await wait(2);
console.log('station2', JSON.stringify(await tw()));
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l));
console.log(errs.slice(0, 20).join('\n') || 'no errors/warnings');
await browser.close();
