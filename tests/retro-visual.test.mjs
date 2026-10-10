import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const rd=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('Retro Space 1987 is selectable and persists in prefs allowlist',()=>{assert.match(rd('index.html'),/value="retro">Retro Space 1987/);assert.match(rd('src/app.mjs'),/'violet','retro'/)});
test('decorative space layers are present',()=>{const html=rd('index.html'),css=rd('style.css');for(const c of ['bridge-aurora','bridge-moon','orbital-ring','bridge-vignette']){assert.match(html,new RegExp('class="'+c+'"'));assert.match(css,new RegExp('\\.'+c+'\\{[^}]*pointer-events:none'))}});
test('retro theme, animation and reduced-motion fallback exist',()=>{const css=rd('style.css');assert.match(css,/:root\[data-theme="retro"\]/);assert.match(css,/@keyframes retroSweep/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/html\[data-motion="off"\]/)});
