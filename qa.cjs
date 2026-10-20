// QA harness for the Soft Steps page.
// Usage: NODE_PATH=$(npm root -g) node qa.cjs <path/to/page.html> <outDir>
// Google Fonts requests are served from local npm copies (Fraunces variable, Hind Vadodara) so screenshots show real type.
// Reuse in your own scripts: const { prep, scrollThrough } = require('<scratchpad>/qa.cjs'); await prep(page, logArray) before page.goto().
// Serves CDN scripts (cdnjs gsap, jsdelivr lenis) from local npm copies, since the CDN is blocked in this sandbox.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const LIBS = path.join(__dirname, 'libs');
function localFor(url) {
  let m = url.match(/cdnjs\.cloudflare\.com\/ajax\/libs\/gsap\/([\d.]+)\/(.+\.js)$/);
  if (m) { const p = path.join(LIBS, 'gsap-' + m[1], 'package', 'dist', m[2]); if (fs.existsSync(p)) return p; }
  m = url.match(/cdn\.jsdelivr\.net\/npm\/(gsap|lenis)@([\d.]+)\/(.+\.js)$/);
  if (m) { const p = path.join(LIBS, m[1] + '-' + m[2], 'package', m[3]); if (fs.existsSync(p)) return p; }
  m = url.match(/unpkg\.com\/(gsap|lenis)@([\d.]+)\/(.+\.js)$/);
  if (m) { const p = path.join(LIBS, m[1] + '-' + m[2], 'package', m[3]); if (fs.existsSync(p)) return p; }
  return null;
}
async function prep(page, log) {
  await page.route(/fonts\.googleapis\.com/, r => r.fulfill({ status: 200, contentType: 'text/css', body: fs.readFileSync(path.join(LIBS, 'localfonts.css'), 'utf8') }));
  await page.route(/fonts\.gstatic\.com/, r => r.fulfill({ status: 200, body: '' }));
  await page.route(/^http:\/\/localfonts\//, r => r.fulfill({ path: path.join(LIBS, r.request().url().replace('http://localfonts/', '')), contentType: 'font/woff2' }));
  await page.route(/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com/, r => {
    const p = localFor(r.request().url());
    if (p) return r.fulfill({ path: p, contentType: 'application/javascript' });
    log.push('UNSERVED CDN (may be a bad URL/version): ' + r.request().url()); return r.abort();
  });
  page.on('pageerror', e => log.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') log.push('CONSOLE: ' + m.text()); });
  page.on('requestfailed', r => { const u = r.url(); if (!/fonts\.g/.test(u) && !/cdnjs|jsdelivr|unpkg/.test(u)) log.push('REQFAIL: ' + u); });
}
async function scrollThrough(page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(400);
}
module.exports = { prep, scrollThrough };
if (require.main === module) (async () => {
  const file = path.resolve(process.argv[2]); const out = path.resolve(process.argv[3] || 'qa-out');
  fs.mkdirSync(out, { recursive: true });
  const url = 'file://' + file;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const report = {};
  for (const [w, h, name, rm] of [[1440, 900, 'desktop', false], [768, 1024, 'tablet', false], [390, 844, 'phone', false], [390, 844, 'phone-reduced', true]]) {
    const log = [];
    const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: rm ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
    const page = await ctx.newPage(); await prep(page, log);
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(out, name + '-first.png') });
    await scrollThrough(page);
    const m = await page.evaluate(() => {
      const de = document.documentElement;
      const hidden = [...document.querySelectorAll('h1,h2,h3,p,button,a,img')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && (parseFloat(cs.opacity) < 0.05 || cs.visibility === 'hidden') && !e.closest('[hidden],[aria-hidden="true"],.drawer,.toast,.scrim,dialog'); }).slice(0, 15).map(e => e.tagName + '.' + e.className + ' "' + (e.textContent || e.alt || '').trim().slice(0, 40) + '"');
      return { scrollWidth: de.scrollWidth, clientWidth: de.clientWidth, height: de.scrollHeight, invisibleAfterScroll: hidden };
    });
    await page.screenshot({ path: path.join(out, name + '-full.png'), fullPage: true });
    report[name] = { ...m, log };
    await ctx.close();
  }
  // Functional flow on phone + desktop: add to cart -> details -> pay
  for (const [w, h, name] of [[1440, 900, 'flow-desktop'], [390, 844, 'flow-phone']]) {
    const log = []; const steps = [];
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const page = await ctx.newPage(); await prep(page, log);
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const tryStep = async (label, fn) => { try { await fn(); steps.push('OK ' + label); } catch (e) { steps.push('FAIL ' + label + ': ' + e.message.split('\n')[0]); } };
    await tryStep('hero add to cart', async () => { await page.click('#h-add', { timeout: 5000 }); });
    await tryStep('pick solid colour Rust + size L + add', async () => {
      const card = page.locator('.prod[data-k="sol"]');
      await card.locator('[data-n="Rust"]').click({ timeout: 5000 });
      await card.locator('.sizes-c [role="radio"]').nth(2).click({ timeout: 5000 });
      await card.locator('[data-add]').click({ timeout: 5000 });
    });
    await page.waitForTimeout(700);
    await tryStep('open cart', async () => { await page.click('#cartbtn', { timeout: 5000 }); await page.waitForSelector('#drawer:not([hidden])', { timeout: 3000 }); });
    const cartCount = await page.evaluate(() => document.querySelectorAll('#v-cart .line').length);
    steps.push('cart lines: ' + cartCount);
    await page.screenshot({ path: path.join(out, name + '-cart.png') });
    await tryStep('continue to details', async () => { await page.click('#go', { timeout: 5000 }); await page.waitForSelector('#v-det:not([hidden])', { timeout: 3000 }); });
    await tryStep('fill details', async () => {
      await page.fill('#o-name', 'Test Buyer'); await page.fill('#o-ph', '9876543210'); await page.fill('#o-ad', '12 Alkapuri Society, RC Dutt Road');
      await page.fill('#o-ct', 'Vadodara'); await page.fill('#o-pin', '390007');
    });
    await tryStep('place order', async () => { await page.click('#order-btn', { timeout: 5000 }); await page.waitForSelector('#v-pay:not([hidden])', { timeout: 3000 }); });
    const wa = await page.evaluate(() => (document.querySelector('#sendwa') || {}).href || '');
    steps.push('whatsapp link ok: ' + /wa\.me\/919099441429\?text=/.test(wa));
    await page.screenshot({ path: path.join(out, name + '-pay.png') });
    report[name] = { steps, log };
    await ctx.close();
  }
  await b.close();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
})();
