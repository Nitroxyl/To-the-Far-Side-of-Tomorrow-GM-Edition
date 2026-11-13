import {hpMigrationPlan} from './pokemon-v6-hp-migration.js';

export function hpMigrationUI(records=[],includeOverrides=false,esc=x=>String(x)){
 const p=hpMigrationPlan(records,includeOverrides),n=p.counts;
 const choices=n.overrides>0?
  '<label class="hp-migrate-check"><input type="checkbox" id="hp-migrate-include-overrides"'+(includeOverrides?' checked':'')+'>'+
  '<span><b>Include '+n.overrides+' manually adjusted / boss HP record(s)</b><small>This replaces special boss HP with standard V6 HP. Leave unchecked unless that is intended.</small></span></label>':'';
 const body=p.rows.map(row=>{
  const status={
   legacy:'Old V5.3 HP',override:'Custom / unrecognized HP',
   'already-v6':'Already V6',invalid:'Cannot migrate'
  }[row.category]||row.category;
  const selected=p.eligible.some(r=>r.id===row.id);
  const newValues=row.category==='invalid'?'—':row.newCurrent+' / '+row.newMax;
  return '<tr><td>'+esc(row.name)+'</td><td>Lv '+esc(row.level||'—')+'</td>'+
   '<td>'+esc(status)+(selected?' · selected':'')+'</td>'+
   '<td>'+esc(row.category==='invalid'?'—':row.oldCurrent+' / '+row.oldMax)+'</td>'+
   '<td>'+esc(newValues)+'</td></tr>';
 }).join('');
 return '<section class="panel"><div class="toolbar"><div><span class="eyebrow">V6 RELEASE PREPARATION</span>'+
  '<h2>Pokémon HP Migration</h2><p class="hint">Move saved HP to the standard Pokémon formula (31 IVs, 0 HP EVs). Current missing HP is preserved, and fainted Pokémon remain at 0.</p></div>'+
  '<button type="button" class="btn" data-act="party">← Back to Party</button></div>'+
  '<div class="hp-migrate-stats"><b>'+n.total+' Pokémon</b><span>'+n.legacy+' old V5.3</span><span>'+n.overrides+' custom/unclear</span><span>'+n.already+' already V6</span><span>'+n.invalid+' invalid</span></div>'+
  choices+
  '<div class="hp-migrate-actions"><button type="button" class="btn" data-act="hp-backup">Download HP backup</button>'+
  '<button type="button" class="btn primary" data-act="hp-migrate-run"'+(p.eligible.length?'':' disabled')+'>'+
  'Migrate '+p.eligible.length+' Pokémon to V6</button></div>'+
  '<p class="hint">An HP backup downloads before changes begin. Each update checks that the Pokémon has not changed since the preview, preventing lost combat updates.</p>'+
  '<div class="hp-migrate-table-wrap"><table class="hp-migrate-table"><thead><tr>'+
  '<th>Pokémon</th><th>Level</th><th>Status</th><th>Saved HP</th><th>V6 HP</th></tr></thead>'+
  '<tbody>'+body+'</tbody></table></div></section>';
}
