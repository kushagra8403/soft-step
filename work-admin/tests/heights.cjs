const { chromium } = require('playwright');
const SP='/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad';
const { prep, scrollThrough } = require(SP + '/qa.cjs');
(async()=>{ const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for (const run of [1,2]) for (const dir of [SP+'/next', SP+'/work/admin/site']) {
  const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1}); const page=await ctx.newPage(); const log=[]; await prep(page,log);
  await page.goto('file://'+dir+'/softsteps.html',{waitUntil:'load'}); await page.waitForTimeout(2500); await scrollThrough(page); await page.waitForTimeout(1500);
  const r=await page.evaluate(()=>{ const o={h:document.documentElement.scrollHeight}; document.querySelectorAll('main > section, main > nav, header, footer').forEach((e,i)=>o[(e.id||e.className.split(' ')[0]||i)]=Math.round(e.getBoundingClientRect().height)); return o;});
  console.log(run, dir.split('/').slice(-2).join('/'), JSON.stringify(r)); await ctx.close(); }
 await b.close(); })();
