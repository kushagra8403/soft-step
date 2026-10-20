const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    const ctx = await H.ctxOf(B); const p = await H.open(B, ctx, log);
    await H.addVia(p, 'zig', 'Forest green & black', 'M', 1);
    await p.click('#cbar'); await p.waitForTimeout(300);
    const r = await p.evaluate(() => { const b = document.querySelector('#go').getBoundingClientRect(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; });
    await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(120); await p.touchscreen.tap(r.x, r.y); await p.waitForTimeout(400);
    console.log('double tap "Continue to delivery details": view', (await H.state(p)).view, '| error:', JSON.stringify(await p.textContent('#oerr')), '| focus:', await p.evaluate(() => document.activeElement.id), '| name aria-invalid:', await p.getAttribute('#o-name', 'aria-invalid'));
    console.log('LOG', log);
  } finally { await B.close(); }
})();
