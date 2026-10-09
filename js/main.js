/* אפרתושקה: מסיבת הקסם – main game */
(function(){
'use strict';
const D=window.EFD, A=window.EFA;
const {rnd,ri,pick}=D;
const $=s=>document.querySelector(s);
const cvs=$('#game'), ctx=cvs.getContext('2d');
let W=390,H=844,DPR=1;
const TAU=Math.PI*2;
const clamp=(x,a,b)=>x<a?a:x>b?b:x;
const lerp=(a,b,t)=>a+(b-a)*t;
const ss=(e0,e1,x)=>{const t=clamp((x-e0)/(e1-e0),0,1);return t*t*(3-2*t);};
const ease=t=>1-Math.pow(1-t,3);

/* ---------- save ---------- */
const SAVE_KEY='efratushka_v1';
const DEF={stars:0,best:0,level:1,age:5,sound:true,owned:{outfit:['pink'],hair:['brown'],trail:['sparkle']},sel:{outfit:'pink',hair:'brown',trail:'sparkle'},daily:{last:null,streak:0},games:0};
function loadSave(){ let s=null; try{ s=JSON.parse(localStorage.getItem(SAVE_KEY)); }catch(e){} const d=JSON.parse(JSON.stringify(DEF)); if(s&&typeof s==='object'){ Object.assign(d,s); d.owned=Object.assign(JSON.parse(JSON.stringify(DEF.owned)),s.owned||{}); d.sel=Object.assign({},DEF.sel,s.sel||{}); d.daily=Object.assign({},DEF.daily,s.daily||{}); } return d; }
const S=loadSave();
function save(){ try{ localStorage.setItem(SAVE_KEY,JSON.stringify(S)); }catch(e){} }

/* ---------- birthday params ---------- */
function cleanName(n){ return String(n||'').replace(/[<>&"'`\\/{}\[\]]/g,'').replace(/\s+/g,' ').trim().slice(0,16); }
const params=new URLSearchParams(location.search);
let BDAY=null;
(function(){ const n=cleanName(params.get('name')); if(n){ let a=parseInt(params.get('age'),10); if(!(a>=1&&a<=120)) a=0; BDAY={name:n,age:a}; if(a>=3&&a<=10) S.age=a; else if(a>10&&a<=15) S.age=10; else if(a>0&&a<3) S.age=3; } })();
const DEBUG=params.has('debug');
let V=null; // v2 extension

/* ---------- resize ---------- */
function resize(){ const r=cvs.getBoundingClientRect(); DPR=Math.min(window.devicePixelRatio||1,2); W=Math.max(200,r.width); H=Math.max(300,r.height); cvs.width=Math.round(W*DPR); cvs.height=Math.round(H*DPR); ctx.setTransform(DPR,0,0,DPR,0,0); ctx.imageSmoothingQuality='high'; }
window.addEventListener('resize',resize); resize();

/* ---------- assets ---------- */
const IMG={}; let SPR={};
function loadImg(src){ return new Promise((res)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=()=>{console.warn('img fail',src);res(null);}; i.src=src; }); }
const sheetCache={};
function lookKey(){ return S.sel.outfit+'|'+S.sel.hair; }
function recolorCanvas(img){
  const o=D.OUTFITS.find(x=>x.id===S.sel.outfit)||D.OUTFITS[0], hr=D.HAIRS.find(x=>x.id===S.sel.hair)||D.HAIRS[0];
  const c=document.createElement('canvas'); c.width=img.width; c.height=img.height; const g=c.getContext('2d'); g.drawImage(img,0,0);
  const dh=o.dh, hh=hr.hue; if(!dh&&!hh) return c;
  let d; try{ d=g.getImageData(0,0,c.width,c.height); }catch(e){ return c; }
  const p=d.data;
  for(let i=0;i<p.length;i+=4){
    if(p[i+3]<10) continue;
    const r=p[i]/255,gg=p[i+1]/255,b=p[i+2]/255; const mx=r>gg?(r>b?r:b):(gg>b?gg:b), mn=r<gg?(r<b?r:b):(gg<b?gg:b), dd=mx-mn; if(dd<.04) continue;
    let h; if(mx===r) h=((gg-b)/dd)%6; else if(mx===gg) h=(b-r)/dd+2; else h=(r-gg)/dd+4; h*=60; if(h<0) h+=360;
    const s=dd/mx, v=mx; let w=0,nh=h,ns=s,nv=v;
    if(dh){ w=ss(285,300,h)*ss(352,340,h)*ss(.25,.4,s); if(w>0) nh=(h+dh+720)%360; }
    if(w<=0&&hh){ w=ss(6,14,h)*ss(48,38,h)*ss(.58,.72,s)*ss(.92,.78,v); if(w>0){ nh=hh.h; ns=Math.min(1,s*hh.sm); nv=Math.min(1,v*hh.vm);} }
    if(w<=0) continue;
    const C=nv*ns, X=C*(1-Math.abs((nh/60)%2-1)), m=nv-C; const k=Math.floor(nh/60)%6;
    let R,G,B; if(k===0){R=C;G=X;B=0;}else if(k===1){R=X;G=C;B=0;}else if(k===2){R=0;G=C;B=X;}else if(k===3){R=0;G=X;B=C;}else if(k===4){R=X;G=0;B=C;}else{R=C;G=0;B=X;}
    p[i]=(r*(1-w)+(R+m)*w)*255; p[i+1]=(gg*(1-w)+(G+m)*w)*255; p[i+2]=(b*(1-w)+(B+m)*w)*255;
  }
  g.putImageData(d,0,0); return c;
}
function sheet(name){ const k=lookKey()+'|'+name; if(!sheetCache[k]){ const src=name==='front'?IMG.front:IMG['spr_'+name]; if(!src) return null; sheetCache[k]=recolorCanvas(src); } return sheetCache[k]; }
function drawFrame(name,f,x,y,h,flip,alpha){
  const m=SPR[name], sh=sheet(name); if(!m||!sh) return;
  const fi=((Math.floor(f)%m.n)+m.n)%m.n, sx=(fi%m.cols)*m.fw, sy=Math.floor(fi/m.cols)*m.fh, w=h*m.fw/m.fh;
  if(flip||alpha!=null){ ctx.save(); if(alpha!=null) ctx.globalAlpha=alpha; if(flip){ ctx.translate(x,0); ctx.scale(-1,1); x=0; } ctx.drawImage(sh,sx,sy,m.fw,m.fh,x-w/2,y-h,w,h); ctx.restore(); }
  else ctx.drawImage(sh,sx,sy,m.fw,m.fh,x-w/2,y-h,w,h);
}
function warmSheets(){ // recolor lazily in idle time
  const names=['run','duck','jumpb','celebrate','dance','oops','front']; let i=0;
  const step=()=>{ if(i>=names.length) return; sheet(names[i++]); if(window.requestIdleCallback) requestIdleCallback(step,{timeout:300}); else setTimeout(step,30); }; step();
}

async function loadAll(){
  const bar=$('#loadBar'); let done=0,total=0;
  const prog=()=>{ done++; bar.style.width=Math.round(100*done/Math.max(1,total))+'%'; };
  const sj=await fetch('assets/sprites/sprites.json').then(r=>r.json()).catch(()=>({}));
  SPR=sj;
  const imgs=[['front','assets/img/front.webp'],['thief','assets/img/thief.webp'],['menubg','assets/img/menu_bg.webp']];
  Object.keys(SPR).forEach(k=>imgs.push(['spr_'+k,SPR[k].file]));
  A.makeEls();
  const audioJobs=A.preload(prog);
  total=imgs.length+audioJobs.length;
  const imgJobs=imgs.map(([k,u])=>loadImg(u).then(i=>{IMG[k]=i;prog();}));
  await Promise.all([...imgJobs,...audioJobs]);
  try{ await document.fonts.load('900 30px Rubik'); await document.fonts.load('700 20px Rubik'); }catch(e){}
  buildProps();
}

/* ---------- prerendered props ---------- */
const P={};
function mk(w,h,fn){ const c=document.createElement('canvas'); c.width=w; c.height=h; const g=c.getContext('2d'); fn(g,w,h); return c; }
function starPath(g,cx,cy,R,r,n){ g.beginPath(); for(let i=0;i<n*2;i++){ const a=-Math.PI/2+i*Math.PI/n, rr=i%2?r:R; g.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);} g.closePath(); }
function rrect(g,x,y,w,h,r){ g.beginPath(); g.moveTo(x+r,y); g.arcTo(x+w,y,x+w,y+h,r); g.arcTo(x+w,y+h,x,y+h,r); g.arcTo(x,y+h,x,y,r); g.arcTo(x,y,x+w,y,r); g.closePath(); }
function heartPath(g,cx,cy,s){ g.beginPath(); g.moveTo(cx,cy+s*.35); g.bezierCurveTo(cx-s*1.1,cy-s*.35,cx-s*.45,cy-s*1.05,cx,cy-s*.45); g.bezierCurveTo(cx+s*.45,cy-s*1.05,cx+s*1.1,cy-s*.35,cx,cy+s*.35); g.closePath(); }
function balloon(g,x,y,r,col,strLen){
  g.strokeStyle='rgba(90,60,90,.7)'; g.lineWidth=Math.max(1,r*.05); g.beginPath(); g.moveTo(x,y+r*1.15); g.quadraticCurveTo(x+r*.3,y+r*1.15+strLen*.5,x,y+r*1.15+strLen); g.stroke();
  const gr=g.createRadialGradient(x-r*.35,y-r*.4,r*.1,x,y,r*1.2); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.18,col); gr.addColorStop(1,shade(col,-.35));
  g.fillStyle=gr; g.beginPath(); g.ellipse(x,y,r*.88,r*1.05,0,0,TAU); g.fill();
  g.fillStyle=shade(col,-.3); g.beginPath(); g.moveTo(x-r*.13,y+r*1.18); g.lineTo(x+r*.13,y+r*1.18); g.lineTo(x,y+r*1.02); g.fill();
  g.fillStyle='rgba(255,255,255,.55)'; g.beginPath(); g.ellipse(x-r*.35,y-r*.45,r*.14,r*.26,-.5,0,TAU); g.fill();
}
function shade(hex,amt){ const n=parseInt(hex.slice(1),16); let r=n>>16,g=(n>>8)&255,b=n&255; if(amt<0){r*=1+amt;g*=1+amt;b*=1+amt;} else {r+=(255-r)*amt;g+=(255-g)*amt;b+=(255-b)*amt;} return 'rgb('+(r|0)+','+(g|0)+','+(b|0)+')'; }
function fitText(g,t,maxW,size,weight){ let s=size; do{ g.font=`${weight||900} ${s}px Rubik, sans-serif`; s-=2; } while(g.measureText(t).width>maxW&&s>10); return s+2; }
function emojiCanvas(e,size){ return mk(size,size,(g,w,h)=>{ g.font=`${Math.round(size*.8)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; g.textAlign='center'; g.textBaseline='middle'; g.fillText(e,w/2,h*.55); }); }

function buildProps(){
  P.star=mk(96,96,(g)=>{ starPath(g,48,50,44,20,5); g.fillStyle='#ffb300'; g.fill(); starPath(g,48,46,40,18,5); const gr=g.createLinearGradient(0,6,0,90); gr.addColorStop(0,'#fff59a'); gr.addColorStop(1,'#ffc21a'); g.fillStyle=gr; g.fill(); g.lineWidth=4; g.strokeStyle='#ff9800'; g.stroke(); g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(38,30,7,12,-.6,0,TAU); g.fill(); });
  P.candy=mk(140,80,(g)=>{ g.fillStyle='#ff4fa8'; g.beginPath(); g.moveTo(30,40); g.lineTo(4,14); g.lineTo(10,40); g.lineTo(4,66); g.closePath(); g.fill(); g.beginPath(); g.moveTo(110,40); g.lineTo(136,14); g.lineTo(130,40); g.lineTo(136,66); g.closePath(); g.fill();
    g.save(); g.beginPath(); g.ellipse(70,40,42,30,0,0,TAU); g.clip(); g.fillStyle='#fff'; g.fillRect(0,0,140,80); g.strokeStyle='#ff4fa8'; g.lineWidth=11; for(let x=-40;x<160;x+=26){ g.beginPath(); g.moveTo(x,0); g.lineTo(x+40,80); g.stroke(); } g.restore();
    g.lineWidth=3; g.strokeStyle='#c2187a'; g.beginPath(); g.ellipse(70,40,42,30,0,0,TAU); g.stroke(); g.fillStyle='rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(56,26,12,6,-.3,0,TAU); g.fill(); });
  const bubble=(icon,col)=>mk(128,128,(g)=>{ const gr=g.createRadialGradient(46,40,6,64,64,62); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.5,col); gr.addColorStop(1,shade(col,-.3)); g.fillStyle=gr; g.beginPath(); g.arc(64,64,58,0,TAU); g.fill(); g.lineWidth=5; g.strokeStyle='#fff'; g.stroke(); g.font='62px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(icon,64,70); });
  const bubbleD=(col,draw)=>mk(128,128,(g)=>{ const gr=g.createRadialGradient(46,40,6,64,64,62); gr.addColorStop(0,'#ffffff'); gr.addColorStop(.5,col); gr.addColorStop(1,shade(col,-.3)); g.fillStyle=gr; g.beginPath(); g.arc(64,64,58,0,TAU); g.fill(); g.lineWidth=5; g.strokeStyle='#fff'; g.stroke(); draw(g); });
  P.pw_magnet=bubbleD('#8fe3ff',(g)=>{ g.lineCap='butt'; g.lineWidth=20; g.strokeStyle='#ff3b4e'; g.beginPath(); g.arc(64,58,24,Math.PI,0,false); g.lineTo(88,84); g.moveTo(40,58); g.lineTo(40,84); g.stroke(); g.fillStyle='#e8eef5'; g.fillRect(30,80,20,14); g.fillRect(78,80,20,14); g.strokeStyle='rgba(255,255,255,.6)'; g.lineWidth=4; g.beginPath(); g.arc(64,58,30,Math.PI*1.1,Math.PI*1.4); g.stroke(); });
  P.pw_fly=bubbleD('#ffd0f0',(g)=>{ balloon(g,52,52,22,'#ff3b4e',26); balloon(g,78,58,18,'#2f7bff',22); });
  P.pw_double=mk(128,128,(g)=>{ g.drawImage(bubbleD('#fff1a8',(g2)=>{ g2.drawImage(P.star,30,28,68,68); }),0,0); g.font='900 34px Rubik'; g.textAlign='center'; g.lineWidth=6; g.strokeStyle='#b3105f'; g.strokeText('×2',88,104); g.fillStyle='#fff'; g.fillText('×2',88,104); });
  // obstacles per world
  P.obs={};
  D.WORLDS.forEach(w=>{
    const [c1,c2]=w.edge;
    const low=mk(320,140,(g)=>{ // striped hurdle
      g.fillStyle=shade(c1,-.3); g.fillRect(22,40,18,100); g.fillRect(280,40,18,100);
      g.save(); rrect(g,6,20,308,52,24); g.clip(); g.fillStyle=c2; g.fillRect(0,0,320,140); g.fillStyle=c1; for(let x=-60;x<360;x+=44){ g.beginPath(); g.moveTo(x,20); g.lineTo(x+22,20); g.lineTo(x+52,72); g.lineTo(x+30,72); g.fill(); } g.restore();
      rrect(g,6,20,308,52,24); g.lineWidth=5; g.strokeStyle='#fff'; g.stroke(); g.fillStyle='rgba(255,255,255,.5)'; rrect(g,20,26,280,10,5); g.fill();
      g.fillStyle=w.id==='disco'?'#ffcf3f':'#fff'; for(let i=0;i<3;i++){ starPath(g,90+i*70,46,10,4.5,5); g.fill(); }
    });
    const high=mk(340,640,(g)=>{ // poles + banner with pennants
      g.fillStyle=shade(c1,-.25); g.fillRect(8,0,20,640); g.fillRect(312,0,20,640);
      g.fillStyle='#fff'; g.beginPath(); g.arc(18,8,14,0,TAU); g.arc(322,8,14,0,TAU); g.fill();
      rrect(g,14,28,312,96,24); g.fillStyle=c1; g.fill(); g.lineWidth=6; g.strokeStyle='#fff'; g.stroke();
      g.font='900 50px Rubik'; g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#fff'; g.fillText('⬇ ⬇ ⬇',170,78);
      const cols=['#ff3b4e','#ffd23f','#2ecc55','#2f7bff','#9b59ff','#ff6fc8']; for(let i=0;i<9;i++){ g.fillStyle=cols[i%6]; g.beginPath(); g.moveTo(28+i*32,124); g.lineTo(60+i*32,124); g.lineTo(44+i*32,170); g.fill(); }
    });
    const block=mk(260,280,(g)=>{ // gift box
      const bc=w.id==='sky'?'#ffcf3f':w.id==='disco'?'#ff4fa8':'#7b2ff2';
      g.fillStyle=shade(bc,-.25); rrect(g,14,92,232,184,16); g.fill(); g.fillStyle=bc; rrect(g,14,92,232,170,16); g.fill();
      g.fillStyle=shade(bc,.15); rrect(g,4,64,252,52,14); g.fill();
      g.fillStyle='#fff'; g.fillRect(112,64,36,212); g.fillStyle='rgba(255,255,255,.85)';
      g.beginPath(); g.ellipse(96,44,40,24,-.5,0,TAU); g.ellipse(164,44,40,24,.5,0,TAU); g.fill(); g.fillStyle='#ffe0f0'; g.beginPath(); g.arc(130,58,16,0,TAU); g.fill();
      g.fillStyle='rgba(255,255,255,.35)'; for(let i=0;i<5;i++){ g.beginPath(); g.arc(40+i*44,170+(i%2)*40,9,0,TAU); g.fill(); }
      g.lineWidth=5; g.strokeStyle='#fff'; rrect(g,14,92,232,184,16); g.stroke();
    });
    P.obs[w.id]={low,high,block};
  });
  // decor
  P.decor={candy:[],sky:[],disco:[]};
  P.decor.candy.push(mk(200,420,(g)=>{ g.fillStyle='#fff'; g.fillRect(92,170,16,250); g.strokeStyle='#ff4fa8'; g.lineWidth=6; for(let y=170;y<420;y+=26){ g.beginPath(); g.moveTo(92,y); g.lineTo(108,y+12); g.stroke(); }
    const cols=['#ff4fa8','#fff','#ffcf3f','#fff']; for(let r=90;r>6;r-=12){ g.fillStyle=cols[(r/12|0)%4]; g.beginPath(); g.arc(100,100,r,0,TAU); g.fill(); } g.lineWidth=5; g.strokeStyle='#d4157f'; g.beginPath(); g.arc(100,100,90,0,TAU); g.stroke(); g.fillStyle='rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(70,62,18,30,-.6,0,TAU); g.fill(); }));
  P.decor.candy.push(mk(160,420,(g)=>{ g.lineCap='round'; g.lineWidth=34; g.strokeStyle='#fff'; g.beginPath(); g.moveTo(110,420); g.lineTo(110,110); g.arc(70,110,40,0,Math.PI,true); g.stroke(); g.save(); g.globalCompositeOperation='source-atop'; g.strokeStyle='#ff3b4e'; g.lineWidth=14; for(let y=0;y<460;y+=40){ g.beginPath(); g.moveTo(0,y); g.lineTo(160,y-60); g.stroke(); } g.restore(); }));
  P.decor.candy.push(mk(240,300,(g)=>{ // cupcake tree
    g.fillStyle='#ffb3dd'; g.beginPath(); g.moveTo(40,170); g.lineTo(200,170); g.lineTo(178,296); g.lineTo(62,296); g.fill(); g.strokeStyle='#ff7cc0'; g.lineWidth=6; for(let x=70;x<190;x+=24){ g.beginPath(); g.moveTo(x,175); g.lineTo(x-4,292); g.stroke(); }
    g.fillStyle='#fff3fa'; for(const [x,y,r] of [[120,90,70],[60,140,46],[180,140,46],[120,40,40]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); }
    g.fillStyle='#ff3b4e'; g.beginPath(); g.arc(120,8,8,0,TAU); g.fill(); const sp=['#2f7bff','#ffcf3f','#2ecc55','#ff4fa8']; for(let i=0;i<22;i++){ g.fillStyle=sp[i%4]; g.save(); g.translate(60+Math.random()*120,40+Math.random()*120); g.rotate(Math.random()*3); g.fillRect(-6,-2,12,4); g.restore(); } }));
  const balloonCluster=(cols,name)=>mk(260,460,(g)=>{ const pos=[[80,120,62],[180,110,62],[130,60,70]]; pos.forEach((p,i)=>balloon(g,p[0],p[1],p[2],cols[i%cols.length],440-p[1]-p[2]*1.15));
    if(name){ const s=fitText(g,name,120,46); g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=7; g.strokeStyle='rgba(120,20,80,.8)'; g.strokeText(name,130,62); g.fillStyle='#fff'; g.fillText(name,130,62); } });
  P.decor.sky.push(balloonCluster(['#ff3b4e','#ffd23f','#2f7bff']), balloonCluster(['#ff6fc8','#2ecc55','#9b59ff']));
  P.decor.sky.push(mk(300,170,(g)=>{ g.fillStyle='#fff'; for(const [x,y,r] of [[80,110,55],[150,80,70],[220,110,55],[150,125,50]]){ g.beginPath(); g.arc(x,y,r,0,TAU); g.fill(); } g.fillStyle='rgba(160,200,255,.35)'; g.fillRect(30,140,240,25); }));
  P.decor.candy.push(balloonCluster(['#ff4fa8','#ffd23f','#9b59ff']));
  P.decor.disco.push(mk(200,300,(g)=>{ rrect(g,20,20,160,270,18); g.fillStyle='#24123b'; g.fill(); g.lineWidth=6; g.strokeStyle='#ff4fa8'; g.stroke(); for(const [y,r] of [[90,52],[215,62]]){ g.fillStyle='#120a20'; g.beginPath(); g.arc(100,y,r,0,TAU); g.fill(); g.strokeStyle='#8f5bff'; g.lineWidth=6; g.stroke(); g.fillStyle='#3a2560'; g.beginPath(); g.arc(100,y,r*.35,0,TAU); g.fill(); } }));
  P.decor.disco.push(mk(140,460,(g)=>{ g.fillStyle='#9aa'; g.fillRect(64,140,12,320); const gr=g.createRadialGradient(56,56,8,70,70,64); gr.addColorStop(0,'#fff'); gr.addColorStop(1,'#8a90a8'); g.fillStyle=gr; g.beginPath(); g.arc(70,70,64,0,TAU); g.fill(); g.strokeStyle='rgba(60,60,90,.5)'; g.lineWidth=2; for(let i=-60;i<=60;i+=16){ g.beginPath(); g.moveTo(6,70+i); g.lineTo(134,70+i); g.stroke(); g.beginPath(); g.ellipse(70,70,Math.abs(i)+.1,64,0,0,TAU); g.stroke(); } const cs=['#ff4fa8','#3fd4ff','#ffcf3f','#2ecc55']; for(let i=0;i<14;i++){ g.fillStyle=cs[i%4]; g.fillRect(20+Math.random()*100,20+Math.random()*100,10,10);} }));
  P.decor.disco.push(mk(120,460,(g)=>{ g.fillStyle='#ff4fa8'; g.fillRect(52,40,16,420); const cs=['#ff3b4e','#ffd23f','#2ecc55','#2f7bff','#9b59ff']; for(let i=0;i<8;i++){ g.fillStyle=cs[i%5]; g.shadowColor=cs[i%5]; g.shadowBlur=18; g.beginPath(); g.arc(60,50+i*48,16,0,TAU); g.fill(); } }));
  P.bdayBalloon=BDAY?balloonCluster(['#ff4fa8','#ffd23f','#3fd4ff'],BDAY.name):null;
  P.thiefMask={};
}

/* option textures for gates */
function optionCanvas(o){
  return mk(220,220,(g,w,h)=>{
    rrect(g,8,8,204,204,40); g.fillStyle='#fff'; g.fill(); g.lineWidth=10; g.strokeStyle='#ffcf3f'; g.stroke();
    g.textAlign='center'; g.textBaseline='middle';
    if(o.k==='balloon'){ balloon(g,110,96,62,o.color,40); }
    else if(o.k==='shape'){ g.fillStyle=o.color; g.strokeStyle=shade(o.color,-.35); g.lineWidth=8;
      if(o.shape==='circle'){ g.beginPath(); g.arc(110,112,64,0,TAU); }
      else if(o.shape==='square'){ g.beginPath(); g.rect(50,52,120,120); }
      else if(o.shape==='triangle'){ g.beginPath(); g.moveTo(110,40); g.lineTo(182,174); g.lineTo(38,174); g.closePath(); }
      else { heartPath(g,110,128,92); }
      g.fill(); g.stroke(); }
    else if(o.k==='count'){ const n=o.n; const pts=[[],[[110,100]],[[78,100],[142,100]],[[60,110],[110,84],[160,110]],[[72,76],[148,76],[72,146],[148,146]],[[60,78],[160,78],[110,112],[60,150],[160,150]]][n]; pts.forEach(p=>balloon(g,p[0],p[1]-6,n>3?28:n>1?36:52,o.color,n>3?16:22)); }
    else if(o.k==='emoji'){ g.font='140px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.fillText(o.e,110,122); }
    else { g.direction='rtl'; const s=fitText(g,o.t,176,o.t.length<=3?120:76); g.fillStyle='#d4157f'; g.fillText(o.t,110,116+s*.04); }
  });
}

/* ---------- particles & floating text ---------- */
let parts=[], floats=[];
const CONF=['#ff3b4e','#ffd23f','#2ecc55','#2f7bff','#ff6fc8','#9b59ff','#3fd4ff'];
function confetti(x,y,n,spread){ for(let i=0;i<n;i++){ const a=rnd(0,TAU), v=rnd(150,520)*(spread||1); parts.push({t:'c',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-rnd(150,350),g:600,life:rnd(1.2,2.2),age:0,col:pick(CONF),s:rnd(5,10),rot:rnd(0,6),vr:rnd(-10,10)}); } }
function rainConfetti(n){ for(let i=0;i<n;i++) parts.push({t:'c',x:rnd(0,W),y:rnd(-H*.3,-10),vx:rnd(-40,40),vy:rnd(60,180),g:60,life:rnd(3,5),age:0,col:pick(CONF),s:rnd(6,11),rot:rnd(0,6),vr:rnd(-8,8)}); }
function sparkle(x,y,col,n){ for(let i=0;i<(n||6);i++){ const a=rnd(0,TAU),v=rnd(40,180); parts.push({t:'s',x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,g:0,life:rnd(.35,.7),age:0,col:col||'#fff59a',s:rnd(3,7)}); } }
function floatText(txt,x,y,col,size){ floats.push({txt,x,y,col:col||'#fff',size:size||34,age:0,life:1.2}); }
const trailCv={};
function trailIcon(t){ return mk(48,48,(g)=>{ if(t==='hearts'){ g.fillStyle='#ff4fa8'; heartPath(g,24,30,34); g.fill(); g.fillStyle='rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(17,20,4,6,-.5,0,TAU); g.fill(); }
  else if(t==='stars'){ g.drawImage(P.star||mk(1,1,()=>{}),4,4,40,40); }
  else if(t==='bubbles'){ const gr=g.createRadialGradient(18,16,2,24,24,20); gr.addColorStop(0,'rgba(255,255,255,.95)'); gr.addColorStop(.6,'rgba(160,230,255,.35)'); gr.addColorStop(1,'rgba(120,200,255,.8)'); g.fillStyle=gr; g.beginPath(); g.arc(24,24,19,0,TAU); g.fill(); g.strokeStyle='rgba(255,255,255,.9)'; g.lineWidth=2; g.stroke(); }
  else { g.fillStyle='#7b2ff2'; g.beginPath(); g.ellipse(16,36,8,6,-.4,0,TAU); g.ellipse(36,32,8,6,-.4,0,TAU); g.fill(); g.fillRect(21,8,4,28); g.fillRect(41,4,4,28); g.beginPath(); g.moveTo(21,8); g.lineTo(45,4); g.lineTo(45,12); g.lineTo(21,16); g.fill(); } }); }
function trailParticle(x,y){
  const t=S.sel.trail;
  if(t==='sparkle'){ parts.push({t:'s',x:x+rnd(-14,14),y:y+rnd(-10,10),vx:rnd(-20,20),vy:rnd(30,90),g:0,life:.6,age:0,col:pick(['#fff59a','#ffffff','#ffd0f0']),s:rnd(3,6)}); }
  else if(t==='rainbow'){ parts.push({t:'r',x:x,y:y,vx:0,vy:200,g:0,life:.45,age:0,s:12}); }
  else { if(!trailCv[t]) trailCv[t]=trailIcon(t); parts.push({t:'e',img:trailCv[t],x:x+rnd(-16,16),y:y+rnd(-10,10),vx:rnd(-25,25),vy:rnd(60,140),g:0,life:.8,age:0,s:rnd(18,28),rot:rnd(-.4,.4)}); }
}
function updParts(dt){
  for(const p of parts){ p.age+=dt; p.vy+=p.g*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; if(p.vr) p.rot+=p.vr*dt; if(p.t==='c'){ p.vx*=1-dt*.8; } }
  parts=parts.filter(p=>p.age<p.life&&p.y<H+60);
  if(parts.length>600) parts.splice(0,parts.length-600);
  for(const f of floats){ f.age+=dt; f.y-=60*dt; } floats=floats.filter(f=>f.age<f.life);
}
function drawParts(){
  for(const p of parts){ const a=1-p.age/p.life;
    if(p.t==='c'){ ctx.save(); ctx.globalAlpha=Math.min(1,a*2); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.col; ctx.fillRect(-p.s/2,-p.s/4,p.s,p.s/2); ctx.restore(); }
    else if(p.t==='s'){ ctx.globalAlpha=a; ctx.fillStyle=p.col; ctx.beginPath(); const s=p.s*(.5+a*.5); ctx.moveTo(p.x,p.y-s*1.6); ctx.lineTo(p.x+s*.4,p.y-s*.4); ctx.lineTo(p.x+s*1.6,p.y); ctx.lineTo(p.x+s*.4,p.y+s*.4); ctx.lineTo(p.x,p.y+s*1.6); ctx.lineTo(p.x-s*.4,p.y+s*.4); ctx.lineTo(p.x-s*1.6,p.y); ctx.lineTo(p.x-s*.4,p.y-s*.4); ctx.fill(); ctx.globalAlpha=1; }
    else if(p.t==='r'){ ctx.globalAlpha=a*.8; const cs=['#ff3b4e','#ffa53f','#ffd23f','#2ecc55','#2f7bff','#9b59ff']; for(let i=0;i<6;i++){ ctx.fillStyle=cs[i]; ctx.fillRect(p.x-18+i*6,p.y-6,6,14);} ctx.globalAlpha=1; }
    else if(p.t==='e'){ ctx.save(); ctx.globalAlpha=Math.min(1,a*1.5); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.drawImage(p.img,-p.s/2,-p.s/2,p.s,p.s); ctx.restore(); }
  }
  ctx.textAlign='center'; ctx.textBaseline='middle';
  for(const f of floats){ const a=1-f.age/f.life, sc=f.age<.15?ease(f.age/.15):1; ctx.save(); ctx.globalAlpha=Math.min(1,a*2); ctx.translate(f.x,f.y); ctx.scale(sc,sc); ctx.direction=/^[+\-\d×]/.test(f.txt)?'ltr':'rtl'; ctx.font=`900 ${f.size}px Rubik, sans-serif`; ctx.lineWidth=6; ctx.strokeStyle='rgba(90,10,70,.85)'; ctx.strokeText(f.txt,0,0); ctx.fillStyle=f.col; ctx.fillText(f.txt,0,0); ctx.restore(); }
}

/* ---------- game state ---------- */
const G={state:'loading',paused:false,t:0};
let R=null; // current run
let shake=0;

function worldOf(level){ return V?V.worldOf(level):D.WORLDS[(level-1)%3]; }
function tierOf(level){ return Math.floor((level-1)/(V?V.worldCount():3)); }

function newRun(){
  const age=S.age, grp=D.ageGroup(age), cfg=D.AGECFG[grp], world=worldOf(S.level), tier=tierOf(S.level);
  const speed=cfg.speed+Math.min(tier,4)*1.1+(grp===0?0:(age-6)*.3);
  R={age,grp,cfg,world,tier,level:S.level,speed,baseSpeed:speed,dist:0,time:0,levelLen:speed*cfg.levelSecs,
     stars:0,gatesOk:0,gatesTotal:0,combo:0,bestCombo:0,
     p:{x:0,lane:0,y:0,vy:0,slide:0,stumble:0,anim:0,fly:0,flyY:0,squash:0},
     objs:[],decor:[],nextSpawn:24,nextDecor:0,gate:null,gateTimer:rnd(cfg.gate[0],cfg.gate[1])*.7,
     pw:{magnet:0,fly:0,double:0},nextPower:rnd(10,16),thief:{x:0,tx:0,swap:2},
     ending:0,introT:0,trailT:0,firstGate:true,bannerZ:BDAY?18:0};
  if(V) V.onRunStart(R);
  for(let z=2;z<80;z+=6) spawnDecor(z);
  R.nextDecor=80;
}
const FAR=72, CAMD=7;
function proj(z){ return CAMD/(z+CAMD); }
let HOR=0, BASE=0, LW=0;
function layout(){ HOR=H*.33; BASE=H*.87; LW=Math.min(W,H*.62)*.30; }
function sy(z){ return HOR+(BASE-HOR)*proj(z); }
function sx(x,z){ return W/2+x*LW*proj(z); }

function spawnDecor(z){ const w=R.world; const list=P.decor[w.id]||P.decor.candy; for(const side of [-1,1]){ let img=pick(list), sc=1; const vp=V&&V.decorPick(R); if(vp){ img=vp.img; sc=vp.sc; } if(P.bdayBalloon&&Math.random()<.4){ img=P.bdayBalloon; sc=1; } const k=rnd(.9,1.15)*1.15*sc; R.decor.push({z:z+rnd(-1.5,1.5),x:side*rnd(2.15,2.9),img,h:img.height/img.width*k,w:k*(img===P.bdayBalloon?1.25:1)}); } }

function addObj(o){ R.objs.push(o); return o; }
function starLine(lane,z,n,arc){ for(let i=0;i<n;i++) addObj({k:'star',x:lane,z:z+i*1.7,y:arc?Math.sin(i/(n-1)*Math.PI)*1.25:0}); }
function spawnChunk(z){
  const grp=R.grp, ob=R.cfg.obst; const lanes=D.shuffle([-1,0,1]);
  if(R.gate||R.ending){ starLine(lanes[0],z,5); return 10; }
  const r=Math.random();
  if(r<.32*(2-ob)){ starLine(lanes[0],z,6); if(Math.random()<.3) addObj({k:'candy',x:lanes[1],z:z+4}); return 13; }
  const types=grp===0?['low','block','block']:grp===1?['low','high','block','block']:['low','high','high','block'];
  const r2=Math.random();
  if(grp>0&&r2<.22){ // full-width low or high
    const t=Math.random()<.5?'low':'high'; if(t==='high'&&grp===0) return 4;
    for(const l of [-1,0,1]) addObj({k:t,x:l,z}); if(t==='low') starLine(lanes[0],z-1.7,3,true); else starLine(lanes[0],z+3,4);
    return 16;
  }
  if(grp>0&&r2<.45){ // two blocks, one free lane
    addObj({k:'block',x:lanes[0],z}); addObj({k:'block',x:lanes[1],z:z+(grp===2?rnd(0,4):0)}); starLine(lanes[2],z-3,5); return 16;
  }
  const t=pick(types); addObj({k:t,x:lanes[0],z}); starLine(lanes[1],z-2,5); if(grp===2&&Math.random()<.5) addObj({k:pick(types),x:lanes[2],z:z+7});
  return grp===0?18:14;
}

/* ---------- quiz gates ---------- */
let qEl=null;
function startGate(){
  const q=D.makeQuestion(R.age); q.tex=q.options.map(optionCanvas);
  R.gate={q,phase:q.pre?'pre':'go',t:0,z:null,done:false}; R.gatesTotal++;
  // clear upcoming hazards
  R.objs=R.objs.filter(o=>o.k==='star'||o.z<8);
  showQuiz(q.pre?q.pre.html:null,q);
  if(!q.pre) launchGate();
}
function launchGate(){
  const g=R.gate; g.phase='go'; g.z=FAR-2; g.t=0;
  showQuiz(null,g.q);
  let d=0;
  if(g.q.voice) d=A.voice(g.q.voice); else if(R.firstGate){ d=A.voice('gate'); }
  R.firstGate=false;
}
function showQuiz(preHtml,q){
  const el=$('#quiz'); el.classList.remove('hidden'); el.style.animation='none'; void el.offsetWidth; el.style.animation='';
  const t=$('#qText'), h=$('#qHint');
  if(preHtml){ t.innerHTML=preHtml; h.textContent='בעוד רגע תגיע השאלה…'; t.style.fontSize=''; return; }
  t.textContent=''; const span=document.createElement('div'); span.textContent=q.prompt; if(q.ltr) span.dir='ltr'; t.appendChild(span);
  if(q.promptHtml){ const d=document.createElement('div'); d.innerHTML=q.promptHtml; t.appendChild(d); }
  t.style.fontSize=q.small?'clamp(19px,5.4vw,26px)':'';
  h.textContent=(q.hint?q.hint+' ':'')+'רוצו לשער הנכון!';
}
function hideQuiz(){ $('#quiz').classList.add('hidden'); }
function resolveGate(){
  const g=R.gate; const lane=Math.round(R.p.x)+1; const ok=lane===g.q.correct;
  const px=sx(R.p.x,0), py=BASE-LW*2;
  if(ok){ R.combo++; R.gatesOk++; R.bestCombo=Math.max(R.bestCombo,R.combo); const bonus=10*Math.min(R.combo,5)*(R.pw.double>0?2:1); R.stars+=bonus;
    A.sfx('correct'); setTimeout(()=>A.sfx('confetti',.7),120); confetti(px,py,70); confetti(W*.2,H*.35,30); confetti(W*.8,H*.35,30);
    floatText('+'+bonus+' ⭐',px,py-40,'#ffe45c',40);
    A.voice(R.combo>=3&&R.combo%3===0?'combo':R.combo>=2?pick(['amazing','champs']):pick(['great','amazing']));
    R.celebrate=1.0;
  } else { R.combo=0; A.sfx('wrong',.6); A.voice(pick(['oops','almost'])); floatText('כמעט! 💛',px,py-40,'#ffffff',36);
    // show the right one briefly
    R.reveal={i:g.q.correct,t:1.6};
  }
  if(V) V.onGate(R,ok,g.q);
  updHud(); g.done=true; R.gate=null; hideQuiz(); R.gateTimer=rnd(R.cfg.gate[0],R.cfg.gate[1]);
}

/* ---------- player actions ---------- */
function moveLane(d){ if(G.state!=='run'||G.paused||R.ending>0) return; const nl=clamp(R.p.lane+d,-1,1); if(nl!==R.p.lane){ R.p.lane=nl; R.p.tilt=d; A.sfx('jump',.25,1.6); } }
function jump(){ if(G.state!=='run'||G.paused||R.ending>0) return; const p=R.p; if(R.pw.fly>0) return; if(p.y<=0.001){ p.vy=7.2; p.slide=0; p.squash=-.15; A.sfx('jump',.6); if(V) V.onJump(); } }
function slide(){ if(G.state!=='run'||G.paused||R.ending>0) return; const p=R.p; if(R.pw.fly>0) return; if(p.y>0){ p.vy=Math.min(p.vy,-9); } p.slide=.75; A.sfx('jump',.35,.7); }

/* ---------- run update ---------- */
function updRun(dt){
  const p=R.p; R.time+=dt; R.introT+=dt;
  // speed
  let target=R.baseSpeed*(1+Math.min(R.dist/R.levelLen,1)*.12);
  if(R.gate&&R.gate.phase==='go') target*=.82;
  if(p.stumble>0) target*=.55;
  if(R.ending>0) target*=Math.max(0,1-R.ending/1.2);
  R.speed=lerp(R.speed,target,Math.min(1,dt*3));
  const dz=R.speed*dt; R.dist+=dz;
  // player
  p.x=lerp(p.x,p.lane,Math.min(1,dt*14)); p.tilt=lerp(p.tilt||0,0,dt*6);
  if(R.pw.fly>0){ p.flyY=lerp(p.flyY,2.1,dt*3); p.y=0; p.vy=0; } else { p.flyY=lerp(p.flyY,0,dt*4);
    if(p.y>0||p.vy>0){ p.vy-=22*dt; p.y+=p.vy*dt; if(p.y<=0){ p.y=0; p.vy=0; p.squash=.18; } } }
  p.squash=lerp(p.squash,0,dt*10);
  if(p.slide>0) p.slide-=dt; if(p.stumble>0) p.stumble-=dt;
  p.anim+=dt*24*(R.speed/12);
  for(const k in R.pw){ if(R.pw[k]>0){ R.pw[k]-=dt; if(R.pw[k]<=0){ R.pw[k]=0; updHud(); } } }
  // trail
  R.trailT-=dt; if(R.trailT<=0&&R.speed>2){ R.trailT=S.sel.trail==='rainbow'?.03:.07; trailParticle(sx(p.x,0),BASE-LW*(.35+p.y+p.flyY)); }
  // objects
  for(const o of R.objs) o.z-=dz;
  for(const d of R.decor) d.z-=dz;
  R.decor=R.decor.filter(d=>d.z>-3);
  while(R.nextDecor-R.dist<FAR+8){ spawnDecor(R.nextDecor-R.dist); R.nextDecor+=rnd(5,8); }
  if(R.bannerZ) R.bannerZ-=dz;
  // spawning
  if(R.ending===0&&R.dist<R.levelLen-8){ while(R.nextSpawn-R.dist<FAR){ R.nextSpawn+=spawnChunk(R.nextSpawn-R.dist); } }
  // power-ups
  R.nextPower-=dt; if(R.nextPower<=0&&!R.gate&&R.ending===0){ R.nextPower=rnd(13,20); addObj({k:'pw',type:pick(['magnet','fly','double']),x:pick([-1,0,1]),z:FAR-4,y:.3}); }
  // magnet
  const mag=R.pw.magnet>0||R.pw.fly>0;
  const pY=p.y+p.flyY;
  for(const o of R.objs){
    if(o.hit) continue;
    if(mag&&(o.k==='star'||o.k==='candy')&&o.z<12&&o.z>-1){ o.x=lerp(o.x,p.x,Math.min(1,dt*6)); if(R.pw.fly>0) o.y=lerp(o.y||0,pY,Math.min(1,dt*6)); }
    if(o.z<.55&&o.z>-.45&&Math.abs(o.x-p.x)<.48){
      if(o.k==='star'||o.k==='candy'){ if(Math.abs((o.y||0)-pY)<1.1||mag){ o.hit=true; const v=(o.k==='candy'?5:1)*(R.pw.double>0?2:1)*(V?V.starMult(R,o.k==='candy'):1); R.stars+=v; if(V) V.onStar(R,v,o.k==='candy'); A.sfx('coin',.45,o.k==='candy'?.85:1+Math.random()*.08); sparkle(sx(o.x,0),BASE-LW*(.6+(o.y||0)),'#fff59a',5); if(o.k==='candy') floatText('+'+v,sx(o.x,0),BASE-LW*2.2,'#ff9ad5',30); updHud(); } }
      else if(o.k==='pw'){ o.hit=true; activatePower(o.type); }
      else if(o.k==='egg'||o.k==='gift'){ o.hit=true; if(V) V.collect(o,R); }
      else if(p.stumble<=0&&R.pw.fly<=0){
        let hit=false;
        if(o.k==='low') hit=p.y<.45; else if(o.k==='high') hit=!(p.slide>0); else if(o.k==='block') hit=true;
        if(hit){ if(!(V&&V.absorbCrash(o,R))){ o.hit=true; bump(); if(V) V.onCrash(R); } }
      }
    }
  }
  R.objs=R.objs.filter(o=>o.z>-4&&!(o.hit&&(o.k==='star'||o.k==='candy'||o.k==='pw'||o.k==='egg'||o.k==='gift')));
  if(V){ V.updRun(R,dt,dz); V.spawn(R,addObj,FAR); }
  // gates
  if(!R.gate&&R.ending===0&&R.dist<R.levelLen-R.speed*7){ R.gateTimer-=dt; if(R.gateTimer<=0) startGate(); }
  if(R.gate){ const g=R.gate; g.t+=dt;
    if(g.phase==='pre'&&g.t>g.q.pre.secs) launchGate();
    if(g.phase==='go'){ g.z-=dz; if(g.z<-.2) resolveGate(); }
  }
  if(R.reveal){ R.reveal.t-=dt; if(R.reveal.t<=0) R.reveal=null; }
  if(R.celebrate) R.celebrate=Math.max(0,R.celebrate-dt);
  // thief
  const th=R.thief; th.swap-=dt; if(th.swap<=0){ th.swap=rnd(1.5,3.5); th.tx=pick([-1,0,1]); } th.x=lerp(th.x,th.tx,dt*2.5);
  // level end
  const prog=Math.min(1,R.dist/R.levelLen);
  $('#progFill').style.width=(prog*100)+'%'; $('#progGirl').style.right=(prog*100)+'%';
  if(R.ending===0&&R.dist>=R.levelLen&&!R.gate){ R.ending=.001; hideQuiz(); A.stopMusic(1.2); floatText('תפסנו את הגנב!',W/2,H*.3,'#ffe45c',40); A.prepBattle(); }
  if(R.ending>0){ R.ending+=dt; if(R.ending>1.8) startBattle(); }
}
function bump(){ const p=R.p; p.stumble=1.1; shake=.35; A.sfx('bump',.8); floatText('אופס!',sx(p.x,0),BASE-LW*2.3,'#fff',32); if(navigator.vibrate) try{navigator.vibrate(60);}catch(e){} }
function activatePower(t){ const dur=V?V.powerDur(t,R):{magnet:9,fly:6.5,double:10}[t]; R.pw[t]=dur; A.sfx('powerup',.8); A.voice(t); sparkle(sx(R.p.x,0),BASE-LW*1.5,'#bff7ff',14); updHud(); }

/* ---------- run render ---------- */
function drawSky(w,t){
  const gr=ctx.createLinearGradient(0,0,0,HOR); gr.addColorStop(0,w.sky[0]); gr.addColorStop(1,w.sky[1]); ctx.fillStyle=gr; ctx.fillRect(0,0,W,HOR+2);
  const off=(R?R.dist:t*8);
  if(w.id==='disco'||w.night){ // light beams + stars
    for(let i=0;i<5;i++){ const a=Math.sin(t*.8+i*1.3)*.5; ctx.save(); ctx.translate(W*(i+.5)/5,HOR); ctx.rotate(a); const bg=ctx.createLinearGradient(0,0,0,-HOR); bg.addColorStop(0,'rgba(255,255,255,0)'); bg.addColorStop(1,['rgba(255,79,168,.35)','rgba(63,212,255,.35)','rgba(255,207,63,.35)'][i%3]); ctx.fillStyle=bg; ctx.beginPath(); ctx.moveTo(-6,0); ctx.lineTo(-60,-HOR*1.2); ctx.lineTo(60,-HOR*1.2); ctx.lineTo(6,0); ctx.fill(); ctx.restore(); }
    ctx.fillStyle='#fff'; for(let i=0;i<40;i++){ const x=(i*97.3)%W, y=(i*53.1)%(HOR*.9); ctx.globalAlpha=.4+.6*Math.abs(Math.sin(t*2+i)); ctx.fillRect(x,y,2,2); } ctx.globalAlpha=1;
    if(w.night){ ctx.fillStyle='#ffcf3f'; ctx.beginPath(); ctx.arc(W*.8,HOR*.35,22,0,TAU); ctx.fill(); ctx.strokeStyle='rgba(255,207,63,.6)'; ctx.lineWidth=4; ctx.beginPath(); ctx.ellipse(W*.8,HOR*.35,38,9,-.3,0,TAU); ctx.stroke(); ctx.fillStyle='#ff9ad5'; ctx.beginPath(); ctx.arc(W*.18,HOR*.5,12,0,TAU); ctx.fill(); }
    if(w.id==='disco'){ // disco ball
    const bx=W/2, by=HOR*.28; ctx.strokeStyle='#ccc'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(bx,0); ctx.lineTo(bx,by-26); ctx.stroke(); const bgr=ctx.createRadialGradient(bx-8,by-8,3,bx,by,28); bgr.addColorStop(0,'#fff'); bgr.addColorStop(1,'#7a7f9a'); ctx.fillStyle=bgr; ctx.beginPath(); ctx.arc(bx,by,26,0,TAU); ctx.fill();
    for(let i=0;i<12;i++){ ctx.fillStyle=CONF[(i+Math.floor(t*6))%CONF.length]; ctx.fillRect(bx-20+(i%4)*11,by-16+Math.floor(i/4)*11,7,7); }
    }
  } else {
    ctx.fillStyle=w.id==='sky'?'rgba(255,255,255,.9)':'rgba(255,255,255,.75)';
    for(let i=0;i<6;i++){ const x=((i*173-off*1.2)%(W+200)+W+200)%(W+200)-100, y=HOR*(.15+(i%3)*.22); ctx.beginPath(); ctx.arc(x,y,26,0,TAU); ctx.arc(x+28,y-10,32,0,TAU); ctx.arc(x+60,y,24,0,TAU); ctx.fill(); }
    if(w.id==='candy'){ ctx.fillStyle='rgba(255,240,120,.9)'; ctx.beginPath(); ctx.arc(W*.82,HOR*.3,30,0,TAU); ctx.fill(); }
    if(w.id==='sky'){ for(let i=0;i<5;i++){ const x=((i*131+t*14)%(W+60))-30, y=HOR*(.85-((t*12+i*40)%HOR)/HOR*.8); ctx.globalAlpha=.85; balloon(ctx,x,y,9,CONF[i],12); } ctx.globalAlpha=1; }
  }
  // hills
  ctx.fillStyle=w.hill[1]; ctx.beginPath(); ctx.moveTo(0,HOR); for(let x=0;x<=W;x+=10) ctx.lineTo(x,HOR-18-Math.sin((x+off*.6)*.012)*14-Math.sin((x+off*.6)*.031)*6); ctx.lineTo(W,HOR); ctx.fill();
  ctx.fillStyle=w.hill[0]; ctx.beginPath(); ctx.moveTo(0,HOR); for(let x=0;x<=W;x+=10) ctx.lineTo(x,HOR-8-Math.sin((x+off*1.1)*.02+1)*9); ctx.lineTo(W,HOR); ctx.fill();
}
function drawRoad(w){
  const off=R.dist;
  // ground
  ctx.fillStyle=w.ground[0]; ctx.fillRect(0,HOR,W,H-HOR);
  const seg=3; const z0=-2.5;
  let z=FAR; const start=Math.floor((off+FAR)/seg)*seg-off;
  for(let zz=start; zz>z0; zz-=seg){
    const za=Math.max(zz-seg,z0), zb=Math.min(zz,FAR);
    if(zb<=za) continue;
    const idx=Math.round((zz+off)/seg);
    const ya=sy(za), yb=sy(zb);
    // ground stripes
    ctx.fillStyle=idx%2?w.ground[0]:w.ground[1]; ctx.fillRect(0,yb,W,ya-yb+1);
    // road
    const ra=1.62, xa1=sx(-ra,za), xa2=sx(ra,za), xb1=sx(-ra,zb), xb2=sx(ra,zb);
    ctx.fillStyle=idx%2?w.road[0]:w.road[1]; ctx.beginPath(); ctx.moveTo(xa1,ya); ctx.lineTo(xa2,ya); ctx.lineTo(xb2,yb); ctx.lineTo(xb1,yb); ctx.fill();
    // edges
    const ea=1.8; ctx.fillStyle=idx%2?w.edge[0]:w.edge[1];
    ctx.beginPath(); ctx.moveTo(sx(-ea,za),ya); ctx.lineTo(xa1,ya); ctx.lineTo(xb1,yb); ctx.lineTo(sx(-ea,zb),yb); ctx.fill();
    ctx.beginPath(); ctx.moveTo(sx(ea,za),ya); ctx.lineTo(xa2,ya); ctx.lineTo(xb2,yb); ctx.lineTo(sx(ea,zb),yb); ctx.fill();
    // lane dashes
    if(idx%2){ ctx.fillStyle=w.lane; for(const lx of [-.5,.5]){ const d=.05; ctx.beginPath(); ctx.moveTo(sx(lx-d,za),ya); ctx.lineTo(sx(lx+d,za),ya); ctx.lineTo(sx(lx+d,zb),yb); ctx.lineTo(sx(lx-d,zb),yb); ctx.fill(); } }
  }
  // horizon fog
  const fg=ctx.createLinearGradient(0,HOR,0,HOR+(BASE-HOR)*.18); fg.addColorStop(0,w.sky[1]); fg.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=fg; ctx.globalAlpha=w.id==='disco'?.35:.8; ctx.fillRect(0,HOR,W,(BASE-HOR)*.18); ctx.globalAlpha=1;
}
function drawBillboard(img,x,z,wu,hu,yu){ const s=proj(z), px=LW*s, cx=sx(x,z), by=sy(z)-(yu||0)*px; const w=wu*px, h=hu*px; ctx.drawImage(img,cx-w/2,by-h,w,h); }
function drawShadow(x,z,wu,yu){ const s=proj(z), px=LW*s; ctx.fillStyle='rgba(60,0,60,.18)'; ctx.beginPath(); ctx.ellipse(sx(x,z),sy(z),wu*px*.5/(1+(yu||0)*.4),wu*px*.13/(1+(yu||0)*.4),0,0,TAU); ctx.fill(); }
function drawThiefSprite(x,y,h,t,acc,flipBag){
  const img=IMG.thief; if(!img) return; const w=h*img.width/img.height;
  ctx.drawImage(img,x-w/2,y-h,w,h);
  if(acc==='propeller'){ // beanie with propeller
    const hx=x-w*.05, hy=y-h*.93; ctx.fillStyle='#ffcf3f'; ctx.beginPath(); ctx.ellipse(hx,hy+h*.03,w*.2,h*.07,0,Math.PI,0); ctx.fill(); ctx.fillStyle='#ff3b4e'; ctx.fillRect(hx-2,hy-h*.08,4,h*.08);
    const r=w*.22*Math.abs(Math.cos(t*14)); ctx.fillStyle='#2f7bff'; ctx.beginPath(); ctx.ellipse(hx,hy-h*.085,Math.max(2,r),h*.025,0,0,TAU); ctx.fill(); }
  else if(acc==='shades'){ const gx=x+w*.05, gy=y-h*.73; ctx.fillStyle='#ff4fa8'; ctx.beginPath(); ctx.ellipse(gx-w*.12,gy,w*.1,h*.05,0,0,TAU); ctx.ellipse(gx+w*.13,gy,w*.1,h*.05,0,0,TAU); ctx.fill(); ctx.fillStyle='rgba(255,255,255,.5)'; ctx.fillRect(gx-w*.17,gy-h*.025,w*.04,h*.015); ctx.fillRect(gx+w*.08,gy-h*.025,w*.04,h*.015);
    ctx.fillStyle='#ffcf3f'; starPath(ctx,x-w*.05,y-h*.98,h*.07,h*.03,5); ctx.fill(); }
}
function drawRunner(){
  const p=R.p, x=sx(p.x,0), hpx=LW*1.95; const yOff=(p.y+p.flyY)*LW;
  // shadow
  ctx.fillStyle='rgba(60,0,60,.22)'; const sh=1/(1+(p.y+p.flyY)*.5); ctx.beginPath(); ctx.ellipse(x,BASE,LW*.36*sh,LW*.09*sh,0,0,TAU); ctx.fill();
  if(p.stumble>0&&Math.floor(p.stumble*12)%2===0) ctx.globalAlpha=.45;
  ctx.save(); ctx.translate(x,BASE-yOff); ctx.rotate((p.tilt||0)*-.12);
  const sq=p.squash; ctx.scale(1+sq*.6,1-sq);
  if(R.pw.fly>0||p.flyY>.05){ // balloons
    const bt=G.t; for(let i=0;i<3;i++){ const bx=(i-1)*LW*.28+Math.sin(bt*2+i)*4, byy=-hpx*1.05-LW*.55-(i===1?LW*.18:0); ctx.strokeStyle='rgba(80,40,80,.6)'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(0,-hpx*.82); ctx.lineTo(bx,byy+LW*.25); ctx.stroke(); balloon(ctx,bx,byy,LW*.22,['#ff3b4e','#ffd23f','#2f7bff'][i],0); }
  }
  let veh=null; if(V&&V.rideOn(R)){ veh=V.drawVehicle(ctx,hpx,R); ctx.translate(0,-veh.lift); }
  if(veh&&veh.frame){ drawFrame(veh.frame,6,0,0,hpx*veh.scale); }
  else if(p.slide>0){ const f=clamp((0.75-p.slide)/.75,0,1)*12; drawFrame('duck',f,0,0,hpx*.68); }
  else if(p.y>0){ if(SPR.jumpb&&IMG.spr_jumpb){ const ph=clamp((7.2-p.vy)/14.4,0,1); drawFrame('jumpb',3+ph*12,0,p.y*LW*.4,hpx*1.13); } else drawFrame('run',p.vy>0?3:10,0,0,hpx); }
  else drawFrame('run',p.anim,0,0,hpx);
  if(veh&&veh.front) veh.front();
  ctx.restore(); ctx.globalAlpha=1;
  if(R.pw.magnet>0){ ctx.strokeStyle=`rgba(63,212,255,${.35+.25*Math.sin(G.t*10)})`; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(x,BASE-yOff-hpx*.5,LW*.95,0,TAU); ctx.stroke(); }
}
function drawPlayerGroup(){ drawRunner(); if(V) V.drawCompanions(R); }
function drawGate(g){
  const z=g.z; if(z==null||z>FAR) return;
  const s=proj(z), px=LW*s;
  const cols=['#ff3b4e','#ffa53f','#ffd23f','#2ecc55','#2f7bff','#9b59ff'];
  for(let i=0;i<3;i++){
    const lx=i-1, cx=sx(lx,z), by=sy(z);
    // arch
    ctx.lineWidth=Math.max(1,px*.05);
    for(let k=0;k<6;k++){ ctx.strokeStyle=cols[k]; ctx.beginPath(); ctx.arc(cx,by-px*1.55,px*(.47-k*.045),Math.PI,0); ctx.stroke(); }
    ctx.fillStyle='#fff'; ctx.fillRect(cx-px*.49,by-px*1.55,px*.07,px*1.55); ctx.fillRect(cx+px*.42,by-px*1.55,px*.07,px*1.55);
    // sign
    const sz=px*.86, sy2=by-px*2.05-sz/2; let sc=1;
    if(V&&V.gateHint(R,i)){ ctx.save(); ctx.globalAlpha=.45+.35*Math.sin(G.t*10); ctx.fillStyle='#fff59a'; ctx.beginPath(); ctx.arc(cx,sy2,sz*.72,0,TAU); ctx.fill(); ctx.restore(); }
    if(R.reveal&&false) sc=1;
    ctx.drawImage(g.q.tex[i],cx-sz*sc/2,sy2-sz*sc/2,sz*sc,sz*sc);
    // sparkles
    if(Math.random()<.15) sparkle(cx+rnd(-px*.4,px*.4),by-rnd(0,px*1.6),'#fff',1);
  }
}
function drawObj(o,w){
  const ob=P.obs[w.id];
  if(o.k==='star'){ const s=proj(o.z), px=LW*s; const sp=Math.abs(Math.cos(G.t*4+o.z*.3)); const sz=px*.55; const cx=sx(o.x,o.z), cy=sy(o.z)-px*(.45+(o.y||0)); ctx.drawImage(P.star,cx-sz*(.25+sp*.75)/2,cy-sz/2,sz*(.25+sp*.75),sz); }
  else if(o.k==='candy'){ const ti=V&&V.treatImg(R); if(ti) drawBillboard(ti,o.x,o.z,.6,.6*ti.height/ti.width,.3+Math.sin(G.t*4)*.08); else drawBillboard(P.candy,o.x,o.z,.7,.4,.35+Math.sin(G.t*4)*.08); }
  else if(o.k==='egg'||o.k==='gift'){ if(V) V.drawObj(o); }
  else if(o.k==='pw'){ drawShadow(o.x,o.z,.6); drawBillboard(P['pw_'+o.type],o.x,o.z,.75,.75,.35+Math.sin(G.t*3)*.12); }
  else if(o.k==='low'){ drawShadow(o.x,o.z,1); drawBillboard(ob.low,o.x,o.z,1.0,.44); }
  else if(o.k==='high'){ drawBillboard(ob.high,o.x,o.z,1.02,1.92,0); }
  else if(o.k==='block'){ drawShadow(o.x,o.z,1); drawBillboard(ob.block,o.x,o.z,.92,.99); }
}
function drawBanner(){ // birthday arch
  const z=R.bannerZ; if(!BDAY||z<-1||z>FAR) return; const s=proj(z), px=LW*s; const by=sy(z);
  const x1=sx(-1.75,z), x2=sx(1.75,z); ctx.fillStyle='#ff4fa8'; ctx.fillRect(x1-px*.06,by-px*2.6,px*.12,px*2.6); ctx.fillRect(x2-px*.06,by-px*2.6,px*.12,px*2.6);
  const bw=x2-x1, bh=px*.7, bt=by-px*2.95; ctx.fillStyle='#fff'; rrect(ctx,x1-px*.1,bt,bw+px*.2,bh,bh*.3); ctx.fill(); ctx.lineWidth=Math.max(1,px*.06); ctx.strokeStyle='#ffcf3f'; ctx.stroke();
  const txt='מזל טוב '+BDAY.name+'!'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.direction='rtl'; fitText(ctx,txt,bw*.92,bh*.62); ctx.fillStyle='#d4157f'; ctx.fillText(txt,(x1+x2)/2,bt+bh*.54);
  if(V&&V.hasPhoto()){ V.drawFace(ctx,x1,bt+bh*.4,px*.62); V.drawFace(ctx,x2,bt+bh*.4,px*.62); } else { balloon(ctx,x1,bt-px*.1,px*.25,'#ffd23f',0); balloon(ctx,x2,bt-px*.1,px*.25,'#3fd4ff',0); }
}
function renderRun(){
  const w=R.world; layout();
  ctx.save(); if(shake>0){ ctx.translate(rnd(-1,1)*shake*14,rnd(-1,1)*shake*10); }
  drawSky(w,G.t); drawRoad(w);
  // collect drawables sorted by z (far first)
  const list=[];
  for(const d of R.decor) if(d.z<FAR&&d.z>-2.5) list.push({z:d.z,f:()=>drawBillboard(d.img,d.x,d.z,d.w,d.h)});
  for(const o of R.objs) if(o.z<FAR&&o.z>-2.5) list.push({z:o.z+(o.k==='high'?.01:0),f:()=>drawObj(o,w)});
  if(R.gate&&R.gate.z!=null) list.push({z:R.gate.z,f:()=>drawGate(R.gate)});
  if(BDAY&&R.bannerZ>-1) list.push({z:R.bannerZ,f:drawBanner});
  // thief
  const prog=Math.min(1,R.dist/R.levelLen); const tz=R.ending>0?lerp(6,4,Math.min(1,R.ending)):lerp(46,7,prog*prog);
  list.push({z:tz,f:()=>{ const s=proj(tz), px=LW*s; const bob=Math.abs(Math.sin(G.t*9))*px*.18; drawShadow(R.thief.x,tz,.9); drawThiefSprite(sx(R.thief.x,tz),sy(tz)-bob,px*1.45,G.t,w.boss.acc); }});
  list.sort((a,b)=>b.z-a.z);
  let drewPlayer=false;
  for(const it of list){ if(!drewPlayer&&it.z<0){ drawPlayerGroup(); drewPlayer=true; } it.f(); }
  if(!drewPlayer) drawPlayerGroup();
  drawParts();
  ctx.restore();
  if(V) V.postRender(R);
  if(R.ending>0){ ctx.fillStyle=`rgba(255,255,255,${clamp((R.ending-1)/.8,0,1)})`; ctx.fillRect(0,0,W,H); }
}

/* ---------- dance battle ---------- */
const BPM=120, BEAT=60/BPM, OFFSET=0.287, SONG_LEN=45.0;
let B=null;
function makeChart(grp,world,tier){
  const notes=[]; const cols=[1,2,3][grp];
  const first=8, last=84;
  let zig=0, zd=1;
  for(let b=first;b<=last;b++){
    const inBar=(b-first)%4, bar=Math.floor((b-first)/4);
    let on;
    if(grp===0) on=(b%2===0);
    else if(grp===1) on=[[1,1,1,0],[1,0,1,1],[1,1,0,1],[1,0,1,0]][bar%4][inBar]===1 || tier>0&&inBar===3&&bar%2===1;
    else on=inBar!==3||bar%3===2;
    if(!on) continue;
    let col=0;
    if(cols>1){ if(world.id==='sky'){ col=zig; zig+=zd; if(zig>=cols-1||zig<=0) zd=-zd; zig=clamp(zig,0,cols-1); } else col=ri(0,cols-1); }
    notes.push({t:OFFSET+b*BEAT,col});
    if(grp===2&&(world.id==='disco'||tier>0)&&inBar===1&&bar%2===0) notes.push({t:OFFSET+(b+.5)*BEAT,col:(col+1)%cols});
    if(grp===1&&world.id==='disco'&&inBar===2&&bar%4===1) notes.push({t:OFFSET+(b+.5)*BEAT,col:(col+1)%cols});
  }
  return notes;
}
function startBattle(){
  G.state='battle'; hideQuiz(); $('#hud').classList.add('hidden'); $('#bHud').classList.remove('hidden');
  const grp=R.grp, w=R.world;
  B={notes:makeChart(grp,w,R.tier),cols:[1,2,3][grp],approach:R.cfg.approach,meter:50,perfect:0,good:0,miss:0,streak:0,intro:3.9,started:false,ended:false,endT:0,ef:'dance',efT:0,fb:null,flash:[0,0,0],songT:0,hitFx:[]};
  $('#mFill').style.width='50%'; $('#bTitle').textContent=w.boss.name+'!';
  A.voice('thief'); parts=[]; floats=[];
}
function battleClock(){ return B.started?A.battleTime():-B.intro; }
async function beginSong(){ B.started=true; await A.prepBattle(); A.startBattle(); A.voice('dance'); $('#bTitle').textContent='תקישו בקצב! 🎵'; }
function colX(i){ const n=B.cols, gap=Math.min(W*.27,140); return W/2+(i-(n-1)/2)*gap; }
function battleTap(col){
  if(!B||!B.started||B.ended) return;
  const now=battleClock(); let best=null;
  for(const n of B.notes){ if(n.j||n.col!==col) continue; const d=Math.abs(n.t-now); if(d<.21&&(!best||d<Math.abs(best.t-now))) best=n; }
  B.flash[col]=.18;
  if(!best) return;
  const d=Math.abs(best.t-now); best.j=d<.085?'p':'g';
  if(best.j==='p'){ B.perfect++; B.meter=Math.min(100,B.meter+3.2); judge('מושלם!','#ffe45c'); A.sfx('coin',.35,1.3); }
  else { B.good++; B.meter=Math.min(100,B.meter+2); judge('יפה!','#9ff7ff'); A.sfx('coin',.3,1.1); }
  B.streak++; const ty=H*.86; sparkle(colX(col),ty,best.j==='p'?'#ffe45c':'#bff7ff',10);
  if(B.streak>0&&B.streak%10===0){ floatText('רצף '+B.streak+'! 🔥',W/2,H*.52,'#ffcf3f',34); confetti(W*.3,H*.3,25); }
  $('#mFill').style.width=B.meter+'%';
}
function judge(t,c){ B.fb={t,c,age:0}; }
function updBattle(dt){
  if(!B.started){ B.intro-=dt; if(B.intro<=0&&!B.starting){ B.starting=true; beginSong(); } return; }
  const now=battleClock(); B.songT=now;
  for(const n of B.notes){ if(!n.j&&now-n.t>.21){ n.j='m'; B.miss++; B.streak=0; B.meter=Math.max(0,B.meter-3); judge('אופס!','#ffffff'); B.ef='oops'; B.efT=.75; $('#mFill').style.width=B.meter+'%'; } }
  for(let i=0;i<3;i++) B.flash[i]=Math.max(0,B.flash[i]-dt);
  if(B.fb) B.fb.age+=dt;
  if(B.efT>0){ B.efT-=dt; if(B.efT<=0) B.ef='dance'; }
  const last=B.notes.length?B.notes[B.notes.length-1].t:10;
  if(!B.ended&&now>last+1.0){ B.ended=true; B.endT=0; endBattle(); }
}
function endBattle(){
  A.stopBattle(); const total=B.notes.length, hit=B.perfect+B.good; B.win=B.meter>=50||hit/total>=.6;
  if(V) V.onBattleEnd(R,B.win,B.perfect);
  B.bonus=B.perfect*2+B.good+(B.win?25:5); R.stars+=B.bonus;
  $('#bTitle').textContent=B.win?'ניצחנו! 🏆':'כמעט! 💛';
  if(B.win){ A.voice('win'); confetti(W/2,H*.35,120,1.2); A.sfx('confetti'); } else A.voice('lose');
  setTimeout(()=>{ if(G.state==='battle') showResult(); },B.win?4300:3600);
}
function renderBattle(){
  const w=R.world, t=G.t; const now=B?B.songT:0; const beatPh=B&&B.started?(((now-OFFSET)/BEAT)%1+1)%1:(t*2)%1; const pulse=Math.pow(1-beatPh,3);
  // background
  const gr=ctx.createLinearGradient(0,0,0,H); gr.addColorStop(0,w.id==='disco'?'#16052e':w.id==='sky'?'#1d3d8f':'#5b1460'); gr.addColorStop(1,w.id==='disco'?'#4a1580':w.id==='sky'?'#5aa8ff':'#c43d95'); ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
  // beams
  for(let i=0;i<4;i++){ const a=Math.sin(t*.9+i*1.7)*.6; ctx.save(); ctx.translate(W*(i+.5)/4,0); ctx.rotate(a); ctx.fillStyle=['rgba(255,79,168,.18)','rgba(63,212,255,.18)','rgba(255,207,63,.18)','rgba(46,204,85,.15)'][i]; ctx.beginPath(); ctx.moveTo(-8,0); ctx.lineTo(-90,H*.6); ctx.lineTo(90,H*.6); ctx.lineTo(8,0); ctx.fill(); ctx.restore(); }
  // floor
  const fy=H*.40; const tiles=8; for(let r=0;r<6;r++){ const y0=fy+r*r*H*.004+r*H*.012, y1=fy+(r+1)*(r+1)*H*.004+(r+1)*H*.012; for(let c=0;c<tiles;c++){ const on=((r+c+Math.floor(now/BEAT))%3===0); ctx.fillStyle=on?CONF[(r*3+c)%CONF.length]:'rgba(255,255,255,.08)'; ctx.globalAlpha=on?.35+.35*pulse:1; const xa=W/2+(c-tiles/2)*W/tiles*(1+r*.18), xb=W/2+(c+1-tiles/2)*W/tiles*(1+r*.18); ctx.fillRect(xa+1,y0+1,xb-xa-2,y1-y0-2); } } ctx.globalAlpha=1;
  // dancers
  const baseY=H*.47, efH=H*.31;
  ctx.fillStyle='rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(W*.3,baseY,efH*.22,efH*.05,0,0,TAU); ctx.ellipse(W*.73,baseY,efH*.2,efH*.045,0,0,TAU); ctx.fill();
  const bounce=pulse*H*.008;
  if(B&&B.ef==='oops') drawFrame('oops',12+(.75-B.efT)*20,W*.3,baseY,efH);
  else if(B&&B.ended&&B.win) drawFrame('celebrate',G.t*14,W*.3,baseY,efH);
  else drawFrame('dance',(B&&B.started?now:t)*12.5,W*.3,baseY-bounce,efH);
  if(V&&V.hasBuddy()) V.drawBuddy(ctx,W*.51,baseY+H*.02,efH*.55,B&&B.started?now*1.05:t,true);
  const thH=H*.22, th=pulse*.08; ctx.save(); ctx.translate(W*.73,baseY); ctx.rotate(Math.sin(now*Math.PI/BEAT)*.08); ctx.scale(1-th*.5,1+th); drawThiefSprite(0,0,thH,t,w.boss.acc); ctx.restore();
  // speech bubble when thief "wins" a note
  if(B&&B.ef==='oops'){ ctx.font='900 22px Rubik'; ctx.textAlign='center'; ctx.fillStyle='#fff'; rrect(ctx,W*.73-52,baseY-thH-44,104,36,16); ctx.fill(); ctx.fillStyle='#7a1fa2'; ctx.fillText('הי הי!',W*.73,baseY-thH-21); }
  // highway
  if(!B) return;
  const ty=H*.86, top=H*.52; const n=B.cols;
  const cc=['#ff4fa8','#ffcf3f','#3fd4ff'], icons=['♥','★','♪'];
  for(let i=0;i<n;i++){ const x=colX(i); ctx.fillStyle='rgba(255,255,255,.08)'; ctx.fillRect(x-34,top,68,ty-top+40);
    ctx.lineWidth=6; ctx.strokeStyle=B.flash[i]>0?'#fff':cc[i]; ctx.beginPath(); ctx.arc(x,ty,34+pulse*4,0,TAU); ctx.stroke();
    ctx.fillStyle=`rgba(255,255,255,${.12+B.flash[i]*3})`; ctx.beginPath(); ctx.arc(x,ty,30,0,TAU); ctx.fill(); }
  if(B.started){
    for(const nt of B.notes){ if(nt.j==='p'||nt.j==='g') continue; const dtn=nt.t-now; if(dtn>B.approach||dtn<-.3) continue; const k=1-dtn/B.approach; const y=top+(ty-top)*k; const x=colX(nt.col); const r=26+k*6;
      ctx.globalAlpha=nt.j==='m'?.35:Math.min(1,k*3); const g2=ctx.createRadialGradient(x-8,y-8,3,x,y,r); g2.addColorStop(0,'#fff'); g2.addColorStop(1,cc[nt.col]); ctx.fillStyle=g2; ctx.beginPath(); ctx.arc(x,y,r,0,TAU); ctx.fill(); ctx.lineWidth=3; ctx.strokeStyle='#fff'; ctx.stroke();
      ctx.fillStyle='#fff'; ctx.font=`900 ${Math.round(r*1.1)}px Rubik, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(icons[nt.col],x,y+2); ctx.globalAlpha=1; }
  } else {
    const c=Math.ceil(B.intro); ctx.font='900 30px Rubik'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillStyle='#fff'; ctx.direction='rtl';
    ctx.fillText(n===1?'הקישו על המסך בכל פעם שעיגול מגיע לטבעת!':'הקישו על הטבעת כשהעיגול מגיע אליה!',W/2,H*.62,W*.92);
    ctx.font='900 64px Rubik'; ctx.fillStyle='#ffe45c'; if(B.intro<3) ctx.fillText(String(c),W/2,H*.72);
  }
  if(B.fb&&B.fb.age<.6){ const a=1-B.fb.age/.6; ctx.globalAlpha=a; ctx.font=`900 ${Math.round(40+(1-a)*10)}px Rubik`; ctx.textAlign='center'; ctx.lineWidth=6; ctx.strokeStyle='rgba(80,0,80,.8)'; ctx.strokeText(B.fb.t,W/2,top-8); ctx.fillStyle=B.fb.c; ctx.fillText(B.fb.t,W/2,top-8); ctx.globalAlpha=1; }
  drawParts();
}

/* ---------- menu / result / finale render ---------- */
function drawCover(img){ if(!img){ ctx.fillStyle='#ffb3dd'; ctx.fillRect(0,0,W,H); return; } const s=Math.max(W/img.width,H/img.height), w=img.width*s, h=img.height*s; ctx.drawImage(img,(W-w)/2,(H-h)/2,w,h); }
function renderMenu(){
  drawCover(IMG.menubg);
  const g=ctx.createRadialGradient(W/2,H*.45,10,W/2,H*.45,H*.4); g.addColorStop(0,'rgba(255,255,255,.55)'); g.addColorStop(1,'rgba(255,255,255,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  const tl=document.querySelector('.tiles'); const tTop=tl&&tl.offsetParent?tl.getBoundingClientRect().top-cvs.getBoundingClientRect().top:H*.6; const fy=Math.min(H*.635,tTop+4), fh=Math.min(H*.37,Math.max(H*.18,fy-H*.2));
  ctx.fillStyle='rgba(120,20,90,.25)'; ctx.beginPath(); ctx.ellipse(W/2,fy,fh*.2,fh*.04,0,0,TAU); ctx.fill();
  drawFrame('celebrate',G.t*14,W/2,fy,fh);
  if(Math.random()<.08) sparkle(rnd(0,W),rnd(H*.1,H*.6),pick(['#fff','#fff59a','#ffd0f0']),1);
  drawParts();
}
function drawCake(cx,by,w,name,age){
  const h=w*.75; const t=G.t;
  // plate
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(cx,by,w*.62,w*.09,0,0,TAU); ctx.fill();
  const tiers=[[w,h*.42,'#ff9ad5'],[w*.74,h*.34,'#fff0f8'],[w*.5,h*.26,'#ffcf3f']]; let y=by;
  for(const [tw,th,c] of tiers){ ctx.fillStyle=shade(c,-.12); rrect(ctx,cx-tw/2,y-th,tw,th,12); ctx.fill(); ctx.fillStyle=c; rrect(ctx,cx-tw/2,y-th,tw,th*.86,12); ctx.fill();
    ctx.fillStyle='#fff'; for(let i=0;i<7;i++){ const dx=cx-tw/2+tw*(i+.5)/7; ctx.beginPath(); ctx.arc(dx,y-th+4,tw/16,0,Math.PI); ctx.fill(); }
    y-=th; }
  // name on bottom tier
  ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.direction='rtl'; fitText(ctx,name,w*.85,h*.2); ctx.lineWidth=5; ctx.strokeStyle='#fff'; ctx.strokeText(name,cx,by-h*.2); ctx.fillStyle='#d4157f'; ctx.fillText(name,cx,by-h*.2);
  if(V&&V.hasPhoto()){ ctx.fillStyle='#ffcf3f'; ctx.fillRect(cx-2,y-h*.5,4,h*.3); V.drawFace(ctx,cx,y-h*.55,w*.34); }
  const n=Math.max(1,Math.min(age||5,10)); const topW=w*.5; for(let i=0;i<n;i++){ const x=cx-topW*.4+topW*.8*(n===1?.5:i/(n-1)); ctx.fillStyle=CONF[i%CONF.length]; ctx.fillRect(x-3,y-h*.18,6,h*.18); const fl=1+Math.sin(t*20+i)*.15; ctx.fillStyle='#ffb300'; ctx.beginPath(); ctx.ellipse(x,y-h*.22,4*fl,8*fl,0,0,TAU); ctx.fill(); ctx.fillStyle='#fff59a'; ctx.beginPath(); ctx.ellipse(x,y-h*.21,2,4,0,0,TAU); ctx.fill(); }
}
function renderCelebrate(){
  const w=R?R.world:D.WORLDS[0]; layout();
  const gr=ctx.createLinearGradient(0,0,0,H); gr.addColorStop(0,w.sky[0]); gr.addColorStop(1,w.sky[1]); ctx.fillStyle=gr; ctx.fillRect(0,0,W,H);
  // rays
  ctx.save(); ctx.translate(W/2,H*.32); ctx.rotate(G.t*.2); for(let i=0;i<12;i++){ ctx.rotate(TAU/12); ctx.fillStyle='rgba(255,255,255,.18)'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(-40,-H); ctx.lineTo(40,-H); ctx.fill(); } ctx.restore();
  if(Math.random()<.4) rainConfetti(2);
  const fin=G.state==='finale';
  if(fin){
    const by=H*.53; drawFrame('celebrate',G.t*14,W*.3,by,H*.33);
    drawCake(W*.71,by,Math.min(W*.44,200),BDAY.name,BDAY.age);
    if(V&&V.hasBuddy()) V.drawBuddy(ctx,W*.5,by+H*.08,H*.17,G.t,true);
    if(P.bdayBalloon){ const bh=H*.2; const bw=bh*P.bdayBalloon.width/P.bdayBalloon.height; ctx.drawImage(P.bdayBalloon,W*.06-bw*.3,H*.3-bh+Math.sin(G.t*1.5)*8,bw,bh); ctx.drawImage(P.bdayBalloon,W*.94-bw*.7,H*.28-bh+Math.sin(G.t*1.5+1)*8,bw,bh); }
  } else {
    drawFrame('celebrate',G.t*14,W/2,H*.56,H*.42);
  }
  drawParts();
}

/* ---------- UI ---------- */
const scr=id=>{ document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('show',s.id===id)); };
function toast(t,ms){ const el=$('#toast'); el.textContent=t; el.classList.add('on'); clearTimeout(el._t); el._t=setTimeout(()=>el.classList.remove('on'),ms||1800); }
const pwURL={};
function updHud(){
  if(!R) return; $('#hudStars').textContent='⭐ '+R.stars;
  const c=$('#hudCombo'); if(R.combo>=2){ c.classList.remove('hidden'); c.textContent='קומבו ×'+R.combo; } else c.classList.add('hidden');
  const pw=$('#hudPower'); const act=['magnet','fly','double'].filter(k=>R.pw[k]>0); const key=act.join(','); if(pw._k!==key){ pw._k=key; pw.innerHTML=''; act.forEach(k=>{ if(!pwURL[k]) pwURL[k]=P['pw_'+k].toDataURL(); const i=document.createElement('img'); i.src=pwURL[k]; i.alt=''; pw.appendChild(i); }); } pw.classList.toggle('hidden',!act.length);
}
function updMenu(){
  $('#menuStars').textContent='⭐ '+S.stars; $('#menuStreak').textContent='🔥 '+(S.daily.streak||0);
  document.querySelectorAll('#ages button').forEach(b=>b.classList.toggle('on',+b.dataset.age===S.age));
  const w=worldOf(S.level); $('#levelInfo').textContent=`שלב ${S.level} · ${w.name}`+(S.best?` · שיא: ${S.best}⭐`:'');
  const chip=$('#bdayChip'); if(BDAY){ chip.classList.remove('hidden'); chip.textContent='🎂 המסיבה של '+BDAY.name+(BDAY.age?' · '+BDAY.age:''); } else chip.classList.add('hidden');
  $('#btnSound').textContent=S.sound?'🔊':'🔇';
  if(V) V.menuUpd();
}
function buildAges(el,onPick,withNone){
  el.innerHTML=''; for(let a=(withNone?1:3);a<=(withNone?12:10);a++){ const b=document.createElement('button'); b.textContent=a; b.dataset.age=a; b.addEventListener('click',()=>{ onPick(a,b); A.sfx('coin',.4,1.2); }); el.appendChild(b); }
}
function goMenu(){
  G.state='menu'; G.paused=false; R=null; B=null; parts=[]; floats=[];
  ['#hud','#bHud','#quiz'].forEach(s=>$(s).classList.add('hidden')); scr('scrMenu'); updMenu(); A.menuMusic(); A.setRate&&A.setRate(1);
  setTimeout(checkDaily,700); if(V) V.onMenu();
}
function todayStr(d){ d=d||new Date(); return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate(); }
function checkDaily(){
  if(G.state!=='menu') return; const today=todayStr(); if(S.daily.last===today) return;
  const y=new Date(); y.setDate(y.getDate()-1); const streak=S.daily.last===todayStr(y)?(S.daily.streak||0)+1:1;
  const reward=15+5*Math.min(streak,7);
  G.daily={streak,reward}; $('#dTxt').textContent=`קיבלתם ${reward} כוכבים במתנה!`; $('#dStreak').textContent=`🔥 רצף: ${streak} ${streak===1?'יום':'ימים'}`+(streak<7?' · חזרו מחר לעוד!':' · אלופים!');
  scr('scrDaily'); A.sfx('powerup',.7); A.voice('daily');
}
function play(){
  if(V&&!V.canPlay()) return;
  scr(null); newRun(); G.state='run'; G.paused=false; parts=[]; floats=[];
  $('#hud').classList.remove('hidden'); $('#bHud').classList.add('hidden'); updHud();
  const bt=$('#bdayTag'); if(BDAY){ bt.classList.remove('hidden'); bt.textContent='🎂 המסיבה של '+BDAY.name; } else bt.classList.add('hidden');
  A.gameMusic(R.world.music); setTimeout(()=>{ if(G.state==='run') A.voice('letsgo'); },350);
  layout(); floatText(R.world.name,W/2,H*.42,'#ffffff',38);
}
let finaleShown=false;
function showResult(){
  $('#bHud').classList.add('hidden'); $('#hud').classList.add('hidden');
  const earned=R.stars; S.stars+=earned; const rec=earned>S.best; if(rec) S.best=earned; S.level++; S.games=(S.games||0)+1;
  A.setRate&&A.setRate(1); const lv=V?V.onLevelEnd(R,earned):null; save();
  G.lastScore=earned; G.lastLevel=R.level;
  const stats=[[`+${earned}`,'כוכבים'],[`${R.gatesOk}/${R.gatesTotal}`,'שערי קסם'],[B&&B.win?'ניצחון! 🏆':'כמעט! 💛','קרב ריקודים'],[`×${R.bestCombo}`,'קומבו שיא']];
  const fill=el=>{ el.innerHTML=''; for(const [v,l] of stats){ const d=document.createElement('div'); const b=document.createElement('b'); b.textContent=v; if(/^[+×\d]/.test(v)) b.dir='ltr'; d.appendChild(b); d.appendChild(document.createTextNode(l)); el.appendChild(d); } };
  parts=[]; floats=[]; rainConfetti(80); A.sfx('confetti'); A.menuMusic();
  if(BDAY&&!finaleShown){
    finaleShown=true; G.state='finale'; fill($('#fStats')); $('#fName').textContent=BDAY.name+'!'; $('#fAge').textContent=BDAY.age?`חוגגים ${BDAY.age} 🎉`:'🎉🎈🎂'; scr('scrFinale');
    const d=A.voice('bday'); setTimeout(()=>{ if(G.state==='finale') A.voice('mazal'); },(d||5.7)*1000+400);
  } else {
    G.state='result'; fill($('#rStats')); $('#rTitle').textContent=rec?'שיא חדש! 🏆':`שלב ${R.level} הושלם! 🎉`; scr('scrResult');
    const rc=$('#rChal'), rg=$('#rGains'); rc.classList.add('hidden'); rg.textContent='';
    if(lv){ rg.textContent=lv.gains.join(' · '); if(lv.chal){ rc.classList.remove('hidden'); rc.textContent=lv.chal.txt; rc.classList.toggle('win',lv.chal.win); } }
    $('#rLesson').classList.toggle('hidden',!(V&&B&&B.win&&V.lessonPending(R.world)));
    let d;
    if(lv&&lv.chal){ d=A.voice(lv.chal.win?'ch_win':'ch_lose'); if(lv.chal.win) rainConfetti(80); }
    else { d=A.voice('level'); if(rec) setTimeout(()=>{ if(G.state==='result') A.voice('record'); },(d||2.6)*1000+300); }
    if(lv&&lv.sticker&&(lv.sticker.shiny||lv.sticker.pageDone)) setTimeout(()=>{ if(G.state==='result') V.stickerReveal(lv.sticker); },3600);
    if(V&&V.limitReached()) setTimeout(()=>{ if(G.state==='result') V.showRest(); },4200);
  }
}
const BASE_URL=location.origin+location.pathname;
function bdayLink(name,age){ return BASE_URL+'?name='+encodeURIComponent(name)+(age?'&age='+age:''); }
function openWa(text){ window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank','noopener'); }
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast('הקישור הועתק! 📋'); }catch(e){ const ta=document.createElement('textarea'); ta.value=t; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); toast('הקישור הועתק! 📋'); }catch(e2){ toast('לא הצלחנו להעתיק'); } ta.remove(); } }
async function shareScore(){
  const text=`🎉 אספתי ${G.lastScore} כוכבים בשלב ${G.lastLevel} במשחק "אפרתושקה: מסיבת הקסם"! בואו לשחק איתי:`;
  if(navigator.share){ try{ await navigator.share({title:'אפרתושקה: מסיבת הקסם',text,url:BASE_URL}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  openWa(text+' '+BASE_URL);
}

/* ---------- wardrobe ---------- */
let wTab='outfit';
function wardrobe(){ scr('scrWardrobe'); G.state='wardrobe'; renderWardrobe(); }
function renderWardrobe(){
  $('#wStars').textContent='⭐ '+S.stars;
  document.querySelectorAll('#scrWardrobe .tab').forEach(t=>t.classList.toggle('on',t.dataset.tab===wTab));
  const list=wTab==='outfit'?D.OUTFITS:wTab==='hair'?D.HAIRS:D.TRAILS; const box=$('#wItems'); box.innerHTML='';
  for(const it of list){
    const owned=S.owned[wTab].includes(it.id), sel=S.sel[wTab]===it.id;
    const b=document.createElement('button'); b.className='item'+(sel?' sel':'')+(owned?'':' locked');
    const sw=document.createElement('div'); sw.className='sw'; if(it.sw) sw.style.background=it.sw; else { sw.textContent=it.icon; sw.style.background='#fff0f8'; }
    const nm=document.createElement('div'); nm.textContent=it.name; const pr=document.createElement('div'); pr.className='pr'; pr.textContent=owned?(sel?'נבחר':'שלי'):(it.price<0?'🌟 מסע הכוכבים':'🔒 '+it.price+'⭐');
    b.append(sw,nm,pr); b.addEventListener('click',()=>pickItem(it,owned)); box.appendChild(b);
  }
  drawWPreview();
}
function pickItem(it,owned){
  if(!owned&&it.price<0){ toast('את הבגד הזה מקבלים במסע הכוכבים 🌟'); A.sfx('wrong',.4); return; }
  if(!owned){ if(S.stars<it.price){ toast(`צריך עוד ${it.price-S.stars} ⭐`); A.sfx('wrong',.4); return; } S.stars-=it.price; S.owned[wTab].push(it.id); A.sfx('powerup',.7); A.voice('outfit'); confetti(W/2,H*.3,40); }
  else A.sfx('coin',.4,1.2);
  S.sel[wTab]=it.id; save();
  if(wTab!=='trail'){ const k=lookKey()+'|'; Object.keys(sheetCache).forEach(c=>{ if(!c.startsWith(k)) delete sheetCache[c]; }); }
  renderWardrobe(); if(wTab!=='trail') setTimeout(warmSheets,50);
}
function drawWPreview(){
  const c=$('#wCanvas'), g=c.getContext('2d'); g.clearRect(0,0,c.width,c.height); const sh=sheet('front'); if(!sh) return; const h=c.height-10, w=h*sh.width/sh.height; g.drawImage(sh,(c.width-w)/2,5,w,h);
  if(wTab==='trail'){ const t=D.TRAILS.find(x=>x.id===S.sel.trail); g.font='34px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign='center'; for(let i=0;i<5;i++) g.fillText(t.icon,30+i*60,c.height-20-(i%2)*30); }
}

/* ---------- birthday setup ---------- */
let bdAge=0;
function bdayScreen(){ scr('scrBday'); G.state='bday'; $('#bdName').value=BDAY?BDAY.name:''; bdAge=BDAY?BDAY.age:0; document.querySelectorAll('#bdAges button').forEach(b=>b.classList.toggle('on',+b.dataset.age===bdAge)); $('#bdLinkBox').classList.add('hidden'); $('#bdOff').classList.toggle('hidden',!BDAY); }
function readBday(){ const n=cleanName($('#bdName').value); if(!n){ toast('כתבו קודם את השם 🙂'); $('#bdName').focus(); return null; } return {name:n,age:bdAge}; }
function applyBday(b){ BDAY=b; finaleShown=false; P.bdayBalloon=null; buildBdayBalloon(); if(b.age>=3&&b.age<=10) S.age=b.age; else if(b.age>10) S.age=10; else if(b.age>0) S.age=3; save(); try{ history.replaceState(null,'',bdayLink(b.name,b.age)); }catch(e){} }
function buildBdayBalloon(){ if(!BDAY) return; P.bdayBalloon=mk(260,460,(g)=>{ const pos=[[80,120,62],[180,110,62],[130,60,70]]; const cols=['#ff4fa8','#ffd23f','#3fd4ff']; pos.forEach((p,i)=>balloon(g,p[0],p[1],p[2],cols[i],440-p[1]-p[2]*1.15)); fitText(g,BDAY.name,120,46); g.textAlign='center'; g.textBaseline='middle'; g.lineWidth=7; g.strokeStyle='rgba(120,20,80,.8)'; g.strokeText(BDAY.name,130,62); g.fillStyle='#fff'; g.fillText(BDAY.name,130,62); if(V&&V.hasPhoto()) V.drawFace(g,80,140,86); }); }

/* ---------- input ---------- */
let ptr=null;
function canvasX(e){ const r=cvs.getBoundingClientRect(); return e.clientX-r.left; }
function battleColAt(x){ if(!B) return 0; if(B.cols===1) return 0; let bi=0,bd=1e9; for(let i=0;i<B.cols;i++){ const d=Math.abs(x-colX(i)); if(d<bd){bd=d;bi=i;} } return bi; }
cvs.addEventListener('pointerdown',e=>{ A.unlock(); if(G.state==='city'&&V){ const r=cvs.getBoundingClientRect(); V.cityTap(e.clientX-r.left,e.clientY-r.top); return; } if(G.state==='battle'){ battleTap(battleColAt(canvasX(e))); e.preventDefault(); return; } if(G.state!=='run'||G.paused) return; ptr={x:e.clientX,y:e.clientY,used:false}; e.preventDefault(); });
cvs.addEventListener('pointermove',e=>{ if(!ptr||ptr.used) return; const dx=e.clientX-ptr.x, dy=e.clientY-ptr.y, th=Math.max(22,W*.055); if(Math.abs(dx)>th&&Math.abs(dx)>Math.abs(dy)){ moveLane(dx>0?1:-1); ptr.used=true; } else if(Math.abs(dy)>th&&Math.abs(dy)>=Math.abs(dx)){ if(dy<0) jump(); else slide(); ptr.used=true; } });
let lastTap=0;
const endPtr=e=>{ if(ptr&&!ptr.used&&e.type==='pointerup'){ const now=performance.now(); if(now-lastTap<330&&V&&V.tryRide(R)){ lastTap=0; } else { jump(); lastTap=now; } } ptr=null; };
cvs.addEventListener('pointerup',endPtr); cvs.addEventListener('pointercancel',endPtr);
window.addEventListener('keydown',e=>{
  const k=e.key;
  if(G.state==='run'&&!G.paused){ if(k==='ArrowLeft'||k==='a'||k==='A') moveLane(-1); else if(k==='ArrowRight'||k==='d'||k==='D') moveLane(1); else if(k==='ArrowUp'||k===' '||k==='w'||k==='W') jump(); else if(k==='ArrowDown'||k==='s'||k==='S') slide(); else if(k==='Escape'||k==='p') pauseGame(); else if((k==='r'||k==='R'||k==='Enter')&&V) V.tryRide(R); else return; e.preventDefault(); }
  else if(G.state==='battle'&&B){ A.unlock(); const n=B.cols; let c=-1; if(n===1){ if(k.length===1||k.startsWith('Arrow')||k===' ') c=0; } else if(k==='ArrowLeft'||k==='a'||k==='A') c=0; else if(k==='ArrowRight'||k==='d'||k==='D') c=n-1; else if(n===3&&(k==='ArrowDown'||k==='ArrowUp'||k===' '||k==='s'||k==='S')) c=1; if(c>=0){ battleTap(c); e.preventDefault(); } }
  else if(G.state==='run'&&G.paused&&(k==='Escape'||k==='p')) resumeGame();
});
function pauseGame(){ if(G.state!=='run'||G.paused) return; G.paused=true; scr('scrPause'); $('#pSound').textContent=S.sound?'🔊 צליל: פועל':'🔇 צליל: כבוי'; A.suspend(); }
function resumeGame(){ G.paused=false; scr(null); A.resume(); }
document.addEventListener('visibilitychange',()=>{ if(document.hidden){ if(G.state==='run'&&!G.paused) pauseGame(); else A.suspend(); } else { if(!(G.state==='run'&&G.paused)) A.resume(); } });
function setSound(on){ S.sound=on; save(); A.setMuted(!on); updMenu(); $('#pSound').textContent=on?'🔊 צליל: פועל':'🔇 צליל: כבוי'; }

/* ---------- buttons ---------- */
const on=(sel,fn)=>$(sel).addEventListener('click',e=>{ A.unlock(); fn(e); });
buildAges($('#ages'),(a)=>{ S.age=a; save(); updMenu(); });
buildAges($('#bdAges'),(a,b)=>{ bdAge=bdAge===a?0:a; document.querySelectorAll('#bdAges button').forEach(x=>x.classList.toggle('on',+x.dataset.age===bdAge)); },true);
on('#btnPlay',()=>{ A.sfx('powerup',.5); play(); });
on('#btnBday',bdayScreen); on('#btnWardrobe',wardrobe);
on('#btnSound',()=>setSound(!S.sound)); on('#pSound',()=>setSound(!S.sound));
document.querySelectorAll('[data-back]').forEach(b=>b.addEventListener('click',()=>{ A.sfx('coin',.3,.9); goMenu(); }));
document.querySelectorAll('#scrWardrobe .tab').forEach(t=>t.addEventListener('click',()=>{ wTab=t.dataset.tab; renderWardrobe(); }));
on('#btnPause',pauseGame); on('#pResume',resumeGame); on('#pMenu',()=>{ A.stopMusic(.3); goMenu(); });
on('#dTake',()=>{ const d=G.daily; if(d){ S.stars+=d.reward; S.daily={last:todayStr(),streak:d.streak}; save(); G.daily=null; A.sfx('confetti',.8); confetti(W/2,H*.4,80); toast(`+${d.reward} ⭐`); } scr('scrMenu'); updMenu(); });
on('#bdMake',()=>{ const b=readBday(); if(!b) return; applyBday(b); const l=bdayLink(b.name,b.age); $('#bdLink').textContent=l; $('#bdLinkBox').classList.remove('hidden'); $('#bdOff').classList.remove('hidden'); });
on('#bdCopy',()=>copyText($('#bdLink').textContent));
on('#bdWa',()=>{ if(!BDAY) return; openWa(`🎂 יום הולדת שמח ${BDAY.name}! אפרתושקה הכינה לך מסיבת קסם עם בלונים, עוגה וריקודים 🎈 היכנסו לחגוג: ${bdayLink(BDAY.name,BDAY.age)}`); });
on('#bdGo',()=>{ const b=readBday(); if(!b) return; applyBday(b); A.sfx('confetti',.7); play(); });
on('#bdOff',()=>{ BDAY=null; P.bdayBalloon=null; try{ history.replaceState(null,'',BASE_URL); }catch(e){} toast('מצב יום הולדת בוטל'); goMenu(); });
on('#rNext',()=>{ A.sfx('powerup',.5); play(); }); on('#rMenu',goMenu); on('#rShare',shareScore);
on('#rChallenge',()=>{ if(V) V.shareChallenge(G.lastScore||0); }); on('#rCard',()=>{ if(V) V.cardScreen(G.lastScore||0,G.lastLevel||1); }); on('#rLesson',()=>{ if(V&&R) V.lessonScreen(R.world.id); });
on('#btnRide',()=>{ if(V&&G.state==='run'&&!G.paused) V.tryRide(R); }); on('#bdPhoto',()=>{ const n=cleanName($('#bdName').value); if(V){ if(n&&!V.X.profile.name){ V.X.profile.name=n; save(); } V.profileScreen('bday'); } });
on('#fNext',()=>{ A.sfx('powerup',.5); play(); }); on('#fMenu',goMenu); on('#fCard',()=>{ if(V) V.cardScreen(G.lastScore||0,G.lastLevel||1); });
on('#fWa',()=>{ if(!BDAY) return; openWa(`🎂 יום הולדת שמח ${BDAY.name}! 🎉 חגגנו עם אפרתושקה במסיבת הקסם${G.lastScore?` ואספנו ${G.lastScore} כוכבים`:''}! בואו לחגוג גם: ${bdayLink(BDAY.name,BDAY.age)}`); });
$('#bdName').addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); $('#bdGo').click(); } });

/* ---------- loop ---------- */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  let dt=(now-last)/1000; last=now; if(dt>.05) dt=.05; if(dt<0) dt=0;
  G.t+=dt; A.tick(); if(V) V.tick(dt,G.state,G.paused);
  if(shake>0) shake=Math.max(0,shake-dt);
  try{
    if(G.state==='run'){ if(!G.paused){ updRun(dt); updParts(dt); } renderRun(); }
    else if(G.state==='battle'){ updBattle(dt); updParts(dt); renderBattle(); }
    else if(G.state==='result'||G.state==='finale'){ updParts(dt); renderCelebrate(); }
    else if(G.state==='loading'){ drawCover(IMG.menubg); }
    else if(!(V&&V.render(dt))){ updParts(dt); renderMenu(); }
  }catch(err){ console.error(err); }
}

/* ---------- v2 kernel ---------- */
const K={S,save,G,get R(){return R;},get B(){return B;},get W(){return W;},get H(){return H;},get LW(){return LW;},get BASE(){return BASE;},get HOR(){return HOR;},ctx,cvs,D,A,$,IMG,P,mk,loadImg,drawFrame,sheet,SPR:()=>SPR,proj,sx,sy,
  confetti,sparkle,rainConfetti,floatText,starPath,rrect,shade,fitText,toast,scr,goMenu,updMenu,updHud,activatePower,todayStr,cleanName,get BDAY(){return BDAY;},BASE_URL,openWa,updParts,drawParts,
  rebuildBday(){ if(BDAY){ P.bdayBalloon=null; buildBdayBalloon(); } }, bdayScreen(){ bdayScreen(); }, backToResult(){ scr('scrResult'); G.state='result'; }};
try{ if(window.EFV2) V=window.EFV2(K); }catch(err){ console.error('v2 init',err); V=null; }

/* ---------- boot ---------- */
async function boot(){
  if(BDAY){ const inv=$('#bdayInvite'); inv.textContent='🎂 מסיבת יום ההולדת של '+BDAY.name+'!'; inv.classList.remove('hidden'); }
  else if(V&&V.CH()){ const c=V.CH(), inv=$('#bdayInvite'); inv.textContent='⚔ '+c.from+' מאתגר/ת אתכם: נצחו '+c.score+' ⭐!'; inv.classList.remove('hidden'); }
  requestAnimationFrame(frame);
  await loadAll();
  if(BDAY) buildBdayBalloon();
  $('#loadTxt').textContent='הכל מוכן! 🎈'; $('#btnStart').classList.remove('hidden');
  A.setMuted(!S.sound);
  warmSheets();
}
on('#btnStart',async()=>{
  A.setMuted(!S.sound); $('#btnStart').disabled=true;
  try{ await Promise.race([A.decodeOne('v_welcome'),new Promise(r=>setTimeout(r,1200))]); }catch(e){}
  goMenu(); const wd=A.voice('welcome'); A.loadV2&&A.loadV2();
  if(V&&V.CH()){ setTimeout(()=>{ if(G.state==='menu') A.voice('challenge'); },((wd||3)+.4)*1000); }
});
boot();

if(DEBUG){ window.EFR={G,get R(){return R;},get B(){return B;},S,
  gateNow(){ if(R){ R.gateTimer=0; } }, toEnd(){ if(R){ R.dist=R.levelLen-.5; R.gate=null; hideQuiz(); } },
  autoBattle(){ const iv=setInterval(()=>{ if(!B||B.ended||G.state!=='battle'){ if(G.state!=='battle') clearInterval(iv); return; } const now=battleClock(); for(const n of B.notes){ if(!n.j&&Math.abs(n.t-now)<.03) battleTap(n.col); } },10); },
  setLane(l){ if(R) R.p.lane=l; }, finish(){ if(R){ showResult(); } }, V, K,
  addStars(n){ S.stars+=n; save(); updMenu(); }, ride(){ return V&&R&&V.tryRide(R); }, gold(){ if(R&&R.v){ R.v.goldM=99; } }, crashNow(){ if(R){ const o={k:'block',x:R.p.lane,z:0}; if(!(V&&V.absorbCrash(o,R))){ bump(); } } },
  spawn(k){ if(R) addObj({k,x:R.p.lane,z:6,y:.3,c:1}); }, eggsReady(){ if(V){ V.X.eggs.forEach(e=>e.dist=e.need); save(); } } }; }
})();
