const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    const ctx = await H.ctxOf(B);
    const p = await H.open(B, ctx, log);
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
    await p.click('#cbar'); await p.click('#go'); await H.fillDetails(p); await p.click('#order-btn'); await p.waitForTimeout(300);
    const a = await H.state(p);
    console.log('pay step:', a.oid, a.payamt, '| bar after closing:');
    // customer pays in the UPI app (not modelled), comes back, closes the drawer and adds a bath mat before sending
    await p.click('#dclose'); await p.waitForTimeout(200);
    console.log('  ', (await H.state(p)).cbn);
    await H.addVia(p, 'sol', 'Aqua', 'M', 1); await p.waitForTimeout(200);
    const b = await H.state(p);
    console.log('after adding one more mat: bar =', JSON.stringify(b.cbn), '| toast =', JSON.stringify(await p.textContent('#toast')), '| ss_pending =', b.pend);
    await p.click('#cbar'); await p.waitForTimeout(300);
    console.log('drawer now opens on', (await H.state(p)).view, '(the paid order', a.oid, 'is gone)');
    await p.click('#go'); await p.click('#order-btn'); await p.waitForTimeout(300);
    const c = await H.state(p);
    console.log('re-placed:', c.oid, c.payamt, c.upi.match(/am=\d+/)[0], '| message mentions', a.oid.slice(1), ':', c.msg.includes(a.oid.slice(1)));
    console.log('LOG', log);
  } finally { await B.close(); }
})();
