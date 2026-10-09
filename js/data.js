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
const ANIMALS=[{id:'dog',name:'כלב',e:'🐶'},{id:'cat',name:'חתול',e:'🐱'},{id:'lion',name:'אריה',e:'🦁'},{id:'elephant',name:'פיל',e:'🐘'},{id:'rabbit',name:'ארנב',e:'🐰'}];
const CATS={fruit:['🍎','🍌','🍇','🍓','🍊','🍉'],animal:['🐶','🐱','🐰','🐻','🐸','🐵'],vehicle:['🚗','🚌','🚲','✈️','🚀','🚂'],sweet:['🍭','🍬','🧁','🍩','🍪','🎂'],flower:['🌸','🌻','🌷','🌼']};
const NUMW=['','אחד','שניים','שלושה','ארבעה','חמישה'];
const ORD=['ראשון','שני','שלישי','רביעי'];

const RIDDLES=[
 ['יש לי ידיים אבל אני לא מוחא כפיים. מה אני?','שעון',['כפפה','רובוט']],
 ['יש לי שיניים אבל אני לא נושך. מה אני?','מסרק',['כריש','תנין']],
 ['אני מלא חורים ובכל זאת מחזיק מים. מה אני?','ספוג',['דלי','כוס']],
 ['יש לי קלידים אבל אני לא פותח דלתות. מה אני?','פסנתר',['מנעול','שוער']],
 ['ככל שאני מייבשת – אני נהיית רטובה יותר. מה אני?','מגבת',['שמש','רוח']],
 ['יש לי עין אחת אבל אני לא רואה. מה אני?','מחט',['פיראט','מצלמה']],
 ['אני נשבר ברגע שאומרים את שמי. מה אני?','שקט',['זכוכית','ביצה']],
 ['אני הולך איתך לכל מקום ונעלם בחושך. מה אני?','צל',['נעל','כובע']],
 ['יש לי צוואר אבל אין לי ראש. מה אני?','בקבוק',['ג׳ירפה','צעיף']],
 ['יש לי כובע ורגל אחת, ואני גדלה ביער. מה אני?','פטרייה',['ליצן','כיסא']],
 ['מתוקה, עם נרות, וחוגגים איתי ימי הולדת. מה אני?','עוגה',['עפיפון','עגבנייה']],
 ['מה ההפך של "גבוה"?','נמוך',['רחב','חזק']],
 ['מה ההפך של "שמח"?','עצוב',['כועס','עייף']],
 ['מה ההפך של "פתוח"?','סגור',['שבור','ריק']],
 ['מה ההפך של "מהר"?','לאט',['קרוב','שקט']],
 ['מה ההפך של "יום"?','לילה',['ערב','שמש']],
 ['איזו מילה מתחרזת עם "בלון"?','חלון',['כדור','שולחן']],
 ['איזו מילה מתחרזת עם "פרח"?','ירח',['עץ','שמש']],
 ['איזו מילה מתחרזת עם "כוכב"?','שוכב',['ענן','שמיים']],
 ['איזו מילה מתחרזת עם "דג"?','חג',['ים','סירה']],
 ['כמה אותיות יש במילה "מסיבה"?','5',['4','6']],
 ['כמה אותיות יש במילה "בלון"?','4',['3','5']],
 ['איזו מילה מתחילה באות ב׳?','בלון',['עוגה','כוכב']],
 ['איזו מילה מסתיימת באות ה׳?','מתנה',['כדור','שעון']],
 ['מי גר בכוורת?','דבורה',['נמלה','ציפור']],
 ['באיזה חודש יש הכי מעט ימים?','פברואר',['מאי','אוגוסט']],
];

/* each question: {prompt, voice, options:[3], correct, pre?} ; option kinds: balloon,shape,count,emoji,text */
function threeWith(correct, pool, eq){
  const others=shuffle(pool.filter(x=>!eq(x,correct))).slice(0,2);
  const opts=shuffle([correct,...others]);
  return {options:opts, correct:opts.findIndex(x=>eq(x,correct))};
}
function numOpts(ans, spread){
  const s=new Set([ans]);
  let guard=0;
  while(s.size<3 && guard++<50){const d=ri(1,spread)*(Math.random()<.5?-1:1); const v=ans+d; if(v>=0) s.add(v);}
  while(s.size<3) s.add(ans+s.size+1);
  const opts=shuffle([...s]).map(n=>({k:'text',t:String(n)}));
  return {options:opts, correct:opts.findIndex(o=>o.t===String(ans))};
}

const Q={
 color(){const c=pick(COLORS); const r=threeWith(c,COLORS,(a,b)=>a.id===b.id);
   return {prompt:`איפה הבלון ה${c.name}?`,voice:'c_'+c.id,options:r.options.map(x=>({k:'balloon',color:x.hex})),correct:r.correct};},
 shape(){const s=pick(SHAPES); const r=threeWith(s,SHAPES,(a,b)=>a.id===b.id); const cols=shuffle(COLORS);
   return {prompt:`איפה ה${s.name}?`,voice:'s_'+s.id,options:r.options.map((x,i)=>({k:'shape',shape:x.id,color:cols[i].hex})),correct:r.correct};},
 count(){const n=ri(1,5); const pool=[1,2,3,4,5]; const r=threeWith(n,pool,(a,b)=>a===b);
   const col=pick(COLORS).hex;
   return {prompt:n===1?'איפה יש בלון אחד?':`איפה יש ${NUMW[n]} בלונים?`.replace('שניים','שני'),voice:'n_'+n,options:r.options.map(x=>({k:'count',n:x,color:col})),correct:r.correct};},
 animal(){const a=pick(ANIMALS); const r=threeWith(a,ANIMALS,(x,y)=>x.id===y.id);
   return {prompt:`איפה ה${a.name}?`,voice:'a_'+a.id,options:r.options.map(x=>({k:'emoji',e:x.e})),correct:r.correct};},
 add(max){const a=ri(1,max-1), b=ri(1,max-a); const r=numOpts(a+b,3); return {prompt:`${a} + ${b} = ?`,voice:null,...r,ltr:true};},
 sub(max){const a=ri(3,max), b=ri(1,a-1); const r=numOpts(a-b,3); return {prompt:`${a} − ${b} = ?`,voice:null,...r,ltr:true};},
 odd(){const ks=shuffle(Object.keys(CATS)); const A=shuffle(CATS[ks[0]]).slice(0,2), B=pick(CATS[ks[1]]);
   const opts=shuffle([...A.map(e=>({k:'emoji',e})),{k:'emoji',e:B}]);
   return {prompt:'מה יוצא דופן?',voice:'q_odd',options:opts,correct:opts.findIndex(o=>o.e===B)};},
 pattern(hard){const set=shuffle(pick([CATS.fruit,CATS.sweet,CATS.animal,['🔴','🔵','🟡','🟢','🟣']])).slice(0,3);
   const pats=hard?[[0,1,2],[0,0,1],[0,1,1],[0,1,2,1]]:[[0,1],[0,1],[0,0,1],[0,1,1]];
   const p=pick(pats); const len=hard?7:5; const seq=[]; for(let i=0;i<len;i++) seq.push(set[p[i%p.length]]);
   const ans=set[p[len%p.length]]; const opts=shuffle(set).map(e=>({k:'emoji',e}));
   return {prompt:'מה בא אחר כך?',promptHtml:`<span class="emo" dir="rtl">${seq.join(' ')} ❓</span>`,voice:'q_pattern',options:opts,correct:opts.findIndex(o=>o.e===ans)};},
 mul(){const a=ri(2,10), b=ri(2,10); const r=numOpts(a*b,a>5?6:4); return {prompt:`${a} × ${b} = ?`,voice:null,...r,ltr:true};},
 div(){const b=ri(2,9), q=ri(2,10); const r=numOpts(q,3); return {prompt:`${b*q} ÷ ${b} = ?`,voice:null,...r,ltr:true};},
 three(){const a=ri(10,40), b=ri(5,30), c=ri(2,a+b-1); const r=numOpts(a+b-c,4); return {prompt:`${a} + ${b} − ${c} = ?`,voice:null,...r,ltr:true};},
 numseq(){const t=pick(['add','mul','sub']); let s,ans;
   if(t==='add'){const st=ri(1,10),d=ri(2,9); s=[0,1,2,3].map(i=>st+i*d); ans=st+4*d;}
   else if(t==='mul'){const st=ri(1,3),m=pick([2,3]); s=[0,1,2,3].map(i=>st*Math.pow(m,i)); ans=st*Math.pow(m,4);}
   else {const d=ri(2,7),st=d*4+ri(5,30); s=[0,1,2,3].map(i=>st-i*d); ans=st-4*d;}
   const r=numOpts(ans,Math.max(3,Math.round(ans*0.15))); return {prompt:'מה המספר הבא?',promptHtml:`<span dir="ltr">${s.join(', ')}, ?</span>`,voice:null,...r};},
 memory(){const set=shuffle(pick([CATS.fruit,CATS.animal,CATS.vehicle,CATS.sweet])).slice(0,4); const pos=ri(0,3);
   const ans=set[pos]; const others=shuffle(set.filter(e=>e!==ans)).slice(0,2); const opts=shuffle([ans,...others]).map(e=>({k:'emoji',e}));
   return {pre:{html:`זכרו את הסדר!<br><span class="emo" dir="rtl">${set.join(' ')}</span>`,secs:3.6},prompt:`מה היה ה${ORD[pos]} בתור?`,hint:'(סופרים מימין לשמאל)',voice:null,options:opts,correct:opts.findIndex(o=>o.e===ans)};},
 riddle(){const [q,a,d]=pick(RIDDLES); const opts=shuffle([a,...d]).map(t=>({k:'text',t}));
   return {prompt:q,small:true,voice:null,options:opts,correct:opts.findIndex(o=>o.t===a)};},
};

function ageGroup(age){return age<=5?0:age<=8?1:2;}
function makeQuestion(age){
  const g=ageGroup(age);
  if(g===0){ return (age<=3? pick([Q.color,Q.color,Q.shape,Q.animal]) : pick([Q.color,Q.shape,Q.count,Q.animal]))(); }
  if(g===1){ const max=age<=6?10:20; return pick([()=>Q.add(max),()=>Q.add(max),()=>Q.sub(max),Q.odd,()=>Q.pattern(age>=8)])(); }
  return pick([Q.mul,Q.div,Q.three,Q.numseq,Q.memory,Q.riddle,Q.riddle,()=>Q.pattern(true)])();
}

const AGECFG=[
 {speed:10.5,levelSecs:55,gate:[15,20],gateLead:1.0,cols:1,obst:.45,approach:2.0},
 {speed:13,levelSecs:70,gate:[15,22],gateLead:.9,cols:2,obst:.75,approach:1.7},
 {speed:15,levelSecs:80,gate:[15,21],gateLead:.85,cols:3,obst:1,approach:1.45},
];

return {WORLDS,OUTFITS,HAIRS,TRAILS,COLORS,SHAPES,makeQuestion,ageGroup,AGECFG,rnd,ri,pick,shuffle};
})();
