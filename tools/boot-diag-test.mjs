// Startdiagnose prüfen: (A) ohne WebGL muss eine lesbare Fehlermeldung erscheinen, (B) normaler Start bleibt ohne Meldung. usage: node tools/boot-diag-test.mjs [A|B]
import { chromium } from 'playwright-core';
import path from 'node:path';
import { open, ready, out } from './harness.mjs';
const which = process.argv[2] || 'AB';
const html = 'file://' + path.resolve(process.env.BOOK_HTML || 'dist/index.html');
const ok = (n, c, x) => console.log((c ? 'OK   ' : 'FAIL ') + n, x === undefined ? '' : JSON.stringify(x));
if (which.includes('A')) {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true });
  const page = await ctx.newPage();
  await page.addInitScript(() => { const g = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { return /webgl/i.test(t) ? null : g.call(this, t, ...a); }; });
  await page.goto(html); await page.waitForTimeout(4000);
  const txt = await page.evaluate(() => { const b = [...document.body.children].find((e) => e.tagName === 'DIV' && /konnte nicht starten/.test(e.textContent || '')); return b ? b.innerText : null; });
  ok('A: ohne WebGL erscheint Fehlermeldung', !!txt && /WebGL/.test(txt), (txt || '').slice(0, 600));
  await page.screenshot({ path: out('boot-diag-A.png') });
  await browser.close();
}
if (which.includes('B')) {
  const { browser, page, logs } = await open({ w: 1024, h: 768, touch: true, query: '?tier=low' });
  await ready(page, 240000);
  const st = await page.evaluate(() => ({ step: window.__boot.step, box: [...document.body.children].some((e) => e.tagName === 'DIV' && /konnte nicht starten/.test(e.textContent || '')), boot0: !!document.getElementById('boot0') }));
  ok('B: normaler Start ohne Meldung', st.step === 'bereit' && !st.box && !st.boot0, st);
  console.log(logs.filter((l) => /error|warn/i.test(l) && !/GPU stall|ReadPixels/i.test(l)).slice(0, 10).join('\n') || 'no errors/warnings');
  await browser.close();
}
