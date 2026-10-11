/* אפרתושקה – "juice" layer: cheap bloom (neon glow), speed-line bursts, result rank badge + star bar, gameplay highlight clip.
   Quality-scaled: everything optional is skipped when K.QLOW() (weak phones). No new voice lines. */
'use strict';
window.EFJUICE=function(K){
const J={}, $=K.$, TAU=Math.PI*2, clamp=(x,a,b)=>x<a?a:x>b?b:x;
const mkc=(w,h)=>{ const c=document.createElement('canvas'); c.width=w; c.height=h; return c; };

/* ---------- bloom: downsample canvas twice (≈ blur), square it (soft threshold), add back ---------- */
let b1=null,b2=null;
J.bloom=function(strength){ const c=K.cvs, w1=Math.max(8,c.width>>2), h1=Math.max(8,c.height>>2), w2=Math.max(4,c.width>>4), h2=Math.max(4,c.height>>4);
  if(!b1||b1.width!==w1||b1.height!==h1){ b1=mkc(w1,h1); b2=mkc(w2,h2); }
  const g1=b1.getContext('2d'), g2=b2.getContext('2d');
  g1.globalCompositeOperation='copy'; g1.drawImage(c,0,0,w1,h1);
  g2.globalCompositeOperation='copy'; g2.drawImage(b1,0,0,w2,h2); g2.globalCompositeOperation='multiply'; g2.drawImage(b2,0,0);
  const ctx=K.ctx; ctx.save(); ctx.setTransform(1,0,0,1,0,0); ctx.globalCompositeOperation='lighter'; ctx.imageSmoothingEnabled=true;
  ctx.globalAlpha=strength; ctx.drawImage(b2,0,0,c.width,c.height); ctx.globalAlpha=strength*.45; ctx.drawImage(b1,0,0,c.width,c.height); ctx.restore(); };

/* ---------- speed-line burst (streaks / speed-ups) ---------- */
J.speedLines=function(ctx,a,col){ if(a<=0) return; const W=K.W,H=K.H,cx=W/2,cy=K.HOR,t=K.G.t,M=Math.max(W,H); ctx.save(); ctx.globalCompositeOperation='lighter'; ctx.strokeStyle=col; ctx.lineCap='round';
  for(let i=0;i<22;i++){ const ang=(i*2.39996+Math.floor(t*30)*.9)%TAU; const ca=Math.cos(ang), sa=Math.sin(ang); const r0=M*(.42+((t*3.4+i*.37)%1)*.32), r1=r0+M*(.1+.08*((i*7)%3)); if(cy+sa*r0<K.HOR*1.05) continue;
    ctx.globalAlpha=a*(.35+.4*((i*13)%5)/5); ctx.lineWidth=1.2+((i*5)%3); ctx.beginPath(); ctx.moveTo(cx+ca*r0,cy+sa*r0); ctx.lineTo(cx+ca*r1,cy+sa*r1); ctx.stroke(); } ctx.restore(); };

/* ---------- rank badge + star bar on the results screen ---------- */
const TIERS={kids:[[0,'מתחילים','✨'],[50,'כוכב עולה','⭐'],[100,'כוכב מסיבה','🌟'],[160,'סופרסטאר','💫'],[240,'אגדת מסיבה','👑']],
             adult:[[0,'רוקי','🎧'],[300,'רוקדים','🔥'],[600,'כוכבי רחבה','⚡'],[1000,'מלכי הניאון','💎'],[1600,'אגדה','👑']]};
J.rankOf=(score,adult)=>{ const T=TIERS[adult?'adult':'kids']; let i=0; for(let k=0;k<T.length;k++) if(score>=T[k][0]) i=k; return {i,T,cur:T[i],next:T[i+1]||null}; };
let rk=null;
J.resultFx=function(score,adult){ const panel=$('#scrResult .panel'); if(!panel) return;
  if(!rk){ rk=document.createElement('div'); rk.id='rRank'; rk.className='rrank'; rk.innerHTML='<div class="rkb"><i></i><b></b></div><div class="rkr"><div class="rkbar"><span></span></div><small></small></div>'; $('#rTitle').insertAdjacentElement('afterend',rk); }
  const r=J.rankOf(score,adult); rk.dataset.tier=r.i; rk.querySelector('i').textContent=r.cur[2]; rk.querySelector('b').textContent=r.cur[1];
  const lo=r.cur[0], hi=r.next?r.next[0]:lo, pct=r.next?clamp((score-lo)/(hi-lo),0,1):1;
  rk.querySelector('small').textContent=r.next?`עוד ${hi-score} ${adult?'נקודות':'⭐'} לדרגת "${r.next[1]}" ${r.next[2]}`:'הגעתם לדרגה הגבוהה ביותר! 👑';
  const bar=rk.querySelector('.rkbar span'); bar.style.transition='none'; bar.style.width='0%'; void bar.offsetWidth;
  rk.classList.remove('stamp'); void rk.offsetWidth; rk.classList.add('stamp');
  setTimeout(()=>{ bar.style.transition=''; bar.style.width=Math.round(pct*100)+'%'; },650);
  setTimeout(()=>{ if(K.G.state==='result'){ const bb=rk.getBoundingClientRect(), cb=K.cvs.getBoundingClientRect(); K.confetti(bb.left-cb.left+bb.width*.2,bb.top-cb.top+bb.height/2,r.i>=3?70:40,.8); K.A.sfx('coin',.5,1.3); } },420);
  J.hlButton(); };

/* ---------- highlight clip: rolling ~5s segments of the canvas (MediaRecorder) ---------- */
const HL={rec:null,prev:null,blob:null,stream:null,mime:null,busy:false};
function pickMime(){ if(!window.MediaRecorder||!MediaRecorder.isTypeSupported) return null; for(const m of ['video/mp4;codecs=avc1','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']) if(MediaRecorder.isTypeSupported(m)) return m; return null; }
J.hlAllowed=()=>!!(K.cvs.captureStream&&pickMime())&&!K.QLOW()&&!(navigator.deviceMemory&&navigator.deviceMemory<3)&&!/[?&]nohl/.test(location.search);
function seg(){ const r=new MediaRecorder(HL.stream,{mimeType:HL.mime,videoBitsPerSecond:2200000}); const ch=[]; r.ondataavailable=e=>{ if(e.data&&e.data.size) ch.push(e.data); };
  r._t0=performance.now(); r._p=new Promise(res=>{ r.onstop=()=>res({blob:new Blob(ch,{type:HL.mime.split(';')[0]}),dur:(performance.now()-r._t0)/1000}); }); r.start(1000); return r; }
J.hlStart=function(){ J.hlStop(true); HL.blob=null; HL.prev=null; if(!J.hlAllowed()) return; try{ HL.mime=pickMime(); HL.stream=K.cvs.captureStream(30); HL.rec=seg(); }catch(e){ HL.rec=null; } };
J.hlTick=function(){ const r=HL.rec; if(!r||r.state!=='recording') return; if(K.QLOW()){ J.hlStop(true); return; }
  if(performance.now()-r._t0>5600){ r.stop(); r._p.then(s=>{ HL.prev=s; }); try{ HL.rec=seg(); }catch(e){ HL.rec=null; } } };
J.hlStop=function(discard){ const r=HL.rec; HL.rec=null; const fin=()=>{ if(HL.stream){ HL.stream.getTracks().forEach(t=>t.stop()); HL.stream=null; } };
  if(!r||r.state==='inactive'){ fin(); if(discard){ HL.prev=null; } return Promise.resolve(HL.blob); }
  r.stop(); return r._p.then(s=>{ fin(); if(discard){ HL.prev=null; return null; } const best=s.dur>=3||!HL.prev?s:HL.prev; HL.blob=best.blob&&best.blob.size>2000?best.blob:null; HL.prev=null; J.hlButton(); return HL.blob; }); };
J.hl=()=>HL;
J.hlButton=function(){ const b=$('#rHL'); if(!b) return; b.textContent=HL.blob?'🎬 שתפו הילייט':'📸 שתפו כרטיס'; };
async function shareHL(){ K.A.unlock&&K.A.unlock(); K.A.sfx('coin',.3);
  if(!HL.blob){ if(K.G.lastDaily&&K.AD&&K.AD.openDailyCard) K.AD.openDailyCard(); else if(K.V&&K.V.cardScreen) K.V.cardScreen(K.G.lastScore,K.G.lastLevel); return; }
  const ext=/mp4/.test(HL.blob.type)?'mp4':'webm', f=new File([HL.blob],'efratushka-highlight.'+ext,{type:HL.blob.type});
  const text=(K.G.lastAdult&&K.AD?K.AD.shareText(K.G.lastScore,K.G.lastHC):'🎉 תראו איזה ריצה ב"אפרתושקה: מסיבת הקסם"!')+' '+K.BASE_URL;
  if(navigator.canShare&&navigator.canShare({files:[f]})){ try{ await navigator.share({files:[f],title:'אפרתושקה – הילייט',text}); return; }catch(e){ if(e&&e.name==='AbortError') return; } }
  const u=URL.createObjectURL(HL.blob); const a=document.createElement('a'); a.href=u; a.download=f.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(u),8000); K.toast&&K.toast('הסרטון נשמר 🎬'); }
const hb=$('#rHL'); if(hb) hb.addEventListener('click',shareHL);
J.shareHL=shareHL;
return J;
};
