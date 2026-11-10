import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
const start=app.indexOf('async function saveMegaForm(form){');
const end=app.indexOf('async function importMega(form){',start);
assert.ok(start>=0&&end>start);
const source=app.slice(start,end);

function harness(existing=null){
 const calls=[];
 const statKeys=['hp','attack','defense','specialAttack','specialDefense','speed'];
 const values={name:existing?.name||'Mega Baxcalibur',baseSpeciesKey:'baxcalibur',
  type1:'dragon',type2:'ice',ability:'Sword of Ruin',
  spriteUrl:'https://example.org/new-artwork.png',upload:{size:0},
  stat_hp:115,stat_attack:205,stat_defense:150,stat_specialAttack:75,
  stat_specialDefense:125,stat_speed:30};
 const mocks={
  GM_SITE:true,editingMega:existing,megaImported:false,originLibrary:false,
  FormData:class{constructor(form){this.values=form;} get(key){return this.values[key]}},
  cap:(value,length)=>String(value??'').slice(0,length),
  formSlug:name=>String(name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70),
  statKeys,validStats:s=>statKeys.every(key=>Number.isInteger(s[key])&&s[key]>=1&&s[key]<=255),
  TYPES:['dragon','ice'],safeUrl:url=>String(url).startsWith('https://')?url:'',
  imgToWebp:async()=> 'data:image/webp;base64,AAA=',
  setDoc:async(ref,data)=>{calls.push({ref,data})},
  doc:(_store,collection,id)=>({collection,id}),store:{},
  serverTimestamp:()=> '__timestamp__',say:()=>{},render:()=>{},clearSelection:()=>{}
 };
 const save=new Function(...Object.keys(mocks),source+'\nreturn saveMegaForm;')(...Object.values(mocks));
 return {save,values,calls};
}

test('editing official Mega saves image at its original ID',async()=>{
 const h=harness({slug:'baxcalibur-mega',name:'Mega Baxcalibur',spriteData:'old',source:'official'});
 h.values.upload={size:2500};
 await h.save(h.values);
 assert.equal(h.calls[0].ref.id,'baxcalibur-mega');
 assert.equal(h.calls[0].data.slug,'baxcalibur-mega');
 assert.equal(h.calls[0].data.spriteData,'data:image/webp;base64,AAA=');
 assert.equal(h.calls[0].data.baseStats.attack,205);
});

test('legacy Santara IDs remain valid for edits',async()=>{
 const h=harness({slug:'mega-baxcalibur',name:'Mega Baxcalibur',spriteData:'',source:'custom'});
 await h.save(h.values);
 assert.equal(h.calls[0].ref.id,'mega-baxcalibur');
});

test('new Megas still get normal name-derived slugs',async()=>{
 const h=harness();
 await h.save(h.values);
 assert.equal(h.calls[0].ref.id,'mega-baxcalibur');
});

test('actual renaming still requires a new form',async()=>{
 const h=harness({slug:'baxcalibur-mega',name:'Mega Baxcalibur',spriteData:'',source:'custom'});
 h.values.name='Mega Baxcalibur Z';
 await assert.rejects(h.save(h.values),/To rename this form/);
 assert.equal(h.calls.length,0);
});
