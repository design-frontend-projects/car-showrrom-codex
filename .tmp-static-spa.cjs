const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve('dist/car-showroom/browser');
const types = new Map([['.html','text/html'],['.js','text/javascript'],['.css','text/css'],['.json','application/json'],['.ico','image/x-icon'],['.svg','image/svg+xml'],['.woff','font/woff'],['.woff2','font/woff2'],['.ttf','font/ttf']]);
http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  if (url.pathname === '/api/auth/session' || url.pathname === '/api/auth/me') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ status: 'anonymous' }));
    return;
  }
  if (url.pathname.startsWith('/api/')) {
    res.statusCode = 404;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ code: 'showroom.error.requestFailed' }));
    return;
  }
  let file = path.resolve(root, `.${decodeURIComponent(url.pathname)}`);
  if (!file.startsWith(root)) file = path.join(root, 'index.csr.html');
  try {
    const stat = await fs.stat(file);
    if (stat.isDirectory()) throw new Error('directory');
  } catch {
    file = path.join(root, 'index.csr.html');
  }
  try {
    const data = await fs.readFile(file);
    res.setHeader('content-type', types.get(path.extname(file)) || 'application/octet-stream');
    res.end(data);
  } catch (error) {
    res.statusCode = 500;
    res.end(String(error));
  }
}).listen(4302, '127.0.0.1', () => console.log('SPA static server http://127.0.0.1:4302'));
