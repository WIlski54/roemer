// Wetter-Test: Knopf/Taste W schaltet durch, Sperre auf Deckel und Station 7, Ton-Schichten, keine Fehler.
import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 1100, h: 620, query: '?tier=low' });
await ready(page, 150000);
const st = () => page.evaluate(() => { const a = window.__app, w = a.weather; return { mode: w.mode, eff: w.effective, page: w.page, aria: document.querySelector('.tools button').getAttribute('aria-label'), toast: document.querySelector('.toast').style.display === 'none' ? '' : document.querySelector('.toast').textContent, rainfall: a.audio.cv.rainfall, wind: a.audio.cv.wind }; });
const res = [];
res.push(['cover, W', (await page.keyboard.press('w'), await st())]);
await page.evaluate(async () => { await window.__app.snapTo(4); });
for (let i = 0; i < 4; i++) { await page.keyboard.press('w'); await page.waitForTimeout(300); res.push(['st4 press ' + (i + 1), await st()]); }
await page.keyboard.press('w'); await page.waitForTimeout(200);                     // → rain
await page.evaluate(async () => { await window.__app.snapTo(7); });
await page.waitForTimeout(300); res.push(['st7 (rain gewählt)', await st()]);
await page.keyboard.press('w'); await page.waitForTimeout(300); res.push(['st7 W', await st()]);
await page.evaluate(async () => { await window.__app.snapTo(8); });
await page.waitForTimeout(300); res.push(['st8 zurück', await st()]);
await page.evaluate(() => window.__app.setCalm(true)); await page.keyboard.press('w'); await page.waitForTimeout(200);
res.push(['st8 calm, W', await st()]);
for (const [k, v] of res) console.log(k.padEnd(22), JSON.stringify(v));
await page.screenshot({ path: out('wx-test.png') });
const errs = logs.filter((l) => /error|warn/i.test(l) && !/accounts.google|ERR_|proxy|connect/i.test(l));
console.log(errs.slice(0, 20).join('\n') || 'no errors/warnings');
await browser.close();
