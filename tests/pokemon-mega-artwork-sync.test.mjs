import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
const start=source.indexOf('async function updateArtworkRecord(next,syncExisting){');
const end=source.indexOf('async function saveArtwork(form){',start);
assert.ok(start>=0&&end>start);
const handler=source.slice(start,end);
const artworkSource=readFileSync(new URL('../pokemon-artwork.js',import.meta.url),'utf8');
const {artworkPropagation}=new Function(artworkSource.replace(/\bexport\s+(?=(?:async\s+)?(?:const|function)\b)/g,'')+
 '\nreturn {artworkPropagation};')();
const next={spriteUrl:'',spriteData:'data:image/webp;base64,AAA='};

function setup(kind){
 const base={slug:'baxcalibur-mega',name:'Mega Baxcalibur',baseSpeciesKey:'baxcalibur',
  spriteUrl:'',spriteData:'',ability:'Sword of Ruin',
  baseStats:{hp:115,attack:205,defense:150,specialAttack:75,specialDefense:125,speed:30}};
 const first={id:'a',source:'official',speciesKey:'baxcalibur',spriteUrl:'base-art',spriteData:'',
  megaForm:{...base}};
 const personalized={id:'b',source:'official',speciesKey:'baxcalibur',spriteUrl:'base-art',spriteData:'',
  megaForm:{...base,spriteUrl:'https://example.org/personal.png'}};
 const writes=[],batches=[];
 const mocks={
  GM_SITE:true,GM_UID:'gm',user:{uid:'gm'},allowed:true,
  artworkSelected:{kind,id:kind==='mega'?'baxcalibur-mega':'spinotroleum'},
  doc:(_db,path,id)=>({path,id}),store:{},
  getDoc:async()=>({exists:()=>true,data:()=>base}),
  updateDoc:async(ref,patch)=>writes.push({ref,patch}),
  writeBatch:()=>({update(ref,patch){batches.push({ref,patch})},async commit(){}}),
  serverTimestamp:()=> '__timestamp__',
  artworkPropagation,pokemon:[first,personalized],
  say:()=>{},render:()=>{},view:'artwork-edit'
 };
 const run=new Function(...Object.keys(mocks),handler+'\nreturn updateArtworkRecord;')(...Object.values(mocks));
 return {run,writes,batches};
}

test('Mega image sync targets owner-scoped Mega links and preserves battle stats',async()=>{
 const h=setup('mega');
 await h.run(next,true);
 assert.equal(h.writes.length,1);
 assert.equal(h.writes[0].ref.path,'santara_mega_forms');
 assert.equal(h.batches.length,1);
 assert.equal(h.batches[0].ref.path,'santara_pokemon_mega_assignments');
 assert.equal(h.batches[0].ref.id,'a');
 assert.deepEqual(Object.keys(h.batches[0].patch).sort(),
  ['megaForm.spriteData','megaForm.spriteUrl','updatedAt']);
 assert.equal(h.batches[0].patch['megaForm.spriteData'],next.spriteData);
 assert.ok(!('megaForm.baseStats' in h.batches[0].patch));
});

test('Mega image template save without sync does not update assignments',async()=>{
 const h=setup('mega');
 await h.run(next,false);
 assert.equal(h.writes.length,1);
 assert.equal(h.batches.length,0);
});
