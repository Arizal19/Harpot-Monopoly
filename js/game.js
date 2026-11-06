/* =====================================================================
   HARPOT MONOPOLY: STATE + ATURAN + HUD + JARINGAN
   State (P pemain, O pemilik, H level 1-3, cur giliran, ph fase) dan semua aturan main ada di sini.
   Dimuat sebelum js/view.js. ===================================================================== */
const G={b:'#7a4a2b',l:'#6fb7d6',p:'#c45a96',o:'#d98a2b',r:'#b3343c',y:'#d9c24a',g:'#2f7a5a',n:'#2b3f9e'};
/* Peta aktif (js/map2.js): MAPSEL 1 = Peta Harpot (36 petak, bawaan), 2 = Maps HD (37 petak, lore HP_TILES_LORE) */
const START_M=MAPSEL===2?MAP2.money:1000,GO=MAPSEL===2?MAP2.go:200,JNAME=MAPSEL===2?'Azkaban':'Menara Hukuman';
if(MAPSEL===2)document.body.classList.add('map2');
{const b=document.getElementById('map'+MAPSEL);if(b)b.classList.add('on')}
const ICON={S:'✨',J:'🔒',F:'🌿',W:'⚡',C:'📜',T:'💰',R:'🧹',U:'💡'};
const COL=['#e0b84a','#e0606b','#5fb0e0','#7fcf9a'],EMO=['🦉','🐉','🔮','🪄'];
const raw=(MAPSEL===2?MAP2.raw:"Mulai +200|S;Gudang Ramuan|b|60;Dana Umum|C;Lorong Kuali|b|70;Ruang Cermin|l|100;Menara Petir|l|110;Perpustakaan Kuno|l|120;Menara Hukuman|J;Gua Kristal|p|130;Roda Keberuntungan|F;Reruntuhan Obor|p|140;Dapur Ramuan|p|150;Hutan Berbisik|o|160;Kesempatan|C;Observatorium|o|170;Bank Naga|o|190;Padang Rumput|r|200;Kandang Griffin|r|210;Ke Penjara|W;Taman Bunga Ajaib|r|220;Sapu Utara|R|200;Pasar Tongkat|y|240;Toko Jubah|y|250;Sumur Cahaya|U|150;Dana Umum|C;Menara Sunyi|g|270;Kastil Elderoak|g|300;Gerbang Jebakan|X;Takhta Arkana|n|400;Denda Sihir|T|75;Kedai Madu Api|y|280;Menara Jam|g|320;Taman Peri|g|300;Sapu Selatan|R|200;Pajak Mantra|T|100;Bengkel Ramuan|b|90").split(';').map(s=>{const a=s.split('|');return a.length===2?{n:a[0],c:a[1],p:0}:{n:a[0],c:a[1],p:+a[2]||0}});
const N=raw.length,JAIL=raw.findIndex(t=>t.c==='J');
const POS=MAPSEL===2?MAP2.POS:[[50.0, 83.66], [45.53, 79.81], [41.06, 75.96], [36.59, 72.11], [32.12, 68.26], [27.65, 64.42], [23.18, 60.57], [18.71, 56.72], [14.24, 52.87], [9.77, 49.02], [14.24, 45.03], [18.71, 41.03], [23.18, 37.04], [27.65, 33.04], [32.12, 29.05], [36.59, 25.05], [41.06, 21.06], [45.53, 17.07], [50.0, 13.07], [54.48, 16.7], [58.96, 20.33], [63.44, 23.97], [67.93, 27.6], [72.41, 31.23], [76.89, 34.86], [81.37, 38.49], [85.85, 42.12], [90.33, 45.75], [85.85, 49.96], [81.37, 54.18], [76.89, 58.39], [72.41, 62.6], [67.93, 66.81], [63.44, 71.02], [58.96, 75.24], [54.48, 79.45]];
const C=[["Warisan dari bibi penyihir: terima 100G",100],["Ramuan salah campur: bayar 50G",-50],["Hadiah turnamen: terima 150G",150],["Sapu terbang membawamu ke Mulai (+200G)","go"],["Terkena kutukan: masuk Menara Hukuman","jail"],["Mundur 3 petak","back"],["Pajak sekolah: bayar 100G",-100],["Menemukan harta karun: terima 80G",80]];
let P=[],O={},cur=0,ph='roll',dbl=0,log=[],d=[1,1];
let rolling=false,hl=-1,me=-1,role='',conn=null,peer=null,iv=0,H={},bt=-1,sel=-1,dr=false,wh=0;
let lastBoardH='',lastHudH='',lastHl=-1,lastBt=-1,muted=false,AC=null,pv={},gameMotion=null;
let EV=null,evSeq=0,lastEv=0,evT=0,botT=0,botKey='',gaugeValue=0,gaugeDir=1,gaugeRAF=0,gaugeOn=false;
let PXQ=[],pxSeq=0,lastPx=0,jailT=0,sumT=0,sumT2=0;
const BAG={dana:[],kesempatan:[]};
const EM=['✨','🧪','📜','⚗️','💰','🧹','🌿','📜','⭐','💎','⛓️','📚','⚡','🪞','🖼️','🧹','🌲','📜','🌫️','🌉','🎡','🔭','📜','🦅','🏟️','🧹','🪄','🧥','💡','🍯','⚡','🐉','🕯️','📜','🕰️','🧹','📜','🏰','💸','👑'];
const WH=[['+200G',200],['+100G',100],['+50G',50],['-100G',-100],['+300G',300],['-50G',-50]];
const AB={'🦉':'Kurir: +50G saat lewat Mulai','🐉':'Naga: sewa diterima +20%','🔮':'Peramal: biaya bangun -25%','🪄':'Tongkat: sewa dibayar -20%'};
const CHR=[
{id:'deya',n:'Deya Louvre',r:'SSSR',lim:1,ab:'Archmagus Agung: +100G lewat Mulai, sewa diterima +25%, sewa dibayar -25%, biaya bangun -25%, 25% peluang bebas sewa (Patronus Rusa)',m:{go:100,recv:.25,pay:.25,build:.25,free:.25}},
{id:'albus',n:'Albus Dumbledore',r:'SSR',ab:'Kepala Sekolah: biaya bangun -35%, bonus Roda +100G. Permen Lemon: 20% peluang +60G di awal giliran.',m:{build:.35,wheel:100,lemon:.2}},
{id:'voldemort',n:'Lord Voldemort',r:'SSR',ab:'Penguasa Kegelapan: sewa diterima +35%, harga beli -10%. Horcrux: sekali per game menolak bangkrut (sisa 150G).',m:{recv:.35,buy:.1,horcrux:1}},
{id:'snape',n:'Severus Snape',r:'SSR',ab:'Master Ramuan: sewa dibayar -30%, pajak, denda, dan Jebakan dikurangi 50%.',m:{pay:.3,tax:.5}},
{id:'minerva',n:'Minerva McGonagall',r:'SSR',ab:'Wakil Kepala: +80G lewat Mulai, biaya bangun -20%. Transfigurasi: hukuman penjara hanya 1 giliran.',m:{go:80,build:.2,jail1:1}},
{id:'bellatrix',n:'Bellatrix Lestrange',r:'SSR',ab:'Pengikut Setia: sewa diterima +30%, +40G lewat Mulai. Cruciatus: 20% peluang sewa yang diterima menjadi 2x.',m:{recv:.3,go:40,dbl:.2}},
{id:'draco',n:'Draco Malfoy',r:'SR',ab:'Pewaris: harga beli -15%',m:{buy:.15}},
{id:'ron',n:'Ron Weasley',r:'SR',ab:'Setia: sewa dibayar -15%',m:{pay:.15}},
{id:'remus',n:'Remus Lupin',r:'SR',ab:'Lembut: pajak/denda -40%',m:{tax:.4}},
{id:'sirius',n:'Sirius Black',r:'SR',ab:'Pemberontak: sewa diterima +15%',m:{recv:.15}},
{id:'tonks',n:'Nymphadora Tonks',r:'SR',ab:'Metamorf: Roda +120G',m:{wheel:120}},
{id:'gilderoy',n:'Gilderoy Lockhart',r:'SR',ab:'Selebriti: +60G lewat Mulai',m:{go:60}},
{id:'dolores',n:'Dolores Umbridge',r:'SR',ab:'Inkuisitor: biaya bangun -20%',m:{build:.2}}
];
const mod=(p,k)=>(p&&p.ch>=0&&CHR[p.ch].m[k])||0;
const av=p=>p.ch>=0?`<img class="av" src="img/chars/${CHR[p.ch].id}.jpg" alt="">`:p.e;
const pw=p=>p.ch>=0?`<img class="pw" style="border-color:${p.k}" src="img/chars/${CHR[p.ch].id}.jpg" alt="">`:p.e;
const FACE=[[4],[0,8],[0,4,8],[0,2,6,8],[0,2,4,6,8],[0,2,3,5,6,8]];
const die=n=>[...Array(9)].map((_,k)=>`<b${FACE[n-1].includes(k)?' class="p"':''}></b>`).join('');
const HAS=new Map();
for(let i=0;i<0;i++){
  const ex=['webp','jpg','png'];
  const t=k=>{if(k>2)return;const m=new Image();m.onload=()=>{HAS.set(i,ex[k]);if(P.length&&ph!=='busy')draw()};m.onerror=()=>t(k+1);m.src='img/'+i+'.'+ex[k]};
  t(0);
}
const $=id=>document.getElementById(id);
const xy=i=>i<=10?[10,10-i]:i<20?[20-i,0]:i<=30?[0,i-20]:[i-30,10];
const say=t=>{log.unshift(t);log=log.slice(0,6)};

function begin(n,opts={}){
  P=[];for(let i=0;i<n;i++)P.push({n:(opts.bots&&i>0?'Bot ':'Penyihir ')+(i+1),e:EMO[i],k:COL[i],m:START_M,pos:0,jail:0,out:false,ch:-1,bot:!!(opts.bots&&i>0),pref:['voldemort','snape','bellatrix'][i-1]});
  O={};cur=0;ph='pick';dbl=0;hl=-1;rolling=false;H={};bt=-1;sel=-1;dr=false;wh=0;EV=null;botKey='';PXQ=[];BAG.dana=[];BAG.kesempatan=[];clearTimeout(jailT);log=['Pilih karakter masing-masing.'];
  $('start').hidden=true;$('board').hidden=false;draw();
}
function pay(a,amt,to){
  const p=P[a];p.m-=amt;if(to!=null)P[to].m+=amt;
  if(p.m<0){if(to!=null)P[to].m+=p.m;bust(a,to)}
}
function bust(a,to){
  const p=P[a];
  if(mod(p,'horcrux')&&!p.hx){p.hx=1;p.m=150;say(p.n+' memakai Horcrux dan lolos dari bangkrut (sisa 150G).');px(a,'Horcrux!');ev('skill','Horcrux Aktif!',p.n+' menolak bangkrut satu kali. Sisa koin 150G.',{icon:'🗝️'});return}
  p.out=true;p.m=0;say(p.n+' bangkrut!');
  for(const k in O)if(O[k]===a){delete H[k];if(to!=null)O[k]=to;else delete O[k]}
  if(P.filter(x=>!x.out).length===1)ph='win';
}
function rent(i){
  const t=raw[i],o=O[i];
  if(t.c==='R')return 25*raw.filter((x,j)=>x.c==='R'&&O[j]===o).length;
  if(t.c==='U')return (d[0]+d[1])*(raw.filter((x,j)=>x.c==='U'&&O[j]===o).length>1?10:4);
  const full=raw.every((x,j)=>x.c!==t.c||O[j]===o);
  return Math.ceil(t.p/8)*[1,1,3,10][H[i]||0];
}
function diceFor(t){if(!t)return[1+Math.random()*6|0,1+Math.random()*6|0];const lo=Math.max(1,t-6),hi=Math.min(6,t-1),a=lo+Math.floor(Math.random()*(hi-lo+1));return[a,t-a]}
async function roll(w=me,pre){
  if(!gate('roll',w,pre)||ph!=='roll')return;
  pre=Number.isInteger(pre)&&pre>=2&&pre<=12?pre:0;   /* total dari bar dadu; 0 = acak */
  const p=P[cur];ph='busy';rolling=true;hl=-1;bt=-1;sel=-1;draw();
  await sl(1200);
  d=diceFor(pre);rolling=false;dr=true;draw();await sl(900);dr=false;
  const s=d[0]+d[1],db=d[0]===d[1];
  if(p.jail){
    if(db){p.jail=0;say(p.n+' lolos dengan angka kembar!')}
    else if(--p.jail>0){say(p.n+' masih terkurung ('+p.jail+' giliran lagi).');return next()}
    else{say(p.n+' membayar 50G untuk keluar.');pay(cur,50);if(P[cur].out)return next()}
    dbl=0;
  }else if(db){if(++dbl===3){say('Tiga angka kembar! '+p.n+' dikurung.');return send()}}
  else dbl=0;
  draw();await sl(250);
  for(let i=0;i<s;i++){p.pos=(p.pos+1)%N;if(!p.pos){const g=GO+mod(p,'go');p.m+=g;say(p.n+' melewati Mulai: +'+g+'G.');if(mod(p,'go'))px(cur,'Bonus Mulai +'+mod(p,'go')+'G')}draw();await sl(170)}
  land();
}
function land(){
  const p=P[cur],t=raw[p.pos];ph='act';hl=p.pos;
  if(t.c==='W'){say(p.n+' memasuki Gerbang Penjara!');return send()}
  if(t.c==='F')return spinWheel(p);
  if(t.c==='X')return trap(p);
  if(t.c==='T'){const t0=t.p,tx=Math.round(t.p*(1-mod(p,'tax')));if(tx<t0)px(cur,'Hemat '+(t0-tx)+'G');say(p.n+' membayar '+tx+'G ('+t.n+').');pay(cur,tx);return fin()}
  if(t.c==='C')return drawCard(p,t);
  if(t.p){
    const o=O[p.pos];
    if(o===undefined){ph='buy';say(p.n+' tiba di '+t.n+' ('+t.p+'G).');return draw()}
    if(o!==cur){
      const fr=mod(p,'free');
      if(p.shield>0){p.shield--;say(p.n+' memakai Perisai Sewa di '+t.n+'.');ev('skill','Perisai Sewa Aktif',p.n+' bebas membayar sewa '+t.n+'.',{icon:'🛡️'})}
      else if(fr&&Math.random()<fr){say(p.n+' bebas sewa di '+t.n+' berkat skill karakter.');ev('skill',CHR[p.ch].n+' — Skill Aktif','Patronus Rusa Zamrud melindungi '+p.n+': sewa '+t.n+' dibebaskan!',{icon:'🦌'})}
      else{
        const base=rent(p.pos),r1=Math.round(base*(1+mod(P[o],'recv')));
        let r=Math.round(r1*(1-mod(p,'pay')));
        if(r1>base)px(o,'Sewa +'+(r1-base)+'G');
        if(r<r1)px(cur,'Hemat '+(r1-r)+'G');
        const cr=mod(P[o],'dbl');if(cr&&Math.random()<cr){r*=2;px(o,'Cruciatus x2')}
        say(p.n+' membayar sewa '+r+'G ke '+P[o].n+'.');pay(cur,r,o);
        const cst=2*t.p;                                     /* ambil alih: bayar 2x harga petak setelah membayar sewa */
        if(ph!=='win'&&!P[cur].out&&G[t.c]&&(H[p.pos]||0)<3&&P[cur].m>=cst){ph='take';say(p.n+' bisa mengambil alih '+t.n+' seharga '+cst+'G (2x).');return draw()}
      }
    }
  }
  fin();
}
/* ===== efek pasif karakter (teks melayang di pion) ===== */
function px(k,t){PXQ.push({id:++pxSeq,k,t});if(PXQ.length>4)PXQ.shift()}
function turnStart(p){const lm=mod(p,'lemon');if(lm&&Math.random()<lm){p.m+=60;say(p.n+' menemukan Permen Lemon: +60G.');px(cur,'Permen Lemon +60G')}}

/* ===== petak spesial ===== */
function spinWheel(p){
  wh=1;ph='busy';say(p.n+' memutar Roda Keberuntungan…');draw();
  sl(1900).then(()=>{
    const idx=Math.random()*WHEEL.length|0,w=WHEEL[idx];wh=0;let bonus=0;
    if(w.m>0){bonus=mod(p,'wheel');p.m+=w.m+bonus;if(bonus)px(cur,'Bonus Roda +'+bonus+'G')}
    else if(w.m<0)pay(cur,-w.m);
    else if(w.x==='roll')dbl=Math.max(dbl,1);
    else if(w.x==='shield')p.shield=(p.shield||0)+1;
    const det=w.m>0?'Kamu mendapat +'+w.m+'G'+(bonus?' (+'+bonus+'G bonus karakter)':'')+'.':w.m<0?'Kamu kehilangan '+(-w.m)+'G.':w.x==='roll'?'Kamu boleh melempar dadu sekali lagi setelah ini.':'Kamu mendapat 1 Perisai Sewa: satu kali bebas membayar sewa.';
    say(p.n+' dapat '+w.t+'!');
    ev('wheel','Roda Keberuntungan: '+w.t,det,{icon:'🎡',list:WHEEL.map((x,i)=>({t:x.t,on:i===idx,k:x.k}))});
    fin();
  });
}
function trap(p){
  const tot=TRAP.reduce((s,x)=>s+x.w,0);let r=Math.random()*tot,i=0;for(;i<TRAP.length-1;i++){r-=TRAP[i].w;if(r<0)break}
  const tr=TRAP[i];let amt=Math.min(Math.max(p.m,0),Math.max(10,Math.round(p.m*tr.pct)));
  const red=mod(p,'tax');if(red){const a2=Math.round(amt*(1-red));if(amt>a2)px(cur,'Hemat '+(amt-a2)+'G');amt=a2}
  say(p.n+' terkena jebakan '+tr.n+': -'+amt+'G ('+Math.round(tr.pct*100)+'% koin).');
  ev('trap','JEBAKAN '+tr.n.toUpperCase()+'!','Kehilangan '+amt+'G ('+Math.round(tr.pct*100)+'% dari koinmu).',{icon:'🕳️',meter:{i,n:TRAP.map(x=>x.n)}});
  pay(cur,amt);fin();
}
function pullCard(dk){
  if(!BAG[dk].length){BAG[dk]=DECKS[dk].cards.slice();for(let i=BAG[dk].length-1;i>0;i--){const j=Math.random()*(i+1)|0;[BAG[dk][i],BAG[dk][j]]=[BAG[dk][j],BAG[dk][i]]}}
  return BAG[dk].pop();
}
function tileIdx(n){return n==='START'?raw.findIndex(t=>t.c==='S'):raw.findIndex(t=>t.n===n)}
function warp(p,to,fwd){
  if(fwd&&to<p.pos){const g=GO+mod(p,'go');p.m+=g;say(p.n+' melewati Mulai: +'+g+'G.');if(mod(p,'go'))px(cur,'Bonus Mulai +'+mod(p,'go')+'G')}
  p.pos=to;hl=to;
}
function drawCard(p,t){
  const dk=t.n==='Kesempatan'?'kesempatan':'dana',D=DECKS[dk],c=pullCard(dk);
  say(p.n+' menarik kartu '+D.name+': '+c.t);
  ev(dk,D.name+': '+c.t,c.x,{icon:D.icon});
  switch(c.f){
    case 'money':if(c.v>0)p.m+=c.v;else pay(cur,-c.v);break;
    case 'collectAll':P.forEach((q,k)=>{if(k!==cur&&!q.out&&ph!=='win')pay(k,c.v,cur)});break;
    case 'payAll':P.forEach((q,k)=>{if(k!==cur&&!q.out&&!p.out&&ph!=='win')pay(cur,c.v,k)});break;
    case 'repair':{let n=0,l=0;for(const k in O)if(O[k]===cur){(H[k]||0)>=3?l++:n+=(H[k]||0)}const amt=n*c.h+l*c.l;say(p.n+' membayar renovasi '+amt+'G ('+n+' rumah, '+l+' Landmark).');if(amt)pay(cur,amt);break}
    case 'passJail':p.passJail=(p.passJail||0)+1;break;
    case 'shield':p.shield=(p.shield||0)+1;break;
    case 'freeBuild':p.freeBuild=1;break;
    case 'extra':dbl=Math.max(dbl,1);break;
    case 'jail':return send();
    case 'moveTo':case 'moveBack':case 'moveFwd':case 'nearestR':{
      let to,fwd=true;
      if(c.f==='moveTo')to=tileIdx(c.to);
      else if(c.f==='moveBack'){to=(p.pos+N-c.v)%N;fwd=false}
      else if(c.f==='moveFwd')to=(p.pos+c.v)%N;
      else for(let s=1;s<=N;s++){const i=(p.pos+s)%N;if(raw[i].c==='R'){to=i;break}}
      if(to===undefined||to===p.pos)break;
      warp(p,to,fwd);ph='busy';draw();sl(1000).then(()=>land());return;
    }
  }
  fin();
}
function fin(){if(ph!=='win')ph='after';draw()}
function buy(w=me){
  if(!gate('buy',w)||ph!=='buy')return;
  const p=P[cur],t=raw[p.pos];
  const pr=Math.round(t.p*(1-mod(p,'buy')));if(p.m<pr){say('Koin tidak cukup untuk membeli '+t.n+'.');return draw()}
  p.m-=pr;if(pr<t.p)px(cur,'Diskon '+(t.p-pr)+'G');O[p.pos]=cur;H[p.pos]=1;bt=p.pos;say(p.n+' membeli '+t.n+' dan langsung membangun Rumah 1.');fin();
}
function skip(w=me){if(!gate('skip',w)||ph!=='buy')return;say(P[cur].n+' tidak membeli '+raw[P[cur].pos].n+'.');fin()}
function send(){
  const p=P[cur];
  if(p.passJail>0){p.passJail--;dbl=0;say(p.n+' memakai Kartu Bebas Penjara!');ev('skill','Kartu Bebas Penjara','Hukuman penjara dibatalkan untuk '+p.n+'.',{icon:'🔑'});return fin()}
  p.pos=JAIL;p.jail=mod(p,'jail1')?1:2;dbl=0;hl=JAIL;
  say(p.n+' DIPENJARA! Tidak bisa bergerak '+p.jail+' giliran.');
  ev('jail','DIPENJARA!',p.n+' terkurung di '+JNAME+' dan tidak bisa bergerak selama '+p.jail+' giliran.',{icon:'⛓️'});
  next();
}
function jailTick(){
  if(role==='guest'||ph!=='jailturn')return;
  const p=P[cur];p.jail--;
  if(p.jail<=0)say(p.n+' dibebaskan dari penjara dan bisa bergerak lagi.');
  next();
}
function end(w=me){
  if(!gate('end',w)||ph!=='after')return;
  if(dbl&&!P[cur].out&&!P[cur].jail){ph='roll';say(P[cur].n+' lempar lagi!');draw()}
  else next();
}
function next(){
  if(ph!=='win'){
    dbl=0;do cur=(cur+1)%P.length;while(P[cur].out);ph='roll';say('Giliran '+P[cur].n+'.');
    if(P[cur].jail>0){ph='jailturn';say(P[cur].n+' masih di penjara: giliran dilewati (sisa '+P[cur].jail+').');draw();clearTimeout(jailT);jailT=setTimeout(jailTick,1600);return}
    turnStart(P[cur]);
  }
  draw();
}
function draw(){
  const tiles=raw.map((t,i)=>{
    const[r,c]=xy(i),o=O[i];
    const here=P.map((p,k)=>!p.out&&p.pos===i?`<span class="${k===cur?'hop':''}" style="filter:drop-shadow(0 0 4px ${p.k})">${pw(p)}</span>`:'').join('');
    return `<div title="${t.n}" onclick="openTileModal(${i})" class="t${i===hl?' hl':''}${i===sel?' sel':''}${HAS.has(i)?' im':''}" style="left:${POS[i][0]}%;top:${POS[i][1]}%;${HAS.has(i)?`background:linear-gradient(#0000 35%,#000c),url(img/${i}.${HAS.get(i)}) center/contain no-repeat,#16254a;`:''}${o!==undefined?'box-shadow:inset 0 0 0 3px '+P[o].k+',inset 0 0 16px '+P[o].k:''}">${G[t.c]?`<i style="background:${G[t.c]}">${hs(i)}</i>`:''}${o!==undefined&&t.p&&t.c!=='T'?`<u class="fl" style="--c:${P[o].k};background-image:${P[o].ch>=0?`url(img/chars/${CHR[P[o].ch].id}.jpg)`:'none'}"></u>`:''}<em class="em">${EM[i]}</em><b>${t.n}</b>${t.p&&t.c!=='T'?`<s>${t.p}G</s>`:''}<span class="tk">${here}</span></div>`;
  }).join('');
  const pl=P.map((p,k)=>`<div class="pl ${k===cur&&ph!=='win'?'on':''}" style="border-color:${p.k}">${av(p)} ${p.n}${k===me?' (kamu)':''}: ${p.out?'bangkrut':p.m+'G'}${p.jail>0?' ⛓'+p.jail:''}${p.shield>0?' 🛡'+p.shield:''}${p.passJail>0?' 🔑'+p.passJail:''}<br><small>${p.ch>=0?'['+CHR[p.ch].r+'] '+CHR[p.ch].ab:''}</small></div>`).join('');
  let act='';
  if(ph==='jailturn')act=`<span>⛓️ ${P[cur].n} dipenjara: giliran dilewati (sisa ${P[cur].jail})…</span>`;
  else if(P[cur]&&P[cur].bot&&ph!=='win')act=`<span>🤖 ${P[cur].n} sedang berpikir…</span>`;
  else if(!mine(me)&&ph!=='win')act=`<span>Menunggu ${P[cur].n}…</span>`;
  else if(ph==='roll')act=`<button class="alt" onclick="roll()">Lempar acak</button><small>atau tahan bar dadu di bawah layar</small>`;
  else if(ph==='take'){const c=2*raw[P[cur].pos].p;act=`<button onclick="takeover()">🪄 Ambil alih ${c}G</button><button class="alt" onclick="skipTake()">Lewati</button>`}
  else if(ph==='buy')act=`<button onclick="buy()">Beli ${Math.round(raw[P[cur].pos].p*(1-mod(P[cur],'buy')))}G</button><button class="alt" onclick="skip()">Lewati</button>`;
  else if(ph==='after'){const q=P[cur].pos,up=canBuild(q)?`<button onclick="build(${q})">⬆ Upgrade ke ${(H[q]||0)>=2?'Landmark':'Rumah 2'} ${cost(q)}G</button>`:'';act=up+`<button class="alt" onclick="end()">${dbl&&!P[cur].jail?'Lempar lagi':'Akhiri giliran'}</button>`}
  else if(ph==='win')act=`<h2>🏆 ${P.find(p=>!p.out).n} menang!</h2><button onclick="location.reload()">Main lagi</button>`;
  if(tiles!==lastBoardH){$('board').innerHTML=tiles;lastBoardH=tiles}{const hh=`<div id="mid"><h2>Harpot Monopoly</h2>${wh?'<div class="wheel" aria-label="Roda berputar"></div>':''}<div class="dice tray${rolling?' rolling':''}${dr?' dr':''}" aria-live="polite"><span class="die">${die(d[0])}</span><span class="die">${die(d[1])}</span><svg class="cup" viewBox="0 0 64 64" aria-hidden="true"><path d="M14 22Q32 -4 50 22" fill="none" stroke="#c9a24b" stroke-width="3"/><path d="M10 22h44l-6 38H16z" fill="#6b4423"/><path d="M12 32h40M14 46h36" stroke="#c9a24b" stroke-width="3"/><ellipse cx="32" cy="22" rx="22" ry="5" fill="#2a1a0c" stroke="#e0c070" stroke-width="2"/></svg></div><div class="acts">${act}</div><div class="more">${pl}<button class="alt" style="align-self:flex-start" onclick="toggleMute(this)">${muted?'🔇 Suara mati':'🔊 Suara'}</button><button class="alt t3d" style="align-self:flex-start" onclick="document.body.classList.toggle('p3d')">🎲 Pion 3D / Potret</button><button class="alt t3d" style="align-self:flex-start" onclick="toggleBoard()">🗺️ Peta lukis / Papan 3D</button><button class="alt" style="align-self:flex-start" onclick="toggleSpotHints()">✦ Detail dekorasi</button>${card()}<ul class="log">${log.map(l=>`<li>${l}</li>`).join('')}</ul></div></div>`;if(hh!==lastHudH){$('hud').innerHTML=hh;lastHudH=hh}}   /* tulis ulang DOM hanya bila isinya berubah */
  clearInterval(iv);
  
  const pk=$('pick');pk.hidden=ph!=='pick';
  if(ph==='pick'){
    const my=mine(me)&&!(P[cur]&&P[cur].bot);
    pk.innerHTML=`<h2>${my?P[cur].n+', pilih karaktermu':'Menunggu '+P[cur].n+' memilih…'}</h2><div class="gr">${CHR.map((c,i)=>`<div class="cc ${c.r.toLowerCase()}${!my||P.some(p=>p.ch===i)?' off':''}" onclick="choose(${i})"><span class="rar">${c.r}${c.lim?' <span class="lim">Terbatas</span>':''}</span><img src="img/chars/${c.id}.jpg" alt=""><b>${c.n}</b>${c.ab}</div>`).join('')}</div>`;
  }
  layoutSpots();
  if(PXQ.length){const nw=PXQ.filter(e=>e.id>lastPx);if(nw.length){lastPx=nw[nw.length-1].id;nw.forEach((e,j)=>setTimeout(()=>showPx(e),j*350))}}
  if(EV&&EV.id!==lastEv){lastEv=EV.id;showEvent(EV)}
  if(bt!==lastBt){lastBt=bt;if(bt>=0){burst(bt,'#8dffb0');if((H[bt]||0)>=3){swirl(bt,'#ffd24a',90);burst(bt,'#ffd24a',70);landmarkFx(bt)}snd('build')}}
  if(hl!==lastHl){lastHl=hl;if(hl>=0&&ph!=='busy'){burst(hl,{C:'#c58cff',T:'#ff7777',W:'#ff7777',J:'#ff7777',F:'#ffd24a',R:'#7fd7ff',U:'#7fd7ff'}[raw[hl].c]||'#ffe08a',40);{const big=(H[hl]||0)>=3,col=raw[hl].c==='C'?'#c58cff':big?'#ffd24a':'#7dffb0';swirl(hl,col,big?90:46);if(big)burst(hl,'#ffd24a',60)}snd('land')}}
  if(rolling&&!pv.r){snd('dice');for(let k=0;k<5;k++)setTimeout(()=>cupFx(8),k*230)}
  if(dr&&!pv.d){snd('drop');cupFx(45,1);showSum(d[0],d[1])}
  const ps=P.map(p=>p.pos).join();
  if(ph==='busy'&&pv.p!==undefined&&ps!==pv.p){snd('step');burst(P[cur].pos,'#fff3c4',7)}
  if(pv.m&&pv.m.length===P.length&&ph!=='pick'&&P.some((p,k)=>p.m!==pv.m[k]))snd('coin');
  if(gameMotion){try{
    gameMotion.sync(P,H);
    /* uang berubah (sewa, pajak, beli, bonus, roda) -> teks melayang di pion; berbasis state, jadi tamu online juga melihatnya */
    if(pv.m&&pv.m.length===P.length&&ph!=='pick')P.forEach((p,k)=>{const dm=p.m-pv.m[k];if(dm)gameMotion.showFloatingText((dm>0?'+':'')+dm+'G',dm>0?'#4ade80':'#ff6b6b',gameMotion.pawnPos3D(k))});
    if(EV&&EV.k==='take'&&EV.id!==pv.ev){gameMotion.takeFx(hl)}
    if(dr&&!pv.d)gameMotion.playTurn(d[0],d[1]);
    if(!rolling&&!dr&&ph!=='busy')gameMotion.hideDice();
  }catch(e){console.warn('3D dimatikan:',e);gameMotion.off();gameMotion=null}}
  pv={r:rolling,d:dr,p:ps,m:ph==='pick'?null:P.map(p=>p.m),ev:EV?EV.id:0};
  $('gauge-bar').hidden=!(ph==='roll'&&P[cur]&&!P[cur].bot&&mine(me));
  botSchedule();
  if(role==='host'&&conn&&conn.open)conn.send(snap());
}
const sl=ms=>new Promise(r=>setTimeout(r,ms));
const snap=()=>({P,O,cur,ph,dbl,log,d,rolling,hl,H,bt,dr,wh,EV,PXQ,map:MAPSEL});
const setS=s=>{({P,O,cur,ph,dbl,log,d,rolling,hl,H,bt,dr,wh,EV,PXQ}=s);sel=-1};
/* mine(w): apakah pemanggil w boleh bertindak sekarang. w = -1 (satu perangkat), indeks pemain (online), atau 'bot' (AI giliran bot) */
const mine=w=>w==='bot'?!!(P[cur]&&P[cur].bot):!!P[cur]&&!P[cur].bot&&(w<0||w===cur);
function gate(a,w,x){if(role==='guest'){conn&&conn.send({a,x});return 0}return mine(w)}
const hs=i=>{const n=H[i]||0;return n>=3?`<u class="ht${bt===i?' pop':''}"></u>`:[...Array(n)].map((_,k)=>`<u class="hs${bt===i&&k===n-1?' pop':''}"></u>`).join('')};
const cost=i=>P[cur]&&P[cur].freeBuild?0:Math.round((H[i]>=2?raw[i].p:raw[i].p/2)*(1-mod(P[cur],'build')));
function canBuild(i,w=me){
  if(ph!=='after')return 0;
  if(!mine(w))return 0;
  const t=raw[i],h=H[i]||0;
  return !!G[t.c]&&O[i]===cur&&P[cur].pos===i&&bt!==i&&h<3&&P[cur].m>=cost(i);
}
function build(i,w=me){
  if(!gate('build',w,i)||typeof i!=='number'||!canBuild(i,w))return;
  const p=P[cur],t=raw[i],c=cost(i),base=Math.round(H[i]>=2?t.p:t.p/2);
  p.m-=c;if(p.freeBuild){p.freeBuild=0;px(cur,'Upgrade gratis!')}else if(c<base)px(cur,'Hemat '+(base-c)+'G');
  H[i]=(H[i]||0)+1;bt=i;hl=i;
  say(p.n+(H[i]>=3?' mendirikan Landmark di ':' membangun di ')+t.n+'.');draw();
}
function choose(i,w=me){
  if(!gate('pickc',w,i)||ph!=='pick'||typeof i!=='number'||!CHR[i]||P.some(p=>p.ch===i))return;
  const p=P[cur];p.ch=i;p.n=CHR[i].n;say(p.n+' ['+CHR[i].r+'] bergabung.');
  const nx=P.findIndex(q=>q.ch<0);
  if(nx<0){cur=0;ph='roll';say('Permainan dimulai. '+P[0].n+' jalan duluan.')}else cur=nx;
  draw();
}
function pick(i){sel=sel===i?-1:i;draw()}
function card(){
  const i=sel>=0?sel:hl;
  if(i<0)return '';
  const t=raw[i],o=O[i],h=H[i]||0;
  const info=t.p&&t.c!=='T'?(o===undefined?'Dijual '+t.p+'G':'Milik '+P[o].n+(t.c==='R'||t.c==='U'?'':' — sewa '+rent(i)+'G'+(h>=3?' (Landmark)':h?' ('+h+' rumah)':''))):'';
  const b=canBuild(i)?`<button onclick="build(${i})">Bangun ${h>=2?'Landmark':'Rumah 2'} ${cost(i)}G</button>`:'';
  return `<div class="card" style="border-color:${G[t.c]||'#c9a24b'}"><b>${t.n}</b> ${info} ${b}</div>`;
}
/* ===== TAKEOVER (ambil alih) ===== */
function ev(k,t,x,o){EV=Object.assign({id:++evSeq,k,t,x},o||{})}
function takeover(w=me){
  if(!gate('take',w)||ph!=='take')return;
  const p=P[cur],i=p.pos,t=raw[i],prev=O[i],cst=2*t.p;
  if(prev===undefined||prev===cur||p.m<cst||(H[i]||0)>=3)return fin();
  pay(cur,cst,prev);O[i]=cur;bt=i;H[i]=Math.min(3,(H[i]||0)+1);   /* kepemilikan pindah dan bangunan naik 1 tingkat (Rumah 2 -> Landmark) */
  say(p.n+' MERAMPAS '+t.n+' dari '+P[prev].n+' seharga '+cst+'G dan menaikkannya ke '+(H[i]>=3?'Landmark':'Rumah '+H[i])+'!');ev('take','AMBIL ALIH!',p.n+' merebut '+t.n+' dari '+P[prev].n);
  fin();
}
function skipTake(w=me){if(!gate('nope',w)||ph!=='take')return;say(P[cur].n+' tidak mengambil alih.');fin()}

/* ===== BAR DADU (Tahan & Lepas) ===== */
function gaugeValueToDice(v){return v<=25?2+Math.floor(Math.random()*2):v<=66?4+Math.floor(Math.random()*5):9+Math.floor(Math.random()*4)}
function gaugeStart(e){
  if(gaugeOn||ph!=='roll'||!mine(me))return;
  gaugeOn=true;gaugeValue=0;gaugeDir=1;
  document.body.classList.add('holding');if(gameMotion)gameMotion.setLite(true);   /* mode ringan: animasi lain dijeda selama menahan */
  try{e&&e.target&&e.target.setPointerCapture&&e.target.setPointerCapture(e.pointerId)}catch(_){}
  const el=$('dice-gauge-fill');let last=performance.now();
  const f=now=>{
    now=now||performance.now();const dt=Math.min(40,now-last);last=now;
    gaugeValue+=gaugeDir*(dt/16.67)*2.5;                       /* kecepatan tetap walau frame rate turun */
    if(gaugeValue>=100){gaugeValue=100;gaugeDir=-1}if(gaugeValue<=0){gaugeValue=0;gaugeDir=1}
    el.style.transform='scaleX('+(gaugeValue/100)+')';           /* transform: tidak memicu layout ulang */
    gaugeRAF=requestAnimationFrame(f);
  };
  gaugeRAF=requestAnimationFrame(f);
}
function gaugeStop(){
  if(!gaugeOn)return;gaugeOn=false;cancelAnimationFrame(gaugeRAF);
  document.body.classList.remove('holding');if(gameMotion)gameMotion.setLite(false);
  const v=gaugeValueToDice(gaugeValue),el=$('dice-gauge-fill');
  roll(me,v);setTimeout(()=>{if(el)el.style.transform='scaleX(0)'},700);
}

/* ===== BOT (AI giliran otomatis, hanya dijalankan oleh host/satu perangkat) ===== */
function botDice(){const r=Math.random();return r<.15?2+Math.floor(Math.random()*2):r<.8?4+Math.floor(Math.random()*5):9+Math.floor(Math.random()*4)}
function botSchedule(){
  if(role==='guest')return;
  const p=P[cur];if(!p||!p.bot||ph==='busy'||ph==='win'||ph==='act'||ph==='jailturn')return;
  const key=cur+':'+ph+':'+log.length+':'+p.pos;if(key===botKey)return;botKey=key;
  clearTimeout(botT);botT=setTimeout(botAct,ph==='roll'?1100:ph==='pick'?1000:900);   /* jeda agar terlihat natural */
}
function botAct(){
  const p=P[cur];if(!p||!p.bot)return;
  if(ph==='pick'){
    let i=CHR.findIndex((c,k)=>c.id===p.pref&&!P.some(q=>q.ch===k));if(i<0)i=CHR.findIndex((c,k)=>!P.some(q=>q.ch===k));
    return choose(i,'bot');
  }
  if(ph==='roll')return roll('bot',botDice());
  const t=raw[p.pos];
  if(ph==='buy'){const pr=Math.round(t.p*(1-mod(p,'buy')));return p.m-pr>=200?buy('bot'):skip('bot')}
  if(ph==='take'){const c=2*t.p;return p.m-c>=300?takeover('bot'):skipTake('bot')}
  if(ph==='after'){if(canBuild(p.pos,'bot')&&p.m-cost(p.pos)>=250)return build(p.pos,'bot');return end('bot')}
}

/* ===== AUDIO: <audio> di index.html bila file ada, bila tidak memakai sintesis WebAudio ===== */
function synth(n){
  const T={
    dice:()=>{for(let k=0;k<7;k++)tone(180+Math.random()*120,.05,'square',.04,k*.14)},
    drop:()=>{tone(110,.2,'triangle',.12);tone(150,.15,'triangle',.1,.12)},
    step:()=>tone(440+Math.random()*60,.05,'triangle',.07),
    coin:()=>{tone(988,.08,'sine',.08);tone(1319,.18,'sine',.08,.08)},
    take:()=>{[392,523,659,784,1047].forEach((f,k)=>tone(f,.22,'sine',.09,k*.07))},
    chance:()=>{tone(523,.2,'sine',.09);tone(784,.3,'sine',.09,.12)},
    build:()=>{tone(220,.08,'square',.06);tone(330,.1,'square',.06,.1)},
    land:()=>{tone(660,.15,'sine',.09);tone(880,.2,'sine',.08,.1)},
    clang:()=>{tone(180,.28,'square',.12);tone(540,.16,'triangle',.08,.02)}
  };
  (T[n]||(()=>{}))();
}
function snd(n){
  if(muted)return;
  const a=document.getElementById('a-'+n);
  if(a&&!a.dataset.bad&&a.readyState>=2){try{a.currentTime=0;const pr=a.play();if(pr&&pr.catch)pr.catch(()=>synth(n))}catch(e){synth(n)}return}
  synth(n);
}
function startBgm(){
  if(muted||$('board').hidden)return;
  const b=document.getElementById('a-bgm');
  if(b&&!b.dataset.bad&&b.paused){b.loop=true;b.volume=.3;try{const pr=b.play();if(pr&&pr.catch)pr.catch(()=>{})}catch(e){}}
}
function toggleMute(btn){
  muted=!muted;btn.textContent=muted?'🔇 Suara mati':'🔊 Suara';
  const b=document.getElementById('a-bgm');if(b){if(muted)b.pause();else startBgm()}
}
function pickMap(n){const u=new URL(location.href);u.searchParams.delete('r');n===2?u.searchParams.set('map','2'):u.searchParams.delete('map');location.href=u.href}
function toggleBoard(){if(gameMotion)gameMotion.setBoardMode(gameMotion.mode==='map'?'box':'map')}

/* ===== MODAL EVENT: kartu, roda, jebakan, penjara, skill ===== */
function showPx(e){
  if(gameMotion){try{gameMotion.showFloatingText('✦ '+e.t,'#7dffb0',gameMotion.pawnPos3D(e.k))}catch(_){}}
  snd('land');
}
function showEvent(e){
  if(e.k==='take'){snd('take');return}
  const m=$('event-modal');m.className='ev '+e.k+' active';
  $('ev-icon').textContent=e.icon||({dana:'🏦',kesempatan:'📜',skill:'🦌',wheel:'🎡',trap:'🕳️',jail:'⛓️'})[e.k]||'✨';
  $('ev-title').textContent=e.t;$('ev-text').textContent=e.x;
  $('ev-list').innerHTML=e.list?e.list.map(x=>'<span class="'+(x.on?'on ':'')+x.k+'">'+x.t+'</span>').join(''):'';
  $('ev-meter').innerHTML=e.meter?e.meter.n.map((n,j)=>'<i class="'+(j<=e.meter.i?'on ':'')+'m'+j+'"><b>'+n+'</b></i>').join(''):'';
  if(e.k==='jail'||e.k==='trap'){document.body.classList.add('shake');setTimeout(()=>document.body.classList.remove('shake'),700);snd('clang')}
  else snd(e.k==='skill'?'take':'chance');
  clearTimeout(evT);evT=setTimeout(()=>m.classList.remove('active'),({wheel:4300,trap:3800,jail:3800})[e.k]||3000);
}
/* ===== lingkaran jumlah dadu ===== */
function showSum(a,b){
  const el=$('dice-sum'),r=$('board').getBoundingClientRect();
  clearTimeout(sumT);clearTimeout(sumT2);
  el.style.left=(r.left+r.width*.5)+'px';el.style.top=(r.top+r.height*.5)+'px';
  el.innerHTML='<div class="ring"></div><b>'+(a+b)+'</b><small>'+a+' + '+b+'</small>'+(a===b?'<em>KEMBAR!</em>':'');
  el.classList.remove('show');
  sumT=setTimeout(()=>el.classList.add('show'),750);
  sumT2=setTimeout(()=>el.classList.remove('show'),3600);
}
/* ===== dekorasi peta yang bisa diketuk (dengan varian) ===== */
function layoutSpots(){
  const sp=$('spots'),b=$('board');if(!sp||!b)return;
  const r=b.getBoundingClientRect(),on=!b.hidden&&r.width>0&&!document.body.classList.contains('boxmode');
  sp.style.display=on?'block':'none';
  if(on)Object.assign(sp.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
}
function initSpots(){
  const sp=$('spots');if(!sp)return;sp.innerHTML='';
  const W=MAPSEL===2?1280:1024,Hh=MAPSEL===2?720:765;   /* peta 2: koordinat bingkai video papan */
  (MAPSEL===2?MAP2_SPOTS:SPOTS).forEach(s=>s.pts.forEach(pt=>{
    const b=document.createElement('button');b.className='spot';b.title=s.n;
    b.style.left=(pt[0]/W*100)+'%';b.style.top=(pt[1]/Hh*100)+'%';
    b.style.width=(s.r*2/W*100)+'%';b.style.height=(s.r*2/Hh*100)+'%';
    b.onclick=()=>openSpot(s.id);sp.appendChild(b);
  }));
}
function openSpot(id,vi){
  const s=(MAPSEL===2?MAP2_SPOTS:SPOTS).find(x=>x.id===id);if(!s)return;
  const vars=typeof s.v==='string'?deckVariants(s.v):s.v;vi=vi||0;
  $('spot-title').textContent=s.n;
  const im=$('spot-img');im.style.display='';im.onerror=()=>{im.style.display='none'};im.src=MAPSEL===2?'img/maps2/spots/'+id+'_'+(vi+1)+'.jpg':'img/spots/'+id+'.jpg';   /* peta 2: gambar ikut varian */
  $('spot-desc').textContent=s.desc;
  $('spot-chips').innerHTML=vars.map((v,i)=>'<button class="chip'+(i===vi?' on':'')+'" onclick="openSpot(\''+id+'\','+i+')">'+v.n+'</button>').join('');
  $('spot-var').innerHTML='<b>'+vars[vi].n+'</b><br>'+vars[vi].d;
  $('spot-modal').classList.add('active');snd('land');
}
function closeSpot(){$('spot-modal').classList.remove('active')}
function toggleSpotHints(){const sp=$('spots');sp.classList.add('hint');setTimeout(()=>sp.classList.remove('hint'),4200)}
function host(){
  const CH='ABCDEFGHJKLMNPQRSTUVWXYZ',code=[0,0,0,0].map(()=>CH[Math.random()*CH.length|0]).join('');
  role='host';me=0;peer=new Peer('gm-'+code);
  peer.on('open',()=>{$('st').innerHTML='Kode ruangan: <b>'+code+'</b>. Kirim tautan ke pasanganmu:<br><button onclick="cp(\''+code+'\',this)">Salin tautan undangan</button>'});
  peer.on('disconnected',()=>peer.reconnect());
  peer.on('error',e=>{if(e.type==='unavailable-id')return host();$('st').textContent='Gagal membuat ruangan ('+e.type+').'});
  peer.on('connection',c=>{
    conn=c;
    c.on('open',()=>{if(P.length){say('Pasangan tersambung kembali.');draw()}else begin(2)});
    c.on('data',m=>m.a==='build'?build(m.x,1):m.a==='pickc'?choose(m.x,1):m.a==='roll'?roll(1,m.x):m.a==='take'?takeover(1):m.a==='nope'?skipTake(1):({buy,skip,end})[m.a]?.(1));
    c.on('close',()=>{if(conn===c){say('Pasangan terputus. Dia bisa masuk lagi dengan tautan yang sama.');draw()}});
  });
}
function join(){
  const code=$('code').value.trim().toUpperCase();
  if(code.length!==4){$('st').textContent='Masukkan kode 4 huruf.';return}
  role='guest';me=1;peer=new Peer();
  $('st').textContent='Menghubungkan…';
  peer.on('open',()=>link(code));
  peer.on('disconnected',()=>peer.reconnect());
  peer.on('error',e=>{
    if(P.length&&['peer-unavailable','network','disconnected'].includes(e.type)){setTimeout(()=>link(code),3000);return}
    $('st').textContent='Gagal bergabung ('+e.type+'). Periksa kodenya.';
  });
}
let rc='';
function link(code){
  rc=code;conn=peer.connect('gm-'+code,{reliable:true});
  const c=conn;
  c.on('data',s=>{if((s.map||1)!==MAPSEL){const u=new URL(location.href);u.searchParams.set('r',rc);u.searchParams.set('map',s.map||1);location.href=u.href;return}   /* tamu ikut peta tuan rumah */
    setS(s);$('start').hidden=true;$('board').hidden=false;draw()});
  c.on('close',()=>{
    if(conn!==c)return;
    if(P.length){say('Koneksi terputus, mencoba tersambung lagi…');draw()}
    setTimeout(()=>{if(conn===c)link(code)},2500);
  });
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&role==='guest'&&rc&&!(conn&&conn.open))link(rc)});
function cp(c,b){
  const u=location.origin+location.pathname+'?r='+c+(MAPSEL===2?'&map=2':'');
  (navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(()=>{b.textContent='Tautan disalin ✓'},()=>prompt('Salin tautan ini:',u));
}
function tone(f,d,ty='sine',v=.07,t0=0){
  if(muted||!AC)return;
  const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+t0;
  o.type=ty;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);
}
addEventListener('pointerdown',()=>{
  if(!AC){const C=window.AudioContext||window.webkitAudioContext;if(C)AC=new C()}
  if(AC&&AC.state==='suspended')AC.resume();
  startBgm();
});
const RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const cv=$('fx'),cx=cv.getContext('2d');let pts=[];
const rs=()=>{cv.width=innerWidth;cv.height=innerHeight};
addEventListener('resize',rs);rs();
for(let i=0;i<(RM?0:34);i++)pts.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:Math.random()*1.6+.4,v:Math.random()*.25+.08,a:Math.random()*6.3});
function ctr(i){const e=$('board').children[i];if(!e)return null;const b=e.getBoundingClientRect();return[b.left+b.width/2,b.top+b.height/2]}
function bxy(x,y,col,n=28){if(RM)return;for(let k=0;k<n;k++){const an=Math.random()*6.3,sp=1+Math.random()*3.5;pts.push({x,y,r:1.5+Math.random()*2,vx:Math.cos(an)*sp,vy:Math.sin(an)*sp-1.2,l:1,c:col})}}
function sxy(x,y,col,n=40){if(RM)return;for(let k=0;k<n;k++)pts.push({ox:x,x,y:y+Math.random()*10,a:Math.random()*6.3,rad:18+Math.random()*26,r:1.2+Math.random()*2,l:1,c:col,sp:1,dl:k*.012})}
function burst(i,col,n=28){const c=ctr(i);if(c)bxy(c[0],c[1],col,n)}
function swirl(i,col,n=40){const c=ctr(i);if(c)sxy(c[0],c[1],col,n)}
let lmT=0;
function landmarkFx(i){
  const el=$('lm'),o=O[i];
  el.innerHTML=`<div class="lmx"><div class="mcc"></div><div class="cs"></div><div class="cr">👑</div><h1><span class="wg" style="transform:scaleX(-1)"></span>LANDMARK!<span class="wg"></span></h1><p>${raw[i].n.toUpperCase()} DIDIRIKAN${o!==undefined?' OLEH '+P[o].n.toUpperCase():''}</p></div>`;
  clearTimeout(lmT);lmT=setTimeout(()=>{el.innerHTML=''},3700);
  tone(523,.3,'sine',.1);tone(659,.3,'sine',.12,.15);tone(784,.6,'sine',.14,.3);
}
function cupFx(n,sw){const e=document.querySelector('.cup');if(!e)return;const b=e.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height*.3;bxy(x,y,'#ffe08a',n);if(sw)sxy(x-60,y+10,'#ffd24a',50)}
(function loop(){
  cx.clearRect(0,0,cv.width,cv.height);
  pts=pts.filter(p=>{
    if(p.sp){if(p.dl>0){p.dl-=.016;return true}p.a+=.16;p.rad*=.988;p.y-=1.5;p.x=p.ox+Math.cos(p.a)*p.rad;p.l-=.011;if(p.l<=0)return false;cx.globalAlpha=p.l;cx.fillStyle=p.c}
    else if(p.c){p.x+=p.vx;p.y+=p.vy;p.vy+=.06;p.l-=.018;if(p.l<=0)return false;cx.globalAlpha=p.l;cx.fillStyle=p.c}
    else{p.y-=p.v;p.a+=.02;p.x+=Math.sin(p.a)*.3;if(p.y<-5){p.y=cv.height+5;p.x=Math.random()*cv.width}cx.globalAlpha=.25+.25*Math.sin(p.a*2);cx.fillStyle='#ffe9a8'}
    cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.3);cx.fill();return true;
  });
  requestAnimationFrame(loop);
})();

/* ===== STATE LAYER -> VIEW LAYER =====
   State (P pemain+posisi+uang, O pemilik, H level bangunan, cur giliran, ph fase) tetap di struktur index.html lama.
   View hanya membaca state lewat adapter API di bawah, dan hanya memanggil API.build untuk mengubah state. */
const LORE=(()=>{try{return JSON.parse(document.getElementById('lore').textContent)}catch(e){return{tiles:[]}}})();
const TAGS={S:'Titik Awal',J:'Penjara (kunjungan)',W:'Gerbang Penjara',F:'Roda Keberuntungan',X:'Jebakan',T:'Pajak',R:'Stasiun Sapu',U:'Utilitas'};
function tileTag(t){return t.c==='C'?(t.n==='Kesempatan'?'Kartu Kesempatan':'Kartu Dana Umum'):G[t.c]?'Properti':(TAGS[t.c]||'Petak')}
function tileRule(t){
  if(G[t.c])return 'Beli saat mendarat (langsung Rumah 1). Mendarat lagi di petak sendiri untuk upgrade ke Rumah 2, lalu Landmark. Lawan yang mendarat membayar sewa dan boleh mengambil alih seharga 2x harga (kecuali Landmark); bangunan yang direbut langsung naik 1 tingkat.';
  return ({S:'Setiap kali melewati atau mendarat di sini, terima '+GO+'G ditambah bonus karakter.',
    C:t.n==='Kesempatan'?'Tarik satu kartu Kesempatan: gerak mendadak, hadiah, atau kutukan.':'Tarik satu kartu Dana Umum: uang, perlindungan, atau tagihan.',
    J:'Hanya kunjungan. Pemain yang dipenjara ditahan di sini selama 2 giliran.',
    W:'Langsung dikirim ke '+JNAME+' dan tidak bisa bergerak selama 2 giliran.',
    F:'Putar roda: hadiah koin, lempar ulang, Perisai Sewa, atau kehilangan koin.',
    X:'Jebakan acak: kehilangan 5% sampai 60% koin. Yang ringan paling sering, yang parah jarang.',
    T:'Bayar '+t.p+'G saat mendarat.',
    R:'Sewa 25G dikali jumlah stasiun milik pemilik (maks. 100G).',
    U:'Sewa = angka dadu x 4, atau x 10 bila pemilik punya dua sumur.'})[t.c]||'';
}
const API={
  tile(i){
    const t=raw[i],o=O[i],h=H[i]||0,prop=!!G[t.c];
    const you=P[cur]?Math.round(t.p*(1-mod(P[cur],'buy'))):t.p,b=Math.ceil(t.p/8);
    return{id:i,name:t.n,price:t.p,you,sell:!!t.p&&t.c!=='T',owner:o!==undefined?P[o]:null,level:h,tag:MAPSEL===2&&getTileLore(i)?getTileLore(i).category:tileTag(t),rule:tileRule(t),
      rows:prop?[{n:'Rumah 1',v:b},{n:'Rumah 2',v:b*3},{n:'Landmark',v:b*10}]:null,canBuild:!!canBuild(i),cost:cost(i)};
  },
  build:i=>build(i)
};
function openTileModal(i){
  if(!P.length)return;
  /* Peta 2: lore kaya dari HP_TILES_LORE (getTileLore). Data id tidak ada -> modal tetap terbuka dengan data game saja. Peta 1: lore JSON lama. */
  const d=API.tile(i),R=MAPSEL===2?getTileLore(i):null,L=MAPSEL===2?{}:((LORE.tiles||[]).find(x=>x.id===i)||{});
  $('tile-modal').classList.toggle('rich',MAPSEL===2);
  $('modal-tag').textContent=d.tag;$('modal-title').textContent=R?R.name:d.name;
  const im=$('modal-img');im.style.display='';im.onerror=()=>{im.style.display='none'};im.src=MAPSEL===2?TILE_IMG(i):(L.img||('img/tiles/'+i+'.jpg'));
  $('modal-desc').textContent=R?R.lore:(L.desc||'');
  $('modal-sub').textContent=R&&R.subtitle||'';$('modal-sub').hidden=!(R&&R.subtitle);
  $('modal-fun-t').textContent=R&&R.funFact?R.funFact.trim():'';$('modal-fun').hidden=!(R&&R.funFact);
  $('tile-modal').scrollTop=0;
  $('modal-price').textContent=d.sell?d.price+'G'+(d.owner===null&&d.you!==d.price?' (kamu: '+d.you+'G)':''):'—';
  $('modal-owner').textContent=d.owner?d.owner.n:(d.sell?'Belum ada':'—');
  $('modal-level').textContent=d.rows&&d.owner?(d.level>=3?'Landmark':d.level+' rumah'):'—';
  $('modal-rent').innerHTML=d.rows?'<small>Sewa per level</small><div class="rrow">'+d.rows.map((r,j)=>'<div class="'+(d.owner&&d.level===j+1?'cur':'')+'"><span>'+r.n+'</span><b>'+r.v+'G</b></div>').join('')+'</div>':'';
  $('modal-rule').textContent=d.rule;
  const b=$('modal-build');b.hidden=!d.canBuild;
  if(d.canBuild){b.textContent='Bangun '+(d.level>=2?'Landmark':'Rumah 2')+' '+d.cost+'G';b.onclick=()=>{API.build(i);closeTileModal()}}
  $('tile-modal').classList.add('active');
}
function closeTileModal(){$('tile-modal').classList.remove('active')}

initSpots();layoutSpots();addEventListener('resize',layoutSpots);addEventListener('scroll',layoutSpots,{passive:true});if(window.ResizeObserver)new ResizeObserver(layoutSpots).observe($('board'));
{const q=new URLSearchParams(location.search).get('r');if(q){$('code').value=q.toUpperCase().slice(0,4);join()}}
