import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('index.html');
const app=read('src/app.mjs');
const css=read('style.css');

test('launchpad sequence exists with unique controls',()=>{
  for(const id of ['launchpad','launchStepScan','launchStepHarvest','launchStepRoute','launchStepJump','launchDescScan','launchDescHarvest','launchDescRoute','launchDescJump','launchMetaScan','launchMetaHarvest','launchMetaRoute','launchMetaJump']){
    assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,id);
  }
  assert.equal((html.match(/class="launch-go"/g)||[]).length,4);
});

test('launchpad interactions and helpers are wired in app logic',()=>{
  for(const token of ['function spotlightTarget(','function renderLaunchpad(','document.querySelectorAll(\'.launch-go\')','document.querySelectorAll(\'.launch-card\')','setupBridgeFx()','setupObservers()']){
    assert.match(app,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  }
});

test('premium styles cover launchpad and active station navigation',()=>{
  assert.match(css,/\.launchpad\{/);
  assert.match(css,/\.launch-card\[data-state="current"\]/);
  assert.match(css,/\.bridge-nav a\.active/);
  assert.match(css,/\.reveal-item\.is-revealed/);
});
