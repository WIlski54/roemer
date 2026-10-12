// Alle Seiten des Buchs als Bilder (Standardansicht): usage node tools/book-sheet.mjs [w h] [Stationen komma] [sim]; OUT_DIR, BOOK_HTML, TIER
import { open, ready, out } from './harness.mjs';
const [w = '1280', h = '720', list = '0,1,2,3,4,5,6,7,8', sim = '4'] = process.argv.slice(2);
const { browser, page, logs } = await open({ w: +w, h: +h, query: '?tier=' + (process.env.TIER || 'low') });
await ready(page, 200000);
const wait = (s) => page.evaluate((sim) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > sim ? res() : setTimeout(f, 100)); f(); }), s);
for (const s of list.split(',').map(Number)) {
  await page.evaluate(async (s) => { await window.__app.snapTo(s); const sp = window.__app.spreads.current; if (sp && sp.p0) { sp.p0.introDone = true; sp.p0.intro = false; } }, s);
  await wait(+sim);
  await page.screenshot({ path: out(`book-${w}-s${s}.png`) });
  console.log('shot', s);
}
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l));
console.log(errs.slice(0, 30).join('\n') || 'no errors/warnings');
await browser.close();
