/* אפרתושקה – ADULT mode ("מבוגרים 🔥"): harder runner, lives/hardcore, multiplier, adult quiz bank, neon-club visuals.
   Kids' flow is untouched: everything here is active only when S.age===AGE. No new voice lines (reuses recorded ones). */
'use strict';
window.EFADULT=function(K){
const {D,A,$}=K; const {rnd,ri,pick,shuffle}=D;
const TAU=Math.PI*2, clamp=(x,a,b)=>x<a?a:x>b?b:x, lerp=(a,b,t)=>a+(b-a)*t;
const S=K.S, AGE=18, FAR=72;
const AD={AGE};
S.adult=Object.assign({level:1,best:0,bestHC:0,hardcore:false,games:0},S.adult||{});
AD.on=()=>S.age===AGE;
/* ---------- daily challenge (same seeded run for everyone, seed = Israel date) ---------- */
S.adult.daily=Object.assign({date:'',score:0,correct:0,total:0,streak:0,last:''},S.adult.daily||{});
const ilDate=(d)=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Jerusalem'}).format(d||new Date());
const mul32=(a)=>()=>{ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
const hashS=(str)=>{ let h=2166136261; for(const c of str){ h^=c.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; };
AD.today=()=>ilDate();
AD.dailyPlayed=()=>S.adult.daily.date===AD.today();
AD.wantDaily=false;
const DLV=4;                                   // daily runs at a fixed level for everyone
/* Normal adult = readable: starts near kids' age-10 speed, gentle ramp, run slows ~45% while a quiz gate approaches
   (≈6s to read/answer), clear zones around gates. Difficulty comes from smart questions + gradual ramp. Hardcore keeps the raw speed. */
const CFG_N={speed:15,levelSecs:75,gate:[14,18],gateLead:.9,cols:3,obst:1,approach:1.0,gateSlow:.55,ramp:.22,lvStep:.45};
const CFG_HC={speed:18.5,levelSecs:70,gate:[12,16],gateLead:.8,cols:3,obst:1.4,approach:1.0,gateSlow:.9,ramp:.42,lvStep:.7};
const isHC=()=>!!S.adult.hardcore&&!AD.wantDaily;
Object.defineProperty(AD,'cfg',{get:()=>isHC()?CFG_HC:CFG_N});
Object.defineProperty(AD,'ramp',{get:()=>{ const R=K.R; return (R&&R.cfg&&R.cfg.ramp)||AD.cfg.ramp; }});
AD.speedFor=lv=>AD.cfg.speed+Math.min(lv-1,8)*AD.cfg.lvStep;

/* ---------- worlds (neon club palettes) ---------- */
const WORLDS=[
 {id:'neon',name:'מועדון הניאון',music:'disco',neon:true,sky:['#04010d','#2a0b4a'],hill:['#120526','#1a0834'],ground:['#07020f','#0b0418'],road:['#150926','#1b0c31'],edge:['#ff2fd0','#2ff3ff'],lane:'#ff4fd8',accent:'#2ff3ff',glow:['#ff2fd0','#2ff3ff'],sun:['#ffe45c','#ff2fd0'],
  boss:{name:'גנב הצבעים של המועדון',acc:'shades'}},
 {id:'neon',name:'גג העיר בלילה',music:'chip',neon:true,sky:['#02040f','#0b2a4a'],hill:['#06132a','#0a1b38'],ground:['#02060f','#040a18'],road:['#0a1326','#0e1a33'],edge:['#ff9a2f','#2fffc8'],lane:'#2fffc8',accent:'#ff9a2f',glow:['#ff9a2f','#2fffc8'],sun:['#fff59a','#ff6a2f'],
  boss:{name:'גנב הצבעים של הגג',acc:'propeller'}},
 {id:'neon',name:'לייזר פארטי',music:'disco',neon:true,sky:['#050010','#3a0750'],hill:['#16042a','#22063c'],ground:['#060010','#0a0118'],road:['#160626','#1e0833'],edge:['#b44bff','#ffe45c'],lane:'#b44bff',accent:'#ffe45c',glow:['#b44bff','#ffe45c'],sun:['#ffe45c','#b44bff'],
  boss:{name:'גנב הצבעים של המסיבה',acc:'shades'}},
];
AD.world=lv=>WORLDS[(lv-1)%WORLDS.length];

/* ---------- quality (60fps target, degrade gracefully) ---------- */
let ema=1/60, slowT=0, fastT=0; AD.low=/[?&]lowfx/.test(location.search);
AD.perf=function(dt,state){ if(state!=='run'||dt<=0||dt>=.25) return; ema=ema*.95+Math.min(dt,.1)*.05;   // dt>=.25 = tab switch/hiccup, ignore; EMA smooths single spikes
  if(ema>1/45){ slowT+=dt; fastT=0; if(slowT>2.5) AD.low=true; } else { slowT=Math.max(0,slowT-dt*.5); if(AD.low&&ema<1/58){ fastT+=dt; if(fastT>12){ AD.low=false; fastT=0; } } } };

/* ---------- quiz bank ---------- */
const BANK=(window.EFADQ||[]).map((r,i)=>({i,c:r[0],q:r[1],a:r.slice(2)}));
const CATS=[...new Set(BANK.map(b=>b.c))];
let seen=[]; try{ seen=JSON.parse(localStorage.getItem('ef_adq_seen')||'[]'); }catch(e){}
let lastCat='';
AD.bankSize=BANK.length;
AD.question=function(){
  if(!BANK.length) return D.makeQuestion(10);
  const R=K.R; let it=null;
  if(R&&R.daily){ it=BANK[R.dq[R.dqi++%R.dq.length]]; return mkQ(it); }
  let pool=BANK.filter(b=>!seen.includes(b.i)); if(pool.length<6){ seen=[]; pool=BANK.slice(); }
  const cats=CATS.filter(c=>c!==lastCat&&pool.some(b=>b.c===c)); const cat=pick(cats.length?cats:CATS); lastCat=cat;
  it=pick(pool.filter(b=>b.c===cat).length?pool.filter(b=>b.c===cat):pool);
  seen.push(it.i); try{ localStorage.setItem('ef_adq_seen',JSON.stringify(seen)); }catch(e){}
  return mkQ(it);
};
function mkQ(it){ const R=K.R, rr=R&&R.daily?R.qrng:Math.random; const order=[0,1,2]; for(let i=2;i>0;i--){ const j=Math.floor(rr()*(i+1)); [order[i],order[j]]=[order[j],order[i]]; } const opts=order.map(k=>({k:'adult',t:it.a[k]}));
  const math=it.c==='math'&&/^[\d.,\s]+[×÷+−\-]|^\d+,/.test(it.q);
  return {prompt:it.q,voice:null,options:opts,correct:order.indexOf(0),cat:'adult_'+it.c,adult:true,id:it.i,ltr:math,eq:math&&!/\?$/.test(it.q)};
}
/* answer card texture: dark glass + neon rim + glowing text (prerendered once per question) */
function wrapLines(g,t,maxW){ const words=t.split(' '); const lines=[]; let cur=''; for(const w of words){ const tt=cur?cur+' '+w:w; if(g.measureText(tt).width>maxW&&cur){ lines.push(cur); cur=w; } else cur=tt; } if(cur) lines.push(cur); return lines; }
AD.card=function(o){
  const w=K.R&&K.R.world||WORLDS[0]; const [c1,c2]=w.glow;
  return K.mk(220,220,(g)=>{
    const bg=g.createLinearGradient(0,0,0,220); bg.addColorStop(0,'#2a1050'); bg.addColorStop(1,'#0c0420');
    K.rrect(g,8,8,204,204,34); g.fillStyle=bg; g.fill();
    g.save(); g.shadowColor=c1; g.shadowBlur=18; const rim=g.createLinearGradient(0,0,220,220); rim.addColorStop(0,c1); rim.addColorStop(1,c2); g.lineWidth=7; g.strokeStyle=rim; K.rrect(g,10,10,200,200,32); g.stroke(); g.restore();
    g.fillStyle='rgba(255,255,255,.07)'; K.rrect(g,18,18,184,70,24); g.fill();
    const t=String(o.t); const isNum=/^[\d.,%\-−]+$/.test(t)||/^[A-Za-z0-9]+$/.test(t);
    g.textAlign='center'; g.textBaseline='middle'; g.direction=isNum?'ltr':'rtl';
    let size=isNum?(t.length<=2?118:t.length<=4?92:70):64, lines;
    for(;;){ g.font=`900 ${size}px Rubik, sans-serif`; lines=isNum?[t]:wrapLines(g,t,176); const tooWide=lines.some(l=>g.measureText(l).width>178); if((!tooWide&&lines.length*size*1.08<=170)||size<=24) break; size-=4; }
    const lh=size*1.08, y0=112-(lines.length-1)*lh/2;
    g.save(); g.shadowColor=c2; g.shadowBlur=14; g.fillStyle='#ffffff';
    lines.forEach((l,i)=>g.fillText(l,110,y0+i*lh+size*.04)); g.restore();
    g.fillStyle='#fff'; lines.forEach((l,i)=>g.fillText(l,110,y0+i*lh+size*.04));
  });
};

/* ---------- run hooks ---------- */
AD.onRunStart=function(R){
  R.adult=true; R.daily=AD.wantDaily; AD.wantDaily=false;
  if(R.daily){ const day=AD.today(), seed=hashS('efd|'+day); R.dayKey=day; R.seed=seed; R.rng=mul32(seed); R.qrng=mul32(seed^0x9e3779b9); R.dailyScored=!AD.dailyPlayed();
    const qr=mul32(seed^0x51ed27); const idx=BANK.map(b=>b.i); for(let i=idx.length-1;i>0;i--){ const j=Math.floor(qr()*(i+1)); [idx[i],idx[j]]=[idx[j],idx[i]]; }
    const bycat={}; for(const i of idx){ (bycat[BANK[i].c]=bycat[BANK[i].c]||[]).push(i); } const cs=Object.keys(bycat).sort(); R.dq=[]; for(let k=0;R.dq.length<idx.length;k++){ const c=bycat[cs[k%cs.length]]; if(c.length) R.dq.push(c.shift()); } R.dqi=0;
    const sp=AD.speedFor(DLV), k=sp/R.baseSpeed; R.level=DLV; R.world=AD.world(1+seed%3); R.baseSpeed=R.speed=sp; R.levelLen*=k; R.objs.length=0; R.gateTimer=CFG_N.gate[0]*.7; }
  R.hardcore=!R.daily&&!!S.adult.hardcore; R.maxLives=R.hardcore?1:3; R.lives=R.maxLives; R.mult=1; R.chain=0; R.adFlash=0; R.adShake=0; R.hits=0;
  if(R.ix) R.ix.next=1e9;
  R.nextSpawn=Math.max(R.nextSpawn,46);       // ~2s grace before the first obstacles                        // no kid interactions (high-five / clap) in adult mode
  document.body.classList.add('adrun');
  banner(R.daily?(R.dailyScored?'📅 אתגר יומי · ניסיון אחד!':'📅 תרגול · לא נספר'):R.hardcore?'⚡ הארדקור · פסילה אחת':'🔥 מצב מבוגרים',(R.daily?R.dayKey.split('-').reverse().join('.'):'שלב '+R.level)+' · '+R.world.name+' · '+R.maxLives+' ❤️',1900);
  hud(R);
};
AD.onRunEnd=function(){ document.body.classList.remove('adrun'); };
const gateZone=R=>!R.hardcore&&(R.gateTimer<1.6||(R.adGateEnd!=null&&R.time-R.adGateEnd<1.8));
function calmChunk(R,z,sl,lanes){ // clear zone near gates + fewer obstacles early (normal mode only)
  if(R.hardcore) return 0;
  if(gateZone(R)){ sl(lanes[1],z,4); return 10; }
  const early=Math.max(0,.5-.08*(R.level-1))*(1-Math.min(1,R.dist/(R.levelLen*.6)));
  if(Math.random()<.12+early){ sl(lanes[0],z,5); return 11+R.speed*.3; }
  return 0; }
AD.chunk=function(R,z,ao,sl,lanes){ if(R.daily){ if(gateZone(R)){ sl(lanes[1],z,4); return 10; } // daily: k-th pattern is identical for everyone (gate clear-zones don't consume the seed)
    R.dci=(R.dci||0)+1; const mr=Math.random; Math.random=mul32((R.seed^Math.imul(R.dci,0x9E3779B1))>>>0); try{ const ln=shuffle([-1,0,1]); return calmChunk(R,z,sl,ln)||chunk0(R,z,ao,sl,ln); } finally{ Math.random=mr; } } const c=calmChunk(R,z,sl,lanes); if(c) return c; return chunk0(R,z,ao,sl,lanes); };
const chunk0=function(R,z,addObj,starLine,lanes){
  const sp=R.hardcore?11+R.speed*.26:14+R.speed*.36, r=Math.random(), ltypes=['low','high'];
  if(r<.12){ starLine(lanes[0],z,7,true); return sp*.75; }
  if(r<.34){ addObj({k:'block',x:lanes[0],z}); addObj({k:'block',x:lanes[1],z}); starLine(lanes[2],z-3,5); return sp; }
  if(r<.50){ const t=pick(ltypes); for(const l of [-1,0,1]) addObj({k:t,x:l,z}); if(t==='low') starLine(lanes[0],z-1.7,3,true); else starLine(lanes[0],z+3,4); return sp+2; }
  if(r<.68){ addObj({k:'block',x:lanes[0],z}); addObj({k:pick(ltypes),x:lanes[1],z:z+7}); addObj({k:'block',x:lanes[2],z:z+7}); starLine(lanes[1],z-2,4); return sp+8; }
  if(r<.84){ addObj({k:'low',x:lanes[0],z}); addObj({k:'high',x:lanes[1],z}); addObj({k:'block',x:lanes[2],z}); starLine(lanes[0],z-1.7,3,true); return sp+2; }
  addObj({k:pick(['block','low','high']),x:lanes[0],z}); addObj({k:'block',x:lanes[1],z:z+5}); starLine(lanes[2],z-2,6); return sp+5;
};
function multOf(R){ return Math.min(5,1+Math.floor(R.combo/2)+Math.floor(R.chain/40)); }
function setMult(R){ const m=multOf(R); if(m>R.mult){ pop('מכפיל ×'+m+'!','mult'); A.sfx('powerup',.55,1.25); } R.mult=m; hud(R); }
AD.star=function(R,v){ R.chain+=1; if(R.chain%40===0) setMult(R); return v*R.mult; };
AD.gate=function(R,ok,q,px,py){ R.adGateEnd=R.time;
  if(ok){ const bonus=25*R.mult*(R.pw.double>0?2:1); R.stars+=bonus; K.floatText('+'+bonus,px,py-40,'#2ff3ff',42);
    if(R.combo>=2) pop('קומבו ×'+R.combo,'combo'); setMult(R); R.adFlash=Math.max(R.adFlash,0); }
  else { R.chain=0; R.mult=1; loseLife(R,'תשובה שגויה'); }
  hud(R);
};
AD.hit=function(R){ R.chain=0; R.combo=0; R.mult=1; R.adShake=.5; loseLife(R,'התנגשות'); hud(R); };
function loseLife(R,why){
  R.lives=Math.max(0,R.lives-1); R.hits++; R.adFlash=1; if(navigator.vibrate) try{ navigator.vibrate(R.lives?[40,40,60]:[120,60,200]); }catch(e){}
  if(R.lives<=0&&!R.dead){ R.dead=.001; R.deadWhy=why; A.sfx('wrong',.8,.8); A.stopMusic(.6); pop('💥 המשחק נגמר','dead'); K.floatText(why,K.W/2,K.H*.47,'#ff6b9a',30); }
  else pop('−1 ❤️','life');
}
AD.upd=function(R,dt){
  if(R.adFlash>0) R.adFlash=Math.max(0,R.adFlash-dt*1.8); if(R.adShake>0) R.adShake=Math.max(0,R.adShake-dt);
  const g=R.gate, tb=$('#qTimer i'); if(tb&&g&&g.phase==='go'&&g.z!=null){ const f=clamp(g.z/(FAR-2),0,1); tb.style.transform='scaleX('+f.toFixed(3)+')'; tb.parentNode.classList.toggle('hot',f<.33); }
};
function hud(R){ const l=$('#hudLives'), m=$('#hudMult'); if(!l) return; if(!R||!R.adult){ l.classList.add('hidden'); m.classList.add('hidden'); return; }
  l.classList.remove('hidden'); m.classList.remove('hidden');
  let h=''; for(let i=0;i<R.maxLives;i++) h+=i<R.lives?'❤️':'🖤'; if(l._h!==h){ l._h=h; l.textContent=h; l.classList.remove('bump'); void l.offsetWidth; l.classList.add('bump'); }
  const mt='×'+R.mult; if(m._t!==mt){ m._t=mt; m.textContent=mt; m.classList.toggle('hot',R.mult>=3); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); } }
AD.hud=hud;
function pop(txt,kind){ const e=$('#adPop'); if(!e) return; e.textContent=txt; e.className='adpop '+kind; void e.offsetWidth; e.classList.add('go'); }
function banner(t1,t2,ms){ const b=$('#adBanner'); if(!b) return; b.querySelector('b').textContent=t1; b.querySelector('span').textContent=t2; b.classList.remove('go','hidden'); void b.offsetWidth; b.classList.add('go'); clearTimeout(b._t); b._t=setTimeout(()=>b.classList.add('hidden'),ms||1800); }
AD.banner=banner;

/* ---------- harder dance battle ---------- */
AD.chart=function(OFFSET,BEAT,world){
  const notes=[]; const cols=3; let last=-1;
  for(let b=8;b<=84;b++){ const inBar=(b-8)%4, bar=Math.floor((b-8)/4);
    let col=ri(0,2); if(col===last&&Math.random()<.6) col=(col+1)%3; last=col; notes.push({t:OFFSET+b*BEAT,col});
    if((inBar===1||inBar===3)&&(bar%2===0||bar>=8)) { const c2=(col+ri(1,2))%3; notes.push({t:OFFSET+(b+.5)*BEAT,col:c2}); last=c2; }
    if(bar>=12&&inBar===2&&bar%2===1){ notes.push({t:OFFSET+b*BEAT,col:(col+1)%3}); } }   // late-song chords
  return notes.sort((a,b)=>a.t-b.t);
};

/* ---------- visuals: neon props ---------- */
AD.buildProps=function(){
  const P=K.P, mk=K.mk, rr=K.rrect;
  const glowStroke=(g,col,blur,w)=>{ g.shadowColor=col; g.shadowBlur=blur; g.strokeStyle=col; g.lineWidth=w; };
  const low=mk(320,140,(g)=>{ g.fillStyle='#120622'; rr(g,8,30,304,44,20); g.fill(); g.save(); glowStroke(g,'#ff2fd0',16,6); rr(g,8,30,304,44,20); g.stroke(); g.restore();
    g.save(); g.shadowColor='#2ff3ff'; g.shadowBlur=10; g.fillStyle='#2ff3ff'; for(let x=30;x<300;x+=40){ g.beginPath(); g.moveTo(x,40); g.lineTo(x+16,52); g.lineTo(x,64); g.lineTo(x+8,52); g.fill(); } g.restore();
    g.fillStyle='#2a1050'; g.fillRect(26,74,14,66); g.fillRect(280,74,14,66); });
  const high=mk(340,640,(g)=>{ g.save(); glowStroke(g,'#2ff3ff',18,10); g.beginPath(); g.moveTo(18,640); g.lineTo(18,40); g.moveTo(322,640); g.lineTo(322,40); g.stroke(); g.restore();
    g.fillStyle='#120622'; rr(g,14,28,312,96,22); g.fill(); g.save(); glowStroke(g,'#ff2fd0',20,6); rr(g,14,28,312,96,22); g.stroke(); g.restore();
    g.save(); g.shadowColor='#fff'; g.shadowBlur=14; g.font='900 50px Rubik'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#fff'; g.fillText('⬇ ⬇ ⬇',170,78); g.restore();
    for(let i=0;i<9;i++){ g.fillStyle=i%2?'#ff2fd0':'#2ff3ff'; g.globalAlpha=.85; g.beginPath(); g.moveTo(28+i*32,124); g.lineTo(60+i*32,124); g.lineTo(44+i*32,160); g.fill(); } g.globalAlpha=1; });
  const block=mk(260,280,(g)=>{ const gr=g.createLinearGradient(0,40,0,280); gr.addColorStop(0,'#2a1050'); gr.addColorStop(1,'#0a0318'); g.fillStyle=gr; rr(g,14,40,232,236,18); g.fill();
    g.save(); glowStroke(g,'#b44bff',18,6); rr(g,14,40,232,236,18); g.stroke(); g.restore();
    for(const [cy,r] of [[110,46],[212,58]]){ g.fillStyle='#05010c'; g.beginPath(); g.arc(130,cy,r,0,TAU); g.fill(); g.save(); glowStroke(g,'#2ff3ff',12,4); g.beginPath(); g.arc(130,cy,r,0,TAU); g.stroke(); g.restore(); g.fillStyle='#2a1a48'; g.beginPath(); g.arc(130,cy,r*.34,0,TAU); g.fill(); }
    g.save(); g.shadowColor='#ff2fd0'; g.shadowBlur=10; for(let i=0;i<6;i++){ g.fillStyle=i<4?'#ff2fd0':'#ffe45c'; g.fillRect(34+i*7,58-0,4,-(8+i*3)); } g.restore(); });
  P.obs.neon={low,high,block};
  const sign=(txt,c)=>mk(340,420,(g)=>{ g.fillStyle='#22163a'; g.fillRect(162,150,16,270); g.fillStyle='#0d0618'; rr(g,12,40,316,110,22); g.fill(); g.save(); glowStroke(g,c,22,7); rr(g,12,40,316,110,22); g.stroke(); g.restore();
    g.save(); g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl'; K.fitText(g,txt,272,64); g.shadowColor=c; g.shadowBlur=18; g.fillStyle='#fff'; g.fillText(txt,170,98); g.restore(); });   // full name always fits (never cropped)
  const palm=(c)=>mk(220,460,(g)=>{ g.save(); glowStroke(g,c,16,8); g.lineCap='round'; g.beginPath(); g.moveTo(110,460); g.quadraticCurveTo(96,280,118,120); g.stroke();
    for(let i=0;i<6;i++){ const a=-Math.PI*.95+i*Math.PI*.38; g.beginPath(); g.moveTo(118,120); g.quadraticCurveTo(118+Math.cos(a)*70,120+Math.sin(a)*40-30,118+Math.cos(a)*100,130+Math.abs(Math.sin(a))*10+20); g.stroke(); } g.restore(); });
  const tower=mk(140,460,(g)=>{ g.fillStyle='#1b1230'; g.fillRect(58,60,24,400); for(let i=0;i<8;i++){ const c=['#ff2fd0','#2ff3ff','#ffe45c','#b44bff'][i%4]; g.save(); g.shadowColor=c; g.shadowBlur=18; g.fillStyle=c; g.beginPath(); g.arc(70,80+i*46,13,0,TAU); g.fill(); g.restore(); } });
  P.decor.neon=[sign('מסיבה','#ff2fd0'),sign('אפרתושקה','#2ff3ff'),palm('#2ff3ff'),palm('#ff2fd0'),tower,P.decor.disco[0],P.decor.disco[1]];
  P.adGlow=mk(64,64,(g)=>{ const gr=g.createRadialGradient(32,32,0,32,32,32); gr.addColorStop(0,'rgba(255,240,150,.85)'); gr.addColorStop(.4,'rgba(255,200,60,.35)'); gr.addColorStop(1,'rgba(255,200,60,0)'); g.fillStyle=gr; g.fillRect(0,0,64,64); });
};

/* skyline + synthwave sun (prerendered, parallax) */
let skyC=null, sunC={}, sunG={};
function sunGlow(col){ if(sunG[col]) return sunG[col]; return sunG[col]=K.mk(128,64,(g)=>{ const gr=g.createRadialGradient(64,50,6,64,50,58); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,128,64); }); }
function skyline(){ if(skyC) return skyC; skyC=K.mk(720,170,(g)=>{ let x=0; const r=D.rnd; while(x<720){ const bw=r(34,80), bh=r(40,160); g.fillStyle='#090314'; g.fillRect(x,170-bh,bw,bh); g.fillStyle='rgba(255,255,255,.04)'; g.fillRect(x,170-bh,bw,3);
  for(let wy=170-bh+10;wy<165;wy+=12) for(let wx=x+6;wx<x+bw-6;wx+=10) if(Math.random()<.32){ g.fillStyle=pick(['rgba(255,228,92,.75)','rgba(47,243,255,.6)','rgba(255,47,208,.6)']); g.fillRect(wx,wy,4,5); }
  if(Math.random()<.3){ g.fillStyle='#ff2fd0'; g.fillRect(x+bw/2-1,170-bh-14,2,14); } x+=bw+r(2,8); } }); return skyC; }
function sun(c){ const k=c.join(); if(sunC[k]) return sunC[k]; sunC[k]=K.mk(300,300,(g)=>{ const gr=g.createLinearGradient(0,20,0,280); gr.addColorStop(0,c[0]); gr.addColorStop(1,c[1]); g.fillStyle=gr; g.beginPath(); g.arc(150,150,130,0,TAU); g.fill(); g.globalCompositeOperation='destination-out'; for(let i=0;i<7;i++){ const y=170+i*16; g.fillRect(0,y,300,3+i*1.6); } }); return sunC[k]; }
AD.sky=function(ctx,w,t,off){ const W=K.W, HOR=K.HOR;
  const s=sun(w.sun), sz=Math.min(W*.62,HOR*1.15); ctx.save(); if(!AD.low){ ctx.globalAlpha=.35; const gw=sz*1.9; ctx.drawImage(sunGlow(w.sun[1]),W/2-gw/2,HOR*.78-gw*.39,gw,gw/2); }   // prerendered glow (no per-frame gradient)
  ctx.globalAlpha=.95; ctx.drawImage(s,W/2-sz/2,HOR*.86-sz/2,sz,sz); ctx.restore();
  if(AD.low) return;   // low-end: skip skyline parallax
  const sk=skyline(), h=HOR*.42, wsk=sk.width*h/sk.height, ox=-((off*1.6)%wsk); for(let x=ox;x<W;x+=wsk) ctx.drawImage(sk,x,HOR-h+2,wsk,h);
};
AD.roadFx=function(ctx,w,R){ const sx=K.sx, sy=K.sy; const W=K.W; const z0=-2.4, z1=FAR;
  // synthwave grid beside the road
  const seg=AD.low?8:4, off=R.dist%seg; ctx.save(); ctx.lineWidth=1.2;
  for(let z=seg-off;z<FAR;z+=seg){ const y=sy(z), a=.55*(1-z/FAR); ctx.strokeStyle=w.glow[0]; ctx.globalAlpha=a; ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(sx(-1.8,z),y); ctx.moveTo(sx(1.8,z),y); ctx.lineTo(W,y); ctx.stroke(); }
  if(!AD.low){ ctx.globalAlpha=.4; for(const x of [-2.6,-3.6,-5,-7.5,-11,2.6,3.6,5,7.5,11]){ ctx.beginPath(); ctx.moveTo(sx(x,z0),sy(z0)); ctx.lineTo(sx(x,z1),sy(z1)); ctx.stroke(); } }
  // glowing road edges (fake bloom: wide soft + thin bright)
  for(const [x,c] of [[-1.7,w.glow[0]],[1.7,w.glow[1]]]){ const xa=sx(x,z0), ya=sy(z0), xb=sx(x,z1), yb=sy(z1);
    if(!AD.low){ ctx.globalAlpha=.22; ctx.strokeStyle=c; ctx.lineWidth=16; ctx.beginPath(); ctx.moveTo(xa,ya); ctx.lineTo(xb,yb); ctx.stroke(); }
    ctx.globalAlpha=.9; ctx.lineWidth=3; ctx.beginPath(); ctx.moveTo(xa,ya); ctx.lineTo(xb,yb); ctx.stroke(); }
  ctx.restore();
};
AD.starGlow=function(ctx,cx,cy,sz){ if(AD.low||!K.P.adGlow||sz<6) return; ctx.save(); ctx.globalAlpha=.6; const s=sz*2.1; ctx.drawImage(K.P.adGlow,cx-s/2,cy-s/2,s,s); ctx.restore(); };
const rgC={}; function rglow(col){ if(rgC[col]) return rgC[col]; return rgC[col]=K.mk(96,96,(g)=>{ const gr=g.createRadialGradient(48,48,2,48,48,48); gr.addColorStop(0,col); gr.addColorStop(1,'rgba(0,0,0,0)'); g.fillStyle=gr; g.fillRect(0,0,96,96); }); }
AD.runnerGlow=function(ctx,x,y,LW,w){ ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.globalAlpha=.55; ctx.drawImage(rglow(w.glow[1]),x-LW*.7,y-LW*.18,LW*1.4,LW*.36); ctx.restore(); };
/* post: vignette, speed lines, hit flash */
let fxEl=null, fxF=-1, fxLow=null;
function fx(){ if(fxEl) return fxEl; const cv=document.getElementById('game'); fxEl=document.createElement('div'); fxEl.id='adFx'; fxEl.innerHTML='<i class="vg"></i><i class="fl"></i>'; cv.parentNode.insertBefore(fxEl,cv.nextSibling); return fxEl; }
AD.post=function(ctx,R){ const W=K.W,H=K.H, el=fx();
  if(fxLow!==AD.low){ fxLow=AD.low; el.classList.toggle('low',AD.low); }
  const f=Math.round(R.adFlash*20)/20; if(f!==fxF){ fxF=f; el.lastChild.style.opacity=(f*.85).toFixed(2); }
  const sp=R.speed; if(sp>19&&!AD.low&&!R.dead){ const a=clamp((sp-19)/8,0,1)*.5; ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle='#ffffff'; ctx.lineWidth=1.5; const cx=W/2, cy=K.HOR;
    for(let i=0;i<14;i++){ const ang=(i*2.39996+Math.floor(K.G.t*24)*.7)%TAU; const r0=Math.max(W,H)*(.5+((K.G.t*3+i*.37)%1)*.3), r1=r0+Math.max(W,H)*.12; const ca=Math.cos(ang), sa=Math.sin(ang); if(cy+sa*r0<K.HOR*1.15) continue; ctx.globalAlpha=a; ctx.beginPath(); ctx.moveTo(cx+ca*r0,cy+sa*r0); ctx.lineTo(cx+ca*r1,cy+sa*r1); ctx.stroke(); } ctx.restore(); }
  if(R.dead){ ctx.save(); ctx.fillStyle=`rgba(6,0,16,${clamp(R.dead/1.4,0,.7)})`; ctx.fillRect(0,0,W,H); ctx.restore(); }
};
AD.shake=R=>R.adShake||0;
AD.menuBg=function(ctx){ const W=K.W,H=K.H,t=K.G.t; ctx.fillStyle='rgba(6,1,18,.74)'; ctx.fillRect(0,0,W,H);
  ctx.save(); ctx.globalCompositeOperation='lighter';
  for(let i=0;i<4;i++){ const a=Math.sin(t*.7+i*1.6)*.5; ctx.save(); ctx.translate(W*(i+.5)/4,0); ctx.rotate(a); const g=ctx.createLinearGradient(0,0,0,H*.75); g.addColorStop(0,['rgba(255,47,208,.32)','rgba(47,243,255,.28)','rgba(180,75,255,.3)','rgba(255,228,92,.22)'][i]); g.addColorStop(1,'rgba(0,0,0,0)'); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(-5,0); ctx.lineTo(-W*.22,H*.75); ctx.lineTo(W*.22,H*.75); ctx.lineTo(5,0); ctx.fill(); ctx.restore(); }
  ctx.restore();
  ctx.fillStyle='#fff'; for(let i=0;i<36;i++){ const x=(i*97.3)%W, y=(i*53.1)%(H*.5); ctx.globalAlpha=.25+.5*Math.abs(Math.sin(t*1.7+i)); ctx.fillRect(x,y,2,2); } ctx.globalAlpha=1;
};
AD.battleBg=['#07010f','#2c0a52'];

/* ---------- menu ---------- */
AD.menuUpd=function(){ const on=AD.on(); document.body.classList.toggle('adult',on);
  const hc=$('#hcToggle'); if(hc){ hc.classList.toggle('hidden',!on); hc.classList.toggle('on',!!S.adult.hardcore); hc.textContent=S.adult.hardcore?'⚡ הארדקור: פועל · פסילה אחת':'⚡ הארדקור: כבוי · 3 חיים'; }
  const bp=$('#btnPlay'); if(bp) bp.textContent=on?'▶ שחקו · 15+ 🔥':'▶ שחקו!';
  const at=document.querySelector('.agetitle'); if(at) at.textContent=on?'מצב 15+: חידות לנוער ולמבוגרים, טבלה נפרדת':'בן/בת כמה השחקן?';
};
if($('#hcToggle')) $('#hcToggle').addEventListener('click',()=>{ A.unlock(); S.adult.hardcore=!S.adult.hardcore; K.save(); A.sfx(S.adult.hardcore?'powerup':'coin',.5); AD.menuUpd(); K.updMenu(); });

/* ---------- share (reuses existing WhatsApp/share code) ---------- */
AD.shareText=function(score,hc){ return '🔥 עשיתי '+score+' נקודות במצב מבוגרים'+(hc?' (הארדקור ⚡)':'')+' ב"אפרתושקה: מסיבת הקסם"! חושבים שתעברו אותי? 😏'; };

/* ---------- daily challenge: result, streak, menu button, share card ---------- */
const yday=(d)=>{ const t=new Date(d+'T12:00:00Z'); t.setUTCDate(t.getUTCDate()-1); return t.toISOString().slice(0,10); };
const heDate=(d)=>d.split('-').reverse().join('.');
AD.dailyEnd=function(R,earned){ const d=S.adult.daily; S.adult.games++; K.G.lastDailyRun={score:earned,correct:R.gatesOk,total:R.gatesTotal,date:R.dayKey,scored:R.dailyScored};
  if(!R.dailyScored||d.date===R.dayKey) return false;
  d.streak=(d.last===yday(R.dayKey))?d.streak+1:1; d.last=R.dayKey; d.date=R.dayKey; d.score=earned; d.correct=R.gatesOk; d.total=R.gatesTotal; K.save(); return true; };
const dBtn=document.createElement('button'); dBtn.id='btnDaily'; dBtn.className='dailybtn hidden'; const hcB=$('#hcToggle'); if(hcB) hcB.insertAdjacentElement('afterend',dBtn);
if(/[?&]daily=1/.test(location.search)) dBtn.classList.add('pulse');
function dailyUpd(){ const on=AD.on(); dBtn.classList.toggle('hidden',!on); if(!on) return; const d=S.adult.daily, st=(d.last===AD.today()||d.last===yday(AD.today()))?d.streak:0;
  dBtn.innerHTML=AD.dailyPlayed()?`📅 אתגר יומי · היום: <b>${d.score}</b> · תרגול ↻`+(st?` · 🔥 רצף ${st}`:''):`📅 אתגר יומי <b>חדש!</b> · ניסיון אחד`+(st?` · 🔥 רצף ${st}`:''); }
const mu0=AD.menuUpd; AD.menuUpd=function(){ mu0(); dailyUpd(); };
dBtn.addEventListener('click',()=>{ A.unlock(); dBtn.classList.remove('pulse'); AD.wantDaily=true; $('#btnPlay').click(); });
// result screen: "📸 כרטיס שיתוף" opens the daily share card instead of the normal challenge
document.addEventListener('click',(e)=>{ const b=e.target.closest&&e.target.closest('#rChallenge'); if(!b||!K.G.lastDaily) return; e.stopImmediatePropagation(); e.preventDefault(); A.unlock(); openCard(); },true);
AD.drawDailyCard=function(cv){ const g=cv.getContext('2d'), W=1080, H=1920; cv.width=W; cv.height=H; const w=WORLDS[0], r=K.G.lastDailyRun||{}, d=S.adult.daily;
  const sc=r.scored===false?d.score:r.score, cor=r.scored===false?d.correct:r.correct, tot=r.scored===false?d.total:r.total;
  let gr=g.createLinearGradient(0,0,0,H); gr.addColorStop(0,'#05010f'); gr.addColorStop(.55,'#2a0b4a'); gr.addColorStop(1,'#07020f'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  const rr=mul32(hashS(r.date||'x')); g.fillStyle='#fff'; for(let i=0;i<120;i++){ g.globalAlpha=.2+rr()*.6; g.fillRect(rr()*W,rr()*H*.5,3,3); } g.globalAlpha=1;
  const sn=sun(w.sun); g.drawImage(sn,W/2-380,560,760,760); const sk=skyline(); g.drawImage(sk,0,1040,W,250); g.drawImage(sk,-200,1060,W*1.3,230);
  g.fillStyle='#07020f'; g.fillRect(0,1288,W,H-1288); g.strokeStyle='#ff2fd0'; g.lineWidth=3; for(let i=0;i<9;i++){ const y=1290+i*i*9; g.globalAlpha=.7-i*.06; g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); } g.globalAlpha=.5; for(let x=-6;x<=6;x++){ g.beginPath(); g.moveTo(W/2+x*40,1290); g.lineTo(W/2+x*260,H); g.stroke(); } g.globalAlpha=1;
  g.textAlign='center'; g.textBaseline='middle'; g.direction='rtl';
  const glowT=(t,y,font,c,blur)=>{ g.font=font; g.save(); g.shadowColor=c; g.shadowBlur=blur; g.fillStyle='#fff'; g.fillText(t,W/2,y); g.fillText(t,W/2,y); g.restore(); };
  g.font='900 150px Rubik, sans-serif'; glowT('אפרתושקה',170,'900 150px Rubik, sans-serif','#ff2fd0',40);
  glowT('מסיבת הקסם · 15+ 🔥',290,'800 58px Rubik, sans-serif','#2ff3ff',24);
  g.save(); g.shadowColor='#ffe45c'; g.shadowBlur=24; g.strokeStyle='#ffe45c'; g.lineWidth=6; K.rrect(g,W/2-330,360,660,120,60); g.stroke(); g.restore();
  g.font='900 62px Rubik, sans-serif'; g.fillStyle='#ffe45c'; g.fillText('📅 אתגר יומי · '+heDate(r.date||AD.today()),W/2,422);
  const sh=K.sheet&&K.sheet('front'); if(sh){ const h=820, ww=h*sh.width/sh.height; g.save(); g.shadowColor='#ff2fd0'; g.shadowBlur=60; g.drawImage(sh,W/2-ww/2,1330-h,ww,h); g.restore(); }
  // score panel
  g.save(); g.fillStyle='rgba(12,4,32,.82)'; K.rrect(g,90,1360,900,430,50); g.fill(); g.shadowColor='#2ff3ff'; g.shadowBlur=30; g.strokeStyle='#2ff3ff'; g.lineWidth=6; K.rrect(g,90,1360,900,430,50); g.stroke(); g.restore();
  g.font='800 50px Rubik, sans-serif'; g.fillStyle='#c9b8ff'; g.fillText('הניקוד שלי היום',W/2,1430);
  g.direction='ltr'; glowT(String(sc||0),1550,'900 170px Rubik, sans-serif','#ff2fd0',36); g.direction='rtl';
  g.font='800 56px Rubik, sans-serif'; g.fillStyle='#fff'; g.fillText('✅ '+(cor||0)+'/'+(tot||0)+' חידות   ·   🔥 רצף '+(d.streak||1)+(d.streak>1?' ימים':' יום'),W/2,1690);
  g.font='900 60px Rubik, sans-serif'; g.fillStyle='#ffe45c'; g.fillText('תעברו אותי? 😏',W/2,1840-0);
  g.font='700 34px Rubik, sans-serif'; g.fillStyle='#bfaee8'; g.direction='ltr'; g.fillText('bensharafi7-sys.github.io/efratushka-game',W/2,1890); };
const dailyURL=()=>K.BASE_URL+'?daily=1';
AD.dailyText=function(){ const r=K.G.lastDailyRun||{}, d=S.adult.daily; const sc=r.scored===false?d.score:r.score; return '📅 האתגר היומי של "אפרתושקה" ('+heDate(r.date||AD.today())+'): עשיתי '+(sc||0)+' נקודות'+(d.streak>1?' · רצף '+d.streak+' ימים 🔥':'')+'. אותו מסלול ואותן חידות לכולם – תעברו אותי? 😏'; };
let cardEl=null;
function openCard(){ if(!cardEl){ cardEl=document.createElement('div'); cardEl.id='dCard'; cardEl.className='dcard'; cardEl.innerHTML='<div class="dcin"><canvas id="dCardCv"></canvas><div class="dcbtns"><button class="btn pink" id="dcShare">📤 שתפו תמונה</button><button class="btn" id="dcWa">💬 וואטסאפ</button><button class="btn" id="dcBack">חזרה</button></div></div>'; document.body.appendChild(cardEl);
    const blob=()=>new Promise(res=>$('#dCardCv').toBlob(b=>res(b),'image/png'));
    const dl=(b)=>{ const u=URL.createObjectURL(b); const a=document.createElement('a'); a.href=u; a.download='efratushka-daily.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),4000); K.toast&&K.toast('הכרטיס נשמר 📸'); };
    $('#dcShare').addEventListener('click',async()=>{ A.sfx('coin',.3); const b=await blob(); if(!b) return; const f=new File([b],'efratushka-daily.png',{type:'image/png'});
      if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:'אפרתושקה – אתגר יומי',text:AD.dailyText()+' '+dailyURL()}); return; }catch(e){ if(e&&e.name==='AbortError') return; } } dl(b); });
    $('#dcWa').addEventListener('click',()=>{ A.sfx('coin',.3); K.openWa(AD.dailyText()+' '+dailyURL()); });
    $('#dcBack').addEventListener('click',()=>{ cardEl.classList.remove('show'); }); }
  const cv=$('#dCardCv'); AD.drawDailyCard(cv); (document.fonts&&document.fonts.ready||Promise.resolve()).then(()=>AD.drawDailyCard(cv)); cardEl.classList.add('show'); }
AD.openDailyCard=openCard;
return AD;
};
