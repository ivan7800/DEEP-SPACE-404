import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,validateSave,upgradeSave} from '../src/engine.mjs';
import fs from 'node:fs';
const mutate=(fn)=>{const s=initial('harden');fn(s);return s;};
test('partida rechaza estados imposibles de fin de misión',()=>{
 for(const s of [mutate(s=>s.gameOver='no'),mutate(s=>s.victory=true),mutate(s=>s.turn=NaN),mutate(s=>s.discoveries=999)]){
  assert.equal(validateSave(s),false);assert.equal(upgradeSave(s),null);
 }
});
test('partida rechaza extracción previa al escaneo',()=>{
 const s=mutate(s=>{s.sectors[0].harvested=true;s.sectors[0].scanned=false;});assert.equal(validateSave(s),false);
});
test('PWA versionada y caché limitada a archivos del juego',()=>{
 const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');assert.match(sw,/CACHE_PREFIX/);assert.match(sw,/CACHE=CACHE_PREFIX\+'v\d+\.\d+\.\d+'/);assert.match(sw,/!ALLOWED\.has\(url\.pathname\)/);assert.match(sw,/event\.waitUntil\(caches\.open\(CACHE\)/);
});
