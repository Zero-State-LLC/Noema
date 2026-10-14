/* Fluid MAP geometry from the local One World prototype; public projections only. */
// MAP enhancement for the local mock. The spatial layout and morph geometry
// are retained from world.html; TEXT and PIXEL are rendered with Canvas 2D.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export function mountStage(canvas, options = {}) {
const L = options.layout;
let REDUCE = Boolean(options.reducedMotion);
let disposed = false;
const COLS = L.CARTOGRAM_COLS, ROWS = L.CARTOGRAM_ROWS;
const CW = 0.12, CD = 0.24;                 // one character cell: width, depth
const FOV = 40, MORPH_MS = 900;
const V = 0.16;                             // one voxel = one public event
const PLATE = 0.06;                         // a place's plate in MAP
const ROAD = 0.045, ROAD_H = 0.02;          // a road in MAP
const DEPTH = 2;                            // a place may claim 2 free rows each side of its name
const BUILD_ORDER = [4, 1, 5, 7, 3, 0, 2, 8, 6];
const DIAG = Math.atan2(CD, CW), DLEN = Math.hypot(CW, CD);
const COLOR = {
  name: 0xc4bfb6, route: 0x5a646e, mark: 0x3ddcff, plate: 0x2a333c,
  move: 0x56616c, harvest: 0x9bb8c4, notable: 0xe8e4dc, major: 0xffb020, other: 0xa8a39a,
};
const CHARS = "?ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[]/\\|-*._:+'()";
const rgb = (h) => new THREE.Color().setRGB(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255, THREE.SRGBColorSpace);
const raw = (h) => new THREE.Vector3(((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const $ = (id) => document.getElementById(id);

const S = {
  mode: 1, m: 1, cells: [], events: new Map(), focusId: "", token: null,
  blocks: null, glyphs: null, plates: null, vox: null, masses: [], massBy: new Map(), voxels: [],
};

// ---------- renderer: draws only on a change, a morph, or a drag ----------
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.setClearColor(0x161b20);
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xc8d4dc, 1.4));
const sun = new THREE.DirectionalLight(0xe8e4dc, 1.6);
sun.position.set(4, 8, 3);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.05, 200);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = false;
controls.enabled = false;                   // TEXT and PIXEL are read flat; MAP can be turned
controls.maxPolarAngle = Math.PI / 2 - 0.06;
controls.addEventListener("change", () => requestRender());
let pending = false, animating = false;
function render() { if (!disposed) renderer.render(scene, camera); }
function requestRender() {
  if (disposed || pending || animating) return;
  pending = true;
  requestAnimationFrame(() => { pending = false; render(); });
}
function fit() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (w < 2 || h < 2) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  if (!animating) { const p = pose(S.mode); camera.position.copy(p.eye); controls.target.copy(p.look); controls.update(); }
  requestRender();
}

// ---------- letters ----------
function atlas() {
  const w = 48, h = 96, c = document.createElement("canvas");  // one cell per character, 1:2 like the map's cells
  c.width = CHARS.length * w; c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.font = '500 64px "IBM Plex Mono", monospace';
  g.textAlign = "center"; g.textBaseline = "middle";
  [...CHARS].forEach((ch, i) => g.fillText(ch, i * w + w / 2, h / 2 + 3));
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();   // stays crisp when read at an angle
  return t;
}
// Each letter is printed flat on its own cell (text up = north), so it reads like paint on
// the tile from above or at an angle. aKind: 0 = a place's name, 1 = a path stroke, 2 = the * mark
const glyphMat = new THREE.ShaderMaterial({
  uniforms: {
    uAtlas: { value: null }, uCount: { value: CHARS.length }, uCell: { value: new THREE.Vector2(CW, CD) },
    uPixel: { value: 0 }, uLift: { value: 0 },
    uTextRoom: { value: raw(0xe8e4dc) }, uTextRoute: { value: raw(0x9bb8c4) }, uOnPixel: { value: raw(0x0e1114) },
  },
  polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2,
  vertexShader: `
    attribute vec3 aOffset; attribute float aGlyph; attribute float aKind; attribute float aExtra;
    uniform float uPixel; uniform float uLift; uniform vec2 uCell;
    varying vec2 vUv; varying float vGlyph; varying float vKind;
    void main() {
      vUv = uv; vGlyph = aGlyph; vKind = aKind;
      vec3 p = vec3(position.x * uCell.x, 0.0, position.z * uCell.y) + aOffset;
      p.y = 0.03 * uPixel + uLift * aExtra + 0.004;          // printed on top of its pixel
      bool gone = (aKind > 0.5 && aKind < 1.5 && uPixel > 0.5) || (aKind > 1.5 && uLift > 0.5);
      gl_Position = gone ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }`,
  fragmentShader: `
    uniform sampler2D uAtlas; uniform float uCount; uniform float uPixel;
    uniform vec3 uTextRoom; uniform vec3 uTextRoute; uniform vec3 uOnPixel;
    varying vec2 vUv; varying float vGlyph; varying float vKind;
    void main() {
      vec2 uv = vec2((floor(vGlyph + 0.5) + vUv.x) / uCount, vUv.y);
      if (texture2D(uAtlas, uv).a < 0.4) discard;
      vec3 c = (vKind > 0.5 && vKind < 1.5) ? uTextRoute : uTextRoom;
      gl_FragColor = vec4(mix(c, uOnPixel, step(0.5, uPixel)), 1.0);
    }`,
});
const blockMat = new THREE.MeshLambertMaterial();
const unit = new THREE.BoxGeometry(1, 1, 1);

// ---------- his map → cells ----------
function cellsFrom(snapshot) {
  const layout = L.layoutPublicTopology(snapshot.rooms || [], snapshot.recent_events || [], "");
  const full = L.asciiCartogram(layout, {});
  if (!full) return null;
  // His labels are "[" + NAME (14 chars, upper) + "]" plus marks (* count ! +), so each
  // place's characters are found by name in his final text (it trims and collapses rows).
  const byLabel = new Map(layout.nodes.map((n) => [String(n.name || "").toUpperCase().slice(0, 14), n.room_id]));
  const cells = [];
  full.split("\n").forEach((line, r) => {
    const owners = new Array(line.length).fill(null);
    for (const m of line.matchAll(/\[([^\]\n]*)\]([*0-9!+]*)/g)) {
      const id = byLabel.get(m[1]) || [...byLabel].find(([k]) => k.startsWith(m[1]) || m[1].startsWith(k))?.[1];
      if (id) for (let k = m.index; k < m.index + m[0].length; k++) owners[k] = id;
    }
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === " ") continue;
      const room = owners[c];
      cells.push({ r, c, ch, room, kind: room ? (ch === "*" ? "mark" : "room") : "route" });
    }
  });
  return { cells, text: full };
}

// ---------- places: a plate each, and a tower of their events ----------
const eventsOf = (room) => S.events.get(room) || [];
function addEvent(room, tier, kind) {
  if (!room) return;
  const list = S.events.get(room) || [];
  list.push({ tier: tier || "NORMAL", kind: kind || "" });
  S.events.set(room, list);
}
// Each place's plate is its name's width, deepened into rows no other place uses
// (busiest places claim space first), so places never overlap. Roads may pass under.
function computeMasses(cells) {
  const occ = new Set(cells.filter((c) => c.room).map((c) => c.r + "," + c.c));
  const spans = new Map();
  for (const c of cells) {
    if (!c.room) continue;
    const s = spans.get(c.room) || { room: c.room, r: c.r, c0: c.c, c1: c.c };
    s.c0 = Math.min(s.c0, c.c); s.c1 = Math.max(s.c1, c.c);
    spans.set(c.room, s);
  }
  const free = (row, c0, c1) => { for (let c = c0; c <= c1; c++) if (occ.has(row + "," + c)) return false; return true; };
  const take = (row, c0, c1) => { for (let c = c0; c <= c1; c++) occ.add(row + "," + c); };
  const list = [...spans.values()].sort((a, b) => eventsOf(b.room).length - eventsOf(a.room).length);
  for (const s of list) {
    s.up = 0; s.down = 0;
    for (let k = 1; k <= DEPTH; k++) {
      if (s.up === k - 1 && free(s.r - k, s.c0, s.c1)) { take(s.r - k, s.c0, s.c1); s.up = k; }
      if (s.down === k - 1 && free(s.r + k, s.c0, s.c1)) { take(s.r + k, s.c0, s.c1); s.down = k; }
    }
  }
  return list.map((s) => {
    const x = ((s.c0 + s.c1) / 2 - COLS / 2) * CW;
    // the tower stands behind its name when there is room, else in front, else on it
    const towerRow = s.up >= 2 ? s.r - 1.5 : s.down >= 2 ? s.r + 1.5 : s.r;
    return {
      room: s.room, x, z: (s.r + (s.down - s.up) / 2 - ROWS / 2) * CD,
      w: (s.c1 - s.c0 + 1) * CW, d: (s.up + s.down + 1) * CD,
      tx: x, tz: (towerRow - ROWS / 2) * CD, top: PLATE,
    };
  });
}
// One voxel per public event, centre first and layer by layer; a NOTABLE event lays a
// full bone floor, a MAJOR one an amber floor.
function towerVoxels(masses) {
  const out = [];
  for (const mm of masses) {
    const slots = [];
    let k = 0;
    for (const ev of eventsOf(mm.room)) {
      const big = ev.tier === "NOTABLE" || ev.tier === "MAJOR";
      const col = ev.tier === "MAJOR" ? COLOR.major : ev.tier === "NOTABLE" ? COLOR.notable
        : ev.kind === "agent_move" ? COLOR.move : ev.kind === "harvest" ? COLOR.harvest : COLOR.other;
      for (let j = 0; j < (big ? 9 : 1); j++, k++) {
        const idx = BUILD_ORDER[k % 9], layer = Math.floor(k / 9);
        slots.push({ x: mm.tx + ((idx % 3) - 1) * V, y: PLATE + V / 2 + layer * V, z: mm.tz + (Math.floor(idx / 3) - 1) * V, col });
      }
    }
    slots.forEach((s, i) => out.push({ ...s, thr: i / Math.max(1, slots.length) }));
    mm.top = PLATE + Math.ceil(k / 9) * V;
  }
  return out;
}

function build(cells) {
  for (const o of [S.blocks, S.glyphs, S.plates, S.vox]) if (o) { scene.remove(o); if (o.geometry !== unit) o.geometry.dispose(); }
  S.cells = cells;
  S.masses = computeMasses(cells);
  S.massBy = new Map(S.masses.map((mm) => [mm.room, mm]));
  S.voxels = towerVoxels(S.masses);

  S.plates = new THREE.InstancedMesh(unit, blockMat, Math.max(1, S.masses.length));
  S.plates.count = S.masses.length;
  S.masses.forEach((_, i) => S.plates.setColorAt(i, rgb(COLOR.plate)));
  S.vox = new THREE.InstancedMesh(unit, blockMat, Math.max(1, S.voxels.length));
  S.vox.count = S.voxels.length;
  S.voxels.forEach((vx, i) => S.vox.setColorAt(i, rgb(vx.col)));
  S.blocks = new THREE.InstancedMesh(unit, blockMat, Math.max(1, cells.length));
  S.blocks.count = cells.length;
  cells.forEach((cell, i) => S.blocks.setColorAt(i, rgb(cell.kind === "room" ? COLOR.name : cell.kind === "mark" ? COLOR.mark : COLOR.route)));

  const n = cells.length;
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2));
  geo.instanceCount = n;
  const off = new Float32Array(n * 3), glyph = new Float32Array(n), kind = new Float32Array(n), extra = new Float32Array(n);
  cells.forEach((cell, i) => {
    off.set([(cell.c - COLS / 2) * CW, 0, (cell.r - ROWS / 2) * CD], i * 3);
    glyph[i] = Math.max(0, CHARS.indexOf(cell.ch.toUpperCase()));
    kind[i] = cell.kind === "route" ? 1 : cell.kind === "mark" ? 2 : 0;
    extra[i] = cell.kind === "room" ? PLATE : 0;              // names sit on their plate
  });
  geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(off, 3));
  geo.setAttribute("aGlyph", new THREE.InstancedBufferAttribute(glyph, 1));
  geo.setAttribute("aKind", new THREE.InstancedBufferAttribute(kind, 1));
  geo.setAttribute("aExtra", new THREE.InstancedBufferAttribute(extra, 1));
  S.glyphs = new THREE.Mesh(geo, glyphMat);
  for (const o of [S.plates, S.vox, S.blocks, S.glyphs]) { o.frustumCulled = false; scene.add(o); }
  apply();
}

// ---------- one scene, three looks: m = 0 TEXT, 1 PIXEL, 2 MAP ----------
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
function roadShape(ch) {
  if (ch === "|") return { sx: ROAD, sz: CD, yaw: 0 };
  if (ch === "-") return { sx: CW, sz: ROAD, yaw: 0 };
  if (ch === "/") return { sx: DLEN, sz: ROAD, yaw: DIAG };
  if (ch === "\\") return { sx: DLEN, sz: ROAD, yaw: -DIAG };
  return { sx: ROAD, sz: ROAD, yaw: 0 };                     // dashed '.' and anything else: a dot
}
function apply() {
  const pixel = clamp01(S.m), lift = clamp01(S.m - 1);
  glyphMat.uniforms.uPixel.value = pixel;
  glyphMat.uniforms.uLift.value = lift;
  if (!S.blocks) return;
  const grow = Math.max(pixel, 0.001);                      // pixels grow out of their letter
  S.blocks.visible = pixel > 0.001;
  S.cells.forEach((cell, i) => {
    const x = (cell.c - COLS / 2) * CW, z = (cell.r - ROWS / 2) * CD;
    let sx = CW * 0.94 * grow, sz = CD * 0.94 * grow, sy, yaw = 0;
    if (cell.kind === "route") {                            // a path pixel narrows into a road
      const t = roadShape(cell.ch);
      sx += (t.sx - sx) * lift; sz += (t.sz - sz) * lift; yaw = t.yaw * lift;
      sy = Math.max(0.0005, 0.03 * pixel + (ROAD_H - 0.03) * lift);
      v.set(x, sy / 2, z);
    } else if (cell.kind === "mark") {                      // the * flies up to cap its tower
      const mm = S.massBy.get(cell.room);
      const tx = mm ? mm.tx : x, tz = mm ? mm.tz : z, ty = (mm ? mm.top : PLATE) + V / 2;
      sx += (V * 0.92 - sx) * lift; sz += (V * 0.92 - sz) * lift;
      sy = Math.max(0.0005, 0.03 * pixel + (V * 0.92 - 0.03) * lift);
      v.set(x + (tx - x) * lift, (sy / 2) * (1 - lift) + ty * lift, z + (tz - z) * lift);
    } else {                                                // a name pixel becomes a nameplate
      sy = Math.max(0.0005, 0.03 * pixel + PLATE * lift);
      v.set(x, sy / 2, z);
    }
    q.setFromAxisAngle(UP, yaw);
    S.blocks.setMatrixAt(i, m4.compose(v, q, sc.set(sx, sy, sz)));
  });
  S.blocks.instanceMatrix.needsUpdate = true;

  q.identity();
  S.plates.visible = S.vox.visible = lift > 0.001;
  S.masses.forEach((mm, i) => {
    const h = Math.max(0.0005, PLATE * lift);
    S.plates.setMatrixAt(i, m4.compose(v.set(mm.x, h / 2, mm.z), q, sc.set(mm.w, h, mm.d)));
  });
  S.plates.instanceMatrix.needsUpdate = true;
  S.voxels.forEach((vx, i) => {                             // towers build up as MAP arrives
    const s = Math.max(0.0005, clamp01((lift - vx.thr * 0.85) / 0.15)) * V * 0.92;
    S.vox.setMatrixAt(i, m4.compose(v.set(vx.x, vx.y, vx.z), q, sc.set(s, s, s)));
  });
  S.vox.instanceMatrix.needsUpdate = true;
}

function pose(mode) {
  const fov = (FOV * Math.PI) / 180, halfW = (COLS * CW) / 2 + 0.3, halfD = (ROWS * CD) / 2 + 0.3;
  const top = Math.max(halfD / Math.tan(fov / 2), halfW / (Math.tan(fov / 2) * camera.aspect));
  if (mode < 2) return { eye: new THREE.Vector3(0, top, 0.0001), look: new THREE.Vector3(0, 0, 0) };
  const site = S.massBy.get(S.focusId);
  const look = site ? new THREE.Vector3(site.x, 0.7, site.z) : new THREE.Vector3(0, 0.7, 0);
  const direction = new THREE.Vector3(0.64, 0.68, 0.8).normalize();
  const right = new THREE.Vector3().crossVectors(UP, direction).normalize();
  const up = new THREE.Vector3().crossVectors(direction, right).normalize();
  let distance = top;
  // Frame the projected footprint from this actual viewport and public focus.
  // A camera move must not push distant public labels outside the canvas.
  if (S.cells.length) {
    const xs = S.cells.map((cell) => (cell.c - COLS / 2) * CW);
    const zs = S.cells.map((cell) => (cell.r - ROWS / 2) * CD);
    const high = Math.max(PLATE, ...S.masses.map((mass) => mass.top + V));
    for (const x of [Math.min(...xs) - CW, Math.max(...xs) + CW]) {
      for (const z of [Math.min(...zs) - CD, Math.max(...zs) + CD]) {
        for (const y of [0, high]) {
          const offset = new THREE.Vector3(x, y, z).sub(look);
          const depth = offset.dot(direction);
          distance = Math.max(distance,
            Math.abs(offset.dot(right)) / (Math.tan(fov / 2) * camera.aspect) + depth,
            Math.abs(offset.dot(up)) / Math.tan(fov / 2) + depth);
        }
      }
    }
  }
  return { eye: direction.multiplyScalar(distance * 1.08).add(look), look };
}


let settle = null;
function morphTo(mode, durationMs) {
  if (disposed) return Promise.resolve(false);
  if (settle) { settle(false); settle = null; }
  const token = (S.token = {});
  const from = { m: S.m, eye: camera.position.clone(), look: controls.target.clone() };
  const to = pose(mode);
  S.mode = mode;
  controls.enabled = false;
  return new Promise((resolve) => {
    settle = resolve;
    const done = () => {
      controls.enabled = mode === 2;
      animating = false;
      settle = null;
      requestRender();
      resolve(true);
    };
    const dur = REDUCE ? 0 : durationMs ?? MORPH_MS * Math.max(0.5, Math.abs(mode - from.m));
    if (!dur) {
      S.m = mode;
      camera.position.copy(to.eye);
      controls.target.copy(to.look);
      controls.update(); apply(); render(); done();
      return;
    }
    animating = true;
    const t0 = performance.now();
    const step = (now) => {
      if (disposed || S.token !== token) return;
      const u = Math.min(1, (now - t0) / dur), e = u * u * (3 - 2 * u);
      S.m = from.m + (mode - from.m) * e;
      camera.position.lerpVectors(from.eye, to.eye, e);
      controls.target.lerpVectors(from.look, to.look, e);
      camera.lookAt(controls.target);
      apply(); render();
      if (u < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
}

glyphMat.uniforms.uAtlas.value = atlas();
const observer = new ResizeObserver(fit);
observer.observe(canvas);
fit();
const onLost = (event) => {
  event.preventDefault();
  dispose();
  if (options.onLost) options.onLost();
};
canvas.addEventListener("webglcontextlost", onLost);
function dispose() {
  if (disposed) return;
  disposed = true;
  S.token = {};
  if (settle) { settle(false); settle = null; }
  observer.disconnect();
  controls.dispose();
  canvas.removeEventListener("webglcontextlost", onLost);
  for (const mesh of [S.blocks, S.glyphs, S.plates, S.vox]) {
    if (mesh && mesh.geometry !== unit) mesh.geometry.dispose();
  }
  unit.dispose();
  glyphMat.uniforms.uAtlas.value.dispose();
  glyphMat.dispose(); blockMat.dispose(); renderer.dispose();
}
return {
  update(snapshot, publicEvents) {
    if (disposed) return false;
    const allowed = new Set((snapshot.rooms || []).map((room) => room.room_id));
    S.events.clear();
    for (const event of publicEvents || []) {
      if (allowed.has(event.room_id)) addEvent(event.room_id, event.tier, event.projection_id);
    }
    const next = cellsFrom(snapshot);
    if (!next) return false;
    build(next.cells);
    return true;
  },
  morphTo,
  focus(roomId) {
    if (disposed || !S.massBy.has(roomId) || S.focusId === roomId) return;
    S.focusId = roomId;
    if (S.mode === 2) return morphTo(2, 560);
  },
  resize: fit,
  setReducedMotion(value) { REDUCE = Boolean(value); },
  dispose,
};
}
