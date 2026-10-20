// Memory and object-URL lifecycle: zoom, try-on (photo + sample floors), drawer, 20 cycles each.
const { start, SNAP } = require('./h.cjs');
const INIT = () => {
  const live = window.__urls = new Set(); window.__urlStats = { made: 0, revoked: 0 };
  const mk = URL.createObjectURL.bind(URL), rv = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = function (o) { const u = mk(o); live.add(u); __urlStats.made++; return u; };
  URL.revokeObjectURL = function (u) { if (live.delete(u)) __urlStats.revoked++; return rv(u); };
};
(async () => {
  const H = await start({ ctx: { deviceScaleFactor: 1 } });
  const p = await H.page({ init: INIT, settle: 2500 });
  const c = await p.context().newCDPSession(p);
  async function snap(label) {
    await c.send('HeapProfiler.collectGarbage'); await p.waitForTimeout(300); await c.send('HeapProfiler.collectGarbage');
    const h = await c.send('Runtime.getHeapUsage'), d = await c.send('Memory.getDOMCounters');
    const u = await p.evaluate(() => ({ live: __urls.size, made: __urlStats.made, revoked: __urlStats.revoked }));
    console.log(label.padEnd(26), 'heapMB', (h.usedSize / 1048576).toFixed(2), 'nodes', d.nodes, 'listeners', d.jsEventListeners, 'docs', d.documents, 'objectURLs', JSON.stringify(u));
  }
  await snap('baseline');
  // zoom 20x
  for (let i = 0; i < 20; i++) { await p.evaluate(() => SS.zoom('zig', 'Navy & cream')); await p.waitForTimeout(250); await p.evaluate(() => document.getElementById('zoom').close()); await p.waitForTimeout(50); }
  await snap('after zoom x20');
  // drawer 20x
  for (let i = 0; i < 20; i++) { await p.evaluate(() => SS.openD('cart')); await p.waitForTimeout(80); await p.evaluate(() => SS.closeD()); await p.waitForTimeout(40); }
  await snap('after drawer x20');
  // try-on with a photo 20x
  const photo = SNAP + '/img/s2_close.jpg';
  for (let i = 0; i < 20; i++) {
    await p.evaluate(() => SS.tryon('sol', 'Aqua'));
    await p.setInputFiles('#tryon-gal', photo);
    await p.waitForFunction(() => !document.getElementById('tryon-body').hidden, null, { timeout: 30000 });
    await p.evaluate(() => document.getElementById('tryon').close()); await p.waitForTimeout(50);
  }
  await snap('after try-on photo x20');
  // sample floor, then rapid floor switching
  await p.evaluate(() => SS.tryon('zig', 'Olive & cream'));
  await p.click('#tryon-sample');
  await p.waitForFunction(() => !document.getElementById('tryon-body').hidden, null, { timeout: 30000 });
  await snap('sample floor shown');
  for (let r = 0; r < 10; r++) for (const f of ['kota', 'wood', 'marble']) { await p.evaluate(f => document.querySelector('#tryon-floors [data-f="' + f + '"]').click(), f); await p.waitForTimeout(r < 5 ? 5 : 400); }
  await p.waitForTimeout(1500);
  await snap('after 30 floor switches');
  await p.evaluate(() => document.getElementById('tryon').close()); await p.waitForTimeout(300);
  await snap('try-on closed');
  // new photo while the previous one is still decoding
  await p.evaluate(() => SS.tryon('sol', 'Aqua'));
  for (let i = 0; i < 6; i++) { await p.setInputFiles('#tryon-gal', photo); }
  await p.waitForFunction(() => !document.getElementById('tryon-body').hidden, null, { timeout: 30000 });
  await p.evaluate(() => document.getElementById('tryon').close()); await p.waitForTimeout(300);
  await snap('6 quick photos, closed');
  await H.close();
  console.log('LOG', H.log);
})().catch(e => { console.error(e); process.exit(1); });
