const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    // Clipboard API refused (e.g. iframe without clipboard-write) and the execCommand fallback fails (returns false)
    const ctx = await H.ctxOf(B, { isMobile: false, hasTouch: false, viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
    const p = await H.open(B, ctx, log, () => {
      try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) } }); } catch (e) {}
      document.execCommand = function () { return false; };
    });
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
    await p.click('#cartbtn'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(300);
    await p.focus('#copyorder'); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    console.log('copy order, fallback copy failed -> label:', JSON.stringify(await p.textContent('#copyorder')), '| toast:', JSON.stringify(await p.textContent('#toast')), '| focus now on:', await p.evaluate(() => document.activeElement.id || document.activeElement.tagName));
    await ctx.close();
    // Clipboard API refused but execCommand works: where does keyboard focus end up?
    const ctx2 = await H.ctxOf(B, { isMobile: false, hasTouch: false, viewport: { width: 1280, height: 860 }, deviceScaleFactor: 1 });
    const p2 = await H.open(B, ctx2, log, () => { try { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('denied', 'NotAllowedError')) } }); } catch (e) {} });
    await H.addVia(p2, 'zig', 'Forest green & black', 'M', 1);
    await p2.click('#cartbtn'); await p2.click('#go'); await H.fillDetails(p2); await p2.click('#order-btn'); await p2.waitForTimeout(300);
    await p2.focus('#copyorder'); await p2.keyboard.press('Enter'); await p2.waitForTimeout(300);
    console.log('fallback copy ok -> label:', JSON.stringify(await p2.textContent('#copyorder')), '| focus now on:', await p2.evaluate(() => document.activeElement.id || document.activeElement.tagName));
    await p2.keyboard.press('Tab'); console.log('  next Tab lands on:', await p2.evaluate(() => { const a = document.activeElement; return (a.id || a.tagName) + ' inDrawer=' + !!a.closest('#drawer'); }));
    await ctx2.close();
    // #browse with reduced motion: is the scroll instant?
    const ctx3 = await H.ctxOf(B, { reducedMotion: 'reduce' });
    const p3 = await H.open(B, ctx3, log);
    await H.addVia(p3, 'zig', 'Forest green & black', 'M', 1);
    await p3.evaluate(() => window.scrollTo(0, 0));
    await p3.click('#cbar'); await p3.click('#v-cart .rm'); await p3.waitForTimeout(200);
    const ys = await p3.evaluate(async () => { document.querySelector('#browse').click(); const out = []; for (let i = 0; i < 8; i++) { await new Promise(r => setTimeout(r, 60)); out.push(Math.round(scrollY)); } return out; });
    console.log('reduced motion, Browse mats -> scrollY over time:', ys.join(' '));
    await ctx3.close();
    console.log('LOG', log);
  } finally { await B.close(); }
})();
