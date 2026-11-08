import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
const checkerSource=readFileSync(new URL('../pokemon-assignment-check.js',import.meta.url),'utf8');
const {assignmentProblems}=await import('data:text/javascript;charset=utf-8,'+encodeURIComponent(checkerSource));
const charizard={
 ownerUid:'ctBLgrVgkLOzUJYTyYgU9IwejYx1',speciesKey:'charizard',speciesName:'Charizard',
 source:'official',baseStats:{hp:78,attack:84,defense:78,specialAttack:109,specialDefense:85,speed:100},
 types:['fire','flying'],abilities:['blaze','solar-power'],spriteUrl:'',spriteData:'',
 nickname:'Zard',level:50,ability:'blaze',maxHp:195,currentHp:195,status:'None',slot:1,heldItem:'',
 moves:['Flamethrower','Protect'],origin:'Luma Town',notes:'',updatedAt:{sentinel:true},
 teraType:'fire',megaForm:{
  slug:'mega-charizard-z',name:'Mega Charizard Z',baseSpeciesKey:'charizard',
  baseStats:{hp:78,attack:104,defense:72,specialAttack:200,specialDefense:70,speed:151},
  types:['fire','dragon'],ability:"Kingdom's End",spriteUrl:'',spriteData:'',source:'custom'
 },megaActive:false,teraActive:false,zUsed:false,dynamaxTurns:0,dynamaxUsed:false
};
const clone=x=>JSON.parse(JSON.stringify(x));
test('valid Mega Charizard Z assignment matches rule-compatible field shape',()=>{
 assert.deepEqual(assignmentProblems(charizard),[]);
 assert.equal(charizard.megaForm.baseStats.specialAttack,200);
});
test('legacy Pokémon with no gimmick fields remain valid',()=>{
 const x=clone(charizard);
 for(const k of ['teraType','megaForm','megaActive','teraActive','zUsed','dynamaxTurns','dynamaxUsed'])delete x[k];
 assert.deepEqual(assignmentProblems(x),[]);
});
test('invalid Mega artwork and excessive ability length are reported before Firestore',()=>{
 const x=clone(charizard);
 x.megaForm.spriteData='data:image/png;base64,AAAA';
 x.megaForm.ability='A'.repeat(49);
 const errors=assignmentProblems(x).join(' | ');
 assert.match(errors,/WebP/);
 assert.match(errors,/Mega ability/);
});
test('occupied slot swaps are GM-only and narrowly scoped',()=>{
 const idx=rules.indexOf('function gmLegacySlotUpdate()');
 const end=rules.indexOf('match /santara_pokemon/{pokemonId}',idx);
 assert.ok(idx>=0 && end>idx);
 const block=rules.slice(idx,end);
 for(const fragment of ['return gm()',"'slot','updatedAt'",'request.resource.data.ownerUid == resource.data.ownerUid',
  'request.resource.data.slot <= 6','request.resource.data.updatedAt == request.time']){
  assert.ok(block.includes(fragment),fragment);
 }
 const match=rules.slice(end,end+1000);
 assert.ok(match.includes('|| gmLegacySlotUpdate()'));
 assert.ok(match.includes('allow create: if gm() && pokemonValid(request.resource.data)'));
 assert.equal((rules.match(/allow read, write: if false;/g)||[]).length,1);
});
test('assignment page checks fields and reports authentication+batch context',()=>{
 const app=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.ok(app.includes('assignmentProblems(item)'));
 assert.ok(app.includes('getIdTokenResult(user,true)'));
 assert.ok(app.includes('explainAssignmentDenial(occupying,existing,item)'));
});

test('GM-only Mega attachment is a narrow update that preserves legacy records',()=>{
 const start=rules.indexOf('function gmLegacyMegaUpdate()');
 const end=rules.indexOf('match /santara_pokemon/{pokemonId}',start);
 assert.ok(start>=0&&end>start);
 const block=rules.slice(start,end);
 for(const fragment of [
  'return gm()',"'megaForm','megaActive','updatedAt'",
  'request.resource.data.ownerUid == resource.data.ownerUid',
  'megaSnapshotValid(request.resource.data.megaForm)',
  'request.resource.data.get(\'megaActive\',false) == false'
 ]) assert.ok(block.includes(fragment),fragment);
 assert.ok(rules.slice(end,end+1800).includes('|| gmLegacyMegaUpdate()'));
 const app=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.ok(app.includes('data-act="mega-only"'));
 assert.ok(app.includes('async function saveMegaOnly()'));
 assert.ok(app.includes("await updateDoc(doc(store,'santara_pokemon',mon.id),payload)"));
});

test('GM writes the base Pokémon separately from its Mega snapshot',()=>{
 const app=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.match(app,/teraType,megaActive:false,/);
 assert.doesNotMatch(app,/teraType,megaForm,megaActive:/);
 assert.match(app,/await setDoc\(doc\(store,'santara_pokemon_mega_assignments',monRef.id\),megaLink\)/);
 assert.match(app,/const base=await getDoc\(doc\(store,'santara_pokemon',mon.id\)\)/);
 assert.match(app,/base.data\(\).speciesKey!==megaForm.baseSpeciesKey/);
});
test('Null inline Mega does not change valid regular Pokémon assignment shape',()=>{
 const normal=clone(charizard);
 normal.megaForm=null;
 normal.megaActive=false;
 assert.deepEqual(assignmentProblems(normal),[]);
});
