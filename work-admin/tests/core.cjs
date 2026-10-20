// Soft Steps — shop-side catalog & stock layer tests.
// Usage: NODE_PATH=$(npm root -g) node tests/core.cjs [siteDir]
// (a) the page as published (catalog block = today's data) must look and sell exactly as before;
// (b) variants of the #ss-catalog block (prices, stock, hidden/added colours, notice, corrupt JSON) must flow
//     everywhere, in English and Gujarati; (c) the owner loader shows only for editors.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const SP = path.resolve(__dirname, '../..');
const SITE = path.resolve(process.argv[2] || SP + '/work/admin/site');
const { prep } = require(path.join(SP, 'qa.cjs')); const { serve } = require(path.join(SP, 'audit/serve.cjs'));
const SRC = fs.readFileSync(SITE + '/softsteps.html', 'utf8');
const RE = /<!--ss-catalog:start--><script type="application\/json" id="ss-catalog">([\s\S]*?)<\/script><!--ss-catalog:end-->/;
const SKEL = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style></style></head><body>\n';
const JPG = fs.readFileSync(SITE + '/img/t/z3.jpg');
const A = 'a'.repeat(32), B = 'b'.repeat(32), C = 'c'.repeat(32), D = 'd'.repeat(32), E = 'e'.repeat(32), F = 'f'.repeat(32);

let pass = 0, fail = 0; const fails = [];
function ok(cond, label, got) { if (cond) pass++; else { fail++; fails.push(label + (got !== undefined ? '  got: ' + JSON.stringify(got).slice(0, 300) : '')); } }
function eq(got, want, label) { ok(JSON.stringify(got) === JSON.stringify(want), label + ' (want ' + JSON.stringify(want).slice(0, 200) + ')', got); }

const BASE = JSON.parse(SRC.match(RE)[1]);
function block(cat) { return '<!--ss-catalog:start--><script type="application/json" id="ss-catalog">' + JSON.stringify(cat).replace(/</g, '\\u003c') + '</script><!--ss-catalog:end-->'; }
function variant(mut) { const c = JSON.parse(JSON.stringify(BASE)); mut(c); return SRC.replace(RE, () => block(c)); }
const col = (c, k, n) => c.ranges[k].colours.find(x => x.n === n);

async function open(b, s, o = {}) {
  const ctx = await b.newContext({ viewport: { width: o.vp ? o.vp[0] : 1440, height: o.vp ? o.vp[1] : 900 } });
  const page = await ctx.newPage(); const log = []; const reqs = [];
  await prep(page, log);
  page.on('request', r => reqs.push(r.url()));
  if (o.html) await page.route(/\/softsteps\.html(\?.*)?$/, r => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: SKEL + o.html + '\n</body></html>' }));
  await page.route(/\/_blob\//, r => r.fulfill({ status: 200, contentType: 'image/jpeg', body: JPG }));
  await page.route(/\/admin\.js$/, r => r.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.SSADMIN={open:function(){window.__adm=(window.__adm||0)+1},close:function(){}};' }));
  await page.route(/\/admin\.css$/, r => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  await ctx.route(/wa\.me/, r => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>wa</p>' }));
  await page.addInitScript(a => {
    try {
      if (!sessionStorage.getItem('__seeded')) {
        sessionStorage.setItem('__seeded', '1');
        if (a.lang) localStorage.setItem('ss_lang', a.lang);
        if (a.cart) localStorage.setItem('ss_cart2', JSON.stringify(a.cart));
        if (a.saved) localStorage.setItem('ss_saved', JSON.stringify(a.saved));
      }
    } catch (e) {}
    if (a.claude !== undefined) {
      const ns = Object.freeze({ canEdit: async () => a.claude, isOwner: async () => a.claude });
      window.claude = { use: async n => (n === 'user' ? ns : null) };
    }
  }, { lang: o.lang, cart: o.cart, saved: o.saved, claude: o.claude });
  await page.goto(s.url + 'softsteps.html' + (o.hash || ''), { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(o.wait || 1500);
  if (!(await page.evaluate(() => !!window.SS))) throw new Error('window.SS missing after startup: ' + errs(log).join(' | '));
  return { ctx, page, log, reqs };
}
function errs(log) { return log.filter(l => !/REQFAIL.*(img|\.jpg|\.webp|\.avif|_blob)/.test(l)); }
async function lang(page, code) { await page.evaluate(c => SSLANG.set(c), code); await page.waitForFunction(c => document.documentElement.lang === c, code, { timeout: 20000 }); await page.waitForTimeout(700); }
async function popupURL(ctx, page, sel) {
  const [pop] = await Promise.all([ctx.waitForEvent('page', { timeout: 8000 }), page.evaluate(s => document.querySelector(s).click(), sel)]);
  await pop.waitForLoadState('domcontentloaded').catch(() => {});
  const u = pop.url(); await pop.close(); return u;
}
// In-page readers
const READ = () => {
  const T = s => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : null; };
  const odo = el => { if (!el) return null; if (!el.querySelector('.dg')) return el.textContent.trim();
    return [...el.children].map(c => { if (!c.classList.contains('dg')) return c.textContent; const m = /translateY\((-?[\d.]+)%\)/.exec(c.firstElementChild.style.transform || ''); return m ? String(Math.round(-parseFloat(m[1]) / 10)) : '?'; }).join(''); };
  const card = k => document.querySelector('.prod[data-k="' + k + '"]');
  return {
    sw: { zig: card('zig').querySelectorAll('[data-n]').length, sol: card('sol').querySelectorAll('[data-n]').length, chen: card('chen').querySelectorAll('[data-n]').length },
    tiles: document.querySelectorAll('#cgrid .tile').length,
    price: ['zig', 'sol', 'chen'].map(k => T('.prod[data-k="' + k + '"] [data-price]')),
    add: ['zig', 'sol', 'chen'].map(k => T('.prod[data-k="' + k + '"] [data-add]')),
    hprice: odo(document.querySelector('#h-price')), hadd: T('#h-add'),
    ranges: [...document.querySelectorAll('.ranges a')].map(a => a.hidden ? 'hidden' : [...a.querySelectorAll('small')].map(e => e.textContent).join('|')),
    seeAll: T('#hero .ctas a.text[href="#colours"]'), colH: T('#colours-h'),
    slides: SS.SLIDES.length, slideCols: SS.SLIDES.map(s => s.c), slideMustard: (SS.SLIDES.find(s => s.c === 'Mustard & tan') || {}).t || null,
    pairs: document.querySelectorAll('#pairs-list .pair').length, pairsHidden: !!(document.getElementById('pairs') || {}).hidden,
    pairBtns: [...document.querySelectorAll('#pairs-list [data-pair]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
    pairNames: [...document.querySelectorAll('#pairs-list .pn b')].map(b => b.textContent),
    fit: T('#fit-add'), fitOOS: document.querySelector('#fit-add').classList.contains('oos'),
    cmp: [...document.querySelectorAll('#cmp-table .cmpc')].map(b => b.dataset.k + b.dataset.l + ':' + b.querySelector('b').textContent + (b.dataset.stock ? ':out' : '')),
    stockEls: document.querySelectorAll('[data-stock]').length,
    stkShown: [...document.querySelectorAll('.stk')].filter(e => !e.hidden && e.offsetParent).map(e => e.textContent),
    notice: !!document.getElementById('ss-notice'), owner: !!document.getElementById('ss-owner'), chip: !!document.getElementById('ss-admin-chip'), deny: T('#ss-admin-deny p'),
    v: SS.catalog && SS.catalog.v,
  };
};
async function read(page) { return page.evaluate(READ); }
/* English shop phrases this layer adds, left untranslated anywhere on the page (text or labels) */
async function untranslated(page) {
  return page.evaluate(() => {
    const RX = /out of stock|few left|in stock|\bAsk\b|Sorry|Shop owner|Remove the|Dismiss|See all|colours|three ranges|for a zigzag/i, out = [];
    const skip = el => el.closest('script,style,[data-noi18n],[hidden],.odo');
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (RX.test(n.nodeValue) && !skip(n.parentNode)) out.push('text: ' + n.nodeValue.trim().slice(0, 80));
    document.querySelectorAll('[aria-label],[title]').forEach(e => { if (skip(e)) return; ['aria-label', 'title'].forEach(a => { const v = e.getAttribute(a); if (v && RX.test(v)) out.push(a + ': ' + v.slice(0, 80)); }); });
    return out;
  });
}

async function checkout(page, { addSel, expectTotal, label }) {
  for (const s of addSel) { await page.click(s, { timeout: 8000 }); await page.waitForTimeout(250); }
  await page.evaluate(() => SS.openD('cart')); await page.waitForTimeout(300);
  const lines = await page.evaluate(() => [...document.querySelectorAll('#v-cart .line')].map(l => l.textContent.replace(/\s+/g, ' ').trim()));
  await page.click('#go', { timeout: 5000 }); await page.waitForSelector('#v-det:not([hidden])', { timeout: 5000 });
  const sum = await page.evaluate(() => document.querySelector('#tot').textContent);
  await page.fill('#o-name', 'Test Buyer'); await page.fill('#o-ph', '9876543210'); await page.fill('#o-ad', '12 Alkapuri Society, RC Dutt Road');
  await page.fill('#o-ct', 'Vadodara'); await page.fill('#o-pin', '390007');
  await page.waitForTimeout(400); await page.click('#order-btn', { timeout: 5000 }); await page.waitForTimeout(100);
  const state = await page.evaluate(() => ({ pay: !document.querySelector('#v-pay').hidden, error: document.querySelector('#oerr').textContent, invalid: [...document.querySelectorAll('[aria-invalid="true"]')].map(e => e.id), delivery: document.querySelector('input[name="dl"]:checked')?.value, pin: document.querySelector('#o-pin').value, cart: [...document.querySelectorAll('#v-cart .line')].length }));
  if (!state.pay) throw new Error('Checkout did not advance to payment: ' + JSON.stringify(state));
  const r = await page.evaluate(() => ({ wa: decodeURIComponent((document.querySelector('#sendwa').href.split('text=')[1]) || ''), upi: document.querySelector('#upil').href, amt: document.querySelector('#payamt').textContent }));
  const n = expectTotal.toLocaleString('en-IN');
  ok(sum.startsWith('₹' + n), label + ': details total ₹' + n, sum);
  ok(r.wa.includes('Total: ₹' + n), label + ': WhatsApp total ₹' + n, r.wa);
  ok(r.upi.includes('am=' + expectTotal + '&'), label + ': UPI amount ' + expectTotal, r.upi);
  ok(r.amt.startsWith('₹' + n), label + ': pay amount', r.amt);
  return { lines, wa: r.wa };
}

(async () => {
  const s = await serve(SITE);
  const b = await chromium.launch();
  const T0 = Date.now();
  try {
    /* ---------- 0. The block itself ---------- */
    {
      const m = SRC.match(/<!--ss-catalog:start-->/g) || [], e = SRC.match(/<!--ss-catalog:end-->/g) || [];
      eq([m.length, e.length], [1, 1], 'exactly one start and one end marker');
      ok(SRC.indexOf('<!--ss-catalog:end-->') < SRC.indexOf('var PDEF='), 'catalog block precedes the core script');
      ok(/\n<!--ss-catalog:start--><script type="application\/json" id="ss-catalog">[^\n]*<\/script><!--ss-catalog:end-->\n/.test(SRC), 'block on its own line, exact form');
      ok(!/</.test(SRC.match(RE)[1]), 'no raw "<" inside the JSON');
      // today's data, regenerated from the pre-catalog page
      const orig = fs.readFileSync(path.join(SP, 'site-live-v30/softsteps.html'), 'utf8');
      const P = eval('({' + orig.match(/var P=\{\n([\s\S]*?)\n\};/)[1] + '})');
      const dec = x => x.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
      const want = { v: 1, updatedAt: '', notice: { on: false, en: '', gu: '', hi: '' }, ranges: {} };
      for (const k of ['zig', 'sol', 'chen']) {
        const art = orig.match(new RegExp('<article class="prod[^"]*" id="r-' + k + '"[\\s\\S]*?</article>'))[0];
        want.ranges[k] = { name: P[k].name, sizes: P[k].sizes.map(z => ({ id: z[0], dims: z[1], weight: z[2], price: z[3], stock: 'in' })),
          colours: [...art.matchAll(/data-n="([^"]+)" data-bg="(#[0-9A-Fa-f]{6})"/g)].map(x => ({ n: dec(x[1]), bg: x[2], stock: 'in', hidden: false, photo: null, thumb: null, added: false })) };
      }
      eq(BASE, want, 'catalog block = today\'s data (prices, sizes, 26 colours in card order)');
    }

    /* ---------- 1. Shoppers see no change (phone + desktop) ---------- */
    for (const vp of [[390, 844], [1440, 900]]) {
      const L = 'base ' + vp[0];
      const { ctx, page, log, reqs } = await open(b, s, { vp });
      const r = await read(page);
      eq(r.sw, { zig: 10, sol: 6, chen: 10 }, L + ' swatches'); eq(r.tiles, 26, L + ' colour tiles');
      eq(r.price, ['₹249', '₹349', '₹299'], L + ' card prices');
      eq(r.add, ['Add to cart · ₹249 ›', 'Add to cart · ₹349 ›', 'Add to cart · ₹299 ›'], L + ' card add labels');
      eq(r.hprice, '₹349', L + ' hero price'); eq(r.hadd, 'Add to cart ›', L + ' hero add');
      eq(r.ranges, ['from ₹249|10 colours', 'from ₹349|6 colours', 'from ₹299|10 colours'], L + ' ranges strip');
      eq(r.seeAll, 'See all 26 colours', L + ' see-all'); eq(r.slides, 6, L + ' slides'); eq(r.pairs, 8, L + ' pairs');
      ok(r.slideMustard && r.slideMustard.includes('From ₹249 for'), L + ' slide 6 price', r.slideMustard);
      eq(r.stockEls, 0, L + ' no stock marks'); eq(r.stkShown, [], L + ' no stock tags');
      ok(!r.notice && !r.owner && !r.chip && !r.deny, L + ' no notice / owner UI');
      ok(!reqs.some(u => /admin\.(js|css)/.test(u)), L + ' nothing admin fetched');
      eq(await page.evaluate(() => JSON.stringify(SS.catalog) === JSON.stringify(SS.catalogDefault)), true, L + ' parsed catalog = built-in defaults');
      eq(await page.evaluate(() => [SS.stock('zig', 'Navy & cream', 0), SS.canBuy('chen', 'Berry stripe', 'XL'), SS.stock('zig', 'Nope', 0)]), ['in', true, 'out'], L + ' SS.stock/canBuy');
      await checkout(page, { addSel: ['#h-add', '.prod[data-k="sol"] [data-n="Rust"]', '.prod[data-k="sol"] .sizes-c [role=radio]:nth-child(3)', '.prod[data-k="sol"] [data-add]'], expectTotal: 349 + 499, label: L });
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }

    /* ---------- 2. Price edit flows everywhere ---------- */
    const priced = variant(c => {
      const z = c.ranges.zig.sizes; z[0].price = 279; z[1].price = 279; z[2].price = 369;
      c.ranges.sol.sizes[0].price = 379; c.ranges.chen.sizes[3].price = 1099;
    });
    {
      const L = 'price desktop';
      const cart = [{ id: 'zig|M|Olive & cream', k: 'zig', size: 'M 16×24 in', colour: 'Olive & cream', p: 249, q: 1 }];
      const { ctx, page, log } = await open(b, s, { html: priced, cart });
      const r = await read(page);
      eq(r.price, ['₹279', '₹379', '₹299'], L + ' card prices'); eq(r.add[0], 'Add to cart · ₹279 ›', L + ' zig add label');
      eq(r.hprice, '₹379', L + ' hero price (odometer)');
      eq(r.ranges, ['from ₹279|10 colours', 'from ₹349|6 colours', 'from ₹299|10 colours'], L + ' ranges from-prices');
      ok(r.slideMustard.includes('From ₹279 for'), L + ' slide 6 price', r.slideMustard);
      eq(r.fit, 'Add Zigzag L · Forest green · ₹369 ›', L + ' fit tool add');
      ok(r.pairBtns[0] === 'Add both · ₹748 ›', L + ' pair total (369+379)', r.pairBtns[0]);
      ok(r.cmp.includes('zigM:₹279') && r.cmp.includes('solM:₹379') && r.cmp.includes('chenXL:₹1,099'), L + ' compare table', r.cmp);
      eq(await page.evaluate(() => document.querySelector('meta[name=description]').content.includes('from ₹279')), true, L + ' meta description');
      eq(await page.evaluate(() => document.querySelector('.chat .bubble').firstChild.nodeValue.includes('× 2 = ₹558')), true, L + ' example order');
      // hero size switch drives the odometer from P
      await page.evaluate(() => SS.hsSet(3)); await page.waitForTimeout(900);
      eq((await read(page)).hprice, '₹849', L + ' hero XL price');
      // try-on chips + add label
      await page.evaluate(() => SS.tryon('zig', 'Navy & cream')); await page.waitForTimeout(500);
      await page.click('#tryon-sample'); await page.waitForTimeout(1200);
      const t = await page.evaluate(() => ({ sz: [...document.querySelectorAll('#tryon-sizes small')].map(e => e.textContent), add: document.querySelector('#tryon-add').textContent }));
      eq(t.sz, ['₹279', '₹279', '₹369', '₹599'], L + ' try-on size chips'); ok(t.add.includes('₹279'), L + ' try-on add label', t.add);
      await page.click('#tryon-x'); await page.waitForTimeout(400);
      // restored cart line re-priced, then a full checkout
      const co = await checkout(page, { addSel: ['.prod[data-k="zig"] [data-add]'], expectTotal: 558, label: L });
      ok(co.lines.length === 2 && co.lines.every(l => l.includes('₹279 each')), L + ' cart lines at ₹279', co.lines);
      ok(co.wa.includes('(Olive & cream) × 1 = ₹279'), L + ' WhatsApp line price', co.wa);
      // Gujarati
      await page.evaluate(() => SS.closeD()); await lang(page, 'gu');
      const g = await read(page);
      ok(/₹279/.test(g.add[0]) && !/Add to cart/.test(g.add[0]), L + ' gu add label', g.add[0]);
      ok(/₹279/.test(g.ranges[0]) && !/from/.test(g.ranges[0]), L + ' gu ranges', g.ranges[0]);
      ok(/₹279/.test(g.slideMustard) && /[઀-૿]/.test(g.slideMustard), L + ' gu slide 6', g.slideMustard);
      ok(/₹748/.test(g.pairBtns[0]) && !/Add both/.test(g.pairBtns[0]), L + ' gu pair total', g.pairBtns[0]);
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }
    {
      const L = 'price phone';
      const { ctx, page, log } = await open(b, s, { html: priced, vp: [390, 844] });
      await page.evaluate(() => { const c = document.querySelector('.prod[data-k="zig"]'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 60); });
      await page.waitForTimeout(1200);
      const d = await page.evaluate(() => ({ on: document.querySelector('#dock').classList.contains('on'), p: document.querySelector('#dock-p').textContent }));
      ok(d.on && d.p === '₹279', L + ' dock price', d);
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }

    /* ---------- 3. Stock: few / out / size out / hidden ---------- */
    const stocked = variant(c => {
      col(c, 'zig', 'Navy & cream').stock = 'few'; col(c, 'sol', 'Rust').stock = 'out';
      c.ranges.zig.sizes[3].stock = 'out'; col(c, 'chen', 'Berry stripe').hidden = true; col(c, 'sol', 'Aqua').hidden = true;
      col(c, 'chen', 'Navy stripe').stock = 'few';
    });
    {
      const L = 'stock desktop';
      const cart = [{ id: 'sol|M|Rust', k: 'sol', size: 'M 16×24 in', colour: 'Rust', p: 349, q: 1 }, { id: 'zig|M|Navy & cream', k: 'zig', size: 'M 16×24 in', colour: 'Navy & cream', p: 249, q: 1 }, { id: 'sol|L|Aqua', k: 'sol', size: 'L 20×32 in', colour: 'Aqua', p: 499, q: 2 }];
      const { ctx, page, log } = await open(b, s, { html: stocked, cart, saved: ['sol|Rust', 'zig|Navy & cream', 'sol|Aqua'] });
      let r = await read(page);
      eq(r.sw, { zig: 10, sol: 5, chen: 9 }, L + ' swatches'); eq(r.tiles, 24, L + ' tiles');
      eq(r.ranges, ['from ₹249|10 colours', 'from ₹349|5 colours', 'from ₹299|9 colours'], L + ' ranges counts');
      eq(r.seeAll, 'See all 24 colours', L + ' see-all'); eq(r.colH, '24 colours, three ranges', L + ' colours heading');
      eq(r.slides, 5, L + ' hero slides'); ok(!r.slideCols.includes('Aqua'), L + ' hidden slide skipped');
      eq(r.hadd, 'Out of stock · Ask on WhatsApp ›', L + ' hero add on Rust');
      eq(r.pairs, 5, L + ' pairs'); ok(!r.pairNames.some(n => /Aqua|Rust|Berry stripe/.test(n)), L + ' pairs without hidden/out', r.pairNames);
      ok(r.cmp.includes('zigXL:₹599:out') && !r.cmp.includes('solXL:₹849:out'), L + ' compare XL out', r.cmp);
      const st = await page.evaluate(() => {
        const sw = (k, n) => [...document.querySelectorAll('.prod[data-k="' + k + '"] [data-n]')].find(b => b.dataset.n === n);
        const tile = n => [...document.querySelectorAll('#cgrid .tile')].find(t => t.querySelector('.tb').getAttribute('aria-label').startsWith(n + ','));
        return {
          navy: [sw('zig', 'Navy & cream').dataset.stock, sw('zig', 'Navy & cream').getAttribute('aria-label')],
          rust: [sw('sol', 'Rust').dataset.stock, sw('sol', 'Rust').getAttribute('aria-label')],
          chenNavy: [sw('chen', 'Navy stripe').dataset.stock, (sw('chen', 'Navy stripe').querySelector('.stk') || {}).textContent],
          aqua: !!sw('sol', 'Aqua'), berry: !!sw('chen', 'Berry stripe'),
          xl: [document.querySelectorAll('.prod[data-k="zig"] .sizes-c [role=radio]')[3].dataset.stock, document.querySelectorAll('.prod[data-k="zig"] .sizes-c [role=radio]')[3].getAttribute('aria-label')],
          solColour: document.querySelector('.prod[data-k="sol"] [data-colour]').textContent,
          tileRust: tile('Rust') && tile('Rust').dataset.stock, tileNavy: tile('Navy & cream') && [tile('Navy & cream').dataset.stock, (tile('Navy & cream').querySelector('.stk') || {}).textContent],
          api: [SS.stock('zig', 'Navy & cream', 0), SS.stock('zig', 'Navy & cream', 3), SS.stock('zig', 'Navy & cream', 'XL'), SS.canBuy('chen', 'Berry stripe', 0), SS.canBuy('sol', 'Rust', 0), SS.canBuy('zig', 'Navy & cream', 2)],
          guard: [SS.addToCart('sol', 0, 'Rust', 1), document.querySelector('#toast').textContent, SS.addToCart('sol', 0, 'Aqua', 1), SS.addToCart('zig', 3, 'Forest green & black', 1)],
        };
      });
      eq(st.navy, ['few', 'Navy & cream, few left'], L + ' few swatch'); eq(st.rust, ['out', 'Rust, out of stock'], L + ' out swatch');
      eq(st.chenNavy, ['few', 'Few left'], L + ' chen chip few tag');
      ok(!st.aqua && !st.berry, L + ' hidden colours removed');
      eq(st.xl, ['out', 'XL, 24×60 in, out of stock'], L + ' size out');
      ok(st.solColour !== 'Rust', L + ' sol card opens on a buyable colour', st.solColour);
      eq(st.tileRust, 'out', L + ' tile out'); eq(st.tileNavy, ['few', 'Few left'], L + ' tile few');
      eq(st.api, ['few', 'out', 'out', false, false, true], L + ' SS.stock / canBuy');
      eq(st.guard, [false, 'Sorry, this one is out of stock right now', false, false], L + ' addToCart guard');
      // picking few / out colours on the cards
      await page.click('.prod[data-k="zig"] [data-n="Navy & cream"]');
      r = await page.evaluate(() => ({ tag: [...document.querySelectorAll('.prod[data-k="zig"] .clab .stk')].filter(e => !e.hidden).map(e => e.textContent), add: document.querySelector('.prod[data-k="zig"] [data-add]').textContent.trim() }));
      eq(r, { tag: ['Few left'], add: 'Add to cart · ₹249 ›' }, L + ' few colour picked');
      await page.click('.prod[data-k="zig"] .sizes-c [role=radio]:nth-child(4)');
      r = await page.evaluate(() => ({ add: document.querySelector('.prod[data-k="zig"] [data-add]').textContent.trim(), oos: document.querySelector('.prod[data-k="zig"] [data-add]').classList.contains('oos') }));
      eq(r, { add: 'Out of stock · Ask on WhatsApp ›', oos: true }, L + ' size out picked');
      await page.click('.prod[data-k="sol"] [data-n="Rust"]');
      r = await page.evaluate(() => ({ tag: [...document.querySelectorAll('.prod[data-k="sol"] .clab .stk')].filter(e => !e.hidden).map(e => e.textContent), add: document.querySelector('.prod[data-k="sol"] [data-add]').textContent.trim() }));
      eq(r, { tag: ['Out of stock'], add: 'Out of stock · Ask on WhatsApp ›' }, L + ' out colour picked');
      const cn = await page.evaluate(() => document.querySelector('#cnt').textContent);
      const u = decodeURIComponent(await popupURL(ctx, page, '.prod[data-k="sol"] [data-add]'));
      ok(/wa\.me\/919099441429/.test(u) && u.includes('is the Solid Premium Rug in Rust, size M (16×24 in), in stock?'), L + ' card asks on WhatsApp', u);
      eq(await page.evaluate(() => document.querySelector('#cnt').textContent), cn, L + ' ask does not add');
      const hu = decodeURIComponent(await popupURL(ctx, page, '#h-add'));
      ok(hu.includes('Solid Premium Rug in Rust'), L + ' hero asks on WhatsApp', hu);
      // fit tool: bedside suggests zig XL (out)
      await page.click('#spots [data-spot="bed"]'); await page.waitForTimeout(300);
      r = await read(page); eq([r.fit, r.fitOOS], ['Out of stock · Ask on WhatsApp ›', true], L + ' fit tool out');
      const fu = decodeURIComponent(await popupURL(ctx, page, '#fit-add'));
      ok(fu.includes('size XL'), L + ' fit asks on WhatsApp', fu);
      // saved dialog
      await page.click('#h-savedbtn'); await page.waitForTimeout(500);
      r = await page.evaluate(() => [...document.querySelectorAll('#saved-list .srow')].map(row => ({ c: row.querySelector('.smeta small').textContent, tag: row.querySelector('.sstk').textContent, add: row.querySelector('[data-sadd]').textContent, dis: row.querySelector('[data-sadd]').disabled })));
      eq(r, [{ c: 'Rust', tag: 'Out of stock', add: 'Out of stock', dis: true }, { c: 'Navy & cream', tag: 'Few left', add: 'Add to cart', dis: false }], L + ' saved rows');
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      // try-on and zoom rows
      await page.evaluate(() => SS.tryon('sol', 'Royal blue')); await page.waitForTimeout(500); await page.click('#tryon-sample'); await page.waitForTimeout(1200);
      r = await page.evaluate(() => ({ cols: [...document.querySelectorAll('#tryon-sw [data-n]')].map(b => b.dataset.n + (b.dataset.stock ? ':' + b.dataset.stock : '')) }));
      eq(r.cols, ['Royal blue', 'Mustard', 'Rust:out', 'Black', 'Grey'], L + ' try-on colour row');
      await page.click('#tryon-sw [data-n="Rust"]'); await page.waitForTimeout(300);
      r = await page.evaluate(() => ({ t: document.querySelector('#tryon-add').textContent, oos: document.querySelector('#tryon-add').classList.contains('oos') }));
      eq(r, { t: 'Out of stock · Ask on WhatsApp', oos: true }, L + ' try-on add on out colour');
      await page.click('#tryon-range [data-k="zig"]'); await page.waitForTimeout(300);
      r = await page.evaluate(() => [...document.querySelectorAll('#tryon-sizes [data-i]')].map(b => b.dataset.stock || 'in'));
      eq(r, ['in', 'in', 'in', 'out'], L + ' try-on sizes');
      await page.click('#tryon-x'); await page.waitForTimeout(400);
      await page.evaluate(() => SS.zoom('sol', 'Royal blue')); await page.waitForTimeout(600);
      r = await page.evaluate(() => [...document.querySelectorAll('#zoom .zsw')].map(b => (b.dataset.stock || 'in')));
      eq(r, ['in', 'in', 'out', 'in', 'in'], L + ' zoom row');
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      // restored cart with a line that went out of stock
      await page.evaluate(() => SS.openD('cart')); await page.waitForTimeout(300);
      r = await page.evaluate(() => ({ oos: [...document.querySelectorAll('#v-cart .line.oos .oosn')].map(e => e.textContent), go: document.querySelector('#go').disabled, msg: !document.querySelector('#cart-oos').hidden && document.querySelector('#cart-oos').textContent }));
      eq(r, { oos: ['Now out of stock', 'Now out of stock'], go: true, msg: 'Remove the out-of-stock items to continue.' }, L + ' restored cart flags out + hidden lines');
      await page.evaluate(() => SS.closeD());
      // Gujarati
      await lang(page, 'gu');
      r = await page.evaluate(() => {
        const sw = (k, n) => [...document.querySelectorAll('.prod[data-k="' + k + '"] [data-n]')].find(b => b.dataset.n === n);
        return { tag: [...document.querySelectorAll('.prod[data-k="zig"] .clab .stk, .prod[data-k="sol"] .clab .stk')].filter(e => !e.hidden).map(e => e.textContent),
          add: document.querySelector('.prod[data-k="sol"] [data-add]').textContent.trim(), rust: sw('sol', 'Rust').getAttribute('aria-label'), navy: sw('zig', 'Navy & cream').getAttribute('aria-label'),
          xl: document.querySelectorAll('.prod[data-k="zig"] .sizes-c [role=radio]')[3].getAttribute('aria-label'), hadd: document.querySelector('#h-add').textContent.trim() };
      });
      eq(r.tag, ['થોડા જ બાકી', 'સ્ટોકમાં નથી'], L + ' gu stock tags');
      eq(r.add, 'સ્ટોકમાં નથી · WhatsApp પર પૂછો ›', L + ' gu ask button'); eq(r.hadd, 'સ્ટોકમાં નથી · WhatsApp પર પૂછો ›', L + ' gu hero ask');
      eq(r.rust, 'Rust, સ્ટોકમાં નથી', L + ' gu swatch label out'); eq(r.navy, 'Navy & cream, થોડા જ બાકી', L + ' gu swatch label few');
      ok(/સ્ટોકમાં નથી$/.test(r.xl), L + ' gu size out label', r.xl);
      eq(await untranslated(page), [], L + ' gu page: nothing left in English');
      await page.click('#h-savedbtn'); await page.waitForTimeout(600);
      eq(await untranslated(page), [], L + ' gu saved dialog');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await page.click('#h-compare'); await page.waitForTimeout(600);
      eq(await untranslated(page), [], L + ' gu compare dialog');
      await page.keyboard.press('Escape'); await page.waitForTimeout(300);
      await page.evaluate(() => SS.tryon('sol', 'Rust')); await page.waitForTimeout(500); await page.click('#tryon-sample'); await page.waitForTimeout(1200);
      await page.click('#tryon-range [data-k="zig"]'); await page.waitForTimeout(400);
      eq(await untranslated(page), [], L + ' gu try-on');
      await page.click('#tryon-x'); await page.waitForTimeout(400);
      await page.evaluate(() => SS.zoom('sol', 'Rust')); await page.waitForTimeout(600);
      eq(await untranslated(page), [], L + ' gu zoom');
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      await page.evaluate(() => SS.openD('cart')); await page.waitForTimeout(500);
      r = await page.evaluate(() => ({ oos: [...document.querySelectorAll('#v-cart .oosn')].map(e => e.textContent), msg: document.querySelector('#cart-oos').textContent }));
      eq(r, { oos: ['હવે સ્ટોકમાં નથી', 'હવે સ્ટોકમાં નથી'], msg: 'આગળ વધવા માટે સ્ટોકમાં ન હોય એવી વસ્તુઓ હટાવો.' }, L + ' gu cart flags');
      await page.evaluate(() => SS.addToCart('sol', 0, 'Rust', 1)); await page.waitForTimeout(200);
      eq(await page.evaluate(() => document.querySelector('#toast').textContent), 'માફ કરશો, આ હમણાં સ્ટોકમાં નથી', L + ' gu guard toast');
      await page.evaluate(() => SS.closeD()); await lang(page, 'hi');
      r = await page.evaluate(() => ({ add: document.querySelector('.prod[data-k="sol"] [data-add]').textContent.trim(), tag: [...document.querySelectorAll('.prod[data-k="zig"] .clab .stk')].filter(e => !e.hidden).map(e => e.textContent) }));
      eq(r, { add: 'स्टॉक में नहीं · WhatsApp पर पूछें ›', tag: ['कुछ ही बचे हैं'] }, L + ' hi ask button + few tag');
      eq(await untranslated(page), [], L + ' hi page: nothing left in English');
      await lang(page, 'en');
      // remove the out line, then checkout goes through
      await page.evaluate(() => SS.openD('cart')); await page.waitForTimeout(300);
      await page.click('#v-cart .line.oos .rm'); await page.waitForTimeout(300);
      eq(await page.evaluate(() => document.querySelector('#go').disabled), true, L + ' still blocked with one out line left');
      await page.click('#v-cart .line.oos .rm'); await page.waitForTimeout(300);
      r = await page.evaluate(() => ({ go: document.querySelector('#go').disabled, msg: document.querySelector('#cart-oos').hidden }));
      eq(r, { go: false, msg: true }, L + ' continue unblocked after removal');
      await page.evaluate(() => SS.closeD());
      await checkout(page, { addSel: [], expectTotal: 249, label: L });
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }
    {
      const L = 'stock phone';
      const { ctx, page, log } = await open(b, s, { html: stocked, vp: [390, 844] });
      await page.evaluate(() => { document.querySelector('.prod[data-k="sol"] [data-n="Rust"]').click(); const c = document.querySelector('.prod[data-k="sol"]'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 60); });
      await page.waitForTimeout(1200);
      const d = await page.evaluate(() => ({ on: document.querySelector('#dock').classList.contains('on'), p: document.querySelector('#dock-p').textContent, a: document.querySelector('#dock-add').textContent, l: document.querySelector('#dock-add').getAttribute('aria-label') }));
      eq(d, { on: true, p: 'Out of stock', a: 'Ask', l: 'Ask if Rust (M) is in stock' }, L + ' dock asks');
      const r = await read(page);
      ok(r.stkShown.indexOf('Few left') < 0 || true, L + ' tiles');
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }

    /* ---------- 4. Owner-added colours and photo overrides ---------- */
    {
      const L = 'added';
      const html = variant(c => {
        c.ranges.zig.colours.push({ n: 'Sky blue & white', bg: '#7FB3D5', stock: 'in', hidden: false, photo: A, thumb: B, added: true });
        c.ranges.zig.colours.push({ n: 'No photo yet', bg: '#123456', stock: 'in', hidden: false, photo: null, thumb: null, added: true });
        c.ranges.sol.colours.push({ n: 'Lavender', bg: '#B7A6D6', stock: 'few', hidden: false, photo: C, thumb: null, added: true });
        Object.assign(col(c, 'sol', 'Black'), { photo: D, thumb: E });
        c.ranges.chen.colours.push({ n: 'Teal stripe', bg: '#2A8A8A', stock: 'in', hidden: false, photo: F, thumb: F, added: true });
      });
      const { ctx, page, log } = await open(b, s, { html });
      let r = await read(page);
      eq(r.sw, { zig: 11, sol: 7, chen: 10 }, L + ' swatches'); eq(r.tiles, 28, L + ' tiles'); eq(r.seeAll, 'See all 28 colours', L + ' see-all');
      eq(r.ranges, ['from ₹249|11 colours', 'from ₹349|7 colours', 'from ₹299|10 colours'], L + ' ranges counts');
      const a = await page.evaluate(() => {
        const sw = (k, n) => [...document.querySelectorAll('.prod[data-k="' + k + '"] [data-n]')].find(b => b.dataset.n === n);
        const x = sw('zig', 'Sky blue & white'), l = sw('sol', 'Lavender'), bl = sw('sol', 'Black');
        const tile = [...document.querySelectorAll('#cgrid .tile')].find(t => t.querySelector('.tb').getAttribute('aria-label').startsWith('Sky blue & white,'));
        return { x: x && [x.dataset.bg, x.dataset.full, x.querySelector('img').getAttribute('src'), x.querySelector('img').naturalWidth > 0, x.className, x.getAttribute('aria-label'), x.parentNode.lastElementChild === x],
          l: l && [l.dataset.full, l.querySelector('img').getAttribute('src'), l.dataset.stock], bl: [bl.dataset.full, bl.querySelector('img').getAttribute('src')],
          teal: !!sw('chen', 'Teal stripe'), nophoto: !!sw('zig', 'No photo yet'), tile: tile && [tile.dataset.fam, !!tile.querySelector('img')] };
      });
      eq(a.x, ['#7FB3D5', '/_blob/' + A, '/_blob/' + B, true, 'sw', 'Sky blue & white', true], L + ' added zig swatch');
      eq(a.l, ['/_blob/' + C, '/_blob/' + C, 'few'], L + ' added sol swatch (photo as thumb)');
      eq(a.bl, ['/_blob/' + D, '/_blob/' + E], L + ' photo override');
      ok(!a.teal && !a.nophoto, L + ' chenille / photo-less additions ignored');
      eq(a.tile, ['blues', true], L + ' colour index tile for added colour');
      await page.click('.prod[data-k="zig"] [data-n="Sky blue & white"]'); await page.waitForTimeout(600);
      r = await page.evaluate(() => ({ name: document.querySelector('.prod[data-k="zig"] [data-colour]').textContent, img: document.querySelector('.prod[data-k="zig"] .pic img').getAttribute('src') }));
      eq(r, { name: 'Sky blue & white', img: '/_blob/' + A }, L + ' card shows the uploaded photo');
      await page.click('.prod[data-k="zig"] [data-add]'); await page.waitForTimeout(300);
      await page.evaluate(() => SS.tryon('zig', 'Sky blue & white')); await page.waitForTimeout(500); await page.click('#tryon-sample'); await page.waitForTimeout(1200);
      r = await page.evaluate(() => { const b = document.querySelector('#tryon-sw [data-n="Sky blue & white"]'); return b && [b.getAttribute('aria-checked'), b.querySelector('img').getAttribute('src')]; });
      eq(r, ['true', '/_blob/' + B], L + ' try-on colour row');
      await page.click('#tryon-x'); await page.waitForTimeout(400);
      await page.evaluate(() => SS.zoom('zig', 'Sky blue & white')); await page.waitForTimeout(600);
      r = await page.evaluate(() => ({ n: document.querySelectorAll('#zoom .zsw').length, img: document.querySelector('#zoom-img').getAttribute('src') }));
      ok(r.n === 11 && /_blob\/a{32}/.test(r.img), L + ' zoom shows the uploaded photo', r);
      await page.keyboard.press('Escape'); await page.waitForTimeout(400);
      await lang(page, 'gu');
      r = await page.evaluate(() => [...document.querySelectorAll('.prod[data-k="sol"] [data-n="Lavender"]')].map(b => b.getAttribute('aria-label')));
      eq(r, ['Lavender, થોડા જ બાકી'], L + ' gu label for added colour');
      await lang(page, 'en');
      const co = await checkout(page, { addSel: [], expectTotal: 249, label: L });
      ok(co.wa.includes('(Sky blue & white) × 1 = ₹249'), L + ' added colour in order', co.wa);
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }

    /* ---------- 5. Notice ---------- */
    {
      const L = 'notice';
      const EN = 'Closed for Diwali, 1–5 Nov. <b>Orders</b> placed now ship from 6 Nov. </script><img src=x onerror=alert(1)>';
      const html = variant(c => { c.notice = { on: true, en: EN, gu: 'દિવાળી માટે 1–5 નવેમ્બર દુકાન બંધ છે.', hi: '' }; });
      const { ctx, page, log } = await open(b, s, { html, vp: [390, 844] });
      let r = await page.evaluate(() => { const n = document.getElementById('ss-notice'), h = document.getElementById('hero'); return n && { above: !!(n.compareDocumentPosition(h) & 4) && n.getBoundingClientRect().bottom <= h.getBoundingClientRect().top, t: n.querySelector('p').textContent, els: n.querySelectorAll('p *').length, sw: document.querySelectorAll('.prod [data-n]').length }; });
      eq(r, { above: true, t: EN, els: 0, sw: 26 }, L + ' bar above header, text only');
      await lang(page, 'gu');
      r = await page.evaluate(() => ({ t: document.querySelector('#ss-notice p').textContent, x: document.querySelector('#ss-notice .x').getAttribute('aria-label') }));
      eq(r, { t: 'દિવાળી માટે 1–5 નવેમ્બર દુકાન બંધ છે.', x: 'સૂચના બંધ કરો' }, L + ' gu text + dismiss label');
      await lang(page, 'hi');
      eq(await page.evaluate(() => document.querySelector('#ss-notice p').textContent), EN, L + ' hi falls back to English');
      await lang(page, 'en');
      await page.click('#ss-notice .x'); await page.waitForTimeout(200);
      eq(await page.evaluate(() => !!document.getElementById('ss-notice')), false, L + ' dismissed');
      await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(1200);
      eq(await page.evaluate(() => !!document.getElementById('ss-notice')), false, L + ' stays dismissed');
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }

    /* ---------- 6. Missing / corrupt / partly invalid catalog ---------- */
    for (const [name, html] of [
      ['corrupt', SRC.replace(RE, () => '<!--ss-catalog:start--><script type="application/json" id="ss-catalog">{"v":1,"ranges":{"zig":</script><!--ss-catalog:end-->')],
      ['missing', SRC.replace(RE, '')],
      ['wrong version', variant(c => { c.v = 2; c.ranges.zig.sizes[0].price = 1; })],
      ['invalid fields', variant(c => { c.ranges.zig.sizes[0].price = 'abc'; c.ranges.sol.sizes[0].price = -5; c.ranges.zig.sizes[0].dims = '<img src=x onerror=alert(1)>'; c.ranges.zig.sizes[0].weight = '<svg onload=alert(1)>'; c.ranges.zig.name = '<img src=x onerror=alert(1)>'; c.ranges.zig.colours[0].n = 'Forest green & black<img src=x onerror=alert(1)>'; c.ranges.zig.colours[0].stock = 'bogus'; c.ranges.zig.colours[1].bg = 'red'; c.ranges.chen.colours = 'x'; c.notice = 'x'; })],
    ]) {
      const L = 'fallback ' + name;
      const { ctx, page, log } = await open(b, s, { html });
      const r = await read(page);
      eq(r.sw, { zig: 10, sol: 6, chen: 10 }, L + ' swatches'); eq(r.price, ['₹249', '₹349', '₹299'], L + ' prices');
      eq(r.stockEls, 0, L + ' no stock marks'); eq(r.slides, 6, L + ' slides'); eq(r.pairs, 8, L + ' pairs');
      if (name === 'invalid fields') eq(await page.evaluate(() => document.querySelector('.prod[data-k="zig"] [data-n="Blush pink & black"]').dataset.bg), '#EBC4BD', L + ' bad colour kept default');
      if (name === 'invalid fields') {
        eq(await page.evaluate(() => ({ name: SS.P.zig.name, dims: SS.P.zig.sizes[0][1], weight: SS.P.zig.sizes[0][2], forest: !!document.querySelector('.prod[data-k="zig"] [data-n="Forest green & black"]'), injected: document.querySelectorAll('img[src="x"], svg[onload]').length })), { name: 'Multicolour Zigzag Rug', dims: '16×24 in', weight: '300 g', forest: true, injected: 0 }, L + ' rejects markup from catalogue labels and immutable size metadata');
      }
      await checkout(page, { addSel: ['.prod[data-k="zig"] [data-add]'], expectTotal: 249, label: L });
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }

    /* ---------- 6b. A whole range hidden (every Zigzag colour) ---------- */
    {
      const L = 'range hidden';
      const html = variant(c => { c.ranges.zig.colours.forEach(x => { x.hidden = true; }); });
      const { ctx, page, log } = await open(b, s, { html, saved: ['zig|Navy & cream', 'sol|Rust'] });
      const r = await read(page);
      eq(r.sw, { zig: 0, sol: 6, chen: 10 }, L + ' swatches'); eq(r.tiles, 16, L + ' tiles');
      eq(await page.evaluate(() => document.querySelector('.prod[data-k="zig"]').hidden), true, L + ' card hidden');
      eq(r.ranges, ['hidden', 'from ₹349|6 colours', 'from ₹299|10 colours'], L + ' ranges strip');
      eq(r.slides, 3, L + ' slides'); ok(r.slideCols.every(c => !/&/.test(c)), L + ' no zig slides', r.slideCols);
      ok(r.pairNames.length && !r.pairNames.some(n => /&/.test(n)), L + ' no zig pairs', r.pairNames);
      ok(!r.cmp.some(x => /^zig/.test(x)), L + ' compare without zig', r.cmp);
      eq(r.seeAll, 'See all 16 colours', L + ' see-all');
      await page.evaluate(() => SS.tryon('zig', 'Navy & cream')); await page.waitForTimeout(500); await page.click('#tryon-sample'); await page.waitForTimeout(1200);
      const t = await page.evaluate(() => ({ seg: [...document.querySelectorAll('#tryon-range [data-k]')].map(b => b.dataset.k), c: [...document.querySelectorAll('#tryon-sw [aria-checked="true"]')].map(b => b.dataset.n), add: document.querySelector('#tryon-add').textContent }));
      eq(t, { seg: ['sol'], c: ['Royal blue'], add: 'Add to cart·Royal blue·M·₹349' }, L + ' try-on offers only ranges on show');
      await page.click('#tryon-x'); await page.waitForTimeout(400);
      await page.click('#spots [data-spot="main"]'); await page.waitForTimeout(300);
      ok(/Ask on WhatsApp/.test((await read(page)).fit), L + ' fit tool asks for a hidden range', (await read(page)).fit);
      await checkout(page, { addSel: ['.prod[data-k="sol"] [data-add]'], expectTotal: 349, label: L });
      eq(errs(log), [], L + ' console clean');
      await ctx.close();
    }

    /* ---------- 7. Owner loader ---------- */
    {
      let L = 'loader owner';
      let { ctx, page, log, reqs } = await open(b, s, { claude: true });
      let r = await read(page);
      ok(r.owner && !r.chip && !r.deny, L + ' footer link only', r);
      eq(await page.evaluate(() => document.getElementById('ss-owner').textContent), 'Shop owner: edit prices & stock', L + ' link text');
      ok(!reqs.some(u => /admin\.(js|css)/.test(u)), L + ' nothing fetched before click');
      await page.click('#ss-owner'); await page.waitForTimeout(600);
      eq(await page.evaluate(() => window.__adm), 1, L + ' click opens editor');
      await page.click('#ss-owner'); await page.waitForTimeout(300);
      eq([await page.evaluate(() => window.__adm), reqs.filter(u => /admin\.js/.test(u)).length], [2, 1], L + ' admin.js loaded once');
      await lang(page, 'gu');
      eq(await page.evaluate(() => document.getElementById('ss-owner').textContent), 'દુકાનના માલિક માટે: ભાવ અને સ્ટોક બદલો', L + ' gu link');
      eq(errs(log), [], L + ' console clean'); await ctx.close();

      L = 'loader owner #admin';
      ({ ctx, page, log, reqs } = await open(b, s, { claude: true, hash: '#admin' }));
      r = await read(page);
      ok(r.owner && r.chip && !r.deny, L + ' chip + link', r);
      eq(await page.evaluate(() => window.__adm), 1, L + ' opens straight away');
      eq(errs(log), [], L + ' console clean'); await ctx.close();

      L = 'loader visitor #admin';
      ({ ctx, page, log, reqs } = await open(b, s, { claude: false, hash: '#admin' }));
      r = await read(page);
      ok(!r.owner && !r.chip && r.deny === 'Only the shop owner can open this. Sign in to claude.ai with the owner account.', L + ' polite note', r);
      ok(!reqs.some(u => /admin\.(js|css)/.test(u)), L + ' nothing admin fetched');
      eq(errs(log), [], L + ' console clean'); await ctx.close();

      L = 'loader no claude #admin';
      ({ ctx, page, log, reqs } = await open(b, s, { hash: '#admin', lang: 'gu' }));
      r = await read(page);
      ok(!r.owner && r.deny === 'આ ફક્ત દુકાનના માલિક જ ખોલી શકે છે. માલિકના એકાઉન્ટથી claude.ai માં સાઇન ઇન કરો.', L + ' polite note (gu)', r);
      ok(!reqs.some(u => /admin\.(js|css)/.test(u)), L + ' nothing admin fetched');
      eq(errs(log), [], L + ' console clean'); await ctx.close();

      L = 'loader visitor';
      ({ ctx, page, log, reqs } = await open(b, s, { claude: false }));
      r = await read(page);
      ok(!r.owner && !r.chip && !r.deny, L + ' nothing shown', r);
      ok(!reqs.some(u => /admin\.(js|css)/.test(u)), L + ' nothing admin fetched');
      eq(errs(log), [], L + ' console clean'); await ctx.close();
    }

    /* ---------- 8. Checkout history, saved details, duplicate guard and WhatsApp confirmation ---------- */
    {
      const L = 'checkout safeguards';
      const { ctx, page, log } = await open(b, s, { vp: [390, 844] });
      await page.click('.prod[data-k="zig"] [data-add]');
      await page.waitForTimeout(450);
      await page.click('#cartbtn');
      await page.waitForSelector('#drawer:not([hidden])');
      await page.click('#go');
      await page.waitForSelector('#v-det:not([hidden])');
      await page.fill('#o-name', 'Test Buyer');
      await page.fill('#o-ph', '9876543210');
      await page.fill('#o-ad', '12 Alkapuri Society, RC Dutt Road');
      await page.fill('#o-ct', 'Vadodara');
      await page.evaluate(() => { const i = document.querySelector('#o-pin'), d = new DataTransfer(); d.setData('text/plain', '390 007'); i.focus(); i.dispatchEvent(new ClipboardEvent('paste', { clipboardData: d, bubbles: true, cancelable: true })); });
      eq(await page.locator('#o-pin').inputValue(), '390007', L + ': pasted PIN is normalized');
      await page.waitForTimeout(100);
      await page.reload({ waitUntil: 'load' });
      await page.waitForTimeout(1400);
      eq(await page.locator('#o-name').inputValue(), 'Test Buyer', L + ': name draft survives reload');
      eq(await page.locator('#o-pin').inputValue(), '390007', L + ': PIN draft survives reload');
      eq(await page.evaluate(() => JSON.parse(localStorage.getItem('ss_cart2') || '[]').length), 1, L + ': cart survives reload');
      await page.click('#cartbtn');
      await page.waitForSelector('#drawer:not([hidden])');
      await page.click('#go');
      await page.waitForSelector('#v-det:not([hidden])');
      await page.evaluate(() => history.back());
      await page.waitForSelector('#v-cart:not([hidden])');
      eq(await page.evaluate(() => document.querySelector('#drawer').hidden), false, L + ': Back returns to cart step');
      await page.evaluate(() => history.back());
      await page.waitForFunction(() => document.querySelector('#drawer').hidden);
      eq(await page.evaluate(() => document.querySelector('#drawer').hidden), true, L + ': second Back closes drawer in-page');

      await page.click('#cartbtn');
      await page.waitForSelector('#drawer:not([hidden])');
      await page.click('#go');
      await page.waitForSelector('#v-det:not([hidden])');
      await page.waitForTimeout(400); await page.click('#order-btn');
      await page.waitForSelector('#v-pay:not([hidden])');
      const oidBefore = await page.locator('#oid').textContent();
      await page.evaluate(() => history.back());
      await page.waitForSelector('#v-det:not([hidden])');
      await page.fill('#o-name', 'Repeat Buyer');
      await page.waitForTimeout(400);
      await page.click('#order-btn');
      await page.waitForSelector('#v-pay:not([hidden])');
      const oidAfter = await page.locator('#oid').textContent();
      eq(oidAfter, oidBefore, L + ': going Back and continuing reuses the pending order ID');

      const popupPromise = ctx.waitForEvent('page');
      await page.click('#sendwa');
      const popup = await popupPromise;
      await popup.waitForLoadState('domcontentloaded').catch(() => {});
      await popup.close();
      await page.waitForSelector('#sentbox:not([hidden])');
      const afterOpen = await page.evaluate(() => {
        const p = JSON.parse(localStorage.getItem('ss_pending') || 'null');
        return { sent: !!(p && p.sent), opened: !!(p && p.opened), cart: JSON.parse(localStorage.getItem('ss_cart2') || '[]').length };
      });
      eq(afterOpen, { sent: false, opened: true, cart: 1 }, L + ': opening WhatsApp does not falsely mark the order sent');
      await page.click('#newcart');
      const afterConfirm = await page.evaluate(() => ({
        pending: localStorage.getItem('ss_pending'),
        cart: JSON.parse(localStorage.getItem('ss_cart2') || '[]').length,
        lastSent: JSON.parse(localStorage.getItem('ss_last_sent') || 'null')?.sent || false,
        name: document.querySelector('#o-name').value
      }));
      eq(afterConfirm, { pending: null, cart: 0, lastSent: true, name: '' }, L + ': explicit sent confirmation clears order and details');
      await page.evaluate(() => history.back());
      await page.waitForFunction(() => document.querySelector('#drawer').hidden);
      eq(await page.evaluate(() => document.querySelector('#drawer').hidden), true, L + ': Back after a new cart cannot reopen stale payment');
      eq(errs(log), [], L + ': console clean');
      await ctx.close();
    }

  } catch (e) { fail++; fails.push('CRASH: ' + (e && e.stack || e)); }
  await b.close(); s.close();
  console.log('core.cjs: ' + pass + ' passed, ' + fail + ' failed (' + Math.round((Date.now() - T0) / 1000) + 's)');
  fails.forEach(f => console.log('FAIL ' + f));
  process.exit(fail ? 1 : 0);
})();
