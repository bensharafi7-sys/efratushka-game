/* זומי בומי – ספרייה משותפת למיני-משחקים (שמירה, אודיו, ספרייטים, בועות דיבור, קונפטי) */
'use strict';
window.ZB=(function(){
const scr=document.currentScript;
const BASE=scr&&scr.src?new URL('.',scr.src).href:'../lib/';
const A=BASE+'assets/';
const MAIN='efratushka_v1', OWN='zumi_games_v1';
const $=s=>document.querySelector(s);
const rnd=(a,b)=>a+Math.random()*(b-a), rint=(a,b)=>Math.floor(rnd(a,b+1)), pick=a=>a[Math.floor(Math.random()*a.length)];
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function mulberry(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function todayKey(){ const d=new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function todaySeed(){ const k=todayKey(); let h=2166136261; for(const c of k){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }

/* ---------- save (compatible with main game star balance) ---------- */
function readMain(){ try{ const s=JSON.parse(localStorage.getItem(MAIN)); return s&&typeof s==='object'?s:null; }catch(e){ return null; } }
function writeMain(m){ try{ localStorage.setItem(MAIN,JSON.stringify(m)); }catch(e){} }
let own={}; try{ own=JSON.parse(localStorage.getItem(OWN))||{}; }catch(e){ own={}; }
function saveOwn(){ try{ localStorage.setItem(OWN,JSON.stringify(own)); }catch(e){} }
const save={
  get own(){ return own; }, saveOwn,
  get hasMain(){ return !!readMain(); },
  get age(){ const m=readMain(); if(m&&m.age>=3&&m.age<=10) return m.age|0; return own.age|0; },
  setAge(a){ a=Math.max(3,Math.min(10,a|0)); own.age=a; saveOwn(); const m=readMain(); if(m){ m.age=a; writeMain(m); } },
  get stars(){ const m=readMain(); return m?(m.stars|0):(own.stars|0); },
  addStars(n){ n=n|0; if(n<=0) return save.stars; const m=readMain(); if(m){ m.stars=(m.stars|0)+n; writeMain(m); } else { own.stars=(own.stars|0)+n; saveOwn(); } return save.stars; },
  game(id){ own.g=own.g||{}; own.g[id]=own.g[id]||{}; return own.g[id]; }
};

/* ---------- audio ---------- */
let ctx=null, master, sfxBus, voiceBus; const raw={}, buf={}, fetching={};
let muted=own.sound===false; let musicEl=null, musicName=null, musicVol=.38, curVoice=null, voiceEnd=0;
const AVER={ef_enc5:'_r3',e_k_cream:'_r3',ef_champs:'_r3',z_yay:'_r3'};
function url(k){ if(k.startsWith('s_')) return A+'audio/sfx/'+k.slice(2)+'.mp3'; return A+'audio/voice/'+k+(AVER[k]||'')+'.mp3'; }
function fetchRaw(k){ if(buf[k]||raw[k]) return Promise.resolve(); if(fetching[k]) return fetching[k];
  fetching[k]=fetch(url(k)).then(r=>{ if(!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(b=>{ raw[k]=b; if(ctx) return decode(k); }).catch(e=>{ console.warn('audio',k,e.message); });
  return fetching[k]; }
function decode(k){ if(buf[k]||!raw[k]||!ctx) return Promise.resolve(buf[k]); const ab=raw[k]; raw[k]=null;
  return new Promise(res=>{ try{ const p=ctx.decodeAudioData(ab,b=>{ buf[k]=b; res(b); },()=>res(null)); if(p&&p.catch) p.catch(()=>res(null)); }catch(e){ res(null); } }); }
function preload(list){ return Promise.all(list.map(k=>fetchRaw(k))); }
const SFX=['jump','coin','correct','wrong','powerup','confetti','bump'];
function unlock(){
  if(ctx){ if(ctx.state==='suspended') ctx.resume(); if(musicEl&&musicEl.paused&&!muted&&musicName){ const p=musicEl.play(); if(p&&p.catch) p.catch(()=>{}); } return; }
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  try{ ctx=new AC(); }catch(e){ return; }
  master=ctx.createGain(); master.gain.value=muted?0:1; master.connect(ctx.destination);
  sfxBus=ctx.createGain(); sfxBus.gain.value=.7; sfxBus.connect(master);
  voiceBus=ctx.createGain(); voiceBus.gain.value=1; voiceBus.connect(master);
  const b=ctx.createBuffer(1,1,22050), s=ctx.createBufferSource(); s.buffer=b; s.connect(master); s.start(0);
  Object.keys(raw).forEach(k=>{ if(raw[k]) decode(k); });
  if(musicEl&&musicName&&!muted){ const p=musicEl.play(); if(p&&p.catch) p.catch(()=>{}); }
}
['pointerdown','keydown','touchend'].forEach(ev=>window.addEventListener(ev,unlock,{passive:true}));
function play(k,bus,vol,rate){ if(!ctx||!buf[k]) { if(!buf[k]) fetchRaw(k); return null; } const s=ctx.createBufferSource(); s.buffer=buf[k]; if(rate) s.playbackRate.value=rate; const g=ctx.createGain(); g.gain.value=vol==null?1:vol; s.connect(g); g.connect(bus); s.start(); return s; }
function sfx(n,vol,rate){ return play('s_'+n,sfxBus,vol,rate); }
function duck(d){ if(!musicEl) return; musicEl.volume=muted?0:musicVol*.35; clearTimeout(duck.t); duck.t=setTimeout(()=>{ if(musicEl) musicEl.volume=muted?0:musicVol; },d*1000+200); }
/* say(id): plays a voice line + shows a speech bubble. Resolves when finished. */
function say(id,opts){ opts=opts||{}; if(!id) return Promise.resolve();
  return new Promise(async res=>{ try{
    if(!buf[id]) { await Promise.race([fetchRaw(id),new Promise(r=>setTimeout(r,opts.wait||1500))]); if(ctx&&raw[id]) await decode(id); }
    if(curVoice&&!opts.overlap){ try{ curVoice.stop(); }catch(e){} curVoice=null; }
    const s=play(id,voiceBus,1);
    const txt=(window.ZB_TEXT||{})[id];
    const dur=s?s.buffer.duration:Math.max(1.6,(txt||'').length*0.075);
    if(txt&&opts.bubble!==false) bubble(id.startsWith('z')?'z':'e',txt,dur);
    if(s){ curVoice=s; voiceEnd=performance.now()+dur*1000; duck(dur); s.onended=()=>{ if(curVoice===s) curVoice=null; }; }
    setTimeout(res,dur*1000+(opts.gap==null?120:opts.gap));
  }catch(e){ console.warn('say',id,e&&e.message); res(); } });
}
async function chain(ids,gap){ for(const id of ids){ if(!id) continue; await say(id,{gap:gap==null?150:gap}); } }
function voiceBusy(){ return performance.now()<voiceEnd; }
function music(name){ if(musicName===name) return; stopMusic(); if(!name) return; musicName=name; musicEl=new Audio(A+'audio/music/'+name+'.mp3'); musicEl.loop=true; musicEl.volume=muted?0:musicVol; if(ctx&&!muted){ const p=musicEl.play(); if(p&&p.catch) p.catch(()=>{}); } }
function stopMusic(){ if(musicEl){ try{ musicEl.pause(); }catch(e){} musicEl.src=''; } musicEl=null; musicName=null; }
function setMuted(m){ muted=m; own.sound=!m; saveOwn(); if(master) master.gain.value=m?0:1; if(musicEl){ musicEl.volume=m?0:musicVol; if(!m&&ctx){ const p=musicEl.play(); if(p&&p.catch) p.catch(()=>{}); } } document.querySelectorAll('[data-zb-mute]').forEach(b=>b.textContent=m?'🔇':'🔊'); }
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(ctx&&ctx.state==='running') ctx.suspend(); if(musicEl) musicEl.pause(); } else { if(ctx&&ctx.state==='suspended') ctx.resume(); if(musicEl&&!muted&&ctx){ const p=musicEl.play(); if(p&&p.catch) p.catch(()=>{}); } } });

/* ---------- sprites ---------- */
const SP={}; let metaP=null;
function meta(){ if(!metaP) metaP=Promise.all(['zumi','efrat'].map(n=>fetch(A+'sprites/'+n+'.json').then(r=>r.json()).catch(()=>({})))).then(([a,b])=>Object.assign({},a,b)); return metaP; }
function loadImg(src){ return new Promise(res=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>{ console.warn('img',src); res(null); }; i.src=src; }); }
async function sprites(names){ const m=await meta(); await Promise.all(names.map(async n=>{ if(SP[n]||!m[n]) return; const img=await loadImg(A+'sprites/'+m[n].file); if(img) SP[n]=Object.assign({img},m[n]); })); return SP; }
function drawSprite(c,name,frame,cx,by,h,flip,alpha){ const s=SP[name]; if(!s) return false; const f=((frame|0)%s.n+s.n)%s.n; const sx=(f%s.cols)*s.fw, sy=Math.floor(f/s.cols)*s.fh; const w=h*s.fw/s.fh;
  c.save(); if(alpha!=null) c.globalAlpha=alpha; c.translate(cx,by); if(flip) c.scale(-1,1); c.drawImage(s.img,sx,sy,s.fw,s.fh,-w/2,-h,w,h); c.restore(); return true; }
/* DOM sprite (for HTML layouts): a div whose background steps through frames */
function domSprite(el,name,fps){ const st={name,fps:fps||12,t0:performance.now(),once:null};
  function frame(){ const s=SP[st.name]; if(!s){ requestAnimationFrame(frame); return; } const H=el.clientHeight||200, W=H*s.fw/s.fh; el.style.width=W+'px';
    let f=Math.floor((performance.now()-st.t0)/1000*st.fps); if(st.once&&f>=s.n){ const n=st.once; st.once=null; st.name=n; st.t0=performance.now(); f=0; }
    const ss=SP[st.name]; f%=ss.n; el.style.backgroundImage='url('+ss.img.src+')'; el.style.backgroundSize=(ss.cols*W)+'px auto'; el.style.backgroundPosition=(-(f%ss.cols)*W)+'px '+(-Math.floor(f/ss.cols)*H)+'px'; requestAnimationFrame(frame); }
  requestAnimationFrame(frame);
  return { set(n,f){ if(st.name!==n){ st.name=n; st.t0=performance.now(); } if(f) st.fps=f; }, playOnce(n,then,f){ st.name=n; st.once=then||st.name; st.t0=performance.now(); if(f) st.fps=f; }, get name(){ return st.name; } };
}

/* ---------- UI: bubbles, toast, confetti ---------- */
function ensure(id,tag,parent){ let e=document.getElementById(id); if(!e){ e=document.createElement(tag||'div'); e.id=id; (parent||$('#app')||document.body).appendChild(e); } return e; }
function bubble(who,text,dur){ const box=ensure('zbBubbles'); const b=document.createElement('div'); b.className='bub '+who; b.innerHTML='<img alt="" src="'+A+'img/'+(who==='z'?'zumi_face':'efrat_face')+'.webp"><span></span>'; b.querySelector('span').textContent=text; box.appendChild(b); while(box.children.length>2) box.firstChild.remove();
  setTimeout(()=>{ b.classList.add('out'); setTimeout(()=>b.remove(),320); },Math.max(1400,dur*1000+500)); }
function toast(t,ms){ const e=ensure('zbToast'); e.textContent=t; e.style.opacity=1; clearTimeout(toast.t); toast.t=setTimeout(()=>e.style.opacity=0,ms||1400); }
const parts=[]; let fxc=null, fxx=null, fxOn=false;
const CONF=['#ff4fa8','#ffd23f','#3fd4ff','#7b2ff2','#5be37a','#ff8a3d','#ffffff'];
function fxCanvas(){ if(!fxc){ fxc=ensure('zbFx','canvas'); fxx=fxc.getContext('2d'); } const r=fxc.getBoundingClientRect(), d=Math.min(2,window.devicePixelRatio||1); if(fxc.width!==Math.round(r.width*d)){ fxc.width=Math.round(r.width*d); fxc.height=Math.round(r.height*d); } return d; }
function confetti(x,y,n,spread){ const d=fxCanvas(); const W=fxc.width/d, H=fxc.height/d; if(x==null){ x=W/2; y=H*.4; }
  for(let i=0;i<(n||60);i++){ const a=rnd(0,Math.PI*2), v=rnd(150,520)*(spread||1); parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(150,350),life:rnd(1.2,2.2),age:0,col:pick(CONF),s:rnd(5,10),rot:rnd(0,6),vr:rnd(-10,10)}); }
  if(!fxOn){ fxOn=true; let last=performance.now(); const loop=t=>{ const dt=Math.min(.05,(t-last)/1000); last=t; const dd=fxCanvas(); fxx.setTransform(dd,0,0,dd,0,0); fxx.clearRect(0,0,fxc.width,fxc.height);
    for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.age+=dt; if(p.age>p.life){ parts.splice(i,1); continue; } p.vy+=600*dt; p.vx*=.99; p.x+=p.vx*dt; p.y+=p.vy*dt; p.rot+=p.vr*dt; fxx.save(); fxx.globalAlpha=Math.min(1,(p.life-p.age)*2); fxx.translate(p.x,p.y); fxx.rotate(p.rot); fxx.fillStyle=p.col; fxx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); fxx.restore(); }
    if(parts.length) requestAnimationFrame(loop); else { fxOn=false; fxx.clearRect(0,0,fxc.width,fxc.height); } }; requestAnimationFrame(loop); } }
function rain(n){ const d=fxCanvas(); const W=fxc.width/d; for(let i=0;i<(n||80);i++) setTimeout(()=>confetti(rnd(0,W),-10,1,.4),i*18); }

/* ---------- age picker ---------- */
function agePicker(cb,force){ if(save.age&&!force){ cb(save.age); return; }
  const wrap=document.createElement('section'); wrap.className='screen panelscr show'; wrap.style.zIndex=70;
  wrap.innerHTML='<div class="panel"><img src="'+A+'img/zumi_face.webp" alt="" style="width:90px"><h2>בן/בת כמה השחקן?</h2><p class="sub">ככה זומי ואפרתושקה יתאימו את המשחק</p><div class="ages"></div></div>';
  const ages=wrap.querySelector('.ages'); for(let a=3;a<=10;a++){ const b=document.createElement('button'); b.textContent=a; b.dataset.age=a; if(a===save.age) b.className='on'; b.onclick=()=>{ unlock(); save.setAge(a); sfx('correct'); wrap.remove(); cb(a); }; ages.appendChild(b); }
  ($('#app')||document.body).appendChild(wrap); }

/* ---------- common top bar ---------- */
function topbar(opts){ opts=opts||{}; const t=document.createElement('div'); t.className='topbar';
  t.innerHTML='<a class="iconbtn" href="'+(opts.back||'../hub/')+'" aria-label="חזרה">➜</a><div class="pill" data-zb-stars>⭐ '+save.stars+'</div>'+(opts.extra||'')+'<span class="sp"></span><button class="iconbtn" data-zb-age aria-label="גיל">🎂</button><button class="iconbtn" data-zb-mute aria-label="צליל">'+(muted?'🔇':'🔊')+'</button>';
  ($('#app')||document.body).appendChild(t);
  t.querySelector('[data-zb-mute]').onclick=()=>{ unlock(); setMuted(!muted); };
  t.querySelector('[data-zb-age]').onclick=()=>agePicker(a=>{ toast('גיל '+a+' 🎈'); opts.onAge&&opts.onAge(a); },true);
  return t; }
function refreshStars(){ document.querySelectorAll('[data-zb-stars]').forEach(e=>e.textContent='⭐ '+save.stars); }
function award(n){ save.addStars(n); refreshStars(); return save.stars; }

/* ---------- share an image (canvas) ---------- */
async function shareCanvas(cv,name,text){ const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
  try{ const f=new File([blob],name,{type:'image/png'}); if(navigator.canShare&&navigator.canShare({files:[f]})){ await navigator.share({files:[f],text}); return 'shared'; } }catch(e){ if(e&&e.name==='AbortError') return 'cancel'; }
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); return 'download'; }
function rr(c,x,y,w,h,r){ c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }

return {A,BASE,$,rnd,rint,pick,shuffle,mulberry,todayKey,todaySeed,save,unlock,preload,sfx,say,chain,voiceBusy,music,stopMusic,setMuted,get muted(){return muted;},SFX:SFX.map(s=>'s_'+s),
  sprites,SP,drawSprite,domSprite,loadImg,bubble,toast,confetti,rain,agePicker,topbar,refreshStars,award,shareCanvas,rr};
})();
