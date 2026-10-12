// Test: Seite direkt anfassen (Umblättern), Zwei-Finger-Zoom/Verschieben, Hand-Knopf, Ansicht halten und zurücksetzen. iPad-Format, Touch.
// usage: [TIER=med] [BOOK_HTML=..] [OUT_DIR=..] node tools/view-test.mjs
import { open, ready, out } from './harness.mjs';
const { browser, ctx, page, logs } = await open({ w: 1024, h: 768, touch: true, query: '?tier=' + (process.env.TIER || 'med') });
await ready(page, 200000);
const cdp = await ctx.newCDPSession(page);
const wait = (s) => page.evaluate((sim) => new Promise((res) => { const t0 = window.__app.t; const f = () => (window.__app.t - t0 > sim ? res() : setTimeout(f, 100)); f(); }), s);
const pts = (a) => a.map(([x, y], i) => ({ x, y, id: i + 1 }));
const T = (type, a) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : pts(a) });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const drag1 = async (x0, y0, x1, y1, steps = 18, shotAt = -1, shot = null, hold = 0) => { await T('touchStart', [[x0, y0]]); for (let i = 1; i <= steps; i++) { await T('touchMove', [[x0 + (x1 - x0) * i / steps, y0 + (y1 - y0) * i / steps]]); await sleep(35); if (i === shotAt) { await wait(0.3); await page.screenshot({ path: out(shot) }); } } if (hold) { await sleep(hold); await wait(0.4); } await T('touchEnd', []); };
const st = () => page.evaluate(() => { const a = window.__app, c = a.cam; return { cur: a.book.cur, busy: a.book.busy, zoom: +c.zoom.toFixed(3), nx: +c.nudge.x.toFixed(2), nz: +c.nudge.z.toFixed(2), hold: c.hold, az: +c.az.target.toFixed(2), pan: a.panMode, resetBtn: getComputedStyle(a.ui.btnReset).display }; });
const ok = (name, cond, extra) => console.log((cond ? 'OK   ' : 'FAIL ') + name, extra ? JSON.stringify(extra) : '');
await page.evaluate(() => window.__app.snapTo(1)); await wait(4);
let s0 = await st(); console.log('start', JSON.stringify(s0));
// 1) Seite mitten auf der rechten Seite anfassen und nach links ziehen
await drag1(760, 440, 260, 440, 20, 9, 'view-1-grab.png'); await wait(3);
let s1 = await st(); ok('Seite anfassen vorwärts', s1.cur === s0.cur + 1, s1);
await page.screenshot({ path: out('view-2-after.png') });
// 2) auf der linken Seite anfassen und nach rechts ziehen -> zurück
await drag1(240, 440, 780, 440, 20); await wait(3);
let s2 = await st(); ok('Seite anfassen rückwärts', s2.cur === s0.cur, s2);
// 3) Halb ziehen und zurückgehen -> bleibt
await page.evaluate(() => window.__app.snapTo(1)); await wait(3); s0 = await st();
await drag1(760, 440, 640, 440, 12, -1, null, 600); await wait(2.5);
let s3 = await st(); ok('kurzer Zug blättert nicht', s3.cur === s0.cur, s3);
// 4) Senkrechtes Ziehen auf der Seite schwenkt die Kamera, blättert nicht
await drag1(700, 380, 700, 520, 8); await wait(0.5);
let s4 = await st(); ok('senkrecht: kein Blättern', s4.cur === s0.cur, s4);
await wait(4);
// 5) Zwei-Finger-Zoom und Verschieben
await T('touchStart', [[420, 420], [620, 420]]);
for (let i = 1; i <= 14; i++) { const k = i / 14; await T('touchMove', [[420 - 120 * k - 20 * k, 420 + 10 * k], [620 + 120 * k - 20 * k, 420 + 10 * k]]); await sleep(35); }
await T('touchEnd', []); await wait(1.5);
let s5 = await st(); ok('Zwei-Finger-Zoom', s5.zoom < 0.8 && s5.hold && s5.resetBtn !== 'none', s5);
await page.screenshot({ path: out('view-3-zoom.png') });
await wait(6);
let s6 = await st(); ok('Ansicht bleibt gehalten', Math.abs(s6.zoom - s5.zoom) < 0.01, s6);
// 6) Verschieben mit zwei Fingern (gleiche Richtung)
await T('touchStart', [[420, 420], [560, 420]]);
for (let i = 1; i <= 12; i++) { await T('touchMove', [[420 + 12 * i, 420 + 3 * i], [560 + 12 * i, 420 + 3 * i]]); await sleep(35); }
await T('touchEnd', []); await wait(1);
let s7 = await st(); ok('Zwei-Finger-Verschieben', Math.abs(s7.nx - s6.nx) > 0.5 || Math.abs(s7.nz - s6.nz) > 0.3, s7);
await page.screenshot({ path: out('view-4-pan.png') });
// 7) Reset-Knopf per Touch
const rb = await page.evaluate(() => { const r = window.__app.ui.btnReset.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
await T('touchStart', [rb]); await sleep(60); await T('touchEnd', []); await wait(2.5);
let s8 = await st(); ok('Ansicht zurücksetzen', s8.zoom === 1 && !s8.hold && s8.resetBtn === 'none', s8);
// 8) Hand-Knopf
const pb = await page.evaluate(() => { const r = window.__app.ui.btnPan.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; });
await T('touchStart', [pb]); await sleep(60); await T('touchEnd', []); await wait(0.5);
let s9 = await st(); ok('Hand-Modus an', s9.pan === true, s9);
await drag1(500, 520, 380, 470, 10); await wait(1);
let s10 = await st(); ok('Hand-Modus: ein Finger verschiebt', (Math.abs(s10.nx - s9.nx) > 0.3 || Math.abs(s10.nz - s9.nz) > 0.3) && s10.cur === s0.cur, s10);
await T('touchStart', [pb]); await sleep(60); await T('touchEnd', []);
const errs = logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l));
console.log(errs.slice(0, 20).join('\n') || 'no errors/warnings');
await browser.close();
