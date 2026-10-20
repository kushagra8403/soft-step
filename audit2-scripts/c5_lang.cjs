const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    for (const L of ['gu', 'hi']) {
      const ctx = await H.ctxOf(B);
      const p = await H.open(B, ctx, log, `try{localStorage.setItem('ss_lang','${L}')}catch(e){}`);
      await p.waitForTimeout(1500);
      console.log(L, 'html lang', await p.evaluate(() => document.documentElement.lang), 'card colour text', await p.$$eval('[data-colour]', a => a.map(x => x.textContent)));
      await H.addVia(p, 'zig', 'Forest green & black', 'M', 2);
      await H.addVia(p, 'chen', 'Berry stripe', 'H', 1);
      // fit-add and pair add
      await p.evaluate(() => document.querySelector('#fit-add') && document.querySelector('#fit-add').click());
      await p.evaluate(() => document.querySelector('[data-pair="1"]') && document.querySelector('[data-pair="1"]').click());
      await p.click('#cbar'); await p.waitForTimeout(400);
      // stepper on first line
      await p.click('#v-cart button[data-i="0"][data-d="1"]'); await p.waitForTimeout(200);
      await p.click('#v-cart button[data-i="1"][data-d="0"]'); await p.waitForTimeout(200);
      console.log(L, 'cart', (await H.state(p)).cart.map(x => x.id + ' x' + x.q), '| cbar', (await H.state(p)).cbn);
      console.log(L, 'cart line text', await p.$$eval('#v-cart .line', ls => ls.map(l => l.innerText.replace(/\n/g, ' | ')).slice(0, 2)));
      await p.click('#go'); await p.waitForTimeout(300);
      await p.click('#order-btn'); await p.waitForTimeout(200);
      console.log(L, 'empty-name error:', await p.textContent('#oerr'));
      await H.fillDetails(p, { name: 'આશા પટેલ', ad: 'ફ્લેટ 4, અલકાપુરી', ct: 'વડોદરા' });
      await p.click('#order-btn'); await p.waitForTimeout(400);
      const s = await H.state(p);
      console.log(L, 'oid', s.oid, 'payamt', s.payamt, '\n' + s.msg);
      await ctx.close();
    }
    console.log('LOG', log);
  } finally { await B.close(); }
})();
