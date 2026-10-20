// Local production-fixture server. GET/HEAD only; no live app/data credentials.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { gzipSync } from 'node:zlib';
const dist = resolve(process.argv[2]), publicRoot = resolve(process.argv[3]);
const port = Number(process.argv[4] ?? 8799);
createServer(async (request, response) => {
  try {
    if (!['GET','HEAD'].includes(request.method)) { response.writeHead(405); return response.end(); }
    const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    if (pathname === '/favicon.ico') { response.writeHead(204); return response.end(); }
    const root = pathname.startsWith('/3d/') ? publicRoot : dist;
    const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!file.startsWith(root + '/')) throw new Error('Path outside fixture');
    let bytes = await readFile(file);
    const types = { '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.html':'text/html', '.jpg':'image/jpeg', '.glb':'model/gltf-binary', '.gz':'application/gzip' };
    const headers = { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control':'no-store' };
    if (/\.(js|css|json|html)$/.test(file) && request.headers['accept-encoding']?.includes('gzip')) {
      bytes = gzipSync(bytes); headers['Content-Encoding']='gzip';
    }
    headers['Content-Length']=String(bytes.length); response.writeHead(200,headers);
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch { response.writeHead(404);response.end('Fixture file unavailable'); }
}).listen(port,'127.0.0.1',()=>console.log('Fixture http://127.0.0.1:'+port));
