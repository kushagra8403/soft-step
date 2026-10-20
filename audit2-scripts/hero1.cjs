// Hero: autoplay vs modal dialogs, CTA movement between slides, diagonal scroll, rapid taps.
const { start } = require('./h.cjs');
(async () => {
  const H = await start({});
  const p = await H.page({ settle: 2500 });
  const c = await p.context().newCDPSession(p);
  const st = () => p.evaluate(() => ({ hi: SS.getHi(), auto: hero.classList.contains('auto'), paused: hero.classList.contains('paused'), zoom: !!document.querySelector('#zoom[open]'), tryon: !!document.querySelector('#tryon[open]'), src: document.getElementById('h-img').getAttribute('src'), title: document.getElementById('h-title').textContent }));
  console.log('A0', await st());
  // A) open the zoom viewer from the hero rug (a tap), then wait past one autoplay cycle
  const ctr = async sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }, sel);
  { const [x, y] = await ctr('#h-img'); await p.touchscreen.tap(x, y); }
  await p.waitForTimeout(500);
  const a1 = await st(); console.log('A1 after tap', a1);
  await p.waitForTimeout(16000);
  const a2 = await st(); console.log('A2 16s later with viewer open', a2, a1.hi !== a2.hi ? 'SLIDE CHANGED BEHIND VIEWER' : '');
  // hand off to try-on and wait again
  await p.evaluate(() => { const b = document.getElementById('zoom-try'); if (!b.hidden) b.click(); });
  await p.waitForTimeout(600);
  const a3 = await st();
  await p.waitForTimeout(16000);
  const a4 = await st(); console.log('A3/A4 try-on open', a3.hi, '->', a4.hi, a4.tryon);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  console.log('after Escape', await st(), 'htmlOverflow', await p.evaluate(() => document.documentElement.style.overflow));
  // menu dialog
  const m0 = await st(); { const [x, y] = await ctr('#h-menu'); await p.touchscreen.tap(x, y); } await p.waitForTimeout(16000); const m1 = await st();
  console.log('menu open', await p.evaluate(() => document.getElementById('menu').open), m0.hi, '->', m1.hi);
  await p.keyboard.press('Escape'); await p.waitForTimeout(300);

  // B) where the hero buy controls sit on each slide
  await p.evaluate(() => window.scrollTo(0, 0));
  const pos = [];
  for (let i = 0; i < 6; i++) {
    await p.evaluate(i => SS.show(i, true), i); await p.waitForTimeout(900);
    pos.push(await p.evaluate(() => { const r = s => { const e = document.querySelector(s).getBoundingClientRect(); return Math.round(e.top); }; return { hi: SS.getHi(), add: r('#h-add'), sizes: r('#h-sizes'), price: r('.pricebox'), rug: Math.round(document.querySelector('#h-rug').getBoundingClientRect().height), img: document.getElementById('h-img').naturalWidth + 'x' + document.getElementById('h-img').naturalHeight }; }));
  }
  console.log('B positions', JSON.stringify(pos));
  await H.close();
  console.log('LOG', H.log);
})().catch(e => { console.error(e); process.exit(1); });
