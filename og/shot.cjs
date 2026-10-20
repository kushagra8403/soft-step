const { chromium } = require('playwright'); const { prep } = require('../qa.cjs'); const path = require('path');
(async () => { const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' }); const p = await b.newPage({ viewport: { width: 1200, height: 630 } }); const log = []; await prep(p, log);
  await p.goto('file://' + path.join(__dirname, 'card.html'), { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.screenshot({ path: path.join(__dirname, 'og.png') }); console.log(log); await b.close(); })();
