// usage: [TIER=low] [BOOK_HTML=path] [OUT_DIR=dir] [EVAL='js using a=__app'] node tools/shot.mjs <name> <station|-1> [w h] [simSeconds] [az el zoom]
import { open, ready, out } from './harness.mjs';
const [name, st = '0', w = '1280', h = '720', sim = '4', az, el, zoom] = process.argv.slice(2);
const { browser, page, logs } = await open({ w: +w, h: +h, query: '?tier=' + (process.env.TIER || 'low') });
await ready(page, 120000);
await page.evaluate(async (s) => { await window.__app.snapTo(s); }, +st);
if (az !== undefined) await page.evaluate(([a, e, z]) => { const c = window.__app.cam; c.autoReturn = false; c.az.snap(+a); c.az.set(+a); c.el.snap(+e); c.el.set(+e); if (z) c.setZoom(+z); }, [az, el, zoom]);
if (process.env.EVAL) { const r = await page.evaluate(`(async()=>{const a=window.__app; ${process.env.EVAL}})()`); if (r !== undefined) console.log('EVAL ->', JSON.stringify(r)); }
await page.evaluate((sim) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > sim ? res() : setTimeout(f, 100)); f(); }), +sim);
await page.screenshot({ path: out(name + '.png') });
const errs = logs.filter((l) => /error|warn/i.test(l));
console.log(errs.slice(0, 30).join('\n') || 'no errors/warnings');
await browser.close();
