const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad';
const { prep } = require(SP + '/qa.cjs'); const { serve } = require(SP + '/audit/serve.cjs');
(async () => {
  const dir = process.argv[2]; const s = await serve(dir);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const vp of [[390, 844], [1440, 900]]) {
    const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] } }); const page = await ctx.newPage(); const log = []; await prep(page, log);
    await page.goto(s.url + 'softsteps.html', { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(1500);
    const r = await page.evaluate(() => ({
      tiles: document.querySelectorAll('#cgrid .tile').length, sw: document.querySelectorAll('.prod [data-n]').length,
      prices: [...document.querySelectorAll('[data-price]')].map(e => e.textContent), hprice: document.querySelector('#h-price').textContent,
      add: [...document.querySelectorAll('[data-add]')].map(e => e.textContent.trim()), hadd: document.querySelector('#h-add').innerHTML,
      ranges: [...document.querySelectorAll('.ranges small')].map(e => e.textContent), slides: SS.SLIDES.length, src: SS.catalog.v,
      pairs: document.querySelectorAll('#pairs-list .pair').length, fam: [...document.querySelectorAll('#fam .n')].map(e => e.textContent).join(','),
      fit: document.querySelector('#fit-add').textContent.trim(), dock: document.querySelector('#dock-p').textContent,
    }));
    console.log(vp[0], JSON.stringify(r), log.filter(l => !/REQFAIL.*img/.test(l)));
    await ctx.close();
  }
  await b.close(); s.close();
})();
