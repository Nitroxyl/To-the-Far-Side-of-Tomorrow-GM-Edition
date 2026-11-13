import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {createContext,runInContext} from 'node:vm';
import {santaraCatalogEntries} from '../santara-catalog.js';
const require=createRequire(import.meta.url),calc=require('@smogon/calc');
const all=['fossils','megas','story','drafts'].flatMap(g=>santaraCatalogEntries(g));
const by=(collection)=>all.filter(e=>e.collection===collection).map(e=>e.data);
test('GM catalogue includes finalized custom fossil species and GM-only story species',()=>{
 const names=by('santara_species_overrides').map(x=>x.name);
 for(const n of ['Spinotroleum','Mosasord','Obsidaalik','Carnotremor',
  'Rotom-Server','Yveltal Eclipse Forme'])assert.ok(names.includes(n),n);
});
test('Mega Charizard X and Mega Skarmory revised spreads are available',()=>{
 const mega=by('santara_mega_forms');
 assert.ok(mega.length>=22,'All established Megas should be present');
 const skarmory=mega.find(x=>x.name==='Mega Skarmory');
 const charizard=mega.find(x=>x.name==='Mega Charizard X');
 assert.deepEqual(skarmory.baseStats,{
   hp:65,attack:150,defense:130,specialAttack:20,specialDefense:95,speed:105
 });
 assert.equal(skarmory.ability,'Sharpness');
 assert.equal(charizard.baseStats.attack,160);
 assert.equal(charizard.ability,'Tough Claws');
});
test('signature moves preserve scope and critical classifications',()=>{
 const moves=by('santara_custom_moves');
 const razor=moves.find(x=>x.name==='Razor Tempest');
 assert.equal(razor.power,75);
 assert.equal(razor.accuracy,100);
 assert.ok(razor.traits.includes('slicing'));
 assert.equal(razor.requiredMegaSlug,'skarmory-mega');
 const machbreak=moves.find(x=>x.name==='Machbreak');
 assert.equal(machbreak.type,'dragon');
 assert.equal(machbreak.requiredMegaSlug,'garchomp-mega-z');
});
test('GM calculator can preview catalog Megas without assigning them',()=>{
 const source=readFileSync(new URL('../santara-damage-calculator.js',import.meta.url),'utf8')
   .replace(/^import[^\n]*\n/gm,'');
 const dom=new JSDOM('<!doctype html><html><body><span id="user-chip"></span><p id="calc-feedback"></p><div id="calc-app"></div></body></html>',
  {url:'https://example.org/damage-calculator.html'});
 dom.window.SANTARA_POKEMON_EDITION='gm';dom.window.calc=calc;
 const ctx=createContext({window:dom.window,document:dom.window.document,location:dom.window.location,
  URLSearchParams,console,Map,Set,encodeURIComponent,setTimeout,clearTimeout});
 runInContext(source,ctx,{timeout:5000});
 const megas=by('santara_mega_forms');
 const code='makeChoices(window.calc.Generations.get(9),[],[],JSON.parse('+JSON.stringify(JSON.stringify(megas))+'))';
 const choices=runInContext(code,ctx,{timeout:10000});
 const names=choices.filter(c=>c.kind==='mega').map(c=>c.source.megaForm.name);
 assert.ok(names.includes('Mega Skarmory'));
 assert.ok(names.includes('Mega Charizard Z'));
 const z=choices.find(c=>c.source.megaForm?.name==='Mega Charizard Z');
 assert.equal(z.source.megaActive,true);
 assert.equal(z.source.megaForm.baseStats.specialAttack,200);
});
