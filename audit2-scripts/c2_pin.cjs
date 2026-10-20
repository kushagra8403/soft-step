const H = require('./h2.cjs');
(async () => {
  const B = await H.boot(); const log = [];
  try {
    const ctx = await H.ctxOf(B); const p = await H.open(B, ctx, log);
    await H.addVia(p, 'zig', 'Rust' === 'x' ? '' : 'Forest green & black', 'M', 1);
    await p.click('#cbar'); await p.waitForTimeout(300); await p.click('#go'); await p.waitForTimeout(300);
    // 1. 391 PIN (Vadodara district) typed
    await H.fillDetails(p, { ct: 'Padra', pin: '' });
    await p.click('#o-pin'); await p.keyboard.type('391440');
    let r = await p.evaluate(() => ({ radio: document.querySelector('input[name=dl]:checked').value, note: document.querySelector('#pinnote').textContent, tot: document.querySelector('#tot').textContent }));
    console.log('391 PIN ->', JSON.stringify(r));
    await p.click('#order-btn'); await p.waitForTimeout(400);
    let s = await H.state(p);
    console.log('391 pay amt:', s.payamt, '| msg total line:', s.msg.split('\n').find(l => l.startsWith('Total')), '| addr:', s.msg.split('\n').find(l => l.startsWith('Address')));
    // 2. Paste/insert "390 007" into checkout PIN vs the standalone PIN checker
    await p.click('#editorder'); await p.waitForTimeout(200); await p.click('#go'); await p.waitForTimeout(300);
    await p.fill('#o-pin', ''); await p.focus('#o-pin'); await p.keyboard.insertText('390 007');
    r = await p.evaluate(() => ({ val: document.querySelector('#o-pin').value, note: document.querySelector('#pinnote').textContent, radio: document.querySelector('input[name=dl]:checked').value }));
    console.log('checkout PIN after inserting "390 007":', JSON.stringify(r));
    await p.click('#order-btn'); await p.waitForTimeout(300);
    console.log('error shown:', await p.textContent('#oerr'), '| focus:', await p.evaluate(() => document.activeElement.id));
    // 3. 400001 -> out; then corrected to 391 -> radio stays "out"
    await p.fill('#o-pin', ''); await p.focus('#o-pin'); await p.keyboard.type('400001');
    console.log('400001 radio:', await p.evaluate(() => document.querySelector('input[name=dl]:checked').value));
    await p.fill('#o-pin', ''); await p.focus('#o-pin'); await p.keyboard.type('391440');
    console.log('then 391440 radio:', await p.evaluate(() => document.querySelector('input[name=dl]:checked').value), 'note:', await p.textContent('#pinnote'));
    await p.close();
    // standalone checker for comparison
    const p2 = await H.open(B, ctx, log);
    const has = await p2.$('#pin-in');
    if (has) { await p2.evaluate(() => document.querySelector('#pin-in').scrollIntoView()); await p2.focus('#pin-in'); await p2.keyboard.insertText('390 007'); console.log('standalone #pin-in after inserting "390 007":', await p2.inputValue('#pin-in')); }
    console.log('LOG', log);
  } finally { await B.close(); }
})();
