/**
 * WATCH Chamber stage renderer (Noema-Specs specify/watch-single-3d-stage.md).
 * Bundled to /assets/watch-stage.js and loaded only when the spectator picks 3D.
 * Draws on demand: respects reduced motion and never draws for a hidden
 * document (WS3-08). Labels are DOM text; the Places list stays the authority.
 */
import {
  ACESFilmicToneMapping, AdditiveBlending, BackSide, BoxGeometry, BufferAttribute, BufferGeometry,
  CanvasTexture, CatmullRomCurve3, Color, ConeGeometry, CylinderGeometry, DirectionalLight, DoubleSide,
  EdgesGeometry, FogExp2, Group, HemisphereLight, InstancedMesh, LatheGeometry, Line, LineBasicMaterial,
  LineDashedMaterial, LineSegments, Matrix4, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D,
  OctahedronGeometry, PCFShadowMap, PerspectiveCamera, PlaneGeometry, PointLight, Points, PointsMaterial,
  Raycaster, RepeatWrapping, RingGeometry, SRGBColorSpace, Scene, TorusGeometry, TubeGeometry, Vector2,
  Vector3, WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import {
  applyRimGlow,
  buildNocturnalEnvMap,
  makeCanvas,
  makeOverviewDeckPbr,
  makeOverviewTerrainPbr,
  mulberry32,
} from "./watch-stage-craft";
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
const PRESSURE_MIX = { low: 0.12, moderate: 0.24, high: 0.38 };
const SCAR_OPACITY = { faint: 0.45, marked: 0.72, deep: 1 };
const PLATE = 2.4;
const SUNKEN_Y = -0.82;
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
    world: new Color(token("--color-surface-world", "#0B0F15")),
    plate: new Color("#212C39"),
    raised: new Color("#273444"),
    selected: new Color("#304052"),
    edge: new Color("#3A4E63"),
    ink: new Color(token("--color-text-primary", "#F0EAE0")),
    active: new Color(token("--color-state-active", "#3DDCFF")),
    warning: new Color(token("--color-state-warning", "#FFB020")),
    social: new Color(token("--color-state-social", "#D4B68A")),
    unknown: new Color(token("--color-state-unknown", "#9B6DFF")),
    machine: new Color(token("--color-text-machine", "#8CB8C8")),
    route: new Color("#35495E"),
  };
}

const AGENT_COLORS = [0x3ddcff, 0xffb020, 0x52e5a8, 0xb68cff, 0xff6b8b, 0x70b8ff];
const VERB_RING_COLORS = { harvest: 0x3ddcff, weld: 0xffb020, charter: 0x52e5a8, message: 0xd4b68a };
function agentAccent(handle) {
  if (!handle) return 0xc9ac82;
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  return AGENT_COLORS[h % AGENT_COLORS.length];
}

function macroVerbKind(ev) {
  if (!ev) return "";
  const pid = String(ev.projection_id || ev.kind || ev.type || "").toLowerCase();
  const verb = String(ev.verb || ev.action || "").toLowerCase();
  if (ev.speech_text || pid.includes("message") || pid.includes("speech") || verb === "message" || verb === "say") {
    return "message";
  }
  if (verb === "harvest" || verb === "commit_supply" || verb === "production" || verb === "recharge" || pid.includes("harvest")) {
    return "harvest";
  }
  if (verb === "build" || verb === "repair" || verb === "restore" || verb === "repurpose" || verb === "remediate" || pid.includes("build") || pid.includes("repair")) {
    return "weld";
  }
  if (verb === "trade" || verb === "contest" || verb === "vest" || verb === "org" || verb === "commemorate" || verb === "contract" || pid.includes("trade") || pid.includes("charter")) {
    return "charter";
  }
  return "";
}

/** Extract recent public macro activity (speaking sites + latest actor deed class) from live.recent_events (newest-first). */
function extractMacroActivity(live) {
  const speakingSites = new Set();
  const actorActivity = new Map();
  const events = Array.isArray(live && live.recent_events) ? live.recent_events : [];
  const newest = events
    .filter(Boolean)
    .slice()
    .sort((a, b) => (Number(b.sequence) || 0) - (Number(a.sequence) || 0))
    .slice(0, 16);
  for (const ev of newest) {
    const vk = macroVerbKind(ev);
    if (!vk) continue;
    const rid = String(ev.room_id || ev.place_id || "");
    if (vk === "message" && rid) speakingSites.add(rid);
    const actor = String(ev.actor_label || ev.actor || ev.handle || "");
    if (actor && !actorActivity.has(actor)) {
      actorActivity.set(actor, { verbKind: vk, isSpeech: vk === "message" });
    }
  }
  const sig = Array.from(speakingSites).sort().join(",") + ";"
    + Array.from(actorActivity.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([h, a]) => h + ":" + a.verbKind).join(",");
  return { speakingSites, actorActivity, sig };
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

/** Deep nocturnal midnight-slate sky backdrop gradient with crisp pinprick starfield. */
function makeHorizonTexture() {
  const c = makeCanvas(256, 256);
  if (!c) return null;
  const { canvas, ctx2d } = c;
  const grad = ctx2d.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#06090F");
  grad.addColorStop(0.36, "#090E17");
  grad.addColorStop(0.64, "#0D1521");
  grad.addColorStop(0.84, "#101927");
  grad.addColorStop(0.94, "#142030");
  grad.addColorStop(1, "#0B0F15");
  ctx2d.fillStyle = grad;
  ctx2d.fillRect(0, 0, 256, 256);
  const rand = mulberry32(4117);
  for (let i = 0; i < 155; i++) {
    const x = rand() * 256;
    const y = rand() * 150;
    const bright = rand();
    const a = 0.2 + bright * 0.72;
    const sz = bright > 0.86 ? 1.5 : 1;
    ctx2d.fillStyle = bright > 0.7
      ? `rgba(214,234,255,${a.toFixed(2)})`
      : `rgba(186,208,232,${(a * 0.75).toFixed(2)})`;
    ctx2d.fillRect(x, y, sz, sz);
  }
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

/** Build a continuous sculpted dark-basalt terraced canyon rim ring around the basin. */
function makeBasaltTerraceRing(rIn, rOut, hBase, hVar, seed, mat) {
  const segs = 80;
  const cols = segs + 1;
  const rings = 4;
  const positions = new Float32Array(cols * rings * 3);
  const indices = [];
  for (let i = 0; i <= segs; i++) {
    const th = (i / segs) * Math.PI * 2;
    const cos = Math.cos(th);
    const sin = Math.sin(th);
    const wave = 0.5
      + 0.25 * Math.sin(th * 3 + seed)
      + 0.15 * Math.cos(th * 5 - seed * 1.3)
      + 0.08 * Math.sin(th * 8 + seed * 0.7);
    const hy = hBase + wave * hVar;
    const ri0 = rIn + (wave - 0.5) * 1.3;
    const ri1 = ri0 + 1.15;
    const ro1 = rOut - 1.2 + (wave - 0.5) * 1.6;
    const ro0 = rOut + 0.9 + (wave - 0.5) * 1.6;
    const prof = [
      [ri0, -0.24],
      [ri1, hy],
      [ro1, hy * 0.88],
      [ro0, -0.24],
    ];
    for (let r = 0; r < rings; r++) {
      const idx = (i * rings + r) * 3;
      positions[idx] = cos * prof[r][0];
      positions[idx + 1] = prof[r][1];
      positions[idx + 2] = sin * prof[r][0];
    }
    if (i < segs) {
      for (let r = 0; r < rings - 1; r++) {
        const a = i * rings + r;
        const b = (i + 1) * rings + r;
        const c = (i + 1) * rings + r + 1;
        const d = i * rings + r + 1;
        indices.push(a, b, d, b, c, d);
      }
    }
  }
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.raycast = () => {};
  return mesh;
}

function makePlanetaryTerrain(terrainTex, skyTex, haloTexture) {
  const grp = new Group();
  // Grounded nocturnal obsidian-basalt planet surface: wide flat settlement basin (r <= 15.8)
  // ringed by continuous terraced basalt canyon walls (160x160 grid for crisp subterranean pit carving).
  const groundGeo = new PlaneGeometry(128, 128, 160, 160);
  const posAttr = groundGeo.attributes.position;
  const baseHeights = new Float32Array(posAttr.count);
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.hypot(x, y);
    let h = 0;
    if (dist > 15.8) {
      const t = Math.min(1, (dist - 15.8) / 10.5);
      const smooth = t * t * (3 - 2 * t);
      const ang = Math.atan2(y, x);
      const wave = 1.05 + 0.42 * Math.sin(ang * 3 + 0.6) + 0.24 * Math.cos(ang * 5 - 1.1) + 0.14 * Math.sin(ang * 7 + 0.3);
      const raw = wave * Math.min(3.6, (dist - 15.8) * 0.16);
      const stepped = Math.round(raw * 2.2) / 2.2;
      h = Math.max(0, smooth * (raw * 0.55 + stepped * 0.45));
    }
    baseHeights[i] = h;
    posAttr.setZ(i, h);
  }
  groundGeo.computeVertexNormals();
  const groundMat = new MeshStandardMaterial({
    color: terrainTex ? 0xdbe6f2 : 0x101620,
    map: terrainTex ? terrainTex.map : null,
    normalMap: terrainTex ? terrainTex.normalMap : null,
    normalScale: new Vector2(0.85, 0.85),
    roughnessMap: terrainTex ? terrainTex.roughnessMap : null,
    roughness: 0.92,
    metalness: 0.2,
  });
  const ground = new Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.15;
  ground.receiveShadow = true;
  ground.raycast = () => {};
  grp.add(ground);

  let lastPitSig = "";
  function updatePits(sunkenCoords, surfaceCoords) {
    const sig = sunkenCoords.map((p) => p.x.toFixed(2) + "," + p.z.toFixed(2)).join("|")
      + ";" + surfaceCoords.map((p) => p.x.toFixed(2) + "," + p.z.toFixed(2)).join("|");
    if (sig === lastPitSig) return;
    lastPitSig = sig;
    for (let i = 0; i < posAttr.count; i++) {
      let h = baseHeights[i];
      const wx = posAttr.getX(i);
      const wz = -posAttr.getY(i);
      if (sunkenCoords.length && Math.hypot(wx, wz) < 15.6) {
        let onSurfaceSite = false;
        for (let s = 0; s < surfaceCoords.length; s++) {
          if (Math.abs(wx - surfaceCoords[s].x) < 1.38 && Math.abs(wz - surfaceCoords[s].z) < 1.38) {
            onSurfaceSite = true;
            break;
          }
        }
        if (!onSurfaceSite) {
          for (let p = 0; p < sunkenCoords.length; p++) {
            const cheb = Math.max(Math.abs(wx - sunkenCoords[p].x), Math.abs(wz - sunkenCoords[p].z));
            if (cheb < 1.54) {
              h = Math.min(h, -0.94);
            } else if (cheb < 2.16) {
              const t = (cheb - 1.54) / (2.16 - 1.54);
              const smooth = t * t * (3 - 2 * t);
              h = Math.min(h, -0.94 * (1 - smooth));
            }
          }
        }
      }
      posAttr.setZ(i, h);
    }
    posAttr.needsUpdate = true;
    groundGeo.computeVertexNormals();
  }

  // Hairline architectural slate-steel survey rings accented only by restrained antique-brass cardinal ticks
  const surveyMat = new MeshStandardMaterial({
    color: 0x243344,
    emissive: 0x162230,
    emissiveIntensity: 0.26,
    roughness: 0.48,
    metalness: 0.68,
    transparent: true,
    opacity: 0.55,
  });
  const surveyRing = new Mesh(new RingGeometry(14.16, 14.28, 96), surveyMat);
  surveyRing.rotation.x = -Math.PI / 2;
  surveyRing.position.y = -0.138;
  surveyRing.raycast = () => {};
  grp.add(surveyRing);

  const outerArc = new Mesh(
    new RingGeometry(15.22, 15.29, 96),
    new MeshBasicMaterial({
      color: 0x243344,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    }),
  );
  outerArc.rotation.x = -Math.PI / 2;
  outerArc.position.y = -0.139;
  outerArc.raycast = () => {};
  grp.add(outerArc);

  const brassTickMat = new MeshStandardMaterial({
    color: 0x8c7558,
    emissive: 0x3b2f20,
    emissiveIntensity: 0.22,
    roughness: 0.42,
    metalness: 0.72,
  });
  const majorTickGeo = new BoxGeometry(0.08, 0.014, 0.68);
  const minorTickGeo = new BoxGeometry(0.055, 0.012, 0.36);
  for (let i = 0; i < 8; i++) {
    const th = (i / 8) * Math.PI * 2;
    const isCard = i % 2 === 0;
    const tick = new Mesh(isCard ? majorTickGeo : minorTickGeo, brassTickMat);
    const r = 14.22;
    tick.position.set(Math.sin(th) * r, -0.134, -Math.cos(th) * r);
    tick.rotation.y = -th;
    tick.raycast = () => {};
    grp.add(tick);
  }

  // Sculpted continuous layered dark-basalt canyon rim terraces around r = 16.5..28
  const rimInnerMat = applyRimGlow(new MeshStandardMaterial({
    color: 0x1c2738,
    emissive: 0x0d1520,
    emissiveIntensity: 0.28,
    roughness: 0.78,
    metalness: 0.22,
  }), 0x4ca8d8, 0.24, 3.0);
  const rimOuterMat = applyRimGlow(new MeshStandardMaterial({
    color: 0x243347,
    emissive: 0x0d1520,
    emissiveIntensity: 0.26,
    roughness: 0.78,
    metalness: 0.2,
  }), 0x56bce8, 0.28, 3.2);
  grp.add(makeBasaltTerraceRing(16.8, 22.0, 0.72, 0.95, 0.4, rimInnerMat));
  grp.add(makeBasaltTerraceRing(21.4, 28.4, 1.45, 1.55, 2.1, rimOuterMat));

  // Instanced sculpted basalt rock outcrops & rim monoliths around the canyon terraces (1 draw call!)
  {
    const rockCount = 96;
    const rockGeo = new OctahedronGeometry(0.55, 0);
    const rockMat = applyRimGlow(new MeshStandardMaterial({
      color: 0x192434,
      roughness: 0.82,
      metalness: 0.24,
    }), 0x489ec8, 0.22, 3.2);
    const rocks = new InstancedMesh(rockGeo, rockMat, rockCount);
    const dummy = new Object3D();
    const rRand = mulberry32(4771);
    for (let i = 0; i < rockCount; i++) {
      const th = (i / rockCount) * Math.PI * 2 + (rRand() - 0.5) * 0.14;
      const dist = 16.2 + rRand() * 9.8;
      const sx = 0.65 + rRand() * 1.45;
      const sy = 0.55 + rRand() * 1.9;
      const sz = 0.65 + rRand() * 1.35;
      dummy.position.set(Math.cos(th) * dist, 0.18 + (dist - 16.2) * 0.13 + sy * 0.12, Math.sin(th) * dist);
      dummy.rotation.set((rRand() - 0.5) * 0.35, rRand() * Math.PI * 2, (rRand() - 0.5) * 0.35);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      rocks.setMatrixAt(i, dummy.matrix);
    }
    rocks.instanceMatrix.needsUpdate = true;
    rocks.receiveShadow = true;
    rocks.raycast = () => {};
    grp.add(rocks);
  }

  // Nocturnal midnight-slate horizon backdrop cylinder
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

  // Subtle nocturnal starlight motes drifting above the obsidian basin
  const count = 120;
  const pos = new Float32Array(count * 3);
  const rand = mulberry32(1337);
  for (let i = 0; i < count; i++) {
    const theta = rand() * Math.PI * 2;
    const r = 3.2 + rand() * 20;
    const h = 0.6 + rand() * 4.6;
    pos[i * 3] = Math.cos(theta) * r;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = Math.sin(theta) * r;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new BufferAttribute(pos, 3));
  const dust = new Points(
    dustGeo,
    new PointsMaterial({
      color: 0x9ec4e0,
      map: haloTexture || null,
      size: haloTexture ? 0.24 : 0.11,
      transparent: true,
      opacity: 0.28,
      blending: AdditiveBlending,
      depthWrite: false,
    }),
  );
  dust.raycast = () => {};
  grp.add(dust);
  return { grp, updatePits };
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function mount(frame, opts) {
  const canvas = opts.canvas;
  const labelRoot = opts.labels;
  const reduce = !!opts.reduce;
  const onSelect = typeof opts.onSelect === "function" ? opts.onSelect : () => {};
  const onEnterRoom = typeof opts.onEnterRoom === "function" ? opts.onEnterRoom : () => {};
  const onLost = typeof opts.onLost === "function" ? opts.onLost : () => {};
  const C = palette();
  const haloTexture = makeHaloTexture();
  const beaconTexture = makeBeaconTexture();
  const skyTexture = makeHorizonTexture();
  const terrainTex = makeOverviewTerrainPbr();
  const deckTex = makeOverviewDeckPbr();

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
  renderer.setClearColor(0x0b0f15, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.28;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  const labels = new CSS2DRenderer({ element: labelRoot });

  const scene = new Scene();
  const envRig = buildNocturnalEnvMap(renderer);
  if (envRig) {
    scene.environment = envRig.envMap;
    scene.environmentIntensity = 0.92;
  }
  scene.fog = new FogExp2(0x0b1017, 0.0068);
  const env = makePlanetaryTerrain(terrainTex, skyTexture, haloTexture);
  const environment = env.grp;
  scene.add(environment);

  // Chiaroscuro lighting: cool starlight-silver key + midnight hemisphere + steel-cyan rim + localized lantern hearth
  const hemi = new HemisphereLight(0x9bb6d4, 0x101824, 1.38);
  scene.add(hemi);
  const sun = new DirectionalLight(0xc8def4, 2.45);
  sun.position.set(-14, 17, 11);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.radius = 2.5;
  sun.shadow.camera.left = -18;
  sun.shadow.camera.right = 18;
  sun.shadow.camera.top = 18;
  sun.shadow.camera.bottom = -18;
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 52;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);

  const rim = new DirectionalLight(0x4bc8f0, 1.25);
  rim.position.set(15, 10, -13);
  scene.add(rim);

  const hearth = new PointLight(0xffb454, 2.6, 26, 1.28);
  hearth.position.set(-1.0, 2.8, -1.2);
  scene.add(hearth);

  const camera = new PerspectiveCamera(38, 1, 0.1, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.listenToKeyEvents(frame);

  // Shared primitive geometry pool (reused across all plinths, landmarks, conduits, and drones)
  const shared = {
    subBase: new BoxGeometry(PLATE + 0.30, 0.14, PLATE + 0.30),
    collar: new BoxGeometry(PLATE + 0.12, 0.07, PLATE + 0.12),
    plate: new BoxGeometry(PLATE, 0.22, PLATE),
    curbX: new BoxGeometry(PLATE + 0.04, 0.042, 0.045),
    curbZ: new BoxGeometry(0.045, 0.042, PLATE + 0.04),
    trimX: new BoxGeometry(PLATE - 0.14, 0.026, 0.026),
    trimZ: new BoxGeometry(0.026, 0.026, PLATE - 0.14),
    cornerPost: new BoxGeometry(0.11, 0.11, 0.11),
    ring: new BoxGeometry(PLATE + 0.56, 0.04, PLATE + 0.56),
    scar: new BoxGeometry(PLATE - 0.56, 0.02, PLATE - 0.56),
    beacon: new CylinderGeometry(PLATE * 0.46, PLATE * 0.60, 1.35, 24, 1, true),
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
    arrow: new ConeGeometry(0.18, 0.46, 6),
    pulse: new RingGeometry(1.66, 1.88, 48),
    pulseInner: new RingGeometry(1.26, 1.38, 48),
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
  let pendingDive = null;
  let spectatorMoved = false;
  /** D6 tier director: the shot the camera holds, or null when it holds none. */
  let shot = null;
  let framed = false;
  let frameId = 0;
  let dirty = false;
  let shadowsDirty = true;
  let declutterDirty = true;
  let lastWorldSig = "";
  let lastTopoSig = "";
  let disposed = false;
  let hoveredSiteId = "";
  let hoveredHandle = "";
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

  /** Determine deterministic role archetype cue from public handle (Founder/Quartermaster/Custodian/Archivist/Speaker/Surveyor). */
  function overviewRoleKind(handle) {
    const s = String(handle || "").toLowerCase();
    if (s.includes("archivist")) return "archivist";
    if (s.includes("custodian") || s.includes("maint")) return "custodian";
    if (s.includes("surveyor")) return "surveyor";
    if (s.includes("quartermaster")) return "quartermaster";
    if (s.includes("founder") || s.includes("speaker")) return "civic";
    return "operator";
  }

  /** Sculpted miniature tabletop automaton drone echoing hero-table.jpg figures with role silhouette cues. */
  function buildAutomaton(accent, isNamed, handle) {
    const root = new Group();
    const mats = [];
    const roleKind = overviewRoleKind(handle);
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
    const baseMat = new MeshStandardMaterial({ color: 0x303c4a, roughness: 0.38, metalness: 0.72 });
    mats.push(baseMat);
    const base = new Mesh(shared.pipBase, baseMat);
    base.position.y = 0.04;
    base.castShadow = true;
    base.receiveShadow = true;
    root.add(base);

    // Chamfered hooded chassis/cloak body with Fresnel rim separation
    const bodyMat = applyRimGlow(new MeshStandardMaterial({
      color: cloakColor,
      emissive: accent,
      emissiveIntensity: isNamed ? 0.3 : 0.12,
      roughness: 0.38,
      metalness: 0.42,
    }), accent, isNamed ? 0.38 : 0.16, 2.8);
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
      metalness: 0.48,
    });
    mats.push(collarMat);
    const collar = new Mesh(shared.pipCollar, collarMat);
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 0.43;
    root.add(collar);

    // Hovering geometric head with role-matched silhouette cues matching Room View archetypes
    const head = new Group();
    head.position.y = 0.59;
    const crownMat = new MeshStandardMaterial({
      color: 0xf8fbff,
      emissive: accent,
      emissiveIntensity: isNamed ? 1.45 : 0.45,
      roughness: 0.16,
      metalness: 0.32,
    });
    mats.push(crownMat);
    const visorMat = new MeshStandardMaterial({
      color: 0x101820,
      emissive: accent,
      emissiveIntensity: isNamed ? 1.8 : 0.5,
      roughness: 0.1,
      metalness: 0.65,
    });
    mats.push(visorMat);
    const brassMini = new MeshStandardMaterial({ color: 0xb69058, roughness: 0.32, metalness: 0.78 });
    mats.push(brassMini);

    if (roleKind === "archivist") {
      // Pointed cowl hood + glowing ocular visor
      const cowl = new Mesh(shared.arrow, bodyMat);
      cowl.scale.set(1.05, 0.72, 1.05);
      cowl.position.y = 0.04;
      cowl.castShadow = true;
      head.add(cowl);
      const visor = new Mesh(shared.pipVisor, visorMat);
      visor.position.set(0, -0.02, 0.08);
      head.add(visor);
    } else if (roleKind === "operator" || roleKind === "quartermaster") {
      // Boxy CRT monitor head (hero-table.jpg homage)
      const crt = makeBox(0.22, 0.18, 0.18, baseMat, true);
      head.add(crt);
      const scr = makeBox(0.16, 0.11, 0.03, crownMat, false);
      scr.position.set(0, 0, 0.085);
      head.add(scr);
      if (roleKind === "quartermaster") {
        const pack = makeBox(0.18, 0.22, 0.12, brassMini, false);
        pack.position.set(0, -0.22, -0.14);
        root.add(pack);
      }
    } else if (roleKind === "custodian") {
      // Helm + vertical lantern staff finial
      const crown = new Mesh(shared.pipHead, crownMat);
      crown.castShadow = true;
      head.add(crown);
      const staff = makeBox(0.03, 0.52, 0.03, brassMini, false);
      staff.position.set(0.19, 0.34, 0.05);
      root.add(staff);
      const lamp = new Mesh(shared.trailDot, crownMat);
      lamp.position.set(0.19, 0.64, 0.05);
      root.add(lamp);
    } else if (roleKind === "surveyor") {
      // Domed optic head + dual swept antenna fins
      const crown = new Mesh(shared.pipHead, crownMat);
      crown.scale.set(0.92, 0.86, 0.92);
      crown.castShadow = true;
      head.add(crown);
      for (const sx of [-0.09, 0.09]) {
        const fin = makeBox(0.025, 0.18, 0.05, brassMini, false);
        fin.position.set(sx, 0.11, -0.04);
        fin.rotation.set(-0.35, 0, sx < 0 ? 0.28 : -0.28);
        head.add(fin);
      }
    } else {
      // Founder / Speaker: ceremonial brass halo crest + luminous crown
      const crown = new Mesh(shared.pipHead, crownMat);
      crown.castShadow = true;
      head.add(crown);
      const crest = new Mesh(shared.pipCollar, brassMini);
      crest.position.set(0, 0.08, -0.04);
      crest.scale.setScalar(1.18);
      head.add(crest);
    }
    root.add(head);
    root.scale.setScalar(1.14);

    return { root, head, groundRing, bodyMat, ringMat, glowMats: [bodyMat, collarMat, crownMat, visorMat], mats };
  }

  /** Build bespoke miniature architectural landmarks for each of the 10 Chamber rooms. */
  function addRoomLandmark(parent, site, baseY) {
    const sid = String(site.id || "");
    const g = new Group();
    g.position.set(0, baseY, 0);
    g.scale.setScalar(1.20);
    parent.add(g);
    const py = 0;
    const darkMetal = new MeshStandardMaterial({ color: 0x263342, roughness: 0.46, metalness: 0.62 });
    const steel = new MeshStandardMaterial({ color: 0x5d7288, roughness: 0.36, metalness: 0.62 });
    const brass = new MeshStandardMaterial({ color: 0xb08c5c, roughness: 0.35, metalness: 0.72 });
    const cyanGlow = new MeshStandardMaterial({ color: 0x9cf0ff, emissive: 0x3ddcff, emissiveIntensity: 1.55, roughness: 0.18 });
    const amberGlow = new MeshStandardMaterial({ color: 0xffdc8c, emissive: 0xff9a1a, emissiveIntensity: 1.65, roughness: 0.18 });
    const violetGlow = new MeshStandardMaterial({ color: 0xd9c2ff, emissive: 0x9b6dff, emissiveIntensity: 1.48, roughness: 0.2 });

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
    return g;
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
    declutterDirty = true;
    request();
  }

  function request() {
    if (disposed || frameId) return;
    if (document.hidden) { dirty = true; return; }
    frameId = requestAnimationFrame(draw);
  }

  function disposeRing(ring) {
    if (!ring) return;
    world.remove(ring);
    if (ring.userData && ring.userData.rings) {
      for (const r of ring.userData.rings) {
        if (r.material) r.material.dispose();
      }
    } else if (ring.material) {
      ring.material.dispose();
    }
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
      if (t >= 1) {
        const done = tween.onDone;
        tween = null;
        if (done) done();
      } else busy = true;
    }
    for (const g of groups.values()) g.position.y = g.userData.baseY || 0;
    pulses = pulses.filter((p) => {
      const g = groups.get(p.roomId);
      if (p.start === undefined) p.start = now;
      const t = (now - p.start) / p.ttl;
      if (!g || t >= 1) {
        disposeRing(p.ring);
        return false;
      }
      g.position.y = Math.max(g.position.y, (g.userData.baseY || 0) + Math.sin(t * Math.PI) * LIFT[p.tier]);
      if (p.ring) {
        const rings = p.ring.userData && p.ring.userData.rings;
        if (rings) {
          rings[0].scale.setScalar(1 + t * 0.95);
          rings[0].material.opacity = 0.92 * (1 - t);
          const t2 = Math.max(0, (t - 0.14) / 0.86);
          rings[1].scale.setScalar(1 + t2 * 1.18);
          rings[1].material.opacity = t > 0.14 ? 0.66 * (1 - t2) : 0;
        } else {
          p.ring.scale.setScalar(1 + t * 0.9);
          p.ring.material.opacity = 0.92 * (1 - t);
        }
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
      const rings = m.ring.userData && m.ring.userData.rings;
      if (rings) {
        rings[0].scale.setScalar(1.12 + 0.24 * Math.sin(t * Math.PI * 6));
        rings[0].material.opacity = 0.56 * (1 - t * t);
        rings[1].scale.setScalar(1.02 + 0.16 * Math.sin(t * Math.PI * 6 + 1.2));
        rings[1].material.opacity = 0.42 * (1 - t * t);
      } else {
        m.ring.scale.setScalar(1.15 + 0.25 * Math.sin(t * Math.PI * 6));
        m.ring.material.opacity = 0.58 * (1 - t * t);
      }
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
      const py = tr.from.y + (tr.to.y - tr.from.y) * k + Math.sin(t * Math.PI) * 0.85;
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
            tr.from.y + (tr.to.y - tr.from.y) * tk + Math.sin(tt * Math.PI) * 0.85 + 0.14,
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
    // §18.6 exit lighting: idle conduits stay muted slate-steel; while an agent-move
    // pulse or active travel flight lives, touching/traversed routes surge to electric cyan.
    const lit = stageLitRoutes(pulses.filter((p) => p.projectionId === "agent_move"), model.routes);
    for (const tr of travels) {
      if (tr.fromId && tr.toId) {
        lit.add(tr.fromId + "|" + tr.toId);
        lit.add(tr.toId + "|" + tr.fromId);
      }
    }
    for (const entry of routeEntries) {
      const on = lit.has(entry.from + "|" + entry.to);
      for (const m of entry.mats) {
        m.color.copy(on ? C.active : C.route);
        if (m.emissive) {
          m.emissive.setHex(on ? C.active.getHex() : 0x26384a);
          m.emissiveIntensity = on ? 2.2 : 0.14;
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
        const ph = pawn.userData.phase || 0;
        pawn.position.y = pawn.userData.baseY + Math.sin(sec * 2.2 + ph) * 0.05;
        if (pawn.userData.head) pawn.userData.head.rotation.y = sec * 1.25;
        if (pawn.userData.verbRing) {
          pawn.userData.verbRing.scale.setScalar(pawn.userData.verbActive ? (1.06 + Math.sin(sec * 3.8 + ph) * 0.14) : 1);
        }
      }
      if (!document.hidden && (animatedProps.length > 0 || animatedPawns.length > 0)) busy = true;
    }
    if (controls.enableDamping) controls.update();
    if (shadowsDirty || pulses.length > 0 || travels.length > 0) {
      renderer.shadowMap.needsUpdate = true;
      shadowsDirty = false;
    }
    renderer.render(scene, camera);
    labels.render(scene, camera);
    if (declutterDirty || tween || travels.length > 0) {
      declutter();
      declutterDirty = false;
    }
    if (busy) request();
  }

  // Labels stay readable (Lightweight §18): nudge colliding labels smoothly in
  // screen space so all co-located agent nameplates and site labels stay clear.
  function declutter() {
    const els = Array.from(labelRoot.querySelectorAll(".stage3d-label, .stage3d-nameplate"));
    els.sort((a, b) => Number(b.dataset.priority || 0) - Number(a.dataset.priority || 0));
    const fr = frame.getBoundingClientRect();
    const placed = [];
    const siteNameplates = new Map();
    const padX = 7;
    const padY = 5;
    const overlaps = (a, b) =>
      a.left < b.right + padX && a.right > b.left - padX && a.top < b.bottom + padY && a.bottom > b.top - padY;
    const overlapArea = (a, b) => {
      const ox = Math.min(a.right + padX, b.right + padX) - Math.max(a.left - padX, b.left - padX);
      const oy = Math.min(a.bottom + padY, b.bottom + padY) - Math.max(a.top - padY, b.top - padY);
      return ox > 0 && oy > 0 ? ox * oy : 0;
    };
    const clampOffset = (base, ox, oy, maxShift) => {
      const mag = Math.hypot(ox, oy);
      if (mag > maxShift) {
        ox = (ox / mag) * maxShift;
        oy = (oy / mag) * maxShift;
      }
      if (fr.width > 40 && fr.height > 40) {
        const minOx = (fr.left + 8) - base.left;
        const maxOx = (fr.right - 8) - base.right;
        const minOy = (fr.top + 8) - base.top;
        const maxOy = (fr.bottom - 8) - base.bottom;
        if (minOx <= maxOx) ox = Math.max(minOx, Math.min(maxOx, ox));
        if (minOy <= maxOy) oy = Math.max(minOy, Math.min(maxOy, oy));
      }
      return [ox, oy];
    };
    const candidates = [
      [0, 0], [0, -20], [18, -22], [-18, -22], [0, -38], [-50, -18], [50, -18], [0, 24],
      [-66, 0], [66, 0], [-56, -40], [56, -40], [0, -64], [-84, -24], [84, -24], [-62, 24], [62, 24], [0, 46],
    ];

    for (const el of els) {
      el.classList.remove("is-tucked");
      el.style.marginLeft = "";
      el.style.marginTop = "";
      if (el.style.display === "none" || el.style.visibility === "hidden") continue;
      const base = el.getBoundingClientRect();
      if (base.width <= 0 || base.height <= 0) continue;
      const isName = el.classList.contains("stage3d-nameplate");
      const maxShift = isName ? 112 : 76;
      let [ox, oy] = clampOffset(base, 0, 0, maxShift);
      let box = { left: base.left + ox, right: base.right + ox, top: base.top + oy, bottom: base.bottom + oy };
      let clear = !placed.some((p) => overlaps(box, p));
      let bestOx = ox;
      let bestOy = oy;
      let bestBox = box;
      let bestScore = Infinity;

      if (!clear) {
        // First try structured clean offsets around anchor
        for (const [cx0, cy0] of candidates) {
          const [tx, ty] = clampOffset(base, cx0, cy0, maxShift);
          const tb = { left: base.left + tx, right: base.right + tx, top: base.top + ty, bottom: base.bottom + ty };
          let area = 0;
          for (const p of placed) area += overlapArea(tb, p);
          const score = area * 100 + Math.hypot(tx, ty);
          if (area === 0) {
            ox = tx; oy = ty; box = tb; clear = true; break;
          }
          if (score < bestScore) {
            bestScore = score; bestOx = tx; bestOy = ty; bestBox = tb;
          }
        }
      }
      if (!clear) {
        // Iterative repulsion fallback
        ox = bestOx;
        oy = bestOy;
        box = bestBox;
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
          [ox, oy] = clampOffset(base, ox + dx, oy + dy, maxShift);
          box = { left: base.left + ox, right: base.right + ox, top: base.top + oy, bottom: base.bottom + oy };
          let area = 0;
          for (const p of placed) area += overlapArea(box, p);
          const score = area * 100 + Math.hypot(ox, oy);
          if (area === 0) { clear = true; break; }
          if (score < bestScore) {
            bestScore = score; bestOx = ox; bestOy = oy; bestBox = box;
          }
        }
      }
      const siteId = el.dataset.siteId || "";
      const seenAtSite = isName ? (siteNameplates.get(siteId) || 0) : 0;
      // Never hide co-located agent nameplates unless >4 stack densely at one site
      if (clear || (isName && seenAtSite < 4)) {
        const fx = clear ? ox : bestOx;
        const fy = clear ? oy : bestOy;
        const fbox = clear ? box : bestBox;
        if (Math.abs(fx) >= 1) el.style.marginLeft = Math.round(fx) + "px";
        if (Math.abs(fy) >= 1) el.style.marginTop = Math.round(fy) + "px";
        placed.push(fbox);
        if (isName) siteNameplates.set(siteId, seenAtSite + 1);
      } else {
        el.classList.add("is-tucked");
      }
    }
  }

  function updateSiteLabel(el, site, speaking) {
    const states = [];
    if (site.active) states.push("active");
    if (site.selected) states.push("selected");
    if (site.followed) states.push("followed");
    if (site.major) states.push("major");
    if (site.certainty === "partial" || site.certainty === "unknown") states.push("partial");
    if (speaking) states.push("speaking");
    el.setAttribute("data-state", states.join(" "));
    el.dataset.priority = String(
      (site.selected ? 40 : 0) + (site.followed ? 32 : 0) + (site.major ? 16 : 0) + (site.active ? 8 : 0) + (speaking ? 6 : 0) + (site.players > 0 ? 4 : 0),
    );
    el.title = site.name;
    el.replaceChildren();
    const name = document.createElement("span");
    name.textContent = site.name;
    el.append(name);
    if (speaking) {
      const sp = document.createElement("span");
      sp.className = "stage3d-speech-pip";
      sp.textContent = "···";
      sp.title = "Recent public dialogue";
      el.append(sp);
    }
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
  }

  function label(site, allSites, speaking) {
    const el = document.createElement("div");
    el.className = "stage3d-label";
    el.dataset.siteId = site.id;
    updateSiteLabel(el, site, speaking);
    el.addEventListener("click", (ev) => { ev.stopPropagation(); onSelect(site.id); });
    el.addEventListener("dblclick", (ev) => { ev.stopPropagation(); onEnterRoom(site.id); });
    const obj = new CSS2DObject(el);
    // Anchor along front-lower bevel; if a tight neighbor sits directly to our south-east
    // (e.g. Foundry Corridor above Generator Hall), anchor cleanly along the uncluttered north-west rim.
    let lx = 0;
    let ly = 0.08;
    let lz = PLATE / 2 + 0.24;
    for (const other of allSites || []) {
      if (other.id === site.id) continue;
      const dx = other.x - site.x;
      const dz = other.z - site.z;
      const dist = Math.hypot(dx, dz);
      if (dz > 0.5 && dist < 3.4) {
        lx = -0.35;
        ly = 0.14;
        lz = -PLATE / 2 - 0.24;
        break;
      }
      if (dz > 0.5 && dx > 0.5 && dist < 4.2) {
        lx = -0.45;
      }
    }
    obj.position.set(lx, ly, lz);
    return { obj, el };
  }

  /** Carved obsidian subterranean pit collar flush with the basin floor around sunken bays. */
  function addSubterraneanPit(parent) {
    const rimY = -0.15 - SUNKEN_Y; // Basin floor in local coordinates (+0.67)
    const wallH = rimY + 0.14; // Spans from pit floor (-0.14) to basin floor (+0.67)
    const wallMidY = -0.14 + wallH * 0.5;
    const innerHalf = 1.44;
    const wallT = 0.22;
    const span = (innerHalf + wallT) * 2;
    const wallMat = new MeshStandardMaterial({ color: 0x0e1520, roughness: 0.84, metalness: 0.28 });
    const rimMat = new MeshStandardMaterial({ color: 0x263445, roughness: 0.46, metalness: 0.64 });
    const glowMat = new MeshStandardMaterial({
      color: 0x52c8e8, emissive: 0x2898be, emissiveIntensity: 0.65, roughness: 0.28,
    });

    // Dark obsidian pit floor slab
    const floorMat = new MeshStandardMaterial({ color: 0x070b10, roughness: 0.9, metalness: 0.18 });
    const floor = makeBox(innerHalf * 2 + 0.1, 0.06, innerHalf * 2 + 0.1, floorMat, false);
    floor.position.set(0, -0.14, 0);
    floor.receiveShadow = true;
    floor.raycast = () => {};
    parent.add(floor);

    // 4 recessed shaft retaining walls + beveled basin-level collar flange + subtle inner shaft glow
    for (const s of [-1, 1]) {
      const wx = makeBox(span, wallH, wallT, wallMat, false);
      wx.position.set(0, wallMidY, s * (innerHalf + wallT * 0.5));
      wx.receiveShadow = true;
      wx.raycast = () => {};
      parent.add(wx);

      const wz = makeBox(wallT, wallH, innerHalf * 2, wallMat, false);
      wz.position.set(s * (innerHalf + wallT * 0.5), wallMidY, 0);
      wz.receiveShadow = true;
      wz.raycast = () => {};
      parent.add(wz);

      // Flush top collar flange (hides terrain transition cleanly)
      const fx = makeBox(span + 0.46, 0.055, 0.44, rimMat, false);
      fx.position.set(0, rimY + 0.015, s * (innerHalf + 0.22));
      fx.receiveShadow = true;
      fx.raycast = () => {};
      parent.add(fx);

      const fz = makeBox(0.44, 0.055, innerHalf * 2, rimMat, false);
      fz.position.set(s * (innerHalf + 0.22), rimY + 0.015, 0);
      fz.receiveShadow = true;
      fz.raycast = () => {};
      parent.add(fz);

      // Subtle cool recessed interior shaft glow strip
      const gx = makeBox(innerHalf * 2 - 0.08, 0.025, 0.028, glowMat, false);
      gx.position.set(0, rimY - 0.09, s * (innerHalf - 0.01));
      gx.raycast = () => {};
      parent.add(gx);

      const gz = makeBox(0.028, 0.025, innerHalf * 2 - 0.08, glowMat, false);
      gz.position.set(s * (innerHalf - 0.01), rimY - 0.09, 0);
      gz.raycast = () => {};
      parent.add(gz);
    }
  }

  function disposeTokenEntry(layer, tok) {
    if (!tok) return;
    for (let i = travels.length - 1; i >= 0; i--) {
      if (travels[i].destMesh === tok.mesh) {
        disposeTravelVisuals(travels[i]);
        travels.splice(i, 1);
      }
    }
    if (tok.mesh && tok.mesh.parent) tok.mesh.parent.remove(tok.mesh);
    if (tok.nameplate) {
      if (tok.nameplate.element && tok.nameplate.element.parentNode) tok.nameplate.element.remove();
      if (tok.nameplate.parent) tok.nameplate.parent.remove(tok.nameplate);
    }
    if (tok.mats) for (const m of tok.mats) if (m && typeof m.dispose === "function") m.dispose();
  }

  function rebuildAnimatedPawns() {
    animatedPawns = [];
    for (const g of groups.values()) {
      const refs = g.userData.shellRefs;
      if (!refs) continue;
      if (g.userData.tokens) {
        for (const tok of g.userData.tokens.values()) {
          if (tok && tok.mesh) animatedPawns.push(tok.mesh);
        }
      }
      if (refs.unnamedList) {
        for (const u of refs.unnamedList) {
          if (u && u.mesh) animatedPawns.push(u.mesh);
        }
      }
    }
  }

  function tokenSlotCoords(i, tokenCount) {
    let xOffset = 0;
    let zOffset = 0.34;
    let row = 0;
    if (tokenCount === 1) {
      xOffset = 0;
      zOffset = 0.34;
    } else if (tokenCount === 2) {
      xOffset = i === 0 ? -0.68 : 0.68;
      zOffset = i === 0 ? 0.28 : 0.48;
    } else if (tokenCount === 3) {
      xOffset = (i - 1) * 0.72;
      zOffset = i === 1 ? 0.56 : 0.24;
    } else {
      const col = i % 3;
      row = Math.floor(i / 3);
      const rowCount = Math.min(3, tokenCount - row * 3);
      xOffset = (col - (rowCount - 1) * 0.5) * 0.72;
      zOffset = row === 0 ? 0.22 : 0.72;
    }
    return { xOffset, zOffset, row };
  }

  /** Incrementally reconcile automaton pawns, nameplates, verb rings, and +more pill on a site without rebuilding its plinth. */
  function syncSiteTokens(g, site, activity) {
    const refs = g.userData.shellRefs;
    const layer = refs.tokenLayer;
    const py = 0.32;
    const baseY = py + 0.01;
    const named = site.tokens.slice(0, 6);
    const tokenCount = named.length + site.unnamed;
    const prevMap = g.userData.tokens instanceof Map ? g.userData.tokens : new Map();
    const nextMap = new Map();
    const keepHandles = new Set(named.map((t) => t.handle));

    for (const [h, oldTok] of prevMap) {
      if (!keepHandles.has(h)) disposeTokenEntry(layer, oldTok);
    }

    for (let i = 0; i < named.length; i++) {
      const tok = named[i];
      const accent = agentAccent(tok.handle);
      const { xOffset, zOffset, row } = tokenSlotCoords(i, tokenCount);
      const act = activity && activity.actorActivity ? activity.actorActivity.get(tok.handle) : null;
      const ringColor = act && VERB_RING_COLORS[act.verbKind] ? VERB_RING_COLORS[act.verbKind] : accent;
      const ringOpacity = act ? 0.94 : 0.8;

      let entry = prevMap.get(tok.handle);
      if (!entry) {
        const drone = buildAutomaton(accent, true, tok.handle);
        const pip = drone.root;
        pip.userData.handle = tok.handle;
        pip.userData.head = drone.head;
        pip.userData.verbRing = drone.groundRing;
        layer.add(pip);

        const npel = document.createElement("div");
        npel.className = "stage3d-nameplate";
        npel.dataset.siteId = site.id;
        npel.dataset.handle = tok.handle;
        const dot = document.createElement("span");
        dot.className = "stage3d-dot";
        dot.style.background = "#" + accent.toString(16).padStart(6, "0");
        const handleSpan = document.createElement("span");
        handleSpan.textContent = tok.handle;
        const spPip = document.createElement("span");
        spPip.className = "stage3d-speech-pip";
        spPip.textContent = "···";
        spPip.hidden = true;
        npel.append(dot, handleSpan, spPip);
        const nameplate = new CSS2DObject(npel);
        layer.add(nameplate);

        entry = {
          mesh: pip,
          nameplate,
          speechPip: spPip,
          ringMat: drone.ringMat,
          glowMats: drone.glowMats,
          mats: drone.mats,
          baseEmissives: drone.glowMats.map((m) => m.emissiveIntensity),
          baseRingOpacity: ringOpacity,
        };
      }
      entry.mesh.position.set(xOffset, baseY, zOffset);
      entry.mesh.userData.baseY = baseY;
      entry.mesh.userData.phase = i * 1.15;
      entry.mesh.userData.verbActive = !!act;
      entry.ringMat.color.setHex(ringColor);
      entry.baseRingOpacity = ringOpacity;
      entry.ringMat.opacity = ringOpacity;
      if (entry.speechPip) entry.speechPip.hidden = !(act && act.isSpeech);
      if (entry.nameplate && entry.nameplate.element) {
        entry.nameplate.element.dataset.priority = String(i < 4 ? 26 - i : 2);
      }
      let npX = xOffset;
      let npY = baseY + 1.24;
      if (tokenCount === 1) {
        npX += site.x >= 0 ? 0.42 : -0.42;
      } else if (tokenCount === 2) {
        npX = i === 0 ? xOffset - 0.22 : xOffset + 0.22;
        npY = baseY + (i === 0 ? 1.04 : 1.32);
      } else {
        npX = xOffset * 1.15;
        npY = baseY + 1.04 + (i % 3) * 0.28 + row * 0.22;
      }
      entry.nameplate.position.set(npX, npY, zOffset - 0.08);
      nextMap.set(tok.handle, entry);
    }
    g.userData.tokens = nextMap;

    // Reconcile unnamed agent tokens
    const unnamedList = refs.unnamedList || [];
    while (unnamedList.length > site.unnamed) {
      disposeTokenEntry(layer, unnamedList.pop());
    }
    for (let u = 0; u < site.unnamed; u++) {
      const idx = named.length + u;
      const { xOffset, zOffset } = tokenSlotCoords(idx, tokenCount);
      if (!unnamedList[u]) {
        const drone = buildAutomaton(agentAccent(""), false, "");
        drone.root.userData.head = drone.head;
        drone.root.userData.verbRing = drone.groundRing;
        layer.add(drone.root);
        unnamedList[u] = { mesh: drone.root, mats: drone.mats };
      }
      unnamedList[u].mesh.position.set(xOffset, baseY, zOffset);
      unnamedList[u].mesh.userData.baseY = baseY;
      unnamedList[u].mesh.userData.phase = idx * 1.15;
    }
    refs.unnamedList = unnamedList;

    // Reconcile +more overflow chip
    if (site.more > 0) {
      if (!refs.moreObj) {
        const moreEl = document.createElement("div");
        moreEl.className = "stage3d-more";
        const moreObj = new CSS2DObject(moreEl);
        moreObj.position.set(0.95, py + 0.35, 0.95);
        layer.add(moreObj);
        refs.moreObj = moreObj;
      }
      refs.moreObj.element.textContent = "+" + site.more;
    } else if (refs.moreObj) {
      if (refs.moreObj.element && refs.moreObj.element.parentNode) refs.moreObj.element.remove();
      if (refs.moreObj.parent) refs.moreObj.parent.remove(refs.moreObj);
      refs.moreObj = null;
    }
  }

  /** Reconcile dynamic visual state on an existing Overview site group in place (zero clearWorld churn). */
  function syncSiteDynamic(g, site, activity) {
    const refs = g.userData.shellRefs;
    if (!refs) return;
    const liftY = site.selected ? 0.14 : 0;
    refs.subBase.position.y = -0.02 + liftY * 0.4;
    refs.collar.position.y = 0.08 + liftY * 0.75;
    refs.deckGroup.position.y = liftY;

    const plateColor = (site.selected ? C.selected : site.active ? C.raised : C.plate).clone();
    if (site.bands.pressure) plateColor.lerp(C.warning, PRESSURE_MIX[site.bands.pressure]);
    refs.plateMat.color.copy(plateColor);

    const edgeColor = site.major ? C.warning : site.selected ? C.ink : site.active || site.followed ? C.active : C.edge;
    const baseTrimEmissive = site.major ? 1.25 : site.active || site.followed ? 0.92 : site.selected ? 0.82 : 0.05;
    refs.trimMat.color.copy(edgeColor);
    refs.trimMat.emissive.copy(edgeColor);
    refs.trimMat.emissiveIntensity = baseTrimEmissive;

    if (refs.outlineRing) {
      refs.outlineRing.visible = !!(site.followed || site.major);
      refs.outlineRing.material.color.copy(site.major ? C.warning : C.active);
    }

    const glow = stageGlowLevel(site);
    const glowColor = site.major ? C.warning : (site.followed || site.active ? C.active : C.social);
    if (refs.haloMesh) {
      refs.haloMesh.visible = glow > 0;
      refs.haloMesh.material.color.copy(glowColor);
      refs.haloMesh.material.opacity = Math.min(0.62, glow * 1.08);
    }
    if (refs.beaconMesh) {
      const showBeacon = glow > 0 && !!(site.major || site.followed || site.active);
      refs.beaconMesh.visible = showBeacon;
      refs.beaconMesh.material.color.copy(glowColor);
      refs.beaconMesh.material.opacity = site.major ? 0.30 : site.followed ? 0.22 : 0.12;
    }

    const speaking = !!(activity && activity.speakingSites && activity.speakingSites.has(site.id));
    updateSiteLabel(refs.labelEl, site, speaking);
    syncSiteTokens(g, site, activity);

    g.userData.highlightRefs = {
      trimMat: refs.trimMat,
      plateMat: refs.plateMat,
      baseTrimEmissive,
      baseEdgeHex: edgeColor.getHex(),
      isMajor: !!site.major,
      labelEl: refs.labelEl,
    };
  }

  function siteGroup(site, isSunken, allSites, activity) {
    const g = new Group();
    g.userData.siteId = site.id;
    const baseElev = isSunken ? SUNKEN_Y : 0;
    g.userData.baseY = baseElev;
    g.userData.isSunken = !!isSunken;
    const partial = site.certainty === "partial" || site.certainty === "unknown";
    const liftY = site.selected ? 0.14 : 0;

    if (isSunken) addSubterraneanPit(g);

    // Grounded dark contact shadow directly under the architectural plinth
    if (haloTexture) {
      const contact = new Mesh(shared.halo, new MeshBasicMaterial({
        map: haloTexture,
        color: 0x030508,
        transparent: true,
        opacity: partial ? 0.34 : 0.68,
        depthWrite: false,
      }));
      contact.rotation.x = -Math.PI / 2;
      contact.position.y = -0.105;
      contact.scale.set(PLATE + 1.15, PLATE + 1.15, 1);
      contact.renderOrder = -2;
      contact.raycast = () => {};
      g.add(contact);
    }

    // Tier 1: recessed dark obsidian sub-base skirt
    const subBase = new Mesh(shared.subBase, new MeshStandardMaterial({
      color: 0x131b24,
      roughness: 0.76,
      metalness: 0.44,
      transparent: partial,
      opacity: partial ? 0.5 : 1,
    }));
    subBase.position.y = -0.02 + liftY * 0.4;
    subBase.castShadow = true;
    subBase.receiveShadow = true;
    setSitePick(subBase, site.id);
    g.add(subBase);

    // Tier 2: machined dark-steel beveled collar
    const collar = new Mesh(shared.collar, applyRimGlow(new MeshStandardMaterial({
      color: 0x263342,
      roughness: 0.42,
      metalness: 0.68,
      transparent: partial,
      opacity: partial ? 0.52 : 1,
    }), 0x4bc8f0, 0.22, 3.0));
    collar.position.y = 0.08 + liftY * 0.75;
    collar.castShadow = true;
    collar.receiveShadow = true;
    setSitePick(collar, site.id);
    g.add(collar);

    // Elevatable deck assembly (lifts smoothly as one unit when site is selected)
    const deckGroup = new Group();
    deckGroup.position.y = liftY;
    g.add(deckGroup);

    // Tier 3: weathered obsidian-titanium deck slab (#212C39 quiet, #273444 active, #304052 selected)
    const plateColor = (site.selected ? C.selected : site.active ? C.raised : C.plate).clone();
    if (site.bands.pressure) plateColor.lerp(C.warning, PRESSURE_MIX[site.bands.pressure]);
    const plateMat = new MeshStandardMaterial({
      color: plateColor,
      map: deckTex ? deckTex.map : null,
      normalMap: deckTex ? deckTex.normalMap : null,
      normalScale: new Vector2(0.65, 0.65),
      roughnessMap: deckTex ? deckTex.roughnessMap : null,
      roughness: 0.72,
      metalness: 0.44,
      emissive: new Color(0x000000),
      emissiveIntensity: 0,
      transparent: partial,
      opacity: partial ? 0.58 : 1,
    });
    const plate = new Mesh(shared.plate, plateMat);
    plate.position.y = 0.21;
    plate.castShadow = true;
    plate.receiveShadow = true;
    setSitePick(plate, site.id);
    deckGroup.add(plate);

    // Forged-steel outer curb + thin recessed surgical inner telemetry channel
    const halfP = PLATE / 2;
    const curbMat = new MeshStandardMaterial({
      color: 0x324356,
      roughness: 0.44,
      metalness: 0.64,
      transparent: partial,
      opacity: partial ? 0.52 : 1,
    });
    const curbY = 0.21 + 0.092;
    for (const dz of [-halfP, halfP]) {
      const bar = new Mesh(shared.curbX, curbMat);
      bar.position.set(0, curbY, dz);
      deckGroup.add(bar);
    }
    for (const dx of [-halfP, halfP]) {
      const bar = new Mesh(shared.curbZ, curbMat);
      bar.position.set(dx, curbY, 0);
      deckGroup.add(bar);
    }

    const edgeColor = site.major ? C.warning : site.selected ? C.ink : site.active || site.followed ? C.active : C.edge;
    const baseTrimEmissive = site.major ? 1.25 : site.active || site.followed ? 0.92 : site.selected ? 0.82 : 0.05;
    const trimMat = new MeshStandardMaterial({
      color: edgeColor,
      emissive: edgeColor.clone(),
      emissiveIntensity: baseTrimEmissive,
      roughness: 0.26,
      metalness: 0.42,
      transparent: partial,
      opacity: partial ? 0.55 : 1,
    });
    const trimY = 0.21 + 0.105;
    const inset = halfP - 0.075;
    for (const dz of [-inset, inset]) {
      const bar = new Mesh(shared.trimX, trimMat);
      bar.position.set(0, trimY, dz);
      deckGroup.add(bar);
    }
    for (const dx of [-inset, inset]) {
      const bar = new Mesh(shared.trimZ, trimMat);
      bar.position.set(dx, trimY, 0);
      deckGroup.add(bar);
    }
    const cleatMat = new MeshStandardMaterial({ color: 0x1c2530, roughness: 0.44, metalness: 0.72 });
    for (const [cx, cz] of [[-halfP, -halfP], [halfP, -halfP], [-halfP, halfP], [halfP, halfP]]) {
      const cleat = new Mesh(shared.cornerPost, cleatMat);
      cleat.position.set(cx, 0.21 + 0.075, cz);
      cleat.castShadow = true;
      deckGroup.add(cleat);
    }

    // Pressure band craft: glowing amber heat-vent slits along plinth front & side walls
    if (site.bands.pressure) {
      const ventCount = site.bands.pressure === "high" ? 4 : site.bands.pressure === "moderate" ? 3 : 2;
      const ventIntensity = site.bands.pressure === "high" ? 1.85 : site.bands.pressure === "moderate" ? 1.35 : 0.95;
      const ventMat = new MeshStandardMaterial({
        color: 0xffd080, emissive: 0xff9a20, emissiveIntensity: ventIntensity, roughness: 0.22,
      });
      for (let v = 0; v < ventCount; v++) {
        const off = (v - (ventCount - 1) * 0.5) * 0.42;
        const frontVent = makeBox(0.24, 0.042, 0.024, ventMat, false);
        frontVent.position.set(off, 0.20, halfP + 0.008);
        deckGroup.add(frontVent);
        const sideVent = makeBox(0.024, 0.042, 0.24, ventMat, false);
        sideVent.position.set(halfP + 0.008, 0.20, off);
        deckGroup.add(sideVent);
      }
    }

    // Partial/unknown sites also carry the dashed wireframe form (WS3-04: never color alone)
    if (partial) {
      const edges = new LineSegments(
        new EdgesGeometry(shared.plate),
        new LineDashedMaterial({ color: edgeColor, dashSize: 0.25, gapSize: 0.18 }),
      );
      edges.position.copy(plate.position);
      edges.computeLineDistances();
      deckGroup.add(edges);
    }

    const outlineRing = new LineSegments(
      new EdgesGeometry(shared.ring),
      new LineBasicMaterial({ color: site.major ? C.warning : C.active }),
    );
    outlineRing.position.y = 0.01;
    outlineRing.visible = !!(site.followed || site.major);
    g.add(outlineRing);

    // D6 static glow: soft velvety additive halo + restrained volumetric beacon on active/followed/MAJOR sites
    const glow = stageGlowLevel(site);
    const glowColor = site.major ? C.warning : (site.followed || site.active ? C.active : C.social);
    let haloMesh = null;
    let beaconMesh = null;
    if (haloTexture) {
      haloMesh = new Mesh(shared.halo, new MeshBasicMaterial({
        map: haloTexture,
        color: glowColor,
        transparent: true,
        opacity: Math.min(0.62, glow * 1.08),
        blending: AdditiveBlending,
        depthWrite: false,
      }));
      haloMesh.rotation.x = -Math.PI / 2;
      haloMesh.position.y = -0.07;
      haloMesh.scale.set(STAGE_GLOW.SIZE * 1.18, STAGE_GLOW.SIZE * 1.18, 1);
      haloMesh.userData.glow = true;
      haloMesh.renderOrder = -1;
      haloMesh.visible = glow > 0;
      haloMesh.raycast = () => {};
      g.add(haloMesh);
    }
    if (beaconTexture) {
      beaconMesh = new Mesh(shared.beacon, new MeshBasicMaterial({
        map: beaconTexture,
        color: glowColor,
        transparent: true,
        opacity: site.major ? 0.30 : site.followed ? 0.22 : 0.12,
        blending: AdditiveBlending,
        depthWrite: false,
        side: DoubleSide,
      }));
      beaconMesh.position.y = 0.21 + 0.72;
      beaconMesh.visible = glow > 0 && !!(site.major || site.followed || site.active);
      beaconMesh.raycast = () => {};
      deckGroup.add(beaconMesh);
    }

    // Scar residue craft: dashed violet outline + subtle violet crystalline fracture shards on plinth corner
    if (site.bands.scar) {
      const scarOp = SCAR_OPACITY[site.bands.scar];
      const scar = new LineSegments(
        new EdgesGeometry(shared.scar),
        new LineDashedMaterial({
          color: C.unknown, dashSize: 0.2, gapSize: 0.12,
          transparent: true, opacity: scarOp,
        }),
      );
      scar.position.y = 0.21 + 0.13;
      scar.computeLineDistances();
      deckGroup.add(scar);

      const shardMat = new MeshStandardMaterial({
        color: 0xc9aeff,
        emissive: 0x9b6dff,
        emissiveIntensity: 0.85 + scarOp * 0.65,
        roughness: 0.2,
        metalness: 0.35,
      });
      const shardSpecs = [
        [-halfP + 0.2, 0.22, -halfP + 0.2, 0.45, 1.55, 0.45, 0.2, 0.3, -0.25],
        [-halfP + 0.34, 0.17, -halfP + 0.14, 0.34, 1.15, 0.34, -0.15, 0.9, -0.4],
        [-halfP + 0.16, 0.16, -halfP + 0.35, 0.32, 1.0, 0.32, 0.35, 0.4, 0.2],
      ];
      for (const [sx, sy, sz, scx, scy, scz, rx, ry, rz] of shardSpecs) {
        const shard = new Mesh(shared.trace, shardMat);
        shard.position.set(sx, 0.21 + sy, sz);
        shard.scale.set(scx, scy * (0.75 + scarOp * 0.35), scz);
        shard.rotation.set(rx, ry, rz);
        deckGroup.add(shard);
      }
    }

    // Room-specific miniature architectural landmark
    const py = 0.32;
    addRoomLandmark(deckGroup, site, py);

    if (site.traces > 0) {
      const mark = new Mesh(shared.trace, new MeshStandardMaterial({
        color: C.machine, emissive: C.machine, emissiveIntensity: 0.72, roughness: 0.26,
      }));
      mark.position.set(PLATE / 2 - 0.3, py + 0.14, PLATE / 2 - 0.3);
      deckGroup.add(mark);
    }

    const tokenLayer = new Group();
    deckGroup.add(tokenLayer);

    const speaking = !!(activity && activity.speakingSites && activity.speakingSites.has(site.id));
    const lbl = label(site, allSites, speaking);
    g.add(lbl.obj);

    g.userData.tokens = new Map();
    g.userData.shellRefs = {
      subBase,
      collar,
      deckGroup,
      plateMat,
      trimMat,
      outlineRing,
      haloMesh,
      beaconMesh,
      labelEl: lbl.el,
      labelObj: lbl.obj,
      moreObj: null,
      tokenLayer,
      unnamedList: [],
    };
    syncSiteTokens(g, site, activity);

    g.userData.highlightRefs = {
      trimMat,
      plateMat,
      baseTrimEmissive,
      baseEdgeHex: edgeColor.getHex(),
      isMajor: !!site.major,
      labelEl: lbl.el,
    };
    g.position.set(site.x, baseElev, site.z);
    return g;
  }

  /** Matte gunmetal 3D transit conduits with muted idle core, electric-cyan surge on agent_move,
   *  and angled descent ramps + illuminated vertical lift pylons for subterranean bays. */
  function routeLine(route, from, to) {
    const out = new Group();
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const len = Math.hypot(dx, dz);
    if (len < 0.01) return out;
    const yaw = Math.atan2(dx, dz);

    const bedMat = new MeshStandardMaterial({
      color: 0x1b2531,
      roughness: 0.56,
      metalness: 0.58,
      transparent: route.dashed,
      opacity: route.dashed ? 0.62 : 1,
    });
    bedMat.userData.isBed = true;

    const coreMat = new MeshStandardMaterial({
      color: C.route.clone(),
      emissive: new Color(0x26384a),
      emissiveIntensity: 0.14,
      roughness: 0.28,
      metalness: 0.32,
    });
    coreMat.userData.routeGlow = true;

    const addSpan = (ax, ay, az, bx, by, bz, dashed) => {
      const sdx = bx - ax;
      const sdy = by - ay;
      const sdz = bz - az;
      const horiz = Math.hypot(sdx, sdz);
      const slen = Math.hypot(horiz, sdy);
      if (slen < 0.05) return;
      const mx = (ax + bx) * 0.5;
      const my = (ay + by) * 0.5;
      const mz = (az + bz) * 0.5;
      const syaw = Math.atan2(sdx, sdz);
      const pitch = -Math.atan2(sdy, horiz);

      const seg = new Group();
      seg.position.set(mx, my, mz);
      seg.rotation.order = "YXZ";
      seg.rotation.y = syaw;
      seg.rotation.x = pitch;

      const bed = makeBox(0.36, 0.052, slen, bedMat, false);
      bed.receiveShadow = true;
      bed.position.y = -0.05;
      seg.add(bed);

      if (dashed) {
        const count = Math.max(3, Math.floor(slen / 0.55));
        for (let i = 0; i < count; i++) {
          const frac = ((i + 0.5) / count) - 0.5;
          const dash = makeBox(0.09, 0.028, 0.26, coreMat, false);
          dash.position.set(0, -0.018, frac * slen);
          seg.add(dash);
        }
      } else {
        const core = makeBox(0.085, 0.028, slen, coreMat, false);
        core.position.y = -0.018;
        seg.add(core);
      }
      out.add(seg);
    };

    const dy = to.y - from.y;
    if (Math.abs(dy) > 0.12 && len > 2.2) {
      // Surface-to-subterranean transition: level surface span + illuminated vertical lift pylon at pit rim + angled descent ramp
      const hi = from.y >= to.y ? from : to;
      const lo = from.y >= to.y ? to : from;
      const vx = lo.x - hi.x;
      const vz = lo.z - hi.z;
      const vlen = Math.hypot(vx, vz);
      const ux = vx / vlen;
      const uz = vz / vlen;
      const rimDist = Math.min(1.66, vlen * 0.42);
      const rimX = lo.x - ux * rimDist;
      const rimZ = lo.z - uz * rimDist;

      addSpan(hi.x, hi.y, hi.z, rimX, hi.y, rimZ, route.dashed);
      addSpan(rimX, hi.y, rimZ, lo.x, lo.y, lo.z, route.dashed);

      // Illuminated vertical lift pylon at the pit rim
      const pylonH = Math.abs(dy) + 0.58;
      const pylonMidY = lo.y - 0.06 + pylonH * 0.5;
      const pylonMat = new MeshStandardMaterial({ color: 0x222f3d, roughness: 0.44, metalness: 0.68 });
      const pylon = makeBox(0.24, pylonH, 0.24, pylonMat, true);
      pylon.position.set(rimX, pylonMidY, rimZ);
      pylon.rotation.y = yaw;
      out.add(pylon);

      const strip = makeBox(0.055, pylonH - 0.14, 0.26, coreMat, false);
      strip.position.set(rimX, pylonMidY, rimZ);
      strip.rotation.y = yaw;
      out.add(strip);

      const capMat = new MeshStandardMaterial({
        color: 0x9cf0ff, emissive: 0x3ddcff, emissiveIntensity: 1.25, roughness: 0.2,
      });
      const cap = makeBox(0.28, 0.05, 0.28, capMat, false);
      cap.position.set(rimX, lo.y - 0.06 + pylonH + 0.025, rimZ);
      cap.rotation.y = yaw;
      out.add(cap);
    } else {
      addSpan(from.x, from.y, from.z, to.x, to.y, to.z, route.dashed);
    }

    if (route.oneWay) {
      const dir = new Vector3(dx, dy, dz).normalize();
      const arrowMat = new MeshStandardMaterial({
        color: C.route.clone(),
        emissive: new Color(0x26384a),
        emissiveIntensity: 0.22,
        roughness: 0.24,
      });
      arrowMat.userData.routeGlow = true;
      const cone = new Mesh(shared.arrow, arrowMat);
      cone.position.set(
        from.x + dx * 0.58,
        from.y + dy * 0.58 + 0.06,
        from.z + dz * 0.58,
      );
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
      const fromY = (a.userData.baseY || 0) + dest.mesh.position.y + 0.24;
      const toY = (b.userData.baseY || 0) + dest.mesh.position.y + 0.24;
      const actor = buildTravelActor(tr.handle);
      // Keeps MeshStandardMaterial reference contract intact while preserving agent accent look
      const mat = actor.mat instanceof MeshStandardMaterial ? actor.mat : new MeshStandardMaterial({ color: agentAccent(tr.handle) });
      const mesh = actor.group;
      mesh.position.set(a.position.x, fromY, a.position.z);
      world.add(mesh);
      tr.start = start;
      tr.mesh = mesh;
      tr.mat = mat;
      tr.extraMats = actor.extraMats;
      tr.trail = actor.trail;
      tr.from = new Vector3(a.position.x, fromY, a.position.z);
      tr.to = new Vector3(b.position.x, toY, b.position.z);
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
      disposeRing(m.ring);
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

  function easeTo(toTarget, toPos, msOverride, onDone) {
    tween = {
      start: performance.now(),
      ms: reduce ? 0 : (msOverride != null ? msOverride : STAGE_CAMERA_EASE_MS),
      fromTarget: controls.target.clone(),
      toTarget,
      fromPos: camera.position.clone(),
      toPos,
      onDone: typeof onDone === "function" ? onDone : null,
    };
    request();
  }

  function finishPendingDive() {
    if (!pendingDive) return;
    const d = pendingDive;
    pendingDive = null;
    if (d.timer) clearTimeout(d.timer);
    d.done();
  }

  /** Smooth macro->micro dive-in ease toward a site plinth before opening Full-Screen Room View (Pass 4C). */
  function diveTo(roomId, onDone) {
    const cb = typeof onDone === "function" ? onDone : () => {};
    if (pendingDive && pendingDive.timer) clearTimeout(pendingDive.timer);
    pendingDive = null;
    const g = groups.get(roomId);
    if (reduce || !g) { cb(); return; }
    pendingDive = {
      done: cb,
      timer: setTimeout(finishPendingDive, 320),
    };
    const toTarget = new Vector3(g.position.x, (g.userData.baseY || 0) + 0.35, g.position.z);
    const offset = camera.position.clone().sub(controls.target).multiplyScalar(0.54);
    easeTo(toTarget, toTarget.clone().add(offset), 260, finishPendingDive);
  }

  function focus(roomId) {
    if (pendingDive) return;
    const g = groups.get(roomId);
    if (!g) return;
    const toTarget = new Vector3(g.position.x, g.userData.baseY || 0, g.position.z);
    const offset = camera.position.clone().sub(controls.target);
    easeTo(toTarget, toTarget.clone().add(offset));
  }

  // Default framing that fits the whole layout crisply with generous bottom margin
  // for Archive / Frontier Gate and a clean corridor between Foundry Corridor and Generator Hall.
  function defaultView() {
    const v = stageDefaultView(model.radius);
    const target = new Vector3(v.target[0], v.target[1] - 0.14, v.target[2] + 0.58);
    const offset = new Vector3(...v.position).multiplyScalar(0.87);
    // Gently shift azimuth from -0.35 toward -0.24 (+0.11 rad around Y)
    offset.applyAxisAngle(UP, 0.11);
    const halfH = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
    const need = (model.radius * 0.96) / Math.tan(halfH);
    const lim = stageCameraLimits(model.radius);
    offset.setLength(Math.min(lim.maxDistance, Math.max(offset.length(), need)));
    return { target, position: target.clone().add(offset) };
  }

  function atDefaultTarget() {
    return controls.target.distanceToSquared(defaultView().target) < 1e-4;
  }

  function reset() {
    const v = defaultView();
    spectatorMoved = false;
    // Reset view resumes the director.
    shot = null;
    easeTo(v.target, v.position);
  }

  function buildDualRing(roomId, outerOp, innerOp, scaleInit) {
    const g = groups.get(roomId);
    if (!g) return null;
    const holder = new Group();
    const outer = new Mesh(shared.pulse, new MeshBasicMaterial({
      color: C.warning, transparent: true, opacity: outerOp, blending: AdditiveBlending, depthWrite: false,
    }));
    outer.rotation.x = -Math.PI / 2;
    outer.scale.setScalar(scaleInit);
    const inner = new Mesh(shared.pulseInner, new MeshBasicMaterial({
      color: C.warning, transparent: true, opacity: innerOp, blending: AdditiveBlending, depthWrite: false,
    }));
    inner.rotation.x = -Math.PI / 2;
    inner.scale.setScalar(scaleInit);
    holder.add(outer, inner);
    holder.position.set(g.position.x, (g.userData.baseY || 0) + 0.04, g.position.z);
    holder.userData.rings = [outer, inner];
    world.add(holder);
    return holder;
  }

  function majorRing(roomId) {
    return buildDualRing(roomId, 0.92, 0.66, 1);
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

  /** A dual-concentric amber beacon at a site: the MAJOR moment's ground mark. */
  function momentRing(roomId) {
    return buildDualRing(roomId, 0.56, 0.42, reduce ? 1.18 : 1.12);
  }

  /** End one site's moment (or all of them), dropping its ring and its label class. */
  function endMoment(roomId) {
    for (let i = moments.length - 1; i >= 0; i--) {
      const m = moments[i];
      if (roomId !== undefined && m.roomId !== roomId) continue;
      if (m.timer) clearTimeout(m.timer);
      m.timer = 0;
      disposeRing(m.ring);
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
      const rings = ring.userData && ring.userData.rings;
      if (rings) {
        rings[0].material.opacity = 0.45;
        rings[1].material.opacity = 0.34;
      } else if (ring.material) {
        ring.material.opacity = 0.45;
      }
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
    declutterDirty = true;
    const entry = { caption: c, el, timer: 0 };
    entry.timer = setTimeout(() => {
      captions = captions.filter((x) => x !== entry);
      el.remove();
      if (!box.el.childElementCount) {
        if (box.obj.parent) box.obj.parent.remove(box.obj);
        box.anchor.remove();
        if (captionBoxes.get(c.roomId) === box) captionBoxes.delete(c.roomId);
      }
      declutterDirty = true;
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
    const fromY = (a.userData.baseY || 0) + dest.mesh.position.y + 0.24;
    const toY = (b.userData.baseY || 0) + dest.mesh.position.y + 0.24;
    const actor = buildTravelActor(t.handle);
    const mesh = actor.group;
    mesh.position.set(a.position.x, fromY, a.position.z);
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
      from: new Vector3(a.position.x, fromY, a.position.z),
      to: new Vector3(b.position.x, toY, b.position.z),
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

  function applyHighlight() {
    for (const [sid, g] of groups) {
      const refs = g.userData.highlightRefs;
      const siteHot = !!hoveredSiteId && sid === hoveredSiteId;
      if (refs) {
        if (siteHot) {
          refs.trimMat.emissive.setHex(refs.isMajor ? C.warning.getHex() : C.active.getHex());
          refs.trimMat.emissiveIntensity = Math.max(1.55, refs.baseTrimEmissive + 0.85);
          refs.plateMat.emissive.setHex(refs.isMajor ? 0x261808 : 0x0e2230);
          refs.plateMat.emissiveIntensity = 0.55;
        } else {
          refs.trimMat.emissive.setHex(refs.baseEdgeHex);
          refs.trimMat.emissiveIntensity = refs.baseTrimEmissive;
          refs.plateMat.emissive.setHex(0x000000);
          refs.plateMat.emissiveIntensity = 0;
        }
        if (refs.labelEl) refs.labelEl.classList.toggle("is-hovered", siteHot);
      }
      const tokens = g.userData.tokens;
      if (tokens) {
        for (const [h, tok] of tokens) {
          const hot = !!hoveredHandle && h === hoveredHandle;
          if (tok.glowMats && tok.baseEmissives) {
            for (let i = 0; i < tok.glowMats.length; i++) {
              tok.glowMats[i].emissiveIntensity = hot ? tok.baseEmissives[i] + 0.9 : tok.baseEmissives[i];
            }
          }
          if (tok.ringMat) tok.ringMat.opacity = hot ? 1 : tok.baseRingOpacity;
          if (tok.mesh) tok.mesh.scale.setScalar(hot ? 1.26 : 1.14);
          if (tok.nameplate && tok.nameplate.element) {
            tok.nameplate.element.classList.toggle("is-hovered", hot);
          }
        }
      }
    }
  }

  function setHighlight(siteId, handle) {
    if (disposed) return;
    const nextSite = String(siteId || "");
    const nextHandle = String(handle || "");
    if (nextSite === hoveredSiteId && nextHandle === hoveredHandle) return;
    hoveredSiteId = nextSite;
    hoveredHandle = nextHandle;
    applyHighlight();
    request();
  }

  function update(live, nextCtx) {
    if (disposed) return;
    const prevCtx = ctx;
    ctx = nextCtx || {};
    const prevRadius = model.radius;
    // D6 route travel reads the previous scene's handle sites before the rebuild.
    const prevHandleSites = handleSites;
    model = buildStageModel(live, ctx);
    const sunkenSites = new Set();
    for (const r of model.routes) {
      const dir = String(r.direction || "").toLowerCase();
      if (dir === "down") sunkenSites.add(r.to);
      else if (dir === "up") sunkenSites.add(r.from);
    }
    for (const s of model.sites) {
      const sid = String(s.id || "").toLowerCase();
      if (sid.includes("archive") || sid.includes("vault")) sunkenSites.add(s.id);
    }
    const activity = extractMacroActivity(live);
    const topoSig = JSON.stringify({
      sites: model.sites.map((s) => [
        s.id, s.x, s.z, s.certainty, s.bands.scar, s.bands.pressure, s.traces > 0, sunkenSites.has(s.id),
      ]),
      routes: model.routes.map((r) => [r.from, r.to, r.direction, r.dashed, r.oneWay]),
    });
    const worldSig = JSON.stringify({
      topoSig,
      activity: activity.sig,
      sites: model.sites.map((s) => [
        s.id, s.name, s.active, s.players, s.unnamed, s.more,
        s.selected, s.followed, s.major, s.bands.protocol,
        s.handles, s.tokens.map((t) => t.handle + ":" + t.line),
      ]),
    });
    if (worldSig !== lastWorldSig) {
      lastWorldSig = worldSig;
      if (topoSig !== lastTopoSig) {
        lastTopoSig = topoSig;
        clearWorld();
        const sunkenCoords = [];
        const surfaceCoords = [];
        for (const site of model.sites) {
          const isSunken = sunkenSites.has(site.id);
          if (isSunken) sunkenCoords.push(site);
          else surfaceCoords.push(site);
          const g = siteGroup(site, isSunken, model.sites, activity);
          groups.set(site.id, g);
          world.add(g);
        }
        rebuildAnimatedPawns();
        env.updatePits(sunkenCoords, surfaceCoords);
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
      } else {
        // Pass 5B: zero-rebuild in-place reconciliation when topology is unchanged
        for (const site of model.sites) {
          const g = groups.get(site.id);
          if (g) syncSiteDynamic(g, site, activity);
        }
        rebuildAnimatedPawns();
      }
      applyHighlight();
      shadowsDirty = true;
      declutterDirty = true;
    }
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
  const onDblClick = (ev) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(world.children, true).find((h) => h.object.userData && h.object.userData.siteId);
    if (hit) onEnterRoom(hit.object.userData.siteId);
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("dblclick", onDblClick);
  // Any spectator camera movement suspends the director until Reset view.
  controls.addEventListener("start", () => { spectatorMoved = true; tween = null; shot = null; });
  controls.addEventListener("change", () => { declutterDirty = true; request(); });
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
    if (pendingDive && pendingDive.timer) clearTimeout(pendingDive.timer);
    pendingDive = null;
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
    const envGeos = new Set();
    const envMats = new Set();
    environment.traverse((o) => {
      if (o.geometry && !envGeos.has(o.geometry)) {
        envGeos.add(o.geometry);
        o.geometry.dispose();
      }
      if (o.material && !envMats.has(o.material)) {
        envMats.add(o.material);
        o.material.dispose();
      }
    });
    if (sun.shadow && typeof sun.shadow.dispose === "function") sun.shadow.dispose();
    if (typeof hemi.dispose === "function") hemi.dispose();
    if (typeof sun.dispose === "function") sun.dispose();
    if (typeof rim.dispose === "function") rim.dispose();
    if (typeof hearth.dispose === "function") hearth.dispose();
    for (const geo of Object.values(shared)) geo.dispose();
    if (haloTexture) haloTexture.dispose();
    if (beaconTexture) beaconTexture.dispose();
    if (skyTexture) skyTexture.dispose();
    if (terrainTex) terrainTex.dispose();
    if (deckTex) deckTex.dispose();
    if (envRig) envRig.dispose();
    controls.dispose();
    canvas.removeEventListener("pointerdown", onDown);
    canvas.removeEventListener("pointerup", onUp);
    canvas.removeEventListener("dblclick", onDblClick);
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

  return { update, focus, diveTo, reset, dispose, pause: pausePlayback, setHighlight };
}

window.NoemaWatchStage = { mount };
