// Local-only preview for the committed static pages. node scripts/preview.cjs
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const languages = fs.readdirSync(path.join(root,'locales')).filter(f=>f.endsWith('.json')).map(f=>f.slice(0,-5));
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.xml':'application/xml', '.txt':'text/plain' };
http.createServer((req,res)=>{
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname); } catch { res.writeHead(400);return res.end(); }
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end('Static preview: API is available on Vercel.');}
  const first = pathname.split('/')[1];
  if (first && !['index.html','roadmap','feedback','assets','images','sitemap.xml','robots.txt','PizzapolyNewIcon.png','PizzapolyNewMain.png','pizzapolyicon.png',...languages].includes(first)) {res.writeHead(404);return res.end();}
  let file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep) && file !== root) {res.writeHead(403);return res.end();}
  try {
    if (fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
    const data=fs.readFileSync(file);
    res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.end(req.method==='HEAD'?undefined:data);
  } catch {res.writeHead(404);res.end('Not found');}
}).listen(4176,'127.0.0.1',()=>console.log('Preview: http://127.0.0.1:4176/'));
