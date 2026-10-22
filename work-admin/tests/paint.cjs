// Regression: the hero's size chips and Add button must stay readable on every painted rug colour (>= 4.5:1).
// Usage: NODE_PATH=$(npm root -g) node work-admin/tests/paint.cjs [siteDir]
const { chromium } = require('playwright'); const path = require('path');
const R = path.resolve(__dirname, '../..'); const SITE = path.resolve(process.argv[2] || R + '/work-admin/site');
const { prep } = require(R + '/qa.cjs'); const { serve } = require(R + '/audit/serve.cjs');
(async () => {
  const s = await serve(SITE); const b = await chromium.launch({ executablePath: process.env.CHROMIUM || '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: 390, height: 844 } }); await prep(p, []);
  await p.goto(s.url + 'softsteps.html', { waitUntil: 'load' }); await p.waitForTimeout(1500);
  const rows = await p.evaluate(async () => {
    const lum = h => { const c = h.match(/\d+/g).slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
    const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
    const out = [];
    for (let i = 0; i < SS.SLIDES.length; i++) {
      SS.show(i, true); await new Promise(r => setTimeout(r, 900));
      for (const sel of ['#h-sizes [aria-checked=true]', '#h-add']) {
        const c = getComputedStyle(document.querySelector(sel)); out.push([SS.SLIDES[i].c, sel, ratio(c.backgroundColor, c.color)]);
      }
    }
    return out;
  });
  const bad = rows.filter(r => r[2] < 4.5);
  rows.forEach(r => console.log((r[2] >= 4.5 ? 'PASS ' : 'FAIL ') + r[0] + ' ' + r[1] + ' ' + r[2].toFixed(2)));
  console.log(bad.length ? bad.length + ' failed' : rows.length + ' passed, 0 failed');
  await b.close(); s.close(); process.exit(bad.length ? 1 : 0);
})();
