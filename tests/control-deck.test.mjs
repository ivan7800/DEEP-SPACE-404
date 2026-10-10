import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const js=read('src/app.mjs');
const css=read('style.css');

test('control deck station tabs and station views exist',()=>{
  for(const station of ['bridge','nav','orbital','surface','engineering','crew','anomalies']){
    assert.match(html,new RegExp(`class="station-tab"[^>]*data-station="${station}"`),station);
    assert.match(html,new RegExp(`class="station-view[^>]*data-station="${station}"`),station);
  }
});

test('station switching logic is wired in the app',()=>{
  for(const token of ['function switchStation(','function stationForTarget(','activeStation=prefs.station','document.querySelectorAll(\'.station-tab\')']){
    assert.match(js,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});

test('control deck styles are present',()=>{
  for(const selector of ['.deck-main{','.station-view[hidden]','.station-tab.active','.bridge-overview-grid{','.overview-card{']){
    assert.match(css,new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});
