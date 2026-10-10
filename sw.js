/* DEEP SPACE 404: offline shell scoped to the GitHub Pages repository path. */
const ROOT=new URL(self.registration.scope);
const CACHE_PREFIX='deep-space-404-'+encodeURIComponent(ROOT.pathname)+'-';
const CACHE=CACHE_PREFIX+'v1.0.2';
const ASSETS=['./','./index.html','./style.css','./game.js','./manifest.webmanifest','./icon.svg'];
const ALLOWED=new Set(ASSETS.map(asset=>new URL(asset,ROOT).pathname));
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==ROOT.origin||!ALLOWED.has(url.pathname))return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(request);
   if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));}
   return response;
  }catch{
   const cached=await caches.match(request);
   if(cached)return cached;
   if(request.mode==='navigate')return (await caches.match(new URL('./index.html',ROOT)))||Response.error();
   return Response.error();
  }
 })());
});
