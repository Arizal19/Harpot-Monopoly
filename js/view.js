/* =====================================================================
   HARPOT MONOPOLY: VIEW LAYER 3D (Three.js + GSAP)
   Hanya membaca state lewat adapter API dan hanya mengubahnya lewat API.build.
   Dimuat setelah js/game.js. ===================================================================== */
/* ===== MagicMonopolyLGR (View Layer): lapisan 3D di belakang UI 2D (z-index -1) =====
   Perbedaan dari versi Gemini (hasil kaji ulang):
   - Digerakkan oleh STATE game (P, H, d), bukan penghitung internal, jadi tidak bisa tidak sinkron dan tamu online ikut melihatnya.
   - Memakai 36 petak dan posisi piksel dari peta (POS), bukan cincin 40 petak 10x10.
   - Kamera ortografik berskala piksel supaya objek 3D tepat berada di atas lukisan peta.
   - Dadu bertekstur bintang dan berhenti dengan wajah = hasil lemparan (versi asli hanya memutar acak).
   - Kastil Landmark hanya muncul saat Landmark didirikan (versi asli selalu memunculkannya) dan menetap di petak.
   - Satu pion per pemain (warna pemain), bukan satu pion tetap. */
const diceRot=v=>({1:[0,0,0],6:[0,Math.PI,0],3:[0,-Math.PI/2,0],4:[0,Math.PI/2,0],2:[Math.PI/2,0,0],5:[-Math.PI/2,0,0]})[v];
const MINI={
  deya:{body:'cloak',robe:0x0d3b2e,trim:0xc9cdd6,skin:0xf0d0b0,hair:0x0b0b10,hs:'long',hat:'witch',hatC:0x0b4d3a,hatB:0xc9cdd6,fur:0x1a1a20,orb:0x4dffb0},
  albus:{body:'robe',robe:0x5b2a86,trim:0xd4a84a,skin:0xe9c9a8,hair:0xe6e6ee,hs:'long',hat:'wizard',hatC:0x5b2a86,hatB:0xd4a84a,beard:0xeeeef4,glass:'round',glassC:0xd4a84a},
  voldemort:{body:'cloak',robe:0x0e1a16,trim:0x1f5f3f,skin:0xe8e6dc,hs:'bald',eyes:0xff2a2a},
  snape:{body:'cloak',robe:0x0f0f12,trim:0x2b2b33,skin:0xd9c8a8,hair:0x060608,hs:'long'},
  minerva:{body:'robe',robe:0x1f6b3f,trim:0x0d0d10,skin:0xe6c9aa,hair:0x8a8a92,hs:'bun',hat:'witch',hatC:0x15151a,hatB:0x1f8a4f,glass:'square',glassC:0x222222},
  bellatrix:{body:'cloak',robe:0x16141b,trim:0x6b1b2a,skin:0xeee2da,hair:0x0c0a0e,hs:'curly'},
  draco:{body:'robe',robe:0x1d2a26,trim:0x2e8b57,skin:0xf2e3d0,hair:0xefe6bb,hs:'slick',scarf:[0x1f7a4a,0xc9cdd6]},
  ron:{body:'robe',robe:0x2b2b31,trim:0xb3202a,skin:0xf0d2b8,hair:0xd2541a,hs:'messy',scarf:[0xb3202a,0xe0b030]},
  remus:{body:'coat',robe:0x6b5238,trim:0x4a3824,skin:0xdcb998,hair:0x7a6246,hs:'short'},
  sirius:{body:'coat',robe:0x5a1a2a,trim:0x2a2a2e,skin:0xe3c7ac,hair:0x1a1412,hs:'wavy'},
  tonks:{body:'coat',robe:0x1f2a4a,trim:0x7a3fb0,skin:0xf0d2bc,hair:0xf07ab8,hs:'spiky'},
  gilderoy:{body:'robe',robe:0xa58ad0,trim:0x1f8a9a,skin:0xf1d4b6,hair:0xe6c25a,hs:'curly'},
  dolores:{body:'round',robe:0xe07aa8,trim:0xc2557f,skin:0xf0d2bc,hair:0x6b4a2e,hs:'curly',bow:0xff5fa2}
};
class MagicMonopolyLGR{
  constructor(id,api){
    this.api=api;
    this.useGLB=!!window.HARPOT_GLB;this.lite=false;this.fc=0;   /* GLB hanya dicoba bila window.HARPOT_GLB=true */
    this.pawnMode='auto';          /* 'auto' = karakter (GLB lalu sprite), 'crystal' = semua pion kristal LGR */
    this.glbBase='models/';        /* taruh model 3D di sini: models/deya.glb, models/albus.glb, dst. */
    this.raycaster=new THREE.Raycaster();this.mouse=new THREE.Vector2();
    this.box=document.getElementById(id);this.mapbg=document.getElementById('mapbg');this.board=document.getElementById('board');
    this.scene=new THREE.Scene();
    this.cam=new THREE.OrthographicCamera(0,1,0,-1,1,3000);this.cam.position.z=1500;this.cam.lookAt(0,0,0);
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));   /* DPR dibatasi agar ringan */
    this.renderer.setClearColor(0x000000,0);
    this.box.appendChild(this.renderer.domElement);
    const amb=new THREE.AmbientLight(0xffffff,.75),dl=new THREE.DirectionalLight(0xfff0cc,.9);dl.position.set(.4,.8,1);this.scene.add(amb,dl);this.lights=[amb,dl];   /* disimpan agar tidak pernah hilang dari scene */
    this.mode='map';this.hover=-1;this.TILT=Math.acos(28.7/44.7);this.tiles=[];this.tileLayer=new THREE.Group();this.scene.add(this.tileLayer);
    this.pawnLayer=new THREE.Group();this.propLayer=new THREE.Group();this.scene.add(this.pawnLayer,this.propLayer);
    this.pawns=[];this.props={};this.propsReady=false;
    this.U=1;this.W=0;this.H=0;this.vis=false;this.R={left:0,top:0,width:1,height:1};
    this.texCache={};this.glbOK={};this.gltfReady=null;
    this.buildDice();this.buildBoxTiles();   /* this.tiles dibuat SEKALI di sini dan tidak pernah ditimpa/di-reset */
    this.board.addEventListener('pointerdown',e=>this.onMouseClick(e));
    this.board.addEventListener('pointermove',e=>this.onHover(e));
    this.board.addEventListener('pointerleave',()=>this.clearHover());
    {const mi=new Image();mi.onerror=()=>{console.warn('img/map.jpg tidak termuat: beralih ke Papan 3D');this.setBoardMode('box')};mi.src='img/map.jpg'}   /* peta gagal dimuat -> papan tidak pernah kosong */
    this.layout();this.loop=this.loop.bind(this);this.loop();
  }
  off(){document.body.classList.remove('has3d','p3d','boxmode');this.dead=true;this.box.style.display='none';this.mapbg.style.display='none'}

  /* ===== 1. TATA LETAK & SINKRON STATE ===== */
  layout(){
    const W=innerWidth,Hh=innerHeight,r=this.board.getBoundingClientRect();
    this.vis=!this.board.hidden&&r.width>0;this.R=r;this.U=Math.max(r.width,1)/1000;
    this.mapbg.style.display=this.vis&&this.mode==='map'?'block':'none';
    Object.assign(this.mapbg.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});
    if(W!==this.W||Hh!==this.H){this.W=W;this.H=Hh;this.renderer.setSize(W,Hh);Object.assign(this.cam,{left:0,right:W,top:0,bottom:-Hh});this.cam.updateProjectionMatrix()}
    this.pawns.forEach(w=>{if(!gsap.isTweening(w)){const t=this.tpx(w.tile);w.bx=t.x;w.by=t.y}w.holder.scale.setScalar(this.U);this.place(w)});
    Object.values(this.props).forEach(q=>{const t=this.tpx(q.i);q.holder.position.set(t.x,-t.y,20);q.holder.scale.setScalar(this.U)});
    this.layoutTiles();
  }
  tpx(i){const R=this.R;return{x:R.left+POS[i][0]/100*R.width,y:R.top+POS[i][1]/100*R.height}}
  sync(P,H){
    this.layout();
    if(!this.vis)return;
    if(this.pawns.length!==P.length){this.pawns.forEach(w=>{gsap.killTweensOf([w,w.bob]);this.pawnLayer.remove(w.holder)});this.pawns=[];P.forEach((p,k)=>this.addPawn(k,p))}
    P.forEach((p,k)=>{
      const w=this.pawns[k];w.holder.visible=!p.out;
      if(w.ch!==p.ch)this.swapModel(w,p);
      if(w.tile!==p.pos)this.movePawn(k,p.pos);
      if(p.jail>0&&!w.cage)this.dropCage(w);else if(!(p.jail>0)&&w.cage)this.liftCage(w);
    });
    this.syncProps(H);
  }

  /* ===== 2. PION: kristal LGR, sprite 2.5D karakter, atau GLB ===== */
  addPawn(k,p){
    const holder=new THREE.Group();holder.userData.col=p.k;holder.scale.setScalar(this.U);this.pawnLayer.add(holder);
    const t=this.tpx(p.pos);
    const w={k,holder,tile:p.pos,bx:t.x,by:t.y,h:0,bob:{v:0},ch:-2,token:0};
    this.pawns.push(w);this.place(w);
    if(!RM)gsap.to(w.bob,{v:4,duration:1.1,yoyo:true,repeat:-1,ease:'sine.inOut',onUpdate:()=>this.place(w)});   /* napas: pion naik-turun pelan */
  }
  place(w){
    const n=this.pawns.length,off=(w.k-(n-1)/2)*11*this.U;
    w.holder.position.set(w.bx+off,-w.by+w.h+w.bob.v*this.U,40+w.k);
  }
  swapModel(w,p){
    w.ch=p.ch;const token=++w.token;
    const put=g=>{if(w.token!==token)return;[...w.holder.children].forEach(c=>{if(c!==w.cage)w.holder.remove(c)});w.holder.add(g);w.pg=g};
    const id=p.ch>=0?CHR[p.ch].id:null,mode=this.pawnMode;
    put(id&&mode!=='crystal'&&mode!=='sprite'?this.makeMiniature(id,p.k):this.makeCrystalPawn(p.k));
    if(id&&mode==='sprite')this.createCharacterPawn(id,'sprite',p.k).then(put).catch(()=>{});
    else if(id&&mode==='auto'&&this.useGLB)this.tryGLB(id).then(g=>{if(g)put(g)}).catch(()=>{});
  }
  /* ---- miniatur ala bidak catur: alas emas, badan bubut (lathe), kepala dan ciri khas tiap karakter ---- */
  makeMiniature(id,color){
    const S=MINI[id];if(!S)return this.makeCrystalPawn(color);
    const g=new THREE.Group(),M=(c,r=.6,m=.05)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
    const add=(geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);return o};
    const gold=M(0xffd24a,.25,.85),skin=M(S.skin,.7,0),robe=M(S.robe,.55),trim=M(S.trim,.4,.45);
    add(new THREE.CylinderGeometry(15,17,5,32),gold,0,2.5);
    add(new THREE.CylinderGeometry(15.4,15.4,2.4,32),M(color,.5),0,6.2);
    add(new THREE.TorusGeometry(13,1.2,8,32),gold,0,8,0,Math.PI/2);
    const prof=({robe:[[13,0],[13,2],[10.5,10],[8.5,22],[7.2,32],[7.6,35],[9,37],[6.4,39]],
      cloak:[[14,0],[14,2],[12,10],[9.5,24],[7.4,34],[7.6,37],[9.4,39],[6.4,41]],
      coat:[[11,0],[11,2],[9.6,12],[8.6,26],[8,34],[8.8,37],[6.4,39]],
      round:[[13,0],[13,2],[14.5,12],[12.5,24],[9,33],[8.6,36],[6.4,38]]})[S.body];
    add(new THREE.LatheGeometry(prof.map(q=>new THREE.Vector2(q[0],q[1]+9)),32),robe);
    add(new THREE.TorusGeometry(prof[1][0]+.3,1,8,32),trim,0,prof[1][1]+11,0,Math.PI/2);
    const top=prof[prof.length-1][1]+9,hy=top+8;
    /* kepala dan wajah */
    add(new THREE.SphereGeometry(8.6,24,18),skin,0,hy,0);
    [-3.2,3.2].forEach(x=>add(new THREE.SphereGeometry(1.1,8,6),M(S.eyes||0x1a1a22,.3),x,hy+1,7.7));
    /* rambut */
    const hairM=M(S.hair||0,.6);hairM.side=THREE.DoubleSide;
    const cap=r=>add(new THREE.SphereGeometry(r,24,16,0,Math.PI*2,0,Math.PI*.55),hairM,0,hy+.4,-.4);
    const hs=S.hs;
    if(hs==='slick'||hs==='short')cap(hs==='slick'?9:8.9);
    else if(hs==='messy'){cap(9);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;add(new THREE.ConeGeometry(2.2,6,6),hairM,Math.cos(a)*5.5,hy+8.4,Math.sin(a)*4.5,Math.sin(a)*.5,0,-Math.cos(a)*.5)}}
    else if(hs==='long'||hs==='wavy'){cap(9);add(new THREE.CylinderGeometry(8.8,6.6,18,20,1,true),hairM,0,hy-5.5,-3);[-8.2,8.2].forEach(x=>add(new THREE.BoxGeometry(1.8,13,5),hairM,x,hy-3,-1));if(hs==='wavy')[-7,-2.5,2.5,7].forEach((x,i)=>add(new THREE.SphereGeometry(2.8,10,8),hairM,x,hy-12+(i%2)*1.5,-5))}
    else if(hs==='bun'){cap(9);add(new THREE.SphereGeometry(4.4,14,10),hairM,0,hy+4,-8.4)}
    else if(hs==='curly'){cap(9);for(let i=0;i<11;i++){const a=i/11*Math.PI*2,rr=id==='dolores'?3.2:4;add(new THREE.SphereGeometry(rr,10,8),hairM,Math.cos(a)*8.8,hy+3+Math.sin(i*1.7)*2.5,Math.sin(a)*8.4-1)}if(id==='bellatrix')[-4,0,4].forEach(x=>add(new THREE.SphereGeometry(4.4,10,8),hairM,x,hy+8,-2))}
    else if(hs==='spiky'){cap(9);for(let i=0;i<9;i++){const a=i/9*Math.PI*2;add(new THREE.ConeGeometry(2.6,8,6),hairM,Math.cos(a)*6,hy+7,Math.sin(a)*5,Math.sin(a)*.6,0,-Math.cos(a)*.6)}}
    /* topi */
    if(S.hat){
      const hatM=M(S.hatC,.55),band=M(S.hatB,.35,.5);
      add(new THREE.CylinderGeometry(16.5,16.5,1.6,32),hatM,0,hy+7.8);
      if(S.hat==='wizard'){add(new THREE.ConeGeometry(10.5,30,24),hatM,0,hy+23,0,0,0,.08);add(new THREE.TorusGeometry(10.4,1.1,8,28),band,0,hy+10,0,Math.PI/2)}
      else{add(new THREE.ConeGeometry(9.5,22,24),hatM,0,hy+19,0);add(new THREE.ConeGeometry(5,13,16),hatM,3,hy+34,0,0,0,-.5);add(new THREE.TorusGeometry(9.6,1.2,8,28),band,0,hy+10.5,0,Math.PI/2)}
    }
    if(S.beard)add(new THREE.ConeGeometry(6.2,26,16),M(S.beard,.8),0,hy-12,5.2,Math.PI);
    if(S.glass){const gm=M(S.glassC,.3,.6);[-3.6,3.6].forEach(x=>add(new THREE.TorusGeometry(2.5,.45,6,S.glass==='square'?4:16),gm,x,hy+1,8.4,0,0,S.glass==='square'?Math.PI/4:0))}
    if(S.scarf){add(new THREE.TorusGeometry(8.2,1.8,8,28),M(S.scarf[0],.8),0,top-1,0,Math.PI/2);add(new THREE.TorusGeometry(8.4,1.1,8,28),M(S.scarf[1],.8),0,top-3,0,Math.PI/2);add(new THREE.BoxGeometry(3,11,1.4),M(S.scarf[0],.8),-4,top-8,7.4)}
    if(S.fur)add(new THREE.TorusGeometry(8.4,3,8,24),M(S.fur,.95,0),0,top+.2,0,Math.PI/2);
    if(S.bow){const bm=M(S.bow,.5);add(new THREE.SphereGeometry(1.6,8,6),bm,6,hy+8.5,3);add(new THREE.ConeGeometry(2.6,5,6),bm,9.2,hy+8.5,3,0,0,-Math.PI/2);add(new THREE.ConeGeometry(2.6,5,6),bm,2.8,hy+8.5,3,0,0,Math.PI/2)}
    /* lengan, tangan, dan tongkat */
    add(new THREE.CylinderGeometry(2.6,2.2,14,10),robe,11.4,top-9.2,3,0,0,.5);add(new THREE.CylinderGeometry(2.6,2.2,14,10),robe,-11.4,top-9.2,3,0,0,-.5);
    add(new THREE.SphereGeometry(2.3,10,8),skin,14.7,top-15.3,4.5);add(new THREE.SphereGeometry(2.3,10,8),skin,-14.7,top-15.3,4.5);
    add(new THREE.CylinderGeometry(.55,.8,24,8),M(0x4a3020,.6),20.4,top-7.1,4.5,0,0,-.61);
    add(new THREE.SphereGeometry(1.2,8,6),new THREE.MeshBasicMaterial({color:S.orb||0xfff0b0}),27.2,top+2.7,4.5);
    if(S.orb)add(new THREE.SphereGeometry(3.2,14,10),new THREE.MeshBasicMaterial({color:S.orb}),-15,top-9,7);
    g.scale.setScalar(.88);g.userData.mini=true;return this.mergeStatic(g);
  }
  /* gabung bagian diam yang materialnya sama jadi satu mesh: bentuk dan warna sama persis, draw call jauh lebih sedikit */
  mergeStatic(g){
    const groups=new Map();
    g.children.slice().forEach(o=>{
      if(!o.isMesh||!o.geometry.attributes.uv)return;
      const m=o.material,k=[m.type,m.color.getHex(),m.roughness,m.metalness,m.side,m.transparent].join('|');
      if(!groups.has(k))groups.set(k,[]);groups.get(k).push(o);
    });
    groups.forEach(list=>{
      if(list.length<2)return;
      const parts=list.map(o=>{o.updateMatrix();const q=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();q.applyMatrix4(o.matrix);return q});
      const cat=n=>{const s=parts.reduce((a,q)=>a+q.attributes[n].array.length,0),out=new Float32Array(s);let off=0;parts.forEach(q=>{out.set(q.attributes[n].array,off);off+=q.attributes[n].array.length});return out};
      const geo=new THREE.BufferGeometry();
      geo.setAttribute('position',new THREE.BufferAttribute(cat('position'),3));geo.setAttribute('normal',new THREE.BufferAttribute(cat('normal'),3));geo.setAttribute('uv',new THREE.BufferAttribute(cat('uv'),2));
      geo.computeBoundingSphere();
      list.forEach(o=>{g.remove(o);o.geometry.dispose();if(o.material!==list[0].material)o.material.dispose()});
      parts.forEach(q=>q.dispose());
      g.add(new THREE.Mesh(geo,list[0].material));
    });
    return g;
  }
  /* ---- sangkar penjara: jatuh menimpa pion dan mengurungnya selama hukuman ---- */
  makeCage(){
    const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x9aa3b2,metalness:.85,roughness:.35});
    for(let i=0;i<10;i++){const a=i/10*Math.PI*2,b=new THREE.Mesh(new THREE.CylinderGeometry(1.2,1.2,88,8),m);b.position.set(Math.cos(a)*21,45,Math.sin(a)*21);g.add(b)}
    const ring=y=>{const r=new THREE.Mesh(new THREE.TorusGeometry(21,1.6,8,28),m);r.rotation.x=Math.PI/2;r.position.y=y;g.add(r)};ring(88);ring(4);
    const lock=new THREE.Mesh(new THREE.BoxGeometry(8,7,4),new THREE.MeshStandardMaterial({color:0xffd24a,metalness:.9,roughness:.25}));lock.position.set(0,46,22);g.add(lock);
    return this.mergeStatic(g);
  }
  dropCage(w){const c=this.makeCage();w.cage=c;c.position.y=240;w.holder.add(c);if(RM){c.position.y=0;return}gsap.to(c.position,{y:0,duration:.75,delay:.65,ease:'bounce.out'})}
  liftCage(w){const c=w.cage;w.cage=null;if(!c)return;if(RM){w.holder.remove(c);return}gsap.to(c.position,{y:240,duration:.6,ease:'power2.in',onComplete:()=>w.holder.remove(c)})}
  setLite(on){this.lite=!!on;this.tiles.forEach(m=>{if(m.userData.aura)m.userData.aura.intensity=on?0:1.3})}
  movePawn(k,to){
    const w=this.pawns[k];if(!w)return;
    const from=w.tile,steps=(to-from+N)%N;w.tile=to;
    gsap.killTweensOf(w);w.h=0;
    if(RM||!steps){const t=this.tpx(to);w.bx=t.x;w.by=t.y;this.place(w);return}
    const tl=gsap.timeline();
    for(let s=1;s<=steps;s++){             /* lompat per petak; tiap petak yang disinggahi memicu efek */
      const idx=(from+s)%N,t=this.tpx(idx),last=s===steps;
      tl.to(w,{bx:t.x,by:t.y,duration:.17,ease:'power1.inOut',onUpdate:()=>this.place(w)});
      tl.to(w,{h:(last?46:14)*this.U,duration:.085,yoyo:true,repeat:1,ease:'power1.out',onUpdate:()=>this.place(w)},'<');
      tl.call(()=>this.stepFx(idx));
    }
  }
  stepFx(i){if(RM)return;const c=ctr(i);if(c)bxy(c[0],c[1],'#fff3c4',6)}

  makeCrystalPawn(color){                  /* pion kristal ala LGR: base emas, badan kaca hijau, inti bercahaya */
    const c=new THREE.Color(color),g=new THREE.Group();
    const gold=new THREE.MeshStandardMaterial({color:0xffd24a,metalness:.85,roughness:.22});
    const glass=new THREE.MeshPhysicalMaterial({color:c,roughness:.08,metalness:.1,clearcoat:1,clearcoatRoughness:.05,transparent:true,opacity:.82,emissive:c.clone().multiplyScalar(.18)});   /* kaca: r128 belum punya transmission/thickness yang andal */
    const orbM=new THREE.MeshBasicMaterial({color:c.clone().lerp(new THREE.Color(0xffffff),.55)});
    const shade=new THREE.Mesh(new THREE.CircleGeometry(17,28),new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.3,depthWrite:false}));
    shade.scale.y=.45;shade.position.z=-4;
    const base=new THREE.Mesh(new THREE.CylinderGeometry(14,16,6,28),gold);base.position.y=3;
    const body=new THREE.Mesh(new THREE.CylinderGeometry(7,13,30,28),glass);body.position.y=21;
    const orb=new THREE.Mesh(new THREE.SphereGeometry(8,22,16),orbM);orb.position.y=43;
    const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glowTex(),color:c,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));
    glow.scale.set(46,46,1);glow.position.y=43;
    g.add(shade,base,body,orb,glow);return g;
  }
  /* loadCharacterPawn(characterId, type): 'auto' = coba GLB dulu, lalu sprite; 'glb'; 'sprite'; 'crystal'.
     Selalu mengembalikan Promise<THREE.Group>, jadi pemanggil tidak perlu tahu sumbernya. */
  async createCharacterPawn(characterId,type='auto',color=0xffffff){
    if(type==='crystal')return this.makeCrystalPawn(color);
    if(type==='sprite')return (await this.makeSpritePawn(characterId,color))||this.makeCrystalPawn(color);
    if((type==='glb'||(type==='auto'&&this.useGLB))){const g=await this.tryGLB(characterId);if(g)return g}
    return this.makeMiniature(characterId,color);
  }
  /* Jalur 3D: GLTFLoader dimuat sekali. Tanpa file models/{id}.glb, fungsi ini mengembalikan null. */
  ensureGLTF(){
    if(THREE.GLTFLoader)return Promise.resolve(true);
    if(!this.gltfReady)this.gltfReady=new Promise(res=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
      s.onload=()=>res(!!THREE.GLTFLoader);s.onerror=()=>res(false);
      try{(document.head||document.body).appendChild(s)}catch(e){res(false)}
    });
    return this.gltfReady;
  }
  tryGLB(id){
    if(this.glbOK[id]===false)return Promise.resolve(null);
    return this.ensureGLTF().then(ok=>{
      if(!ok){this.glbOK[id]=false;return null}
      return new Promise(res=>{
        new THREE.GLTFLoader().load(this.glbBase+id+'.glb',gltf=>{
          const m=gltf.scene,size=new THREE.Box3().setFromObject(m).getSize(new THREE.Vector3());
          m.scale.multiplyScalar(90/Math.max(size.y,1));                       /* tinggi model dinormalkan ke 90 unit */
          m.position.y-=new THREE.Box3().setFromObject(m).min.y;               /* telapak kaki di y = 0 */
          const g=new THREE.Group();g.add(m);this.glbOK[id]=true;res(g);
        },undefined,()=>{this.glbOK[id]=false;res(null)});
      });
    });
  }
  /* Potret karakter dipotong bulat. Dari file lokal (C:/...), browser memblokir pembacaan piksel,
     getImageData melempar error, dan fungsi ini mengembalikan null sehingga pion kristal dipakai. */
  loadPortrait(id,path){
    const key='pt:'+(path||id);
    if(key in this.texCache)return Promise.resolve(this.texCache[key]);
    return new Promise(res=>{
      const im=new Image();
      im.onload=()=>{
        try{
          const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');
          const s=Math.min(im.width,im.height);
          x.save();x.beginPath();x.arc(128,128,124,0,Math.PI*2);x.clip();
          x.drawImage(im,(im.width-s)/2,Math.max(0,(im.height-s)*.12),s,s,0,0,256,256);x.restore();
          x.getImageData(0,0,1,1);
          x.strokeStyle='#ffd24a';x.lineWidth=10;x.beginPath();x.arc(128,128,119,0,Math.PI*2);x.stroke();
          res(this.texCache[key]=new THREE.CanvasTexture(c));
        }catch(e){res(this.texCache[key]=null)}
      };
      im.onerror=()=>res(this.texCache[key]=null);
      im.src=path||('img/chars/'+id+'.jpg');
    });
  }
  async makeSpritePawn(id,color,path){      /* 2.5D: sprite billboard berdiri di atas alas silinder EMAS, pita warna pemain */
    const tx=await this.loadPortrait(id,path);if(!tx)return null;
    const g=new THREE.Group();
    const base=new THREE.Mesh(new THREE.CylinderGeometry(15,17,6,28),new THREE.MeshStandardMaterial({color:0xffd24a,metalness:.85,roughness:.22}));base.position.y=3;
    const band=new THREE.Mesh(new THREE.CylinderGeometry(15.4,15.4,2.4,28),new THREE.MeshStandardMaterial({color:new THREE.Color(color),roughness:.5}));band.position.y=6.6;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true}));sp.scale.set(56,56,1);sp.position.y=46;
    g.add(base,band,sp);return g;
  }
  /* API publik: loadCharacterPawn(img, playerId) memasang sprite dari gambar img pada pion pemain playerId.
     (Napas naik-turun sudah aktif di addPawn lewat GSAP; lompatan di movePawn.) */
  async loadCharacterPawn(img,playerId){
    const w=this.pawns[playerId];if(!w)return null;
    const id=((String(img).match(/([^\/\\]+)\.[a-z]+$/i)||[])[1])||String(img),col=w.holder.userData.col||0xffd24a;
    const token=++w.token,g=(await this.makeSpritePawn(id,col,String(img)))||this.makeCrystalPawn(col);
    if(w.token!==token)return g;
    while(w.holder.children.length)w.holder.remove(w.holder.children[0]);w.holder.add(g);return g;
  }

  /* ===== 3. BANGUNAN BERTINGKAT: level 1 = Rumah 1, level 2 = Rumah 2, level 3 = Landmark (rumah dihancurkan) ===== */
  ownerColor(i){return O[i]!==undefined&&P[O[i]]?P[O[i]].k:'#e8d9a0'}
  syncProps(H){
    for(let i=0;i<N;i++){
      const lv=(H&&H[i])||0,old=this.props[i];
      if((old?old.level:0)!==lv)this.buildPropertyOnTile(i,lv,!this.propsReady);   /* muat awal: tanpa animasi */
      else if(old&&old.owner!==O[i])this.recolor(i,old);                             /* takeover: warna pemilik baru */
    }
    this.propsReady=true;
  }
  buildTile(...a){return this.buildPropertyOnTile(...a)}
  recolor(i,old){old.owner=O[i];if(old.level>=3)return;const lv=old.level;this.retire(i,old,true);this.buildPropertyOnTile(i,lv,false)}
  /* buildPropertyOnTile(tileIndex, buildLevel): 1 = 1 rumah, 2 = 2 rumah, 3 = Landmark (rumah dihapus) */
  buildPropertyOnTile(i,lv,silent=false){
    const old=this.props[i];
    if((old?old.level:0)===lv)return;
    const col=this.ownerColor(i);
    if(lv<=0){if(old)this.retire(i,old,silent);return}
    if(old&&old.level===1&&lv===2&&!silent){            /* 1 -> 2: rumah pertama tetap, rumah kedua pop-up di kanan */
      old.level=2;old.owner=O[i];this.addHouse(old,18,2,col,.2,false);return;
    }
    if(old)this.retire(i,old,silent);
    const t=this.tpx(i),holder=new THREE.Group();
    holder.position.set(t.x,-t.y,20);holder.scale.setScalar(this.U);this.propLayer.add(holder);
    const rec={i,holder,level:lv,owner:O[i],parts:[],g:null,ring:null,light:null};
    this.props[i]=rec;
    if(lv<=2){const xs=lv===1?[-18]:[-18,18];xs.forEach((x,j)=>this.addHouse(rec,x,2,col,silent?0:j*.2,silent))   /* pop-up elastic bergantian */
    }else this.buildLandmark(rec,col,silent);
  }
  houseGroup(x,tier,col){                                /* kubus batu + atap prisma segitiga kayu */
    const g=new THREE.Group(),c=new THREE.Color(col);
    const wall=new THREE.MeshStandardMaterial({map:this.stoneTex(),color:c.clone().lerp(new THREE.Color(0xffffff),.45),roughness:.9});
    const roofM=new THREE.MeshStandardMaterial({map:this.woodTex(),color:c,roughness:.7});
    const Wd=20,Dp=20,Hh=tier===3?42:24;
    const body=new THREE.Mesh(new THREE.BoxGeometry(Wd,Hh,Dp),wall);body.position.y=Hh/2;g.add(body);
    const sh=new THREE.Shape();sh.moveTo(-Wd/2-3,0);sh.lineTo(Wd/2+3,0);sh.lineTo(0,15);sh.closePath();
    const roof=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:Dp+2,bevelEnabled:false}),roofM);
    roof.position.set(0,Hh,-(Dp+2)/2);g.add(roof);
    g.position.x=x;return g;
  }
  addHouse(rec,x,tier,col,delay=0,silent=false){
    const h=this.houseGroup(x,tier,col);rec.holder.add(h);rec.parts.push(h);
    if(silent||RM){h.scale.setScalar(1);return}
    h.scale.setScalar(.001);
    gsap.to(h.scale,{x:1,y:1,z:1,duration:.9,delay,ease:'elastic.out(1,0.5)'});
    gsap.delayedCall(delay+.05,()=>burst(rec.i,'#d8b98a',12));          /* debu saat rumah jatuh ke petak */
  }
  retire(i,old,silent){                                  /* bangunan lama menyusut lalu dilepas dari scene */
    delete this.props[i];
    const done=()=>{if(old.holder.parent)old.holder.parent.remove(old.holder)};
    const kids=old.g?[old.g]:old.parts.slice();
    if(silent||RM||!kids.length)return done();
    kids.forEach((k,j)=>gsap.to(k.scale,{x:.001,y:.001,z:.001,duration:.3,delay:j*.04,ease:'back.in(2)',onComplete:j===kids.length-1?done:undefined}));
  }
  buildLandmark(rec,col,silent){                         /* kastil megah + lingkaran sihir + cahaya emas */
    const stone=new THREE.MeshStandardMaterial({color:0xcbbd9c,roughness:.75});
    const green=new THREE.MeshStandardMaterial({color:0x1f7a4a,roughness:.5,emissive:0x06210f});
    const gold=new THREE.MeshStandardMaterial({color:0xffd24a,metalness:.8,roughness:.25});
    const g=new THREE.Group();
    const add=(geo,m,x,y)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,0);g.add(o)};
    add(new THREE.CylinderGeometry(12,15,46,10),stone,0,23);
    add(new THREE.ConeGeometry(16,30,10),green,0,61);
    add(new THREE.SphereGeometry(4,12,10),gold,0,80);
    [-20,20].forEach(x=>{add(new THREE.CylinderGeometry(6,7,34,10),stone,x,17);add(new THREE.ConeGeometry(9,18,10),green,x,43)});
    const ring=new THREE.Mesh(new THREE.PlaneGeometry(96,96),new THREE.MeshBasicMaterial({map:this.runeTex(),transparent:true,depthWrite:false}));
    ring.position.z=-6;g.add(ring);
    const light=new THREE.PointLight(0xffd24a,2.2,320);light.position.set(0,46,70);g.add(light);
    rec.g=g;rec.ring=ring;rec.light=light;rec.holder.add(g);
    if(silent||RM)return;
    g.scale.setScalar(.001);
    gsap.to(g.scale,{x:1,y:1,z:1,duration:1.5,delay:.35,ease:'elastic.out(1,0.5)'});
    gsap.fromTo(ring.scale,{x:.2,y:.2,z:1},{x:1,y:1,duration:1.2,ease:'power2.out'});
    gsap.fromTo(light,{intensity:0},{intensity:2.2,duration:.9,delay:.35});
    this.celebrate(rec.i);
  }
  celebrate(i){                                          /* ledakan partikel + teks melayang "LANDMARK BUILT!" */
    if(RM)return;
    const t=this.tpx(i);
    gsap.delayedCall(.9,()=>{burst(i,'#ffd24a',70);swirl(i,'#ffe08a',60)});
    this.showFloatingText('LANDMARK BUILT!','#ffd700',new THREE.Vector3(t.x,-(t.y-100*this.U),0));
  }

  /* ===== 4. TEKSTUR PROSEDURAL (tanpa file, cache per nama) ===== */
  tex(key,draw){
    if(!this.texCache[key]){const c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'),256);this.texCache[key]=new THREE.CanvasTexture(c)}
    return this.texCache[key];
  }
  stoneTex(){return this.tex('stone',(x,s)=>{
    x.fillStyle='#8a8478';x.fillRect(0,0,s,s);
    for(let i=0;i<220;i++){x.fillStyle=Math.random()<.5?'rgba(255,255,255,.08)':'rgba(0,0,0,.12)';x.fillRect(Math.random()*s,Math.random()*s,4+Math.random()*14,3+Math.random()*8)}
    x.strokeStyle='rgba(30,26,22,.5)';x.lineWidth=3;
    for(let r=0;r<s;r+=64){x.beginPath();x.moveTo(0,r);x.lineTo(s,r);x.stroke();for(let c=(r/64)%2*32;c<s;c+=64){x.beginPath();x.moveTo(c,r);x.lineTo(c,r+64);x.stroke()}}
  })}
  woodTex(){return this.tex('wood',(x,s)=>{
    x.fillStyle='#6b4423';x.fillRect(0,0,s,s);
    for(let i=0;i<46;i++){x.strokeStyle=`rgba(35,20,8,${.2+Math.random()*.35})`;x.lineWidth=1+Math.random()*2.5;const y=Math.random()*s;x.beginPath();x.moveTo(0,y);x.bezierCurveTo(s*.3,y+Math.random()*16-8,s*.6,y+Math.random()*16-8,s,y);x.stroke()}
  })}
  runeTex(){return this.tex('rune',(x,s)=>{
    const m=s/2;x.translate(m,m);x.strokeStyle='#7dffb0';x.shadowColor='#7dffb0';x.shadowBlur=14;
    x.lineWidth=6;x.beginPath();x.arc(0,0,s*.46,0,Math.PI*2);x.stroke();
    x.lineWidth=4;x.beginPath();x.arc(0,0,s*.36,0,Math.PI*2);x.stroke();
    x.lineWidth=3;for(let k=0;k<8;k++){x.save();x.rotate(k*Math.PI/4);x.beginPath();x.moveTo(s*.2,0);x.lineTo(s*.32,0);x.stroke();x.restore()}
    for(let k=0;k<6;k++){const a=k*Math.PI/3,b=a+2*Math.PI/3;x.beginPath();x.moveTo(Math.cos(a)*s*.36,Math.sin(a)*s*.36);x.lineTo(Math.cos(b)*s*.36,Math.sin(b)*s*.36);x.stroke()}
  })}
  glowTex(){return this.tex('glow',(x,s)=>{const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.45)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,s,s)})}

  /* ===== 5. KLIK PETAK (Raycaster) -> modal ===== */
  buildBoxTiles(){
    const DARK=0x222222,TOPC={S:0xffd24a,C:0x9b59d6,T:0xc0392b,R:0x5d7388,U:0x5d7388,J:0x6c3fa0,F:0xe67e22,W:0xb03a2e};
    for(let i=0;i<N;i++){
      const t=raw[i],L=(LORE.tiles||[]).find(x=>x.id===i)||{};
      const topCol=new THREE.Color(G[t.c]||TOPC[t.c]||0x8a8478);
      /* urutan material BoxGeometry: +x,-x,+y,-y,+z(ATAS),-z. Sisi atas = gambar HD, lima sisi lain = gelap 0x222222.
         Warna dasar sudah di-set sejak awal, jadi petak tidak pernah tembus pandang saat gambar belum/tidak termuat. */
      const mats=[DARK,DARK,DARK,DARK,topCol,DARK].map(c=>new THREE.MeshStandardMaterial({color:c,transparent:true,opacity:0,depthWrite:false}));
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),mats),pivot=new THREE.Group();
      pivot.rotation.x=-this.TILT;mesh.rotation.z=Math.PI/4;pivot.add(mesh);this.tileLayer.add(pivot);
      mesh.userData={index:i,name:t.n,type:t.c,price:t.p,desc:L.desc||'',pivot,lift:0,alpha:0,float:0,hov:false,topMat:mats[4]};
      this.tiles.push(mesh);mesh.visible=false;
      if(t.c==='C'){                                       /* petak Kesempatan: mengambang + aura PointLight ungu */
        const aura=new THREE.PointLight(0xa855f7,1.3,300);this.scene.add(aura);
        const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:this.glowTex(),color:0xa855f7,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));this.scene.add(glow);
        Object.assign(mesh.userData,{aura,glow});
        if(!RM)gsap.to(mesh.userData,{float:1,duration:1.5,yoyo:true,repeat:-1,ease:'sine.inOut',onUpdate:()=>this.placeTile(mesh)});
      }
      this.safeTexture(TILE_IMG(i)).then(tx=>{if(tx){mats[4].map=tx;mats[4].color.set(0xffffff);mats[4].needsUpdate=true}});
    }
  }
  placeTile(m){
    const u=m.userData,t=this.tpx(u.index),U=this.U,fl=u.type==='C'?u.float*8:0;
    u.pivot.position.set(t.x,-t.y+(u.lift+fl)*U,-2+u.lift*.5);
    if(u.aura){u.aura.position.set(t.x,-t.y+(fl+16)*U,60);u.glow.position.set(t.x,-t.y+(fl+10)*U,30);u.glow.scale.setScalar(70*U*(.85+.15*u.float))}
  }
  layoutTiles(){const a=63*this.U*.94;this.tiles.forEach(m=>{m.scale.set(a,a,8*this.U);this.placeTile(m)})}
  setTileAlpha(m,a){m.material.forEach(x=>{x.opacity=a});m.visible=a>.01}   /* alpha 0 = tidak digambar (raycast tetap berjalan) */
  setBoardMode(mode){                                      /* 'map' = peta lukis (default), 'box' = papan petak 3D tebal */
    this.mode=mode;document.body.classList.toggle('boxmode',mode==='box');
    this.tiles.forEach(m=>{const u=m.userData;u.alpha=mode==='box'?1:(u.hov?.88:0);this.setTileAlpha(m,u.alpha)});
    this.layout();
  }
  /* tekstur aman: dibaca lewat canvas; bila diblokir (file:// atau lintas-origin) hasilnya null dan warna dasar tetap dipakai */
  safeTexture(url){
    const key='tx:'+url;if(key in this.texCache)return Promise.resolve(this.texCache[key]);
    return new Promise(res=>{
      const im=new Image();
      im.onload=()=>{try{const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.drawImage(im,0,0,256,256);x.getImageData(0,0,1,1);res(this.texCache[key]=new THREE.CanvasTexture(c))}catch(e){res(this.texCache[key]=null)}};
      im.onerror=()=>res(this.texCache[key]=null);
      im.src=url;
    });
  }
  pickTile(cx,cy){
    this.mouse.set(cx/this.W*2-1,-(cy/this.H)*2+1);
    this.scene.updateMatrixWorld(true);this.cam.updateMatrixWorld();
    this.raycaster.setFromCamera(this.mouse,this.cam);
    let best=-1,bd=1e12;
    this.raycaster.intersectObjects(this.tiles).forEach(h=>{const id=h.object.userData.index,t=this.tpx(id),dd=(t.x-cx)**2+(t.y-cy)**2;if(dd<bd){bd=dd;best=id}});
    return best;
  }
  onMouseClick(e){
    if(!this.vis||this.dead)return;
    const b=this.pickTile(e.clientX,e.clientY);if(b<0)return;
    this.ripple(b);this.openTileModal(b);
  }
  onHover(e){
    if(!this.vis||this.dead||e.pointerType==='touch')return;
    const b=this.pickTile(e.clientX,e.clientY);
    if(b===this.hover){if(b>=0)this.moveTip(e);return}
    if(this.hover>=0)this.unhover(this.hover);
    this.hover=b;
    if(b<0){this.hideTip();return}
    const m=this.tiles[b],u=m.userData;u.hov=true;
    if(RM){u.lift=10;u.alpha=this.mode==='box'?1:.88;this.setTileAlpha(m,u.alpha);this.placeTile(m)}
    else gsap.to(u,{lift:10,alpha:this.mode==='box'?1:.88,duration:.2,onUpdate:()=>{this.setTileAlpha(m,u.alpha);this.placeTile(m)}});   /* petak naik sedikit */
    this.showTip(b,e);
  }
  unhover(i){
    const m=this.tiles[i],u=m.userData;u.hov=false;
    if(RM){u.lift=0;u.alpha=this.mode==='box'?1:0;this.setTileAlpha(m,u.alpha);this.placeTile(m);return}
    gsap.to(u,{lift:0,alpha:this.mode==='box'?1:0,duration:.2,onUpdate:()=>{this.setTileAlpha(m,u.alpha);this.placeTile(m)}});
  }
  clearHover(){if(this.hover>=0)this.unhover(this.hover);this.hover=-1;this.hideTip()}
  showTip(i,e){
    if(!P.length)return;
    const d=this.api.tile(i),L=(LORE.tiles||[]).find(x=>x.id===i)||{},tp=document.getElementById('tile-tooltip');
    tp.innerHTML=MAPSEL===2?'<b>'+d.name+'</b><small>'+((getTileLore(i)||{}).subtitle||'')+'</small>'   /* peta 2: hanya name + subtitle */
      :'<b>'+d.name+'</b><span class="tg">'+d.tag+'</span><br>Harga: '+(d.sell?d.price+'G':'-')+'<small>'+(L.desc||'')+'</small>';
    tp.style.display='block';this.moveTip(e);
  }
  moveTip(e){const tp=document.getElementById('tile-tooltip');tp.style.left=Math.min(e.clientX+15,Math.max(0,this.W-250))+'px';tp.style.top=(e.clientY+15)+'px'}
  hideTip(){document.getElementById('tile-tooltip').style.display='none'}
  takeFx(i){                                               /* efek ambil alih */
    if(i<0||RM)return;const t=this.tpx(i);
    swirl(i,'#c58cff',60);burst(i,'#c58cff',50);
    this.showFloatingText('AMBIL ALIH!','#c58cff',new THREE.Vector3(t.x,-(t.y-70*this.U),0));
  }
  /* pengaman: jika ada yang terlepas dari scene (lampu, lapisan, petak), pasang kembali. scene.clear() tidak pernah dipakai. */
  ensureScene(){
    this.lights.forEach(l=>{if(!l.parent)this.scene.add(l)});
    [this.tileLayer,this.pawnLayer,this.propLayer].forEach(g=>{if(!g.parent)this.scene.add(g)});
    this.tiles.forEach(m=>{const pv=m.userData.pivot;if(pv&&!pv.parent)this.tileLayer.add(pv)});
    this.cam.position.set(0,0,1500);this.cam.lookAt(0,0,0);   /* kamera selalu menatap pusat */
  }
  openTileModal(i){openTileModal(i)}
  ripple(i){
    if(RM)return;const t=this.tpx(i);
    const m=new THREE.Mesh(new THREE.RingGeometry(.8,1,32),new THREE.MeshBasicMaterial({color:0xffd24a,transparent:true,depthWrite:false}));
    m.position.set(t.x,-t.y,5);m.scale.setScalar(14*this.U);m.scale.y*=.6;this.scene.add(m);
    gsap.to(m.scale,{x:44*this.U,y:26*this.U,duration:.5,ease:'power2.out'});
    gsap.to(m.material,{opacity:0,duration:.5,onComplete:()=>{this.scene.remove(m);m.geometry.dispose();m.material.dispose()}});
  }

  /* ===== 6. TEKS MELAYANG (uang / bangunan) ===== */
  pawnPos3D(k){const w=this.pawns[k];return w?new THREE.Vector3(w.holder.position.x,w.holder.position.y+90*this.U,0):new THREE.Vector3(this.R.left+this.R.width/2,-(this.R.top+this.R.height/2),0)}
  showFloatingText(text,color,worldPos){
    const v=worldPos.clone().project(this.cam),x=(v.x*.5+.5)*this.W,y=(-v.y*.5+.5)*this.H;
    const el=document.createElement('div');el.className='floating-text';el.style.left=x+'px';el.style.top=y+'px';el.style.color=color;el.textContent=text;
    document.getElementById('floating-text-container').appendChild(el);
    if(RM){el.style.transform='translate(-50%,-50%)';setTimeout(()=>el.remove(),1500);return}
    gsap.set(el,{xPercent:-50,yPercent:-50});
    gsap.fromTo(el,{scale:.6},{scale:1.15,duration:.25,ease:'back.out(2)'});
    gsap.to(el,{top:y-90,opacity:0,duration:1.8,delay:.2,ease:'power2.out',onComplete:()=>el.remove()});
  }

  /* ===== 7. DADU ===== */
  faceTex(v,dark){
    const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');
    x.fillStyle=dark?'#3a3f50':'#f4ead0';x.fillRect(0,0,128,128);x.strokeStyle=dark?'#1c1f2a':'#c9b88a';x.lineWidth=6;x.strokeRect(3,3,122,122);
    x.fillStyle='#ffc83a';
    FACE[v-1].forEach(k=>{const cx=24+(k%3)*40,cy=24+Math.floor(k/3)*40;x.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,r=j%2?5.5:13;x[j?'lineTo':'moveTo'](cx+Math.cos(a)*r,cy+Math.sin(a)*r)}x.closePath();x.fill()});
    return new THREE.CanvasTexture(c);
  }
  buildDice(){
    const order=[3,4,2,5,1,6];
    this.dice=[true,false].map(dark=>{
      const mats=order.map(v=>new THREE.MeshStandardMaterial({map:this.faceTex(v,dark),roughness:.5}));
      const m=new THREE.Mesh(new THREE.BoxGeometry(34,34,34),mats);m.visible=false;this.scene.add(m);
      return{m,t:0,h:0,s:0,sx:0,sy:0,tx:0,ty:0};
    });
  }
  playTurn(r1,r2){
    if(!this.vis)return;
    const R=this.R,cup=document.querySelector('.cup'),cr=cup?cup.getBoundingClientRect():null;
    const sx=cr?cr.left+cr.width/2:R.left+R.width*.5,sy=cr?cr.top+cr.height*.3:R.top+R.height*.95;
    [r1,r2].forEach((v,n)=>{
      const D=this.dice[n],rot=diceRot(v),tw=Math.PI*2;
      gsap.killTweensOf(D);gsap.killTweensOf(D.m.rotation);
      Object.assign(D,{t:0,h:1,s:1,sx:sx+(n?14:-14),sy,tx:R.left+R.width*(.5+(n?.045:-.045)),ty:R.top+R.height*(.5+(n?.02:-.01))});
      D.m.visible=true;D.m.position.z=60;
      const upd=()=>{D.m.position.x=D.sx+(D.tx-D.sx)*D.t;D.m.position.y=-(D.sy+(D.ty-D.sy)*D.t)+D.h*90*this.U;D.m.scale.setScalar(this.U*(1+.8*D.h)*D.s)};
      if(RM){D.t=1;D.h=0;D.m.rotation.set(...rot);upd();return}
      D.m.rotation.set(Math.random()*6,Math.random()*6,Math.random()*6);upd();
      gsap.to(D,{t:1,duration:.85,ease:'power2.out',onUpdate:upd});
      gsap.to(D,{h:0,duration:.85,ease:'bounce.out',onUpdate:upd});
      gsap.to(D.m.rotation,{x:rot[0]+tw*(2+n),y:rot[1]+tw*3,z:rot[2]+tw*(1+n),duration:.85,ease:'power3.out'});
    });
  }
  hideDice(){
    this.dice.forEach(D=>{if(!D.m.visible||D.fading)return;D.fading=1;
      gsap.to(D,{s:0,duration:.35,delay:.5,ease:'power2.in',onUpdate:()=>D.m.scale.setScalar(this.U*D.s),onComplete:()=>{D.m.visible=false;D.fading=0}})});
  }

  /* ===== 8. RENDER LOOP ===== */
  loop(){
    if(this.dead)return;requestAnimationFrame(this.loop);
    if(!this.vis)return;
    if(this.lite&&((this.fc=(this.fc||0)+1)%2))return;   /* saat menahan bar dadu: 30 fps */
    {const now=performance.now(),FI=1000/60;if(this._lt===undefined)this._lt=now;if(now-this._lt<FI-2)return;this._lt=Math.max(this._lt+FI,now-FI)}   /* layar 90/120 Hz: render tetap 60 fps (hemat GPU, tidak panas) */
    const t=performance.now()/1000;
    this.pawnLayer.visible=document.body.classList.contains('p3d');
    this.pawns.forEach((w,k)=>{if(w.pg&&w.pg.userData.mini)w.pg.rotation.y=Math.sin(t*.9+k*1.7)*.38});   /* miniatur berayun pelan agar terlihat 3D */
    Object.values(this.props).forEach((q,j)=>{if(q.ring)q.ring.rotation.z=t*.4;if(q.g)q.g.position.y=2.5*Math.sin(t*2+j)});
    try{this.ensureScene();this.renderer.render(this.scene,this.cam)}catch(e){console.warn('3D dimatikan:',e);this.off();gameMotion=null}
  }
}

/* pasang lapisan 3D bila three.js dan GSAP termuat; bila gagal, game tetap jalan dengan peta 2D */
try{
  if(window.THREE&&window.gsap){
    gameMotion=new MagicMonopolyLGR('game-canvas-container',API);window.gameMotion=gameMotion;
    document.body.classList.add('has3d','p3d');
    const rl=()=>gameMotion&&gameMotion.layout();
    addEventListener('resize',rl);addEventListener('scroll',rl,{passive:true});
    if(window.ResizeObserver)new ResizeObserver(rl).observe($('board'));
  }
}catch(e){console.warn('Lapisan 3D tidak aktif:',e);gameMotion=null;document.body.classList.remove('has3d','p3d')}
window.kocokDadu=()=>roll();   /* alias: tombol/aksi lempar dadu */
