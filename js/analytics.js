/* אפרתושקה – סטטיסטיקה אנונימית וקלה. מזהה אקראי למכשיר בלבד; אין שמות/טלפונים אלא אם הורה מילא טופס ביוזמתו. */
(function(){
'use strict';
const C=window.EFCFG||{}; if(!C.supabaseUrl||!C.supabaseAnonKey){ window.EFT=Object.assign(function(){},{nick(){},leadSoft(){}}); return; }
const API=C.supabaseUrl.replace(/\/$/,'')+'/rest/v1/rpc/', H={'Content-Type':'application/json',apikey:C.supabaseAnonKey,Authorization:'Bearer '+C.supabaseAnonKey};
const LS={g(k){try{return localStorage.getItem(k);}catch(e){return null;}},s(k,v){try{localStorage.setItem(k,v);}catch(e){}}};
const uuid=()=>(crypto.randomUUID?crypto.randomUUID():'10000000-1000-4000-8000-100000000000'.replace(/[018]/g,c=>(c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16)));
let dev=LS.g('ef_aid'); const isNew=!dev; if(!dev){ dev=uuid(); LS.s('ef_aid',dev); LS.s('ef_afirst',new Date().toISOString()); }
const sess=uuid(), t0=Date.now(); let nick=null, mode=null, lvl=null, errs=0, sent=0;
function rpc(fn,body,keep){ return fetch(API+fn,{method:'POST',headers:H,body:JSON.stringify(body),keepalive:!!keep}); }
function T(type,o){ o=o||{}; if(sent++>600) return; if(o.mode) mode=o.mode; if(o.level!=null) lvl=o.level;
  const p=Object.assign({},o.p||{}); if(nick) p.nick=nick;
  rpc('track',{p_device:dev,p_sess:sess,p_type:type,p_mode:o.mode||mode||null,p_level:o.level!=null?o.level:null,p_score:o.score!=null?Math.round(o.score):null,p_dur:o.dur!=null?Math.round(o.dur):null,p_props:p},o.keep).catch(()=>{});
  if(type==='finish') afterFinish(o); if(type==='start'||type==='quit') close(false); }
// environment (coarse)
const ua=navigator.userAgent||'', q=new URLSearchParams(location.search);
const os=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1)?'iOS':/Android/.test(ua)?'Android':/Windows/.test(ua)?'Windows':/Mac OS/.test(ua)?'macOS':/Linux/.test(ua)?'Linux':'other';
const br=/FBAN|FBAV/.test(ua)?'Facebook':/Instagram/.test(ua)?'Instagram':/WhatsApp/.test(ua)?'WhatsApp':/SamsungBrowser/.test(ua)?'Samsung':/Edg\//.test(ua)?'Edge':/CriOS|Chrome\//.test(ua)?'Chrome':/FxiOS|Firefox/.test(ua)?'Firefox':/Safari/.test(ua)?'Safari':'other';
const mob=/Mobi|Android|iPhone|iPod/.test(ua), tab=/iPad|Tablet/.test(ua)||(os==='iOS'&&!/iPhone/.test(ua))||(/Android/.test(ua)&&!/Mobi/.test(ua));
const standalone=(matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone===true;
let ref=''; try{ ref=document.referrer?new URL(document.referrer).hostname:''; }catch(e){}
if(ref===location.hostname) ref='';
const utm={}; ['utm_source','utm_medium','utm_campaign','utm_content'].forEach(k=>{ const v=q.get(k); if(v) utm[k.slice(4)]=v.slice(0,40); });
const last=LS.g('ef_alast'); const gapD=last?Math.floor((Date.now()-(+last))/864e5):null; LS.s('ef_alast',String(Date.now()));
T('open',{p:{new:isNew,first:LS.g('ef_afirst'),gap:gapD,ref,utm,ch:q.get('challenge')?1:0,from:q.get('from')?1:0,qmode:q.get('mode')||null,bday:q.get('name')?1:0,
  dt:tab?'tablet':mob?'mobile':'desktop',os,br,sw:screen.width,sh:screen.height,dpr:Math.round((devicePixelRatio||1)*10)/10,lang:(navigator.language||'').slice(0,8),tz:(Intl.DateTimeFormat().resolvedOptions().timeZone||'').slice(0,40),pwa:standalone,push:('Notification' in window)?Notification.permission:'na'}});
if(q.get('challenge')) T('challenge_open',{p:{score:+q.get('challenge')||0,adult:q.get('mode')==='adult'}});
// heartbeat (live counter + session length)
let active=0, lastTick=Date.now();
setInterval(()=>{ const n=Date.now(); if(document.visibilityState==='visible'){ active+=(n-lastTick)/1000; } lastTick=n; if(document.visibilityState==='visible') T('hb',{dur:active}); },60000);
document.addEventListener('visibilitychange',()=>{ const n=Date.now(); if(document.visibilityState==='hidden'){ active+=(n-lastTick)/1000; T('end',{dur:active,keep:true}); } lastTick=n; });
window.addEventListener('appinstalled',()=>T('install'));
window.addEventListener('error',e=>{ if(errs++<5) T('error',{p:{m:String(e.message||'').slice(0,160),f:String(e.filename||'').split('/').pop().slice(0,40),l:e.lineno||0}}); });
window.addEventListener('unhandledrejection',e=>{ if(errs++<5) T('error',{p:{m:('promise: '+String(e.reason&&e.reason.message||e.reason)).slice(0,160)}}); });
T.nick=function(n){ if(n&&n!==nick){ nick=String(n).slice(0,14); if(!T._nk){ T._nk=1; T('nick'); } } };
// ---------- parents' opt-in card (lead + push) ----------
const st=document.createElement('style'); st.textContent=`
#efLead{position:fixed;left:50%;top:10px;transform:translateX(-50%);width:min(94vw,420px);z-index:9999;background:#fff;border-radius:22px;padding:14px 16px 12px;box-shadow:0 10px 30px rgba(0,0,0,.35);direction:rtl;font-family:Rubik,system-ui,sans-serif;color:#3a1250;animation:efUp .35s ease}
@keyframes efUp{from{transform:translate(-50%,-130%)}to{transform:translate(-50%,0)}}
#efLead h3{margin:0 0 4px;font-size:18px;color:#d4157f;padding-left:28px} #efLead p{margin:0 0 8px;font-size:13px;opacity:.8}
#efLead input[type=text],#efLead input[type=tel]{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:8px 12px;border:2px solid #e9c6ff;border-radius:14px;margin:3px 0;direction:rtl}
#efLead label{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;margin:6px 0} #efLead .x{position:absolute;top:8px;left:10px;border:0;background:none;font-size:22px;color:#a08;cursor:pointer}
#efLead .row{display:flex;gap:8px;margin-top:6px} #efLead .row .btn{flex:1;padding:9px 6px;font-size:15px} #efLead .msg{font-size:13px;color:#c00;min-height:1em}`;
document.head.appendChild(st);
function close(dis){ const e=document.getElementById('efLead'); if(e) e.remove(); if(dis){ LS.s('ef_lead_dis',String(Date.now())); LS.s('ef_lead_n',String((+LS.g('ef_lead_n')||0)+1)); T('lead_dismiss'); } }
const pushOK=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window&&C.vapidPublicKey;
function canShow(){ if(document.getElementById('efLead')) return false; if(LS.g('ef_lead_done')) return false; if((+LS.g('ef_lead_n')||0)>=3) return false; const d=+LS.g('ef_lead_dis')||0; return Date.now()-d>3*864e5; }
function show(src){
  if(!canShow()) return; T('lead_view',{p:{src}});
  const w=document.createElement('div'); w.id='efLead'; w.setAttribute('role','dialog');
  w.innerHTML=`<button class="x" aria-label="סגירה">×</button><h3>רוצים לקבל הטבות והזמנות למופעים של אפרתושקה? 🎉</h3>
  <p>לאמא ואבא בלבד (לא לילדים): השאירו שם וטלפון ואפרתושקה תשלח לכם הטבות ומועדי מופעים.</p>
  <input type="text" id="efLn" maxlength="40" placeholder="שם ההורה" autocomplete="name"><input type="tel" id="efLp" maxlength="16" placeholder="טלפון" autocomplete="tel" dir="ltr">
  <label><input type="checkbox" id="efLc"> אני הורה (מעל 18) ומאשר/ת לאפרתושקה לפנות אליי בוואטסאפ/טלפון עם הטבות ומידע על מופעים. אפשר לבקש הסרה בכל עת.</label>
  <div class="msg" id="efLm"></div><div class="row"><button class="btn pink" id="efLs">שליחה</button>${pushOK()&&Notification.permission!=='denied'?'<button class="btn purple" id="efPu">🔔 התראות על מופעים</button>':''}<button class="btn gray" id="efLx">לא עכשיו</button></div>`;
  document.body.appendChild(w);
  const sc=document.getElementById(src==='champs'?'scrChamps':'scrResult'); if(sc){ const iv=setInterval(()=>{ if(!document.getElementById('efLead')){clearInterval(iv);return;} if(sc.offsetParent===null&&!w.contains(document.activeElement)){ clearInterval(iv); close(false); } },700); }
  w.querySelector('.x').onclick=()=>close(true); w.querySelector('#efLx').onclick=()=>close(true);
  const pu=w.querySelector('#efPu'); if(pu) pu.onclick=async()=>{ const r=await T.push(); pu.textContent=r?'✔ התראות פעילות':'לא אושר'; pu.disabled=true; };
  w.querySelector('#efLs').onclick=async()=>{ const n=w.querySelector('#efLn').value.trim(), ph=w.querySelector('#efLp').value.replace(/[^\d+\- ]/g,'').trim(), c=w.querySelector('#efLc').checked, m=w.querySelector('#efLm');
    if(n.length<2){ m.textContent='נא לכתוב שם'; return; } if(ph.replace(/\D/g,'').length<9){ m.textContent='נא לכתוב מספר טלפון תקין'; return; } if(!c){ m.textContent='צריך לסמן אישור הורה'; return; }
    try{ const r=await rpc('submit_lead',{p_device:dev,p_name:n,p_phone:ph,p_consent:true,p_src:src}); if(!r.ok) throw 0; LS.s('ef_lead_done','1'); T('lead_submit',{p:{src}}); w.innerHTML='<h3>תודה! 💖</h3><p>אפרתושקה תהיה בקשר. אפשר להמשיך לשחק!</p>'; setTimeout(()=>close(false),2500); }catch(e){ m.textContent='לא נשלח, נסו שוב'; } };
}
let fins=0; function afterFinish(o){ fins++; if(fins>=2||(o.level||0)>=3) setTimeout(()=>{ const r=document.getElementById('scrResult')||document.querySelector('#rStats'); if(!r||r.offsetParent!==null) show('level'); },2600); }
T.leadSoft=function(src){ setTimeout(()=>show(src||'champs'),1200); };
T.lead=show;
const b64=s=>{ s=s.replace(/-/g,'+').replace(/_/g,'/'); s+='='.repeat((4-s.length%4)%4); return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); };
T.push=async function(){ try{ if(!pushOK()) return false; const p=await Notification.requestPermission(); T('push_perm',{p:{r:p}}); if(p!=='granted') return false;
  const reg=await navigator.serviceWorker.ready; let s=await reg.pushManager.getSubscription(); if(!s) s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(C.vapidPublicKey)});
  const j=s.toJSON(); const r=await rpc('push_subscribe',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_device:dev,p_mode:mode}); T('push_sub'); return r.ok; }catch(e){ T('error',{p:{m:'push: '+String(e&&e.message||e).slice(0,140)}}); return false; } };
window.EFT=T;
})();
