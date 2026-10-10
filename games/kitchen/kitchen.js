/* מטבח המסיבה – build a party cake following Efratushka's voice orders; Zumi tastes. Ends with a named cake photo. */
'use strict';
(function(){
const {$,rnd,rint,pick,shuffle,save,sfx,say,chain,toast,confetti,A}=ZB;
const ING={
  pink:{label:'ורוד',col:'#ff9ccf',dark:'#e86aa9',voice:'e_k_pink',type:'layer'},
  yellow:{label:'צהוב',col:'#ffe27a',dark:'#f2b630',voice:'e_k_yellow',type:'layer'},
  choco:{label:'שוקולד',col:'#8b4a2b',dark:'#5e2c16',voice:'e_k_choco',type:'layer'},
  blue:{label:'כחול',col:'#8fd3ff',dark:'#4aa6e0',voice:'e_k_blue',type:'layer'},
  cream:{label:'קצפת',ic:'🍦',voice:'e_k_cream',type:'top'},
  sprinkles:{label:'סוכריות',ic:'🌈',voice:'e_k_sprinkles',type:'top'},
  candles:{label:'נרות',ic:'🕯️',voice:'e_k_candles',type:'top'},
  berry:{label:'תותים',ic:'🍓',type:'top'}
};
const ORDER_KEYS=['pink','yellow','choco','blue','cream','sprinkles','candles','berry'];
const cv=$('#cv'), c=cv.getContext('2d'); let W=400,H=420,DPR=1;
let age=5, cake, orders=[], oi=0, busy=true, phase='menu', t=0, parts=[], tasted=false, sneezed=false, cakeName='';
const zu=ZB.domSprite($('#zu'),'z_idle',16), ef=ZB.domSprite($('#ef'),'e_dance',12);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
function orderSay(k){ const I=ING[k]; if(I&&I.voice) return say(I.voice); ZB.bubble('e','ועכשיו שימו '+(I?I.label:'')+'! 🍓',1.6); sfx('coin',.5); return wait(1500); }
function resize(){ const r=cv.getBoundingClientRect(); DPR=Math.min(2,window.devicePixelRatio||1); cv.width=Math.round(r.width*DPR); cv.height=Math.round(r.height*DPR); W=r.width; H=r.height; }
window.addEventListener('resize',resize);
function newCake(){ return {layers:[],cream:null,sprinkles:[],candles:0,berries:[],bite:false,flour:0,drop:0}; }
/* ---------- drawing (shared by screen + photo) ---------- */
function geom(cw,ch){ const s=Math.min(cw/320,ch/440); return {s,cx:cw/2,base:ch-34*s}; }
function drawCake(x,cw,ch,tm,cake){ const {s,cx,base}=geom(cw,ch);
  /* stand */ x.fillStyle='#fff'; x.beginPath(); x.ellipse(cx,base+6*s,150*s,18*s,0,0,7); x.fill(); x.fillStyle='#e9d6f3'; x.fillRect(cx-14*s,base+10*s,28*s,22*s); x.beginPath(); x.ellipse(cx,base+32*s,60*s,9*s,0,0,7); x.fill();
  x.fillStyle='rgba(0,0,0,.08)'; x.beginPath(); x.ellipse(cx,base+8*s,140*s,12*s,0,0,7); x.fill();
  let y=base; const LH=58*s; let topW=0, topY=base;
  cake.layers.forEach((L,i)=>{ const w=(210-i*22)*s; let yy=y-LH; if(i===cake.layers.length-1&&cake.drop>0) yy-=cake.drop*s*200;
    x.fillStyle=L.dark; ZB.rr(x,cx-w/2,yy+6*s,w,LH-2*s,12*s); x.fill(); x.fillStyle=L.col; ZB.rr(x,cx-w/2,yy,w,LH-8*s,12*s); x.fill();
    x.fillStyle='rgba(255,255,255,.28)'; ZB.rr(x,cx-w/2+8*s,yy+5*s,w*.35,7*s,4*s); x.fill();
    x.fillStyle='rgba(255,255,255,.8)'; for(let k=0;k<6;k++){ x.beginPath(); x.arc(cx-w/2+w*(k+.5)/6,yy+LH*.62,3.2*s,0,7); x.fill(); }
    y-=LH-6*s; topW=w; topY=yy; });
  if(!cake.layers.length){ x.fillStyle='rgba(255,255,255,.7)'; x.font='800 '+(20*s)+'px Rubik,sans-serif'; x.textAlign='center'; x.fillText('🎂 ?',cx,base-40*s); return {topY:base,topW:0,s,cx}; }
  if(cake.bite){ x.save(); x.globalCompositeOperation='destination-out'; for(let k=0;k<3;k++){ x.beginPath(); x.arc(cx+topW/2-4*s,topY+12*s+k*13*s,13*s,0,7); x.fill(); } x.restore(); }
  if(cake.cream){ const cc=cake.cream; x.fillStyle=cc; x.beginPath(); x.moveTo(cx-topW/2-4*s,topY+8*s); const n=8; for(let k=0;k<=n;k++){ const xx=cx-topW/2-4*s+(topW+8*s)*k/n; x.lineTo(xx,topY+8*s); x.quadraticCurveTo(xx+(topW/n)*.5,topY+(k%2?30:20)*s,xx+(topW+8*s)/n,topY+8*s); }
    x.lineTo(cx+topW/2+4*s,topY-4*s); x.quadraticCurveTo(cx,topY-16*s,cx-topW/2-4*s,topY-4*s); x.closePath(); x.fill();
    for(let k=0;k<6;k++){ const xx=cx-topW/2+topW*(k+.5)/6; x.beginPath(); x.arc(xx,topY-8*s,10*s,0,7); x.fill(); x.beginPath(); x.arc(xx,topY-16*s,6*s,0,7); x.fill(); } }
  cake.berries.forEach(b=>{ const bx=cx+b.x*topW/2, by=topY-(cake.cream?18:6)*s; x.font=(26*s)+'px sans-serif'; x.textAlign='center'; x.fillText('🍓',bx,by); });
  for(let k=0;k<cake.candles;k++){ const n=cake.candles; const bx=cx-topW*.38+topW*.76*(n===1?.5:k/(n-1)), by=topY-(cake.cream?14:4)*s; const col=['#ff4fa8','#3fb8ff','#ffd23f','#5be37a','#a66bff'][k%5];
    x.fillStyle=col; x.fillRect(bx-4*s,by-40*s,8*s,40*s); x.fillStyle='rgba(255,255,255,.7)'; for(let j=0;j<3;j++) x.fillRect(bx-4*s,by-36*s+j*12*s,8*s,4*s);
    const fl=1+Math.sin(tm*14+k*2)*.15; x.fillStyle='#ffb020'; x.beginPath(); x.ellipse(bx,by-50*s,5*s,10*s*fl,0,0,7); x.fill(); x.fillStyle='#fff3a0'; x.beginPath(); x.ellipse(bx,by-48*s,2.5*s,5*s*fl,0,0,7); x.fill(); }
  cake.sprinkles.forEach(p=>{ x.save(); x.translate(cx+p.x*s,base+p.y*s); x.rotate(p.r); x.fillStyle=p.c; x.fillRect(-4*s,-1.5*s,8*s,3*s); x.restore(); });
  if(cake.flour>0){ x.fillStyle='rgba(255,255,255,'+(cake.flour*.6)+')'; x.fillRect(0,0,cw,ch); }
  return {topY,topW,s,cx}; }
function draw(){ c.setTransform(DPR,0,0,DPR,0,0); c.clearRect(0,0,W,H); drawCake(c,W,H,t,cake);
  for(const p of parts){ c.globalAlpha=Math.max(0,1-p.a/p.l); c.fillStyle=p.c; c.beginPath(); c.arc(p.x,p.y,p.s,0,7); c.fill(); } c.globalAlpha=1; }
let last=performance.now();
function loop(now){ const dt=Math.min(.05,(now-last)/1000); last=now; t+=dt; if(cake.drop>0) cake.drop=Math.max(0,cake.drop-dt*4); if(cake.flour>0) cake.flour=Math.max(0,cake.flour-dt*.5);
  for(let i=parts.length-1;i>=0;i--){ const p=parts[i]; p.a+=dt; if(p.a>p.l){ parts.splice(i,1); continue; } p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; }
  draw(); requestAnimationFrame(loop); }
/* ---------- tray ---------- */
function buildTray(){ const tr=$('#tray'); tr.innerHTML=''; ORDER_KEYS.forEach(k=>{ const I=ING[k]; const b=document.createElement('button'); b.className='ing'; b.dataset.k=k;
  b.innerHTML=(I.type==='layer'?'<span class="sw" style="background:'+I.col+'"></span>':'<span class="ic">'+I.ic+'</span>')+'<span>'+(I.type==='layer'?'שכבה ':'')+I.label+'</span>';
  b.addEventListener('pointerdown',e=>{ e.preventDefault(); use(k,b); }); tr.appendChild(b); }); }
function stepIcon(k){ const I=ING[k]; return I.type==='layer'?'<span class="sw" style="background:'+I.col+'"></span>':I.ic; }
function renderOrder(){ const s=$('#steps'); s.innerHTML=''; orders.forEach((k,i)=>{ const d=document.createElement('div'); d.className='st'+(i<oi?' done':'')+(i===oi&&phase==='order'?' cur':''); d.innerHTML=stepIcon(k); s.appendChild(d); });
  document.querySelectorAll('.ing').forEach(b=>b.classList.toggle('hint',phase==='order'&&age<=5&&b.dataset.k===orders[oi])); }
function makeOrders(){ const layers=shuffle(['pink','yellow','choco','blue']); const nL=age<=4?1:age<=6?2:3; const o=layers.slice(0,nL); o.push('cream');
  if(age>=5) o.push('sprinkles'); o.push('candles'); if(age>=8) o.splice(rint(nL,o.length-1),0,'berry'); return o; }
/* ---------- actions ---------- */
function puff(x,y,n,cols,g){ for(let i=0;i<n;i++){ const a=rnd(0,Math.PI*2), v=rnd(60,260); parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-80,a:0,l:rnd(.5,1.1),s:rnd(2,5),c:pick(cols),g:g==null?500:g}); } }
function apply(k){ const I=ING[k]; const g=geom(W,H);
  if(I.type==='layer'){ if(cake.layers.length>=5){ toast('העוגה כבר גבוהה מספיק! 😄'); return false; } cake.layers.push({col:I.col,dark:I.dark}); cake.drop=1; cake.cream=cake.cream&&null; cake.candles=0; cake.berries=[]; cake.bite=false; sfx('bump',.8); setTimeout(()=>puff(W/2,g.base-cake.layers.length*52*g.s,16,['#fff','#ffe0f3']),220); return true; }
  if(!cake.layers.length){ toast('קודם שכבה של עוגה! 🎂'); return false; }
  const top=drawInfo();
  if(k==='cream'){ cake.cream=pick(['#ffffff','#fff0f8','#ffe8f4']); sfx('powerup',.5); puff(W/2,top.topY,24,['#fff','#ffe0f3'],200); return true; }
  if(k==='sprinkles'){ for(let i=0;i<40;i++){ const li=rint(0,cake.layers.length-1); const w=(210-li*22)*.92; cake.sprinkles.push({x:rnd(-w/2,w/2),y:-(li*52)-rnd(8,46),r:rnd(0,6),c:pick(['#ff4fa8','#ffd23f','#3fd4ff','#5be37a','#7b2ff2','#fff'])}); } sfx('confetti',.7); return true; }
  if(k==='candles'){ cake.candles=Math.max(1,Math.min(10,age)); sfx('powerup',.6,1.3); return true; }
  if(k==='berry'){ for(let i=0;i<3;i++) cake.berries.push({x:rnd(-.7,.7)}); sfx('coin',.6); return true; }
  return false; }
function drawInfo(){ const tmp=document.createElement('canvas').getContext('2d'); return drawCake(tmp,W,H,0,cake); }
async function use(k,b){ ZB.unlock(); if(busy) return;
  if(phase==='order'){ const want=orders[oi];
    if(k!==want){ b.classList.remove('no'); void b.offsetWidth; b.classList.add('no'); sfx('wrong',.5); zu.playOnce('z_dance','z_idle',28); busy=true; if(Math.random()<.5) await say('z_giggle'); else await orderSay(want); busy=false; return; }
    if(!apply(k)) return; oi++; renderOrder(); sfx('correct',.5);
    if(k==='cream'&&!tasted){ tasted=true; busy=true; await wait(400); await zumiTaste(); busy=false; }
    else if(!sneezed&&cake.layers.length>=1&&oi===2&&Math.random()<.6){ sneezed=true; busy=true; await wait(350); await sneeze(); busy=false; }
    if(oi>=orders.length){ await ordersDone(); return; }
    busy=true; await wait(450); if(Math.random()<.35) await say(pick(['ef_great','z_k_yum','ef_amazing'])); await orderSay(orders[oi]); busy=false; renderOrder(); return; }
  if(phase==='free'){ if(apply(k)){ if(Math.random()<.25&&!ZB.voiceBusy()) say(pick(['z_k_yum','z_giggle','ef_great'])); } } }
async function zumiTaste(){ const z=$('#zu'); zu.set('z_dance'); z.classList.add('taste'); await say('z_k_taste'); ef.playOnce('e_oops','e_dance',24); await say('e_k_stop');
  cake.bite=true; sfx('bump',.6,1.6); puff(W/2+60,drawInfo().topY+10,14,['#ffe27a','#fff','#ff9ccf']); zu.playOnce('z_celebrate','z_idle',28); await say(pick(['z_k_yum','z_k_yuck'])); z.classList.remove('taste'); }
async function sneeze(){ zu.playOnce('z_oops','z_idle',26); await say('z_k_sneeze'); cake.flour=1; puff(W*.25,H*.5,60,['#fff','#f5f5f5','#ffeefa'],60); }
async function ordersDone(){ busy=true; phase='free'; renderOrder(); ZB.rain(60); ef.playOnce('e_celebrate','e_dance',28); zu.playOnce('z_celebrate','z_idle',28); await say(pick(['ef_amazing','ef_champs']));
  toast('🎨 עכשיו קישוט חופשי!',1800); $('#photoBtn').classList.remove('hidden'); busy=false; }
/* ---------- photo ---------- */
const NAMES=['עוגת הקסם','עוגת זומי בומי','העוגה של אפרתושקה','עוגת הקשת','עוגת יום ההולדת','עוגת ההפתעות'];
let imgs={};
async function photo(){ if(busy) return; busy=true; ZB.unlock(); $('#photoBtn').classList.add('hidden'); zu.set('z_celebrate'); ef.set('e_celebrate');
  await say('e_k_photo'); say('z_k_photo'); await wait(600); sfx('powerup'); const f=$('#flash'); f.style.transition='none'; f.style.opacity=1; void f.offsetWidth; f.style.transition='opacity .6s'; f.style.opacity=0;
  cakeName=cakeName||pick(NAMES); renderPhoto(); renderChips(); $('#nameIn').value=cakeName;
  const stars=3+orders.length; ZB.award(stars); $('#kStars').textContent='+'+stars+' ⭐'; const g=save.game('kitchen'); g.cakes=(g.cakes|0)+1; save.saveOwn();
  document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id==='scrPhoto')); confetti(null,null,80); busy=false; }
let photoCv=null;
function renderPhoto(){ const PW=1080,PH=1350; const k=photoCv||(photoCv=document.createElement('canvas')); k.width=PW; k.height=PH; const x=k.getContext('2d');
  const g=x.createRadialGradient(PW/2,PH*.45,50,PW/2,PH*.5,900); g.addColorStop(0,'#fff6fd'); g.addColorStop(.6,'#ffc9e8'); g.addColorStop(1,'#d58cf0'); x.fillStyle=g; x.fillRect(0,0,PW,PH);
  for(let i=0;i<90;i++){ x.fillStyle=['#ff4fa8','#ffd23f','#3fd4ff','#7b2ff2','#5be37a','#fff'][i%6]; x.save(); x.translate((i*389)%PW,(i*631)%PH); x.rotate(i); x.fillRect(-10,-4,20,8); x.restore(); }
  const off=document.createElement('canvas'); off.width=800; off.height=840; drawCake(off.getContext('2d'),800,840,1.3,cake); x.drawImage(off,140,300);
  const sz=(n,frame,cx,by,h)=>{ ZB.drawSprite(x,n,frame,cx,by,h,false); };
  if(ZB.SP.z_celebrate) sz('z_celebrate',20,190,PH-40,520); if(ZB.SP.e_celebrate) sz('e_celebrate',14,PW-180,PH-40,600);
  x.fillStyle='#fff'; ZB.rr(x,60,50,PW-120,230,60); x.fill(); x.strokeStyle='#ff4fa8'; x.lineWidth=10; x.stroke();
  x.direction='rtl'; x.textAlign='center'; x.fillStyle='#ff2d95'; x.font='900 96px Rubik,sans-serif'; x.fillText(cakeName||'העוגה שלי',PW/2,180);
  x.fillStyle='#7a1fa2'; x.font='800 40px Rubik,sans-serif'; x.fillText('🎂 מטבח המסיבה של אפרתושקה וזומי בומי',PW/2,250);
  x.fillStyle='#7a1fa2'; x.font='800 34px Rubik,sans-serif'; x.fillText(new Date().toLocaleDateString('he-IL'),PW/2,PH-24);
  $('#photoImg').src=k.toDataURL('image/jpeg',.88); }
function renderChips(){ const ch=$('#chips'); ch.innerHTML=''; NAMES.forEach(n=>{ const b=document.createElement('button'); b.className='chip'+(n===cakeName?' on':''); b.textContent=n; b.onclick=()=>{ cakeName=n; $('#nameIn').value=n; sfx('coin',.5); renderChips(); renderPhoto(); }; ch.appendChild(b); }); }
$('#nameIn').addEventListener('input',e=>{ cakeName=e.target.value.trim(); clearTimeout(renderPhoto.t); renderPhoto.t=setTimeout(()=>{ renderPhoto(); renderChips(); },250); });
$('#share').onclick=async()=>{ renderPhoto(); const r=await ZB.shareCanvas(photoCv,'cake-'+Date.now()+'.png','העוגה שאפיתי עם אפרתושקה וזומי בומי: '+(cakeName||'')+' 🎂'); if(r==='download') toast('💾 התמונה נשמרה!'); };
$('#photoBtn').onclick=photo;
/* ---------- flow ---------- */
async function begin(){ ZB.unlock(); document.querySelectorAll('.screen').forEach(s=>s.classList.remove('show')); resize();
  age=save.age||5; cake=newCake(); orders=makeOrders(); oi=0; tasted=false; sneezed=false; cakeName=''; phase='order'; busy=true; $('#order').classList.remove('hidden'); $('#photoBtn').classList.add('hidden');
  zu.set('z_idle'); ef.set('e_dance'); renderOrder(); ZB.music('candy');
  await say('e_k_intro'); await orderSay(orders[0]); busy=false; renderOrder(); }
$('#go').onclick=()=>ZB.agePicker(begin);
$('#again').onclick=()=>begin();
ZB.topbar({back:'../hub/',onAge:a=>{ age=a; }});
cake=newCake(); buildTray(); resize(); requestAnimationFrame(loop);
ZB.sprites(['z_idle','z_dance','z_celebrate','z_oops','e_dance','e_celebrate','e_oops']);
ZB.preload(['s_bump','s_correct','s_wrong','s_powerup','s_confetti','s_coin','e_k_intro','e_k_pink','e_k_yellow','e_k_choco','e_k_blue','e_k_cream','e_k_candles','e_k_sprinkles','z_k_taste','e_k_stop','z_k_yum','z_k_yuck','z_k_sneeze','e_k_photo','z_k_photo','z_giggle']);
window.KITCHEN={get orders(){return orders;},get oi(){return oi;},get busy(){return busy;},get phase(){return phase;},use:k=>use(k,document.querySelector('.ing[data-k="'+k+'"]')),photo,begin};
})();
