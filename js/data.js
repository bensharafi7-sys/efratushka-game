/* אפרתושקה: מסיבת הקסם – game data */
'use strict';
window.EFD = (function(){
const rnd=(a,b)=>a+Math.random()*(b-a);
const ri=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};

const WORLDS=[
 {id:'candy',name:'ארץ הממתקים',music:'candy',sky:['#ff9fd2','#ffe3f2'],hill:['#ff7cc0','#ffb0dc'],ground:['#ffa8d6','#ff98ce'],road:['#fff6fb','#ffe2f2'],edge:['#ff4fa8','#ffffff'],lane:'#ffb3dd',accent:'#ff4fa8',
  boss:{name:'גנב הצבעים',acc:'none',bag:'#c9a36a'}},
 {id:'sky',name:'שמי הבלונים',music:'sky',sky:['#5fc4ff','#dff5ff'],hill:['#ffffff','#e4f4ff'],ground:['#9fd8ff','#8ccfff'],road:['#ffffff','#eaf6ff'],edge:['#3f9bff','#ffffff'],lane:'#b8dcff',accent:'#2f7bff',
  boss:{name:'גנב הצבעים המעופף',acc:'propeller',bag:'#7fc8ff'}},
 {id:'disco',name:'דיסקו הקשת',music:'disco',sky:['#1b0838','#5a1a8a'],hill:['#3a1068','#5b1d96'],ground:['#2a0c4e','#33105d'],road:['#3d1670','#4e1f8a'],edge:['#ffcf3f','#ff4fa8'],lane:'#8f5bff',accent:'#ffcf3f',
  boss:{name:'גנב הצבעים הדיסקו',acc:'shades',bag:'#b06bff'}},
];

const OUTFITS=[
 {id:'pink',name:'ורוד קסם',price:0,dh:0,sw:'#ff4fa8'},
 {id:'lilac',name:'סגול לילך',price:30,dh:-45,sw:'#a35cff'},
 {id:'blue',name:'כחול ים',price:60,dh:-110,sw:'#3c6cff'},
 {id:'teal',name:'טורקיז',price:90,dh:-150,sw:'#22d3d3'},
 {id:'mint',name:'ירוק מנטה',price:120,dh:-195,sw:'#3fdc7a'},
 {id:'gold',name:'זהב',price:160,dh:80,sw:'#ffc93c'},
 {id:'red',name:'אדום לוהט',price:200,dh:28,sw:'#ff3b4e'},
];
const HAIRS=[
 {id:'brown',name:'חום טבעי',price:0,hue:null,sw:'#a9672f'},
 {id:'berry',name:'ורוד',price:50,hue:{h:330,sm:1,vm:1.05},sw:'#e0479b'},
 {id:'violet',name:'סגול',price:90,hue:{h:280,sm:.9,vm:1.05},sw:'#8e44d6'},
 {id:'ginger',name:"ג'ינג'י",price:130,hue:{h:5,sm:1.05,vm:1},sw:'#d2552a'},
];
const TRAILS=[
 {id:'sparkle',name:'נצנצים',price:0,icon:'✨'},
 {id:'hearts',name:'לבבות',price:40,icon:'💖'},
 {id:'stars',name:'כוכבים',price:60,icon:'⭐'},
 {id:'bubbles',name:'בועות',price:80,icon:'🫧'},
 {id:'rainbow',name:'קשת',price:110,icon:'🌈'},
 {id:'notes',name:'תווים',price:140,icon:'🎵'},
];

const COLORS=[
 {id:'red',name:'אדום',hex:'#ff3b4e'},{id:'blue',name:'כחול',hex:'#2f7bff'},{id:'green',name:'ירוק',hex:'#2ecc55'},
 {id:'yellow',name:'צהוב',hex:'#ffd23f'},{id:'pink',name:'ורוד',hex:'#ff6fc8'},{id:'purple',name:'סגול',hex:'#9b59ff'}];
const SHAPES=[{id:'circle',name:'עיגול'},{id:'square',name:'ריבוע'},{id:'triangle',name:'משולש'},{id:'heart',name:'לב'}];
const NUMW=['','אחד','שניים','שלושה','ארבעה','חמישה'];

/* each question: {prompt, voice, options:[3], correct, pre?} ; option kinds: balloon,shape,count,emoji,text */
function threeWith(correct, pool, eq){
  const others=shuffle(pool.filter(x=>!eq(x,correct))).slice(0,2);
  const opts=shuffle([correct,...others]);
  return {options:opts, correct:opts.findIndex(x=>eq(x,correct))};
}
/* v3: light, glanceable gate questions. option kinds: balloon, shape, count, img, text, num */
const ICONS={dog:'כלב',cat:'חתול',lion:'אריה',elephant:'פיל',rabbit:'ארנב',apple:'תפוח',banana:'בננה',strawberry:'תות',grapes:'ענבים',car:'מכונית',bus:'אוטובוס',plane:'מטוס',boat:'סירה'};
const ICAT={animal:['dog','cat','lion','elephant','rabbit'],fruit:['apple','banana','strawberry','grapes'],vehicle:['car','bus','plane','boat']};
function distinctNums(ans,lo,hi,spread){ const s=new Set([ans]); let g=0; while(s.size<3&&g++<80){ const v=ans+ri(1,spread)*(Math.random()<.5?-1:1); if(v>=lo&&v<=hi) s.add(v); } let k=1; while(s.size<3){ if(ans+k<=hi) s.add(ans+k); else s.add(Math.max(lo,ans-k)); k++; } return shuffle([...s]); }
function numQ(prompt,ans,lo,hi,spread){ const ns=distinctNums(ans,lo,hi,spread); const opts=ns.map(n=>({k:'num',t:String(n)})); return {prompt,voice:null,options:opts,correct:ns.indexOf(ans),ltr:true}; }
const Q={
 color(){const c=pick(COLORS); const r=threeWith(c,COLORS,(a,b)=>a.id===b.id);
   return {prompt:`איפה הבלון ה${c.name}?`,voice:'c_'+c.id,options:r.options.map(x=>({k:'balloon',color:x.hex})),correct:r.correct};},
 shape(){const s=pick(SHAPES); const r=threeWith(s,SHAPES,(a,b)=>a.id===b.id); const col=pick(COLORS).hex;
   return {prompt:`איפה ה${s.name}?`,voice:'s_'+s.id,options:r.options.map(x=>({k:'shape',shape:x.id,color:col})),correct:r.correct};},
 count(max){const pool=[1,2,3,4,5].slice(0,max||3); const n=pick(pool); const r=threeWith(n,pool.length>=3?pool:[1,2,3],(a,b)=>a===b);
   const col=pick(COLORS).hex;
   return {prompt:n===1?'איפה יש בלון אחד?':`איפה יש ${NUMW[n]} בלונים?`.replace('שניים','שני'),voice:'n_'+n,options:r.options.map(x=>({k:'count',n:x,color:col})),correct:r.correct};},
 animal(){const a=pick(ICAT.animal); const r=threeWith(a,ICAT.animal,(x,y)=>x===y);
   return {prompt:`איפה ה${ICONS[a]}?`,voice:'a_'+a,options:r.options.map(x=>({k:'img',id:x})),correct:r.correct};},
 add(max){const a=ri(1,max-1), b=ri(1,max-a); return Object.assign(numQ(`${a} + ${b}`,a+b,0,max,2),{eq:true});},
 sub(max){const a=ri(3,max), b=ri(1,Math.min(5,a-1)); return Object.assign(numQ(`${a} − ${b}`,a-b,0,max,2),{eq:true});},
 mul(){const a=ri(2,5), b=ri(2,5); return Object.assign(numQ(`${a} × ${b}`,a*b,1,30,3),{eq:true});},
 bigger(max){ const ns=distinctNums(ri(3,max),1,max,Math.max(3,Math.round(max/3))); const big=Math.max(...ns); return {prompt:'איזה מספר הכי גדול?',voice:'q_big',options:ns.map(n=>({k:'num',t:String(n)})),correct:ns.indexOf(big)}; },
 odd(){const ks=shuffle(Object.keys(ICAT)); const A=shuffle(ICAT[ks[0]]).slice(0,2), B=pick(ICAT[ks[1]]);
   const opts=shuffle([...A,B]).map(id=>({k:'img',id}));
   return {prompt:'מה יוצא דופן?',voice:'q_odd',options:opts,correct:opts.findIndex(o=>o.id===B)};},
 pattern(){ // drawn shapes/colors pattern, AB or ABC
   const useShape=Math.random()<.5; const cols=shuffle(COLORS).slice(0,3), shp=shuffle(SHAPES).slice(0,3);
   const items=[0,1,2].map(i=>useShape?{k:'shape',shape:shp[i].id,color:cols[0].hex}:{k:'balloon',color:cols[i].hex});
   const p=pick([[0,1],[0,1,2],[0,0,1]]); const seq=[]; for(let i=0;i<5;i++) seq.push(items[p[i%p.length]]);
   const ans=p[5%p.length]; const order=shuffle([0,1,2]); const opts=order.map(i=>items[i]);
   return {prompt:'מה בא אחר כך?',seq,voice:'q_pattern',options:opts,correct:order.indexOf(ans)};},
};

Object.keys(Q).forEach(k=>{ const f=Q[k]; Q[k]=(...a)=>Object.assign(f(...a),{cat:k}); });

function ageGroup(age){return age<=5?0:age<=8?1:2;}
function makeQuestion(age){
  const g=ageGroup(age);
  if(g===0){ return (age<=3? pick([Q.color,Q.color,Q.shape,Q.animal,Q.animal]) : age===4? pick([Q.color,Q.shape,Q.animal,()=>Q.count(3)]) : pick([Q.color,Q.shape,Q.animal,()=>Q.count(5)]))(); }
  if(g===1){ return pick([()=>Q.add(age<=6?6:10),()=>Q.add(10),()=>Q.bigger(10),Q.odd,...(age>=8?[()=>Q.sub(10)]:[Q.odd])])(); }
  return pick([()=>Q.add(20),Q.mul,Q.mul,()=>Q.bigger(50),Q.pattern,Q.pattern])();
}
const AGECFG=[
 {speed:10.5,levelSecs:55,gate:[24,30],gateLead:1.0,cols:1,obst:.45,approach:2.0,gateSlow:.58},
 {speed:13,levelSecs:70,gate:[26,32],gateLead:.9,cols:2,obst:.75,approach:1.7,gateSlow:.66},
 {speed:15,levelSecs:80,gate:[24,30],gateLead:.85,cols:3,obst:1,approach:1.45,gateSlow:.74},
];

return {WORLDS,OUTFITS,HAIRS,TRAILS,COLORS,SHAPES,ICONS,ICAT,makeQuestion,ageGroup,AGECFG,rnd,ri,pick,shuffle};
})();
