import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
function mockWorker({offline=false}={}){
  const handlers=new Map(), entries=new Map(), removed=[];
  let waiting=false,claimed=false,requests=[];
  const store={
    addAll:async assets=>{for(const a of assets)entries.set(new URL(a,'https://example.org/DEEP-SPACE-404/').href,{ok:true,body:a,clone(){return this;}})},
    put:async (request,response)=>{entries.set(request.url,response)},
  };
  const caches={open:async ()=>store,keys:async()=>['unrelated-cache','deep-space-404-v0.8.4','deep-space-404-%2FDEEP-SPACE-404%2F-v0.9.1','deep-space-404-%2Fotro-repo%2F-v0.9.1'],delete:async key=>{removed.push(key);return true;},match:async req=>entries.get(req.url)};
  const self={location:{origin:'https://example.org'},registration:{scope:'https://example.org/DEEP-SPACE-404/'},addEventListener:(event,fn)=>handlers.set(event,fn),skipWaiting:async()=>{waiting=true},clients:{claim:async()=>{claimed=true}}};
  const ctx={self,caches,URL,Response:{error:()=>({error:true})},fetch:async req=>{requests.push(req);if(offline)throw new Error('offline');return {ok:true,clone(){return this;}}}};
  vm.runInNewContext(source,ctx);
  async function fire(type,request){let pending;const ev={request,waitUntil:p=>{pending=p},respondWith:p=>{pending=p}};handlers.get(type)(ev);if(pending)return await pending;}
  return {fire,entries,removed,requests,get waiting(){return waiting},get claimed(){return claimed}};
}
test('SW instala el shell sin archivos inexistentes y activa el control',async()=>{const w=mockWorker();await w.fire('install');assert.equal(w.waiting,true);for(const f of ['index.html','game.js','style.css'])assert.ok([...w.entries.keys()].some(k=>k.endsWith(f)),f);});
test('SW elimina solo sus propias cachés antiguas',async()=>{const w=mockWorker();await w.fire('activate');assert.deepEqual(w.removed,['deep-space-404-%2FDEEP-SPACE-404%2F-v0.9.1']);assert.equal(w.claimed,true)});
test('SW sirve el documento precargado cuando falla la red',async()=>{const w=mockWorker({offline:true});await w.fire('install');const page={url:'https://example.org/DEEP-SPACE-404/index.html',method:'GET'};const res=await w.fire('fetch',page);assert.equal(res.body,'./index.html');});
test('SW no intercepta peticiones externas',async()=>{const w=mockWorker();const response=await w.fire('fetch',{url:'https://elsewhere.org/a',method:'GET'});assert.equal(response,undefined);assert.equal(w.requests.length,0);});

test('SW sirve offline los módulos en subdirectorio',async()=>{const w=mockWorker({offline:true});await w.fire('install');for(const file of ['game.js','style.css','manifest.webmanifest']){const response=await w.fire('fetch',{url:'https://example.org/DEEP-SPACE-404/'+file,method:'GET'});assert.equal(response.body,'./'+file,file);}});
test('SW no intercepta rutas ajenas del mismo dominio',async()=>{const w=mockWorker();assert.equal(await w.fire('fetch',{url:'https://example.org/otra-app/index.html',method:'GET'}),undefined);assert.equal(w.requests.length,0);});

test('SW no borra caches de otra instalacion ni caches antiguas sin ruta',async()=>{const w=mockWorker();await w.fire('activate');assert.equal(w.removed.includes('deep-space-404-v0.8.4'),false);assert.equal(w.removed.includes('deep-space-404-%2Fotro-repo%2F-v0.9.1'),false);});
