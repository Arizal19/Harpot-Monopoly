/* =====================================================================
   HARPOT MONOPOLY: RUMAH BERGAMBAR + MOTION BANGUN (Peta 1 dan Peta 2)
   Tingkat 1, Tingkat 2 dan Landmark 4D memakai potongan gambar referensi (js/houses-art.js).
     Peta 1 (Harpot 4) : rumah dari gambar dengan latar papan Harpot.
     Peta 2 (Wizarding): rumah dari gambar dengan latar papan naga dan ular.
   Motion mengikuti video "Workflow Bangun Rumah 1-Landmark":
     pion beli petak -> akta emas bersinar -> pecah jadi hujan koin -> cincin sihir hijau berputar
       -> rumah muncul dari kabur ke tajam + kilau -> papan nama "TINGKAT 1".
     naik level -> cincin ungu+emas (Tingkat 2) / biru+hijau+putih (Landmark) -> rumah lama berganti rumah baru.
   Idle: asap cerobong, cahaya warna pemilik di alas, cincin pelan di Landmark.
   Patch MagicMonopolyLGR.prototype; view.js tidak diubah. Muat SETELAH js/view.js dan js/houses-art.js.
   ===================================================================== */
(function () {
  const View = window.MagicMonopolyLGR || (typeof MagicMonopolyLGR !== 'undefined' ? MagicMonopolyLGR : null);
  const ART = window.HOUSE_ART;
  if (!View || !ART || typeof THREE === 'undefined' || typeof gsap === 'undefined') { console.warn('houses-img: dependensi belum dimuat'); return; }
  const VP = View.prototype;
  const RMx = typeof RM !== 'undefined' && RM;
  const M2 = typeof MAPSEL !== 'undefined' && MAPSEL === 2;
  const SET = M2 ? 'm2' : 'm1';

  /* w = lebar gambar (unit papan, 1 unit = lebar papan/1000), ar = tinggi/lebar,
     base = tengah alas batu diukur dari bawah gambar (fraksi tinggi), smoke = cerobong [x,y] fraksi dari kiri-atas */
  const SPEC = M2 ? {
    1: { w: 58, ar: 287 / 300, base: .17, smoke: [.63, .07] },
    2: { w: 62, ar: 333 / 300, base: .15, smoke: [.6, .05] },
    3: { w: 72, ar: 324 / 300, base: .15, smoke: null },
  } : {
    1: { w: 66, ar: 304 / 320, base: .17, smoke: [.63, .05] },
    2: { w: 70, ar: 338 / 320, base: .15, smoke: [.71, .03] },
    3: { w: 76, ar: 406 / 320, base: .13, smoke: null },
  };
  const KEY = { 1: 'h1', 2: 'h2', 3: 'lm' };
  const PLQ = { 1: ['plq_t1', 80 / 260], 2: ['plq_t2', 80 / 260], 3: ['plq_lm', 74 / 260] };
  const RINGS = { 1: [0x6dff7a, 0xc8ff6a], 2: [0xb48cff, 0xffd24a, 0xffffff], 3: [0x7fd8ff, 0x6dff9a, 0xffffff] };
  const LV = l => Math.max(1, Math.min(3, l));
  /* rumah agak kecil dan digeser ke sisi petak yang menghadap tengah papan (seperti rumah Monopoli asli) */
  const SMALL = .72, INSET = M2 ? 12 : 16;
  let MID = null;                                           /* titik tengah cincin petak, persen papan */
  function inward(v, i) {
    if (!MID) MID = POS.reduce((a, p) => [a[0] + p[0] / POS.length, a[1] + p[1] / POS.length], [0, 0]);
    const R = v.R, dx = (MID[0] - POS[i][0]) * R.width, dy = (MID[1] - POS[i][1]) * R.height, d = Math.hypot(dx, dy) || 1;
    return [dx / d * INSET, -dy / d * INSET];               /* unit lokal holder; sumbu y three = ke atas layar */
  }

  /* ---------- tekstur (cache sekali per halaman) ---------- */
  const TX = {}, OWN = new WeakSet();               /* OWN = tekstur klon milik satu cincin (r128: Texture belum punya userData) */
  function imgTex(key) {
    if (!TX[key]) TX[key] = new THREE.TextureLoader().load(ART[key]);
    return TX[key];
  }
  function blurTex(key) {                    /* versi kabur: kecilkan 1/8 lalu besarkan lagi (jalan juga di Safari lama) */
    const k = key + '_b';
    if (TX[k]) return TX[k];
    const c = document.createElement('canvas'); c.width = c.height = 2;
    const t = TX[k] = new THREE.CanvasTexture(c), im = new Image();
    im.onload = () => {
      const w = im.width, h = im.height, s = document.createElement('canvas');
      s.width = Math.max(4, w >> 3); s.height = Math.max(4, h >> 3);
      s.getContext('2d').drawImage(im, 0, 0, s.width, s.height);
      c.width = w; c.height = h; c.getContext('2d').drawImage(s, 0, 0, w, h); t.needsUpdate = true;
    };
    im.src = ART[key];
    return t;
  }
  function cv(key, w, h, draw) {
    if (!TX[key]) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); TX[key] = new THREE.CanvasTexture(c); }
    return TX[key];
  }
  const rr = (x, a, b, w, h, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); };
  const glowTex = () => cv('glow', 128, 128, (x, S) => {
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.35, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  });
  const ringTex = () => cv('ring', 256, 256, (x, S) => {   /* tiga ekor komet melingkar, putih (diwarnai lewat material) */
    x.lineCap = 'round'; x.shadowColor = '#fff'; x.shadowBlur = 8;
    for (let a = 0; a < 3; a++) {
      const st = a * 2.1, r = S * .43 - a * 5;
      for (let k = 0; k < 40; k++) {
        const f = k / 40; x.strokeStyle = 'rgba(255,255,255,' + (f * f).toFixed(3) + ')'; x.lineWidth = 1.5 + f * 6;
        x.beginPath(); x.arc(S / 2, S / 2, r, st + f * 1.7, st + f * 1.7 + .07); x.stroke();
      }
    }
  });
  const coinTex = () => cv('coin', 64, 64, (x, S) => {
    const g = x.createRadialGradient(S * .4, S * .38, 2, S / 2, S / 2, S / 2);
    g.addColorStop(0, '#fff6c2'); g.addColorStop(.55, '#ffcf3a'); g.addColorStop(1, '#a86a0a');
    x.fillStyle = g; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 2, 0, 7); x.fill();
    x.strokeStyle = '#8a5a08'; x.lineWidth = 3; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 8, 0, 7); x.stroke();
    x.fillStyle = '#8a5a08'; x.font = 'bold 26px Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('G', S / 2, S / 2 + 2);
  });
  const sparkTex = () => cv('spark', 64, 64, (x, S) => {
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.2, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.fillStyle = '#fff'; x.beginPath(); x.moveTo(S / 2, 2); x.lineTo(S / 2 + 3, S / 2 - 3); x.lineTo(S - 2, S / 2); x.lineTo(S / 2 + 3, S / 2 + 3);
    x.lineTo(S / 2, S - 2); x.lineTo(S / 2 - 3, S / 2 + 3); x.lineTo(2, S / 2); x.lineTo(S / 2 - 3, S / 2 - 3); x.closePath(); x.fill();
  });
  const puffTex = () => cv('puff', 64, 64, (x, S) => {
    const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    g.addColorStop(0, 'rgba(235,235,235,.9)'); g.addColorStop(.6, 'rgba(200,200,200,.35)'); g.addColorStop(1, 'rgba(200,200,200,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  });
  const deedTex = () => cv('deed', 256, 192, (x, W, H) => {     /* akta gulungan perkamen + label harga emas */
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#f8ebc6'); g.addColorStop(1, '#d6b679');
    x.fillStyle = g; rr(x, 22, 26, W - 44, H - 52, 10); x.fill();
    [16, H - 32].forEach(y => {
      const r = x.createLinearGradient(0, y, 0, y + 16); r.addColorStop(0, '#c49b58'); r.addColorStop(.5, '#fff3cf'); r.addColorStop(1, '#9c7436');
      x.fillStyle = r; rr(x, 10, y, W - 20, 16, 8); x.fill();
    });
    x.strokeStyle = '#b08a4a'; x.lineWidth = 2; rr(x, 34, 44, W - 68, H - 88, 6); x.stroke();
    x.fillStyle = '#b9975a'; for (let k = 0; k < 4; k++) x.fillRect(50, 62 + k * 15, 92 - k * 12, 5);
    x.save(); x.translate(176, 98); x.rotate(.32);
    x.fillStyle = '#2a1d0e'; rr(x, -24, -30, 48, 60, 8); x.fill();
    x.strokeStyle = '#ffd24a'; x.lineWidth = 2; rr(x, -19, -25, 38, 50, 6); x.stroke();
    x.fillStyle = '#ffd24a'; x.font = 'bold 32px Georgia,serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('G', 0, 3);
    x.restore();
  });

  /* ---------- mesh helper ---------- */
  /* geometri dipakai bersama (cache per ukuran): koin, kilau, asap, rumah tidak membuat buffer GPU baru tiap kali muncul */
  const GEO = new Map(), SHARED = new WeakSet();
  function geo(w, h, dy) {
    const k = w + '|' + h + '|' + (dy || 0);
    let g = GEO.get(k);
    if (!g) { g = new THREE.PlaneGeometry(w, h); if (dy) g.translate(0, dy, 0); SHARED.add(g); GEO.set(k, g); }
    return g;
  }
  function plane(map, w, h, o) {
    o = o || {};
    return new THREE.Mesh(geo(w, h, o.dy), new THREE.MeshBasicMaterial({
      map, transparent: true, depthWrite: false, opacity: o.op === undefined ? 1 : o.op,
      color: o.col === undefined ? 0xffffff : o.col, blending: o.add ? THREE.AdditiveBlending : THREE.NormalBlending,
    }));
  }
  function dispose(obj) {
    obj.traverse(m => {
      if (!m.isMesh) return;
      if (!SHARED.has(m.geometry)) m.geometry.dispose();
      if (OWN.has(m.material.map)) m.material.map.dispose();
      m.material.dispose();
    });
  }
  /* Tween TIDAK boleh dimatikan langsung di dalam callback GSAP: daftar tween sedang diiterasi, sehingga tween
     sesudahnya terlewat dan bisa macet (koin/asap tertinggal). Jadi pembunuhan tween ditunda ke microtask. */
  const later = typeof queueMicrotask === 'function' ? queueMicrotask : f => Promise.resolve().then(f);
  const stopTw = t => { if (t) later(() => t.kill()); };
  function kill(obj) {
    if (!obj || obj.userData.dead) return;
    obj.userData.dead = true;
    if (obj.parent) obj.parent.remove(obj);
    later(() => {
      obj.traverse(m => { gsap.killTweensOf([m, m.position, m.scale]); if (m.material) { gsap.killTweensOf(m.material); if (OWN.has(m.material.map)) gsap.killTweensOf(m.material.map); } });
      dispose(obj);
    });
  }
  function houseMesh(lv, blur) {
    const sp = SPEC[lv], key = SET + '_' + KEY[lv], w = sp.w, h = w * sp.ar;
    return plane(blur ? blurTex(key) : imgTex(key), w, h, { dy: h / 2 - h * sp.base });   /* titik asal = tengah alas batu, jadi rumah "tumbuh" dari petak */
  }
  const HALF = {};
  function halfGeo(top) {                                   /* setengah elips: belakang di balik rumah, depan di muka rumah */
    if (HALF[top]) return HALF[top];
    const g = HALF[top] = new THREE.PlaneGeometry(1, .5); SHARED.add(g); g.translate(0, top ? .25 : -.25, 0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, top ? .5 + uv.getY(i) * .5 : uv.getY(i) * .5);
    return g;
  }
  function ring(parent, col, R, yc, spin, op) {
    const t = ringTex().clone(); t.needsUpdate = true; OWN.add(t); t.center.set(.5, .5); t.rotation = Math.random() * 6.3;
    const g = new THREE.Group(), mats = [];
    [true, false].forEach(top => {
      const mat = new THREE.MeshBasicMaterial({ map: t, color: col, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
      const m = new THREE.Mesh(halfGeo(top), mat); m.position.z = top ? -3 : 3; mats.push(mat); g.add(m);
    });
    g.position.y = yc; g.scale.set(R * 2, R * 2 * .42, 1); parent.add(g);
    g.userData.tex = t; g.userData.mats = mats;
    gsap.to(t, { rotation: '+=' + (spin * 6.283), duration: 1, repeat: -1, ease: 'none' });
    gsap.to(mats, { opacity: op, duration: .4 });
    return g;
  }

  /* ---------- rekaman bangunan per petak ---------- */
  function newRec(v, i, lv) {
    const t = v.tpx(i), holder = new THREE.Group();
    holder.position.set(t.x, -t.y, 20); holder.scale.setScalar(v.U); v.propLayer.add(holder);
    const root = new THREE.Group(), sc = (M2 && MAP2.SC ? MAP2.SC[i] || 1 : 1) * SMALL, off = inward(v, i);
    root.scale.setScalar(sc); root.position.set(off[0] * (sc / SMALL), off[1] * (sc / SMALL), 0); holder.add(root);
    const rec = { i, holder, root, sc, level: lv, owner: O[i], house: null, glow: null, tw: [], idle: null, idleObj: [], fx: [] };
    rec.glow = plane(glowTex(), 1, .42, { add: true, col: new THREE.Color(v.ownerColor(i)), op: 0 });
    rec.glow.position.z = -4; root.add(rec.glow); sizeGlow(rec);
    rec.shadow = plane(glowTex(), 1, .42, { col: 0x000000, op: .55 });   /* bayangan kontak: alas rumah menyatu dengan petak */
    rec.shadow.position.z = -5; root.add(rec.shadow); sizeGlow(rec);
    v.props[i] = rec;
    return rec;
  }
  function sizeGlow(rec) { const w = SPEC[LV(rec.level)].w; rec.glow.scale.set(w * 1.25, w * 1.25, 1); if (rec.shadow) rec.shadow.scale.set(w * 1.1, w * 1.1, 1); }
  function track(rec, tw) { rec.tw.push(tw); return tw; }
  function hero(rec, hold) {                                /* momen bangun: rumah maju ke depan pion dan membesar, lalu kembali */
    const s = rec.sc;
    track(rec, gsap.timeline()
      .to(rec.root.position, { z: 70, duration: .3 }, 0)   /* di depan pion 3D (pion z 40 + tebal badan) */
      .to(rec.root.scale, { x: s * 1.3, y: s * 1.3, duration: .5, ease: 'back.out(1.6)' }, 0)
      .to(rec.root.scale, { x: s, y: s, duration: .6, ease: 'power2.inOut' }, hold)
      .to(rec.root.position, { z: 0, duration: .3 }, hold + .4));
  }

  function settle(rec) {                                    /* tanpa animasi: muat awal / sinkron ulang / reduced-motion */
    rec.house = houseMesh(LV(rec.level), false); rec.root.add(rec.house);
    rec.glow.material.opacity = .7;
    startIdle(rec);
  }

  function coins(rec, y0) {                                 /* akta pecah jadi hujan koin yang jatuh berputar ke cincin */
    const R = SPEC[LV(rec.level)].w * .55;
    for (let k = 0; k < 22; k++) {
      const c = plane(coinTex(), 9, 9); c.position.set(0, y0, 30); rec.root.add(c); rec.fx.push(c);
      const a = Math.random() * Math.PI, sp = 26 + Math.random() * 34, b = Math.random() * 6.283, d = Math.random() * .12;
      const tl = gsap.timeline({ delay: d, onComplete: () => kill(c) });
      tl.to(c.position, { x: Math.cos(a) * sp, y: y0 + Math.sin(a) * sp * .8, duration: .35, ease: 'power2.out' })
        .to(c.position, { x: Math.cos(b) * R, y: Math.sin(b) * R * .42 + 4, z: Math.sin(b) > 0 ? -2 : 6, duration: .55, ease: 'power2.in' })
        .to(c.material, { opacity: 0, duration: .25 }, '-=.15');
      gsap.to(c.scale, { x: .15, duration: .12 + Math.random() * .1, yoyo: true, repeat: 9, ease: 'sine.inOut' });
    }
  }
  function sparkles(rec, h, cols) {
    const w = SPEC[LV(rec.level)].w;
    for (let k = 0; k < 18; k++) {
      const s = 4 + Math.round(Math.random() * 6), p = plane(sparkTex(), s, s, { add: true, op: 0, col: cols[k % cols.length] });
      p.position.set((Math.random() - .5) * w * .9, Math.random() * h * .8, 6); rec.root.add(p); rec.fx.push(p);
      const d = Math.random() * .6, du = .8 + Math.random() * .6;
      gsap.to(p.position, { y: '+=' + (18 + Math.random() * 22), duration: du, delay: d, ease: 'power1.out' });
      gsap.to(p.material, { opacity: 1, duration: du * .35, delay: d, yoyo: true, repeat: 1, onComplete: () => kill(p) });
    }
  }
  function plaque(rec) {                                    /* papan nama TINGKAT 1 / TINGKAT 2 / LANDMARK 4D di bawah rumah */
    const lv = LV(rec.level), sp = SPEC[lv], [key, ar] = PLQ[lv], w = 44;
    const p = plane(imgTex(key), w, w * ar, { op: 0 });
    p.position.set(0, -sp.w * sp.ar * sp.base - 10, 5); rec.root.add(p); rec.fx.push(p);
    track(rec, gsap.timeline({ onComplete: () => kill(p) })
      .to(p.material, { opacity: 1, duration: .35 }, 0)
      .from(p.position, { y: p.position.y - 6, duration: .45, ease: 'back.out(2)' }, 0)
      .to(p.material, { opacity: 0, duration: .5 }, 2.4));
  }
  function ringsIn(rec, cols) {
    const sp = SPEC[LV(rec.level)];
    rec.fxRings = cols.map((c, k) => ring(rec.root, c, sp.w * (.6 + k * .09), 6 + k * 5, (k % 2 ? -1 : 1) * (1.3 + k * .4), .95));
    rec.fxRings.forEach(g => gsap.fromTo(g.scale, { x: g.scale.x * .45, y: g.scale.y * .45 }, { x: g.scale.x, y: g.scale.y, duration: .55, ease: 'back.out(1.7)' }));
  }
  function ringsOut(rec) {
    (rec.fxRings || []).forEach(g => gsap.to(g.userData.mats, { opacity: 0, duration: .6, onComplete: () => kill(g) }));
    rec.fxRings = null;
  }
  function reveal(rec, oldMesh) {                           /* rumah muncul dari kabur ke tajam (seperti di video) */
    const lv = LV(rec.level), sp = SPEC[lv], h = sp.w * sp.ar;
    const sharp = houseMesh(lv, false), bl = houseMesh(lv, true);
    sharp.material.opacity = 0; bl.material.opacity = 0; bl.position.z = .5;
    rec.root.add(sharp, bl); rec.house = sharp;
    const T = track(rec, gsap.timeline());
    T.fromTo(bl.scale, { x: .82, y: .55 }, { x: 1.04, y: 1.04, duration: .45, ease: 'back.out(1.6)' }, 0)
      .to(bl.material, { opacity: 1, duration: .3 }, 0)
      .fromTo(sharp.scale, { x: .95, y: .95 }, { x: 1, y: 1, duration: .7, ease: 'elastic.out(1,.55)' }, .35)
      .to(sharp.material, { opacity: 1, duration: .45 }, .3)
      .to(bl.material, { opacity: 0, duration: .45 }, .45)
      .add(() => kill(bl), .95)
      .to(rec.glow.material, { opacity: .7, duration: .6 }, .2)
      .add(() => sparkles(rec, h, lv === 1 ? [0xb8ff9a, 0xffe08a] : lv === 2 ? [0xd8b8ff, 0xffe08a] : [0x9fe8ff, 0xffe08a, 0xb8ffc8]), .1)
      .add(() => plaque(rec), .55)
      .add(() => ringsOut(rec), 1.3)
      .add(() => startIdle(rec), 1.0);
    if (oldMesh) T.to(oldMesh.material, { opacity: 0, duration: .35 }, 0).to(oldMesh.scale, { x: 1.06, y: .9, duration: .35 }, 0).add(() => kill(oldMesh), .4);
    if (typeof burst === 'function') track(rec, gsap.delayedCall(.15, () => burst(rec.i, '#d8b98a', 14)));
    if (lv === 3 && typeof burst === 'function') track(rec, gsap.delayedCall(.6, () => { burst(rec.i, '#ffd24a', 50); if (typeof swirl === 'function') swirl(rec.i, '#9dffb8', 40); }));
  }
  function purchase(rec) {                                  /* beli petak = Rumah 1: akta -> koin -> cincin -> rumah */
    const dg = new THREE.Group(), glow = plane(glowTex(), 90, 90, { add: true, col: 0xffd27a, op: 0 }), deed = plane(deedTex(), 46, 34, { op: 0 });
    glow.position.z = -1; dg.add(glow, deed); dg.position.set(0, 88, 30); rec.root.add(dg); rec.fx.push(dg);
    hero(rec, 3.2);
    track(rec, gsap.timeline())
      .fromTo(dg.scale, { x: .2, y: .2 }, { x: 1, y: 1, duration: .45, ease: 'back.out(2)' }, 0)
      .to(deed.material, { opacity: 1, duration: .25 }, 0)
      .to(glow.material, { opacity: .9, duration: .3 }, 0)
      .to(dg.position, { y: 100, duration: .75, ease: 'sine.inOut' }, 0)
      .to(glow.scale, { x: 1.7, y: 1.7, duration: .18, yoyo: true, repeat: 1 }, .5)
      .to(dg.scale, { x: 1.35, y: 1.35, duration: .2, ease: 'power2.in' }, .75)
      .to([deed.material, glow.material], { opacity: 0, duration: .2 }, .78)
      .add(() => { coins(rec, 100); kill(dg); }, .82)
      .add(() => ringsIn(rec, RINGS[1]), 1.05)
      .add(() => reveal(rec, null), 1.4);
  }
  function upgrade(rec, lv) {                               /* Rumah 1 -> 2 -> Landmark: cincin warna baru, rumah berganti */
    stopIdle(rec); rec.level = lv; rec.owner = O[rec.i]; sizeGlow(rec);
    const old = rec.house; rec.house = null;
    hero(rec, 2.3);
    ringsIn(rec, RINGS[LV(lv)]);
    track(rec, gsap.delayedCall(.35, () => reveal(rec, old)));
  }

  function startIdle(rec) {
    stopIdle(rec);
    if (RMx) return;
    const lv = LV(rec.level), sp = SPEC[lv], h = sp.w * sp.ar;
    rec.idleObj.push(gsap.to(rec.glow.material, { opacity: .4, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' }));
    if (sp.smoke) {
      const sx = (sp.smoke[0] - .5) * sp.w, sy = h * (1 - sp.smoke[1]) - h * sp.base;
      /* 4 kepulan dipakai bergiliran (umur 2.6 dtk, muncul tiap >= 0.85 dtk): tanpa objek baru tiap kepulan */
      if (!rec.puffs) { rec.puffs = [0, 1, 2, 3].map(() => { const p = plane(puffTex(), 9, 9, { op: 0, col: 0xdcdcdc }); p.visible = false; rec.root.add(p); return p; }); rec.pk = 0; }
      const puff = () => {
        const p = rec.puffs[rec.pk++ % 4]; p.visible = true;
        gsap.fromTo(p.position, { x: sx, y: sy, z: 1 }, { x: sx + 4 + Math.random() * 6, y: sy + 26, duration: 2.6, ease: 'sine.out' });
        gsap.fromTo(p.scale, { x: 1, y: 1 }, { x: 2.6, y: 2.6, duration: 2.6 });
        gsap.fromTo(p.material, { opacity: 0 }, { keyframes: [{ opacity: .55, duration: .5 }, { opacity: 0, duration: 2.1 }], onComplete: () => { p.visible = false; } });
        rec.idle = gsap.delayedCall(.85 + Math.random() * .4, puff);
      };
      rec.idle = gsap.delayedCall(Math.random(), puff);
    } else {                                                /* Landmark: cincin sihir hijau-emas berputar pelan */
      rec.idleRings = [ring(rec.root, 0x6dff9a, sp.w * .62, 10, .25, .55), ring(rec.root, 0xffd24a, sp.w * .7, 16, -.18, .4)];
    }
  }
  function stopIdle(rec) {
    rec.idleObj.forEach(stopTw); rec.idleObj = [];
    stopTw(rec.idle); rec.idle = null;
    (rec.idleRings || []).forEach(kill); rec.idleRings = null;
  }

  /* ---------- override API view.js (nama dan argumen tetap) ---------- */
  VP.buildPropertyOnTile = function (i, lv, silent = false) {
    const old = this.props[i];
    if ((old ? old.level : 0) === lv) return;
    if (lv <= 0) { if (old) this.retire(i, old, silent); return; }
    const anim = !silent && !RMx;
    if (old && anim && lv > old.level) { old.glow.material.color.set(this.ownerColor(i)); upgrade(old, lv); return; }   /* takeover + naik level: warna pemilik baru */
    if (old) this.retire(i, old, true);
    const rec = newRec(this, i, lv);
    if (!anim) return settle(rec);
    if (lv === 1) purchase(rec);
    else { rec.glow.material.opacity = .7; hero(rec, 2.3); ringsIn(rec, RINGS[LV(lv)]); track(rec, gsap.delayedCall(.35, () => reveal(rec, null))); }
  };
  VP.retire = function (i, old, silent) {
    if (this.props[i] === old) delete this.props[i];
    if (old.tw) { old.tw.forEach(stopTw); old.tw = []; stopIdle(old); (old.fxRings || []).forEach(kill); }
    const done = () => { if (old.holder.parent) kill(old.holder); };
    if (silent || RMx || !old.root) return done();
    gsap.to(old.root.scale, { x: old.root.scale.x * 1.1, y: .001, duration: .35, ease: 'back.in(2)', onComplete: done });
  };
  VP.recolor = function (i, old) {                          /* takeover: hanya warna cahaya pemilik yang berganti */
    old.owner = O[i];
    if (!old.glow) return;
    old.glow.material.color.set(this.ownerColor(i));
    if (!RMx) gsap.fromTo(old.glow.scale, { x: old.glow.scale.x * 1.5, y: old.glow.scale.y * 1.5 }, { x: old.glow.scale.x, y: old.glow.scale.y, duration: .6, ease: 'back.out(2)' });
  };
  VP.addHouse = function () {};                             /* tidak dipakai lagi: rumah = gambar, bukan kotak */
  const L0 = VP.layout;
  VP.layout = function () {                                 /* rumah di depan (lebih bawah di layar) digambar di atas rumah belakang */
    L0.call(this);
    for (const q of Object.values(this.props || {})) q.holder.position.z = 20 + (-q.holder.position.y) * .008;
  };
  /* pemanasan: unggah tekstur rumah/efek ke GPU dan kompilasi shader saat menganggur, agar beli rumah pertama tidak tersendat */
  function prewarm() {
    const g = window.gameMotion;
    if (!g || !g.renderer || !g.scene) return;
    const r = g.renderer, keys = [1, 2, 3].map(l => SET + '_' + KEY[l]).concat(['plq_t1', 'plq_t2', 'plq_lm']);
    keys.forEach(k => imgTex(k));
    [glowTex(), ringTex(), coinTex(), sparkTex(), puffTex(), deedTex()].forEach(t => r.initTexture(t));
    keys.forEach(k => blurTex(k));
    const tmp = new THREE.Group();
    tmp.add(plane(imgTex(keys[0]), 1, 1), plane(glowTex(), 1, 1, { add: true }), ring(tmp, 0xffffff, 1, 0, 0, 0));
    tmp.position.set(-99999, 0, 0); g.scene.add(tmp);
    try { r.compile(g.scene, g.cam); } catch (e) { }
    kill(tmp);
    setTimeout(() => keys.forEach(k => { const t = TX[k]; if (t && t.image && t.image.complete) r.initTexture(t); }), 800);   /* gambar data URI selesai didekode */
  }
  const idle = window.requestIdleCallback || (f => setTimeout(f, 1200));
  if (document.readyState === 'complete') idle(prewarm); else addEventListener('load', () => idle(prewarm));
  window.HARPOT_HOUSES_IMG = { SPEC, RINGS, SET };
})();
