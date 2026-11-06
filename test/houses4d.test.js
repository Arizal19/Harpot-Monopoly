'use strict';
/*
 * Tests for js/houses4d.js (v2). Run:  node test/houses4d.test.js
 * Uses the real Three.js (js/three.min.js or $THREE_PATH) inside a vm sandbox
 * with a tiny fake gsap. No DOM is needed: the module skips canvas textures
 * when `document` is missing, which is enough to measure geometry and wiring.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const root = path.join(__dirname, '..');
const threePath = process.env.THREE_PATH || [
  path.join(root, 'js', 'three.min.js'), path.join(root, 'lib', 'three.min.js')
].find(fs.existsSync);
if (!threePath) { console.error('three.min.js not found: set THREE_PATH'); process.exit(2); }

function makeSandbox() {
  const tweens = [], killed = [], calls = { burst: 0, text: [] };
  const sb = { console, Math, Date, setTimeout, clearTimeout };
  sb.window = sb; sb.self = sb;
  sb.gsap = {
    to(t, v) { const o = { t, v }; tweens.push(o); return o; },
    fromTo(t, a, v) { const o = { t, v }; tweens.push(o); return o; },
    delayedCall(d, f) { const o = { d, f }; tweens.push(o); return o; },
    killTweensOf(t) { killed.push(t); }
  };
  sb.burst = () => { calls.burst++; };
  vm.createContext(sb);
  vm.runInContext(fs.readFileSync(threePath, 'utf8'), sb);
  vm.runInContext(`
    class MagicMonopolyLGR {
      constructor() { this.U = 1; this.props = {}; }
      tpx(i) { return { x: 100 + i, y: 50 }; }
      showFloatingText(txt) { __calls.text.push(txt); }
      retire(i, old) { delete this.props[i]; if (old.holder.parent) old.holder.parent.remove(old.holder); }
    }
    window.MagicMonopolyLGR = MagicMonopolyLGR;`, Object.assign(sb, { __calls: calls }));
  vm.runInContext(fs.readFileSync(path.join(root, 'js', 'houses4d.js'), 'utf8'), sb);
  return { sb, tweens, killed, calls };
}

function newRec(sb, i) {
  const holder = new sb.THREE.Group();
  return { i, holder, level: 1, owner: 0, parts: [], g: null, ring: null, light: null };
}
/* solid meshes only (halo and smoke sprites are soft glows), tight box from transformed vertices:
   transforming a local AABB would inflate a yawed disc by cos+sin */
function box(sb, obj) {
  obj.updateMatrixWorld(true);
  const b = new sb.THREE.Box3(), v = new sb.THREE.Vector3();
  obj.traverse((c) => {
    if (!c.isMesh || !c.geometry || c.material.isMeshBasicMaterial) return;   /* basic = flat ground decals */
    const pos = c.geometry.attributes.position;
    for (let k = 0; k < pos.count; k++) b.expandByPoint(v.fromBufferAttribute(pos, k).applyMatrix4(c.matrixWorld));
  });
  return b;
}
function countMeshes(o) { let n = 0; o.traverse((c) => { if (c.isMesh || c.isSprite) n++; }); return n; }

let pass = 0, fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ok   ' + name); }
  catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

console.log('houses4d');

test('patches the prototype and routes addHouse to addHouse4D', () => {
  const { sb } = makeSandbox();
  const P = sb.MagicMonopolyLGR.prototype;
  assert.strictEqual(P.addHouse, P.addHouse4D);
  assert.strictEqual(typeof sb.HARPOT_HOUSES4D.houseGroup4D, 'function');
});

test('level 1 builds one cottage, few draw calls, no PointLight', () => {
  const { sb } = makeSandbox();
  const v = new sb.MagicMonopolyLGR(), rec = newRec(sb, 4);
  v.addHouse(rec, -18, 2, 0x44aa66, 0, true);
  assert.strictEqual(rec.parts.length, 1);
  assert.strictEqual(rec.parts[0].userData.level, 1);
  assert.ok(countMeshes(rec.parts[0]) <= 40, 'meshes: ' + countMeshes(rec.parts[0]));
  rec.parts[0].traverse((c) => assert.ok(!c.isLight, 'PointLight would blow the uniform budget'));
});

test('footprint stays inside the tile top face (about 59 units)', () => {
  const { sb } = makeSandbox();
  const v = new sb.MagicMonopolyLGR();
  [1, 2].forEach((lv) => {
    const rec = newRec(sb, 4); rec.level = lv;
    v.addHouse(rec, -18, 2, 0x44aa66, 0, true);
    const b = box(sb, rec.parts[0]);
    const w = b.max.x - b.min.x;                 /* camera sees x; z is depth only */
    assert.ok(w <= 46, 'level ' + lv + ' footprint ' + w.toFixed(1));
    rec.parts[0].traverse((c) => {                      /* decals: a square plane is only ever its inscribed disc visibly */
      if (c.isMesh && c.material.isMeshBasicMaterial) {
        const gp = c.geometry.parameters, d = gp.width || gp.radius * 2;
        assert.ok(d <= 46, 'decal ' + d.toFixed(1));
      }
    });
  });
});

test('level 2 = one two-story house that replaces the cottage; duplicate x=+18 call ignored', () => {
  const { sb } = makeSandbox();
  const v = new sb.MagicMonopolyLGR(), rec = newRec(sb, 4);
  v.addHouse(rec, -18, 2, 0x44aa66, 0, true);
  rec.level = 2;
  v.addHouse(rec, 18, 2, 0x44aa66, 0, true);
  v.addHouse(rec, -18, 2, 0x44aa66, 0, true);
  assert.strictEqual(rec.parts.length, 1);
  assert.strictEqual(rec.parts[0].userData.level, 2);
});

test('level 2 is taller than level 1', () => {
  const { sb } = makeSandbox();
  const v = new sb.MagicMonopolyLGR();
  const h = (lv) => { const r = newRec(sb, 4); r.level = lv; v.addHouse(r, 0, 2, 0x44aa66, 0, true); const b = box(sb, r.parts[0]); return b.max.y - b.min.y; };
  assert.ok(h(2) > h(1) * 1.15, 'heights ' + h(1).toFixed(1) + ' vs ' + h(2).toFixed(1));
});

test('silent build: no entrance tween, no floating text, scale 1', () => {
  const { sb, tweens, calls } = makeSandbox();
  const v = new sb.MagicMonopolyLGR(), rec = newRec(sb, 4);
  const before = tweens.length;
  v.addHouse(rec, -18, 2, 0x44aa66, 0, true);
  const entrance = tweens.slice(before).filter((t) => t.t === rec.parts[0].scale || t.t === rec.parts[0].position);
  assert.strictEqual(entrance.length, 0);
  assert.strictEqual(rec.parts[0].scale.x, 1);
  assert.strictEqual(calls.text.length, 0);
});

test('animated build: rises from below the tile, pops, bursts dust, shows text', () => {
  const { sb, tweens, calls } = makeSandbox();
  const v = new sb.MagicMonopolyLGR(), rec = newRec(sb, 4);
  v.addHouse(rec, -18, 2, 0x44aa66, 0, false);
  const h = rec.parts[0];
  assert.ok(h.position.y < 0, 'starts below the tile');
  assert.ok(h.scale.x < 0.01, 'starts tiny');
  assert.ok(tweens.some((t) => t.t === h.position), 'rise tween');
  assert.ok(tweens.some((t) => t.t === h.scale), 'pop tween');
  tweens.filter((t) => t.f).forEach((t) => t.f());
  assert.ok(calls.burst >= 1);
  assert.deepStrictEqual(calls.text, ['RUMAH SIHIR']);
});

test('upgrade animates the cottage away and announces the two-story house', () => {
  const { sb, tweens, calls } = makeSandbox();
  const v = new sb.MagicMonopolyLGR(), rec = newRec(sb, 4);
  v.addHouse(rec, -18, 2, 0x44aa66, 0, true);
  const cottage = rec.parts[0];
  rec.level = 2;
  v.addHouse(rec, 18, 2, 0x44aa66, 0.2, false);
  assert.ok(tweens.some((t) => t.t === cottage.scale), 'cottage shrinks');
  tweens.filter((t) => t.f).forEach((t) => t.f());
  assert.ok(calls.text.includes('RUMAH 2 TINGKAT'));
});

test('retire kills tweens and frees buffers of every house part', () => {
  const { sb, tweens, killed } = makeSandbox();
  const v = new sb.MagicMonopolyLGR(), rec = newRec(sb, 4);
  v.propLayer = new sb.THREE.Group(); v.propLayer.add(rec.holder); v.props[4] = rec;
  v.addHouse(rec, -18, 2, 0x44aa66, 0, true);
  const h = rec.parts[0];
  let disposed = 0;
  h.traverse((c) => { if (c.geometry) { const d = c.geometry.dispose.bind(c.geometry); c.geometry.dispose = () => { disposed++; d(); }; } });
  v.retire(4, rec, true);
  assert.ok(killed.length > 0, 'killTweensOf called');
  tweens.filter((t) => t.f).forEach((t) => t.f());
  assert.ok(disposed > 0, 'geometry disposed');
  assert.strictEqual(rec.holder.parent, null);
});

test('different tiles get different looks (seeded variation) but identical size class', () => {
  const { sb } = makeSandbox();
  const v = new sb.MagicMonopolyLGR();
  const a = newRec(sb, 3), b = newRec(sb, 9);
  v.addHouse(a, 0, 2, 0x44aa66, 0, true); v.addHouse(b, 0, 2, 0x44aa66, 0, true);
  const wa = box(sb, a.parts[0]), wb = box(sb, b.parts[0]);
  assert.ok(Math.abs((wa.max.x - wa.min.x) - (wb.max.x - wb.min.x)) < 8);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
