import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,validateSave,upgradeSave} from '../src/engine.mjs';
function withPending(){const s=initial('HARDENING');s.pending={title:'Decisión',body:'Elegir',options:[{label:'Aceptar',delta:{food:-1}}]};return s;}
test('valid pending decision retains save compatibility',()=>{const s=withPending();assert.equal(validateSave(s),true);assert.ok(upgradeSave(s));});
test('reject nonnumeric crew-effects on imported decision',()=>{const s=withPending();s.pending.options[0].crewEffects={sam:{health:'cat'}};assert.equal(validateSave(s),false);assert.equal(upgradeSave(s),null);});
test('reject unrecognized crew IDs and effects',()=>{const s=withPending();s.pending.options[0].crewEffects={intruder:{health:-10}};assert.equal(validateSave(s),false);});
test('reject malicious relation structures',()=>{const s=withPending();s.pending.options[0].relations=[['sam','invalid',8]];assert.equal(validateSave(s),false);});
test('accept valid bounded crew and relation effects',()=>{const s=withPending();s.pending.options[0].crewEffects={sam:{stress:5}};s.pending.options[0].relations=[['sam','ada',-10]];assert.equal(validateSave(s),true);});
test('reject invalid morale and damage in pending events',()=>{const s=withPending();s.pending.options[0].damage='broken';assert.equal(validateSave(s),false);s.pending.options[0].damage=3;s.pending.options[0].morale=Infinity;assert.equal(validateSave(s),false);});
