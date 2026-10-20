// Floor-switch object URL race on a 4x-throttled CPU at human tap speeds; blob sizes.
const { start } = require('./h.cjs');
const INIT = () => {
  const live = window.__urls = new Map();
  const mk = URL.createObjectURL.bind(URL), rv = URL.revokeObjectURL.bind(URL);
  URL.createObjectURL = function (o) { const u = mk(o); live.set(u, o.size); return u; };
  URL.revokeObjectURL = function (u) { live.delete(u); return rv(u); };
};
(async () => {
  const H = await start({});
  const p = await H.page({ init: INIT, settle: 2500 });
  const c = await p.context().newCDPSession(p);
  await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.evaluate(() => SS.tryon('zig', 'Olive & cream'));
  await p.evaluate(() => document.getElementById('tryon-sample').click()); await p.waitForFunction(() => !document.getElementById('tryon-body').hidden);
  const t0 = Date.now(); await p.evaluate(() => document.querySelector('#tryon-floors [data-f="kota"]').click());
  await p.waitForFunction(() => document.getElementById('tryon-photo').alt.includes('kota') && document.getElementById('tryon-photo').complete);
  console.log('one floor switch takes ~', Date.now() - t0, 'ms (4x CPU)');
  for (const ms of [250, 400, 600]) {
    for (let r = 0; r < 3; r++) for (const f of ['wood', 'marble', 'kota']) { await p.evaluate(f => document.querySelector('#tryon-floors [data-f="' + f + '"]').click(), f); await p.waitForTimeout(ms); }
    await p.waitForTimeout(2500);
    console.log('taps every', ms, 'ms -> live blob URLs', await p.evaluate(() => [...__urls.values()].map(s => Math.round(s / 1024) + 'KB').join(',')));
  }
  await p.evaluate(() => document.getElementById('tryon').close()); await p.waitForTimeout(500);
  console.log('after close, never revoked:', await p.evaluate(() => [...__urls.values()].map(s => Math.round(s / 1024) + 'KB').join(',')));
  await H.close();
  console.log('LOG', H.log);
})().catch(e => { console.error(e); process.exit(1); });
