// Local dev: Vite + the two /api functions, so the whole app runs without the Vercel CLI.
import { createServer as createVite } from 'vite';
import http from 'node:http';
import { POST as chat } from '../api/chat.ts';
import { GET as status } from '../api/status.ts';

const vite = await createVite({ server: { middlewareMode: true }, appType: 'spa' });
http.createServer(async (req, res) => {
  if (req.url?.startsWith('/api/')) {
    const chunks: Buffer[] = [];
    for await (const c of req) chunks.push(c as Buffer);
    const request = new Request('http://localhost' + req.url, { method: req.method, headers: req.headers as any, body: req.method === 'POST' ? Buffer.concat(chunks) : undefined });
    const out: Response = req.url.startsWith('/api/chat') ? await chat(request) : await status();
    res.writeHead(out.status, Object.fromEntries(out.headers));
    if (out.body) for await (const c of out.body as any) res.write(c);
    return res.end();
  }
  vite.middlewares(req, res);
}).listen(5180, () => console.log('dev on http://localhost:5180'));
