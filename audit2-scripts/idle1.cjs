// Idle cost after load, 390x844 phone (touch) and 1440x900 desktop: main-thread time, rAF callbacks, frames drawn, running animations.
const { start } = require('./h.cjs');
const INIT = () => {
  window.__raf = 0; const r = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (f) { window.__raf++; return r(f); };
  window.__timers = 0; const si = window.setInterval.bind(window); window.setInterval = function (f, ms) { window.__timers++; return si(f, ms); };
};
async function trace(c, ms) {
  const ev = [];
  c.on('Tracing.dataCollected', e => ev.push(...e.value));
  const done = new Promise(res => c.once('Tracing.tracingComplete', res));
  await c.send('Tracing.start', { categories: 'devtools.timeline,disabled-by-default-devtools.timeline.frame,cc,viz', transferMode: 'ReportEvents' });
  await new Promise(r => setTimeout(r, ms));
  await c.send('Tracing.end'); await done;
  const cnt = n => ev.filter(e => e.name === n).length;
  return { DrawFrame: cnt('DrawFrame'), BeginMainThreadFrame: cnt('BeginMainThreadFrame'), Paint: cnt('Paint'), UpdateLayoutTree: cnt('UpdateLayoutTree'), Layout: cnt('Layout'), FireAnimationFrame: cnt('FireAnimationFrame'), TimerFire: cnt('TimerFire') };
}
async function metrics(c) { const m = (await c.send('Performance.getMetrics')).metrics; const o = {}; m.forEach(x => o[x.name] = x.value); return o; }
async function measure(p, c, label, ms = 10000) {
  await p.waitForTimeout(1500);
  const r0 = await p.evaluate(() => __raf), m0 = await metrics(c);
  const tr = await trace(c, ms);
  const r1 = await p.evaluate(() => __raf), m1 = await metrics(c);
  const anims = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => (a.animationName || 'waapi') + '@' + ((a.effect.target && (a.effect.target.id || String(a.effect.target.className).split(' ')[0])) || '?') + (a.pending ? '' : '')));
  const d = k => ((m1[k] - m0[k]) * 1000).toFixed(0);
  console.log(label.padEnd(34), 'per', ms / 1000 + 's: task', d('TaskDuration') + 'ms script', d('ScriptDuration') + 'ms style', d('RecalcStyleDuration') + 'ms layout', d('LayoutDuration') + 'ms; rAF calls', r1 - r0, JSON.stringify(tr), 'running:', anims.join(','));
}
(async () => {
  for (const [w, h, touch, rm] of [[390, 844, true, false], [390, 844, true, true], [1440, 900, false, false]]) {
    const H = await start({ ctx: { viewport: { width: w, height: h }, hasTouch: touch, isMobile: touch, deviceScaleFactor: touch ? 2 : 1, reducedMotion: rm ? 'reduce' : 'no-preference' } });
    const p = await H.page({ init: INIT, settle: 4000 });
    const c = await p.context().newCDPSession(p);
    await c.send('Performance.enable');
    const tag = w + (rm ? ' RM' : '');
    await measure(p, c, tag + ' top (autoplay on)');
    await p.evaluate(() => document.getElementById('h-play') && !document.getElementById('h-play').hidden && document.getElementById('h-play').click());
    await measure(p, c, tag + ' top, slideshow paused');
    await p.evaluate(() => scrollTo(0, document.getElementById('colours').offsetTop)); await measure(p, c, tag + ' colours section');
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await measure(p, c, tag + ' bottom of page');
    console.log('setInterval timers', await p.evaluate(() => __timers), 'LOG', H.log.slice(0, 3));
    await H.close();
  }
})().catch(e => { console.error(e); process.exit(1); });
