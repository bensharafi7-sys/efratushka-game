/* זומי בומי – helper in the runner (surprise box, trampoline save, gate helper for 3-5, dance-battle buddy, banter).
   Wraps the v2 extension factory; brief, side-of-track appearances only. */
(function(){
'use strict';
const orig=window.EFV2; if(!orig) return;
window.EFV2=function(K){ const V=orig(K); try{ install(V,K); }catch(e){ console.error('zumi init',e); } return V; };
function install(V,K){
  const A=K.A, TAU=Math.PI*2;
  const rnd=(a,b)=>a+Math.random()*(b-a), pick=a=>a[Math.floor(Math.random()*a.length)];
  const VO=['zr_lidpop','zr_trampoline','zr_gate_hint','zr_gate_secret','zr_dance_go','zr_dance_goof','zr_cheer1','zr_cheer2','zr_cheer3','zr_join','zr_stars','zr_oops','zr_thief','zr_win','zr_bday'];
  if(A.V2) VO.forEach(v=>{ if(!A.V2.includes(v)) A.V2.push(v); });
  /* lazy sprite sheets */
  const SP={}; let loading=null;
  function load(){ if(loading) return loading; loading=fetch('assets/zumi/zumi.json').then(r=>r.json()).then(m=>Promise.all(Object.keys(m).map(n=>new Promise(res=>{ const i=new Image(); i.onload=()=>{ SP[n]=Object.assign({img:i},m[n]); res(); }; i.onerror=()=>res(); i.src='assets/zumi/'+m[n].file; })))).catch(()=>{}); return loading; }
  function draw(ctx,n,f,cx,by,h,flip,alpha){ const s=SP[n]; if(!s) return; f=((Math.floor(f)%s.n)+s.n)%s.n; const w=h*s.fw/s.fh;
    ctx.save(); if(alpha!=null) ctx.globalAlpha=alpha; ctx.translate(cx,by); if(flip) ctx.scale(-1,1); ctx.drawImage(s.img,(f%s.cols)*s.fw,Math.floor(f/s.cols)*s.fh,s.fw,s.fh,-w/2,-h,w,h); ctx.restore(); }
  function say(n,delay,ifFree){ setTimeout(()=>{ if(K.G.state!=='run'&&K.G.state!=='battle') return; if(ifFree&&A.voiceBusy&&A.voiceBusy()) return; A.voice(n,{exact:true}); },(delay||0)*1000); }
  function bubble(txt,x,y){ K.floatText(txt,x,y,'#bfe8ff',28); }
  let sessionJoined=false;
  /* ---------- run start ---------- */
  const _start=V.onRunStart;
  V.onRunStart=function(R){ _start(R); load();
    R.zu={act:null, boxes:[R.levelLen*rnd(.15,.3)].concat(Math.random()<.6?[R.levelLen*rnd(.55,.7)]:[]), tramp:1, intro:sessionJoined&&Math.random()<.7?-1:rnd(2.5,4), gateSeen:0, cheerT:0};
    sessionJoined=true; };
  function busyLane(R){ return R.gate||R.ending>0||(R.ix&&R.ix.cur); }
  /* ---------- update ---------- */
  const _upd=V.updRun;
  V.updRun=function(R,dt,dz){ _upd(R,dt,dz); const z=R.zu; if(!z) return; z.cheerT-=dt;
    const a=z.act; if(a){ a.t+=dt; if(a.z!=null) a.z-=dz*(a.move===false?0:1);
      if(a.k==='box'&&!a.popped&&a.t>1.1){ a.popped=true; popItem(R,a); }
      if(a.k==='gate'){ const g=R.gate; if(!g||g.done){ z.act=null; } else { a.z=g.z; } }
      if(a.t>a.dur) z.act=null; }
    if(z.intro>0){ z.intro-=dt; if(z.intro<=0&&!z.act&&!busyLane(R)){ z.act={k:'hi',t:0,dur:3.2,z:8+R.speed*1.6,side:1}; say(K.BDAY?'zr_bday':'zr_join'); say(K.BDAY?'mazal':'buddy',2.6,true); } }
    if(!z.act&&z.boxes.length&&R.dist>z.boxes[0]&&!busyLane(R)&&R.pw.fly<=0){ z.boxes.shift(); z.act={k:'box',t:0,dur:2.6,z:7.5+R.speed*1.1,side:Math.random()<.5?-1:1,popped:false}; say('zr_lidpop'); A.sfx('powerup',.5,1.3); }
    /* gate helper for ages 3-5 */
    const g=R.gate; if(R.age<=5&&g&&g.phase==='go'&&g.z!=null&&g.z<34&&(!z.act||z.act.k!=='gate'||z.act.g!==g)&&(!z.act||z.act.k!=='tramp')){
      const lane=g.q.correct-1; const trip=Math.random()<.3;
      z.act={k:'gate',g,t:0,dur:99,z:g.z,side:lane>0?1:-1,lane,trip}; z.gateSeen++;
      if(trip) say('zr_oops',.2); else if(z.gateSeen===1) say('zr_gate_hint',.2,true); else if(Math.random()<.35) say('zr_gate_secret',.2,true); }
  };
  function popItem(R,a){ const px=K.sx(a.side*1.55,a.z), py=K.sy(a.z)-K.LW*K.proj(a.z)*1.4; K.confetti(px,py,30); A.sfx('confetti',.6);
    const eggs=V.X&&V.X.eggs?V.X.eggs.length:3; const r=Math.random(); let o;
    if(r<.4) o={k:'pw',type:pick(['magnet','fly','double'])}; else if(r<.6&&eggs<3) o={k:'egg',c:Math.floor(Math.random()*5)}; else o={k:'gift'};
    const lane=R.p.lane; Object.assign(o,{x:lane,z:Math.max(4,a.z-1.5),y:.35}); R.objs.push(o); bubble(o.k==='pw'?'כוח קסם!':o.k==='egg'?'ביצה!':'הפתעה!',px,py-20);
    say(o.k==='egg'?'egg_found':'lucky',1.6,true); }
  /* ---------- trampoline save (once per run) ---------- */
  const _abs=V.absorbCrash;
  V.absorbCrash=function(o,R){ if(_abs(o,R)) return true; const z=R.zu; if(!z||z.tramp<=0||R.ending>0) return false;
    z.tramp--; o.hit=true; const p=R.p; p.vy=10.5; p.y=.05; p.slide=0; z.act={k:'tramp',t:0,dur:1.3,z:.25,lane:p.lane,move:false};
    A.sfx('jump',.9,.7); A.voice('zr_trampoline',{exact:true}); const x=K.sx(p.x,0); K.floatText('הוֹפָּה!',x,K.BASE-K.LW*2.4,'#bfe8ff',40); K.sparkle(x,K.BASE-K.LW*.4,'#bfe8ff',18);
    setTimeout(()=>{ if(K.G.state==='run'&&!(A.voiceBusy&&A.voiceBusy())) A.voice('lucky'); },2100); return true; };
  /* gate highlight */
  const _gh=V.gateHint;
  V.gateHint=function(R,i){ if(_gh(R,i)) return 1; const z=R.zu, a=z&&z.act; return a&&a.k==='gate'&&R.gate&&i===R.gate.q.correct&&(!a.trip||a.t>1.4)&&R.gate.z<26?1:0; };
  /* combo cheers */
  const _og=V.onGate;
  V.onGate=function(R,ok,q){ _og(R,ok,q); const z=R.zu; if(z&&ok&&R.combo>=2&&z.cheerT<=0&&Math.random()<.45){ z.cheerT=20; say(pick(['zr_cheer1','zr_cheer2','zr_cheer3']),1.6,true); } };
  /* ---------- drawing (with the player group, always at the side of the road) ---------- */
  const _dc=V.drawCompanions;
  V.drawCompanions=function(R){ _dc(R); const z=R.zu, a=z&&z.act; if(!a) return; const ctx=K.ctx, LW=K.LW;
    if(a.k==='tramp'){ const x=K.sx(a.lane,0), by=K.BASE+LW*.12, h=LW*1.25; const f=3+Math.min(3,a.t*10); draw(ctx,'z_jump',f,x,by,h,false,Math.min(1,(a.dur-a.t)*3)); return; }
    if(a.z==null||a.z<-1) return; const s=K.proj(a.z), px=LW*s, side=a.side||1; const x=K.sx(side*1.6,a.z), by=K.sy(a.z); const h=px*(a.k==='gate'?2.1:1.55);
    const inA=Math.min(1,a.t*4), out=a.k==='gate'?1:Math.min(1,(a.dur-a.t)*3); const al=Math.min(inA,out); const rise=(1-inA)*h*.6;
    ctx.save(); ctx.fillStyle='rgba(60,0,60,.16)'; ctx.beginPath(); ctx.ellipse(x,by,px*.35,px*.08,0,0,TAU); ctx.fill(); ctx.restore();
    if(a.k==='hi') draw(ctx,'z_idle',a.t*16,x,by+rise,h,side<0,al);
    else if(a.k==='box') draw(ctx,'z_lidpop',Math.min(23,a.t*12),x,by+rise,h*1.12,side<0,al);
    else if(a.k==='gate'){ if(a.trip&&a.t<1.4) draw(ctx,'z_oops',Math.min(23,a.t*18),x,by,h,side<0,al);
      else { draw(ctx,'z_celebrate',a.t*14,x,by,h,side<0,al);
        if(R.gate&&R.gate.z<26){ const cx=K.sx(a.lane,a.z), ty=by-px*3.05+Math.sin(K.G.t*8)*px*.12; ctx.save(); ctx.font=`900 ${Math.round(px*.55)}px Rubik, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('👇',cx,ty); ctx.restore(); } } }
  };
  /* ---------- dance battle buddy ---------- */
  let goof={t:-1,n:0,next:6};
  V.drawBattleZumi=function(ctx,x,baseY,efH,now,t,B){ if(!SP.z_dance){ load(); return; } const h=efH*.56;
    if(!B||!B.started){ goof={t:-1,n:0,next:rnd(5,8)}; } else if(!B.ended){ goof.next-=1/60; if(goof.t<0&&goof.next<=0){ goof.t=0; goof.n++; if(goof.n===1) A.voice('zr_dance_goof',{exact:true,overlap:true}); } }
    if(goof.t>=0){ goof.t+=1/60; draw(ctx,'z_oops',Math.min(23,goof.t*20),x,baseY,h,false); if(goof.t>1.3){ goof.t=-1; goof.next=rnd(7,11); } return; }
    if(B&&B.ended&&B.win) draw(ctx,'z_celebrate',t*14,x,baseY,h,true); else draw(ctx,'z_dance',(B&&B.started?now:t)*12,x,baseY,h,true); };
  const _be=V.onBattleEnd;
  V.onBattleEnd=function(R,win,perfect){ _be(R,win,perfect); if(win) setTimeout(()=>{ if(!(A.voiceBusy&&A.voiceBusy())) A.voice('zr_win',{exact:true}); },3200); };
  V.ZU={load,SP,get act(){ const R=K.R; return R&&R.zu&&R.zu.act; },box(){ const R=K.R; if(R&&R.zu){ R.zu.act=null; R.zu.boxes=[0]; } },gate(){ const R=K.R; if(R){ R.age=4; R.gateTimer=0; } }};
}
})();
