// FE-10: put the server-rendered home page into dist/index.html, so the first paint
// needs no JavaScript (Lighthouse LCP and FCP) and the page reads fine with JS off.
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

const { render } = await import(pathToFileURL('.ssr/entry-server.js').href);
const file = 'dist/index.html';
const html = fs.readFileSync(file, 'utf8');
if (!html.includes('<div id="root"></div>')) throw new Error('prerender: <div id="root"></div> not found in dist/index.html');
fs.writeFileSync(file, html.replace('<div id="root"></div>', `<div id="root">${render()}</div>`));
fs.rmSync('.ssr', { recursive: true, force: true });
console.log('prerender: home page written into dist/index.html');
