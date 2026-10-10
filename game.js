/* DEEP SPACE 404 -- standalone bundle for file:// and GitHub Pages. Generated from src/engine.mjs and src/app.mjs. */
'use strict';
const VERSION=5;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function hashSeed(seed){let h=2166136261; for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function rng(seed){let x=hashSeed(seed)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
const syll=['Astra','Vega','Nox','Erebus','Lyra','Khepri','Orion','Solis','Tethys','Kepler','Nyx','Helion'];
const hazards=['Nebulosa de partículas','Campo gravitacional','Tormenta de radiación','Ecos electromagnéticos','Silencio absoluto'];
const biomes=['Océano subglacial','Desierto cristalino','Mundo selvático','Luna volcánica','Gigante gaseoso','Planeta errante','Ruinas orbitales'];
function sector(seed,index){const r=rng(`${seed}:sector:${index}`);const n=1+Math.floor(r()*999);return {id:index,name:`${syll[Math.floor(r()*syll.length)]}-${n}`,biome:biomes[Math.floor(r()*biomes.length)],hazard:hazards[Math.floor(r()*hazards.length)],risk:1+Math.floor(r()*4),richness:1+Math.floor(r()*4),anomaly:r()>.55,visited:false,scanned:false,harvested:false,incidentResolved:false,emergencyFuelUsed:false,sites:expeditionSites(seed,index)};}
const LANDABLE=['Océano subglacial','Desierto cristalino','Mundo selvático','Luna volcánica','Planeta errante'];
const SITES=['Señal enterrada','Estructura ancestral','Biosfera desconocida','Falla de energía','Restos de expedición','Monolito silencioso'];
function expeditionSites(seed,index){const r=rng(`${seed}:surface:${index}:v1`);return Array.from({length:2},(_,i)=>({id:i,title:SITES[Math.floor(r()*SITES.length)],difficulty:2+Math.floor(r()*5),reward:8+Math.floor(r()*12),completed:false,outcome:null}));}
function expeditionChance(s,team,site,approach){const crew=team.map(id=>s.crew.find(c=>c.id===id));const strength=crew.reduce((v,c)=>v+c.skill+(c.assignment==='science'?1:0)+(c.assignment==='engineering'?1:0)-Math.floor(c.fatigue/35)-Math.floor(c.stress/50),0);return clamp(0.52+(strength-site.difficulty*2)*.045+(approach==='cautious'?.14:-.08)-current(s).risk*.035,.08,.95);}
const CREW=[{id:'ada',name:'Ada Voss',role:'Ingeniera',skill:4,trait:'Meticulosa'},{id:'ian',name:'Ilan Rhee',role:'Piloto',skill:4,trait:'Impulsivo'},{id:'sam',name:'Samira Okafor',role:'Científica',skill:5,trait:'Curiosa'},{id:'leo',name:'Leo Maren',role:'Médico',skill:4,trait:'Empático'},{id:'nix',name:'Nix Calder',role:'Especialista',skill:3,trait:'Desconfiado'}];
function initialRelations(){const pairs={};for(let i=0;i<CREW.length;i++)for(let j=i+1;j<CREW.length;j++)pairs[`${CREW[i].id}:${CREW[j].id}`]=50;return pairs;}
const PAIRS=Object.keys(initialRelations());
function relationship(s,a,b){const key=[a,b].sort((x,y)=>CREW.findIndex(c=>c.id===x)-CREW.findIndex(c=>c.id===y)).join(':');return s.relations[key]??50;}
function relationDelta(s,a,b,delta){const key=[a,b].sort((x,y)=>CREW.findIndex(c=>c.id===x)-CREW.findIndex(c=>c.id===y)).join(':');if(Object.hasOwn(s.relations,key))s.relations[key]=clamp(s.relations[key]+delta,0,100);}
function personal(s,id,changes){const c=s.crew.find(x=>x.id===id);if(!c)return;for(const [k,v] of Object.entries(changes))c[k]=clamp(c[k]+v,0,100);}
function history(s,msg){s.crewHistory.unshift({day:s.day,text:msg});s.crewHistory=s.crewHistory.slice(0,40);note(s,msg,'signal');}
function crewStatus(c){return c.stress>=85?'AL BORDE':c.loyalty<=20?'DESAFECTO':c.morale<30?'DESMORALIZADO':c.fatigue>75?'EXHAUSTO':'OPERATIVO';}
// Narrative threads have persistent clues, delayed repercussions and deterministic triggers.
const STORY_ARCS=[
 {id:'echo',title:'EL ECO DE LOS AUSENTES',intro:'Una voz humana atraviesa una frecuencia anterior al primer viaje interestelar.',clue:'La emisión contiene coordenadas y una advertencia: «no respondáis».',reveal:'La baliza lleva cientos de años repitiendo las últimas palabras de una expedición imposible.'},
 {id:'garden',title:'EL JARDÍN DE CRISTAL',intro:'Bajo la superficie palpitan estructuras que parecen cultivar recuerdos.',clue:'Las muestras reproducen fragmentos del diario de la tripulación.',reveal:'La biosfera aprende de quienes la observan y puede alterar su percepción.'},
 {id:'threshold',title:'EL UMBRAL NEGRO',intro:'Una geometría imposible aparece detrás de una estrella apagada.',clue:'Las lecturas señalan una tecnología capaz de estabilizar el salto FTL.',reveal:'Alguien selló deliberadamente esta ruta para impedir que algo la cruzase.'}
];
function narrativeInitial(){return {arcs:Object.fromEntries(STORY_ARCS.map(a=>[a.id,{stage:0,clues:0,choice:null,resolution:null}])),delayed:[],history:[]};}
function storyRecord(s,text){s.narrative.history.unshift({day:s.day,text});s.narrative.history=s.narrative.history.slice(0,48);note(s,text,'signal');}
function startStory(s,arc){const a=s.narrative.arcs[arc.id];if(a.stage!==0)return false;a.stage=1;a.clues=1;storyRecord(s,`${arc.title}: ${arc.intro}`);return true;}
function narrativeDiscover(s,tag){
 const order=[STORY_ARCS[0],STORY_ARCS[1],STORY_ARCS[2]];
 const arc=order[(s.location+ (tag==='surface'?1:0))%3];
 const item=s.narrative.arcs[arc.id];
 if(item.stage===0){startStory(s,arc);return;}
 if(item.stage===1){item.clues=clamp(item.clues+1,0,3);if(item.clues>=2){item.stage=2;storyRecord(s,`${arc.title}: ${arc.clue}`);}return;}
 if(item.stage===2&&item.clues<3){item.clues=3;storyRecord(s,`${arc.title}: ${arc.reveal}`);}
}
function narrativeChoice(s){if(s.pending)return;
 const arc=STORY_ARCS.find(x=>s.narrative.arcs[x.id].stage===2&&s.narrative.arcs[x.id].clues>=3);
 if(!arc)return;
 s.pending={storyArc:arc.id,title:arc.title,body:`${arc.reveal} El mando debe decidir qué hacer con el hallazgo.`,options:[
 {label:'Compartir los datos con toda la tripulación',delta:{data:12},morale:7,storyDecision:'share'},
 {label:'Sellar la información (4 repuestos)',delta:{parts:-4},morale:-6,storyDecision:'seal'},
 {label:'Experimentar con la tecnología (8 datos)',delta:{data:-8,parts:8},damage:6,storyDecision:'study'}
 ]};
}
function narrativeTick(s){if(!s.narrative)return;
 const due=s.narrative.delayed.filter(e=>e.due<=s.day);
 s.narrative.delayed=s.narrative.delayed.filter(e=>e.due>s.day);
 for(const event of due){const a=s.narrative.arcs[event.arc];if(!a||a.stage!==3)continue;
  if(event.choice==='share'){s.crew.forEach(c=>c.morale=clamp(c.morale+4,0,100));charge(s,{data:7});storyRecord(s,`${event.title}: la transparencia refuerza la confianza y revela nuevos patrones.`);}
  else if(event.choice==='seal'){s.crew.forEach(c=>c.stress=clamp(c.stress+7,0,100));charge(s,{oxygen:10});storyRecord(s,`${event.title}: el silencio protege los sistemas, pero alimenta las sospechas.`);}
  else {s.systems.engine=clamp(s.systems.engine+12,0,100);s.crew[2].stress=clamp(s.crew[2].stress+12,0,100);storyRecord(s,`${event.title}: la investigación mejora el motor, pero deja secuelas en Samira.`);}
  a.stage=4;a.resolution=event.choice;
 }
}
// Engineering state: allocation totals 100; module level, power and research persist.
const POWER_KEYS=['engine','life','scanner','shield'];
const RESEARCH={efficiency:{name:'Reactores de alto rendimiento',cost:35},reinforcement:{name:'Blindaje adaptativo',cost:40},automation:{name:'Mantenimiento autónomo',cost:45}};
function engineeringInitial(){return {allocation:{engine:30,life:35,scanner:20,shield:15},levels:{engine:1,life:1,scanner:1,shield:1},research:[],cascades:0};}
function engineeringEfficiency(s,system){const eng=s.engineering;const allocation=eng.allocation[system];const level=eng.levels[system];const support=s.crew.filter(c=>c.assignment===(system==='scanner'?'science':system==='life'?'medical':'engineering')&&c.health>=20).length;
 return clamp(0.5+allocation/70+(level-1)*0.1+support*.05+(eng.research.includes('efficiency')?.10:0),.25,1.45);}
function engineeringTick(s,cost){const eng=s.engineering;const supply=engineeringEfficiency(s,'life');const wear=engineeringEfficiency(s,'engine');s.systems.engine=clamp(s.systems.engine-Math.max(0,Math.round(cost*(2.8-wear))),0,100);s.systems.life=clamp(s.systems.life-Math.max(0,Math.round(cost*(2.5-supply))),0,100);
 if(s.systems.life<35){const damage=Math.ceil((35-s.systems.life)/20)*cost;s.resources.oxygen=clamp(s.resources.oxygen-damage,0,999);if(s.systems.life<18){s.systems.hull=clamp(s.systems.hull-2*cost,0,100);eng.cascades++;note(s,'FALLO EN CASCADA: soporte vital crítico; la presión daña el casco.','danger');}}
 if(s.systems.engine<20){s.systems.hull=clamp(s.systems.hull-cost,0,100);note(s,'ALERTA: vibración del motor transmitida al casco.','danger');}
 if(eng.research.includes('automation')&&s.resources.parts>=1&&s.systems.life<75){charge(s,{parts:-1});s.systems.life=clamp(s.systems.life+3,0,100);}
}
function initial(seed='404-ODYSSEY'){return {schemaVersion:VERSION,seed:String(seed).slice(0,80),day:1,turn:0,location:0,resources:{fuel:72,oxygen:90,food:75,parts:30,data:0},systems:{hull:100,engine:90,life:92,scanner:88},crew:CREW.map(c=>({...c,health:100,morale:75,fatigue:8,loyalty:70,stress:15,assignment:'auto'})),relations:initialRelations(),crewHistory:[],sectors:Array.from({length:24},(_,i)=>({...sector(seed,i),visited:i===0})),galaxy:galaxy(seed),log:[{day:1,text:'La nave AURORA-404 abandona el espacio cartografiado. El mando es tuyo.',kind:'signal'}],pending:null,gameOver:false,victory:false,discoveries:0,expeditionHistory:[],narrative:narrativeInitial(),engineering:engineeringInitial()};}
const current=s=>s.sectors[s.location];
function note(s,text,kind='normal'){s.log.unshift({day:s.day,text,kind});s.log=s.log.slice(0,80);}
function rand(s,tag){return rng(`${s.seed}:${s.turn}:${tag}`)();}
function charge(s,amount){for(const [key,v] of Object.entries(amount))s.resources[key]=clamp(s.resources[key]+v,0,999);}
function ticking(s,cost=1){s.day+=cost;s.turn++;narrativeTick(s);charge(s,{oxygen:-Math.max(1,Math.ceil(2*cost/engineeringEfficiency(s,'life'))),food:-cost});engineeringTick(s,cost);s.crew.forEach(c=>{c.fatigue=clamp(c.fatigue+3*cost,0,100);c.morale=clamp(c.morale-(s.resources.food<15?4:0)-(c.stress>=75?2:0),0,100);c.stress=clamp(c.stress+(s.resources.oxygen<25?5:1)*cost,0,100)});if(s.resources.oxygen===0 || s.resources.food===0 || s.systems.hull===0 || s.crew.every(c=>c.health===0)){s.gameOver=true;note(s,'MISIÓN PERDIDA. Los sistemas vitales o la tripulación han colapsado.','danger');}}
function addEvent(s){const place=current(s);const r=rand(s,'event');
 if(s.crew.some(c=>c.stress>70)||Math.min(...Object.values(s.relations))<25){
 const rivals=PAIRS.map(k=>({ids:k.split(':'),v:s.relations[k]})).sort((a,b)=>a.v-b.v)[0];
 const [a,b]=rivals.ids,ca=s.crew.find(c=>c.id===a),cb=s.crew.find(c=>c.id===b);
 if(r<.60){s.pending={title:'FRACTURA EN LA TRIPULACIÓN',body:`${ca.name} y ${cb.name} discrepan sobre los riesgos. La tensión amenaza la coordinación.`,options:[
 {label:`Escuchar a ${ca.name}`,delta:{},crewEffects:{[a]:{loyalty:9,stress:-8},[b]:{loyalty:-7,stress:9}},relations:[[a,b,-9]]},
 {label:`Escuchar a ${cb.name}`,delta:{},crewEffects:{[b]:{loyalty:9,stress:-8},[a]:{loyalty:-7,stress:9}},relations:[[a,b,-9]]},
 {label:'Mediar (3 raciones)',delta:{food:-3},crewEffects:{[a]:{stress:-12,morale:4},[b]:{stress:-12,morale:4}},relations:[[a,b,15]]}
 ]};return;}
 }
if(r<.22){s.pending={title:'Señal de socorro',body:'Una baliza solicita auxilio. El desvío consume combustible y podría salvar vidas.',options:[{label:'Acudir al rescate',delta:{fuel:-8,parts:7,data:5},morale:8},{label:'Mantener rumbo',delta:{},morale:-9}]};}else if(r<.44){s.pending={title:'Contaminación del aire',body:'Un filtro contaminado compromete el oxígeno. Reparar exige piezas.',options:[{label:'Cambiar filtros',delta:{parts:-6,oxygen:19}},{label:'Aislar cubierta',delta:{oxygen:-13},morale:-7}]};}else if(r<.65){s.pending={title:'Conflicto en el puente',body:'Ilan exige acelerar mientras Samira insiste en estudiar la anomalía.',options:[{label:'Apoyar a Samira',delta:{data:7,fuel:-4},morale:-3},{label:'Apoyar a Ilan',delta:{fuel:6},morale:-4},{label:'Reunir a la tripulación',delta:{food:-4},morale:6}]};}else if(place.anomaly){s.pending={title:'Artefacto desconocido',body:`Una estructura imposible flota cerca de ${place.name}. Su emisión desafía los modelos conocidos.`,options:[{label:'Estudiar a distancia',delta:{data:12,oxygen:-5}},{label:'Abordar el artefacto',delta:{data:24,parts:-9},damage:9},{label:'No arriesgar la nave',delta:{},morale:-3}]};}else{note(s,'El salto revela extrañas emisiones, pero ningún peligro inmediato.','signal');}}
function copy(s){return structuredClone(s);}
function fail(msg){return {ok:false,error:msg};}
function act(state,type,payload={}){
if(state.gameOver)return fail('La expedición ha terminado. Inicia una nueva misión.');
if(state.pending && type!=='resolve')return fail('Hay una decisión de mando pendiente.');
const s=copy(state);let p=current(s);
switch(type){
case 'expedition':{
 if(!p.scanned)return fail('Escanea el planeta antes de desplegar una expedición.');
 if(!LANDABLE.includes(p.biome))return fail('Este entorno no permite aterrizar.');
 const site=p.sites?.[payload.site];if(!site||site.completed)return fail('Selecciona un lugar pendiente.');
 const team=payload.team;if(!Array.isArray(team)||team.length!==2||new Set(team).size!==2||!team.every(id=>s.crew.some(c=>c.id===id)))return fail('Selecciona dos especialistas distintos.');
 if(team.some(id=>s.crew.find(c=>c.id===id).health<20))return fail('Hay un tripulante demasiado herido para desembarcar.');
 if(s.resources.oxygen<12||s.resources.food<8)return fail('La expedición requiere 12 de oxígeno y 8 raciones.');
 const approach=payload.approach;if(!['cautious','bold'].includes(approach))return fail('Protocolo de expedición desconocido.');
 const chance=expeditionChance(s,team,site,approach);const success=rand(s,`expedition:${s.location}:${site.id}:${team.join(':')}:${approach}`)<chance;
 charge(s,{oxygen:-12,food:-8});site.completed=true;site.outcome=success?'success':'failure';
 for(const id of team)personal(s,id,{fatigue:approach==='cautious'?12:22,stress:success?3:15,morale:success?7:-8,health:success?0:-(approach==='cautious'?8:19)});
 if(success){const data=Math.round(site.reward*(approach==='bold'?1.5:1));charge(s,{data,parts:Math.floor(data/3)});note(s,`EXPEDICIÓN: ${site.title}. Recuperados ${data} datos y ${Math.floor(data/3)} repuestos.`, 'success');}
 else{s.systems.hull=clamp(s.systems.hull-(approach==='bold'?7:2),0,100);note(s,`EXPEDICIÓN FALLIDA: ${site.title}. El equipo ha sufrido daños y tensión.`, 'danger');}
 const names=team.map(id=>s.crew.find(c=>c.id===id).name).join(' y ');
 s.expeditionHistory.unshift({day:s.day,sector:s.location,site:site.title,team:[...team],approach,success});s.expeditionHistory=s.expeditionHistory.slice(0,60);
 history(s,`${names} investigan ${site.title}: ${success?'hallazgo confirmado':'retirada de emergencia'}.`);if(success)narrativeDiscover(s,'surface');
 ticking(s,approach==='cautious'?2:1);break;
}
case 'scan':if(p.scanned)return fail('Este sector ya está analizado.');if(s.resources.oxygen<4)return fail('Oxígeno insuficiente.');p.scanned=true;{let reward=5+p.richness*3+Math.floor(rand(s,'scan')*6);reward=Math.max(1,Math.round(reward*engineeringEfficiency(s,'scanner')));charge(s,{data:reward});s.discoveries++;narrativeDiscover(s,'scan');note(s,`Escaneo de ${p.name}: ${p.biome}. +${reward} datos científicos.`, 'success');}ticking(s);break;
case 'harvest':if(!p.scanned)return fail('Debes escanear antes de extraer recursos.');if(p.harvested)return fail('Recursos accesibles agotados en este sector.');p.harvested=true;{const v=p.richness*4;charge(s,{fuel:v,parts:Math.floor(v/2),oxygen:6});s.systems.hull=clamp(s.systems.hull-p.risk*2,0,100);note(s,`Operación de extracción completada: +${v} combustible, +${Math.floor(v/2)} piezas.`, 'success');}ticking(s);break;
case 'fuelRecovery':{
 if(!p.scanned)return fail('Analiza el sector antes de activar el recuperador de plasma.');
 if(p.emergencyFuelUsed)return fail('El plasma recuperable de este sector ya se ha agotado.');
 if(s.systems.hull<=15)return fail('Casco demasiado deteriorado para arriesgar esta maniobra.');
 if(s.resources.oxygen<8)return fail('Se necesitan al menos 8 unidades de oxígeno para operar el recuperador.');
 p.emergencyFuelUsed=true;
 charge(s,{fuel:18,oxygen:-5});
 s.systems.hull=clamp(s.systems.hull-9,0,100);
 s.systems.engine=clamp(s.systems.engine-5,0,100);
 note(s,'RECUPERACIÓN DE PLASMA: +18 combustible; casco -9, motor -5, oxígeno -5. La fuente se ha agotado.', 'danger');
 ticking(s);break;
}
case 'jump':{
 const target=payload.target;
 const cost=travelCost(s,target);
 if(cost===null)return fail('Selecciona un sistema conectado a tu posición.');
 const effectiveCost=travelFuelCost(s,target);if(s.resources.fuel<effectiveCost)return fail(`Necesitas ${effectiveCost} unidades de combustible para este salto.`);
 if(s.systems.engine<20)return fail('Motor demasiado dañado.');
 charge(s,{fuel:-Math.max(1,Math.ceil(cost/(engineeringEfficiency(s,'engine')*(s.engineering.research.includes('efficiency')?1.12:1)) ))});s.systems.engine=clamp(s.systems.engine-3,0,100);
 s.systems.hull=clamp(s.systems.hull-(s.sectors[target].risk>2?Math.max(0,3-(s.engineering.levels.shield-1)-(s.engineering.research.includes('reinforcement')?2:0)):0),0,100);
 s.location=target;p=current(s);p.visited=true;
 note(s,`Salto FTL (${effectiveCost} combustible) a ${p.name}. ${p.hazard}.`,'signal');
 ticking(s,2);if(!s.gameOver)addEvent(s);break;
}
case 'allocate':{const distribution=payload.allocation;if(!distribution||POWER_KEYS.some(k=>!Number.isInteger(distribution[k])||distribution[k]<5||distribution[k]>70)||Object.keys(distribution).length!==4||POWER_KEYS.reduce((sum,k)=>sum+distribution[k],0)!==100)return fail('La energía debe repartirse en 100 puntos; cada módulo requiere entre 5 y 70.');s.engineering.allocation={...distribution};note(s,'Distribución energética actualizada.','signal');break;}
case 'upgrade':{const k=payload.system;if(!POWER_KEYS.includes(k))return fail('Módulo desconocido.');const level=s.engineering.levels[k];if(level>=3)return fail('Módulo al nivel máximo.');const parts=12*level,data=8*level;if(s.resources.parts<parts||s.resources.data<data)return fail(`Mejora requiere ${parts} repuestos y ${data} datos.`);charge(s,{parts:-parts,data:-data});s.engineering.levels[k]++;note(s,`Módulo ${k} mejorado a nivel ${level+1}.`,'success');ticking(s);break;}
case 'research':{const id=payload.id,tech=RESEARCH[id];if(!tech)return fail('Tecnología desconocida.');if(s.engineering.research.includes(id))return fail('Tecnología ya investigada.');if(s.resources.data<tech.cost)return fail(`Investigación requiere ${tech.cost} datos.`);charge(s,{data:-tech.cost});s.engineering.research.push(id);note(s,`Investigación completada: ${tech.name}.`,'success');ticking(s);break;}
case 'repair':{const target=payload.system;if(!Object.hasOwn(s.systems,target))return fail('Sistema desconocido.');if(s.resources.parts<8)return fail('Faltan 8 piezas.');if(s.systems[target]>=100)return fail('El sistema está al máximo.');charge(s,{parts:-8});s.systems[target]=clamp(s.systems[target]+24+Math.floor(s.crew[0].skill/2)+s.crew.filter(c=>c.assignment==='engineering'&&c.health>=20).length*3,0,100);note(s,`Ada dirige reparaciones: ${target} restaurado.`, 'success');ticking(s);break;}
case 'counsel':{const id=payload.id,c=s.crew.find(x=>x.id===id);if(!c)return fail('Tripulante desconocido.');if(s.resources.food<3)return fail('Necesitas 3 raciones para el encuentro.');charge(s,{food:-3});personal(s,id,{stress:-22,morale:10,loyalty:5,fatigue:-8});history(s,`Entrevista médica con ${c.name}: tensión reducida.`);ticking(s);break;}
case 'mediate':{const [a,b]=payload.ids||[];if(!Object.hasOwn(s.relations,[a,b].sort((x,y)=>CREW.findIndex(c=>c.id===x)-CREW.findIndex(c=>c.id===y)).join(':')))return fail('Relación no válida.');if(s.resources.food<4)return fail('Se necesitan 4 raciones.');charge(s,{food:-4});relationDelta(s,a,b,12);personal(s,a,{stress:-9});personal(s,b,{stress:-9});history(s,`Mediación entre ${s.crew.find(c=>c.id===a).name} y ${s.crew.find(c=>c.id===b).name}.`);ticking(s);break;}
case 'assign':{const c=s.crew.find(x=>x.id===payload.id),allowed=['auto','bridge','engineering','science','medical'];if(!c||!allowed.includes(payload.assignment))return fail('Asignación desconocida.');c.assignment=payload.assignment;history(s,`${c.name} asignado a ${payload.assignment}.`);break;}
case 'rest':if(s.resources.food<4)return fail('No hay alimento suficiente.');charge(s,{food:-4});s.crew.forEach(c=>{c.fatigue=clamp(c.fatigue-28,0,100);c.morale=clamp(c.morale+6,0,100);c.health=clamp(c.health+5,0,100);c.stress=clamp(c.stress-18,0,100);});note(s,'Turno de descanso completado. Mejora la moral y baja la fatiga.','success');ticking(s);break;
case 'resolve':if(!s.pending)return fail('No hay ninguna decisión pendiente.');if(payload.index===-1){const affordable=s.pending.options.some(o=>Object.entries(o.delta||{}).every(([k,v])=>v>=0||s.resources[k]>=-v));if(affordable)return fail('Existen opciones disponibles; no se requiere protocolo de emergencia.');s.pending=null;s.systems.hull=clamp(s.systems.hull-10,0,100);s.crew.forEach(c=>{c.morale=clamp(c.morale-10,0,100);c.stress=clamp(c.stress+8,0,100);});note(s,'Protocolo de emergencia: la tripulación rechaza el dilema con graves consecuencias.','danger');ticking(s);break;}{const storyArc=s.pending.storyArc;const o=s.pending.options[payload.index];if(!o)return fail('Opción desconocida.');for(const [key,v] of Object.entries(o.delta))if(v<0 && s.resources[key]<-v)return fail(`Recursos insuficientes: ${key}.`);charge(s,o.delta);s.crew.forEach(c=>c.morale=clamp(c.morale+(o.morale||0),0,100));if(o.crewEffects)for(const [id,changes] of Object.entries(o.crewEffects))personal(s,id,changes);if(o.relations)for(const [a,b,v] of o.relations)relationDelta(s,a,b,v);if(o.damage)s.systems.hull=clamp(s.systems.hull-o.damage,0,100);history(s,`Decisión del mando: ${o.label}.`);if(storyArc&&o.storyDecision){const arc=s.narrative.arcs[storyArc];arc.stage=3;arc.choice=o.storyDecision;s.narrative.delayed.push({arc:storyArc,title:STORY_ARCS.find(a=>a.id===storyArc).title,choice:o.storyDecision,due:s.day+3});storyRecord(s,`Decisión registrada: ${o.label}. Sus consecuencias aún están por llegar.`);}s.pending=null;ticking(s);break;}
case 'story':narrativeChoice(s);if(!s.pending)return fail('Todavía no hay un dilema narrativo disponible.');break;
case 'end':if(s.discoveries<8 || s.resources.data<95)return fail('Necesitas 8 descubrimientos y 95 datos para transmitir el atlas.');s.victory=true;s.gameOver=true;note(s,'ATLAS TRANSMITIDO. La humanidad recibe el mapa de la frontera. La expedición ha triunfado.','success');break;
default:return fail('Acción desconocida.');
}
return {ok:true,state:s};}
function safeShape(s){
 try{
  const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
  if(!integer(s.day,1,1000000)||!integer(s.turn,0,1000000)||!integer(s.discoveries,0,24)||typeof s.gameOver!=='boolean'||typeof s.victory!=='boolean')return false;
  if(s.victory&&!s.gameOver)return false;
  if(!Array.isArray(s.crew)||s.crew.length!==CREW.length||!s.crew.every((c,i)=>c&&c.id===CREW[i].id&&Number.isFinite(c.skill)&&c.skill>=0&&c.skill<=20&&typeof c.name==='string'&&c.name.length<=100))return false;
  if(!Array.isArray(s.sectors)||s.sectors.length!==24||!s.sectors.every((p,i)=>p&&p.id===i&&typeof p.name==='string'&&p.name.length<=100&&typeof p.biome==='string'&&typeof p.hazard==='string'&&integer(p.risk,1,4)&&integer(p.richness,1,4)&&['visited','scanned','harvested'].every(k=>typeof p[k]==='boolean')))return false;
  if(!s.resources||!s.systems||!['fuel','oxygen','food','parts','data'].every(k=>Number.isFinite(s.resources[k])&&s.resources[k]>=0&&s.resources[k]<=999)||!['hull','engine','life','scanner'].every(k=>Number.isFinite(s.systems[k])&&s.systems[k]>=0&&s.systems[k]<=100))return false;
  if(s.pending!==null){if(!s.pending||typeof s.pending.title!=='string'||s.pending.title.length>200||typeof s.pending.body!=='string'||s.pending.body.length>3000||!Array.isArray(s.pending.options)||s.pending.options.length<1||s.pending.options.length>8||!s.pending.options.every(o=>o&&typeof o.label==='string'&&o.label.length<=200&&o.delta&&typeof o.delta==='object'&&Object.entries(o.delta).every(([k,v])=>['fuel','oxygen','food','parts','data'].includes(k)&&Number.isFinite(v)&&Math.abs(v)<=999)))return false;}
  if(s.pending!==null && !s.pending.options.every(o=>{
   if(o.morale!==undefined && (!Number.isFinite(o.morale)||Math.abs(o.morale)>100))return false;
   if(o.damage!==undefined && (!Number.isFinite(o.damage)||o.damage<0||o.damage>100))return false;
   if(o.storyDecision!==undefined && !['share','seal','study'].includes(o.storyDecision))return false;
   if(o.crewEffects!==undefined && (!o.crewEffects||typeof o.crewEffects!=='object'||Array.isArray(o.crewEffects)||!Object.entries(o.crewEffects).every(([id,effects])=>CREW.some(c=>c.id===id)&&effects&&typeof effects==='object'&&!Array.isArray(effects)&&Object.entries(effects).every(([key,v])=>['health','morale','fatigue','loyalty','stress'].includes(key)&&Number.isFinite(v)&&Math.abs(v)<=100))))return false;
   if(o.relations!==undefined && (!Array.isArray(o.relations)||o.relations.length>10||!o.relations.every(pair=>Array.isArray(pair)&&pair.length===3&&PAIRS.includes([pair[0],pair[1]].sort((a,b)=>CREW.findIndex(c=>c.id===a)-CREW.findIndex(c=>c.id===b)).join(':'))&&Number.isFinite(pair[2])&&Math.abs(pair[2])<=100)))return false;
   return true;
  }))return false;
  if(typeof s.gameOver!=='boolean'||typeof s.victory!=='boolean'||(s.victory&&!s.gameOver)||!integer(s.day,1,1000000)||!integer(s.turn,0,1000000)||!integer(s.discoveries,0,24))return false;
  if(!s.sectors.every(p=>typeof p.anomaly==='boolean'&&(!p.harvested||p.scanned)))return false;
  if(!s.crew.every(c=>typeof c.trait==='string'&&c.trait.length<=100&&typeof c.role==='string'&&c.role.length<=100))return false;
  if(!s.log.every(x=>x&&integer(x.day,1,1000000)&&typeof x.text==='string'&&x.text.length<=3000))return false;
  if(!s.narrative||!Array.isArray(s.narrative.delayed)||!s.narrative.delayed.every(x=>x&&STORY_ARCS.some(a=>a.id===x.arc)&&integer(x.due,1,1000000)&&typeof x.title==='string'&&x.title.length<200))return false;
  return true;
 }catch{return false;}
}
function validateSave(s){if(!safeShape(s)||!s||typeof s!=='object'||s.schemaVersion!==VERSION||!Array.isArray(s.sectors)||!Array.isArray(s.crew)||!s.resources||!s.systems||!Number.isInteger(s.location)||s.location<0||s.location>=s.sectors.length||s.sectors.length>10000||s.crew.length!==5||!Array.isArray(s.galaxy)||s.galaxy.length!==24||s.sectors.length!==24||!s.galaxy.every((n,i)=>n&&n.id===i&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Array.isArray(n.links)&&n.links.every(j=>Number.isInteger(j)&&j>=0&&j<24&&s.galaxy[j]?.links.includes(i)))||typeof s.seed!=='string'||s.seed.length>80||!Array.isArray(s.log)||s.log.length>80)return false;if(!s.sectors.every(p=>typeof p.emergencyFuelUsed==='boolean'))return false;if(!Array.isArray(s.expeditionHistory)||s.expeditionHistory.length>60||!s.sectors.every((p,i)=>Array.isArray(p.sites)&&p.sites.length===2&&p.sites.every((site,j)=>site.id===j&&typeof site.title==='string'&&Number.isInteger(site.difficulty)&&Number.isInteger(site.reward)&&typeof site.completed==='boolean'&&[null,'success','failure'].includes(site.outcome))))return false;if(!s.engineering||!s.engineering.allocation||!s.engineering.levels||!Array.isArray(s.engineering.research)||!Number.isInteger(s.engineering.cascades)||s.engineering.cascades<0||s.engineering.research.length>3||!s.engineering.research.every(k=>Object.hasOwn(RESEARCH,k))||new Set(s.engineering.research).size!==s.engineering.research.length||POWER_KEYS.some(k=>!Number.isInteger(s.engineering.allocation[k])||s.engineering.allocation[k]<5||s.engineering.allocation[k]>70||!Number.isInteger(s.engineering.levels[k])||s.engineering.levels[k]<1||s.engineering.levels[k]>3)||POWER_KEYS.reduce((v,k)=>v+s.engineering.allocation[k],0)!==100)return false;if(!s.narrative||!Array.isArray(s.narrative.delayed)||s.narrative.delayed.length>20||!Array.isArray(s.narrative.history)||s.narrative.history.length>48||!STORY_ARCS.every(a=>{const v=s.narrative.arcs?.[a.id];return v&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<=4&&Number.isInteger(v.clues)&&v.clues>=0&&v.clues<=3&&[null,'share','seal','study'].includes(v.choice)&&[null,'share','seal','study'].includes(v.resolution);})||!s.relations||!Array.isArray(s.crewHistory)||s.crewHistory.length>40||!PAIRS.every(k=>Number.isInteger(s.relations[k])&&s.relations[k]>=0&&s.relations[k]<=100)||!s.crew.every(c=>['auto','bridge','engineering','science','medical'].includes(c.assignment)&&['health','morale','fatigue','loyalty','stress'].every(k=>Number.isFinite(c[k])&&c[k]>=0&&c[k]<=100)))return false;return [...Object.values(s.resources),...Object.values(s.systems)].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=999);}

// GALAXY v0.2: deterministic undirected network, with guaranteed connectivity.
function galaxy(seed,count=24){
 const r=rng(`${seed}:galaxy:v2`), nodes=[];
 for(let i=0;i<count;i++){
  const angle=i*2.399963229728653, radius= i===0?0:8+Math.sqrt(i/(count-1))*39;
  nodes.push({id:i,x:clamp(Math.round(50+Math.cos(angle)*radius+(r()-.5)*7),6,94),y:clamp(Math.round(50+Math.sin(angle)*radius+(r()-.5)*7),7,93),links:[],type:r()>.80?'anomaly':r()>.55?'resource':'ordinary'});
 }
 function link(a,b){if(a===b||nodes[a].links.includes(b))return;nodes[a].links.push(b);nodes[b].links.push(a);}
 for(let i=1;i<count;i++){
  let parent=0,best=Infinity;
  for(let j=0;j<i;j++){const d=Math.hypot(nodes[i].x-nodes[j].x,nodes[i].y-nodes[j].y);if(d<best){best=d;parent=j;}}
  link(i,parent);
 }
 for(let i=0;i<count;i++){
  let nearest=-1,best=Infinity;
  for(let j=0;j<count;j++)if(i!==j&&!nodes[i].links.includes(j)){
   const d=Math.hypot(nodes[i].x-nodes[j].x,nodes[i].y-nodes[j].y);
   if(d<best){best=d;nearest=j;}
  }
  if(nearest>=0&&best<25&&r()>.3)link(i,nearest);
 }
 for(const n of nodes)n.links.sort((a,b)=>a-b);
 return nodes;
}
function travelCost(s,target){
 const map=s.galaxy;if(!map||!Number.isInteger(target)||!map[target]||target===s.location||!map[s.location]?.links.includes(target))return null;
 const a=map[s.location],b=map[target],distance=Math.hypot(a.x-b.x,a.y-b.y);
 return Math.max(8,Math.round(7+distance*.46+(s.sectors[target]?.risk||1)*1.5));
}
function travelFuelCost(s,target){const cost=travelCost(s,target);return cost===null?null:Math.max(1,Math.ceil(cost/(engineeringEfficiency(s,'engine')*(s.engineering.research.includes('efficiency')?1.12:1))));}
// Dijkstra on the current FTL graph. Estimates assume present engine efficiency,
// no subsequent damage, repairs, research, harvesting or emergency recovery.
function routePlan(s, destination, origin=s.location){
 if(!Number.isInteger(origin)||!Number.isInteger(destination)||!s.galaxy?.[origin]||!s.galaxy?.[destination])return null;
 const size=s.galaxy.length, distance=Array(size).fill(Infinity), previous=Array(size).fill(-1), seen=new Set();
 distance[origin]=0;
 for(let step=0;step<size;step++){
  let node=-1;for(let i=0;i<size;i++)if(!seen.has(i)&&(node<0||distance[i]<distance[node]))node=i;
  if(node<0||!Number.isFinite(distance[node]))break;
  seen.add(node);if(node===destination)break;
  for(const neighbor of s.galaxy[node].links){
   const estimate={...s,location:node};const cost=travelFuelCost(estimate,neighbor);
   if(cost!==null&&distance[node]+cost<distance[neighbor]){distance[neighbor]=distance[node]+cost;previous[neighbor]=node;}
  }
 }
 if(!Number.isFinite(distance[destination]))return null;
 const path=[];let at=destination;while(at!==-1){path.unshift(at);at=previous[at];}
 return {path,cost:distance[destination],hops:path.length-1};
}
function routeAdvisory(s,target){
 const outward=routePlan(s,target);if(!outward)return null;
 // Safe havens are previously scanned systems, not necessarily the origin.
 const visited=s.sectors.flatMap((p,i)=>(p.visited||p.scanned)?[i]:[]);
 const options=visited.map(i=>routePlan(s,i,target)).filter(Boolean).sort((a,b)=>a.cost-b.cost);
 const retreat=options[0]||null;
 const reserve=s.resources.fuel-outward.cost;
 const local=s.sectors[target];
 return {outward,reserve,retreat,roundTripCost:retreat?outward.cost+retreat.cost:null,
  canArrive:reserve>=0,canRetreat:!!retreat&&reserve>=retreat.cost,
  possibleLocalRecovery:!local.emergencyFuelUsed,
  warning:reserve<0?'COMBUSTIBLE INSUFICIENTE':retreat&&reserve<retreat.cost?'SIN RESERVA DE RETORNO':!retreat?'RETORNO NO IDENTIFICADO':'RUTA CON RESERVA'};
}
function upgradeSave(saved){
 try{
 if(!saved||![1,2,3,4,5].includes(saved.schemaVersion)||!Array.isArray(saved.sectors)||!saved.sectors.length)return null;
 const s=structuredClone(saved);const map=galaxy(s.seed);if(s.schemaVersion===1){s.relations=initialRelations();s.crewHistory=[];for(const c of s.crew){c.loyalty=70;c.stress=15;c.assignment='auto';}s.schemaVersion=2;}
 if(s.schemaVersion<=2){for(let i=0;i<s.sectors.length;i++)s.sectors[i].sites=expeditionSites(s.seed,i);s.expeditionHistory=[];s.schemaVersion=3;}
 if(s.schemaVersion<=3){s.narrative=narrativeInitial();s.schemaVersion=4;}
 if(s.schemaVersion<=4){s.engineering=engineeringInitial();s.schemaVersion=5;}
 for(const p of s.sectors)if(p.emergencyFuelUsed===undefined)p.emergencyFuelUsed=false;
 if(!s.galaxy){
  if(s.location>=map.length||s.sectors.length>map.length)return null;
  s.sectors=Array.from({length:map.length},(_,i)=>s.sectors[i]||sector(s.seed,i));
  for(let i=0;i<=s.location;i++)s.sectors[i].visited=true;
  s.galaxy=map;
 }
 return validateSave(s)?s:null;
 }catch{return null;}
}

const $=id=>document.getElementById(id);const LABEL={fuel:'COMBUSTIBLE',oxygen:'OXÍGENO',food:'RACIONES',parts:'REPUESTOS',data:'DATOS',hull:'CASCO',engine:'MOTOR',life:'SOPORTE VITAL',scanner:'SENSORES'};
const INTRO_KEY='deep-space-404-intro-v1';const STORE='deep-space-404-v1';const DAMAGED_BACKUP='deep-space-404-corrupted-save-backup-v1';const PREF='deep-space-404-prefs-v1';let prefs={theme:'aurora',audio:false,motion:true,station:'bridge'};try{const v=JSON.parse(localStorage.getItem(PREF));if(v&&typeof v==='object')prefs={theme:['aurora','amber','violet','retro'].includes(v.theme)?v.theme:'aurora',audio:v.audio===true,motion:v.motion!==false,station:['bridge','nav','orbital','surface','engineering','crew','anomalies'].includes(v.station)?v.station:'bridge'};}catch{}let audioContext=null,ftlTimer=null;function persistPrefs(){try{localStorage.setItem(PREF,JSON.stringify(prefs));}catch{}}function syncPrefs(){document.documentElement.dataset.theme=prefs.theme;document.documentElement.dataset.motion=prefs.motion?'on':'off';$('theme').value=prefs.theme;$('audioToggle').textContent=`SONIDO: ${prefs.audio?'ON':'OFF'}`;$('audioToggle').setAttribute('aria-pressed',String(prefs.audio));$('motionToggle').textContent=`EFECTOS: ${prefs.motion?'ON':'OFF'}`;$('motionToggle').setAttribute('aria-pressed',String(!prefs.motion));}function sound(kind){if(!prefs.audio)return;try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;audioContext??=new AC();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;oscillator.type=kind==='danger'?'sawtooth':'sine';oscillator.frequency.setValueAtTime(kind==='jump'?220:kind==='danger'?170:560,now);oscillator.frequency.exponentialRampToValueAtTime(kind==='jump'?840:kind==='danger'?110:720,now+.24);gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.035,now+.02);gain.gain.exponentialRampToValueAtTime(.0001,now+.32);oscillator.connect(gain);gain.connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+.35);}catch{}}function showFTL(){if(!prefs.motion)return;const overlay=$('ftlOverlay');if(ftlTimer)clearTimeout(ftlTimer);overlay.classList.add('active');ftlTimer=setTimeout(()=>overlay.classList.remove('active'),1050);}syncPrefs();$('theme').addEventListener('change',e=>{prefs.theme=e.target.value;persistPrefs();syncPrefs();});$('audioToggle').addEventListener('click',()=>{prefs.audio=!prefs.audio;persistPrefs();syncPrefs();if(prefs.audio)sound('confirm');});$('motionToggle').addEventListener('click',()=>{prefs.motion=!prefs.motion;persistPrefs();syncPrefs();if(!prefs.motion)$('ftlOverlay').classList.remove('active');});let s;let invalidLocalSave=false;try{const raw=localStorage.getItem(STORE);const saved=raw?JSON.parse(raw):null;const restored=saved?upgradeSave(saved):null;invalidLocalSave=!!raw&&!restored;if(invalidLocalSave){try{if(!localStorage.getItem(DAMAGED_BACKUP))localStorage.setItem(DAMAGED_BACKUP,raw);}catch{}}s=restored||initial();}catch{invalidLocalSave=true;try{const raw=localStorage.getItem(STORE);if(raw&&!localStorage.getItem(DAMAGED_BACKUP))localStorage.setItem(DAMAGED_BACKUP,raw);}catch{}s=initial();}let selected=null;let activeStation=prefs.station||'bridge';

const STATION_NAMES={bridge:'PUENTE DE MANDO',nav:'CARTA ESTELAR',orbital:'OPERACIONES ORBITALES',surface:'SUPERFICIE PLANETARIA',engineering:'INGENIERÍA',crew:'TRIPULACIÓN',anomalies:'ANOMALÍAS Y BITÁCORA'};
function switchStation(station,{focus=false}={}){const allowed=Object.keys(STATION_NAMES);if(!allowed.includes(station))station='bridge';const changed=activeStation!==station;activeStation=station;prefs.station=station;persistPrefs();document.querySelectorAll('.station-tab').forEach(button=>{const active=button.dataset.station===station;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));if(focus&&active)button.focus({preventScroll:true});});document.querySelectorAll('.station-view').forEach(view=>{const visible=view.dataset.station===station;view.hidden=!visible;if(visible){view.classList.add('is-revealed');if(changed&&prefs.motion){view.classList.remove('deck-enter');void view.offsetWidth;view.classList.add('deck-enter');}}});const heading=$('activeStationName');if(heading)heading.textContent=STATION_NAMES[station];const serial=$('activeStationNumber');if(serial)serial.textContent=`ESTACIÓN ${String(allowed.indexOf(station)+1).padStart(2,'0')} / 07`;}

function stationForTarget(selector){const direct=document.querySelector(selector);const stationView=direct?.closest?.('.station-view');if(stationView)return stationView.dataset.station;const fallbackMap={"#scan":'orbital',"#harvest":'orbital',"#jump":'orbital',"#surfacePanel":'surface',"#engineeringPanel":'engineering',"#objectivePanel":'bridge',"#galaxyTitle":'nav'};return fallbackMap[selector]||'bridge';}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
let toastTimer=null;function setBanner(t){$('banner').textContent=t;const toast=$('commandToast');if(!toast)return;if(toastTimer)clearTimeout(toastTimer);toast.classList.remove('visible');if(t){toast.textContent=t;toast.classList.toggle('danger',/fallid|insuficiente|error|dañad|crític|imposible/i.test(t));toast.classList.add('visible');toastTimer=setTimeout(()=>toast.classList.remove('visible'),4500);}}
function save(){try{localStorage.setItem(STORE,JSON.stringify(s));}catch{setBanner('No se ha podido guardar la partida. Exporta una copia de seguridad.');}}
let eventTimer=null;function showMissionEvent(kicker,title,detail,danger=false){const box=$('missionEvent');if(!box)return;clearTimeout(eventTimer);$('eventKicker').textContent=kicker;$('eventTitle').textContent=title;$('eventDetail').textContent=detail;box.classList.toggle('is-danger',danger);box.hidden=false;box.classList.remove('event-appear');void box.offsetWidth;box.classList.add('event-appear');eventTimer=setTimeout(()=>{box.hidden=true;},6600);}
function describeAction(type,before,after){const old=before.resources,newRes=after.resources,changes=Object.keys(newRes).filter(k=>newRes[k]!==old[k]).map(k=>`${LABEL[k]||k} ${newRes[k]>old[k]?'+':''}${newRes[k]-old[k]}`);const summary=changes.slice(0,3).join(' · ')||`Día ${after.day} · Sistemas sincronizados`;const titles={scan:'ESCANEO COMPLETADO',harvest:'RECURSOS RECUPERADOS',jump:'SALTO FTL COMPLETADO',expedition:'EXPEDICIÓN FINALIZADA',repair:'REPARACIÓN EJECUTADA',rest:'TRIPULACIÓN EN DESCANSO',counsel:'APOYO REALIZADO',mediate:'MEDIACIÓN COMPLETADA',research:'INVESTIGACIÓN COMPLETADA',story:'PROTOCOLO NARRATIVO',resolve:'DECISIÓN REGISTRADA',end:'TRANSMISIÓN DEL ATLAS',fuelRecovery:'PLASMA DE EMERGENCIA'};const title=titles[type];if(!title)return;let detail=summary;if(type==='scan')detail=`${current(after).name} · ${current(after).biome} · ${summary}`;if(type==='jump')detail=`Nueva posición: ${current(after).name} · ${summary}`;if(type==='expedition')detail=`Informe de superficie recibido · ${summary}`;if(after.pending)detail+=' · Decisión de mando pendiente';showMissionEvent('AURORA AI // INFORME DE OPERACIÓN',title,detail,after.systems.hull<35||after.systems.life<35||after.gameOver&&!after.victory);}
function run(type,payload){const before=s;const outcome=act(s,type,payload);if(!outcome.ok){setBanner(outcome.error);return;}s=outcome.state;if(type==='jump'){selected=null;showFTL();sound('jump');}else if(s.gameOver&&!s.victory)sound('danger');else sound('confirm');setBanner(s.gameOver?s.victory?'MISIÓN COMPLETADA · El atlas está a salvo.':'MISIÓN TERMINADA · La AURORA-404 se ha perdido.':'');save();render();describeAction(type,before,s);} 
function renderMap(){
 const map=$('galaxyMap');map.replaceChildren();
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
 for(const n of s.galaxy)for(const j of n.links)if(j>n.id){const other=s.galaxy[j],line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:n.x,y1:n.y,x2:other.x,y2:other.y,stroke:n.id===s.location||j===s.location?'#66baca':'#25495e','stroke-width':'.32'}))line.setAttribute(k,v);svg.append(line);}
 map.append(svg);
 for(const node of s.galaxy){const b=el('button',`star-node ${node.id===s.location?'current':''} ${s.sectors[node.id].visited?'visited':''} ${s.galaxy[s.location].links.includes(node.id)?'connected':''} ${selected===node.id?'selected':''}`);b.type='button';b.dataset.starId=String(node.id);b.style.left=`${node.x}%`;b.style.top=`${node.y}%`;const known=s.sectors[node.id].visited;b.title=`${known?s.sectors[node.id].name:'Sistema desconocido'} · ${node.id===s.location?'POSICIÓN ACTUAL':s.galaxy[s.location].links.includes(node.id)?'CONECTADO':'FUERA DE ALCANCE'}`;b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(selected===node.id));b.addEventListener('click',()=>{const restoreFocus=document.activeElement===b;selected=node.id;render();if(restoreFocus)map.querySelector(`[data-star-id="${node.id}"]`)?.focus({preventScroll:true});});map.append(b);}
 const cost=travelCost(s,selected),fuelCost=travelFuelCost(s,selected);$('routeInfo').textContent=selected===null?'Selecciona una estrella para consultar una ruta.':selected===s.location?'Esta es la ubicación actual de AURORA-404.':cost===null?'No existe conexión FTL directa desde tu posición. Elige una estrella enlazada.':`DESTINO: ${s.sectors[selected].visited?s.sectors[selected].name:'SISTEMA SIN CARTOGRAFIAR'} · COSTE ${fuelCost} COMBUSTIBLE · ${s.resources.fuel<fuelCost?'AUTONOMÍA INSUFICIENTE':'RUTA DISPONIBLE'}`;
 const advice=routeAdvisory(s,selected);
 if(advice&&selected!==s.location){
  const route=advice.outward.path.map(i=>s.sectors[i].visited?s.sectors[i].name:`#${i+1}`).join(' → ');
  const retreat=advice.retreat?`Retorno a ${s.sectors[advice.retreat.path.at(-1)].name}: ${advice.retreat.cost} FTL`:'Sin refugio explorado';
  $('routeInfo').textContent+=` | RUTA ${route} (${advice.outward.cost} FTL, ${advice.outward.hops} saltos) | ${retreat} | ${advice.warning}${advice.possibleLocalRecovery?' · plasma potencial sin verificar':''}`;
 }

}
function renderSurface(p){
 const holder=$('expeditionSites');holder.replaceChildren();const canLand=LANDABLE.includes(p.biome);$('surfaceInfo').textContent=!p.scanned?'Escanea primero el mundo para localizar puntos de interés.':!canLand?'Entorno no apto para aterrizaje: utiliza la exploración orbital.':`Bioma: ${p.biome} · Riesgo ${p.risk}/4 · Selecciona dos especialistas y un protocolo.`;
 const t1=$('expCrew1'),t2=$('expCrew2');for(const select of [t1,t2]){const keep=select.value;select.replaceChildren();for(const c of s.crew){const o=el('option','',`${c.name} · ${c.role} · Salud ${c.health}%`);o.value=c.id;select.append(o);}select.value=s.crew.some(c=>c.id===keep)?keep:(select===t1?'sam':'ada');}
 if(t1.value===t2.value)t2.value=s.crew.find(c=>c.id!==t1.value)?.id||'';
 for(const site of p.sites){const d=el('div','surface-site'),title=el('strong','',site.title),desc=el('span','',site.completed?`TERMINADA · ${site.outcome==='success'?'Hallazgo':'Retirada'}`:`Dificultad ${site.difficulty}/6 · Potencial ${site.reward} datos`),button=el('button','',site.completed?'EXPLORADO':'DESPLEGAR');button.disabled=!p.scanned||!canLand||site.completed||s.gameOver||!!s.pending||s.resources.oxygen<12||s.resources.food<8;button.addEventListener('click',()=>{const team=[t1.value,t2.value];if(team[0]===team[1]){setBanner('Selecciona dos tripulantes distintos.');return;}run('expedition',{site:site.id,team,approach:$('expApproach').value});});d.append(title,desc,button);holder.append(d);}
 const chosen=p.sites.find(site=>!site.completed);$('expOdds').textContent=chosen&&p.scanned&&canLand&&t1.value!==t2.value?`Probabilidad estimada de éxito: ${Math.round(expeditionChance(s,[t1.value,t2.value],chosen,$('expApproach').value)*100)}% · Coste: 12 oxígeno, 8 raciones`:'Selecciona un lugar disponible para la expedición.';
}
for(const id of ['expCrew1','expCrew2','expApproach'])$(id).addEventListener('change',()=>renderSurface(current(s)));
function renderStories(){
 const holder=$('storyArcs');holder.replaceChildren();
 for(const arc of STORY_ARCS){const progress=s.narrative.arcs[arc.id],card=el('div','story-card');card.append(el('strong','',progress.stage?'◈ '+arc.title:'◇ SEÑAL SIN IDENTIFICAR'),el('span','',progress.stage===0?'Sin pistas':progress.stage===1?`Investigación · ${progress.clues}/3 pistas`:progress.stage===2?'Revelación completa · decisión disponible':progress.stage===3?'Consecuencias en curso':`Archivo cerrado · ${progress.resolution}`));holder.append(card);}
 const pending=s.narrative.delayed.length;
 $('storyDecision').disabled=s.gameOver||!!s.pending||!STORY_ARCS.some(a=>s.narrative.arcs[a.id].stage===2&&s.narrative.arcs[a.id].clues>=3);
 $('storyHistory').replaceChildren(el('div','',`${pending} consecuencias pendientes`),...s.narrative.history.slice(0,6).map(entry=>el('p','',`Día ${entry.day} · ${entry.text}`)));
}
const ENGINEERING_LABELS={engine:'Propulsión',life:'Soporte vital',scanner:'Sensores',shield:'Escudos'};
function renderEngineering(){const holder=$('powerControls');holder.replaceChildren();for(const key of POWER_KEYS){const row=el('div','power-row');const label=el('label','',ENGINEERING_LABELS[key]);const input=el('input');input.type='number';input.min='5';input.max='70';input.step='1';input.value=s.engineering.allocation[key];input.dataset.power=key;label.append(input);row.append(label,el('span','',`Nivel ${s.engineering.levels[key]} · Rendimiento ${Math.round(engineeringEfficiency(s,key)*100)}%`));holder.append(row);}const upgrades=$('upgrades');upgrades.replaceChildren();for(const key of POWER_KEYS){const level=s.engineering.levels[key],b=el('button','',level>=3?`${ENGINEERING_LABELS[key]} · MÁXIMO`:`MEJORAR ${ENGINEERING_LABELS[key]} · ${12*level} piezas / ${8*level} datos`);b.disabled=level>=3||s.gameOver||!!s.pending||s.resources.parts<12*level||s.resources.data<8*level;b.addEventListener('click',()=>run('upgrade',{system:key}));upgrades.append(b);}const research=$('research');research.replaceChildren();for(const [id,tech] of Object.entries(RESEARCH)){const done=s.engineering.research.includes(id),b=el('button','',`${tech.name} · ${done?'COMPLETADA':tech.cost+' datos'}`);b.disabled=done||s.gameOver||!!s.pending||s.resources.data<tech.cost;b.addEventListener('click',()=>run('research',{id}));research.append(b);}$('applyPower').disabled=s.gameOver||!!s.pending;$('cascadeStatus').textContent=`Fallos en cascada registrados: ${s.engineering.cascades}`;}
$('applyPower').addEventListener('click',()=>{const allocation=Object.fromEntries([...document.querySelectorAll('[data-power]')].map(i=>[i.dataset.power,Number(i.value)]));const r=act(s,'allocate',{allocation});if(!r.ok){$('powerFeedback').textContent=r.error;return;}s=r.state;save();render();$('powerFeedback').textContent='Energía redistribuida correctamente.';});
function spotlightTarget(selector){const station=stationForTarget(selector);switchStation(station);const target=document.querySelector(selector);if(!target)return;target.scrollIntoView({behavior:prefs.motion?'smooth':'auto',block:'center'});target.classList.add('guide-flash');setTimeout(()=>target.classList.remove('guide-flash'),1800);const focusTarget=target.matches('button,select,input,[href]')?target:target.querySelector('button:not([disabled]),select:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])');focusTarget?.focus?.({preventScroll:true});}
function currentGuideStage(){const p=current(s);let stage;if(!p.scanned)stage=0;else if(p.harvested===false || (typeof p.harvested==='number'&&p.harvested===0))stage=1;else if(selected===null)stage=2;else if(selected!==s.location)stage=3;else stage=4;if(s.gameOver)stage=4;return stage;}
function renderLaunchpad(){const p=current(s);const stage=currentGuideStage();const steps=[{card:'launchStepScan',meta:'launchMetaScan',desc:'launchDescScan',target:'#scan',ready:'IR A ESCANEAR ↗',idle:'Descubre el bioma y abre el primer ciclo de recursos.',done:'Bioma y lecturas orbitales confirmadas.'},{card:'launchStepHarvest',meta:'launchMetaHarvest',desc:'launchDescHarvest',target:'#harvest',ready:'IR A EXTRAER ↗',idle:'Extrae recursos para mantener a la tripulación y reparar la nave.',done:'Suministros reunidos en este sistema.'},{card:'launchStepRoute',meta:'launchMetaRoute',desc:'launchDescRoute',target:'#galaxyTitle',ready:'ABRIR CARTA ESTELAR ↗',idle:'Elige una estrella conectada y revisa el coste antes de gastar combustible.',done:'Destino seleccionado y ruta disponible.'},{card:'launchStepJump',meta:'launchMetaJump',desc:'launchDescJump',target:'#jump',ready:'IR AL SALTO FTL ↗',idle:'Cuando tengas ruta y combustible, confirma el salto para avanzar a otro sistema.',done:'FTL autorizado. La nave está lista para abandonar la órbita.'}];for(const [index,item] of steps.entries()){const card=$(item.card),meta=$(item.meta),desc=$(item.desc),button=card.querySelector('.launch-go');const isDone=index<stage;const isCurrent=index===stage;card.dataset.state=isDone?'done':isCurrent?'current':'upcoming';card.setAttribute('aria-current',isCurrent?'step':'false');meta.textContent=isDone?'COMPLETADO':isCurrent?'PASO RECOMENDADO':'PENDIENTE';if(index===2&&selected!==null&&selected!==s.location){desc.textContent=`Destino fijado: ${s.sectors[selected].visited?s.sectors[selected].name:'sistema sin cartografiar'} · ${travelFuelCost(s,selected)} combustible.`;}else if(index===3&&selected!==null&&selected!==s.location){desc.textContent=`Pulsa SALTAR AL DESTINO para ejecutar la ruta a ${s.sectors[selected].visited?s.sectors[selected].name:'tu objetivo'}.`;}else desc.textContent=isDone?item.done:item.idle;button.dataset.target=item.target;button.textContent=isCurrent?item.ready:isDone?'REVISAR ↗':'ABRIR PANEL ↗';button.disabled=index>stage+1;}}
function renderGuide(){const p=current(s);const stages=[['ESCANEA TU PRIMER MUNDO','El primer paso es revelar el planeta. Pulsa ESCANEAR para descubrir su bioma y sus recursos.','scan','#scan'],['OBTÉN SUMINISTROS','Ya conoces este mundo. Extrae recursos para preparar la próxima expedición.','harvest','#harvest'],['PLANIFICA TU RUTA','Elige una estrella conectada en la carta galáctica. La ruta y el coste aparecerán debajo del mapa.','map','#galaxyTitle'],['SALTA A UN NUEVO SISTEMA','Ya has seleccionado un destino. Comprueba el coste FTL y confirma el salto.','jump','#jump'],['EXPLORA LA FRONTERA','Escanea, extrae y explora más sectores. Revisa siempre combustible, soporte vital y tripulación.','surface','#surfacePanel']];let stage;if(!p.scanned)stage=0;else if(p.harvested===false || (typeof p.harvested==='number'&&p.harvested===0))stage=1;else if(selected===null)stage=2;else if(selected!==s.location)stage=3;else stage=4;if(s.gameOver)stage=4;const [title,description,,target]=stages[stage];$('guideTitle').textContent=title;$('guideDescription').textContent=description;$('guideProgress').textContent=`PROTOCOLO ${Math.min(stage+1,5)} / 5 · ${s.discoveries} DE 8 MUNDOS CARTOGRAFIADOS`;$('guideAction').dataset.target=target;$('guideAction').textContent=stage===0?'IR A ESCANEAR ↗':stage===1?'IR A EXTRAER ↗':stage===2?'ABRIR CARTA ESTELAR ↗':stage===3?'IR AL SALTO FTL ↗':'VER EXPLORACIÓN ↗';}
function renderOverview(){const stage=currentGuideStage();const directive=['Escanea tu mundo inicial','Extrae suministros para la misión','Abre la carta estelar','Ejecuta el salto FTL','Mantén el ciclo de exploración'][Math.min(stage,4)];$('overviewDirective').textContent=directive;$('overviewSummary').textContent=stage===0?'Aún no tienes lecturas del planeta actual. Inicia el ciclo de exploración orbital.':stage===1?'Con los datos orbitales listos, reúne combustible, comida y repuestos antes de partir.':stage===2?'Busca un sistema conectado y revisa el consumo antes de comprometer el viaje.':stage===3?'El destino ya está fijado. Solo falta autorizar la maniobra FTL.':'La expedición ya está en marcha. Alterna entre estaciones para mantenerlo todo bajo control.';$('overviewCondition').textContent=s.gameOver?(s.victory?'Misión cumplida':'Misión terminada'):s.systems.life<35||s.systems.hull<35?'Alerta crítica':'Operativa';$('overviewStatus').textContent=s.gameOver?(s.victory?'El atlas ha sido transmitido a la Tierra.':'La AURORA-404 ya no puede continuar.'):(s.systems.life<35||s.systems.hull<35?'Los sistemas vitales requieren atención inmediata en ingeniería.':'La nave mantiene un perfil estable y puede continuar la misión.');const firstOverviewButton=document.querySelector('.bridge-jump-button');if(firstOverviewButton)firstOverviewButton.dataset.target=stage<=1?'#scan':stage===2?'#galaxyTitle':stage===3?'#jump':'#surfacePanel';}
function render(){const p=current(s);renderGuide();renderLaunchpad();renderOverview();const bridgeDanger=s.systems.life<35||s.systems.hull<35;const dest=$('bridgeDestination');if(dest)dest.textContent=p.name;const sub=$('bridgeSubline');if(sub)sub.textContent=`SECTOR ${String(s.location+1).padStart(3,'0')} · DÍA ${String(s.day).padStart(3,'0')} · ${p.scanned?p.biome:'SUPERFICIE NO ESCANEADA'}`;const hull=$('bridgeHull');if(hull)hull.textContent=`${s.systems.hull}%`;const fuel=$('bridgeFuel');if(fuel)fuel.textContent=`${s.resources.fuel} UN.`;const status=$('bridgeCondition');if(status)status.textContent=s.gameOver?(s.victory?'MISIÓN CUMPLIDA':'MISIÓN TERMINADA'):bridgeDanger?'ALERTA CRÍTICA':'OPERATIVA';$('telemetry').textContent=`SECTOR ${String(s.location+1).padStart(3,'0')} · ${s.gameOver?'MISIÓN FINALIZADA':s.systems.life<35||s.systems.hull<35?'ALERTA DE INTEGRIDAD':'SISTEMAS EN LÍNEA'}`;$('clock').textContent=`DÍA ${String(s.day).padStart(3,'0')} · ${s.discoveries} MUNDOS CARTOGRAFIADOS`;document.body.classList.toggle('ship-danger',s.systems.life<35||s.systems.hull<35);renderMap();renderSurface(p);renderStories();renderEngineering();$('sectorName').textContent=`${p.name} // SECTOR ${String(s.location+1).padStart(3,'0')}`;
const stats=$('resources');const previousStats=new Map([...stats.querySelectorAll('.stat')].map(item=>[item.dataset.key,Number(item.querySelector('.v')?.textContent)]));stats.replaceChildren();for(const [key,v] of [...Object.entries(s.resources),['day',s.day]]){const a=el('div','stat'),k=el('div','k',LABEL[key]||'DÍA DE MISIÓN'),val=el('div','v',String(v));a.dataset.key=key;const before=previousStats.get(key);if(Number.isFinite(before)&&before!==v&&prefs.motion){a.classList.add(v<before?'metric-drop':'metric-rise');val.classList.add('value-change');}a.append(k,val);stats.append(a);}
$('sectorDetails').replaceChildren();for(const [k,v] of [['TIPO DE MUNDO',p.scanned?p.biome:'DESCONOCIDO'],['AMENAZA',p.hazard],['RIESGO',p.scanned?`${p.risk} / 4`:'PENDIENTE'],['LECTURAS',p.scanned?(p.anomaly?'ANOMALÍA DETECTADA':'ESTABLES'):'SIN DATOS']]){const d=el('div','detail');d.append(el('strong','',k),el('span','',v));$('sectorDetails').append(d);}
const hue=['#64b7c8','#b476ad','#b9a36d','#7bab8c','#a77557','#6496ac','#cc879e'];$('planet').style.background=`radial-gradient(circle at 28% 24%,#d2efdd,${hue[s.location%hue.length]} 29%,#233c63 62%,#122337 82%)`;
$('systems').replaceChildren();$('systemsEngineering').replaceChildren();for(const [key,v] of Object.entries(s.systems)){const d=el('div','system'),name=el('span','',LABEL[key]),bar=el('div','bar'),fill=el('div','fill'),num=el('b','',`${v}%`),b=el('button','','REPARAR');fill.style.width=`${v}%`;if(v<35)fill.style.background='#e57c78';bar.append(fill);b.disabled=s.gameOver||!!s.pending||v>=100||s.resources.parts<8;b.addEventListener('click',()=>run('repair',{system:key}));d.append(name,bar,num,b);$('systems').append(d);const clone=d.cloneNode(true);const cloneButton=clone.querySelector('button');cloneButton.textContent='IR A ORBITAL';cloneButton.disabled=false;cloneButton.addEventListener('click',()=>{switchStation('orbital',{focus:true});spotlightTarget('#scan');});$('systemsEngineering').append(clone);}
$('crew').replaceChildren();for(const c of s.crew){const m=el('div','member'),avatar=el('div','avatar',c.name.split(' ').map(x=>x[0]).join('')),info=el('div');info.append(el('div','name',`${c.name} · ${c.role}`),el('div','desc',`${c.trait} · Salud ${c.health}% · Moral ${c.morale}% · Fatiga ${c.fatigue}%`));info.append(el('div','desc',`Lealtad ${c.loyalty}% · Estrés ${c.stress}% · ${crewStatus(c)}`));const actions=el('div','crew-actions');const counsel=el('button','','APOYO');counsel.disabled=s.gameOver||!!s.pending||s.resources.food<3;counsel.addEventListener('click',()=>run('counsel',{id:c.id}));const assign=el('select');for(const [value,label] of [['auto','Automático'],['bridge','Puente'],['engineering','Ingeniería'],['science','Ciencia'],['medical','Enfermería']]){const o=el('option','',label);o.value=value;assign.append(o);}assign.value=c.assignment;assign.disabled=s.gameOver||!!s.pending;assign.setAttribute('aria-label',`Asignación de ${c.name}`);assign.addEventListener('change',()=>run('assign',{id:c.id,assignment:assign.value}));actions.append(counsel,assign);info.append(actions);m.append(avatar,info);$('crew').append(m);}
$('relationships').replaceChildren();for(const key of PAIRS){const [a,b]=key.split(':'),v=s.relations[key],names=[a,b].map(id=>s.crew.find(c=>c.id===id).name.split(' ')[0]);const d=el('div','relationship'),btt=el('button','',`MEDIAR −4 🍽`);btt.disabled=s.gameOver||!!s.pending||s.resources.food<4||v===100;btt.addEventListener('click',()=>run('mediate',{ids:[a,b]}));d.append(el('span','',`${names.join(' ↔ ')} · ${v}/100`),btt);$('relationships').append(d);}$('log').replaceChildren();for(const entry of s.log){const d=el('div',`entry ${entry.kind||''}`);d.append(el('b','',`DÍA ${entry.day}`),el('span','',entry.text));$('log').append(d);}
$('progress').textContent=`MUNDOS EXPLORADOS ${s.discoveries}/8 · DATOS ${s.resources.data}/95`;
for(const [id,disable] of [['scan',p.scanned],['harvest',!p.scanned||p.harvested],['fuelRecovery',!p.scanned||p.emergencyFuelUsed||s.resources.oxygen<8||s.systems.hull<=15],['jump',travelCost(s,selected)===null||s.resources.fuel<travelFuelCost(s,selected)||s.systems.engine<20],['rest',s.resources.food<4],['end',s.discoveries<8||s.resources.data<95]])$(id).disabled=s.gameOver||!!s.pending||disable;
const dialog=$('decision');if(s.pending){$('decisionTitle').textContent=s.pending.title;$('decisionBody').textContent=s.pending.body;$('options').replaceChildren();s.pending.options.forEach((o,i)=>{const b=el('button','',o.label);b.disabled=Object.entries(o.delta||{}).some(([key,value])=>value<0&&s.resources[key]<-value);b.addEventListener('click',()=>run('resolve',{index:i}));$('options').append(b);});if([...$('options').children].every(b=>b.disabled)){const emergency=el('button','','PROTOCOLO DE EMERGENCIA · Daño a la nave y pérdida de moral');emergency.addEventListener('click',()=>run('resolve',{index:-1}));$('options').append(emergency);}if(!dialog.open)dialog.showModal();}else if(dialog.open)dialog.close();}
for(const id of ['scan','harvest','fuelRecovery','rest','end'])$(id).addEventListener('click',()=>run(id));$('jump').addEventListener('click',()=>run('jump',{target:selected}));$('storyDecision').addEventListener('click',()=>run('story'));
$('new').addEventListener('click',()=>{if(!confirm('¿Iniciar una misión nueva? La partida actual se sustituirá. Puedes exportarla antes.'))return;const seed=prompt('Semilla del universo (mismo texto = mismos sectores):',`404-${Date.now().toString(36)}`);if(seed===null)return;s=initial(seed||'404-ODYSSEY');selected=null;save();setBanner('Nueva expedición iniciada.');render();});
$('export').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(s,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`DEEP-SPACE-404-${s.seed.replace(/[^a-z0-9_-]/gi,'_')}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setBanner('Copia de partida preparada.');});
$('importTrigger').addEventListener('click',()=> $('import').click());
$('import').addEventListener('change',async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>1024*1024){setBanner('Archivo demasiado grande (máximo 1 MB).');return;}try{const incoming=JSON.parse(await file.text()),restored=upgradeSave(incoming);if(!restored)throw Error('Formato o versión de partida no válido.');if(!confirm('¿Sustituir la partida actual por la importada? Exporta tu partida actual antes si deseas conservarla.'))return;s=restored;selected=null;save();render();setBanner('Partida importada correctamente.');}catch(err){setBanner(`Importación fallida: ${err.message}`);}});
$('eventDismiss').addEventListener('click',()=>{clearTimeout(eventTimer);$('missionEvent').hidden=true;});$('helpOpen').addEventListener('click',()=>{$('manual').showModal();});$('manualClose').addEventListener('click',()=>$('manual').close());$('guideAction').addEventListener('click',()=>spotlightTarget($('guideAction').dataset.target));document.querySelectorAll('.launch-go').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();spotlightTarget(button.dataset.target);}));document.querySelectorAll('.launch-card').forEach(card=>card.addEventListener('click',event=>{if(event.target.closest('button,select,input,a,label'))return;spotlightTarget(card.dataset.target);}));$('guideHide').addEventListener('click',()=>{$('missionGuide').hidden=true;});$('welcomeStart').addEventListener('click',()=>{if($('welcomeRemember').checked){try{localStorage.setItem(INTRO_KEY,'1');}catch{}}$('welcome').close();});$('welcomeManual').addEventListener('click',()=>{$('welcome').close();$('manual').showModal();});try{if(!localStorage.getItem(INTRO_KEY))$('welcome').showModal();}catch{};
function setupBridgeFx(){const bridge=document.querySelector('.bridge-viewport');if(!bridge)return;const reset=()=>{bridge.style.setProperty('--spot-x','72%');bridge.style.setProperty('--spot-y','34%');bridge.style.setProperty('--tilt-x','0px');bridge.style.setProperty('--tilt-y','0px');};reset();bridge.addEventListener('pointermove',event=>{if(!prefs.motion){reset();return;}const rect=bridge.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width,y=(event.clientY-rect.top)/rect.height;bridge.style.setProperty('--spot-x',`${(x*100).toFixed(1)}%`);bridge.style.setProperty('--spot-y',`${(y*100).toFixed(1)}%`);bridge.style.setProperty('--tilt-x',`${((x-.5)*18).toFixed(1)}px`);bridge.style.setProperty('--tilt-y',`${((y-.5)*14).toFixed(1)}px`);});bridge.addEventListener('pointerleave',reset);}
function setupObservers(){const reveal=[...document.querySelectorAll('.panel,.mission-guide,.launch-card,.bridge-viewport,.command-strip,.stat,.station-view')];reveal.forEach(node=>node.classList.add('reveal-item'));if('IntersectionObserver' in window){const revealObserver=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('is-revealed');revealObserver.unobserve(entry.target);}}, {threshold:.14});reveal.forEach(node=>revealObserver.observe(node));}else reveal.forEach(node=>node.classList.add('is-revealed'));}
document.querySelectorAll('.station-tab').forEach(button=>button.addEventListener('click',()=>switchStation(button.dataset.station,{focus:true})));document.querySelectorAll('.bridge-jump-button').forEach(button=>button.addEventListener('click',()=>spotlightTarget(button.dataset.target)));setupBridgeFx();setupObservers();switchStation(activeStation);
$('decision').addEventListener('cancel',event=>{if(s.pending)event.preventDefault();});render();if(invalidLocalSave)setBanner('AVISO: guardado local dañado. Se ha intentado preservar una copia de recuperación en este navegador; puedes exportar la misión actual.');

if('serviceWorker' in navigator&&location.protocol.startsWith('http'))window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
