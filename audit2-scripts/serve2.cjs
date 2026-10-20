// Static server like serve.cjs, but with the Netlify cache headers from netlify.toml (img max-age=604800; js max-age=0, must-revalidate) and ETags.
const http = require('http'), fs = require('fs'), path = require('path');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.avif': 'image/avif' };
function serve(dir, opt = {}) {
  const SITE = path.resolve(dir);
  return new Promise(res => {
    const srv = http.createServer((q, r) => {
      const u = decodeURIComponent(q.url.split('?')[0]);
      const LIBS = '/tmp/claude-0/-home-user/b3b2df08-4b5f-5d42-b6f7-07d0365cb062/scratchpad/libs';
      if (u === '/__fonts.css') { r.writeHead(200, { 'content-type': 'text/css', 'cache-control': 'public, max-age=86400' }); return r.end(fs.readFileSync(LIBS + '/localfonts.css', 'utf8').replace(/http:\/\/localfonts\//g, '/__lf/')); }
      if (u.startsWith('/__lf/')) { r.writeHead(200, { 'content-type': 'font/woff2', 'cache-control': 'public, max-age=31536000', 'access-control-allow-origin': '*' }); return fs.createReadStream(path.join(LIBS, u.slice(6))).pipe(r); }
      const p = path.join(SITE, u);
      if (opt.block && opt.block.test(u)) { r.writeHead(404); return r.end(); }
      if (!p.startsWith(SITE) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); }
      const ext = path.extname(p), st = fs.statSync(p), etag = '"' + st.size + '-' + st.mtimeMs + '"';
      const h = { 'content-type': (types[ext] || 'application/octet-stream') + (ext === '.html' || ext === '.js' ? '; charset=utf-8' : ''), etag };
      if (/^\/img\//.test(u)) h['cache-control'] = 'public, max-age=604800';
      else h['cache-control'] = 'public, max-age=0, must-revalidate';
      if (q.headers['if-none-match'] === etag) { r.writeHead(304, h); return r.end(); }
      r.writeHead(200, h);
      if (ext === '.html') { let html = fs.readFileSync(p, 'utf8'); if (opt.fonts) html = html.replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/, '/__fonts.css'); return r.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' + html); }
      fs.createReadStream(p).pipe(r);
    });
    srv.listen(0, '127.0.0.1', () => res({ url: `http://127.0.0.1:${srv.address().port}/`, close: () => srv.close() }));
  });
}
module.exports = { serve };
