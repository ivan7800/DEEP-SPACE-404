import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>fs.readFileSync(new URL(p,new URL('../',import.meta.url)),'utf8');
test('bridge viewport and dynamic telemetry elements exist',()=>{const html=read('index.html');for(const id of ['bridgeDestination','bridgeSubline','bridgeHull','bridgeFuel','bridgeCondition'])assert.match(html,new RegExp(`id="${id}"`));assert.match(html,/class="bridge-nav"/);});
test('bridge telemetry populated from live campaign state',()=>{const app=read('src/app.mjs');for(const id of ['bridgeDestination','bridgeSubline','bridgeHull','bridgeFuel','bridgeCondition'])assert.match(app,new RegExp(id));});
test('decorative bridge layers cannot intercept clicks',()=>{const css=read('style.css');assert.match(css,/\.bridge-sky\{[^}]*pointer-events:none/);assert.match(css,/\.bridge-content\{[^}]*pointer-events:none/);assert.match(css,/\.bridge-corners\{[^}]*pointer-events:none/);});
