import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const app=fs.readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('las partidas locales corruptas se copian antes de iniciar una nueva',()=>{assert.match(app,/DAMAGED_BACKUP/);assert.match(app,/if\(invalidLocalSave\).*?localStorage\.setItem\(DAMAGED_BACKUP,raw\)/s);});
