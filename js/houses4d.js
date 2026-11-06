/* =====================================================================
   HARPOT MONOPOLY: 4D WIZARD HOUSE SYSTEM  (v2, realistic)
   Level 1 = stone cottage   (reference: Maps HD "House 1")
   Level 2 = 2-story timber  (reference: Maps HD "House 2")
   Time-based ("4th dimension") effects: chimney smoke, flickering
   windows + halos, swaying owner banner, breathing rune ring, and a
   rise-and-pop entrance when a pawn buys or upgrades a tile.

   Integration: patches MagicMonopolyLGR.prototype, js/view.js stays
   untouched. Load AFTER js/view.js (the class must already exist).

   How it looks "3D" with the orthographic camera
     The camera looks straight down -z, so a normal upright mesh would be
     a flat front elevation. Every house is therefore built inside
         view (z squash) > pitch (rotation.x) > yaw (rotation.y)
     PITCH = PI/2 - TILT (TILT comes from view.js), so the house leans
     toward the camera exactly like the tile slabs do. Ortho projection
     ignores z, so squashing z changes depth only, never the picture. It
     keeps the whole house in a thin z band (see Z-order contract).

   Z-order contract (why the tile artwork stays visible)
     - tile top face    z ~= -2 + 4*U
     - house holder     z  = 20  (buildPropertyOnTile)
     - pawns            z  = 40 + playerIndex
     The squashed house spans about 20 +/- 11*U, so it stays above the
     tile and behind the pawns for U up to ~1.8.

   Footprint contract
     Base disc + rune ring stay inside ~40 units; tile top face ~59*U.

   Performance
     Each house is merged into ~10 meshes (one per material). No
     PointLights (a board full of houses would exceed the GPU uniform
     budget); windows glow through emissive materials + additive halos.

   All code and identifiers in English.
   ===================================================================== */
(function () {
  'use strict';

  /* view.js declares `class MagicMonopolyLGR` (a global lexical binding, not a
     window property), so look at both places. */
  const View = window.MagicMonopolyLGR || (typeof MagicMonopolyLGR !== 'undefined' ? MagicMonopolyLGR : null);
  if (!View) {
    console.warn('houses4d: MagicMonopolyLGR is not loaded yet');
    return;
  }
  const P = View.prototype;

  const PITCH = Math.PI / 2 - Math.acos(28.7 / 44.7); /* same TILT as view.js */
  const YAW = -0.6;      /* turn the house so front + right wall both show */
  const SQUASH = 0.28;   /* z squash, depth only (see header) */
  const GY = 3.6;        /* ground level on top of the base disc */
  const OFFSET = { x: -7, y: 6 }; /* house sits back-left so the pawn stands in front */
  const HAS_DOM = typeof document !== 'undefined' && typeof THREE.CanvasTexture === 'function';

  /* ------------------------------------------------------------------
     tiny helpers: seeded RNG + 3x4 matrices (rotation = Ry * Rx * Rz)
     ------------------------------------------------------------------ */
  const rngOf = (s) => {
    let a = (s >>> 0) || 1;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const I3 = () => ({ r: [1, 0, 0, 0, 1, 0, 0, 0, 1], t: [0, 0, 0] });
  function mul(a, b) {
    const r = new Array(9);
    const t = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        r[i * 3 + j] = a.r[i * 3] * b.r[j] + a.r[i * 3 + 1] * b.r[3 + j] + a.r[i * 3 + 2] * b.r[6 + j];
      }
      t[i] = a.r[i * 3] * b.t[0] + a.r[i * 3 + 1] * b.t[1] + a.r[i * 3 + 2] * b.t[2] + a.t[i];
    }
    return { r, t };
  }
  function xfm(rx, ry, rz, x, y, z) {
    const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry), cz = Math.cos(rz), sz = Math.sin(rz);
    const Rx = { r: [1, 0, 0, 0, cx, -sx, 0, sx, cx], t: [0, 0, 0] };
    const Ry = { r: [cy, 0, sy, 0, 1, 0, -sy, 0, cy], t: [0, 0, 0] };
    const Rz = { r: [cz, -sz, 0, sz, cz, 0, 0, 0, 1], t: [0, 0, 0] };
    const m = mul(Ry, mul(Rx, Rz));
    m.t = [x, y, z];
    return m;
  }
  const ap = (m, x, y, z) => [
    m.r[0] * x + m.r[1] * y + m.r[2] * z + m.t[0],
    m.r[3] * x + m.r[4] * y + m.r[5] * z + m.t[1],
    m.r[6] * x + m.r[7] * y + m.r[8] * z + m.t[2]
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------------------------------------------------------
     pure-JS primitives: {p:positions, n:normals, i:indices, u?:uv in units}
     ------------------------------------------------------------------ */
  function genBox(w, h, d) {
    const x = w / 2, y = h / 2, z = d / 2, p = [], n = [], i = [];
    [
      [[1, 0, 0], [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]],
      [[-1, 0, 0], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]],
      [[0, 1, 0], [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]],
      [[0, -1, 0], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]],
      [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
      [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]]
    ].forEach(([nm, c]) => {
      const k = p.length / 3;
      c.forEach((v) => { p.push(v[0], v[1], v[2]); n.push(nm[0], nm[1], nm[2]); });
      i.push(k, k + 1, k + 2, k, k + 2, k + 3);
    });
    return { p, n, i };
  }
  function genCyl(rt, rb, h, seg, top, bot) {
    const p = [], n = [], u = [], i = [];
    const ny = (rb - rt) / h, l = Math.hypot(1, ny), circ = Math.PI * (rt + rb);
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2, c = Math.cos(a), sn = Math.sin(a);
      p.push(c * rb, -h / 2, sn * rb, c * rt, h / 2, sn * rt);
      n.push(c / l, ny / l, sn / l, c / l, ny / l, sn / l);
      u.push((s / seg) * circ, 0, (s / seg) * circ, h);
    }
    for (let s = 0; s < seg; s++) {
      const a = s * 2;
      i.push(a, a + 1, a + 3, a, a + 3, a + 2);
    }
    const cap = (y, r, up) => {
      const k = p.length / 3;
      p.push(0, y, 0); n.push(0, up, 0); u.push(0, 0);
      for (let s = 0; s <= seg; s++) {
        const a = (s / seg) * Math.PI * 2;
        p.push(Math.cos(a) * r, y, Math.sin(a) * r); n.push(0, up, 0); u.push(Math.cos(a) * r, Math.sin(a) * r);
      }
      for (let s = 0; s < seg; s++) {
        if (up > 0) i.push(k, k + s + 2, k + s + 1); else i.push(k, k + s + 1, k + s + 2);
      }
    };
    if (top) cap(h / 2, rt, 1);
    if (bot) cap(-h / 2, rb, -1);
    return { p, n, u, i };
  }
  function genSphere(r, ws, hs, sx, sy, sz) {
    sx = sx || 1; sy = sy || 1; sz = sz || 1;
    const p = [], n = [], u = [], i = [];
    for (let a = 0; a <= hs; a++) {
      const v = a / hs, ph = v * Math.PI;
      for (let b = 0; b <= ws; b++) {
        const t = b / ws, th = t * Math.PI * 2;
        const nx = Math.cos(th) * Math.sin(ph), ny = Math.cos(ph), nz = Math.sin(th) * Math.sin(ph);
        p.push(nx * r * sx, ny * r * sy, nz * r * sz);
        const ex = nx / sx, ey = ny / sy, ez = nz / sz, l = Math.hypot(ex, ey, ez) || 1;
        n.push(ex / l, ey / l, ez / l);
        u.push(t * Math.PI * 2 * r, v * Math.PI * r);
      }
    }
    for (let a = 0; a < hs; a++) {
      for (let b = 0; b < ws; b++) {
        const k = a * (ws + 1) + b, k2 = k + ws + 1;
        i.push(k, k + 1, k2, k + 1, k2 + 1, k2);
      }
    }
    return { p, n, u, i };
  }
  /* convex 2D polygon extruded along z (door arch, gable triangle, banner) */
  function genExtrude(poly, depth) {
    let area = 0;
    for (let k = 0; k < poly.length; k++) {
      const q = poly[k], w = poly[(k + 1) % poly.length];
      area += q[0] * w[1] - w[0] * q[1];
    }
    if (area < 0) poly = poly.slice().reverse();
    const p = [], n = [], i = [], z = depth / 2, m = poly.length;
    poly.forEach((q) => { p.push(q[0], q[1], z); n.push(0, 0, 1); });
    for (let k = 1; k < m - 1; k++) i.push(0, k, k + 1);
    poly.forEach((q) => { p.push(q[0], q[1], -z); n.push(0, 0, -1); });
    for (let k = 1; k < m - 1; k++) i.push(m, m + k + 1, m + k);
    for (let k = 0; k < m; k++) {
      const q = poly[k], w = poly[(k + 1) % m], dx = w[0] - q[0], dy = w[1] - q[1], l = Math.hypot(dx, dy) || 1;
      const nx = dy / l, ny = -dx / l, b = p.length / 3;
      p.push(q[0], q[1], z, w[0], w[1], z, w[0], w[1], -z, q[0], q[1], -z);
      for (let c = 0; c < 4; c++) n.push(nx, ny, 0);
      i.push(b, b + 2, b + 1, b, b + 3, b + 2);
    }
    return { p, n, i };
  }
  function flatten(g) {
    const p = [], n = [], i = [];
    for (let t = 0; t < g.i.length; t += 3) {
      const a = g.i[t] * 3, b = g.i[t + 1] * 3, c = g.i[t + 2] * 3;
      const ux = g.p[b] - g.p[a], uy = g.p[b + 1] - g.p[a + 1], uz = g.p[b + 2] - g.p[a + 2];
      const vx = g.p[c] - g.p[a], vy = g.p[c + 1] - g.p[a + 1], vz = g.p[c + 2] - g.p[a + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      const k = p.length / 3;
      [a, b, c].forEach((q) => { p.push(g.p[q], g.p[q + 1], g.p[q + 2]); n.push(nx, ny, nz); });
      i.push(k, k + 1, k + 2);
    }
    return { p, n, i };
  }
  function autoUV(g) {
    const u = [];
    for (let k = 0; k < g.p.length / 3; k++) {
      const x = g.p[k * 3], y = g.p[k * 3 + 1], z = g.p[k * 3 + 2];
      const ax = Math.abs(g.n[k * 3]), ay = Math.abs(g.n[k * 3 + 1]), az = Math.abs(g.n[k * 3 + 2]);
      if (ax >= ay && ax >= az) u.push(z, y); else if (ay >= az) u.push(x, z); else u.push(x, y);
    }
    g.u = u;
  }

  /* world units per texture repeat, per material key */
  const UNIT = { stone: 20, roof: 15, plaster: 18, timber: 12, wood: 10, grass: 22, iron: 8 };

  /* ------------------------------------------------------------------
     Builder: collects transformed geometry into one bucket per material
     ------------------------------------------------------------------ */
  function Build(rnd) {
    this.rnd = rnd;
    this.stack = [I3()];
    this.bk = {};
    this.shade = {};
    this.halos = [];
    this.min = [1e9, 1e9, 1e9];
    this.max = [-1e9, -1e9, -1e9];
  }
  Build.prototype = {
    get m() { return this.stack[this.stack.length - 1]; },
    at(x, y, z, ry, fn, rx, rz) {
      this.stack.push(mul(this.m, xfm(rx || 0, ry || 0, rz || 0, x, y, z)));
      fn();
      this.stack.pop();
    },
    pt(x, y, z) { return ap(this.m, x, y, z); },
    bucket(key) {
      return this.bk[key] || (this.bk[key] = { p: [], n: [], u: [], c: [], i: [] });
    },
    emit(key, g, o) {
      o = o || {};
      const M = mul(this.m, xfm(o.rx || 0, o.ry || 0, o.rz || 0, o.x || 0, o.y || 0, o.z || 0));
      if (!g.u) autoUV(g);
      const B = this.bucket(key), base = B.p.length / 3, sh = this.shade[key];
      const un = UNIT[key] || 1, off = o.uvo === false || o.fit ? [0, 0] : [this.rnd() * 6, this.rnd() * 6];
      const tint = o.tint || [1, 1, 1];
      for (let k = 0; k < g.p.length / 3; k++) {
        const lx = g.p[k * 3], ly = g.p[k * 3 + 1], lz = g.p[k * 3 + 2];
        const w = ap(M, lx, ly, lz);
        B.p.push(w[0], w[1], w[2]);
        B.n.push(
          M.r[0] * g.n[k * 3] + M.r[1] * g.n[k * 3 + 1] + M.r[2] * g.n[k * 3 + 2],
          M.r[3] * g.n[k * 3] + M.r[4] * g.n[k * 3 + 1] + M.r[5] * g.n[k * 3 + 2],
          M.r[6] * g.n[k * 3] + M.r[7] * g.n[k * 3 + 1] + M.r[8] * g.n[k * 3 + 2]
        );
        let uu = g.u[k * 2], vv = g.u[k * 2 + 1];
        if (o.fit) { uu = (lx - (o.fit[2] || 0)) / o.fit[0] + 0.5; vv = (ly - (o.fit[3] || 0)) / o.fit[1] + 0.5; }
        else { if (o.sw) { const t = uu; uu = vv; vv = t; } uu = uu / un + off[0]; vv = vv / un + off[1]; }
        B.u.push(uu, vv);
        const s = sh ? sh(w[0], w[1], w[2]) : [1, 1, 1];
        B.c.push(s[0] * tint[0], s[1] * tint[1], s[2] * tint[2]);
        if (!o.nb) for (let a = 0; a < 3; a++) { this.min[a] = Math.min(this.min[a], w[a]); this.max[a] = Math.max(this.max[a], w[a]); }
      }
      g.i.forEach((q) => B.i.push(q + base));
    },
    box(key, w, h, d, x, y, z, o) { o = o || {}; o.x = x; o.y = y; o.z = z; this.emit(key, genBox(w, h, d), o); },
    cyl(key, rt, rb, h, seg, x, y, z, o) { o = o || {}; o.x = x; o.y = y; o.z = z; this.emit(key, genCyl(rt, rb, h, seg, true, o.nobot !== true), o); },
    sphere(key, r, x, y, z, o) {
      o = o || {}; o.x = x; o.y = y; o.z = z;
      const s = o.s || [1, 1, 1];
      this.emit(key, genSphere(r, o.ws || 7, o.hs || 5, s[0], s[1], s[2]), o);
    },
    rock(key, r, x, y, z, o) {
      o = o || {}; o.x = x; o.y = y; o.z = z;
      const s = o.s || [1, 0.7, 1], g = genSphere(r, 6, 4, s[0], s[1], s[2]);
      for (let k = 0; k < g.p.length; k++) g.p[k] *= 0.82 + this.rnd() * 0.36;
      this.emit(key, flatten(g), o);
    },
    ext(key, poly, depth, x, y, z, o) { o = o || {}; o.x = x; o.y = y; o.z = z; this.emit(key, genExtrude(poly, depth), o); },
    toGroup(mats) {
      const grp = new THREE.Group(), geos = [];
      Object.keys(this.bk).forEach((key) => {
        const B = this.bk[key], mat = mats[key];
        if (!mat || !B.p.length) return;
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(B.p, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(B.n, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(B.u, 2));
        geo.setAttribute('color', new THREE.Float32BufferAttribute(B.c, 3));
        geo.setIndex(B.i);
        geos.push(geo);
        grp.add(new THREE.Mesh(geo, mat));
      });
      return { grp, geos };
    }
  };

  /* ------------------------------------------------------------------
     procedural textures (canvas 2D, cached once per page)
     ------------------------------------------------------------------ */
  const TEX = {};
  const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  function rr(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
  }
  function blob(c, x, y, r, rgb, a) {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(' + rgb + ',' + a + ')');
    g.addColorStop(1, 'rgba(' + rgb + ',0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function wrapped(w, h, fn) { for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) fn(dx * w, dy * h); }
  function mossPatches(c, w, h, r, n, big) {
    for (let k = 0; k < n; k++) {
      const x = r() * w, y = r() * h, rad = 5 + r() * big, a = 0.28 + r() * 0.4;
      const rgb = (62 + r() * 28 | 0) + ',' + (98 + r() * 40 | 0) + ',' + (34 + r() * 22 | 0);
      wrapped(w, h, (dx, dy) => blob(c, x + dx, y + dy, rad, rgb, a));
    }
  }
  function mk(w, h, draw, withBump, seed) {
    const c = canvas(w, h), x = c.getContext('2d');
    const b = withBump ? canvas(w, h) : null;
    draw(x, b && b.getContext('2d'), w, h, rngOf(seed));
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    let bt = null;
    if (b) { bt = new THREE.CanvasTexture(b); bt.wrapS = bt.wrapT = THREE.RepeatWrapping; }
    return { map: t, bump: bt };
  }
  function drawStone(c, bp, w, h, r) {
    c.fillStyle = '#25221d'; c.fillRect(0, 0, w, h);
    bp.fillStyle = '#000'; bp.fillRect(0, 0, w, h);
    const rows = []; let tot = 0;
    while (tot < h - 24) { const v = 34 + r() * 32; rows.push(v); tot += v; }
    const ky = h / tot; let y = 0;
    rows.forEach((rh0) => {
      const rh = rh0 * ky, cols = []; let t = 0;
      while (t < w - 30) { const v = 44 + r() * 62; cols.push(v); t += v; }
      const kx = w / t, shift = r() * w; let x = 0;
      cols.forEach((cw0) => {
        const cw = cw0 * kx, X0 = (x + shift) % w, g = 2.4, rad = Math.min(10, cw / 4, rh / 3);
        const hue = 24 + r() * 34, sat = 5 + r() * 13, l = 34 + r() * 24;
        [X0, X0 - w].forEach((X) => {
          if (X + cw < 0 || X > w) return;
          c.fillStyle = 'hsl(' + hue + ',' + sat + '%,' + l + '%)';
          rr(c, X + g, y + g, cw - g * 2, rh - g * 2, rad); c.fill();
          const gr = c.createLinearGradient(X, y, X + cw, y + rh);
          gr.addColorStop(0, 'rgba(255,255,255,.17)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,0,0,.3)');
          c.fillStyle = gr; rr(c, X + g, y + g, cw - g * 2, rh - g * 2, rad); c.fill();
          for (let s = 0; s < cw * rh / 70; s++) {
            c.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.1)';
            c.fillRect(X + g + r() * (cw - g * 2), y + g + r() * (rh - g * 2), 1 + r() * 3, 1 + r() * 2);
          }
          const v = 120 + r() * 80 | 0;
          bp.fillStyle = 'rgb(' + v + ',' + v + ',' + v + ')';
          rr(bp, X + g, y + g, cw - g * 2, rh - g * 2, rad); bp.fill();
        });
        x += cw;
      });
      y += rh;
    });
    mossPatches(c, w, h, r, 46, 26);
    for (let k = 0; k < 90; k++) { c.fillStyle = 'rgba(176,184,120,' + (0.1 + r() * 0.2) + ')'; c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 3, 0, 6.3); c.fill(); }
  }
  function drawSlate(c, bp, w, h, r) {
    c.fillStyle = '#23262c'; c.fillRect(0, 0, w, h);
    bp.fillStyle = '#000'; bp.fillRect(0, 0, w, h);
    const rows = 12, cols = 8, rh = h / rows, cw = w / cols;
    for (let j = rows - 1; j >= 0; j--) {
      for (let i = -1; i <= cols; i++) {
        const x0 = i * cw + (j % 2) * cw / 2 + (r() - 0.5) * 3, y0 = j * rh, th = rh * 1.4;
        const warm = r() < 0.12, hue = warm ? 30 : 214 + r() * 12, sat = warm ? 8 + r() * 6 : 5 + r() * 7, l = 19 + r() * 13;
        const path = (cx) => {
          cx.beginPath(); cx.moveTo(x0 + 2, y0); cx.lineTo(x0 + cw - 2, y0); cx.lineTo(x0 + cw - 2, y0 + th - 5);
          cx.quadraticCurveTo(x0 + cw - 2, y0 + th, x0 + cw - 7, y0 + th); cx.lineTo(x0 + 7, y0 + th);
          cx.quadraticCurveTo(x0 + 2, y0 + th, x0 + 2, y0 + th - 5); cx.closePath();
        };
        const gr = c.createLinearGradient(0, y0, 0, y0 + th);
        gr.addColorStop(0, 'hsl(' + hue + ',' + sat + '%,' + (l + 7) + '%)'); gr.addColorStop(1, 'hsl(' + hue + ',' + sat + '%,' + (l - 6) + '%)');
        path(c); c.fillStyle = gr; c.fill();
        c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 2; c.stroke();
        for (let s = 0; s < 7; s++) { c.fillStyle = 'rgba(190,200,170,' + (r() * 0.12) + ')'; c.fillRect(x0 + r() * cw, y0 + r() * th, 1 + r() * 3, 1 + r() * 2); }
        const bg = bp.createLinearGradient(0, y0, 0, y0 + th);
        bg.addColorStop(0, '#d8d8d8'); bg.addColorStop(1, '#6a6a6a');
        path(bp); bp.fillStyle = bg; bp.fill();
      }
    }
    mossPatches(c, w, h, r, 60, 24);
    for (let k = 0; k < 160; k++) {
      c.fillStyle = 'rgba(' + (70 + r() * 30 | 0) + ',' + (112 + r() * 40 | 0) + ',40,' + (0.2 + r() * 0.4) + ')';
      c.beginPath(); c.arc(r() * w, r() * h, 1 + r() * 3.5, 0, 6.3); c.fill();
    }
  }
  function drawPlaster(c, bp, w, h, r) {
    c.fillStyle = '#d9cdae'; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 90; k++) {
      const x = r() * w, y = r() * h, rad = 10 + r() * 40, d = r() < 0.5;
      wrapped(w, h, (dx, dy) => blob(c, x + dx, y + dy, rad, d ? '120,100,70' : '255,250,235', 0.06 + r() * 0.1));
    }
    for (let k = 0; k < 18; k++) {
      const x = r() * w; const g = c.createLinearGradient(x, 0, x, h * (0.3 + r() * 0.5));
      g.addColorStop(0, 'rgba(90,80,60,.18)'); g.addColorStop(1, 'rgba(90,80,60,0)');
      c.fillStyle = g; c.fillRect(x, 0, 3 + r() * 6, h);
    }
    mossPatches(c, w, h, r, 8, 18);
  }
  function drawWood(c, bp, w, h, r, dark) {
    c.fillStyle = dark ? '#35231a' : '#6a4a2c'; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 70; k++) {
      c.strokeStyle = dark ? 'rgba(120,84,50,' + (0.12 + r() * 0.2) + ')' : 'rgba(30,18,8,' + (0.18 + r() * 0.3) + ')';
      c.lineWidth = 1 + r() * 2.2;
      const y = r() * h; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(w * 0.3, y + r() * 14 - 7, w * 0.6, y + r() * 14 - 7, w, y); c.stroke();
    }
    if (!dark) { for (let k = 0; k < 4; k++) { c.fillStyle = 'rgba(15,8,2,.55)'; c.fillRect(0, k * h / 4, w, 3); } }
    for (let k = 0; k < 6; k++) { blob(c, r() * w, r() * h, 6 + r() * 6, '20,10,4', 0.5); }
    mossPatches(c, w, h, r, 4, 10);
  }
  function drawGrass(c, bp, w, h, r) {
    c.fillStyle = '#44662a'; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 40; k++) { const x = r() * w, y = r() * h; wrapped(w, h, (dx, dy) => blob(c, x + dx, y + dy, 20 + r() * 40, r() < 0.5 ? '90,130,50' : '30,60,24', 0.35)); }
    const gs = ['#5f8b38', '#2f5120', '#7ba548', '#3d6a28'];
    for (let k = 0; k < 2600; k++) {
      c.strokeStyle = gs[(r() * 4) | 0]; c.lineWidth = 1 + r();
      const x = r() * w, y = r() * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + r() * 4 - 2, y - 3 - r() * 5); c.stroke();
    }
    const fl = ['#f5f0e0', '#f7d44a', '#f08aa8', '#c9a0f0'];
    for (let k = 0; k < 46; k++) { c.fillStyle = fl[(r() * 4) | 0]; c.beginPath(); c.arc(r() * w, r() * h, 1.2 + r() * 1.4, 0, 6.3); c.fill(); }
  }
  function drawDoor(c, bp, w, h, r) {
    c.fillStyle = '#4a3220'; c.fillRect(0, 0, w, h);
    const n = 5, pw = w / n;
    for (let k = 0; k < n; k++) {
      const x = k * pw, g = c.createLinearGradient(x, 0, x + pw, 0);
      g.addColorStop(0, 'hsl(28,' + (36 + r() * 10) + '%,' + (24 + r() * 8) + '%)'); g.addColorStop(1, 'hsl(26,38%,18%)');
      c.fillStyle = g; c.fillRect(x + 1, 0, pw - 2, h);
      for (let s = 0; s < 14; s++) { c.strokeStyle = 'rgba(10,5,0,' + (0.15 + r() * 0.3) + ')'; c.lineWidth = 1; c.beginPath(); const xx = x + r() * pw; c.moveTo(xx, 0); c.lineTo(xx + r() * 4 - 2, h); c.stroke(); }
    }
    [0.2, 0.74].forEach((f) => {
      c.fillStyle = '#1b1b1f'; c.fillRect(0, h * f, w, h * 0.055);
      for (let k = 0; k < 6; k++) { c.fillStyle = '#6a6a74'; c.beginPath(); c.arc(w * (0.08 + k * 0.17), h * f + h * 0.027, 2.2, 0, 6.3); c.fill(); }
    });
  }
  function drawGlass(c, bp, w, h, r) {
    c.fillStyle = '#2a1a0c'; c.fillRect(0, 0, w, h);
    const cols = 2, rows = 3, m = 7, gw = (w - m * (cols + 1)) / cols, gh = (h - m * (rows + 1)) / rows;
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = m + i * (gw + m), y = m + j * (gh + m), g = c.createRadialGradient(x + gw / 2, y + gh * 0.6, 2, x + gw / 2, y + gh / 2, gw);
        g.addColorStop(0, '#fff1b0'); g.addColorStop(0.55, '#ffc15a'); g.addColorStop(1, '#e07d1c');
        c.fillStyle = g; c.fillRect(x, y, gw, gh);
        c.fillStyle = 'rgba(255,255,255,' + (0.1 + r() * 0.15) + ')'; c.fillRect(x + 2, y + 2, gw * 0.35, 3);
      }
    }
  }
  function drawSmoke(c, bp, w, h, r) {
    c.clearRect(0, 0, w, h);
    for (let k = 0; k < 16; k++) {
      const a = r() * 6.3, d = r() * w * 0.2;
      blob(c, w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, w * (0.17 + r() * 0.17), '255,255,255', 0.28 + r() * 0.2);
    }
  }
  function drawGlow(c, bp, w, h) {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,225,150,1)'); g.addColorStop(0.3, 'rgba(255,170,70,.45)'); g.addColorStop(1, 'rgba(255,140,40,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
  function loadTextures() {
    if (TEX.ready || !HAS_DOM) return TEX;
    TEX.ready = true;
    TEX.stone = mk(512, 512, drawStone, true, 11);
    TEX.roof = mk(512, 512, drawSlate, true, 23);
    TEX.plaster = mk(256, 256, drawPlaster, false, 5);
    TEX.timber = mk(256, 256, (c, b, w, h, r) => drawWood(c, b, w, h, r, true), false, 31);
    TEX.wood = mk(256, 256, (c, b, w, h, r) => drawWood(c, b, w, h, r, false), false, 41);
    TEX.grass = mk(512, 512, drawGrass, false, 53);
    TEX.door = mk(128, 256, drawDoor, false, 61); TEX.door.map.wrapS = TEX.door.map.wrapT = THREE.ClampToEdgeWrapping;
    TEX.glass = mk(96, 128, drawGlass, false, 71); TEX.glass.map.wrapS = TEX.glass.map.wrapT = THREE.ClampToEdgeWrapping;
    TEX.smoke = mk(128, 128, drawSmoke, false, 83).map;
    TEX.glow = mk(128, 128, drawGlow, false, 97).map;
    return TEX;
  }

  /* shared (static) materials: one set for every house on the board */
  const MAT = {};
  function sharedMaterials() {
    if (MAT.stone) return MAT;
    const T = loadTextures();
    const std = (tx, o) => {
      const opt = Object.assign({ vertexColors: true, roughness: 0.93, metalness: 0 }, o || {});
      const bs = opt.bs || 1.6;
      delete opt.bs;
      const m = new THREE.MeshStandardMaterial(opt);
      if (tx && tx.map) { m.map = tx.map; if (tx.bump) { m.bumpMap = tx.bump; m.bumpScale = bs; } }
      return m;
    };
    MAT.stone = std(T.stone, { bs: 2.2 });
    MAT.roof = std(T.roof, { bs: 2.6, roughness: 0.85 });
    MAT.plaster = std(T.plaster);
    MAT.timber = std(T.timber, { roughness: 0.8 });
    MAT.wood = std(T.wood, { roughness: 0.8 });
    MAT.grass = std(T.grass, { roughness: 1, color: 0xaaaaaa });
    MAT.door = std(T.door, { roughness: 0.8 });
    MAT.iron = std(null, { color: 0x24242a, metalness: 0.7, roughness: 0.45 });
    MAT.vcs = std(null, { roughness: 0.9, color: 0x9a9a9a });
    MAT.vcf = std(null, { roughness: 1, flatShading: true, color: 0x8c8c8c });
    return MAT;
  }
  function houseMaterials(col) {
    const T = TEX, S = sharedMaterials(), M = Object.assign({}, S);
    const glass = () => {
      const m = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffa733, emissiveIntensity: 1.1, roughness: 0.4 });
      if (T.glass) { m.map = T.glass.map; m.emissiveMap = T.glass.map; }
      return m;
    };
    M.win0 = glass(); M.win1 = glass();
    M.flag = new THREE.MeshStandardMaterial({ color: col, roughness: 0.8, side: THREE.DoubleSide });
    return M;
  }

  /* ------------------------------------------------------------------
     architecture helpers (all coordinates are house-local, y up)
     ------------------------------------------------------------------ */
  const stoneShade = (x, y) => {
    const t = clamp((y - GY) / 9, 0, 1), base = 0.6 + 0.4 * t, m = clamp(1 - (y - GY) / 3.2, 0, 1) * 0.55;
    return [base * (1 - 0.4 * m), base * (1 - 0.04 * m), base * (1 - 0.5 * m)];
  };
  const plasterShade = (x, y) => { const t = clamp((y - GY) / 7, 0, 1), b = 0.78 + 0.22 * t; return [b, b, b * 0.98]; };

  function gable(b, key, span, len, rise, ov, y0) {
    const half = span / 2, al = Math.atan2(rise, half), c = Math.cos(al), s = Math.sin(al), t = 0.95;
    const L = (half + ov) * Math.hypot(1, rise / half);
    const tipX = half + ov, tipY = y0 - (rise * ov) / half;
    [1, -1].forEach((sd) => {
      const mx = (sd * (tipX + 0)) / 2, my = (tipY + y0 + rise) / 2;
      const nx = sd * s, ny = c;
      const cx = mx + nx * (t / 2), cy = my + ny * (t / 2);
      b.box(key, L, t, len, cx, cy, 0, { rz: sd > 0 ? -al : al });
      [1, -1].forEach((ez) => {
        b.box('timber', L, 1.5, 0.5, cx + nx * -0.2, cy - 0.35 * c, ez * (len / 2 - 0.22), { rz: sd > 0 ? -al : al, sw: false });
      });
    });
    b.box(key, 1.9, 1.1, len + 0.5, 0, y0 + rise + t * 0.55, 0, { tint: [0.72, 0.72, 0.75] });
  }

  function windowAt(b, w, h, key, o) {
    o = o || {};
    const rnd = b.rnd;
    b.box('timber', w + 1.4, 0.8, 1.0, 0, h / 2 + 0.4, 0.35);
    b.box('timber', w + 1.4, 0.8, 1.0, 0, -h / 2 - 0.4, 0.35);
    [1, -1].forEach((sd) => b.box('timber', 0.8, h, 1.0, sd * (w / 2 + 0.3), 0, 0.35, { sw: true }));
    b.box(key, w, h, 0.5, 0, 0, 0.1, { fit: [w, h, 0, 0] });
    b.box('stone', w + 2.2, 0.7, 1.7, 0, -h / 2 - 1.0, 0.85);
    if (o.shut) [1, -1].forEach((sd) => b.box('wood', w * 0.46, h + 0.5, 0.4, sd * (w / 2 + 0.8 + w * 0.23), 0, 0.5, { sw: true }));
    if (o.flowers) {
      b.box('wood', w + 1.4, 1.0, 1.2, 0, -h / 2 - 1.9, 1.2);
      for (let k = 0; k < 5; k++) {
        const g = 0.2 + rnd() * 0.2;
        b.sphere('vcs', 0.85, -w / 2 + 0.3 + k * (w / 4.2), -h / 2 - 1.3 + rnd() * 0.3, 1.3, { s: [1, 0.8, 1], tint: [g, 0.45 + rnd() * 0.25, 0.15], ws: 5, hs: 4 });
      }
      const fc = [[1, 0.5, 0.6], [1, 0.9, 0.4], [0.95, 0.95, 0.95]];
      for (let k = 0; k < 6; k++) b.sphere('vcs', 0.3, -w / 2 + rnd() * w, -h / 2 - 0.7 + rnd() * 0.4, 1.6, { tint: fc[(rnd() * 3) | 0], ws: 4, hs: 3 });
    }
    const q = b.pt(0, 0, 1.8);
    b.halos.push({ x: q[0], y: q[1], z: q[2], key, size: w * 3.1 });
  }

  function doorAt(b, w, h) {
    const poly = [[-w / 2, 0], [w / 2, 0]];
    for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI; poly.push([Math.cos(a) * w / 2, h - w / 2 + Math.sin(a) * w / 2]); }
    b.ext('door', poly, 0.7, 0, 0, 0.25, { fit: [w, h, 0, h / 2] });
    [1, -1].forEach((sd) => b.box('timber', 0.95, h - 0.2, 1.1, sd * (w / 2 + 0.45), (h - 0.2) / 2, 0.3, { sw: true }));
    b.box('timber', w + 2.3, 1.0, 1.2, 0, h + 0.1, 0.3);
    b.sphere('iron', 0.42, w / 2 - 0.9, h * 0.46, 0.85, { ws: 6, hs: 4 });
  }

  function bush(b, x, y, z, s) {
    const rnd = b.rnd, n = 3 + ((rnd() * 3) | 0);
    for (let k = 0; k < n; k++) {
      const g = 0.2 + rnd() * 0.14;
      b.sphere('vcs', (1.5 + rnd() * 1.2) * s, x + (rnd() - 0.5) * 2.6 * s, y + 1.2 * s + rnd() * 0.9 * s, z + (rnd() - 0.5) * 2.2 * s, { s: [1, 0.85, 1], tint: [g, 0.36 + rnd() * 0.2, 0.13 + rnd() * 0.06], ws: 7, hs: 5 });
    }
    const fc = [[1, 0.55, 0.65], [1, 0.9, 0.4], [0.96, 0.96, 0.96], [0.75, 0.6, 0.95]];
    const col = fc[(rnd() * 4) | 0];
    for (let k = 0; k < 5; k++) b.sphere('vcs', 0.34, x + (rnd() - 0.5) * 3.4 * s, y + 1.4 * s + rnd() * 1.6 * s, z + (rnd() - 0.5) * 3 * s, { tint: col, ws: 4, hs: 3 });
  }

  function ivy(b, x, z, h, nx, nz) {
    const rnd = b.rnd;
    for (let k = 0; k < 24; k++) {
      const t = k / 24, y = GY + 0.4 + t * h * (0.75 + rnd() * 0.25);
      const g = 0.16 + rnd() * 0.18;
      b.sphere('vcs', 0.7 + rnd() * 0.7, x + nx * (0.35 + rnd() * 0.5) + (rnd() - 0.5) * 1.4 * (nz ? 1 : 0), y, z + nz * (0.35 + rnd() * 0.5) + (rnd() - 0.5) * 1.4 * (nx ? 1 : 0), { s: [1, 1, 0.5], tint: [g, 0.34 + rnd() * 0.3, 0.12], ws: 5, hs: 4 });
    }
  }

  function fence(b, pts) {
    for (let k = 0; k < pts.length - 1; k++) {
      const [x1, z1] = pts[k], [x2, z2] = pts[k + 1], dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
      b.at((x1 + x2) / 2, GY, (z1 + z2) / 2, Math.atan2(-dz, dx), () => {
        b.box('wood', len, 0.5, 0.35, 0, 2.7, 0); b.box('wood', len, 0.5, 0.35, 0, 1.3, 0);
        const n = Math.max(2, Math.round(len / 1.15));
        for (let q = 0; q < n; q++) b.box('wood', 0.6, 3.5 + b.rnd() * 0.3, 0.3, -len / 2 + (q + 0.5) * (len / n), 1.75, 0.05, { sw: true });
        [-len / 2, len / 2].forEach((px) => b.box('timber', 0.85, 4.1, 0.85, px, 2.05, 0, { sw: true }));
      });
    }
  }

  function chimney(b, x, y0, z, y1, w) {
    b.box('stone', w, y1 - y0, w, x, (y0 + y1) / 2, z);
    b.box('stone', w + 1.0, 1.0, w + 1.0, x, y1 + 0.4, z, { tint: [0.8, 0.8, 0.82] });
    b.cyl('vcs', 0.85, 0.95, 1.6, 8, x - w * 0.22, y1 + 1.7, z, { tint: [0.62, 0.3, 0.2] });
    b.cyl('vcs', 0.85, 0.95, 1.4, 8, x + w * 0.22, y1 + 1.6, z, { tint: [0.55, 0.27, 0.18] });
    return b.pt(x, y1 + 2.8, z);
  }

  /* base disc: stone drum, grass top, ring of boulders */
  function baseDisc(b, R, rocks) {
    const rnd = b.rnd;
    b.cyl('stone', R, R + 1.1, GY - 0.2, 30, 0, (GY - 0.2) / 2, 0, { nobot: true });
    b.cyl('grass', R - 0.5, R - 0.5, 0.5, 30, 0, GY - 0.25, 0, { nobot: true });
    for (let k = 0; k < rocks; k++) {
      const a = (k / rocks) * Math.PI * 2 + (rnd() - 0.5) * 0.25, rad = R + 0.3 + rnd() * 1.0, sz = 1.2 + rnd() * 1.2;
      const g = 0.4 + rnd() * 0.22, mossy = rnd() < 0.4;
      b.rock('vcf', sz, Math.cos(a) * rad, 1.6 + rnd() * 0.8, Math.sin(a) * rad, { s: [1.4 + rnd() * 0.8, 0.8 + rnd() * 0.4, 1.1 + rnd() * 0.5], ry: rnd() * 3, tint: mossy ? [g * 0.8, g * 1.05, g * 0.7] : [g, g * 0.97, g * 0.92] });
    }
  }

  function banner(b, x, z, h) {
    b.cyl('timber', 0.35, 0.4, h, 6, x, GY + h / 2, z, { sw: true });
    b.sphere('iron', 0.55, x, GY + h + 0.2, z, { ws: 6, hs: 4 });
    return b.pt(x + 0.3, GY + h - 0.4, z);
  }

  /* diagonal beam between two points on a face (face-local coords) */
  function strut(b, x1, y1, x2, y2, z, th) {
    const dx = x2 - x1, dy = y2 - y1;
    b.box('timber', Math.hypot(dx, dy), th, 0.45, (x1 + x2) / 2, (y1 + y2) / 2, z, { rz: Math.atan2(dy, dx) });
  }
  /* timber frame on a face: local plane z=0 facing +z, x in [-w/2,w/2], y in [0,h] */
  function timberFace(b, w, h, posts, braces) {
    const z = 0.28, pw = w / posts;
    b.box('timber', w, 0.85, 0.55, 0, 0.42, z); b.box('timber', w, 0.85, 0.55, 0, h - 0.42, z); b.box('timber', w, 0.7, 0.5, 0, h * 0.5, z);
    for (let k = 0; k <= posts; k++) b.box('timber', 0.85, h, 0.6, -w / 2 + k * pw, h / 2, z + 0.02, { sw: true });
    if (!braces) return;
    for (let k = 0; k < posts; k++) {
      const xl = -w / 2 + k * pw + 0.45, xr = xl + pw - 0.9, flip = k % 2;
      strut(b, flip ? xr : xl, 0.85, flip ? xl : xr, h / 2 - 0.35, z - 0.02, 0.55);
      strut(b, flip ? xl : xr, h - 0.85, flip ? xr : xl, h / 2 + 0.35, z - 0.02, 0.55);
    }
  }
  /* timber on a gable triangle: face-local, base y=0, apex (0,rise) */
  function gableFace(b, half, rise) {
    const z = 0.25;
    b.box('timber', half * 2, 0.8, 0.5, 0, 0.4, z);
    b.box('timber', 0.8, rise, 0.5, 0, rise / 2, z, { sw: true });
    b.box('timber', half * 1.25, 0.6, 0.45, 0, rise * 0.34, z);
    [1, -1].forEach((sd) => strut(b, sd * half * 0.62, 0.8, sd * 0.4, rise * 0.62, z - 0.02, 0.6));
  }

  /* ------------------------------------------------------------------
     LEVEL 1: stone cottage
     ------------------------------------------------------------------ */
  function buildCottage(b) {
    const W = 15, D = 13, H = 11, rise = 10.5, ov = 1.8, ovz = 1.7, g = GY;
    b.shade.stone = stoneShade;
    baseDisc(b, 15.8, 13);
    b.box('stone', W + 1.1, 1.5, D + 1.1, 0, g + 0.75, 0);
    b.box('stone', W, H, D, 0, g + H / 2, 0);
    b.ext('stone', [[-W / 2, 0], [W / 2, 0], [0, rise]], D, 0, g + H, 0);
    gable(b, 'roof', W, D + ovz * 2, rise, ov, g + H);
    /* chimney stack on the right wall, passing through the eave */
    const smoke = chimney(b, W / 2 + 0.9, g, -2.6, g + H + rise + 2.2, 3.7);
    b.box('stone', 4.7, 5, 4.7, W / 2 + 0.9, g + 2.5, -2.6);
    /* porch + door */
    b.at(0, g, D / 2, 0, () => doorAt(b, 4.6, 7.6));
    b.at(0, 0, D / 2 + 2.2, 0, () => {
      gable(b, 'roof', 8.2, 5, 3.4, 1.1, g + 8.7);
      b.box('wood', 7.6, 0.5, 4.5, 0, g + 0.25, 0);
      [1, -1].forEach((sd) => b.box('timber', 0.9, 8.6, 0.9, sd * 3.3, g + 4.3, 2.0, { sw: true }));
    });
    b.box('stone', 5.6, 0.5, 1.5, 0, g + 0.25, D / 2 + 5.5);
    [[-0.2, 7.5], [0.5, 9.5], [-0.3, 11.5]].forEach((q) => b.box('stone', 3.2, 0.3, 1.8, q[0], g + 0.15, D / 2 + q[1], { ry: (b.rnd() - 0.5) * 0.3 }));
    /* windows (glow + halo) */
    b.at(-4.9, g + 5.9, D / 2, 0, () => windowAt(b, 3.1, 4, 'win0', { shut: 1, flowers: 1 }));
    b.at(4.9, g + 5.9, D / 2, 0, () => windowAt(b, 3.1, 4, 'win1', { shut: 1, flowers: 1 }));
    b.at(W / 2, g + 5.9, 2.9, Math.PI / 2, () => windowAt(b, 3.1, 4, 'win1', { shut: 1 }));
    b.at(W / 2, g + 5.9, -6.0, Math.PI / 2, () => windowAt(b, 2.6, 3.4, 'win0', {}));
    b.at(0, g + H + 4.6, D / 2, 0, () => windowAt(b, 2.2, 2.6, 'win0', {}));
    /* lantern on the porch post */
    b.box('iron', 1.0, 0.4, 1.0, 3.9, g + 7.1, D / 2 + 4.1); b.box('win1', 0.8, 1.2, 0.8, 3.9, g + 6.3, D / 2 + 4.1, { fit: [0.8, 1.2, 0, 0] });
    const lq = b.pt(3.9, g + 6.3, D / 2 + 4.5); b.halos.push({ x: lq[0], y: lq[1], z: lq[2], key: 'win1', size: 4.2 });
    /* garden */
    fence(b, [[-11.8, 2], [-11.8, 10.2], [-8.6, 12.6], [-5.6, 12.9]]);
    fence(b, [[5.6, 12.9], [8.6, 12.6], [11.8, 10.2], [11.8, 2]]);
    [[-8.8, 0, 8.4, 1.0], [9.2, 0, 8.4, 0.95], [-10.6, 0, -3, 1.1], [10.4, 0, -7, 1.0], [-5.5, 0, -10, 1.0], [7.6, 0, 10.4, 0.8]].forEach((q) => bush(b, q[0], g, q[2], q[3]));
    ivy(b, -W / 2 - 0.1, D / 2 + 0.1, 9.5, -0.4, 0.9);
    ivy(b, W / 2 + 0.2, -D / 2 + 0.2, 8, 0.8, 0);
    const bn = banner(b, -10, 9.6, 12);
    return { smoke, smoke2: null, banner: bn, bounds: 0 };
  }

  /* ------------------------------------------------------------------
     LEVEL 2: two-story half-timbered house
     ------------------------------------------------------------------ */
  function buildHouse2(b) {
    const W = 17, D = 13, H1 = 9.6, H2 = 8.6, j = 1.0, g = GY, R = 17.6;
    const yb = g + H1 + 1.2, yt = yb + H2, ridge = 10, Ww = 8.6, Dw = 3.2, riseW = 7;
    b.shade.stone = stoneShade; b.shade.plaster = plasterShade;
    baseDisc(b, R, 16);
    /* ground floor: stone */
    b.box('stone', W + 1.1, 1.3, D + 1.1, 0, g + 0.65, 0);
    b.box('stone', W, H1, D, 0, g + H1 / 2, 0);
    b.box('stone', Ww, H1, Dw, 0, g + H1 / 2, D / 2 + Dw / 2);
    b.box('stone', Ww + 1.1, 1.3, Dw + 1.1, 0, g + 0.65, D / 2 + Dw / 2);
    [[-1, -1], [1, -1], [-1, 1]].forEach(([sx, sz]) => b.box('timber', 1.0, H1, 1.0, sx * (W / 2 + 0.05), g + H1 / 2, sz * (D / 2 + 0.05), { sw: true }));
    /* jetty beams + upper floor */
    b.box('timber', W + 2 * j + 0.5, 1.2, D + 2 * j + 0.5, 0, yb - 0.6, 0);
    b.box('plaster', W + 2 * j, H2, D + 2 * j, 0, yb + H2 / 2, 0);
    const wzf = D / 2 + Dw + j;
    b.box('timber', Ww + 2 * j + 0.5, 1.2, Dw + j + 0.5, 0, yb - 0.6, D / 2 + (Dw + j) / 2 + 0.1);
    b.box('plaster', Ww + 2 * j, H2, Dw + j, 0, yb + H2 / 2, D / 2 + (Dw + j) / 2);
    /* timber framing, four faces + wing front */
    b.at(0, yb, D / 2 + j, 0, () => timberFace(b, W + 2 * j, H2, 6, true));
    b.at(0, yb, -(D / 2 + j), Math.PI, () => timberFace(b, W + 2 * j, H2, 6, true));
    b.at(W / 2 + j, yb, 0, Math.PI / 2, () => timberFace(b, D + 2 * j, H2, 4, true));
    b.at(-(W / 2 + j), yb, 0, -Math.PI / 2, () => timberFace(b, D + 2 * j, H2, 4, true));
    b.at(0, yb, wzf, 0, () => timberFace(b, Ww + 2 * j, H2, 2, true));
    b.at(Ww / 2 + j, yb, D / 2 + (Dw + j) / 2, Math.PI / 2, () => timberFace(b, Dw + j, H2, 1, false));
    /* main roof: ridge along x */
    b.at(0, 0, 0, Math.PI / 2, () => {
      b.ext('plaster', [[-(D / 2 + j), 0], [D / 2 + j, 0], [0, ridge]], W + 2 * j, 0, yt, 0);
      gable(b, 'roof', D + 2 * j, W + 2 * j + 3.2, ridge, 2.0, yt);
    });
    [1, -1].forEach((sd) => b.at(sd * (W / 2 + j), yt, 0, sd * Math.PI / 2, () => gableFace(b, D / 2 + j, ridge)));
    /* wing roof: ridge along z */
    const zf = wzf + 1.6, zb = 1.2;
    b.ext('plaster', [[-(Ww / 2 + j), 0], [Ww / 2 + j, 0], [0, riseW]], Dw + j + 1.0, 0, yt, D / 2 + (Dw + j + 1.0) / 2 - 0.5);
    b.at(0, 0, (zf + zb) / 2, 0, () => gable(b, 'roof', Ww + 2 * j, zf - zb, riseW, 1.6, yt));
    b.at(0, yt, wzf + 0.0, 0, () => gableFace(b, Ww / 2 + j, riseW));
    b.at(0, yt + riseW * 0.4, wzf + 0.6, 0, () => windowAt(b, 2.0, 2.4, 'win1', {}));
    /* chimneys on the ridge */
    const smoke = chimney(b, 6.2, yt + ridge - 4, -1, yt + ridge + 3.6, 3.5);
    const smoke2 = chimney(b, -6.4, yt + ridge - 4, -1, yt + ridge + 3.4, 3.5);
    /* door in the wing */
    b.at(0, g, wzf - j, 0, () => doorAt(b, 4.4, 7.2));
    b.box('stone', 5.4, 0.9, 1.3, 0, g + 0.45, wzf - j + 1.6); b.box('stone', 6.4, 0.5, 1.2, 0, g + 0.25, wzf - j + 2.7);
    /* windows */
    b.at(-5.8, g + 5.4, D / 2, 0, () => windowAt(b, 3.1, 3.9, 'win0', { shut: 1 }));
    b.at(5.8, g + 5.4, D / 2, 0, () => windowAt(b, 3.1, 3.9, 'win1', { shut: 1 }));
    b.at(-5.8, yb + 4.4, D / 2 + j + 0.5, 0, () => windowAt(b, 3.0, 3.6, 'win1', { flowers: 1 }));
    b.at(5.8, yb + 4.4, D / 2 + j + 0.5, 0, () => windowAt(b, 3.0, 3.6, 'win0', { flowers: 1 }));
    b.at(0, yb + 4.4, wzf + 0.5, 0, () => windowAt(b, 4.2, 3.7, 'win0', { flowers: 1, shut: 1 }));
    b.at(W / 2, g + 5.2, 2.0, Math.PI / 2, () => windowAt(b, 3.1, 3.9, 'win1', { shut: 1 }));
    b.at(W / 2 + j, yb + 4.4, -1.2, Math.PI / 2, () => windowAt(b, 3.0, 3.6, 'win0', { flowers: 1 }));
    b.at(W / 2 + j, yb + 4.4, 4.0, Math.PI / 2, () => windowAt(b, 2.6, 3.4, 'win1', {}));
    /* lantern at the door */
    b.box('iron', 1.0, 0.4, 1.0, 3.7, g + 7.6, wzf - j + 1.0); b.box('win1', 0.8, 1.2, 0.8, 3.7, g + 6.8, wzf - j + 1.0, { fit: [0.8, 1.2, 0, 0] });
    const lq = b.pt(3.7, g + 6.8, wzf - j + 1.4); b.halos.push({ x: lq[0], y: lq[1], z: lq[2], key: 'win1', size: 4.4 });
    /* yard: woodpile, barrel, fence, bushes, ivy, banner */
    for (let r = 0; r < 3; r++) {
      const n = 4 - r;
      for (let k = 0; k < n; k++) b.cyl('wood', 0.85, 0.85, 5.2, 8, W / 2 + 2.8, g + 0.9 + r * 1.5, 3 + (k - (n - 1) / 2) * 1.75, { rz: Math.PI / 2, tint: [0.9 + b.rnd() * 0.2, 0.9, 0.85], uvo: false });
    }
    b.cyl('wood', 1.5, 1.6, 3.0, 10, -W / 2 - 2.2, g + 1.5, D / 2 + 0.6, {});
    [0.8, 2.2].forEach((y) => b.cyl('iron', 1.6, 1.7, 0.28, 10, -W / 2 - 2.2, g + y, D / 2 + 0.6, { nobot: true }));
    fence(b, [[-14.2, 3], [-14.2, 10.4], [-11.2, 13.0], [-7.8, 13.4]]);
    fence(b, [[7.8, 13.4], [11.2, 13.0], [14.2, 10.4], [14.2, 7]]);
    [[-10.4, 0, 9.2, 1.0], [10.4, 0, 9.2, 1.0], [-12.2, 0, -2, 1.1], [12, 0, -8, 1.1], [-6, 0, -10, 1.0], [3.4, 0, 11.4, 0.75], [-3.6, 0, 11.4, 0.75]].forEach((q) => bush(b, q[0], g, q[2], q[3]));
    ivy(b, -W / 2 - 0.2, D / 2 - 1, 9.5, -0.9, 0.2);
    ivy(b, W / 2 + 0.3, -D / 2 + 0.5, 9.5, 0.9, 0);
    const bn = banner(b, 12.4, 10.4, 13.5);
    return { smoke, smoke2, banner: bn };
  }

  /* ------------------------------------------------------------------
     public builders
     ------------------------------------------------------------------ */
  /**
   * Build one wizard house as a THREE.Group (origin = tile centre).
   * @param {number} x     extra x offset inside the holder (0 = default)
   * @param {number} level 1 = stone cottage, 2 = two-story timber house
   * @param {string} col   owner colour hex
   * @param {number} seed  optional, makes each tile's house slightly different
   */
  P.houseGroup4D = function (x, level, col, seed) {
    const lv = level >= 2 ? 2 : 1;
    const b = new Build(rngOf(((seed || 1) * 7919 + lv * 104729) >>> 0));
    const info = lv === 2 ? buildHouse2(b) : buildCottage(b);
    const M = houseMaterials(col);

    const root = new THREE.Group();   /* animated by addHouse4D (rise + pop) */
    const view = new THREE.Group();   /* z squash + screen offset */
    const pitch = new THREE.Group();  /* lean toward the camera */
    const yaw = new THREE.Group();    /* show front + side wall */
    view.position.set(OFFSET.x + (x || 0), OFFSET.y, 0);
    view.scale.set(1, 1, SQUASH);
    pitch.rotation.x = PITCH;
    yaw.rotation.y = YAW;
    root.add(view); view.add(pitch); pitch.add(yaw);

    const built = b.toGroup(M);
    yaw.add(built.grp);
    const own = built.geos.slice();

    /* contact shadow + owner-coloured rune ring on the ground */
    const R = lv === 2 ? 17.6 : 15.8;
    const shadow = new THREE.Mesh(THREE.CircleGeometry ? new THREE.CircleGeometry(R + 5, 32) : new THREE.PlaneGeometry(2 * R + 10, 2 * R + 10),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.position.set(0, 0.05, 0);
    yaw.add(shadow);
    const rune = this.runeTex ? this.runeTex() : null;
    const ring = new THREE.Mesh(
      new THREE.PlaneGeometry(R * 2 + 10, R * 2 + 10),
      new THREE.MeshBasicMaterial({ map: rune, color: col, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2; ring.position.set(0, 0.35, 0);
    yaw.add(ring);

    /* smoke emitters (sprites live in the yaw frame, so they rise with the house) */
    const mkEmitter = (pos) => { const e = new THREE.Group(); e.position.set(pos[0], pos[1], pos[2]); yaw.add(e); return e; };
    const smokeAt = mkEmitter(info.smoke);
    const smokeAt2 = info.smoke2 ? mkEmitter(info.smoke2) : null;

    /* window halos (additive glow sprites) */
    const halos = [];
    if (TEX.glow) {
      b.halos.forEach((hq) => {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: 0xffa648, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5 }));
        sp.position.set(hq.x, hq.y, hq.z); sp.scale.set(hq.size, hq.size, 1);
        yaw.add(sp); halos.push(sp); own.push(sp.material);
      });
    }

    /* owner banner (own mesh so it can sway) */
    const flagG = new THREE.Group();
    flagG.position.set(info.banner[0], info.banner[1], info.banner[2]);
    const fg = genExtrude([[0, 0], [0, -3.4], [5.6, -3.4], [4.5, -1.7], [5.6, 0]], 0.25);
    const fgeo = new THREE.BufferGeometry();
    fgeo.setAttribute('position', new THREE.Float32BufferAttribute(fg.p, 3));
    fgeo.setAttribute('normal', new THREE.Float32BufferAttribute(fg.n, 3));
    fgeo.setIndex(fg.i);
    const flagM = new THREE.Mesh(fgeo, M.flag);
    flagG.add(flagM); yaw.add(flagG);
    own.push(fgeo, M.flag, M.win0, M.win1, ring.material, ring.geometry, shadow.material, shadow.geometry);

    const ext = [b.max[0] - b.min[0], b.max[2] - b.min[2]];
    root.userData = {
      level: lv, smokeAt, smokeAt2, winMats: [M.win0, M.win1], halos, flag: flagG, ring, view, pitch, yaw, own,
      size: Math.max(ext[0], ext[1], R * 2 + 10), height: b.max[1]
    };
    return root;
  };

  /* Smoke puff: soft sprite that rises, grows, drifts with the wind and fades */
  function startSmoke(at, count, wind) {
    if (!TEX.smoke) return;
    for (let k = 0; k < count; k++) {
      const puff = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.smoke, color: 0xd4d8de, transparent: true, opacity: 0, depthWrite: false }));
      puff.scale.set(3, 3, 1);
      at.add(puff);
      const cycle = () => {
        const dur = 3.4 + Math.random() * 0.8;
        gsap.fromTo(puff.position, { x: 0, y: 0, z: 0 }, { x: wind + (Math.random() - 0.3) * 4, y: 24 + Math.random() * 6, z: (Math.random() - 0.5) * 3, duration: dur, ease: 'sine.out', onComplete: cycle });
        gsap.fromTo(puff.scale, { x: 2.6, y: 2.6, z: 1 }, { x: 11, y: 11, z: 1, duration: dur, ease: 'sine.out' });
        gsap.fromTo(puff.material, { opacity: 0.55 }, { opacity: 0, duration: dur, ease: 'sine.in' });
      };
      gsap.delayedCall(k * (3.6 / count), cycle);
    }
  }

  function startAmbient(h) {
    const ud = h.userData;
    startSmoke(ud.smokeAt, 6, 4);
    if (ud.smokeAt2) startSmoke(ud.smokeAt2, 3, 3);
    /* window candlelight flicker (material + halos) */
    ud.winMats.forEach((m) => {
      gsap.to(m, { emissiveIntensity: 0.7 + Math.random() * 0.8, duration: 0.7 + Math.random() * 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    });
    ud.halos.forEach((sp) => {
      gsap.to(sp.material, { opacity: 0.28 + Math.random() * 0.3, duration: 0.7 + Math.random() * 0.9, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    });
    /* banner sway + rune ring breathe */
    gsap.fromTo(ud.flag.rotation, { y: -0.35 }, { y: 0.35, duration: 1.6 + Math.random() * 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    gsap.to(ud.ring.rotation, { z: Math.PI * 2, duration: 16, repeat: -1, ease: 'none' });
    gsap.to(ud.ring.material, { opacity: 0.75, duration: 2.2, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  /* Kill every tween this module started on a house (before it leaves the scene) */
  function killHouse(h) {
    const walk = (o) => {
      gsap.killTweensOf(o);
      if (o.position) gsap.killTweensOf(o.position);
      if (o.scale) gsap.killTweensOf(o.scale);
      if (o.rotation) gsap.killTweensOf(o.rotation);
      if (o.material) gsap.killTweensOf(o.material);
      (o.children || []).forEach(walk);
    };
    walk(h);
    const ud = h.userData || {};
    (ud.winMats || []).forEach((m) => gsap.killTweensOf(m));
  }
  function disposeHouse(h) {
    ((h.userData && h.userData.own) || []).forEach((r) => { if (r && r.dispose) r.dispose(); });
  }

  /**
   * Drop a 4D house onto a tile and play the build animation.
   * Signature matches the original addHouse, so buildPropertyOnTile needs no edit.
   * The design follows rec.level:  1 = cottage, 2 = two-story house.
   * view.js calls this twice for level 2 (x = -18 then +18); the second
   * call is ignored because ONE two-story house replaces the cottage.
   */
  P.addHouse4D = function (rec, x, tier, col, delay, silent) {
    delay = delay || 0;
    const level = rec.level >= 2 ? 2 : 1;
    const have = rec.parts.find((p) => p.userData && p.userData.level === level);
    if (have) return;                                   /* duplicate call for the same level */
    const old = rec.parts.filter((p) => p.userData && p.userData.level < level);

    const h = this.houseGroup4D(0, level, col, (rec.i || 0) + 1);
    rec.holder.add(h);
    rec.parts.push(h);
    const reduced = typeof RM !== 'undefined' && RM;
    const still = silent || reduced;

    old.forEach((o) => {                                /* cottage gives way to the 2-story house */
      rec.parts.splice(rec.parts.indexOf(o), 1);
      const gone = () => { killHouse(o); if (o.parent) o.parent.remove(o); disposeHouse(o); };
      if (still) return gone();
      gsap.to(o.scale, { x: 0.001, y: 0.001, z: 0.001, duration: 0.3, delay, ease: 'back.in(2)', onComplete: gone });
    });

    if (still) {
      h.scale.setScalar(1);
    } else {
      /* entrance: rise from below the tile, then elastic pop */
      const d0 = delay + (old.length ? 0.2 : 0);
      h.scale.setScalar(0.001);
      h.position.y = -26;
      gsap.to(h.position, { y: 0, duration: 0.75, delay: d0, ease: 'back.out(1.6)' });
      gsap.to(h.scale, { x: 1, y: 1, z: 1, duration: 1.15, delay: d0, ease: 'elastic.out(1, 0.55)' });
      gsap.delayedCall(d0 + 0.3, () => burst(rec.i, '#d8b98a', level === 2 ? 22 : 16));
      const t = this.tpx(rec.i);
      gsap.delayedCall(d0 + 0.55, () => {
        this.showFloatingText(level === 2 ? 'RUMAH 2 TINGKAT' : 'RUMAH SIHIR', col, new THREE.Vector3(t.x, -(t.y - 78 * this.U), 0));
      });
    }
    if (!reduced) startAmbient(h);                      /* 4D loops run even for silent (loaded) builds */
  };

  /* Route the original addHouse through the 4D builder. */
  P.addHouse = P.addHouse4D;

  /* Kill every tween and free GPU buffers before a building leaves the scene. */
  const baseRetire = P.retire;
  P.retire = function (i, old, silent) {
    (old.parts || []).forEach(killHouse);
    const parts = (old.parts || []).slice();
    const r = baseRetire.call(this, i, old, silent);
    gsap.delayedCall(silent ? 0 : 0.7, () => parts.forEach(disposeHouse));
    return r;
  };

  window.HARPOT_HOUSES4D = {
    houseGroup4D: P.houseGroup4D,
    addHouse4D: P.addHouse4D,
    PITCH, YAW, SQUASH
  };
})();
