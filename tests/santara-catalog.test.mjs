import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../santara-catalog.js',import.meta.url),'utf8');
const {SANTARA_CATALOG_GROUPS,santaraCatalogEntries}=await import('data:text/javascript,'+encodeURIComponent(src));
const categories=new Set(['Physical','Special','Status']);
const types=new Set('normal fire water electric grass ice fighting poison ground flying psychic bug rock ghost dragon dark steel fairy'.split(' '));
const six=['hp','attack','defense','specialAttack','specialDefense','speed'];
const groups=Object.fromEntries(SANTARA_CATALOG_GROUPS.map(g=>[g.id,santaraCatalogEntries(g.id)]));
const entries=Object.values(groups).flat();
const byName=name=>entries.find(x=>x.data.name===name);

test('Santara roster is complete and divided by spoiler level',()=>{
 assert.deepEqual(Object.fromEntries(Object.entries(groups).map(([k,v])=>[k,v.length])),{
  fossils:8,megas:29,story:3,drafts:2
 });
 assert.equal(entries.length,42);
 assert.equal(entries.filter(x=>x.collection==='santara_mega_forms').length,17);
 assert.equal(entries.filter(x=>x.collection==='santara_species_overrides').length,6);
 assert.throws(()=>santaraCatalogEntries('bogus'),/Unknown Santara/);
});

test('All records fit existing Firestore validation restrictions',()=>{
 const ids=new Set();
 for(const {collection,id,data} of entries){
  const unique=collection+'/'+id;
  assert.ok(!ids.has(unique),'Duplicate '+unique);
  ids.add(unique);
  assert.match(id,/^[a-z0-9-]{2,70}$/);
  assert.equal(data.slug,id);
  assert.ok(data.name.length>1&&data.name.length<=(collection==='santara_species_overrides'?65:collection==='santara_mega_forms'?85:48));
  assert.equal(typeof data.updatedAt,'undefined');
  if(collection==='santara_mega_forms'||collection==='santara_species_overrides'){
   for(const key of six)assert.ok(Number.isInteger(data.baseStats[key])&&data.baseStats[key]>=1&&data.baseStats[key]<=255,unique+' '+key);
   assert.ok(data.types.length>0&&data.types.length<=2&&data.types.every(t=>types.has(t)));
   assert.equal(data.spriteUrl,'');
   assert.equal(data.spriteData,'');
  }
  if(collection==='santara_mega_forms'){
   assert.ok(data.baseSpeciesKey.length>0);
   assert.equal(data.source,'custom');
   assert.ok(data.ability.length<=48);
  }else if(collection==='santara_species_overrides'){
   assert.ok(data.abilities.length<=3);
  }else{
   assert.ok(data.description.length>0&&data.description.length<=1000);
   if(collection==='santara_custom_moves'){
    assert.ok(types.has(data.type));
    assert.ok(categories.has(data.category));
    assert.ok(data.power===null||(Number.isInteger(data.power)&&data.power>=0&&data.power<=300));
    assert.ok(data.accuracy===null||(Number.isInteger(data.accuracy)&&data.accuracy>=1&&data.accuracy<=100));
    assert.ok(data.dice.length<=120);
   }
  }
 }
});

test('Latest Charizard Z benchmark and all originally designed fossil stats are preserved',()=>{
 const statSum=x=>six.reduce((sum,key)=>sum+x.data.baseStats[key],0);
 const charizard=byName('Mega Charizard Z');
 assert.deepEqual(six.map(k=>charizard.data.baseStats[k]),[78,63,72,200,70,151]);
 assert.equal(statSum(charizard),634);
 for(const [name,expected] of Object.entries({Spinotroleum:600,Mosasord:550,Obsidaalik:545,Carnotremor:535})){
  assert.equal(statSum(byName(name)),expected,name);
 }
 assert.equal(statSum(byName('Mega Archaludon')),700);
 assert.match(byName('Siege Battery').data.description,/NEW PROPOSAL/);
});

test('Moves include original mechanics and drafts do not masquerade as finalized',()=>{
 assert.equal(byName('Tar Rend').data.power,85);
 assert.match(byName('Tar Rend').data.description,/Defense by 1 stage/);
 assert.match(byName('Faultline Gore').data.description,/25%/);
 assert.match(byName("Schrade's End").data.description,/Once per battle/);
 assert.match(byName("Kingdom's End").data.description,/5 rounds/);
 assert.match(byName('Root Access').data.description,/Prankster/);
 assert.match(byName('Nihil Light').data.description,/PROVISIONAL/);
 assert.match(byName('Glitch Pulse').data.description,/WORKING PROPOSAL/);
});

test('Preset records are copied before callers edit them',()=>{
 const originals=santaraCatalogEntries('fossils');
 originals[0].data.baseStats.attack=1;
 assert.equal(santaraCatalogEntries('fossils')[0].data.baseStats.attack,140);
});

test('GM UI links to an import path that checks Firestore documents before writing',()=>{
 const party=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.match(party,/santara-import/);
 assert.match(party,/getDoc\(doc\(store,item\.collection,item\.id\)\)/);
 assert.match(party,/checked\.filter\(x=>!x\.exists\)/);
 assert.match(party,/writeBatch\(store\)/);
 assert.match(party,/!GM_SITE\|\|user\?\.uid!==GM_UID/);
});


test('Mega Greninja has Perfected Ninjutsu with maximum hits and per-hit Technician',()=>{
 const greninja=byName('Mega Greninja');
 assert.equal(greninja.data.ability,'Perfected Ninjutsu');
 assert.equal(six.reduce((sum,k)=>sum+greninja.data.baseStats[k],0),630);
 const ability=byName('Perfected Ninjutsu');
 assert.equal(ability.collection,'santara_custom_abilities');
 assert.match(ability.data.description,/maximum possible number of times/);
 assert.match(ability.data.description,/individual hit/);
 assert.match(ability.data.description,/50%/);
});


test('GM can selectively synchronize the Greninja revision without overwriting custom artwork',()=>{
 const code=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.match(code,/santara-greninja-revision/);
 assert.match(code,/async function syncGreninjaRevision\(\)/);
 assert.match(code,/batch\.update\(megaRef,\{ability:preset\.data\.ability/);
 assert.match(code,/megaForm\.ability/);
 assert.match(code,/getDoc\(doc\(store,'santara_pokemon_mega_assignments'/);
});
