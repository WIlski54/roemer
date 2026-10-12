// Prüft: keine externen Anfragen (nur file:/data:/blob:), keine Cookies, kein localStorage-Zwang, keine Konsolenfehler. usage: [BOOK_HTML=..] node tools/net-check.mjs
import { open, ready } from './harness.mjs';
const { browser, ctx, page, logs } = await open({ w: 1100, h: 620, query: '?tier=low' });
const reqs = []; page.on('request', (r) => reqs.push(r.url().slice(0, 80)));
await ready(page, 200000);
await page.evaluate(async () => { for (const s of [0, 3, 8]) await window.__app.snapTo(s); });
await page.waitForTimeout(1500);
const bad = reqs.filter((u) => !/^(file:|data:|blob:|about:)/.test(u));
const cookies = await ctx.cookies();
const ls = await page.evaluate(() => Object.keys(localStorage));
console.log('Anfragen gesamt:', reqs.length, '| extern:', bad.length, bad.slice(0, 5));
console.log('Cookies:', cookies.length, '| localStorage-Schlüssel:', JSON.stringify(ls));
const errs = logs.filter((l) => /error|warn/i.test(l) && !/accounts.google|ERR_|proxy|connect/i.test(l));
console.log(errs.slice(0, 10).join('\n') || 'keine Konsolenfehler/-warnungen');
await browser.close();
