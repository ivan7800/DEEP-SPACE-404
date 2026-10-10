import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('galactic map preserves focus on rerender by stable star identifier',()=>{
 assert.match(app,/b\.dataset\.starId=String\(node\.id\)/);
 assert.match(app,/document\.activeElement===b/);
 assert.match(app,/map\.querySelector\(`\[data-star-id=/);
 assert.match(app,/\.focus\(\{preventScroll:true\}\)/);
});
test('keyboard accessible stellar nodes have actionable native semantics',()=>{
 assert.match(app,/b\.type='button'/);
 assert.match(app,/b\.setAttribute\('aria-label',b\.title\)/);
 assert.match(app,/b\.setAttribute\('aria-pressed',String\(selected===node\.id\)\)/);
});
