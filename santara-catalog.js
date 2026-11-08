// Santara campaign content presets. This file is inert until the GM explicitly imports a group.
// Entries are source material for Firestore, not an automatic player-facing publication.
// Stats: HP / Attack / Defense / Sp. Attack / Sp. Defense / Speed.
const stats=(hp,attack,defense,specialAttack,specialDefense,speed)=>({hp,attack,defense,specialAttack,specialDefense,speed});
const slug=name=>name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const entry=(collection,name,data)=>({collection,id:slug(name),data:{slug:slug(name),name,...data}});
const species=(name,baseStats,types,abilities)=>entry('santara_species_overrides',name,{
 baseStats,types,abilities,knownMoves:[],spriteUrl:'',spriteData:''
});
const mega=(name,baseSpeciesKey,baseStats,types,ability)=>entry('santara_mega_forms',name,{
 baseSpeciesKey,baseStats,types,ability,spriteUrl:'',spriteData:'',source:'custom'
});
const ability=(name,description)=>entry('santara_custom_abilities',name,{description});
// Only listed species/forms may select custom signatures; legacy imported
// definitions get the same restrictions through pokemon-forms-learnsets.js.
const scopes={
 'Infernal Sweep':{allowedSpeciesKeys:['charizard'],requiredMegaSlug:'mega-charizard-z'},
 'Schradebreaker':{allowedSpeciesKeys:['charizard'],requiredMegaSlug:'mega-charizard-z'},
 "Schrade's End":{allowedSpeciesKeys:['charizard'],requiredMegaSlug:'mega-charizard-z'},
 'Tar Rend':{allowedSpeciesKeys:['custom:spinotroleum'],requiredMegaSlug:''},
 'Riptide Bite':{allowedSpeciesKeys:['custom:mosasord'],requiredMegaSlug:''},
 'Faultline Gore':{allowedSpeciesKeys:['custom:carnotremor'],requiredMegaSlug:''}
};
const move=(name,type,category,power,accuracy,description,dice='')=>entry('santara_custom_moves',name,{
 type,category,power,accuracy,description,dice,
 ...(scopes[name]||{allowedSpeciesKeys:[],requiredMegaSlug:''})
});

// Confirmed fossil design discussions, October 2026.
const fossils=[
 species('Spinotroleum',stats(110,140,105,65,100,80),['water','poison'],['Apex Predator']),
 species('Mosasord',stats(95,125,95,60,85,90),['water','dark'],['Strong Jaw']),
 species('Obsidaalik',stats(120,60,105,115,105,40),['water','fire'],['Regenerator']),
 species('Carnotremor',stats(80,130,90,45,70,120),['fire','ground'],['Reckless']),
 ability('Apex Predator','Physical attacks deal 30% more damage against targets below full HP. When this Pokémon knocks out a target, it restores 25% of its own maximum HP.'),
 move('Tar Rend','poison','Physical',85,100,'Contact. On a successful hit, lower the target Defense by 1 stage. Original design: 10 PP.'),
 move('Riptide Bite','water','Physical',85,100,'Biting move. On hit, 30% chance to lower target Defense by 1 stage. Strong Jaw applies as normal. Original design: 10 PP.'),
 move('Faultline Gore','ground','Physical',100,100,'Contact. User takes recoil equal to 25% of damage actually inflicted. Reckless applies. Original design: 10 PP.')
];

// The established/reworked Megas use the most recent spreads, not their earlier drafts.
// Mega Charizard Z uses the October 21 revision to exactly 200 Sp. Attack.
const megas=[
 mega('Mega Charizard Z','charizard',stats(78,63,72,200,70,151),['fire','dragon'],"Kingdom's End"),
 mega('Mega Lycanroc Dusk','lycanroc-dusk',stats(75,157,85,55,80,135),['rock','dark'],'Tough Claws'),
 mega('Mega Dragapult','dragapult',stats(88,135,115,140,110,112),['dragon','ghost'],'Mega Launcher'),
 mega('Mega Ceruledge','ceruledge',stats(75,160,110,60,120,100),['fire','ghost'],'Sharpness'),
 mega('Mega Armarouge','armarouge',stats(85,60,140,165,100,75),['fire','psychic'],'Bastion Furnace'),
 mega('Mega Greninja','greninja',stats(72,110,77,148,81,142),['water','dark'],'Technician'),
 mega('Mega Arbok','arbok',stats(60,135,99,65,89,100),['poison','dark'],'Strong Jaw'),
 mega('Mega Krookodile','krookodile',stats(95,157,105,65,80,117),['ground','dark'],'Adaptability'),
 mega('Mega Hydreigon','hydreigon',stats(92,105,110,170,105,118),['dragon','electric'],'Tempest Crown'),
 mega('Mega Lapras','lapras',stats(130,85,115,135,105,65),['water','ice'],'Aurora Chorus'),
 mega('Mega Kilowattrel','kilowattrel',stats(70,70,85,135,90,140),['electric','flying'],'Lightning Rod'),
 mega('Mega Garganacl','garganacl',stats(100,125,175,45,120,35),['rock'],'Purifying Salt'),
 mega('Mega Kingdra','kingdra',stats(75,95,110,160,110,90),['water','dragon'],'Swift Swim'),
 mega('Mega Tyrantrum','tyrantrum',stats(82,161,139,69,79,91),['dragon','fire'],'Molten Edge'),
 mega('Mega Crawdaunt','crawdaunt',stats(63,165,100,90,65,85),['water','dark'],'Adaptability'),
 mega('Mega Porygon-Z','porygon-z',stats(85,80,85,165,100,125),['normal','electric'],'System Override'),
 // NEW proposal: base Archaludon is 600 BST; this gives its Mega +100 while
 // keeping the signature heavy siege-turret identity. Not from a finalized older chat.
 mega('Mega Archaludon','archaludon',stats(90,105,165,170,105,65),['steel','dragon'],'Siege Battery'),
 ability("Kingdom's End",'When Mega Evolution begins, summon Calamitous Sun for 5 rounds. Fire attacks deal 1.5x damage; Water-type attacks fail; Fire resistance is treated as neutral (immunities remain). Calamitous Sun ends when this Pokémon leaves battle and does not stack with ordinary sun.'),
 ability('Bastion Furnace','Prevent reductions to the user Defense and Sp. Defense stages. Above 50% HP, damage taken from super-effective moves is reduced by 25%; at or below 50% HP, Fire and Psychic attack damage is boosted by 30% instead.'),
 ability('Tempest Crown','On Mega Evolution, summon Royal Tempest for 5 rounds: Electric-type damage increases by 30%, and Thunder and Hurricane cannot miss while the weather is active. A new weather effect replaces it.'),
 ability('Aurora Chorus','On Mega Evolution, set Aurora Veil on the user side for 5 turns without requiring snow. Use normal Aurora Veil protection and expiry rules. This is a weather-independent veil, not permanent terrain.'),
 ability('Molten Edge','Fire-type attacks and slicing attacks deal 30% more damage. An attack qualifying for both categories gets this boost only once.'),
 ability('System Override','On entry, choose an opponent to mark Exposed. While both remain active, suppress that target Ability, lower its Speed by 1 stage once, and increase damage it receives from this Pokémon Normal- and Electric-type attacks by 20%. Exposed ends if either Pokémon switches out. Working tabletop specification; exact Exposed value was not finalized in earlier drafts.'),
 ability('Siege Battery','NEW PROPOSAL: Electro Shot does not require a charging turn. The first time each round this Pokémon takes damage from an attack, increase its Sp. Attack by 1 stage (once per round, even for multihit attacks).'),
 move('Infernal Sweep','fire','Special',95,100,'Fire sweeps across adjacent enemies in a cone (or both opposing targets in a standard double battle). Each target has a 10% chance to be burned.'),
 move('Schradebreaker','fire','Special',130,90,'On hit, destroy the target side Reflect, Light Screen, and Aurora Veil before damage is resolved; does not ignore ordinary Protect.'),
 move("Schrade's End",'fire','Special',180,100,'Mega Charizard Z only. Charge for one full round, then fire a directional cone. Once per battle; resolve damage normally with Calamitous Sun if active. It does not consume HP.'),
 move('Psycannon','psychic','Special',120,100,'After attacking, lower the user Speed by 1 stage.')
];

// Story forms can expose unrevealed content to players if imported early.
const story=[
 species('Rotom-Server',stats(75,50,110,130,110,105),['electric','steel'],['Root Access']),
 species('Yveltal Eclipse Forme',stats(126,141,120,151,123,99),['dark','flying'],['Dark Aura']),
 ability('Root Access','Combines Levitate and Prankster: immune to Ground-type attacks while not grounded by an overriding effect, and non-damaging status moves gain +1 priority. Apply ordinary Prankster restrictions.')
];

// Optional working drafts: explicitly not finalized in the earlier design discussions.
const drafts=[
 move('Glitch Pulse','electric','Special',90,100,'WORKING PROPOSAL: A data-corruption blast. Deals 20% more damage if the target is Exposed by System Override.'),
 move('Nihil Light','dragon','Special',200,100,'PROVISIONAL Mega Zygarde only. Ignores positive defensive stages, Fairy immunity and ordinary Protect/Detect. Fires in a directional beam and requires two full subsequent rounds of recharge before reuse.','Lv tiers: 2d10 / 3d10 / 4d10 / 5d10')
];

export const SANTARA_CATALOG_GROUPS=Object.freeze([
 {id:'fossils',label:'Original fossils',description:'4 original species, Apex Predator and three fossil signature moves. Approved Trainers can read these definitions.'},
 {id:'megas',label:'Reworked Mega Evolutions',description:'17 Mega forms, custom Mega abilities and signature attacks. Mega forms are GM-only, but move and ability definitions are player-readable.'},
 {id:'story',label:'Story and alternate forms',description:'Rotom-Server, Yveltal Eclipse and Root Access. Import only when spoilers are acceptable.'},
 {id:'drafts',label:'Provisional signature moves',description:'Glitch Pulse and Nihil Light are explicitly marked as working drafts, not finalized campaign rules.'}
]);
const groups={fossils,megas,story,drafts};
export function santaraCatalogEntries(group){
 if(!Object.prototype.hasOwnProperty.call(groups,group))throw Error('Unknown Santara content group.');
 return groups[group].map(item=>({collection:item.collection,id:item.id,data:{
  ...item.data, ...(item.data.baseStats?{baseStats:{...item.data.baseStats}}:{})
 }}));
}
