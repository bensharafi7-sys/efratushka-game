/* איפה ההפתעה? – shell game: Zumi hides, shuffles and sometimes cheats; Efratushka catches him */
'use strict';
(function(){
const {$,rnd,rint,pick,shuffle,save,sfx,say,chain,toast,confetti}=ZB;
const COLS=[['#ff4fa8','#ffd23f'],['#3fb8ff','#ff4fa8'],['#4fd36a','#ffffff'],['#ffc21f','#7b2ff2'],['#a66bff','#5be37a'],['#ff8a3d','#3fd4ff']];
const PRIZES=['🌟','🍭','🧸','🎈','🍩','🦄','💎','🧁'];
const ROUNDS=5;
let age=5, n=3, boxes=[], slots=[], prizeBox=0, round=0, score=0, busy=true, swapMs=700, cheatedRounds=0, caughtOnce=false;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const zu=ZB.domSprite($('#zu'),'z_idle',16), ef=ZB.domSprite($('#ef'),'e_dance',12);
for(let i=0;i<9;i++) $('#bunting').appendChild(document.createElement('i'));
function msg(t){ $('#msg').textContent=t; }
function hud(){ $('#hRound').textContent='🎁 '+Math.min(round,ROUNDS)+'/'+ROUNDS; $('#hScore').textContent='✅ '+score; }
function layout(){ const T=$('#table').getBoundingClientRect(); const rows=n>4?2:1, per=Math.ceil(n/rows);
  const bw=Math.min((T.width-20)/per-10,(T.height*(rows===2?.42:.62)),150); $('#table').style.setProperty('--bw',bw+'px');
  slots=[]; for(let i=0;i<n;i++){ const r=rows===2?(i<per?0:1):0, k=rows===2?(r===0?i:i-per):i, cnt=rows===2?(r===0?per:n-per):n; const gap=(T.width-cnt*bw)/(cnt+1);
    slots.push({x:gap+k*(bw+gap),y:rows===2?(T.height*.22+r*(bw*1.08)):(T.height*.6-bw*.55)}); }
  boxes.forEach(b=>place(b)); placePrize(); }
window.addEventListener('resize',layout);
function place(b){ const s=slots[b.slot]; b.el.style.left=s.x+'px'; b.el.style.top=s.y+'px'; }
function placePrize(){ const b=boxes[prizeBox]; if(!b) return; const s=slots[b.slot]; const p=$('#prize'); p.style.left=s.x+'px'; p.style.top=s.y+'px'; }
function build(){ const t=$('#table'); t.querySelectorAll('.box').forEach(e=>e.remove()); boxes=[];
  const cols=shuffle(COLS.slice());
  for(let i=0;i<n;i++){ const el=document.createElement('div'); el.className='box'; el.style.setProperty('--c',cols[i][0]); el.style.setProperty('--r',cols[i][1]);
    el.innerHTML='<div class="body"></div><div class="rib"></div><div class="lid"></div><div class="bow"></div>'; el.setAttribute('role','button'); el.setAttribute('aria-label','קופסה '+(i+1));
    const b={el,slot:i,i}; el.addEventListener('pointerdown',e=>{ e.preventDefault(); choose(b); }); t.appendChild(el); boxes.push(b); }
  layout(); }
function setSpeed(ms){ $('#table').style.setProperty('--sd',ms+'ms'); }
async function swap(a,b){ const A=boxes[a], B=boxes[b]; const sa=A.slot; A.slot=B.slot; B.slot=sa;
  /* arc: one goes up, one goes down (via transform) */ A.el.style.zIndex=7; B.el.style.zIndex=5; place(A); place(B); sfx('bump',.25,1.4); await wait(swapMs+40); A.el.style.zIndex=''; B.el.style.zIndex=''; }
async function cheat(){ /* Zumi sneaks the prize to another box – visible hop so a sharp-eyed kid can follow */
  const from=prizeBox; let to; do{ to=rint(0,n-1); }while(to===from);
  zu.playOnce('z_lidpop','z_idle',30); say('z_s_cheat',{bubble:true});
  await wait(500); const p=$('#prize'); p.classList.add('hop'); p.style.opacity=1; const fs=slots[boxes[from].slot], ts=slots[boxes[to].slot];
  p.style.top=(fs.y-50)+'px'; await wait(260); p.style.left=ts.x+'px'; p.style.top=(ts.y-50)+'px'; await wait(520); p.style.top=ts.y+'px'; await wait(260); p.style.opacity=0; p.classList.remove('hop'); prizeBox=to; sfx('bump',.4,.8); cheatedRounds++; }
async function play(){ busy=true; round++; hud(); boxes.forEach(b=>b.el.classList.remove('up','glow'));
  if(age>=5&&round===3&&n<maxN()) { n++; build(); }
  const p=$('#prize'); p.textContent=pick(PRIZES); prizeBox=rint(0,n-1); placePrize(); p.style.opacity=1;
  msg('זומי בומי מחביא את ההפתעה...'); zu.playOnce('z_dance','z_idle',24);
  /* show the prize, lift the box above it */
  boxes[prizeBox].el.classList.add('up'); sfx('powerup',.5); if(round===1) await chain(['e_s_intro','z_s_hide']); else { if(Math.random()<.5) say('z_s_hide'); await wait(1300); }
  boxes[prizeBox].el.classList.remove('up'); await wait(450); p.style.opacity=0;
  msg('👀 עקבו אחרי הקופסה!'); await wait(300);
  const swaps=Math.round((age<=4?3:age<=6?5:7)+round*(age<=4?.6:1));
  const doCheat=round>=2&&(round===2||Math.random()<.35)&&cheatedRounds<2;
  const cheatAt=doCheat?rint(1,swaps-2):-1;
  setSpeed(swapMs);
  for(let k=0;k<swaps;k++){ let a=rint(0,n-1), b; do{ b=rint(0,n-1); }while(b===a);
    if(Math.random()<.55&&a!==prizeBox&&b!==prizeBox) a=prizeBox; /* keep the prize moving */
    await swap(a,b); placePrize(); if(k===cheatAt) await cheat(); }
  if(doCheat){ $('#eyes').classList.add('on'); ef.playOnce('e_oops','e_dance',24); await chain(['e_s_caught','z_s_caught']); $('#eyes').classList.remove('on'); }
  msg('👆 איפה ההפתעה?'); if(round===1) say('e_s_pick'); busy=false; boxes.forEach(b=>b.el.classList.add('wiggle')); setTimeout(()=>boxes.forEach(b=>b.el.classList.remove('wiggle')),900); }
async function choose(b){ if(busy) return; busy=true; ZB.unlock(); placePrize(); const p=$('#prize'); p.style.opacity=1;
  b.el.classList.add('up'); const ok=b.i===prizeBox;
  if(ok){ score++; hud(); sfx('correct'); sfx('confetti',.6); const r=b.el.getBoundingClientRect(), a=$('#app').getBoundingClientRect(); confetti(r.left-a.left+r.width/2,r.top-a.top,60);
    zu.playOnce('z_celebrate','z_idle',28); ef.playOnce('e_celebrate','e_dance',28); msg('🎉 מצאתם!'); await say(pick(['e_s_found','z_s_found','ef_great','e_s_found'])); }
  else { sfx('wrong'); zu.playOnce('z_dance','z_idle',28); msg('לא כאן... 🙃'); await say('z_s_miss'); boxes[prizeBox].el.classList.add('up','glow'); await wait(1100); }
  await wait(500);
  if(round>=ROUNDS) return end();
  swapMs=Math.max(age<=4?520:260,swapMs*.9); play(); }
function maxN(){ return age<=4?3:age<=6?4:age<=8?5:6; }
async function end(){ const stars=score+(score===ROUNDS?3:0); if(stars) ZB.award(stars);
  const g=save.game('surprise'); g.plays=(g.plays|0)+1; if(score>(g.best|0)) g.best=score; save.saveOwn();
  $('#endEmoji').textContent=score===ROUNDS?'🏆':score>=3?'🎁':'🙃'; $('#endTitle').textContent=score===ROUNDS?'עיניים של נשר!':score>=3?'כל הכבוד!':'זומי בומי ניצח הפעם...';
  $('#endSub').textContent='מצאתם '+score+' מתוך '+ROUNDS+' הפתעות'; $('#endStars').textContent='+'+stars+' ⭐';
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id==='scrEnd'));
  if(score===ROUNDS){ ZB.rain(100); await say('ef_champs'); } else if(score>=3) await say('z_yay'); else await say('ef_oops2'); }
async function begin(){ ZB.unlock(); document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show'));
  age=save.age||5; n=age<=6?3:age<=8?4:5; swapMs=age<=4?850:age<=6?650:age<=8?480:380; round=0; score=0; cheatedRounds=0; build(); hud(); ZB.music('candy'); await wait(300); play(); }
$('#go').onclick=()=>ZB.agePicker(begin);
$('#again').onclick=()=>begin();
window.addEventListener('keydown',e=>{ const k=parseInt(e.key,10); if(k>=1&&k<=n){ const b=boxes.find(x=>x.slot===k-1); if(b) choose(b); } });
ZB.topbar({back:'../hub/'});
n=3; build(); setSpeed(600);
ZB.sprites(['z_idle','z_dance','z_celebrate','z_lidpop','e_dance','e_celebrate','e_oops']);
ZB.preload(['s_correct','s_wrong','s_bump','s_powerup','s_confetti','e_s_intro','z_s_hide','z_s_cheat','e_s_caught','z_s_caught','e_s_pick','e_s_found','z_s_found','z_s_miss']);
window.SURP={get busy(){return busy;},get prize(){return prizeBox;},get boxes(){return boxes;},choose,get round(){return round;},begin};
})();
