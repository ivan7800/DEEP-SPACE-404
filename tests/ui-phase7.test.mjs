import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');const js=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
test('phase 7 controls exist with nonduplicated ids',()=>{for(const id of ['theme','audioToggle','motionToggle','telemetry','clock','ftlOverlay'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);});
test('JS document element refs correspond to HTML',()=>{for(const m of js.matchAll(/\$\('([A-Za-z][\w-]*)'\)/g))assert.match(html,new RegExp(`id="${m[1]}"`),m[1]);});
test('sound is opt-in and themes are from an allow-list',()=>{assert.match(js,/audio:false/);assert.match(js,/\['aurora','amber','violet','retro'\]\.includes/);});
test('motion disabled and reduced motion CSS disables FTL overlay',()=>{assert.match(css,/data-motion="off"/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.ftl-overlay\{display:none/);});
test('FTL overlay does not intercept interactions',()=>{assert.match(css,/pointer-events:none/);assert.match(css,/\.ftl-overlay\{/);});
