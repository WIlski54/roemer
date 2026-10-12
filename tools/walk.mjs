// Walk all stations: node tools/walk.mjs [w h] [from to] [az el]
import { open, ready, out } from './harness.mjs';
const [w = '1280', h = '720', from = '0', to = '8', az, el] = process.argv.slice(2);
const { browser, page, logs } = await open({ w: +w, h: +h, query: '?tier=' + (process.env.TIER || 'low') });
await ready(page, 120000);
const sim = (s) => page.evaluate((s) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > s ? res() : setTimeout(f, 80)); f(); }), s);
for (let s = +from; s <= +to; s++) {
  await page.evaluate(async (s) => { await window.__app.snapTo(s); }, s);
  if (az !== undefined) await page.evaluate(([a, e]) => { const c = window.__app.cam; c.autoReturn = false; c.az.snap(+a); c.az.set(+a); c.el.snap(+e); c.el.set(+e); }, [az, el]);
  await sim(5);
  await page.screenshot({ path: out(`walk${az !== undefined ? 'o' : ''}-${s}.png`) });
  console.log('station', s, 'ok');
}
console.log(logs.filter((l) => /error|warn/i.test(l)).slice(0, 30).join('\n') || 'no errors/warnings');
await browser.close();
