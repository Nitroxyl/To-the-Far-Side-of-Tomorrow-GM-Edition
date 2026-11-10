import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const catalogSource=read('santara-catalog.js').replace(/\bexport\s+(?=(?:async\s+)?(?:const|function)\b)/g,'');
const {santaraCatalogEntries}=new Function(catalogSource+'\nreturn {santaraCatalogEntries};')();
const templates=santaraCatalogEntries('megas');
const mega=templates.find(x=>x.id==='baxcalibur-mega');
const sword=templates.find(x=>x.collection==='santara_custom_abilities'&&x.id==='sword-of-ruin');
const stats={hp:115,attack:205,defense:150,specialAttack:75,specialDefense:125,speed:30};

test('Mega Baxcalibur has 700 BST, correct typing, Sword of Ruin and Trick Room speed',()=>{
 assert.ok(mega);
 assert.equal(mega.collection,'santara_mega_forms');
 assert.equal(mega.data.baseSpeciesKey,'baxcalibur');
 assert.deepEqual(mega.data.baseStats,stats);
 assert.equal(Object.values(stats).reduce((sum,n)=>sum+n,0),700);
 assert.deepEqual(mega.data.types,['dragon','ice']);
 assert.equal(mega.data.ability,'Sword of Ruin');
 assert.equal(mega.data.slug,'baxcalibur-mega');
 assert.ok(sword);
 assert.match(sword.data.description,/25% lower Defense/i);
 assert.match(sword.data.description,/other Pokémon/i);
 assert.match(sword.data.description,/4\/3/);
});

function createHarness(initial={}){
 const source=read('pokemon-party.js');
 const start=source.indexOf('async function syncBaxcaliburRevision(){');
 const end=source.indexOf('function artworkImage(item){',start);
 assert.ok(start>=0&&end>start);
 const records=new Map(Object.entries(structuredClone(initial)));
 const writes=[];
 const messages=[];
 const mkref=(collectionName,id)=>({collectionName,id,path:collectionName+'/'+id});
 const doc=(_store,collectionName,id)=>mkref(collectionName,id);
 const collection=(_store,collectionName)=>({collectionName});
 const snapshot=ref=>({
  id:ref.id,ref,exists:()=>records.has(ref.path),
  data:()=>structuredClone(records.get(ref.path))
 });
 const getDoc=async ref=>snapshot(ref);
 const getDocs=async c=>({docs:[...records.keys()]
  .filter(p=>p.startsWith(c.collectionName+'/'))
  .map(p=>snapshot(mkref(c.collectionName,p.slice(c.collectionName.length+1))))});
 const setNested=(object,key,val)=>{
  const parts=key.split('.');
  let pointer=object;
  for(const p of parts.slice(0,-1))pointer=pointer[p]??={};
  pointer[parts.at(-1)]=structuredClone(val);
 };
 const writeBatch=()=>({
  set(ref,data,options){writes.push({op:'set',path:ref.path,data,options});},
  update(ref,data){writes.push({op:'update',path:ref.path,data});},
  async commit(){
   for(const w of writes){
    if(w.op==='set'){
     records.set(w.path,w.options?.merge?{...(records.get(w.path)||{}),...structuredClone(w.data)}:structuredClone(w.data));
    }else{
     assert.ok(records.has(w.path),'update target must exist');
     const updated=structuredClone(records.get(w.path));
     for(const [k,v] of Object.entries(w.data))setNested(updated,k,v);
     records.set(w.path,updated);
    }
   }
  }
 });
 const deps={GM_SITE:true,GM_UID:'gm',user:{uid:'gm'},allowed:true,store:{},
  santaraCatalogEntries,megaForms:[],doc,collection,getDoc,getDocs,writeBatch,
  serverTimestamp:()=> '__SERVER_TIMESTAMP__',confirm:()=>true,
  say:message=>messages.push(message),render:()=>{}};
 const factory=new Function(...Object.keys(deps),source.slice(start,end)+
  '\nreturn syncBaxcaliburRevision;');
 return {run:factory(...Object.values(deps)),records,writes,messages};
}

test('migration updates existing Mega without touching artwork, stones, moves or other Pokémon',async()=>{
 const oldStats={hp:115,attack:185,defense:110,specialAttack:75,specialDefense:105,speed:110};
 const legacy='santara_mega_forms/mega-baxcalibur';
 const assignment='santara_pokemon_mega_assignments/team-1';
 const base='santara_pokemon/team-1';
 const other='santara_pokemon_mega_assignments/team-2';
 const h=createHarness({
  [legacy]:{slug:'mega-baxcalibur',name:'Mega Baxcalibur',baseSpeciesKey:'baxcalibur',
   baseStats:oldStats,types:['dragon','ice'],ability:'Thermal Exchange',
   spriteUrl:'https://example.org/art.png',spriteData:'',source:'custom'},
  [assignment]:{ownerUid:'trainer',requiredStone:'Baxcalibrite',megaActive:true,
   megaForm:{slug:'mega-baxcalibur',name:'Mega Baxcalibur',baseSpeciesKey:'baxcalibur',
    baseStats:oldStats,types:['dragon','ice'],ability:'Thermal Exchange',
    spriteUrl:'https://example.org/assigned.png',spriteData:'',source:'custom'}},
  [base]:{speciesKey:'baxcalibur',heldItem:'Baxcalibrite',moves:['Glaive Rush'],currentHp:70},
  [other]:{ownerUid:'other',requiredStone:'Lucarionite',megaForm:{
    slug:'lucario-mega',name:'Mega Lucario',baseSpeciesKey:'lucario',ability:'Adaptability'}}
 });
 await h.run();
 assert.deepEqual(h.records.get(legacy).baseStats,stats);
 assert.equal(h.records.get(legacy).ability,'Sword of Ruin');
 assert.equal(h.records.get(legacy).spriteUrl,'https://example.org/art.png');
 const linked=h.records.get(assignment);
 assert.deepEqual(linked.megaForm.baseStats,stats);
 assert.equal(linked.megaForm.ability,'Sword of Ruin');
 assert.equal(linked.megaForm.spriteUrl,'https://example.org/assigned.png');
 assert.equal(linked.megaForm.slug,'mega-baxcalibur');
 assert.equal(linked.requiredStone,'Baxcalibrite');
 assert.equal(linked.megaActive,true);
 assert.deepEqual(h.records.get(base),{
  speciesKey:'baxcalibur',heldItem:'Baxcalibrite',moves:['Glaive Rush'],currentHp:70
 });
 assert.equal(h.records.get(other).megaForm.ability,'Adaptability');
 assert.ok(!h.writes.some(w=>w.path.startsWith('santara_pokemon/')));
 const ability=h.records.get('santara_custom_abilities/sword-of-ruin');
 assert.deepEqual(ability.allowedSpeciesKeys,[]);
 assert.equal(ability.name,'Sword of Ruin');
});

test('first-time migration creates a canonical Mega form when none exists',async()=>{
 const h=createHarness();
 await h.run();
 const created=h.records.get('santara_mega_forms/baxcalibur-mega');
 assert.ok(created);
 assert.deepEqual(created.baseStats,stats);
 assert.equal(created.ability,'Sword of Ruin');
 assert.equal(h.writes.filter(x=>x.op==='set'&&x.path.startsWith('santara_mega_forms/')).length,1);
});
