import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 1280, h: 720, query: '?tier=low' });
try {
  await ready(page, 90000);
} catch (e) { console.log('NOT READY', e.message); }
await page.waitForTimeout(1500);
await page.screenshot({ path: out('t1-closed.png') });
console.log(logs.slice(0, 40).join('\n'));
await browser.close();
