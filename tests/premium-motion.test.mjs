import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html'),app=read('src/app.mjs'),css=read('style.css'),sw=read('sw.js');
test('station title, status toast and viewport effects have unique targets',()=>{
 for(const id of ['activeStationName','activeStationNumber','commandToast'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
 for(const cls of ['sky-nebula','sky-grid','sky-scanner'])assert.ok(html.includes(`class="${cls}"`),cls);
});
test('station transition and reduced-motion guard exist',()=>{
 assert.match(app,/function switchStation\(/);assert.match(app,/if\(changed&&prefs\.motion\)/);
 assert.match(css,/\.station-view\.deck-enter/);assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/html\[data-motion="off"\]/);
});
test('telemetry and notices are driven by actual game render/actions',()=>{
 assert.match(app,/previousStats=new Map/);assert.match(app,/function setBanner\(t\)/);
 assert.match(app,/overviewDirective/);assert.match(sw,/CACHE_PREFIX\+'v1\.0\.2'/);
});
