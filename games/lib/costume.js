/* מכונת התחפושות – ציור וקטורי של כובעים/פפיונים/משקפיים על זומי (משותף) */
'use strict';
window.ZBC=(function(){
const ITEMS={
  hat:[['none','בלי'],['party','מסיבה'],['crown','כתר'],['top','צילינדר'],['chef','שף'],['cowboy','בוקרים'],['wizard','קוסם'],['propeller','פרופלור']],
  bow:[['none','רגיל'],['gold','זהב'],['rainbow','קשת'],['star','כוכב'],['heart','לב'],['flower','פרח'],['mint','מנטה'],['dots','נקודות']],
  glasses:[['none','בלי'],['round','עגולות'],['star','כוכבים'],['heart','לבבות'],['sun','שמש'],['party','מסיבה'],['mono','מונוקל'],['3d','תלת-מימד']]
};
const KEY='zumi_costume_v1';
let cur={hat:'none',bow:'none',glasses:'none'};
try{ Object.assign(cur,JSON.parse(localStorage.getItem(KEY))||{}); }catch(e){}
function set(k,v){ cur[k]=v; try{ localStorage.setItem(KEY,JSON.stringify(cur)); }catch(e){} }
let ANC=null;
function loadAnchors(base){ return fetch(base+'sprites/zumi_anc.json').then(r=>r.json()).then(j=>ANC=j).catch(()=>ANC={}); }
function star(c,x,y,r,col){ c.beginPath(); for(let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5, rr=i%2?r*.45:r; c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr); } c.closePath(); c.fillStyle=col; c.fill(); }
function heart(c,x,y,r,col){ c.beginPath(); c.moveTo(x,y+r*.9); c.bezierCurveTo(x-r*1.4,y-r*.1,x-r*.6,y-r*1.1,x,y-r*.35); c.bezierCurveTo(x+r*.6,y-r*1.1,x+r*1.4,y-r*.1,x,y+r*.9); c.fillStyle=col; c.fill(); }
function ol(c,w){ c.lineWidth=Math.max(1.5,w*.04); c.strokeStyle='#3a1650'; c.lineJoin='round'; }
/* hat: x=center, y=top of head, w=head width */
function drawHat(c,t,x,y,w,time){ if(t==='none') return; c.save(); ol(c,w);
  if(t==='party'){ c.beginPath(); c.moveTo(x-w*.32,y+w*.04); c.lineTo(x+w*.06,y-w*.78); c.lineTo(x+w*.34,y+w*.04); c.closePath(); const g=c.createLinearGradient(x-w*.3,0,x+w*.3,0); g.addColorStop(0,'#ff4fa8'); g.addColorStop(.5,'#ffd23f'); g.addColorStop(1,'#3fd4ff'); c.fillStyle=g; c.fill(); c.stroke(); for(let i=1;i<4;i++){ c.beginPath(); c.arc(x-w*.1+i*w*.06,y-w*.18*i+w*.02,w*.035,0,7); c.fillStyle='#fff'; c.fill(); } star(c,x+w*.06,y-w*.8,w*.1,'#ffd23f'); }
  else if(t==='crown'){ c.beginPath(); c.moveTo(x-w*.38,y+w*.06); c.lineTo(x-w*.42,y-w*.32); c.lineTo(x-w*.2,y-w*.12); c.lineTo(x,y-w*.42); c.lineTo(x+w*.2,y-w*.12); c.lineTo(x+w*.42,y-w*.32); c.lineTo(x+w*.38,y+w*.06); c.closePath(); c.fillStyle='#ffcf2a'; c.fill(); c.stroke(); [-.42,0,.42].forEach((d,i)=>{ c.beginPath(); c.arc(x+d*w,y-(i==1?.42:.32)*w,w*.05,0,7); c.fillStyle='#ff4fa8'; c.fill(); }); c.beginPath(); c.arc(x,y-w*.08,w*.07,0,7); c.fillStyle='#3fd4ff'; c.fill(); }
  else if(t==='top'){ c.fillStyle='#2b1a3a'; c.beginPath(); c.ellipse(x,y,w*.46,w*.1,0,0,7); c.fill(); c.stroke(); c.fillRect(x-w*.27,y-w*.62,w*.54,w*.6); c.strokeRect(x-w*.27,y-w*.62,w*.54,w*.6); c.fillStyle='#ff4fa8'; c.fillRect(x-w*.27,y-w*.2,w*.54,w*.1); }
  else if(t==='chef'){ c.fillStyle='#fff'; c.fillRect(x-w*.3,y-w*.25,w*.6,w*.28); c.strokeRect(x-w*.3,y-w*.25,w*.6,w*.28); [[-.2,-.42,.2],[0,-.55,.24],[.2,-.42,.2]].forEach(p=>{ c.beginPath(); c.arc(x+p[0]*w,y+p[1]*w,p[2]*w,0,7); c.fill(); c.stroke(); }); c.fillRect(x-w*.28,y-w*.3,w*.56,w*.12); }
  else if(t==='cowboy'){ c.fillStyle='#b5651d'; c.beginPath(); c.ellipse(x,y,w*.62,w*.13,0,0,7); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x-w*.3,y-w*.02); c.quadraticCurveTo(x-w*.32,y-w*.5,x,y-w*.38); c.quadraticCurveTo(x+w*.32,y-w*.5,x+w*.3,y-w*.02); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#ffd23f'; c.fillRect(x-w*.29,y-w*.12,w*.58,w*.07); }
  else if(t==='wizard'){ c.beginPath(); c.moveTo(x-w*.42,y+w*.05); c.quadraticCurveTo(x-w*.05,y-w*.5,x+w*.18,y-w*.95); c.quadraticCurveTo(x+w*.12,y-w*.4,x+w*.42,y+w*.05); c.closePath(); c.fillStyle='#5b2bd6'; c.fill(); c.stroke(); star(c,x-w*.05,y-w*.25,w*.1,'#ffd23f'); star(c,x+w*.1,y-w*.55,w*.07,'#fff'); }
  else if(t==='propeller'){ c.beginPath(); c.arc(x,y+w*.02,w*.32,Math.PI,0); c.closePath(); c.fillStyle='#ff4fa8'; c.fill(); c.stroke(); c.fillStyle='#ffd23f'; c.beginPath(); c.arc(x,y+w*.02,w*.32,Math.PI,Math.PI*1.33); c.lineTo(x,y+w*.02); c.fill(); c.fillStyle='#3fd4ff'; c.beginPath(); c.arc(x,y+w*.02,w*.32,Math.PI*1.66,0); c.lineTo(x,y+w*.02); c.fill(); c.fillStyle='#333'; c.fillRect(x-w*.02,y-w*.42,w*.04,w*.14); const s=Math.cos((time||0)*20); c.fillStyle='#ff8a3d'; c.beginPath(); c.ellipse(x,y-w*.42,w*.36*Math.abs(s)+2,w*.05,0,0,7); c.fill(); c.stroke(); }
  c.restore(); }
/* bow: x,y = bow center on top of the lid, w = head width */
function drawBow(c,t,x,y,w){ if(t==='none') return; c.save(); ol(c,w);
  const cols={gold:['#ffcf2a','#e0a800'],rainbow:['#ff4fa8','#3fd4ff'],mint:['#5be3b0','#22a67a'],dots:['#7b2ff2','#fff'],heart:['#ff3b6b','#c4123f'],star:['#ffd23f','#ff8a3d'],flower:['#ff8ad8','#ffd23f']}[t];
  if(t==='star'){ star(c,x,y,w*.28,cols[0]); c.stroke(); c.restore(); return; }
  if(t==='heart'){ heart(c,x,y,w*.24,cols[0]); c.stroke(); c.restore(); return; }
  if(t==='flower'){ for(let i=0;i<6;i++){ const a=i*Math.PI/3; c.beginPath(); c.arc(x+Math.cos(a)*w*.14,y+Math.sin(a)*w*.14,w*.1,0,7); c.fillStyle=cols[0]; c.fill(); c.stroke(); } c.beginPath(); c.arc(x,y,w*.09,0,7); c.fillStyle=cols[1]; c.fill(); c.stroke(); c.restore(); return; }
  [-1,1].forEach(s=>{ c.beginPath(); c.moveTo(x,y); c.quadraticCurveTo(x+s*w*.3,y-w*.28,x+s*w*.34,y); c.quadraticCurveTo(x+s*w*.3,y+w*.2,x,y); c.fillStyle=t==='rainbow'?(s<0?'#ff4fa8':'#3fd4ff'):cols[0]; c.fill(); c.stroke(); });
  if(t==='rainbow'){ c.fillStyle='#ffd23f'; } else c.fillStyle=cols[1];
  if(t==='dots'){ c.fillStyle='#fff'; [[-.2,-.04],[-.12,.06],[.18,-.05],[.24,.05]].forEach(p=>{ c.beginPath(); c.arc(x+p[0]*w,y+p[1]*w,w*.03,0,7); c.fill(); }); c.fillStyle='#ffd23f'; }
  c.beginPath(); c.arc(x,y,w*.08,0,7); c.fill(); c.stroke(); c.restore(); }
/* glasses: x,y = between the eyes, w = head width */
function drawGlasses(c,t,x,y,w){ if(t==='none') return; c.save(); ol(c,w); const d=w*.2, r=w*.15;
  const bridge=()=>{ c.beginPath(); c.moveTo(x-d+r*.9,y); c.quadraticCurveTo(x,y-r*.4,x+d-r*.9,y); c.stroke(); };
  if(t==='round'){ c.lineWidth=w*.05; [-1,1].forEach(s=>{ c.beginPath(); c.arc(x+s*d,y,r,0,7); c.fillStyle='rgba(200,240,255,.25)'; c.fill(); c.stroke(); }); bridge(); }
  else if(t==='star'){ [-1,1].forEach(s=>{ star(c,x+s*d,y,r*1.35,'#ffd23f'); c.stroke(); star(c,x+s*d,y,r*.75,'rgba(255,255,255,.55)'); }); bridge(); }
  else if(t==='heart'){ [-1,1].forEach(s=>{ heart(c,x+s*d,y+r*.1,r*1.15,'#ff3b6b'); c.stroke(); }); bridge(); }
  else if(t==='sun'){ c.fillStyle='#1b1030'; [-1,1].forEach(s=>{ c.beginPath(); c.ellipse(x+s*d,y,r*1.15,r*.85,0,0,7); c.fill(); c.stroke(); c.fillStyle='rgba(255,255,255,.4)'; c.fillRect(x+s*d-r*.6,y-r*.45,r*.4,r*.2); c.fillStyle='#1b1030'; }); bridge(); }
  else if(t==='party'){ c.fillStyle='#ff4fa8'; c.beginPath(); c.moveTo(x-w*.42,y-r); c.quadraticCurveTo(x,y-r*1.6,x+w*.42,y-r); c.lineTo(x+w*.38,y+r*.9); c.quadraticCurveTo(x,y+r*.3,x-w*.38,y+r*.9); c.closePath(); c.fill(); c.stroke(); c.fillStyle='#fff'; [-1,1].forEach(s=>{ c.beginPath(); c.ellipse(x+s*d,y,r*.75,r*.55,0,0,7); c.fill(); c.stroke(); }); star(c,x-w*.36,y-r*1.1,w*.08,'#ffd23f'); star(c,x+w*.36,y-r*1.1,w*.08,'#3fd4ff'); }
  else if(t==='mono'){ c.lineWidth=w*.045; c.strokeStyle='#d4a017'; c.beginPath(); c.arc(x+d,y,r*1.1,0,7); c.fillStyle='rgba(200,240,255,.3)'; c.fill(); c.stroke(); c.beginPath(); c.moveTo(x+d,y+r*1.1); c.quadraticCurveTo(x+d*1.6,y+w*.4,x+d*.6,y+w*.6); c.lineWidth=1.5; c.stroke(); }
  else if(t==='3d'){ c.fillStyle='#fff'; c.fillRect(x-w*.4,y-r,w*.8,r*2); c.strokeRect(x-w*.4,y-r,w*.8,r*2); c.fillStyle='rgba(255,40,60,.7)'; c.fillRect(x-w*.36,y-r*.7,w*.3,r*1.4); c.fillStyle='rgba(40,200,255,.7)'; c.fillRect(x+w*.06,y-r*.7,w*.3,r*1.4); }
  c.restore(); }
/* draw full costume over a Zumi sprite drawn with ZB.drawSprite(c,name,frame,cx,by,h,flip) */
function drawOn(c,name,frame,cx,by,h,flip,time,cos){ cos=cos||cur; if(cos.hat==='none'&&cos.bow==='none'&&cos.glasses==='none') return;
  const s=ZB.SP[name]; if(!s||!ANC||!ANC[name]) return; const n=s.n, f=((frame|0)%n+n)%n, a=ANC[name][f]; if(!a) return;
  const W=h*s.fw/s.fh; const fx=v=>cx+(flip?-1:1)*(v-.5)*W;
  const hw=a[5]*W, hx=fx(a[3]+a[5]/2), hy=by-h+a[4]*h, hh=a[6]*h;
  c.save();
  drawGlasses(c,cos.glasses,hx,hy+hh*.38,hw);
  if(cos.hat!=='none') drawHat(c,cos.hat,hx,hy+hh*.02,hw*.95,time); else drawBow(c,cos.bow,hx,hy-hh*.04,hw);
  if(cos.hat!=='none'&&cos.bow!=='none') drawBow(c,cos.bow,hx+hw*.42,hy+hh*.12,hw*.55);
  c.restore(); }
function icon(cv,k,v){ const c=cv.getContext('2d'); c.clearRect(0,0,cv.width,cv.height); const w=cv.width*.6, x=cv.width/2;
  if(v==='none'){ c.font=(cv.height*.45)+'px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(k==='bow'?'🎀':'🚫',x,cv.height/2); return; }
  if(k==='hat') drawHat(c,v,x,cv.height*.85,w*.9,0); else if(k==='bow') drawBow(c,v,x,cv.height*.5,w*1.3); else drawGlasses(c,v,x,cv.height*.5,w*1.2); }
return {ITEMS,get cur(){return cur;},set,loadAnchors,drawOn,drawHat,drawBow,drawGlasses,icon,
  random(){ const r=a=>a[Math.floor(Math.random()*a.length)][0]; set('hat',r(ITEMS.hat)); set('bow',r(ITEMS.bow)); set('glasses',r(ITEMS.glasses)); return cur; }};
})();
