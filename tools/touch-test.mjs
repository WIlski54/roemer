// Touch-Test im iPad-Format (1024x768, Stufe med): Ziehen, Tippen auf Klappe und Tier, Karte schließen, Navigation.
// usage: [BOOK_HTML=path] [OUT_DIR=dir] node tools/touch-test.mjs
import { open, ready, out } from './harness.mjs';
const { browser, ctx, page, logs } = await open({ w: 1024, h: 768, touch: true, query: '?tier=' + (process.env.TIER || 'med') });
await ready(page, 200000);
const cdp = await ctx.newCDPSession(page);
const wait = (s) => page.evaluate((sim) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > sim ? res() : setTimeout(f, 100)); f(); }), s);
const tp = (type, x, y) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
const drag = async (x0, y0, x1, y1, steps = 14, shot = null) => { await tp('touchStart', x0, y0); for (let i = 1; i <= steps; i++) { await tp('touchMove', x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps); await new Promise((r) => setTimeout(r, 40)); } if (shot) { await wait(0.5); await page.screenshot({ path: out(shot) }); } await tp('touchEnd'); };
const tap = async (x, y) => { await tp('touchStart', x, y); await new Promise((r) => setTimeout(r, 60)); await tp('touchEnd'); };
const st = () => page.evaluate(() => ({ cur: window.__app.book.cur, card: window.__app.ui.cardOpen, tier: window.__app.stage.tierName, cv: [innerWidth, innerHeight] }));
const res = {};
await page.evaluate(() => window.__app.snapTo(1)); await wait(4);
console.log('start', JSON.stringify(await st()));
await page.screenshot({ path: out('touch-0.png') });
// 1) Lasche RENN! ziehen
await drag(608, 495, 880, 495, 14, 'touch-1-drag.png'); await wait(0.6);
await wait(2.5);
// 2) Pangaea-Klappe antippen
await tap(368, 480); await wait(2.5);
await page.screenshot({ path: out('touch-2-flap.png') });
await tap(368, 480); await wait(1.5);
// 3) Tier antippen -> Karte
await tap(650, 335); await wait(2.5);
res.afterAnimalTap = await st(); console.log('after animal tap', JSON.stringify(res.afterAnimalTap));
await page.screenshot({ path: out('touch-3-card.png') });
// 4) Karte schließen per Touch auf den Schließen-Knopf
const xb = await page.evaluate(() => { const b = window.__app.ui.card.querySelector('.x, .close, button[aria-label]'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, b.className, b.getAttribute('aria-label')]; });
console.log('close btn', JSON.stringify(xb));
if (xb) { await tap(xb[0], xb[1]); await wait(1); }
res.afterClose = await st(); console.log('after close', JSON.stringify(res.afterClose));
// 5) Navigation: Pfeil rechts per Touch
const nx = await page.evaluate(() => { const bs = [...document.querySelectorAll('button')].filter((b) => /weiter|next|Seite vor|vor/i.test((b.getAttribute('aria-label') || '') + (b.title || ''))); const b = bs[bs.length - 1]; if (!b) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2, b.getAttribute('aria-label')]; });
console.log('next btn', JSON.stringify(nx));
if (nx) { await tap(nx[0], nx[1]); await wait(7); }
res.afterNext = await st(); console.log('after next', JSON.stringify(res.afterNext));
await page.screenshot({ path: out('touch-4-next.png') });
// 6) Auf freier Fläche ziehen (Kamera schwenken)
const c0 = await page.evaluate(() => window.__app.cam.az.target);
await drag(300, 600, 420, 590); await wait(0.5);
const c1 = await page.evaluate(() => window.__app.cam.az.target);
console.log('cam az target', c0, '->', c1);
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l));
console.log(errs.slice(0, 20).join('\n') || 'no errors/warnings');
await browser.close();
