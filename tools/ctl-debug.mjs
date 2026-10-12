// Diagnose: Lasche per Touch ziehen. usage: node tools/ctl-debug.mjs [station]
import { open, ready } from './harness.mjs';
const n = +(process.argv[2] || 2);
const { browser, ctx, page } = await open({ w: 800, h: 600, touch: true, query: '?tier=low' });
await ready(page, 300000);
const cdp = await ctx.newCDPSession(page);
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
await page.evaluate((k) => window.__app.snapTo(k), n);
await pause(8000);
const info = await page.evaluate(() => {
  const a = window.__app, V = a.stage.camera.position.constructor, cam = a.stage.camera;
  const sp = a.spreads.current; const cs = [...sp.L.controls, ...sp.R.controls];
  const proj = (v) => { const p = v.clone().project(cam); return [(p.x + 1) / 2 * innerWidth, (1 - p.y) / 2 * innerHeight]; };
  return { ready: a.ready, busy: a.book.busy, cur: a.book.cur, ctl: cs.map((c) => { const hw = new V(); c.handle.getWorldPosition(hw); return { id: c.id, label: c.label, v: c.v, start: proj(c.handle.parent.localToWorld(new V(c.a.x, 0.02, c.a.y))), end: proj(c.handle.parent.localToWorld(new V(c.b.x, 0.02, c.b.y))), handle: proj(hw) }; }) };
});
console.log(JSON.stringify(info));
for (const c of info.ctl) {
  const [x0, y0] = c.handle;
  const pk = await page.evaluate(([x, y]) => { const p = window.__app.pick({ clientX: x, clientY: y }); return p ? p.type + ':' + (p.ctl && p.ctl.id) : null; }, [x0, y0]);
  await tp('touchStart', x0, y0); await pause(60);
  const d0 = await page.evaluate(() => { const a = window.__app; return { drag: a.drag && a.drag.type, ptrs: a.ptrs.size }; });
  for (let i = 1; i <= 12; i++) { await tp('touchMove', x0 + (c.end[0] - x0) * i / 12, y0 + (c.end[1] - y0) * i / 12); await pause(40); }
  const v = await page.evaluate((id) => { const a = window.__app; const k = [...a.spreads.current.L.controls, ...a.spreads.current.R.controls].find((x) => x.id === id); return k.v; }, c.id);
  await tp('touchEnd'); await pause(300);
  console.log(c.id, c.label, 'pick', pk, 'drag', JSON.stringify(d0), 'v0', c.v, '->', v);
}
await browser.close();
