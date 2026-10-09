/* אפרתושקה v2 – meta-game: missions, journey, pets, city, vehicles, gold, wheel, stickers, holidays, challenge, parents, profile */
'use strict';
window.EFV2=function(K){
const {D,A,$}=K; const {rnd,ri,pick,shuffle}=D;
const TAU=Math.PI*2, clamp=(x,a,b)=>x<a?a:x>b?b:x, lerp=(a,b,t)=>a+(b-a)*t, ease=t=>1-Math.pow(1-t,3);
const V={};
const S=K.S;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* ---------- extra worlds ---------- */
const NEWW=[
 {id:'beach',name:'חוף הגלידה',music:'sky',sky:['#7fe0ff','#fff4d6'],hill:['#ffd98a','#ffe9b8'],ground:['#ffe6a8','#ffdf96'],road:['#fffaf0','#fff0d2'],edge:['#ff8fb8','#ffffff'],lane:'#ffd2a0',accent:'#ff7a59',
  boss:{name:'גנב הצבעים של החוף',acc:'shades'},decor:['wd_icetree','wd_umbrella','dec_truck','dec_cotton']},
 {id:'forest',name:'יער החד-קרן',music:'chip',sky:['#b9a2ff','#ffe3fb'],hill:['#7fd88f','#a9ecb3'],ground:['#8fe0a0','#82d894'],road:['#fdf7ff','#f1e4ff'],edge:['#a35cff','#ffffff'],lane:'#d9c2ff',accent:'#8e44d6',
  boss:{name:'גנב הצבעים של היער',acc:'propeller'},decor:['wd_mushroom','wd_crystal','dec_carousel']},
 {id:'space',name:'מסיבת החלל',music:'disco',night:true,sky:['#070422','#2a1360'],hill:['#2b1a5c','#3a2478'],ground:['#1b1240','#22184d'],road:['#2c2066','#352a7a'],edge:['#3fd4ff','#ff4fa8'],lane:'#6f5bff',accent:'#3fd4ff',
  boss:{name:'גנב הצבעים מהחלל',acc:'propeller'},decor:['wd_planet','wd_rocket','wd_starlamp','wd_moon']},
];
NEWW.forEach(w=>{ if(!D.WORLDS.find(x=>x.id===w.id)) D.WORLDS.push(w); });
D.OUTFITS.push({id:'galaxy',name:'גלקסיה',price:-1,dh:-75,sw:'#5b4bff'},{id:'sunset',name:'שקיעה',price:-1,dh:55,sw:'#ff9a3c'},{id:'lime',name:'ליים',price:-1,dh:-232,sw:'#9be33c'});

/* ---------- save ---------- */
const V2DEF={missions:{day:'',list:[]},journey:{week:'',xp:0,claimed:0},pets:{owned:[],active:null},eggs:[],hatched:0,
  city:{built:{}},worlds:['candy','sky','disco'],worldSel:'',veh:{owned:['skate'],sel:'skate'},upg:{magnet:0,fly:0,double:0},
  stickers:{have:{},pages:[]},wheel:{last:''},profile:{name:'',buddy:true},par:{limit:0,day:'',used:0,bonus:0,holiday:'auto'},
  stats:{cat:{},dance:[0,0],lessons:{},levels:0,gates:[0,0]},tokens:{deco:0},holiSeen:'',started:false,ch:{}};
function merge(def,src){ const o=JSON.parse(JSON.stringify(def)); if(src&&typeof src==='object') for(const k in src){ if(o[k]&&typeof o[k]==='object'&&!Array.isArray(o[k])&&src[k]&&typeof src[k]==='object'&&!Array.isArray(src[k])) o[k]=Object.assign(o[k],src[k]); else o[k]=src[k]; } return o; }
S.v2=merge(V2DEF,S.v2); const X=S.v2;
const save=()=>K.save();

/* ---------- images (lazy) ---------- */
const IMC={};
function I(n){ let e=IMC[n]; if(!e){ e=IMC[n]={img:null,p:K.loadImg('assets/v2/'+n+'.webp').then(i=>{e.img=i;return i;})}; } return e.img; }
function IP(n){ I(n); return IMC[n].p; }
const url=n=>'assets/v2/'+n+'.webp';
V.I=I; V.IP=IP;

/* ---------- dates ---------- */
const today=()=>K.todayStr();
function weekKey(){ const d=new Date(); d.setDate(d.getDate()-d.getDay()); return K.todayStr(d); }
function seeded(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return ()=>{ h^=h<<13; h^=h>>>17; h^=h<<5; return ((h>>>0)%100000)/100000; }; }

/* ---------- holidays ---------- */
const HOLI={
 purim:{name:'פורים',greet:'פורים שמח!',items:['h_hamantash','h_mask','h_grogger'],treat:'h_hamantash',voice:'h_purim'},
 hanukkah:{name:'חנוכה',greet:'חנוכה שמח!',items:['h_menorah','h_sufganiya','h_dreidel'],treat:'h_sufganiya',voice:'h_hanukkah'},
 independence:{name:'יום העצמאות',greet:'חג עצמאות שמח!',items:['h_bwballoons','flag'],treat:'h_bwballoons',voice:'h_independence',fireworks:true},
 roshhashana:{name:'ראש השנה',greet:'שנה טובה ומתוקה!',items:['h_apple','h_honey','h_pomegranate'],treat:'h_apple',voice:'h_roshhashana'},
 sukkot:{name:'סוכות',greet:'חג סוכות שמח!',items:['h_sukkah','h_etrog'],treat:'h_etrog',voice:'h_sukkot'},
};
function hebrewHoliday(d){
  try{ const parts=new Intl.DateTimeFormat('en-u-ca-hebrew',{month:'long',day:'numeric'}).formatToParts(d||new Date());
    const m=(parts.find(p=>p.type==='month')||{}).value||'', day=parseInt((parts.find(p=>p.type==='day')||{}).value,10);
    if((m==='Adar'||m==='Adar II')&&day>=10&&day<=16) return 'purim';
    if((m==='Kislev'&&day>=25)||(m==='Tevet'&&day<=3)) return 'hanukkah';
    if(m==='Iyar'&&day>=3&&day<=7) return 'independence';
    if((m==='Elul'&&day>=25)||(m==='Tishri'&&day<=10)) return 'roshhashana';
    if(m==='Tishri'&&day>=14&&day<=23) return 'sukkot';
  }catch(e){}
  return null;
}
V.hebrewHoliday=hebrewHoliday;
function holiday(){ const o=X.par.holiday; if(o&&o!=='auto') return o==='none'?null:(HOLI[o]?o:null); return hebrewHoliday(); }
V.holiday=()=>{ const h=holiday(); return h?Object.assign({id:h},HOLI[h]):null; };
function flagCanvas(){ if(V._flag) return V._flag; V._flag=K.mk(200,300,(g)=>{ g.fillStyle='#ddd'; g.fillRect(10,0,10,300); g.fillStyle='#fff'; g.fillRect(20,10,170,120); g.fillStyle='#1f5fd1'; g.fillRect(20,24,170,16); g.fillRect(20,100,170,16);
  g.strokeStyle='#1f5fd1'; g.lineWidth=6; const cx=105,cy=70,r=24; for(const s of [1,-1]){ g.beginPath(); for(let i=0;i<3;i++){ const a=-Math.PI/2*s+i*TAU/3; g.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r); } g.closePath(); g.stroke(); } }); return V._flag; }
function holiImg(n){ return n==='flag'?flagCanvas():I(n); }

/* ---------- pets ---------- */
const PETS=[
 {id:'unicorn',name:'חד-קרן',ab:'shield',abTxt:'מגן מהתנגשות אחת',fly:false},
 {id:'kitten',name:'חתלתולה',ab:'collect',abTxt:'אוספת כוכבים מהמסלול ליד',fly:false},
 {id:'dragon',name:'דרקון קטן',ab:'burn',abTxt:'נושף אש על מכשולים',fly:true},
 {id:'panda',name:'פנדה',ab:'power',abTxt:'כוחות קסם ארוכים יותר',fly:false},
 {id:'puppy',name:'גור כלבים',ab:'hint',abTxt:'רמז בשער הקסם',fly:false},
 {id:'bunny',name:'ארנבון',ab:'lucky',abTxt:'כוכבי מזל כפולים',fly:false},
];
const petDef=id=>PETS.find(p=>p.id===id);
const activePet=()=>{ const a=X.pets.active; return a?X.pets.owned.find(p=>p.id===a):null; };
const EGGCOLS=[['#ff9ad5','#ffd23f'],['#9fd8ff','#ff6fc8'],['#c8a6ff','#7dfcb2'],['#ffe07a','#ff7a59'],['#7dfcb2','#3fd4ff']];
function eggCanvas(c,s,crack){ return K.mk(s,s*1.25,(g,w,h)=>{ const gr=g.createRadialGradient(w*.38,h*.35,s*.05,w*.5,h*.55,s*.6); gr.addColorStop(0,'#fff'); gr.addColorStop(.35,c[0]); gr.addColorStop(1,K.shade(c[0],-.25)); g.fillStyle=gr; g.beginPath(); g.ellipse(w/2,h*.56,w*.42,h*.42,0,0,TAU); g.fill();
  g.fillStyle=c[1]; for(const [x,y,r] of [[.35,.45,.08],[.62,.38,.06],[.55,.7,.09],[.3,.72,.05],[.7,.6,.05]]){ g.beginPath(); g.arc(w*x,h*y,s*r,0,TAU); g.fill(); }
  g.lineWidth=s*.03; g.strokeStyle='rgba(255,255,255,.9)'; g.beginPath(); g.ellipse(w/2,h*.56,w*.42,h*.42,0,0,TAU); g.stroke();
  if(crack){ g.strokeStyle='#5a2a5a'; g.lineWidth=s*.025; g.beginPath(); g.moveTo(w*.18,h*.5); const n=7; for(let i=1;i<=n;i++) g.lineTo(w*(.18+.64*i/n),h*(.5+(i%2?-.06:.05))); g.stroke(); }
  g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(w*.36,h*.32,s*.06,s*.11,-.5,0,TAU); g.fill(); }); }
const eggCv={}; function eggImg(ci,crack){ const k=ci+'|'+(crack?1:0); return eggCv[k]||(eggCv[k]=eggCanvas(EGGCOLS[ci%EGGCOLS.length],120,crack)); }
function addEgg(need){ if(X.eggs.length>=3) return false; X.eggs.push({c:ri(0,EGGCOLS.length-1),dist:0,need:need||(X.hatched===0&&X.eggs.length===0?300:700)}); save(); return true; }

/* ---------- vehicles & upgrades ---------- */
const VEH=[{id:'skate',name:'סקייטבורד',price:0},{id:'skates',name:'גלגיליות',price:250},{id:'cloud',name:'ענן קסום',price:400},{id:'unicorn',name:'רכיבה על חד-קרן',price:600}];
const UPG=[{id:'magnet',name:'מגנט',base:9},{id:'fly',name:'טיסת בלונים',base:6.5},{id:'double',name:'כוכבים כפולים',base:10}];
const UPCOST=[60,120,200,320,480];
const vehCv={};
function vehCanvas(id){ if(vehCv[id]) return vehCv[id];
  if(id==='skate') return vehCv[id]=K.mk(220,90,(g)=>{ g.fillStyle='#3a1250'; for(const x of [50,170]){ g.beginPath(); g.arc(x,70,16,0,TAU); g.fill(); } g.fillStyle='#ffd23f'; for(const x of [50,170]){ g.beginPath(); g.arc(x,70,7,0,TAU); g.fill(); }
    const gr=g.createLinearGradient(10,0,210,0); ['#ff3b4e','#ffa53f','#ffd23f','#2ecc55','#2f7bff','#9b59ff'].forEach((c,i)=>gr.addColorStop(i/5,c)); g.fillStyle=gr; K.rrect(g,8,30,204,28,14); g.fill(); g.lineWidth=4; g.strokeStyle='#fff'; g.stroke(); });
  if(id==='skates') return vehCv[id]=K.mk(220,110,(g)=>{ for(const x of [55,165]){ g.fillStyle='#ff6fc8'; K.rrect(g,x-34,10,68,60,18); g.fill(); g.fillStyle='#fff'; g.fillRect(x-34,52,68,12); g.fillStyle='#3fd4ff'; for(const dx of [-20,20]){ g.beginPath(); g.arc(x+dx,86,14,0,TAU); g.fill(); } g.fillStyle='#fff'; for(const dx of [-20,20]){ g.beginPath(); g.arc(x+dx,86,5,0,TAU); g.fill(); } } });
  return null; }
function vehIconURL(id){ if(id==='cloud') return url('veh_cloud'); if(id==='unicorn') return url('veh_unicorn'); const c=vehCanvas(id); return c?c.toDataURL():''; }
const upDur=(t)=>{ const u=UPG.find(x=>x.id===t); return u.base+1.5*(X.upg[t]||0); };

/* ---------- stickers ---------- */
const PAGES=[
 {id:'candy',name:'ממתקים',items:['dec_castle','dec_cupcake','dec_cotton','dec_choco','dec_cake','dec_truck','wd_icetree','wd_umbrella']},
 {id:'party',name:'מסיבה',items:['dec_balloon','dec_ferris','dec_carousel','dec_slide','dec_bouncy','dec_arch','dec_stage','dec_dj']},
 {id:'magic',name:'קסם וחלל',items:['dec_discotower','wd_crystal','wd_mushroom','wd_planet','wd_rocket','wd_starlamp','wd_moon','veh_cloud']},
 {id:'pets',name:'חברי קסם',items:['pet_unicorn','pet_kitten','pet_dragon','pet_panda','pet_puppy','pet_bunny','veh_unicorn','egg']},
 {id:'efrat',name:'אפרתושקה',items:['ef_front','ef_celebrate','ef_dance','ef_jump','ef_run','ef_oops','ef_duck','ef_thief']},
 {id:'holi',name:'חגים',items:['h_hamantash','h_mask','h_sufganiya','h_dreidel','h_menorah','h_apple','h_honey','h_sukkah']},
];
const ALLST=[]; PAGES.forEach(p=>p.items.forEach(i=>ALLST.push(i)));
const stURLc={};
function stickerURL(id){
  if(stURLc[id]) return stURLc[id];
  if(id==='egg') return stURLc[id]=eggImg(1).toDataURL();
  if(id.startsWith('ef_')){ const n=id.slice(3); let c=null;
    if(n==='thief'){ const im=K.IMG.thief; if(im){ c=K.mk(200,200*im.height/im.width,(g,w,h)=>g.drawImage(im,0,0,w,h)); } }
    else if(n==='front'){ const sh=K.sheet('front'); if(sh) c=K.mk(220,220*sh.height/sh.width,(g,w,h)=>g.drawImage(sh,0,0,w,h)); }
    else { const m=K.SPR()[n==='jump'?'jumpb':n], sh=K.sheet(n==='jump'?'jumpb':n); if(m&&sh){ const fi=Math.floor(m.n*({celebrate:.3,dance:.4,jump:.6,run:.2,oops:.5,duck:.5}[n]||0)); c=K.mk(m.fw,m.fh,(g)=>g.drawImage(sh,(fi%m.cols)*m.fw,Math.floor(fi/m.cols)*m.fh,m.fw,m.fh,0,0,m.fw,m.fh)); } }
    if(!c) return ''; return stURLc[id]=c.toDataURL('image/webp',.8); }
  return url(id);
}
function grantSticker(forceShiny){
  const missing=ALLST.filter(i=>!X.stickers.have[i]);
  const id=(missing.length&&Math.random()<.65)?pick(missing):pick(ALLST);
  const shiny=forceShiny||Math.random()<.15; const prev=X.stickers.have[id]||0; const isNew=!prev;
  X.stickers.have[id]=Math.max(prev,shiny?2:1); ev('sticker',1);
  let pageDone=null; for(const p of PAGES){ if(!X.stickers.pages.includes(p.id)&&p.items.every(i=>X.stickers.have[i])){ X.stickers.pages.push(p.id); S.stars+=150; pageDone=p; } }
  save(); return {id,shiny,isNew,pageDone};
}

/* ---------- missions ---------- */
const MDEF=[
 {id:'stars',ev:'star',t:'אספו {n} כוכבים',g:[40,80,120]},
 {id:'gates',ev:'gateok',t:'ענו נכון ב-{n} שערי קסם',g:[3,5,8]},
 {id:'streak',ev:'streak',max:true,t:'רצף של {n} תשובות נכונות',g:[2,3,4]},
 {id:'level',ev:'level',t:'סיימו {n} שלבים',g:[1,2,2]},
 {id:'bwin',ev:'battlewin',t:'נצחו בקרב ריקודים',g:[1,1,1]},
 {id:'perfect',ev:'perfect',t:'קבלו {n} פעמים "מושלם!" בריקוד',g:[6,12,20]},
 {id:'power',ev:'power',t:'אספו {n} כוחות קסם',g:[2,3,4]},
 {id:'ride',ev:'ride',t:'רכבו על רכב קסם {n} פעמים',g:[1,1,2]},
 {id:'gold',ev:'gold',t:'הפעילו קדחת זהב',g:[1,1,1]},
 {id:'candy',ev:'candy',t:'אספו {n} סוכריות',g:[2,3,5]},
 {id:'pet',ev:'pet',t:'לטפו או האכילו חבר קסם {n} פעמים',g:[3,3,4]},
 {id:'jump',ev:'jump',t:'קפצו {n} פעמים',g:[10,20,30]},
 {id:'gift',ev:'gift',t:'פתחו קופסת הפתעה',g:[1,1,2]},
];
function grp(){ return D.ageGroup(S.age); }
function ensureMissions(){
  const d=today(); if(X.missions.day===d&&X.missions.list.length===3) return;
  const r=seeded(d+'|'+S.age); const pool=MDEF.slice(); const list=[];
  while(list.length<3&&pool.length){ const i=Math.floor(r()*pool.length); const m=pool.splice(i,1)[0]; if(m.id==='pet'&&!X.pets.owned.length) continue; list.push({id:m.id,goal:m.g[grp()],prog:0,done:false,claimed:false}); }
  X.missions={day:d,list}; save();
}
function mText(m){ const d=MDEF.find(x=>x.id===m.id); return d.t.replace('{n}',m.goal); }
function ev(name,n){
  ensureMissions(); let changed=false;
  for(const m of X.missions.list){ const d=MDEF.find(x=>x.id===m.id); if(!d||d.ev!==name||m.done) continue;
    m.prog=d.max?Math.max(m.prog,n):m.prog+n; changed=true;
    if(m.prog>=m.goal){ m.prog=m.goal; m.done=true; K.toast('✔ משימה הושלמה! '+mText(m),2600); A.voice('m_done'); A.sfx('powerup',.6); }
  }
  if(changed) badgeUpd();
}
V.ev=ev;

/* ---------- journey ---------- */
const TIERXP=80;
const JR=[];
(function(){ const sched=['s30','st','egg','s40','o:galaxy','st','deco','s50','egg','v:skates','st','s60','deco','egg','o:sunset','st','s70','deco','egg','v:cloud','st','s80','deco','egg','o:lime','shiny','s100','deco','egg','v:unicorn'];
  sched.forEach(s=>{ if(s[0]==='s'&&s!=='st'&&s!=='shiny') JR.push({k:'stars',n:+s.slice(1)}); else if(s==='st') JR.push({k:'stickers',n:3}); else if(s==='shiny') JR.push({k:'shiny'}); else if(s==='egg') JR.push({k:'egg'}); else if(s==='deco') JR.push({k:'deco'}); else if(s.startsWith('o:')) JR.push({k:'outfit',id:s.slice(2)}); else JR.push({k:'veh',id:s.slice(2)}); }); })();
function ensureWeek(){ const w=weekKey(); if(X.journey.week!==w){ X.journey={week:w,xp:0,claimed:0}; save(); } }
function addXP(n){ ensureWeek(); const before=Math.floor(X.journey.xp/TIERXP); X.journey.xp=Math.min(TIERXP*30,X.journey.xp+n); const after=Math.floor(X.journey.xp/TIERXP); save(); if(after>before){ K.toast('🌟 פרס חדש מחכה במסע הכוכבים!',2400); } badgeUpd(); }
V.addXP=addXP;
function rewardInfo(r){
  if(r.k==='stars') return {t:r.n+' כוכבים',img:starURL()};
  if(r.k==='stickers') return {t:r.n+' מדבקות',img:url('dec_balloon')};
  if(r.k==='shiny') return {t:'מדבקה נוצצת',img:url('wd_starlamp')};
  if(r.k==='egg') return {t:'ביצה קסומה',img:eggImg(2).toDataURL()};
  if(r.k==='deco') return {t:'קישוט חינם לעיר',img:url('dec_arch')};
  if(r.k==='outfit'){ const o=D.OUTFITS.find(x=>x.id===r.id); return {t:'בגד: '+o.name,img:'',sw:o.sw}; }
  if(r.k==='veh'){ const v=VEH.find(x=>x.id===r.id); return {t:v.name,img:vehIconURL(r.id)}; }
  if(r.k==='wheelstars') return {t:r.n+' כוכבים',img:starURL()};
  return {t:'',img:''};
}
let _starURL=null; function starURL(){ if(!_starURL&&K.P.star) _starURL=K.P.star.toDataURL(); return _starURL||''; }
/* grant any reward → returns reveal descriptor */
function grant(r){
  let title='', sub='', img='', sw='', voice='lucky', shiny=false;
  if(r.k==='stars'){ S.stars+=r.n; title='+'+r.n+' ⭐'; sub='כוכבים!'; img=starURL(); }
  else if(r.k==='egg'){ if(addEgg()){ title='ביצה קסומה!'; sub='רוצו כדי שהיא תבקע'; img=eggImg(X.eggs[X.eggs.length-1].c).toDataURL(); voice='egg_found'; } else { S.stars+=40; title='+40 ⭐'; sub='הקן מלא – קיבלתם כוכבים'; img=starURL(); } }
  else if(r.k==='stickers'||r.k==='shiny'){ const got=[]; const n=r.k==='shiny'?1:(r.n||1); let pd=null; for(let i=0;i<n;i++){ const g=grantSticker(r.k==='shiny'); got.push(g); if(g.pageDone) pd=g.pageDone; }
    const best=got.find(g=>g.shiny)||got[0]; shiny=best.shiny; title=n>1?n+' מדבקות חדשות!':(best.shiny?'מדבקה נוצצת!':'מדבקה חדשה!'); sub=best.shiny?'נדירה במיוחד ✨':'לאלבום המדבקות'; img=stickerURL(best.id); voice=best.shiny?'shiny':'sticker';
    if(pd){ sub='השלמתם את הדף "'+pd.name+'"! +150 ⭐'; voice='album'; } }
  else if(r.k==='deco'){ X.tokens.deco++; title='קישוט חינם!'; sub='בנו משהו בעיר המסיבה'; img=url('dec_arch'); }
  else if(r.k==='outfit'){ if(!S.owned.outfit.includes(r.id)){ S.owned.outfit.push(r.id); const o=D.OUTFITS.find(x=>x.id===r.id); title='בגד מיוחד!'; sub=o.name+' – בארון הבגדים'; sw=o.sw; voice='outfit'; } else { S.stars+=100; title='+100 ⭐'; img=starURL(); } }
  else if(r.k==='veh'){ if(!X.veh.owned.includes(r.id)){ X.veh.owned.push(r.id); X.veh.sel=r.id; const v=VEH.find(x=>x.id===r.id); title=v.name+'!'; sub='רכב קסם חדש – הקישו פעמיים במשחק'; img=vehIconURL(r.id); voice='vehicle'; } else { S.stars+=150; title='+150 ⭐'; img=starURL(); } }
  save(); K.updMenu&&K.updMenu(); badgeUpd();
  return {title,sub,img,sw,voice,shiny};
}
V.grant=grant;

/* ---------- reveal overlay ---------- */
const RQ=[]; let rvOn=false;
function reveal(o){ RQ.push(o); if(!rvOn) nextReveal(); }
function nextReveal(){
  const o=RQ.shift(); const el=$('#reveal'); if(!o){ rvOn=false; el.classList.add('hidden'); return; }
  rvOn=true; el.classList.remove('hidden'); el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  $('#rvTitle').textContent=o.title||''; $('#rvSub').textContent=o.sub||'';
  const im=$('#rvImg'); const sw=$('#rvSw'); const cv=$('#rvCanvas');
  im.classList.toggle('hidden',!o.img); if(o.img) im.src=o.img; im.classList.toggle('shiny',!!o.shiny);
  sw.classList.toggle('hidden',!o.sw); if(o.sw) sw.style.background=o.sw;
  cv.classList.toggle('hidden',!o.anim);
  $('#rvOk').classList.toggle('hidden',!!o.anim);
  A.sfx('confetti',.6); if(o.voice) setTimeout(()=>A.voice(o.voice),250);
  if(o.anim) o.anim(cv,()=>{ $('#rvOk').classList.remove('hidden'); });
  el._done=o.onClose;
}
$('#rvOk').addEventListener('click',()=>{ A.sfx('coin',.4,1.2); const f=$('#reveal')._done; $('#reveal')._done=null; if(f) f(); nextReveal(); });
V.reveal=reveal;

/* ======================= IN-RUN ======================= */
let giftCv=null;
function giftCanvas(){ if(giftCv) return giftCv; giftCv=K.mk(160,180,(g)=>{ const gr=g.createLinearGradient(0,40,0,180); gr.addColorStop(0,'#ffe066'); gr.addColorStop(1,'#ff9f1a'); g.fillStyle=gr; K.rrect(g,14,62,132,110,16); g.fill(); g.fillStyle='#ffcf3f'; K.rrect(g,6,42,148,34,12); g.fill();
  g.fillStyle='#9b59ff'; g.fillRect(66,42,28,130); g.fillStyle='#b67bff'; g.beginPath(); g.ellipse(56,28,30,18,-.5,0,TAU); g.ellipse(104,28,30,18,.5,0,TAU); g.fill(); g.fillStyle='#7b2ff2'; g.beginPath(); g.arc(80,38,11,0,TAU); g.fill();
  g.font='900 70px Rubik, sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=8; g.strokeStyle='#7b2ff2'; g.strokeText('?',80,122); g.fillStyle='#fff'; g.fillText('?',80,122);
  g.lineWidth=5; g.strokeStyle='#fff'; K.rrect(g,14,62,132,110,16); g.stroke(); }); return giftCv; }
V.onRunStart=function(R){
  const pet=activePet();
  R.v={pet:pet?pet.id:null,plv:pet?pet.lvl:1,shield:!!(pet&&pet.id==='unicorn'),shieldT:0,burnT:6,rides:1,ride:0,veh:X.veh.sel||'skate',gold:0,goldM:0,
    giftAt:R.levelLen*rnd(.22,.35),gift2At:R.levelLen*rnd(.6,.75),eggAt:(X.eggs.length<3&&Math.random()<.45)?R.levelLen*rnd(.4,.6):-1,
    holi:V.holiday(),lastTap:0,buddy:hasBuddy(),bt:0};
  if(pet) IP('pet_'+pet.id); if(R.v.veh==='cloud') IP('veh_cloud'); if(R.v.veh==='unicorn') IP('veh_unicorn'); if(R.v.buddy) IP('buddy_body');
  if(R.world.decor) R.world.decor.forEach(IP); if(R.v.holi) R.v.holi.items.forEach(n=>n!=='flag'&&IP(n));
  hudExtra(R);
};
V.decorPick=function(R){ const w=R.world; if(R.v&&R.v.holi&&Math.random()<.32){ const im=holiImg(pick(R.v.holi.items)); if(im) return {img:im,sc:.75}; }
  if(w.decor){ const im=I(pick(w.decor)); if(im) return {img:im,sc:1.05}; }
  return null; };
V.treatImg=function(R){ return R.v&&R.v.holi?I(R.v.holi.treat):null; };
V.spawn=function(R,addObj,FAR){
  const v=R.v; if(!v||R.ending||R.gate) return;
  const lane=pick([-1,0,1]);
  if(v.giftAt>0&&R.dist>v.giftAt){ v.giftAt=-1; addObj({k:'gift',x:lane,z:FAR-4,y:.35}); }
  if(v.gift2At>0&&R.dist>v.gift2At){ v.gift2At=-1; if(Math.random()<.6) addObj({k:'gift',x:lane,z:FAR-4,y:.35}); }
  if(v.eggAt>0&&R.dist>v.eggAt){ v.eggAt=-1; addObj({k:'egg',x:lane,z:FAR-4,y:.3,c:ri(0,4)}); }
};
V.collect=function(o,R){
  const px=K.sx(o.x,0), py=K.BASE-K.LW*1.6;
  if(o.k==='egg'){ if(addEgg()){ A.voice('egg_found'); K.floatText('ביצה קסומה!',px,py,'#ffe45c',34); } else { R.stars+=20; K.floatText('+20',px,py,'#ffe45c',34); } A.sfx('powerup',.8); K.confetti(px,py,40); return; }
  if(o.k==='gift'){ ev('gift',1); A.sfx('confetti',.7); K.confetti(px,py,50); A.voice('gift');
    const r=Math.random(); let txt;
    if(r<.45){ const n=ri(3,8)*5; R.stars+=n; txt='+'+n+' ⭐'; }
    else if(r<.75){ const g=grantSticker(); txt=g.shiny?'מדבקה נוצצת! ✨':'מדבקה חדשה!'; R.giftSt=(R.giftSt||0)+1; }
    else if(r<.88&&X.eggs.length<3){ addEgg(); txt='ביצה קסומה!'; }
    else { const t=pick(['magnet','fly','double']); K.activatePower(t); txt='כוח קסם!'; }
    K.floatText(txt,px,py,'#fff59a',32); K.updHud(); }
};
V.drawObj=function(o){
  const s=K.proj(o.z), px=K.LW*s, cx=K.sx(o.x,o.z), base=K.sy(o.z), ctx=K.ctx;
  if(o.k==='gift'){ const im=giftCanvas(); const h=px*.8, w=h*im.width/im.height, y=base-px*(.35+Math.sin(K.G.t*3)*.1);
    ctx.save(); ctx.globalAlpha=.5; const gl=ctx.createRadialGradient(cx,y-h/2,2,cx,y-h/2,h*.9); gl.addColorStop(0,'rgba(255,240,150,.9)'); gl.addColorStop(1,'rgba(255,240,150,0)'); ctx.fillStyle=gl; ctx.beginPath(); ctx.arc(cx,y-h/2,h*.9,0,TAU); ctx.fill(); ctx.restore();
    ctx.save(); ctx.translate(cx,y-h/2); ctx.rotate(Math.sin(K.G.t*4)*.12); ctx.drawImage(im,-w/2,-h/2,w,h); ctx.restore(); }
  else if(o.k==='egg'){ const im=eggImg(o.c); const h=px*.75, w=h*im.width/im.height, y=base-px*(.3+Math.abs(Math.sin(K.G.t*3))*.15);
    ctx.save(); ctx.globalAlpha=.55; ctx.fillStyle='#fff7b0'; ctx.beginPath(); ctx.arc(cx,y-h/2,h*.75,0,TAU); ctx.fill(); ctx.restore(); ctx.save(); ctx.translate(cx,y-h/2); ctx.rotate(Math.sin(K.G.t*5)*.15); ctx.drawImage(im,-w/2,-h/2,w,h); ctx.restore(); }
};
V.starMult=function(R,isCandy){ let m=1; if(R.v&&R.v.gold>0) m*=3; if(R.v&&R.v.pet==='bunny'&&Math.random()<.06+.03*R.v.plv){ m*=2; } return m; };
V.onStar=function(R,v,isCandy){ ev('star',v); if(isCandy) ev('candy',1); goldAdd(R,isCandy?5:1.5); };
function goldAdd(R,n){ const v=R.v; if(!v||v.gold>0) return; v.goldM=clamp(v.goldM+n,0,100); if(v.goldM>=100){ v.goldM=0; v.gold=8; A.setRate&&A.setRate(1.2); A.voice('gold'); A.sfx('powerup',.9); K.confetti(K.W/2,K.H*.4,60); K.floatText('קדחת זהב! ×3',K.W/2,K.H*.36,'#ffd23f',40); ev('gold',1); addXP(10); } goldHud(R); }
V.absorbCrash=function(o,R){
  const v=R.v; if(!v) return false; const px=K.sx(R.p.x,0), py=K.BASE-K.LW*1.5;
  if(v.ride>0){ v.ride=0; o.hit=true; A.voice('saved'); A.sfx('powerup',.7); K.sparkle(px,py,'#bff7ff',20); K.floatText('הרכב הציל!',px,py,'#bff7ff',32); hudExtra(R); return true; }
  if(v.shield){ v.shield=false; v.shieldT=Math.max(15,40-5*v.plv); o.hit=true; A.sfx('powerup',.6); K.sparkle(px,py,'#ffd0f0',20); K.floatText('החד-קרן הגן!',px,py,'#ffd0f0',30); return true; }
  return false;
};
V.onCrash=function(R){ if(R.v){ R.v.goldM=Math.max(0,R.v.goldM-40); goldHud(R); } };
V.powerDur=function(t,R){ let d=upDur(t); if(R.v&&R.v.pet==='panda') d*=1.2+.1*R.v.plv; ev('power',1); return d; };
V.onJump=function(){ ev('jump',1); };
V.tryRide=function(R){ const v=R&&R.v; if(!v||v.rides<=0||v.ride>0||R.ending>0) return false; v.rides--; v.ride=12; A.voice('vehicle'); A.sfx('powerup',.7); ev('ride',1); K.sparkle(K.sx(R.p.x,0),K.BASE-K.LW,'#fff59a',16); if(v.veh==='cloud') IP('veh_cloud'); if(v.veh==='unicorn') IP('veh_unicorn'); hudExtra(R); return true; };
V.updRun=function(R,dt,dz){
  const v=R.v; if(!v) return; v.bt+=dt;
  // egg incubation
  for(const e of X.eggs){ if(e.dist<e.need){ e.dist+=dz; if(e.dist>=e.need){ e.dist=e.need; K.toast('🥚 ביצה מוכנה לבקוע! בואו לבית החברים',2600); badgeUpd(); } } }
  if(v.holi&&v.holi.fireworks&&Math.random()<dt*1.4){ const x=rnd(K.W*.1,K.W*.9), y=rnd(K.HOR*.12,K.HOR*.75), c=pick(['#3f8cff','#ffffff','#ffd23f','#7fd0ff']); for(let i=0;i<22;i++) K.sparkle(x,y,c,1); }
  if(v.ride>0){ v.ride-=dt; if(v.ride<=0){ v.ride=0; hudExtra(R); } }
  if(v.gold>0){ v.gold-=dt; if(Math.random()<.5) K.sparkle(rnd(0,K.W),rnd(0,K.H*.7),'#ffe45c',1); if(v.gold<=0){ v.gold=0; A.setRate&&A.setRate(1); } goldHud(R); }
  if(!v.shield&&v.pet==='unicorn'){ v.shieldT-=dt; if(v.shieldT<=0) v.shield=true; }
  const p=R.p;
  if(v.pet==='dragon'){ v.burnT-=dt; if(v.burnT<=0){ const ob=R.objs.find(o=>!o.hit&&(o.k==='low'||o.k==='block'||o.k==='high')&&Math.abs(o.x-p.lane)<.5&&o.z>2&&o.z<13); if(ob){ ob.hit=true; ob.burn=1; v.burnT=Math.max(10,24-2*v.plv); const s=K.proj(ob.z); for(let i=0;i<14;i++) K.sparkle(K.sx(ob.x,ob.z)+rnd(-20,20),K.sy(ob.z)-K.LW*s*rnd(0,.8),pick(['#ff7a1a','#ffd23f','#ff3b4e']),2); K.floatText('אש של דרקון!',K.sx(ob.x,ob.z),K.sy(ob.z)-K.LW*s*1.4,'#ffb347',26); A.sfx('bump',.4,1.6); R.objs=R.objs.filter(o=>o!==ob); } else v.burnT=1; } }
  if(v.pet==='kitten'||v.pet==='phoenix'){ const reach=1.1+.08*v.plv; for(const o of R.objs){ if(o.k==='star'&&!o.hit&&o.z<9&&o.z>-.5&&Math.abs(o.x-p.x)<reach&&Math.abs(o.x-p.x)>.3){ o.x=lerp(o.x,p.x,Math.min(1,dt*5)); } } }
};
V.gateHint=function(R,i){ const v=R.v; if(!v||v.pet!=='puppy'||!R.gate) return 0; return (i===R.gate.q.correct&&R.gate.z<10+v.plv*3)?1:0; };
V.onGate=function(R,ok,q){
  const c=q.cat||'other'; const st=X.stats.cat[c]||(X.stats.cat[c]=[0,0]); st[1]++; if(ok) st[0]++; X.stats.gates[1]++; if(ok) X.stats.gates[0]++;
  if(ok){ ev('gateok',1); ev('streak',R.combo); goldAdd(R,30); addXP(5); } save();
};
V.onBattleEnd=function(R,win,perfect){ ev('perfect',perfect); if(win){ ev('battlewin',1); addXP(20); } };

/* ---------- photo / buddy ---------- */
const PHOTO_KEY='efratushka_photo';
let PHOTO=null, faceCv=null;
function loadPhoto(){ let d=null; try{ d=localStorage.getItem(PHOTO_KEY); }catch(e){} faceCv=null; if(!d||!/^data:image\/(jpeg|png|webp);base64,/.test(d)){ PHOTO=null; return Promise.resolve(null); } return K.loadImg(d).then(i=>{ PHOTO=i; faceCv=null; return i; }); }
V.loadPhoto=loadPhoto;
function hasPhoto(){ return !!PHOTO; }
function hasBuddy(){ return !!PHOTO&&X.profile.buddy!==false; }
V.hasPhoto=hasPhoto; V.hasBuddy=hasBuddy;
function face(){ if(!PHOTO) return null; if(faceCv) return faceCv; faceCv=K.mk(256,300,(g)=>{ const c=128, r=112;
  // star crest (helmet)
  g.fillStyle='#ffd23f'; K.starPath(g,c,30,30,13,5); g.fill(); g.lineWidth=4; g.strokeStyle='#ff9800'; g.stroke();
  g.save(); g.beginPath(); g.arc(c,c+40,r,0,TAU); g.clip(); g.drawImage(PHOTO,c-r,c+40-r,r*2,r*2); g.restore();
  const gr=g.createLinearGradient(0,40,0,300); gr.addColorStop(0,'#ffe066'); gr.addColorStop(1,'#ff9f1a'); g.lineWidth=16; g.strokeStyle=gr; g.beginPath(); g.arc(c,c+40,r,0,TAU); g.stroke();
  g.lineWidth=4; g.strokeStyle='#fff'; g.beginPath(); g.arc(c,c+40,r+9,0,TAU); g.stroke(); }); return faceCv; }
V.face=face;
function drawFace(g,cx,cy,d){ const f=face(); if(!f) return; const h=d*300/256; g.drawImage(f,cx-d/2,cy-h*.6,d,h); }
V.drawFace=drawFace;
function drawBuddy(g,cx,by,h,t,dance){
  const f=face(); if(!f) return; const body=I('buddy_body');
  g.save(); g.translate(cx,by);
  if(dance){ g.rotate(Math.sin(t*7)*.14); g.translate(0,-Math.abs(Math.sin(t*7))*h*.05); }
  const bh=h*.66; let bw=bh*.8;
  if(body){ bw=bh*body.width/body.height; g.drawImage(body,-bw/2,-bh,bw,bh); }
  const d=bw*.62; drawFace(g,0,-bh-d*.18,d);
  g.restore();
}
V.drawBuddy=drawBuddy;
V.drawCompanions=function(R){
  const ctx=K.ctx, p=R.p, t=K.G.t, LW=K.LW, v=R.v; if(!v) return;
  const lift=(p.y+p.flyY)*LW*.55;
  if(v.pet){ const im=I('pet_'+v.pet); if(im){ const def=petDef(v.pet); const z=-.25, s=K.proj(z), px=LW*s; const cx=K.sx(p.x+.78,z), base=K.sy(z);
    const h=px*(.78+.04*v.plv); const w=h*im.width/im.height; let y=base, sy=1;
    if(def.fly){ y=base-px*(.85+Math.sin(t*3)*.12); sy=1+Math.sin(t*16)*.07; } else { const b=Math.abs(Math.sin(t*10+1)); y=base-b*px*.22; sy=1-.06+b*.1; }
    ctx.fillStyle='rgba(60,0,60,.18)'; ctx.beginPath(); ctx.ellipse(cx,base,w*.32,px*.07,0,0,TAU); ctx.fill();
    ctx.save(); ctx.translate(cx,y-lift*.3); ctx.scale(1/Math.sqrt(sy),sy); ctx.drawImage(im,-w/2,-h,w,h); ctx.restore();
    if(v.shield&&v.pet==='unicorn'){ ctx.strokeStyle=`rgba(255,160,230,${.35+.2*Math.sin(t*6)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(K.sx(p.x,0),K.BASE-LW*1.0-(p.y+p.flyY)*LW,LW*1.05,0,TAU); ctx.stroke(); }
  } }
  if(v.buddy){ const z=-.25, s=K.proj(z), px=LW*s; const cx=K.sx(p.x-.8,z), base=K.sy(z); const b=Math.abs(Math.sin(t*10)); const h=px*1.55;
    ctx.fillStyle='rgba(60,0,60,.18)'; ctx.beginPath(); ctx.ellipse(cx,base,px*.3,px*.07,0,0,TAU); ctx.fill();
    ctx.save(); ctx.translate(cx,base-b*px*.18-lift*.3); ctx.rotate(Math.sin(t*10)*.05); drawBuddy(ctx,0,0,h,t,false); ctx.restore(); }
};
/* vehicle under/around runner; ctx is translated to runner feet */
V.rideOn=R=>!!(R&&R.v&&R.v.ride>0);
V.drawVehicle=function(ctx,hpx,R){
  const v=R.v, t=K.G.t, blink=v.ride<2&&Math.floor(t*8)%2===0;
  if(blink) ctx.globalAlpha=.55;
  if(v.veh==='skate'||v.veh==='skates'){ const im=vehCanvas(v.veh); const w=hpx*(v.veh==='skate'?.5:.42), h=w*im.height/im.width; ctx.drawImage(im,-w/2,-h*.55,w,h); ctx.globalAlpha=1; return {lift:h*.45}; }
  if(v.veh==='cloud'){ const im=I('veh_cloud'); if(!im){ ctx.globalAlpha=1; return {lift:0}; } const w=hpx*.6, h=w*im.height/im.width; const by=Math.sin(t*3)*hpx*.02; ctx.globalAlpha=1; return {lift:hpx*.2-by,front:()=>{ if(blink) ctx.globalAlpha=.55; ctx.drawImage(im,-w/2,-h*.42+by,w,h); ctx.globalAlpha=1; }}; }
  if(v.veh==='unicorn'){ const im=I('veh_unicorn'); if(!im){ ctx.globalAlpha=1; return {lift:0}; } const h=hpx*.95, w=h*im.width/im.height; const b=Math.abs(Math.sin(t*9))*hpx*.03; ctx.drawImage(im,-w/2,-h-b,w,h); ctx.globalAlpha=1; return {lift:h*.5+b,frame:'duck',scale:.62}; }
  ctx.globalAlpha=1; return {lift:0};
};
V.postRender=function(R){
  const v=R.v; if(!v||v.gold<=0) return; const ctx=K.ctx; const a=Math.min(1,v.gold/0.6,(8-v.gold)/0.4+.2);
  ctx.save(); ctx.globalAlpha=.55*clamp(a,0,1); ctx.globalCompositeOperation='color'; ctx.fillStyle='#ffc21a'; ctx.fillRect(0,0,K.W,K.H); ctx.globalCompositeOperation='soft-light'; ctx.globalAlpha=.35*clamp(a,0,1); ctx.fillStyle='#fff3b0'; ctx.fillRect(0,0,K.W,K.H); ctx.restore();
  ctx.save(); ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='#8a4b00'; ctx.fillStyle='#fff3b0';
  ctx.direction='rtl'; ctx.font='900 26px Rubik, sans-serif'; ctx.strokeText('קדחת זהב!',K.W/2,K.H*.22); ctx.fillText('קדחת זהב!',K.W/2,K.H*.22);
  ctx.direction='ltr'; const sc=1+.08*Math.sin(K.G.t*10); ctx.translate(K.W/2,K.H*.27); ctx.scale(sc,sc); ctx.font='900 34px Rubik, sans-serif'; ctx.strokeText('×3',0,0); ctx.fillText('×3',0,0); ctx.restore();
};
function goldHud(R){ const f=$('#goldFill'); if(!f||!R.v) return; f.style.width=(R.v.gold>0?R.v.gold/8*100:R.v.goldM)+'%'; $('#goldBar').classList.toggle('on',R.v.gold>0); }
function hudExtra(R){ const b=$('#btnRide'); if(!b) return; const v=R.v; b.classList.toggle('hidden',!v||(v.rides<=0&&v.ride<=0)); if(v){ b.classList.toggle('active',v.ride>0); $('#rideImg').src=vehIconURL(v.veh); } goldHud(R); }
V.hud=hudExtra;

/* ======================= MENU ======================= */
const params=new URLSearchParams(location.search);
let CH=null; (function(){ const sc=parseInt(params.get('challenge'),10); if(sc>0&&sc<100000){ CH={score:sc,from:K.cleanName(params.get('from'))||'חבר/ה',done:false}; } })();
V.CH=()=>CH;
function canClaimJourney(){ ensureWeek(); return X.journey.claimed<Math.min(30,Math.floor(X.journey.xp/TIERXP)); }
function eggReady(){ return X.eggs.some(e=>e.dist>=e.need); }
function wheelReady(){ return X.wheel.last!==today(); }
function badgeUpd(){
  const set=(id,on)=>{ const el=document.querySelector('#'+id+' .dot'); if(el) el.classList.toggle('hidden',!on); };
  ensureMissions(); set('tMissions',X.missions.list.some(m=>m.done&&!m.claimed)); set('tJourney',canClaimJourney()); set('tPets',eggReady()); set('tWheel',wheelReady());
}
V.badgeUpd=badgeUpd;
function avatarUpd(){ const a=$('#avImg'); if(!a) return; a.innerHTML=''; const f=face();
  if(f){ const c=document.createElement('canvas'); c.width=96; c.height=112; c.getContext('2d').drawImage(f,0,0,96,112); a.appendChild(c); }
  else { const nm=X.profile.name||''; a.textContent=nm?nm[0]:'★'; }
  $('#avName').textContent=X.profile.name||'הפרופיל שלי'; }
V.avatarUpd=avatarUpd;
function worldUnlocked(id){ return X.worlds.includes(id); }
V.worldOf=function(level){ const list=D.WORLDS.filter(w=>worldUnlocked(w.id)); if(X.worldSel&&worldUnlocked(X.worldSel)) return D.WORLDS.find(w=>w.id===X.worldSel); return list[(level-1)%list.length]; };
V.worldCount=()=>D.WORLDS.filter(w=>worldUnlocked(w.id)).length;
function worldPick(){ const el=$('#worldPick'); if(!el) return; el.innerHTML='';
  const mkb=(id,label,locked)=>{ const b=document.createElement('button'); b.className='wchip'+((X.worldSel||'')===id?' on':'')+(locked?' locked':''); b.textContent=(locked?'🔒 ':'')+label; b.addEventListener('click',()=>{ if(locked){ K.toast('פתחו את העולם הזה בעיר המסיבה 🏰'); A.sfx('wrong',.3); return; } X.worldSel=id; save(); A.sfx('coin',.4,1.2); worldPick(); K.updMenu(); }); el.appendChild(b); };
  mkb('','🔀 כל העולמות',false); D.WORLDS.forEach(w=>mkb(w.id,w.name,!worldUnlocked(w.id))); }
let starterShown=false;
function preloadAll(){ const h=V.holiday(); if(h) h.items.forEach(n=>n!=='flag'&&IP(n)); D.WORLDS.forEach(w=>{ if(w.decor&&worldUnlocked(w.id)) w.decor.forEach(IP); }); const ap=activePet(); if(ap) IP('pet_'+ap.id); if(hasBuddy()) IP('buddy_body'); if(X.veh.sel==='cloud') IP('veh_cloud'); if(X.veh.sel==='unicorn') IP('veh_unicorn'); }
V.menuUpd=function(){
  setTimeout(preloadAll,400);
  ensureMissions(); ensureWeek(); badgeUpd(); avatarUpd(); worldPick();
  const cb=$('#chalBanner'); if(CH&&!CH.done){ cb.classList.remove('hidden'); cb.textContent='⚔ '+CH.from+' מאתגר/ת אתכם: אספו יותר מ-'+CH.score+' ⭐ בשלב אחד!'; } else cb.classList.add('hidden');
  const hb=$('#holiBanner'), h=V.holiday(); if(h){ hb.classList.remove('hidden'); hb.innerHTML=''; h.items.forEach(n=>{ if(n==='flag'){ const c=document.createElement('img'); c.src=flagCanvas().toDataURL(); hb.appendChild(c); } else { const im=document.createElement('img'); im.src=url(n); im.alt=''; hb.appendChild(im); } }); const s=document.createElement('span'); s.textContent=h.greet; hb.appendChild(s); } else hb.classList.add('hidden');
  if(!X.started&&!starterShown&&$('#scrMenu').classList.contains('show')){ starterShown=true; setTimeout(()=>{ if(!$('#scrMenu').classList.contains('show')) { starterShown=false; return; } X.started=true; addEgg(300); save(); badgeUpd(); reveal({title:'מתנה ראשונה: ביצה קסומה!',sub:'רוצו במסלול והיא תבקע לחבר קסם',img:eggImg(X.eggs[0]?X.eggs[0].c:0).toDataURL(),voice:'egg_found'}); },900); }
};
V.onMenu=function(){
  const h=V.holiday(); if(h&&X.holiSeen!==today()){ X.holiSeen=today(); save(); setTimeout(()=>{ if(K.G.state==='menu') A.voice(h.voice); },2600); }
  if(limitReached()){ setTimeout(showRest,300); }
};

/* ======================= SCREENS ======================= */
function el(tag,cls,txt){ const e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
function imgEl(src,cls){ const i=document.createElement('img'); i.src=src; i.alt=''; if(cls) i.className=cls; i.draggable=false; return i; }
function open(id,state){ K.scr(id); K.G.state=state||'menu'; }

/* ----- missions & journey ----- */
let qTab='m';
function questScreen(tab){ qTab=tab||qTab; open('scrQuest'); renderQuest(); }
function renderQuest(){
  ensureMissions(); ensureWeek();
  document.querySelectorAll('.qtab').forEach(t=>t.classList.toggle('on',t.dataset.q===qTab));
  $('#qMissions').classList.toggle('hidden',qTab!=='m'); $('#qJourney').classList.toggle('hidden',qTab!=='j');
  const box=$('#qMissions'); box.innerHTML='';
  X.missions.list.forEach((m,i)=>{ const c=el('div','mcard'+(m.claimed?' claimed':m.done?' done':'')); c.appendChild(el('div','mtxt',mText(m)));
    const bar=el('div','mbar2'); const f=el('i'); f.style.width=(100*m.prog/m.goal)+'%'; bar.appendChild(f); const n=el('b',null,m.prog+'/'+m.goal); n.dir='ltr'; bar.appendChild(n); c.appendChild(bar);
    if(m.done&&!m.claimed){ const b=el('button','btn mid green mclaim','קבלו פרס ⭐'); b.id='mClaim'+i; b.addEventListener('click',()=>{ m.claimed=true; S.stars+=30; save(); A.sfx('confetti',.7); K.confetti(K.W/2,K.H*.4,50); K.toast('+30 ⭐ · +100 נקודות מסע',2200); addXP(100); renderQuest(); K.updMenu(); }); c.appendChild(b); }
    else c.appendChild(el('div','mstate',m.claimed?'✔ התקבל':'פרס: 30 ⭐ + 100 נקודות מסע'));
    box.appendChild(c); });
  box.appendChild(el('p','sub','משימות חדשות מחכות כל יום 🌈'));
  // journey
  const xp=X.journey.xp, reached=Math.min(30,Math.floor(xp/TIERXP));
  $('#jTier').textContent='דרגה '+reached+' מתוך 30';
  $('#jFill').style.width=(reached>=30?100:(xp%TIERXP)/TIERXP*100)+'%';
  const d=new Date(); const left=7-d.getDay(); $('#jReset').textContent='מסע חדש מתחיל ביום ראשון'+(left<7?' (בעוד '+left+' ימים)':'');
  const list=$('#jList'); list.innerHTML='';
  JR.forEach((r,i)=>{ const info=rewardInfo(r); const st=i<X.journey.claimed?'got':i<reached?'ready':'lock';
    const b=el('button','jnode '+st); b.id='jNode'+i; b.appendChild(el('b','jn',String(i+1)));
    if(info.img) b.appendChild(imgEl(info.img)); else { const sw=el('div','jsw'); sw.style.background=info.sw; b.appendChild(sw); }
    b.appendChild(el('span',null,info.t));
    if(st==='ready'&&i===X.journey.claimed) b.classList.add('next');
    b.addEventListener('click',()=>{ if(st==='ready'&&i===X.journey.claimed){ X.journey.claimed++; save(); const g=grant(r); g.voice='journey'; reveal(g); renderQuest(); }
      else if(st==='ready') K.toast('אספו קודם את הפרס הקודם 🙂'); else if(st==='lock') K.toast('צריך עוד '+(TIERXP*(i+1)-xp)+' נקודות מסע'); });
    list.appendChild(b); });
  setTimeout(()=>{ const n=list.querySelector('.next')||list.children[Math.max(0,X.journey.claimed-1)]; if(n&&qTab==='j') n.scrollIntoView({block:'nearest',inline:'center'}); },60);
}
document.querySelectorAll('.qtab').forEach(t=>t.addEventListener('click',()=>{ qTab=t.dataset.q; A.sfx('coin',.3,1.2); renderQuest(); }));

/* ----- pets ----- */
let petView=null, petPatT=0;
function petsScreen(){ open('scrPets'); if(!petView) petView=X.pets.active||(X.pets.owned[0]&&X.pets.owned[0].id); PETS.forEach(p=>IP('pet_'+p.id)); renderPets(); }
function renderPets(){
  $('#pStars').textContent='⭐ '+S.stars;
  const pv=X.pets.owned.find(p=>p.id===petView);
  const big=$('#petBig'), info=$('#petInfo');
  if(pv){ const d=petDef(pv.id); big.src=url('pet_'+pv.id); big.classList.remove('hidden'); $('#petEmpty').classList.add('hidden');
    info.innerHTML=''; info.appendChild(el('b',null,d.name+' · רמה '+pv.lvl)); info.appendChild(el('div',null,'כוח: '+d.abTxt));
    const bar=el('div','mbar2'); const f=el('i'); f.style.width=(pv.lvl>=5?100:pv.xp)+'%'; bar.appendChild(f); bar.appendChild(el('b',null,pv.lvl>=5?'רמה מקסימלית':'גדל: '+pv.xp+'/100')); info.appendChild(bar);
    $('#petFeed').disabled=pv.lvl>=5; $('#petSel').textContent=X.pets.active===pv.id?'✔ רץ איתי':'🏃 שיצטרף לריצה'; $('#petSel').classList.toggle('green',X.pets.active===pv.id); $('#petRow').classList.remove('hidden'); }
  else { big.classList.add('hidden'); $('#petEmpty').classList.remove('hidden'); info.innerHTML=''; $('#petRow').classList.add('hidden'); }
  const pl=$('#petList'); pl.innerHTML='';
  PETS.forEach(p=>{ const o=X.pets.owned.find(x=>x.id===p.id); const b=el('button','pitem'+(o?'':' locked')+(petView===p.id?' sel':'')); b.appendChild(imgEl(url('pet_'+p.id))); b.appendChild(el('span',null,o?p.name:'???'));
    if(o&&X.pets.active===p.id) b.appendChild(el('i','run','🏃'));
    b.addEventListener('click',()=>{ if(!o){ K.toast('בקעו ביצה כדי לפגוש חברים חדשים 🥚'); return; } petView=p.id; A.sfx('coin',.3,1.2); renderPets(); }); pl.appendChild(b); });
  const eg=$('#eggList'); eg.innerHTML='';
  if(!X.eggs.length) eg.appendChild(el('p','sub','אין ביצים כרגע – חפשו ביצים זוהרות במסלול!'));
  X.eggs.forEach((e,i)=>{ const c=el('div','eitem'); const im=eggImg(e.c,e.dist>=e.need); c.appendChild(imgEl(im.toDataURL())); const ready=e.dist>=e.need;
    if(ready){ const b=el('button','btn mid pink','✨ בקיעה!'); b.id='hatch'+i; b.addEventListener('click',()=>hatch(i)); c.appendChild(b); }
    else { const bar=el('div','mbar2'); const f=el('i'); f.style.width=(100*e.dist/e.need)+'%'; bar.appendChild(f); const t=el('b',null,Math.floor(e.dist)+'/'+e.need+' מ׳'); bar.appendChild(t); c.appendChild(bar); c.appendChild(el('small',null,'רוצו כדי לחמם את הביצה')); }
    eg.appendChild(c); });
}
$('#petBig').addEventListener('click',(e)=>{ const pv=X.pets.owned.find(p=>p.id===petView); if(!pv) return; const now=performance.now();
  const st=$('#petStage'); for(let i=0;i<5;i++){ const h=el('i','heart','💗'); h.style.left=(30+Math.random()*40)+'%'; h.style.animationDelay=(i*.08)+'s'; st.appendChild(h); setTimeout(()=>h.remove(),1400); }
  $('#petBig').classList.remove('wiggle'); void $('#petBig').offsetWidth; $('#petBig').classList.add('wiggle');
  if(now-petPatT>1500){ petPatT=now; A.voice('pet_love'); ev('pet',1); petXP(pv,2); } else A.sfx('coin',.3,1.5); });
function petXP(pv,n){ if(pv.lvl>=5) return; pv.xp+=n; if(pv.xp>=100){ pv.xp-=100; pv.lvl++; if(pv.lvl>=5) pv.xp=100; save(); reveal({title:petDef(pv.id).name+' עלה לרמה '+pv.lvl+'!',sub:'הכוח שלו התחזק',img:url('pet_'+pv.id),voice:'pet_level'}); } save(); renderPets(); }
$('#petFeed').addEventListener('click',()=>{ const pv=X.pets.owned.find(p=>p.id===petView); if(!pv) return; if(S.stars<20){ K.toast('צריך 20 ⭐ כדי להאכיל'); A.sfx('wrong',.4); return; } S.stars-=20; A.sfx('coin',.5,.9); ev('pet',1); const st=$('#petStage'); const f=el('i','heart','🍓'); f.style.left='50%'; st.appendChild(f); setTimeout(()=>f.remove(),1400); petXP(pv,25); K.updMenu(); });
$('#petSel').addEventListener('click',()=>{ if(!petView) return; X.pets.active=X.pets.active===petView?null:petView; save(); A.sfx('coin',.4,1.2); if(X.pets.active) A.voice('p_'+X.pets.active); renderPets(); });
function hatch(i){
  const e=X.eggs[i]; if(!e||e.dist<e.need) return; X.eggs.splice(i,1); X.hatched++;
  const un=PETS.filter(p=>!p.ex&&!X.pets.owned.find(o=>o.id===p.id)); let pid=null;
  if(un.length){ pid=pick(un).id; X.pets.owned.push({id:pid,lvl:1,xp:0}); if(!X.pets.active) X.pets.active=pid; petView=pid; } else { S.stars+=60; const o=pick(X.pets.owned); petXP(o,50); }
  save(); badgeUpd(); IP('pet_'+(pid||'unicorn'));
  A.voice('hatch');
  const fT=pid?'הביצה בקעה!':'הביצה בקעה! +60 ⭐', fS=pid?'חבר קסם חדש: '+petDef(pid).name:'כל החברים כבר אצלכם';
  reveal({title:'הביצה בוקעת…',sub:'✨ ✨ ✨',voice:null,anim:(cv,done)=>hatchAnim(cv,e.c,pid,()=>{ $('#rvTitle').textContent=fT; $('#rvSub').textContent=fS; done(); }),onClose:()=>{ renderPets(); }});
  renderPets();
}
function hatchAnim(cv,ci,pid,done){
  const g=cv.getContext('2d'), W=cv.width, H=cv.height; const t0=performance.now(); let petImg=null; IP('pet_'+(pid||'unicorn')).then(i=>petImg=i); const sp=[];
  const step=()=>{ const t=(performance.now()-t0)/1000; g.clearRect(0,0,W,H);
    if(t<2.1){ const wob=Math.sin(t*(8+t*10))*Math.min(.35,t*.2); const im=eggImg(ci,t>1.3); g.save(); g.translate(W/2,H*.82); g.rotate(wob); const h=H*.62, w=h*im.width/im.height; g.drawImage(im,-w/2,-h,w,h); g.restore(); if(t>1.3&&Math.random()<.5) sp.push({x:W/2+rnd(-60,60),y:H*.5+rnd(-60,60),a:1}); }
    else { const u=Math.min(1,(t-2.1)/.5); if(t<2.5){ g.fillStyle=`rgba(255,255,230,${1-(t-2.1)/.4})`; g.fillRect(0,0,W,H); } if(!sp.boom){ sp.boom=1; for(let k=0;k<30;k++) sp.push({x:W/2,y:H*.55,vx:rnd(-200,200),vy:rnd(-220,120),a:1}); A.sfx('confetti',.8); if(pid) setTimeout(()=>A.voice('p_'+pid),200); }
      if(petImg){ const s=ease(u)*(1+.06*Math.sin(t*6)); const h=H*.8*s, w=h*petImg.width/petImg.height; g.drawImage(petImg,W/2-w/2,H*.92-h,w,h); } }
    for(const p of sp){ if(p.vx){ p.x+=p.vx/60; p.y+=p.vy/60; p.vy+=6; } p.a-=.02; if(p.a>0){ g.globalAlpha=p.a; g.fillStyle=pick(['#ffe45c','#ff9ad5','#9ff7ff','#fff']); K.starPath(g,p.x,p.y,8,3.5,5); g.fill(); g.globalAlpha=1; } }
    if(t<3.4) requestAnimationFrame(step); else done(); };
  requestAnimationFrame(step);
}

/* ----- shop ----- */
let shopTab='upg';
function shopScreen(){ open('scrShop'); IP('veh_cloud'); IP('veh_unicorn'); renderShop(); }
function renderShop(){
  $('#sStars').textContent='⭐ '+S.stars; document.querySelectorAll('.stab').forEach(t=>t.classList.toggle('on',t.dataset.s===shopTab));
  const box=$('#shopList'); box.innerHTML='';
  if(shopTab==='upg'){ UPG.forEach(u=>{ const lv=X.upg[u.id]||0; const c=el('div','scard'); const ic=K.P['pw_'+u.id]; if(ic) c.appendChild(imgEl(ic.toDataURL()));
      const mid=el('div','smid'); mid.appendChild(el('b',null,u.name)); const dots=el('div','dots'); for(let i=0;i<5;i++) dots.appendChild(el('i',i<lv?'on':'')); mid.appendChild(dots); mid.appendChild(el('small',null,'משך: '+upDur(u.id).toFixed(1)+' שניות')); c.appendChild(mid);
      const b=el('button','btn mid '+(lv>=5?'gray':'pink'),lv>=5?'מקסימום':'⭐ '+UPCOST[lv]); b.id='up_'+u.id; b.addEventListener('click',()=>{ if(lv>=5) return; const cost=UPCOST[lv]; if(S.stars<cost){ K.toast('צריך עוד '+(cost-S.stars)+' ⭐'); A.sfx('wrong',.4); return; } S.stars-=cost; X.upg[u.id]=lv+1; save(); A.voice('upgrade'); A.sfx('powerup',.7); K.confetti(K.W/2,K.H*.4,40); renderShop(); K.updMenu(); }); c.appendChild(b); box.appendChild(c); }); }
  else { VEH.forEach(v=>{ const own=X.veh.owned.includes(v.id), sel=X.veh.sel===v.id; const c=el('div','scard'+(sel?' sel':'')); c.appendChild(imgEl(vehIconURL(v.id)));
      const mid=el('div','smid'); mid.appendChild(el('b',null,v.name)); mid.appendChild(el('small',null,'מציל מהתנגשות אחת · 12 שניות')); c.appendChild(mid);
      const b=el('button','btn mid '+(sel?'green':own?'purple':'pink'),sel?'✔ נבחר':own?'בחירה':(v.price+' ⭐')); b.id='veh_'+v.id;
      b.addEventListener('click',()=>{ if(!own){ if(S.stars<v.price){ K.toast('צריך עוד '+(v.price-S.stars)+' ⭐ (או במסע הכוכבים)'); A.sfx('wrong',.4); return; } S.stars-=v.price; X.veh.owned.push(v.id); A.voice('vehicle'); K.confetti(K.W/2,K.H*.4,40); } X.veh.sel=v.id; save(); A.sfx('coin',.4,1.2); renderShop(); K.updMenu(); }); c.appendChild(b); box.appendChild(c); });
    box.appendChild(el('p','sub','במשחק: הקישו פעמיים על המסך (או על כפתור הרכב) כדי לרכוב!')); }
}
document.querySelectorAll('.stab').forEach(t=>t.addEventListener('click',()=>{ shopTab=t.dataset.s; A.sfx('coin',.3,1.2); renderShop(); }));

/* ----- album ----- */
let albPage=0;
function albumScreen(){ open('scrAlbum'); renderAlbum(); }
function renderAlbum(){
  const tabs=$('#albTabs'); tabs.innerHTML='';
  PAGES.forEach((p,i)=>{ const n=p.items.filter(x=>X.stickers.have[x]).length; const b=el('button','atab'+(i===albPage?' on':'')+(n===8?' full':''),p.name+' '+n+'/8'); b.addEventListener('click',()=>{ albPage=i; A.sfx('coin',.3,1.2); renderAlbum(); }); tabs.appendChild(b); });
  const p=PAGES[albPage], grid=$('#albGrid'); grid.innerHTML='';
  p.items.forEach(id=>{ const h=X.stickers.have[id]||0; const c=el('div','stk'+(h?' have':'')+(h===2?' shiny':'')); const u=stickerURL(id); if(u) c.appendChild(imgEl(u)); if(!h) c.appendChild(el('b',null,'?')); grid.appendChild(c); });
  const tot=Object.keys(X.stickers.have).length, sh=Object.values(X.stickers.have).filter(v=>v===2).length;
  $('#albInfo').textContent=X.stickers.pages.includes(p.id)?'✔ הדף הושלם! קיבלתם 150 ⭐':'השלימו את הדף וקבלו 150 ⭐ · סה״כ '+tot+'/48 · נוצצות: '+sh;
}

/* ----- lucky wheel ----- */
const WSEG=[{k:'stars',n:20,c:'#ff6fc8',w:20},{k:'egg',c:'#ffd23f',w:8},{k:'stars',n:50,c:'#3fd4ff',w:14},{k:'stickers',n:2,c:'#9b59ff',w:14},{k:'stars',n:10,c:'#2ecc55',w:20},{k:'deco',c:'#ff7a59',w:8},{k:'stars',n:100,c:'#ff3b4e',w:6},{k:'shiny',c:'#2f7bff',w:10}];
let wAng=0, wSpin=null;
function wheelScreen(){ open('scrWheel'); IP('dec_arch'); IP('wd_starlamp'); IP('dec_balloon'); renderWheel(); drawWheel(); if(wheelReady()) A.voice('wheel'); }
function renderWheel(){ const r=wheelReady(); $('#wheelSpin').disabled=!r||!!wSpin; $('#wheelSpin').textContent=r?'🎡 סובבו!':'סובבתם היום ✔'; $('#wheelInfo').textContent=r?'סיבוב חינם אחד בכל יום':'חוזרים מחר לסיבוב נוסף 🌙'; }
function segIcon(s){ if(s.k==='stars') return K.P.star; if(s.k==='egg') return eggImg(2); if(s.k==='stickers') return I('dec_balloon'); if(s.k==='deco') return I('dec_arch'); if(s.k==='shiny') return I('wd_starlamp'); return null; }
function drawWheel(){ const cv=$('#wheelCv'); if(!cv) return; const g=cv.getContext('2d'), W=cv.width, c=W/2, r=c-8, n=WSEG.length; g.clearRect(0,0,W,W);
  g.save(); g.translate(c,c); g.rotate(wAng);
  WSEG.forEach((s,i)=>{ const a0=i*TAU/n-Math.PI/2-TAU/n/2, a1=a0+TAU/n; g.fillStyle=s.c; g.beginPath(); g.moveTo(0,0); g.arc(0,0,r,a0,a1); g.closePath(); g.fill(); g.strokeStyle='#fff'; g.lineWidth=4; g.stroke();
    const am=(a0+a1)/2; g.save(); g.rotate(am+Math.PI/2); const ic=segIcon(s); if(ic){ const h=r*.26, w=h*ic.width/ic.height; g.drawImage(ic,-w/2,-r*.86,w,h); }
    g.font='900 '+Math.round(r*.12)+'px Rubik, sans-serif'; g.textAlign='center'; g.fillStyle='#fff'; g.lineWidth=4; g.strokeStyle='rgba(60,0,60,.6)'; const tx=s.k==='stars'?String(s.n):s.k==='egg'?'ביצה':s.k==='stickers'?'מדבקות':s.k==='deco'?'קישוט':'נוצצת'; g.strokeText(tx,0,-r*.47); g.fillText(tx,0,-r*.47); g.restore(); });
  g.restore(); g.lineWidth=10; g.strokeStyle='#ffcf3f'; g.beginPath(); g.arc(c,c,r,0,TAU); g.stroke();
  for(let i=0;i<16;i++){ const a=i*TAU/16; g.fillStyle=(Math.floor(K.G.t*4)+i)%2?'#fff':'#ff4fa8'; g.beginPath(); g.arc(c+Math.cos(a)*r,c+Math.sin(a)*r,5,0,TAU); g.fill(); }
  g.fillStyle='#fff'; g.beginPath(); g.arc(c,c,r*.16,0,TAU); g.fill(); g.fillStyle='#ff4fa8'; K.starPath(g,c,c,r*.12,r*.05,5); g.fill();
  g.fillStyle='#d4157f'; g.beginPath(); g.moveTo(c-16,2); g.lineTo(c+16,2); g.lineTo(c,34); g.closePath(); g.fill(); g.strokeStyle='#fff'; g.lineWidth=3; g.stroke(); }
$('#wheelSpin').addEventListener('click',()=>{ if(!wheelReady()||wSpin) return; A.unlock();
  const tot=WSEG.reduce((a,s)=>a+s.w,0); let r=Math.random()*tot, idx=0; for(let i=0;i<WSEG.length;i++){ r-=WSEG[i].w; if(r<=0){ idx=i; break; } }
  X.wheel.last=today(); save(); renderWheel();
  const n=WSEG.length, target=-idx*TAU/n+rnd(-.3,.3)*TAU/n; const start=wAng%TAU;
  const from=start, to=target-TAU*6; const t0=performance.now(), dur=4200; let lastTick=0;
  wSpin={}; const st=()=>{ const u=Math.min(1,(performance.now()-t0)/dur); wAng=from+(to-from)*(1-Math.pow(1-u,4)); const seg=Math.floor(((wAng/(TAU/n))%n+n)%n); if(seg!==lastTick){ lastTick=seg; A.sfx('coin',.25,1.6); } drawWheel(); if(u<1) requestAnimationFrame(st); else { wSpin=null; const s=WSEG[idx]; const g=grant(s.k==='stars'?{k:'stars',n:s.n}:s); g.voice=g.voice&&g.voice!=='lucky'?g.voice:'lucky'; K.confetti(K.W/2,K.H*.4,60); reveal(g); renderWheel(); K.updMenu(); } };
  requestAnimationFrame(st); });

/* ----- party city ----- */
const CITY=[
 {map:'map1',name:'כיכר הממתקים',world:'beach',items:['dec_castle','dec_cupcake','dec_carousel','dec_choco','dec_cotton'],price:[30,45,60,80,100],plots:[[.22,.20],[.79,.20],[.50,.43],[.22,.70],[.79,.70]]},
 {map:'map2',name:'איי הבלונים',world:'forest',items:['dec_balloon','dec_ferris','dec_slide','dec_bouncy','dec_arch'],price:[60,80,100,120,150],plots:[[.28,.13],[.77,.25],[.27,.45],[.76,.585],[.45,.80]]},
 {map:'map3',name:'רחבת הדיסקו',world:'space',items:['dec_stage','dec_discotower','dec_dj','dec_cake','dec_truck'],price:[90,110,130,160,200],plots:[[.51,.21],[.24,.39],[.75,.44],[.25,.67],[.74,.77]]},
];
let cs=0; const grayC={}; const grow={};
const built=(s,i)=>!!X.city.built[s+'-'+i];
const stageDone=s=>CITY[s].items.every((_,i)=>built(s,i));
function cityScreen(){ open('scrCity','city'); cs=0; for(let s=0;s<3;s++){ if(stageDone(s)&&s<2) cs=s+1; } CITY.forEach(c=>{ IP(c.map); c.items.forEach(IP); }); cityUI(); }
function cityUI(){ const c=CITY[cs]; $('#cityTitle').textContent=c.name; $('#cityStars').textContent='⭐ '+S.stars+(X.tokens.deco?' · 🎟 '+X.tokens.deco:'');
  const n=c.items.filter((_,i)=>built(cs,i)).length; const locked=cs>0&&!stageDone(cs-1);
  $('#cityInfo').textContent=locked?'🔒 השלימו קודם את '+CITY[cs-1].name:stageDone(cs)?'✔ האזור צבעוני! נפתח העולם: '+D.WORLDS.find(w=>w.id===c.world).name:'הקישו על עיגול כדי לבנות ולהחזיר את הצבעים ('+n+'/5)';
  $('#cityPrev').disabled=cs===0; $('#cityNext').disabled=cs===2; }
$('#cityPrev').addEventListener('click',()=>{ if(cs>0){ cs--; cityUI(); A.sfx('coin',.3,1.1); } });
$('#cityNext').addEventListener('click',()=>{ if(cs<2){ cs++; cityUI(); A.sfx('coin',.3,1.1); } });
function grayOf(name){ if(grayC[name]) return grayC[name]; const im=I(name); if(!im) return null; const c=K.mk(im.width,im.height,(g)=>{ g.drawImage(im,0,0); try{ const d=g.getImageData(0,0,im.width,im.height), p=d.data; for(let i=0;i<p.length;i+=4){ const l=p[i]*.3+p[i+1]*.59+p[i+2]*.11; const v=l*.85+40; p[i]=v; p[i+1]=v; p[i+2]=v*1.04; } g.putImageData(d,0,0); }catch(e){} }); return grayC[name]=c; }
function mapXf(){ const im=I(CITY[cs].map); const W=K.W,H=K.H; const iw=im?im.width:720, ih=im?im.height:1286; const s=Math.max(W/iw,H/ih); return {s,ox:(W-iw*s)/2,oy:(H-ih*s)/2,iw,ih}; }
function plotPos(i){ const f=mapXf(), p=CITY[cs].plots[i]; return {x:f.ox+p[0]*f.iw*f.s,y:f.oy+p[1]*f.ih*f.s,r:f.iw*f.s*.19}; }
V.renderCity=function(dt){
  const ctx=K.ctx, W=K.W, H=K.H, t=K.G.t, c=CITY[cs]; const im=I(c.map), gr=grayOf(c.map); const f=mapXf();
  if(!im||!gr){ ctx.fillStyle='#bbb'; ctx.fillRect(0,0,W,H); return; }
  const done=stageDone(cs);
  ctx.drawImage(done?im:gr,f.ox,f.oy,f.iw*f.s,f.ih*f.s);
  if(!done){ for(let i=0;i<5;i++){ if(!built(cs,i)) continue; const k=cs+'-'+i; const gw=grow[k]==null?1:grow[k]; if(grow[k]!=null&&grow[k]<1) grow[k]=Math.min(1,grow[k]+dt*.8); const p=plotPos(i);
      ctx.save(); ctx.beginPath(); ctx.arc(p.x,p.y,p.r*(.3+1.4*ease(gw)),0,TAU); ctx.clip(); ctx.drawImage(im,f.ox,f.oy,f.iw*f.s,f.ih*f.s); ctx.restore(); } }
  else { const k='done'+cs; if(grow[k]!=null&&grow[k]<1){ grow[k]=Math.min(1,grow[k]+dt*.5); ctx.save(); ctx.globalAlpha=1-ease(grow[k]); ctx.drawImage(gr,f.ox,f.oy,f.iw*f.s,f.ih*f.s); ctx.restore(); } }
  const locked=cs>0&&!stageDone(cs-1);
  for(let i=0;i<5;i++){ const p=plotPos(i);
    if(built(cs,i)){ const it=I(c.items[i]); if(it){ const k=cs+'-'+i; const gw=grow[k]==null?1:grow[k]; const b=Math.sin(t*2.2+i)*p.r*.04; const h=p.r*1.5*ease(Math.min(1,gw*1.6)), w=h*it.width/it.height; ctx.fillStyle='rgba(60,0,60,.2)'; ctx.beginPath(); ctx.ellipse(p.x,p.y+p.r*.42,w*.42,p.r*.12,0,0,TAU); ctx.fill(); ctx.drawImage(it,p.x-w/2,p.y+p.r*.45-h+b,w,h); if(Math.random()<.03) K.sparkle(p.x+rnd(-p.r,p.r),p.y-rnd(0,p.r),'#fff59a',3); } }
    else if(!locked){ const pulse=1+Math.sin(t*4+i)*.05; ctx.save(); ctx.setLineDash([10,8]); ctx.lineWidth=4; ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(p.x,p.y,p.r*.7*pulse,0,TAU); ctx.stroke(); ctx.restore();
      const it=I(c.items[i]); if(it){ ctx.save(); ctx.globalAlpha=.45; const h=p.r*.9, w=h*it.width/it.height; ctx.drawImage(grayOf(c.items[i])||it,p.x-w/2,p.y-h*.65,w,h); ctx.restore(); }
      const tx=X.tokens.deco>0?'🎟 חינם':c.price[i]+' ⭐'; ctx.font='900 18px Rubik, sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.direction='ltr'; const tw=ctx.measureText(tx).width+22; ctx.fillStyle=S.stars>=c.price[i]||X.tokens.deco>0?'#ff4fa8':'#8a7a9a'; K.rrect(ctx,p.x-tw/2,p.y+p.r*.42,tw,30,15); ctx.fill(); ctx.fillStyle='#fff'; ctx.fillText(tx,p.x,p.y+p.r*.42+16); ctx.direction='rtl'; } }
  if(locked){ ctx.fillStyle='rgba(40,10,60,.45)'; ctx.fillRect(0,0,W,H); }
  K.updParts(dt); K.drawParts();
};
V.cityTap=function(x,y){
  const c=CITY[cs]; if(cs>0&&!stageDone(cs-1)) { K.toast('🔒 השלימו קודם את '+CITY[cs-1].name); return; }
  for(let i=0;i<5;i++){ const p=plotPos(i); if(Math.hypot(x-p.x,y-p.y)<p.r*.85&&!built(cs,i)){
    const tok=X.tokens.deco>0; if(!tok&&S.stars<c.price[i]){ K.toast('צריך עוד '+(c.price[i]-S.stars)+' ⭐ – שחקו ואספו כוכבים!'); A.sfx('wrong',.4); return; }
    if(tok) X.tokens.deco--; else S.stars-=c.price[i]; X.city.built[cs+'-'+i]=true; grow[cs+'-'+i]=0; save();
    A.sfx('powerup',.8); K.confetti(p.x,p.y,50); 
    if(stageDone(cs)){ grow['done'+cs]=0; const w=c.world; if(!X.worlds.includes(w)) X.worlds.push(w); X.stats.cityDone=(X.stats.cityDone||0)+1; save(); K.rainConfetti(80); A.voice('city_done'); const wd=D.WORLDS.find(q=>q.id===w);
      setTimeout(()=>reveal({title:'עולם חדש נפתח!',sub:wd.name+' – בחרו אותו בתפריט',img:url(wd.decor[0]),voice:null}),1600); }
    else A.voice('city_color');
    cityUI(); K.updMenu(); return; } }
};

/* ----- profile & photo (local only) ----- */
let crop=null, pfReturn=null;
function profileScreen(ret){ pfReturn=ret||null; open('scrProfile'); $('#pfName').value=X.profile.name||(K.BDAY?K.BDAY.name:''); $('#pfBuddy').checked=X.profile.buddy!==false; crop=null; $('#pfZoom').classList.add('hidden'); $('#pfZoom').value=1; drawCrop(); $('#pfDel').classList.toggle('hidden',!hasPhoto()); IP('buddy_body'); }
V.profileScreen=profileScreen;
function loadFile(file){ if(!file||!/^image\//.test(file.type||'image/')) { K.toast('בחרו קובץ תמונה'); return; } const u=URL.createObjectURL(file); const im=new Image(); im.onload=()=>{ URL.revokeObjectURL(u); let src=im; const mx=1024; if(im.width>mx||im.height>mx){ const s=mx/Math.max(im.width,im.height); src=K.mk(Math.round(im.width*s),Math.round(im.height*s),(g,w,h)=>g.drawImage(im,0,0,w,h)); } crop={img:src,z:1,ox:0,oy:0}; $('#pfZoom').value=1; $('#pfZoom').classList.remove('hidden'); drawCrop(); A.sfx('coin',.4,1.2); }; im.onerror=()=>{ URL.revokeObjectURL(u); K.toast('לא הצלחנו לפתוח את התמונה'); }; im.src=u; }
['#pfCam','#pfGal'].forEach(s=>$(s).addEventListener('change',e=>{ const f=e.target.files&&e.target.files[0]; loadFile(f); e.target.value=''; }));
const CR=120; // circle radius in crop canvas (canvas 280)
function cropGeom(){ const cv=$('#pfCrop'), W=cv.width; const im=crop.img; const base=(CR*2)/Math.min(im.width,im.height); const s=base*crop.z; return {W,s,x:W/2-im.width*s/2+crop.ox,y:W/2-im.height*s/2+crop.oy,w:im.width*s,h:im.height*s}; }
function clampCrop(){ const g=cropGeom(), c=g.W/2; const maxX=(g.w/2-CR), maxY=(g.h/2-CR); crop.ox=clamp(crop.ox,-maxX,maxX); crop.oy=clamp(crop.oy,-maxY,maxY); }
function drawCrop(){ const cv=$('#pfCrop'), g=cv.getContext('2d'), W=cv.width; g.clearRect(0,0,W,W);
  if(crop){ clampCrop(); const q=cropGeom(); g.drawImage(crop.img,q.x,q.y,q.w,q.h); g.save(); g.fillStyle='rgba(43,15,69,.6)'; g.beginPath(); g.rect(0,0,W,W); g.arc(W/2,W/2,CR,0,TAU,true); g.fill('evenodd'); g.restore(); g.lineWidth=4; g.strokeStyle='#ffcf3f'; g.beginPath(); g.arc(W/2,W/2,CR,0,TAU); g.stroke(); return; }
  if(PHOTO){ g.save(); g.beginPath(); g.arc(W/2,W/2,CR,0,TAU); g.clip(); g.drawImage(PHOTO,W/2-CR,W/2-CR,CR*2,CR*2); g.restore(); g.lineWidth=6; g.strokeStyle='#ffcf3f'; g.beginPath(); g.arc(W/2,W/2,CR,0,TAU); g.stroke(); return; }
  g.fillStyle='#f3e6ff'; g.beginPath(); g.arc(W/2,W/2,CR,0,TAU); g.fill(); g.setLineDash([10,8]); g.lineWidth=4; g.strokeStyle='#c9a6ff'; g.stroke(); g.setLineDash([]);
  g.fillStyle='#9b6fcf'; g.font='900 22px Rubik, sans-serif'; g.textAlign='center'; g.direction='rtl'; g.fillText('הוסיפו תמונה',W/2,W/2-6); g.font='700 16px Rubik, sans-serif'; g.fillText('(לא חובה)',W/2,W/2+20); }
(function(){ const cv=$('#pfCrop'); const pts=new Map(); let pinch0=null;
  const pos=e=>{ const r=cv.getBoundingClientRect(); return {x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height}; };
  cv.addEventListener('pointerdown',e=>{ if(!crop) return; cv.setPointerCapture(e.pointerId); pts.set(e.pointerId,pos(e)); if(pts.size===2){ const [a,b]=[...pts.values()]; pinch0={d:Math.hypot(a.x-b.x,a.y-b.y),z:crop.z}; } e.preventDefault(); });
  cv.addEventListener('pointermove',e=>{ if(!crop||!pts.has(e.pointerId)) return; const p=pos(e), o=pts.get(e.pointerId); pts.set(e.pointerId,p);
    if(pts.size===2&&pinch0){ const [a,b]=[...pts.values()]; crop.z=clamp(pinch0.z*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(10,pinch0.d),1,4); $('#pfZoom').value=crop.z; }
    else if(pts.size===1){ crop.ox+=p.x-o.x; crop.oy+=p.y-o.y; } drawCrop(); });
  const up=e=>{ pts.delete(e.pointerId); if(pts.size<2) pinch0=null; }; cv.addEventListener('pointerup',up); cv.addEventListener('pointercancel',up);
  cv.addEventListener('wheel',e=>{ if(!crop) return; e.preventDefault(); crop.z=clamp(crop.z*(e.deltaY<0?1.08:.93),1,4); $('#pfZoom').value=crop.z; drawCrop(); },{passive:false});
  $('#pfZoom').addEventListener('input',e=>{ if(!crop) return; crop.z=+e.target.value; drawCrop(); });
})();
function savePhotoFromCrop(){ const q=cropGeom(), c=q.W/2; const out=K.mk(256,256,(g)=>{ const k=256/(CR*2); g.fillStyle='#fff'; g.fillRect(0,0,256,256); g.drawImage(crop.img,(q.x-(c-CR))*k,(q.y-(c-CR))*k,q.w*k,q.h*k); });
  const d=out.toDataURL('image/jpeg',.85); try{ localStorage.setItem(PHOTO_KEY,d); }catch(e){ K.toast('אין מקום לשמור את התמונה'); return Promise.resolve(false); } return loadPhoto().then(()=>true); }
$('#pfSave').addEventListener('click',async()=>{ A.unlock(); X.profile.name=K.cleanName($('#pfName').value); X.profile.buddy=$('#pfBuddy').checked; save();
  if(crop){ const ok=await savePhotoFromCrop(); if(ok){ crop=null; A.voice('photo'); K.confetti(K.W/2,K.H*.35,60); } }
  else A.sfx('coin',.4,1.2);
  K.rebuildBday&&K.rebuildBday(); avatarUpd(); K.toast('נשמר! ✔'); setTimeout(pfBack,crop?0:400); });
function deletePhoto(){ try{ localStorage.removeItem(PHOTO_KEY); }catch(e){} PHOTO=null; faceCv=null; crop=null; K.rebuildBday&&K.rebuildBday(); avatarUpd(); K.toast('התמונה נמחקה מהמכשיר 🗑'); }
V.deletePhoto=deletePhoto;
$('#pfDel').addEventListener('click',()=>{ deletePhoto(); drawCrop(); $('#pfDel').classList.add('hidden'); $('#pfZoom').classList.add('hidden'); });
function pfBack(){ if(pfReturn==='bday') K.bdayScreen(); else K.goMenu(); }
$('#pfBack').addEventListener('click',()=>{ A.sfx('coin',.3,.9); pfBack(); });

/* ----- parents ----- */
let pgAns=0, pgNext=null;
function parentGate(next){ pgNext=next||parentsScreen; const a=ri(6,9), b=ri(6,9); pgAns=a*b; $('#pgQ').textContent=a+' × '+b+' = ?'; $('#pgIn').value=''; open('scrPGate'); setTimeout(()=>$('#pgIn').focus(),100); }
V.parentGate=parentGate;
$('#pgOk').addEventListener('click',()=>{ if(parseInt($('#pgIn').value,10)===pgAns){ A.sfx('correct',.5); const n=pgNext; pgNext=null; n(); } else { A.sfx('wrong',.5); K.toast('לא נכון – רק להורים 🙂'); parentGate(pgNext); } });
$('#pgIn').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#pgOk').click(); } });
const CATN={color:'צבעים',bigger:'מה יותר גדול',shape:'צורות',count:'ספירה',animal:'חיות',add:'חיבור',sub:'חיסור',odd:'יוצא דופן',pattern:'רצפים',mul:'כפל',div:'חילוק',three:'תרגילים משולבים',numseq:'סדרות מספרים',memory:'זיכרון',riddle:'חידות והבנת הנקרא'};
function parentsScreen(){ open('scrParents'); renderParents(); }
function playUsedMin(){ dayRoll(); return Math.floor(X.par.used/60); }
function renderParents(){
  const lim=$('#parLimit'); lim.innerHTML=''; [0,15,30,45,60].forEach(m=>{ const b=el('button','chip'+(X.par.limit===m?' on':''),m?m+' דק׳':'ללא הגבלה'); b.dataset.min=m; b.addEventListener('click',()=>{ X.par.limit=m; save(); renderParents(); }); lim.appendChild(b); });
  $('#parUsed').textContent='שיחקו היום: '+playUsedMin()+' דקות'+(X.par.limit?' מתוך '+(X.par.limit+X.par.bonus)+' דקות':'');
  $('#parMore').classList.toggle('hidden',!X.par.limit);
  const st=$('#parStats'); st.innerHTML=''; const rows=[];
  const g=X.stats.gates; rows.push(['שערי קסם (כללי)',g[0],g[1]]);
  Object.keys(X.stats.cat).forEach(k=>{ const v=X.stats.cat[k]; rows.push([CATN[k]||k,v[0],v[1]]); });
  rows.push(['ריקוד (חיקוי תנועות)',X.stats.dance[0],X.stats.dance[1]]);
  rows.forEach(([n,ok,tot])=>{ const r=el('div','prow'); r.appendChild(el('span',null,n)); const bar=el('div','mbar2'); const f=el('i'); const pct=tot?Math.round(100*ok/tot):0; f.style.width=pct+'%'; bar.appendChild(f); const b=el('b',null,tot?pct+'% ('+ok+'/'+tot+')':'—'); b.dir='rtl'; bar.appendChild(b); r.appendChild(bar); st.appendChild(r); });
  const sm=el('div','psum'); sm.textContent='שלבים שהושלמו: '+(X.stats.levels||0)+' · כוכבים: '+S.stars+' · מדבקות: '+Object.keys(X.stickers.have).length+'/48 · חברי קסם: '+X.pets.owned.length+' · שיעורי ריקוד: '+Object.keys(X.stats.lessons).length; st.appendChild(sm);
  $('#parHoli').value=X.par.holiday||'auto';
  $('#parDelPhoto').classList.toggle('hidden',!hasPhoto());
}
$('#parMore').addEventListener('click',()=>{ X.par.bonus+=15; save(); K.toast('+15 דקות להיום ✔'); renderParents(); });
$('#parHoli').addEventListener('change',e=>{ X.par.holiday=e.target.value; save(); K.toast('עודכן ✔'); });
$('#parDelPhoto').addEventListener('click',()=>{ deletePhoto(); renderParents(); });
$('#parReset').addEventListener('click',()=>{ if(!confirm('לאפס את כל ההתקדמות במשחק? (לא ניתן לבטל)')) return; try{ localStorage.removeItem('efratushka_v1'); localStorage.removeItem(PHOTO_KEY); }catch(e){} location.href=location.pathname; });
function dayRoll(){ const d=today(); if(X.par.day!==d){ X.par.day=d; X.par.used=0; X.par.bonus=0; } }
function limitReached(){ dayRoll(); return X.par.limit>0&&X.par.used>=(X.par.limit+X.par.bonus)*60; }
V.limitReached=limitReached;
let saveT=0;
V.tick=function(dt,state,paused){ if(paused) return; if(state==='run'||state==='battle'||state==='lesson'){ dayRoll(); X.par.used+=dt; saveT+=dt; if(saveT>10){ saveT=0; save(); } } };
function showRest(){ K.G.state='rest'; open('scrRest','rest'); A.stopMusic(.8); setTimeout(()=>A.voice('rest'),400); IP('wd_moon'); $('#restImg').src=url('wd_moon'); }
V.showRest=showRest;
V.canPlay=function(){ if(limitReached()){ showRest(); return false; } return true; };
$('#restParents').addEventListener('click',()=>parentGate(parentsScreen));

/* ----- dance lesson (repeat-the-sequence) ----- */
const MOVES={
 right:{name:'ימינה',svg:'<svg viewBox="0 0 64 64"><path d="M10 26h26V12l20 20-20 20V38H10z" fill="#fff" stroke="#7a1fa2" stroke-width="4" stroke-linejoin="round"/></svg>'},
 left:{name:'שמאלה',svg:'<svg viewBox="0 0 64 64"><path d="M54 26H28V12L8 32l20 20V38h26z" fill="#fff" stroke="#7a1fa2" stroke-width="4" stroke-linejoin="round"/></svg>'},
 jump:{name:'קפיצה',svg:'<svg viewBox="0 0 64 64"><path d="M26 56V30H12L32 8l20 22H38v26z" fill="#fff" stroke="#7a1fa2" stroke-width="4" stroke-linejoin="round"/></svg>'},
 clap:{name:'מחיאה',svg:'<svg viewBox="0 0 64 64"><g stroke="#7a1fa2" stroke-width="4" stroke-linejoin="round" fill="#fff"><path d="M22 54c-8-4-12-14-10-24l4-14c1-3 6-3 6 1v10l8-16c2-3 6-2 6 2l-4 14 10-12c2-3 7 0 5 3l-9 14 7-6c3-2 6 2 3 5L36 50c-4 4-9 6-14 4z"/></g><g stroke="#ffd23f" stroke-width="4" stroke-linecap="round"><path d="M46 10l4-6M54 18l7-3M52 28l7 1"/></g></svg>'},
 spin:{name:'סיבוב',svg:'<svg viewBox="0 0 64 64"><path d="M50 30a18 18 0 1 1-6-13" fill="none" stroke="#fff" stroke-width="9" stroke-linecap="round"/><path d="M50 30a18 18 0 1 1-6-13" fill="none" stroke="#7a1fa2" stroke-width="3" stroke-linecap="round"/><path d="M38 8l12 6-6 12z" fill="#fff" stroke="#7a1fa2" stroke-width="4" stroke-linejoin="round"/></svg>'},
};
const MOVE_IDS=['right','left','jump','clap','spin'];
const LESSONS={candy:{move:'spin',name:'סיבוב הסוכריה'},sky:{move:'jump',name:'קפיצת הבלון'},disco:{move:'clap',name:'מחיאת הדיסקו'},beach:{move:'right',name:'צעד הגלים'},forest:{move:'left',name:'דהרת החד-קרן'},space:{move:'spin',name:'ריחוף החלל'}};
let L=null;
(function(){ const box=$('#lsMoves'); MOVE_IDS.forEach(m=>{ const b=document.createElement('button'); b.className='mv'; b.dataset.m=m; b.id='mv_'+m; b.innerHTML=MOVES[m].svg+'<span>'+MOVES[m].name+'</span>'; b.addEventListener('pointerdown',e=>{ e.preventDefault(); A.unlock(); lessonInput(m); }); box.appendChild(b); }); })();
function lessonScreen(wid){
  const w=wid?D.WORLDS.find(x=>x.id===wid):V.worldOf(S.level); const les=LESSONS[w.id]||LESSONS.candy; const g=grp();
  L={w,les,lens:[[2,3,3],[3,4,4],[3,4,5]][g],round:0,seq:[],phase:'intro',t:0,idx:0,cur:null,curT:0,ok:0,tot:0,done:false};
  open('scrLesson','lesson'); A.menuMusic(); $('#lsTitle').textContent='שיעור ריקוד: '+les.name; $('#lsInfo').textContent='המהלך החדש של '+w.name+'!'; $('#lsDone').classList.add('hidden'); $('#lsMoves').classList.remove('hidden'); setBtns(false);
  A.voice('teach'); L.t=-1.6;
}
V.lessonScreen=lessonScreen;
function setBtns(on){ document.querySelectorAll('#lsMoves .mv').forEach(b=>{ b.disabled=!on; b.classList.remove('hl'); }); $('#lsMoves').classList.toggle('wait',!on); }
function newSeq(){ const n=L.lens[L.round]; const s=[L.les.move]; while(s.length<n){ const m=pick(MOVE_IDS); if(m!==s[s.length-1]) s.push(m); } L.seq=D.shuffle(s); if(L.seq[0]===L.seq[1]&&n>2) L.seq.reverse(); }
function doMove(m){ L.cur=m; L.curT=0; const b=$('#mv_'+m); if(b){ b.classList.remove('hl'); void b.offsetWidth; b.classList.add('hl'); } A.sfx('coin',.35,{right:1.1,left:1,jump:1.3,clap:1.5,spin:1.2}[m]); }
function lessonInput(m){ if(!L||L.phase!=='input') return; doMove(m); L.tot++; X.stats.dance[1]++;
  if(m===L.seq[L.idx]){ L.idx++; L.ok++; X.stats.dance[0]++; if(L.idx>=L.seq.length){ L.phase='good'; L.t=0; setBtns(false); A.voice(L.round>=2?'teach_ok':pick(['great','amazing','champs'])); K.confetti(K.W/2,K.H*.35,50); } }
  else { L.phase='wrong'; L.t=0; setBtns(false); A.voice('almost'); }
  save(); }
V.renderLesson=function(dt){
  const ctx=K.ctx, W=K.W, H=K.H, t=K.G.t; if(!L) return; L.t+=dt; L.curT+=dt;
  // phases
  if(L.phase==='intro'){ if(L.t>0&&!L.introShown){ L.introShown=1; doMove(L.les.move); $('#lsInfo').textContent='המהלך החדש: '+MOVES[L.les.move].name+'!'; } if(L.t>1.1&&L.introShown===1){ L.introShown=2; doMove(L.les.move); } if(L.t>2.3){ newSeq(); L.phase='demo'; L.t=-.4; L.idx=0; } }
  else if(L.phase==='demo'){ $('#lsInfo').textContent='סיבוב '+(L.round+1)+' מתוך 3 · תסתכלו עליי!'; const k=Math.floor(L.t/.95); if(L.t>=0&&k<L.seq.length&&L.idx!==k+1){ L.idx=k+1; doMove(L.seq[k]); } if(L.t>L.seq.length*.95+.3){ L.phase='input'; L.idx=0; L.t=0; setBtns(true); A.voice('yourturn'); $('#lsInfo').textContent='עכשיו תורכם! ('+L.seq.length+' תנועות)'; } }
  else if(L.phase==='wrong'){ $('#lsInfo').textContent='כמעט! בואו נראה שוב'; if(L.t>1.6){ L.phase='demo'; L.t=-.3; L.idx=0; } }
  else if(L.phase==='good'){ if(L.t>1.8){ L.round++; if(L.round>=3){ L.phase='end'; finishLesson(); } else { newSeq(); L.phase='demo'; L.t=-.3; L.idx=0; } } }
  // draw
  const w=L.w; const gr=ctx.createLinearGradient(0,0,0,H); gr.addColorStop(0,w.night||w.id==='disco'?'#16052e':'#5b1460'); gr.addColorStop(1,w.accent||'#c43d95'); ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
  for(let i=0;i<4;i++){ const a=Math.sin(t*.9+i*1.7)*.6; ctx.save(); ctx.translate(W*(i+.5)/4,0); ctx.rotate(a); ctx.fillStyle=['rgba(255,79,168,.18)','rgba(63,212,255,.18)','rgba(255,207,63,.18)','rgba(46,204,85,.15)'][i]; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-90,H*.7); ctx.lineTo(90,H*.7); ctx.lineTo(8,0); ctx.fill(); ctx.restore(); }
  const by=H*.66, eh=H*.36; ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(W/2,by,eh*.22,eh*.05,0,0,TAU); ctx.fill();
  const m=L.cur, u=clamp(L.curT/.85,0,1), act=m&&L.curT<.85;
  ctx.save(); ctx.translate(W/2,by);
  if(act){ if(m==='right') { ctx.translate(Math.sin(Math.PI*u)*W*.16,0); ctx.rotate(Math.sin(Math.PI*u)*.12); } if(m==='left'){ ctx.translate(-Math.sin(Math.PI*u)*W*.16,0); ctx.rotate(-Math.sin(Math.PI*u)*.12); } if(m==='jump') ctx.translate(0,-Math.sin(Math.PI*u)*H*.1); if(m==='spin') ctx.scale(Math.cos(TAU*u)||.01,1); if(m==='clap') ctx.scale(1+.05*Math.sin(TAU*u*2),1-.03*Math.sin(TAU*u*2)); }
  if(L.phase==='end') K.drawFrame('celebrate',t*14,0,0,eh); else K.drawFrame('dance',t*12.5,0,0,eh);
  ctx.restore();
  if(act&&m==='clap'&&Math.random()<.5) K.sparkle(W/2+rnd(-40,40),by-eh*.75,'#ffe45c',3);
  if(hasBuddy()){ ctx.save(); drawBuddy(ctx,W*.18,by+H*.04,eh*.62,t,true); ctx.restore(); }
  if(act){ ctx.save(); ctx.globalAlpha=1-u*.6; ctx.font='900 30px Rubik, sans-serif'; ctx.textAlign='center'; ctx.direction='rtl'; ctx.lineWidth=6; ctx.strokeStyle='rgba(80,0,80,.8)'; ctx.strokeText(MOVES[m].name+'!',W/2,by-eh-20-u*20); ctx.fillStyle='#ffe45c'; ctx.fillText(MOVES[m].name+'!',W/2,by-eh-20-u*20); ctx.restore(); }
  if(L.seq.length&&(L.phase==='input'||L.phase==='demo')){ const n=L.seq.length, gap=34; for(let i=0;i<n;i++){ const x=W/2+(i-(n-1)/2)*gap*-1; ctx.fillStyle=(L.phase==='input'&&i<L.idx)?'#2ecc55':(L.phase==='demo'&&i<L.idx)?'#ffcf3f':'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(x,H*.2,11,0,TAU); ctx.fill(); } }
  K.updParts(dt); K.drawParts();
};
function finishLesson(){ setBtns(false); $('#lsMoves').classList.add('hidden'); const first=!X.stats.lessons[L.w.id]; X.stats.lessons[L.w.id]=true; const st=first?40:15; S.stars+=st; save(); ev('lesson',1); addXP(30);
  $('#lsDone').classList.remove('hidden'); $('#lsDoneTxt').textContent='למדתם את "'+L.les.name+'"! +'+st+' ⭐'; K.rainConfetti(60); A.sfx('confetti',.8); K.updMenu(); }
$('#lsQuit').addEventListener('click',()=>{ L=null; K.goMenu(); });
$('#lsBack').addEventListener('click',()=>{ L=null; K.goMenu(); });
V.lessonPending=w=>!X.stats.lessons[w.id];

/* ----- challenge & share card ----- */
function myName(){ return X.profile.name||(K.BDAY?K.BDAY.name:''); }
function challengeLink(score){ const n=myName(); return K.BASE_URL+'?challenge='+score+(n?'&from='+encodeURIComponent(n):''); }
V.challengeLink=challengeLink;
async function shareChallenge(score){
  const n=myName(); const u=challengeLink(score); const text='⚔ '+(n?n+' אספ/ה':'אספתי')+' '+score+' כוכבים באפרתושקה: מסיבת הקסם! תנצחו אותי?';
  if(navigator.share){ try{ await navigator.share({title:'תנצחו אותי! – אפרתושקה',text,url:u}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  K.openWa(text+' '+u);
}
V.shareChallenge=shareChallenge;
function drawCard(cv,score,level,withPhoto){
  const g=cv.getContext('2d'), W=cv.width, H=cv.height;
  const gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#ff8fd0'); gr.addColorStop(.55,'#b04cd8'); gr.addColorStop(1,'#4a1580'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  g.save(); g.translate(W/2,H*.48); for(let i=0;i<16;i++){ g.rotate(TAU/16); g.fillStyle='rgba(255,255,255,.08)'; g.beginPath(); g.moveTo(0,0); g.lineTo(-90,-H); g.lineTo(90,-H); g.fill(); } g.restore();
  const r=seeded('card'+score); for(let i=0;i<70;i++){ g.fillStyle=['#ff3b4e','#ffd23f','#2ecc55','#2f7bff','#fff','#3fd4ff'][i%6]; g.save(); g.translate(r()*W,r()*H); g.rotate(r()*6); g.fillRect(-9,-4,18,8); g.restore(); }
  g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl';
  g.font='900 96px Rubik, sans-serif'; g.lineWidth=16; g.strokeStyle='#d4157f'; g.strokeText('אפרתושקה',W/2,120); g.fillStyle='#fff'; g.fillText('אפרתושקה',W/2,120);
  g.font='800 52px Rubik, sans-serif'; g.lineWidth=10; g.strokeStyle='#7a1fa2'; g.strokeText('מסיבת הקסם ✨',W/2,205); g.fillStyle='#ffe45c'; g.fillText('מסיבת הקסם ✨',W/2,205);
  const sh=K.sheet('front'); const by=H*.80; const showB=withPhoto&&hasPhoto();
  g.fillStyle='rgba(60,0,60,.3)'; g.beginPath(); g.ellipse(showB?W*.62:W/2,by,170,30,0,0,TAU); g.fill();
  if(sh){ const h=H*.52, w=h*sh.width/sh.height; g.drawImage(sh,(showB?W*.62:W/2)-w/2,by-h,w,h); }
  if(showB){ g.fillStyle='rgba(60,0,60,.3)'; g.beginPath(); g.ellipse(W*.27,by,120,24,0,0,TAU); g.fill(); drawBuddy(g,W*.27,by,H*.42,0,false); }
  // score badge
  const bx=W/2, byy=H*.86; g.fillStyle='#fff'; K.rrect(g,bx-330,byy-70,660,150,75); g.fill(); g.lineWidth=10; g.strokeStyle='#ffcf3f'; g.stroke();
  g.drawImage(K.P.star,bx+170,byy-55,110,110);
  g.direction='ltr'; g.font='900 100px Rubik, sans-serif'; g.fillStyle='#d4157f'; g.fillText(String(score),bx-10,byy+8); g.direction='rtl';
  g.font='800 34px Rubik, sans-serif'; g.fillStyle='#7a1fa2'; g.fillText('כוכבים · שלב '+level,bx-190,byy+8);
  const n=myName(); g.font='900 64px Rubik, sans-serif'; g.lineWidth=12; g.strokeStyle='#7a1fa2'; const tl=n?n+' במסיבה! 🎉':'מסיבה של כוכבים! 🎉'; g.strokeText(tl,W/2,300); g.fillStyle='#fff'; g.fillText(tl,W/2,300);
  g.font='700 32px Rubik, sans-serif'; g.fillStyle='#fff'; g.direction='ltr'; g.fillText('bensharafi7-sys.github.io/efratushka-game',W/2,H-36);
}
let cardScore=0, cardLevel=1;
function cardScreen(score,level){ cardScore=score; cardLevel=level; open('scrCard'); IP('buddy_body').then(()=>renderCard()); $('#cardPhotoRow').classList.toggle('hidden',!hasPhoto()); $('#cardPhoto').checked=false; renderCard(); }
V.cardScreen=cardScreen;
function renderCard(){ drawCard($('#cardCv'),cardScore,cardLevel,$('#cardPhoto').checked); }
$('#cardPhoto').addEventListener('change',renderCard);
function cardBlob(){ return new Promise(res=>$('#cardCv').toBlob(b=>res(b),'image/png')); }
$('#cardShare').addEventListener('click',async()=>{ const b=await cardBlob(); if(!b) return; const f=new File([b],'efratushka.png',{type:'image/png'});
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:'אפרתושקה: מסיבת הקסם',text:'בואו לשחק איתי! '+K.BASE_URL}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  downloadBlob(b); });
$('#cardSave').addEventListener('click',async()=>{ const b=await cardBlob(); if(b) downloadBlob(b); });
function downloadBlob(b){ const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='efratushka.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); K.toast('הכרטיס נשמר 📸'); }
$('#cardBack').addEventListener('click',()=>{ A.sfx('coin',.3,.9); if(K.G.lastScore!=null&&K.backToResult) K.backToResult(); else K.goMenu(); });

/* ----- level end ----- */
V.onLevelEnd=function(R,earned){
  X.stats.levels=(X.stats.levels||0)+1; ev('level',1); addXP(40);
  const pet=activePet(); if(pet&&pet.lvl<5){ pet.xp+=10; if(pet.xp>=100){ pet.xp-=100; pet.lvl++; if(pet.lvl>=5) pet.xp=100; setTimeout(()=>reveal({title:petDef(pet.id).name+' עלה לרמה '+pet.lvl+'!',img:url('pet_'+pet.id),voice:'pet_level'}),2600); } }
  const gains=[]; const sg=grantSticker(); gains.push(sg.shiny?'✨ מדבקה נוצצת':'🖼 מדבקה חדשה'); if(R.giftSt) gains.push('🎁 '+R.giftSt+' מדבקות מהפתעות');
  if(sg.pageDone) gains.push('📒 דף הושלם! +150⭐');
  const egg=X.eggs.find(e=>e.dist<e.need); if(egg) gains.push('🥚 ביצה: '+Math.floor(100*egg.dist/egg.need)+'%'); if(eggReady()) gains.push('🥚 ביצה מוכנה לבקוע!');
  const ji=Math.min(30,Math.floor(X.journey.xp/TIERXP)); gains.push('🌟 מסע: דרגה '+ji+'/30');
  save();
  let chal=null; if(CH&&!CH.done){ const win=earned>CH.score; chal={win,txt:win?'🏆 ניצחתם את '+CH.from+'! ('+earned+' מול '+CH.score+')':'💛 כמעט! '+CH.from+' אספ/ה '+CH.score+' – חסרים עוד '+(CH.score-earned+1)+' ⭐'}; if(win) CH.done=true; }
  return {gains,chal,sticker:sg};
};
V.stickerReveal=function(sg){ if(!sg) return; reveal({title:sg.shiny?'מדבקה נוצצת!':'מדבקה חדשה!',sub:sg.pageDone?'השלמתם את הדף "'+sg.pageDone.name+'"! +150 ⭐':'נוספה לאלבום',img:stickerURL(sg.id),shiny:sg.shiny,voice:sg.pageDone?'album':sg.shiny?'shiny':'sticker'}); };

/* ----- tiles wiring ----- */
const T=(id,fn)=>{ const b=$('#'+id); if(b) b.addEventListener('click',()=>{ A.unlock(); A.sfx('coin',.35,1.15); fn(); }); };
T('tMissions',()=>questScreen('m')); T('tJourney',()=>questScreen('j')); T('tPets',petsScreen); T('tCity',cityScreen); T('tShop',shopScreen); T('tAlbum',albumScreen); T('tWheel',wheelScreen); T('tDance',()=>lessonScreen()); T('btnProfile',()=>profileScreen()); T('btnParents',()=>parentGate(parentsScreen));
V.screens={questScreen,petsScreen,cityScreen,shopScreen,albumScreen,wheelScreen,lessonScreen,profileScreen,parentsScreen,cardScreen,showRest};
V.render=function(dt){ const s=K.G.state; if(s==='city'){ V.renderCity(dt); return true; } if(s==='lesson'){ V.renderLesson(dt); return true; } if(s==='menu'&&$('#scrWheel').classList.contains('show')&&!wSpin&&Math.random()<.2) drawWheel(); return false; };
V.X=X; V.PETS=PETS; V.cityPlot=i=>plotPos(i); V.cityStage=n=>{ if(n!=null){ cs=n; cityUI(); } return cs; }; V.lessonState=()=>L&&{phase:L.phase,seq:L.seq.slice(),idx:L.idx,round:L.round}; V.addEgg=addEgg; V.grantSticker=grantSticker; V.ensureMissions=ensureMissions;

/* ================= v3: icons, pet sync, birthday decor, interactions, codes, champions, PWA, social ================= */
X.v3=merge({codes:[],lb:{on:false,nick:'',week:'',score:0,dev:''},idleT:0,fails:0,failT:0},X.v3);
const X3=X.v3; if(!X3.lb.dev) X3.lb.dev=(crypto&&crypto.randomUUID?crypto.randomUUID():String(Math.random()).slice(2)+Date.now());
if(X.started&&A.VARS) A.VARS.welcome=['welcome','welcome2'];

/* ---- answer icons (drawn) ---- */
window.EFIC=window.EFIC||{};
function loadIcons(){ Object.keys(D.ICONS).forEach(id=>{ if(EFIC[id]) return; const im=new Image(); im.src='assets/v3/ic_'+id+'.webp'; EFIC[id]=im; }); }
setTimeout(loadIcons,250);

/* ---- exclusive rewards ---- */
if(!D.OUTFITS.find(o=>o.id==='showstar')) D.OUTFITS.push({id:'showstar',name:'כוכבת מופע',price:-2,dh:-75,sw:'linear-gradient(135deg,#6a5cff,#ff6fc8 55%,#ffd23f)'});
if(!D.TRAILS.find(o=>o.id==='goldmic')) D.TRAILS.push({id:'goldmic',name:'מיקרופון זהב',price:-2,icon:'🎤'});
if(!PETS.find(p=>p.id==='phoenix')) PETS.push({id:'phoenix',name:'ציפור זהב',ab:'collect',abTxt:'אוספת כוכבים מהמסלול – חברה בלעדית מקוד הפתעה',fly:true,ex:true});

/* ---- pet that moves with Efratushka ---- */
const PS={R:null,x:0,vx:0,y:0,hop:0,hopV:0,worry:0,spin:0,last:0,hearts:[]};
V.petReact=function(kind){ if(kind==='happy'){ if(PS.hop<.05) PS.hopV=6.2; PS.spin=1; for(let i=0;i<3;i++) PS.hearts.push({x:rnd(-.3,.3),y:0,vy:rnd(1.2,2),a:1}); } else if(kind==='worried'){ PS.worry=1; PS.hopV=Math.max(PS.hopV,2.5); } };
V.drawCompanions=function(R){
  const ctx=K.ctx, p=R.p, LW=K.LW, v=R.v; if(!v||!v.pet) return; const im=I('pet_'+v.pet); if(!im) return;
  const now=performance.now()/1000; let dt=Math.min(.05,Math.max(0,now-(PS.last||now))); PS.last=now; if(K.G.paused) dt=0;
  if(PS.R!==R){ PS.R=R; PS.x=p.x+.78; PS.vx=0; PS.y=0; PS.hop=0; PS.hopV=0; PS.worry=0; PS.spin=0; PS.hearts=[]; }
  // spring-follow her lane (slight overshoot = alive, no stiff sliding)
  const tx=p.x+.78; const ax=(tx-PS.x)*70-PS.vx*12; PS.vx+=ax*dt; PS.x+=PS.vx*dt;
  // jump with her (tiny follow delay) + own hops
  const py=p.y+p.flyY; PS.y+=(py-PS.y)*Math.min(1,dt*15);
  PS.hopV-=24*dt; PS.hop+=PS.hopV*dt; if(PS.hop<0){ PS.hop=0; PS.hopV=0; }
  PS.worry=Math.max(0,PS.worry-dt*1.1); PS.spin=Math.max(0,PS.spin-dt*2.2);
  const def=petDef(v.pet), z=-.25, s=K.proj(z), px=LW*s; const shake=PS.worry>0?Math.sin(now*46)*.035*PS.worry:0;
  const cx=K.sx(PS.x+shake,z), base=K.sy(z);
  let h=px*(.78+.04*v.plv); const w0=h*im.width/im.height;
  const ph=p.anim*Math.PI/8; let bob=0, sy=1;
  if(def.fly){ bob=px*(.85+Math.sin(now*3)*.08); sy=1+Math.sin(ph*2)*.07; }
  else if(p.y<=.001&&PS.hop<.01){ const b=Math.abs(Math.sin(ph)); bob=b*px*.2; sy=.95+b*.09; }
  if(p.slide>0&&!def.fly){ sy*=.7; bob=0; } else if(p.slide>0&&def.fly){ bob*=.45; }
  const lift=PS.y*LW*.85+PS.hop*LW*.42+bob;
  const sh=1/(1+lift/LW*.8); ctx.fillStyle='rgba(60,0,60,.18)'; ctx.beginPath(); ctx.ellipse(cx,base,w0*.32*sh,px*.07*sh,0,0,TAU); ctx.fill();
  ctx.save(); ctx.translate(cx,base-lift); ctx.rotate(clamp(PS.vx*.09,-.32,.32)+(PS.spin>0?(1-PS.spin)*TAU:0)); ctx.scale(1/Math.sqrt(sy),sy); ctx.drawImage(im,-w0/2,-h,w0,h); ctx.restore();
  if(PS.worry>.15){ ctx.save(); ctx.globalAlpha=Math.min(1,PS.worry*1.5); ctx.fillStyle='#7fd0ff'; const dx=cx+w0*.32, dy=base-lift-h*.95; ctx.beginPath(); ctx.moveTo(dx,dy-px*.12); ctx.quadraticCurveTo(dx+px*.08,dy,dx,dy+px*.04); ctx.quadraticCurveTo(dx-px*.08,dy,dx,dy-px*.12); ctx.fill(); ctx.restore(); }
  PS.hearts=PS.hearts.filter(hh=>{ hh.y+=hh.vy*dt; hh.a-=dt*.9; if(hh.a<=0) return false; ctx.save(); ctx.globalAlpha=hh.a; ctx.fillStyle='#ff4fa8'; const hx=cx+hh.x*px, hy=base-lift-h-hh.y*px*.5; K.heartPath?K.heartPath(ctx,hx,hy,px*.22):(ctx.beginPath(),ctx.arc(hx,hy,px*.07,0,TAU)); ctx.fill(); ctx.restore(); return true; });
  if(v.shield&&v.pet==='unicorn'){ ctx.strokeStyle=`rgba(255,160,230,${.35+.2*Math.sin(now*6)})`; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(K.sx(p.x,0),K.BASE-LW*1.0-(p.y+p.flyY)*LW,LW*1.05,0,TAU); ctx.stroke(); }
};

/* ---- birthday decorations with the child's photo (local only) ---- */
let bdCache={k:'',board:null,sign:null};
function bdKey(){ return (K.BDAY?K.BDAY.name:'')+'|'+(PHOTO?PHOTO.src.length:0); }
function buildBd(){ const nm=K.BDAY?K.BDAY.name:(X.profile.name||''); const mkSign=(post)=>K.mk(300,post?470:330,(g)=>{
    if(post){ const gr=g.createLinearGradient(140,0,160,0); gr.addColorStop(0,'#ff8cc8'); gr.addColorStop(1,'#d93f8f'); g.fillStyle=gr; g.fillRect(140,300,20,170); }
    // rainbow frame
    const cols=['#ff3b4e','#ffa53f','#ffd23f','#2ecc55','#2f7bff','#9b59ff']; for(let i=0;i<6;i++){ K.rrect(g,20+i*4,20+i*4,260-i*8,260-i*8,40-i*3); g.fillStyle=cols[i]; g.fill(); }
    K.rrect(g,46,46,208,208,24); g.save(); g.clip(); g.fillStyle='#fff'; g.fillRect(46,46,208,208); if(PHOTO) g.drawImage(PHOTO,46,46,208,208); g.restore();
    g.lineWidth=5; g.strokeStyle='#fff'; K.rrect(g,46,46,208,208,24); g.stroke();
    // stars on corners
    [[30,30],[270,30]].forEach(([x,y])=>{ g.fillStyle='#ffd23f'; K.starPath(g,x,y,26,11,5); g.fill(); g.lineWidth=3; g.strokeStyle='#ff9800'; g.stroke(); });
    // name ribbon
    g.fillStyle='#ff4fa8'; K.rrect(g,14,250,272,64,22); g.fill(); g.lineWidth=5; g.strokeStyle='#ffcf3f'; g.stroke();
    if(nm){ g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl'; K.fitText(g,'מזל טוב '+nm+'!',250,40); g.fillStyle='#fff'; g.fillText('מזל טוב '+nm+'!',150,284); }
  });
  bdCache={k:bdKey(),board:mkSign(true),sign:mkSign(false)}; }
V.bdBoard=function(){ if(!K.BDAY||!hasBuddy()) return null; if(bdCache.k!==bdKey()) buildBd(); return bdCache.board; };
V.drawPhotoSign=function(ctx,cx,top,h,t){ if(!K.BDAY||!hasBuddy()) return; if(bdCache.k!==bdKey()) buildBd(); const c=bdCache.sign; const w=h*c.width/c.height;
  ctx.save(); ctx.translate(cx,top); ctx.rotate(Math.sin(t*2)*.05); ctx.strokeStyle='rgba(255,255,255,.8)'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(-w*.35,0); ctx.lineTo(0,-h*.12); ctx.lineTo(w*.35,0); ctx.stroke(); ctx.drawImage(c,-w/2,0,w,h); ctx.restore(); };
V.hasBuddy=hasBuddy;

/* ---- Efratushka interacts with the kid ---- */
const HAND='<svg viewBox="0 0 64 64" width="64" height="64"><g fill="#ffcf9e" stroke="#b5651d" stroke-width="2.5" stroke-linejoin="round"><path d="M18 36V16a4 4 0 0 1 8 0v14V10a4 4 0 0 1 8 0v20V12a4 4 0 0 1 8 0v20-12a4 4 0 0 1 8 0v22c0 12-8 20-18 20-8 0-12-4-16-10l-8-12a4 4 0 0 1 6-5z"/></g><g fill="#ffd23f"><circle cx="8" cy="10" r="3"/><circle cx="56" cy="8" r="3"/><circle cx="58" cy="30" r="2.5"/></g></svg>';
const CLAP='<svg viewBox="0 0 64 64" width="64" height="64"><g fill="#ffcf9e" stroke="#b5651d" stroke-width="2.5" stroke-linejoin="round"><path d="M14 40l14-26a4 4 0 0 1 7 4l-6 12 12-18a4 4 0 0 1 7 4L36 36c6-4 12 0 8 6l-8 10c-6 8-18 8-24 0z"/><path d="M28 50l14-24a4 4 0 0 1 7 4l-8 14 10-12a4 4 0 0 1 6 4L44 52c-4 6-10 8-16 6z" fill="#ffb98a"/></g><g stroke="#ffd23f" stroke-width="3" stroke-linecap="round"><path d="M10 14l5 5M6 26h7M20 6l2 7"/></g></svg>';
function ixUI(on,txt,svg){ const b=$('#ixBox'); if(!b) return; b.classList.toggle('hidden',!on); if(on){ $('#ixTxt').textContent=txt; $('#ixBtn').innerHTML=svg; } }
function kidName(){ const n=(K.BDAY&&K.BDAY.name)||X.profile.name||''; return n; }
function startIx(R,kind){
  const nm=kidName(); const kinds=['wave','hifive','clap',...(nm?['name','name']:[])];
  kind=kind||pick(kinds.filter(k=>k!==R.ix.lastK)); R.ix.lastK=kind; R.ix.n++;
  R.objs=R.objs.filter(o=>!((o.k==='low'||o.k==='high'||o.k==='block')&&o.z>3));
  const c={k:kind,t:0,wave:0,dur:2,hits:0,beats:[],done:false}; R.ix.cur=c;
  if(kind==='wave'){ c.wave=1.6; c.dur=1.8; A.voice('hi_wave'); V.petReact('happy'); }
  else if(kind==='name'){ c.wave=1.8; c.dur=2; A.voice('name_call'); K.floatText('היי '+nm+'!',K.W/2,K.H*.32,'#ffe45c',42); V.petReact('happy'); }
  else if(kind==='hifive'){ c.wave=3.4; c.dur=3.6; A.voice('hi_five'); ixUI(true,'תנו כיף לאפרתושקה!',HAND); }
  else if(kind==='clap'){ c.wave=0; c.dur=4.4; c.beats=[1.3,2.0,2.7,3.4]; A.voice('clap'); ixUI(true,'מחאו כפיים איתי בקצב!',CLAP); }
}
function endIx(R){ const c=R.ix.cur; if(!c) return; ixUI(false); $('#ixBtn').classList.remove('beat');
  if(c.k==='clap'){ if(c.hits>=2){ A.voice('clap_ok'); R.stars+=c.hits*2; K.floatText('+'+(c.hits*2)+' ⭐',K.W/2,K.H*.36,'#ffe45c',38); V.petReact('happy'); K.updHud(); } }
  R.ix.cur=null; R.ix.calm=1.2; R.ix.next=rnd(30,45); }
function ixTap(){ const R=K.R; if(!R||!R.ix||!R.ix.cur) return; const c=R.ix.cur;
  if(c.k==='hifive'&&!c.done){ c.done=true; A.sfx('correct',.7); A.voice('hi_five_ok'); R.stars+=5; K.confetti(K.W/2,K.H*.45,50); K.floatText('כיף! +5 ⭐',K.W/2,K.H*.36,'#ffe45c',40); V.petReact('happy'); K.updHud(); c.wave=Math.min(c.wave,c.t+.9); c.dur=c.t+1; ixUI(false); }
  else if(c.k==='clap'){ const near=c.beats.find(b=>Math.abs(b-c.t)<.32&&!c['h'+b]); A.sfx('coin',.45,near?1.5:1.1); if(near){ c['h'+near]=1; c.hits++; K.sparkle(K.W/2,K.H*.5,'#ffe45c',14); } }
}
if($('#ixBtn')) $('#ixBtn').addEventListener('pointerdown',(e)=>{ e.preventDefault(); e.stopPropagation(); ixTap(); });
V.waveF=R=>{ const c=R&&R.ix&&R.ix.cur; if(!c||c.t>c.wave) return null; return (c.t*13)%19; };
V.calm=R=>!!(R&&R.ix&&(R.ix.cur||R.ix.calm>0));
function comboMoment(R){ if(!R.ix||R.ix.cur||K.G.t-R.ix.lastCombo<14) return; R.ix.lastCombo=K.G.t; const k=pick(['kiss','thumbs']);
  setTimeout(()=>{ if(K.G.state!=='run'||!K.R) return; A.voice(k); const x=K.W/2, y=K.H*.34; if(k==='kiss'){ K.floatText('נשיקה בשבילכם!',x,y,'#ff9ad5',36); for(let i=0;i<5;i++) PS.hearts.push({x:rnd(-.6,.6),y:rnd(0,.5),vy:rnd(1.5,2.5),a:1}); } else K.floatText('לייק ענק!',x,y,'#ffe45c',38); K.R.ix.cur=K.R.ix.cur||{k:'pose',t:0,wave:1.2,dur:1.3,beats:[]}; },1500); }

const _updRun=V.updRun, _onGate=V.onGate, _onCrash=V.onCrash, _onRunStart=V.onRunStart;
V.onRunStart=function(R){ _onRunStart(R); R.ix={next:rnd(20,26),cur:null,calm:0,n:0,lastK:'',lastCombo:-99}; R.pwPrev=0; if(R.v) R.v.buddy=false; ixUI(false); };
V.updRun=function(R,dt,dz){ _updRun(R,dt,dz);
  const ix=R.ix; if(!ix) return;
  const pw=(R.pw.magnet||0)+(R.pw.fly||0)+(R.pw.double||0); if(pw>R.pwPrev+1) V.petReact('happy'); R.pwPrev=pw;
  if(ix.calm>0) ix.calm-=dt;
  if(ix.cur){ const c=ix.cur; c.t+=dt; if(c.k==='clap'){ const on=c.beats.some(b=>Math.abs(b-c.t)<.18); $('#ixBtn').classList.toggle('beat',on); } if(c.t>=c.dur||R.gate||R.ending>0) endIx(R); return; }
  if(R.gate||R.ending>0||(R.v&&R.v.gold>0)||R.dist>R.levelLen-R.speed*6) return;
  ix.next-=dt; if(ix.next<=0){ if(R.gateTimer<5){ ix.next=R.gateTimer+6; return; } startIx(R); }
};
V.onGate=function(R,ok,q){ _onGate(R,ok,q); V.petReact(ok?'happy':'worried'); if(ok&&R.combo>=3) comboMoment(R); };
V.onCrash=function(R){ _onCrash(R); V.petReact('worried'); };
V.ixStart=(k)=>{ const R=K.R; if(R&&R.ix){ if(R.ix.cur) endIx(R); startIx(R,k); } };
V.ixTap=ixTap; V.PS=PS;

/* ---- idle chatter on the menu (rare, rotating) ---- */
let idleTimer=null, lastIdle='';
const _onMenu=V.onMenu;
V.onMenu=function(){ _onMenu(); clearTimeout(idleTimer); idleTimer=setTimeout(()=>{ if(K.G.state!=='menu'||!$('#scrMenu').classList.contains('show')||A.voiceBusy()) return; if(Date.now()-X3.idleT<60000) return; X3.idleT=Date.now();
  const l=['idle1','idle2','idle3','joke1','joke2',...(X.pets.active?['pet_cute','pet_go']:[])].filter(x=>x!==lastIdle); lastIdle=pick(l); A.voice(lastIdle); },16000); };

/* ---- surprise codes (hash-validated; plaintext list is NOT in the site) ---- */
const CODEH={"66bbe713042d486d5ae408b5":"show","25351e6446cbc7b19bb36f7b":"bday","d5f82d0613b0b4b4a34dca52":"all","c82b63fc377279eb8550560e":"one","f5248f68743f3b3b38b0e7a2":"one","10066eebf27c001d033038be":"one","765b6ca70b64e5eea5abea5a":"one","0eaf179daa7c93c6435d6eeb":"one","3689685ad3e4c70df69e3c96":"one","cee59946e0cb8d2bb50fc297":"one","0009c222f25a0d311667040a":"one","16083ae983ba71a75ad24596":"one","73ccdc83cb07264c4825f0d5":"one","8b8aeee9508c49f1ffe60527":"one","109d365cf9da663faa7a5da0":"one","35582c8c64883519f25d5162":"one","ce9907c5c474e36fc1d468e3":"one","418dc10b1cec4d6e460d328d":"one","ee3dcdce89570e36300f555f":"one","3fbcd94657b432f52f471c6b":"one","cecf446ede94d9c28b5c982d":"one","419771b898e3d0ca1b9cd6b6":"one","0aa5425ac493cecde1eb1ae3":"one"};
async function codeHash(c){ const n=String(c).toUpperCase().replace(/[^A-Z0-9]/g,''); const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('efr3|'+n)); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('').slice(0,24); }
function giveOutfit(){ if(!S.owned.outfit.includes('showstar')) S.owned.outfit.push('showstar'); S.sel.outfit='showstar'; }
function giveMic(){ if(!S.owned.trail.includes('goldmic')) S.owned.trail.push('goldmic'); S.sel.trail='goldmic'; }
function givePhoenix(){ if(!X.pets.owned.find(p=>p.id==='phoenix')) X.pets.owned.push({id:'phoenix',lvl:1,xp:0}); X.pets.active='phoenix'; IP('pet_phoenix'); }
function codeScreen(){ open('scrCode'); $('#codeIn').value=''; $('#codeMsg').textContent=''; }
async function redeem(){ const raw=$('#codeIn').value.trim(); const msg=$('#codeMsg'); if(!raw){ msg.textContent='הקלידו את הקוד שקיבלתם מאפרתושקה'; return; }
  if(X3.fails>=5&&Date.now()-X3.failT<30000){ msg.textContent='רגע… נסו שוב בעוד חצי דקה'; return; }
  let h=''; try{ h=await codeHash(raw); }catch(e){ msg.textContent='הדפדפן לא תומך בבדיקת קודים'; return; }
  const kind=CODEH[h]; if(!kind){ X3.fails++; X3.failT=Date.now(); save(); A.sfx('wrong',.5); A.voice('code_bad'); msg.textContent='הקוד הזה לא מוכר. בדקו אותיות ומספרים 🙂'; return; }
  if(X3.codes.includes(h)){ msg.textContent='את הקוד הזה כבר הפעלתם במכשיר הזה ✔'; A.sfx('coin',.4); return; }
  X3.codes.push(h); X3.fails=0; const items=[];
  if(kind==='show'||kind==='all'||kind==='one'){ giveOutfit(); giveMic(); items.push('בגד „כוכבת מופע”','שובל „מיקרופון זהב”'); }
  if(kind==='bday'||kind==='all'||kind==='one'){ givePhoenix(); items.push('חברת קסם בלעדית: ציפור זהב'); }
  if(kind==='one'){ S.stars+=200; items.push('+200 ⭐'); }
  save(); K.updMenu(); badgeUpd(); msg.textContent='';
  reveal({title:'קוד הפתעה! 🎉',sub:items.join(' · '),img:(kind==='show'?null:url('pet_phoenix')),voice:'code_ok'}); A.sfx('confetti',.7); K.confetti(K.W/2,K.H*.3,80);
}

/* ---- weekly champions (pluggable backend; demo mode until configured) ---- */
const CFG=window.EFCFG||{}; const LBLIVE=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
const AGEG=a=>a<=5?'3-5':a<=8?'6-8':'9-10';
const NA=['כוכבת','דרקון','חד-קרן','פנדה','ארנבון','חתלתול','נסיכת','גיבור','רקדנית','קוסם','ציפור','דולפין'], NB=['ורוד','אמיץ','נוצץ','מהיר','קסום','שמח','זהוב','סגול','מצחיק','רוקד','כחול','מתוק'];
const BAD=['זונה','שרמוט','מניאק','זין','כוס','חרא','מטומטם','דפוק','אידיוט','מפגר','זבל','סתום','fuck','shit','bitch','dick','sex','porn','ass','nazi','hitler','kill'];
function nickOk(n){ n=String(n||'').trim().replace(/\s+/g,' '); if(n.length<2||n.length>14) return [false,'2 עד 14 אותיות']; if(!/^[\u0590-\u05FFa-zA-Z \-]+$/.test(n)) return [false,'רק אותיות (בלי מספרים וסימנים)']; const l=n.toLowerCase().replace(/[\s\-]/g,''); if(BAD.some(b=>l.includes(b))) return [false,'בחרו כינוי נחמד יותר 🙂']; return [true,n]; }
function randNick(){ return pick(NA)+' '+pick(NB); }
function lbWeekSync(){ const wk=weekKey(); if(X3.lb.week!==wk){ X3.lb.week=wk; X3.lb.score=0; } }
let lbGroup=null;
function seedRand(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function demoBoard(g){ const wk=weekKey(); let h=0; for(const ch of wk+g) h=(h*31+ch.charCodeAt(0))|0; const r=seedRand(h); const base={'3-5':900,'6-8':1400,'9-10':1900}[g];
  const list=[]; for(let i=0;i<10;i++) list.push({nick:NA[Math.floor(r()*NA.length)]+' '+NB[Math.floor(r()*NB.length)],score:Math.round(base*(1-i*.08)*(.85+r()*.3))});
  if(X3.lb.on&&X3.lb.nick&&AGEG(S.age)===g) list.push({nick:X3.lb.nick,score:X3.lb.score,me:true}); return list.sort((a,b)=>b.score-a.score).slice(0,10); }
async function lbFetch(g){ if(!LBLIVE) return demoBoard(g);
  const u=CFG.supabaseUrl.replace(/\/$/,'')+'/rest/v1/weekly_top?select=nick,score&week=eq.'+encodeURIComponent(weekKey())+'&age_group=eq.'+encodeURIComponent(g)+'&order=score.desc&limit=10';
  const r=await fetch(u,{headers:{apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+CFG.supabaseAnonKey}}); if(!r.ok) throw new Error('lb '+r.status); const l=await r.json(); return l.map(e=>Object.assign(e,{me:X3.lb.on&&e.nick===X3.lb.nick})); }
async function lbSubmit(){ if(!LBLIVE||!X3.lb.on||!X3.lb.nick) return; try{ await fetch(CFG.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rpc/submit_score',{method:'POST',headers:{'Content-Type':'application/json',apikey:CFG.supabaseAnonKey,Authorization:'Bearer '+CFG.supabaseAnonKey},body:JSON.stringify({p_device:X3.lb.dev,p_nick:X3.lb.nick,p_age_group:AGEG(S.age),p_week:weekKey(),p_score:X3.lb.score})}); }catch(e){} }
function champsScreen(){ lbWeekSync(); open('scrChamps'); lbGroup=lbGroup||AGEG(S.age); renderChamps(); if(!A.voiceBusy()) A.voice('champs_week',{exact:true}); }
async function renderChamps(){ const tabs=$('#chTabs'); tabs.innerHTML=''; ['3-5','6-8','9-10'].forEach(g=>{ const b=el('button','chip'+(g===lbGroup?' on':''),'גילאי '+g); b.addEventListener('click',()=>{ lbGroup=g; A.sfx('coin',.3); renderChamps(); }); tabs.appendChild(b); });
  $('#chDemo').classList.toggle('hidden',LBLIVE); const list=$('#chList'); list.innerHTML='<div class="sub">טוען…</div>';
  let rows=[]; try{ rows=await lbFetch(lbGroup); }catch(e){ list.innerHTML='<div class="sub">אין חיבור כרגע – נסו מאוחר יותר</div>'; return; }
  list.innerHTML=''; rows.forEach((e,i)=>{ const r=el('div','chrow'+(e.me?' me':'')); r.appendChild(el('b','chpos',String(i+1))); if(i<3){ const m=el('i','medal m'+i); r.appendChild(m); } r.appendChild(el('span','chnick',e.nick)); r.appendChild(el('span','chsc',e.score+' ⭐')); list.appendChild(r); });
  const me=$('#chMe'); me.textContent=X3.lb.on?('הכינוי שלכם: '+X3.lb.nick+' · השבוע: '+X3.lb.score+' ⭐'):'רוצים להופיע בטבלה? הורה צריך לאשר ולבחור כינוי.';
  $('#chJoin').textContent=X3.lb.on?'⚙️ שינוי כינוי / יציאה':'✨ הצטרפות לטבלה (הורים)'; }
function joinScreen(){ open('scrNick'); $('#nkIn').value=X3.lb.nick||randNick(); $('#nkMsg').textContent=''; $('#nkLeave').classList.toggle('hidden',!X3.lb.on); }
V.lbAdd=function(earned){ lbWeekSync(); X3.lb.score+=Math.max(0,earned|0); save(); lbSubmit(); };
const _onLevelEnd=V.onLevelEnd; V.onLevelEnd=function(R,earned){ const r=_onLevelEnd(R,earned); V.lbAdd(earned); return r; };

/* ---- install as app (PWA) ---- */
let deferredPrompt=null; const isStandalone=()=>window.matchMedia&&matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const isIOS=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
window.addEventListener('beforeinstallprompt',(e)=>{ e.preventDefault(); deferredPrompt=e; instUpd(); });
window.addEventListener('appinstalled',()=>{ deferredPrompt=null; instUpd(); K.toast('אפרתושקה על המסך! 🎉'); });
function instUpd(){ const b=$('#tInstall'); if(b) b.classList.toggle('hidden',isStandalone()); }
async function install(){ A.voice('install',{exact:true}); if(deferredPrompt){ deferredPrompt.prompt(); try{ await deferredPrompt.userChoice; }catch(e){} deferredPrompt=null; instUpd(); return; }
  $('#instIOS').classList.toggle('hidden',!isIOS()); $('#instOther').classList.toggle('hidden',isIOS()); open('scrInstall'); }
instUpd();

/* ---- social / show booking (config-driven, shown only when filled, parents area only) ---- */
function socialUpd(){ const s=CFG.social||{}; const box=$('#parSocial'); if(!box) return; const links=[['facebook','פייסבוק'],['tiktok','טיקטוק'],['instagram','אינסטגרם'],['youtube','יוטיוב']].filter(([k])=>/^https:\/\//.test(s[k]||''));
  const wa=String(s.whatsapp||'').replace(/[^0-9]/g,''); const row=$('#parSocialRow'); row.innerHTML='';
  links.forEach(([k,n])=>{ const a=el('a','btn mid soc '+k,n); a.href=s[k]; a.target='_blank'; a.rel='noopener noreferrer'; row.appendChild(a); });
  const bw=$('#parBook'); if(wa.length>=9){ bw.href='https://wa.me/'+wa+'?text='+encodeURIComponent(s.bookingText||'היי אפרתושקה! אשמח לפרטים על הזמנת מופע 🎉'); bw.classList.remove('hidden'); } else bw.classList.add('hidden');
  box.classList.toggle('hidden',!links.length&&wa.length<9); }

/* ---- wiring ---- */
const on3=(sel,fn)=>{ const e=$(sel); if(e) e.addEventListener('click',()=>{ A.unlock(); A.sfx('coin',.35); fn(); }); };
on3('#tChamps',champsScreen); on3('#tCode',codeScreen); on3('#tInstall',install);
on3('#codeGo',redeem); $('#codeIn')&&$('#codeIn').addEventListener('keydown',e=>{ if(e.key==='Enter') redeem(); });
on3('#chJoin',()=>parentGate(joinScreen)); on3('#chBack',()=>K.goMenu());
on3('#nkRand',()=>{ $('#nkIn').value=randNick(); });
on3('#nkSave',()=>{ const [ok,v]=nickOk($('#nkIn').value); if(!ok){ $('#nkMsg').textContent=v; A.sfx('wrong',.4); return; } X3.lb.nick=v; X3.lb.on=true; lbWeekSync(); save(); lbSubmit(); A.voice('lb_you',{exact:true}); champsScreen(); });
on3('#nkLeave',()=>{ X3.lb.on=false; save(); champsScreen(); });
on3('#nkBack',()=>champsScreen());
socialUpd();
V.codeScreen=codeScreen; V.champsScreen=champsScreen; V.redeem=redeem; V.nickOk=nickOk; V.socialUpd=socialUpd; V.lbLive=()=>LBLIVE; V.X3=X3;
loadPhoto();
return V;
};
