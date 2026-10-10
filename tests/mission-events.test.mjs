import test from 'node:test';import assert from 'node:assert/strict';import{readFileSync}from'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('mission event UI and close control exist once',()=>{const h=read('index.html');for(const id of ['missionEvent','eventKicker','eventTitle','eventDetail','eventDismiss'])assert.equal((h.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);});
test('events use validated game results and safely expose resource deltas',()=>{const js=read('src/app.mjs');assert.match(js,/function describeAction\(type,before,after\)/);assert.match(js,/describeAction\(type,before,s\)/);assert.match(js,/function showMissionEvent\(/);assert.match(js,/eventDismiss.*addEventListener\('click'/);});
test('event animations respect motion preferences',()=>{const css=read('style.css');assert.match(css,/html\[data-motion="off"\] \.event-appear/);assert.match(css,/\.mission-event\[hidden\]/);});
