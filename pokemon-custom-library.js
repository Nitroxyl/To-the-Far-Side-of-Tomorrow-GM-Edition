const KINDS=[
 ['all','All content'],['species','Species & forms'],['mega','Mega Evolutions'],['move','Moves'],['ability','Abilities']
];
export function customContentLibraryUI({species=[],megas=[],moves=[],abilities=[],category='all',search='',esc}) {
 const lists=[
  ...species.map(x=>({kind:'species',id:x.slug,title:x.name,subtitle:(x.types||[]).join(' / '),extra:'BST '+Object.values(x.baseStats||{}).reduce((a,b)=>a+Number(b||0),0),art:x.spriteData||x.spriteUrl||''})),
  ...megas.map(x=>({kind:'mega',id:x.slug,title:x.name,subtitle:'Mega of '+x.baseSpeciesKey,extra:(x.types||[]).join(' / ')+' · '+String(x.ability||''),art:x.spriteData||x.spriteUrl||''})),
  ...moves.map(x=>({kind:'move',id:x.slug,title:x.name,subtitle:(x.type||'').toUpperCase()+' / '+(x.category||''),extra:'BP '+(x.power??'—')+' · '+(x.description||''),art:''})),
  ...abilities.map(x=>({kind:'ability',id:x.slug,title:x.name,subtitle:'Custom ability',extra:x.description||'',art:''}))
 ];
 const found=lists.filter(x=>(category==='all'||x.kind===category)&&
  (x.title+' '+x.subtitle+' '+x.extra).toLowerCase().includes(search.toLowerCase()));
 const btn=(kind,txt)=>'<button class="btn small" data-act="library-new" data-kind="'+kind+'">+ '+txt+'</button>';
 return '<section class="panel"><div class="toolbar"><div><h2>Custom Content Library</h2><p>Browse, create, edit or delete reusable Santara content. Existing assigned Pokémon are not deleted when a definition is removed.</p></div><button class="btn" data-act="back">← Party</button></div>'+
  '<div class="actions">'+btn('species','Species')+btn('mega','Mega')+btn('move','Move')+btn('ability','Ability')+
  '<button class="btn small" data-act="santara-catalog">Import Santara presets</button></div>'+
  '<div class="library-toolbar"><label class="field">Content type<select id="library-kind">'+KINDS.map(x=>'<option value="'+x[0]+'" '+(x[0]===category?'selected':'')+'>'+x[1]+'</option>').join('')+'</select></label>'+
  '<label class="field">Search<input id="library-search" type="search" placeholder="Search names and effects" value="'+esc(search)+'"></label></div>'+
  '<p class="hint">'+species.length+' species · '+megas.length+' Megas · '+moves.length+' moves · '+abilities.length+' abilities</p>'+
  '<div class="custom-library-grid">'+(found.length?found.map(x=>'<article class="custom-library-entry" data-library-search="'+esc((x.title+' '+x.subtitle+' '+x.extra).toLowerCase())+'">'+
    (x.art&&(/^https:\/\//.test(x.art)||/^data:image\/webp;base64,/.test(x.art))?'<img src="'+esc(x.art)+'" alt="" loading="lazy">':'<span class="library-symbol">◇</span>')+
    '<div class="library-description"><b>'+esc(x.title)+'</b><span class="hint">'+esc(x.subtitle)+'</span><p>'+esc(x.extra)+'</p></div>'+
    '<div class="library-actions"><button class="btn small" data-act="library-edit" data-kind="'+x.kind+'" data-id="'+esc(x.id)+'">Edit</button>'+
    '<button class="btn small danger" data-act="library-delete" data-kind="'+x.kind+'" data-id="'+esc(x.id)+'">Delete</button></div></article>').join(''):
    '<div class="empty">No matching custom content. Add an entry above or change the filter.</div>')+'</div></section>';
}
