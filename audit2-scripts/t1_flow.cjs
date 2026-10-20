const { start, addVia, fillDetails } = require('./h.cjs');
(async () => {
  const H = await start();
  try {
    const p = await H.page();
    await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(800);
    await addVia(p, 'zig', 0, 'M', 2);
    await addVia(p, 'sol', 1, 'XL', 1);
    await addVia(p, 'chen', 2, 'H', 1);
    await addVia(p, 'zig', 0, 'M', 1); // merge
    const st = await p.evaluate(() => ({ cnt: document.querySelector('#cnt').textContent, cbn: document.querySelector('#cbn').textContent, cbt: document.querySelector('#cbt').textContent, store: localStorage.getItem('ss_cart2') }));
    console.log('after add', JSON.stringify(st, null, 1));
    await p.click('#cbar');
    await p.waitForTimeout(400);
    console.log('focus after open', await p.evaluate(() => document.activeElement.id || document.activeElement.outerHTML.slice(0, 80)));
    console.log('cart lines', await p.$$eval('#v-cart .line', ls => ls.map(l => l.innerText.replace(/\n/g, ' | '))));
    await p.click('#go'); await p.waitForTimeout(300);
    console.log('focus det', await p.evaluate(() => document.activeElement.id), 'radio', await p.evaluate(() => document.querySelector('input[name=dl]:checked').value));
    await fillDetails(p, { ad: 'Flat 3 & 4, "Shanti" <Kunj>,\nNear Ram Mandir #2', em: 'a_b@x.in' });
    await p.check('#o-gift-on'); await p.fill('#o-gift', 'Happy b\'day & love — 100% from us + #1 fan');
    await p.click('#order-btn'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => ({ oid: document.querySelector('#oid').textContent, wa: document.querySelector('#sendwa').href, upi: document.querySelector('#upil').href, pay: document.querySelector('#payamt').textContent, focus: document.activeElement.id, pend: localStorage.getItem('ss_pending'), cbn: document.querySelector('#cbn').textContent }));
    console.log('oid', r.oid, 'focus', r.focus, 'payamt', r.pay);
    console.log('UPI', r.upi);
    const u = new URL(r.wa); console.log('WA host', u.host, u.pathname); console.log('---MSG---\n' + u.searchParams.get('text') + '\n---');
    console.log('pend', r.pend.slice(0, 200));
    console.log('LOG', H.log);
  } finally { await H.close(); }
})();
