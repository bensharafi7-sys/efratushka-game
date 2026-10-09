/* Audio: WebAudio for sfx/voice/battle; media elements for streamed music */
'use strict';
window.EFA = (function(){
const VOICES=['welcome','letsgo','champs','great','amazing','oops','almost','gate','combo','dance','thief','win','lose','level','record','magnet','fly','double','daily','outfit','mazal','bday',
 'c_red','c_blue','c_green','c_yellow','c_pink','c_purple','s_circle','s_square','s_triangle','s_heart','n_1','n_2','n_3','n_4','n_5','a_dog','a_cat','a_lion','a_elephant','a_rabbit','q_odd','q_pattern'];
const V2=["m_done", "journey", "egg_found", "hatch", "p_unicorn", "p_kitten", "p_dragon", "p_panda", "p_puppy", "p_bunny", "pet_love", "pet_level", "city_color", "city_done", "vehicle", "saved", "gold", "upgrade", "wheel", "lucky", "gift", "sticker", "shiny", "album", "h_purim", "h_hanukkah", "h_independence", "h_roshhashana", "h_sukkot", "challenge", "ch_win", "ch_lose", "teach", "yourturn", "teach_ok", "rest", "buddy", "photo", "together","enc1","enc2","enc3","enc4","enc5","enc6","enc7","oops2","oops3","hi_wave","hi_five","hi_five_ok","clap","clap_ok","kiss","thumbs","name_call","pet_hop","pet_cute","pet_scared","pet_go","idle1","idle2","idle3","joke1","joke2","code_ok","code_bad","champs_week","lb_you","install","q_big","welcome2","gate_soon"];
const SFX=['jump','coin','correct','wrong','powerup','confetti','bump'];
const MUSIC=['theme','candy','sky','disco','chip'];
const ROT=['candy','sky','disco','chip'];
let ctx=null, master, musicBus, sfxBus, voiceBus;
const raw={}, buf={}, els={}, elGain={};
let muted=false, curVoice=null, voiceEnd=0, battleRaw=null, battleBuf=null, battleSrc=null, battleT0=0, battlePerf=0;
let cur=null, curName=null, mode=null, rotIdx=0, fading=[];

async function fetchBin(url){const r=await fetch(url); if(!r.ok) throw new Error(url+' '+r.status); return r.arrayBuffer();}
function preload(onProgress){
  const jobs=[];
  VOICES.forEach(v=>jobs.push(['v_'+v,'assets/audio/voice/'+v+'.mp3']));
  SFX.forEach(v=>jobs.push(['s_'+v,'assets/audio/sfx/'+v+'.mp3']));
  jobs.push(['battle','assets/audio/music/battle.mp3']);
  return jobs.map(([k,u])=>fetchBin(u).then(b=>{ if(k==='battle') battleRaw=b; else raw[k]=b; onProgress&&onProgress(); }).catch(e=>{console.warn('audio load',k,e.message); onProgress&&onProgress();}));
}
function makeEls(){
  MUSIC.forEach(m=>{const a=new Audio(); a.src='assets/audio/music/'+m+'.mp3'; a.preload=m==='theme'?'auto':'none'; a.loop=(m==='theme'); els[m]=a;});
}
function unlock(){
  if(ctx){ if(ctx.state==='suspended') ctx.resume(); return; }
  const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return;
  ctx=new AC();
  master=ctx.createGain(); master.connect(ctx.destination); master.gain.value=muted?0:1;
  musicBus=ctx.createGain(); musicBus.gain.value=.55; musicBus.connect(master);
  sfxBus=ctx.createGain(); sfxBus.gain.value=.7; sfxBus.connect(master);
  voiceBus=ctx.createGain(); voiceBus.gain.value=1; voiceBus.connect(master);
  MUSIC.forEach(m=>{ try{ const s=ctx.createMediaElementSource(els[m]); const g=ctx.createGain(); g.gain.value=0; s.connect(g); g.connect(musicBus); elGain[m]=g; }catch(e){ console.warn('mes',e.message);} });
  // silent buffer to unlock iOS
  const b=ctx.createBuffer(1,1,22050), s=ctx.createBufferSource(); s.buffer=b; s.connect(master); s.start(0);
  decodeAll();
}
async function decodeOne(k){
  if(buf[k]||!raw[k]||!ctx) return buf[k];
  const ab=raw[k]; raw[k]=null;
  try{ buf[k]=await new Promise((res,rej)=>{const p=ctx.decodeAudioData(ab,res,rej); if(p&&p.catch) p.catch(rej);}); }catch(e){ console.warn('decode',k); }
  return buf[k];
}
async function decodeAll(){
  for(const s of SFX) await decodeOne('s_'+s);
  for(const v of VOICES) await decodeOne('v_'+v);
}
async function prepBattle(){
  if(battleBuf||!ctx||!battleRaw) return battleBuf;
  const ab=battleRaw; battleRaw=null;
  try{ battleBuf=await new Promise((res,rej)=>{const p=ctx.decodeAudioData(ab,res,rej); if(p&&p.catch) p.catch(rej);}); }catch(e){ console.warn('battle decode'); }
  return battleBuf;
}
function playBuf(k,bus,vol,rate){
  if(!ctx) return null; const b=buf[k]; if(!b){ decodeOne(k); return null; }
  const s=ctx.createBufferSource(); s.buffer=b; if(rate) s.playbackRate.value=rate;
  const g=ctx.createGain(); g.gain.value=vol==null?1:vol; s.connect(g); g.connect(bus); s.start(); return s;
}
function sfx(n,vol,rate){ return playBuf('s_'+n,sfxBus,vol,rate); }
let v2loading=null;
function loadV2(){ if(v2loading) return v2loading; v2loading=(async()=>{ for(const v of V2){ const k='v_'+v; if(raw[k]||buf[k]) continue; try{ raw[k]=await fetchBin('assets/audio/voice/'+v+'.mp3'); if(ctx) await decodeOne(k); }catch(e){} } })(); return v2loading; }
const VARS={great:['great','enc1','enc2','enc4','enc7'],amazing:['amazing','enc3','enc5','enc4'],champs:['champs','enc6','enc3','enc5'],oops:['oops','oops2','oops3'],almost:['almost','oops2','oops3'],gate:['gate','gate_soon']};
const lastVar={};
function variant(n){ const l=VARS[n]; if(!l) return n; let c, g=0; do{ c=l[Math.floor(Math.random()*l.length)]; }while(c===lastVar[n]&&g++<8); lastVar[n]=c; return c; }
function voice(n,opts){
  opts=opts||{}; if(!opts._lazy&&!opts.exact) n=variant(n);
  if(!ctx) return 0;
  const k='v_'+n;
  if(!buf[k]&&V2.includes(n)&&!opts._lazy){ const t0=performance.now(); (raw[k]?Promise.resolve():fetchBin('assets/audio/voice/'+n+'.mp3').then(b=>{ if(!buf[k]) raw[k]=b; })).then(()=>decodeOne(k)).then(()=>{ if(buf[k]&&performance.now()-t0<2500) voice(n,Object.assign({},opts,{_lazy:true})); }).catch(()=>{}); return 0; }
  if(curVoice && !opts.overlap){ try{curVoice.stop();}catch(e){} curVoice=null; }
  const s=playBuf('v_'+n,voiceBus,1);
  if(!s) return 0;
  curVoice=s; const d=s.buffer.duration; voiceEnd=ctx.currentTime+d;
  // duck music
  const t=ctx.currentTime; musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(.2,t,.08); musicBus.gain.setTargetAtTime(.55,t+d,.3);
  s.onended=()=>{ if(curVoice===s) curVoice=null; };
  return d;
}
function setGain(m,v,time){
  if(elGain[m]&&ctx){ const g=elGain[m].gain, t=ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(g.value,t); g.linearRampToValueAtTime(v,t+(time||.01)); }
  else if(els[m]){ els[m].volume=Math.max(0,Math.min(1,v)); }
}
function startTrack(m,fadeIn){
  const a=els[m]; if(!a) return;
  if(cur&&cur!==a){ stopTrack(curName,1.2); }
  cur=a; curName=m; a.currentTime=0; try{ a.playbackRate=rate; }catch(e){} setGain(m,0,.01); setGain(m,1,fadeIn||1.0);
  const p=a.play(); if(p&&p.catch) p.catch(()=>{});
}
function stopTrack(m,t){
  const a=els[m]; if(!a) return; setGain(m,0,t||.5);
  const tok={}; a._tok=tok; setTimeout(()=>{ if(a._tok===tok && a!==cur){ a.pause(); } },(t||.5)*1000+80);
  if(a===cur){ cur=null; curName=null; }
}
function menuMusic(){ mode='menu'; if(curName!=='theme') startTrack('theme',1.2); }
function gameMusic(world){ mode='game'; rotIdx=Math.max(0,ROT.indexOf(world)); startTrack(ROT[rotIdx],1.2); }
function stopMusic(t){ mode=null; if(curName) stopTrack(curName,t||.6); }
function tick(){
  if(mode==='game'&&cur&&cur.duration&&!cur.paused&&cur.currentTime>cur.duration-1.6){
    rotIdx=(rotIdx+1)%ROT.length; startTrack(ROT[rotIdx],1.5);
  }
  if(mode==='game'&&cur&&cur.ended){ rotIdx=(rotIdx+1)%ROT.length; startTrack(ROT[rotIdx],1.0); }
}
// battle track (precise clock)
function startBattle(){
  if(!ctx||!battleBuf){ battlePerf=performance.now(); battleSrc=null; return; }
  const s=ctx.createBufferSource(); s.buffer=battleBuf; const g=ctx.createGain(); g.gain.value=.9; s.connect(g); g.connect(musicBus);
  const t=ctx.currentTime+.08; s.start(t); battleT0=t+(ctx.outputLatency||ctx.baseLatency||0); battleSrc={s,g}; battlePerf=0;
}
function battleTime(){ if(battleSrc) return ctx.currentTime-battleT0; return (performance.now()-battlePerf)/1000; }
function stopBattle(){ if(battleSrc){ const {s,g}=battleSrc; const t=ctx.currentTime; g.gain.setTargetAtTime(0,t,.25); try{s.stop(t+1.2);}catch(e){} battleSrc=null; } }
function setMuted(m){ muted=m; if(master&&ctx) master.gain.setTargetAtTime(m?0:1,ctx.currentTime,.05); if(!ctx) MUSIC.forEach(k=>els[k].muted=m); }
function suspend(){ if(ctx&&ctx.state==='running') ctx.suspend(); if(cur) cur.pause(); }
function resume(){ if(ctx&&ctx.state==='suspended') ctx.resume(); if(cur){ const p=cur.play(); if(p&&p.catch) p.catch(()=>{});} }
let rate=1;
function setRate(r){ rate=r; if(cur){ try{ cur.playbackRate=r; }catch(e){} } }
function voiceBusy(){ return ctx? ctx.currentTime<voiceEnd : false; }
return {VARS,VOICES,V2,loadV2,setRate,SFX,preload,makeEls,unlock,sfx,voice,menuMusic,gameMusic,stopMusic,tick,prepBattle,startBattle,battleTime,stopBattle,setMuted,suspend,resume,voiceBusy,decodeOne,get ctx(){return ctx;}};
})();
