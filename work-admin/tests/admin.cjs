// End-to-end test of the Soft Steps Admin (admin.js + admin.css) against a mocked claude.ai runtime.
// Usage: node admin.cjs            (NODE_PATH=$(npm root -g) if require('playwright') fails)
// Builds tests/www/index.html exactly like the stored artifact page (fixed wrapper + softsteps.html), serves it
// byte-for-byte, and drives the editor as the owner at 390×844 and 1440×900; then checks the published page in the
// shop, the error paths, non-owners, 320px, and the bare softsteps.html served by audit/serve.cjs.
// Screenshots go to work/admin/shots/. Exit code 1 if any check fails.
const fs = require('fs'), path = require('path'), http = require('http');
const { chromium } = require('playwright');
const SP = '/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad';
const WORK = SP + '/work/admin', SITE = WORK + '/site', T = WORK + '/tests', SHOTS = WORK + '/shots';
const PHOTO = SP + '/tryon_test/doorway.jpg';
const { prep } = require(SP + '/qa.cjs');
const { serve } = require(SP + '/audit/serve.cjs');
const MOCK = fs.readFileSync(T + '/mock-claude.js', 'utf8');
const START = '<!--ss-catalog:start-->', END = '<!--ss-catalog:end-->';
const OPEN_TAG = '<script type="application/json" id="ss-catalog">', CLOSE_TAG = '</script>';
// The platform's fixed wrapper around softsteps.html (copied from a stored index.html of the live artifact).
const WRAP_HEAD = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>\n';
const WRAP_TAIL = '\n</body></html>';

/* ------------------------------------------------------------------ results */
const results = []; let failed = 0;
function check(ok, msg, extra) { results.push((ok ? 'PASS ' : 'FAIL ') + msg + (extra !== undefined && !ok ? '  → ' + JSON.stringify(extra).slice(0, 400) : '')); if (!ok) failed++; }
function log(m) { console.log(m); }

/* ------------------------------------------------------------------ test site */
function catalogBlockFor(html) {
  // Contract §1 block from the page's own data, used only if the shop page doesn't have one yet.
  const out = require('child_process').execFileSync('node', [WORK + '/gencat.cjs', '/dev/stdin'], { input: html }).toString();
  return START + OPEN_TAG + out + CLOSE_TAG + END;
}
function linkSiteFiles(dir, html) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  for (const f of fs.readdirSync(SITE)) { if (f === 'softsteps.html') continue; fs.symlinkSync(fs.realpathSync(path.join(SITE, f)), path.join(dir, f)); }
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}
function buildTestSite() {
  let page = fs.readFileSync(SITE + '/softsteps.html', 'utf8');
  if (page.indexOf(START) < 0) {
    const i = page.search(/<script>\s*\(function\(\)\{\s*window\.SSFX/);
    page = page.slice(0, i) + catalogBlockFor(page) + '\n' + page.slice(i);
    log('note: inserted a contract §1 catalog block into the test copy');
  }
  const html = WRAP_HEAD + page + WRAP_TAIL;
  linkSiteFiles(T + '/www', html);
  return html;
}

/* ------------------------------------------------------------------ servers + browser contexts */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.avif': 'image/avif', '.json': 'application/json' };
function rawServe(dir) {   // serves files exactly as stored (like the platform serves index.html)
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      let u = decodeURIComponent(q.url.split('?')[0]); if (u.endsWith('/')) u += 'index.html';
      const p = path.join(dir, u);
      if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream', 'cache-control': 'no-store' });
      fs.createReadStream(p).pipe(r);
    });
    srv.listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}
function get(url) { return new Promise((res, rej) => http.get(url, r => { let b = ''; r.setEncoding('utf8'); r.on('data', d => b += d); r.on('end', () => res(b)); }).on('error', rej)); }

const blobs = new Map();   // asset id → {type, body}, filled by the mock's uploads, served at /_blob/<id>
async function context(b, vp, cfg = {}) {
  const ctx = await b.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: 1, hasTouch: vp[0] < 800, reducedMotion: cfg.reduced ? 'reduce' : 'no-preference' });
  if (!cfg.noClaude) {
    const ls = Object.assign({ mock_canEdit: cfg.owner ? '1' : '0' }, cfg.ls || {});
    await ctx.addInitScript(o => { try { if (!localStorage.getItem('mock_init')) { for (const k in o) localStorage.setItem(k, o[k]); localStorage.setItem('mock_init', '1'); } } catch (e) {} }, ls);
    await ctx.addInitScript({ content: MOCK });
    await ctx.exposeBinding('__mockBlobSink', (src, id, type, b64) => { blobs.set(id, { type, body: Buffer.from(b64, 'base64') }); return true; });
  }
  await ctx.route(/\/_blob\/[0-9a-f]{32}$/, r => { const id = r.request().url().slice(-32), x = blobs.get(id); return x ? r.fulfill({ status: 200, contentType: x.type, body: x.body }) : r.fulfill({ status: 404, body: '' }); });
  const page = await ctx.newPage(); page.setDefaultTimeout(45000);
  const plog = []; await prep(page, plog);
  const reqs = []; page.on('request', r => reqs.push(r.url()));
  const dialogs = []; page.on('dialog', d => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
  return { ctx, page, plog, reqs, dialogs };
}

/* ------------------------------------------------------------------ page helpers */
const fk = v => `#ssadm [data-fk="${v.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`;
let shotN = 0;
async function shot(page, tag, name, full) { const f = path.join(SHOTS, `${tag}-${String(++shotN).padStart(2, '0')}-${name}.png`); await page.screenshot({ path: f, fullPage: !!full }); return f; }
async function settle(page, ms = 350) { await page.waitForTimeout(ms); }
async function tab(page, t) { await page.click(fk('tab|' + t)); await page.waitForSelector(`#ssadm .ssa-tab[data-tab="${t}"][aria-selected="true"]`); await settle(page); }
async function range(page, k) { await page.click(fk('range|' + k)); await page.waitForSelector(fk('range|' + k) + '[aria-checked="true"]'); }
async function barText(page) { return (await page.locator('#ssadm .ssa-bar').innerText()).replace(/\s+/g, ' ').trim(); }
async function choosePhoto(page, sel) { const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click(sel)]); await fc.setFiles(PHOTO); }
async function openAdminFromFooter(page) {
  await page.waitForSelector('#ss-owner', { state: 'attached', timeout: 30000 });
  await page.locator('#ss-owner').scrollIntoViewIfNeeded();
  await page.click('#ss-owner');
  await page.waitForSelector('#ssadm .ssa-tab[aria-selected="true"]', { timeout: 30000 });
  await settle(page, 500);
}
async function overflow(page) {
  return page.evaluate(() => { const m = document.querySelector('#ssadm .ssa-main'), r = document.getElementById('ssadm'); return { main: m.scrollWidth - m.clientWidth, root: r.scrollWidth - r.clientWidth, doc: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
}
async function smallTargets(page) {
  return page.evaluate(() => [...document.querySelectorAll('#ssadm button, #ssadm input:not(.ssa-file), #ssadm textarea')].filter(e => {
    const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44);
  }).map(e => (e.getAttribute('data-fk') || e.className) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height)));
}
function splitBlock(html) {
  const a = html.indexOf(START), b = html.indexOf(END);
  return { a, b, count: [html.split(START).length - 1, html.split(END).length - 1], before: html.slice(0, a + START.length), inner: html.slice(a + START.length, b), after: html.slice(b) };
}
function readBlockJSON(inner) {
  if (!inner.startsWith(OPEN_TAG) || !inner.endsWith(CLOSE_TAG)) return { err: 'block form' };
  const json = inner.slice(OPEN_TAG.length, -CLOSE_TAG.length);
  try { return { json, cat: JSON.parse(json) }; } catch (e) { return { err: e.message, json }; }
}

/* ------------------------------------------------------------------ 1. the owner's full edit → publish, per viewport */
async function ownerFlow(b, base, srcHtml, vp, tag) {
  shotN = 0;
  const { ctx, page, plog, reqs } = await context(b, vp, { owner: true });
  await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('#ss-owner', { state: 'attached', timeout: 30000 });
  check(!reqs.some(u => /admin\.(js|css)/.test(u)), `[${tag}] admin.js/css not fetched before the owner asks`);
  await page.locator('#ss-owner').scrollIntoViewIfNeeded(); await settle(page, 600);
  await shot(page, tag, 'footer-owner-link');
  await openAdminFromFooter(page);
  check(reqs.filter(u => /admin\.js/.test(u)).length === 1 && reqs.filter(u => /admin\.css/.test(u)).length === 1, `[${tag}] admin.js and admin.css loaded once`);
  check(await page.evaluate(() => document.activeElement && document.activeElement.id === 'ssa-title'), `[${tag}] focus moves to the admin title`);
  await page.waitForSelector('#ssadm .ssa-av:not([hidden])', { timeout: 10000 }).catch(() => {});
  check((await page.locator('#ssadm .ssa-who').innerText()).includes('Jelam Panchal'), `[${tag}] header shows the owner's name`);
  check(await page.evaluate(() => location.hash === '#admin'), `[${tag}] URL carries #admin while open`);
  await shot(page, tag, 'prices');

  /* Prices: Zigzag M 249 → 259; a typo shows an error and blocks; Solid XL not available */
  await page.fill(fk('price|zig|M'), '259');
  check((await page.locator('#ssa-p-zig-M-h').innerText()).includes('Was ₹249 — now ₹259'), `[${tag}] price hint shows was/now`);
  await page.fill(fk('price|zig|L'), '3a9');
  check(await page.locator('#ssa-p-zig-L-e').isVisible(), `[${tag}] bad price shows an error`);
  check(/Fix the field/.test(await barText(page)), `[${tag}] bar blocks publishing while a price is wrong`, await barText(page));
  await page.locator(fk('price|zig|L')).scrollIntoViewIfNeeded();
  await shot(page, tag, 'price-error');
  await page.fill(fk('price|zig|L'), '349');
  check(!(await page.locator('#ssa-p-zig-L-e').isVisible()), `[${tag}] error clears when fixed`);
  await page.fill(fk('price|zig|H'), '120000');
  check(await page.locator('#ssa-p-zig-H-e').isVisible(), `[${tag}] price over 99,999 refused`);
  await page.fill(fk('price|zig|H'), '249');
  await range(page, 'sol');
  await page.click(fk('avail|sol|XL'));
  check(await page.getAttribute(fk('avail|sol|XL'), 'aria-checked') === 'false', `[${tag}] Solid XL switched to not available`);
  await shot(page, tag, 'prices-solid');
  check(/2 changes · Review & publish/.test(await barText(page)), `[${tag}] bar counts 2 changes`, await barText(page));

  /* Stock: Navy & cream few, Olive & cream out, hide Grey & black; arrows work and undo themselves */
  await tab(page, 'stock'); await range(page, 'zig');
  await page.click(fk('stock|zig|Navy & cream|few'));
  await page.click(fk('stock|zig|Olive & cream|out'));
  await page.click(fk('hide|zig|Grey & black'));
  await page.focus(fk('stock|zig|Cocoa & cream|in')); await page.keyboard.press('ArrowRight'); await settle(page, 150);
  check(await page.getAttribute(fk('stock|zig|Cocoa & cream|few'), 'aria-checked') === 'true', `[${tag}] arrow key moves the stock choice`);
  await page.keyboard.press('ArrowLeft'); await settle(page, 150);
  check(await page.getAttribute(fk('stock|zig|Cocoa & cream|in'), 'aria-checked') === 'true', `[${tag}] arrow back restores In stock`);
  check(/5 changes/.test(await barText(page)), `[${tag}] returning to the published value is not a change`, await barText(page));
  await page.locator(fk('stock|zig|Navy & cream|few')).scrollIntoViewIfNeeded();
  await shot(page, tag, 'stock');
  await page.click(fk('only-out'));
  check(await page.locator('#ssadm .ssa-colour').count() === 1, `[${tag}] "Show only out of stock" filters to 1 colour`);
  await shot(page, tag, 'stock-only-out');
  await page.click(fk('only-out'));

  /* Photos: new photo for Mustard & tan from doorway.jpg */
  await tab(page, 'photos');
  await choosePhoto(page, fk('photo|zig|Mustard & tan'));
  await page.waitForSelector(fk('sheet-use'), { timeout: 60000 });
  const meta = await page.locator('#ssadm .ssa-sheet .ssa-pv-main figcaption').innerText();
  check(/WebP|JPEG/.test(meta), `[${tag}] preview shows the prepared photo (${meta})`);
  const dims = await page.evaluate(() => [...document.querySelectorAll('#ssadm .ssa-sheet canvas')].map(c => [c.width, c.height]));
  check(Math.max(...dims[0]) <= 1600 && dims[1][0] === 400 && dims[1][1] === 400, `[${tag}] main ≤1600px, thumb 400×400`, dims);
  await shot(page, tag, 'photo-preview');
  await page.click(fk('sheet-use'));
  await page.waitForSelector('#ssadm .ssa-sheet', { state: 'detached', timeout: 60000 });
  await settle(page, 400);
  const thumbSrc = await page.locator('#ssadm .ssa-photo:has(.ssa-cname:text-is("Mustard & tan")) .ssa-th img').getAttribute('src');
  check(/^\/_blob\/[0-9a-f]{32}$/.test(thumbSrc || ''), `[${tag}] photo card now shows the uploaded thumbnail`, thumbSrc);
  const thumbLoaded = await page.evaluate(() => { const i = [...document.querySelectorAll('#ssadm .ssa-photo')].find(li => li.querySelector('.ssa-cname').textContent === 'Mustard & tan').querySelector('img'); return i.complete && i.naturalWidth === 400; });
  check(thumbLoaded, `[${tag}] uploaded thumbnail loads from /_blob/ (400px)`);
  await page.locator(fk('photo|zig|Mustard & tan')).scrollIntoViewIfNeeded();
  await shot(page, tag, 'photo-done');
  await range(page, 'chen');
  check((await page.locator('#ssadm .ssa-panel').innerText()).includes('one shared photo'), `[${tag}] Chenille explains its shared photo`);
  await range(page, 'zig');

  /* New colour: validation, then Teal & white with a photo */
  await tab(page, 'new');
  await page.click(fk('new-add'));
  check(await page.locator('#ssa-nn-e').isVisible() && await page.locator('#ssa-np-e').isVisible(), `[${tag}] empty form shows name + photo errors`);
  await shot(page, tag, 'new-errors');
  await page.fill(fk('new-name'), 'Teal <b>');
  await page.click(fk('new-add'));
  check((await page.locator('#ssa-nn-e').innerText()).includes('letters, numbers'), `[${tag}] "<" in a name is refused`);
  await page.fill(fk('new-name'), 'navy & CREAM');
  await page.click(fk('new-add'));
  check((await page.locator('#ssa-nn-e').innerText()).includes('already has'), `[${tag}] duplicate name refused (any case)`);
  await page.fill(fk('new-name'), 'x'.repeat(45));
  check((await page.inputValue(fk('new-name'))).length === 40, `[${tag}] name capped at 40 characters`);
  await choosePhoto(page, fk('new-photo'));
  await page.waitForSelector('#ssadm .ssa-form .ssa-pv canvas', { timeout: 60000 });
  const suggested = await page.inputValue(fk('new-colour'));
  check(/^#[0-9a-f]{6}$/.test(suggested) && suggested !== '#8f806f', `[${tag}] colour suggested from the photo (${suggested})`);
  await page.fill(fk('new-name'), '  Teal   & white ');
  await page.locator(fk('new-add')).scrollIntoViewIfNeeded();
  await shot(page, tag, 'new-ready');
  await page.click(fk('new-add'));
  await page.waitForSelector('#ssadm .ssa-added .ssa-cname:text-is("Teal & white")', { timeout: 60000 });
  await page.locator('#ssadm .ssa-added').first().scrollIntoViewIfNeeded();
  await shot(page, tag, 'new-added');

  /* Notice: on without text is blocked; then English + Gujarati */
  await tab(page, 'notice');
  await page.click(fk('notice|on'));
  check(await page.locator('#ssa-nt-en-e').isVisible() && /Fix the field/.test(await barText(page)), `[${tag}] notice on without English is blocked`);
  await shot(page, tag, 'notice-error');
  const EN = 'Closed for Diwali from 1 to 3 November. Orders placed now are sent on 4 November.';
  await page.fill(fk('notice|en'), EN);
  await page.fill(fk('notice|gu'), 'દિવાળી માટે 1 થી 3 નવેમ્બર સુધી બંધ. હમણાંના ઓર્ડર 4 નવેમ્બરે મોકલાશે.');
  await page.fill(fk('notice|en'), EN + ' ' + 'z'.repeat(200));
  check((await page.inputValue(fk('notice|en'))).length === 140, `[${tag}] English notice capped at 140`);
  await page.fill(fk('notice|en'), EN);
  check((await page.locator('#ssadm .ssa-notice-pv').innerText()) === EN, `[${tag}] notice preview shows the text`);
  await shot(page, tag, 'notice');

  /* Draft survives in sessionStorage */
  const draft = await page.evaluate(() => JSON.parse(sessionStorage.getItem('ss-admin-draft-v1') || 'null'));
  check(draft && draft.edits.length === 8, `[${tag}] draft kept in sessionStorage (8 edits)`, draft && draft.edits.map(e => e[0]));

  /* Review */
  const bt = await barText(page);
  check(/8 changes · Review & publish/.test(bt), `[${tag}] bar: "8 changes · Review & publish"`, bt);
  await page.click(fk('review'));
  await page.waitForSelector('#ssadm .ssa-review');
  const rv = await page.locator('#ssadm .ssa-review').innerText();
  for (const s of ['Zigzag M price ₹249 → ₹259', 'Solid XL: Not available', 'Navy & cream: Few left', 'Olive & cream: Out of stock', 'Grey & black: Hidden from shop', 'Mustard & tan: New photo', 'New colour: Teal & white', 'Notice: On — “' + EN + '”'])
    check(rv.includes(s), `[${tag}] review lists "${s}"`, rv);
  check(await page.evaluate(() => document.activeElement && document.activeElement.getAttribute('data-fk') === 'review-h'), `[${tag}] focus moves to the review heading`);
  await shot(page, tag, 'review');
  if (tag === 'phone') {   // the whole review screen in one picture: grow the window to fit it
    const hgt = await page.evaluate(() => { const m = document.querySelector('#ssadm .ssa-main'); return m.scrollHeight + document.querySelector('#ssadm .ssa-hd').offsetHeight + document.querySelector('#ssadm .ssa-bar').offsetHeight + 8; });
    await page.setViewportSize({ width: vp[0], height: Math.max(vp[1], hgt) }); await settle(page, 300);
    await shot(page, tag, 'review-full');
    await page.setViewportSize({ width: vp[0], height: vp[1] }); await settle(page, 300);
  }

  /* Publish */
  await page.click(fk('publish'));
  await page.waitForFunction(() => typeof window.__published === 'string', null, { timeout: 60000 });
  await page.waitForSelector('#ssadm .ssa-h2:text-is("Published ✓")', { timeout: 30000 });
  await shot(page, tag, 'published');
  const pub = await page.evaluate(() => window.__published);
  check(await page.evaluate(() => window.__publishCalls) === 1, `[${tag}] publish called once`);
  check(await page.evaluate(() => sessionStorage.getItem('ss-admin-draft-v1')) === null, `[${tag}] draft cleared after publishing`);

  /* The published document: byte-identical outside the markers, expected JSON inside */
  const A = splitBlock(srcHtml), B = splitBlock(pub);
  check(/^<!doctype html/i.test(pub), `[${tag}] published html starts with <!doctype html`);
  check(B.count[0] === 1 && B.count[1] === 1, `[${tag}] exactly one start and one end marker`, B.count);
  check(A.before === B.before && A.after === B.after, `[${tag}] byte-identical outside the markers`, { lenA: srcHtml.length, lenB: pub.length });
  const pj = readBlockJSON(B.inner);
  check(!pj.err, `[${tag}] block is exactly <script type="application/json" id="ss-catalog">JSON</script>`, pj.err);
  check(pj.json && pj.json.indexOf('<') < 0, `[${tag}] no "<" inside the serialized JSON`);
  const c = pj.cat || { ranges: { zig: { sizes: [], colours: [] }, sol: { sizes: [], colours: [] }, chen: { sizes: [], colours: [] } }, notice: {} };
  const o = readBlockJSON(A.inner).cat;
  const col = (k, n) => c.ranges[k].colours.find(x => x.n === n) || {};
  check(c.v === 1 && !isNaN(Date.parse(c.updatedAt)), `[${tag}] v:1 and updatedAt set`, c.updatedAt);
  check(c.ranges.zig.sizes[0].price === 259 && c.ranges.zig.sizes[0].id === 'M', `[${tag}] zig M price 259`);
  check(c.ranges.sol.sizes[3].stock === 'out', `[${tag}] sol XL stock out`);
  check(col('zig', 'Navy & cream').stock === 'few' && col('zig', 'Olive & cream').stock === 'out' && col('zig', 'Grey & black').hidden === true, `[${tag}] stock few/out + hidden saved`);
  const mt = col('zig', 'Mustard & tan');
  check(/^[0-9a-f]{32}$/.test(mt.photo) && /^[0-9a-f]{32}$/.test(mt.thumb) && mt.photo !== mt.thumb && mt.added === false, `[${tag}] photo + thumb asset ids saved`, mt);
  const tw = col('zig', 'Teal & white');
  check(tw.added === true && /^#[0-9A-F]{6}$/.test(tw.bg) && /^[0-9a-f]{32}$/.test(tw.photo) && /^[0-9a-f]{32}$/.test(tw.thumb) && tw.stock === 'in' && tw.hidden === false, `[${tag}] new colour saved`, tw);
  check(c.ranges.zig.colours[c.ranges.zig.colours.length - 1].n === 'Teal & white', `[${tag}] new colour appended at the end`);
  check(c.notice.on === true && c.notice.en === EN && c.notice.gu.startsWith('દિવાળી') && c.notice.hi === '', `[${tag}] notice saved`, c.notice);
  // nothing else changed
  const strip = x => { const y = JSON.parse(JSON.stringify(x)); delete y.updatedAt; y.notice = null; y.ranges.zig.sizes[0].price = 0; y.ranges.sol.sizes[3].stock = 0; y.ranges.zig.colours = y.ranges.zig.colours.filter(q => q.n !== 'Teal & white').map(q => (['Navy & cream', 'Olive & cream', 'Grey & black', 'Mustard & tan'].includes(q.n) ? { n: q.n } : q)); return JSON.stringify(y); };
  check(o && strip(o) === strip(c), `[${tag}] every other catalog value unchanged`);
  check(!plog.filter(l => !/REQFAIL.*(img|\/_blob\/)/.test(l)).length, `[${tag}] no page errors`, plog);
  await ctx.close();
  return pub;
}

/* ------------------------------------------------------------------ 2. the shop renders the published catalog */
async function shopAfter(b, pubHtml) {
  linkSiteFiles(T + '/www-pub', pubHtml);
  const s = await rawServe(T + '/www-pub');
  for (const [vp, tag] of [[[390, 844], 'phone'], [[1440, 900], 'desktop']]) {
    const { ctx, page, plog } = await context(b, vp, { owner: false });
    await page.goto(s.url + 'index.html', { waitUntil: 'load', timeout: 90000 }); await settle(page, 1500);
    const r = await page.evaluate(() => {
      const card = document.querySelector('.prod[data-k="zig"]'), sw = n => [...card.querySelectorAll('[data-n]')].find(b => b.dataset.n === n);
      const tw = sw('Teal & white'), mt = sw('Mustard & tan');
      return {
        notice: (document.querySelector('#ss-notice p') || {}).textContent || '', owner: !!document.getElementById('ss-owner'),
        price: card.querySelector('[data-price]').textContent, grey: !!sw('Grey & black'),
        tw: tw ? { full: tw.dataset.full, src: tw.querySelector('img').getAttribute('src'), loaded: tw.querySelector('img').naturalWidth } : null,
        mt: mt ? { full: mt.dataset.full, src: mt.querySelector('img').getAttribute('src') } : null,
        navy: SS.stock('zig', 'Navy & cream', 0), olive: SS.stock('zig', 'Olive & cream', 0), solXL: SS.canBuy('sol', 'Aqua', 3), solM: SS.canBuy('sol', 'Aqua', 0)
      };
    });
    check(r.notice.startsWith('Closed for Diwali'), `[shop ${tag}] notice shows`, r.notice);
    check(!r.owner, `[shop ${tag}] visitors see no owner link`);
    check(r.price === '₹259', `[shop ${tag}] Zigzag M shows ₹259`, r.price);
    check(!r.grey, `[shop ${tag}] hidden colour removed`);
    check(r.tw && /^\/_blob\/[0-9a-f]{32}$/.test(r.tw.full) && /^\/_blob\/[0-9a-f]{32}$/.test(r.tw.src) && r.tw.loaded > 0, `[shop ${tag}] new colour swatch with uploaded photo`, r.tw);
    check(r.mt && /^\/_blob\//.test(r.mt.full) && /^\/_blob\//.test(r.mt.src), `[shop ${tag}] replaced photo used`, r.mt);
    check(r.navy === 'few' && r.olive === 'out' && r.solXL === false && r.solM === true, `[shop ${tag}] SS.stock / SS.canBuy follow the catalog`, r);
    await page.locator('.prod[data-k="zig"]').scrollIntoViewIfNeeded(); await settle(page, 800);
    await page.screenshot({ path: path.join(SHOTS, `shop-${tag}-zig-after-publish.png`) });
    await page.evaluate(() => window.scrollTo(0, 0)); await settle(page, 600);
    await page.screenshot({ path: path.join(SHOTS, `shop-${tag}-notice.png`) });
    check(!plog.filter(l => !/REQFAIL.*img/.test(l)).length, `[shop ${tag}] no page errors`, plog);
    await ctx.close();
  }
  s.close();
}

/* ------------------------------------------------------------------ 3. errors, drafts, keyboard (phone) */
async function errorFlows(b, base) {
  shotN = 0; const tag = 'errors';
  const { ctx, page, plog } = await context(b, [390, 844], { owner: true, ls: { mock_delay: '60' } });
  await page.goto(base + 'index.html#admin', { waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('#ssadm .ssa-tab[aria-selected="true"]', { timeout: 30000 });
  check(await page.locator('#ss-admin-chip').count() === 1, `[${tag}] #admin opens the editor and shows the Admin chip`);
  await tab(page, 'prices');
  await range(page, 'zig');
  await page.fill(fk('price|zig|M'), '269');

  /* upload failure, then retry */
  await tab(page, 'photos');
  await page.evaluate(() => localStorage.setItem('mock_upload_fail', 'too_large'));
  await choosePhoto(page, fk('photo|zig|Navy & white'));
  await page.waitForSelector(fk('sheet-use'), { timeout: 60000 });
  await page.click(fk('sheet-use'));
  await page.waitForSelector('#ssadm .ssa-sheet .ssa-err-box', { timeout: 30000 });
  check((await page.locator('#ssadm .ssa-sheet .ssa-err-box').innerText()).includes('too big'), `[${tag}] upload too_large explained`);
  await shot(page, tag, 'upload-error');
  await page.click(fk('sheet-use'));     // "Try again"
  await page.waitForSelector('#ssadm .ssa-sheet', { state: 'detached', timeout: 60000 });
  check(true, `[${tag}] upload retry succeeded`);

  /* Escape closes a sheet, then the review, then the editor; focus returns */
  await tab(page, 'new');
  await page.evaluate(() => localStorage.setItem('mock_upload_fail', ''));
  // delete flow needs an added colour: add one quickly
  await page.fill(fk('new-name'), 'Sea green');
  await choosePhoto(page, fk('new-photo'));
  await page.waitForSelector('#ssadm .ssa-form .ssa-pv canvas', { timeout: 60000 });
  await page.click(fk('new-add'));
  await page.waitForSelector('#ssadm .ssa-added .ssa-cname:text-is("Sea green")', { timeout: 60000 });
  await page.click(fk('del|zig|Sea green'));
  await page.waitForSelector('#ssadm .ssa-sheet');
  check(await page.evaluate(() => document.activeElement.getAttribute('data-fk') === 'sheet-no'), `[${tag}] "Are you sure?" focuses the safe choice`);
  await shot(page, tag, 'delete-confirm');
  await page.keyboard.press('Escape');
  check(await page.locator('#ssadm .ssa-sheet').count() === 0 && await page.locator('#ssadm').count() === 1, `[${tag}] Escape closes only the sheet`);
  await page.click(fk('del|zig|Sea green')); await page.click(fk('sheet-yes'));
  await page.waitForSelector('#ssadm .ssa-added .ssa-cname:text-is("Sea green")', { state: 'detached' });
  check(true, `[${tag}] unpublished colour deleted after confirming`);

  /* focus stays inside the editor */
  let outside = 0;
  for (let i = 0; i < 30; i++) { await page.keyboard.press('Tab'); if (!(await page.evaluate(() => !!document.activeElement.closest('#ssadm')))) outside++; }
  check(outside === 0, `[${tag}] Tab never leaves the editor`, outside);

  /* publish errors, each with its message; the draft stays */
  await page.click(fk('review'));
  const tryPublish = async (codeList, expect) => {
    await page.evaluate(c => localStorage.setItem('mock_publish_fail', c), codeList);
    await page.click(fk('publish'));
    await page.waitForSelector('#ssadm .ssa-status-error, #ssadm .ssa-h2:text-is("Published ✓")', { timeout: 30000 });
    const t = await page.locator('#ssadm .ssa-review').innerText();
    return { ok: t.includes(expect), t };
  };
  let r = await tryPublish('rate_limited', 'Wait a minute');
  check(r.ok, `[${tag}] rate_limited explained`, r.t);
  r = await tryPublish('too_large', 'too large');
  check(r.ok, `[${tag}] too_large explained`, r.t);
  r = await tryPublish('conflict', 'Someone saved a newer version just now. The page will reload — your draft is kept, check it and publish again.');
  check(r.ok, `[${tag}] conflict explained`, r.t);
  await shot(page, tag, 'conflict');
  const kept = await page.evaluate(() => JSON.parse(sessionStorage.getItem('ss-admin-draft-v1') || 'null'));
  check(kept && kept.edits.length === 2, `[${tag}] draft kept after the conflict`, kept);
  /* the platform reloads after a conflict: the editor comes back with the draft */
  await page.reload({ waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('#ssadm .ssa-note-info', { timeout: 30000 });
  check((await page.locator('#ssadm .ssa-note-info').innerText()).includes('2 unpublished changes'), `[${tag}] after reload the draft is restored`);
  await shot(page, tag, 'draft-restored');
  await page.click(fk('review'));
  const calls0 = await page.evaluate(() => window.__publishCalls);
  r = await tryPublish('upstream_error', 'Published ✓');
  check(r.ok && (await page.evaluate(() => window.__publishCalls)) - calls0 === 2, `[${tag}] upstream_error retried once, then published`, r.t);
  /* not_writer → read-only */
  await page.evaluate(() => { sessionStorage.clear(); });
  await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await openAdminFromFooter(page);
  await page.fill(fk('price|zig|XL'), '649');
  await page.click(fk('review'));
  r = await tryPublish('not_writer', "This account can't save changes to the shop.");
  check(r.ok && await page.locator(fk('publish')).isDisabled(), `[${tag}] not_writer: friendly message, Publish disabled`, r.t);
  await shot(page, tag, 'not-writer');
  await page.keyboard.press('Escape');   // review → edit
  await page.keyboard.press('Escape');   // edit → shop
  await page.waitForSelector('#ssadm', { state: 'detached' });
  check(await page.evaluate(() => document.activeElement && document.activeElement.id === 'ss-owner'), `[${tag}] Escape closes the editor and focus returns to the owner link`);
  check(await page.evaluate(() => location.hash === ''), `[${tag}] #admin removed from the URL on close`);
  check(!plog.filter(l => !/REQFAIL.*(img|\/_blob\/)/.test(l)).length, `[${tag}] no page errors`, plog);
  await ctx.close();
}

/* ------------------------------------------------------------------ 4. people who can't edit */
async function nonOwners(b, base) {
  shotN = 0;
  for (const [tag, cfg] of [['visitor', { owner: false }], ['no-claude', { noClaude: true }]]) {
    const { ctx, page, plog, reqs } = await context(b, [390, 844], cfg);
    await page.goto(base + 'index.html#admin', { waitUntil: 'load', timeout: 90000 });
    await page.waitForSelector('#ss-admin-deny', { timeout: 30000 });
    await settle(page, 1500);
    check((await page.locator('#ss-admin-deny').innerText()).includes('Only the shop owner can open this. Sign in to claude.ai with the owner account.'), `[${tag}] #admin shows the polite owner-only panel`);
    check(!(await page.locator('#ss-owner').count()) && !(await page.locator('#ssadm').count()), `[${tag}] no owner link, no editor`);
    check(!reqs.some(u => /admin\.(js|css)/.test(u)), `[${tag}] admin.js/css never fetched`);
    check(await page.evaluate(() => typeof window.SSADMIN === 'undefined'), `[${tag}] SSADMIN not defined`);
    await shot(page, tag, 'admin-denied');
    if (tag === 'visitor') {   // even if admin.js is loaded by hand, open() refuses
      await page.evaluate(() => new Promise(r => { const s = document.createElement('script'); s.src = 'admin.js'; s.onload = r; document.body.appendChild(s); }));
      const ok = await page.evaluate(() => window.SSADMIN.open());
      check(ok === false && await page.locator('.ssa-deny').count() === 1 && !(await page.locator('#ssadm').count()), `[${tag}] SSADMIN.open() refuses non-owners`);
      await shot(page, tag, 'open-refused');
    }
    check(!plog.filter(l => !/REQFAIL.*img/.test(l)).length, `[${tag}] no page errors`, plog);
    await ctx.close();
  }
}

/* ------------------------------------------------------------------ 5. 320px, reduced motion, touch targets */
async function narrow(b, base) {
  shotN = 0; const tag = 'w320';
  const { ctx, page, plog } = await context(b, [320, 640], { owner: true, reduced: true });
  await page.goto(base + 'index.html', { waitUntil: 'load', timeout: 90000 });
  await openAdminFromFooter(page);
  const small = new Set();
  for (const t of ['prices', 'stock', 'photos', 'new', 'notice']) {
    await tab(page, t);
    const ov = await overflow(page);
    check(ov.main <= 0 && ov.root <= 0, `[${tag}] ${t}: no sideways scrolling`, ov);
    (await smallTargets(page)).forEach(x => small.add(t + ': ' + x));
    await shot(page, tag, t);
  }
  await tab(page, 'stock');
  await page.click(fk('stock|zig|Navy & white|out'));
  await page.click(fk('review'));
  (await smallTargets(page)).forEach(x => small.add('review: ' + x));
  await shot(page, tag, 'review');
  check(small.size === 0, `[${tag}] every control at least 44×44`, [...small]);
  check(!plog.filter(l => !/REQFAIL.*img/.test(l)).length, `[${tag}] no page errors`, plog);
  await ctx.close();
}

/* ------------------------------------------------------------------ 6. bare softsteps.html (audit/serve.cjs skeleton) */
async function bareFlow(b) {
  shotN = 0; const tag = 'bare';
  const s = await serve(SITE);
  const src = await get(s.url + 'softsteps.html');
  const { ctx, page, plog, dialogs } = await context(b, [1440, 900], { owner: true });
  await page.goto(s.url + 'softsteps.html#admin', { waitUntil: 'load', timeout: 90000 });
  await page.waitForSelector('#ssadm .ssa-tab[aria-selected="true"]', { timeout: 30000 });
  await tab(page, 'notice');
  const EVIL = 'Test </script><img src=x onerror=alert(1)> & "quotes" <!--';
  await page.click(fk('notice|on')); await page.fill(fk('notice|en'), EVIL);
  await page.click(fk('review')); await page.click(fk('publish'));
  await page.waitForFunction(() => typeof window.__published === 'string', null, { timeout: 60000 });
  const pub = await page.evaluate(() => window.__published);
  const A = splitBlock(src), B = splitBlock(pub), pj = readBlockJSON(B.inner);
  check(A.before === B.before && A.after === B.after, `[${tag}] publishes the fetched document with only the block replaced`);
  check(pj.json && pj.json.indexOf('<') < 0 && pj.cat.notice.en === EVIL.replace(/\s+/g, ' ').trim(), `[${tag}] "<" escaped as \\u003c and round-trips`, pj.json && pj.json.slice(0, 200));
  await ctx.close(); s.close();
  // the shop shows that notice as plain text
  const dir = T + '/www-bare'; linkSiteFiles(dir, pub); const s2 = await rawServe(dir);
  const v = await context(b, [1440, 900], { owner: false });
  await v.page.goto(s2.url + 'index.html', { waitUntil: 'load', timeout: 90000 }); await settle(v.page, 1500);
  const n = await v.page.evaluate(() => { const p = document.querySelector('#ss-notice p'); return p ? { t: p.textContent, imgs: p.querySelectorAll('*').length } : null; });
  check(n && n.t === EVIL && n.imgs === 0 && !v.dialogs.length && !dialogs.length, `[${tag}] notice with markup shows as text, nothing runs`, n);
  check(!v.plog.filter(l => !/REQFAIL.*img/.test(l)).length && !plog.filter(l => !/REQFAIL.*img/.test(l)).length, `[${tag}] no page errors`, v.plog.concat(plog));
  await v.ctx.close(); s2.close();
}

/* ------------------------------------------------------------------ main */
(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  for (const f of fs.readdirSync(SHOTS)) if (f.endsWith('.png')) fs.unlinkSync(path.join(SHOTS, f));
  const srcHtml = buildTestSite();
  const s = await rawServe(T + '/www');
  check((await get(s.url + 'index.html')) === srcHtml, 'test server returns index.html byte-for-byte');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const only = process.argv[2];
  try {
    let pub = null;
    if (!only || only === 'owner') {
      pub = await ownerFlow(b, s.url, srcHtml, [390, 844], 'phone');
      const pub2 = await ownerFlow(b, s.url, srcHtml, [1440, 900], 'desktop');
      if (!only) await shopAfter(b, pub2 || pub);
    }
    if (!only || only === 'errors') await errorFlows(b, s.url);
    if (!only || only === 'deny') await nonOwners(b, s.url);
    if (!only || only === 'narrow') await narrow(b, s.url);
    if (!only || only === 'bare') await bareFlow(b);
  } catch (e) { check(false, 'test crashed: ' + (e && e.stack || e)); }
  await b.close(); s.close();
  console.log(results.join('\n'));
  console.log(`\n${results.length - failed} passed, ${failed} failed. Screenshots: ${SHOTS}`);
  process.exit(failed ? 1 : 0);
})();
