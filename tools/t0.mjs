import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open();
await ready(page);
console.log(await page.evaluate('window.__info'));
await page.screenshot({ path: out('t0.png') });
console.log(logs.join('\n'));
await browser.close();
