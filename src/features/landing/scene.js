import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Converted from reference/TrueFraction.html's inline <script> + <script type="module">.
// Exports initScene(), which boots the three.js scene / loader / scroll-camera / UI
// logic exactly as the original page did, and returns a cleanup function so the
// scene can be torn down when this route unmounts (no leaked listeners, no second
// WebGL context on remount).
export function initScene() {
  let alive = true;
  const off = [];

  const addEventListener = (t, f, o) => {
    window.addEventListener(t, f, o);
    off.push(() => window.removeEventListener(t, f, o));
  };
  const setInterval = (f, ms) => {
    const id = window.setInterval(f, ms);
    off.push(() => clearInterval(id));
    return id;
  };
  const setTimeout = (f, ms, ...a) => window.setTimeout(() => alive && f(...a), ms);
  const requestAnimationFrame = (cb) => window.requestAnimationFrame((t) => alive && cb(t));
  const tick = (cb) => {
    let d = false;
    const go = () => {
      if (!d) {
        d = true;
        cb();
      }
    };
    requestAnimationFrame(go);
    setTimeout(go, 34);
  };
  window.tick = tick;

  // Hoisted so cleanup() below can disconnect it; assigned inside the async
  // IIFE at the same point the original inline script created it.
  let io;

  // The page's own CSS (landing.css) is scoped under this wrapper instead of
  // html/body, so this element — not document.body — is what carries the
  // loading/ready classes the CSS keys off of (body.loading -> .tf-landing.loading).
  const root = document.querySelector('.tf-landing');

  // The original body.loading{overflow:hidden} locked page scroll while the
  // loader was up. The page's scrolling element is <html>, not <body> — an
  // overflow:hidden on body alone leaves html free to scroll, so scrollTo(),
  // PageDown/Space/arrow keys and touch-drag could all still move the page
  // out from under the loader. Lock both for as long as the loader is up —
  // NOT a fixed timeout: the loader can easily run past any fixed window on
  // a slow connection (it streams a ~3.8 MB model), so a flat "1s then
  // unlock" left scroll free while the loading screen was still visible.
  // The lock now only lifts in markReady(), i.e. exactly when body would
  // have lost its .loading class. overflow:hidden alone still doesn't stop
  // a script-driven scrollTo(), so back it with a scroll listener that
  // snaps back to 0 while locked — that catches every input (wheel, keys,
  // touch, programmatic) uniformly instead of intercepting each one.
  const prevHtmlOverflow = document.documentElement.style.overflow;
  const prevBodyOverflow = document.body.style.overflow;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  let scrollLocked = true;
  addEventListener('scroll', () => { if (scrollLocked && scrollY !== 0) scrollTo(0, 0); }, { passive: true });
  const unlockScroll = () => {
    if (!scrollLocked) return;
    scrollLocked = false;
    document.documentElement.style.overflow = prevHtmlOverflow;
    document.body.style.overflow = prevBodyOverflow;
  };

  // The whole intro (loader, hero camera framing, word reveals) assumes it
  // starts at the top of the page — but browsers restore scroll position on
  // reload by default, so reloading mid-scroll would show the translucent
  // loader "playing" over whatever section you'd scrolled to, out of sync
  // with the camera. Take manual control of scroll restoration for as long
  // as this page is mounted and snap to the top before anything renders.
  const prevScrollRestoration = history.scrollRestoration;
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);
  const markReady = () => {
    root.classList.remove('loading');
    root.classList.add('ready');
    unlockScroll();
  };

  // safety net if WebGL/module never boots
  setTimeout(() => {
    if (!root.classList.contains('ready')) markReady();
  }, 25000);

  (async () => {
    if (!alive) return;

  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050507);
  scene.fog = new THREE.FogExp2(0x07060c, 0.026);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
  
  // environment for reflections
  (() => {
    const env = new THREE.Scene();
    const geo = new THREE.SphereGeometry(50, 32, 16);
    const cols = [], p = geo.attributes.position, c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) / 50;
      if (y > 0) c.setRGB(0.08 + 0.5 * Math.pow(1 - y, 3), 0.1 + 0.25 * Math.pow(1 - y, 3), 0.2 + 0.2 * Math.pow(1 - y, 3));
      else c.setRGB(0.02, 0.02, 0.04);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
    env.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
    const box = (col, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
    box(new THREE.Color(2.2, 2.1, 2.4), 20, 25, 10, 18, 10);
    box(new THREE.Color(2.6, 1.3, 0.7), -25, 8, 10, 10, 30);
    box(new THREE.Color(0.4, 1.4, 2.4), 10, 6, -25, 22, 6);
    const pm = new THREE.PMREMGenerator(renderer);
    scene.environment = pm.fromScene(env, 0.03).texture;
    scene.environmentIntensity = 0.9;
  })();
  
  const M = {
    glass: new THREE.MeshStandardMaterial({ name: 'glass', color: 0x2a3350, metalness: 0.85, roughness: 0.16 }),
    steel: new THREE.MeshStandardMaterial({ name: 'steel', color: 0xc9cfdc, metalness: 1, roughness: 0.3 }),
    glow: new THREE.MeshStandardMaterial({ name: 'glow_violet', color: 0xc084fc, emissive: 0xa855f7, emissiveIntensity: 1.6 }),
    glowB: new THREE.MeshStandardMaterial({ name: 'glow_cyan', color: 0x7dd3fc, emissive: 0x0bb4ff, emissiveIntensity: 1.4 }),
    city: new THREE.MeshStandardMaterial({ name: 'city', color: 0x151726, metalness: 0.7, roughness: 0.4 }),
  };
  
  // ---------- Burj-style tower: Y-plan, spiral setbacks, curtain wall, spire ----------
  const T = 0.42; // one texture tile = 8 floors (~3.4 m each)
  function makeFacade(kind) {
    const S = 512, c1 = document.createElement('canvas'), c2 = document.createElement('canvas');
    c1.width = c1.height = c2.width = c2.height = S;
    const g = c1.getContext('2d'), e = c2.getContext('2d'); e.fillStyle = '#000'; e.fillRect(0, 0, S, S);
    const rows = 8, fh = S / rows, J = (n) => (Math.random() - 0.5) * n;
    if (kind === 'glass') {
      const cols = 24, pw = S / cols;
      g.fillStyle = '#8a95a6'; g.fillRect(0, 0, S, S);
      for (let rr = 0; rr < rows; rr++) for (let q = 0; q < cols; q++) {
        const x = q * pw, y = rr * fh, t = 0.9 + J(0.12);
        const grd = g.createLinearGradient(0, y, 0, y + fh * 0.84);
        grd.addColorStop(0, `rgb(${120 * t | 0},${136 * t | 0},${158 * t | 0})`); grd.addColorStop(1, `rgb(${70 * t | 0},${84 * t | 0},${104 * t | 0})`);
        g.fillStyle = grd; g.fillRect(x + 1, y + 1, pw - 2, fh * 0.84);
        if (Math.random() < 0.07) { e.fillStyle = `rgba(255,${205 + J(30) | 0},150,${0.35 + Math.random() * 0.4})`; e.fillRect(x + 1, y + 1, pw - 2, fh * 0.84); }
      }
      g.fillStyle = '#a7b0bf'; for (let rr = 0; rr < rows; rr++) g.fillRect(0, rr * fh + fh * 0.86, S, fh * 0.14);
      g.fillStyle = '#d3d9e2'; for (let q = 0; q < cols; q++) g.fillRect(q * pw, 0, 1, S);
    } else if (kind === 'res') {
      const bays = 6, bw = S / bays;
      g.fillStyle = '#d2c4a8'; g.fillRect(0, 0, S, S);
      for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(${120 + J(40)},${100 + J(30)},${70 + J(30)},.06)`; g.fillRect(Math.random() * S, Math.random() * S, 3, 3); }
      for (let rr = 0; rr < rows; rr++) for (let q = 0; q < bays; q++) {
        const x = q * bw, y = rr * fh;
        g.fillStyle = '#343a44'; g.fillRect(x + bw * 0.12, y + fh * 0.18, bw * 0.46, fh * 0.6); // balcony door
        g.fillStyle = '#4a5260'; g.fillRect(x + bw * 0.66, y + fh * 0.28, bw * 0.2, fh * 0.4);  // window
        g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + bw * 0.12, y + fh * 0.18, bw * 0.46, fh * 0.12);
        if (Math.random() < 0.22) { e.fillStyle = `rgba(255,${190 + J(40) | 0},120,${0.4 + Math.random() * 0.5})`; e.fillRect(x + bw * 0.12, y + fh * 0.18, bw * 0.46, fh * 0.6); }
        if (Math.random() < 0.12) { e.fillStyle = 'rgba(255,220,170,.6)'; e.fillRect(x + bw * 0.66, y + fh * 0.28, bw * 0.2, fh * 0.4); }
      }
      g.fillStyle = '#ebe3d4'; for (let rr = 0; rr < rows; rr++) g.fillRect(0, rr * fh + fh * 0.8, S, fh * 0.2);
      g.fillStyle = '#2a2d33'; for (let rr = 0; rr < rows; rr++) g.fillRect(0, rr * fh + fh * 0.66, S, 2);
    } else {
      const cols = 14, pw = S / cols;
      g.fillStyle = '#262c37'; g.fillRect(0, 0, S, S);
      for (let rr = 0; rr < rows; rr++) for (let q = 0; q < cols; q++) {
        const x = q * pw, y = rr * fh, t = 0.85 + J(0.2);
        g.fillStyle = `rgb(${34 * t | 0},${48 * t | 0},${70 * t | 0})`; g.fillRect(x + 3, y + 2, pw - 6, fh * 0.8);
        if (Math.random() < 0.12) { e.fillStyle = `rgba(225,235,255,${0.3 + Math.random() * 0.4})`; e.fillRect(x + 3, y + 2, pw - 6, fh * 0.8); }
      }
      g.fillStyle = '#b4bcc9'; for (let q = 0; q < cols; q++) g.fillRect(q * pw, 0, 3, S);
      g.fillStyle = '#50596a'; for (let rr = 0; rr < rows; rr++) g.fillRect(0, rr * fh + fh * 0.84, S, fh * 0.16);
    }
    return [c1, c2].map(c => { const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace; return t; });
  }
  const FX = { glass: makeFacade('glass'), res: makeFacade('res'), office: makeFacade('office') };
  const [facadeMap, facadeEmit] = FX.glass;
  M.facade = new THREE.MeshStandardMaterial({ name: 'curtain_wall', map: facadeMap, emissiveMap: facadeEmit, emissive: 0xffffff, emissiveIntensity: 0.55, metalness: 0.8, roughness: 0.14 });
  M.glass = new THREE.MeshStandardMaterial({ name: 'glass', color: 0x2a3350, metalness: 0.85, roughness: 0.16 });
  
  function boxUV(geo, w, h, d, y0) {
    const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let j = 0; j < 4; j++) {
      const i = f * 4 + j, side = f !== 2 && f !== 3;
      uv.setXY(i, uv.getX(i) * dims[f][0] / T, side ? (uv.getY(i) * h + y0) / T : uv.getY(i) * dims[f][1] / T);
    }
  }
  function cylUV(geo, r, h, y0) {
    const uv = geo.attributes.uv, k = 2 * Math.PI * r / T;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, (uv.getY(i) * h + y0) / T);
  }
  const N = 27;
  const tower = new THREE.Group(); tower.name = 'dubai_tower';
  const tiers = [];
  let ty0 = 0.15;
  for (let i = 0; i < N; i++) {
    const t = i / N, H = 0.44 - i * 0.008;
    const tier = new THREE.Group(); tier.name = `tier_${String(i + 1).padStart(2, '0')}`;
    const coreR = 0.5 * (1 - t * 0.45), w = 0.62 * (1 - t * 0.5);
    const coreG = new THREE.CylinderGeometry(coreR, coreR, H, 6); cylUV(coreG, coreR, H, ty0);
    const core = new THREE.Mesh(coreG, M.facade); core.name = `${tier.name}_core`; tier.add(core);
    for (let k = 0; k < 3; k++) {
      const step = Math.floor((i + k) / 3);
      const L = Math.max(coreR + 0.05, 2.0 - step * 0.205);
      const ang = k * Math.PI * 2 / 3 + Math.PI / 2, cx = Math.cos(ang), cz = Math.sin(ang);
      const wg = new THREE.BoxGeometry(L, H, w); boxUV(wg, L, H, w, ty0);
      const wing = new THREE.Mesh(wg, M.facade);
      wing.position.set(cx * L / 2, 0, cz * L / 2); wing.rotation.y = -ang; wing.name = `${tier.name}_wing_${k}`;
      const tg = new THREE.CylinderGeometry(w / 2, w / 2, H, 48, 1, false, 0, Math.PI * 2); cylUV(tg, w / 2, H, ty0);
      const tip = new THREE.Mesh(tg, M.facade); tip.position.set(cx * L, 0, cz * L); tip.name = `${tier.name}_tip_${k}`;
      // setback terrace + parapet
      const slabMat = i % 4 === 3 ? M.glow : M.steel;
      const slab = new THREE.Mesh(new THREE.BoxGeometry(L, 0.02, w + 0.03), slabMat);
      slab.position.set(cx * L / 2, H / 2 + 0.001, cz * L / 2); slab.rotation.y = -ang; slab.name = `${tier.name}_terrace_${k}`;
      const tipSlab = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.015, w / 2 + 0.015, 0.02, 48), slabMat);
      tipSlab.position.set(cx * L, H / 2 + 0.001, cz * L); tipSlab.name = `${tier.name}_tipterrace_${k}`;
      tier.add(wing, tip, slab, tipSlab);
      // stainless vertical fins: nose + flanks
      const fins = [[L + w / 2 + 0.02, 0, 0.035, 0.1], [L * 0.55, w / 2 + 0.012, 0.018, 0.035], [L * 0.55, -w / 2 - 0.012, 0.018, 0.035]];
      fins.forEach(([along, off, fw, fd], n) => {
        const f = new THREE.Mesh(new THREE.BoxGeometry(n ? fd : fd, H, n ? fw : fw), M.steel);
        const px = cx * along - cz * off, pz = cz * along + cx * off;
        f.position.set(px, 0, pz); f.rotation.y = -ang; f.name = `${tier.name}_fin_${k}_${n}`; tier.add(f);
      });
      // wing-root steel spines between wings
      const sa = ang + Math.PI / 3, sp = new THREE.Mesh(new THREE.BoxGeometry(0.04, H, 0.04), M.steel);
      sp.position.set(Math.cos(sa) * coreR * 0.95, 0, Math.sin(sa) * coreR * 0.95); sp.name = `${tier.name}_spine_${k}`; tier.add(sp);
    }
    tier.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    tier.userData.baseY = ty0 + H / 2; tier.position.y = tier.userData.baseY;
    tower.add(tier); tiers.push(tier); ty0 += H;
  }
  const crown = new THREE.Group(); crown.name = 'crown';
  let cy = 0;
  [[0.3, 0.55], [0.27, 0.5], [0.24, 0.45], [0.21, 0.4], [0.18, 0.35]].forEach(([r, h], j) => {
    const cg = new THREE.CylinderGeometry(r * 0.96, r, h, 48); cylUV(cg, r, h, ty0 + cy);
    const m = new THREE.Mesh(cg, M.facade); m.position.y = cy + h / 2; m.name = `crown_tube_${j}`; m.castShadow = true; crown.add(m);
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96 + 0.02, r * 0.96 + 0.02, 0.035, 48), j === 4 ? M.glow : M.steel);
    ring.position.y = cy + h; ring.name = `crown_ring_${j}`; crown.add(ring);
    cy += h;
  });
  const lattice = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.7, 12, 1, true), M.steel); lattice.position.y = cy + 0.35; lattice.name = 'pinnacle_base'; crown.add(lattice); cy += 0.7;
  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.1, 3.2, 32), M.steel); spire.position.y = cy + 1.6; spire.name = 'spire'; spire.castShadow = true;
  for (let j = 0; j < 5; j++) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.09 - j * 0.016, 0.008, 8, 32), M.steel); r.rotation.x = Math.PI / 2; r.position.y = cy + 0.25 + j * 0.45; r.name = `spire_ring_${j}`; crown.add(r); }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), M.glow); beacon.position.y = cy + 3.22; beacon.name = 'beacon';
  crown.add(spire, beacon); cy += 3.25;
  crown.userData.baseY = ty0; crown.position.y = ty0;
  tower.add(crown);
  const podium = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 3.1, 0.15, 96), M.steel); podium.position.y = 0.075; podium.name = 'podium'; podium.receiveShadow = true;
  const podiumRing = new THREE.Mesh(new THREE.TorusGeometry(3.25, 0.012, 8, 160), M.glow); podiumRing.rotation.x = Math.PI / 2; podiumRing.position.y = 0.02; podiumRing.name = 'podium_ring';
  podium.scale.set(0.6, 1, 0.6); podiumRing.scale.set(0.58, 0.58, 1);
  tower.add(podium, podiumRing);
  scene.add(tower);
  let towerH = 15.3, modelReady = false, blurCur = 26;
  const LP = { init: 0, dl: 0, dec: 0, fonts: 0, prep: 0, fin: 0 };
  
  // ---------- user-supplied Burj Khalifa model (decoded from GLB, sliced into bands for tokenize) ----------
  async function fetchProgress(url, onP) {
    const res = await fetch(url); if (!res.ok) throw new Error('HTTP ' + res.status);
    const len = +res.headers.get('content-length') || 3802117;
    if (!res.body) { const ab = await res.arrayBuffer(); onP(1); return ab; }
    const rd = res.body.getReader(), parts = []; let got = 0;
    for (;;) { const { done, value } = await rd.read(); if (done) break; parts.push(value); got += value.length; onP(Math.min(0.99, got / Math.max(len, got * 1.02))); }
    const out = new Uint8Array(got); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; }
    onP(1); return out.buffer;
  }
  const yieldFrame = () => new Promise(res => setTimeout(res, 0));
  async function loadBurj() {
    let ab = await fetchProgress('/models/burj.bin.gz', v => LP.dl = v);
    const u8 = new Uint8Array(ab);
    if (u8[0] === 0x1f && u8[1] === 0x8b) ab = await new Response(new Blob([ab]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    LP.dec = 0.35; await yieldFrame();
    const hl = new DataView(ab).getUint32(0, true), meta = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, 4, hl))), base = 4 + hl;
    const S = towerH / meta.height, BANDS = 18;
    const mats = {
      Vitres: new THREE.MeshStandardMaterial({ name: 'burj_glass', color: 0x3a5870, metalness: 0.95, roughness: 0.06, emissive: 0x1a1030, emissiveIntensity: 0.6 }),
      Rebord: new THREE.MeshStandardMaterial({ name: 'burj_cladding', color: 0xc6ccd6, metalness: 0.9, roughness: 0.24 }),
    };
    const bands = Array.from({ length: BANDS }, (_, b) => { const g = new THREE.Group(); g.name = `burj_band_${String(b + 1).padStart(2, '0')}`; g.userData.baseY = 0; return g; });
    for (const [gi, G] of meta.groups.entries()) {
      LP.dec = 0.35 + 0.55 * gi / meta.groups.length; await yieldFrame();
      const pos = new THREE.BufferAttribute(new Uint16Array(ab, base + G.pos, G.verts * 3), 3, true);
      const nor = new THREE.BufferAttribute(new Int8Array(ab, base + G.nor, G.verts * 3), 3, true);
      const idx = G.idx32 ? new Uint32Array(ab, base + G.idx, G.idxLen) : new Uint16Array(ab, base + G.idx, G.idxLen);
      const buckets = Array.from({ length: BANDS }, () => []);
      for (let t = 0; t < idx.length; t += 3) {
        const y = (pos.array[idx[t] * 3 + 1] + pos.array[idx[t + 1] * 3 + 1] + pos.array[idx[t + 2] * 3 + 1]) / (3 * 65535);
        const b = Math.min(BANDS - 1, Math.floor(Math.pow(y, 0.8) * BANDS));
        buckets[b].push(idx[t], idx[t + 1], idx[t + 2]);
      }
      buckets.forEach((list, b) => {
        if (!list.length) return;
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', pos); geo.setAttribute('normal', nor);
        geo.setIndex(new THREE.BufferAttribute(G.idx32 ? new Uint32Array(list) : new Uint16Array(list), 1));
        const m = new THREE.Mesh(geo, mats[G.name] || mats.Rebord); m.name = `${bands[b].name}_${G.name}`;
        m.scale.set(meta.bbox.size[0] * S, meta.bbox.size[1] * S, meta.bbox.size[2] * S);
        m.position.set(meta.bbox.min[0] * S, 0.15, meta.bbox.min[2] * S);
        m.castShadow = m.receiveShadow = true; m.frustumCulled = false;
        bands[b].add(m);
      });
    }
    tiers.forEach(t => tower.remove(t)); tower.remove(crown);
    tiers.length = 0; bands.forEach(b => { tower.add(b); tiers.push(b); });
    beacon.visible = false; LP.dec = 1; modelReady = true;
  }
  function mergeGroup(root) {
    root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map();
    root.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone();
      g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
      if (!buckets.has(o.material)) buckets.set(o.material, { geos: [], cast: false });
      const b = buckets.get(o.material); b.geos.push(g); b.cast ||= o.castShadow;
    });
    const out = new THREE.Group(); out.name = root.name; out.position.copy(root.position); out.rotation.copy(root.rotation); out.scale.copy(root.scale); out.userData = root.userData;
    for (const [mat, { geos, cast }] of buckets) {
      let n = 0; geos.forEach(g => n += g.attributes.position.count);
      const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2); let k = 0;
      geos.forEach(g => { pos.set(g.attributes.position.array, k * 3); nor.set(g.attributes.normal.array, k * 3); if (g.attributes.uv) uv.set(g.attributes.uv.array, k * 2); k += g.attributes.position.count; g.dispose(); });
      const G = new THREE.BufferGeometry();
      G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); G.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      const me = new THREE.Mesh(G, mat); me.name = `${root.name}_${mat.name}`; me.castShadow = cast; me.receiveShadow = true; out.add(me);
    }
    return out;
  }
  tiers.forEach((t, i) => { const m = mergeGroup(t); tower.remove(t); tower.add(m); tiers[i] = m; });
  
  // ---------- Surrounding city: real Dubai landmarks + detailed towers ----------
  // scale: 1 unit ≈ 54 m (Burj Khalifa 828 m ≈ 15.3 u)
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const city = new THREE.Group(); city.name = 'city';
  const Y = new THREE.Vector3(0, 1, 0), spinners = [], zones = [];
  Object.assign(M, {
    cityFacade: new THREE.MeshStandardMaterial({ name: 'office_facade', map: FX.office[0], emissiveMap: FX.office[1], emissive: 0xffffff, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.22 }),
    resFacade: new THREE.MeshStandardMaterial({ name: 'residential_facade', map: FX.res[0], emissiveMap: FX.res[1], color: 0xd9c9a8, emissive: 0xffffff, emissiveIntensity: 0.45, metalness: 0, roughness: 0.85 }),
    balcony: new THREE.MeshStandardMaterial({ name: 'balcony_concrete', color: 0xcdbfa6, roughness: 0.8 }),
    railing: new THREE.MeshStandardMaterial({ name: 'railing_glass', color: 0x6c7a8c, metalness: 0.6, roughness: 0.2, transparent: true, opacity: 0.7 }),
    silverFacade: new THREE.MeshStandardMaterial({ name: 'silver_facade', map: facadeMap, emissiveMap: facadeEmit, color: 0xe4e8ef, emissive: 0xffffff, emissiveIntensity: 0.5, metalness: 0.85, roughness: 0.14 }),
    fabric: new THREE.MeshStandardMaterial({ name: 'teflon_sail', color: 0xeef0f6, emissive: 0x6d4aa8, emissiveIntensity: 0.25, metalness: 0, roughness: 0.55, side: THREE.DoubleSide }),
    blueGlass: new THREE.MeshStandardMaterial({ name: 'blue_glass', color: 0x2f6aa8, metalness: 0.85, roughness: 0.12, side: THREE.DoubleSide }),
    gold: new THREE.MeshStandardMaterial({ name: 'gold', color: 0xd9a84a, metalness: 1, roughness: 0.28, emissive: 0x3a2400, emissiveIntensity: 0.4 }),
    grass: new THREE.MeshStandardMaterial({ name: 'landscape', color: 0x15261d, roughness: 0.9 }),
    water: new THREE.MeshStandardMaterial({ name: 'water', color: 0x0a1a2e, metalness: 0.9, roughness: 0.08 }),
  });
  const mesh = (geo, mat, name, cast = true) => { const m = new THREE.Mesh(geo, mat); m.name = name; m.castShadow = cast; m.receiveShadow = true; return m; };
  function uvBox(geo, w, h, d, u0 = 0) {
    const uv = geo.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let j = 0; j < 4; j++) { const i = f * 4 + j; uv.setXY(i, uv.getX(i) * dims[f][0] / T + u0, uv.getY(i) * dims[f][1] / T); }
    return geo;
  }
  function uvCyl(geo, r, h, u0 = 0) { const uv = geo.attributes.uv, k = 2 * Math.PI * r / T; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k + u0, uv.getY(i) * h / T); return geo; }
  function cylBetween(p1, p2, r, mat, name) {
    const d = new THREE.Vector3().subVectors(p2, p1), m = mesh(new THREE.CylinderGeometry(r, r, d.length(), 12), mat, name);
    m.position.copy(p1).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(Y, d.normalize()); return m;
  }
  function place(g, ang, r, rot = 0, clear = 1.5) {
    g.position.set(Math.cos(ang) * r, 0, Math.sin(ang) * r); g.rotation.y = -ang + rot;
    zones.push({ x: g.position.x, z: g.position.z, r: clear }); city.add(g.userData.noMerge ? g : mergeGroup(g)); return g;
  }
  
  // Cayan Tower — 306 m, 73 floors each rotated 1.2°, 90° total twist
  function cayan() {
    const g = new THREE.Group(); g.name = 'cayan_tower'; const n = 48, h = 5.7 / n, s = 0.6;
    for (let i = 0; i < n; i++) {
      const f = mesh(uvBox(new THREE.BoxGeometry(s, h * 0.86, s), s, h * 0.86, s, i * 0.07), M.silverFacade, `cayan_floor_${i}`);
      const slab = mesh(new THREE.BoxGeometry(s + 0.05, h * 0.14, s + 0.05), M.steel, `cayan_slab_${i}`, false);
      f.position.y = i * h + h * 0.43; slab.position.y = i * h + h * 0.93; f.rotation.y = slab.rotation.y = (i / n) * Math.PI / 2;
      g.add(f, slab);
    }
    g.add(mesh(new THREE.BoxGeometry(1.4, 0.25, 1.4), M.city, 'cayan_podium'));
    return g;
  }
  // Burj Al Arab — 321 m: V-plan room wings off a land-side mast, scalloped white fabric sail between them facing the sea,
  // white steel arches along the sail edges, cross-braced wing faces, cantilevered Al Muntaha + helipad, stone island
  const baaGlass = (() => { const W = 256, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    for (let f = 0; f < 4; f++) { const y0 = f * 64; const g = x.createLinearGradient(0, y0, 0, y0 + 64); g.addColorStop(0, '#2c6fb8'); g.addColorStop(1, '#174a86'); x.fillStyle = g; x.fillRect(0, y0, W, 64);
      x.fillStyle = '#eef2f6'; x.fillRect(0, y0 + 54, W, 10); }
    x.fillStyle = 'rgba(238,242,246,.9)'; for (let q = 0; q < W; q += 32) x.fillRect(q, 0, 3, H);
    x.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 40; i++) x.fillRect(Math.random() * W, Math.random() * H, 30, 6);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2.4, 2.8); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  M.baaWing = new THREE.MeshStandardMaterial({ name: 'burj_al_arab_glazing', map: baaGlass, metalness: 0.55, roughness: 0.18, emissiveMap: baaGlass, emissive: 0x223a5a, emissiveIntensity: 0.55 });
  M.whitePaint = new THREE.MeshStandardMaterial({ name: 'white_steel', color: 0xf3f5f8, roughness: 0.35, metalness: 0.2, emissive: 0x2a2c30, emissiveIntensity: 0.35 });
  M.islandStone = new THREE.MeshStandardMaterial({ name: 'island_stone', color: 0xcdbf9f, roughness: 0.9 });
  M.sailFab = new THREE.MeshStandardMaterial({ name: 'teflon_sail_fabric', color: 0xf6f7f9, roughness: 0.55, side: THREE.DoubleSide, emissive: 0x3c3a44, emissiveIntensity: 0.4 });
  function burjAlArab() {
    const g = new THREE.Group(); g.name = 'burj_al_arab';
    const Hr = 5.0, L = 2.05, HA = 0.46, Y0 = 0.28, xf = y => Math.max(0.04, L * Math.sqrt(Math.max(0, 1 - Math.pow(y / Hr, 2.2))) * (1 - 0.08 * y / Hr));
    // room wings (side profile extruded, rotated ±HA about the mast)
    const prof = new THREE.Shape(); prof.moveTo(0, 0); for (let i = 0; i <= 30; i++) { const y = Hr * i / 30; prof.lineTo(xf(y), y); } prof.lineTo(0, Hr); prof.closePath();
    [-1, 1].forEach(sd => { const geo = new THREE.ExtrudeGeometry(prof, { depth: 0.2, bevelEnabled: false }); if (sd < 0) geo.translate(0, 0, -0.2);
      const w = mesh(geo, M.baaWing, 'room_wing_' + (sd > 0 ? 'n' : 's')); w.rotation.y = -sd * HA; w.position.y = Y0; g.add(w);
      // white floor-group bands + cross bracing on the outer face
      const face = new THREE.Group(); face.rotation.y = -sd * HA; face.position.set(0, Y0, sd * 0.205); g.add(face);
      [0.25, 0.5, 0.75].forEach(f => { const y = Hr * f, b = mesh(new THREE.BoxGeometry(xf(y), 0.05, 0.02), M.whitePaint, 'floor_band', false); b.position.set(xf(y) / 2, y, 0); face.add(b); });
      [[0.08, 0.3], [0.33, 0.55], [0.58, 0.78]].forEach(([f0, f1]) => { const a = new THREE.Vector3(0.25, Hr * f0, 0), b2 = new THREE.Vector3(xf(Hr * f1) * 0.82, Hr * f1, 0); face.add(cylBetween(a, b2, 0.018, M.whitePaint, 'cross_brace'));
        for (let k = 1; k < 5; k++) { const p = a.clone().lerp(b2, k / 5); face.add(cylBetween(p, p.clone().add(new THREE.Vector3(0.12, -0.12, 0)), 0.008, M.whitePaint, 'truss_web')); } });
      // outer white arch following the sail edge, then rising into the mast top
      const pts = []; for (let i = 0; i <= 24; i++) { const y = Hr * i / 24, x = xf(y) + 0.04; pts.push(new THREE.Vector3(x * Math.cos(HA), Y0 + y, sd * x * Math.sin(HA))); }
      pts.push(new THREE.Vector3(-0.02, Y0 + Hr + 0.35, 0));
      g.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.055, 8), M.whitePaint, 'exoskeleton_arch'));
    });
    // scalloped fabric sail spanning the V on the sea side
    { const U = 18, V = 60, sg = new THREE.PlaneGeometry(1, 1, U, V), p = sg.attributes.position;
      for (let j = 0; j <= V; j++) for (let i = 0; i <= U; i++) { const idx = j * (U + 1) + i, u = i / U * 2 - 1, v = 1 - j / V, y = v * Hr, xe = xf(y), scal = 1 + 0.07 * Math.abs(Math.sin(v * Math.PI * 9));
        p.setXYZ(idx, xe * Math.cos(HA) + (1 - u * u) * xe * 0.32 * scal, Y0 + y, u * xe * Math.sin(HA)); }
      sg.computeVertexNormals(); g.add(mesh(sg, M.sailFab, 'fabric_sail')); }
    // land-side mast + spire, dark service slot
    const mast = mesh(new THREE.BoxGeometry(0.2, Hr + 0.9, 0.34), M.whitePaint, 'mast'); mast.position.set(-0.1, Y0 + (Hr + 0.9) / 2, 0); g.add(mast);
    const slot = mesh(new THREE.BoxGeometry(0.03, Hr * 0.9, 0.12), M.city, 'mast_slot', false); slot.position.set(-0.205, Y0 + Hr * 0.47, 0); g.add(slot);
    const spire = mesh(new THREE.CylinderGeometry(0.02, 0.08, 1.2, 8), M.whitePaint, 'spire'); spire.position.set(-0.1, Y0 + Hr + 1.5, 0); g.add(spire);
    // Al Muntaha cantilever (land side) + helipad (sea side) near the top
    const mun = mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.14, 24), M.whitePaint, 'al_muntaha'); mun.scale.set(1.6, 1, 1); mun.position.set(-0.42, Y0 + Hr * 0.83, 0); g.add(mun);
    const mg = mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 24), M.blueGlass, 'al_muntaha_glass', false); mg.scale.set(1.6, 1, 1); mg.position.set(-0.42, Y0 + Hr * 0.83 + 0.02, 0); g.add(mg);
    const hy = Y0 + Hr * 0.8, hx = xf(Hr * 0.8) * Math.cos(HA) + 0.35;
    const pad = mesh(new THREE.CylinderGeometry(0.3, 0.12, 0.08, 32), M.whitePaint, 'helipad'); pad.position.set(hx, hy, 0.12); g.add(pad);
    g.add(cylBetween(new THREE.Vector3(hx - 0.3, hy - 0.35, 0.05), new THREE.Vector3(hx, hy - 0.02, 0.12), 0.03, M.whitePaint, 'helipad_strut'));
    // stone island plinth with palms + causeway
    const isl = mesh(new THREE.CylinderGeometry(1.7, 1.85, Y0, 64), M.islandStone, 'island'); isl.scale.set(1.25, 1, 0.85); isl.position.set(0.7, Y0 / 2, 0); g.add(isl);
    const cw = mesh(new THREE.BoxGeometry(2.4, 0.06, 0.18), M.islandStone, 'causeway', false); cw.position.set(-2.1, 0.12, 0); g.add(cw);
    return g;
  }
  // Jumeirah Beach Hotel — breaking wave, 104 m
  // function wave() {
  //   const g = new THREE.Group(); g.name = 'jumeirah_beach_hotel';
  //   const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(3.2, 0); sh.lineTo(3.2, 0.25); sh.quadraticCurveTo(1.0, 0.5, 0.25, 1.95); sh.quadraticCurveTo(0.08, 2.05, 0, 1.85); sh.closePath();
  //   const w = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.55, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 40 }), M.blueGlass, 'wave_body');
  //   w.position.z = -0.27; g.add(w);
  //   const crest = new THREE.QuadraticBezierCurve3(new THREE.Vector3(3.2, 0.27, 0.3), new THREE.Vector3(1.0, 0.52, 0.3), new THREE.Vector3(0.25, 1.97, 0.3));
  //   g.add(mesh(new THREE.TubeGeometry(crest, 48, 0.02, 8), M.steel, 'wave_edge'));
  //   return g;
  // }
  // Emirates Towers — twin equilateral-triangle towers (355 m office, 309 m hotel) with sloped triangular crowns and corner fins
  function triCap(r, hc) {
    const C = [0, 1, 2].map(i => { const t = i / 3 * Math.PI * 2; return new THREE.Vector3(r * Math.sin(t), 0, r * Math.cos(t)); });
    const A1 = C[0].clone().setY(hc), p = [];
    [[C[0], C[1], A1], [C[1], C[2], A1], [C[2], C[0], A1], [C[0], C[2], C[1]]].forEach(tri => tri.forEach(v => p.push(v.x, v.y, v.z)));
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(p.length / 3 * 2).fill(0), 2)); g.computeVertexNormals(); return g;
  }
  M.capDS = new THREE.MeshStandardMaterial({ name: 'emirates_crown', color: 0x9aa7b8, metalness: 0.95, roughness: 0.15, side: THREE.DoubleSide });
  function emirates() {
    const g = new THREE.Group(); g.name = 'emirates_towers';
    [[6.6, 0.62, -1.0, 0], [5.7, 0.55, 1.0, 1]].forEach(([h, r, z, k]) => {
      const bh = h * 0.8;
      const body = mesh(uvCyl(new THREE.CylinderGeometry(r, r * 1.04, bh, 3), r, bh, k * 0.3), M.silverFacade, 'emirates_shaft_' + k); body.position.set(0, bh / 2 + 0.3, z);
      const cap = mesh(triCap(r, h - bh), M.capDS, 'emirates_sloped_crown_' + k); cap.position.set(0, bh + 0.3, z);
      const fin = mesh(new THREE.BoxGeometry(0.05, h - 0.02, 0.05), M.steel, 'emirates_corner_fin_' + k); fin.position.set(0, (h - 0.02) / 2 + 0.3, z + r - 0.01);
      const nl = k ? 0.42 : 0.55, needle = mesh(new THREE.CylinderGeometry(0.003, 0.028, nl, 12), M.steel, 'emirates_needle_' + k); needle.position.set(0, h + 0.3 + nl / 2 - 0.04, z + r - 0.01);
      const collar = mesh(new THREE.CylinderGeometry(0.03, 0.045, 0.1, 12), M.steel, 'emirates_needle_base_' + k); collar.position.set(0, h + 0.3 - 0.02, z + r - 0.01); g.add(collar);
      for (let j = 1; j < 5; j++) { const band = mesh(new THREE.CylinderGeometry(r * 1.03, r * 1.03, 0.03, 3), M.steel, 'emirates_band', false); band.position.set(0, 0.3 + bh * j / 5, z); g.add(band); }
      g.add(body, cap, fin, needle);
    });
    const pod = mesh(new THREE.BoxGeometry(1.6, 0.3, 3.4), M.sand, 'emirates_boulevard_podium'); pod.position.y = 0.15; g.add(pod);
    return g;
  }
  // Museum of the Future — elliptical stainless torus clad in Arabic-calligraphy glazing, on a landscaped mound
  const callig = (() => { const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
    x.fillStyle = '#e4e8ee'; x.fillRect(0, 0, S, S); x.strokeStyle = '#0d0f12'; x.lineCap = 'round'; x.lineJoin = 'round';
    for (let i = 0; i < 150; i++) { x.lineWidth = 6 + Math.random() * 12; x.beginPath(); let px = Math.random() * S, py = Math.random() * S; x.moveTo(px, py); for (let k = 0; k < 3; k++) { const nx = px + (Math.random() - 0.5) * 140, ny = py + (Math.random() - 0.5) * 50; x.quadraticCurveTo(px + (Math.random() - 0.5) * 120, py + (Math.random() - 0.5) * 90, nx, ny); px = nx; py = ny; } x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(7, 2); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  M.museum = new THREE.MeshStandardMaterial({ name: 'museum_calligraphy', map: callig, metalness: 1, roughness: 0.12, emissiveMap: callig, emissive: 0x6a6f7a, emissiveIntensity: 0.55 });
  function museum() {
    const g = new THREE.Group(); g.name = 'museum_of_the_future';
    const mound = mesh(new THREE.SphereGeometry(1.2, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ name: 'museum_lawn', color: 0x3f7a3a, roughness: 0.95 }), 'green_mound'); mound.scale.set(1.35, 0.3, 0.9); g.add(mound);
    const t = mesh(new THREE.TorusGeometry(0.78, 0.3, 32, 72), M.museum, 'torus_shell'); t.scale.set(1.6, 0.92, 1.1); t.position.y = 1.02; g.add(t);
    return g;
  }
  // Dubai Frame — 150 m × 93 m, twin towers + sky bridge clad in pierced gold filigree, glass-floor bridge, pool podium
  const frameTex = (() => { const W = 128, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#9c6f22'); gr.addColorStop(0.5, '#e2b659'); gr.addColorStop(1, '#a8782a'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(70,45,10,.85)'; x.lineWidth = 2.2;
    for (let yy = 0; yy < H; yy += 22) for (let xx = 0; xx < W; xx += 22) { const ox = (yy / 22) % 2 ? 11 : 0, rr = 5 + Math.random() * 6; x.beginPath(); x.arc(xx + ox, yy, rr, 0, Math.PI * 2); x.stroke(); }
    x.fillStyle = 'rgba(255,230,160,.25)'; for (let i = 0; i < 120; i++) x.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    x.fillStyle = '#6a4a14'; x.fillRect(0, 0, 4, H); x.fillRect(W - 4, 0, 4, H);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  M.frameGold = new THREE.MeshStandardMaterial({ name: 'frame_gold_filigree', map: frameTex, metalness: 0.85, roughness: 0.32, emissive: 0x3a2400, emissiveIntensity: 0.35 });
  function frameDXB() {
    const g = new THREE.Group(); g.name = 'dubai_frame'; const H = 2.8, W = 1.72, t = 0.3, d = 0.3;
    const uvT = (geo, w, h) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(1, w / t), uv.getY(i) * h / (t * 4)); return geo; };
    [-1, 1].forEach(sd => { const leg = mesh(uvT(new THREE.BoxGeometry(t, H, d), t, H), M.frameGold, 'frame_tower'); leg.position.set(sd * (W - t) / 2, 0.2 + H / 2, 0); g.add(leg);
      const trim = mesh(new THREE.BoxGeometry(t + 0.02, H, 0.02), M.gold, 'frame_trim', false); trim.position.set(sd * (W - t) / 2, 0.2 + H / 2, d / 2 + 0.005); g.add(trim); });
    const br = mesh(uvT(new THREE.BoxGeometry(W, t, d), W, t), M.frameGold, 'frame_sky_bridge'); br.position.y = 0.2 + H - t / 2; g.add(br);
    const glass = mesh(new THREE.BoxGeometry(W - 2 * t, 0.03, d * 0.8), M.blueGlass, 'frame_glass_floor', false); glass.position.y = 0.2 + H - t; g.add(glass);
    const base = mesh(new THREE.BoxGeometry(W + 0.5, 0.2, 0.9), M.sand, 'frame_podium'); base.position.y = 0.1; g.add(base);
    const pool = mesh(new THREE.BoxGeometry(W * 0.7, 0.01, 0.3), M.blueGlass, 'frame_pool', false); pool.position.set(0, 0.205, 0.32); g.add(pool);
    const park = mesh(new THREE.CylinderGeometry(2.2, 2.2, 0.02, 48), M.grass, 'zabeel_park', false); park.position.y = 0.01; g.add(park);
    return g;
  }
  // Ain Dubai — 250 m observation wheel
  function ainDubai() {
    const g = new THREE.Group(); g.name = 'ain_dubai'; const R = 2.2, hub = 2.55;
    const wheel = new THREE.Group(); wheel.name = 'wheel'; wheel.position.y = hub;
    wheel.add(mesh(new THREE.TorusGeometry(R, 0.035, 8, 160), M.steel, 'rim_outer'), mesh(new THREE.TorusGeometry(R - 0.12, 0.02, 8, 160), M.steel, 'rim_inner'));
    for (let i = 0; i < 32; i++) {
      const a = i / 32 * Math.PI * 2, p = new THREE.Vector3(Math.cos(a) * (R - 0.1), Math.sin(a) * (R - 0.1), 0);
      wheel.add(cylBetween(new THREE.Vector3(0, 0, i % 2 ? 0.12 : -0.12), p, 0.006, M.steel, `spoke_${i}`));
      if (i % 2 === 0) { const cab = mesh(new THREE.CapsuleGeometry(0.06, 0.12, 4, 12), M.glowB, `cabin_${i}`, false); cab.position.set(Math.cos(a) * (R + 0.06), Math.sin(a) * (R + 0.06), 0); cab.rotation.z = a; wheel.add(cab); }
    }
    wheel.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.35, 24), M.steel, 'hub'));
    wheel.children.at(-1).rotation.x = Math.PI / 2;
    const wm = mergeGroup(wheel); g.add(wm); spinners.push(wm); g.userData.noMerge = true;
    const legs = new THREE.Group(); legs.name = 'ain_dubai_legs';
    [[-1.1, 0.5], [1.1, 0.5], [-0.2, -1.2]].forEach(([x, z], k) => legs.add(cylBetween(new THREE.Vector3(x, 0, z), new THREE.Vector3(0, hub, 0), 0.07, M.steel, `leg_${k}`)));
    g.add(mergeGroup(legs));
    return g;
  }
  // detailed generic tower
  function genTower(h, kind, name) {
    const g = new THREE.Group(); g.name = name; const u0 = rnd() * 4;
    const w = 0.42 + rnd() * 0.35, d = 0.42 + rnd() * 0.35;
    g.add(mesh(new THREE.BoxGeometry(w * 1.9, 0.18, d * 1.9), M.city, 'podium', false)); g.children[0].position.y = 0.09;
    const mat = rnd() > 0.5 ? M.cityFacade : M.silverFacade;
    if (kind === 4) {
      const b = mesh(uvBox(new THREE.BoxGeometry(w, h, w), w, h, w, u0), mat, 'shaft'); b.position.y = h / 2 + 0.18; g.add(b);
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sz], k) => { const f = mesh(new THREE.BoxGeometry(0.03, h, 0.03), M.steel, 'corner_' + k); f.position.set(sx * w / 2, h / 2 + 0.18, sz * w / 2); g.add(f); });
      let y = h + 0.18, ww = w;
      for (let j = 0; j < 3; j++) { const hh = 0.14 - j * 0.02; ww *= 0.78; const c = mesh(new THREE.BoxGeometry(ww, hh, ww), M.steel, 'crown_' + j); c.position.y = y + hh / 2; g.add(c); y += hh; }
      const sp = mesh(new THREE.CylinderGeometry(0.004, ww * 0.35, h * 0.3, 8), M.steel, 'spire'); sp.position.y = y + h * 0.15; g.add(sp);
      return g;
    }
    if (kind === 0) {
      const b = mesh(uvBox(new THREE.BoxGeometry(w, h, d), w, h, d, u0), mat, 'shaft'); b.position.y = h / 2 + 0.18; g.add(b);
      const c = mesh(new THREE.BoxGeometry(w * 0.72, 0.22, d * 0.72), M.steel, 'crown'); c.position.y = h + 0.29; g.add(c);
      const ant = mesh(new THREE.CylinderGeometry(0.004, 0.012, 0.5, 6), M.steel, 'antenna'); ant.position.y = h + 0.65; g.add(ant);
    } else if (kind === 1) {
      const r = w * 0.55, b = mesh(uvCyl(new THREE.CylinderGeometry(r, r, h, 40), r, h, u0), mat, 'shaft'); b.position.y = h / 2 + 0.18; g.add(b);
      for (let j = 1; j < 4; j++) { const ring = mesh(new THREE.CylinderGeometry(r + 0.02, r + 0.02, 0.03, 40), M.steel, 'band', false); ring.position.y = 0.18 + h * j / 4; g.add(ring); }
      if (!genTower.gold && h > 3) { genTower.gold = true; const dome = mesh(new THREE.SphereGeometry(r * 0.9, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), M.gold, 'dome'); dome.position.y = h + 0.18; g.add(dome); } else { const cap = mesh(new THREE.CylinderGeometry(r * 0.8, r, 0.14, 40), M.steel, 'crown'); cap.position.y = h + 0.25; g.add(cap); const ant = mesh(new THREE.CylinderGeometry(0.004, 0.012, 0.4, 6), M.steel, 'antenna'); ant.position.y = h + 0.5; g.add(ant); }
    } else if (kind === 2) {
      const r = w * 0.6, b = mesh(uvCyl(new THREE.CylinderGeometry(r * 0.7, r, h, 8), r, h, u0), mat, 'shaft'); b.position.y = h / 2 + 0.18; b.rotation.y = Math.PI / 8; g.add(b);
      const top = mesh(new THREE.CylinderGeometry(0.01, r * 0.7, h * 0.18, 8), M.steel, 'spire_cap'); top.position.y = h + 0.18 + h * 0.09; top.rotation.y = Math.PI / 8; g.add(top);
    } else {
      let y = 0.18, ww = w, dd = d;
      for (let j = 0; j < 3; j++) { const hh = h * [0.5, 0.3, 0.2][j]; const b = mesh(uvBox(new THREE.BoxGeometry(ww, hh, dd), ww, hh, dd, u0), mat, `stage_${j}`); b.position.y = y + hh / 2; g.add(b); y += hh; ww *= 0.78; dd *= 0.78; }
      const cap = mesh(new THREE.BoxGeometry(ww * 1.1, 0.05, dd * 1.1), M.steel, 'parapet', false); cap.position.y = y + 0.025; g.add(cap);
    }
    return g;
  }
  
  // residential mid-rise with balconies, parapet and roof plant
  function genResidential(floors, name) {
    const g = new THREE.Group(); g.name = name; const fh = T / 8, u0 = (rnd() * 6 | 0) / 6 * (T / 6 * 0 + 1);
    const w = (4 + (rnd() * 5 | 0)) * T / 6 * 2, d = 0.3 + rnd() * 0.25;
    const pod = mesh(new THREE.BoxGeometry(w + 0.2, fh * 3, d + 0.2), M.balcony, 'podium', false); pod.position.y = fh * 1.5; g.add(pod);
    const base = fh * 3; let y = base;
    const tiersR = floors > 14 && rnd() > 0.4 ? [[Math.floor(floors * 0.75), w, d], [floors - Math.floor(floors * 0.75), w * 0.7, d]] : [[floors, w, d]];
    tiersR.forEach(([n, bw, bd], j) => {
      const h = n * fh, b = mesh(uvBox(new THREE.BoxGeometry(bw, h, bd), bw, h, bd, u0), M.resFacade, 'block_' + j); b.position.y = y + h / 2; g.add(b);
      for (let f = 1; f <= n; f++) [1, -1].forEach(sd => {
        const slab = mesh(new THREE.BoxGeometry(bw * 0.94, 0.007, 0.05), M.balcony, 'balcony', false); slab.position.set(0, y + f * fh - fh * 0.2, sd * (bd / 2 + 0.025)); g.add(slab);
        const rail = mesh(new THREE.BoxGeometry(bw * 0.94, fh * 0.28, 0.003), M.railing, 'railing', false); rail.position.set(0, y + f * fh - fh * 0.2 + fh * 0.14, sd * (bd / 2 + 0.049)); g.add(rail);
      });
      y += h;
      const par = mesh(new THREE.BoxGeometry(bw + 0.01, 0.025, bd + 0.01), M.balcony, 'parapet_' + j, false); par.position.y = y + 0.012; g.add(par);
    });
    for (let k = 0; k < 3; k++) { const ac = mesh(new THREE.BoxGeometry(0.05, 0.03, 0.04), M.steel, 'ac_unit', false); ac.position.set((rnd() - 0.5) * w * 0.5, y + 0.015, (rnd() - 0.5) * d * 0.5); g.add(ac); }
    const tank = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.05, 12), M.balcony, 'water_tank', false); tank.position.set(w * 0.3, y + 0.025, 0); g.add(tank);
    return g;
  }
  
  // landmark placement (angles sit between camera keyframes so they frame, not block, the Burj)
  place(emirates(), 0.8, 18, 0, 2.2);
  const ctaCam = (() => { const a = 0.76, R = 24; return { x: Math.cos(a) * R, z: Math.sin(a) * R, dx: -Math.cos(a), dz: -Math.sin(a) }; })();
  const placeInShot = (g, dist, deg, scale, clear) => { const th = THREE.MathUtils.degToRad(deg), dx = ctaCam.dx * Math.cos(th) - ctaCam.dz * Math.sin(th), dz = ctaCam.dx * Math.sin(th) + ctaCam.dz * Math.cos(th);
    const x = ctaCam.x + dx * dist, z = ctaCam.z + dz * dist, ang = Math.atan2(z, x), rr = Math.hypot(x, z), face = Math.atan2(-dx, -dz);
    g.scale.setScalar(scale); return place(g, ang, rr, face + ang, clear); };
  placeInShot(museum(), 34, 12, 1.3, 2.4);
  placeInShot(frameDXB(), 37, -14, 1.35, 2.2);
  const marinaA = 3.15;
  place(cayan(), marinaA, 15, 0, 1.2);
  place(ainDubai(), marinaA + 0.32, 18, Math.PI / 2, 2.5);
  const coastAt = (along, seaward) => { const A = 3.9, C = [Math.cos(A) * 17, Math.sin(A) * 17], T = [-Math.sin(A), Math.cos(A)], D = [Math.cos(A), Math.sin(A)];
    const x = C[0] + T[0] * along + D[0] * seaward, z = C[1] + T[1] * along + D[1] * seaward, ang = Math.atan2(z, x); return [ang, Math.hypot(x, z)]; };
  { const [a1, r1] = coastAt(-17.5, 1.4); place(burjAlArab(), a1, r1, a1 - 3.9, 2.6); }
  
  
  const SEA_A = 3.9, SD = [Math.cos(SEA_A), Math.sin(SEA_A)], COAST = 17, offshore = (x, z) => x * SD[0] + z * SD[1] > COAST - 0.8;
  // ---------- Downtown Dubai district (traced from aerial: Burj Lake, Burj Park, Dubai Mall, Old Town, Address Downtown, Opera) ----------
  // 1 px of the reference aerial ≈ 1 m; Burj base at px (455,290); 54 m per unit
  const PX = (px, py) => [(px - 455) / 54, (py - 290) / 54];
  Object.assign(M, {
    sand: new THREE.MeshStandardMaterial({ name: 'sandstone', color: 0xcdb893, roughness: 0.82 }),
    sandDark: new THREE.MeshStandardMaterial({ name: 'sandstone_dark', color: 0x9a8566, roughness: 0.85 }),
    terracotta: new THREE.MeshStandardMaterial({ name: 'terracotta_roof', color: 0x8e5a3c, roughness: 0.8 }),
    tealGlass: new THREE.MeshStandardMaterial({ name: 'teal_glass', color: 0x2a6a6e, metalness: 0.85, roughness: 0.1, emissive: 0x051a1c, emissiveIntensity: 0.8 }),
    lake: new THREE.MeshStandardMaterial({ name: 'burj_lake', color: 0x0f6272, metalness: 0.55, roughness: 0.06, emissive: 0x05303a, emissiveIntensity: 0.9 }),
    paving: new THREE.MeshStandardMaterial({ name: 'paving', color: 0x24222a, metalness: 0.2, roughness: 0.75 }),
    lawn: (() => { const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
      x.fillStyle = '#2f4a26'; x.fillRect(0, 0, S, S);
      for (let k = 0; k < S; k += 32) { x.fillStyle = (k / 32) % 2 ? 'rgba(90,120,60,.18)' : 'rgba(20,35,15,.18)'; x.fillRect(0, k, S, 32); }
      for (let i = 0; i < 5000; i++) { const g = 50 + Math.random() * 60 | 0; x.fillStyle = `rgba(${g * 0.55 | 0},${g},${g * 0.4 | 0},.35)`; x.fillRect(Math.random() * S, Math.random() * S, 1.5, 1.5); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3); t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ name: 'lawn', map: t, roughness: 1, color: 0xb8c8a8 }); })(),
    parkPaving: (() => { const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
      x.fillStyle = '#8f8676'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 3000; i++) { const v = 110 + Math.random() * 50 | 0; x.fillStyle = `rgba(${v},${v - 8},${v - 20},.25)`; x.fillRect(Math.random() * S, Math.random() * S, 2, 2); }
      x.strokeStyle = 'rgba(60,55,48,.35)'; for (let k = 0; k <= S; k += 16) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, S); x.moveTo(0, k); x.lineTo(S, k); x.stroke(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.colorSpace = THREE.SRGBColorSpace;
      return new THREE.MeshStandardMaterial({ name: 'park_paving', map: t, roughness: 0.9 }); })(),
    canopy: new THREE.MeshStandardMaterial({ name: 'tree_canopy', color: 0x2c4524, roughness: 0.95, flatShading: true }),
    hedge: new THREE.MeshStandardMaterial({ name: 'hedge', color: 0x24391d, roughness: 1 }),
    asphalt: new THREE.MeshStandardMaterial({ name: 'asphalt', color: 0x101014, roughness: 0.9 }),
    street: new THREE.MeshStandardMaterial({ name: 'street_light', color: 0xffd9a8, emissive: 0xffc68a, emissiveIntensity: 1.2 }),
    trunk: new THREE.MeshStandardMaterial({ name: 'palm_trunk', color: 0x6b5840, roughness: 0.9 }),
    leaf: new THREE.MeshStandardMaterial({ name: 'palm_leaf', color: 0x2f6a34, roughness: 0.8, side: THREE.DoubleSide }),
  });
  M.dtRes = M.resFacade.clone(); M.dtRes.name = 'downtown_residential'; M.dtRes.color.set(0xeadbbf); M.dtRes.emissiveIntensity = 0.22;
  M.oldTown = M.resFacade.clone(); M.oldTown.name = 'old_town_facade'; M.oldTown.color.set(0xe6c998); M.oldTown.emissiveIntensity = 0.45;
  const fountains = [];
  const inPoly = (x, z, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
  const toShape = (pts, holes = []) => { const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))); holes.forEach(h => sh.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))))); return sh; };
  const flat = (shape, mat, y, depth, name) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 24 }); g.rotateX(-Math.PI / 2); const m = mesh(g, mat, name, false); m.position.y = y; return m; };
  const smooth = (pts, n = 6) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'centripetal').getSpacedPoints(pts.length * n).slice(0, -1).map(v => [v.x, v.z]);
  
  const LAKE = smooth([[325,338],[395,330],[440,352],[485,348],[545,322],[625,318],[685,340],[708,385],[722,410],[778,418],[788,455],[760,478],[715,470],[690,458],[640,468],[605,500],[585,522],[545,515],[520,500],[505,522],[530,572],[556,625],[572,690],[578,745],[556,762],[522,728],[495,668],[460,652],[410,642],[365,622],[330,585],[303,530],[296,478],[312,452],[338,436],[348,404],[330,370]].map(p => PX(...p)));
  const PARK = smooth([[350,452],[440,446],[468,472],[476,560],[462,608],[420,622],[378,604],[348,560],[334,500]].map(p => PX(...p)));
  const RC = PX(510, 450), RR = 6.9; // Mohammed Bin Rashid Boulevard loop
  const OPERA = PX(287, 400), MALL = [PX(585, 60), PX(1030, 430)];
  const inLake = (x, z, m = 0) => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dz]) => inPoly(x + dx, z + dz, LAKE) && !inPoly(x + dx, z + dz, PARK));
  const busy = (x, z, m) => inLake(x, z, m) || inPoly(x, z, PARK) || Math.hypot(x, z) < 2.4 || Math.hypot(x - OPERA[0], z - OPERA[1]) < 1.3 + m ||
    (x > MALL[0][0] - m && x < MALL[1][0] + m && z > MALL[0][1] - m && z < MALL[1][1] + m) || zones.some(q => Math.hypot(x - q.x, z - q.z) < q.r + m);
  
  const dt = new THREE.Group(); dt.name = 'downtown_dubai';
  // ground plates: paving disc, Burj Park lawn, Burj Khalifa park rings, lake with stone coping
  dt.add(flat(new THREE.Shape().absarc(RC[0], -RC[1], RR + 0.2, 0, Math.PI * 2), M.paving, 0.004, 0.004, 'downtown_paving'));
  dt.add(flat(toShape(PARK), M.parkPaving, 0.008, 0.02, 'burj_park_plaza'));
  { const pc = PX(405, 530), inner = PARK.map(([x, z]) => [pc[0] + (x - pc[0]) * 0.8, pc[1] + (z - pc[1]) * 0.8]);
    dt.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(inner.map(([x, z]) => new THREE.Vector3(x, 0.032, z)), true), 80, 0.05, 4, true), M.asphalt, 'burj_park_loop_road', false));
    const garden = smooth([[345, 470], [372, 462], [380, 540], [376, 600], [352, 575], [338, 520]].map(p => PX(...p)), 4);
    dt.add(flat(toShape(garden), M.lawn, 0.012, 0.03, 'opera_green_roof'));
    const tentMat = new THREE.MeshStandardMaterial({ name: 'event_tent', color: 0xd9d6cf, roughness: 0.75 });
    const tent = (cx, cy, w, d, rot, h = 0.09) => { const c = PX(cx, cy), g = new THREE.Group(); g.name = 'burj_park_tent';
      const base = mesh(new THREE.BoxGeometry(w, h, d), tentMat, 'tent_wall', false); base.position.y = h / 2 + 0.03; g.add(base);
      const n = Math.max(1, Math.round(w / 0.3)); for (let i = 0; i < n; i++) { const rf = mesh(new THREE.CylinderGeometry(0.001, w / n * 0.62, d, 4, 1), tentMat, 'tent_ridge', false); rf.rotation.set(Math.PI / 2, 0, Math.PI / 4); rf.scale.set(1, 1, 0.35); rf.position.set(-w / 2 + (i + 0.5) * w / n, h + 0.03, 0); g.add(rf); }
      g.position.set(c[0], 0, c[1]); g.rotation.y = rot; dt.add(g); };
    tent(420, 470, 0.9, 0.35, -0.95, 0.1); tent(378, 520, 0.5, 0.42, -0.95); tent(398, 572, 0.42, 0.34, -0.95); tent(440, 520, 0.36, 0.3, -0.95, 0.07);
    const dand = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 40), tentMat, 'dandelion_sculpture', false); const dp = PX(430, 460); dand.position.set(dp[0], 0.06, dp[1]); dt.add(dand);
    const tree = (x, z, sc) => { const t = mesh(new THREE.IcosahedronGeometry(0.07 * sc, 0), M.canopy, 'tree', false); t.position.set(x, 0.07 + 0.07 * sc, z); t.scale.y = 0.8; t.rotation.y = rnd() * 6; dt.add(t); const tr = mesh(new THREE.CylinderGeometry(0.006, 0.008, 0.07, 4), M.trunk, 'tree_trunk', false); tr.position.set(x, 0.065, z); dt.add(tr); };
    inner.forEach(([x, z], i) => { if (i % 2 === 0) tree(x, z, 0.8 + rnd() * 0.5); });
    for (let i = 0; i < 40; i++) { const px = pc[0] + (rnd() - 0.5) * 2.4, pz = pc[1] + (rnd() - 0.5) * 3; if (inPoly(px, pz, PARK) && !inPoly(px, pz, garden)) tree(px, pz, 0.6 + rnd() * 0.5); }
    for (let k = 0; k < 6; k++) { const a = PX(350 + k * 4, 480 + k * 20), hb = mesh(new THREE.BoxGeometry(0.04, 0.03, 0.26), M.hedge, 'hedge_row', false); hb.position.set(a[0], 0.055, a[1]); hb.rotation.y = 0.15; dt.add(hb); }
    [[PX(455, 560), 0.22], [PX(372, 612), 0.16]].forEach(([c, rr], k) => dt.add(flat(new THREE.Shape().absarc(c[0], -c[1], rr, 0, Math.PI * 2), M.lawn, 0.012, 0.03, 'lawn_bed_' + k))); }
  [[PX(345, 170), 0.95], [PX(390, 285), 0.8], [PX(520, 245), 0.55]].forEach(([c, rr], k) => {
    dt.add(flat(new THREE.Shape().absarc(c[0], -c[1], rr, 0, Math.PI * 2), M.lawn, 0.008, 0.02, 'burj_garden_' + k));
    const ring = mesh(new THREE.TorusGeometry(rr * 0.62, 0.02, 6, 64), M.sand, 'garden_path_' + k, false); ring.rotation.x = Math.PI / 2; ring.position.set(c[0], 0.03, c[1]); dt.add(ring);
  });
  const lakeMesh = flat(toShape(LAKE, [PARK]), M.lake, 0.012, 0.01, 'burj_lake_water');
  [LAKE, PARK].forEach((poly, k) => dt.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(poly.map(([x, z]) => new THREE.Vector3(x, 0.03, z)), true), poly.length * 2, 0.03, 4, true), M.sand, 'lake_coping_' + k, false)));
  // boardwalk across the lake to Souk Al Bahar
  { const a = PX(470, 455), b = PX(525, 505), L = Math.hypot(b[0] - a[0], b[1] - a[1]); const bw = mesh(new THREE.BoxGeometry(L, 0.03, 0.12), M.sand, 'boardwalk', false); bw.position.set((a[0] + b[0]) / 2, 0.05, (a[1] + b[1]) / 2); bw.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); dt.add(bw); }
  // boulevard loop + street light line
  { const rg = new THREE.RingGeometry(RR - 0.18, RR + 0.18, 160); rg.rotateX(-Math.PI / 2); const road = mesh(rg, M.asphalt, 'mbr_boulevard', false); road.position.set(RC[0], 0.014, RC[1]); dt.add(road);
    [RR - 0.2, RR + 0.2].forEach((rr, k) => { const l = mesh(new THREE.TorusGeometry(rr, 0.008, 4, 200), M.street, 'boulevard_lights_' + k, false); l.rotation.x = Math.PI / 2; l.position.set(RC[0], 0.03, RC[1]); dt.add(l); }); }
  
  // palm tree
  function palm(x, z, h) {
    const g = new THREE.Group(); g.name = 'palm';
    const t = mesh(new THREE.CylinderGeometry(0.008, 0.014, h, 5), M.trunk, 'trunk', false); t.position.y = h / 2; g.add(t);
    for (let k = 0; k < 3; k++) { const lf = mesh(new THREE.PlaneGeometry(0.16, 0.035), M.leaf, 'frond', false); const a = k / 3 * Math.PI * 2 + rnd(); lf.position.set(Math.cos(a) * 0.07, h - 0.01, Math.sin(a) * 0.07); lf.rotation.set(-Math.PI / 2, 0, -a); lf.rotateY(0.45); g.add(lf); }
    g.position.set(x, 0, z); return g;
  }
  for (let a = 0; a < Math.PI * 2; a += 0.11) [RR - 0.32].forEach(rr => { const x = RC[0] + Math.cos(a) * rr, z = RC[1] + Math.sin(a) * rr; if (!(x > MALL[0][0] && x < MALL[1][0] && z < MALL[1][1] && z > MALL[0][1])) dt.add(palm(x, z, 0.22 + rnd() * 0.1)); });
  LAKE.forEach(([x, z], i) => { if (i % 6) return; const cx = x + (x - 3.5) * 0.04, cz = z + (z - 5) * 0.04; if (!inLake(cx, cz, 0.08) && Math.hypot(cx, cz) > 2.2) dt.add(palm(cx, cz, 0.2 + rnd() * 0.08)); });
  PARK.forEach(([x, z], i) => { if (i % 4) return; dt.add(palm(x * 0.97 + PX(405, 530)[0] * 0.03, z * 0.97 + PX(405, 530)[1] * 0.03, 0.2)); });
  
  // Dubai Mall — stepped roof decks with concrete panel texture, parapets, ridged glass skylight concourses, rooftop plant and ringed rotunda roofs
  { const mall = new THREE.Group(); mall.name = 'dubai_mall';
    const roofTex = (() => { const S = 256, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
      x.fillStyle = '#b8b0a2'; x.fillRect(0, 0, S, S);
      for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(${120 + Math.random() * 40 | 0},${115 + Math.random() * 35 | 0},${105 + Math.random() * 30 | 0},.18)`; x.fillRect(Math.random() * S, Math.random() * S, 20 + Math.random() * 70, 20 + Math.random() * 70); }
      x.strokeStyle = 'rgba(80,74,66,.35)'; x.lineWidth = 1; for (let k = 0; k <= S; k += 32) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k, S); x.moveTo(0, k); x.lineTo(S, k); x.stroke(); }
      const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
    M.mallRoof = new THREE.MeshStandardMaterial({ name: 'mall_roof_concrete', map: roofTex, roughness: 0.9, color: 0xd8d0c0 });
    M.mallWall = new THREE.MeshStandardMaterial({ name: 'mall_facade_stone', color: 0xc9b894, roughness: 0.8, emissive: 0x2a2010, emissiveIntensity: 0.3 });
    M.skyGlass = new THREE.MeshStandardMaterial({ name: 'skylight_glass', color: 0x8fa6b6, metalness: 0.7, roughness: 0.18, emissive: 0x1d2b36, emissiveIntensity: 0.6 });
    M.plant = new THREE.MeshStandardMaterial({ name: 'rooftop_plant', color: 0x8c8f95, metalness: 0.5, roughness: 0.55 });
    const roofBox = (w, h, d, x, z, y0 = 0, name = 'mall_block') => {
      const wall = mesh(new THREE.BoxGeometry(w, h, d), M.mallWall, name); wall.position.set(x, y0 + h / 2, z); mall.add(wall);
      const top = mesh(uvBox(new THREE.BoxGeometry(w - 0.04, 0.012, d - 0.04), w, 0.012, d, 0), M.mallRoof, name + '_roof', false); top.position.set(x, y0 + h + 0.006, z); mall.add(top);
      [[w, 0.035, 0.03, 0, d / 2], [w, 0.035, 0.03, 0, -d / 2], [0.03, 0.035, d, w / 2, 0], [0.03, 0.035, d, -w / 2, 0]].forEach(([pw, ph, pd, ox, oz]) => { const p = mesh(new THREE.BoxGeometry(pw, ph, pd), M.mallWall, 'parapet', false); p.position.set(x + ox, y0 + h + ph / 2, z + oz); mall.add(p); });
      return y0 + h;
    };
    const ridge = (x, z, len, alongX, y) => { [-1, 1].forEach(sd => { const g = mesh(new THREE.BoxGeometry(alongX ? len : 0.075, 0.006, alongX ? 0.075 : len), M.skyGlass, 'skylight_ridge', false); g.position.set(x + (alongX ? 0 : sd * 0.03), y + 0.028, z + (alongX ? sd * 0.03 : 0)); if (alongX) g.rotation.x = sd * 0.55; else g.rotation.z = -sd * 0.55; mall.add(g); });
      const cap = mesh(new THREE.BoxGeometry(alongX ? len : 0.012, 0.012, alongX ? 0.012 : len), M.steel, 'ridge_cap', false); cap.position.set(x, y + 0.05, z); mall.add(cap); };
    const plant = (x0, z0, w, d, y, n) => { for (let i = 0; i < n; i++) { const bw = 0.05 + rnd() * 0.1, bd = 0.04 + rnd() * 0.08, bh = 0.025 + rnd() * 0.04; const p = mesh(new THREE.BoxGeometry(bw, bh, bd), M.plant, 'hvac', false); p.position.set(x0 + (rnd() - 0.5) * w, y + bh / 2 + 0.012, z0 + (rnd() - 0.5) * d); mall.add(p); if (rnd() > 0.85) { const fan = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.012, 10), M.city, 'fan', false); fan.position.set(p.position.x, y + bh + 0.018, p.position.z); mall.add(fan); } } };
    const B = (p0, p1) => { const a = PX(...p0), b = PX(...p1); return { x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, w: b[0] - a[0], d: b[1] - a[1] }; };
    // main decks (heights stepped like the real mall), skylit concourses running across each
    [[[590, 90], [760, 215], 0.46, true], [[770, 60], [1030, 300], 0.62, false], [[780, 300], [1030, 430], 0.52, true], [[705, 215], [770, 345], 0.4, false], [[575, 290], [640, 330], 0.28, true]].forEach(([p0, p1, h, alongX], k) => {
      const q = B(p0, p1), top = roofBox(q.w, h, q.d, q.x, q.z, 0, 'mall_deck_' + k);
      const span = alongX ? q.d : q.w, n = Math.max(1, Math.floor(span / 0.7));
      for (let i = 0; i < n; i++) { const o = -span / 2 + (i + 0.5) * span / n; if (alongX) ridge(q.x, q.z + o, q.w * 0.84, true, top); else ridge(q.x + o, q.z, q.d * 0.84, false, top); }
      plant(q.x, q.z, q.w * 0.7, q.d * 0.7, top, 3 + (q.w * q.d | 0));
      if (q.w * q.d > 3) { const up = B([p0[0] + (p1[0] - p0[0]) * 0.55, p0[1] + 20], [p1[0] - 20, p0[1] + (p1[1] - p0[1]) * 0.4]); roofBox(up.w, 0.12, up.d, up.x, up.z, top, 'mall_upper_' + k); plant(up.x, up.z, up.w * 0.6, up.d * 0.6, top + 0.12, 2); }
    });
    // rotundas: stone drum, ringed flat roof, low oculus
    [[PX(655, 250), 0.95, 0.68], [PX(740, 370), 0.45, 0.5], [PX(870, 150), 0.42, 0.74], [PX(610, 310), 0.3, 0.34]].forEach(([c, rr, h], k) => {
      const drum = mesh(new THREE.CylinderGeometry(rr, rr, h, 64), M.mallWall, 'rotunda_' + k); drum.position.set(c[0], h / 2, c[1]); mall.add(drum);
      const roof = mesh(new THREE.CylinderGeometry(rr - 0.02, rr - 0.02, 0.012, 64), M.mallRoof, 'rotunda_roof_' + k, false); roof.position.set(c[0], h + 0.006, c[1]); mall.add(roof);
      [0.92, 0.66, 0.4].forEach((f, j) => { const ring = mesh(new THREE.TorusGeometry(rr * f, 0.012, 4, 64), j === 2 ? M.steel : M.mallWall, 'rotunda_ring', false); ring.rotation.x = Math.PI / 2; ring.position.set(c[0], h + 0.02, c[1]); mall.add(ring); });
      const ocu = mesh(new THREE.SphereGeometry(rr * 0.34, 24, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.skyGlass, 'oculus_' + k, false); ocu.scale.y = 0.35; ocu.position.set(c[0], h + 0.012, c[1]); mall.add(ocu);
    });
    // Fashion Avenue arc: curved deck with radial skylight fins
    const ac = PX(700, 250), arc = new THREE.Shape(); arc.absarc(ac[0], -ac[1], 2.1, -1.1, 1.3, false); arc.absarc(ac[0], -ac[1], 1.7, 1.3, -1.1, true);
    mall.add(flat(arc, M.mallWall, 0, 0.56, 'fashion_avenue'));
    for (let t = -1.05; t < 1.28; t += 0.09) { const f = mesh(new THREE.BoxGeometry(0.34, 0.03, 0.035), M.skyGlass, 'fashion_skylight', false); f.position.set(ac[0] + Math.cos(t) * 1.9, 0.58, ac[1] - Math.sin(t) * 1.9); f.rotation.y = t; mall.add(f); }
    dt.add(mall); }
  
  // Dubai Opera — dhow-shaped hull with glass bow
  { const op = new THREE.Group(); op.name = 'dubai_opera'; const L = 0.95, W = 0.5;
    const hull = new THREE.Shape(); hull.moveTo(-L, 0); hull.quadraticCurveTo(0, W * 1.25, L, 0); hull.quadraticCurveTo(0, -W * 1.25, -L, 0);
    const g = new THREE.ExtrudeGeometry(hull, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.06, bevelSegments: 4, curveSegments: 40 }); g.rotateX(-Math.PI / 2);
    op.add(mesh(g, M.sand, 'opera_hull'));
    const bow = mesh(new THREE.CylinderGeometry(0.02, 0.26, 0.56, 3, 1, true), M.blueGlass, 'opera_glass_bow'); bow.rotation.z = Math.PI / 2; bow.position.set(L - 0.1, 0.3, 0); op.add(bow);
    const plaza = mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.03, 48), M.paving, 'opera_plaza', false); plaza.scale.z = 0.7; plaza.position.y = 0.015; op.add(plaza);
    op.position.set(OPERA[0], 0, OPERA[1]); op.rotation.y = 0.15; dt.add(op); }
  
  // Address Downtown — 306 m, elliptical tower with sweeping crown and spire
  function addressDowntown() {
    const g = new THREE.Group(); g.name = 'address_downtown'; const H1 = 5.0, n = 10;
    for (let i = 0; i < n; i++) { const t = i / n, rr = 0.62 - t * 0.14, h = H1 / n; const c = mesh(uvCyl(new THREE.CylinderGeometry(rr - 0.014, rr, h, 40), rr, h, i * 0.21), M.silverFacade, 'address_shaft_' + i); c.scale.z = 0.62; c.position.y = 0.3 + i * h + h / 2; g.add(c); }
    const fin = new THREE.Shape(); fin.moveTo(-0.5, 0); fin.lineTo(0.5, 0); fin.quadraticCurveTo(0.5, 0.9, -0.1, 1.25); fin.lineTo(-0.5, 0.95); fin.closePath();
    const fg = new THREE.ExtrudeGeometry(fin, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2, curveSegments: 24 }); const f = mesh(fg, M.balcony, 'address_crown'); f.position.set(0, 0.3 + H1, -0.14); g.add(f);
    const sp = mesh(new THREE.CylinderGeometry(0.004, 0.035, 1.0, 12), M.steel, 'address_spire'); sp.position.set(-0.1, 0.3 + H1 + 1.2 + 0.46, -0.08); g.add(sp);
    const pod = mesh(new THREE.BoxGeometry(1.8, 0.3, 1.2), M.sand, 'address_podium'); pod.position.y = 0.15; g.add(pod);
    return g;
  }
  { const a = addressDowntown(), p = PX(835, 525); a.position.set(p[0], 0, p[1]); a.rotation.y = -0.6; dt.add(a); zones.push({ x: p[0], z: p[1], r: 1.1 }); }
  
  // Downtown residential tower — sandstone frame, teal glass core, balcony bands, stepped crown (Burj Views / South Ridge / 29 Boulevard type)
  function dtResidential(h, name) {
    const g = new THREE.Group(); g.name = name; const w = 0.55 + rnd() * 0.35, d = 0.45 + rnd() * 0.25, fh = T / 8, u0 = rnd() * 3;
    const pod = mesh(new THREE.BoxGeometry(w * 1.6, 0.22, d * 1.6), M.sand, 'podium', false); pod.position.y = 0.11; g.add(pod);
    const stepped = rnd() > 0.45, h1 = stepped ? h * 0.82 : h;
    const body = mesh(uvBox(new THREE.BoxGeometry(w, h1, d), w, h1, d, u0), M.dtRes, 'shaft'); body.position.y = 0.22 + h1 / 2; g.add(body);
    const glassW = w * (0.35 + rnd() * 0.2), gl = mesh(new THREE.BoxGeometry(glassW, h1 * 0.97, d + 0.035), M.tealGlass, 'glass_core'); gl.position.set((rnd() - 0.5) * (w - glassW) * 0.6, 0.22 + h1 / 2, 0); g.add(gl);
    if (rnd() > 0.5) { const sgl = mesh(new THREE.BoxGeometry(w + 0.035, h1 * 0.97, d * 0.4), M.tealGlass, 'side_glass'); sgl.position.y = 0.22 + h1 / 2; g.add(sgl); }
    for (let f = 4; f * fh < h1; f += 4) { const b = mesh(new THREE.BoxGeometry(w + 0.05, 0.008, d + 0.05), M.balcony, 'balcony_band', false); b.position.y = 0.22 + f * fh; g.add(b); }
    let y = 0.22 + h1;
    if (stepped) { let ww = w * 0.8, dd = d * 0.8; for (let j = 0; j < 3; j++) { const hh = (h - h1) / 3; const s = mesh(uvBox(new THREE.BoxGeometry(ww, hh, dd), ww, hh, dd, u0), M.dtRes, 'setback_' + j); s.position.y = y + hh / 2; g.add(s); y += hh; ww *= 0.82; dd *= 0.82; } }
    const par = mesh(new THREE.BoxGeometry(w * 0.7, 0.08, d * 0.7), M.sand, 'crown', false); par.position.y = y + 0.04; g.add(par);
    const ant = mesh(new THREE.CylinderGeometry(0.004, 0.01, 0.25, 6), M.steel, 'mast'); ant.position.set(w * 0.2, y + 0.2, 0); g.add(ant);
    return g;
  }
  // Old Town / Souk Al Bahar — low Arabic-style sandstone blocks, terracotta roofs, domes, wind towers
  function oldTownBlock(name) {
    const g = new THREE.Group(); g.name = name; const w = 0.3 + rnd() * 0.35, d = 0.25 + rnd() * 0.3, h = 0.12 + rnd() * 0.22;
    const hs = mesh(uvBox(new THREE.BoxGeometry(w, h, d), w, h, d, rnd() * 3), M.oldTown, 'house'); hs.position.y = h / 2; g.add(hs);
    const par = mesh(new THREE.BoxGeometry(w + 0.02, 0.02, d + 0.02), M.sand, 'parapet', false); par.position.y = h + 0.01; g.add(par);
    const k = rnd();
    if (k < 0.3) { const rf = mesh(new THREE.ConeGeometry(Math.min(w, d) * 0.55, 0.08, 4), M.terracotta, 'roof', false); rf.position.y = h + 0.05; rf.rotation.y = Math.PI / 4; g.add(rf); }
    else if (k < 0.5) { const dm = mesh(new THREE.SphereGeometry(Math.min(w, d) * 0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.sand, 'dome', false); dm.position.y = h; g.add(dm); }
    else if (k < 0.65) { const wt = mesh(new THREE.BoxGeometry(0.06, 0.14, 0.06), M.sand, 'wind_tower', false); wt.position.set(w * 0.3, h + 0.07, 0); g.add(wt); }
    return g;
  }
  for (let x = 1.0; x < 8.6; x += 0.46) for (let z = 3.4; z < 10.4; z += 0.46) {
    const px = x + (rnd() - 0.5) * 0.18, pz = z + (rnd() - 0.5) * 0.18;
    if (Math.hypot(px - RC[0], pz - RC[1]) > RR - 0.55 || busy(px, pz, 0.28) || (px < 2.2 && pz < 5.3)) continue;
    const b = oldTownBlock('old_town_' + dt.children.length); b.position.set(px, 0, pz); b.rotation.y = (rnd() * 4 | 0) * Math.PI / 2 + 0.1; dt.add(b);
  }
  { const sk = oldTownBlock('souk_al_bahar'); const p = PX(560, 530); sk.position.set(p[0], 0, p[1]); sk.scale.set(2.4, 1.3, 2); dt.add(sk); }
  // residential + office towers ringing the boulevard
  const dtPlaced = [];
  const inCorridor = (x, z) => { const az = Math.atan2(z, x), d = Math.hypot(x, z); return d > 3 && az > -0.25 && az < 3.4; };
  const tryTower = (x, z, h, clear) => { if (inCorridor(x, z)) h = Math.min(h, 1.0); if (busy(x, z, clear) || dtPlaced.some(q => Math.hypot(x - q[0], z - q[1]) < clear * 2)) return false; const b = rnd() > 0.28 ? dtResidential(h, 'downtown_res_' + dtPlaced.length) : genTower(h, [0, 4, 2][(rnd() * 3) | 0], 'downtown_office_' + dtPlaced.length); b.position.set(x, 0, z); b.rotation.y = -Math.atan2(z - RC[1], x - RC[0]) + (rnd() - 0.5) * 0.3; dt.add(b); dtPlaced.push([x, z]); return true; };
  for (let a = 0; a < Math.PI * 2; a += 0.11) {
    const inside = a > 2.1 && a < 4.5;
    if (inside) { const rr = RR - 1.0 - rnd() * 0.9; tryTower(RC[0] + Math.cos(a) * rr, RC[1] + Math.sin(a) * rr, 1.8 + rnd() * 2.0, 0.5); }
    // keep the east/south-east arc low so hero & statement cameras see the Burj over the lake
    const ea = Math.atan2(Math.sin(a), Math.cos(a)), east = ea > -0.9 && ea < 2.05, hk = east ? 0.4 : 1;
    const ro = RR + 0.95 + rnd() * 0.5; tryTower(RC[0] + Math.cos(a) * ro, RC[1] + Math.sin(a) * ro, (1.8 + Math.pow(rnd(), 1.5) * 2.6) * hk, 0.5);
    if (!east && rnd() > 0.35) { const ro2 = RR + 2.4 + rnd() * 0.8; tryTower(RC[0] + Math.cos(a + 0.05) * ro2, RC[1] + Math.sin(a + 0.05) * ro2, 2.4 + Math.pow(rnd(), 1.3) * 3.2, 0.55); }
  }
  // light infill in the open band just outside the Boulevard loop
  { let n = 0; for (let i = 0; i < 260 && n < 36; i++) { const ang = rnd() * Math.PI * 2, rr = RR + 0.7 + rnd() * 3.4; if (tryTower(RC[0] + Math.cos(ang) * rr, RC[1] + Math.sin(ang) * rr, 1.3 + Math.pow(rnd(), 1.4) * 2.6, 0.45)) n++; } }
  // Burj Vista / Boulevard Point pair just north-east of the Burj
  [[PX(505, 95), 3.9], [PX(560, 70), 4.4]].forEach(([p, h], k) => { const b = dtResidential(h, 'burj_vista_' + k); b.position.set(p[0], 0, p[1]); dt.add(b); });
  const dtM = mergeGroup(dt); dtM.traverse(o => { if (o.isMesh) o.castShadow = false; }); city.add(dtM);
  lakeMesh.receiveShadow = true; city.add(lakeMesh);
  // The Dubai Fountain — animated jets along the lake's central arc and ring nodes
  { const fg = new THREE.CylinderGeometry(0.01, 0.022, 1, 6, 1, true); fg.translate(0, 0.5, 0);
    const jmat = new THREE.MeshBasicMaterial({ name: 'fountain_water', color: 0xeef7ff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false }), jm = () => jmat;
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...[PX(458, 450)].map(p => [p[0], 0.02, p[1]])[0]), new THREE.Vector3(...[PX(560, 390)].map(p => [p[0], 0.02, p[1]])[0]), new THREE.Vector3(...[PX(690, 392)].map(p => [p[0], 0.02, p[1]])[0]));
    const add = (v, ph, hmax) => { const j = new THREE.Mesh(fg, jm()); j.position.copy(v); j.userData = { ph, hmax }; j.name = 'fountain_jet'; city.add(j); fountains.push(j); };
    curve.getSpacedPoints(34).forEach((v, i) => add(v, i * 0.28, 1.4 + (i % 3 === 0 ? 0.8 : 0)));
    [[PX(605, 385), 0.3], [PX(645, 378), 0.3], [PX(683, 392), 0.26], [PX(505, 440), 0.28]].forEach(([c, rr], k) => { for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; add(new THREE.Vector3(c[0] + Math.cos(a) * rr, 0.02, c[1] + Math.sin(a) * rr), k * 1.3 + (i % 2) * 0.6, 0.9); } });
  }
  zones.push({ x: RC[0], z: RC[1], r: RR + 4.2 }, { x: 6.5, z: -3, r: 5 });
  const generic = new THREE.Group(); generic.name = 'city_towers';
  // Dubai Marina high-rise cluster
  for (let i = 0; i < 16; i++) {
    const a = marinaA + (rnd() - 0.5) * 0.5, r = 13 + rnd() * 6, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (offshore(x, z) || zones.some(q => Math.hypot(x - q.x, z - q.z) < q.r + 0.5)) continue;
    const g = genTower(3 + rnd() * 3.4, [0, 1, 2, 4, 4][(rnd() * 5) | 0], `marina_tower_${i}`); g.position.set(x, 0, z); g.rotation.y = rnd() * Math.PI; generic.add(g); zones.push({ x, z, r: 0.7 });
  }
  // downtown + suburbs
  for (let i = 0; i < 200; i++) {
    const r = 11 + Math.pow(rnd(), 1.25) * 11, a = rnd() * Math.PI * 2, x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (offshore(x, z) || zones.some(q => Math.hypot(x - q.x, z - q.z) < q.r + 0.25)) continue;
    const h = 0.6 + Math.pow(rnd(), 1.8) * 4.2 * (1.15 - r / 30);
    const g = h < 2.4 && rnd() > 0.35 ? genResidential(Math.max(5, Math.round(h / (T / 8))), `residential_${i}`) : genTower(h, h < 1 ? 3 : [0, 1, 2, 3, 4][(rnd() * 5) | 0], `tower_${i}`); g.position.set(x, 0, z); g.rotation.y = rnd() * Math.PI;
    g.traverse(o => { if (o.isMesh && h < 1.5) o.castShadow = false; });
    generic.add(g); zones.push({ x, z, r: 0.55 });
  }
  for (let i = 0; i < 34; i++) {
    const a = 5.25 + (rnd() - 0.5) * 0.9, rr = 8 + rnd() * 12, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
    if (offshore(x, z) || zones.some(q => Math.hypot(x - q.x, z - q.z) < q.r + 0.3)) continue;
    const g = genResidential(6 + (rnd() * 14 | 0), `community_${i}`); g.position.set(x, 0, z); g.rotation.y = -a + (rnd() > 0.5 ? 0 : Math.PI / 2);
    generic.add(g); zones.push({ x, z, r: 0.7 });
  }
  // realistic tint pass for residential blocks + light infill + city roads
  { const tints = [0xcbb795, 0xbfae92, 0xb3aca0, 0xd2c3a4, 0xbfa184].map((c, i) => { const m = M.resFacade.clone(); m.name = 'res_tint_' + i; m.color.set(c); m.emissiveIntensity = 0.3; return m; });
    const trims = [0xa89a82, 0x9b9285, 0xb3a58c].map((c, i) => { const m = M.balcony.clone(); m.name = 'trim_tint_' + i; m.color.set(c); return m; });
    generic.children.forEach(g => { const t = tints[(rnd() * tints.length) | 0], tr = trims[(rnd() * trims.length) | 0]; g.traverse(o => { if (!o.isMesh) return; if (o.material === M.resFacade) o.material = t; else if (o.material === M.balcony) o.material = tr; }); });
    // sparse infill only where there's clearly open ground
    let added = 0;
    for (let i = 0; i < 400 && added < 45; i++) { const rr = 9 + rnd() * 13, a = rnd() * Math.PI * 2, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (offshore(x, z) || zones.some(q => Math.hypot(x - q.x, z - q.z) < q.r + 1.1)) continue;
      const g = rnd() > 0.5 ? dtResidential(1.2 + rnd() * 2.2, 'infill_res') : genTower(1.4 + rnd() * 2.6, [0, 3, 4][(rnd() * 3) | 0], 'infill_tower');
      const t = tints[(rnd() * tints.length) | 0]; g.traverse(o => { if (o.isMesh && (o.material === M.dtRes || o.material === M.resFacade)) o.material = t; });
      g.position.set(x, 0, z); g.rotation.y = -a; generic.add(g); zones.push({ x, z, r: 0.55 }); added++; }
    // roads: two ring roads + radial avenues, segmented so they never cut through landmarks or the sea
    const seg = (x, z, len, ry, w) => { const m = mesh(new THREE.BoxGeometry(len, 0.008, w), M.asphalt, 'road', false); m.position.set(x, 0.007, z); m.rotation.y = ry; generic.add(m);
      const l = mesh(new THREE.BoxGeometry(len, 0.01, 0.012), M.street, 'road_centre_light', false); l.position.set(x, 0.012, z); l.rotation.y = ry; generic.add(l); };
    const free = (x, z) => !offshore(x, z) && !zones.some(q => q.r > 0.8 && Math.hypot(x - q.x, z - q.z) < q.r * 0.9) && Math.hypot(x - RC[0], z - RC[1]) > RR + 0.6;
    [12.5, 18].forEach(R => { const n = Math.round(R * 2 * Math.PI / 0.8); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = Math.cos(a) * R, z = Math.sin(a) * R; if (free(x, z)) seg(x, z, 0.82, -a + Math.PI / 2, 0.22); } });
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + 0.2; for (let rr = RR + 2.5; rr < 23; rr += 0.8) { const x = Math.cos(a) * rr, z = Math.sin(a) * rr; if (free(x, z)) seg(x, z, 0.82, -a, 0.2); } }
  }
  city.add(mergeGroup(generic));
  // Arabian Gulf coastline + Sheikh Zayed Road light streaks
  
  [[1.0, 0.03], [1.0 + Math.PI, 0.03]].forEach(([a], k) => {
    const road = mesh(new THREE.BoxGeometry(34, 0.006, 0.05), k ? M.glow : M.glowB, `sheikh_zayed_road_${k}`, false);
    road.position.set(Math.cos(a - 0.25) * 12, 0.005, Math.sin(a - 0.25) * 12); road.rotation.y = -a + 0.25 + Math.PI / 2; city.add(road);
  });
  
  // ---------- Arabian Gulf coastline + Palm Jumeirah (offshore, built in a local frame: +x seaward, z along the coast) ----------
  Object.assign(M, {
    gulf: new THREE.MeshStandardMaterial({ name: 'arabian_gulf', color: 0x0c3f5c, metalness: 0.6, roughness: 0.12, emissive: 0x031a2c, emissiveIntensity: 0.8 }),
    lagoon: new THREE.MeshStandardMaterial({ name: 'palm_lagoon', color: 0x167a86, metalness: 0.45, roughness: 0.08, emissive: 0x05353c, emissiveIntensity: 0.9 }),
    beach: new THREE.MeshStandardMaterial({ name: 'beach_sand', color: 0xcfbf98, roughness: 0.95 }),
    villa: new THREE.MeshStandardMaterial({ name: 'villa_white', color: 0xf1ede4, roughness: 0.6, emissive: 0x2a2418, emissiveIntensity: 0.12 }),
    coral: new THREE.MeshStandardMaterial({ name: 'atlantis_coral', color: 0xe2b9a0, roughness: 0.55, emissive: 0x3a1c10, emissiveIntensity: 0.5 }),
  });
  const palmG = new THREE.Group(); palmG.name = 'palm_jumeirah';
  const seaG = new THREE.Group(); seaG.name = 'gulf';
  { const g = new THREE.PlaneGeometry(260, 420); g.rotateX(-Math.PI / 2); const sea = mesh(g, M.gulf, 'arabian_gulf_water', false); sea.position.set(130 - 0.3, 0.004, 0); seaG.add(sea);
    const b = mesh(new THREE.BoxGeometry(1.0, 0.03, 420), M.beach, 'jumeirah_beach', false); b.position.set(-0.6, 0.015, 0); seaG.add(b); }
  const strip = (pts, w, mat, y, depth, name, tipped = true) => {
    const L = [], R = [];
    pts.forEach((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; const ww = w * (tipped ? Math.min(1, 0.35 + 1.3 * Math.min(i, pts.length - 1 - i) / pts.length * 2) : 1) / 2; L.push([p[0] - dz * ww, p[1] + dx * ww]); R.push([p[0] + dz * ww, p[1] - dx * ww]); });
    return flat(toShape([...L, ...R.reverse()]), mat, y, depth, name);
  };
  const qcurve = (a, c, b, n) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; });
  const box = (w, h, d, mat, x, z, ry = 0, name = 'bldg') => { const m = mesh(new THREE.BoxGeometry(w, h, d), mat, name, false); m.position.set(x, h / 2 + 0.06, z); m.rotation.y = ry; return m; };
  const PJC = [11, 0], PJR = 12.5;
  M.pool = new THREE.MeshStandardMaterial({ name: 'pool', color: 0x3fb6d0, emissive: 0x0c4a5a, emissiveIntensity: 0.8, roughness: 0.1 });
  M.villaCream = M.oldTown.clone(); M.villaCream.name = 'villa_cream'; M.villaCream.color.set(0xe8d6b4); M.villaCream.emissiveIntensity = 0.25;
  M.villaModern = new THREE.MeshStandardMaterial({ name: 'villa_modern', color: 0xe9ecef, roughness: 0.5, emissive: 0x1e2226, emissiveIntensity: 0.3 });
  function villa(x, z, ang, side) {
    const g = new THREE.Group(); g.name = 'villa'; const modern = rnd() < 0.28, w = 0.13 + rnd() * 0.04, d = 0.09 + rnd() * 0.03, h = 0.05 + rnd() * 0.025;
    const body = mesh(new THREE.BoxGeometry(w, h, d), modern ? M.villaModern : M.villaCream, 'villa_body', false); body.position.y = h / 2 + 0.05; g.add(body);
    if (modern) { const up = mesh(new THREE.BoxGeometry(w * 0.6, h * 0.7, d * 0.8), M.villaModern, 'villa_upper', false); up.position.set(w * 0.15, h + 0.05 + h * 0.35, 0); g.add(up); }
    else { const roof = mesh(new THREE.ConeGeometry(Math.hypot(w, d) * 0.55, 0.04, 4), M.terracotta, 'villa_roof', false); roof.rotation.y = Math.PI / 4; roof.scale.set(w / d > 1 ? 1 : 0.8, 1, w / d > 1 ? 0.75 : 1); roof.position.y = h + 0.07; g.add(roof); }
    if (rnd() > 0.35) { const pool = mesh(new THREE.BoxGeometry(0.06, 0.004, 0.025), M.pool, 'villa_pool', false); pool.position.set(0, 0.053, side * (d / 2 + 0.03)); g.add(pool); }
    g.position.set(x, 0, z); g.rotation.y = -ang; return g;
  }
  // lagoon + crescent breakwater
  palmG.add(flat(new THREE.Shape().absarc(PJC[0], 0, PJR - 0.3, 0, Math.PI * 2), M.lagoon, 0.006, 0.004, 'lagoon'));
  const cres = Array.from({ length: 97 }, (_, i) => { const a = THREE.MathUtils.degToRad(-146 + 292 * i / 96); return [PJC[0] + Math.cos(a) * PJR, Math.sin(a) * PJR]; });
  palmG.add(strip(cres, 0.75, M.beach, 0.01, 0.05, 'crescent'));
  cres.forEach((p, i) => { if (i % 3 || Math.abs(i - 48) < 3) return; const a = Math.atan2(p[1], p[0] - PJC[0]); const h = 0.12 + rnd() * (i % 12 === 0 ? 0.7 : 0.25); palmG.add(box(0.32, h, 0.22, rnd() > 0.3 ? M.villa : M.coral, p[0], p[1], -a, 'crescent_resort')); });
  // trunk, spine, monorail
  palmG.add(flat(toShape([[-0.4, -0.9], [2.5, -1.25], [5.5, -1.45], [7.6, -1.2], [8.3, -0.5], [8.3, 0.5], [7.6, 1.2], [5.5, 1.45], [2.5, 1.25], [-0.4, 0.9]]), M.beach, 0.01, 0.06, 'trunk'));
  palmG.add(strip([[7.5, 0], [10, 0], [12.4, 0]], 0.42, M.beach, 0.01, 0.05, 'spine'));
  palmG.add(box(12.6, 0.012, 0.05, M.street, 5.9, 0, 0, 'monorail_light'));
  for (let x = 0.2; x < 7.8; x += 0.42) [-1, 1].forEach(sd => { const edge = 0.9 + Math.min(x, 5.5) / 5.5 * 0.45 - (x > 6.5 ? (x - 6.5) * 0.4 : 0); for (let row = 0; row < 2; row++) { const h = 0.22 + Math.pow(rnd(), 2) * (row ? 0.5 : 0.9), bx = x + (rnd() - 0.5) * 0.08, bz = sd * (edge * (row ? 0.35 : 0.75)); const b = mesh(uvBox(new THREE.BoxGeometry(0.28, h, 0.24), 0.28, h, 0.24, rnd() * 3), M.dtRes, 'shoreline_apartment', false); b.position.set(bx, h / 2 + 0.06, bz); palmG.add(b); if (rnd() > 0.4) { const dm = mesh(new THREE.SphereGeometry(0.05, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), M.sand, 'apartment_dome', false); dm.position.set(bx, h + 0.06, bz); palmG.add(dm); }  } });
  // 16 fronds lined with villas
  for (let i = 0; i < 8; i++) [-1, 1].forEach(sd => {
    const xs = 11.3 - i * 0.8, th = THREE.MathUtils.degToRad(18 + i * 15), thc = th + THREE.MathUtils.degToRad(14), Ln = 7.4 - Math.abs(i - 3) * 0.18 - (i > 5 ? 0.6 : 0);
    const a = [xs, sd * 0.2], c = [xs + Math.cos(thc) * Ln * 0.5, sd * (0.2 + Math.sin(thc) * Ln * 0.5)], b = [xs + Math.cos(th) * Ln, sd * (0.2 + Math.sin(th) * Ln)];
    const pts = qcurve(a, c, b, 18);
    palmG.add(strip(pts, 0.34, M.beach, 0.01, 0.045, 'frond_' + i + (sd > 0 ? 'e' : 'w')));
    for (let k = 2; k < pts.length - 1; k++) { const p = pts[k], q = pts[k + 1], ang = Math.atan2(q[1] - p[1], q[0] - p[0]), nx = -Math.sin(ang), nz = Math.cos(ang);
      [-1, 1].forEach(side => palmG.add(villa(p[0] + nx * side * 0.085, p[1] + nz * side * 0.085, ang, side))); }
    palmG.add(strip(pts.slice(1, -1), 0.03, M.asphalt, 0.012, 0.042, 'frond_road', false));
  });
  // Palm West Beach / Marina breakwater + Bluewaters-style island
  palmG.add(strip(qcurve([0.2, -14], [3.2, -12.5], [4.2, -9.5], 12), 0.5, M.beach, 0.01, 0.04, 'breakwater', false));
  palmG.add(strip(qcurve([2.0, -17.5], [3.4, -17.8], [3.8, -16.2], 8), 1.1, M.beach, 0.01, 0.05, 'bluewaters'));
  const place2 = g => { const ry = -Math.atan2(SD[1], SD[0]); g.rotation.y = ry; g.position.set(SD[0] * COAST, 0, SD[1] * COAST); return g; };
  city.add(place2(seaG));
  const palmM = place2(mergeGroup(palmG)); palmM.traverse(o => { if (o.isMesh) o.castShadow = false; }); city.add(palmM);
  city.traverse(o => { if (o.isMesh) o.castShadow = false; }); // only the Burj casts shadows
  scene.add(city);
  
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ name: 'ground', color: 0x07070c, metalness: 0.75, roughness: 0.38 }));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const grid = new THREE.GridHelper(120, 120, 0x3b1d5e, 0x191127);
  grid.material.transparent = true; grid.material.opacity = 0.16; grid.position.y = 0.003; scene.add(grid);
  
  // orbit rings
  const rings = [];
  [[4.2, 3.2, 0.25], [5.4, 6.2, -0.18], [3.4, 9.2, 0.35]].forEach(([r, y, tilt], i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.008, 8, 256), i === 1 ? M.glowB : M.glow);
    m.position.y = y; m.rotation.x = Math.PI / 2 + tilt; m.userData = { tilt, spd: 0.12 + i * 0.05 };
    m.visible = false; scene.add(m); rings.push(m);
  });
  
  // particles
  const PC = 900, pPos = new Float32Array(PC * 3), pSpd = new Float32Array(PC);
  for (let i = 0; i < PC; i++) {
    const r = 1.2 + rnd() * 10, a = rnd() * Math.PI * 2;
    pPos[i * 3] = Math.cos(a) * r; pPos[i * 3 + 1] = rnd() * 22; pPos[i * 3 + 2] = Math.sin(a) * r; pSpd[i] = 0.004 + rnd() * 0.012;
  }
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const dot = document.createElement('canvas'); dot.width = dot.height = 64;
  { const g = dot.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.3, 'rgba(220,180,255,.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const pMat = new THREE.PointsMaterial({ size: 0.12, map: new THREE.CanvasTexture(dot), color: 0xd8b4fe, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  const points = new THREE.Points(pGeo, pMat); scene.add(points);
  
  // lights
  scene.add(new THREE.HemisphereLight(0x7c6bff, 0x050507, 0.35));
  const sun = new THREE.DirectionalLight(0xfff4ea, 1.6); sun.position.set(10, 22, 8); sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 60 }); sun.shadow.bias = -0.0004;
  scene.add(sun);
  const pl1 = new THREE.PointLight(0xa855f7, 10, 40, 1.2); pl1.position.set(-12, 9, 10); scene.add(pl1);
  const pl2 = new THREE.PointLight(0x0bb4ff, 25, 45, 1.2); pl2.position.set(12, 5, -10); scene.add(pl2);
  
  // ---------- scroll-driven camera ----------
  const KF = {
    hero:      { r: 26, a: 0.85, y: 6, ty: 6.5, ox: 3.2, cr: 8, cg: 6, cb: 16, lr: 168, lg: 85, lb: 247 },
    statement: { r: 11, a: 0.85, y: 1.6, ty: 4.6, ox: -2.4, cr: 5, cg: 9, cb: 30, lr: 80, lg: 110, lb: 255 },
    why:       { r: 20, a: 1.9, y: 14, ty: 5.5, ox: 0.5, cr: 24, cg: 5, cb: 30, lr: 217, lg: 70, lb: 239 },
    steps:     { r: 24, a: 2.8, y: 7, ty: 8, ox: 0, cr: 3, cg: 17, cb: 26, lr: 11, lg: 180, lb: 255 },
    chain:     { r: 22, a: 3.6, y: 18, ty: 4, ox: 0, cr: 3, cg: 20, cb: 16, lr: 34, lg: 206, lb: 153 },
    compliance:{ r: 15, a: 4.3, y: 8, ty: 9.5, ox: 0, cr: 4, cg: 14, cb: 20, lr: 34, lg: 206, lb: 153 },
    cta:       { r: 28, a: 0.76 + Math.PI * 2, y: 12, ty: 4.5, ox: 0, cr: 6, cg: 16, cb: 26, lr: 90, lg: 200, lb: 255, fd: 0.02 }, // closes the full 360° orbit of the Burj
  };
  for (const k in KF) { KF[k].tx ??= 0; KF[k].tz ??= 0; KF[k].fd ??= 0.026; }
  KF.cta.fd = 0.011;
  KF.chain.fd = 0.03; KF.steps.fd = 0.03; KF.compliance.fd = 0.03; KF.why.fd = 0.02;
  let stops = [];
  const secs = [...document.querySelectorAll('[data-cam]')];
  function measure() {
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    stops = secs.map(el => ({ p: Math.min(1, Math.max(0, (el.offsetTop + el.offsetHeight / 2 - innerHeight / 2) / max)), k: KF[el.dataset.cam] }));
    stops[0].p = 0;
  }
  const cur = { ...KF.hero }, tgt = { ...KF.hero };
  let explode = 0, explodeT = 0;
  function sample(p) {
    let i = 0; while (i < stops.length - 2 && p > stops[i + 1].p) i++;
    const A = stops[i], B = stops[i + 1];
    let t = (p - A.p) / Math.max(1e-4, B.p - A.p); t = Math.min(1, Math.max(0, t));
    t = t * t * (3 - 2 * t);
    for (const key in A.k) tgt[key] = A.k[key] + (B.k[key] - A.k[key]) * t;
  }
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  addEventListener('pointermove', e => { mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5; });
  
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); measure();
  }
  const syncFH = () => { const f = document.querySelector('footer'); if (f) document.documentElement.style.setProperty('--fh', f.offsetHeight + 'px'); };
  addEventListener('resize', () => { syncFH(); resize(); }); syncFH(); resize();
  
  const UP = new THREE.Vector3(0, 1, 0), vPos = new THREE.Vector3(), vT = new THREE.Vector3(), vR = new THREE.Vector3();
  let last = performance.now(), time = 0;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const L = { mode: 'loading', w: 0, t0: 0, dur: reduceMotion ? 0.9 : 2.6, R0: 0, R1: 0, v0: 0 };
  const lPos = new THREE.Vector3(), lT = new THREE.Vector3();
  function loaderCam() {
    const fill = innerWidth < 600 ? 0.56 : 0.62, visH = towerH / fill, d = visH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const ty = towerH * 0.5 + 0.15 - visH * 0.12, a = KF.hero.a + 0.25;
    lT.set(0, ty, 0); lPos.set(Math.cos(a) * d, ty + 0.9, Math.sin(a) * d);
  }
  const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  function startTransition() {
    L.mode = 'transition'; L.t0 = time; L.R0 = tower.rotation.y; L.v0 = L.w;
    const T = L.dur; L.R1 = Math.ceil((L.R0 + L.v0 * T * 0.5) / (Math.PI * 2)) * Math.PI * 2;
  }
  function frame() {
    const now = performance.now(), dt = Math.min((now - last) / 1000, 0.05); last = now; time += dt;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    sample(scrollY / max);
    const narrow = innerWidth < 860, k = 1 - Math.pow(0.02, dt);
    for (const key in cur) cur[key] += (tgt[key] - cur[key]) * k;
    explode += (explodeT - explode) * (1 - Math.pow(0.05, dt));
    mouse.sx += (mouse.x - mouse.sx) * k; mouse.sy += (mouse.y - mouse.sy) * k;
  
    const r = cur.r * (narrow ? 1.35 : 1), a = cur.a + Math.sin(time * 0.045) * 0.22; // gentle sway around each keyframe (no unbounded drift)
    vT.set(cur.tx, cur.ty + explode * 2.2, cur.tz);
    vPos.set(cur.tx + Math.cos(a) * r, cur.y + explode * 1.5, cur.tz + Math.sin(a) * r);
    if (L.mode === 'done') scene.fog.density = cur.fd;
    vR.subVectors(vT, vPos).normalize().cross(UP).normalize();
    vPos.addScaledVector(vR, mouse.sx * 1.2); vPos.y -= mouse.sy * 0.8;
    const ox = narrow ? 0 : cur.ox;
    vPos.addScaledVector(vR, -ox); vT.addScaledVector(vR, -ox);
    if (L.mode !== 'done') {
      loaderCam();
      const b = L.mode === 'loading' ? 0 : easeIO(Math.min(1, (time - L.t0) / L.dur));
      vPos.lerpVectors(lPos, vPos, b); vT.lerpVectors(lT, vT, b);
      scene.fog.density = 0.011 + (0.026 - 0.011) * b;
      const cb = Math.max(0.001, THREE.MathUtils.smoothstep(b, 0.15, 0.85)); city.scale.set(1, cb, 1); city.visible = b > 0.12; grid.material.opacity = 0.16 * b; // skyline rises around the tower
      rings.forEach(m => m.scale.setScalar(Math.max(0.001, b)));
      pMat.size = 0.12 * b;
      if (L.mode === 'loading') {
        L.w = reduceMotion ? 0 : (Math.PI * 2 / 7) * Math.min(1, time / 1.6) ** 2; // eases up to 360° / 7 s
        tower.rotation.y += L.w * dt;
      } else {
        const t = Math.min(1, (time - L.t0) / L.dur), T = L.dur;
        // cubic Hermite: starts at current angle & angular velocity, ends at rest on a full turn
        tower.rotation.y = (2 * t ** 3 - 3 * t ** 2 + 1) * L.R0 + (t ** 3 - 2 * t ** 2 + t) * T * L.v0 + (-2 * t ** 3 + 3 * t ** 2) * L.R1;
        if (t >= 1) { L.mode = 'done'; scene.fog.density = 0.026; city.scale.set(1, 1, 1); pMat.size = 0.12; document.getElementById('loader')?.remove(); }
      }
    }
    camera.position.copy(vPos); camera.lookAt(vT);
    scene.background.setRGB(cur.cr / 255, cur.cg / 255, cur.cb / 255, THREE.SRGBColorSpace); scene.fog.color.copy(scene.background);
    pl1.color.setRGB(cur.lr / 255, cur.lg / 255, cur.lb / 255, THREE.SRGBColorSpace);
  
    // tokenize: tiers separate into fractions
    tiers.forEach((tr, i) => {
      tr.position.y = tr.userData.baseY + explode * i * (tiers.length > 20 ? 0.17 : 0.26);
      tr.rotation.y = explode * Math.sin(i * 0.9) * 0.22;
      tr.position.x = explode * Math.sin(i * 1.7) * 0.12;
    });
    crown.position.y = crown.userData.baseY + explode * N * 0.17;
    // soft-focus reveal: scene stays deeply blurred until the real model has replaced the placeholder, then pulls into focus
    if (blurCur > 0) {
      const bt = modelReady ? 0 : 26;
      blurCur += (bt - blurCur) * (1 - Math.exp(-dt * (modelReady ? 2.6 : 8)));
      if (modelReady && blurCur < 0.15) { blurCur = 0; canvas.style.filter = 'none'; }
      else canvas.style.filter = `blur(${blurCur.toFixed(2)}px) brightness(${(1 + blurCur / 60).toFixed(3)})`;
    }
    M.facade.emissiveIntensity = 0.55 + explode * 0.5;
    M.glow.emissiveIntensity = 1.0 + explode * 1.8 + Math.sin(time * 2) * 0.2;
    beacon.scale.setScalar(1 + Math.sin(time * 3) * 0.3);
    spinners.forEach(w => w.rotation.z += dt * 0.04);
    for (let i = 0; i < fountains.length; i++) { const j = fountains[i], v = Math.pow(0.5 + 0.5 * Math.sin(time * 1.7 - j.userData.ph), 3); j.scale.set(1, 0.08 + v * j.userData.hmax, 1); }
    rings.forEach((m, i) => { m.rotation.z = time * m.userData.spd * (i % 2 ? -1 : 1); m.position.y += ((3.2 + i * 3) * (1 + explode * 0.4) - m.position.y) * k; });
  
    const arr = pGeo.attributes.position.array;
    for (let i = 0; i < PC; i++) { arr[i * 3 + 1] += pSpd[i] * (1 + explode * 2); if (arr[i * 3 + 1] > 22) arr[i * 3 + 1] = 0; }
    pGeo.attributes.position.needsUpdate = true;
    pMat.opacity = 0.5 + explode * 0.4;
  
    renderer.render(scene, camera);
    tick(frame);
  }
  frame();
  
  // ---------- UI ----------
  const nav = document.getElementById('nav');
  const words = document.getElementById('words');
  const hl = new Set(['fractions,', 'skyline.', 'floor']);
  words.innerHTML = words.textContent.trim().split(/\s+/).map(w => `<span class="w${hl.has(w) ? ' hl' : ''}">${w}</span>`).join(' ');
  const wEls = [...words.querySelectorAll('.w')];
  const stepsSec = document.getElementById('steps'), slides = [...stepsSec.querySelectorAll('.slide')], segs = [...stepsSec.querySelectorAll('.pseg')], scount = document.getElementById('scount');
  const clamp = v => Math.min(1, Math.max(0, v));
  slides.forEach(sl => { const h = sl.querySelector('h3'); h.innerHTML = h.innerHTML.split(/\s+/).map((w, i) => `<span class="wd" style="transition-delay:${0.25 + i * 0.07}s">${w}</span>`).join(' '); });
  const sweepEl = document.getElementById('sweep'), progEl = stepsSec.querySelector('.prog'); let lastIdx = 0;
  segs.forEach((b, i) => b.addEventListener('click', () => scrollTo({ top: stepsSec.offsetTop + (stepsSec.offsetHeight - innerHeight) * (i + 0.5) / 3, behavior: 'smooth' })));
  const revEls = [...document.querySelectorAll('.reveal')];
  function onScroll() {
    nav.classList.toggle('solid', scrollY > 40);
    revEls.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight * 0.9) el.classList.add('in'); });
    const wr = words.getBoundingClientRect();
    const wp = clamp((innerHeight * 0.85 - wr.top) / (wr.height + innerHeight * 0.4));
    const on = Math.round(wp * wEls.length);
    wEls.forEach((el, i) => el.classList.toggle('on', i < on));
    const sr = stepsSec.getBoundingClientRect(), p = clamp(-sr.top / (sr.height - innerHeight)), n = slides.length;
    const idx = Math.min(n - 1, Math.floor(p * n));
    slides.forEach((el, i) => { el.classList.toggle('on', i === idx); el.classList.toggle('past', i < idx); });
    segs.forEach((el, i) => { const f = p >= 0.99 ? 1 : clamp(p * n - i); el.querySelector('i').style.transform = `scaleX(${f})`; el.classList.toggle('on', i <= idx); el.classList.toggle('full', f >= 0.98); });
    progEl.classList.toggle('done', p >= 0.99);
    if (idx !== lastIdx) { lastIdx = idx; sweepEl.classList.remove('go'); void sweepEl.offsetWidth; sweepEl.classList.add('go'); }
    scount.textContent = '0' + (idx + 1);
    { // compliance: ERC-3643 (left) → ONCHAINID (right); cards animate by state, scene keeps running
      const cs = document.getElementById('compliance'), cr = cs.getBoundingClientRect(), cp = clamp(-cr.top / (cr.height - innerHeight));
      const hd = cs.querySelector('.comp-head'); cs.style.setProperty('--hb', (hd.offsetTop + hd.offsetHeight + 12) + 'px');
      const st2 = cp >= 0.5;
      if (st2 !== cs.classList.contains('s2')) {
        cs.classList.toggle('s2', st2);
        const ln = document.getElementById('stdLink'); ln.classList.remove('fwd', 'back'); void ln.offsetWidth; ln.classList.add(st2 ? 'fwd' : 'back');
      }
    }
    explodeT = sr.top > innerHeight ? 0 : clamp(p * 1.15);
  }
  // platform: scroll-driven word reel + token choreography (NFT → 12 fractions → listed → bought back → redeemed)
  (() => {
    const sec = document.getElementById('why'), reel = document.getElementById('plReel'), vis = document.getElementById('plVis'), fill = document.getElementById('plFill'), ps = [...document.querySelectorAll('.ps')];
    const coins = [...vis.querySelectorAll('.coin')], medal = vis.querySelector('.medal'), cap = document.getElementById('plCap'), listed = [1, 3, 5, 7, 9, 11];
    const caps = ['1 property · 1 NFT', '12 fractions minted', '6 fractions listed', 'Fractions bought back', 'Property redeemed'];
    const R = () => vis.clientWidth * 0.38;
    const layout = st => { const r = R(), W = vis.clientWidth;
      medal.style.opacity = st === 0 || st === 4 ? 1 : st === 1 ? 0.18 : 0.1;
      medal.style.transform = 'translate(-50%,-50%) scale(' + (st === 0 ? 1 : st === 4 ? 1.06 : 0.55) + ')';
      coins.forEach((c, i) => { const a = i / 12 * Math.PI * 2 - Math.PI / 2, isL = listed.includes(i); let x = 0, y = 0, sc = 1, ry = 0, op = 1;
        c.style.setProperty('--d', st === 4 ? 11 - i : i);
        if (st === 0) { sc = 0.2; op = 0; }
        else if (st === 1) { x = Math.cos(a) * r; y = Math.sin(a) * r; ry = 360; }
        else if (st === 2) { if (isL) { const k = listed.indexOf(i); x = W * 0.34 + (k % 2) * W * 0.16; y = -W * 0.3 + Math.floor(k / 2) * W * 0.3; sc = 0.9; ry = 720; } else { const k = [0, 2, 4, 6, 8, 10].indexOf(i), b = k / 6 * Math.PI * 2 - Math.PI / 2; x = Math.cos(b) * r * 0.62 - W * 0.12; y = Math.sin(b) * r * 0.62; ry = 360; } }
        else if (st === 3) { const b = a + Math.PI / 6; x = Math.cos(b) * r; y = Math.sin(b) * r; ry = 1080; }
        else { sc = 0.25; op = 0; ry = 1440; }
        c.style.opacity = op; c.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + sc + ') rotateY(' + ry + 'deg)';
        c.classList.toggle('listed', st === 2 && isL); c.classList.toggle('back', st >= 3 && isL); });
      cap.style.opacity = 0; setTimeout(() => { cap.textContent = caps[st]; cap.style.opacity = 1; }, 250); };
    let last = -1;
    const upd = () => { const rc = sec.getBoundingClientRect(), p = Math.min(1, Math.max(0, -rc.top / (rc.height - innerHeight)));
      const idx = Math.min(3, Math.floor(p * 4)), stage = p < 0.05 ? 0 : idx + 1;
      fill.style.transform = 'scaleX(' + p + ')'; ps.forEach((e, i) => e.classList.toggle('on', i <= idx));
      if (stage !== last) { last = stage; vis.dataset.stage = stage; reel.style.transform = 'translateY(' + (-idx * 2.32) + 'em)'; layout(stage); } };
    addEventListener('scroll', upd, { passive: true }); addEventListener('resize', () => { last = -1; upd(); }); upd();
  })();
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll(); setInterval(onScroll, 500);
  
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  
  // cursor
  const cur$ = document.querySelector('.cursor'); let cx = innerWidth / 2, cyy = innerHeight / 2, tx = cx, ty2 = cyy;
  addEventListener('pointermove', e => { tx = e.clientX; ty2 = e.clientY; });
  (function loop() { cx += (tx - cx) * 0.2; cyy += (ty2 - cyy) * 0.2; cur$.style.transform = `translate(${cx}px,${cyy}px)`; tick(loop); })();
  document.querySelectorAll('a,button').forEach(el => { el.addEventListener('pointerenter', () => cur$.classList.add('big')); el.addEventListener('pointerleave', () => cur$.classList.remove('big')); });
  
  window.__tf = { renderer, scene, camera };
  // ---------- loader progress (real stages, smoothed; never stalls, never fakes 100) ----------
  (() => {
    const pctEl = document.getElementById('pct'), barEl = document.getElementById('bar'), stEl = document.getElementById('lstage');
    const labels = ['Initializing scene', 'Resolving architecture', 'Preparing materials', 'Compiling scene', 'Final render'];
    LP.init = 1;
    document.fonts.ready.then(() => LP.fonts = 1);
    let shown = 0, lastT = performance.now(), held = false, stage = -1;
    const target = () => 20 * LP.init + 30 * LP.dl + 25 * (0.8 * LP.dec + 0.2 * LP.fonts) + 20 * LP.prep + 5 * LP.fin;
    const cap = () => LP.init < 1 ? 20 : LP.dl < 1 ? 50 : (LP.dec < 1 || LP.fonts < 1) ? 75 : LP.prep < 1 ? 95 : LP.fin < 1 ? 99.4 : 100;
    function step() {
      const now = performance.now(), dt = Math.min(0.1, (now - lastT) / 1000); lastT = now;
      const c = cap(), goal = Math.min(c === 100 ? 100 : c - 0.6, Math.max(target(), shown + 3.5 * dt));
      shown = Math.min(goal, shown + Math.max(6 * dt, (goal - shown) * (1 - Math.exp(-5 * dt))), shown + 42 * dt);
      const v = Math.floor(shown); if (pctEl.textContent != v) pctEl.textContent = v;
      barEl.style.transform = 'scaleX(' + (shown / 100).toFixed(4) + ')';
      const sg = shown < 20 ? 0 : shown < 50 ? 1 : shown < 75 ? 2 : shown < 95 ? 3 : 4;
      if (sg !== stage) { stage = sg; stEl.textContent = labels[sg]; }
      if (shown >= 100 && !held) {
        held = true; pctEl.textContent = '100'; stEl.textContent = 'Welcome to Dubai';
        setTimeout(() => { startTransition(); markReady(); window.__glReady = true; onScroll(); }, 450);
        return;
      }
      tick(step);
    }
    tick(step);
    loadBurj().catch(e => { console.warn('Burj model fallback:', e.message); LP.dl = LP.dec = 1; modelReady = true; })
      .then(async () => {
        try { await renderer.compileAsync(scene, camera); } catch { renderer.compile(scene, camera); }
        LP.prep = 1;
        await new Promise(res => tick(() => tick(res)));  // two rendered frames with everything uploaded
        LP.fin = 1;
      });
  })();

  // GLB download (real-world scale: ~828 m to spire tip)
  document.getElementById('dl').addEventListener('click', () => {
    const c = tower.clone(true);
    c.traverse(o => { if (o.userData.baseY !== undefined) { o.position.set(0, o.userData.baseY, 0); o.rotation.set(0, 0, 0); } });
    c.scale.setScalar(828 / towerH);
    new GLTFExporter().parse(c, buf => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'model/gltf-binary' }));
      a.download = 'truefraction-dubai-tower.glb'; a.click();
    }, err => console.error(err), { binary: true });
  });
  })();

  return function cleanup() {
    alive = false;
    off.forEach((fn) => fn());
    off.length = 0;
    if (io) io.disconnect();
    if (window.__tf && window.__tf.renderer) {
      try {
        window.__tf.renderer.dispose();
        window.__tf.renderer.forceContextLoss();
      } catch {
        // renderer may already be gone
      }
    }
    root.classList.remove('loading', 'ready');
    unlockScroll();
    history.scrollRestoration = prevScrollRestoration;
  };
}
