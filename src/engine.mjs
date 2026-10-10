export const VERSION=5;
export const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function hashSeed(seed){let h=2166136261; for(const c of String(seed)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function rng(seed){let x=hashSeed(seed)||1;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return(x>>>0)/4294967296;};}
const syll=['Astra','Vega','Nox','Erebus','Lyra','Khepri','Orion','Solis','Tethys','Kepler','Nyx','Helion'];
const hazards=['Nebulosa de partículas','Campo gravitacional','Tormenta de radiación','Ecos electromagnéticos','Silencio absoluto'];
const biomes=['Océano subglacial','Desierto cristalino','Mundo selvático','Luna volcánica','Gigante gaseoso','Planeta errante','Ruinas orbitales'];
export function sector(seed,index){const r=rng(`${seed}:sector:${index}`);const n=1+Math.floor(r()*999);return {id:index,name:`${syll[Math.floor(r()*syll.length)]}-${n}`,biome:biomes[Math.floor(r()*biomes.length)],hazard:hazards[Math.floor(r()*hazards.length)],risk:1+Math.floor(r()*4),richness:1+Math.floor(r()*4),anomaly:r()>.55,visited:false,scanned:false,harvested:false,incidentResolved:false,emergencyFuelUsed:false,sites:expeditionSites(seed,index)};}
export const LANDABLE=['Océano subglacial','Desierto cristalino','Mundo selvático','Luna volcánica','Planeta errante'];
const SITES=['Señal enterrada','Estructura ancestral','Biosfera desconocida','Falla de energía','Restos de expedición','Monolito silencioso'];
export function expeditionSites(seed,index){const r=rng(`${seed}:surface:${index}:v1`);return Array.from({length:2},(_,i)=>({id:i,title:SITES[Math.floor(r()*SITES.length)],difficulty:2+Math.floor(r()*5),reward:8+Math.floor(r()*12),completed:false,outcome:null}));}
export function expeditionChance(s,team,site,approach){const crew=team.map(id=>s.crew.find(c=>c.id===id));const strength=crew.reduce((v,c)=>v+c.skill+(c.assignment==='science'?1:0)+(c.assignment==='engineering'?1:0)-Math.floor(c.fatigue/35)-Math.floor(c.stress/50),0);return clamp(0.52+(strength-site.difficulty*2)*.045+(approach==='cautious'?.14:-.08)-current(s).risk*.035,.08,.95);}
export const CREW=[{id:'ada',name:'Ada Voss',role:'Ingeniera',skill:4,trait:'Meticulosa'},{id:'ian',name:'Ilan Rhee',role:'Piloto',skill:4,trait:'Impulsivo'},{id:'sam',name:'Samira Okafor',role:'Científica',skill:5,trait:'Curiosa'},{id:'leo',name:'Leo Maren',role:'Médico',skill:4,trait:'Empático'},{id:'nix',name:'Nix Calder',role:'Especialista',skill:3,trait:'Desconfiado'}];
export function initialRelations(){const pairs={};for(let i=0;i<CREW.length;i++)for(let j=i+1;j<CREW.length;j++)pairs[`${CREW[i].id}:${CREW[j].id}`]=50;return pairs;}
export const PAIRS=Object.keys(initialRelations());
export function relationship(s,a,b){const key=[a,b].sort((x,y)=>CREW.findIndex(c=>c.id===x)-CREW.findIndex(c=>c.id===y)).join(':');return s.relations[key]??50;}
function relationDelta(s,a,b,delta){const key=[a,b].sort((x,y)=>CREW.findIndex(c=>c.id===x)-CREW.findIndex(c=>c.id===y)).join(':');if(Object.hasOwn(s.relations,key))s.relations[key]=clamp(s.relations[key]+delta,0,100);}
function personal(s,id,changes){const c=s.crew.find(x=>x.id===id);if(!c)return;for(const [k,v] of Object.entries(changes))c[k]=clamp(c[k]+v,0,100);}
function history(s,msg){s.crewHistory.unshift({day:s.day,text:msg});s.crewHistory=s.crewHistory.slice(0,40);note(s,msg,'signal');}
export function crewStatus(c){return c.stress>=85?'AL BORDE':c.loyalty<=20?'DESAFECTO':c.morale<30?'DESMORALIZADO':c.fatigue>75?'EXHAUSTO':'OPERATIVO';}
// Narrative threads have persistent clues, delayed repercussions and deterministic triggers.
export const STORY_ARCS=[
 {id:'echo',title:'EL ECO DE LOS AUSENTES',intro:'Una voz humana atraviesa una frecuencia anterior al primer viaje interestelar.',clue:'La emisión contiene coordenadas y una advertencia: «no respondáis».',reveal:'La baliza lleva cientos de años repitiendo las últimas palabras de una expedición imposible.'},
 {id:'garden',title:'EL JARDÍN DE CRISTAL',intro:'Bajo la superficie palpitan estructuras que parecen cultivar recuerdos.',clue:'Las muestras reproducen fragmentos del diario de la tripulación.',reveal:'La biosfera aprende de quienes la observan y puede alterar su percepción.'},
 {id:'threshold',title:'EL UMBRAL NEGRO',intro:'Una geometría imposible aparece detrás de una estrella apagada.',clue:'Las lecturas señalan una tecnología capaz de estabilizar el salto FTL.',reveal:'Alguien selló deliberadamente esta ruta para impedir que algo la cruzase.'}
];
export function narrativeInitial(){return {arcs:Object.fromEntries(STORY_ARCS.map(a=>[a.id,{stage:0,clues:0,choice:null,resolution:null}])),delayed:[],history:[]};}
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
export const POWER_KEYS=['engine','life','scanner','shield'];
export const RESEARCH={efficiency:{name:'Reactores de alto rendimiento',cost:35},reinforcement:{name:'Blindaje adaptativo',cost:40},automation:{name:'Mantenimiento autónomo',cost:45}};
export function engineeringInitial(){return {allocation:{engine:30,life:35,scanner:20,shield:15},levels:{engine:1,life:1,scanner:1,shield:1},research:[],cascades:0};}
export function engineeringEfficiency(s,system){const eng=s.engineering;const allocation=eng.allocation[system];const level=eng.levels[system];const support=s.crew.filter(c=>c.assignment===(system==='scanner'?'science':system==='life'?'medical':'engineering')&&c.health>=20).length;
 return clamp(0.5+allocation/70+(level-1)*0.1+support*.05+(eng.research.includes('efficiency')?.10:0),.25,1.45);}
function engineeringTick(s,cost){const eng=s.engineering;const supply=engineeringEfficiency(s,'life');const wear=engineeringEfficiency(s,'engine');s.systems.engine=clamp(s.systems.engine-Math.max(0,Math.round(cost*(2.8-wear))),0,100);s.systems.life=clamp(s.systems.life-Math.max(0,Math.round(cost*(2.5-supply))),0,100);
 if(s.systems.life<35){const damage=Math.ceil((35-s.systems.life)/20)*cost;s.resources.oxygen=clamp(s.resources.oxygen-damage,0,999);if(s.systems.life<18){s.systems.hull=clamp(s.systems.hull-2*cost,0,100);eng.cascades++;note(s,'FALLO EN CASCADA: soporte vital crítico; la presión daña el casco.','danger');}}
 if(s.systems.engine<20){s.systems.hull=clamp(s.systems.hull-cost,0,100);note(s,'ALERTA: vibración del motor transmitida al casco.','danger');}
 if(eng.research.includes('automation')&&s.resources.parts>=1&&s.systems.life<75){charge(s,{parts:-1});s.systems.life=clamp(s.systems.life+3,0,100);}
}
export function initial(seed='404-ODYSSEY'){return {schemaVersion:VERSION,seed:String(seed).slice(0,80),day:1,turn:0,location:0,resources:{fuel:72,oxygen:90,food:75,parts:30,data:0},systems:{hull:100,engine:90,life:92,scanner:88},crew:CREW.map(c=>({...c,health:100,morale:75,fatigue:8,loyalty:70,stress:15,assignment:'auto'})),relations:initialRelations(),crewHistory:[],sectors:Array.from({length:24},(_,i)=>({...sector(seed,i),visited:i===0})),galaxy:galaxy(seed),log:[{day:1,text:'La nave AURORA-404 abandona el espacio cartografiado. El mando es tuyo.',kind:'signal'}],pending:null,gameOver:false,victory:false,discoveries:0,expeditionHistory:[],narrative:narrativeInitial(),engineering:engineeringInitial()};}
export const current=s=>s.sectors[s.location];
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
export function act(state,type,payload={}){
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
export function validateSave(s){if(!safeShape(s)||!s||typeof s!=='object'||s.schemaVersion!==VERSION||!Array.isArray(s.sectors)||!Array.isArray(s.crew)||!s.resources||!s.systems||!Number.isInteger(s.location)||s.location<0||s.location>=s.sectors.length||s.sectors.length>10000||s.crew.length!==5||!Array.isArray(s.galaxy)||s.galaxy.length!==24||s.sectors.length!==24||!s.galaxy.every((n,i)=>n&&n.id===i&&Number.isFinite(n.x)&&Number.isFinite(n.y)&&Array.isArray(n.links)&&n.links.every(j=>Number.isInteger(j)&&j>=0&&j<24&&s.galaxy[j]?.links.includes(i)))||typeof s.seed!=='string'||s.seed.length>80||!Array.isArray(s.log)||s.log.length>80)return false;if(!s.sectors.every(p=>typeof p.emergencyFuelUsed==='boolean'))return false;if(!Array.isArray(s.expeditionHistory)||s.expeditionHistory.length>60||!s.sectors.every((p,i)=>Array.isArray(p.sites)&&p.sites.length===2&&p.sites.every((site,j)=>site.id===j&&typeof site.title==='string'&&Number.isInteger(site.difficulty)&&Number.isInteger(site.reward)&&typeof site.completed==='boolean'&&[null,'success','failure'].includes(site.outcome))))return false;if(!s.engineering||!s.engineering.allocation||!s.engineering.levels||!Array.isArray(s.engineering.research)||!Number.isInteger(s.engineering.cascades)||s.engineering.cascades<0||s.engineering.research.length>3||!s.engineering.research.every(k=>Object.hasOwn(RESEARCH,k))||new Set(s.engineering.research).size!==s.engineering.research.length||POWER_KEYS.some(k=>!Number.isInteger(s.engineering.allocation[k])||s.engineering.allocation[k]<5||s.engineering.allocation[k]>70||!Number.isInteger(s.engineering.levels[k])||s.engineering.levels[k]<1||s.engineering.levels[k]>3)||POWER_KEYS.reduce((v,k)=>v+s.engineering.allocation[k],0)!==100)return false;if(!s.narrative||!Array.isArray(s.narrative.delayed)||s.narrative.delayed.length>20||!Array.isArray(s.narrative.history)||s.narrative.history.length>48||!STORY_ARCS.every(a=>{const v=s.narrative.arcs?.[a.id];return v&&Number.isInteger(v.stage)&&v.stage>=0&&v.stage<=4&&Number.isInteger(v.clues)&&v.clues>=0&&v.clues<=3&&[null,'share','seal','study'].includes(v.choice)&&[null,'share','seal','study'].includes(v.resolution);})||!s.relations||!Array.isArray(s.crewHistory)||s.crewHistory.length>40||!PAIRS.every(k=>Number.isInteger(s.relations[k])&&s.relations[k]>=0&&s.relations[k]<=100)||!s.crew.every(c=>['auto','bridge','engineering','science','medical'].includes(c.assignment)&&['health','morale','fatigue','loyalty','stress'].every(k=>Number.isFinite(c[k])&&c[k]>=0&&c[k]<=100)))return false;return [...Object.values(s.resources),...Object.values(s.systems)].every(v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=999);}

// GALAXY v0.2: deterministic undirected network, with guaranteed connectivity.
export function galaxy(seed,count=24){
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
export function travelCost(s,target){
 const map=s.galaxy;if(!map||!Number.isInteger(target)||!map[target]||target===s.location||!map[s.location]?.links.includes(target))return null;
 const a=map[s.location],b=map[target],distance=Math.hypot(a.x-b.x,a.y-b.y);
 return Math.max(8,Math.round(7+distance*.46+(s.sectors[target]?.risk||1)*1.5));
}
export function travelFuelCost(s,target){const cost=travelCost(s,target);return cost===null?null:Math.max(1,Math.ceil(cost/(engineeringEfficiency(s,'engine')*(s.engineering.research.includes('efficiency')?1.12:1))));}
// Dijkstra on the current FTL graph. Estimates assume present engine efficiency,
// no subsequent damage, repairs, research, harvesting or emergency recovery.
export function routePlan(s, destination, origin=s.location){
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
export function routeAdvisory(s,target){
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
export function upgradeSave(saved){
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
