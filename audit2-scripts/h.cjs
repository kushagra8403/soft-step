// Shared harness for CORE audit scripts.
const SP = '/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad';
const { chromium } = require('playwright');
const { prep } = require(SP + '/qa.cjs');
const { serve } = require(SP + '/audit/serve.cjs');
const SNAP = SP + '/audit2/snap';
async function start(opts = {}) {
  const s = await serve(SNAP);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext(Object.assign({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2, reducedMotion: 'reduce' }, opts.ctx || {}));
  const log = [];
  async function page(initScript) {
    const p = await ctx.newPage();
    p.setDefaultTimeout(60000);
    await prep(p, log);
    if (initScript) await p.addInitScript(initScript);
    await p.goto(s.url + 'softsteps.html', { waitUntil: 'load', timeout: 90000 });
    await p.waitForTimeout(800);
    return p;
  }
  return { s, b, ctx, log, page, close: async () => { await b.close(); s.close(); } };
}
// Add an item via the product card UI: k = zig/sol/chen, colour index, size letter
async function addVia(p, k, ci, size, q) {
  await p.evaluate(([k, ci, size, q]) => {
    const el = document.querySelector('.prod[data-k="' + k + '"]');
    const cb = el.querySelectorAll('.swatches [role="radio"], .chips [role="radio"]')[ci]; cb.click();
    const sb = [...el.querySelectorAll('.sizes-c [role="radio"]')].find(b => b.textContent.trim() === size); sb.click();
    for (let i = 1; i < (q || 1); i++) el.querySelector('[data-q="1"]').click();
    el.querySelector('[data-add]').click();
  }, [k, ci, size, q]);
}
async function fillDetails(p, d) {
  const v = Object.assign({ name: 'Asha Patel', ph: '98765 43210', ad: '12 Alkapuri Society, Race Course', ct: 'Vadodara', pin: '390007', em: '' }, d || {});
  await p.fill('#o-name', v.name); await p.fill('#o-ph', v.ph); await p.fill('#o-ad', v.ad); await p.fill('#o-ct', v.ct); await p.fill('#o-pin', v.pin); await p.fill('#o-email', v.em);
}
module.exports = { start, addVia, fillDetails, SNAP, SP };
