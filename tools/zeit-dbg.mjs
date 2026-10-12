// Debug: misst die Layout-Kandidaten des Zeitfensters. usage: node tools/zeit-dbg.mjs w h
import { open, ready } from './harness.mjs';
const [w = '1024', h = '768'] = process.argv.slice(2);
const { browser, page } = await open({ w: +w, h: +h, query: '?tier=low' });
await ready(page, 200000);
await page.evaluate(async () => { await window.__app.snapTo(0); });
await page.waitForTimeout(3000);
const res = await page.evaluate(() => {
  const t = window.__app.timewin, e = t.el, out = [];
  const L = (SC) => 0;
  const longest = t.longest;
  out.push({ mode: t.mode, longest, W: innerWidth, H: innerHeight });
  for (const mode of ['side', 'stack']) for (const wv of [380, 340, 300, 260]) {
    t.place(mode, wv, 10, 54, mode === 'side' ? 604 : 0); out.push({ mode, w: wv, h: e.offsetHeight, sw: e.scrollWidth, bodyH: t.body.offsetHeight });
  }
  t.place('side', 380, 10, 54, 604);
  for (const c of ['zf-h','zf-view','zf-body','zf-nav']) { const r = e.querySelector('.'+c).getBoundingClientRect(); out.push({ c, top: r.top|0, h: r.height|0, w: r.width|0, disp: getComputedStyle(e).display, cvh: t.cv.style.height, cvH: t.cv.height }); }
  return out;
});
console.log(res.map((r) => JSON.stringify(r)).join('\n'));
await browser.close();
