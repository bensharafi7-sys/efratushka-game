/* המופע הגדול – Simon says / rhythm */
'use strict';
(function(){
const {$,rnd,rint,pick,save,sfx,say,chain,toast,confetti,A}=ZB;
const PADS=[{c:'#ff4fa8',e:'🎀',f:523.25},{c:'#3fb8ff',e:'🎁',f:659.25},{c:'#ffc21f',e:'⭐',f:783.99},{c:'#4fd36a',e:'🎈',f:880},{c:'#a66bff',e:'🧁',f:1046.5},{c:'#ff8a3d',e:'🍭',f:587.33}];
let age=5, nPads=4, seq=[], round=0, target=7, hearts=3, speed=800, level=1, busy=true, inputIdx=0, completed=0, firstTurn=true, zumiCount=0, running=false;
let ac=null; function tone(f,d){ if(ZB.muted) return; try{ if(!ac){ const AC=window.AudioContext||window.webkitAudioContext; ac=new AC(); } if(ac.state==='suspended') ac.resume();
  const o=ac.createOscillator(), o2=ac.createOscillator(), g=ac.createGain(); o.type='triangle'; o2.type='sine'; o.frequency.value=f; o2.frequency.value=f*2; o.connect(g); o2.connect(g); g.connect(ac.destination);
  const n=ac.currentTime; g.gain.setValueAtTime(0,n); g.gain.linearRampToValueAtTime(.28,n+.02); g.gain.exponentialRampToValueAtTime(.001,n+d); o.start(n); o2.start(n); o.stop(n+d+.05); o2.stop(n+d+.05); }catch(e){} }
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const ef=ZB.domSprite($('#ef'),'e_dance',14), zu=ZB.domSprite($('#zu'),'z_idle',16);
function setStatus(t){ $('#stTxt').textContent=t; }
function dots(){ const d=$('#seqDots'); d.innerHTML=''; for(let i=0;i<seq.length;i++){ const x=document.createElement('i'); if(i<inputIdx) x.className='on'; d.appendChild(x); } }
function hud(){ $('#hRound').textContent='🎵 שלב '+level+' · '+Math.min(round,target)+'/'+target; $('#hHearts').textContent='❤️'.repeat(Math.max(0,hearts))+'🤍'.repeat(Math.max(0,maxHearts()-hearts)); }
function maxHearts(){ return age<=4?4:3; }
function buildPads(){ const p=$('#pads'); p.innerHTML=''; const cols=nPads<=4?(nPads===3?3:2):3; p.style.gridTemplateColumns='repeat('+cols+',minmax(0,1fr))';
  const rows=Math.ceil(nPads/cols); p.style.gridTemplateRows='repeat('+rows+',minmax(0,1fr))';
  for(let i=0;i<nPads;i++){ const b=document.createElement('button'); b.className='pad'; b.style.background='radial-gradient(circle at 35% 30%,#fff8 0,'+PADS[i].c+' 45%)'; b.textContent=PADS[i].e; b.setAttribute('aria-label','כפתור '+(i+1)); b.dataset.i=i;
    b.addEventListener('pointerdown',e=>{ e.preventDefault(); press(i); }); p.appendChild(b); }
  fitPads(); }
function fitPads(){ const p=$('#pads'); const r=p.getBoundingClientRect(); const cols=nPads<=4?(nPads===3?3:2):3, rows=Math.ceil(nPads/cols); const s=Math.min((r.width-(cols-1)*12)/cols,(r.height-(rows-1)*12)/rows); p.querySelectorAll('.pad').forEach(b=>{ b.style.width=s+'px'; b.style.height=s+'px'; }); }
window.addEventListener('resize',fitPads);
function crowd(){ const c=$('#crowd'); c.innerHTML=''; const faces=['🧒','👧','🐻','👦','🐰','👶','🦄','👧🏽','🐼']; for(let i=0;i<9;i++){ const s=document.createElement('span'); s.textContent=faces[i]; s.style.animationDelay=(i*0.05)+'s'; c.appendChild(s); } }
function cheer(){ const c=$('#crowd'); c.classList.remove('cheer'); void c.offsetWidth; c.classList.add('cheer'); }
async function flash(i,d,who){ const b=$('#pads').children[i]; if(!b) return; b.classList.add('lit'); tone(PADS[i].f,Math.max(.25,d/1000)); pop(PADS[i].e);
  if(who==='e'){ ef.playOnce('e_celebrate','e_dance',30); } else if(who==='z'){ zu.playOnce('z_dance','z_idle',28); }
  await wait(d*.62); b.classList.remove('lit'); await wait(d*.38); }
function pop(e){ const p=$('#bigPop'); p.textContent=e; p.classList.add('on'); clearTimeout(pop.t); pop.t=setTimeout(()=>p.classList.remove('on'),260); }
function spot(w){ $('#spotE').classList.toggle('on',w==='e'); $('#spotZ').classList.toggle('on',w==='z'); }
async function demo(){ spot('e'); setStatus('👀 אפרתושקה מראה...'); inputIdx=0; dots(); await wait(350); for(const i of seq){ if(!running) return; await flash(i,speed,'e'); } spot(null); }
async function zumiTry(){ spot('z'); setStatus('🤪 זומי מנסה...'); zumiCount++; await say('z_sh_try');
  const wrongAt=rint(Math.max(0,seq.length-2),seq.length-1);
  for(let k=0;k<seq.length;k++){ if(!running) return; let i=seq[k]; if(k===wrongAt){ i=(i+rint(1,nPads-1))%nPads; await flash(i,speed*.9,'z'); sfx('wrong'); zu.playOnce('z_oops','z_idle',30); $('#zu').animate([{transform:'rotate(0)'},{transform:'rotate(-14deg)'},{transform:'rotate(10deg)'},{transform:'rotate(0)'}],{duration:600}); break; } await flash(i,speed*.9,'z'); }
  spot(null); await wait(250); await chain(['z_sh_wrong','e_sh_zumiwrong']); if(age<=5){ await demo(); } }
async function nextRound(extend){ busy=true; $('#pads').classList.add('off');
  if(extend){ round++; seq.push(nextPad()); } hud(); await wait(500);
  await demo(); if(!running) return;
  const doZumi=round===1&&extend?true:(extend&&round>2&&Math.random()<.3&&zumiCount<4);
  if(doZumi) await zumiTry();
  if(!running) return;
  if(firstTurn){ firstTurn=false; await say('e_sh_yourturn'); } else { toast('🎵 תורכם!',900); }
  setStatus('👆 תורכם! '+seq.length+' צעדים'); inputIdx=0; dots(); busy=false; $('#pads').classList.remove('off'); }
function nextPad(){ let p; do{ p=rint(0,nPads-1); } while(seq.length>=2&&p===seq[seq.length-1]&&p===seq[seq.length-2]); return p; }
async function press(i){ if(busy||!running) return; ZB.unlock(); const b=$('#pads').children[i]; b.classList.add('lit'); tone(PADS[i].f,.3); pop(PADS[i].e); setTimeout(()=>b.classList.remove('lit'),220);
  if(i===seq[inputIdx]){ inputIdx++; dots(); ef.playOnce('e_dance','e_dance'); if(inputIdx===seq.length){ busy=true; await success(); } }
  else { busy=true; await mistake(); } }
async function success(){ completed++; sfx('correct'); cheer(); confetti(null,null,50); ef.playOnce('e_celebrate','e_dance',30); zu.playOnce('z_celebrate','z_idle',28); setStatus('🎉 יש!'); $('#pads').classList.add('off');
  if(round>=target){ return end(true); }
  if(round%3===0){ level++; speed=Math.max(380,speed*.88); await wait(400); ZB.rain(70); sfx('powerup'); toast('⭐ שלב '+level+'! ⭐'); await say('e_sh_levelup'); }
  else { await wait(250); const v=pick(['ef_great','z_sh_wow','ef_amazing',null,'z_yay',null]); if(v) await say(v); }
  nextRound(true); }
async function mistake(){ sfx('wrong'); hearts--; hud(); $('#pads').classList.add('off'); $('#app').animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:300});
  zu.playOnce('z_oops','z_idle',30); setStatus('🙈 אופס!');
  if(hearts<=0) return end(false);
  await say(pick(['ef_oops','ef_almost','z_oops','ef_oops3'])); nextRound(false); }
async function end(win){ running=false; busy=true; setStatus(''); $('#seqDots').innerHTML=''; const stars=Math.min(15,completed+(win?3:0)); if(stars>0) ZB.award(stars);
  const g=save.game('show'); g.plays=(g.plays|0)+1; if(completed>(g.best|0)) g.best=completed; save.saveOwn();
  $('#endEmoji').textContent=win?'🏆':'🎭'; $('#endTitle').textContent=win?'איזה מופע!':'סוף המופע!';
  $('#endSub').textContent=win?'עשיתם '+completed+' ריקודים מושלמים!':'הצלחתם '+completed+' ריקודים. זומי עדיין לומד...';
  $('#endStars').textContent='+'+stars+' ⭐';
  if(win){ ZB.rain(120); cheer(); ef.set('e_celebrate'); zu.set('z_celebrate'); ZB.music('disco'); await say('e_sh_end'); await say('z_yay'); }
  else { await say(pick(['ef_oops2','ef_almost'])); }
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id==='scrEnd')); }
async function begin(){ ZB.unlock(); document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show'));
  age=save.age||5; nPads=age<=3?3:age<=6?4:age<=8?5:6; target=age<=4?5:age<=6?7:9; speed=age<=4?950:age<=6?780:620; hearts=maxHearts();
  const startLen=age<=4?1:age<=6?2:3; seq=[]; for(let i=0;i<startLen;i++) seq.push(nextPad()); round=0; level=1; completed=0; firstTurn=true; zumiCount=0; running=true;
  buildPads(); hud(); ef.set('e_dance'); zu.set('z_idle'); ZB.music('chip');
  await say('e_sh_intro'); nextRound(true); }
$('#go').onclick=()=>ZB.agePicker(begin);
$('#again').onclick=()=>begin();
window.addEventListener('keydown',e=>{ const n=parseInt(e.key,10); if(n>=1&&n<=nPads) press(n-1); });
ZB.topbar({back:'../hub/',onAge:a=>{ age=a; }});
crowd(); nPads=4; buildPads();
ZB.sprites(['e_dance','e_celebrate','z_idle','z_dance','z_oops','z_celebrate']);
ZB.preload(['s_correct','s_wrong','s_powerup','e_sh_intro','e_sh_yourturn','z_sh_try','z_sh_wrong','e_sh_zumiwrong','e_sh_levelup','ef_great','z_sh_wow','ef_oops','ef_almost']);
window.SHOW={get seq(){return seq;},press,get busy(){return busy;},get round(){return round;},begin,end};
})();
