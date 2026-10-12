import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 1100, h: 620, query: '?tier=low' });
await ready(page, 120000);
const sim = (s) => page.evaluate((s) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > s ? res() : setTimeout(f, 80)); f(); }), s);
const proj = (expr) => page.evaluate((expr) => { const a = window.__app; const v = eval(expr).clone().project(a.stage.camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; }, expr);
await page.evaluate(async () => { await window.__app.snapTo(1); });
await sim(4);
// drag RENN
const hp = await proj("a.spreads.current.R.controls[0].handle.getWorldPosition(new a.stage.camera.position.constructor())");
console.log('handle at', hp);
await page.mouse.move(hp[0], hp[1]); await page.mouse.down();
const tp = await proj("(()=>{const c=a.spreads.current.R.controls[0]; const v=new a.stage.camera.position.constructor(c.b.x+a.book.group.position.x,0.1,c.b.y); return v;})()");
for (let i = 1; i <= 8; i++) { await page.mouse.move(hp[0] + (tp[0] - hp[0]) * 0.07 * i, hp[1] + (tp[1] - hp[1]) * 0.07 * i); await sim(0.1); }
await sim(0.8);
await page.screenshot({ path: out('t3-run.png') });
await page.mouse.up(); await sim(1.5);
// tap plateosaurus
const pp = await proj("a.spreads.current.R.actors[0].proxy.getWorldPosition(new a.stage.camera.position.constructor())");
await page.mouse.click(pp[0], pp[1]); await sim(1.0);
await page.screenshot({ path: out('t3-card.png') });
console.log('card open', await page.evaluate(() => window.__app.ui.cardOpen));
await page.keyboard.press('Escape'); await sim(0.3);
// next page via button
await page.click('button[aria-label="Nächste Seite"]');
await sim(0.55);
await page.screenshot({ path: out('t3-turn.png') });
await sim(2.5);
console.log('cur', await page.evaluate(() => [window.__app.book.cur, window.__app.station]));
await page.screenshot({ path: out('t3-after.png') });
console.log(logs.filter((l) => /error|warn/i.test(l)).slice(0, 20).join('\n') || 'no errors');
await browser.close();
