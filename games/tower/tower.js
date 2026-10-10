/* זומי בומי: מגדל ההפתעות – Doodle-Jump-style bouncer */
'use strict';
(function(){
const {$,rnd,rint,pick,save,sfx,say,chain,toast,confetti,drawSprite,SP,A}=ZB;
const cv=$('#cv'), c=cv.getContext('2d');
const VW=400; let VH=760, SC=1, DPR=1;
const G=1500, JUMP=-820, SPRING=-1250, BALLOON=-1750, SAVE_V=-1350;
let st='menu', mode='classic', R=Math.random, age=5;
let P, plats, items, balloons, gifts, parts, camY, maxH, floor, lastFloor, starsGot, saves, t, world, boss, nextBoss, efr, nextBalloon, duo, fallT, best, lastMilestone, decor, shake;
const imgs={};
function resize(){ const r=cv.getBoundingClientRect(); DPR=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(r.width*DPR); cv.height=Math.round(r.height*DPR); SC=r.width/VW; VH=r.height/SC; }
window.addEventListener('resize',resize);
/* ---------- difficulty by age ---------- */
function D(){ const k=(age-3)/7, h=Math.min(1,floor/120); return {
  gapMin:52+26*k+18*h, gapMax:88+50*k+40*h, pw:96-18*k-10*h,
  pMove:.06+.12*k+.22*h, pVanish:floor<6?0:(.03+.1*k+.12*h), pConf:.12, pSpring:.09-.03*k,
  moveSp:40+60*k+60*h, saves:age<=4?3:age<=6?2:1, bossEvery:age<=5?20:25, hsp:300+40*k }; }
/* ---------- input ---------- */
let kL=false,kR=false,tL=false,tR=false,tilt=0,tiltOn=false;
window.addEventListener('keydown',e=>{ if(['ArrowLeft','a','A','ש'].includes(e.key)) kL=true; if(['ArrowRight','d','D','ג'].includes(e.key)) kR=true; if(e.key===' '&&st==='over') start(mode); if((e.key==='s'||e.key==='S')&&mode==='duo'&&st==='play') swap(true); });
window.addEventListener('keyup',e=>{ if(['ArrowLeft','a','A','ש'].includes(e.key)) kL=false; if(['ArrowRight','d','D','ג'].includes(e.key)) kR=false; });
function hold(btn,set){ btn.addEventListener('pointerdown',e=>{ e.preventDefault(); set(true); btn.classList.add('on'); }); ['pointerup','pointercancel','pointerleave'].forEach(ev=>btn.addEventListener(ev,()=>{ set(false); btn.classList.remove('on'); })); }
hold($('#bLeft'),v=>tL=v); hold($('#bRight'),v=>tR=v);
const touches=new Map();
cv.addEventListener('pointerdown',e=>{ if(st!=='play') return; touches.set(e.pointerId,e.clientX); updT(); });
cv.addEventListener('pointermove',e=>{ if(touches.has(e.pointerId)){ touches.set(e.pointerId,e.clientX); updT(); } });
['pointerup','pointercancel'].forEach(ev=>cv.addEventListener(ev,e=>{ touches.delete(e.pointerId); updT(); }));
let cL=false,cR=false; function updT(){ const r=cv.getBoundingClientRect(); cL=cR=false; touches.forEach(x=>{ if(x<r.left+r.width/2) cL=true; else cR=true; }); }
function onOri(e){ if(e.gamma==null) return; let g=e.gamma; const o=(screen.orientation&&screen.orientation.angle)||window.orientation||0; if(o===90) g=e.beta; else if(o===-90||o===270) g=-e.beta; tilt=Math.max(-1,Math.min(1,g/22)); }
const hasOri='DeviceOrientationEvent' in window && ('ontouchstart' in window);
if(!hasOri) $('#bTilt').classList.add('hidden');
$('#bTilt').onclick=async()=>{ if(tiltOn){ tiltOn=false; window.removeEventListener('deviceorientation',onOri); tilt=0; $('#bTilt').classList.remove('on'); toast('שליטה בכפתורים ◀ ▶'); return; }
  try{ if(typeof DeviceOrientationEvent.requestPermission==='function'){ const p=await DeviceOrientationEvent.requestPermission(); if(p!=='granted'){ toast('אין הרשאה להטיה – משחקים בכפתורים'); return; } } }catch(e){ toast('הטיה לא זמינה'); return; }
  tiltOn=true; window.addEventListener('deviceorientation',onOri); $('#bTilt').classList.add('on'); toast('📱 מטים את הטלפון!'); };
function dirInput(){ let d=0; if(kL||tL||cL) d-=1; if(kR||tR||cR) d+=1; if(tiltOn&&d===0) d=tilt; return d; }
/* ---------- world ---------- */
const WORLDS=[{name:'cake',from:0,sky:['#ffd1ec','#ffb0d8','#ff8fc7']},{name:'clouds',from:25,sky:['#bfe9ff','#8fd3ff','#c9b8ff']},{name:'space',from:60,sky:['#3a1a78','#1b0f45','#07051c']}];
function worldAt(f){ let w=WORLDS[0]; for(const x of WORLDS) if(f>=x.from) w=x; return w; }
const PCOL={normal:[['#ff6fb8','#ffd23f'],['#a66bff','#5be37a'],['#3fc8ff','#ff4fa8'],['#ffa63d','#7b2ff2']],conf:['#fff','#ff4fa8'],spring:['#5be37a','#ffd23f'],vanish:['rgba(255,255,255,.75)','#c9b8ff'],move:['#ff8a3d','#fff']};
function addPlat(y,force){ const d=D(); const r=R(); let type='normal';
  if(!force){ if(r<d.pSpring) type='spring'; else if(r<d.pSpring+d.pConf) type='conf'; else if(r<d.pSpring+d.pConf+d.pMove) type='move'; else if(r<d.pSpring+d.pConf+d.pMove+d.pVanish) type='vanish'; }
  const w=type==='spring'?70:d.pw; const x=12+R()*(VW-24-w);
  const p={x,y,w,h:22,type,vx:type==='move'?(R()<.5?-1:1)*d.moveSp:0,gone:0,col:type==='normal'?PCOL.normal[Math.floor(R()*4)]:PCOL[type],touched:0,sq:0};
  plats.push(p);
  if(type!=='spring'&&R()<.28) items.push({x:x+w/2,y:y-34,kind:'star',got:0,ph:R()*6});
  return p; }
function genUpTo(top){ const d=D(); while(genY>top){ genY-=d.gapMin+R()*(d.gapMax-d.gapMin); const p=addPlat(genY);
    /* a vanish/move platform must never be the only way up: add a safe twin if the gap is big */
    if((p.type==='vanish')&&R()<.8) { const q=addPlat(genY-rnd(-12,12),true); if(Math.abs(q.x-p.x)<p.w+10) q.x=(p.x+VW/2)%(VW-q.w); }
  }
  while(decorY>top-300){ decorY-=rnd(180,320); decor.push({x:rnd(10,VW-10),y:decorY,s:rnd(.6,1.1),k:Math.random(),side:Math.random()<.5}); } }
let genY=0, decorY=0;
/* ---------- characters ---------- */
function newPlayer(ch){ return {x:VW/2,y:-30,vx:0,vy:JUMP,ch,face:1,bounceT:0,h:ch==='z'?104:112,spin:0}; }
function curSprite(){ if(P.ch==='z') return 'z_jump'; return 'e_jumpb'; }
function curFrame(){ const s=SP[curSprite()]; if(!s) return 0;
  if(P.ch==='z'){ if(P.bounceT<.14) return 9+Math.floor(P.bounceT/.14*5); if(P.vy<-350) return 13+Math.min(3,Math.floor((-350-P.vy)/150)); return 17+Math.floor(t*14)%22; }
  const k=Math.max(0,Math.min(.999,(P.vy+900)/1800)); return Math.floor(k*s.n); }
/* ---------- game flow ---------- */
function start(m){ ZB.unlock(); mode=m; age=save.age||5; resize();
  R=m==='daily'?ZB.mulberry(ZB.todaySeed()):Math.random;
  plats=[]; items=[]; balloons=[]; gifts=[]; parts=[]; decor=[]; camY=-VH+120; maxH=0; floor=0; lastFloor=0; starsGot=0; t=0; shake=0;
  genY=40; decorY=0; duo=m==='duo'; lastMilestone=0; fallT=0;
  const d=D(); saves=d.saves; nextBoss=d.bossEvery; boss=null; nextBalloon=6; world=WORLDS[0];
  plats.push({x:0,y:40,w:VW,h:26,type:'ground',vx:0,gone:0,col:['#fff0f8','#ff4fa8'],touched:0,sq:0});
  genUpTo(camY-VH);
  P=newPlayer('z'); P.y=40; P.vy=JUMP;
  efr={x:VW*.7,dir:1,throwT:0,ch:'e'};
  st='play'; show(null); $('#ui').classList.remove('hidden');
  $('#bSwap').classList.toggle('hidden',!duo); $('#duoTag').classList.toggle('hidden',!duo); updDuo();
  ZB.music(m==='daily'?'chip':'sky'); hud();
  setTimeout(()=>{ if(st==='play') chain(m==='duo'?['e_t_intro','z_t_go']:['e_t_intro','z_t_go']); },400);
}
function updDuo(){ if(duo) $('#duoTag').textContent=P.ch==='z'?'🎁 קופץ: זומי בומי':'🎀 קופצת: אפרתושקה'; }
function swap(manual){ P.ch=P.ch==='z'?'e':'z'; P.h=P.ch==='z'?104:112; efr.ch=P.ch==='z'?'e':'z'; updDuo(); sfx('powerup');
  confetti(null,null,30); toast(P.ch==='z'?'תור של זומי בומי! 🎁':'תור של אפרתושקה! 🎀'); if(!ZB.voiceBusy()) say(P.ch==='z'?'z_t_go':'e_t_myturn'); }
function hud(){ $('#hFloor').textContent='🏢 '+floor; $('#hStars').textContent='⭐ '+starsGot; $('#hSaves').textContent=saves>0?'🎈'.repeat(saves):'—'; }
function show(id){ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id===id)); }
function bounce(v,pl){ P.vy=v; P.bounceT=0; if(pl){ pl.sq=1; } }
function die(){ if(st!=='play') return; st='fall'; fallT=0; sfx('wrong'); shake=.4; ZB.stopMusic();
  say(pick(P.ch==='z'?['z_t_fall','z_oops']:['e_t_fall','ef_oops'])); }
function finish(){ st='over'; $('#ui').classList.add('hidden');
  const g=save.game('tower'); const isBest=floor>(g.best|0); if(isBest) g.best=floor; g.plays=(g.plays|0)+1;
  if(mode==='daily'){ const k=ZB.todayKey(); g.daily=g.daily||{}; if(floor>(g.daily[k]|0)) g.daily[k]=floor; g.dailyKey=k; }
  save.saveOwn();
  const reward=Math.min(30,starsGot+Math.floor(floor/10)+(floor>=5?1:0)); if(reward>0) ZB.award(reward);
  $('#ovFloor').textContent='קומה '+floor; $('#ovBest').textContent=isBest&&floor>0?'🏆 שיא חדש!':'שיא: '+(g.best|0);
  $('#ovStars').textContent='+'+reward+' ⭐'; $('#ovEmoji').textContent=floor>=60?'🚀':floor>=25?'☁️':floor>=10?'🎂':'🙃';
  $('#ovTitle').textContent=floor>=60?'עד החלל!':floor>=25?'מעל העננים!':floor>=10?'איזו קפיצה!':'אופס! עוד פעם?';
  show('scrOver'); if(isBest&&floor>3){ ZB.rain(70); setTimeout(()=>say('z_t_record'),300); } else if(reward>0) setTimeout(()=>say(pick(['ef_enc1','ef_enc2','ef_almost'])),300);
  menuInfo(); }
/* ---------- update ---------- */
function update(dt){ t+=dt;
  if(st==='fall'){ fallT+=dt; if(fallT>1.9) finish(); return; }
  if(st!=='play') return;
  const d=D();
  const dir=dirInput(); P.vx+=(dir*d.hsp-P.vx)*Math.min(1,dt*(dir?9:6)); if(Math.abs(dir)>.15) P.face=dir>0?1:-1;
  const py=P.y; P.vy+=G*dt; P.y+=P.vy*dt; P.x+=P.vx*dt; P.bounceT+=dt; if(P.spin>0) P.spin=Math.max(0,P.spin-dt*2.4);
  if(P.x<-20) P.x+=VW+40; if(P.x>VW+20) P.x-=VW+40;
  for(const p of plats){ if(p.type==='move'){ p.x+=p.vx*dt; if(p.x<6){p.x=6;p.vx*=-1;} if(p.x+p.w>VW-6){p.x=VW-6-p.w;p.vx*=-1;} }
    if(p.sq>0) p.sq=Math.max(0,p.sq-dt*5); if(p.gone>0) p.gone+=dt; }
  if(P.vy>0){ for(const p of plats){ if(p.gone>0) continue; const top=p.y;
      if(py<=top+2&&P.y>=top&&P.x>p.x-16&&P.x<p.x+p.w+16){ P.y=top;
        if(p.type==='spring'){ bounce(SPRING,p); sfx('powerup'); P.spin=1; if(R()<.35&&!ZB.voiceBusy()) say('z_t_spring'); }
        else { bounce(JUMP,p); sfx('jump',.6,P.ch==='z'?1.1:1.25); }
        if(p.type==='conf'&&!p.touched){ burst(P.x,top,24); sfx('confetti',.6); if(R()<.5){ starsGot++; sfx('coin'); } }
        if(p.type==='vanish'){ p.gone=.01; }
        p.touched++; break; } } }
  for(const it of items){ if(it.got) continue; if(Math.abs(it.x-P.x)<30&&Math.abs(it.y-(P.y-P.h*.5))<P.h*.55){ it.got=1; starsGot++; sfx('coin'); sparkle(it.x,it.y); } }
  /* balloons from Efratushka */
  nextBalloon-=dt; if(nextBalloon<=0){ nextBalloon=rnd(9,14)-(age<=5?3:0); throwBalloon(); }
  for(const b of balloons){ b.y+=b.vy*dt; b.x+=Math.sin(t*2+b.ph)*20*dt;
    if(!b.pop&&Math.hypot(b.x-P.x,b.y-(P.y-P.h*.6))<46){ b.pop=1; bounce(BALLOON); P.spin=1.6; sfx('powerup'); burst(b.x,b.y,30); if(!ZB.voiceBusy()) say(pick(['e_t_balloon','z_t_spring','z_giggle'])); } }
  balloons=balloons.filter(b=>!b.pop&&b.y<camY+VH+80);
  /* efratushka on her stage */
  efr.x+=efr.dir*45*dt; if(efr.x<60||efr.x>VW-60) efr.dir*=-1; if(efr.throwT>0) efr.throwT-=dt;
  /* camera */
  const target=P.y-VH*.42; if(target<camY) camY+=(target-camY)*Math.min(1,dt*8);
  const h=Math.max(0,-P.y); if(h>maxH){ maxH=h; floor=Math.floor(maxH/100); }
  genUpTo(camY-VH*.3);
  plats=plats.filter(p=>p.y<camY+VH+60&&p.gone<.5); items=items.filter(i=>i.y<camY+VH+60&&!i.got);
  decor=decor.filter(x=>x.y*.6<camY+VH+400);
  if(floor!==lastFloor){ lastFloor=floor; hud(); onFloor(); }
  /* boss */
  if(!boss&&floor>=nextBoss){ startBoss(); }
  if(boss) updBoss(dt);
  for(const g of gifts){ g.y+=g.vy*dt; g.rot+=dt*2; if(!g.got&&Math.hypot(g.x-P.x,g.y-(P.y-P.h*.5))<42){ g.got=1; starsGot+=2; sfx('coin'); sfx('confetti',.5); burst(g.x,g.y,26); hud(); } }
  gifts=gifts.filter(g=>!g.got&&g.y<camY+VH+60);
  for(let i=parts.length-1;i>=0;i--){ const q=parts[i]; q.a+=dt; if(q.a>q.l){ parts.splice(i,1); continue; } q.vy+=700*dt; q.x+=q.vx*dt; q.y+=q.vy*dt; }
  if(shake>0) shake-=dt;
  /* fell off */
  if(P.y>camY+VH+40){ if(saves>0){ saves--; hud(); P.y=camY+VH+20; bounce(SAVE_V); P.spin=1.2; burst(P.x,camY+VH-30,40); sfx('powerup'); toast('🎈 אפרתושקה הצילה! 🎈'); if(!ZB.voiceBusy()) say(pick(['e_t_balloon','z_giggle'])); }
    else die(); }
  if(starsGot!==hud.s){ hud.s=starsGot; hud(); }
}
function onFloor(){ const w=worldAt(floor);
  if(w!==world){ world=w; sfx('powerup'); ZB.rain(50); toast(w.name==='clouds'?'☁️ עולם העננים!':'🚀 החלל!'); say(w.name==='clouds'?'e_t_clouds':'e_t_space'); if(w.name==='space') ZB.music('disco'); return; }
  if(duo&&floor>0&&floor%10===0){ swap(false); return; }
  if(floor>0&&floor%10===0&&floor!==lastMilestone){ lastMilestone=floor; toast('🏢 קומה '+floor+'!'); confetti(null,null,40); if(!ZB.voiceBusy()) say(pick(['ef_great','ef_amazing','z_yay','ef_enc3','ef_champs'])); } }
function throwBalloon(){ efr.throwT=.9; const y=camY+150; balloons.push({x:efr.x,y,vy:age<=5?70:95,ph:rnd(0,6),col:pick(['#ff4fa8','#ffd23f','#3fd4ff','#5be37a','#a66bff'])}); sfx('jump',.4,1.6); }
function startBoss(){ boss={t:0,x:VW/2,y:0,drop:1,hp:6,dur:age<=5?11:13}; nextBoss+=D().bossEvery; toast('🦹 גנב הצבעים!'); sfx('bump'); chain(['e_t_thief','z_t_thief']); }
function updBoss(dt){ boss.t+=dt; boss.x=VW/2+Math.sin(boss.t*1.3)*(VW*.36); boss.y=camY+230+Math.sin(boss.t*2.1)*30;
  boss.drop-=dt; if(boss.drop<=0&&boss.t<boss.dur-1.5){ boss.drop=age<=5?1.1:1.4; gifts.push({x:boss.x,y:boss.y+30,vy:130,rot:0,col:pick(['#ff4fa8','#ffd23f','#3fd4ff','#5be37a'])}); }
  if(boss.t>boss.dur){ boss=null; toast('הגנב ברח! 🎁'); } }
function burst(x,y,n){ for(let i=0;i<n;i++){ const a=rnd(Math.PI,Math.PI*2); const v=rnd(120,420); parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,a:0,l:rnd(.6,1.2),col:pick(['#ff4fa8','#ffd23f','#3fd4ff','#7b2ff2','#5be37a','#fff']),s:rnd(4,8)}); } }
function sparkle(x,y){ for(let i=0;i<10;i++){ const a=i/10*Math.PI*2; parts.push({x,y,vx:Math.cos(a)*180,vy:Math.sin(a)*180,a:0,l:.5,col:'#ffd23f',s:5}); } }
/* ---------- draw ---------- */
function lerpCol(a,b,k){ const pa=parseInt(a.slice(1),16), pb=parseInt(b.slice(1),16); const r=(pa>>16)+((pb>>16)-(pa>>16))*k, g=(pa>>8&255)+((pb>>8&255)-(pa>>8&255))*k, bl=(pa&255)+((pb&255)-(pa&255))*k; return 'rgb('+(r|0)+','+(g|0)+','+(bl|0)+')'; }
function skyAt(f){ /* smooth blend between worlds */ const i=f<25?0:f<60?1:2; const w=WORLDS[i], n=WORLDS[Math.min(2,i+1)]; const span=i===0?25:i===1?35:1; const k=i===2?0:Math.max(0,Math.min(1,(f-(n.from-5))/5)); return w.sky.map((c0,j)=>lerpCol(c0,n.sky[j],k)); }
function drawBg(){ const f=Math.max(0,-camY/100); const sky=skyAt(f); const g=c.createLinearGradient(0,0,0,VH); g.addColorStop(0,sky[0]); g.addColorStop(.6,sky[1]); g.addColorStop(1,sky[2]); c.fillStyle=g; c.fillRect(0,0,VW,VH);
  if(f>50){ c.fillStyle='#fff'; const a=Math.min(1,(f-50)/10); for(let i=0;i<70;i++){ const x=(i*97)%VW, y=((i*173-camY*.15)%VH+VH)%VH; c.globalAlpha=a*(.4+.6*Math.abs(Math.sin(t*2+i))); c.fillRect(x,y,2,2); } c.globalAlpha=1; }
  for(const d of decor){ const y=d.y*.6-camY*.6+(camY-camY*.6)*0; const sy=d.y*.6-camY*.6; if(sy<-200||sy>VH+200) continue; const fl=(-d.y*.6)/100/0.6; const w=worldAt(Math.max(0,fl));
    let im=null; if(w.name==='cake') im=d.k<.5?imgs.dec_cake:d.k<.8?imgs.dec_cupcake:imgs.dec_balloon; else if(w.name==='clouds') im=d.k<.6?null:d.k<.85?imgs.dec_balloon:imgs.dec_cotton; else im=d.k<.5?imgs.wd_planet:d.k<.75?imgs.wd_rocket:null;
    c.globalAlpha=.55; if(im){ const s=90*d.s; c.drawImage(im,d.side?d.x*.3:VW-d.x*.3-s,sy,s,s*im.height/im.width); } else if(w.name==='clouds'){ cloud(d.side?d.x*.4:VW-d.x*.4,sy,d.s*1.2); } c.globalAlpha=1; } }
function cloud(x,y,s){ c.fillStyle='#fff'; c.beginPath(); c.arc(x,y,26*s,0,7); c.arc(x+26*s,y-10*s,32*s,0,7); c.arc(x+56*s,y,24*s,0,7); c.fill(); }
function drawPlat(p){ const y=p.y-camY; if(y<-40||y>VH+40) return; const sq=p.sq*5; const x=p.x-sq/2, w=p.w+sq, h=p.h-sq*.6, yy=y+sq*.6;
  c.save(); if(p.type==='vanish'){ c.globalAlpha=p.gone>0?Math.max(0,1-p.gone*2):.7+.2*Math.sin(t*6); }
  if(p.type==='ground'){ c.fillStyle='#fff0f8'; ZB.rr(c,0,y,VW,60,0); c.fill(); c.fillStyle='#ff4fa8'; for(let i=0;i<VW;i+=40){ c.beginPath(); c.arc(i+20,y+2,14,0,Math.PI); c.fill(); } c.restore(); return; }
  c.shadowColor='rgba(0,0,0,.18)'; c.shadowOffsetY=4; c.fillStyle=p.col[0]; ZB.rr(c,x,yy,w,h,7); c.fill(); c.shadowColor='transparent';
  c.lineWidth=2; c.strokeStyle='rgba(60,20,80,.35)'; c.stroke();
  if(p.type==='conf'){ for(let i=0;i<9;i++){ c.fillStyle=['#ff4fa8','#ffd23f','#3fd4ff','#5be37a','#7b2ff2'][i%5]; c.fillRect(x+6+((i*37)%(w-14)),yy+4+((i*11)%(h-8)),5,3); } }
  c.fillStyle=p.col[1]; c.fillRect(x+w/2-5,yy,10,h); c.fillRect(x,yy+h/2-3,w,6);
  /* small bow */ if(p.type!=='vanish'){ c.beginPath(); c.ellipse(x+w/2-8,yy-3,8,5,-.4,0,7); c.ellipse(x+w/2+8,yy-3,8,5,.4,0,7); c.fill(); }
  if(p.type==='spring'){ const s=p.sq>0?6:14; c.strokeStyle='#555'; c.lineWidth=3; c.beginPath(); for(let i=0;i<=5;i++){ c.lineTo(x+w/2+(i%2?9:-9),yy-4-i*s/5); } c.stroke(); c.fillStyle='#ff4fa8'; ZB.rr(c,x+w/2-16,yy-8-s,32,6,3); c.fill(); }
  if(p.type==='move'){ c.fillStyle='#fff'; c.font='bold 14px Rubik,sans-serif'; c.textAlign='center'; c.fillText('◀ ▶',x+w/2,yy+h-5); }
  c.restore(); }
function drawStar(x,y,r,col){ c.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } c.closePath(); c.fillStyle=col; c.fill(); c.lineWidth=2; c.strokeStyle='#c98a00'; c.stroke(); }
function drawGift(x,y,s,col,rot){ c.save(); c.translate(x,y); c.rotate(Math.sin(rot)*.3); c.fillStyle=col; ZB.rr(c,-s/2,-s/2,s,s,5); c.fill(); c.fillStyle='#fff'; c.fillRect(-3,-s/2,6,s); c.fillRect(-s/2,-3,s,6); c.beginPath(); c.ellipse(-7,-s/2-3,7,5,-.4,0,7); c.ellipse(7,-s/2-3,7,5,.4,0,7); c.fill(); c.restore(); }
function drawBalloon(b){ const x=b.x,y=b.y-camY; c.strokeStyle='rgba(80,40,90,.6)'; c.lineWidth=1.5; c.beginPath(); c.moveTo(x,y+30); c.quadraticCurveTo(x+8,y+45,x,y+62); c.stroke(); c.fillStyle=b.col; c.beginPath(); c.ellipse(x,y,24,30,0,0,7); c.fill(); c.fillStyle='rgba(255,255,255,.5)'; c.beginPath(); c.ellipse(x-8,y-10,6,10,-.4,0,7); c.fill(); c.fillStyle='#fff'; c.font='bold 18px Rubik,sans-serif'; c.textAlign='center'; c.fillText('⇧',x,y+7); }
function drawChar(ch,name,frame,x,by,h,flip,spin){ c.save(); if(spin){ c.translate(x,by-h/2); c.rotate((1-spin)*Math.PI*2*(spin>0?1:0)); c.translate(-x,-(by-h/2)); }
  drawSprite(c,name,frame,x,by,h,flip); if(ch==='z') ZBC.drawOn(c,name,frame,x,by,h,flip,t); c.restore(); }
function drawStage(){ /* Efratushka (or Zumi in duo) on a cloud at the top cheering */ const y=168+Math.sin(t*2)*4;
  c.save(); c.globalAlpha=.95; cloud(efr.x-46,y+4,.9); c.restore();
  const who=efr.ch||'e'; const name=who==='e'?(efr.throwT>0?'e_celebrate':'e_dance'):(efr.throwT>0?'z_celebrate':'z_dance');
  const s=SP[name]; if(s) drawChar(who,name,Math.floor(t*14),efr.x,y+8,who==='e'?92:84,efr.dir<0);
}
function draw(){ c.setTransform(DPR*SC,0,0,DPR*SC,0,0); c.save(); if(shake>0) c.translate(rnd(-5,5)*shake*2,rnd(-5,5)*shake*2); drawBg();
  for(const p of plats) drawPlat(p);
  for(const it of items){ const y=it.y-camY+Math.sin(t*3+it.ph)*4; if(y>-20&&y<VH+20) drawStar(it.x,y,13,'#ffd23f'); }
  for(const g of gifts) drawGift(g.x,g.y-camY,30,g.col,g.rot);
  if(boss&&imgs.thief){ const bw=110, bh=bw*imgs.thief.height/imgs.thief.width; c.save(); c.globalAlpha=Math.min(1,boss.t,(boss.dur-boss.t)); c.drawImage(imgs.thief,boss.x-bw/2,boss.y-camY-bh/2,bw,bh); c.restore(); }
  for(const b of balloons) drawBalloon(b);
  if(P){ if(st==='fall'){ const k=Math.min(1,fallT/.5); const name=P.ch==='z'?'z_oops':'e_oops'; const fr=Math.floor(fallT*24); drawChar(P.ch,name,Math.min(fr,(SP[name]||{n:1}).n-1),VW/2,VH-30-(1-k)*40,P.ch==='z'?150:170,false); }
    else drawChar(P.ch,curSprite(),curFrame(),P.x,P.y-camY+4,P.h,P.face<0,P.spin); }
  for(const q of parts){ c.globalAlpha=Math.max(0,1-q.a/q.l); c.fillStyle=q.col; c.fillRect(q.x-q.s/2,q.y-camY-q.s/4,q.s,q.s/2); } c.globalAlpha=1;
  if(st==='play'||st==='fall') drawStage();
  c.restore(); }
let last=performance.now();
function loop(now){ const dt=Math.min(.033,(now-last)/1000); last=now; if(st==='play'||st==='fall'){ update(dt); draw(); } else if(st==='menu'||st==='over'){ t+=dt; if(P) draw(); } requestAnimationFrame(loop); }
/* ---------- menus ---------- */
function menuInfo(){ const g=save.game('tower'); $('#bestTxt').textContent='שיא: '+(g.best|0)+' קומות'; const k=ZB.todayKey(); const dv=(g.daily||{})[k]; $('#dailyTxt').textContent=dv?('היום: קומה '+dv):'אתגר יומי חדש!'; }
$('#mClassic').onclick=()=>begin('classic'); $('#mDaily').onclick=()=>begin('daily'); $('#mDuo').onclick=()=>begin('duo');
$('#mCostume').onclick=()=>{ ZB.unlock(); openCostume(); };
$('#ovRetry').onclick=()=>start(mode); $('#ovMenu').onclick=()=>{ st='menu'; ZB.music('candy'); show('scrStart'); menuInfo(); };
$('#ovShare').onclick=()=>shareCard();
function begin(m){ ZB.unlock(); ZB.agePicker(()=>start(m)); }
$('#bSwap').onclick=()=>{ if(st==='play') swap(true); };
/* costume machine */
let tab='hat', pv=null;
function openCostume(){ show('scrCostume'); renderGrid(); if(!pv){ pv=$('#costPrev').getContext('2d'); (function a(){ if(document.getElementById('scrCostume').classList.contains('show')) drawPrev(); requestAnimationFrame(a); })(); } if(!ZB.voiceBusy()) say('z_t_costume'); }
function drawPrev(){ const cc=pv, W=360,H=400; cc.clearRect(0,0,W,H); const g=cc.createRadialGradient(W/2,H*.6,10,W/2,H*.6,220); g.addColorStop(0,'#fff6fd'); g.addColorStop(1,'#ffd1ec'); cc.fillStyle=g; cc.fillRect(0,0,W,H);
  const fr=Math.floor(performance.now()/1000*14); const name=SP.z_dance?'z_dance':'z_idle'; ZB.drawSprite(cc,name,fr,W/2,H-12,370,false); ZBC.drawOn(cc,name,fr,W/2,H-12,370,false,performance.now()/1000); }
function renderGrid(){ document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('on',b.dataset.k===tab)); const gr=$('#costGrid'); gr.innerHTML='';
  ZBC.ITEMS[tab].forEach(([id,label])=>{ const b=document.createElement('button'); b.title=label; b.setAttribute('aria-label',label); if(ZBC.cur[tab]===id) b.classList.add('on'); const cv2=document.createElement('canvas'); cv2.width=120; cv2.height=100; b.appendChild(cv2); ZBC.icon(cv2,tab,id);
    b.onclick=()=>{ ZBC.set(tab,id); sfx('coin'); renderGrid(); }; gr.appendChild(b); }); }
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{ tab=b.dataset.k; sfx('bump',.5); renderGrid(); });
$('#lever').onclick=()=>{ sfx('powerup'); let n=0; const iv=setInterval(()=>{ ZBC.random(); renderGrid(); sfx('coin',.4,1+n*.05); if(++n>8){ clearInterval(iv); confetti(null,null,50); if(!ZB.voiceBusy()) say(pick(['z_giggle','z_yay','z_t_costume'])); } },110); };
$('#costDone').onclick=()=>{ show('scrStart'); sfx('correct'); };
/* share card */
async function shareCard(){ const W=1080,H=1350, k=document.createElement('canvas'); k.width=W; k.height=H; const x=k.getContext('2d'); const sky=skyAt(floor);
  const g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,sky[0]); g.addColorStop(.6,sky[1]); g.addColorStop(1,sky[2]); x.fillStyle=g; x.fillRect(0,0,W,H);
  for(let i=0;i<120;i++){ x.fillStyle=pick(['#ff4fa8','#ffd23f','#3fd4ff','#7b2ff2','#5be37a','#fff']); x.save(); x.translate(Math.random()*W,Math.random()*H); x.rotate(Math.random()*6); x.fillRect(-9,-4,18,8); x.restore(); }
  x.fillStyle='rgba(255,255,255,.88)'; ZB.rr(x,70,70,W-140,330,50); x.fill();
  x.direction='rtl'; x.textAlign='center'; x.fillStyle='#7a1fa2'; x.font='900 74px Rubik,sans-serif'; x.fillText('זומי בומי: מגדל ההפתעות',W/2,170);
  x.fillStyle='#ff2d95'; x.font='900 150px Rubik,sans-serif'; x.fillText('קומה '+floor+'!',W/2,330);
  const sp=SP.z_celebrate||SP.z_idle; const nm=SP.z_celebrate?'z_celebrate':'z_idle'; if(sp){ const fr=Math.floor(sp.n*.6); ZB.drawSprite(x,nm,fr,W/2,H-150,760,false); ZBC.drawOn(x,nm,fr,W/2,H-150,760,false,0); }
  if(imgs.efrat_face){ x.save(); x.beginPath(); x.arc(W-190,H-330,120,0,7); x.fillStyle='#fff'; x.fill(); x.clip(); x.drawImage(imgs.efrat_face,W-310,H-450,240,240); x.restore(); }
  x.fillStyle='#fff'; x.font='800 54px Rubik,sans-serif'; x.fillText((mode==='daily'?'📅 מגדל היום ':'')+'קפצתי עם אפרתושקה וזומי בומי! 🎈',W/2,H-60);
  const r=await ZB.shareCanvas(k,'zumi-tower-'+floor+'.png','קפצתי לקומה '+floor+' במגדל ההפתעות של זומי בומי! 🎁'); if(r==='download') toast('📸 הכרטיס נשמר!'); }
/* ---------- boot ---------- */
ZB.topbar({back:'../hub/',onAge:a=>{ age=a; }});
resize(); menuInfo();
const startSp=ZB.domSprite($('#startZumi'),'z_idle',16);
setTimeout(()=>startSp.playOnce('z_jump','z_idle',20),1200);
setInterval(()=>{ if($('#scrStart').classList.contains('show')) startSp.playOnce(pick(['z_jump','z_dance','z_lidpop']),'z_idle',20); },6000);
ZB.sprites(['z_idle','z_jump','z_oops','z_dance','z_celebrate','z_lidpop','e_jumpb','e_oops','e_celebrate','e_dance']);
ZBC.loadAnchors(A);
['thief','dec_cake','dec_cupcake','dec_balloon','dec_cotton','wd_planet','wd_rocket','efrat_face'].forEach(n=>ZB.loadImg(A+'img/'+n+'.webp').then(i=>imgs[n]=i));
ZB.preload(['s_jump','s_coin','s_powerup','s_confetti','s_wrong','s_bump','s_correct','e_t_intro','z_t_go','z_t_spring','e_t_balloon','z_t_fall','e_t_fall','z_oops','z_giggle']);
document.addEventListener('pointerdown',()=>{ if(st==='menu') ZB.music('candy'); },{once:true});
requestAnimationFrame(loop);
window.TOWER={get st(){return st;},get floor(){return floor;},get P(){return P;},start,die,setH(f){ P.y=-f*100; P.vy=JUMP; camY=P.y-VH*.42; plats=[]; items=[]; genY=P.y+40; addPlat(P.y+40,true).x=P.x-40; genUpTo(camY-VH); },boss:()=>startBoss()};
})();
