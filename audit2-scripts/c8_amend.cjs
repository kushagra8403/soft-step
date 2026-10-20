const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    const ctx = await H.ctxOf(B);
    const p = await H.open(B, ctx, log);
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
    await H.addVia(p, 'sol', 'Aqua', 'L', 1);
    await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(300);
    const first = await H.state(p);
    const [pop] = await Promise.all([ctx.waitForEvent('page'), p.click('#sendwa')]); await pop.close(); await p.waitForTimeout(900);
    console.log('order 1', first.oid, first.payamt, '| sentbox:', await p.evaluate(() => !document.querySelector('#sentbox').hidden), '| "Change something" link visible:', await p.isVisible('#editorder'));
    await p.click('#editorder'); await p.waitForTimeout(200);
    await p.click('#v-cart button[data-i="0"][data-d="1"]'); await p.waitForTimeout(200);
    await p.click('#go'); await p.waitForTimeout(200); await p.click('#order-btn'); await p.waitForTimeout(300);
    const second = await H.state(p);
    console.log('amended ->', second.oid, '| pay', second.payamt, '| UPI', second.upi.match(/am=\d+/)[0], '| mentions first order id:', second.msg.includes(first.oid.slice(1)), '| sentbox:', await p.evaluate(() => !document.querySelector('#sentbox').hidden));
    console.log(second.msg.split('\n').slice(0, 5).join('\n'));
    // double tap on "−" when qty is 1
    await p.click('#editorder'); await p.waitForTimeout(200);
    await p.click('#v-cart button[data-i="0"][data-d="-1"]'); await p.click('#v-cart button[data-i="0"][data-d="-1"]'); // qty 2 -> 0? first line had q2
    const r = await p.evaluate(() => { const b = document.querySelector('#v-cart button[data-i="0"][data-d="-1"]').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    console.log('cart before double tap on −:', (await H.state(p)).cart.map(x => x.colour + ' x' + x.q));
    await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(120); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(400);
    console.log('cart after double tap on −:', (await H.state(p)).cart.map(x => x.colour + ' x' + x.q));
    console.log('LOG', log);
  } finally { await B.close(); }
})();
