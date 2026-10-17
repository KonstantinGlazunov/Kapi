const { webkit } = require('playwright');
const http = require('node:http');
(async () => {
 const server = http.createServer((req,res) => {
  res.setHeader('content-type', req.url === '/sw.js' ? 'text/javascript' : 'text/html');
  res.end(req.url === '/sw.js' ? `self.addEventListener('install', e=>e.waitUntil(caches.open('baseline').then(c=>c.add('/index.html'))));self.addEventListener('activate', e=>e.waitUntil(self.clients.claim()));self.addEventListener('fetch', e=>e.respondWith(caches.open('baseline').then(c=>c.match('/index.html'))));` : `<h1>baseline</h1><script>navigator.serviceWorker.register('/sw.js')</script>`);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}/index.html`;
 let browser;
 try {
  browser=await webkit.launch(process.env.KAPI_BROWSER_EXECUTABLE ? {executablePath:process.env.KAPI_BROWSER_EXECUTABLE} : {});
  const context=await browser.newContext();const page=await context.newPage();
  await page.goto(url);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  console.log('baseline installed',await page.evaluate(async()=>await caches.keys()));
  await context.setOffline(true);
  await page.reload();console.log('baseline same-page offline works');
  await page.close();const cold=await context.newPage();await cold.goto(url);console.log('baseline cold offline works');
 } finally { await browser?.close();server.close(); }
})().catch(e=>{console.error(e.message);process.exitCode=1;});
