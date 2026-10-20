// Load performance at 390x844, CPU 4x, Slow 4G (562.5ms RTT, 1.44 Mbps down, 675 kbps up).
const { start } = require('./h.cjs');
const INIT = () => {
  window.__perf = { lcp: [], cls: [], lt: [], paint: [] };
  try { new PerformanceObserver(l => l.getEntries().forEach(e => __perf.lcp.push({ t: Math.round(e.startTime), size: e.size, el: e.element ? (e.element.tagName + '#' + e.element.id + '.' + e.element.className) : null, url: e.url }))).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) __perf.cls.push({ t: Math.round(e.startTime), v: e.value, src: (e.sources || []).map(s => s.node ? (s.node.nodeName + '#' + (s.node.id || '') + '.' + (s.node.className && s.node.className.baseVal === undefined ? s.node.className : '')).slice(0, 80) + ' ' + JSON.stringify(s.previousRect) + '->' + JSON.stringify(s.currentRect) : '?') }); })).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => l.getEntries().forEach(e => __perf.lt.push({ t: Math.round(e.startTime), d: Math.round(e.duration), a: (e.attribution || []).map(a => a.containerSrc || a.name).join(',') }))).observe({ type: 'longtask', buffered: true }); } catch (e) {}
  try { new PerformanceObserver(l => l.getEntries().forEach(e => __perf.paint.push({ n: e.name, t: Math.round(e.startTime) }))).observe({ type: 'paint', buffered: true }); } catch (e) {}
};
(async () => {
  const rm = process.argv[2] === 'rm';
  const nolang = process.argv.includes('nolang');
  const H = await start({ ctx: { reducedMotion: rm ? 'reduce' : 'no-preference' }, block: nolang ? /^\/lang\.js$/ : null, noroute: true });
  const reqs = [];
  const p = await H.page({ init: INIT, settle: 0, waitUntil: 'commit', before: async (pg) => {
    const c = await pg.context().newCDPSession(pg);
    await c.send('Network.enable');
    
    await c.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375 });
    await c.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const m = {};
    c.on('Network.requestWillBeSent', e => { m[e.requestId] = { url: e.request.url, t0: e.timestamp, type: e.type, prio: e.request.initialPriority }; });
    c.on('Network.loadingFinished', e => { const r = m[e.requestId]; if (r) { r.bytes = e.encodedDataLength; r.t1 = e.timestamp; reqs.push(r); } });
    c.on('Network.loadingFailed', e => { const r = m[e.requestId]; if (r) { r.failed = e.errorText; r.t1 = e.timestamp; reqs.push(r); } });
    pg.__cdp = c;
  } });
  const t0 = Date.now();
  await p.waitForLoadState('load', { timeout: 180000 });
  const loadMs = Date.now() - t0;
  await p.waitForTimeout(8000);
  const perf = await p.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    return Object.assign({}, __perf, { dcl: Math.round(nav.domContentLoadedEventEnd), load: Math.round(nav.loadEventEnd) });
  });
  const fcp = (perf.paint.find(x => x.n === 'first-contentful-paint') || {}).t || 0;
  const tbt = perf.lt.filter(x => x.t >= fcp).reduce((a, x) => a + Math.max(0, x.d - 50), 0);
  let cls = 0, win = 0, last = -1e9, first = -1e9; // session windows
  perf.cls.forEach(e => { if (e.t - last > 1000 || e.t - first > 5000) { win = 0; first = e.t; } win += e.v; last = e.t; cls = Math.max(cls, win); });
  console.log(JSON.stringify({ rm, nolang, fcp, lcp: perf.lcp, dcl: perf.dcl, load: perf.load, tbt, cls: +cls.toFixed(4), clsEntries: perf.cls, longtasks: perf.lt }, null, 1));
  const base = reqs[0] ? reqs[0].t0 : 0;
  const rows = reqs.filter(r => !/^data:/.test(r.url)).map(r => ({ u: r.url.replace(/^http:\/\/127\.0\.0\.1:\d+\//, ''), kb: Math.round((r.bytes || 0) / 1024), s: +(r.t0 - base).toFixed(2), e: +((r.t1 || 0) - base).toFixed(2), p: r.prio, f: r.failed }));
  rows.sort((a, b) => a.s - b.s);
  rows.forEach(r => console.log(r.s.toFixed(2).padStart(6), r.e.toFixed(2).padStart(6), String(r.kb).padStart(5) + 'KB', (r.p || '').padEnd(8), r.u.slice(0, 110), r.f || ''));
  const tot = rows.reduce((a, r) => a + r.kb, 0);
  const byUrl = {}; rows.forEach(r => byUrl[r.u] = (byUrl[r.u] || 0) + 1);
  console.log('TOTAL KB', tot, 'requests', rows.length, 'loadMs(wall)', loadMs);
  console.log('DUP URLS', Object.entries(byUrl).filter(([u, n]) => n > 1));
  const stems = {}; rows.filter(r => /^img\//.test(r.u)).forEach(r => { const st = r.u.replace(/^img\/(m\/|t\/)?/, '').replace(/\.\w+$/, ''); (stems[st] = stems[st] || []).push(r.u); });
  console.log('SAME IMAGE, SEVERAL FILES', Object.entries(stems).filter(([s, l]) => l.length > 1 && l.some(x => !/^img\/t\//.test(x)) && l.filter(x => !/^img\/t\//.test(x)).length > 1));
  console.log('LOG', H.log);
  await H.close();
})().catch(e => { console.error(e); process.exit(1); });
