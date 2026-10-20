// Tiny static server for the site that mimics the Artifact publish skeleton (doctype, utf-8, viewport).
// const { serve } = require('<scratchpad>/audit/serve.cjs'); const s = await serve(); page.goto(s.url + 'softsteps.html'); ... s.close();
// Optional arg: site directory (default <scratchpad>/site).
const http = require('http'), fs = require('fs'), path = require('path');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.avif': 'image/avif' };
function serve(dir) {
  const SITE = path.resolve(dir || path.join(__dirname, '..', 'site'));
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const p = path.join(SITE, decodeURIComponent(q.url.split('?')[0]));
      if (!p.startsWith(SITE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
      const ext = path.extname(p);
      r.writeHead(200, { 'content-type': (types[ext] || 'application/octet-stream') + (ext === '.html' || ext === '.js' ? '; charset=utf-8' : '') });
      if (ext === '.html') return r.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + fs.readFileSync(p, 'utf8'));
      fs.createReadStream(p).pipe(r);
    });
    srv.listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}
module.exports = { serve };
