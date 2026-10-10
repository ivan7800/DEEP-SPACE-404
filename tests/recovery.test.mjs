import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,act,validateSave,upgradeSave,travelFuelCost} from '../src/engine.mjs';
const go=(s,type,arg)=>{const r=act(s,type,arg);assert.ok(r.ok,r.error);assert.ok(validateSave(r.state));return r.state;};
test('recuperación FTL tiene costes, límite por sector y no muta original',()=>{
 let s=initial('recovery-test'); assert.equal(act(s,'fuelRecovery').ok,false);
 s=go(s,'scan');const prior=structuredClone(s);const fuel=s.resources.fuel;
 const recovered=go(s,'fuelRecovery');assert.equal(recovered.resources.fuel,fuel+18);assert.equal(recovered.systems.hull,prior.systems.hull-9);assert.equal(recovered.systems.engine,prior.systems.engine-7);assert.equal(recovered.sectors[0].emergencyFuelUsed,true);
 assert.equal(s.sectors[0].emergencyFuelUsed,false);assert.equal(act(recovered,'fuelRecovery').ok,false);
});
test('recuperación exige seguridad mínima y respeta el estado',()=>{
 let s=go(initial('hazard'), 'scan');s.systems.hull=15;assert.equal(act(s,'fuelRecovery').ok,false);s.systems.hull=100;s.resources.oxygen=7;assert.equal(act(s,'fuelRecovery').ok,false);
});
test('guardados sin flag migran preservando el resto de la campaña',()=>{
 let s=go(initial('old-flag'),'scan');for(const sector of s.sectors)delete sector.emergencyFuelUsed;const restored=upgradeSave(s);
 assert.ok(restored);assert.equal(restored.discoveries,1);assert.equal(restored.sectors[0].scanned,true);assert.ok(restored.sectors.every(p=>p.emergencyFuelUsed===false));
});
test('rechaza un flag de recuperación manipulado',()=>{const s=initial();s.sectors[0].emergencyFuelUsed='false';assert.equal(validateSave(s),false);});
function settle(s){let loops=0;while(s.pending&&!s.gameOver){assert.ok(++loops<6);const i=s.pending.options.findIndex(o=>Object.entries(o.delta||{}).every(([k,v])=>v>=0||s.resources[k]>=-v));s=go(s,'resolve',{index:i<0?-1:i});}return s;}
function campaign(seed){let s=initial(seed);const visited=new Set([0]);let reason='limit';for(let step=0;step<130&&!s.gameOver;step++){
 s=settle(s);if(s.gameOver)break;
 const p=s.sectors[s.location];let type,arg={};
 if(s.systems.engine<35&&s.resources.parts>=8){type='repair';arg={system:'engine'};}
 else if(!p.scanned)type='scan';
 else if(!p.harvested)type='harvest';
 else if(s.discoveries>=8&&s.resources.data>=95)type='end';
 else {
  const options=s.galaxy[s.location].links.filter(n=>!visited.has(n)).sort((a,b)=>travelFuelCost(s,a)-travelFuelCost(s,b));
  const affordable=options.find(n=>s.resources.fuel>=travelFuelCost(s,n));
  if(affordable!==undefined){type='jump';arg={target:affordable};}
  else if(!p.emergencyFuelUsed&&s.systems.hull>15&&s.resources.oxygen>=8)type='fuelRecovery';
  else {reason='needs rerouting, repair or other decisions';break;}
 }
 const result=act(s,type,arg);if(!result.ok){reason=result.error;break;}s=result.state;if(type==='jump')visited.add(s.location);assert.ok(validateSave(s));
 }return {victory:s.victory,reason,discoveries:s.discoveries};}
test('40 universos con recuperación de emergencia mantienen estados válidos',()=>{const results=Array.from({length:40},(_,i)=>campaign('qa-campaign-'+i));console.log('RECOVERY CAMPAIGN',JSON.stringify({won:results.filter(r=>r.victory).length,total:40,blocked:results.filter(r=>!r.victory).length}));assert.equal(results.length,40);});
