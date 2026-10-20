const H = require('./h2.cjs');
const box = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; }, sel);
(async () => {
  const B = await H.boot(); const log = [];
  try {
    for (const vp of [{ width: 390, height: 844 }, { width: 360, height: 740 }, { width: 1440, height: 900 }]) {
      const ctx = await H.ctxOf(B, vp.width > 800 ? { viewport: vp, isMobile: false, hasTouch: false, deviceScaleFactor: 1 } : { viewport: vp });
      const p = await H.open(B, ctx, log);
      await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
      await H.addVia(p, 'sol', 'Aqua', 'L', 1);
      await H.addVia(p, 'chen', 'Navy stripe', 'XL', 1);
      await p.click('#cbar').catch(() => p.click('#cartbtn')); await p.waitForTimeout(300);
      const go = await box(p, '#go');
      await p.click('#go'); await p.waitForTimeout(200);
      const ob = await box(p, '#order-btn'); const back = await box(p, '#back');
      await H.fillDetails(p);
      await p.click('#order-btn'); await p.waitForTimeout(300);
      const wa = await box(p, '#sendwa');
      console.log(vp.width + 'px  #go', JSON.stringify(go), ' #order-btn', JSON.stringify(ob), ' #back', JSON.stringify(back), ' #sendwa', JSON.stringify(wa));
      // fresh: simulate a real double tap on "Continue to payment"
      await p.click('#editorder'); await p.click('#go'); await p.waitForTimeout(200);
      const c = { x: ob.x + ob.w / 2, y: ob.y + ob.h / 2 };
      const before = await H.state(p);
      const pages = []; ctx.on('page', pg => pages.push(pg.url()));
      if (vp.width < 800) { await p.touchscreen.tap(c.x, c.y); await p.waitForTimeout(120); await p.touchscreen.tap(c.x, c.y); }
      else { await p.mouse.dblclick(c.x, c.y); }
      await p.waitForTimeout(1500);
      const after = await H.state(p);
      console.log('  double-tap Continue to payment: old oid', before.oid, '-> new', after.oid, '| popups opened:', pages, '| pend.sent:', after.pend && after.pend.sent, '| sentbox visible:', await p.evaluate(() => !document.querySelector('#sentbox').hidden));
      await ctx.close();
    }
    // Copy UPI ID double tap
    const ctx = await H.ctxOf(B); await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);
    const p = await H.open(B, ctx, log);
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
    await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(300);
    const cb = await box(p, '#v-pay [data-copy]');
    await p.touchscreen.tap(cb.x + cb.w / 2, cb.y + cb.h / 2); await p.waitForTimeout(150); await p.touchscreen.tap(cb.x + cb.w / 2, cb.y + cb.h / 2);
    await p.waitForTimeout(3500);
    console.log('Copy UPI ID label 3.5s after a double tap:', JSON.stringify(await p.textContent('#v-pay [data-copy]')));
    const co = await box(p, '#copyorder');
    await p.click('#copyorder'); await p.waitForTimeout(100); await p.click('#copyorder'); await p.waitForTimeout(3500);
    console.log('Copy order text label 3.5s after two clicks:', JSON.stringify(await p.textContent('#copyorder')));
    // Remove double tap in cart
    await p.click('#dclose'); await p.waitForTimeout(200);
    await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1000);
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1); await H.addVia(p, 'zig', 'Rust' === 0 ? '' : 'Grey & black', 'M', 1); await H.addVia(p, 'sol', 'Aqua', 'M', 1);
    await p.click('#cbar'); await p.waitForTimeout(300);
    const rm = await box(p, '#v-cart .line .rm');
    await p.touchscreen.tap(rm.x + rm.w / 2, rm.y + rm.h / 2); await p.waitForTimeout(120); await p.touchscreen.tap(rm.x + rm.w / 2, rm.y + rm.h / 2); await p.waitForTimeout(500);
    console.log('after double tap on first Remove, cart lines:', await p.$$eval('#v-cart .line', ls => ls.map(l => l.querySelector('small').textContent)));
    // Add-to-cart double tap
    await p.click('#dclose'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(1000);
    await p.evaluate(() => document.querySelector('.prod[data-k="sol"] [data-add]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(300);
    const ab = await box(p, '.prod[data-k="sol"] [data-add]');
    await p.touchscreen.tap(ab.x + ab.w / 2, ab.y + ab.h / 2); await p.waitForTimeout(120); await p.touchscreen.tap(ab.x + ab.w / 2, ab.y + ab.h / 2); await p.waitForTimeout(500);
    console.log('double tap Add to cart -> count', await p.textContent('#cnt'));
    console.log('LOG', log);
  } finally { await B.close(); }
})();
