// Mirrors the core field shapes enforced by firestore.rules, so malformed
// Mega snapshots are rejected before an opaque "permission-denied" response.
// This is a convenience diagnostic, NOT an authorization mechanism.
export const BASE_STAT_KEYS=['hp','attack','defense','specialAttack','specialDefense','speed'];
const TYPES=['normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'];
const STATUSES=['None','Burned','Poisoned','Badly poisoned','Paralyzed','Asleep','Frozen'];
const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
const integer=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
const text=(v,max,min=0)=>typeof v==='string'&&v.length>=min&&v.length<=max;
const https=v=>text(v,600)&&(v===''||/^https:\/\/.+/.test(v));
const image=v=>text(v,150000)&&(v===''||/^data:image\/webp;base64,[A-Za-z0-9+/=]+$/.test(v));
const list=(v,max)=>Array.isArray(v)&&v.length<=max;
function statsProblems(stats,prefix){
 const errors=[];
 if(!stats||typeof stats!=='object'||Array.isArray(stats)){
  errors.push(prefix+' must include all six base stats');return errors;
 }
 if(Object.keys(stats).some(k=>!BASE_STAT_KEYS.includes(k)))errors.push(prefix+' has unexpected fields');
 for(const key of BASE_STAT_KEYS){
  if(!integer(stats[key],1,255))errors.push(prefix+'.'+key+' must be an integer from 1 to 255');
 }
 return errors;
}
export function assignmentProblems(d){
 const errors=[];
 if(!d||typeof d!=='object')return ['Pokémon data is missing'];
 const expected=['ownerUid','speciesKey','speciesName','source','baseStats','types','abilities',
 'spriteUrl','spriteData','nickname','level','ability','maxHp','currentHp',
 'status','slot','heldItem','moves','origin','notes','updatedAt',
 'teraType','megaForm','megaActive','teraActive','zUsed','dynamaxTurns','dynamaxUsed','nature'];
 const core=expected.slice(0,21);
 for(const k of core)if(!own(d,k))errors.push('Missing '+k);
 for(const k of Object.keys(d))if(!expected.includes(k))errors.push('Unexpected field: '+k);
 if(!text(d.ownerUid,128,10))errors.push('Trainer UID must be 10–128 characters');
 if(!text(d.speciesKey,110,1))errors.push('Species key must be 1–110 characters');
 if(!text(d.speciesName,85,1))errors.push('Species name must be 1–85 characters');
 if(!['official','custom'].includes(d.source))errors.push('Pokémon source must be official or custom');
 errors.push(...statsProblems(d.baseStats,'Base stats'));
 if(!list(d.types,2)||d.types.length<1)errors.push('Species must have 1–2 types');
 if(!list(d.abilities,4))errors.push('Species must have no more than four abilities');
 if(!https(d.spriteUrl))errors.push('Pokémon artwork URL must be HTTPS and at most 600 characters');
 if(!image(d.spriteData))errors.push('Pokémon artwork must be a WebP image under 150,000 characters');
 if(!text(d.nickname,32))errors.push('Nickname cannot exceed 32 characters');
 if(!integer(d.level,1,100))errors.push('Level must be an integer from 1 to 100');
 if(!text(d.ability,48))errors.push('Selected ability cannot exceed 48 characters');
 if(!integer(d.maxHp,1,3000))errors.push('Maximum HP must be an integer from 1 to 3000');
 if(!integer(d.currentHp,0,d.maxHp))errors.push('Current HP must be between 0 and maximum HP');
 if(!STATUSES.includes(d.status))errors.push('Unknown status condition');
 if(!integer(d.slot,0,6))errors.push('Party slot must be from 0 to 6');
 if(!text(d.heldItem,80))errors.push('Held item cannot exceed 80 characters');
 if(own(d,'nature')&&!["Adamant","Bashful","Bold","Brave","Calm","Careful","Docile","Gentle","Hardy","Hasty","Impish","Jolly","Lax","Lonely","Mild","Modest","Naive","Naughty","Quiet","Quirky","Rash","Relaxed","Sassy","Serious","Timid"].includes(d.nature))errors.push('Nature must be one of the 25 standard Pokémon Natures');
 if(!list(d.moves,4))errors.push('A Pokémon can know up to four moves');
 if(!text(d.origin,150))errors.push('Origin cannot exceed 150 characters');
 if(!text(d.notes,1000))errors.push('Shared notes cannot exceed 1,000 characters');
 if(own(d,'teraType')&&!TYPES.includes(d.teraType))errors.push('Invalid Tera type');
 for(const k of ['megaActive','teraActive','zUsed','dynamaxUsed'])
  if(own(d,k)&&typeof d[k]!=='boolean')errors.push(k+' must be true or false');
 if(own(d,'dynamaxTurns')&&!integer(d.dynamaxTurns,0,3))errors.push('Dynamax turns must be 0–3');
 if(d.megaActive&&d.teraActive)errors.push('Mega and Tera cannot be active simultaneously');
 if((d.megaActive||d.teraActive)&&d.dynamaxTurns>0)errors.push('Mega/Tera and Dynamax cannot be active together');
 const m=d.megaForm;
 if(m!==undefined&&m!==null){
  const allowed=['slug','name','baseSpeciesKey','baseStats','types','ability','spriteUrl','spriteData','source'];
  for(const k of allowed)if(!own(m,k))errors.push('Mega form missing '+k);
  for(const k of Object.keys(m))if(!allowed.includes(k))errors.push('Mega form has unexpected field '+k);
  if(!text(m.slug,70,2)||!/^[a-z0-9-]+$/.test(m.slug))errors.push('Mega form slug must be 2–70 lowercase letters/numbers/hyphens');
  if(!text(m.name,85,1))errors.push('Mega form name must be 1–85 characters');
  if(!text(m.baseSpeciesKey,110,1))errors.push('Mega form must reference its regular species');
  errors.push(...statsProblems(m.baseStats,'Mega stats'));
  if(!list(m.types,2)||m.types.length<1)errors.push('Mega form must have 1–2 types');
  if(!text(m.ability,48,1))errors.push('Mega ability must be 1–48 characters');
  if(!https(m.spriteUrl))errors.push('Mega artwork URL must be HTTPS and at most 600 characters');
  if(!image(m.spriteData))errors.push('Mega artwork must be a WebP image under 150,000 characters');
  if(!['official','custom'].includes(m.source))errors.push('Mega source must be official or custom');
  if(d.megaActive&&m.baseSpeciesKey!==d.speciesKey)errors.push('Active Mega must match the original species key');
 }
 if(d.megaActive&&!m)errors.push('A Mega cannot be active without an assigned form');
 return errors;
}
