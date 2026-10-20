// Zoom viewer: bytes downloaded while flipping colours on a phone, gestures, focus return, overflow lock.
const { start } = require('./h.cjs');
async function touch(c, type, pts) { await c.send('Input.dispatchTouchEvent', { type, touchPoints: pts }); }
(async () => {
  const H = await start({ noroute: true });
  const p = await H.page({ settle: 2500 });
  const c = await p.context().newCDPSession(p);
  await c.send('Network.enable');
  const reqs = []; const m = {};
  c.on('Network.requestWillBeSent', e => { m[e.requestId] = { url: e.request.url.replace(/^http:\/\/127\.0\.0\.1:\d+\//, '') }; });
  c.on('Network.loadingFinished', e => { const r = m[e.requestId]; if (r) { r.kb = Math.round(e.encodedDataLength / 1024); reqs.push(r); } });
  c.on('Network.requestServedFromCache', e => { const r = m[e.requestId]; if (r) r.cache = true; });
  await p.evaluate(() => document.querySelector('.prod[data-k="zig"]').scrollIntoView({ block: 'start' })); await p.waitForTimeout(1500);
  reqs.length = 0;
  // open with the corner button (keyboard path) so focus return can be checked
  await p.focus('.prod[data-k="zig"] .zopen'); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
  console.log('open', await p.evaluate(() => ({ open: document.getElementById('zoom').open, src: document.getElementById('zoom-img').getAttribute('src'), ov: document.documentElement.style.overflow, box: (() => { const r = document.getElementById('zoom-img').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; })(), nat: document.getElementById('zoom-img').naturalWidth })));
  for (let i = 0; i < 9; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150); }
  await p.waitForTimeout(6000);
  const big = reqs.filter(r => /^img\/z\d+\.webp$/.test(r.url)), small = reqs.filter(r => /^img\/m\//.test(r.url));
  console.log('flip 10 colours at 1x: 1600px webp', big.length, 'files', big.reduce((a, r) => a + (r.kb || 0), 0), 'KB; phone files', small.length, small.reduce((a, r) => a + (r.kb || 0), 0), 'KB');
  console.log(reqs.map(r => r.url + ' ' + r.kb + 'KB').join('\n'));
  // gestures: pinch out on the image
  const box = await p.evaluate(() => { const r = document.getElementById('zoom-img').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await touch(c, 'touchStart', [{ x: box.x - 30, y: box.y, id: 1 }]);
  await touch(c, 'touchStart', [{ x: box.x - 30, y: box.y, id: 1 }, { x: box.x + 30, y: box.y, id: 2 }]);
  for (let i = 1; i <= 10; i++) { await touch(c, 'touchMove', [{ x: box.x - 30 - i * 8, y: box.y, id: 1 }, { x: box.x + 30 + i * 8, y: box.y, id: 2 }]); await p.waitForTimeout(16); }
  await touch(c, 'touchEnd', [{ x: box.x + 110, y: box.y, id: 2 }]);
  await touch(c, 'touchEnd', []);
  await p.waitForTimeout(400);
  console.log('after pinch', await p.evaluate(() => ({ tf: document.getElementById('zoom-img').style.transform, n: document.getElementById('zoom-c').textContent, open: document.getElementById('zoom').open })));
  // pan while zoomed with one finger
  await touch(c, 'touchStart', [{ x: box.x, y: box.y, id: 3 }]);
  for (let i = 1; i <= 8; i++) { await touch(c, 'touchMove', [{ x: box.x + i * 20, y: box.y + i * 5, id: 3 }]); await p.waitForTimeout(16); }
  await touch(c, 'touchEnd', []);
  await p.waitForTimeout(400);
  console.log('after pan', await p.evaluate(() => ({ tf: document.getElementById('zoom-img').style.transform, n: document.getElementById('zoom-c').textContent, open: document.getElementById('zoom').open })));
  // rotate the phone while zoomed: is the image still covering its box?
  await p.setViewportSize({ width: 844, height: 390 }); await p.waitForTimeout(800);
  console.log('after rotate', await p.evaluate(() => { const i = document.getElementById('zoom-img'), r = i.getBoundingClientRect(); return { tf: i.style.transform, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], vw: innerWidth, vh: innerHeight, ow: i.offsetWidth, oh: i.offsetHeight }; }));
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
  // Escape closes and focus returns to the opener
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  console.log('after Escape', await p.evaluate(() => ({ open: document.getElementById('zoom').open, ov: document.documentElement.style.overflow, focus: document.activeElement.className + ' ' + (document.activeElement.getAttribute('aria-label') || '') })));
  await H.close();
  console.log('LOG', H.log);
})().catch(e => { console.error(e); process.exit(1); });
