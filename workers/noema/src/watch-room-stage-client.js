/**
 * WATCH Full-Screen Cutaway 3D Room Diorama Renderer (Noema-Specs specify/watch-single-3d-stage.md D7).
 * Lazy-loaded as /assets/watch-room-stage.js (sharing /assets/three-vendor.js) ONLY when a spectator
 * enters a Place view. Renders all 10 Perihelion Reach cutaway room sets in Nocturnal Obsidian-Basalt,
 * bespoke architecture, clickable cardinal exit portals, physical entity workstations, architectural
 * wall trace plaques, hero-table.jpg-inspired automaton rigs, verb VFX, resident speech bubbles,
 * and smooth close-up Agent-Follow camera.
 */
import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  DoubleSide,
  EdgesGeometry,
  ExtrudeGeometry,
  FogExp2,
  Group,
  HemisphereLight,
  InstancedMesh,
  LatheGeometry,
  Line,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  PCFShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Points,
  PointsMaterial,
  Raycaster,
  RepeatWrapping,
  RingGeometry,
  SRGBColorSpace,
  Scene,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import {
  applyRimGlow,
  buildNocturnalEnvMap,
  makeCanvas,
  makeCutawayWallPbr,
  makeDistrictFloorPbr,
  mulberry32,
} from "./watch-stage-craft";

const ROOM_W = 16.0;
const ROOM_D = 14.0;
const HALF_W = ROOM_W * 0.5;
const HALF_D = ROOM_D * 0.5;
const WALL_H = 4.6;
const WALL_T = 0.42;

const AGENT_COLORS = [0x3ddcff, 0xffb020, 0x52e5a8, 0xb68cff, 0xff6b8b, 0x70b8ff];

function hashHandle(handle) {
  let h = 0;
  const s = String(handle || "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function agentAccent(handle) {
  if (!handle) return 0xc9ac82;
  return AGENT_COLORS[hashHandle(handle) % AGENT_COLORS.length];
}

function hexCss(n) {
  return "#" + (n >>> 0).toString(16).padStart(6, "0");
}

function normKey(s) {
  return String(s || "").trim().toLowerCase();
}

/** Velvety multi-stop radial glow halo texture for ground rings, lanterns, and beams. */
function makeHaloTexture() {
  const c = makeCanvas(128, 128);
  if (!c) return null;
  const { canvas, ctx2d } = c;
  const g = ctx2d.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.85)");
  g.addColorStop(0.4, "rgba(255,255,255,0.38)");
  g.addColorStop(0.7, "rgba(255,255,255,0.10)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx2d.fillStyle = g;
  ctx2d.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

/** Nocturnal midnight-slate backdrop sky cylinder with crisp pinprick stars. */
function makeSkyTexture() {
  const c = makeCanvas(256, 256);
  if (!c) return null;
  const { canvas, ctx2d } = c;
  const g = ctx2d.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#05080d");
  g.addColorStop(0.45, "#090f18");
  g.addColorStop(0.8, "#0e1724");
  g.addColorStop(1, "#0b0f15");
  ctx2d.fillStyle = g;
  ctx2d.fillRect(0, 0, 256, 256);
  const rand = mulberry32(7331);
  for (let i = 0; i < 140; i++) {
    const x = rand() * 256;
    const y = rand() * 170;
    const b = rand();
    const a = 0.22 + b * 0.7;
    ctx2d.fillStyle = b > 0.72
      ? `rgba(216,236,255,${a.toFixed(2)})`
      : `rgba(176,198,224,${(a * 0.72).toFixed(2)})`;
    const sz = b > 0.88 ? 1.6 : 1;
    ctx2d.fillRect(x, y, sz, sz);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Soft volumetric light-shaft texture for brazier cones, furnace glow, and skylight beams. */
function makeShaftTexture() {
  const c = makeCanvas(64, 128);
  if (!c) return null;
  const { canvas, ctx2d } = c;
  const g = ctx2d.createLinearGradient(0, 0, 0, 128);
  g.addColorStop(0, "rgba(255,255,255,0.68)");
  g.addColorStop(0.35, "rgba(255,255,255,0.28)");
  g.addColorStop(0.75, "rgba(255,255,255,0.07)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx2d.fillStyle = g;
  ctx2d.fillRect(0, 0, 64, 128);
  return new CanvasTexture(canvas);
}

/** Room palette, district PBR materiality & atmosphere profile per Perihelion Reach district. */
function roomTheme(roomId) {
  const s = normKey(roomId);
  if (s.includes("generator")) return { kind: "generator", matKind: "hexgrate", accent: 0xffa832, sec: 0x3ddcff, hearthHex: 0xff9a28, hearthInt: 4.1, floorTint: 0x2e3f52, wallTint: 0x253445 };
  if (s.includes("relay")) return { kind: "relay", matKind: "hexgrate", accent: 0x3ddcff, sec: 0xffb020, hearthHex: 0x48d8ff, hearthInt: 3.2, floorTint: 0x283a4d, wallTint: 0x223143 };
  if (s.includes("archive")) return { kind: "archive", matKind: "flagstone", accent: 0x4ad8f8, sec: 0x9b6dff, hearthHex: 0x56cef4, hearthInt: 3.3, floorTint: 0x263547, wallTint: 0x1f2d3e };
  if (s.includes("civic")) return { kind: "civic", matKind: "flagstone", accent: 0xffb84d, sec: 0x3ddcff, hearthHex: 0xffb858, hearthInt: 3.8, floorTint: 0x303f52, wallTint: 0x273648 };
  if (s.includes("transit")) return { kind: "transit", matKind: "apron", accent: 0x3ddcff, sec: 0x52e5a8, hearthHex: 0x4ed6f6, hearthInt: 3.1, floorTint: 0x2a3b4e, wallTint: 0x233344 };
  if (s.includes("foundry")) return { kind: "foundry", matKind: "diamond", accent: 0xff8c24, sec: 0xffcc66, hearthHex: 0xff8224, hearthInt: 4.3, floorTint: 0x2f3946, wallTint: 0x25303e };
  if (s.includes("storage")) return { kind: "storage", matKind: "apron", accent: 0xd4a65a, sec: 0x3ddcff, hearthHex: 0xe8b25e, hearthInt: 3.3, floorTint: 0x2d3c4d, wallTint: 0x243344 };
  if (s.includes("vault")) return { kind: "vault", matKind: "diamond", accent: 0x3ddcff, sec: 0xff9e30, hearthHex: 0x52c8ea, hearthInt: 3.1, floorTint: 0x263546, wallTint: 0x202d3c };
  if (s.includes("outer")) return { kind: "outer", matKind: "basalt", accent: 0x9b6dff, sec: 0xffb020, hearthHex: 0xffae48, hearthInt: 3.4, floorTint: 0x293748, wallTint: 0x223040 };
  return { kind: "frontier", matKind: "basalt", accent: 0x3ddcff, sec: 0x9b6dff, hearthHex: 0xffb450, hearthInt: 3.4, floorTint: 0x2a394b, wallTint: 0x233242 };
}

function verbLabel(verb) {
  switch (normKey(verb)) {
    case "harvest": return "harvesting";
    case "commit_supply": return "supplying";
    case "build": return "building";
    case "repair": return "repairing";
    case "recharge": return "recharging";
    case "commemorate": return "commemorating";
    case "remediate": return "remediating";
    case "contract": return "fulfilling";
    case "restore": return "restoring";
    case "repurpose": return "repurposing";
    case "promote": return "completing";
    case "abandon": return "vacating";
    case "contest": return "contesting";
    case "vest": return "vesting";
    case "trade": return "trading";
    case "org": return "chartering";
    case "inspect": return "inspecting";
    case "look": return "surveying";
    case "observe": return "observing";
    case "wait": return "holding";
    case "message": return "speaking";
    case "move": return "arriving";
    case "production": return "producing";
    default: return verb ? String(verb).slice(0, 14) : "";
  }
}

function verbCategory(verb) {
  const v = normKey(verb);
  if (v === "harvest" || v === "commit_supply" || v === "production" || v === "recharge") return "harvest";
  if (v === "build" || v === "repair" || v === "restore" || v === "repurpose" || v === "promote" || v === "remediate") return "weld";
  if (v === "contest" || v === "vest" || v === "trade" || v === "org" || v === "commemorate" || v === "contract") return "charter";
  if (v === "inspect" || v === "look" || v === "observe" || v === "wait") return "scan";
  if (v === "message") return "message";
  return "";
}

function dirShort(dir) {
  const d = normKey(dir);
  if (d === "north" || d === "n") return "N";
  if (d === "south" || d === "s") return "S";
  if (d === "east" || d === "e") return "E";
  if (d === "west" || d === "w") return "W";
  if (d === "up") return "Up";
  if (d === "down") return "Down";
  return String(dir || "").slice(0, 4).toUpperCase();
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function mount(frame, opts) {
  const canvas = opts.canvas;
  const labelRoot = opts.labels;
  const reduce = !!opts.reduce;
  const onNavigateRoom = typeof opts.onNavigateRoom === "function" ? opts.onNavigateRoom : () => {};
  const onFollowAgent = typeof opts.onFollowAgent === "function" ? opts.onFollowAgent : () => {};
  const onSelectEntity = typeof opts.onSelectEntity === "function" ? opts.onSelectEntity : () => {};
  const onLost = typeof opts.onLost === "function" ? opts.onLost : () => {};

  const haloTexture = makeHaloTexture();
  const shaftTexture = makeShaftTexture();
  const skyTexture = makeSkyTexture();
  const floorPbrCache = new Map();
  const getFloorPbr = (kind) => {
    const k = kind || "flagstone";
    if (!floorPbrCache.has(k)) floorPbrCache.set(k, makeDistrictFloorPbr(k));
    return floorPbrCache.get(k);
  };
  const wallTex = makeCutawayWallPbr();

  // Reset WebGL2 unpack flags on mount so remounted canvases never warn.
  try {
    const prevGl = typeof canvas.getContext === "function"
      ? (canvas.getContext("webgl2") || canvas.getContext("webgl"))
      : null;
    if (prevGl && typeof prevGl.pixelStorei === "function") {
      prevGl.pixelStorei(prevGl.UNPACK_FLIP_Y_WEBGL, false);
      prevGl.pixelStorei(prevGl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    }
  } catch (e) {}

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0b0f15, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.32;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const labels = new CSS2DRenderer({ element: labelRoot });
  const scene = new Scene();
  const envRig = buildNocturnalEnvMap(renderer);
  if (envRig) {
    scene.environment = envRig.envMap;
    scene.environmentIntensity = 0.96;
  }
  scene.fog = new FogExp2(0x0b0f15, 0.011);

  // Nocturnal void backdrop + ambient drifting starlight motes
  const envGroup = new Group();
  if (skyTexture) {
    const sky = new Mesh(
      new CylinderGeometry(46, 46, 36, 40, 1, true),
      new MeshBasicMaterial({ map: skyTexture, side: BackSide, fog: false, depthWrite: false }),
    );
    sky.position.y = 7;
    sky.raycast = () => {};
    envGroup.add(sky);
  }
  {
    const moteCount = 96;
    const pos = new Float32Array(moteCount * 3);
    const rand = mulberry32(4242);
    for (let i = 0; i < moteCount; i++) {
      const th = rand() * Math.PI * 2;
      const r = 7 + rand() * 18;
      pos[i * 3] = Math.cos(th) * r;
      pos[i * 3 + 1] = 0.5 + rand() * 7.5;
      pos[i * 3 + 2] = Math.sin(th) * r;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(pos, 3));
    const motes = new Points(
      geo,
      new PointsMaterial({
        color: 0xa4c8e8,
        map: haloTexture || null,
        size: haloTexture ? 0.24 : 0.1,
        transparent: true,
        opacity: 0.28,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    );
    motes.raycast = () => {};
    envGroup.add(motes);
  }
  scene.add(envGroup);

  // Atmospheric Chiaroscuro Lighting Rig
  const hemi = new HemisphereLight(0xb2d2f0, 0x1d2b3e, 1.62);
  scene.add(hemi);

  const sun = new DirectionalLight(0xdcebfa, 2.55);
  sun.position.set(-11, 19, 13);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 2.6;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 48;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.024;
  scene.add(sun);

  const rim = new DirectionalLight(0x52d0f6, 1.32);
  rim.position.set(14, 10, -12);
  scene.add(rim);

  const hearth = new PointLight(0xffb454, 3.5, 25, 1.28);
  hearth.position.set(0, 3.4, -1.6);
  scene.add(hearth);

  const fillLight = new PointLight(0x3ddcff, 1.7, 22, 1.4);
  fillLight.position.set(4.5, 2.8, 3.5);
  scene.add(fillLight);

  const coveBounce = new PointLight(0xffc478, 1.35, 18, 1.45);
  coveBounce.position.set(-5.4, 3.6, -4.8);
  scene.add(coveBounce);

  const camera = new PerspectiveCamera(36, 1, 0.1, 200);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.minPolarAngle = (18 * Math.PI) / 180;
  controls.maxPolarAngle = (68 * Math.PI) / 180;
  controls.minDistance = 5.2;
  controls.maxDistance = 46;
  controls.maxTargetRadius = 8.5;
  controls.listenToKeyEvents(frame);

  // Shared primitive geometry pool (reused across rooms, entities, agents, VFX)
  const shared = {
    unitBox: new BoxGeometry(1, 1, 1),
    cyl: new CylinderGeometry(0.5, 0.5, 1, 16),
    cylOct: new CylinderGeometry(0.5, 0.5, 1, 8),
    cylTaper: new CylinderGeometry(0.32, 0.5, 1, 12),
    cone: new ConeGeometry(0.5, 1, 14),
    dish: new ConeGeometry(0.85, 0.42, 18, 1, true),
    oct: new OctahedronGeometry(0.5, 0),
    sphere: new SphereGeometry(0.5, 14, 10),
    torus: new TorusGeometry(1, 0.08, 10, 32),
    torusThin: new TorusGeometry(1, 0.036, 8, 32),
    ring: new RingGeometry(0.76, 1.0, 28),
    plane: new PlaneGeometry(1, 1),
    scanCone: new ConeGeometry(1.15, 2.5, 16, 1, true),
  };
  const sharedGeos = new Set(Object.values(shared));

  let roomGroup = new Group();
  scene.add(roomGroup);
  let dynamicGroup = new Group();
  scene.add(dynamicGroup);

  let currentRoomId = "";
  let currentRoomSig = "";
  let lastLive = null;
  let lastCtx = {};
  let followHandle = "";
  let selectedEntity = "";
  let paused = false;
  let disposed = false;
  let dirty = false;
  let shadowsDirty = true;
  let declutterDirty = true;
  let frameId = 0;
  let framed = false;
  let tween = null;
  let spectatorMoved = false;

  // Live animation collections
  let roomAnimProps = [];
  let entityPositions = new Map();
  let portalPositions = [];
  const agentStates = new Map(); // handle -> { root, x, z, tx, tz, yaw, tyaw, rig, labelObj, speechObj, vfx, accent }
  let activeVfx = [];
  let unnamedRigs = [];

  function makeBox(sx, sy, sz, mat, shadow) {
    const m = new Mesh(shared.unitBox, mat);
    m.scale.set(sx, sy, sz);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  }

  function makeCyl(rTop, rBot, h, mat, oct, shadow) {
    const m = new Mesh(oct ? shared.cylOct : shared.cyl, mat);
    const r = (rTop + rBot) * 0.5;
    m.scale.set(r * 2, h, r * 2);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  }

  function addHalo(parent, x, y, z, size, colorHex, opacity) {
    if (!haloTexture) return null;
    const m = new Mesh(shared.plane, new MeshBasicMaterial({
      map: haloTexture,
      color: colorHex,
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
    }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.scale.set(size, size, 1);
    m.raycast = () => {};
    parent.add(m);
    return m;
  }

  /** Soft additive volumetric light-shaft cylinder/cone (zero post-processing, D6 §8 compliant). */
  function addLightShaft(parent, x, y, z, rTop, rBot, height, colorHex, opacity) {
    if (!shaftTexture) return null;
    const geo = new CylinderGeometry(rTop, rBot, height, 16, 1, true);
    const mat = new MeshBasicMaterial({
      map: shaftTexture,
      color: colorHex,
      transparent: true,
      opacity,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
    const m = new Mesh(geo, mat);
    m.position.set(x, y, z);
    m.raycast = () => {};
    parent.add(m);
    return m;
  }

  /** Draped industrial cable/conduit span using CatmullRomCurve3 + TubeGeometry. */
  function addCableSpan(parent, p0, p1, sag, radius, mat) {
    const mid = new Vector3(
      (p0.x + p1.x) * 0.5,
      Math.min(p0.y, p1.y) - sag,
      (p0.z + p1.z) * 0.5,
    );
    const curve = new CatmullRomCurve3([p0, mid, p1]);
    const geo = new TubeGeometry(curve, 14, radius, 6, false);
    const mesh = new Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.raycast = () => {};
    parent.add(mesh);
    return mesh;
  }

  /** Instanced architectural fasteners & wall coping rivets (1 draw call for tactile diorama craft). */
  function addInstancedHardware(g, mat) {
    const pts = [];
    // Conduit trench flange bolts
    for (const cz of [-4.1, 3.9]) {
      for (let gx = -6.0; gx <= 6.0; gx += 1.5) {
        pts.push([gx, 0.032, cz - 0.14], [gx, 0.032, cz + 0.14]);
      }
    }
    // Buttress wall base brackets
    for (const bx of [-6.8, -3.4, 3.4, 6.8]) {
      pts.push([bx - 0.14, 0.28, -HALF_D + 0.3], [bx + 0.14, 0.28, -HALF_D + 0.3]);
    }
    for (const bz of [-5.8, -2.8, 2.8, 5.8]) {
      pts.push([-HALF_W + 0.3, 0.28, bz - 0.14], [-HALF_W + 0.3, 0.28, bz + 0.14]);
    }
    const inst = new InstancedMesh(shared.unitBox, mat, pts.length);
    const dummy = new Object3D();
    for (let i = 0; i < pts.length; i++) {
      dummy.position.set(pts[i][0], pts[i][1], pts[i][2]);
      dummy.scale.set(0.065, 0.04, 0.065);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.raycast = () => {};
    g.add(inst);
  }

  /**
   * Compass-aligned distant obsidian basin crags & exterior foundation shelf outside the cutaway.
   * Anchors every room in Perihelion Reach's dark volcanic basin without ever implying unpublished rooms.
   */
  function buildExteriorContext(g, theme) {
    const shelfMat = new MeshStandardMaterial({ color: 0x0b111a, roughness: 0.9, metalness: 0.16 });
    const rimRockMat = applyRimGlow(new MeshStandardMaterial({
      color: 0x131d2b,
      roughness: 0.86,
      metalness: 0.18,
    }), theme.accent, 0.18, 3.4);

    // Subtle dark volcanic sub-basin ledge extending behind the cutaway shell
    const ledge = makeBox(ROOM_W + 7.5, 0.22, ROOM_D + 7.5, shelfMat, false);
    ledge.position.set(-1.6, -1.05, -1.6);
    ledge.raycast = () => {};
    g.add(ledge);

    // Instanced distant obsidian canyon crags along North-West rear horizon (1 draw call)
    const cragCount = 26;
    const crags = new InstancedMesh(shared.oct, rimRockMat, cragCount);
    const dummy = new Object3D();
    const rand = mulberry32(hashHandle(theme.kind) ^ 0x51a7);
    for (let i = 0; i < cragCount; i++) {
      const side = i % 2 === 0;
      const rx = side ? (-12.5 + rand() * 25) : (-12.5 - rand() * 5.2);
      const rz = side ? (-11.2 - rand() * 4.8) : (-10.5 + rand() * 21);
      const sx = 1.2 + rand() * 2.4;
      const sy = 1.4 + rand() * 3.8;
      const sz = 1.2 + rand() * 2.2;
      dummy.position.set(rx, -1.1 + sy * 0.36, rz);
      dummy.rotation.set((rand() - 0.5) * 0.28, rand() * Math.PI * 2, (rand() - 0.5) * 0.28);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      crags.setMatrixAt(i, dummy.matrix);
    }
    crags.instanceMatrix.needsUpdate = true;
    crags.raycast = () => {};
    g.add(crags);
  }

  function disposeGroup(grp) {
    const mats = new Set();
    grp.traverse((o) => {
      if (o.isCSS2DObject && o.element && o.element.parentNode) o.element.remove();
      if (o.isLight && typeof o.dispose === "function") o.dispose();
      if (o.geometry && !sharedGeos.has(o.geometry)) o.geometry.dispose();
      if (o.material && !mats.has(o.material)) {
        mats.add(o.material);
        o.material.dispose();
      }
    });
  }

  function clearRoomShell() {
    disposeGroup(roomGroup);
    scene.remove(roomGroup);
    roomGroup = new Group();
    scene.add(roomGroup);
    roomAnimProps = [];
    entityPositions.clear();
    portalPositions = [];
  }

  function clearDynamic() {
    disposeGroup(dynamicGroup);
    scene.remove(dynamicGroup);
    dynamicGroup = new Group();
    scene.add(dynamicGroup);
    agentStates.clear();
    activeVfx = [];
    unnamedRigs = [];
  }

  /** Architectural Cutaway Shell (district PBR deck + fluted cutaway North/West walls + conduits + band effects). */
  function buildCutawayShell(g, theme, bands) {
    const fTex = getFloorPbr(theme.matKind);
    const deckMat = new MeshStandardMaterial({
      color: theme.floorTint,
      map: fTex ? fTex.map : null,
      normalMap: fTex ? fTex.normalMap : null,
      normalScale: new Vector2(0.72, 0.72),
      roughnessMap: fTex ? fTex.roughnessMap : null,
      roughness: 0.74,
      metalness: 0.38,
    });
    const wallMat = applyRimGlow(new MeshStandardMaterial({
      color: theme.wallTint,
      map: wallTex ? wallTex.map : null,
      normalMap: wallTex ? wallTex.normalMap : null,
      normalScale: new Vector2(0.75, 0.75),
      roughnessMap: wallTex ? wallTex.roughnessMap : null,
      roughness: 0.74,
      metalness: 0.36,
    }), theme.accent, 0.2, 3.2);
    const darkBasalt = new MeshStandardMaterial({ color: 0x172130, roughness: 0.76, metalness: 0.38 });
    const collarSteel = applyRimGlow(new MeshStandardMaterial({ color: 0x314358, roughness: 0.38, metalness: 0.7 }), 0x52c8ec, 0.2, 3.2);
    const buttressMat = applyRimGlow(new MeshStandardMaterial({ color: 0x384d64, roughness: 0.38, metalness: 0.62 }), 0x5acaf0, 0.24, 3.0);
    const brassMat = new MeshStandardMaterial({ color: 0xb6925e, roughness: 0.34, metalness: 0.74 });
    const cutCapMat = new MeshStandardMaterial({ color: 0x223042, roughness: 0.5, metalness: 0.48 });
    const coveWarm = new MeshStandardMaterial({
      color: 0xffd898, emissive: 0xffac42, emissiveIntensity: 1.45, roughness: 0.22,
    });
    const conduitCoreColor = new Color(theme.accent).multiplyScalar(0.58);
    const conduitGlow = new MeshStandardMaterial({
      color: conduitCoreColor, emissive: theme.accent, emissiveIntensity: 0.32, roughness: 0.28,
    });
    const grateMat = new MeshStandardMaterial({ color: 0x233142, roughness: 0.48, metalness: 0.68 });

    // Grounded contact shadow beneath the entire architectural cutaway slab
    addHalo(g, 0, -0.84, 0, 22, 0x030508, 0.72);

    // Tier 1: stepped obsidian sub-foundation skirt
    const subSlab = makeBox(ROOM_W + 1.0, 0.54, ROOM_D + 1.0, darkBasalt, false);
    subSlab.position.set(0, -0.58, 0);
    subSlab.receiveShadow = true;
    g.add(subSlab);

    // Tier 2: beveled machined-steel structural collar
    const collar = makeBox(ROOM_W + 0.42, 0.2, ROOM_D + 0.42, collarSteel, true);
    collar.position.set(0, -0.22, 0);
    g.add(collar);

    // Tier 3: brushed obsidian-basalt architectural deck floor (top surface at y = 0)
    const floor = makeBox(ROOM_W, 0.24, ROOM_D, deckMat, true);
    floor.position.set(0, -0.12, 0);
    g.add(floor);

    // Recessed under-floor illuminated conduit channels with machined steel cross-grates
    for (const cz of [-4.1, 3.9]) {
      const trench = makeBox(ROOM_W - 1.4, 0.022, 0.32, darkBasalt, false);
      trench.position.set(0, 0.008, cz);
      g.add(trench);
      const core = makeBox(ROOM_W - 1.6, 0.016, 0.055, conduitGlow, false);
      core.position.set(0, 0.014, cz);
      g.add(core);
      for (let gx = -6.0; gx <= 6.0; gx += 1.5) {
        const rib = makeBox(0.14, 0.022, 0.3, grateMat, false);
        rib.position.set(gx, 0.017, cz);
        g.add(rib);
      }
    }
    for (const cx of [-4.6, 4.6]) {
      const trench = makeBox(0.32, 0.022, ROOM_D - 1.4, darkBasalt, false);
      trench.position.set(cx, 0.008, 0);
      g.add(trench);
      const core = makeBox(0.055, 0.016, ROOM_D - 1.6, conduitGlow, false);
      core.position.set(cx, 0.014, 0);
      g.add(core);
      for (let gz = -5.2; gz <= 5.2; gz += 1.3) {
        const rib = makeBox(0.3, 0.022, 0.14, grateMat, false);
        rib.position.set(cx, 0.017, gz);
        g.add(rib);
      }
    }

    // Open South & East machined perimeter curbs + low corner bollards
    const sCurb = makeBox(ROOM_W + 0.08, 0.12, 0.14, collarSteel, true);
    sCurb.position.set(0, 0.06, HALF_D - 0.07);
    g.add(sCurb);
    const eCurb = makeBox(0.14, 0.12, ROOM_D + 0.08, collarSteel, true);
    eCurb.position.set(HALF_W - 0.07, 0.06, 0);
    g.add(eCurb);

    // Cutaway North Wall (z = -HALF_D)
    const nWall = makeBox(ROOM_W + WALL_T, WALL_H, WALL_T, wallMat, true);
    nWall.position.set(-WALL_T * 0.5, WALL_H * 0.5, -HALF_D - WALL_T * 0.5);
    g.add(nWall);

    // Cutaway West Wall (x = -HALF_W)
    const wWall = makeBox(WALL_T, WALL_H, ROOM_D + WALL_T, wallMat, true);
    wWall.position.set(-HALF_W - WALL_T * 0.5, WALL_H * 0.5, -WALL_T * 0.5);
    g.add(wWall);

    // Top cornice & clean cutaway cross-section bevel caps
    const nTop = makeBox(ROOM_W + WALL_T + 0.12, 0.18, WALL_T + 0.14, collarSteel, true);
    nTop.position.set(-WALL_T * 0.5, WALL_H + 0.09, -HALF_D - WALL_T * 0.5);
    g.add(nTop);
    const wTop = makeBox(WALL_T + 0.14, 0.18, ROOM_D + WALL_T + 0.12, collarSteel, true);
    wTop.position.set(-HALF_W - WALL_T * 0.5, WALL_H + 0.09, -WALL_T * 0.5);
    g.add(wTop);

    // Cutaway end-caps (East end of North wall, South end of West wall)
    const nEnd = makeBox(0.12, WALL_H + 0.18, WALL_T + 0.16, cutCapMat, false);
    nEnd.position.set(HALF_W + 0.04, WALL_H * 0.5, -HALF_D - WALL_T * 0.5);
    g.add(nEnd);
    const wEnd = makeBox(WALL_T + 0.16, WALL_H + 0.18, 0.12, cutCapMat, false);
    wEnd.position.set(-HALF_W - WALL_T * 0.5, WALL_H * 0.5, HALF_D + 0.04);
    g.add(wEnd);

    // Recessed warm architectural cornice light coves + dark skirting boards
    const nCove = makeBox(ROOM_W - 0.5, 0.075, 0.08, coveWarm, false);
    nCove.position.set(0, WALL_H - 0.34, -HALF_D + 0.04);
    g.add(nCove);
    const wCove = makeBox(0.08, 0.075, ROOM_D - 0.5, coveWarm, false);
    wCove.position.set(-HALF_W + 0.04, WALL_H - 0.34, 0);
    g.add(wCove);

    const nSkirt = makeBox(ROOM_W, 0.24, 0.12, darkBasalt, false);
    nSkirt.position.set(0, 0.12, -HALF_D + 0.06);
    g.add(nSkirt);
    const wSkirt = makeBox(0.12, 0.24, ROOM_D, darkBasalt, false);
    wSkirt.position.set(-HALF_W + 0.06, 0.12, 0);
    g.add(wSkirt);

    // Structural vertical wall buttresses with brass trim flanges
    for (const bx of [-6.8, -3.4, 0, 3.4, 6.8]) {
      if (Math.abs(bx) < 0.2) continue; // Keep North center clear for centerpieces / portals
      const rib = makeBox(0.36, WALL_H - 0.1, 0.32, buttressMat, true);
      rib.position.set(bx, WALL_H * 0.5, -HALF_D + 0.14);
      g.add(rib);
      const cap = makeBox(0.42, 0.12, 0.38, brassMat, false);
      cap.position.set(bx, WALL_H - 0.52, -HALF_D + 0.15);
      g.add(cap);
    }
    for (const bz of [-5.8, -2.8, 2.8, 5.8]) {
      const rib = makeBox(0.32, WALL_H - 0.1, 0.36, buttressMat, true);
      rib.position.set(-HALF_W + 0.14, WALL_H * 0.5, bz);
      g.add(rib);
      const cap = makeBox(0.38, 0.12, 0.42, brassMat, false);
      cap.position.set(-HALF_W + 0.15, WALL_H - 0.52, bz);
      g.add(cap);
    }

    // Corner illuminated accent bollards (South-East, North-East, South-West)
    for (const [cx, cz] of [[HALF_W - 0.35, HALF_D - 0.35], [HALF_W - 0.35, -HALF_D + 0.35], [-HALF_W + 0.35, HALF_D - 0.35]]) {
      const post = makeBox(0.24, 0.62, 0.24, collarSteel, true);
      post.position.set(cx, 0.31, cz);
      g.add(post);
      const lamp = makeBox(0.26, 0.09, 0.26, coveWarm, false);
      lamp.position.set(cx, 0.66, cz);
      g.add(lamp);
    }

    // Instanced structural fasteners & grounded exterior basalt horizon context (Pass 4B)
    addInstancedHardware(g, brassMat);
    buildExteriorContext(g, theme);

    // State-reactive Pressure Band: glowing amber recessed wall heat vents & floor warning louvers
    if (bands.pressure) {
      const lvl = bands.pressure === "high" ? 3 : bands.pressure === "moderate" ? 2 : 1;
      const ventMat = new MeshStandardMaterial({
        color: 0xffd480,
        emissive: 0xff9418,
        emissiveIntensity: lvl === 3 ? 2.2 : lvl === 2 ? 1.5 : 0.95,
        roughness: 0.2,
      });
      const frameMat = new MeshStandardMaterial({ color: 0x1c242e, roughness: 0.5, metalness: 0.7 });
      const nSlots = lvl === 3 ? [-5.2, -1.7, 1.7, 5.2] : lvl === 2 ? [-5.2, 5.2] : [-5.2];
      for (const vx of nSlots) {
        const box = makeBox(1.1, 0.58, 0.12, frameMat, false);
        box.position.set(vx, 0.72, -HALF_D + 0.08);
        g.add(box);
        for (let s = 0; s < 3; s++) {
          const slit = makeBox(0.86, 0.075, 0.14, ventMat, false);
          slit.position.set(vx, 0.56 + s * 0.16, -HALF_D + 0.09);
          g.add(slit);
        }
        addHalo(g, vx, 0.03, -HALF_D + 0.7, 2.4, 0xff9a20, lvl === 3 ? 0.36 : 0.2);
      }
      if (lvl >= 2) {
        for (const vz of [-4.2, 4.2]) {
          const box = makeBox(0.12, 0.58, 1.1, frameMat, false);
          box.position.set(-HALF_W + 0.08, 0.72, vz);
          g.add(box);
          for (let s = 0; s < 3; s++) {
            const slit = makeBox(0.14, 0.075, 0.86, ventMat, false);
            slit.position.set(-HALF_W + 0.09, 0.56 + s * 0.16, vz);
            g.add(slit);
          }
          addHalo(g, -HALF_W + 0.7, 0.03, vz, 2.2, 0xff9a20, lvl === 3 ? 0.32 : 0.18);
        }
      }
    }

    // State-reactive Scar Band: luminous violet crystalline fracture veins along floor edges & corners
    if (bands.scar) {
      const lvl = bands.scar === "deep" ? 3 : bands.scar === "marked" ? 2 : 1;
      const veinMat = new MeshStandardMaterial({
        color: 0xd9c2ff,
        emissive: 0x9b6dff,
        emissiveIntensity: lvl === 3 ? 2.0 : lvl === 2 ? 1.4 : 0.9,
        roughness: 0.18,
        metalness: 0.3,
      });
      const clusters = [
        [-HALF_W + 1.05, -HALF_D + 1.05, 0.4],
        [HALF_W - 1.15, HALF_D - 1.15, 2.2],
        [-HALF_W + 1.2, HALF_D - 1.35, -0.7],
        [HALF_W - 1.3, -HALF_D + 1.25, 1.4],
      ].slice(0, lvl + 1);
      for (const [cx, cz, ang] of clusters) {
        // Glowing fissure fracture lines along floor
        const crackA = makeBox(1.8 + lvl * 0.4, 0.024, 0.07, veinMat, false);
        crackA.position.set(cx, 0.015, cz);
        crackA.rotation.y = ang;
        g.add(crackA);
        const crackB = makeBox(1.1 + lvl * 0.25, 0.024, 0.055, veinMat, false);
        crackB.position.set(cx + Math.cos(ang) * 0.3, 0.015, cz - Math.sin(ang) * 0.3);
        crackB.rotation.y = ang + 0.68;
        g.add(crackB);
        // Faceted violet crystal shards jutting out of the scar
        for (let k = 0; k < lvl + 1; k++) {
          const shard = new Mesh(shared.oct, veinMat);
          const sc = 0.26 + k * 0.14;
          shard.scale.set(sc * 0.42, sc * 1.55, sc * 0.42);
          shard.position.set(cx + (k - 1) * 0.34, sc * 0.65, cz + ((k % 2) - 0.5) * 0.32);
          shard.rotation.set(0.2 * (k - 1), ang + k, -0.22 * (k % 2 ? 1 : -1));
          shard.castShadow = true;
          g.add(shard);
        }
        addHalo(g, cx, 0.025, cz, 2.6 + lvl * 0.6, 0x9b6dff, lvl === 3 ? 0.42 : 0.26);
      }
    }
  }

  /** Bespoke Architectural Centerpieces for ALL 10 Perihelion Reach Districts. */
  function buildRoomCenterpiece(g, theme) {
    const darkMetal = new MeshStandardMaterial({ color: 0x1d2734, roughness: 0.48, metalness: 0.64 });
    const steel = new MeshStandardMaterial({ color: 0x4b6076, roughness: 0.36, metalness: 0.66 });
    const slate = new MeshStandardMaterial({ color: 0x263444, roughness: 0.56, metalness: 0.42 });
    const brass = new MeshStandardMaterial({ color: 0xb5905a, roughness: 0.34, metalness: 0.74 });
    const cyanGlow = new MeshStandardMaterial({ color: 0xaef4ff, emissive: 0x3ddcff, emissiveIntensity: 1.65, roughness: 0.18 });
    const amberGlow = new MeshStandardMaterial({ color: 0xffe09c, emissive: 0xffa024, emissiveIntensity: 1.75, roughness: 0.18 });
    const violetGlow = new MeshStandardMaterial({ color: 0xdcc4ff, emissive: 0x9b6dff, emissiveIntensity: 1.55, roughness: 0.2 });

    const cx = -0.3;
    const cz = -1.6;

    if (theme.kind === "civic") {
      // Civic Exchange: tiered circular trade amphitheater + illuminated obsidian ledger dais + warm braziers + vaulted gallery ribs + charter notice wall
      for (let i = 0; i < 3; i++) {
        const r = 3.2 - i * 0.78;
        const step = makeCyl(r, r + 0.08, 0.18, i % 2 === 0 ? slate : darkMetal, true, true);
        step.position.set(cx, 0.09 + i * 0.18, cz);
        g.add(step);
        const rimRing = new Mesh(shared.torusThin, i === 2 ? amberGlow : brass);
        rimRing.rotation.x = Math.PI / 2;
        rimRing.scale.setScalar(r);
        rimRing.position.set(cx, 0.18 + i * 0.18, cz);
        g.add(rimRing);
      }
      // Central obsidian ledger dais & floating golden-amber charter prism
      const plinth = makeCyl(0.82, 0.96, 0.92, darkMetal, true, true);
      plinth.position.set(cx, 0.96, cz);
      g.add(plinth);
      const tableCap = makeCyl(1.12, 1.0, 0.14, brass, true, true);
      tableCap.position.set(cx, 1.45, cz);
      g.add(tableCap);
      const prism = new Mesh(shared.oct, amberGlow);
      prism.scale.set(0.75, 1.05, 0.75);
      prism.position.set(cx, 2.25, cz);
      prism.userData.spin = 0.65;
      prism.userData.bobY = 2.25;
      g.add(prism);
      roomAnimProps.push(prism);
      const haloRing = new Mesh(shared.torusThin, cyanGlow);
      haloRing.rotation.x = Math.PI / 2;
      haloRing.scale.setScalar(1.15);
      haloRing.position.set(cx, 2.22, cz);
      haloRing.userData.spin = -0.5;
      g.add(haloRing);
      roomAnimProps.push(haloRing);
      // 4 warm amber brazier pylons
      for (const [bx, bz] of [[-2.4, -2.2], [2.4, -2.2], [-2.4, 2.2], [2.4, 2.2]]) {
        const py = makeBox(0.32, 1.85, 0.32, steel, true);
        py.position.set(cx + bx, 0.925, cz + bz);
        g.add(py);
        const bowl = makeCyl(0.28, 0.18, 0.2, brass, true, false);
        bowl.position.set(cx + bx, 1.94, cz + bz);
        g.add(bowl);
        const flame = new Mesh(shared.oct, amberGlow);
        flame.scale.set(0.28, 0.42, 0.28);
        flame.position.set(cx + bx, 2.22, cz + bz);
        g.add(flame);
        addLightShaft(g, cx + bx, 3.05, cz + bz, 0.62, 0.22, 1.65, 0xffaa38, 0.24);
        addHalo(g, cx + bx, 0.04, cz + bz, 2.6, 0xffa832, 0.26);
      }
      // Vaulted gallery overhead ribs curving gracefully from North wall (TubeGeometry)
      for (const rx of [-4.2, -1.4, 1.4, 4.2]) {
        const col = makeBox(0.22, 3.8, 0.26, steel, true);
        col.position.set(rx, 1.9, -HALF_D + 0.42);
        g.add(col);
        const archCurve = new CatmullRomCurve3([
          new Vector3(rx, 3.45, -HALF_D + 0.42),
          new Vector3(rx, 4.35, -HALF_D + 1.95),
          new Vector3(rx, 4.02, -HALF_D + 3.45),
        ]);
        const archRib = new Mesh(new TubeGeometry(archCurve, 14, 0.095, 6, false), brass);
        archRib.castShadow = true;
        g.add(archRib);
      }
      // Public Charter Notice Wall on North wall
      const board = makeBox(2.5, 1.25, 0.14, darkMetal, true);
      board.position.set(3.2, 2.55, -HALF_D + 0.14);
      g.add(board);
      const boardRim = makeBox(2.62, 1.36, 0.08, brass, false);
      boardRim.position.set(3.2, 2.55, -HALF_D + 0.1);
      g.add(boardRim);
      for (let i = 0; i < 3; i++) {
        const line = makeBox(1.95 - i * 0.3, 0.09, 0.16, i === 0 ? amberGlow : cyanGlow, false);
        line.position.set(3.2 - i * 0.12, 2.84 - i * 0.28, -HALF_D + 0.16);
        g.add(line);
      }
      addHalo(g, cx, 0.57, cz, 5.2, 0xffa832, 0.32);
    } else if (theme.kind === "generator") {
      // Generator Hall: massive vertical glowing amber plasma turbine + dual counter-rotating cyan magnetic rings + steel catwalk gantry + coolant pipes
      const base = makeCyl(2.2, 2.5, 0.46, darkMetal, true, true);
      base.position.set(cx, 0.23, cz);
      g.add(base);
      const coreCol = makeCyl(0.76, 0.84, 3.95, amberGlow, false, false);
      coreCol.position.set(cx, 2.25, cz);
      g.add(coreCol);
      // Armored structural collars around plasma column
      for (const cy of [0.7, 1.65, 2.85, 3.95]) {
        const col = makeCyl(1.18, 1.18, 0.24, steel, true, true);
        col.position.set(cx, cy, cz);
        g.add(col);
      }
      // 4 armored radiator fins
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
        const fin = makeBox(0.28, 3.1, 1.05, steel, true);
        fin.position.set(cx + Math.cos(a) * 1.48, 1.85, cz + Math.sin(a) * 1.48);
        fin.rotation.y = -a + Math.PI / 2;
        g.add(fin);
        const tip = makeBox(0.32, 0.16, 0.9, brass, false);
        tip.position.set(cx + Math.cos(a) * 1.48, 3.44, cz + Math.sin(a) * 1.48);
        tip.rotation.y = -a + Math.PI / 2;
        g.add(tip);
      }
      // Dual counter-rotating cyan magnetic containment rings
      const ringA = new Mesh(shared.torus, cyanGlow);
      ringA.scale.setScalar(1.88);
      ringA.position.set(cx, 2.25, cz);
      ringA.rotation.x = Math.PI / 3;
      ringA.userData.spin = 0.85;
      g.add(ringA);
      roomAnimProps.push(ringA);
      const ringB = new Mesh(shared.torus, cyanGlow);
      ringB.scale.setScalar(1.48);
      ringB.position.set(cx, 2.25, cz);
      ringB.rotation.set(-Math.PI / 3.2, 0.5, Math.PI / 4);
      ringB.userData.spin = -1.1;
      g.add(ringB);
      roomAnimProps.push(ringB);
      // Elevated steel catwalk gantry along West-North rear
      const catwalk = makeBox(5.2, 0.16, 1.55, slate, true);
      catwalk.position.set(-4.2, 2.1, -4.5);
      g.add(catwalk);
      const rail = makeBox(5.2, 0.08, 0.08, brass, false);
      rail.position.set(-4.2, 2.82, -3.76);
      g.add(rail);
      for (const sx of [-6.5, -4.2, -1.9]) {
        const leg = makeBox(0.2, 2.1, 0.2, steel, true);
        leg.position.set(sx, 1.05, -3.85);
        g.add(leg);
      }
      // Coolant manifold pipes + draped heavy power feeder cables from West catwalk to turbine
      for (const pz of [-2.4, -0.8]) {
        const pipe = makeCyl(0.18, 0.18, 6.4, brass, false, true);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(-4.4, 0.95, pz);
        g.add(pipe);
      }
      addCableSpan(g, new Vector3(-HALF_W + 0.3, 3.7, -3.2), new Vector3(cx - 0.9, 3.2, cz - 0.4), 0.72, 0.08, darkMetal);
      addCableSpan(g, new Vector3(-HALF_W + 0.3, 3.4, -1.1), new Vector3(cx - 0.9, 2.5, cz + 0.3), 0.65, 0.07, brass);
      addLightShaft(g, cx, 2.5, cz, 1.65, 1.05, 4.4, 0xffa024, 0.22);
      addHalo(g, cx, 0.04, cz, 6.2, 0xff9a20, 0.44);
    } else if (theme.kind === "relay") {
      // Relay Quarter: sunken comms pit + rising transceiver spire + rotating dish + signal matrix wall
      const pit = makeCyl(2.5, 2.7, 0.28, darkMetal, true, true);
      pit.position.set(cx, 0.14, cz);
      g.add(pit);
      const pitRing = new Mesh(shared.torusThin, cyanGlow);
      pitRing.rotation.x = Math.PI / 2;
      pitRing.scale.setScalar(2.45);
      pitRing.position.set(cx, 0.3, cz);
      g.add(pitRing);
      // Rising central lattice transceiver spire
      const spire = makeBox(0.54, 4.6, 0.54, steel, true);
      spire.position.set(cx, 2.3, cz);
      g.add(spire);
      for (const sy of [1.2, 2.1, 3.0, 3.85]) {
        const rib = makeBox(0.92, 0.12, 0.92, brass, true);
        rib.position.set(cx, sy, cz);
        g.add(rib);
      }
      // Rotating parabolic dish assembly
      const dishPivot = new Group();
      dishPivot.position.set(cx, 4.7, cz);
      dishPivot.userData.spin = 0.6;
      const dish = new Mesh(shared.dish, new MeshStandardMaterial({
        color: 0xa4c0d2, emissive: 0x3ddcff, emissiveIntensity: 0.28, roughness: 0.3, metalness: 0.62, side: DoubleSide,
      }));
      dish.scale.setScalar(1.35);
      dish.rotation.z = 0.68;
      dish.castShadow = true;
      dishPivot.add(dish);
      const horn = new Mesh(shared.oct, cyanGlow);
      horn.scale.setScalar(0.32);
      horn.position.set(-0.62, 0.48, 0);
      dishPivot.add(horn);
      g.add(dishPivot);
      roomAnimProps.push(dishPivot);
      // 3 angled operator comms consoles circling the spire
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.55;
        const cg = new Group();
        cg.position.set(cx + Math.cos(a) * 1.9, 0.3, cz + Math.sin(a) * 1.9);
        cg.rotation.y = -a + Math.PI / 2;
        const desk = makeBox(1.15, 0.78, 0.52, slate, true);
        desk.position.y = 0.39;
        cg.add(desk);
        const scr = makeBox(0.95, 0.42, 0.06, cyanGlow, false);
        scr.position.set(0, 0.95, -0.14);
        scr.rotation.x = -0.25;
        cg.add(scr);
        g.add(cg);
      }
      // Illuminated Signal Matrix Wall on North wall
      const matrixBg = makeBox(4.2, 2.0, 0.16, darkMetal, true);
      matrixBg.position.set(3.6, 2.4, -HALF_D + 0.16);
      g.add(matrixBg);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 7; col++) {
          const lit = (row + col) % 3 !== 0;
          const pip = makeBox(0.36, 0.24, 0.18, lit ? (col % 4 === 0 ? amberGlow : cyanGlow) : slate, false);
          pip.position.set(1.92 + col * 0.56, 1.85 + row * 0.38, -HALF_D + 0.2);
          g.add(pip);
        }
      }
      // Draped coaxial signal cables linking consoles & North matrix wall to transceiver spire
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.55;
        addCableSpan(
          g,
          new Vector3(cx + Math.cos(a) * 1.8, 0.72, cz + Math.sin(a) * 1.8),
          new Vector3(cx + Math.cos(a) * 0.3, 1.45, cz + Math.sin(a) * 0.3),
          0.32,
          0.055,
          darkMetal,
        );
      }
      addCableSpan(g, new Vector3(3.4, 3.1, -HALF_D + 0.25), new Vector3(cx + 0.28, 3.6, cz - 0.15), 0.65, 0.065, brass);
      addLightShaft(g, cx, 3.6, cz, 1.55, 0.52, 3.6, 0x3ddcff, 0.18);
      addHalo(g, cx, 0.04, cz, 5.4, 0x3ddcff, 0.34);
    } else if (theme.kind === "archive") {
      // Archive: subterranean sunken obsidian vault + towering cyan-etched codex stacks + floating record prism + reading alcoves
      const sanctum = makeCyl(2.6, 2.8, 0.24, darkMetal, true, true);
      sanctum.position.set(cx, 0.12, cz);
      g.add(sanctum);
      // 6 towering luminous cyan-etched codex monolith stacks in a grand arc
      const stackSpecs = [
        [-4.2, -4.4, 0.35, 3.8], [-2.1, -5.0, 0.16, 4.15], [0.1, -5.2, 0, 4.35],
        [2.3, -5.0, -0.16, 4.1], [4.3, -4.3, -0.36, 3.7], [-5.6, -1.8, 1.25, 3.6],
      ];
      for (const [mx, mz, rot, h] of stackSpecs) {
        const mono = makeBox(1.05, h, 0.46, darkMetal, true);
        mono.position.set(mx, h * 0.5, mz);
        mono.rotation.y = rot;
        g.add(mono);
        const trim = makeBox(0.1, h * 0.78, 0.5, cyanGlow, false);
        trim.position.set(mx, h * 0.52, mz);
        trim.rotation.y = rot;
        g.add(trim);
        const cap = makeBox(1.16, 0.12, 0.56, brass, false);
        cap.position.set(mx, h + 0.06, mz);
        cap.rotation.y = rot;
        g.add(cap);
      }
      // Central floating holographic record prism inside gyroscopic rings
      const lectern = makeCyl(0.62, 0.85, 1.05, slate, true, true);
      lectern.position.set(cx, 0.65, cz);
      g.add(lectern);
      const prism = new Mesh(shared.oct, cyanGlow);
      prism.scale.set(0.68, 1.12, 0.68);
      prism.position.set(cx, 2.25, cz);
      prism.userData.spin = 0.72;
      prism.userData.bobY = 2.25;
      g.add(prism);
      roomAnimProps.push(prism);
      const gyro = new Mesh(shared.torusThin, violetGlow);
      gyro.scale.setScalar(1.25);
      gyro.position.set(cx, 2.25, cz);
      gyro.rotation.set(0.7, 0.4, 0);
      gyro.userData.spin = -0.6;
      g.add(gyro);
      roomAnimProps.push(gyro);
      // Cantilevered West reading alcove with warm amber lantern
      const alcove = makeBox(1.5, 0.2, 3.4, slate, true);
      alcove.position.set(-HALF_W + 0.9, 2.4, 2.2);
      g.add(alcove);
      const lamp = new Mesh(shared.oct, amberGlow);
      lamp.scale.setScalar(0.28);
      lamp.position.set(-HALF_W + 1.1, 2.85, 2.2);
      g.add(lamp);
      // Draped luminous data conduits from outer codex monoliths to lectern + zenith skylight shaft
      for (const [mx, mz] of [[-2.1, -5.0], [0.1, -5.2], [2.3, -5.0]]) {
        addCableSpan(g, new Vector3(mx, 3.3, mz + 0.2), new Vector3(cx, 1.35, cz), 0.78, 0.045, darkMetal);
      }
      addLightShaft(g, cx, 2.7, cz, 1.35, 0.78, 4.6, 0x4ad8f8, 0.2);
      addHalo(g, cx, 0.04, cz, 5.4, 0x3ddcff, 0.34);
    } else if (theme.kind === "transit") {
      // Transit Ring: twin sweeping illuminated mag-rail gantry arches + recessed track bed + dispatch kiosk
      const trackBed = makeBox(13.6, 0.06, 2.4, darkMetal, false);
      trackBed.position.set(0, 0.03, cz);
      g.add(trackBed);
      for (const rz of [-0.72, 0.72]) {
        const rail = makeBox(13.4, 0.09, 0.14, steel, true);
        rail.position.set(0, 0.08, cz + rz);
        g.add(rail);
        const strip = makeBox(13.2, 0.035, 0.06, cyanGlow, false);
        strip.position.set(0, 0.13, cz + rz);
        g.add(strip);
      }
      // Twin illuminated gantry arches spanning the track
      for (const gx of [-3.2, 2.8]) {
        for (const gz of [-1.85, 1.85]) {
          const pier = makeBox(0.46, 3.3, 0.46, steel, true);
          pier.position.set(gx, 1.65, cz + gz);
          g.add(pier);
        }
        const span = makeBox(0.52, 0.42, 4.3, darkMetal, true);
        span.position.set(gx, 3.42, cz);
        g.add(span);
        const glowBar = makeBox(0.56, 0.1, 3.9, cyanGlow, false);
        glowBar.position.set(gx, 3.22, cz);
        g.add(glowBar);
      }
      // Dispatch kiosk near North wall
      const kiosk = makeBox(2.2, 1.45, 0.9, slate, true);
      kiosk.position.set(2.8, 0.725, -5.2);
      g.add(kiosk);
      const board = makeBox(1.85, 0.65, 0.08, cyanGlow, false);
      board.position.set(2.8, 1.85, -5.2);
      g.add(board);
      addHalo(g, cx, 0.06, cz, 5.2, 0x3ddcff, 0.3);
    } else if (theme.kind === "foundry") {
      // Foundry Corridor: recessed molten-amber smelter channel + industrial furnace hood + overhead traveling crane + blast baffles
      const channel = makeBox(8.8, 0.12, 1.65, darkMetal, true);
      channel.position.set(cx, 0.06, cz);
      g.add(channel);
      const molten = makeBox(8.2, 0.06, 1.05, amberGlow, false);
      molten.position.set(cx, 0.13, cz);
      g.add(molten);
      // Steel walkway bridge crossing molten channel
      const bridge = makeBox(1.6, 0.18, 2.3, steel, true);
      bridge.position.set(cx + 0.6, 0.24, cz);
      g.add(bridge);
      // Massive industrial furnace hood at North-West
      const hood = makeCyl(1.1, 1.85, 2.6, darkMetal, true, true);
      hood.position.set(-4.2, 2.75, -3.4);
      g.add(hood);
      const hearthBox = makeBox(2.8, 1.5, 2.1, slate, true);
      hearthBox.position.set(-4.2, 0.75, -3.4);
      g.add(hearthBox);
      const furnaceCore = makeBox(1.8, 0.75, 0.25, amberGlow, false);
      furnaceCore.position.set(-4.2, 0.68, -2.32);
      g.add(furnaceCore);
      // Overhead traveling gantry crane beam
      const craneRail = makeBox(13.2, 0.28, 0.36, brass, true);
      craneRail.position.set(0, 3.85, cz);
      g.add(craneRail);
      const trolley = makeBox(1.1, 0.45, 0.8, steel, true);
      trolley.position.set(1.2, 3.55, cz);
      g.add(trolley);
      const cable = makeCyl(0.04, 0.04, 1.2, steel, false, false);
      cable.position.set(1.2, 2.8, cz);
      g.add(cable);
      // Heavy blast baffles + draped furnace feeder cables + warm furnace glow shaft
      for (const bx of [1.2, 2.8, 4.4]) {
        const baf = makeBox(0.32, 2.2, 1.25, steel, true);
        baf.position.set(bx, 1.1, -4.6);
        baf.rotation.x = 0.16;
        g.add(baf);
      }
      addCableSpan(g, new Vector3(-HALF_W + 0.3, 3.5, -3.4), new Vector3(-4.2, 2.9, -3.4), 0.45, 0.09, brass);
      addLightShaft(g, -4.2, 1.55, -2.1, 0.85, 1.45, 2.6, 0xff8820, 0.24);
      addHalo(g, cx, 0.16, cz, 7.2, 0xff8820, 0.44);
    } else if (theme.kind === "storage") {
      // Storage District: ribbed pressurized vertical cargo silos + stacked crate bays + overhead loading hoist
      const siloSpecs = [[-5.2, -4.2, 3.9], [-2.8, -4.5, 3.45], [-0.4, -4.4, 3.7], [-5.4, -1.2, 3.15]];
      for (const [sx, sz, sh] of siloSpecs) {
        const silo = makeCyl(0.92, 0.96, sh, steel, false, true);
        silo.position.set(sx, sh * 0.5, sz);
        g.add(silo);
        for (const frac of [0.28, 0.58, 0.86]) {
          const band = new Mesh(shared.torus, darkMetal);
          band.rotation.x = Math.PI / 2;
          band.scale.setScalar(0.98);
          band.position.set(sx, sh * frac, sz);
          g.add(band);
        }
        const cap = new Mesh(shared.oct, amberGlow);
        cap.scale.setScalar(0.24);
        cap.position.set(sx, sh + 0.16, sz);
        g.add(cap);
      }
      // Stacked cargo crate bay with glowing manifest strips
      const crateMat = new MeshStandardMaterial({ color: 0x6e5940, roughness: 0.62, metalness: 0.28 });
      const crates = [[2.8, 0.45, -3.6, 1.5, 0.9, 1.1], [4.5, 0.45, -3.4, 1.3, 0.9, 1.1], [3.5, 1.35, -3.55, 1.4, 0.85, 1.0]];
      for (const [x, y, z, w, h, d] of crates) {
        const c = makeBox(w, h, d, crateMat, true);
        c.position.set(x, y, z);
        g.add(c);
        const strip = makeBox(w * 0.6, 0.08, 0.04, cyanGlow, false);
        strip.position.set(x, y + 0.1, z + d * 0.51);
        g.add(strip);
      }
      // Overhead loading hoist gantry
      for (const hx of [1.6, 5.4]) {
        const post = makeBox(0.26, 3.4, 0.26, brass, true);
        post.position.set(hx, 1.7, -3.5);
        g.add(post);
      }
      const beam = makeBox(4.3, 0.28, 0.42, brass, true);
      beam.position.set(3.5, 3.45, -3.5);
      g.add(beam);
      addHalo(g, 0, 0.03, -2.5, 5.5, 0xe6ad58, 0.24);
    } else if (theme.kind === "vault") {
      // Infrastructure Vault: heavy subterranean blast-door bulkhead + armored conduit manifolds + glowing maintenance pit
      const bulkhead = makeBox(5.2, 3.8, 0.72, darkMetal, true);
      bulkhead.position.set(cx, 1.9, -HALF_D + 0.46);
      g.add(bulkhead);
      const doorDisk = makeCyl(1.42, 1.48, 0.34, steel, false, true);
      doorDisk.rotation.x = Math.PI / 2;
      doorDisk.position.set(cx, 1.9, -HALF_D + 0.86);
      g.add(doorDisk);
      const lockWheel = new Mesh(shared.torus, brass);
      lockWheel.scale.setScalar(0.82);
      lockWheel.position.set(cx, 1.9, -HALF_D + 1.08);
      lockWheel.userData.spinZ = 0.25;
      g.add(lockWheel);
      // Armored West wall coolant/power conduit manifolds
      for (let i = 0; i < 3; i++) {
        const pipe = makeCyl(0.22, 0.22, 8.8, i === 1 ? brass : steel, false, true);
        pipe.rotation.x = Math.PI / 2;
        pipe.position.set(-HALF_W + 0.58, 1.15 + i * 0.72, -1.2);
        g.add(pipe);
      }
      // Central recessed maintenance pit with glowing grates
      const pitFrame = makeBox(3.8, 0.12, 2.8, steel, true);
      pitFrame.position.set(cx, 0.06, -0.8);
      g.add(pitFrame);
      for (let i = -2; i <= 2; i++) {
        const bar = makeBox(3.2, 0.04, 0.2, cyanGlow, false);
        bar.position.set(cx, 0.13, -0.8 + i * 0.48);
        g.add(bar);
      }
      addHalo(g, cx, 0.04, -0.8, 5.2, 0x3ddcff, 0.34);
    } else if (theme.kind === "outer") {
      // Outer Works: exposed frontier landing apron + tall articulated derrick crane boom + floodlight stanchions + survey beacon
      const padRing = new Mesh(shared.torusThin, amberGlow);
      padRing.rotation.x = Math.PI / 2;
      padRing.scale.setScalar(2.9);
      padRing.position.set(cx + 0.8, 0.04, cz + 0.8);
      g.add(padRing);
      // Articulated frontier derrick crane
      const mast = makeBox(0.68, 4.1, 0.68, steel, true);
      mast.position.set(-4.5, 2.05, -3.6);
      g.add(mast);
      const boom = makeBox(0.32, 0.32, 5.4, brass, true);
      boom.position.set(-2.5, 3.85, -1.9);
      boom.rotation.set(-0.34, -0.68, 0);
      g.add(boom);
      const beacon = new Mesh(shared.oct, violetGlow);
      beacon.scale.setScalar(0.46);
      beacon.position.set(-4.5, 4.45, -3.6);
      beacon.userData.spin = 1.15;
      g.add(beacon);
      roomAnimProps.push(beacon);
      // Twin floodlight stanchions
      for (const [fx, fz] of [[4.2, -4.8], [-5.2, 3.2]]) {
        const pole = makeBox(0.22, 3.4, 0.22, darkMetal, true);
        pole.position.set(fx, 1.7, fz);
        g.add(pole);
        const head = makeBox(0.68, 0.28, 0.34, amberGlow, false);
        head.position.set(fx, 3.48, fz);
        head.rotation.x = 0.38;
        g.add(head);
        addHalo(g, fx * 0.65, 0.04, fz * 0.65, 4.2, 0xffaa44, 0.24);
      }
    } else {
      // Frontier Gate: monumental twin threshold pylons + illuminated portal lintel opening onto starlit frontier ridges + sensor bollards
      for (const gx of [-2.4, 2.4]) {
        const pylon = makeBox(1.05, 4.35, 1.15, darkMetal, true);
        pylon.position.set(cx + gx, 2.175, -HALF_D + 0.95);
        g.add(pylon);
        const strip = makeBox(0.14, 3.4, 0.22, cyanGlow, false);
        strip.position.set(cx + gx * 0.78, 2.15, -HALF_D + 1.48);
        g.add(strip);
      }
      const lintel = makeBox(6.2, 0.62, 1.25, steel, true);
      lintel.position.set(cx, 4.28, -HALF_D + 0.95);
      g.add(lintel);
      const crest = makeBox(4.4, 0.14, 0.28, amberGlow, false);
      crest.position.set(cx, 4.64, -HALF_D + 1.4);
      g.add(crest);
      // Threshold energy boundary slit
      const slit = makeBox(3.7, 0.05, 0.22, violetGlow, false);
      slit.position.set(cx, 0.04, -HALF_D + 1.05);
      g.add(slit);
      // Distant dark frontier monolith ridge silhouettes outside the North gate
      for (const [rx, rh, rz] of [[-2.0, 2.6, -9.8], [0.2, 3.4, -10.8], [2.4, 2.2, -9.5]]) {
        const ridge = new Mesh(shared.cone, new MeshStandardMaterial({ color: 0x101824, roughness: 0.9, metalness: 0.12 }));
        ridge.scale.set(2.4, rh, 2.0);
        ridge.position.set(rx, rh * 0.35 - 0.6, rz);
        ridge.raycast = () => {};
        g.add(ridge);
      }
      // Approach perimeter sensor bollards
      for (const [bx, bz] of [[-2.6, -2.2], [2.0, -2.2], [-2.6, 0.8], [2.0, 0.8]]) {
        const b = makeBox(0.24, 0.82, 0.24, steel, true);
        b.position.set(bx, 0.41, bz);
        g.add(b);
        const tip = new Mesh(shared.oct, cyanGlow);
        tip.scale.setScalar(0.16);
        tip.position.set(bx, 0.92, bz);
        g.add(tip);
      }
      addCableSpan(g, new Vector3(cx + 2.2, 4.1, -HALF_D + 1.0), new Vector3(5.6, 0.3, -1.6), 0.18, 0.04, steel);
      addCableSpan(g, new Vector3(cx - 2.2, 4.1, -HALF_D + 1.0), new Vector3(-5.8, 0.3, -1.6), 0.18, 0.04, steel);
      addLightShaft(g, cx, 2.1, -HALF_D + 1.05, 1.65, 1.85, 4.0, 0x9b6dff, 0.18);
      addHalo(g, cx, 0.05, -HALF_D + 1.4, 5.4, 0x9b6dff, 0.34);
    }
  }

  /** Clickable Cardinal Exit Portals (`room.exits[]`) placed along matching architectural edges. */
  function buildExitPortals(g, exits) {
    const byEdge = new Map();
    for (const ex of exits || []) {
      if (!ex || !ex.to_room_id) continue;
      const d = normKey(ex.direction);
      const edge = d === "n" || d === "north" ? "north"
        : d === "s" || d === "south" ? "south"
        : d === "e" || d === "east" ? "east"
        : d === "w" || d === "west" ? "west"
        : d === "down" ? "down"
        : d === "up" ? "up"
        : "east";
      const list = byEdge.get(edge) || [];
      list.push(ex);
      byEdge.set(edge, list);
    }

    const frameMat = new MeshStandardMaterial({ color: 0x263546, roughness: 0.42, metalness: 0.68 });
    const glowMat = new MeshStandardMaterial({ color: 0x9ef2ff, emissive: 0x3ddcff, emissiveIntensity: 1.55, roughness: 0.18 });
    const voidMat = new MeshBasicMaterial({ color: 0x05080f });
    const liftAmber = new MeshStandardMaterial({ color: 0xffd68a, emissive: 0xffa82e, emissiveIntensity: 1.45, roughness: 0.2 });

    for (const [edge, list] of byEdge) {
      list.forEach((ex, idx) => {
        const spread = (idx - (list.length - 1) * 0.5) * 3.4;
        const pg = new Group();
        let px = 0;
        let pz = 0;
        let rotY = 0;
        let chipY = 2.65;
        const isVert = edge === "down" || edge === "up";

        if (edge === "north") {
          px = spread;
          pz = -HALF_D + 0.16;
          rotY = 0;
        } else if (edge === "west") {
          px = -HALF_W + 0.16;
          pz = spread;
          rotY = Math.PI / 2;
        } else if (edge === "south") {
          px = spread;
          pz = HALF_D - 0.52;
          rotY = Math.PI;
          chipY = 1.45;
        } else if (edge === "east") {
          px = HALF_W - 0.52;
          pz = spread;
          rotY = -Math.PI / 2;
          chipY = 1.45;
        } else if (edge === "down") {
          px = 5.45 - idx * 2.4;
          pz = -4.55;
          chipY = 1.65;
        } else {
          px = -5.45 + idx * 2.4;
          pz = 4.55;
          chipY = 2.15;
        }

        pg.position.set(px, 0, pz);
        pg.rotation.y = rotY;
        const markPick = (m) => { m.userData.exitRoomId = ex.to_room_id; return m; };

        if (isVert) {
          // Sculpted subterranean/ascent lift shaft pad
          const pad = markPick(makeCyl(1.02, 1.12, 0.16, frameMat, true, true));
          pad.position.y = 0.08;
          pg.add(pad);
          const ring = markPick(new Mesh(shared.torusThin, edge === "down" ? glowMat : liftAmber));
          ring.rotation.x = Math.PI / 2;
          ring.scale.setScalar(0.95);
          ring.position.y = 0.19;
          pg.add(ring);
          for (const sx of [-0.88, 0.88]) {
            const rail = markPick(makeBox(0.12, edge === "up" ? 1.85 : 1.05, 0.12, frameMat, true));
            rail.position.set(sx, edge === "up" ? 0.92 : 0.52, -0.45);
            pg.add(rail);
          }
          addHalo(pg, 0, 0.04, 0, 2.8, edge === "down" ? 0x3ddcff : 0xffa82e, 0.36);
        } else if (edge === "north" || edge === "west") {
          // Recessed cutaway wall archway portal
          const back = markPick(makeBox(1.52, 2.35, 0.12, voidMat, false));
          back.position.set(0, 1.18, 0.02);
          pg.add(back);
          for (const sx of [-0.86, 0.86]) {
            const jamb = markPick(makeBox(0.24, 2.52, 0.32, frameMat, true));
            jamb.position.set(sx, 1.26, 0.12);
            pg.add(jamb);
            const strip = markPick(makeBox(0.06, 2.26, 0.08, glowMat, false));
            strip.position.set(sx * 0.86, 1.18, 0.28);
            pg.add(strip);
          }
          const top = markPick(makeBox(1.98, 0.24, 0.36, frameMat, true));
          top.position.set(0, 2.52, 0.14);
          pg.add(top);
          const sill = markPick(makeBox(1.65, 0.04, 0.52, glowMat, false));
          sill.position.set(0, 0.025, 0.42);
          pg.add(sill);
          addHalo(pg, 0, 0.03, 0.65, 2.6, 0x3ddcff, 0.32);
        } else {
          // Open cutaway deck edge threshold bollards + glowing chevron pad
          for (const sx of [-0.95, 0.95]) {
            const bol = markPick(makeBox(0.22, 0.96, 0.22, frameMat, true));
            bol.position.set(sx, 0.48, 0);
            pg.add(bol);
            const cap = markPick(makeBox(0.24, 0.1, 0.24, glowMat, false));
            cap.position.set(sx, 1.0, 0);
            pg.add(cap);
          }
          const pad = markPick(makeBox(1.75, 0.05, 0.68, frameMat, false));
          pad.position.set(0, 0.025, 0);
          pg.add(pad);
          const strip = markPick(makeBox(1.48, 0.04, 0.12, glowMat, false));
          strip.position.set(0, 0.055, 0.18);
          pg.add(strip);
          addHalo(pg, 0, 0.03, 0, 2.5, 0x3ddcff, 0.28);
        }

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "room3d-portal";
        btn.dataset.priority = "18";
        btn.dataset.exitRoomId = ex.to_room_id;
        btn.textContent = `${dirShort(ex.direction)} → ${ex.to_room_name || ex.to_room_id}`;
        btn.title = `Step ${ex.direction} into ${ex.to_room_name || ex.to_room_id}`;
        btn.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onNavigateRoom(ex.to_room_id);
        });
        const chip = new CSS2DObject(btn);
        chip.position.set(0, chipY, isVert ? 0 : 0.25);
        pg.add(chip);

        g.add(pg);
        portalPositions.push({ x: px, z: pz, edge });
      });
    }
  }

  /** Physical Entity Workstations (`room.entities[]`) with type-specific 3D silhouettes. */
  function buildEntities(g, entities) {
    entityPositions.clear();
    if (!Array.isArray(entities) || !entities.length) return;

    // Curated spacious floor slots around the cutaway deck (clear of centerpiece & portals)
    const slots = [
      [-4.6, 2.2], [4.4, 2.0], [-4.8, -1.6], [4.6, -1.6],
      [-2.0, 4.4], [2.4, 4.3], [5.4, 4.0], [-5.2, 4.5],
      [2.6, -4.4], [-3.2, -4.4],
    ];

    const darkMetal = new MeshStandardMaterial({ color: 0x1f2a37, roughness: 0.48, metalness: 0.62 });
    const steel = new MeshStandardMaterial({ color: 0x4e647a, roughness: 0.36, metalness: 0.64 });
    const brass = new MeshStandardMaterial({ color: 0xb6915c, roughness: 0.35, metalness: 0.72 });
    const cyanGlow = new MeshStandardMaterial({ color: 0xaef4ff, emissive: 0x3ddcff, emissiveIntensity: 1.5, roughness: 0.18 });
    const amberGlow = new MeshStandardMaterial({ color: 0xffdf99, emissive: 0xffa024, emissiveIntensity: 1.55, roughness: 0.18 });
    const violetGlow = new MeshStandardMaterial({ color: 0xdcc4ff, emissive: 0x9b6dff, emissiveIntensity: 1.45, roughness: 0.2 });

    entities.forEach((ent, idx) => {
      if (!ent || !ent.label) return;
      const baseSlot = slots[idx % slots.length];
      const ringShift = Math.floor(idx / slots.length) * 1.1;
      const ex = baseSlot[0] + (ringShift ? Math.cos(idx) * ringShift : 0);
      const ez = baseSlot[1] + (ringShift ? Math.sin(idx) * ringShift : 0);

      const eg = new Group();
      eg.position.set(ex, 0, ez);
      const isSel = selectedEntity && normKey(selectedEntity) === normKey(ent.label);
      const pick = (m) => { m.userData.entityLabel = ent.label; return m; };

      // Stepped workstation floor pad
      const pad = pick(makeBox(1.56, 0.1, 1.36, darkMetal, true));
      pad.position.y = 0.05;
      eg.add(pad);
      const trim = pick(new Mesh(shared.ring, new MeshBasicMaterial({
        color: isSel ? 0xffb020 : 0x3ddcff,
        transparent: true,
        opacity: isSel ? 0.85 : 0.36,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      })));
      trim.rotation.x = -Math.PI / 2;
      trim.position.y = 0.11;
      trim.scale.setScalar(0.86);
      eg.add(trim);

      const etype = normKey(ent.entity_type);
      const elabel = normKey(ent.label);
      let labelY = 1.58;

      if (elabel.includes("cache") || elabel.includes("salvage") || elabel.includes("node") || etype === "node") {
        // Salvage Cache / Mineral Node: rugged crate pallet + luminous crystalline cluster
        const pallet = pick(makeBox(1.12, 0.26, 0.92, brass, true));
        pallet.position.y = 0.23;
        eg.add(pallet);
        for (const [cx, cy, cz, sc, rx, rz] of [[-0.22, 0.62, 0.06, 0.42, 0.2, -0.24], [0.16, 0.72, -0.08, 0.52, -0.18, 0.18], [0.02, 0.56, 0.24, 0.34, 0.32, 0.1]]) {
          const cry = pick(new Mesh(shared.oct, cyanGlow));
          cry.scale.set(sc * 0.58, sc * 1.45, sc * 0.58);
          cry.position.set(cx, cy, cz);
          cry.rotation.set(rx, cx * 2, rz);
          cry.castShadow = true;
          eg.add(cry);
        }
        addHalo(eg, 0, 0.12, 0, 2.2, 0x3ddcff, 0.3);
      } else if (elabel.includes("generator") || elabel.includes("turbine") || elabel.includes("power") || elabel.includes("furnace")) {
        // Auxiliary Generator / Power Rig
        const tank = pick(makeCyl(0.46, 0.5, 1.05, steel, true, true));
        tank.position.y = 0.62;
        eg.add(tank);
        const coil = pick(new Mesh(shared.torus, amberGlow));
        coil.rotation.x = Math.PI / 2;
        coil.scale.setScalar(0.56);
        coil.position.y = 0.76;
        eg.add(coil);
        const cap = pick(makeCyl(0.32, 0.42, 0.28, darkMetal, true, true));
        cap.position.y = 1.24;
        eg.add(cap);
        labelY = 1.75;
        addHalo(eg, 0, 0.12, 0, 2.2, 0xffa024, 0.32);
      } else if (elabel.includes("relay") || elabel.includes("comm") || elabel.includes("beacon") || elabel.includes("antenna")) {
        // Relay Transceiver Console
        const body = pick(makeBox(0.82, 0.88, 0.64, steel, true));
        body.position.y = 0.54;
        eg.add(body);
        const mast = pick(makeCyl(0.06, 0.08, 0.82, brass, false, true));
        mast.position.set(0, 1.32, -0.1);
        eg.add(mast);
        const dish = pick(new Mesh(shared.dish, cyanGlow));
        dish.scale.setScalar(0.42);
        dish.position.set(0, 1.72, -0.1);
        dish.rotation.z = 0.55;
        dish.userData.spin = 0.85;
        eg.add(dish);
        roomAnimProps.push(dish);
        labelY = 2.05;
      } else if (etype === "monument" || elabel.includes("memorial")) {
        // RFC-0137: Permanent Civic Commemorative Stele
        const base = pick(makeCyl(0.48, 0.62, 0.36, darkMetal, true, true));
        base.position.y = 0.24;
        eg.add(base);
        const stele = pick(makeBox(0.56, 1.56, 0.28, brass, true));
        stele.position.y = 1.18;
        eg.add(stele);
        const crest = pick(new Mesh(shared.oct, amberGlow));
        crest.scale.set(0.24, 0.42, 0.24);
        crest.position.y = 2.18;
        crest.userData.spin = 0.6;
        eg.add(crest);
        roomAnimProps.push(crest);
        labelY = 2.52;
        addHalo(eg, 0, 0.12, 0, 2.5, 0xffc44d, 0.38);
      } else if (elabel.includes("codex") || elabel.includes("ruin") || elabel.includes("obelisk") || etype === "ruin") {
        // Ruin / Codex Monolith Stack
        const slab = pick(makeBox(0.76, 1.48, 0.36, darkMetal, true));
        slab.position.y = 0.84;
        slab.rotation.z = elabel.includes("ruin") ? 0.12 : 0;
        eg.add(slab);
        const rune = pick(makeBox(0.09, 1.05, 0.4, elabel.includes("ruin") ? violetGlow : cyanGlow, false));
        rune.position.y = 0.86;
        rune.rotation.z = slab.rotation.z;
        eg.add(rune);
        labelY = 1.92;
      } else if (elabel.includes("storage") || elabel.includes("crate") || elabel.includes("bay") || elabel.includes("depot")) {
        // Pressurized Storage Locker
        const c1 = pick(makeBox(0.92, 0.62, 0.72, steel, true));
        c1.position.set(-0.1, 0.41, 0);
        eg.add(c1);
        const c2 = pick(makeBox(0.68, 0.46, 0.58, brass, true));
        c2.position.set(0.06, 0.95, -0.02);
        c2.rotation.y = 0.15;
        eg.add(c2);
        const tag = pick(makeBox(0.45, 0.08, 0.04, cyanGlow, false));
        tag.position.set(-0.1, 0.52, 0.37);
        eg.add(tag);
      } else if (etype === "workshop" || elabel.includes("workshop") || elabel.includes("bench")) {
        // Artisan Workbench + Anvil + Back Tool Rack + Task Lamp Light Cone
        const bench = pick(makeBox(1.24, 0.66, 0.7, darkMetal, true));
        bench.position.y = 0.43;
        eg.add(bench);
        const topRim = pick(makeBox(1.28, 0.06, 0.74, brass, false));
        topRim.position.y = 0.78;
        eg.add(topRim);
        const anvil = pick(makeBox(0.38, 0.22, 0.24, steel, true));
        anvil.position.set(0.24, 0.92, 0.04);
        eg.add(anvil);
        const rack = pick(makeBox(0.92, 0.52, 0.06, steel, true));
        rack.position.set(0.06, 1.08, -0.32);
        eg.add(rack);
        const arm = pick(makeBox(0.08, 0.74, 0.08, brass, true));
        arm.position.set(-0.48, 1.08, -0.22);
        eg.add(arm);
        const lamp = pick(makeBox(0.36, 0.08, 0.18, amberGlow, false));
        lamp.position.set(-0.28, 1.42, -0.14);
        eg.add(lamp);
        addLightShaft(eg, -0.22, 1.04, -0.08, 0.14, 0.46, 0.74, 0xffb038, 0.24);
      } else if (etype === "barter_stall" || elabel.includes("barter") || elabel.includes("stall")) {
        // Stocked Obsidian-Amber Barter Kiosk (RFC-0140 / RFC-0144) with goods canisters & acid-lime trade holo
        const counter = pick(makeBox(1.36, 0.72, 0.78, darkMetal, true));
        counter.position.y = 0.46;
        eg.add(counter);
        const trim = pick(makeBox(1.4, 0.08, 0.82, brass, false));
        trim.position.y = 0.84;
        eg.add(trim);
        // Stocked goods: twin power-cell canisters + ore crate + emerald-lime open-trade ledger holo
        for (const cx0 of [-0.42, -0.22]) {
          const cell = pick(makeCyl(0.075, 0.075, 0.24, cyanGlow, false, false));
          cell.position.set(cx0, 1.0, 0.12);
          eg.add(cell);
        }
        const crate = pick(makeBox(0.32, 0.2, 0.24, steel, true));
        crate.position.set(0.36, 0.98, 0.1);
        eg.add(crate);
        const tradeMat = new MeshStandardMaterial({ color: 0xe6ff99, emissive: 0xc6ff3d, emissiveIntensity: 1.5, roughness: 0.18 });
        const ledger = pick(new Mesh(shared.oct, tradeMat));
        ledger.scale.set(0.16, 0.24, 0.16);
        ledger.position.set(0.02, 1.18, 0.02);
        ledger.userData.spin = 0.8;
        eg.add(ledger);
        roomAnimProps.push(ledger);
        const postL = pick(makeBox(0.08, 0.98, 0.08, brass, true));
        postL.position.set(-0.58, 1.33, -0.28);
        eg.add(postL);
        const postR = pick(makeBox(0.08, 0.98, 0.08, brass, true));
        postR.position.set(0.58, 1.33, -0.28);
        eg.add(postR);
        const canopy = pick(makeBox(1.42, 0.12, 0.78, amberGlow, false));
        canopy.position.set(0, 1.84, -0.02);
        canopy.rotation.x = 0.12;
        eg.add(canopy);
        addHalo(eg, 0, 0.12, 0.08, 2.4, 0xc6ff3d, 0.2);
      } else {
        // Default Infrastructure / Annex / Charter Plinth
        const col = pick(makeBox(0.76, 0.96, 0.64, steel, true));
        col.position.y = 0.58;
        eg.add(col);
        const screen = pick(makeBox(0.64, 0.36, 0.08, cyanGlow, false));
        screen.position.set(0, 1.18, 0.05);
        screen.rotation.x = -0.26;
        eg.add(screen);
      }

      const tagEl = document.createElement("button");
      tagEl.type = "button";
      tagEl.className = "room3d-entity" + (isSel ? " is-selected" : "");
      tagEl.dataset.priority = isSel ? "24" : "10";
      tagEl.dataset.entityLabel = ent.label;
      tagEl.textContent = ent.label;
      tagEl.title = `${ent.label} (${ent.entity_type || "workstation"})`;
      tagEl.addEventListener("click", (ev) => {
        ev.stopPropagation();
        onSelectEntity(ent.label);
      });
      const obj = new CSS2DObject(tagEl);
      obj.position.set(0, labelY, 0);
      eg.add(obj);

      g.add(eg);
      entityPositions.set(normKey(ent.label), { x: ex, z: ez, label: ent.label, trimMat: trim.material, isSel });
    });
  }

  /** Architectural Wall Trace Plaques (`room.traces[]`, up to 4) mounted along North & West cutaway walls. */
  function buildTracePlaques(g, traces) {
    if (!Array.isArray(traces) || !traces.length) return;
    const plaqueSlots = [
      { x: -5.1, y: 2.65, z: -HALF_D + 0.16, rotY: 0 },
      { x: -HALF_W + 0.16, y: 2.65, z: -3.6, rotY: Math.PI / 2 },
      { x: 5.9, y: 2.65, z: -HALF_D + 0.16, rotY: 0 },
      { x: -HALF_W + 0.16, y: 2.65, z: 3.4, rotY: Math.PI / 2 },
    ];
    const plateMat = new MeshStandardMaterial({ color: 0x1a232e, roughness: 0.42, metalness: 0.66 });

    traces.slice(0, 4).forEach((raw, idx) => {
      const text = typeof raw === "string" ? raw : String(raw && (raw.text || raw.line || raw.summary) || "").trim();
      if (!text) return;
      const kind = typeof raw === "object" && raw && raw.kind ? String(raw.kind) : "notice";
      const slot = plaqueSlots[idx % plaqueSlots.length];
      const trimHex = kind === "scar" ? 0x9b6dff : kind === "construction" ? 0xffb020 : 0xd4b68a;
      const trimMat = new MeshStandardMaterial({
        color: trimHex, emissive: trimHex, emissiveIntensity: 0.95, roughness: 0.24,
      });

      const pg = new Group();
      pg.position.set(slot.x, slot.y, slot.z);
      pg.rotation.y = slot.rotY;

      const backing = makeBox(1.86, 0.92, 0.1, plateMat, true);
      pg.add(backing);
      const border = makeBox(1.94, 0.98, 0.06, trimMat, false);
      border.position.z = -0.02;
      pg.add(border);
      // Etched luminous inscription bars on the 3D plaque
      for (let i = 0; i < 3; i++) {
        const line = makeBox(1.38 - i * 0.24, 0.06, 0.12, trimMat, false);
        line.position.set(-i * 0.1, 0.2 - i * 0.2, 0.02);
        pg.add(line);
      }

      const chip = document.createElement("div");
      chip.className = "room3d-trace";
      chip.dataset.kind = kind;
      chip.dataset.priority = "6";
      chip.title = text;
      chip.textContent = text.length > 56 ? text.slice(0, 54).trimEnd() + "…" : text;
      const obj = new CSS2DObject(chip);
      obj.position.set(0, 0.72, 0.12);
      pg.add(obj);

      g.add(pg);
    });
  }

  /**
   * RFC-0136: Band-redacted Deep Time & Culture architectural markers inside the 3D Room Cutaway.
   * Renders physical floor scar fissures (obsidian-violet when fossilized), hovering lore obelisk,
   * and warm maintenance tradition hearth rings (split gold/violet on schism).
   */
  function buildDeepTimeProps(g, room, bands) {
    // 1. Scar fissures on floor deck when room bears a public scar band
    if (bands.scar) {
      const fossil = room && room.scar_fossilized === true;
      const crackHex = fossil ? 0x9b6dff : bands.scar === "deep" ? 0xff5a2a : 0xff9a34;
      const crackMat = new MeshStandardMaterial({
        color: crackHex,
        emissive: crackHex,
        emissiveIntensity: bands.scar === "deep" ? 1.5 : bands.scar === "marked" ? 1.05 : 0.65,
        roughness: 0.25,
        metalness: 0.3,
      });
      const count = bands.scar === "deep" ? 4 : bands.scar === "marked" ? 3 : 2;
      const fissures = [
        [-3.4, 0.03, 3.6, 1.9, 0.12, 0.42],
        [-2.7, 0.03, 3.9, 1.25, 0.09, -0.55],
        [3.1, 0.03, 3.5, 1.65, 0.11, -0.35],
        [2.4, 0.03, 3.8, 1.1, 0.08, 0.62],
      ];
      for (let i = 0; i < count; i++) {
        const [fx, fy, fz, len, wid, rot] = fissures[i];
        const seg = makeBox(len, 0.035, wid, crackMat, false);
        seg.position.set(fx, fy, fz);
        seg.rotation.y = rot;
        g.add(seg);
        if (fossil) {
          const shard = new Mesh(shared.oct, crackMat);
          shard.scale.set(0.14, 0.38, 0.14);
          shard.position.set(fx, 0.2, fz);
          shard.rotation.z = rot * 0.4;
          g.add(shard);
        }
      }
      addHalo(g, -3.0, 0.04, 3.75, 2.5, crackHex, bands.scar === "deep" ? 0.34 : 0.22);
    }

    // 2. Lore Attractor Resonator Obelisk (forming vs crystallized)
    if (room && room.lore_state) {
      const crystal = room.lore_state === "crystallized";
      const loreHex = crystal ? 0x56f0ff : 0xb18cff;
      const lg = new Group();
      lg.position.set(5.4, 0, -4.4);
      const plinth = makeCyl(0.42, 0.56, 0.42, new MeshStandardMaterial({ color: 0x1c2633, roughness: 0.4, metalness: 0.68 }), true, true);
      plinth.position.y = 0.21;
      lg.add(plinth);
      const crystalMat = new MeshStandardMaterial({
        color: 0xeaf8ff,
        emissive: loreHex,
        emissiveIntensity: crystal ? 1.85 : 1.1,
        roughness: 0.16,
        metalness: 0.35,
      });
      const obelisk = new Mesh(shared.oct, crystalMat);
      obelisk.scale.set(0.32, crystal ? 0.88 : 0.62, 0.32);
      obelisk.position.y = 1.28;
      obelisk.userData.spin = crystal ? 0.85 : 0.42;
      obelisk.userData.bobY = 1.28;
      lg.add(obelisk);
      roomAnimProps.push(obelisk);
      const orbitRing = new Mesh(shared.torusThin, crystalMat);
      orbitRing.scale.setScalar(0.68);
      orbitRing.position.y = 1.28;
      orbitRing.rotation.set(0.85, 0.3, 0);
      orbitRing.userData.spin = -0.65;
      lg.add(orbitRing);
      roomAnimProps.push(orbitRing);
      addHalo(lg, 0, 0.05, 0, 2.4, loreHex, crystal ? 0.36 : 0.22);
      if (room.lore_label) {
        const chip = document.createElement("div");
        chip.className = "room3d-trace is-scar";
        chip.dataset.priority = "6";
        chip.textContent = `${crystal ? "Lore: " : "Forming lore: "}${String(room.lore_label).slice(0, 32)}`;
        const obj = new CSS2DObject(chip);
        obj.position.set(0, 2.15, 0);
        lg.add(obj);
      }
      g.add(lg);
    }

    // 3. Maintenance Tradition Hearth Ring (split gold + violet on schism)
    if (room && room.tradition_status && room.tradition_status !== "DORMANT") {
      const tradHex = room.tradition_inherited ? 0xffd268 : 0xffaa38;
      const tradRing = new Mesh(
        shared.ring,
        new MeshBasicMaterial({
          color: tradHex,
          transparent: true,
          opacity: room.tradition_status === "CUSTOM" ? 0.24 : 0.42,
          blending: AdditiveBlending,
          depthWrite: false,
          side: DoubleSide,
        }),
      );
      tradRing.rotation.x = -Math.PI / 2;
      tradRing.position.set(0, 0.032, -0.4);
      tradRing.scale.setScalar(3.35);
      tradRing.raycast = () => {};
      g.add(tradRing);
      if (room.tradition_schism) {
        const schismRing = new Mesh(
          shared.ring,
          new MeshBasicMaterial({
            color: 0x9b6dff,
            transparent: true,
            opacity: 0.36,
            blending: AdditiveBlending,
            depthWrite: false,
            side: DoubleSide,
          }),
        );
        schismRing.rotation.x = -Math.PI / 2;
        schismRing.position.set(0, 0.036, -0.4);
        schismRing.scale.setScalar(3.62);
        schismRing.raycast = () => {};
        g.add(schismRing);
      }
    }
  }

  /**
   * Expressive hero-table.jpg-inspired miniature automaton rigs (6 role-matched archetypes).
   *   0: Hooded Archivist (tapered cloak + deep cowl + twin glowing eyes + floating ledger tablet)
   *   1: CRT-Headed Operator (layered industrial coat + glowing CRT monitor head + shoulder lamp)
   *   2: Lantern Custodian (armored tunic + visored helm + warm glowing lantern staff)
   *   3: Relay Surveyor (sleek recon chassis + domed optical head + dual antenna fins)
   *   4: Civic Envoy / Founder-Speaker (ceremonial brass mantle + radiant crest halo + charter scroll)
   *   5: Quartermaster Factor (strapped cargo harness + brass balance-lantern + rugged visored helm)
   */
  function roleArchetype(handle) {
    const s = normKey(handle);
    if (s.includes("archivist")) return 0;
    if (s.includes("custodian") || s.includes("maint")) return 2;
    if (s.includes("surveyor")) return 3;
    if (s.includes("founder") || s.includes("speaker")) return 4;
    if (s.includes("quartermaster")) return 5;
    return handle ? (hashHandle(handle) % 6) : 1;
  }

  function buildAutomatonRig(handle, isFollowed) {
    const accent = agentAccent(handle);
    const arch = roleArchetype(handle);
    const root = new Group();
    const cloakColor = new Color(0x1e2834).lerp(new Color(accent), 0.36);

    const pick = (m) => { if (handle) m.userData.agentHandle = handle; return m; };

    // Glowing ground accent halo ring
    const ringMat = new MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: isFollowed ? 0.95 : 0.62,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
    const groundRing = new Mesh(shared.ring, ringMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.025;
    groundRing.scale.setScalar(isFollowed ? 0.66 : 0.54);
    groundRing.raycast = () => {};
    root.add(groundRing);

    // Weighted obsidian figurine base
    const baseMat = new MeshStandardMaterial({ color: 0x263342, roughness: 0.44, metalness: 0.68 });
    const base = pick(makeCyl(0.36, 0.42, 0.09, baseMat, false, true));
    base.position.y = 0.045;
    root.add(base);

    const bodyGroup = new Group();
    bodyGroup.position.y = 0.09;
    root.add(bodyGroup);

    const cloakMat = applyRimGlow(new MeshStandardMaterial({
      color: cloakColor,
      emissive: accent,
      emissiveIntensity: isFollowed ? 0.3 : 0.14,
      roughness: 0.4,
      metalness: 0.4,
    }), accent, isFollowed ? 0.48 : 0.32, 2.6);
    const trimMat = new MeshStandardMaterial({ color: 0x4b5f74, roughness: 0.38, metalness: 0.66 });
    const brassMat = new MeshStandardMaterial({ color: 0xb69058, roughness: 0.34, metalness: 0.74 });
    const glowMat = new MeshStandardMaterial({
      color: 0xf4fbff,
      emissive: accent,
      emissiveIntensity: isFollowed ? 2.1 : 1.55,
      roughness: 0.14,
      metalness: 0.25,
    });
    const darkVisor = new MeshStandardMaterial({ color: 0x0b1118, roughness: 0.22, metalness: 0.75 });

    const headGroup = new Group();
    let floatProp = null;

    if (arch === 0) {
      // Archetype 0: Hooded Archivist
      const robe = pick(new Mesh(shared.cylTaper, cloakMat));
      robe.scale.set(0.68, 0.86, 0.68);
      robe.position.y = 0.43;
      robe.castShadow = true;
      robe.receiveShadow = true;
      bodyGroup.add(robe);

      const shawl = pick(makeCyl(0.32, 0.42, 0.24, trimMat, true, true));
      shawl.position.y = 0.82;
      bodyGroup.add(shawl);

      headGroup.position.y = 1.06;
      const cowl = pick(new Mesh(shared.cone, cloakMat));
      cowl.scale.set(0.56, 0.52, 0.58);
      cowl.position.set(0, 0.14, -0.02);
      cowl.castShadow = true;
      headGroup.add(cowl);
      const faceShadow = pick(makeBox(0.24, 0.22, 0.2, darkVisor, false));
      faceShadow.position.set(0, 0.04, 0.08);
      headGroup.add(faceShadow);
      for (const ex of [-0.06, 0.06]) {
        const eye = new Mesh(shared.sphere, glowMat);
        eye.scale.setScalar(0.055);
        eye.position.set(ex, 0.05, 0.19);
        headGroup.add(eye);
      }
      bodyGroup.add(headGroup);

      // Floating holographic ledger tablet
      floatProp = new Group();
      floatProp.position.set(0.38, 0.82, 0.26);
      floatProp.userData.baseY = 0.82;
      const tab = makeBox(0.28, 0.34, 0.04, glowMat, false);
      tab.rotation.set(-0.22, -0.35, 0.08);
      floatProp.add(tab);
      bodyGroup.add(floatProp);
    } else if (arch === 1) {
      // Archetype 1: CRT-Headed Operator (direct hero-table.jpg homage!)
      const coat = pick(makeBox(0.54, 0.78, 0.38, cloakMat, true));
      coat.position.y = 0.42;
      bodyGroup.add(coat);
      const pack = pick(makeBox(0.38, 0.48, 0.22, trimMat, true));
      pack.position.set(0, 0.56, -0.26);
      bodyGroup.add(pack);
      // Warm amber shoulder work-lamp
      const lamp = new Mesh(shared.sphere, new MeshStandardMaterial({
        color: 0xffe4a0, emissive: 0xffa82e, emissiveIntensity: 1.9, roughness: 0.18,
      }));
      lamp.scale.setScalar(0.14);
      lamp.position.set(0.32, 0.88, 0.08);
      bodyGroup.add(lamp);

      // Boxy CRT monitor head with glowing screen face
      headGroup.position.y = 1.06;
      const casing = pick(makeBox(0.48, 0.4, 0.42, trimMat, true));
      casing.position.y = 0.04;
      headGroup.add(casing);
      const bezel = pick(makeBox(0.4, 0.31, 0.06, darkVisor, false));
      bezel.position.set(0, 0.04, 0.2);
      headGroup.add(bezel);
      const screen = pick(makeBox(0.34, 0.24, 0.04, glowMat, false));
      screen.position.set(0, 0.04, 0.22);
      headGroup.add(screen);
      for (const ex of [-0.075, 0.075]) {
        const mark = makeBox(0.045, 0.065, 0.02, darkVisor, false);
        mark.position.set(ex, 0.06, 0.242);
        headGroup.add(mark);
      }
      const ant = makeCyl(0.018, 0.025, 0.28, brassMat, false, false);
      ant.position.set(-0.18, 0.34, -0.04);
      ant.rotation.z = 0.18;
      headGroup.add(ant);
      bodyGroup.add(headGroup);
    } else if (arch === 2) {
      // Archetype 2: Lantern Custodian
      const tunic = pick(new Mesh(shared.cylTaper, cloakMat));
      tunic.scale.set(0.62, 0.84, 0.56);
      tunic.position.y = 0.44;
      tunic.castShadow = true;
      bodyGroup.add(tunic);
      for (const sx of [-0.34, 0.34]) {
        const paul = pick(makeBox(0.18, 0.16, 0.28, brassMat, true));
        paul.position.set(sx, 0.8, 0);
        bodyGroup.add(paul);
      }
      headGroup.position.y = 1.06;
      const helm = pick(makeCyl(0.21, 0.23, 0.36, trimMat, false, true));
      helm.position.y = 0.04;
      headGroup.add(helm);
      const visor = pick(makeBox(0.32, 0.09, 0.14, glowMat, false));
      visor.position.set(0, 0.06, 0.16);
      headGroup.add(visor);
      bodyGroup.add(headGroup);

      // Tall brass custodian lantern staff
      floatProp = new Group();
      floatProp.position.set(0.44, 0, 0.16);
      floatProp.userData.baseY = 0;
      const staff = makeCyl(0.032, 0.036, 1.56, brassMat, false, true);
      staff.position.y = 0.78;
      floatProp.add(staff);
      const lantern = new Mesh(shared.oct, new MeshStandardMaterial({
        color: 0xffe49c, emissive: 0xffa62e, emissiveIntensity: 2.0, roughness: 0.15,
      }));
      lantern.scale.set(0.18, 0.26, 0.18);
      lantern.position.set(0, 1.52, 0.08);
      floatProp.add(lantern);
      bodyGroup.add(floatProp);
    } else if (arch === 3) {
      // Archetype 3: Relay Surveyor
      const chassis = pick(new Mesh(shared.cylTaper, cloakMat));
      chassis.scale.set(0.56, 0.82, 0.54);
      chassis.position.y = 0.44;
      chassis.castShadow = true;
      bodyGroup.add(chassis);
      const core = new Mesh(shared.oct, glowMat);
      core.scale.set(0.16, 0.22, 0.12);
      core.position.set(0, 0.62, 0.24);
      bodyGroup.add(core);
      const pack = makeBox(0.34, 0.44, 0.22, trimMat, true);
      pack.position.set(0, 0.58, -0.24);
      bodyGroup.add(pack);

      headGroup.position.y = 1.04;
      const dome = pick(new Mesh(shared.sphere, trimMat));
      dome.scale.set(0.4, 0.38, 0.42);
      dome.position.y = 0.05;
      dome.castShadow = true;
      headGroup.add(dome);
      const lens = new Mesh(shared.sphere, glowMat);
      lens.scale.set(0.16, 0.14, 0.12);
      lens.position.set(0, 0.05, 0.18);
      headGroup.add(lens);
      // Dual swept sensor antenna fins
      for (const sx of [-0.18, 0.18]) {
        const fin = makeBox(0.04, 0.34, 0.12, brassMat, false);
        fin.position.set(sx, 0.24, -0.1);
        fin.rotation.set(-0.42, 0, sx < 0 ? 0.24 : -0.24);
        headGroup.add(fin);
      }
      bodyGroup.add(headGroup);
    } else if (arch === 4) {
      // Archetype 4: Civic Envoy (Founder / Speaker) — ceremonial brass mantle + radiant crest + charter scroll
      const robe = pick(new Mesh(shared.cylTaper, cloakMat));
      robe.scale.set(0.68, 0.88, 0.64);
      robe.position.y = 0.44;
      robe.castShadow = true;
      bodyGroup.add(robe);
      const mantle = pick(new Mesh(shared.torus, brassMat));
      mantle.rotation.x = Math.PI / 2;
      mantle.scale.setScalar(0.36);
      mantle.position.y = 0.86;
      bodyGroup.add(mantle);
      const sash = makeBox(0.14, 0.62, 0.04, brassMat, false);
      sash.position.set(0, 0.48, 0.29);
      bodyGroup.add(sash);

      headGroup.position.y = 1.08;
      const helm = pick(new Mesh(shared.sphere, trimMat));
      helm.scale.set(0.38, 0.42, 0.38);
      helm.position.y = 0.05;
      helm.castShadow = true;
      headGroup.add(helm);
      const brow = makeBox(0.3, 0.08, 0.12, glowMat, false);
      brow.position.set(0, 0.08, 0.16);
      headGroup.add(brow);
      const crest = new Mesh(shared.torusThin, brassMat);
      crest.scale.setScalar(0.3);
      crest.position.set(0, 0.14, -0.06);
      headGroup.add(crest);
      bodyGroup.add(headGroup);

      // Orbiting luminous charter scroll
      floatProp = new Group();
      floatProp.position.set(-0.4, 0.84, 0.22);
      floatProp.userData.baseY = 0.84;
      const scroll = makeCyl(0.055, 0.055, 0.36, glowMat, false, false);
      scroll.rotation.z = 0.38;
      floatProp.add(scroll);
      bodyGroup.add(floatProp);
    } else {
      // Archetype 5: Quartermaster Factor — strapped cargo rig + warm headlamp + supply canister pack
      const coat = pick(makeBox(0.56, 0.8, 0.42, cloakMat, true));
      coat.position.y = 0.42;
      bodyGroup.add(coat);
      const cargoPack = pick(makeBox(0.46, 0.56, 0.28, brassMat, true));
      cargoPack.position.set(0, 0.58, -0.32);
      bodyGroup.add(cargoPack);
      const cell = makeCyl(0.06, 0.06, 0.32, glowMat, false, false);
      cell.position.set(0.18, 0.86, -0.32);
      bodyGroup.add(cell);

      headGroup.position.y = 1.06;
      const hood = pick(makeCyl(0.24, 0.28, 0.36, trimMat, true, true));
      hood.position.y = 0.04;
      headGroup.add(hood);
      const goggle = pick(makeBox(0.34, 0.12, 0.14, glowMat, false));
      goggle.position.set(0, 0.05, 0.16);
      headGroup.add(goggle);
      bodyGroup.add(headGroup);

      // Hanging trade balance-lantern
      floatProp = new Group();
      floatProp.position.set(0.42, 0.72, 0.2);
      floatProp.userData.baseY = 0.72;
      const bar = makeBox(0.26, 0.035, 0.035, brassMat, false);
      floatProp.add(bar);
      const orb = new Mesh(shared.oct, new MeshStandardMaterial({
        color: 0xe6ff99, emissive: 0xc6ff3d, emissiveIntensity: 1.65, roughness: 0.16,
      }));
      orb.scale.setScalar(0.13);
      orb.position.set(0.11, -0.14, 0);
      floatProp.add(orb);
      bodyGroup.add(floatProp);
    }

    // Articulated right gesture/tool arm pivot (animates during walking & active verbs)
    const armGroup = new Group();
    armGroup.position.set(0.32, 0.74, 0.04);
    const upperArm = makeBox(0.11, 0.36, 0.11, trimMat, true);
    upperArm.position.set(0, -0.15, 0.06);
    upperArm.rotation.x = -0.35;
    armGroup.add(upperArm);
    const gauntlet = makeBox(0.09, 0.1, 0.12, brassMat, false);
    gauntlet.position.set(0, -0.3, 0.15);
    armGroup.add(gauntlet);
    bodyGroup.add(armGroup);

    // RFC-0144 §5: subtle category-only equipment silhouettes (tool / weapon / rig).
    const equipGroup = new Group();
    const toolProp = new Group();
    const toolShaft = makeCyl(0.025, 0.03, 0.42, brassMat, false);
    toolShaft.rotation.x = Math.PI * 0.34;
    toolShaft.position.set(0.32, 0.68, 0.16);
    const toolTip = new Mesh(shared.oct, glowMat);
    toolTip.scale.set(0.06, 0.08, 0.06);
    toolTip.position.set(0.32, 0.8, 0.32);
    toolProp.add(toolShaft, toolTip);
    toolProp.visible = false;

    const weaponProp = new Group();
    const lanceMat = new MeshStandardMaterial({ color: 0x3b2a34, emissive: 0xe07050, emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.78 });
    const lance = makeCyl(0.02, 0.032, 0.96, lanceMat, false);
    lance.rotation.z = 0.14;
    lance.position.set(-0.34, 0.78, -0.06);
    weaponProp.add(lance);
    weaponProp.visible = false;

    const rigProp = new Group();
    const rigFrame = makeBox(0.42, 0.38, 0.2, brassMat, false);
    rigFrame.position.set(0, 0.62, -0.28);
    rigProp.add(rigFrame);
    rigProp.visible = false;

    equipGroup.add(toolProp, weaponProp, rigProp);
    bodyGroup.add(equipGroup);

    return { root, bodyGroup, headGroup, armGroup, floatProp, ringMat, accent, equipProps: { tool: toolProp, weapon: weaponProp, rig: rigProp } };
  }

  /** Build diegetic verb VFX for an acting agent (beams, weld sparks, charter sigils, scanner cones, speech arcs). */
  function buildVerbVfx(state, act, targetPos, listenerState) {
    const cat = verbCategory(act && act.verb);
    if (!cat) return null;
    const vg = new Group();
    const entry = { group: vg, kind: cat, parts: [] };

    if (cat === "harvest" && targetPos) {
      // Dual-layer luminous cyan extraction/transfer beam + orbiting energy motes + target ring
      const dx = targetPos.x - state.x;
      const dz = targetPos.z - state.z;
      const dist = Math.max(0.4, Math.hypot(dx, dz));
      const yaw = Math.atan2(dx, dz);
      const midX = (state.x + targetPos.x) * 0.5;
      const midZ = (state.z + targetPos.z) * 0.5;

      const coreMat = new MeshBasicMaterial({
        color: 0xd8fbff, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false,
      });
      const coreBeam = new Mesh(shared.cyl, coreMat);
      coreBeam.scale.set(0.065, dist, 0.065);
      coreBeam.position.set(midX, 0.94, midZ);
      coreBeam.rotation.order = "YXZ";
      coreBeam.rotation.y = yaw;
      coreBeam.rotation.x = Math.PI / 2;
      coreBeam.raycast = () => {};
      vg.add(coreBeam);

      const sheathMat = new MeshBasicMaterial({
        color: 0x3ddcff, transparent: true, opacity: 0.34, blending: AdditiveBlending, depthWrite: false,
      });
      const sheath = new Mesh(shared.cyl, sheathMat);
      sheath.scale.set(0.18, dist, 0.18);
      sheath.position.set(midX, 0.94, midZ);
      sheath.rotation.order = "YXZ";
      sheath.rotation.y = yaw;
      sheath.rotation.x = Math.PI / 2;
      sheath.raycast = () => {};
      vg.add(sheath);

      const tRing = new Mesh(shared.ring, new MeshBasicMaterial({
        color: 0x3ddcff, transparent: true, opacity: 0.65, blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
      }));
      tRing.rotation.x = -Math.PI / 2;
      tRing.scale.setScalar(1.02);
      tRing.position.set(targetPos.x, 0.14, targetPos.z);
      tRing.raycast = () => {};
      vg.add(tRing);

      const moteMat = new MeshBasicMaterial({
        color: 0xc2f8ff, transparent: true, opacity: 0.95, blending: AdditiveBlending, depthWrite: false,
      });
      for (let i = 0; i < 6; i++) {
        const mote = new Mesh(shared.oct, moteMat);
        mote.scale.setScalar(0.125);
        mote.raycast = () => {};
        vg.add(mote);
        entry.parts.push({ mesh: mote, t0: i / 6, ax: state.x, az: state.z, bx: targetPos.x, bz: targetPos.z });
      }
    } else if (cat === "weld") {
      // Bright amber welding-arc beam + localized warm weld PointLight + rising spark shower
      const wx = targetPos ? targetPos.x : state.x + Math.sin(state.yaw) * 1.1;
      const wz = targetPos ? targetPos.z : state.z + Math.cos(state.yaw) * 1.1;
      const dx = wx - state.x;
      const dz = wz - state.z;
      const dist = Math.max(0.35, Math.hypot(dx, dz));
      const arcBeam = new Mesh(shared.cyl, new MeshBasicMaterial({
        color: 0xffe49c, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false,
      }));
      arcBeam.scale.set(0.055, dist, 0.055);
      arcBeam.position.set((state.x + wx) * 0.5, 0.92, (state.z + wz) * 0.5);
      arcBeam.rotation.order = "YXZ";
      arcBeam.rotation.y = Math.atan2(dx, dz);
      arcBeam.rotation.x = Math.PI / 2;
      arcBeam.raycast = () => {};
      vg.add(arcBeam);

      const weldLight = new PointLight(0xffaa30, 3.2, 7.5, 1.5);
      weldLight.position.set(wx, 1.15, wz);
      vg.add(weldLight);

      const flash = new Mesh(shared.oct, new MeshBasicMaterial({
        color: 0xfff0c0, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false,
      }));
      flash.scale.setScalar(0.24);
      flash.position.set(wx, 0.9, wz);
      flash.raycast = () => {};
      vg.add(flash);

      addHalo(vg, wx, 0.16, wz, 3.0, 0xffa62e, 0.58);
      const sparkMat = new MeshBasicMaterial({
        color: 0xffe28a, transparent: true, opacity: 0.96, blending: AdditiveBlending, depthWrite: false,
      });
      for (let i = 0; i < 10; i++) {
        const sp = new Mesh(shared.oct, sparkMat);
        sp.scale.setScalar(0.095);
        sp.raycast = () => {};
        vg.add(sp);
        entry.parts.push({ mesh: sp, wx, wz, phase: i * 0.63, ang: (i / 10) * Math.PI * 2 });
      }
      entry.flash = flash;
      entry.weldLight = weldLight;
    } else if (cat === "charter") {
      // Rotating golden charter sigil ring on the deck around the acting agent
      const sigilMat = new MeshBasicMaterial({
        color: 0xffc048, transparent: true, opacity: 0.84, blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
      });
      const outer = new Mesh(shared.torusThin, sigilMat);
      outer.rotation.x = Math.PI / 2;
      outer.scale.setScalar(1.12);
      outer.position.set(state.x, 0.06, state.z);
      outer.raycast = () => {};
      vg.add(outer);
      const inner = new Mesh(shared.ring, sigilMat);
      inner.rotation.x = -Math.PI / 2;
      inner.scale.setScalar(0.86);
      inner.position.set(state.x, 0.05, state.z);
      inner.raycast = () => {};
      vg.add(inner);
      entry.parts.push({ mesh: outer, spin: 0.9 }, { mesh: inner, spin: -0.65 });
    } else if (cat === "scan") {
      // Crisp translucent cyan fan scanner cone + glowing target floor scan ring + telemetry pips
      const coneMat = new MeshBasicMaterial({
        color: 0x3ddcff, transparent: true, opacity: 0.28, blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
      });
      const rimMat = new MeshBasicMaterial({
        color: 0x9ef4ff, transparent: true, opacity: 0.72, blending: AdditiveBlending, depthWrite: false, side: DoubleSide,
      });
      const pivot = new Group();
      pivot.position.set(state.x, 1.04, state.z);
      pivot.rotation.y = state.yaw;
      const cone = new Mesh(shared.scanCone, coneMat);
      cone.scale.set(1.22, 1.12, 1.22);
      cone.rotation.x = -Math.PI / 2 + 0.16;
      cone.position.set(0, -0.18, 1.48);
      cone.raycast = () => {};
      pivot.add(cone);

      const scanRim = new Mesh(shared.torusThin, rimMat);
      scanRim.scale.setScalar(1.25);
      scanRim.position.set(0, -0.44, 2.75);
      scanRim.raycast = () => {};
      pivot.add(scanRim);
      vg.add(pivot);

      const sx = targetPos ? targetPos.x : state.x + Math.sin(state.yaw) * 2.1;
      const sz = targetPos ? targetPos.z : state.z + Math.cos(state.yaw) * 2.1;
      const floorScan = new Mesh(shared.ring, rimMat);
      floorScan.rotation.x = -Math.PI / 2;
      floorScan.scale.setScalar(1.18);
      floorScan.position.set(sx, 0.13, sz);
      floorScan.raycast = () => {};
      vg.add(floorScan);
      addHalo(vg, sx, 0.08, sz, 2.8, 0x3ddcff, 0.34);

      entry.parts.push({ mesh: pivot, baseYaw: state.yaw, floorScan });
    } else if (cat === "message" && listenerState) {
      // Soft curved luminous conversational arc floating between speaker and listener
      const pts = [];
      const steps = 18;
      const ax = state.x; const az = state.z;
      const bx = listenerState.x; const bz = listenerState.z;
      const mx = (ax + bx) * 0.5;
      const mz = (az + bz) * 0.5;
      const arcH = 2.08 + Math.min(0.95, Math.hypot(bx - ax, bz - az) * 0.16);
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const inv = 1 - t;
        const x = inv * inv * ax + 2 * inv * t * mx + t * t * bx;
        const y = inv * inv * 1.44 + 2 * inv * t * arcH + t * t * 1.44;
        const z = inv * inv * az + 2 * inv * t * mz + t * t * bz;
        pts.push(new Vector3(x, y, z));
      }
      const lineGeo = new BufferGeometry().setFromPoints(pts);
      const lineMat = new LineBasicMaterial({
        color: state.accent, transparent: true, opacity: 0.82, blending: AdditiveBlending, depthWrite: false,
      });
      const arc = new Line(lineGeo, lineMat);
      arc.raycast = () => {};
      vg.add(arc);

      const midDot = new Mesh(shared.oct, new MeshBasicMaterial({
        color: state.accent, transparent: true, opacity: 0.9, blending: AdditiveBlending, depthWrite: false,
      }));
      midDot.scale.setScalar(0.11);
      midDot.position.set(mx, arcH * 0.5 + 0.72, mz);
      midDot.raycast = () => {};
      vg.add(midDot);
    }

    dynamicGroup.add(vg);
    return entry;
  }

  /** Sync live agents, smooth walking targets, nameplates, speech bubbles, and verb VFX. */
  function syncAgentsAndActivity(live, room) {
    // Dispose transient VFX from previous update; preserve persistent agent positions for smooth walking!
    for (const v of activeVfx) {
      disposeGroup(v.group);
      dynamicGroup.remove(v.group);
    }
    activeVfx = [];

    const roomId = room.room_id;
    const roomAgents = Array.isArray(live && live.agents)
      ? live.agents.filter((a) => a && a.room_id === roomId && a.label)
      : [];
    const byHandle = new Map();
    for (const a of roomAgents) byHandle.set(a.label, a);
    for (const h of Array.isArray(room.public_player_labels) ? room.public_player_labels : []) {
      if (h && !byHandle.has(h)) byHandle.set(h, { label: h, room_id: roomId });
    }

    // Collect latest room_activity per actor (preferring room.room_activity[], falling back to recent_events)
    const rawActivity = Array.isArray(room.room_activity) && room.room_activity.length
      ? room.room_activity
      : (Array.isArray(live && live.recent_events)
          ? live.recent_events.filter((e) => e && e.room_id === roomId)
          : []);
    const sortedActs = [...rawActivity].sort((a, b) => (b.sequence || 0) - (a.sequence || 0));
    const latestActByActor = new Map();
    const latestSpeechByActor = new Map();
    for (const act of sortedActs) {
      if (!act || !act.actor_label) continue;
      if (!latestActByActor.has(act.actor_label)) latestActByActor.set(act.actor_label, act);
      if (act.speech && !latestSpeechByActor.has(act.actor_label)) latestSpeechByActor.set(act.actor_label, act);
    }

    const activeHandles = Array.from(byHandle.keys());
    const activeSet = new Set(activeHandles);

    // Remove agents who left the room
    for (const [h, st] of agentStates) {
      if (!activeSet.has(h)) {
        disposeGroup(st.root);
        dynamicGroup.remove(st.root);
        agentStates.delete(h);
      }
    }

    // Curated scenic standing spots inside the room (generously spaced >= 4.2 units so rigs & speech bubbles never crowd)
    const plazaSpots = [
      [-2.8, 2.6], [2.8, 1.4], [0.2, 4.4], [-4.4, 4.0],
      [4.3, 3.8], [-3.2, -1.2], [3.4, -1.2], [0.0, 0.8],
    ];
    let speechRank = 0;

    // First pass: resolve target positions & build/update rigs
    activeHandles.forEach((handle, idx) => {
      const info = byHandle.get(handle) || {};
      const act = latestActByActor.get(handle) || null;
      const speechAct = latestSpeechByActor.get(handle) || null;
      const effVerb = (act && act.verb) || info.last_verb || (speechAct ? "message" : "");
      const effTargetLabel = (act && act.target_label) || info.last_target_label || "";
      const targetEnt = effTargetLabel ? entityPositions.get(normKey(effTargetLabel)) : null;

      let tx;
      let tz;
      let lookX = 0;
      let lookZ = -1.6;
      if (targetEnt) {
        // Stand facing the target workstation from the camera-friendly side
        const ang = (idx % 2 === 0 ? 0.65 : -0.65);
        tx = Math.max(-HALF_W + 1.3, Math.min(HALF_W - 1.3, targetEnt.x + Math.sin(ang) * 1.35));
        tz = Math.max(-HALF_D + 1.3, Math.min(HALF_D - 1.3, targetEnt.z + Math.cos(ang) * 1.35));
        lookX = targetEnt.x;
        lookZ = targetEnt.z;
      } else {
        const sp = plazaSpots[idx % plazaSpots.length];
        tx = sp[0];
        tz = sp[1];
      }

      let st = agentStates.get(handle);
      const isFollowed = !!followHandle && followHandle === handle;
      const eqCats = Array.isArray(info.equipped_categories) ? info.equipped_categories : [];
      if (!st) {
        const rig = buildAutomatonRig(handle, isFollowed);
        if (rig.equipProps) {
          rig.equipProps.tool.visible = eqCats.includes("tool");
          rig.equipProps.weapon.visible = eqCats.includes("weapon");
          rig.equipProps.rig.visible = eqCats.includes("rig");
        }
        // If newly arriving in an already-framed room, walk in smoothly from a portal edge!
        const spawnPortal = framed && !reduce && portalPositions.length ? portalPositions[idx % portalPositions.length] : null;
        const sx = spawnPortal ? spawnPortal.x * 0.85 : tx;
        const sz = spawnPortal ? spawnPortal.z * 0.85 : tz;
        rig.root.position.set(sx, 0, sz);
        dynamicGroup.add(rig.root);

        // Nameplate DOM chip
        const lbl = document.createElement("button");
        lbl.type = "button";
        lbl.className = "room3d-agent-label";
        lbl.dataset.handle = handle;
        const dot = document.createElement("span");
        dot.className = "room3d-dot";
        dot.style.background = hexCss(rig.accent);
        const nameSpan = document.createElement("span");
        nameSpan.className = "room3d-agent-name";
        nameSpan.textContent = handle;
        const verbSpan = document.createElement("span");
        verbSpan.className = "room3d-verb";
        lbl.append(dot, nameSpan, verbSpan);
        lbl.addEventListener("click", (ev) => {
          ev.stopPropagation();
          onFollowAgent(followHandle === handle ? "" : handle);
        });
        const labelObj = new CSS2DObject(lbl);
        labelObj.position.set(0, 1.98, 0);
        rig.root.add(labelObj);

        st = {
          handle,
          root: rig.root,
          rig,
          x: sx,
          z: sz,
          tx,
          tz,
          yaw: Math.atan2(lookX - sx, lookZ - sz),
          tyaw: Math.atan2(lookX - tx, lookZ - tz),
          accent: rig.accent,
          labelEl: lbl,
          verbSpan,
          labelObj,
          speechObj: null,
          phase: idx * 1.37,
          effAct: act || (effVerb ? { verb: effVerb, target_label: effTargetLabel } : null),
          speechAct,
          targetEnt,
        };
        agentStates.set(handle, st);
      } else {
        st.tx = tx;
        st.tz = tz;
        st.tyaw = Math.atan2(lookX - tx, lookZ - tz);
        st.effAct = act || (effVerb ? { verb: effVerb, target_label: effTargetLabel } : null);
        st.speechAct = speechAct;
        st.targetEnt = targetEnt;
        if (st.rig && st.rig.equipProps) {
          st.rig.equipProps.tool.visible = eqCats.includes("tool");
          st.rig.equipProps.weapon.visible = eqCats.includes("weapon");
          st.rig.equipProps.rig.visible = eqCats.includes("rig");
        }
        if (reduce) { st.x = tx; st.z = tz; st.yaw = st.tyaw; st.root.position.set(tx, 0, tz); }
      }

      // Update nameplate visual state & verb micro-tag
      st.labelEl.classList.toggle("is-followed", isFollowed);
      st.labelEl.dataset.priority = isFollowed ? "38" : "28";
      st.rig.ringMat.opacity = isFollowed ? 0.96 : 0.62;
      const vText = verbLabel(effVerb);
      st.verbSpan.textContent = vText ? ` · ${vText}` : "";
      st.verbSpan.style.display = vText ? "" : "none";

      // Diegetic resident speech bubble (.room3d-speech)
      if (st.speechObj) {
        if (st.speechObj.element && st.speechObj.element.parentNode) st.speechObj.element.remove();
        st.root.remove(st.speechObj);
        st.speechObj = null;
      }
      if (speechAct && speechAct.speech) {
        const bubble = document.createElement("div");
        bubble.className = "room3d-speech";
        bubble.dataset.priority = String(48 - Math.min(4, speechRank));
        bubble.style.setProperty("--speech-accent", hexCss(st.accent));
        bubble.style.maxWidth = frame.clientWidth > 0 && frame.clientWidth < 520 ? "185px" : "225px";
        if (speechAct.listener_label) {
          const to = document.createElement("span");
          to.className = "room3d-speech-meta";
          to.textContent = `${handle} → ${speechAct.listener_label}`;
          bubble.append(to);
        }
        const body = document.createElement("span");
        body.className = "room3d-speech-text";
        const rawText = String(speechAct.speech);
        body.textContent = `“${rawText.length > 105 ? rawText.slice(0, 103).trimEnd() + "…" : rawText}”`;
        bubble.append(body);
        const sObj = new CSS2DObject(bubble);
        // Stagger vertical height across simultaneous speakers so bubbles separate into clean tiers
        sObj.position.set(0, speechRank % 2 === 0 ? 2.65 : 3.55, 0);
        speechRank += 1;
        st.root.add(sObj);
        st.speechObj = sObj;
      }
    });

    // Second pass: orient conversational pairs toward each other, highlight active workstations & spawn verb VFX
    const activeTargets = new Set();
    for (const st of agentStates.values()) {
      if (st.targetEnt && st.targetEnt.label) activeTargets.add(normKey(st.targetEnt.label));
    }
    for (const [key, ent] of entityPositions) {
      if (!ent.trimMat) continue;
      const busy = activeTargets.has(key);
      ent.trimMat.color.setHex(ent.isSel ? 0xffb020 : busy ? 0x52f2ff : 0x3ddcff);
      ent.trimMat.opacity = ent.isSel ? 0.92 : busy ? 0.78 : 0.34;
    }
    for (const st of agentStates.values()) {
      const listener = st.speechAct && st.speechAct.listener_label
        ? agentStates.get(st.speechAct.listener_label)
        : null;
      if (listener) {
        st.tyaw = Math.atan2(listener.tx - st.tx, listener.tz - st.tz);
        if (reduce) st.yaw = st.tyaw;
      }
      st.root.rotation.y = st.yaw;
      const vfxAct = st.effAct || st.speechAct;
      if (vfxAct) {
        const v = buildVerbVfx(st, vfxAct, st.targetEnt, listener);
        if (v) activeVfx.push(v);
      }
      // If speaking AND also has another deed, still draw the subtle conversation arc
      if (st.speechAct && st.effAct && st.speechAct !== st.effAct && listener) {
        const arcVfx = buildVerbVfx(st, { verb: "message" }, null, listener);
        if (arcVfx) activeVfx.push(arcVfx);
      }
    }

    // Reconcile unnamed agents (counted in players_present without public handles)
    for (const prevRoot of unnamedRigs) {
      disposeGroup(prevRoot);
      dynamicGroup.remove(prevRoot);
    }
    unnamedRigs = [];
    const unnamed = Math.max(0, (room.players_present || 0) - activeHandles.length);
    for (let u = 0; u < Math.min(unnamed, 4); u++) {
      const sp = plazaSpots[(activeHandles.length + u) % plazaSpots.length];
      const rig = buildAutomatonRig("", false);
      rig.root.position.set(sp[0], 0, sp[1]);
      rig.root.rotation.y = Math.atan2(-sp[0], -1.6 - sp[1]);
      dynamicGroup.add(rig.root);
      unnamedRigs.push(rig.root);
    }
  }

  function presetView(preset) {
    const aspect = Math.max(0.42, camera.aspect || 1.6);
    const distScale = aspect < 0.85 ? Math.min(2.15, 1.38 / aspect) : aspect < 1.15 ? 1.18 : 1.02;
    const target = new Vector3(-0.2, 1.02, -0.35);
    let offset;
    if (preset === 2) offset = new Vector3(11.4, 5.8, 12.2).multiplyScalar(distScale); // Low dramatic tabletop
    else if (preset === 3) offset = new Vector3(4.2, 20.5, 6.4).multiplyScalar(distScale); // High tactical
    else offset = new Vector3(13.2, 11.0, 14.0).multiplyScalar(distScale); // 1: Classic 3/4 isometric
    return { target, position: target.clone().add(offset) };
  }

  function defaultView() {
    return presetView(1);
  }

  function agentFocusView(st) {
    const target = new Vector3(st.tx, 1.25, st.tz);
    const offset = new Vector3(5.6, 4.9, 6.2);
    return { target, position: target.clone().add(offset) };
  }

  function easeTo(toTarget, toPos, ms) {
    tween = {
      start: performance.now(),
      ms: reduce ? 0 : (ms || 560),
      fromTarget: controls.target.clone(),
      toTarget,
      fromPos: camera.position.clone(),
      toPos,
    };
    request();
  }

  function followAgent(handle) {
    if (disposed) return;
    followHandle = String(handle || "");
    spectatorMoved = false;
    if (lastLive && currentRoomId) {
      const room = (lastLive.rooms || []).find((r) => r.room_id === currentRoomId);
      if (room) syncAgentsAndActivity(lastLive, room);
    }
    const st = followHandle ? agentStates.get(followHandle) : null;
    if (st) {
      const v = agentFocusView(st);
      easeTo(v.target, v.position, 520);
    } else {
      const v = defaultView();
      easeTo(v.target, v.position, 520);
    }
    request();
  }

  function reset() {
    if (disposed) return;
    spectatorMoved = false;
    const v = defaultView();
    easeTo(v.target, v.position, 520);
  }

  function pause(on) {
    paused = !!on;
    if (!paused) request();
  }

  function size() {
    if (disposed) return;
    const w = Math.max(1, frame.clientWidth);
    const h = Math.max(1, frame.clientHeight);
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (framed && !spectatorMoved && !tween && !followHandle) {
      const v = defaultView();
      controls.target.copy(v.target);
      camera.position.copy(v.position);
      controls.update();
    }
    declutterDirty = true;
    request();
  }

  function request() {
    if (disposed || frameId) return;
    if (document.hidden) { dirty = true; return; }
    frameId = requestAnimationFrame(draw);
  }

  const SVG_NS = "http://www.w3.org/2000/svg";
  const leaderSvg = typeof document.createElementNS === "function" ? document.createElementNS(SVG_NS, "svg") : null;
  if (leaderSvg) {
    leaderSvg.setAttribute("class", "room3d-leaders");
    leaderSvg.setAttribute("aria-hidden", "true");
    labelRoot.appendChild(leaderSvg);
  }

  /** Screen-space decluttering + crisp SVG leader stems when speech bubbles shift from their speaker. */
  function declutter() {
    if (leaderSvg) while (leaderSvg.firstChild) leaderSvg.removeChild(leaderSvg.firstChild);
    const els = Array.from(
      labelRoot.querySelectorAll(".room3d-speech, .room3d-agent-label, .room3d-portal, .room3d-entity, .room3d-trace"),
    );
    els.sort((a, b) => Number(b.dataset.priority || 0) - Number(a.dataset.priority || 0));
    const fr = frame.getBoundingClientRect();
    if (leaderSvg && fr.width > 10 && fr.height > 10) {
      leaderSvg.setAttribute("viewBox", `0 0 ${Math.round(fr.width)} ${Math.round(fr.height)}`);
    }
    const placed = [];
    const padX = 10;
    const padY = 8;
    const overlaps = (a, b) =>
      a.left < b.right + padX && a.right > b.left - padX && a.top < b.bottom + padY && a.bottom > b.top - padY;
    const overlapArea = (a, b) => {
      const ox = Math.min(a.right + padX, b.right + padX) - Math.max(a.left - padX, b.left - padX);
      const oy = Math.min(a.bottom + padY, b.bottom + padY) - Math.max(a.top - padY, b.top - padY);
      return ox > 0 && oy > 0 ? ox * oy : 0;
    };
    const clamp = (base, ox, oy, maxShift) => {
      const mag = Math.hypot(ox, oy);
      if (mag > maxShift) { ox = (ox / mag) * maxShift; oy = (oy / mag) * maxShift; }
      if (fr.width > 60 && fr.height > 60) {
        const minOx = (fr.left + 8) - base.left;
        const maxOx = (fr.right - 8) - base.right;
        const minOy = (fr.top + 8) - base.top;
        const maxOy = (fr.bottom - 8) - base.bottom;
        if (minOx <= maxOx) ox = Math.max(minOx, Math.min(maxOx, ox));
        if (minOy <= maxOy) oy = Math.max(minOy, Math.min(maxOy, oy));
      }
      return [ox, oy];
    };
    const offsets = [
      [0, 0], [0, -34], [0, 34], [-54, -26], [54, -26], [0, -68], [0, 68],
      [-92, -36], [92, -36], [-115, 0], [115, 0], [0, -104], [-96, -78], [96, -78],
      [-145, -48], [145, -48], [0, 102], [-150, 26], [150, 26],
    ];

    for (const el of els) {
      el.style.marginLeft = "";
      el.style.marginTop = "";
      const base = el.getBoundingClientRect();
      if (base.width <= 0 || base.height <= 0) continue;
      const isSpeech = el.classList.contains("room3d-speech");
      const maxShift = isSpeech ? 220 : 120;
      let ox = 0;
      let oy = 0;
      let box = { left: base.left, right: base.right, top: base.top, bottom: base.bottom };
      let clear = !placed.some((p) => overlaps(box, p));
      let bestOx = 0;
      let bestOy = 0;
      let bestBox = box;
      let bestScore = Infinity;

      if (!clear) {
        for (const [cx0, cy0] of offsets) {
          const [tx, ty] = clamp(base, cx0, cy0, maxShift);
          const tb = { left: base.left + tx, right: base.right + tx, top: base.top + ty, bottom: base.bottom + ty };
          let area = 0;
          for (const p of placed) area += overlapArea(tb, p);
          const score = area * 120 + Math.hypot(tx, ty);
          if (area === 0) {
            ox = tx; oy = ty; box = tb; clear = true; break;
          }
          if (score < bestScore) { bestScore = score; bestOx = tx; bestOy = ty; bestBox = tb; }
        }
      }
      if (!clear) {
        // Iterative repulsion fallback guarantees zero residual overlap
        ox = bestOx; oy = bestOy; box = bestBox;
        for (let iter = 0; iter < 10; iter++) {
          let dx = 0; let dy = 0; let hits = 0;
          for (const p of placed) {
            if (!overlaps(box, p)) continue;
            hits++;
            const ovX = Math.min(box.right + padX - p.left, p.right + padX - box.left);
            const ovY = Math.min(box.bottom + padY - p.top, p.bottom + padY - box.top);
            const cx = (box.left + box.right) * 0.5 - (p.left + p.right) * 0.5;
            const cy = (box.top + box.bottom) * 0.5 - (p.top + p.bottom) * 0.5;
            if (ovY <= ovX * 1.15) dy += (cy === 0 ? -1 : Math.sign(cy)) * (ovY + 4);
            else dx += (cx === 0 ? 1 : Math.sign(cx)) * (ovX + 6);
          }
          if (!hits) { clear = true; break; }
          [ox, oy] = clamp(base, ox + dx, oy + dy, maxShift);
          box = { left: base.left + ox, right: base.right + ox, top: base.top + oy, bottom: base.bottom + oy };
          let area = 0;
          for (const p of placed) area += overlapArea(box, p);
          const score = area * 120 + Math.hypot(ox, oy);
          if (area === 0) { clear = true; break; }
          if (score < bestScore) { bestScore = score; bestOx = ox; bestOy = oy; bestBox = box; }
        }
      }
      const fx = clear ? ox : bestOx;
      const fy = clear ? oy : bestOy;
      const fbox = clear ? box : bestBox;
      if (Math.abs(fx) >= 1) el.style.marginLeft = Math.round(fx) + "px";
      if (Math.abs(fy) >= 1) el.style.marginTop = Math.round(fy) + "px";
      if (leaderSvg && isSpeech && Math.hypot(fx, fy) > 28 && fr.width > 10) {
        const ax = (base.left + base.right) * 0.5 - fr.left;
        const ay = base.bottom - fr.top;
        const bx = (fbox.left + fbox.right) * 0.5 - fr.left;
        const by = fbox.bottom - fr.top;
        const accent = el.style.getPropertyValue("--speech-accent") || "#3ddcff";
        const ln = document.createElementNS(SVG_NS, "line");
        ln.setAttribute("x1", ax.toFixed(1));
        ln.setAttribute("y1", ay.toFixed(1));
        ln.setAttribute("x2", bx.toFixed(1));
        ln.setAttribute("y2", by.toFixed(1));
        ln.setAttribute("stroke", accent);
        ln.setAttribute("stroke-opacity", "0.52");
        ln.setAttribute("stroke-width", "1.2");
        ln.setAttribute("stroke-dasharray", "3 3");
        const dot = document.createElementNS(SVG_NS, "circle");
        dot.setAttribute("cx", ax.toFixed(1));
        dot.setAttribute("cy", ay.toFixed(1));
        dot.setAttribute("r", "2.6");
        dot.setAttribute("fill", accent);
        dot.setAttribute("fill-opacity", "0.8");
        leaderSvg.append(ln, dot);
      }
      placed.push(fbox);
    }
  }

  let lastFrameAt = 0;

  function draw(now) {
    frameId = 0;
    if (disposed) return;
    const dt = lastFrameAt ? Math.min(0.05, (now - lastFrameAt) * 0.001) : 0.016;
    lastFrameAt = now;
    const sec = now * 0.001;
    let busy = false;

    if (tween) {
      const t = tween.ms > 0 ? Math.min(1, (now - tween.start) / tween.ms) : 1;
      const k = easeOut(t);
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, k);
      camera.position.lerpVectors(tween.fromPos, tween.toPos, k);
      controls.update();
      if (t >= 1) tween = null;
      else busy = true;
    }

    if (!reduce && !paused) {
      // Animate room centerpiece machinery (rotating turbine rings, dishes, floating codex/ledger prisms)
      for (const prop of roomAnimProps) {
        if (prop.userData.spin) prop.rotation.y = sec * prop.userData.spin;
        if (prop.userData.bobY !== undefined) {
          prop.position.y = prop.userData.bobY + Math.sin(sec * 1.9) * 0.09;
        }
      }

      // Smooth agent walking, turning, breathing & floating props
      let anyWalking = false;
      for (const st of agentStates.values()) {
        const dx = st.tx - st.x;
        const dz = st.tz - st.z;
        const dist = Math.hypot(dx, dz);
        let walking = false;
        if (dist > 0.04) {
          walking = true;
          anyWalking = true;
          const step = Math.min(dist, dt * 2.6);
          st.x += (dx / dist) * step;
          st.z += (dz / dist) * step;
          st.root.position.set(st.x, 0, st.z);
          const walkYaw = Math.atan2(dx, dz);
          st.yaw += Math.atan2(Math.sin(walkYaw - st.yaw), Math.cos(walkYaw - st.yaw)) * Math.min(1, dt * 8);
        } else {
          st.yaw += Math.atan2(Math.sin(st.tyaw - st.yaw), Math.cos(st.tyaw - st.yaw)) * Math.min(1, dt * 5);
        }
        st.root.rotation.y = st.yaw;
        // Stride bob + subtle forward lean & lateral roll when walking; gentle breathing + working sway when idle
        st.rig.bodyGroup.position.y = 0.09 + (walking
          ? Math.abs(Math.sin(sec * 9.5 + st.phase)) * 0.085
          : Math.sin(sec * 2.1 + st.phase) * 0.024);
        st.rig.bodyGroup.rotation.x = walking
          ? 0.09
          : (st.effAct ? Math.sin(sec * 3.8 + st.phase) * 0.04 : 0);
        st.rig.bodyGroup.rotation.z = walking ? Math.sin(sec * 9.5 + st.phase) * 0.055 : 0;
        if (st.rig.headGroup) {
          st.rig.headGroup.rotation.y = walking ? 0 : Math.sin(sec * 1.15 + st.phase) * 0.14;
        }
        if (st.rig.armGroup) {
          st.rig.armGroup.rotation.x = walking
            ? Math.sin(sec * 9.5 + st.phase) * 0.42
            : (st.effAct ? -0.45 + Math.sin(sec * 5.2 + st.phase) * 0.24 : Math.sin(sec * 1.6 + st.phase) * 0.08);
        }
        if (st.rig.floatProp && st.rig.floatProp.userData.baseY !== undefined) {
          st.rig.floatProp.position.y = st.rig.floatProp.userData.baseY
            + Math.sin(sec * 2.8 + st.phase) * 0.025;
        }
        if (followHandle === st.handle && !spectatorMoved && !tween && walking) {
          controls.target.lerp(new Vector3(st.x, 1.25, st.z), Math.min(1, dt * 4));
        }
      }
      if (anyWalking) {
        shadowsDirty = true;
        declutterDirty = true;
      }

      // Animate verb VFX (harvest beam motes, weld sparks, charter sigil rotation, scanner sweep)
      for (const v of activeVfx) {
        if (v.kind === "harvest") {
          for (const p of v.parts) {
            const t = (sec * 0.72 + p.t0) % 1;
            p.mesh.position.set(
              p.bx + (p.ax - p.bx) * t,
              0.92 + Math.sin(t * Math.PI * 3) * 0.14,
              p.bz + (p.az - p.bz) * t,
            );
          }
        } else if (v.kind === "weld") {
          for (const p of v.parts) {
            const t = (sec * 1.95 + p.phase) % 1;
            const r = 0.14 + t * 0.72;
            p.mesh.position.set(
              p.wx + Math.cos(p.ang + sec * 2.4) * r,
              0.8 + t * 1.05 - t * t * 0.55,
              p.wz + Math.sin(p.ang + sec * 2.4) * r,
            );
            p.mesh.scale.setScalar(0.11 * (1 - t * 0.72));
          }
          if (v.flash) v.flash.scale.setScalar(0.2 + Math.abs(Math.sin(sec * 18)) * 0.14);
          if (v.weldLight) v.weldLight.intensity = 2.6 + Math.abs(Math.sin(sec * 16)) * 1.4;
        } else if (v.kind === "charter") {
          for (const p of v.parts) p.mesh.rotation.z = sec * p.spin;
        } else if (v.kind === "scan") {
          for (const p of v.parts) {
            p.mesh.rotation.y = p.baseYaw + Math.sin(sec * 1.45) * 0.5;
            if (p.floorScan) p.floorScan.scale.setScalar(1.08 + Math.sin(sec * 3.0) * 0.12);
          }
        }
      }

      if (!document.hidden) busy = true;
    }

    if (controls.enableDamping) controls.update();
    if (shadowsDirty) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    renderer.render(scene, camera);
    labels.render(scene, camera);
    if (declutterDirty || tween) {
      declutter();
      declutterDirty = false;
    }
    if (busy) request();
  }

  function update(live, roomId, nextCtx) {
    if (disposed || !live || !roomId) return;
    lastLive = live;
    lastCtx = nextCtx || {};
    const prevRoomId = currentRoomId;
    const prevFollow = followHandle;
    if (typeof lastCtx.followHandle === "string") followHandle = lastCtx.followHandle;
    if (typeof lastCtx.selectedEntity === "string") selectedEntity = lastCtx.selectedEntity;

    const room = (live.rooms || []).find((r) => r && r.room_id === roomId);
    if (!room) return;

    const mapRoom = (lastCtx.map && lastCtx.map.base && Array.isArray(lastCtx.map.base.rooms))
      ? lastCtx.map.base.rooms.find((r) => r && r.room_id === roomId)
      : null;
    const bands = {
      pressure: room.pressure_band
        ? String(room.pressure_band)
        : (mapRoom && mapRoom.pressure_band ? String(mapRoom.pressure_band) : ""),
      scar: room.scar_band
        ? String(room.scar_band)
        : (mapRoom && mapRoom.scar_band ? String(mapRoom.scar_band) : ""),
    };

    const sig = JSON.stringify({
      roomId,
      bands,
      fossil: Boolean(room.scar_fossilized),
      lore: room.lore_state ? `${room.lore_state}:${room.lore_label || ""}` : "",
      tradition: room.tradition_status ? `${room.tradition_status}:${Boolean(room.tradition_inherited)}:${Boolean(room.tradition_schism)}` : "",
      selectedEntity,
      exits: (room.exits || []).map((x) => `${x.direction}:${x.to_room_id}:${x.to_room_name}`),
      entities: (room.entities || []).map((e) => `${e.label}:${e.entity_type}`),
      traces: (room.traces || []).slice(0, 4).map((t) => (typeof t === "string" ? t : `${t.kind}:${t.text}`)),
    });

    const roomChanged = roomId !== prevRoomId;
    if (roomChanged) {
      currentRoomId = roomId;
      clearDynamic();
    }

    if (sig !== currentRoomSig) {
      currentRoomSig = sig;
      clearRoomShell();
      const theme = roomTheme(roomId);
      hearth.color.setHex(bands.pressure === "high" ? 0xff8818 : theme.hearthHex);
      hearth.intensity = theme.hearthInt + (bands.pressure === "high" ? 1.2 : bands.pressure === "moderate" ? 0.6 : 0);
      fillLight.color.setHex(bands.scar === "deep" ? 0x9b6dff : theme.accent);

      buildCutawayShell(roomGroup, theme, bands);
      buildRoomCenterpiece(roomGroup, theme);
      buildExitPortals(roomGroup, room.exits || []);
      buildEntities(roomGroup, room.entities || []);
      buildTracePlaques(roomGroup, room.traces || []);
      buildDeepTimeProps(roomGroup, room, bands);
      shadowsDirty = true;
    }

    syncAgentsAndActivity(live, room);
    shadowsDirty = true;
    declutterDirty = true;

    if (!framed || roomChanged) {
      framed = true;
      spectatorMoved = false;
      const st = followHandle ? agentStates.get(followHandle) : null;
      const v = st ? agentFocusView(st) : defaultView();
      if (roomChanged && prevRoomId && !reduce) {
        easeTo(v.target, v.position, 480);
      } else {
        controls.target.copy(v.target);
        camera.position.copy(v.position);
        controls.update();
      }
    } else if (followHandle !== prevFollow) {
      spectatorMoved = false;
      const st = followHandle ? agentStates.get(followHandle) : null;
      const v = st ? agentFocusView(st) : defaultView();
      easeTo(v.target, v.position, 520);
    }

    request();
  }

  // Raycast picking on canvas: click portals -> navigate, click agents -> follow, click entities -> select
  const ray = new Raycaster();
  const ndc = new Vector2();
  let down = null;
  const onDown = (ev) => { down = { x: ev.clientX, y: ev.clientY }; };
  const onUp = (ev) => {
    if (!down || Math.hypot(ev.clientX - down.x, ev.clientY - down.y) > 5) { down = null; return; }
    down = null;
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects([dynamicGroup, roomGroup], true);
    for (const h of hits) {
      const ud = h.object && h.object.userData;
      if (!ud) continue;
      if (ud.agentHandle) { onFollowAgent(followHandle === ud.agentHandle ? "" : ud.agentHandle); return; }
      if (ud.exitRoomId) { onNavigateRoom(ud.exitRoomId); return; }
      if (ud.entityLabel) { onSelectEntity(ud.entityLabel); return; }
    }
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  controls.addEventListener("start", () => { spectatorMoved = true; tween = null; });
  controls.addEventListener("change", () => { declutterDirty = true; request(); });

  const onKeyPreset = (ev) => {
    const tag = ev.target && ev.target.tagName ? String(ev.target.tagName).toLowerCase() : "";
    if (tag === "input" || tag === "textarea" || tag === "select") return;
    if (ev.key === "1" || ev.key === "2" || ev.key === "3") {
      spectatorMoved = false;
      const v = presetView(Number(ev.key));
      easeTo(v.target, v.position, 460);
    }
  };
  frame.addEventListener("keydown", onKeyPreset);

  const resetBtn = opts.reset;
  const onReset = () => reset();
  if (resetBtn) resetBtn.addEventListener("click", onReset);

  const onVisible = () => { if (!document.hidden && dirty) { dirty = false; request(); } };
  document.addEventListener("visibilitychange", onVisible);

  const onContextLost = (ev) => { ev.preventDefault(); onLost(); };
  canvas.addEventListener("webglcontextlost", onContextLost);

  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(size) : null;
  if (ro) ro.observe(frame);
  else window.addEventListener("resize", size);
  size();

  function dispose() {
    if (disposed) return;
    disposed = true;
    if (frameId) cancelAnimationFrame(frameId);
    clearDynamic();
    clearRoomShell();
    disposeGroup(envGroup);
    if (sun.shadow && typeof sun.shadow.dispose === "function") sun.shadow.dispose();
    if (typeof hemi.dispose === "function") hemi.dispose();
    if (typeof sun.dispose === "function") sun.dispose();
    if (typeof rim.dispose === "function") rim.dispose();
    if (typeof hearth.dispose === "function") hearth.dispose();
    if (typeof fillLight.dispose === "function") fillLight.dispose();
    if (typeof coveBounce.dispose === "function") coveBounce.dispose();
    for (const geo of Object.values(shared)) geo.dispose();
    if (haloTexture) haloTexture.dispose();
    if (shaftTexture) shaftTexture.dispose();
    if (skyTexture) skyTexture.dispose();
    for (const pbr of floorPbrCache.values()) if (pbr) pbr.dispose();
    floorPbrCache.clear();
    if (wallTex) wallTex.dispose();
    if (envRig) envRig.dispose();
    controls.dispose();
    controls.stopListenToKeyEvents();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    frame.removeEventListener("keydown", onKeyPreset);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    document.removeEventListener("visibilitychange", onVisible);
    if (resetBtn) resetBtn.removeEventListener("click", onReset);
    if (ro) ro.disconnect();
    else window.removeEventListener("resize", size);
    labelRoot.replaceChildren();
    try {
      const gl = renderer.getContext();
      if (gl && typeof gl.pixelStorei === "function") {
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      }
    } catch (e) {}
    renderer.dispose();
  }

  return { update, followAgent, reset, dispose, pause };
}

window.NoemaWatchRoomStage = { mount };
