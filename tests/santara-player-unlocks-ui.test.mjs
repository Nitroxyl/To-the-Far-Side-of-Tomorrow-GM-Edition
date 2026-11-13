import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {makeUnlockOptions,playerUnlockDashboard} from '../santara-player-unlocks-ui.js';
import {progressionPayload} from '../santara-player-unlocks.js';

const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const option=(value,label,selected)=>'<option value="'+escape(value)+'"'+(value===selected?' selected':'')+'>'+escape(label)+'</option>';
test('GM unlocks tab contains a Trainer selector and all four gimmicks',()=>{
 const html=playerUnlockDashboard({
  uid:'trainer_a',trainerName:'Test Trainer',trainers:[{uid:'trainer_a',label:'Test Trainer'},{uid:'trainer_b',label:'Second Trainer'}],
  unlocks:{tera:true,mega:false,zMove:true,dynamax:false},
  options:makeUnlockOptions({species:[{slug:'fossil',name:'Fossil'}],weather:[]}),
  esc:escape,option
 });
 assert.match(html,/id="unlock-trainer-filter"/);
 assert.match(html,/id="trainer-unlocks-form"/);
 for(const k of ['tera','mega','zMove','dynamax'])assert.ok(html.includes('name="'+k+'"'),k);
 for(const field of ['speciesUnlocks','megaFormUnlocks','moveUnlocks','abilityUnlocks','weatherUnlocks'])
  assert.ok(html.includes('name="'+field+'"')||html.includes('No registered content'),field);
 assert.match(html,/Save Test Trainer/);
});
test('GM preset definitions are included even before import',()=>{
 const presets=[
  {collection:'santara_species_overrides',id:'yveltal-eclipse-forme',data:{name:'Yveltal Eclipse Forme'}},
  {collection:'santara_custom_moves',id:'calamity-slash',data:{name:'Calamity Slash'}},
  {collection:'santara_mega_forms',id:'mega-absol-z',data:{name:'Mega Absol Z'}},
  {collection:'santara_custom_abilities',id:'kingdoms-end',data:{name:"Kingdom's End"}}
 ];
 const options=makeUnlockOptions({presets,saved:{speciesUnlocks:['retired-form']}});
 assert.ok(options.species.some(x=>x.slug==='yveltal-eclipse-forme'));
 assert.ok(options.species.some(x=>x.slug==='retired-form'&&x.retained));
 assert.ok(options.moves.some(x=>x.slug==='calamity-slash'));
 assert.ok(options.megaForms.some(x=>x.slug==='mega-absol-z'));
 assert.ok(options.abilities.some(x=>x.slug==='kingdoms-end'));
});
test('GM party implements dedicated route and trainer-specific Firestore document',()=>{
 const source=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.ok(source.includes("if(view==='unlocks'&&GM_SITE)"));
 assert.ok(source.includes('data-act="unlocks"'));
 assert.ok(source.includes("doc(store,'santara_trainer_gimmicks',ownerFilter)"));
 assert.ok(source.includes("progressionPayload(new FormData(form),gmProgressionOptions())"));
});
test('Firestore rules restrict trainer writes to GM and validate expanded array lists',()=>{
 const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
 assert.ok(rules.includes("match /santara_trainer_gimmicks/{uid}"));
 assert.ok(rules.includes("allow create, update: if gm() && gimmicksValid(request.resource.data)"));
 for(const field of ['speciesUnlocks','megaFormUnlocks','moveUnlocks','abilityUnlocks','weatherUnlocks'])
  assert.ok(rules.includes(field),field);
});
