// Growth per cycle for try-on/zoom/saved/compare/menu, and floor-switch object URL race at several tap intervals.
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
    const u = await p.evaluate(() => __urls.size);
    console.log(label.padEnd(30), 'heapKB', Math.round(h.usedSize / 1024), 'nodes', d.nodes, 'listeners', d.jsEventListeners, 'liveURLs', u);
  }
  const photo = SNAP + '/img/s2_close.jpg';
  async function tryCycle(n) { for (let i = 0; i < n; i++) { await p.evaluate(() => SS.tryon('sol', 'Aqua')); await p.setInputFiles('#tryon-gal', photo); await p.waitForFunction(() => !document.getElementById('tryon-body').hidden); await p.evaluate(() => document.getElementById('tryon').close()); } }
  async function dlgCycle(n) { for (let i = 0; i < n; i++) { for (const id of ['#h-savedbtn', '#h-compare', '#h-menu']) { await p.evaluate(s => document.querySelector(s).click(), id); await p.waitForTimeout(30); await p.evaluate(() => document.querySelector('dialog[open]').close()); } } }
  await tryCycle(3); await dlgCycle(2); await snap('warm');
  await tryCycle(20); await snap('try-on +20');
  await tryCycle(20); await snap('try-on +40');
  await dlgCycle(20); await snap('saved/compare/menu +20');
  await dlgCycle(20); await snap('saved/compare/menu +40');
  // floor race
  await p.evaluate(() => SS.tryon('zig', 'Olive & cream'));
  await p.click('#tryon-sample'); await p.waitForFunction(() => !document.getElementById('tryon-body').hidden);
  for (const ms of [15, 30, 45, 60, 80, 100, 130, 160, 200]) {
    for (let r = 0; r < 4; r++) for (const f of ['kota', 'wood', 'marble']) { await p.evaluate(f => document.querySelector('#tryon-floors [data-f="' + f + '"]').click(), f); await p.waitForTimeout(ms); }
    await p.waitForTimeout(1200);
    console.log('floor taps every', ms, 'ms: live object URLs while open =', await p.evaluate(() => __urls.size));
  }
  await p.evaluate(() => document.getElementById('tryon').close()); await p.waitForTimeout(500);
  await snap('closed');
  await H.close();
  console.log('LOG', H.log);
})().catch(e => { console.error(e); process.exit(1); });
