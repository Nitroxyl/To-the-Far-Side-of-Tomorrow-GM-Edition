import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {maxHpV53,maxHpV6} from '../pokemon-math.js';
import {hpMigrationPlan,hpMigrationRow,verifyMigrationSnapshot} from '../pokemon-v6-hp-migration.js';
import {hpMigrationUI} from '../pokemon-v6-hp-migration-ui.js';

const stats={hp:70,attack:110,defense:70,specialAttack:115,specialDefense:70,speed:90};
const mon=(maxHp,currentHp,extra={})=>({id:'lucario-123',ownerUid:'trainerA',speciesName:'Lucario',
  level:50,baseStats:stats,maxHp,currentHp,...extra});
test('legacy HP migrates to V6 perfect IVs preserving missing HP',()=>{
 const legacy=maxHpV53(stats,50),v6=maxHpV6(stats,50);
 assert.notEqual(legacy,v6);
 const row=hpMigrationRow(mon(legacy,legacy-17));
 assert.equal(row.category,'legacy');
 assert.equal(row.newMax,v6);
 assert.equal(row.newCurrent,v6-17);
 assert.equal(row.missingHp,17);
});
test('fainted Pokémon remain fainted rather than being healed',()=>{
 const legacy=maxHpV53(stats,50),row=hpMigrationRow(mon(legacy,0));
 assert.equal(row.newCurrent,0);
});
test('manually changed boss HP is flagged and skipped by default',()=>{
 const boss=mon(380,250,{id:'boss',nickname:'Alpha Lucario'});
 const defaults=hpMigrationPlan([boss],false);
 assert.equal(defaults.counts.overrides,1);
 assert.equal(defaults.eligible.length,0);
 const forced=hpMigrationPlan([boss],true);
 assert.equal(forced.eligible.length,1);
 assert.equal(forced.eligible[0].newCurrent,Math.max(0,maxHpV6(stats,50)-(380-250)));
});
test('V6 records are never updated again',()=>{
 const healthy=mon(maxHpV6(stats,50),105);
 const plan=hpMigrationPlan([healthy],true);
 assert.equal(plan.counts.already,1);
 assert.equal(plan.eligible.length,0);
});
test('bad Pokémon data is not writable',()=>{
 const bad=mon(-1,500);
 const row=hpMigrationRow(bad);
 assert.equal(row.category,'invalid');
 assert.equal(hpMigrationPlan([bad],true).eligible.length,0);
});
test('migration detects stale damage and level changes before writing',()=>{
 const before=mon(maxHpV53(stats,50),60);
 const planned=hpMigrationRow(before);
 assert.equal(verifyMigrationSnapshot(before,planned),true);
 assert.equal(verifyMigrationSnapshot({...before,currentHp:59},planned),false);
 assert.equal(verifyMigrationSnapshot({...before,level:51},planned),false);
 assert.equal(verifyMigrationSnapshot({...before,ownerUid:'hacker'},planned),false);
});
test('GM migration page previews saved HP and requires a deliberate click',()=>{
 const legacy=maxHpV53(stats,50);
 const html=hpMigrationUI([mon(legacy,legacy-5)],false,s=>String(s));
 assert.match(html,/Pokémon HP Migration/);
 assert.match(html,/Migrate 1 Pokémon to V6/);
 assert.match(html,/hp-backup/);
 assert.match(html,/hp-migrate-run/);
 assert.match(html,/V6 HP/);
});
test('GM migration is authenticated, transactional, backs up records and never auto-runs',()=>{
 const c=readFileSync(new URL('../pokemon-party.js',import.meta.url),'utf8');
 assert.match(c,/if\(!GM_SITE\|\|!roleAllowed\|\|!collectionReady\)/);
 assert.match(c,/runTransaction\(store,async transaction/);
 assert.match(c,/verifyMigrationSnapshot\(snap\.data\(\),row\)/);
 assert.match(c,/exportHpSnapshot\(pokemon\);/);
 assert.match(c,/data-act="hp-migration"/);
});
test('published GM starter page has no embedded unreleased story',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/const SEED=\{sites:\[\],quests:\[\],wildlife:\[\],sessions:\[\]/);
 assert.ok(!html.includes('"gmTruth":"'));
 assert.ok(!html.includes('Bastion Tower'));
 assert.ok(!html.includes('Yveltal Eclipse Forme'));
 assert.ok(html.includes('privateBackup:()=>copy(db)'));

});
test('GM private vault is protected in rules and has authenticated backup controls',()=>{
 const rules=readFileSync(new URL('../firestore.rules',import.meta.url),'utf8');
 const vault=rules.slice(rules.indexOf('match /santara_gm_private_campaign/{documentId}'));
 assert.match(vault,/allow get: if gm\(\)/);
 assert.match(vault,/allow create, update: if gm\(\)/);
 assert.match(vault,/allow list, delete: if false/);
 const sync=readFileSync(new URL('../firebase-sync.js',import.meta.url),'utf8');
 assert.match(sync,/cloud-vault-save/);
 assert.match(sync,/cloud-vault-restore/);
 assert.match(sync,/privateRef/);
});
