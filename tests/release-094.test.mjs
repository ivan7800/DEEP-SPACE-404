import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
test('distributed game bundle is rebuilt from current sources',()=>{
 assert.match(execFileSync(process.execPath,[new URL('./build-bundle.mjs',import.meta.url).pathname,'--check'],{encoding:'utf8'}),/matches/);
});
test('initialization error is visible instead of silent dead buttons',()=>{
 const html=read('index.html');assert.match(html,/addEventListener\("error"/);assert.match(html,/ERROR DE INICIO/);
 assert.match(html,/<script defer src="\.\/game\.js"><\/script>/);
});
test('PWA cache has distinct release identifier',()=>assert.match(read('sw.js'),/CACHE=CACHE_PREFIX\+'v\d+\.\d+\.\d+'/));
