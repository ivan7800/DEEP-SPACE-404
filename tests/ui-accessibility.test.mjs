import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/app.mjs',import.meta.url),'utf8');
test('importación ofrece botón de teclado y selector de archivos conectado',()=>{
 assert.match(html,/<button id="importTrigger" type="button">IMPORTAR<\/button>/);
 assert.match(html,/<input id="import" type="file"[^>]*hidden>/);
 assert.match(app,/\$\('importTrigger'\)\.addEventListener\('click',\(\)=>\s*\$\('import'\)\.click\(\)\)/);
});
