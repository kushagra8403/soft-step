// Screenshots of the stock UI (manual review): node tests/shots.cjs
const { chromium } = require('playwright'); const fs=require('fs');
const SP='/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad', SITE=SP+'/work/admin/site', OUT=SP+'/work/admin/shots-core';
const { prep } = require(SP + '/qa.cjs'); const { serve } = require(SP + '/audit/serve.cjs');
const RE=/(<script type="application\/json" id="ss-catalog">)([\s\S]*?)(<\/script>)/;
(async()=>{ fs.mkdirSync(OUT,{recursive:true}); const s=await serve(SITE); const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 let src=fs.readFileSync(SITE+'/softsteps.html','utf8'); const c=JSON.parse(src.match(RE)[2]);
 const col=(k,n)=>c.ranges[k].colours.find(x=>x.n===n);
 col('zig','Navy & cream').stock='few'; col('sol','Rust').stock='out'; c.ranges.zig.sizes[3].stock='out'; col('chen','Navy stripe').stock='few'; col('chen','Grey stripe').stock='out'; col('zig','Olive & cream').stock='out';
 src=src.replace(RE,(m,a,j,z)=>a+JSON.stringify(c).replace(/</g,'\\u003c')+z);
 for (const vp of [[390,844],[1440,900]]) {
  const ctx=await b.newContext({viewport:{width:vp[0],height:vp[1]}}); const page=await ctx.newPage(); const log=[]; await prep(page,log);
  await page.route(/softsteps\.html$/, r=>r.fulfill({status:200,contentType:'text/html; charset=utf-8',body:'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>\n'+src}));
  await page.addInitScript(()=>{ if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1);localStorage.setItem('ss_cart2',JSON.stringify([{id:'sol|M|Rust',k:'sol',size:'M 16×24 in',colour:'Rust',p:349,q:1},{id:'zig|M|Navy & cream',k:'zig',size:'M 16×24 in',colour:'Navy & cream',p:249,q:1}]));}});
  await page.goto(s.url+'softsteps.html',{waitUntil:'load'}); await page.waitForTimeout(1500);
  await page.click('.prod[data-k="zig"] [data-n="Navy & cream"]'); await page.click('.prod[data-k="zig"] .sizes-c [role=radio]:nth-child(4)');
  await page.click('.prod[data-k="sol"] [data-n="Rust"]'); await page.click('.prod[data-k="chen"] [data-n="Navy stripe"]');
  await page.waitForTimeout(900);
  for (const k of ['zig','sol','chen']) { const el=await page.$('.prod[data-k="'+k+'"] .info'); await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(900); await el.screenshot({path:OUT+'/'+vp[0]+'-'+k+'.png'}); }
  const g=await page.$('#cgrid'); await g.scrollIntoViewIfNeeded(); await page.waitForTimeout(900); await page.screenshot({path:OUT+'/'+vp[0]+'-tiles.png'});
  await page.evaluate(()=>SS.openD('cart')); await page.waitForTimeout(800); await page.screenshot({path:OUT+'/'+vp[0]+'-cart.png'});
  console.log(vp[0], log.filter(l=>!/REQFAIL/.test(l))); await ctx.close(); }
 await b.close(); s.close(); })();
