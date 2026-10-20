const H = require('./h2.cjs');
(async () => {
  const B = await H.boot();
  try {
    const cases = {
      'missing p (e.g. future schema renames p->price)': [{ id: 'sol|M|Aqua', k: 'sol', size: 'M 16×24 in', colour: 'Aqua', price: 349, q: 1 }],
      'null price': [{ id: 'sol|M|Aqua', k: 'sol', size: 'M 16×24 in', colour: 'Aqua', p: null, q: 1 }],
      'missing size': [{ id: 'sol|M|Aqua', k: 'sol', colour: 'Aqua', p: 349, q: 1 }],
    };
    for (const [name, cart] of Object.entries(cases)) {
      const log = [];
      const ctx = await H.ctxOf(B);
      const p = await H.open(B, ctx, log, `try{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1);localStorage.setItem('ss_cart2',${JSON.stringify(JSON.stringify(cart))})}}catch(e){}`);
      const r = await p.evaluate(() => ({ SS: typeof window.SS, cnt: document.querySelector('#cnt').textContent, cbar: document.querySelector('#cbar').hidden ? 'hidden' : document.querySelector('#cbar').textContent, langStrip: !!document.querySelector('.langs'), stored: localStorage.getItem('ss_cart2') }));
      // try to use the shop: add a mat from a card, open drawer
      await p.evaluate(() => document.querySelector('.prod[data-k="zig"] [data-add]').click()).catch(e => log.push('click err ' + e.message));
      await p.waitForTimeout(300);
      const r2 = await p.evaluate(() => ({ cnt: document.querySelector('#cnt').textContent, lines: document.querySelectorAll('#v-cart .line').length, stored: localStorage.getItem('ss_cart2') }));
      await p.reload(); await p.waitForTimeout(1000);
      const r3 = await p.evaluate(() => ({ SS: typeof window.SS }));
      console.log('==', name, '\n  on load:', JSON.stringify(r), '\n  after tapping Add:', JSON.stringify(r2), '\n  after reload SS:', r3.SS, '\n  errors:', log.slice(0, 4));
      await ctx.close();
    }
  } finally { await B.close(); }
})();
