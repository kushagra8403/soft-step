// Harness v2 for CORE audit: one browser, fresh context per scenario.
const SP = '/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad';
const { chromium } = require('playwright');
const { prep } = require(SP + '/qa.cjs');
const { serve } = require(SP + '/audit/serve.cjs');
const SNAP = SP + '/audit2/snap';
const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 };
async function boot() {
  const s = await serve(SNAP);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  return { s, b, close: async () => { await b.close(); s.close(); } };
}
async function ctxOf(B, opts) {
  const ctx = await B.b.newContext(Object.assign({}, PHONE, { reducedMotion: 'reduce' }, opts || {}));
  // block real WhatsApp / external nav
  await ctx.route(/wa\.me|whatsapp\.com|instagram\.com/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>stub</p>' }));
  return ctx;
}
async function open(B, ctx, log, initScript, url) {
  const p = await ctx.newPage();
  p.setDefaultTimeout(60000);
  await prep(p, log);
  if (initScript) await p.addInitScript(initScript);
  await p.goto(url || (B.s.url + 'softsteps.html'), { waitUntil: 'load', timeout: 120000 });
  await p.waitForTimeout(1000);
  return p;
}
async function addVia(p, k, colour, size, q) {
  return p.evaluate(([k, colour, size, q]) => {
    const el = document.querySelector('.prod[data-k="' + k + '"]');
    const cb = [...el.querySelectorAll('[data-n]')].find(b => b.dataset.n === colour); if (!cb) throw new Error('no colour ' + colour); cb.click();
    const sb = [...el.querySelectorAll('.sizes-c [role="radio"]')].find(b => b.textContent.trim() === size); sb.click();
    for (let i = 1; i < (q || 1); i++) el.querySelector('[data-q="1"]').click();
    el.querySelector('[data-add]').click();
  }, [k, colour, size, q]);
}
async function fillDetails(p, d) {
  const v = Object.assign({ name: 'Asha Patel', ph: '98765 43210', ad: '12 Alkapuri Society, Race Course', ct: 'Vadodara', pin: '390007', em: '' }, d || {});
  await p.fill('#o-name', v.name); await p.fill('#o-ph', v.ph); await p.fill('#o-ad', v.ad); await p.fill('#o-ct', v.ct); await p.fill('#o-pin', v.pin); await p.fill('#o-email', v.em);
}
async function state(p) {
  return p.evaluate(() => {
    const wa = document.querySelector('#sendwa').href; let msg = null; try { msg = new URL(wa).searchParams.get('text'); } catch (e) {}
    const vis = id => !document.querySelector(id).hidden;
    return { cnt: document.querySelector('#cnt').textContent, cbn: document.querySelector('#cbn').textContent, cbt: document.querySelector('#cbt').textContent, cbarHidden: document.querySelector('#cbar').hidden,
      drawer: vis('#drawer'), view: ['cart', 'det', 'pay'].filter(v => vis('#v-' + v)), oid: document.querySelector('#oid').textContent, payamt: document.querySelector('#payamt').textContent,
      upi: document.querySelector('#upil').href, msg, cart: (() => { try { return JSON.parse(localStorage.getItem('ss_cart2')); } catch (e) { return 'ERR'; } })(),
      pend: (() => { try { return JSON.parse(localStorage.getItem('ss_pending')); } catch (e) { return 'ERR'; } })(), active: document.activeElement && (document.activeElement.id || document.activeElement.tagName) };
  });
}
module.exports = { boot, ctxOf, open, addVia, fillDetails, state, SNAP, SP };
