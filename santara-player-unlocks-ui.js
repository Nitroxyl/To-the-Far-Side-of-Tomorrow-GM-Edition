import {GIMMICK_KEYS,GIMMICK_LABELS,UNLOCK_LIST_FIELDS,SPECIAL_WEATHER,readTrainerUnlocks,contentKey} from './santara-player-unlocks.js';

const labels={
 species:{title:'Custom species & story forms',desc:'Reveal species in the Trainer Pokédex and species requests. Assigned Pokémon remain accessible.'},
 megaForms:{title:'Mega form reveals',desc:'Reveal form names. You must still assign a compatible form and required Mega Stone before use.'},
 moves:{title:'Custom & signature moves',desc:'Show a technique in the calculator. Learning or equipping it still follows Move Memory rules.'},
 abilities:{title:'Custom abilities',desc:'Show ability names in the calculator. This does not change any Pokémon ability automatically.'},
 weather:{title:'Special weather',desc:'Reveal the special weather conditions in that Trainer’s damage calculator.'}
};
const raw=x=>String(x??'');
function distinct(list){
 const map=new Map();
 for(const it of list||[]){
  const id=raw(typeof it==='string'?it:it.slug||it.name);
  if(id&&!map.has(contentKey(id)))map.set(contentKey(id),typeof it==='string'?{slug:it,name:it}:it);
 }
 return [...map.values()].sort((a,b)=>raw(a.name).localeCompare(raw(b.name)));
}
export function makeUnlockOptions({species=[],megaForms=[],moves=[],abilities=[],
  presets=[],saved={}}={}){
 const by={species:[...species],megaForms:[...megaForms],moves:[...moves],abilities:[...abilities],
  weather:SPECIAL_WEATHER.map(name=>({slug:name,name}))};
 const collections={
  santara_species_overrides:'species',
  santara_mega_forms:'megaForms',
  santara_custom_moves:'moves',
  santara_custom_abilities:'abilities'
 };
 for(const entry of presets||[]){
  const category=collections[entry.collection];
  if(category)by[category].push({slug:entry.id,...entry.data});
 }
 const old=readTrainerUnlocks(saved);
 for(const [category,field] of Object.entries(UNLOCK_LIST_FIELDS)){
  const found=new Set(by[category].map(entry=>contentKey(entry.slug||entry.name)));
  for(const value of old[field]){
   if(!found.has(contentKey(value)))by[category].push({
    slug:value,name:value+' (definition not currently published)',retained:true
   });
  }
  by[category]=distinct(by[category]);
 }
 return by;
}
function groupUI(category,entries,unlock,esc){
 const meta=labels[category],field=UNLOCK_LIST_FIELDS[category];
 const selected=new Set(unlock[field].map(contentKey));
 const checked=entries.filter(e=>selected.has(contentKey(e.slug||e.name))).length;
 const rows=entries.map(entry=>{
  const code=entry.slug||entry.name;
  const enabled=selected.has(contentKey(code));
  return '<label class="unlock-row"><input type="checkbox" name="'+field+'" value="'+esc(code)+'"'+(enabled?' checked':'')+'>'+
    '<span><b>'+esc(entry.name)+'</b>'+
    (entry.retained?'<small>Stored unlock: definition unavailable</small>':'')+
    '</span></label>';
 }).join('');
 return '<details class="unlock-group"'+(checked?' open':'')+'><summary><span>'+esc(meta.title)+'</span><span class="chip">'+checked+' / '+entries.length+'</span></summary>'+
  '<p class="hint">'+esc(meta.desc)+'</p><div class="unlock-options">'+(rows||'<p class="hint">No registered content to unlock yet.</p>')+'</div></details>';
}
export function playerUnlockDashboard({uid,trainerName,trainers,unlocks,options,esc,option}){
 const doc=readTrainerUnlocks(unlocks);
 const list=options||makeUnlockOptions({});
 const chosenName=trainerName||'Trainer';
 const trainerOptions=(trainers||[]).map(t=>option(t.uid,t.label||t.uid,uid)).join('');
 const groupCount=Object.values(UNLOCK_LIST_FIELDS).reduce((sum,field)=>sum+doc[field].length,0);
 return '<section class="panel"><div class="toolbar"><div><span class="eyebrow">GM · TRAINER PROGRESSION</span>'+
   '<h2>Player Unlocks</h2><p class="hint">Control what each player can use or discover independently. Changes are saved only when you press Save.</p></div>'+
   '<div class="tabs"><button class="btn" data-act="party" type="button">← Back to Party</button></div></div>'+
   '<label class="field unlock-trainer-picker">Select Trainer<select id="unlock-trainer-filter">'+
   option('','Choose a trainer…',uid)+trainerOptions+'</select></label></section>'+
   (!uid?'<section class="panel"><p>Choose a Trainer to manage their unlocks.</p></section>':
   '<form id="trainer-unlocks-form">'+
   '<section class="panel"><div class="toolbar"><h3>'+esc(chosenName)+'</h3><span class="chip">'+
   GIMMICK_KEYS.filter(k=>doc[k]).length+' gimmicks · '+groupCount+' content reveals</span></div>'+
   '<h3>Battle gimmicks</h3><p class="hint">These are enforced by the existing Trainer battle permissions.</p>'+
   '<div class="gimmick-grid">'+GIMMICK_KEYS.map(key=>
      '<label class="gimmick-tile"><input type="checkbox" name="'+key+'"'+(doc[key]?' checked':'')+'>'+
      '<span><b>'+esc(GIMMICK_LABELS[key])+'</b><small>'+
      esc(({tera:'Available before Gym 1',zMove:'Available before Gym 2',mega:'Available around Gyms 4–5',dynamax:'Available at Gym 6'})[key])+
      '</small></span></label>'
    ).join('')+'</div></section>'+
   '<section class="panel"><h3>Content & reveal permissions</h3>'+
   '<p class="hint">These govern the Player interface and calculator. A revealed Pokémon or move is not automatically assigned or taught.</p>'+
   Object.keys(UNLOCK_LIST_FIELDS).map(k=>groupUI(k,list[k]||[],doc,esc)).join('')+
   '<div class="unlock-savebar"><span class="hint">Changes affect only '+esc(chosenName)+'. Saved Pokémon and Move Memory are not edited.</span>'+
   '<button class="btn primary" type="submit">Save '+esc(chosenName)+'’s unlocks</button></div>'+
   '</section></form>');
}
