// usage: node tools/gallery.mjs out.png [ids=a,b,c] [mode=fit|scale] [cols=4] [cell=360]
import { open, ready } from './harness.mjs';
import path from 'node:path';
const [outFile, ...rest] = process.argv.slice(2);
const htmlArg = rest.find((r) => r.startsWith('html='))?.slice(5);
const qargs = rest.filter((r) => !r.startsWith('html='));
const qs = qargs.length ? '?' + qargs.join('&') : '';
const cols = +(rest.find((r) => r.startsWith('cols='))?.split('=')[1] || 4);
const cell = +(rest.find((r) => r.startsWith('cell='))?.split('=')[1] || 360);
const ids = rest.find((r) => r.startsWith('ids='))?.split('=')[1]?.split(',').length || 3;
const rows = Math.ceil(ids / cols);
const { browser, page, logs } = await open({ url: 'file://' + path.resolve(htmlArg || 'dist/gallery.html') + qs, w: cols * cell, h: Math.max(rows, 1) * cell });
try { await ready(page, 90000); } catch (e) { console.log('NOT READY', logs.join('\n')); }
await page.screenshot({ path: outFile, fullPage: true });
const errs = logs.filter((l) => /error/i.test(l)); if (errs.length) console.log(errs.join('\n'));
await browser.close();
