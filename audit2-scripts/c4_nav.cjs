const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    // A. Back button while in the checkout drawer
    {
      const ctx = await H.ctxOf(B);
      const p = await ctx.newPage(); await require(H.SP + '/qa.cjs').prep(p, log);
      await p.goto('data:text/html,<title>Instagram</title><a id=l href="' + B.s.url + 'softsteps.html">shop</a>');
      await p.click('#l'); await p.waitForLoadState('load'); await p.waitForTimeout(1000);
      await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
      await p.click('#cbar'); await p.click('#go'); await p.waitForTimeout(200);
      await p.fill('#o-name', 'Asha'); await p.fill('#o-ph', '9876543210');
      console.log('A. history.length in drawer/details:', await p.evaluate(() => history.length), 'url', p.url().slice(0, 60));
      await p.goBack({ timeout: 30000 }).catch(e => console.log('goBack err', e.message));
      await p.waitForTimeout(800);
      console.log('A. after Back: url =', p.url().slice(0, 60), '| title =', await p.title());
      await p.goForward(); await p.waitForTimeout(1500);
      const st = await H.state(p);
      console.log('A. after Forward: drawer open =', st.drawer, '| name field =', JSON.stringify(await p.inputValue('#o-name')));
      await ctx.close();
    }
    // B. Two tabs: items added in one tab are lost when the other tab writes
    {
      const ctx = await H.ctxOf(B);
      const a = await H.open(B, ctx, log), b = await H.open(B, ctx, log);
      await H.addVia(a, 'zig', 'Forest green & black', 'M', 1);
      await H.addVia(a, 'sol', 'Aqua', 'L', 1);
      await H.addVia(b, 'chen', 'Navy stripe', 'XL', 1);
      await a.reload(); await a.waitForTimeout(1000);
      const s = await H.state(a);
      console.log('B. tab A added zig+sol, tab B (opened earlier) added chen; tab A after reload has:', s.cart.map(x => x.id));
      await ctx.close();
    }
    // C. Order sent on WhatsApp, visitor comes back later and adds a new mat
    {
      const ctx = await H.ctxOf(B);
      const p = await H.open(B, ctx, log);
      await H.addVia(p, 'zig', 'Forest green & black', 'M', 2);
      await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(300);
      const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#sendwa')]); await pop.close();
      await p.waitForTimeout(900);
      let s = await H.state(p);
      console.log('C. after Send: pend.sent =', s.pend.sent, '| sentbox visible =', await p.evaluate(() => !document.querySelector('#sentbox').hidden), '| cbn =', s.cbn);
      await p.click('#dclose'); await p.reload(); await p.waitForTimeout(1000);
      s = await H.state(p);
      console.log('C. next visit: cbar =', JSON.stringify(s.cbn), s.cbt, '| cart =', s.cart.map(x => x.id + ' x' + x.q));
      await H.addVia(p, 'sol', 'Aqua', 'M', 1);
      s = await H.state(p);
      console.log('C. after adding a new mat: cbar =', JSON.stringify(s.cbn), s.cbt, '| pending =', s.pend, '| cart =', s.cart.map(x => x.id + ' x' + x.q));
      await p.click('#cbar'); await p.waitForTimeout(300);
      console.log('C. drawer opens on view:', (await H.state(p)).view, '| lines:', await p.$$eval('#v-cart .line small:first-of-type', l => l.map(x => x.textContent)));
      await ctx.close();
    }
    // D. Refresh mid-checkout (details step) and on pay step
    {
      const ctx = await H.ctxOf(B);
      const p = await H.open(B, ctx, log);
      await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
      await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p, { ct: 'Mumbai', pin: '400001' });
      await p.reload(); await p.waitForTimeout(1000);
      let s = await H.state(p);
      console.log('D. reload on details: drawer open =', s.drawer, '| cbar =', s.cbn, '| name kept =', JSON.stringify(await p.inputValue('#o-name')));
      await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p, { ct: 'Mumbai', pin: '400001' }); await p.click('#order-btn'); await p.waitForTimeout(300);
      const oid = (await H.state(p)).oid;
      await p.reload(); await p.waitForTimeout(1000);
      s = await H.state(p);
      console.log('D. reload on pay: cbar =', s.cbn, '| cbar hidden =', s.cbarHidden, '| oid =', s.oid, '(was', oid + ') | payamt =', s.payamt);
      await p.click('#cbar'); await p.waitForTimeout(300); s = await H.state(p);
      console.log('D. tapping bar opens view', s.view, 'focus', s.active);
      await ctx.close();
    }
    // E. Storage blocked entirely (getter throws, like a sandboxed frame without same-origin)
    {
      const ctx = await H.ctxOf(B);
      const p = await H.open(B, ctx, log, () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } }); });
      await H.addVia(p, 'zig', 'Forest green & black', 'M', 1); await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
      await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(300);
      const s = await p.evaluate(() => ({ oid: document.querySelector('#oid').textContent, cnt: document.querySelector('#cnt').textContent, view: !document.querySelector('#v-pay').hidden }));
      console.log('E. storage blocked flow:', JSON.stringify(s));
      await ctx.close();
    }
    console.log('LOG', log);
  } finally { await B.close(); }
})();
