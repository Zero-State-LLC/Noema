/**
 * WATCH Chamber stage renderer (Noema-Specs specify/watch-single-3d-stage.md).
 * Bundled to /assets/watch-stage.js and loaded only when the spectator picks 3D.
 * Draws on demand: respects reduced motion and never draws for a hidden
 * document (WS3-08). Labels are DOM text; the Places list stays the authority.
 */
import {
  ACESFilmicToneMapping, AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry,
  CanvasTexture, Color, ConeGeometry, CylinderGeometry, DirectionalLight, DoubleSide, EdgesGeometry,
  FogExp2, Group, HemisphereLight, Line, LineBasicMaterial, LineDashedMaterial, LineSegments, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PCFShadowMap, PerspectiveCamera,
  PlaneGeometry, PointLight, Points, PointsMaterial, Raycaster, RepeatWrapping, RingGeometry,
  SRGBColorSpace, Scene, TorusGeometry, Vector2, Vector3, WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import {
  STAGE_CAMERA_EASE_MS,
  STAGE_GLOW,
  STAGE_MAJOR_MOMENT_MS,
  STAGE_PLAYBACK,
  STAGE_TRAVEL_MS,
  buildStageModel,
  newStageCaptions,
  newStagePulses,
  stageBandLine,
  stageCameraLimits,
  stageCameraTarget,
  stageDefaultView,
  stageDirectorPick,
  stageGlowLevel,
  stageHandleSites,
  stageLitRoutes,
  stagePlaybackOffset,
  stagePlaybackSchedule,
  stageTravels,
} from "./watch-stage-model";

const LIFT = { NORMAL: 0.25, NOTABLE: 0.45, MAJOR: 0.7 };
/** Pressure warms the plate toward the warning colour; scar residue strengthens its violet outline. */
const PRESSURE_MIX = { low: 0.14, moderate: 0.28, high: 0.42 };
const SCAR_OPACITY = { faint: 0.45, marked: 0.7, deep: 1 };
const PLATE = 2.4;
const UP = new Vector3(0, 1, 0);
const CAMERA_KEYS = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

function token(name, fallback) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  } catch (e) {
    return fallback;
  }
}

function palette() {
  return {
    world: new Color(token("--color-surface-world", "#111720")),
    plate: new Color("#435364"),
    raised: new Color("#566A7E"),
    edge: new Color("#9BA8B4"),
    ink: new Color(token("--color-text-primary", "#F0EAE0")),
    active: new Color(token("--color-state-active", "#3DDCFF")),
    warning: new Color(token("--color-state-warning", "#FFB020")),
    social: new Color(token("--color-state-social", "#D4B68A")),
    unknown: new Color(token("--color-state-unknown", "#A67BFF")),
    machine: new Color(token("--color-text-machine", "#A4C6D4")),
    route: new Color("#6B8698"),
  };
}

const AGENT_COLORS = [0x3ddcff, 0xffb020, 0x52e5a8, 0xb68cff, 0xff6b8b, 0x70b8ff];
function agentAccent(handle) {
  if (!handle) return 0xc9ac82;
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  return AGENT_COLORS[h % AGENT_COLORS.length];
}

function makeCanvas(w, h) {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx2d = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
    if (!ctx2d) return null;
    return { canvas, ctx2d };
  } catch (e) {
    return null;
  }
}

/** Deterministic PRNG for procedural textures and terrain features. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * D6 static glow: velvety multi-stop radial-gradient halo texture per mount.
 * Returns null when a 2D context is unavailable, which skips glow cleanly.
 */
function makeHaloTexture() {
  const c = makeCanvas(128, 128);
  if (!c) return null;
  const { canvas, ctx2d } = c;
  const grad = ctx2d.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.16, "rgba(255,255,255,0.88)");
  grad.addColorStop(0.36, "rgba(255,255,255,0.44)");
  grad.addColorStop(0.64, "rgba(255,255,255,0.14)");
  grad.addColorStop(0.86, "rgba(255,255,255,0.03)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx2d.fillStyle = grad;
  ctx2d.fillRect(0, 0, 128, 128);
  return new CanvasTexture(canvas);
}

/** Soft upward volumetric light-curtain texture for active/followed/MAJOR sites. */
function makeBeaconTexture() {
  const c = makeCanvas(64, 128);
  if (!c) return null;
  const { canvas, ctx2d } = c;
  const grad = ctx2d.createLinearGradient(0, 128, 0, 0);
  grad.addColorStop(0, "rgba(255,255,255,0.85)");
  grad.addColorStop(0.28, "rgba(255,255,255,0.34)");
  grad.addColorStop(0.65, "rgba(255,255,255,0.09)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx2d.fillStyle = grad;
  ctx2d.fillRect(0, 0, 64, 128);
  // Subtle vertical light shafts
  ctx2d.globalCompositeOperation = "multiply";
  const shaft = ctx2d.createLinearGradient(0, 0, 64, 0);
  shaft.addColorStop(0, "rgba(180,180,180,1)");
  shaft.addColorStop(0.25, "rgba(255,255,255,1)");
  shaft.addColorStop(0.5, "rgba(195,195,195,1)");
  shaft.addColorStop(0.75, "rgba(255,255,255,1)");
  shaft.addColorStop(1, "rgba(180,180,180,1)");
  ctx2d.fillStyle = shaft;
  ctx2d.fillRect(0, 0, 64, 128);
  return new CanvasTexture(canvas);
}

/** Atmospheric twilight frontier horizon backdrop gradient with faint stars. */
function makeHorizonTexture() {
  const c = makeCanvas(256, 256);
  if (!c) return null;
  const { canvas, ctx2d } = c;
  const grad = ctx2d.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#0b111c");
  grad.addColorStop(0.32, "#152132");
  grad.addColorStop(0.58, "#243342");
  grad.addColorStop(0.76, "#43382e");
  grad.addColorStop(0.88, "#62452b");
  grad.addColorStop(1, "#26201c");
  ctx2d.fillStyle = grad;
  ctx2d.fillRect(0, 0, 256, 256);
  const rand = mulberry32(4117);
  for (let i = 0; i < 110; i++) {
    const x = rand() * 256;
    const y = rand() * 135;
    const a = 0.22 + rand() * 0.65;
    ctx2d.fillStyle = `rgba(236,242,252,${a.toFixed(2)})`;
    ctx2d.fillRect(x, y, rand() > 0.78 ? 1.6 : 1, rand() > 0.78 ? 1.6 : 1);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Procedural basalt/obsidian planetary basin albedo + bump texture (512x512). */
function makeTerrainTextures() {
  const albedo = makeCanvas(512, 512);
  const bump = makeCanvas(512, 512);
  if (!albedo || !bump) return null;
  const ctx = albedo.ctx2d;
  const bctx = bump.ctx2d;

  // Sculpted volcanic basalt basin transitioning to warm ochre-sienna canyon ridges
  const baseGrad = ctx.createRadialGradient(256, 256, 16, 256, 256, 256);
  baseGrad.addColorStop(0, "#232a35");
  baseGrad.addColorStop(0.22, "#292c34");
  baseGrad.addColorStop(0.38, "#3e3229");
  baseGrad.addColorStop(0.62, "#513c2c");
  baseGrad.addColorStop(0.84, "#3b2c22");
  baseGrad.addColorStop(1, "#221c19");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, 512, 512);

  bctx.fillStyle = "#808080";
  bctx.fillRect(0, 0, 512, 512);

  // Warm ochre & cool slate mineral strata patches
  const rand = mulberry32(9021);
  for (let i = 0; i < 72; i++) {
    const ang = rand() * Math.PI * 2;
    const dist = 76 + rand() * 170;
    const x = 256 + Math.cos(ang) * dist;
    const y = 256 + Math.sin(ang) * dist;
    const r = 20 + rand() * 48;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const warm = rand() > 0.3;
    g.addColorStop(0, warm ? "rgba(186,128,74,0.22)" : "rgba(74,126,154,0.16)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // Sunken architectural foundation shadow beneath the settlement basin (128u plane -> 15u = 60px)
  const sink = ctx.createRadialGradient(256, 256, 14, 256, 256, 66);
  sink.addColorStop(0, "rgba(10,14,22,0.46)");
  sink.addColorStop(0.8, "rgba(12,16,24,0.28)");
  sink.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sink;
  ctx.fillRect(184, 184, 144, 144);

  // Crisp concentric topographic contour rings & survey arcs centered on Perihelion Reach
  ctx.lineWidth = 1.25;
  bctx.lineWidth = 1.5;
  for (let r = 20; r <= 240; r += 12) {
    const inBasin = r < 62;
    ctx.strokeStyle = inBasin ? "rgba(224,186,130,0.24)" : "rgba(238,188,128,0.19)";
    bctx.strokeStyle = inBasin ? "rgba(56,56,56,0.52)" : "rgba(196,196,196,0.4)";
    ctx.beginPath();
    bctx.beginPath();
    for (let a = 0; a <= 72; a++) {
      const th = (a / 72) * Math.PI * 2;
      const wob = inBasin ? 0 : Math.sin(th * 5 + r * 0.08) * 3.0 + Math.cos(th * 3 - r * 0.05) * 2.2;
      const px = 256 + Math.cos(th) * (r + wob);
      const py = 256 + Math.sin(th) * (r + wob);
      if (a === 0) { ctx.moveTo(px, py); bctx.moveTo(px, py); }
      else { ctx.lineTo(px, py); bctx.lineTo(px, py); }
    }
    ctx.stroke();
    bctx.stroke();
  }

  // Radial brass cartographic survey lines & cyan settlement boundary arc
  ctx.strokeStyle = "rgba(218,178,122,0.2)";
  ctx.lineWidth = 1.0;
  for (let i = 0; i < 12; i++) {
    const th = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(256 + Math.cos(th) * 18, 256 + Math.sin(th) * 18);
    ctx.lineTo(256 + Math.cos(th) * 110, 256 + Math.sin(th) * 110);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(92,216,255,0.26)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(256, 256, 56, 0, Math.PI * 2);
  ctx.stroke();

  // Fine mineral grain for both albedo and bump relief
  for (let i = 0; i < 4200; i++) {
    const x = (rand() * 512) | 0;
    const y = (rand() * 512) | 0;
    const v = rand();
    ctx.fillStyle = v > 0.5 ? "rgba(255,232,200,0.055)" : "rgba(0,0,0,0.08)";
    ctx.fillRect(x, y, 2, 2);
    const bv = (92 + v * 72) | 0;
    bctx.fillStyle = `rgb(${bv},${bv},${bv})`;
    bctx.fillRect(x, y, 2, 2);
  }

  const map = new CanvasTexture(albedo.canvas);
  map.colorSpace = SRGBColorSpace;
  const bumpMap = new CanvasTexture(bump.canvas);
  return { map, bump: bumpMap };
}

/** Procedural brushed titanium/slate industrial deck plate texture (256x256). */
function makeDeckTextures() {
  const albedo = makeCanvas(256, 256);
  const bump = makeCanvas(256, 256);
  if (!albedo || !bump) return null;
  const ctx = albedo.ctx2d;
  const bctx = bump.ctx2d;

  // High-value neutral slate base so material.color tints cleanly without darkening
  ctx.fillStyle = "#c8d0d8";
  ctx.fillRect(0, 0, 256, 256);
  bctx.fillStyle = "#a8a8a8";
  bctx.fillRect(0, 0, 256, 256);

  const rand = mulberry32(3141);
  // 4x4 brushed metallic tiles with subtle per-panel specular/tonal variation
  const step = 64;
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const shade = 192 + ((rand() * 24) | 0);
      ctx.fillStyle = `rgb(${shade},${shade + 4},${shade + 9})`;
      ctx.fillRect(gx * step + 2, gy * step + 2, step - 4, step - 4);
      const bShade = 152 + ((rand() * 34) | 0);
      bctx.fillStyle = `rgb(${bShade},${bShade},${bShade})`;
      bctx.fillRect(gx * step + 2, gy * step + 2, step - 4, step - 4);

      // Corner fastener rivets
      ctx.fillStyle = "#6c7680";
      bctx.fillStyle = "#505050";
      for (const [rx, ry] of [[7, 7], [step - 9, 7], [7, step - 9], [step - 9, step - 9]]) {
        ctx.fillRect(gx * step + rx, gy * step + ry, 2.5, 2.5);
        bctx.fillRect(gx * step + rx, gy * step + ry, 2.5, 2.5);
      }
    }
  }

  // Recessed panel seams
  ctx.strokeStyle = "#5e6872";
  ctx.lineWidth = 2;
  bctx.strokeStyle = "#363636";
  bctx.lineWidth = 2.5;
  for (let i = 0; i <= 256; i += step) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke();
    bctx.beginPath(); bctx.moveTo(i, 0); bctx.lineTo(i, 256); bctx.stroke();
    bctx.beginPath(); bctx.moveTo(0, i); bctx.lineTo(256, i); bctx.stroke();
  }

  // Clean inset architectural trim border
  ctx.strokeStyle = "#e6ecf2";
  ctx.lineWidth = 3;
  ctx.strokeRect(8, 8, 240, 240);
  bctx.strokeStyle = "#dcdcdc";
  bctx.lineWidth = 3;
  bctx.strokeRect(8, 8, 240, 240);

  // Fine horizontal brushed-metal micro-streaks
  for (let i = 0; i < 420; i++) {
    const x = rand() * 256;
    const y = rand() * 256;
    const len = 10 + rand() * 34;
    ctx.fillStyle = rand() > 0.5 ? "rgba(255,255,255,0.055)" : "rgba(30,38,48,0.055)";
    ctx.fillRect(x, y, len, 1);
  }

  const map = new CanvasTexture(albedo.canvas);
  map.colorSpace = SRGBColorSpace;
  map.wrapS = map.wrapT = RepeatWrapping;
  const bumpMap = new CanvasTexture(bump.canvas);
  bumpMap.wrapS = bumpMap.wrapT = RepeatWrapping;
  return { map, bump: bumpMap };
}

function makePlanetaryTerrain(terrainTex, skyTex, haloTexture) {
  const grp = new Group();
  // Grounded frontier planet surface: wide flat settlement basin (r <= 15.5) ringed by sculpted canyon walls
  const groundGeo = new PlaneGeometry(128, 128, 64, 64);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.hypot(x, y);
    let h = 0;
    if (dist > 15.5) {
      const t = Math.min(1, (dist - 15.5) / 8.5);
      const smooth = t * t * (3 - 2 * t);
      const raw = (Math.sin(x * 0.14) * Math.cos(y * 0.13) + 0.5 * Math.sin(x * 0.25 - y * 0.21) + 0.65) * 1.9;
      const amp = Math.min(4.6, (dist - 15.5) * 0.18);
      const stepped = Math.round(raw * 2.5) / 2.5;
      h = Math.max(0, smooth * (raw * 0.65 + stepped * 0.35) * (0.45 + amp * 0.32));
    }
    posAttr.setZ(i, h);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new MeshStandardMaterial({
    color: terrainTex ? 0xf2e8dc : 0x2c2724,
    map: terrainTex ? terrainTex.map : null,
    bumpMap: terrainTex ? terrainTex.bump : null,
    bumpScale: 0.34,
    roughness: 0.86,
    metalness: 0.1,
  });
  const ground = new Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.15;
  ground.receiveShadow = true;
  ground.raycast = () => {};
  grp.add(ground);

  // Inlaid brass/ochre tabletop survey ring + subtle outer steel-cyan perimeter ring (flat inside r <= 15.5)
  const surveyRing = new Mesh(
    new RingGeometry(13.65, 13.92, 80),
    new MeshStandardMaterial({
      color: 0xd4a862,
      emissive: 0x8a5e24,
      emissiveIntensity: 0.52,
      roughness: 0.38,
      metalness: 0.72,
      transparent: true,
      opacity: 0.7,
    }),
  );
  surveyRing.rotation.x = -Math.PI / 2;
  surveyRing.position.y = -0.135;
  surveyRing.raycast = () => {};
  grp.add(surveyRing);

  const outerArc = new Mesh(
    new RingGeometry(14.75, 14.9, 80),
    new MeshBasicMaterial({
      color: 0x4fc6f4,
      transparent: true,
      opacity: 0.24,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  outerArc.rotation.x = -Math.PI / 2;
  outerArc.position.y = -0.132;
  outerArc.raycast = () => {};
  grp.add(outerArc);

  // Sleek distant slate-ochre tiered canyon mesas framing the horizon beyond the flat basin (dist 18.5-26)
  const mesaMat = new MeshStandardMaterial({
    color: 0x332d2b,
    emissive: 0x101318,
    emissiveIntensity: 0.22,
    roughness: 0.9,
    metalness: 0.12,
  });
  const mesaSpecs = [
    [-19, -15, 2.2, 4.4, 2.3, 7], [-9, -20, 2.0, 3.8, 1.9, 6], [5, -21, 2.6, 5.0, 2.5, 7],
    [17, -16, 2.4, 4.4, 2.2, 6], [22, -5, 2.6, 4.8, 2.0, 7], [20, 9.5, 2.3, 4.2, 1.9, 6],
    [13, 19, 2.6, 4.8, 1.8, 7], [-5, 20.5, 2.4, 4.4, 1.7, 6], [-18, 15, 2.5, 4.8, 2.2, 7],
    [-22, 2, 2.8, 5.2, 2.4, 7], [-15, -24, 3.6, 6.8, 3.4, 8], [18, -23.5, 3.8, 7.0, 3.3, 8],
  ];
  for (let i = 0; i < mesaSpecs.length; i++) {
    const [mx, mz, rt, rb, mh, seg] = mesaSpecs[i];
    const m = new Mesh(new CylinderGeometry(rt, rb, mh, seg), mesaMat);
    m.position.set(mx, mh * 0.42 - 0.15, mz);
    m.rotation.y = i * 0.85;
    m.castShadow = true;
    m.receiveShadow = true;
    m.raycast = () => {};
    grp.add(m);
  }

  // Atmospheric twilight horizon backdrop cylinder
  if (skyTex) {
    const sky = new Mesh(
      new CylinderGeometry(48, 48, 28, 48, 1, true),
      new MeshBasicMaterial({
        map: skyTex,
        side: BackSide,
        fog: false,
        depthWrite: false,
      }),
    );
    sky.position.y = 8.0;
    sky.raycast = () => {};
    grp.add(sky);
  }

  // Soft warm atmospheric dust motes drifting over the basin
  const count = 140;
  const pos = new Float32Array(count * 3);
  const rand = mulberry32(1337);
  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2;
    const r = 3.2 + rand() * 20;
    const h = 0.5 + rand() * 4.8;
    pos[i * 3] = Math.cos(theta) * r;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = Math.sin(theta) * r;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new BufferAttribute(pos, 3));
  const dust = new Points(
    dustGeo,
    new PointsMaterial({
      color: 0xf2cfa0,
      map: haloTexture || null,
      size: haloTexture ? 0.3 : 0.13,
      transparent: true,
      opacity: 0.48,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  dust.raycast = () => {};
  grp.add(dust);
  return grp;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function mount(frame, opts) {
  const canvas = opts.canvas;
  const labelRoot = opts.labels;
  const reduce = !!opts.reduce;
  const onSelect = typeof opts.onSelect === "function" ? opts.onSelect : () => {};
  const onLost = typeof opts.onLost === "function" ? opts.onLost : () => {};
  const C = palette();
  const haloTexture = makeHaloTexture();
  const beaconTexture = makeBeaconTexture();
  const skyTexture = makeHorizonTexture();
  const terrainTex = makeTerrainTextures();
  const deckTex = makeDeckTextures();

  // Reset GL pixel-store unpack state when remounting onto a reused <canvas>
  // (e.g. toggling Low noise off) so Three.js dummy 3D texture init never warns.
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
  renderer.setClearColor(0x131922, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.44;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const labels = new CSS2DRenderer({ element: labelRoot });

  const scene = new Scene();
  scene.fog = new FogExp2(0x161d27, 0.0082);
  const environment = makePlanetaryTerrain(terrainTex, skyTexture, haloTexture);
  scene.add(environment);

  // Warm frontier lantern sun + cool steel-cyan rim + rich obsidian-ochre hemisphere bounce
  scene.add(new HemisphereLight(0xfbe2bc, 0x263142, 1.35));
  const sun = new DirectionalLight(0xffcf8e, 2.55);
  sun.position.set(-14, 15, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 2.5;
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 48;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);

  const rim = new DirectionalLight(0x5ad2ff, 1.35);
  rim.position.set(14, 9, -12);
  scene.add(rim);

  const hearth = new PointLight(0xffba66, 2.3, 28, 1.25);
  hearth.position.set(0, 3.6, 1.0);
  scene.add(hearth);

  const camera = new PerspectiveCamera(38, 1, 0.1, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.listenToKeyEvents(frame);

  // Shared primitive geometry pool (reused across all plinths, landmarks, conduits, and drones)
  const shared = {
    subBase: new BoxGeometry(PLATE + 0.34, 0.14, PLATE + 0.34),
    collar: new BoxGeometry(PLATE + 0.14, 0.07, PLATE + 0.14),
    plate: new BoxGeometry(PLATE, 0.22, PLATE),
    trimX: new BoxGeometry(PLATE + 0.04, 0.045, 0.05),
    trimZ: new BoxGeometry(0.05, 0.045, PLATE + 0.04),
    cornerPost: new BoxGeometry(0.12, 0.12, 0.12),
    ring: new BoxGeometry(PLATE + 0.56, 0.04, PLATE + 0.56),
    scar: new BoxGeometry(PLATE - 0.56, 0.02, PLATE - 0.56),
    beacon: new CylinderGeometry(PLATE * 0.48, PLATE * 0.62, 1.45, 24, 1, true),
    pipBase: new CylinderGeometry(0.18, 0.21, 0.055, 10),
    pipRing: new RingGeometry(0.18, 0.25, 16),
    pip: new CylinderGeometry(0.11, 0.19, 0.36, 8),
    pipCollar: new TorusGeometry(0.125, 0.022, 6, 12),
    pipHead: new OctahedronGeometry(0.13, 0),
    pipVisor: new BoxGeometry(0.14, 0.055, 0.09),
    trailDot: new OctahedronGeometry(0.065, 0),
    core: new OctahedronGeometry(0.28, 0),
    torus: new TorusGeometry(0.46, 0.036, 8, 28),
    torusSm: new TorusGeometry(0.32, 0.028, 8, 24),
    pillar: new BoxGeometry(0.16, 0.88, 0.16),
    beam: new BoxGeometry(0.12, 0.12, 1.0),
    fin: new BoxGeometry(0.08, 0.62, 0.38),
    dish: new ConeGeometry(0.36, 0.22, 14, 1, true),
    monolith: new BoxGeometry(0.2, 0.96, 0.1),
    silo: new CylinderGeometry(0.21, 0.23, 0.68, 12),
    dome: new CylinderGeometry(0.28, 0.56, 0.36, 8),
    crate: new BoxGeometry(0.34, 0.22, 0.24),
    pipe: new CylinderGeometry(0.065, 0.065, 0.85, 8),
    unitBox: new BoxGeometry(1, 1, 1),
    trace: new OctahedronGeometry(0.13, 0),
    arrow: new ConeGeometry(0.19, 0.5, 6),
    pulse: new RingGeometry(1.7, 1.98, 48),
    halo: new PlaneGeometry(1, 1),
  };
  const sharedGeos = new Set(Object.values(shared));

  let animatedProps = [];
  let animatedPawns = [];
  let world = new Group();
  scene.add(world);
  let compass = null;

  let model = { sites: [], routes: [], radius: 8 };
  let ctx = {};
  let lastSeq = null;
  let pulses = [];
  let tween = null;
  let spectatorMoved = false;
  /** D6 tier director: the shot the camera holds, or null when it holds none. */
  let shot = null;
  let framed = false;
  let frameId = 0;
  let dirty = false;
  let disposed = false;
  const groups = new Map();
  let routeEntries = [];
  let captions = [];
  const captionBoxes = new Map();
  /** D6 route travel: public handle -> site id of the LAST applied model. */
  let handleSites = new Map();
  /** Travellers in flight right now (one per travelling handle). */
  const travels = [];
  /** D6 MAJOR moments in flight right now (one per site). */
  const moments = [];

  function setSitePick(obj, siteId) {
    obj.userData.siteId = siteId;
    return obj;
  }

  function makeBox(sx, sy, sz, mat, shadow) {
    const m = new Mesh(shared.unitBox, mat);
    m.scale.set(sx, sy, sz);
    if (shadow !== false) { m.castShadow = true; m.receiveShadow = true; }
    return m;
  }

  /** Sculpted miniature tabletop automaton drone echoing hero-table.jpg figures. */
  function buildAutomaton(accent, isNamed) {
    const root = new Group();
    const mats = [];
    const cloakColor = new Color(0x1f2731).lerp(new Color(accent), 0.34);

    // Subtle glowing ground halo ring under each agent
    const ringMat = new MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: isNamed ? 0.8 : 0.36,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide,
    });
    mats.push(ringMat);
    const groundRing = new Mesh(shared.pipRing, ringMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.y = 0.015;
    groundRing.raycast = () => {};
    root.add(groundRing);

    // Stepped tabletop pedestal disc
    const baseMat = new MeshStandardMaterial({ color: 0x303c4a, roughness: 0.42, metalness: 0.68 });
    mats.push(baseMat);
    const base = new Mesh(shared.pipBase, baseMat);
    base.position.y = 0.04;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    // Chamfered hooded chassis/cloak body
    const bodyMat = new MeshStandardMaterial({
      color: cloakColor,
      emissive: accent,
      emissiveIntensity: isNamed ? 0.32 : 0.12,
      roughness: 0.38,
      metalness: 0.4,
    });
    mats.push(bodyMat);
    const body = new Mesh(shared.pip, bodyMat);
    body.position.y = 0.24;
    body.castShadow = true;
    body.receiveShadow = true;
    root.add(body);

    // Illuminated shoulder/visor collar
    const collarMat = new MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: isNamed ? 1.25 : 0.4,
      roughness: 0.22,
      metalness: 0.42,
    });
    mats.push(collarMat);
    const collar = new Mesh(shared.pipCollar, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.43;
    root.add(collar);

    // Hovering geometric crown/monitor head
    const head = new Group();
    head.position.y = 0.59;
    const crownMat = new MeshStandardMaterial({
      color: 0xf8fbff,
      emissive: accent,
      emissiveIntensity: isNamed ? 1.45 : 0.45,
      roughness: 0.16,
      metalness: 0.3,
    });
    mats.push(crownMat);
    const crown = new Mesh(shared.pipHead, crownMat);
    crown.castShadow = true;
    head.add(crown);

    const visorMat = new MeshStandardMaterial({
      color: 0x101820,
      emissive: accent,
      emissiveIntensity: isNamed ? 1.8 : 0.5,
      roughness: 0.1,
      metalness: 0.6,
    });
    mats.push(visorMat);
    const visor = new Mesh(shared.pipVisor, visorMat);
    visor.position.set(0, 0, 0.07);
    head.add(visor);
    root.add(head);
    root.scale.setScalar(1.14);

    return { root, head, bodyMat, mats };
  }

  /** Build bespoke miniature architectural landmarks for each of the 10 Chamber rooms. */
  function addRoomLandmark(parent, site, baseY) {
    const sid = String(site.id || "");
    const g = new Group();
    g.position.set(0, baseY, 0);
    g.scale.setScalar(1.22);
    parent.add(g);
    const py = 0;
    const darkMetal = new MeshStandardMaterial({ color: 0x364352, roughness: 0.42, metalness: 0.68 });
    const steel = new MeshStandardMaterial({ color: 0x73879a, roughness: 0.34, metalness: 0.64 });
    const brass = new MeshStandardMaterial({ color: 0xbe965c, roughness: 0.34, metalness: 0.74 });
    const cyanGlow = new MeshStandardMaterial({ color: 0x9cf0ff, emissive: 0x3ddcff, emissiveIntensity: 1.68, roughness: 0.18 });
    const amberGlow = new MeshStandardMaterial({ color: 0xffdc8c, emissive: 0xff9a1a, emissiveIntensity: 1.78, roughness: 0.18 });
    const violetGlow = new MeshStandardMaterial({ color: 0xd9c2ff, emissive: 0xa474ff, emissiveIntensity: 1.6, roughness: 0.2 });

    if (sid.includes("generator")) {
      // Generator Hall: reactor dais, twin armored radiator fins, amber plasma core & dual counter-rotating magnetic rings
      const dais = new Mesh(shared.dome, darkMetal);
      dais.scale.set(1.1, 0.38, 1.1);
      dais.position.set(0, py + 0.07, -0.58);
      dais.castShadow = true;
      dais.receiveShadow = true;
      g.add(dais);
      for (const dx of [-0.62, 0.62]) {
        const fin = new Mesh(shared.fin, steel);
        fin.position.set(dx, py + 0.34, -0.58);
        fin.rotation.z = dx < 0 ? 0.16 : -0.16;
        fin.castShadow = true;
        fin.receiveShadow = true;
        g.add(fin);
        const cap = makeBox(0.11, 0.06, 0.34, brass);
        cap.position.set(dx * 0.94, py + 0.66, -0.58);
        g.add(cap);
      }
      const core = new Mesh(shared.core, amberGlow);
      core.position.set(0, py + 0.56, -0.58);
      core.castShadow = true;
      core.userData.spin = 1.25;
      g.add(core);
      animatedProps.push(core);
      const ringA = new Mesh(shared.torus, cyanGlow);
      ringA.position.copy(core.position);
      ringA.rotation.x = Math.PI / 3;
      ringA.userData.spin = -0.85;
      g.add(ringA);
      animatedProps.push(ringA);
      const ringB = new Mesh(shared.torusSm, cyanGlow);
      ringB.position.copy(core.position);
      ringB.rotation.set(-Math.PI / 3.4, 0.6, Math.PI / 4);
      ringB.userData.spin = 1.1;
      g.add(ringB);
      animatedProps.push(ringB);
      if (haloTexture) {
        const floorGlow = new Mesh(shared.halo, new MeshBasicMaterial({
          map: haloTexture, color: 0xffa633, transparent: true, opacity: 0.45,
          blending: AdditiveBlending, depthWrite: false,
        }));
        floorGlow.rotation.x = -Math.PI / 2;
        floorGlow.position.set(0, py + 0.02, -0.58);
        floorGlow.scale.set(1.6, 1.6, 1);
        floorGlow.raycast = () => {};
        g.add(floorGlow);
      }
    } else if (sid.includes("relay")) {
      // Relay Quarter: stepped comms base, lattice mast, rotating parabolic dish w/ cyan feed-horn, secondary antenna
      const ped = makeBox(0.76, 0.18, 0.66, darkMetal);
      ped.position.set(0.5, py + 0.09, -0.62);
      g.add(ped);
      const mast = new Mesh(shared.pillar, steel);
      mast.scale.set(0.85, 1.15, 0.85);
      mast.position.set(0.5, py + 0.58, -0.62);
      mast.castShadow = true;
      g.add(mast);
      for (const ry of [0.36, 0.62, 0.86]) {
        const rib = makeBox(0.32, 0.04, 0.32, brass);
        rib.position.set(0.5, py + ry, -0.62);
        g.add(rib);
      }
      const dishPivot = new Group();
      dishPivot.position.set(0.5, py + 1.12, -0.62);
      dishPivot.userData.spin = 0.55;
      const dish = new Mesh(shared.dish, new MeshStandardMaterial({
        color: 0xa4becb, emissive: 0x3ddcff, emissiveIntensity: 0.25, roughness: 0.32, metalness: 0.58, side: DoubleSide,
      }));
      dish.rotation.z = 0.68;
      dish.castShadow = true;
      dishPivot.add(dish);
      const horn = new Mesh(shared.trace, cyanGlow);
      horn.scale.setScalar(0.55);
      horn.position.set(-0.18, 0.14, 0);
      dishPivot.add(horn);
      g.add(dishPivot);
      animatedProps.push(dishPivot);
      // Secondary array antenna
      const whip = makeBox(0.055, 0.74, 0.055, steel);
      whip.position.set(-0.58, py + 0.37, -0.74);
      g.add(whip);
      const tip = new Mesh(shared.trace, amberGlow);
      tip.scale.setScalar(0.45);
      tip.position.set(-0.58, py + 0.78, -0.74);
      g.add(tip);
    } else if (sid.includes("archive")) {
      // Archive: stepped obsidian podium, curved colonnade of cyan-etched data monoliths, hovering codex prism
      const podium = new Mesh(shared.dome, darkMetal);
      podium.scale.set(1.5, 0.35, 1.0);
      podium.position.set(0, py + 0.06, -0.64);
      podium.receiveShadow = true;
      g.add(podium);
      const monoMat = new MeshStandardMaterial({
        color: 0x1a2532, emissive: 0x2688a8, emissiveIntensity: 0.34, metalness: 0.62, roughness: 0.24,
      });
      const slots = [
        [-0.78, -0.52, 0.35, 0.84], [-0.42, -0.76, 0.18, 1.02], [0, -0.84, 0, 1.18],
        [0.42, -0.76, -0.18, 1.02], [0.78, -0.52, -0.35, 0.84],
      ];
      for (const [mx, mz, rot, sc] of slots) {
        const mono = new Mesh(shared.monolith, monoMat);
        mono.scale.set(0.9, sc, 1);
        mono.position.set(mx, py + 0.48 * sc, mz);
        mono.rotation.y = rot;
        mono.castShadow = true;
        mono.receiveShadow = true;
        g.add(mono);
        const strip = makeBox(0.04, 0.62 * sc, 0.115, cyanGlow, false);
        strip.position.set(mx, py + 0.5 * sc, mz);
        strip.rotation.y = rot;
        g.add(strip);
      }
      const codex = new Mesh(shared.core, cyanGlow);
      codex.scale.setScalar(0.68);
      codex.position.set(0, py + 0.58, -0.44);
      codex.userData.spin = 0.9;
      g.add(codex);
      animatedProps.push(codex);
    } else if (sid.includes("civic")) {
      // Civic Exchange: 4 corner lantern pylons, central illuminated amphitheater ring, warm amber plaza hub
      const corners = [[-0.86, -0.82], [0.86, -0.82], [-0.86, 0.14], [0.86, 0.14]];
      for (const [cx, cz] of corners) {
        const pylon = new Mesh(shared.pillar, steel);
        pylon.scale.set(0.75, cz < 0 ? 0.96 : 0.62, 0.75);
        pylon.position.set(cx, py + (cz < 0 ? 0.42 : 0.27), cz);
        pylon.castShadow = true;
        g.add(pylon);
        const lamp = new Mesh(shared.trace, amberGlow);
        lamp.scale.setScalar(0.58);
        lamp.position.set(cx, py + (cz < 0 ? 0.92 : 0.62), cz);
        g.add(lamp);
      }
      const outerHub = new Mesh(shared.torus, brass);
      outerHub.scale.setScalar(1.32);
      outerHub.rotation.x = Math.PI / 2;
      outerHub.position.set(0, py + 0.05, -0.34);
      g.add(outerHub);
      const innerHub = new Mesh(shared.torusSm, amberGlow);
      innerHub.rotation.x = Math.PI / 2;
      innerHub.position.set(0, py + 0.09, -0.34);
      g.add(innerHub);
      const canopy = new Mesh(shared.core, amberGlow);
      canopy.scale.set(0.62, 0.42, 0.62);
      canopy.position.set(0, py + 0.66, -0.34);
      canopy.userData.spin = 0.5;
      g.add(canopy);
      animatedProps.push(canopy);
    } else if (sid.includes("transit")) {
      // Transit Ring: twin sweeping illuminated gantry arches, docking bollards, pulsing transit pad ring
      for (const dz of [-0.74, -0.24]) {
        const frameArch = new Mesh(shared.torus, steel);
        frameArch.position.set(0, py + 0.44, dz);
        frameArch.scale.set(1.48, 1.32, 1.4);
        frameArch.castShadow = true;
        g.add(frameArch);
        const glowArch = new Mesh(shared.torus, cyanGlow);
        glowArch.position.set(0, py + 0.44, dz);
        glowArch.scale.set(1.36, 1.22, 0.65);
        g.add(glowArch);
      }
      for (const [bx, bz] of [[-0.86, -0.49], [0.86, -0.49], [-0.86, 0.2], [0.86, 0.2]]) {
        const bollard = makeBox(0.11, 0.26, 0.11, darkMetal);
        bollard.position.set(bx, py + 0.13, bz);
        g.add(bollard);
        const cap = makeBox(0.12, 0.04, 0.12, cyanGlow, false);
        cap.position.set(bx, py + 0.28, bz);
        g.add(cap);
      }
      const padRing = new Mesh(shared.torusSm, cyanGlow);
      padRing.rotation.x = Math.PI / 2;
      padRing.position.set(0, py + 0.03, -0.49);
      padRing.userData.spin = 0.7;
      g.add(padRing);
      animatedProps.push(padRing);
    } else if (sid.includes("foundry")) {
      // Foundry Corridor: industrial smelter stack, glowing ember forge trough, angled furnace baffles
      const stack = new Mesh(shared.silo, darkMetal);
      stack.scale.set(1.18, 1.55, 1.18);
      stack.position.set(-0.62, py + 0.52, -0.68);
      stack.castShadow = true;
      g.add(stack);
      const collarA = new Mesh(shared.torusSm, brass);
      collarA.rotation.x = Math.PI / 2;
      collarA.scale.setScalar(0.86);
      collarA.position.set(-0.62, py + 0.88, -0.68);
      g.add(collarA);
      const flueGlow = new Mesh(shared.trace, amberGlow);
      flueGlow.scale.set(0.95, 0.35, 0.95);
      flueGlow.position.set(-0.62, py + 1.06, -0.68);
      g.add(flueGlow);
      // Glowing ember forge trough
      const troughWall = makeBox(1.06, 0.22, 0.44, darkMetal);
      troughWall.position.set(0.28, py + 0.11, -0.62);
      g.add(troughWall);
      const ember = makeBox(0.9, 0.08, 0.26, amberGlow, false);
      ember.position.set(0.28, py + 0.22, -0.62);
      g.add(ember);
      // Angled furnace baffles
      for (const bx of [-0.08, 0.28, 0.64]) {
        const baf = new Mesh(shared.fin, steel);
        baf.scale.set(0.9, 0.72, 0.85);
        baf.position.set(bx, py + 0.38, -0.78);
        baf.rotation.x = 0.28;
        baf.castShadow = true;
        g.add(baf);
      }
    } else if (sid.includes("storage")) {
      // Storage District: clustered ribbed pressure silos, stacked cargo containers, overhead gantry
      for (const [sx, sz, h] of [[-0.68, -0.72, 1.15], [-0.22, -0.78, 0.95], [-0.46, -0.34, 0.82]]) {
        const silo = new Mesh(shared.silo, steel);
        silo.scale.set(0.95, h, 0.95);
        silo.position.set(sx, py + 0.34 * h, sz);
        silo.castShadow = true;
        silo.receiveShadow = true;
        g.add(silo);
        const band = new Mesh(shared.torusSm, darkMetal);
        band.rotation.x = Math.PI / 2;
        band.scale.setScalar(0.72);
        band.position.set(sx, py + 0.46 * h, sz);
        g.add(band);
      }
      const crateMat = new MeshStandardMaterial({ color: 0x7b6346, roughness: 0.62, metalness: 0.28 });
      const c1 = new Mesh(shared.crate, crateMat);
      c1.position.set(0.48, py + 0.11, -0.68);
      c1.castShadow = true;
      g.add(c1);
      const c2 = new Mesh(shared.crate, darkMetal);
      c2.position.set(0.52, py + 0.33, -0.66);
      c2.rotation.y = 0.18;
      c2.castShadow = true;
      g.add(c2);
      // Overhead loading gantry frame
      for (const gx of [0.16, 0.86]) {
        const post = makeBox(0.08, 0.78, 0.08, brass);
        post.position.set(gx, py + 0.39, -0.68);
        g.add(post);
      }
      const rail = makeBox(0.82, 0.08, 0.14, brass);
      rail.position.set(0.51, py + 0.78, -0.68);
      g.add(rail);
    } else if (sid.includes("vault")) {
      // Infrastructure Vault: reinforced blast-bunker dome, twin armored conduit pipes, glowing vent grate
      const bunker = new Mesh(shared.dome, darkMetal);
      bunker.scale.set(1.25, 1.15, 1.15);
      bunker.position.set(0, py + 0.21, -0.64);
      bunker.castShadow = true;
      bunker.receiveShadow = true;
      g.add(bunker);
      const cap = makeBox(0.46, 0.1, 0.46, steel);
      cap.position.set(0, py + 0.44, -0.64);
      g.add(cap);
      for (const px of [-0.62, 0.62]) {
        const pipe = new Mesh(shared.pipe, brass);
        pipe.rotation.z = Math.PI / 2;
        pipe.scale.set(1, 0.56, 1);
        pipe.position.set(px, py + 0.14, -0.64);
        pipe.castShadow = true;
        g.add(pipe);
      }
      const grate = makeBox(0.52, 0.03, 0.22, cyanGlow, false);
      grate.position.set(0, py + 0.02, -0.12);
      g.add(grate);
      const statusPip = new Mesh(shared.trace, amberGlow);
      statusPip.scale.setScalar(0.48);
      statusPip.position.set(0, py + 0.56, -0.64);
      g.add(statusPip);
    } else if (sid.includes("outer")) {
      // Outer Works: frontier derrick crane boom, floodlight stanchions, purple-cyan survey beacon
      const tower = new Mesh(shared.pillar, steel);
      tower.scale.set(0.85, 1.12, 0.85);
      tower.position.set(-0.62, py + 0.49, -0.68);
      tower.castShadow = true;
      g.add(tower);
      const boom = makeBox(0.08, 0.08, 1.05, brass);
      boom.position.set(-0.32, py + 0.92, -0.44);
      boom.rotation.set(-0.34, -0.58, 0);
      g.add(boom);
      for (const fx of [0.22, 0.74]) {
        const stanchion = makeBox(0.06, 0.52, 0.06, darkMetal);
        stanchion.position.set(fx, py + 0.26, -0.76);
        g.add(stanchion);
        const flood = makeBox(0.14, 0.07, 0.09, amberGlow, false);
        flood.position.set(fx, py + 0.54, -0.72);
        flood.rotation.x = 0.35;
        g.add(flood);
      }
      const beacon = new Mesh(shared.core, violetGlow);
      beacon.scale.setScalar(0.55);
      beacon.position.set(-0.62, py + 1.12, -0.68);
      beacon.userData.spin = 1.1;
      g.add(beacon);
      animatedProps.push(beacon);
    } else {
      // Frontier Gate & default: monumental twin threshold pylons + illuminated gate lintel arch
      for (const gx of [-0.66, 0.66]) {
        const pylon = new Mesh(shared.pillar, darkMetal);
        pylon.scale.set(1.25, 1.18, 1.15);
        pylon.position.set(gx, py + 0.52, -0.68);
        pylon.castShadow = true;
        pylon.receiveShadow = true;
        g.add(pylon);
        const strip = makeBox(0.05, 0.76, 0.2, cyanGlow, false);
        strip.position.set(gx * 0.84, py + 0.5, -0.68);
        g.add(strip);
      }
      const lintel = makeBox(1.76, 0.16, 0.3, steel);
      lintel.position.set(0, py + 1.06, -0.68);
      g.add(lintel);
      const crest = makeBox(1.18, 0.06, 0.1, amberGlow, false);
      crest.position.set(0, py + 1.16, -0.68);
      g.add(crest);
      const slit = makeBox(0.84, 0.03, 0.1, violetGlow, false);
      slit.position.set(0, py + 0.02, -0.68);
      g.add(slit);
    }
  }

  /** Create a fading luminous comet-wake trail behind a travelling drone. */
  function buildTravelActor(handle) {
    const accent = agentAccent(handle);
    const group = new Group();
    const mat = new MeshStandardMaterial({
      color: accent,
      roughness: 0.32,
      metalness: 0.35,
      emissive: accent,
      emissiveIntensity: 0.9,
    });
    const body = new Mesh(shared.pip, mat);
    body.castShadow = true;
    group.add(body);
    const headMat = new MeshStandardMaterial({
      color: 0xffffff,
      emissive: accent,
      emissiveIntensity: 1.35,
      roughness: 0.18,
    });
    const head = new Mesh(shared.pipHead, headMat);
    head.position.y = 0.34;
    group.add(head);

    const trail = [];
    for (let i = 0; i < 6; i++) {
      const tm = new MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.65 * (1 - i / 6),
        blending: AdditiveBlending,
        depthWrite: false,
      });
      const dot = new Mesh(shared.trailDot, tm);
      dot.scale.setScalar(1 - i * 0.13);
      dot.raycast = () => {};
      world.add(dot);
      trail.push({ mesh: dot, mat: tm });
    }
    return { group, mat, extraMats: [headMat], trail };
  }

  function disposeTravelVisuals(tr) {
    if (tr.mesh) world.remove(tr.mesh);
    if (tr.mat) tr.mat.dispose();
    if (tr.extraMats) for (const m of tr.extraMats) m.dispose();
    if (tr.trail) {
      for (const td of tr.trail) {
        world.remove(td.mesh);
        td.mat.dispose();
      }
    }
    tr.mesh = null;
    tr.mat = null;
    tr.extraMats = null;
    tr.trail = null;
  }

  function size() {
    const w = Math.max(1, frame.clientWidth);
    const h = Math.max(1, frame.clientHeight);
    renderer.setSize(w, h, false);
    labels.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (framed && !spectatorMoved && !tween && atDefaultTarget()) {
      const v = defaultView();
      camera.position.copy(v.position);
      controls.update();
    }
    request();
  }

  function request() {
    if (disposed || frameId) return;
    if (document.hidden) { dirty = true; return; }
    frameId = requestAnimationFrame(draw);
  }

  function draw(now) {
    frameId = 0;
    if (disposed) return;
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
    for (const g of groups.values()) g.position.y = 0;
    pulses = pulses.filter((p) => {
      const g = groups.get(p.roomId);
      if (p.start === undefined) p.start = now;
      const t = (now - p.start) / p.ttl;
      if (!g || t >= 1) {
        if (p.ring) { world.remove(p.ring); p.ring.material.dispose(); }
        return false;
      }
      g.position.y = Math.max(g.position.y, Math.sin(t * Math.PI) * LIFT[p.tier]);
      if (p.ring) {
        p.ring.scale.setScalar(1 + t * 0.9);
        p.ring.material.opacity = 0.92 * (1 - t);
      }
      busy = true;
      return true;
    });
    // D6 MAJOR moment: a slow breath at the site, ending after the moment ms.
    // Reduced motion holds a still highlight and never asks for a frame.
    for (let i = moments.length - 1; i >= 0; i--) {
      const m = moments[i];
      if (reduce || !m.ring) continue;
      const t = m.ms > 0 ? (now - m.start) / m.ms : 1;
      if (t >= 1) { endMoment(m.roomId); continue; }
      m.ring.scale.setScalar(1.15 + 0.25 * Math.sin(t * Math.PI * 6));
      m.ring.material.opacity = 0.58 * (1 - t * t);
      busy = true;
    }
    // D6 route travel: a sculpted drone glides along a parabolic arc with a fading wake.
    for (let i = travels.length - 1; i >= 0; i--) {
      const tr = travels[i];
      if (!tr.mesh || !tr.mat || !tr.destMesh) continue;
      if (tr.start < 0) tr.start = now;
      const t = Math.min(1, (now - tr.start) / STAGE_TRAVEL_MS);
      const k = easeOut(t);
      const px = tr.from.x + (tr.to.x - tr.from.x) * k;
      const py = tr.from.y + (tr.to.y - tr.from.y) * k + Math.sin(t * Math.PI) * 0.78;
      const pz = tr.from.z + (tr.to.z - tr.from.z) * k;
      tr.mesh.position.set(px, py, pz);
      // Lean smoothly into the direction of motion
      const dx = tr.to.x - tr.from.x;
      const dz = tr.to.z - tr.from.z;
      if (dx * dx + dz * dz > 1e-6) {
        tr.mesh.rotation.y = Math.atan2(dx, dz);
        tr.mesh.rotation.x = 0.24 * Math.sin(t * Math.PI);
      }
      if (tr.trail) {
        for (let j = 0; j < tr.trail.length; j++) {
          const tt = Math.max(0, t - (j + 1) * 0.045);
          const tk = easeOut(tt);
          tr.trail[j].mesh.position.set(
            tr.from.x + dx * tk,
            tr.from.y + (tr.to.y - tr.from.y) * tk + Math.sin(tt * Math.PI) * 0.78 + 0.14,
            tr.from.z + dz * tk,
          );
          tr.trail[j].mat.opacity = tt > 0 ? 0.62 * (1 - j / tr.trail.length) * (1 - t * 0.35) : 0;
        }
      }
      if (t >= 1) {
        disposeTravelVisuals(tr);
        tr.destMesh.visible = true;
        if (tr.destPlate) {
          tr.destPlate.visible = true;
          if (tr.destPlate.element) tr.destPlate.element.style.visibility = "";
        }
        travels.splice(i, 1);
      } else {
        busy = true;
      }
    }
    // §18.6 exit lighting: while an agent-move pulse lives, routes that touch
    // its site illuminate vivid electric cyan along their conduit core.
    const lit = stageLitRoutes(pulses.filter((p) => p.projectionId === "agent_move"), model.routes);
    for (const entry of routeEntries) {
      const on = lit.has(entry.from + "|" + entry.to);
      for (const m of entry.mats) {
        m.color.copy(on ? C.active : C.route);
        if (m.emissive) {
          m.emissive.setHex(on ? C.active.getHex() : 0x34667d);
          m.emissiveIntensity = on ? 2.1 : 0.72;
        }
      }
    }
    // Ambient miniature diorama motion (disabled under reduced motion and when tab is hidden)
    if (!reduce) {
      const sec = now * 0.001;
      for (const prop of animatedProps) {
        prop.rotation.y = sec * (prop.userData.spin || 0.7);
      }
      for (const pawn of animatedPawns) {
        pawn.position.y = pawn.userData.baseY + Math.sin(sec * 2.2 + (pawn.userData.phase || 0)) * 0.055;
        if (pawn.userData.head) pawn.userData.head.rotation.y = sec * 1.25;
      }
      if (!document.hidden && (animatedProps.length > 0 || animatedPawns.length > 0)) busy = true;
    }
    if (controls.enableDamping) controls.update();
    renderer.render(scene, camera);
    labels.render(scene, camera);
    declutter();
    if (busy) request();
  }

  // Labels stay readable (Lightweight §18): nudge colliding labels smoothly in
  // screen space before falling back to tucking, so names stay legible.
  function declutter() {
    const els = Array.from(labelRoot.querySelectorAll(".stage3d-label, .stage3d-nameplate"));
    els.sort((a, b) => Number(b.dataset.priority || 0) - Number(a.dataset.priority || 0));
    const fr = frame.getBoundingClientRect();
    const placed = [];
    const padX = 8;
    const padY = 6;
    const maxShift = 58;
    const overlaps = (a, b) =>
      a.left < b.right + padX && a.right > b.left - padX && a.top < b.bottom + padY && a.bottom > b.top - padY;

    for (const el of els) {
      el.classList.remove("is-tucked");
      el.style.marginLeft = "";
      el.style.marginTop = "";
      if (el.style.display === "none") continue;
      const base = el.getBoundingClientRect();
      if (base.width <= 0 || base.height <= 0) continue;
      let ox = 0;
      let oy = 0;
      let box = { left: base.left, right: base.right, top: base.top, bottom: base.bottom };
      const isName = el.classList.contains("stage3d-nameplate");
      let clear = !placed.some((p) => overlaps(box, p));
      if (!clear) {
        for (let iter = 0; iter < 8; iter++) {
          let dx = 0;
          let dy = 0;
          let hits = 0;
          for (const p of placed) {
            if (!overlaps(box, p)) continue;
            hits++;
            const overlapX = Math.min(box.right + padX - p.left, p.right + padX - box.left);
            const overlapY = Math.min(box.bottom + padY - p.top, p.bottom + padY - box.top);
            const cx = (box.left + box.right) * 0.5 - (p.left + p.right) * 0.5;
            const cy = (box.top + box.bottom) * 0.5 - (p.top + p.bottom) * 0.5;
            if (overlapY <= overlapX * 1.15) {
              dy += (cy === 0 ? (isName ? -1 : 1) : Math.sign(cy)) * (overlapY + 3);
            } else {
              dx += (cx === 0 ? 1 : Math.sign(cx)) * (overlapX + 3);
            }
          }
          if (!hits) { clear = true; break; }
          ox += dx;
          oy += dy;
          const mag = Math.hypot(ox, oy);
          if (mag > maxShift) {
            ox = (ox / mag) * maxShift;
            oy = (oy / mag) * maxShift;
          }
          // Keep inside frame viewport bounds when dimensions are measurable
          if (fr.width > 40 && fr.height > 40) {
            const minOx = (fr.left + 8) - base.left;
            const maxOx = (fr.right - 8) - base.right;
            const minOy = (fr.top + 8) - base.top;
            const maxOy = (fr.bottom - 8) - base.bottom;
            if (minOx <= maxOx) ox = Math.max(minOx, Math.min(maxOx, ox));
            if (minOy <= maxOy) oy = Math.max(minOy, Math.min(maxOy, oy));
          }
          box = { left: base.left + ox, right: base.right + ox, top: base.top + oy, bottom: base.bottom + oy };
          if (!placed.some((p) => overlaps(box, p))) { clear = true; break; }
        }
      }
      if (clear) {
        if (Math.abs(ox) >= 1) el.style.marginLeft = Math.round(ox) + "px";
        if (Math.abs(oy) >= 1) el.style.marginTop = Math.round(oy) + "px";
        placed.push(box);
      } else {
        el.classList.add("is-tucked");
      }
    }
  }

  function label(site) {
    const el = document.createElement("div");
    el.className = "stage3d-label";
    const states = [];
    if (site.active) states.push("active");
    if (site.selected) states.push("selected");
    if (site.followed) states.push("followed");
    if (site.major) states.push("major");
    if (site.certainty === "partial" || site.certainty === "unknown") states.push("partial");
    el.setAttribute("data-state", states.join(" "));
    el.dataset.priority = String(
      (site.selected ? 32 : 0) + (site.followed ? 16 : 0) + (site.major ? 8 : 0) + (site.active ? 4 : 0) + (site.players > 0 ? 2 : 0),
    );
    el.title = site.name;
    const name = document.createElement("span");
    name.textContent = site.name;
    el.append(name);
    if (site.handles.length) {
      const h = document.createElement("span");
      h.className = "stage3d-handles";
      h.textContent = site.handles.join(", ");
      el.append(h);
    } else if (site.players > 0) {
      const h = document.createElement("span");
      h.className = "stage3d-handles";
      h.textContent = site.players === 1 ? "1 agent" : site.players + " agents";
      el.append(h);
    }
    for (const t of site.tokens.filter((x) => x.line).slice(0, 2)) {
      const l = document.createElement("span");
      l.className = "stage3d-lines";
      l.textContent = t.line;
      el.append(l);
    }
    const bandLine = stageBandLine(site.bands);
    if (bandLine) {
      const b = document.createElement("span");
      b.className = "stage3d-bands";
      b.textContent = bandLine;
      el.append(b);
    }
    const tag = site.major ? "MAJOR" : site.followed ? "Followed" : site.selected ? "Selected" : "";
    if (tag) {
      const s = document.createElement("span");
      s.className = "stage3d-state";
      s.textContent = tag;
      el.append(s);
    }
    el.addEventListener("click", (ev) => { ev.stopPropagation(); onSelect(site.id); });
    const obj = new CSS2DObject(el);
    obj.position.set(0, 0.12, PLATE / 2 + 0.24);
    return obj;
  }

  function siteGroup(site) {
    const g = new Group();
    g.userData.siteId = site.id;
    const partial = site.certainty === "partial" || site.certainty === "unknown";
    const liftY = site.selected ? 0.14 : 0;

    // Grounded dark contact shadow directly under the architectural plinth
    if (haloTexture) {
      const contact = new Mesh(shared.halo, new MeshBasicMaterial({
        map: haloTexture,
        color: 0x05070a,
        transparent: true,
        opacity: partial ? 0.35 : 0.62,
        depthWrite: false,
      }));
      contact.rotation.x = -Math.PI / 2;
      contact.position.y = -0.105;
      contact.scale.set(PLATE + 1.4, PLATE + 1.4, 1);
      contact.renderOrder = -2;
      contact.raycast = () => {};
      g.add(contact);
    }

    // Tier 1: recessed dark obsidian sub-base skirt
    const subBase = new Mesh(shared.subBase, new MeshStandardMaterial({
      color: 0x181e26,
      roughness: 0.72,
      metalness: 0.48,
      transparent: partial,
      opacity: partial ? 0.5 : 1,
    }));
    subBase.position.y = -0.02 + liftY * 0.4;
    subBase.castShadow = true;
    subBase.receiveShadow = true;
    setSitePick(subBase, site.id);
    g.add(subBase);

    // Tier 2: metallic beveled collar
    const collar = new Mesh(shared.collar, new MeshStandardMaterial({
      color: 0x3b4754,
      roughness: 0.38,
      metalness: 0.68,
      transparent: partial,
      opacity: partial ? 0.52 : 1,
    }));
    collar.position.y = 0.08 + liftY * 0.75;
    collar.castShadow = true;
    collar.receiveShadow = true;
    setSitePick(collar, site.id);
    g.add(collar);

    // Tier 3: brushed textured industrial deck slab
    const plateColor = (site.selected || site.active ? C.raised : C.plate).clone();
    if (site.bands.pressure) plateColor.lerp(C.warning, PRESSURE_MIX[site.bands.pressure]);
    const plateMat = new MeshStandardMaterial({
      color: plateColor,
      map: deckTex ? deckTex.map : null,
      bumpMap: deckTex ? deckTex.bump : null,
      bumpScale: 0.055,
      roughness: 0.56,
      metalness: 0.32,
      transparent: partial,
      opacity: partial ? 0.58 : 1,
    });
    const plate = new Mesh(shared.plate, plateMat);
    plate.position.y = 0.21 + liftY;
    plate.castShadow = true;
    plate.receiveShadow = true;
    setSitePick(plate, site.id);
    g.add(plate);

    // Illuminated 3D perimeter trim strips + corner anchor cleats
    const edgeColor = site.major ? C.warning : site.selected ? C.ink : site.active || site.followed ? C.active : C.edge;
    const isLit = site.major || site.selected || site.active || site.followed;
    const trimMat = new MeshStandardMaterial({
      color: edgeColor,
      emissive: edgeColor,
      emissiveIntensity: site.major ? 1.15 : site.active || site.followed ? 0.92 : site.selected ? 0.78 : 0.12,
      roughness: 0.28,
      metalness: 0.45,
      transparent: partial,
      opacity: partial ? 0.55 : 1,
    });
    const trimY = plate.position.y + 0.095;
    const halfP = PLATE / 2;
    for (const dz of [-halfP, halfP]) {
      const bar = new Mesh(shared.trimX, trimMat);
      bar.position.set(0, trimY, dz);
      g.add(bar);
    }
    for (const dx of [-halfP, halfP]) {
      const bar = new Mesh(shared.trimZ, trimMat);
      bar.position.set(dx, trimY, 0);
      g.add(bar);
    }
    const cleatMat = new MeshStandardMaterial({ color: 0x2c3642, roughness: 0.4, metalness: 0.72 });
    for (const [cx, cz] of [[-halfP, -halfP], [halfP, -halfP], [-halfP, halfP], [halfP, halfP]]) {
      const cleat = new Mesh(shared.cornerPost, cleatMat);
      cleat.position.set(cx, plate.position.y + 0.075, cz);
      cleat.castShadow = true;
      g.add(cleat);
    }

    // Partial/unknown sites also carry the dashed wireframe form (WS3-04: never color alone)
    if (partial) {
      const edges = new LineSegments(
        new EdgesGeometry(shared.plate),
        new LineDashedMaterial({ color: edgeColor, dashSize: 0.25, gapSize: 0.18 }),
      );
      edges.position.copy(plate.position);
      edges.computeLineDistances();
      g.add(edges);
    }

    if (site.followed || site.major) {
      const ring = new LineSegments(
        new EdgesGeometry(shared.ring),
        new LineBasicMaterial({ color: site.major ? C.warning : C.active }),
      );
      ring.position.y = 0.01;
      g.add(ring);
    }

    // D6 static glow: soft velvety additive halo + subtle volumetric beacon curtain on active/followed/MAJOR sites
    const glow = stageGlowLevel(site);
    if (glow > 0 && haloTexture) {
      const glowColor = site.major ? C.warning : (site.followed || site.active ? C.active : C.social);
      const halo = new Mesh(shared.halo, new MeshBasicMaterial({
        map: haloTexture,
        color: glowColor,
        transparent: true,
        opacity: Math.min(0.86, glow * 1.48),
        blending: AdditiveBlending,
        depthWrite: false,
      }));
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = -0.07;
      halo.scale.set(STAGE_GLOW.SIZE * 1.28, STAGE_GLOW.SIZE * 1.28, 1);
      halo.userData.glow = true;
      halo.renderOrder = -1;
      halo.raycast = () => {};
      g.add(halo);

      if (beaconTexture && (site.major || site.followed || site.active)) {
        const beacon = new Mesh(shared.beacon, new MeshBasicMaterial({
          map: beaconTexture,
          color: glowColor,
          transparent: true,
          opacity: site.major ? 0.38 : site.followed ? 0.3 : 0.2,
          blending: AdditiveBlending,
          depthWrite: false,
          side: DoubleSide,
        }));
        beacon.position.y = plate.position.y + 0.78;
        beacon.raycast = () => {};
        g.add(beacon);
      }
    }

    if (site.bands.scar) {
      const scar = new LineSegments(
        new EdgesGeometry(shared.scar),
        new LineDashedMaterial({
          color: C.unknown, dashSize: 0.2, gapSize: 0.12,
          transparent: true, opacity: SCAR_OPACITY[site.bands.scar],
        }),
      );
      scar.position.y = plate.position.y + 0.13;
      scar.computeLineDistances();
      g.add(scar);
    }

    // Room-specific miniature architectural landmark
    const py = plate.position.y + 0.11;
    addRoomLandmark(g, site, py);

    // Sculpted miniature tabletop automaton drones in the front plaza of the plinth
    const named = site.tokens.slice(0, 6);
    const tokenCount = named.length + site.unnamed;
    const tokenMap = new Map();
    for (let i = 0; i < tokenCount; i++) {
      const tok = named[i];
      const accent = agentAccent(tok ? tok.handle : "");
      const drone = buildAutomaton(accent, !!tok);
      const pip = drone.root;
      const baseY = py + 0.01;
      const col = i % 3;
      const row = Math.floor(i / 3);
      const rowCount = Math.min(3, tokenCount - row * 3);
      const xOffset = (col - (rowCount - 1) * 0.5) * 0.68;
      const zOffset = row === 0 ? 0.24 : 0.74;
      pip.position.set(xOffset, baseY, zOffset);
      pip.userData.baseY = baseY;
      pip.userData.phase = i * 1.15;
      pip.userData.head = drone.head;
      g.add(pip);
      animatedPawns.push(pip);
      if (tok) {
        pip.userData.handle = tok.handle;
        const npel = document.createElement("div");
        npel.className = "stage3d-nameplate";
        npel.textContent = tok.handle;
        npel.dataset.priority = "-1";
        const nameplate = new CSS2DObject(npel);
        // Float nameplate cleanly above the landmark/drone silhouette, gently fanned outward
        const sideShift = rowCount === 1 ? (site.x >= 0 ? 0.72 : -0.72) : xOffset * 0.38;
        nameplate.position.set(pip.position.x + sideShift, baseY + 1.38 + row * 0.22, pip.position.z - 0.1);
        g.add(nameplate);
        tokenMap.set(tok.handle, { mesh: pip, nameplate });
      }
    }
    g.userData.tokens = tokenMap;
    if (site.more > 0) {
      const moreEl = document.createElement("div");
      moreEl.className = "stage3d-more";
      moreEl.textContent = "+" + site.more;
      const moreObj = new CSS2DObject(moreEl);
      moreObj.position.set(0.95, py + 0.35, 0.95);
      g.add(moreObj);
    }
    if (site.traces > 0) {
      const mark = new Mesh(shared.trace, new MeshStandardMaterial({
        color: C.machine, emissive: C.machine, emissiveIntensity: 0.75, roughness: 0.25,
      }));
      mark.position.set(PLATE / 2 - 0.3, py + 0.14, PLATE / 2 - 0.3);
      g.add(mark);
    }
    g.add(label(site));
    g.position.set(site.x, 0, site.z);
    return g;
  }

  /** Elevated 3D illuminated transit conduits replacing bare 1px lines. */
  function routeLine(route, from, to) {
    const out = new Group();
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) return out;
    const midX = (from.x + to.x) * 0.5;
    const midZ = (from.z + to.z) * 0.5;
    const yaw = Math.atan2(dx, dz);

    // Dark metallic bridge rail bed (non-color-keyed so exit lighting lights the core strip cleanly)
    const bedMat = new MeshStandardMaterial({
      color: 0x2c3846,
      roughness: 0.44,
      metalness: 0.65,
      transparent: route.dashed,
      opacity: route.dashed ? 0.62 : 1,
    });
    bedMat.userData.isBed = true;
    const bed = makeBox(0.38, 0.055, len, bedMat, false);
    bed.receiveShadow = true;
    bed.position.set(midX, -0.05, midZ);
    bed.rotation.y = yaw;
    out.add(bed);

    const coreMat = new MeshStandardMaterial({
      color: C.route.clone(),
      emissive: new Color(0x34667d),
      emissiveIntensity: 0.72,
      roughness: 0.24,
      metalness: 0.25,
    });
    coreMat.userData.routeGlow = true;

    if (route.dashed) {
      // Segmented illuminated bridge sleepers for uncertain routes
      const count = Math.max(3, Math.floor(len / 0.55));
      for (let i = 0; i < count; i++) {
        const frac = (i + 0.5) / count;
        const dash = makeBox(0.11, 0.034, 0.28, coreMat, false);
        dash.position.set(from.x + dx * frac, -0.015, from.z + dz * frac);
        dash.rotation.y = yaw;
        out.add(dash);
      }
    } else {
      // Sleek continuous luminous center energy rail
      const core = makeBox(0.095, 0.034, len, coreMat, false);
      core.position.set(midX, -0.015, midZ);
      core.rotation.y = yaw;
      out.add(core);
    }

    if (route.oneWay) {
      const dir = new Vector3(dx, 0, dz).normalize();
      const arrowMat = new MeshStandardMaterial({
        color: C.route.clone(),
        emissive: new Color(0x34667d),
        emissiveIntensity: 0.85,
        roughness: 0.22,
      });
      arrowMat.userData.routeGlow = true;
      const cone = new Mesh(shared.arrow, arrowMat);
      cone.position.set(from.x + dir.x * len * 0.58, 0.06, from.z + dir.z * len * 0.58);
      cone.quaternion.setFromUnitVectors(UP, dir);
      out.add(cone);
    }
    return out;
  }

  // A rebuild drops the old scene, so no traveller may outlive it.
  function dropTravels() {
    for (const tr of travels) {
      disposeTravelVisuals(tr);
    }
    travels.length = 0;
  }

  // A rebuild keeps travellers in flight: detach their meshes from the old
  // scene and dispose them, but keep the records for rehomeTravels.
  function detachTravels() {
    for (const tr of travels) {
      disposeTravelVisuals(tr);
      tr.destMesh = null;
      tr.destPlate = null;
    }
  }

  // Re-home travellers that were in flight across a rebuild onto the new
  // scene: a new mesh with the same look, from the new site positions, and
  // the original start time so the motion continues where it was.
  function rehomeTravels(now) {
    let kept = false;
    for (let i = travels.length - 1; i >= 0; i--) {
      const tr = travels[i];
      const start = tr.start < 0 ? now : tr.start;
      if (now - start >= STAGE_TRAVEL_MS) {
        travels.splice(i, 1);
        continue;
      }
      const a = groups.get(tr.fromId);
      const b = groups.get(tr.toId);
      const dest = b && b.userData.tokens ? b.userData.tokens.get(tr.handle) : null;
      if (!a || !b || !dest || !dest.mesh) {
        travels.splice(i, 1);
        continue;
      }
      const y = dest.mesh.position.y + 0.24;
      const actor = buildTravelActor(tr.handle);
      // Keeps MeshStandardMaterial reference contract intact while preserving agent accent look
      const mat = actor.mat instanceof MeshStandardMaterial ? actor.mat : new MeshStandardMaterial({ color: agentAccent(tr.handle) });
      const mesh = actor.group;
      mesh.position.set(a.position.x, y, a.position.z);
      world.add(mesh);
      tr.start = start;
      tr.mesh = mesh;
      tr.mat = mat;
      tr.extraMats = actor.extraMats;
      tr.trail = actor.trail;
      tr.from = new Vector3(a.position.x, y, a.position.z);
      tr.to = new Vector3(b.position.x, y, b.position.z);
      tr.destMesh = dest.mesh;
      tr.destPlate = dest.nameplate || null;
      dest.mesh.visible = false;
      if (dest.nameplate) {
        dest.nameplate.visible = false;
        if (dest.nameplate.element) dest.nameplate.element.style.visibility = "hidden";
      }
      kept = true;
    }
    if (kept) request();
  }

  function clearWorld() {
    detachTravels();
    for (const m of moments) {
      if (m.timer) clearTimeout(m.timer);
      m.timer = 0;
      if (m.ring) {
        world.remove(m.ring);
        if (m.ring.material) m.ring.material.dispose();
      }
      if (m.label) m.label.classList.remove("is-moment");
      m.ring = null;
      m.label = null;
    }
    const disposedMats = new Set();
    world.traverse((o) => {
      // Removing an ancestor does not detach CSS2D elements; do it explicitly.
      if (o.isCSS2DObject && o.element && o.element.parentNode) o.element.remove();
      if (o.geometry && !sharedGeos.has(o.geometry)) o.geometry.dispose();
      if (o.material && !disposedMats.has(o.material)) {
        disposedMats.add(o.material);
        o.material.dispose();
      }
    });
    scene.remove(world);
    world = new Group();
    scene.add(world);
    groups.clear();
    routeEntries = [];
    animatedProps = [];
    animatedPawns = [];
    for (const p of pulses) p.ring = null;
  }

  function buildCompass(radius) {
    if (compass) {
      if (compass.element && compass.element.parentNode) compass.element.remove();
      scene.remove(compass);
    }
    const el = document.createElement("div");
    el.className = "stage3d-compass";
    el.textContent = "N";
    compass = new CSS2DObject(el);
    compass.position.set(0, 0.05, -radius - 1.2);
    scene.add(compass);
  }

  function applyLimits(radius) {
    const lim = stageCameraLimits(radius);
    controls.minDistance = lim.minDistance;
    controls.maxDistance = lim.maxDistance;
    controls.maxTargetRadius = lim.maxTargetRadius;
    controls.minPolarAngle = lim.minPolarAngle;
    controls.maxPolarAngle = lim.maxPolarAngle;
  }

  function easeTo(toTarget, toPos) {
    tween = {
      start: performance.now(),
      ms: reduce ? 0 : STAGE_CAMERA_EASE_MS,
      fromTarget: controls.target.clone(),
      toTarget,
      fromPos: camera.position.clone(),
      toPos,
    };
    request();
  }

  function focus(roomId) {
    const g = groups.get(roomId);
    if (!g) return;
    const toTarget = new Vector3(g.position.x, 0, g.position.z);
    const offset = camera.position.clone().sub(controls.target);
    easeTo(toTarget, toTarget.clone().add(offset));
  }

  // Default framing that fits the whole layout crisply at any aspect ratio,
  // pulled close enough that Perihelion Reach fills the diorama viewport cleanly.
  function defaultView() {
    const v = stageDefaultView(model.radius);
    const position = new Vector3(...v.position).multiplyScalar(0.81);
    const halfH = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
    const need = (model.radius * 0.92) / Math.tan(halfH);
    const lim = stageCameraLimits(model.radius);
    position.setLength(Math.min(lim.maxDistance, Math.max(position.length(), need)));
    return { target: new Vector3(...v.target), position };
  }

  function atDefaultTarget() {
    return controls.target.lengthSq() < 1e-6;
  }

  function reset() {
    const v = defaultView();
    spectatorMoved = false;
    // Reset view resumes the director.
    shot = null;
    easeTo(v.target, v.position);
  }

  function majorRing(roomId) {
    const ring = new Mesh(shared.pulse, new MeshBasicMaterial({
      color: C.warning, transparent: true, opacity: 0.92, blending: AdditiveBlending, depthWrite: false,
    }));
    ring.rotation.x = -Math.PI / 2;
    const g = groups.get(roomId);
    ring.position.set(g.position.x, 0.03, g.position.z);
    world.add(ring);
    return ring;
  }

  /** The DOM label of a drawn site, if it has one. */
  function siteLabel(roomId) {
    const g = groups.get(roomId);
    if (!g) return null;
    for (const child of g.children) {
      if (child.isCSS2DObject && child.element && child.element.classList.contains("stage3d-label")) {
        return child.element;
      }
    }
    return null;
  }

  /** A second, softer ring at a site: the MAJOR moment's ground mark. */
  function momentRing(roomId) {
    const g = groups.get(roomId);
    if (!g) return null;
    const ring = new Mesh(shared.pulse, new MeshBasicMaterial({
      color: C.warning, transparent: true, opacity: 0.58, blending: AdditiveBlending, depthWrite: false,
    }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(g.position.x, 0.03, g.position.z);
    ring.scale.setScalar(reduce ? 1.2 : 1.15);
    world.add(ring);
    return ring;
  }

  /** End one site's moment (or all of them), dropping its ring and its label class. */
  function endMoment(roomId) {
    for (let i = moments.length - 1; i >= 0; i--) {
      const m = moments[i];
      if (roomId !== undefined && m.roomId !== roomId) continue;
      if (m.timer) clearTimeout(m.timer);
      m.timer = 0;
      if (m.ring) {
        world.remove(m.ring);
        if (m.ring.material) m.ring.material.dispose();
      }
      if (m.label) m.label.classList.remove("is-moment");
      moments.splice(i, 1);
    }
  }

  /**
   * D6 MAJOR moment: one moment per site, restarted when the same site fires
   * again. Reduced motion holds a still highlight for the same time and never
   * counts as busy.
   */
  function startMoment(roomId) {
    if (!groups.has(roomId)) return;
    endMoment(roomId);
    const ring = momentRing(roomId);
    if (!ring) return;
    const labelEl = siteLabel(roomId);
    if (labelEl) labelEl.classList.add("is-moment");
    const moment = { roomId, ring, label: labelEl, start: performance.now(), ms: STAGE_MAJOR_MOMENT_MS, timer: 0 };
    if (reduce) {
      ring.material.opacity = 0.45;
      moment.timer = setTimeout(() => { endMoment(roomId); request(); }, STAGE_MAJOR_MOMENT_MS);
    }
    moments.push(moment);
    request();
  }

  /** A rebuild drops the old scene; restart the moments that still have time left. */
  function restartMoments(now) {
    for (let i = moments.length - 1; i >= 0; i--) {
      const m = moments[i];
      const elapsed = now - m.start;
      if (elapsed >= m.ms || !groups.has(m.roomId)) { endMoment(m.roomId); continue; }
      m.ring = momentRing(m.roomId);
      if (!m.ring) { endMoment(m.roomId); continue; }
      m.label = siteLabel(m.roomId);
      if (m.label) m.label.classList.add("is-moment");
      if (reduce) {
        const left = Math.max(0, m.ms - elapsed);
        m.timer = setTimeout(() => { endMoment(m.roomId); request(); }, left);
      }
    }
  }

  // One caption stack per site, so captions that land together never overdraw.
  function captionBox(roomId) {
    let box = captionBoxes.get(roomId);
    if (box) return box;
    const g = groups.get(roomId);
    if (!g) return null;
    // A zero-height anchor: the stack grows upward from the point above the site.
    const anchor = document.createElement("div");
    anchor.className = "stage3d-says";
    const el = document.createElement("div");
    el.className = "stage3d-says-list";
    anchor.append(el);
    const obj = new CSS2DObject(anchor);
    obj.position.set(0, 1.55, -PLATE / 2);
    g.add(obj);
    box = { obj, el, anchor };
    captionBoxes.set(roomId, box);
    return box;
  }

  function addCaption(c) {
    const box = captionBox(c.roomId);
    if (!box) return;
    const el = document.createElement("div");
    el.className = "stage3d-say" + (c.tier === "MAJOR" ? " is-major" : "");
    if (c.actor) {
      const b = document.createElement("b");
      b.textContent = c.actor;
      el.append(b, " ");
    }
    const lineEl = document.createElement("span");
    lineEl.className = "stage3d-say-line";
    lineEl.textContent = c.line;
    el.append(lineEl);
    if (c.consequence) {
      const consEl = document.createElement("span");
      consEl.className = "stage3d-say-consequence";
      consEl.textContent = c.consequence;
      el.append(consEl);
    }
    if (c.tier === "MAJOR") box.el.prepend(el);
    else box.el.append(el);
    const entry = { caption: c, el, timer: 0 };
    entry.timer = setTimeout(() => {
      captions = captions.filter((x) => x !== entry);
      el.remove();
      if (!box.el.childElementCount) {
        if (box.obj.parent) box.obj.parent.remove(box.obj);
        box.anchor.remove();
        if (captionBoxes.get(c.roomId) === box) captionBoxes.delete(c.roomId);
      }
      request();
    }, Math.max(0, c.holdMs));
    captions.push(entry);
    request();
  }

  // D6 paced playback: slots already scheduled keep their moment across a
  // rebuild, and pause holds what is left instead of dropping it.
  const playback = [];
  let playbackPaused = false;

  // D6 route travel: the token glides along the drawn route from the site it
  // was shown at to the site its move lands in. The destination token is
  // hidden while its traveller is in flight, then shown again.
  function startTravel(t) {
    if (reduce) return;
    // One traveller per handle: a newer move replaces one still in flight.
    for (let i = travels.length - 1; i >= 0; i--) {
      const old = travels[i];
      if (old.handle !== t.handle) continue;
      disposeTravelVisuals(old);
      if (old.destMesh) old.destMesh.visible = true;
      if (old.destPlate) {
        old.destPlate.visible = true;
        if (old.destPlate.element) old.destPlate.element.style.visibility = "";
      }
      travels.splice(i, 1);
    }
    const a = groups.get(t.from);
    const b = groups.get(t.to);
    if (!a || !b) return;
    const dest = b.userData.tokens && b.userData.tokens.get(t.handle);
    if (!dest || !dest.mesh) return;
    const y = dest.mesh.position.y + 0.24;
    const actor = buildTravelActor(t.handle);
    const mesh = actor.group;
    mesh.position.set(a.position.x, y, a.position.z);
    world.add(mesh);
    dest.mesh.visible = false;
    if (dest.nameplate) {
      dest.nameplate.visible = false;
      if (dest.nameplate.element) dest.nameplate.element.style.visibility = "hidden";
    }
    travels.push({
      handle: t.handle,
      fromId: t.from,
      toId: t.to,
      mesh,
      mat: actor.mat,
      extraMats: actor.extraMats,
      trail: actor.trail,
      from: new Vector3(a.position.x, y, a.position.z),
      to: new Vector3(b.position.x, y, b.position.z),
      start: -1,
      destMesh: dest.mesh,
      destPlate: dest.nameplate || null,
    });
    request();
  }

  function playSequence(slot) {
    for (const p of slot.pulses) {
      // A rebuild can drop a site; a pulse with nowhere to land is skipped.
      if (!groups.has(p.roomId)) continue;
      if (p.tier === "MAJOR") p.ring = majorRing(p.roomId);
      pulses.push(p);
    }
    // D6 MAJOR moments come from the fresh captions, not from the animation
    // pulses: reduced motion suppresses every pulse, but the moment must still
    // fire. startMoment has its own still-highlight branch (WS3-08) and never
    // asks for a frame, so this reads the same in both modes.
    for (const roomId of slot.moments || []) startMoment(roomId);
    for (const c of slot.captions) addCaption(c);
    for (const t of slot.travels) startTravel(t);
    // D6 tier director: with no spectator camera movement and no Follow in
    // force, the camera may cut to a NOTABLE or MAJOR site. Selection and
    // Follow keep priority (they moved the camera in update()).
    if (framed && !spectatorMoved && !ctx.followRoomId) {
      const pick = stageDirectorPick(shot, slot.pulses.filter((p) => groups.has(p.roomId)), performance.now());
      if (pick) {
        shot = pick;
        focus(pick.roomId);
      }
    }
    request();
  }

  function firePlayback(entry) {
    const at = playback.indexOf(entry);
    if (at >= 0) playback.splice(at, 1);
    entry.timer = 0;
    // A rebuilt queue can leave a lower sequence waiting behind this one; play
    // it first, so an older moment can never narrate after a newer one.
    const lower = playback.filter((e) => e.sequence < entry.sequence).sort((a, b) => a.sequence - b.sequence);
    for (const e of lower) {
      const i = playback.indexOf(e);
      if (i >= 0) playback.splice(i, 1);
      if (e.timer) clearTimeout(e.timer);
      e.timer = 0;
      playSequence(e.slot);
    }
    playSequence(entry.slot);
  }

  function setPlayTimer(slot, delay) {
    const entry = { timer: 0, sequence: slot.sequence, atMs: delay, startedAt: performance.now(), remaining: delay, slot };
    playback.push(entry);
    if (!playbackPaused) entry.timer = setTimeout(() => firePlayback(entry), delay);
  }

  function pausePlayback(on) {
    const now = performance.now();
    for (const entry of playback) {
      if (!entry.timer) continue;
      clearTimeout(entry.timer);
      entry.remaining = Math.max(0, entry.atMs - (now - entry.startedAt));
      entry.timer = 0;
    }
    playbackPaused = !!on;
    if (on) return;
    for (const entry of playback) {
      const delay = Math.max(0, entry.remaining);
      entry.atMs = delay;
      entry.startedAt = performance.now();
      entry.timer = setTimeout(() => firePlayback(entry), delay);
    }
  }

  function update(live, nextCtx) {
    if (disposed) return;
    const prevCtx = ctx;
    ctx = nextCtx || {};
    const prevRadius = model.radius;
    // D6 route travel reads the previous scene's handle sites before the rebuild.
    const prevHandleSites = handleSites;
    model = buildStageModel(live, ctx);
    clearWorld();
    for (const site of model.sites) {
      const g = siteGroup(site);
      groups.set(site.id, g);
      world.add(g);
    }
    routeEntries = [];
    for (const r of model.routes) {
      const a = groups.get(r.from);
      const b = groups.get(r.to);
      if (!a || !b) continue;
      const grp = routeLine(r, a.position, b.position);
      world.add(grp);
      const mats = [];
      const seen = new Set();
      grp.traverse((o) => {
        if (o.material && o.material.color && o.material.userData && o.material.userData.routeGlow && !seen.has(o.material)) {
          seen.add(o.material);
          mats.push(o.material);
        }
      });
      routeEntries.push({ from: r.from, to: r.to, mats });
    }
    if (!framed || Math.abs(prevRadius - model.radius) > 0.01) {
      buildCompass(model.radius);
      applyLimits(model.radius);
    }
    // A rebuild drops the old scene; give still-running MAJOR pulses their ring back.
    for (const p of pulses) {
      if (p.tier === "MAJOR" && !p.ring && groups.has(p.roomId)) p.ring = majorRing(p.roomId);
    }
    restartMoments(performance.now());
    // Captions survive a rebuild too: re-home the ones still holding.
    for (const [roomId, box] of captionBoxes) {
      const g = groups.get(roomId);
      if (g) g.add(box.obj);
    }
    // Travellers survive a rebuild too: re-home the ones still in flight.
    rehomeTravels(performance.now());
    // Captions read the same fresh window as pulses, before the sequence advances.
    const fresh = newStagePulses(live && live.recent_events, lastSeq, groups.keys(), {
      reduce,
      snapshotSequence: live && live.sequence,
    });
    const freshCaptions = newStageCaptions(live && live.recent_events, lastSeq, groups.keys());
    lastSeq = fresh.lastSequence;
    // D6 route travel: a token may cross only a drawn public route, and only
    // when the previous snapshot showed its handle at the other end of it.
    const pendingTravels = reduce
      ? []
      : stageTravels(prevHandleSites, model, fresh.pulses, live && live.recent_events);
    handleSites = stageHandleSites(model);
    // D6 paced playback: one slot per fresh sequence, spaced by the public
    // occurred_at deltas. A sequence's pulses and captions land together on
    // its slot, so a burst reads at reading speed instead of all at once.
    const eventAt = new Map();
    const liveEvents = Array.isArray(live && live.recent_events) ? live.recent_events : [];
    for (const ev of liveEvents) {
      if (ev && typeof ev.sequence === "number" && typeof ev.occurred_at === "number") {
        eventAt.set(ev.sequence, ev.occurred_at);
      }
    }
    const slots = new Map();
    const slotFor = (sequence) => {
      let slot = slots.get(sequence);
      if (!slot) {
        slot = { sequence: sequence, occurredAt: eventAt.get(sequence), pulses: [], captions: [], travels: [], moments: [] };
        slots.set(sequence, slot);
      }
      return slot;
    };
    for (const p of fresh.pulses) slotFor(p.sequence).pulses.push(p);
    for (const c of freshCaptions) {
      const slot = slotFor(c.sequence);
      slot.captions.push(c);
      // A MAJOR moment is derived from the caption, so it survives the pulse
      // suppression reduced motion applies. At most one MAJOR caption exists
      // per snapshot, so a slot holds at most one moment.
      if (c.tier === "MAJOR" && !slot.moments.includes(c.roomId)) slot.moments.push(c.roomId);
    }
    for (const t of pendingTravels) slotFor(t.sequence).travels.push(t);
    // A snapshot can arrive while older slots are still waiting. Its rows must
    // not start before every one of those moments, or a newer event — and a
    // MAJOR camera move — would narrate ahead of an older sequence.
    const now = performance.now();
    let queueEnd = now;
    for (const entry of playback) {
      const due = entry.timer ? entry.startedAt + entry.atMs : now + entry.remaining;
      if (due > queueEnd) queueEnd = due;
    }
    const pacing = stagePlaybackOffset([queueEnd], now);
    // Past STAGE_PLAYBACK.MAX_TOTAL_MS the queue is no longer live: play every
    // pending moment now, oldest first. The offset is 0 in that case, so the
    // new rows start from now and a row at 0 still plays in this frame.
    // Pause holds the queue as it is (WS3-12); nothing is flushed while paused.
    if (!playbackPaused && (pacing.flush || queueEnd - now > STAGE_PLAYBACK.MAX_TOTAL_MS)) {
      const pending = playback.slice().sort((a, b) => a.sequence - b.sequence);
      playback.length = 0;
      for (const entry of pending) {
        if (entry.timer) clearTimeout(entry.timer);
        entry.timer = 0;
        playSequence(entry.slot);
      }
    }
    for (const row of stagePlaybackSchedule(Array.from(slots.values()))) {
      const slot = slots.get(row.sequence);
      if (!slot) continue;
      const delay = pacing.offsetMs + row.atMs;
      // A slot at 0 plays in this frame, so the first snapshot is unchanged.
      if (delay <= 0) playSequence(slot);
      else setPlayTimer(slot, delay);
    }
    // Selection and Follow still move the camera in the same frame; a MAJOR
    // pulse moves it when its slot plays (see playSequence).
    if (!framed) {
      framed = true;
      const v = defaultView();
      controls.target.copy(v.target);
      camera.position.copy(v.position);
      controls.update();
    } else {
      const target = stageCameraTarget(prevCtx, ctx, "", spectatorMoved);
      if (target) {
        if (target === ctx.selectedId || target === ctx.followRoomId) spectatorMoved = false;
        focus(target);
      }
    }
    request();
  }

  // Picking: a click (not a drag) on a plate selects its site.
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
    const hit = ray.intersectObjects(world.children, true).find((h) => h.object.userData && h.object.userData.siteId);
    if (hit) onSelect(hit.object.userData.siteId);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  // Any spectator camera movement suspends the director until Reset view.
  controls.addEventListener("start", () => { spectatorMoved = true; tween = null; shot = null; });
  controls.addEventListener("change", request);
  const onKey = (ev) => { if (CAMERA_KEYS.has(ev.key)) { spectatorMoved = true; tween = null; shot = null; } };
  frame.addEventListener("keydown", onKey);
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
    for (const entry of captions) if (entry.timer) clearTimeout(entry.timer);
    captions = [];
    for (const entry of playback) if (entry.timer) clearTimeout(entry.timer);
    playback.length = 0;
    for (const box of captionBoxes.values()) box.anchor.remove();
    captionBoxes.clear();
    dropTravels();
    clearWorld();
    moments.length = 0;
    const envMats = new Set();
    environment.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && !envMats.has(o.material)) {
        envMats.add(o.material);
        o.material.dispose();
      }
    });
    for (const geo of Object.values(shared)) geo.dispose();
    if (haloTexture) haloTexture.dispose();
    if (beaconTexture) beaconTexture.dispose();
    if (skyTexture) skyTexture.dispose();
    if (terrainTex) { terrainTex.map.dispose(); terrainTex.bump.dispose(); }
    if (deckTex) { deckTex.map.dispose(); deckTex.bump.dispose(); }
    controls.dispose();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    frame.removeEventListener("keydown", onKey);
    controls.stopListenToKeyEvents();
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

  return { update, focus, reset, dispose, pause: pausePlayback };
}

window.NoemaWatchStage = { mount };
