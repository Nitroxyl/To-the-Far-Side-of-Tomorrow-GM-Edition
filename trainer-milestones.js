// GM-only Gym progress. Talent slots are computed in the player dossier, not assigned here.
import {initializeApp,getApps,getApp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js';
import {getAuth,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js';
import {getFirestore,collection,doc,onSnapshot,setDoc,serverTimestamp} from 'https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js';

const GM_UID='ctBLgrVgkLOzUJYTyYgU9IwejYx1';
const root=document.getElementById('milestone-root'),status=document.getElementById('status');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rewards=[
 [1,'First Trainer Talent','One Fieldcraft or Pokémoncraft talent'],
 [2,'Fourth trained skill','Choose one additional skill proficiency'],
 [3,'Proficiency +3','Trainer skill checks improve'],
 [4,'Second Trainer Talent','Any category, at most one Command talent'],
 [5,'Ability improvement','Assign +1 to one ability score; Legendary Pursuer becomes eligible'],
 [6,'Fifth trained skill','Choose one more skill proficiency'],
 [7,'Third Trainer Talent','Any category, at most one Command talent before Championship'],
 [8,'Proficiency +4','Maximum ordinary skill progression'],
 [9,'Champion Talent','One extra talent slot; at most two Command talents total']
];
let db,auth,viewer=null,gm=false,roleUnsub=null,subs=[],players={},cards={},milestones={},selected='',dirty=false,saving=false;
function stop(){roleUnsub?.();roleUnsub=null;for(const fn of subs)fn?.();subs=[];players={};cards={};milestones={};gm=false;dirty=false;selected='';}
function show(text){status.textContent=text;}
function gate(message){root.innerHTML='<section class="panel"><h2>'+esc(message)+'</h2><p class="note">Sign in with a verified, GM-authorized Santara account through <a href="./account-access.html"><u>Account Access</u></a>.</p></section>';}
function trainerName(uid){const name=String(cards[uid]?.trainerName||'').trim();return name&&name!=='New Trainer'?name:uid===viewer?.uid?'GM account':'Trainer '+uid.slice(0,7);}
function roster(){
 const ids=new Set([...(viewer?[viewer.uid]:[]),...Object.entries(players).filter(([,p])=>p.enabled===true).map(([id])=>id),...Object.keys(cards),...Object.keys(milestones)]);
 return [...ids].filter(Boolean).sort((a,b)=>trainerName(a).localeCompare(trainerName(b)));
}
function progress(id){const data=milestones[id];return {gymCount:Number.isInteger(data?.gymCount)?Math.max(0,Math.min(8,data.gymCount)):0,champion:data?.champion===true};}
function paintRewards(gyms,champion){
 return rewards.map(([level,title,detail])=>{
  const earned=level===9?champion:gyms>=level;
  const next=!earned&&(level===9?gyms===8:level===gyms+1);
  return '<div class="reward'+(earned?' earned':next?' next':'')+'"><strong>'+(earned?'✓ ':'')+(level===9?'Champion':'Gym '+level)+' · '+esc(title)+'</strong><small>'+esc(detail)+'</small></div>';
 }).join('');
}
function render(){
 if(!gm)return;
 const ids=roster();if(!ids.includes(selected))selected=ids[0]||'';
 if(!selected){root.innerHTML='<section class="panel"><h2>No Trainers yet</h2><p class="note">Approve a Trainer account first through the GM dashboard, then return here to award Gym milestones.</p></section>';return;}
 if(dirty)return; // Keep in-progress GM edits while Firestore lists refresh.
 const saved=progress(selected),gyms=saved.gymCount;
 root.innerHTML='<section class="panel"><h2>Choose a Trainer</h2>'+
  '<label class="field">Approved Trainer<select id="trainer-id">'+ids.map(id=>'<option value="'+esc(id)+'"'+(id===selected?' selected':'')+'>'+esc(trainerName(id))+'</option>').join('')+'</select></label>'+
  '<p class="hint">Progress is saved per account UID. Players cannot change their own Gym rewards.</p></section>'+
  '<section class="panel"><h2>Gym & Championship unlocks</h2>'+
  '<form id="milestone-form"><div class="fields"><label class="field">Gyms completed<select name="gymCount">'+
  Array.from({length:9},(_,i)=>'<option value="'+i+'"'+(i===gyms?' selected':'')+'>'+i+' of 8'+(i===0?' · None':i===8?' · All Gyms':'')+'</option>').join('')+'</select></label>'+
  '<label class="field">League status<span class="check"><input type="checkbox" name="champion"'+(saved.champion?' checked':'')+(gyms<8?' disabled':'')+'><span>Champion milestone completed</span></span></label></div>'+
  '<p class="note">Talent slots unlock at Gyms 1, 4 and 7; the fourth unlocks on becoming Champion. Skill slots increase at Gyms 2 and 6. Changing this setting does not automatically select a talent for the player.</p>'+
  '<button class="btn" type="submit"'+(saving?' disabled':'')+'>Save Trainer Milestones</button></form></section>'+
  '<section class="panel"><h2>Rewards for this Trainer</h2><div id="reward-list" class="grid">'+paintRewards(gyms,saved.champion)+'</div></section>';
}
function connect(){
 if(subs.length)return;
 const listen=(name,fn)=>{
  subs.push(onSnapshot(collection(db,name),snapshot=>{fn(snapshot);render();},error=>show('Unable to load '+name+': '+error.message+'. Publish the newest GM firestore.rules before using milestones.')));
 };
 listen('santara_player_access',snap=>{players=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));});
 listen('santara_trainer_cards',snap=>{cards=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));});
 listen('santara_trainer_progress',snap=>{milestones=Object.fromEntries(snap.docs.map(d=>[d.id,d.data()]));});
}
function authorize(value){
 if(value===gm)return;
 gm=value;
 if(!gm){for(const fn of subs)fn?.();subs=[];gate('GM access is required');return}
 show('');connect();render();
}
root.addEventListener('change',event=>{
 if(!gm)return;
 if(event.target.id==='trainer-id'){selected=event.target.value;dirty=false;render();return}
 const form=event.target.closest('#milestone-form');
 if(!form)return;
 dirty=true;
 const gyms=Number(form.elements.gymCount.value);
 const championBox=form.elements.champion;
 championBox.disabled=gyms<8;
 if(gyms<8)championBox.checked=false;
 const list=document.getElementById('reward-list');
 if(list)list.innerHTML=paintRewards(gyms,championBox.checked);
});
root.addEventListener('submit',async event=>{
 if(event.target.id!=='milestone-form')return;
 event.preventDefault();if(!gm||!selected||saving)return;
 const form=event.target,gyms=Number(form.elements.gymCount.value),champion=form.elements.champion.checked;
 if(!Number.isInteger(gyms)||gyms<0||gyms>8||(champion&&gyms!==8)){show('Choose a valid Gym count first.');return}
 const previous=progress(selected);
 if(gyms<previous.gymCount&&!confirm('Lowering Gym progress may invalidate skills or talents the Trainer already selected. Continue?'))return;
 saving=true;form.querySelector('button[type=submit]').disabled=true;
 try{
  await setDoc(doc(db,'santara_trainer_progress',selected),{gymCount:gyms,champion,updatedAt:serverTimestamp()});
  dirty=false;show('Saved '+trainerName(selected)+': '+gyms+' / 8 Gyms'+(champion?' · Champion':'')+'. Players can now choose any newly unlocked talents on their Character Sheet.');
  render();
 }catch(error){show('Save failed: '+error.message+'. Check the GM Firestore rule deployment.');}
 finally{saving=false;const button=root.querySelector('#milestone-form button[type=submit]');if(button)button.disabled=false;}
});
try{
 const config=window.SANTARA_FIREBASE_CONFIG;
 if(!config?.projectId)throw Error('Missing Firebase configuration');
 const app=getApps().length?getApp():initializeApp(config);auth=getAuth(app);db=getFirestore(app);
 onAuthStateChanged(auth,user=>{
  stop();viewer=user;
  if(!user){gate('Sign in to manage Trainer milestones');return}
  if(!user.emailVerified&&user.uid!==GM_UID){gate('Verified email required');return}
  if(user.uid===GM_UID){authorize(true);return}
  roleUnsub=onSnapshot(doc(db,'santara_gm_accounts',user.uid),snap=>{
   const row=snap.exists()?snap.data():null;
   authorize(row?.enabled===true&&row.email===user.email);
  },()=>gate('Could not verify GM permissions'));
 });
}catch(error){gate('Firebase unavailable: '+error.message)}
