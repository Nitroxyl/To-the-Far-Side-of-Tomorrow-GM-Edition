import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const stripExports=code=>code.replace(/\bexport\s+(?=(async\s+)?(const|function)\b)/g,'');
const {santaraCatalogEntries}=new Function(stripExports(read('santara-catalog.js'))+
 '\nreturn {santaraCatalogEntries};')();
const {applySantaraLearnset,customMoveEligible,customMoveScope}=new Function(
 stripExports(read('pokemon-forms-learnsets.js'))+
 '\nreturn {applySantaraLearnset,customMoveEligible,customMoveScope};')();

const megas=santaraCatalogEntries('megas');
const form=id=>megas.find(x=>x.collection==='santara_mega_forms'&&x.id===id);
const sum=s=>Object.values(s).reduce((a,b)=>a+b,0);

test('both Lucario Megas use approved stats and official form identifiers',()=>{
 const original=form('lucario-mega'),z=form('lucario-mega-z');
 assert.ok(original&&z);
 assert.deepEqual(original.data.baseStats,{
  hp:70,attack:155,defense:88,specialAttack:120,specialDefense:70,speed:122
 });
 assert.deepEqual(z.data.baseStats,{
  hp:70,attack:100,defense:70,specialAttack:164,specialDefense:70,speed:151
 });
 assert.equal(sum(original.data.baseStats),625);
 assert.equal(sum(z.data.baseStats),625);
 assert.deepEqual(original.data.types,['fighting','steel']);
 assert.deepEqual(z.data.types,['fighting','steel']);
 assert.equal(original.data.ability,'Adaptability');
 assert.equal(z.data.ability,'Aura Guard');
 assert.equal(original.data.slug,'lucario-mega');
 assert.equal(z.data.slug,'lucario-mega-z');
});

test('Aura Lance has correct mechanics and Firestore-valid metadata',()=>{
 const lance=megas.find(x=>x.collection==='santara_custom_moves'&&x.id==='aura-lance');
 assert.ok(lance);
 assert.equal(lance.data.type,'fighting');
 assert.equal(lance.data.category,'Special');
 assert.equal(lance.data.power,95);
 assert.equal(lance.data.accuracy,100);
 assert.equal(lance.data.contact,false);
 assert.equal(lance.data.target,'normal');
 assert.deepEqual(lance.data.traits,['pulse']);
 assert.deepEqual(lance.data.allowedSpeciesKeys,['lucario']);
 assert.equal(lance.data.requiredMegaSlug,'lucario-mega-z');
 assert.match(lance.data.description,/10 PP/);
 assert.ok(!('priority' in lance.data)&&!('pp' in lance.data));
});

test('Aura Lance is only selectable for the assigned Mega Lucario Z',()=>{
 const lance={name:'Aura Lance'};
 const lucario={speciesKey:'lucario',knownMoves:['aura-sphere']};
 assert.equal(customMoveScope(lance).requiredMegaSlug,'lucario-mega-z');
 assert.equal(customMoveEligible(lance,lucario,''),false);
 assert.equal(customMoveEligible(lance,lucario,'lucario-mega'),false);
 assert.equal(customMoveEligible(lance,lucario,'lucario-mega-z'),true);
 assert.equal(customMoveEligible(lance,lucario,'mega-lucario-z'),true);
 assert.equal(customMoveEligible(lance,{speciesKey:'riolu'},'lucario-mega-z'),false);
 assert.equal(customMoveEligible(lance,{speciesKey:'greninja'},'lucario-mega-z'),false);
});

test('Lucario receives two locked tutor-compatible moves, not free level-up or TM moves',()=>{
 const original={
  speciesKey:'lucario',knownMoves:['aura-sphere'],
  moveMethods:{'aura-sphere':['level-up']},
  levelUpLevels:{'aura-sphere':1},tmMoves:['aura-sphere']
 };
 const updated=applySantaraLearnset(original);
 assert.ok(updated.knownMoves.includes('mach-punch'));
 assert.ok(updated.knownMoves.includes('wide-guard'));
 assert.deepEqual(updated.moveMethods['mach-punch'],['tutor']);
 assert.deepEqual(updated.moveMethods['wide-guard'],['tutor']);
 assert.equal(updated.levelUpLevels['mach-punch'],undefined);
 assert.equal(updated.levelUpLevels['wide-guard'],undefined);
 assert.ok(!updated.tmMoves.includes('mach-punch'));
 assert.ok(!updated.tmMoves.includes('wide-guard'));
 assert.deepEqual(original.knownMoves,['aura-sphere']);
 assert.equal(applySantaraLearnset({speciesKey:'riolu',knownMoves:[]}).knownMoves.length,0);
});

test('GM app can publish revisions and synchronize assigned Mega snapshots',()=>{
 const app=read('pokemon-party.js');
 assert.match(app,/santara-lucario-revision/);
 assert.match(app,/syncLucarioRevision\(\)/);
 assert.match(app,/applySantaraLearnset\(found\)/);
 assert.match(app,/'megaForm\.baseStats':preset\.data\.baseStats/);
 assert.match(app,/'megaForm\.ability':preset\.data\.ability/);
});
