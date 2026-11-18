// Serves a Vite dist like Vercel would: gzip, clean URLs, dir index, 404 page. Optional coach API.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import zlib from 'node:zlib';
const [,, root, port, apiMod] = process.argv;
const api = apiMod ? { chat: (await import(apiMod + '/api/chat.ts')).POST, status: (await import(apiMod + '/api/status.ts')).GET } : null;
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jfif':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.json':'application/json','.webp':'image/webp','.txt':'text/plain','.xml':'application/xml','.woff2':'font/woff2','.md':'text/markdown; charset=utf-8','.glb':'model/gltf-binary' };
http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname.startsWith('/_vercel/')) { res.writeHead(200, {'Content-Type':'text/javascript'}); return res.end(''); }
  if (api && url.pathname.startsWith('/api/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = new Request('http://localhost' + req.url, { method: req.method, headers: req.headers, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined });
    const out = url.pathname.startsWith('/api/chat') ? await api.chat(r) : await api.status();
    res.writeHead(out.status, Object.fromEntries(out.headers));
    if (out.body) for await (const c of out.body) res.write(c);
    return res.end();
  }
  let p = path.join(root, decodeURIComponent(url.pathname));
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  let status = 200;
  if (!fs.existsSync(p)) { if (api) p = path.join(root, 'index.html'); else { p = path.join(root, '404.html'); status = 404; } }
  const body = fs.readFileSync(p); const ext = path.extname(p);
  const h = { 'Content-Type': types[ext] || 'application/octet-stream', 'Cache-Control': p.includes('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate' };
  if (/gzip/.test(req.headers['accept-encoding'] || '') && /html|js|css|svg|json|txt|xml|markdown/.test(h['Content-Type'])) { h['Content-Encoding'] = 'gzip'; res.writeHead(status, h); return res.end(zlib.gzipSync(body)); }
  res.writeHead(status, h); res.end(body);
}).listen(+port, () => console.log('serving', root, 'on', port));
