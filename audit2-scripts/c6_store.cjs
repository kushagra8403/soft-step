const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    const ctx = await H.ctxOf(B);
    const seed = async (cart, pend) => {
      const p = await H.open(B, ctx, log);
      await p.evaluate(([c, pd]) => { localStorage.clear(); if (c != null) localStorage.setItem('ss_cart2', c); if (pd != null) localStorage.setItem('ss_pending', pd); }, [cart, pend]);
      await p.reload(); await p.waitForTimeout(1000); return p;
    };
    // 1. stale price (price raised from 249 to e.g. 279 in a later deploy; cart saved before)
    let p = await seed(JSON.stringify([{ id: 'zig|M|Rust?', k: 'zig', size: 'M 16×24 in', colour: 'Forest green & black', p: 199, q: 2 }]), null);
    await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(300);
    let s = await H.state(p);
    console.log('1. stored p=199 for Zigzag M (page price ₹249): bar', s.cbt, '| payamt', s.payamt, '| UPI', s.upi.match(/am=[^&]*/)[0], '|', s.msg.split('\n')[2]);
    // merge after restore: the stored line has a different id than addToCart builds -> duplicate line
    await p.click('#editorder'); await p.click('#dclose');
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
    s = await H.state(p); console.log('1b. same mat added again ->', s.cart.map(x => x.id + ' @' + x.p + ' x' + x.q));
    await p.close();
    // 2. item missing fields (partial/garbled write)
    p = await seed(JSON.stringify([{ k: 'sol', q: 1 }]), null);
    s = await H.state(p);
    console.log('2. item {k,q} only: bar', s.cbn, s.cbt, '| line', await p.$$eval('#v-cart .line', ls => ls.map(l => l.innerText.replace(/\n/g, ' | '))));
    await p.close();
    // 3. q as string
    p = await seed(JSON.stringify([{ id: 'zig|M|Forest green & black', k: 'zig', size: 'M 16×24 in', colour: 'Forest green & black', p: 249, q: '2' }]), null);
    s = await H.state(p); console.log('3. q:"2" -> count', s.cnt, s.cbn, s.cbt);
    await p.close();
    // 4. corrupted pending JSON, old pending schema, expired pending
    const good = [{ id: 'zig|M|Forest green & black', k: 'zig', size: 'M 16×24 in', colour: 'Forest green & black', p: 249, q: 1 }];
    const sig = JSON.stringify([['zig', 'M 16×24 in', 'Forest green & black', 1]]);
    p = await seed(JSON.stringify(good), '{"oid":"SS-1');
    s = await H.state(p); console.log('4a. corrupted pending JSON -> bar', s.cbn, '| raw still stored:', await p.evaluate(() => localStorage.getItem('ss_pending')));
    await p.close();
    p = await seed(JSON.stringify(good), JSON.stringify({ oid: 'SS-OLD', msg: 'x', t: 249, sig }));
    s = await H.state(p); console.log('4b. pending without at -> bar', s.cbn, '| stored', s.pend);
    await p.close();
    p = await seed(JSON.stringify(good), JSON.stringify({ oid: 'SS-OLD2', msg: 'New order SS-OLD2', t: 249, nm: 'A', sig, at: Date.now() - 6 * 864e5, sent: false }));
    s = await H.state(p); console.log('4c. 6-day old pending -> bar', s.cbn, '| payamt', s.payamt);
    await p.close();
    // 5. very long cart: every colour x every size
    p = await seed('[]', null);
    await p.evaluate(() => { document.querySelectorAll('.prod').forEach(el => { const k = el.dataset.k; el.querySelectorAll('[data-n]').forEach(b => { for (let i = 0; i < 4; i++) SS.addToCart(k, i, b.dataset.n, 3); }); }); });
    await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(400);
    s = await H.state(p);
    const href = await p.getAttribute('#sendwa', 'href');
    console.log('5. lines', s.cart.length, '| msg chars', s.msg.length, '| wa.me URL length', href.length, '| total', s.payamt);
    await p.close();
    // 6. phone / pin / email validation table
    p = await seed('[]', null);
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1); await p.click('#cbar'); await p.click('#go');
    const phones = ['+91 98765 43210', '098765 43210', '+91-98765-43210', '0091 98765 43210', '+91 098765 43210', '98765.43210', '98765 43210 ', '+91 (987) 654-3210', '१२३'];
    for (const ph of phones) { await H.fillDetails(p, { ph }); await p.click('#order-btn'); await p.waitForTimeout(150); const ok = await p.evaluate(() => !document.querySelector('#v-pay').hidden); console.log('6. phone', JSON.stringify(ph), ok ? 'accepted' : 'rejected: ' + await p.textContent('#oerr')); if (ok) { await p.click('#editorder'); await p.click('#go'); } }
    await ctx.close();
    console.log('LOG', log);
  } finally { await B.close(); }
})();
