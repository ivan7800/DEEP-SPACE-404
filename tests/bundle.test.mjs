import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const root=new URL('../',import.meta.url);const read=p=>fs.readFileSync(new URL(p,root),'utf8');
test('main page loads classic standalone bundle (file protocol compatible)',()=>{assert.match(read('index.html'),/<script defer src="\.\/game\.js"><\/script>/);assert.doesNotMatch(read('index.html'),/type="module"/);});
test('bundle parses without import and exports and includes UI handlers',()=>{const src=read('game.js');new vm.Script(src);assert.doesNotMatch(src,/^import |^export /m);for(const id of ['scan','harvest','jump','new','export','importTrigger','rest','applyPower','audioToggle','motionToggle'])assert.ok(src.includes(`'${id}'`),id);});
test('offline shell includes bundle',()=>{assert.match(read('sw.js'),/\.\/game\.js/);});
