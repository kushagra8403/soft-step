// Soft Steps — integration test: the real admin (admin.js) + the real shop (softsteps.html and modules) on the mocked
// claude.ai runtime, inside the platform's exact wrapper.
// Usage: NODE_PATH=$(npm root -g) node tests/integ.cjs
//  1. index.html = stored wrapper first line + softsteps.html + "\n</body></html>", served byte-for-byte.
//  2. Owner session 1 (phone) edits prices, a size, stock, hides, a photo, two new colours and a 3-language notice
//     through the editor UI, then publishes. The published document must differ from the served one ONLY inside
//     the catalog markers.
//  3. The published document is served as a fresh page; a shopper checks every change in English, Gujarati and Hindi
//     (cards, colour index, hero, dock, pairs, try-on, zoom, saved, compare, fit tool, notice, cart → WhatsApp + UPI).
//  4. Owner session 2 (desktop, page opened at "/") loads the published page, sees the published state in the editor,
//     edits again (undo some, delete an added colour, original photo, notice off) and publishes; shopper re-checks.
//  5. Owner session 3 edits the second published page once more (third round trip).
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const SP = path.resolve(__dirname, '../..');
const WORK = path.join(SP, 'work-admin'), SITE = path.join(WORK, 'site'), T = path.join(WORK, 'tests'), SHOTS = path.join(WORK, 'shots-integ');
const PHOTOS = [path.join(SP, 'tryon_test/doorway.jpg'), path.join(SITE, 'img/s2_close.jpg'), path.join(SITE, 'img/z3.webp')];
const { prep } = require(path.join(SP, 'qa.cjs'));
const MOCK = fs.readFileSync(T + '/mock-claude.js', 'utf8');
const START = '<!--ss-catalog:start-->', END = '<!--ss-catalog:end-->';
const OPEN_TAG = '<script type="application/json" id="ss-catalog">', CLOSE_TAG = '</script>';
// The exact first line of the live artifact's stored index.html (wrapper prefix + "\n").
const WRAP = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n', TAIL = '\n</body></html>';

let pass = 0, fail = 0; const fails = [];
function ok(cond, label, got) { if (cond) pass++; else { fail++; fails.push(label + (got !== undefined ? '  got: ' + JSON.stringify(got).slice(0, 400) : '')); } console.log((cond ? 'PASS ' : 'FAIL ') + label + (!cond && got !== undefined ? '  got: ' + JSON.stringify(got).slice(0, 400) : '')); }
function eq(got, want, label) { ok(JSON.stringify(got) === JSON.stringify(want), label + (JSON.stringify(got) === JSON.stringify(want) ? '' : ' (want ' + JSON.stringify(want).slice(0, 300) + ')'), got); }

/* ------------------------------------------------------------------ serving */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.avif': 'image/avif' };
function rawServe(dir, inject) {   // inject(html) → the served copy of index.html (a server that adds runtime code)
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const p = path.join(dir, u);
      if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
      if (inject && u.endsWith('/index.html')) return r.end(inject(fs.readFileSync(p, 'utf8')));
      fs.createReadStream(p).pipe(r);
    });
    srv.listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}
function siteDir(name, html) {
  const dir = T + '/' + name;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(SITE)) { if (f === 'softsteps.html') continue; fs.symlinkSync(fs.realpathSync(path.join(SITE, f)), path.join(dir, f)); }
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  return dir;
}
function get(url) { return new Promise((res, rej) => http.get(url, r => { let b = ''; r.setEncoding('utf8'); r.on('data', d => b += d); r.on('end', () => res(b)); }).on('error', rej)); }

const blobs = new Map();
async function context(b, vp, cfg = {}) {
  const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 1, hasTouch: vp[0] < 800 });
  const ls = Object.assign({ mock_canEdit: cfg.owner ? '1' : '0' }, cfg.ls || {});
  await ctx.addInitScript(o => {
    try {
      if (!sessionStorage.getItem('__seeded')) {
        sessionStorage.setItem('__seeded', '1');
        for (const k in o.ls) localStorage.setItem(k, o.ls[k]);
        if (o.lang) localStorage.setItem('ss_lang', o.lang);
        if (o.saved) localStorage.setItem('ss_saved', JSON.stringify(o.saved));
      }
    } catch (e) {}
  }, { ls, lang: cfg.lang, saved: cfg.saved });
  await ctx.addInitScript({ content: MOCK });
  await ctx.exposeBinding('__mockBlobSink', (src, id, type, b64) => { blobs.set(id, { type, body: Buffer.from(b64, 'base64') }); return true; });
  await ctx.route(/\/_blob\/[0-9a-f]{32}$/, r => { const id = r.request().url().slice(-32), x = blobs.get(id); return x ? r.fulfill({ status: 200, contentType: x.type, body: x.body }) : r.fulfill({ status: 404, body: '' }); });
  await ctx.route(/wa\.me|api\.whatsapp/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa</p>' }));
  const page = await ctx.newPage(); page.setDefaultTimeout(45000);
  const log = []; await prep(page, log);
  const reqs = []; page.on('request', r => reqs.push(r.url()));
  return { ctx, page, log, reqs };
}
function errs(log) { return log.filter(l => !/REQFAIL.*(img|\.jpg|\.webp|\.avif|_blob)/.test(l)); }

/* ------------------------------------------------------------------ document checks */
function split(html) {
  const a = html.indexOf(START), b = html.indexOf(END);
  return { count: [html.split(START).length - 1, html.split(END).length - 1], before: html.slice(0, a + START.length), inner: html.slice(a + START.length, b), after: html.slice(b) };
}
function blockJSON(inner) {
  if (!inner.startsWith(OPEN_TAG) || !inner.endsWith(CLOSE_TAG)) return { err: 'block form' };
  const json = inner.slice(OPEN_TAG.length, -CLOSE_TAG.length);
  try { return { json, cat: JSON.parse(json) }; } catch (e) { return { err: e.message, json }; }
}
function checkDoc(src, pub, L) {
  const A = split(src), B = split(pub);
  ok(pub.startsWith(WRAP) && pub.endsWith(TAIL), L + ' published doc keeps the exact platform wrapper');
  eq(B.count, [1, 1], L + ' one start and one end marker');
  // the first and last differing bytes must both sit between the markers
  let i = 0; while (i < src.length && i < pub.length && src[i] === pub[i]) i++;
  let j = 0; while (j < src.length - i && j < pub.length - i && src[src.length - 1 - j] === pub[pub.length - 1 - j]) j++;
  ok(i >= A.before.length && src.length - j <= src.indexOf(END) && pub.length - j <= pub.indexOf(END), L + ' differs ONLY inside the markers', { firstDiff: i, startInner: A.before.length });
  ok(A.before === B.before && A.after === B.after, L + ' byte-identical outside the markers');
  const pj = blockJSON(B.inner);
  ok(!pj.err && pj.json.indexOf('<') < 0, L + ' block in contract form, no raw "<"', pj.err);
  return pj.cat;
}

/* ------------------------------------------------------------------ admin UI helpers */
const fk = v => `#ssadm [data-fk="${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
const settle = (page, ms = 350) => page.waitForTimeout(ms);
async function tab(page, t) { await page.click(fk('tab|' + t)); await page.waitForSelector(`#ssadm .ssa-tab[data-tab="${t}"][aria-selected="true"]`); await settle(page); }
async function range(page, k) { if (await page.getAttribute(fk('range|' + k), 'aria-checked') !== 'true') await page.click(fk('range|' + k)); await page.waitForSelector(fk('range|' + k) + '[aria-checked="true"]'); }
async function choosePhoto(page, sel, file) { const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click(sel)]); await fc.setFiles(file); }
async function setColourInput(page, hex) { await page.evaluate(h => { const i = document.querySelector('#ssadm [data-fk="new-colour"]'); i.value = h; i.dispatchEvent(new Event('input', { bubbles: true })); }, hex); }
async function addColour(page, k, name, file, hex) {
  await tab(page, 'new');
  if (await page.getAttribute(fk('nrange|' + k), 'aria-checked') !== 'true') await page.click(fk('nrange|' + k));
  await page.waitForSelector(fk('nrange|' + k) + '[aria-checked="true"]');
  await page.fill(fk('new-name'), name);
  await choosePhoto(page, fk('new-photo'), file);
  await page.waitForSelector('#ssadm .ssa-form .ssa-pv canvas', { timeout: 90000 });
  await setColourInput(page, hex);
  await page.click(fk('new-add'));
  await page.waitForSelector(`#ssadm .ssa-added .ssa-cname:text-is("${name}")`, { timeout: 90000 });
  await settle(page);
}
async function publishNow(page, L) {
  await page.click(fk('review'));
  await page.waitForSelector('#ssadm .ssa-review');
  const review = (await page.locator('#ssadm .ssa-review').innerText()).replace(/\s+/g, ' ');
  await page.screenshot({ path: path.join(SHOTS, L + '-review.png') });
  const before = await page.evaluate(() => window.__publishCalls || 0);
  await page.click(fk('publish'));
  await page.waitForSelector('#ssadm .ssa-h2:text-is("Published ✓"), #ssadm .ssa-status-error', { timeout: 90000 });
  const err = await page.locator('#ssadm .ssa-status-error').count() ? await page.locator('#ssadm .ssa-status-error').innerText() : null;
  ok(!err, L + ' published without an error', err);
  ok((await page.evaluate(() => window.__publishCalls)) - before === 1, L + ' publish() called once');
  return { pub: await page.evaluate(() => window.__published), review };
}

/* ------------------------------------------------------------------ shop readers */
const READ = () => {
  const T = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
  const card = k => document.querySelector('.prod[data-k="' + k + '"]');
  const sw = (k, n) => [...card(k).querySelectorAll('[data-n]')].find(b => b.dataset.n === n);
  const tile = n => [...document.querySelectorAll('#cgrid .tile')].find(t => t.querySelector('.tn').textContent === n);
  const S = (k, n) => { const b = sw(k, n); return b ? { stock: b.dataset.stock || 'in', label: b.getAttribute('aria-label'), full: b.dataset.full || null, src: b.querySelector('img') ? b.querySelector('img').getAttribute('src') : null, loaded: b.querySelector('img') ? b.querySelector('img').naturalWidth > 0 : null, bg: b.dataset.bg, last: b.parentNode.lastElementChild === b } : null; };
  const Ti = n => { const t = tile(n); return t ? { stock: t.dataset.stock || 'in', fam: t.dataset.fam, tag: (t.querySelector('.stk') || {}).textContent || '', img: t.querySelector('img') ? t.querySelector('img').getAttribute('src') : null } : null; };
  const sl = SS.SLIDES[SS.getHi()];
  return {
    names: { zig: [...card('zig').querySelectorAll('[data-n]')].map(b => b.dataset.n), sol: [...card('sol').querySelectorAll('[data-n]')].map(b => b.dataset.n), chen: [...card('chen').querySelectorAll('[data-n]')].map(b => b.dataset.n) },
    tiles: document.querySelectorAll('#cgrid .tile').length,
    chips: [...document.querySelectorAll('#cgrid-chips .chip, .chips .chip, [data-fam].chip')].map(c => c.dataset.fam + ':' + ((c.querySelector('.n') || {}).textContent || '')),
    price: ['zig', 'sol', 'chen'].map(k => T('.prod[data-k="' + k + '"] [data-price]')),
    add: ['zig', 'sol', 'chen'].map(k => T('.prod[data-k="' + k + '"] [data-add]')),
    hero: { k: sl.k, c: sl.c, hs: SS.getHs(), price: T('#h-price'), add: T('#h-add'), oos: document.querySelector('#h-add').classList.contains('oos') },
    ranges: [...document.querySelectorAll('.ranges a')].map(a => a.hidden ? 'hidden' : [...a.querySelectorAll('small')].map(e => e.textContent).join('|')),
    seeAll: T('#hero .ctas a.text[href="#colours"]'), colH: T('#colours-h'),
    slideCols: SS.SLIDES.map(s => s.c), slideMustard: (SS.SLIDES.find(s => s.c === 'Mustard & tan') || {}).t || null,
    pairNames: [...document.querySelectorAll('#pairs-list .pn b')].map(b => b.textContent),
    pairBtns: [...document.querySelectorAll('#pairs-list [data-pair]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
    fit: T('#fit-add'), fitOOS: document.querySelector('#fit-add').classList.contains('oos'),
    cmp: [...document.querySelectorAll('#cmp-table .cmpc')].map(b => b.dataset.k + b.dataset.l + ':' + b.querySelector('b').textContent + (b.dataset.stock ? ':out' : '')),
    meta: document.querySelector('meta[name=description]').content,
    example: document.querySelector('.chat .bubble') ? document.querySelector('.chat .bubble').firstChild.nodeValue : '',
    notice: document.querySelector('#ss-notice p') ? document.querySelector('#ss-notice p').textContent : null,
    owner: !!document.getElementById('ss-owner'),
    sw: { navy: S('zig', 'Navy & cream'), grey: S('zig', 'Grey & black'), teal: S('zig', 'Teal & white'), mustard: S('zig', 'Mustard & tan'), rust: S('sol', 'Rust'), aqua: S('sol', 'Aqua'), sea: S('sol', 'Sea green'), chenNavy: S('chen', 'Navy stripe') },
    tile: { navy: Ti('Navy & cream'), grey: Ti('Grey & black'), teal: Ti('Teal & white'), rust: Ti('Rust'), aqua: Ti('Aqua'), sea: Ti('Sea green'), chenNavy: Ti('Navy stripe') },
    xl: (() => { const r = card('zig').querySelectorAll('.sizes-c [role=radio]')[3]; return [r.dataset.stock || 'in', r.getAttribute('aria-label')]; })(),
  };
};
async function read(page) { return page.evaluate(READ); }
async function lang(page, code) { await page.evaluate(c => SSLANG.set(c), code); await page.waitForFunction(c => document.documentElement.lang === c, code, { timeout: 20000 }); await page.waitForTimeout(800); }
async function untranslated(page) {
  return page.evaluate(() => {
    const RX = /out of stock|few left|in stock|\bAsk\b|Sorry|Shop owner|Remove the|Dismiss|See all|colours|three ranges|Add to cart|Add both|Closed for|\bfrom ₹/i, out = [];
    const skip = el => el.closest('script,style,[data-noi18n],[hidden],.odo,#ssadm');
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (RX.test(n.nodeValue) && !skip(n.parentNode)) out.push('text: ' + n.nodeValue.trim().slice(0, 80));
    document.querySelectorAll('[aria-label],[title]').forEach(e => { if (skip(e)) return; ['aria-label', 'title'].forEach(a => { const v = e.getAttribute(a); if (v && RX.test(v)) out.push(a + ': ' + v.slice(0, 80)); }); });
    return out;
  });
}
async function popupURL(ctx, page, sel) {
  const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 10000 }), page.evaluate(s => document.querySelector(s).click(), sel)]);
  await pop.waitForLoadState('domcontentloaded').catch(() => {});
  const u = pop.url(); await pop.close(); return decodeURIComponent(u);
}
async function checkout(page, L, picks, total, lines) {
  await page.evaluate(() => { localStorage.removeItem('ss_cart2'); });
  for (const [k, n, si] of picks) {
    await page.evaluate(([k, n, si]) => {
      const c = document.querySelector('.prod[data-k="' + k + '"]');
      [...c.querySelectorAll('[data-n]')].find(b => b.dataset.n === n).click();
      c.querySelectorAll('.sizes-c [role=radio]')[si].click();
    }, [k, n, si]);
    await page.waitForTimeout(300);
    await page.evaluate(k => document.querySelector('.prod[data-k="' + k + '"] [data-add]').click(), k);
    await page.waitForTimeout(400);
  }
  await page.evaluate(() => SS.openD('cart')); await page.waitForTimeout(400);
  const cart = await page.evaluate(() => [...document.querySelectorAll('#v-cart .line')].map(l => l.textContent.replace(/\s+/g, ' ').trim()));
  ok(cart.length === picks.length, L + ' cart has ' + picks.length + ' lines', cart);
  await page.click('#go', { timeout: 8000 }); await page.waitForSelector('#v-det:not([hidden])', { timeout: 8000 });
  const sum = await page.evaluate(() => document.querySelector('#tot').textContent);
  await page.fill('#o-name', 'Test Buyer'); await page.fill('#o-ph', '9876543210'); await page.fill('#o-ad', '12 Alkapuri Society, RC Dutt Road');
  await page.fill('#o-ct', 'Vadodara'); await page.fill('#o-pin', '390007');
  await page.waitForTimeout(400); await page.click('#order-btn', { timeout: 8000 }); await page.waitForSelector('#v-pay:not([hidden])', { timeout: 8000 });
  const r = await page.evaluate(() => ({ wa: decodeURIComponent((document.querySelector('#sendwa').href.split('text=')[1]) || ''), upi: document.querySelector('#upil').href, amt: document.querySelector('#payamt').textContent }));
  const n = total.toLocaleString('en-IN');
  ok(sum.includes('₹' + n), L + ' details total ₹' + n, sum);
  ok(r.wa.includes('Total: ₹' + n), L + ' WhatsApp total ₹' + n, r.wa);
  for (const l of lines) ok(r.wa.includes(l), L + ' WhatsApp line "' + l + '"', r.wa);
  ok(r.upi.includes('am=' + total + '&'), L + ' UPI amount ' + total, r.upi);
  ok(r.amt.includes('₹' + n), L + ' pay screen amount ₹' + n, r.amt);
  // start a new order (empties the cart) and put the cards back on size M
  await page.evaluate(ks => { document.querySelector('#newcart').click(); SS.closeD(); ks.forEach(k => document.querySelector('.prod[data-k="' + k + '"] .sizes-c [role=radio]').click()); }, picks.map(p => p[0]));
  await page.waitForTimeout(400);
  ok(await page.evaluate(() => JSON.parse(localStorage.getItem('ss_cart2') || '[]').length) === 0, L + ' new order empties the cart');
}

/* ------------------------------------------------------------------ 1. owner session 1 */
const EN = 'Closed for Diwali from 1 to 3 November. Orders placed now are sent on 4 November.';
const GU = 'દિવાળી માટે 1 થી 3 નવેમ્બર સુધી બંધ. હમણાંના ઓર્ડર 4 નવેમ્બરે મોકલાશે.';
const HI = 'दिवाली के लिए 1 से 3 नवंबर तक बंद। अभी के ऑर्डर 4 नवंबर को भेजे जाएंगे।';
const TEAL = '#2A8A8A', SEA = '#3CB371';
async function owner1(b, base, src) {
  const L = '[admin 1]';
  const { ctx, page, log, reqs } = await context(b, [390, 844], { owner: true });
  await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('#ss-owner', { state: 'attached', timeout: 30000 });
  ok(!reqs.some(u => /admin\.(js|css)/.test(u)), L + ' nothing admin fetched before the owner clicks');
  await page.locator('#ss-owner').scrollIntoViewIfNeeded(); await page.click('#ss-owner');
  await page.waitForSelector('#ssadm .ssa-tab[aria-selected="true"]', { timeout: 30000 }); await settle(page, 500);

  await tab(page, 'prices');
  await range(page, 'zig'); for (const [id, v] of [['M', 259], ['H', 259], ['L', 369]]) await page.fill(fk('price|zig|' + id), String(v));
  await page.click(fk('avail|zig|XL'));
  await range(page, 'sol'); for (const [id, v] of [['M', 379], ['H', 379]]) await page.fill(fk('price|sol|' + id), String(v));
  await range(page, 'chen'); for (const [id, v] of [['M', 279], ['H', 279], ['XL', 699]]) await page.fill(fk('price|chen|' + id), String(v));

  await tab(page, 'stock');
  await range(page, 'zig'); await page.click(fk('stock|zig|Navy & cream|few')); await page.click(fk('hide|zig|Grey & black'));
  await range(page, 'sol'); await page.click(fk('stock|sol|Rust|out')); await page.click(fk('hide|sol|Aqua'));
  await range(page, 'chen'); await page.click(fk('stock|chen|Navy stripe|few'));

  await tab(page, 'photos'); await range(page, 'zig');
  await choosePhoto(page, fk('photo|zig|Mustard & tan'), PHOTOS[0]);
  await page.waitForSelector(fk('sheet-use'), { timeout: 90000 }); await page.click(fk('sheet-use'));
  await page.waitForSelector('#ssadm .ssa-sheet', { state: 'detached', timeout: 90000 }); await settle(page);

  await addColour(page, 'zig', 'Teal & white', PHOTOS[1], TEAL);
  await addColour(page, 'sol', 'Sea green', PHOTOS[2], SEA);
  await tab(page, 'stock'); await range(page, 'sol'); await page.click(fk('stock|sol|Sea green|few'));

  await tab(page, 'notice'); await page.click(fk('notice|on'));
  await page.fill(fk('notice|en'), EN); await page.fill(fk('notice|gu'), GU); await page.fill(fk('notice|hi'), HI);

  const { pub, review } = await publishNow(page, 'admin1');
  for (const s of ['Zigzag M price ₹249 → ₹259', 'Zigzag XL: Not available', 'Chenille XL price ₹649 → ₹699', 'Navy & cream: Few left', 'Grey & black: Hidden from shop', 'Rust: Out of stock', 'Aqua: Hidden from shop', 'Navy stripe: Few left', 'Mustard & tan: New photo', 'New colour: Teal & white', 'New colour: Sea green'])
    ok(review.includes(s), L + ' review lists "' + s + '"', review);
  eq(errs(log), [], L + ' no page errors');
  await ctx.close();

  const c = checkDoc(src, pub, L);
  const r = k => c.ranges[k], col = (k, n) => r(k).colours.find(x => x.n === n) || {};
  eq(r('zig').sizes.map(z => [z.id, z.price, z.stock]), [['M', 259, 'in'], ['H', 259, 'in'], ['L', 369, 'in'], ['XL', 599, 'out']], L + ' zig sizes saved');
  eq(r('sol').sizes.map(z => z.price), [379, 379, 499, 849], L + ' sol prices saved');
  eq(r('chen').sizes.map(z => z.price), [279, 279, 399, 699], L + ' chen prices saved');
  eq([col('zig', 'Navy & cream').stock, col('zig', 'Grey & black').hidden, col('sol', 'Rust').stock, col('sol', 'Aqua').hidden, col('chen', 'Navy stripe').stock], ['few', true, 'out', true, 'few'], L + ' stock + hidden saved');
  ok(/^[0-9a-f]{32}$/.test(col('zig', 'Mustard & tan').photo) && /^[0-9a-f]{32}$/.test(col('zig', 'Mustard & tan').thumb), L + ' photo override ids saved', col('zig', 'Mustard & tan'));
  const tw = col('zig', 'Teal & white'), sg = col('sol', 'Sea green');
  eq([tw.added, tw.bg, tw.stock, tw.hidden, r('zig').colours[r('zig').colours.length - 1].n], [true, TEAL, 'in', false, 'Teal & white'], L + ' Teal & white saved at the end of zig');
  eq([sg.added, sg.bg, sg.stock, r('sol').colours[r('sol').colours.length - 1].n], [true, SEA, 'few', 'Sea green'], L + ' Sea green saved (few) at the end of sol');
  ok([tw.photo, tw.thumb, sg.photo, sg.thumb].every(x => /^[0-9a-f]{32}$/.test(x) && blobs.has(x)), L + ' added colours carry uploaded asset ids');
  eq(c.notice, { on: true, en: EN, gu: GU, hi: HI }, L + ' notice saved in 3 languages');
  return { pub, cat: c };
}

/* ------------------------------------------------------------------ 2. shopper on published v1 */
const sum = (a, b) => a + b;
async function shopperV1(b, base, cat) {
  const col = (k, n) => cat.ranges[k].colours.find(x => x.n === n);
  const MT = col('zig', 'Mustard & tan'), TW = col('zig', 'Teal & white'), SG = col('sol', 'Sea green');
  /* desktop: everything, in en → gu → hi */
  {
    const L = '[shop v1 desktop]';
    const { ctx, page, log, reqs } = await context(b, [1440, 900], { owner: false, saved: ['zig|Navy & cream', 'sol|Rust', 'zig|Teal & white', 'zig|Grey & black', 'sol|Sea green'] });
    await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 120000 }); await settle(page, 2000);
    let r = await read(page);
    ok(!r.owner && !reqs.some(u => /admin\.(js|css)/.test(u)), L + ' visitor: no owner link, nothing admin fetched');
    eq(r.notice, EN, L + ' notice banner (en)');
    eq(r.names.zig, ['Forest green & black', 'Blush pink & black', 'Navy & cream', 'Olive & cream', 'Cocoa & cream', 'Mustard & tan', 'Berry red & pink', 'Black & beige', 'Navy & white', 'Teal & white'], L + ' zig swatches (Grey hidden, Teal added last)');
    eq(r.names.sol, ['Royal blue', 'Mustard', 'Rust', 'Black', 'Grey', 'Sea green'], L + ' sol swatches (Aqua hidden, Sea green added)');
    eq(r.names.chen.length, 10, L + ' chen swatches');
    eq(r.price, ['₹259', '₹379', '₹279'], L + ' card prices');
    eq(r.add, ['Add to cart · ₹259 ›', 'Add to cart · ₹379 ›', 'Add to cart · ₹279 ›'], L + ' card add labels');
    eq(r.ranges, ['from ₹259|10 colours', 'from ₹379|6 colours', 'from ₹279|10 colours'], L + ' ranges strip');
    eq([r.tiles, r.seeAll, r.colH], [26, 'See all 26 colours', 'Twenty-six colours, three ranges'], L + ' colour index count + headings');
    ok(r.chips.includes('all:26') && r.chips.includes('greys:5'), L + ' colour index chips recount (All 26, Greys 5)', r.chips);
    ok(!r.slideCols.includes('Grey & black') && !r.slideCols.includes('Aqua'), L + ' hero slides skip hidden colours', r.slideCols);
    ok(r.slideMustard && r.slideMustard.includes('From ₹259 for'), L + ' hero slide text price', r.slideMustard);
    const hz = cat.ranges[r.hero.k].sizes[r.hero.hs].price;
    eq(r.hero.price, '₹' + hz.toLocaleString('en-IN'), L + ' hero price follows catalog (' + r.hero.k + ' ' + r.hero.c + ')');
    const heroBuy = await page.evaluate(h => SS.canBuy(h.k, h.c, h.hs), r.hero);
    eq([r.hero.oos, /Ask on WhatsApp/.test(r.hero.add)], [!heroBuy, !heroBuy], L + ' hero add button matches stock');
    await page.evaluate(() => SS.hsSet(2)); await settle(page, 900);
    const h2 = await page.evaluate(() => document.querySelector('#h-price').textContent);
    eq(h2, '₹' + cat.ranges[r.hero.k].sizes[2].price.toLocaleString('en-IN'), L + ' hero L price');
    await page.evaluate(() => SS.hsSet(0)); await settle(page, 300);
    eq(r.pairNames.filter(n => /Aqua|Rust|Grey & black/.test(n)), [], L + ' pairs drop hidden/out colours');
    eq(r.pairBtns, ['Add both · ₹778 ›', 'Add both · ₹648 ›', 'Add both · ₹748 ›', 'Add both · ₹748 ›', 'Add both · ₹748 ›'], L + ' pair totals at new prices');
    eq([r.fit, r.fitOOS], ['Add Zigzag L · Forest green · ₹369 ›', false], L + ' fit tool add at new price');
    eq(['zigM:₹259', 'zigH:₹259', 'zigL:₹369', 'zigXL:₹599:out', 'solM:₹379', 'solH:₹379', 'solL:₹499', 'solXL:₹849', 'chenM:₹279', 'chenH:₹279', 'chenL:₹399', 'chenXL:₹699'].filter(x => r.cmp.includes(x)).length + ':' + r.cmp.length, '12:12', L + ' compare table: 12 cells at new prices, XL zig out');
    ok(r.meta.includes('from ₹259'), L + ' meta description from-price', r.meta);
    ok(r.example.includes('× 2 = ₹518'), L + ' example order uses the new zig M price', r.example);
    eq(r.sw.navy && [r.sw.navy.stock, r.sw.navy.label], ['few', 'Navy & cream, few left'], L + ' few swatch');
    eq(r.sw.rust && [r.sw.rust.stock, r.sw.rust.label], ['out', 'Rust, out of stock'], L + ' out swatch');
    eq(r.sw.chenNavy && r.sw.chenNavy.stock, 'few', L + ' chen few chip');
    ok(!r.sw.grey && !r.sw.aqua && !r.tile.grey && !r.tile.aqua, L + ' hidden colours gone from cards and colour index');
    eq(r.sw.teal && [r.sw.teal.full, r.sw.teal.src, r.sw.teal.loaded, r.sw.teal.bg, r.sw.teal.last], ['/_blob/' + TW.photo, '/_blob/' + TW.thumb, true, TEAL, true], L + ' added zig colour swatch with uploaded photos');
    eq(r.sw.sea && [r.sw.sea.full, r.sw.sea.src, r.sw.sea.stock, r.sw.sea.loaded], ['/_blob/' + SG.photo, '/_blob/' + SG.thumb, 'few', true], L + ' added sol colour swatch (few)');
    eq(r.sw.mustard && [r.sw.mustard.full, r.sw.mustard.src], ['/_blob/' + MT.photo, '/_blob/' + MT.thumb], L + ' photo override on Mustard & tan');
    eq([r.tile.navy && r.tile.navy.stock, r.tile.rust && r.tile.rust.stock, r.tile.sea && r.tile.sea.stock, !!(r.tile.teal && r.tile.teal.img), r.tile.chenNavy && r.tile.chenNavy.stock], ['few', 'out', 'few', true, 'few'], L + ' colour index tiles show stock + added colours');
    eq(r.xl, ['out', 'XL, 24×60 in, out of stock'], L + ' zig XL size out');
    // the card shows the uploaded photo when the added colour is picked
    await page.click('.prod[data-k="zig"] [data-n="Teal & white"]'); await settle(page, 700);
    const cardImg = await page.evaluate(() => ({ name: document.querySelector('.prod[data-k="zig"] [data-colour]').textContent, img: document.querySelector('.prod[data-k="zig"] .pic img').getAttribute('src'), loaded: document.querySelector('.prod[data-k="zig"] .pic img').naturalWidth > 0 }));
    eq(cardImg, { name: 'Teal & white', img: '/_blob/' + TW.photo, loaded: true }, L + ' card big photo = uploaded photo');
    // out colour → ask on WhatsApp
    await page.click('.prod[data-k="sol"] [data-n="Rust"]'); await settle(page, 300);
    eq(await page.evaluate(() => document.querySelector('.prod[data-k="sol"] [data-add]').textContent.trim()), 'Out of stock · Ask on WhatsApp ›', L + ' out colour: ask instead of add');
    const ask = await popupURL(ctx, page, '.prod[data-k="sol"] [data-add]');
    ok(ask.includes('Solid Premium Rug in Rust') && ask.includes('in stock?'), L + ' ask link names the rug', ask);
    await page.click('.prod[data-k="sol"] [data-n="Royal blue"]'); await settle(page, 300);
    // fit tool: bedside → zig XL (out)
    await page.click('#spots [data-spot="bed"]'); await settle(page, 400);
    r = await read(page); eq([r.fit, r.fitOOS], ['Out of stock · Ask on WhatsApp ›', true], L + ' fit tool: XL out → ask');
    // saved dialog
    await page.click('#h-savedbtn'); await settle(page, 600);
    let sv = await page.evaluate(() => [...document.querySelectorAll('#saved-list .srow')].map(row => [row.querySelector('.smeta small').textContent, row.querySelector('.sstk').textContent, row.querySelector('[data-sadd]').disabled]));
    eq(sv, [['Navy & cream', 'Few left', false], ['Rust', 'Out of stock', true], ['Teal & white', '', false], ['Sea green', 'Few left', false]], L + ' saved list (hidden dropped, stock shown)');
    await page.keyboard.press('Escape'); await settle(page, 400);
    // try-on
    await page.evaluate(() => SS.tryon('zig', 'Teal & white')); await settle(page, 600); await page.click('#tryon-sample'); await settle(page, 1500);
    let t = await page.evaluate(() => ({ sz: [...document.querySelectorAll('#tryon-sizes [data-i]')].map(b => (b.querySelector('small') || {}).textContent + ':' + (b.dataset.stock || 'in')), cols: [...document.querySelectorAll('#tryon-sw [data-n]')].map(b => b.dataset.n + (b.dataset.stock ? ':' + b.dataset.stock : '')), on: [...document.querySelectorAll('#tryon-sw [aria-checked="true"]')].map(b => [b.dataset.n, b.querySelector('img') && b.querySelector('img').getAttribute('src')]), add: document.querySelector('#tryon-add').textContent }));
    eq(t.sz, ['₹259:in', '₹259:in', '₹369:in', '₹599:out'], L + ' try-on size chips');
    eq(t.cols, ['Forest green & black', 'Blush pink & black', 'Navy & cream:few', 'Olive & cream', 'Cocoa & cream', 'Mustard & tan', 'Berry red & pink', 'Black & beige', 'Navy & white', 'Teal & white'], L + ' try-on zig colours');
    eq(t.on, [['Teal & white', '/_blob/' + TW.thumb]], L + ' try-on picks the added colour');
    ok(t.add.includes('₹259'), L + ' try-on add label price', t.add);
    await page.click('#tryon-range [data-k="sol"]'); await settle(page, 400);
    t = await page.evaluate(() => [...document.querySelectorAll('#tryon-sw [data-n]')].map(b => b.dataset.n + (b.dataset.stock ? ':' + b.dataset.stock : '')));
    eq(t, ['Royal blue', 'Mustard', 'Rust:out', 'Black', 'Grey', 'Sea green:few'], L + ' try-on sol colours');
    await page.click('#tryon-x'); await settle(page, 400);
    // zoom
    await page.evaluate(() => SS.zoom('zig', 'Mustard & tan')); await settle(page, 800);
    let z = await page.evaluate(() => ({ n: [...document.querySelectorAll('#zoom .zsw')].map(b => b.dataset.stock || 'in'), img: document.querySelector('#zoom-img').getAttribute('src') }));
    eq(z, { n: ['in', 'in', 'few', 'in', 'in', 'in', 'in', 'in', 'in', 'in'], img: '/_blob/' + MT.photo }, L + ' zoom row + overridden photo');
    await page.keyboard.press('Escape'); await settle(page, 400);
    // checkout in English: two added colours
    await checkout(page, L + ' en', [['zig', 'Teal & white', 0], ['sol', 'Sea green', 2]], 259 + 499, ['(Teal & white) × 1 = ₹259', '(Sea green) × 1 = ₹499']);
    await page.screenshot({ path: path.join(SHOTS, 'v1-desktop-en.png') });

    /* Gujarati + Hindi */
    for (const [code, notice, rx, tags] of [['gu', GU, /[઀-૿]/, ['થોડા જ બાકી', 'સ્ટોકમાં નથી']], ['hi', HI, /[ऀ-ॿ]/, ['कुछ ही बचे हैं', 'स्टॉक में नहीं']]]) {
      const G = L + ' ' + code;
      await lang(page, code);
      r = await read(page);
      eq(r.notice, notice, G + ' notice banner');
      ok(r.add.every((a, i) => a.includes(['₹259', '₹379', '₹279'][i]) && rx.test(a) && !/Add to cart/.test(a)), G + ' card add labels translated with new prices', r.add);
      ok(r.ranges.every((a, i) => a.includes(['₹259', '₹379', '₹279'][i]) && !/from|colours/.test(a)), G + ' ranges strip translated', r.ranges);
      ok(r.slideMustard.includes('₹259') && rx.test(r.slideMustard), G + ' slide text translated', r.slideMustard);
      ok(r.pairBtns.length === 5 && r.pairBtns[0].includes('₹778') && rx.test(r.pairBtns[0]), G + ' pairs translated', r.pairBtns);
      ok(r.fit.includes('WhatsApp') && rx.test(r.fit), G + ' fit tool ask translated', r.fit);
      eq([r.sw.navy.label, r.sw.rust.label], ['Navy & cream, ' + tags[0], 'Rust, ' + tags[1]], G + ' swatch labels');
      ok(rx.test(r.xl[1]) && r.xl[1].endsWith(tags[1]), G + ' size out label', r.xl[1]);
      eq(r.tile.navy.tag, tags[0], G + ' colour index few tag');
      eq(await untranslated(page), [], G + ' page: no English shop phrase left');
      await page.click('#h-savedbtn'); await settle(page, 600);
      sv = await page.evaluate(() => [...document.querySelectorAll('#saved-list .srow .sstk')].map(e => e.textContent));
      eq(sv, [tags[0], tags[1], '', tags[0]], G + ' saved tags');
      eq(await untranslated(page), [], G + ' saved dialog');
      await page.keyboard.press('Escape'); await settle(page, 400);
      await page.click('#h-compare'); await settle(page, 700);
      eq(await untranslated(page), [], G + ' compare dialog');
      await page.keyboard.press('Escape'); await settle(page, 400);
      await page.evaluate(() => SS.tryon('sol', 'Sea green')); await settle(page, 600); await page.click('#tryon-sample'); await settle(page, 1500);
      const ta = await page.evaluate(() => document.querySelector('#tryon-add').textContent);
      ok(ta.includes('₹379') && rx.test(ta), G + ' try-on add label', ta);
      await page.click('#tryon-sw [data-n="Rust"]'); await settle(page, 300);
      ok(/WhatsApp/.test(await page.evaluate(() => document.querySelector('#tryon-add').textContent)), G + ' try-on out colour asks');
      eq(await untranslated(page), [], G + ' try-on');
      await page.click('#tryon-x'); await settle(page, 400);
      await page.evaluate(() => SS.zoom('sol', 'Rust')); await settle(page, 800);
      eq(await untranslated(page), [], G + ' zoom');
      await page.keyboard.press('Escape'); await settle(page, 400);
      await checkout(page, G, [['zig', 'Navy & cream', 1], ['chen', 'Navy stripe', 3]], 259 + 699, ['(Navy & cream) × 1 = ₹259', '(Navy stripe) × 1 = ₹699']);
      await page.screenshot({ path: path.join(SHOTS, 'v1-desktop-' + code + '.png') });
    }
    eq(errs(log), [], L + ' console clean');
    await ctx.close();
  }
  /* phone: dock, notice placement, no sideways scroll, Hindi checkout */
  {
    const L = '[shop v1 phone]';
    const { ctx, page, log } = await context(b, [390, 844], { owner: false, lang: 'hi' });
    await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 120000 }); await settle(page, 2000);
    const n = await page.evaluate(() => { const n = document.getElementById('ss-notice'), h = document.getElementById('hero'); return n && { t: n.querySelector('p').textContent, above: n.getBoundingClientRect().bottom <= h.getBoundingClientRect().top + 1, ov: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
    eq(n, { t: HI, above: true, ov: 0 }, L + ' hi notice above the hero, no sideways scroll');
    await page.screenshot({ path: path.join(SHOTS, 'v1-phone-hi-top.png') });
    await page.evaluate(() => { const c = document.querySelector('.prod[data-k="zig"]'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 60); });
    await settle(page, 1500);
    let d = await page.evaluate(() => ({ on: document.querySelector('#dock').classList.contains('on'), p: document.querySelector('#dock-p').textContent }));
    eq(d, { on: true, p: '₹259' }, L + ' dock shows the new zig price');
    await page.evaluate(() => { document.querySelector('.prod[data-k="sol"] [data-n="Rust"]').click(); const c = document.querySelector('.prod[data-k="sol"]'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 60); });
    await settle(page, 1500);
    d = await page.evaluate(() => ({ on: document.querySelector('#dock').classList.contains('on'), p: document.querySelector('#dock-p').textContent, a: document.querySelector('#dock-add').textContent }));
    ok(d.on && /[ऀ-ॿ]/.test(d.p) && !/Out of stock|Ask/.test(d.p + d.a), L + ' dock: out colour asks (hi)', d);
    await page.screenshot({ path: path.join(SHOTS, 'v1-phone-hi-dock.png') });
    eq(await untranslated(page), [], L + ' hi page with the dock asking: no English shop phrase left');
    await page.evaluate(() => document.querySelector('.prod[data-k="sol"] [data-n="Sea green"]').click()); await settle(page, 300);
    await checkout(page, L + ' hi', [['sol', 'Sea green', 0]], 379, ['(Sea green) × 1 = ₹379']);
    eq(errs(log), [], L + ' console clean');
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ 3. owner session 2 on the published page */
async function owner2(b, base, src, cat1) {
  const L = '[admin 2]';
  const { ctx, page, log } = await context(b, [1440, 900], { owner: true });
  await page.goto(base + '#admin', { waitUntil: 'load', timeout: 120000 });   // opened at "/", not "/index.html"
  await page.waitForSelector('#ssadm .ssa-tab[aria-selected="true"]', { timeout: 30000 }); await settle(page, 600);
  await tab(page, 'prices'); await range(page, 'zig');
  eq([await page.inputValue(fk('price|zig|M')), await page.getAttribute(fk('avail|zig|XL'), 'aria-checked')], ['259', 'false'], L + ' editor starts from the published prices');
  await tab(page, 'stock'); await range(page, 'zig');
  eq([await page.getAttribute(fk('stock|zig|Navy & cream|few'), 'aria-checked'), await page.getAttribute(fk('hide|zig|Grey & black'), 'aria-checked')], ['true', 'true'], L + ' editor shows published stock + hidden');
  await tab(page, 'new'); await page.click(fk('nrange|zig')).catch(() => {});
  ok(await page.locator('#ssadm .ssa-added .ssa-cname:text-is("Teal & white")').count() === 1, L + ' published added colour listed');
  await tab(page, 'notice');
  eq(await page.inputValue(fk('notice|hi')), HI, L + ' published Hindi notice loaded');

  // edits
  await tab(page, 'prices'); await range(page, 'zig'); await page.fill(fk('price|zig|M'), '239');
  await tab(page, 'stock'); await range(page, 'zig');
  await page.click(fk('stock|zig|Navy & cream|in')); await page.click(fk('hide|zig|Grey & black'));
  await range(page, 'sol'); await page.click(fk('stock|sol|Rust|few'));
  await tab(page, 'photos'); await range(page, 'zig'); await page.click(fk('orig|zig|Mustard & tan')); await settle(page);
  await tab(page, 'new'); if (await page.getAttribute(fk('nrange|zig'), 'aria-checked') !== 'true') await page.click(fk('nrange|zig'));
  await page.click(fk('del|zig|Teal & white')); await page.waitForSelector(fk('sheet-yes')); await page.click(fk('sheet-yes')); await settle(page);
  await tab(page, 'notice'); await page.click(fk('notice|on'));
  const { pub, review } = await publishNow(page, 'admin2');
  for (const s of ['Zigzag M price ₹259 → ₹239', 'Navy & cream: In stock', 'Rust: Few left'])
    ok(review.includes(s), L + ' review lists "' + s + '"', review);
  eq(errs(log), [], L + ' no page errors');
  await ctx.close();

  const c = checkDoc(src, pub, L);
  const col = (k, n) => c.ranges[k].colours.find(x => x.n === n);
  eq(c.ranges.zig.sizes.map(z => [z.price, z.stock]), [[239, 'in'], [259, 'in'], [369, 'in'], [599, 'out']], L + ' zig sizes');
  eq([col('zig', 'Navy & cream').stock, col('zig', 'Grey & black').hidden, col('sol', 'Rust').stock, col('sol', 'Aqua').hidden], ['in', false, 'few', true], L + ' stock + hidden');
  eq([col('zig', 'Mustard & tan').photo, col('zig', 'Mustard & tan').thumb], [null, null], L + ' original photo restored');
  ok(!col('zig', 'Teal & white'), L + ' added colour deleted');
  eq(col('sol', 'Sea green'), cat1.ranges.sol.colours.find(x => x.n === 'Sea green'), L + ' other added colour kept exactly');
  eq(c.notice, { on: false, en: EN, gu: GU, hi: HI }, L + ' notice off (text kept)');
  eq([c.ranges.sol.sizes.map(z => z.price), c.ranges.chen.sizes.map(z => z.price)], [[379, 379, 499, 849], [279, 279, 399, 699]], L + ' other prices kept');
  ok(c.updatedAt > cat1.updatedAt, L + ' updatedAt moves on');
  return { pub, cat: c };
}

async function shopperV2(b, base) {
  const L = '[shop v2]';
  const { ctx, page, log } = await context(b, [1440, 900], { owner: false });
  await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 120000 }); await settle(page, 2000);
  let r = await read(page);
  eq(r.notice, null, L + ' notice gone');
  eq(r.price, ['₹239', '₹379', '₹279'], L + ' card prices');
  eq(r.ranges, ['from ₹239|10 colours', 'from ₹379|6 colours', 'from ₹279|10 colours'], L + ' ranges strip');
  ok(r.sw.grey && !r.sw.teal && r.sw.sea, L + ' Grey & black back, Teal & white gone, Sea green kept');
  ok(r.sw.mustard && !/_blob/.test(r.sw.mustard.full + r.sw.mustard.src), L + ' Mustard & tan back on its original photo', r.sw.mustard);
  eq([r.sw.navy.stock, r.sw.rust.stock, r.sw.rust.label], ['in', 'few', 'Rust, few left'], L + ' stock updated');
  eq(r.pairNames.length, 14, L + ' pairs: 7 (only the Aqua pair stays out)');
  ok(r.example.includes('× 2 = ₹478'), L + ' example order', r.example);
  await lang(page, 'gu');
  r = await read(page);
  eq(r.sw.rust.label, 'Rust, થોડા જ બાકી', L + ' gu few label');
  eq(await untranslated(page), [], L + ' gu page: no English shop phrase left');
  await lang(page, 'en');
  await checkout(page, L, [['zig', 'Grey & black', 0]], 239, ['(Grey & black) × 1 = ₹239']);
  eq(errs(log), [], L + ' console clean');
  await ctx.close();
}

/* ------------------------------------------------------------------ 4. third round trip */
async function owner3(b, base, src) {
  const L = '[admin 3]';
  const { ctx, page, log } = await context(b, [390, 844], { owner: true });
  await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('#ss-owner', { state: 'attached', timeout: 30000 });
  await page.locator('#ss-owner').scrollIntoViewIfNeeded(); await page.click('#ss-owner');
  await page.waitForSelector('#ssadm .ssa-tab[aria-selected="true"]', { timeout: 30000 }); await settle(page, 500);
  await tab(page, 'prices'); await range(page, 'zig');
  eq(await page.inputValue(fk('price|zig|M')), '239', L + ' editor starts from the second publish');
  await page.click(fk('avail|zig|XL'));
  const { pub } = await publishNow(page, 'admin3');
  eq(errs(log), [], L + ' no page errors');
  await ctx.close();
  const c = checkDoc(src, pub, L);
  eq(c.ranges.zig.sizes[3].stock, 'in', L + ' zig XL available again');
  return pub;
}

/* ------------------------------------------------------------------ 5. a served copy carrying injected runtime scripts */
async function injectedCopy(b, dir, src) {
  const RT = '<script>window.__rt=(window.__rt||0)+1</script>';
  const cases = [
    ['head+body end', h => h.replace('<head>', '<head>' + RT).replace(/\n<\/body><\/html>$/, '\n' + RT + '</body></html>'), true],
    ['before doctype', h => RT + h, true],
    ['script + extra link', h => h.replace('<head>', '<head>' + RT + '<link rel="author" href="humans.txt">'), false],
  ];
  for (const [name, inject, okToSave] of cases) {
    const L = '[injected: ' + name + ']';
    const s = await rawServe(dir, inject);
    const { ctx, page, log } = await context(b, [1440, 900], { owner: true });
    await page.goto(s.url + 'index.html#admin', { waitUntil: 'load', timeout: 120000 });
    await page.waitForSelector('#ssadm .ssa-tab[aria-selected="true"]', { timeout: 30000 }); await settle(page, 500);
    ok(await page.evaluate(() => window.__rt >= 1), L + ' the served copy really ran injected code');
    await tab(page, 'prices'); await range(page, 'chen'); await page.fill(fk('price|chen|L'), '429');
    await page.click(fk('review')); await page.waitForSelector('#ssadm .ssa-review');
    await page.click(fk('publish'));
    await page.waitForSelector('#ssadm .ssa-h2:text-is("Published ✓"), #ssadm .ssa-status-error', { timeout: 90000 });
    const pub = await page.evaluate(() => window.__published || null);
    if (okToSave) {
      ok(pub && !/__rt/.test(pub), L + ' published without the injected scripts');
      if (pub) { const c = checkDoc(src, pub, L); eq(c.ranges.chen.sizes[2].price, 429, L + ' edit saved'); }
    } else {
      const msg = await page.locator('#ssadm .ssa-status-error').innerText().catch(() => '');
      ok(!pub && (await page.evaluate(() => window.__publishCalls)) === 0 && /can't be saved from here/.test(msg), L + ' refused: nothing published, owner told why', msg);
    }
    eq(errs(log), [], L + ' no page errors');
    await ctx.close(); s.close();
  }
}

/* ------------------------------------------------------------------ main */
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const page = fs.readFileSync(SITE + '/softsteps.html', 'utf8');
  const v0 = WRAP + page + TAIL;
  ok(WRAP.startsWith('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>') && WRAP.endsWith('</style></head><body>\n'), 'wrapper prefix is the stored one');
  const b = await chromium.launch();
  const T0 = Date.now();
  try {
    const s0 = await rawServe(siteDir('www-i0', v0));
    eq(await get(s0.url + 'index.html'), v0, 'v0 served byte-for-byte');
    const { pub: v1, cat: c1 } = await owner1(b, s0.url, v0);
    s0.close();
    await injectedCopy(b, T + '/www-i0', v0);
    fs.writeFileSync(T + '/integ-v1.html', v1);
    const s1 = await rawServe(siteDir('www-i1', v1));
    await shopperV1(b, s1.url, c1);
    const { pub: v2 } = await owner2(b, s1.url, v1, c1);
    s1.close();
    fs.writeFileSync(T + '/integ-v2.html', v2);
    const s2 = await rawServe(siteDir('www-i2', v2));
    await shopperV2(b, s2.url);
    const v3 = await owner3(b, s2.url, v2);
    s2.close();
    ok(v3.startsWith(WRAP) && v3.endsWith(TAIL) && split(v3).before === split(v0).before && split(v3).after === split(v0).after, 'after three publishes the page outside the markers is still the original v0');
  } catch (e) { ok(false, 'test crashed: ' + (e && e.stack || e)); }
  await b.close();
  console.log(`\n${pass} passed, ${fail} failed (${Math.round((Date.now() - T0) / 1000)} s)`);
  if (fails.length) console.log('FAILURES:\n' + fails.join('\n'));
  process.exit(fail ? 1 : 0);
})();
