// Hero: diagonal page-scroll gesture on the hero, rapid prev/next, rapid swatch dye, fly-to-cart cleanup.
const { start } = require('./h.cjs');
async function swipe(c, x0, y0, x1, y1, steps = 12, dt = 16) {
  await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let i = 1; i <= steps; i++) { await c.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + (x1 - x0) * i / steps, y: y0 + (y1 - y0) * i / steps, id: 1 }] }); await new Promise(r => setTimeout(r, dt)); }
  await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
(async () => {
  const H = await start({});
  const p = await H.page({ settle: 2500 });
  const c = await p.context().newCDPSession(p);
  const st = () => p.evaluate(() => ({ hi: SS.getHi(), auto: hero.classList.contains('auto'), y: Math.round(scrollY) }));
  // C) a mostly vertical scroll that starts on the hero copy and drifts 70px sideways
  const s0 = await st();
  await swipe(c, 300, 520, 230, 170, 14, 16);
  await p.waitForTimeout(1500);
  const s1 = await st();
  console.log('C diagonal scroll: before', s0, 'after', s1, s0.hi !== s1.hi ? 'SLIDE CHANGED ON A SCROLL' : '', s1.auto ? '' : 'AUTOPLAY STOPPED');
  // the same on the lead paragraph with smaller drift (55px over a 400px scroll)
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
  const s2 = await st();
  await swipe(c, 120, 600, 175, 200, 14, 16);
  await p.waitForTimeout(1500);
  const s3 = await st();
  console.log('C2 drift 55/400px', s2, '->', s3);

  // D) rapid next taps, then check the hero settles on a consistent state
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(500);
  for (let i = 0; i < 17; i++) { await p.evaluate(() => document.getElementById('nextBtn').click()); await p.waitForTimeout(35); }
  for (let i = 0; i < 4; i++) { await p.evaluate(() => document.getElementById('prev').click()); await p.waitForTimeout(120); }
  await p.waitForTimeout(3500);
  const d = await p.evaluate(() => {
    const hi = SS.getHi(), sl = SS.SLIDES[hi], b = SS.swatch(sl.k, sl.c), img = document.getElementById('h-img');
    const anims = document.getAnimations().filter(a => { const t = a.effect && a.effect.target; return t && document.getElementById('hero').contains(t) && a.playState !== 'finished'; }).map(a => (a.animationName || 'waapi') + ':' + a.playState + ':' + (a.effect.target.id || a.effect.target.className));
    return { hi, expectSrc: b.dataset.full, src: img.getAttribute('src'), alt: img.alt, title: document.getElementById('h-title').textContent, slideH: sl.h, out: document.getElementById('h-rug').classList.contains('out'),
      clip: getComputedStyle(img).clipPath, roll: getComputedStyle(document.querySelector('#h-rug .roll')).opacity, f: getComputedStyle(document.getElementById('hero')).getPropertyValue('--f').trim(), bg: b.dataset.bg, dyes: document.querySelectorAll('#hero .dye').length,
      price: document.getElementById('h-price').textContent, odo: document.getElementById('h-odo').textContent, count: document.getElementById('h-count') && document.getElementById('h-count').textContent, ghost: document.getElementById('h-ghost').textContent, anims };
  });
  console.log('D after rapid taps', JSON.stringify(d, null, 1));

  // E) rapid swatch clicks on the Zigzag card
  await p.evaluate(() => document.querySelector('.prod[data-k="zig"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(800);
  const sws = await p.$$('.prod[data-k="zig"] .sw');
  for (let r = 0; r < 3; r++) for (const s of sws) { await s.evaluate(b => b.click()); await p.waitForTimeout(25); }
  await p.waitForTimeout(1500);
  const e = await p.evaluate(() => { const el = document.querySelector('.prod[data-k="zig"]'), sel = el.querySelector('[aria-checked="true"]'); return { sel: sel.dataset.n, bg: sel.dataset.bg, f: el.style.getPropertyValue('--f'), fg: el.style.getPropertyValue('--fg'), dyes: el.querySelectorAll('.dye').length, img: el.querySelector('.pic img').getAttribute('src'), full: sel.dataset.full, colour: el.querySelector('[data-colour]').textContent, dock: document.getElementById('dock-t').textContent }; });
  console.log('E rapid swatches', e, e.f.toLowerCase() === e.bg.toLowerCase() ? 'OK' : 'COLOUR MISMATCH');
  // F) rapid Add to cart: fly elements cleaned up?
  for (let i = 0; i < 8; i++) { await p.evaluate(() => document.querySelector('.prod[data-k="zig"] [data-add]').click()); await p.waitForTimeout(60); }
  await p.waitForTimeout(2500);
  console.log('F fly leftovers', await p.evaluate(() => ({ fly: document.querySelectorAll('.fly').length, paths: document.querySelectorAll('#flylayer path').length, cnt: document.getElementById('cnt').textContent })));
  await H.close();
  console.log('LOG', H.log);
})().catch(e => { console.error(e); process.exit(1); });
