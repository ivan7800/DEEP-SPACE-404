import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const engine=read('src/engine.mjs');
const app=read('src/app.mjs');
if(!app.startsWith('import {')||!app.includes("from './engine.mjs';\n"))throw Error('Unexpected app import structure');
const bundle='/* DEEP SPACE 404 -- standalone bundle for file:// and GitHub Pages. Generated from src/engine.mjs and src/app.mjs. */\n\'use strict\';\n'+engine.replace(/^export /gm,'')+'\n'+app.slice(app.indexOf('\n')+1);
if(process.argv.includes('--check')){
 if(read('game.js')!==bundle){console.error('game.js is stale. Run: node tests/build-bundle.mjs');process.exitCode=1;}
 else console.log('game.js matches both source modules');
}else{fs.writeFileSync(new URL('game.js',root),bundle);console.log('game.js regenerated');}
