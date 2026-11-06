/* =====================================================================
   HARPOT MONOPOLY Peta 2: KASTIL TRANSPARAN SAAT PION LEWAT DI BELAKANGNYA
   Petak kanan-atas (dan belakang) papan Wizarding berada di balik menara kastil. Saat pion 3D berdiri atau
   melompat di sana, potongan kastil (houses-art.js: m2_castle) digambar DI DEPAN pion dengan opasitas 0.55,
   jadi pion terlihat di balik kastil yang tembus pandang. Di luar itu potongan disembunyikan (papan video biasa).
   Hanya aktif di Peta 2. Patch MagicMonopolyLGR.prototype; muat SETELAH js/houses-img.js.
   ===================================================================== */
(function () {
  const View = window.MagicMonopolyLGR || (typeof MagicMonopolyLGR !== 'undefined' ? MagicMonopolyLGR : null);
  const SRC = window.HOUSE_ART && window.HOUSE_ART.m2_castle;
  if (typeof MAPSEL === 'undefined' || MAPSEL !== 2 || !View || !SRC || typeof THREE === 'undefined') return;
  const VP = View.prototype;
  const BOX = { x: 384 / 1280, y: 20 / 720, w: 666 / 1280, h: 380 / 720 };   /* letak potongan di bingkai video papan */
  const OP = .55, BACK = .42;                               /* opasitas kastil saat x-ray; kaki pion di atas 42% tinggi papan = sisi belakang */
  let mask = null, MW = 0, MH = 0;                          /* alfa potongan, resolusi 1/4, untuk uji tumpang tindih */
  const im = new Image();
  im.onload = () => {
    MW = im.width >> 2; MH = im.height >> 2;
    const c = document.createElement('canvas'); c.width = MW; c.height = MH;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0, MW, MH);
    try { const d = x.getImageData(0, 0, MW, MH).data; mask = new Uint8Array(MW * MH); for (let k = 0; k < mask.length; k++) mask[k] = d[k * 4 + 3] > 100 ? 1 : 0; } catch (e) { mask = null; }
  };
  im.src = SRC;

  function hit(fx, fy) {                                    /* fx, fy = persen papan (0..1) */
    if (!mask) return false;
    const u = (fx - BOX.x) / BOX.w, v = (fy - BOX.y) / BOX.h;
    if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
    return mask[Math.floor(v * MH) * MW + Math.floor(u * MW)] === 1;
  }
  function behind(view) {                                   /* ada pion 3D di belakang kastil? */
    if (!view.pawnLayer.visible) return false;
    const R = view.R, U = view.U;
    return view.pawns.some(w => {
      if (!w.holder.visible) return false;
      const x = w.holder.position.x, y = -w.holder.position.y, fx = (x - R.left) / R.width;
      if ((y - R.top) / R.height > BACK) return false;
      for (let k = 1; k <= 5; k++) if (hit(fx, (y - k * 16 * U - R.top) / R.height)) return true;   /* sampel dari kaki ke kepala */
      return false;
    });
  }

  const L0 = VP.layout;
  VP.layout = function () {
    L0.call(this);
    const m = this.xray, R = this.R;
    if (!m) return;
    m.position.set(R.left + R.width * (BOX.x + BOX.w / 2), -(R.top + R.height * (BOX.y + BOX.h / 2)), 100);
    m.scale.set(R.width * BOX.w, R.height * BOX.h, 1);
  };
  /* loop sendiri (view.loop sudah di-bind di constructor sebelum file ini dimuat); render tetap oleh view.js */
  function tick() {
    requestAnimationFrame(tick);
    const g = window.gameMotion;
    if (!g || g.dead || !g.vis) return;
    if (!g.xray) {
      g.xray = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load(SRC), transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
      g.xray.renderOrder = 10; g.xray.visible = false; g.scene.add(g.xray); g.layout();
    }
    const mat = g.xray.material, goal = g.mode === 'map' && behind(g) ? OP : 0;
    mat.opacity += (goal - mat.opacity) * .15;             /* memudar halus, tanpa tween */
    if (Math.abs(goal - mat.opacity) < .01) mat.opacity = goal;
    g.xray.visible = mat.opacity > 0;
  }
  requestAnimationFrame(tick);
})();
