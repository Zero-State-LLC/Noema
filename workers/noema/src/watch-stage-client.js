/**
 * WATCH Chamber stage renderer (Noema-Specs specify/watch-single-3d-stage.md).
 * Bundled to /assets/watch-stage.js and loaded only when the spectator picks 3D.
 * Draws on demand: a frame loop runs only while a pulse or camera ease is in
 * flight, never for an idle world, and never for a hidden document (WS3-08).
 * Labels are DOM text. The page's Places list stays the accessible authority.
 */
import {
  AdditiveBlending, BoxGeometry, BufferAttribute, BufferGeometry, CanvasTexture, Color, ConeGeometry,
  CylinderGeometry, DirectionalLight, EdgesGeometry, FogExp2, Group, HemisphereLight, Line,
  LineBasicMaterial, LineDashedMaterial, LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial,
  OctahedronGeometry, PerspectiveCamera, PlaneGeometry, Points, PointsMaterial, Raycaster,
  RingGeometry, Scene, TorusGeometry, Vector2, Vector3, WebGLRenderer,
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
    world: new Color(token("--color-surface-world", "#0E1114")),
    plate: new Color("#2F3943"),
    raised: new Color("#3A4652"),
    edge: new Color("#8A8F92"),
    ink: new Color(token("--color-text-primary", "#E8E4DC")),
    active: new Color(token("--color-state-active", "#3DDCFF")),
    warning: new Color(token("--color-state-warning", "#FFB020")),
    social: new Color(token("--color-state-social", "#C4A882")),
    unknown: new Color(token("--color-state-unknown", "#9B6DFF")),
    machine: new Color(token("--color-text-machine", "#9BB8C4")),
    route: new Color("#4a5258"),
  };
}

const AGENT_COLORS = [0x3ddcff, 0xffb020, 0x52e5a8, 0xb68cff, 0xff6b8b, 0x70b8ff];
function agentAccent(handle) {
  if (!handle) return 0xc4a882;
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  return AGENT_COLORS[h % AGENT_COLORS.length];
}

function makePlanetaryTerrain() {
  const grp = new Group();
  // Grounded frontier planet surface (dark basalt/ochre basin under Perihelion Reach)
  const groundGeo = new PlaneGeometry(140, 140, 24, 24);
  const posAttr = groundGeo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    const dist = Math.hypot(x, y);
    // Flat basin in the settlement center, gentle ridges toward the frontier horizon
    const ridge = dist > 11 ? Math.sin(x * 0.16) * Math.cos(y * 0.14) * Math.min(3.5, (dist - 11) * 0.14) : 0;
    posAttr.setZ(i, ridge);
  }
  groundGeo.computeVertexNormals();
  const ground = new Mesh(
    groundGeo,
    new MeshStandardMaterial({ color: 0x1e1b18, roughness: 0.96, metalness: 0.04 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.18;
  ground.raycast = () => {};
  grp.add(ground);

  // Subtle atmospheric dust motes drifting over the planet surface
  const count = 160;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = ((i * 137.508) % 360) * (Math.PI / 180);
    const r = 3 + ((i * 19) % 28);
    const h = 0.4 + ((i * 7) % 10) * 0.45;
    pos[i * 3] = Math.cos(theta) * r;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = Math.sin(theta) * r;
  }
  const dustGeo = new BufferGeometry();
  dustGeo.setAttribute("position", new BufferAttribute(pos, 3));
  const dust = new Points(
    dustGeo,
    new PointsMaterial({ color: 0xd9b382, size: 0.14, transparent: true, opacity: 0.48 }),
  );
  dust.raycast = () => {};
  grp.add(dust);
  return grp;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * D6 static glow: ONE shared radial-gradient halo texture per mount. Returns
 * null when a 2D context is unavailable, which skips glow entirely.
 */
function makeHaloTexture() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx2d = typeof canvas.getContext === "function" ? canvas.getContext("2d") : null;
    if (!ctx2d) return null;
    const grad = ctx2d.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(1, "rgba(255,255,255,0)");
    ctx2d.fillStyle = grad;
    ctx2d.fillRect(0, 0, 64, 64);
    return new CanvasTexture(canvas);
  } catch (e) {
    return null;
  }
}

function mount(frame, opts) {
  const canvas = opts.canvas;
  const labelRoot = opts.labels;
  const reduce = !!opts.reduce;
  const onSelect = typeof opts.onSelect === "function" ? opts.onSelect : () => {};
  const onLost = typeof opts.onLost === "function" ? opts.onLost : () => {};
  const C = palette();
  const haloTexture = makeHaloTexture();

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(C.world, 1);
  const labels = new CSS2DRenderer({ element: labelRoot });

  const scene = new Scene();
  scene.fog = new FogExp2(0x161412, 0.015);
  scene.add(makePlanetaryTerrain());
  scene.add(new HemisphereLight(0xf2d9b8, 0x1b1714, 0.95));
  const sun = new DirectionalLight(0xffcf96, 0.95);
  sun.position.set(-10, 14, 8);
  scene.add(sun);
  const rim = new DirectionalLight(0x52a8d8, 0.42);
  rim.position.set(12, 7, -10);
  scene.add(rim);
  const camera = new PerspectiveCamera(38, 1, 0.1, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.listenToKeyEvents(frame);

  const shared = {
    plate: new BoxGeometry(PLATE, 0.32, PLATE),
    ring: new BoxGeometry(PLATE + 0.5, 0.04, PLATE + 0.5),
    scar: new BoxGeometry(PLATE - 0.6, 0.02, PLATE - 0.6),
    pip: new CylinderGeometry(0.14, 0.22, 0.52, 8),
    pipHead: new OctahedronGeometry(0.15, 0),
    core: new OctahedronGeometry(0.32, 0),
    torus: new TorusGeometry(0.46, 0.04, 8, 24),
    pillar: new BoxGeometry(0.18, 0.9, 0.18),
    dish: new ConeGeometry(0.38, 0.24, 12, 1, true),
    monolith: new BoxGeometry(0.24, 1.05, 0.12),
    silo: new CylinderGeometry(0.22, 0.24, 0.65, 10),
    trace: new BoxGeometry(0.3, 0.08, 0.3),
    arrow: new ConeGeometry(0.22, 0.6, 12),
    pulse: new RingGeometry(1.7, 1.95, 48),
    halo: new PlaneGeometry(1, 1),
  };
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
        p.ring.scale.setScalar(1 + t * 0.8);
        p.ring.material.opacity = 0.9 * (1 - t);
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
      m.ring.material.opacity = 0.55 * (1 - t * t);
      busy = true;
    }
    // D6 route travel: a token slides along the drawn route to its new site.
    for (let i = travels.length - 1; i >= 0; i--) {
      const tr = travels[i];
      // Detached across a rebuild and not yet re-homed (defensive).
      if (!tr.mesh || !tr.mat || !tr.destMesh) continue;
      if (tr.start < 0) tr.start = now;
      const t = Math.min(1, (now - tr.start) / STAGE_TRAVEL_MS);
      const k = easeOut(t);
      tr.mesh.position.set(
        tr.from.x + (tr.to.x - tr.from.x) * k,
        tr.from.y + (tr.to.y - tr.from.y) * k + Math.sin(t * Math.PI) * 0.6,
        tr.from.z + (tr.to.z - tr.from.z) * k,
      );
      if (t >= 1) {
        world.remove(tr.mesh);
        tr.mat.dispose();
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
    // its site read as lit. A brightness step, not a travelling animation.
    const lit = stageLitRoutes(pulses.filter((p) => p.projectionId === "agent_move"), model.routes);
    for (const entry of routeEntries) {
      const on = lit.has(entry.from + "|" + entry.to);
      for (const m of entry.mats) m.color.copy(on ? C.active : C.route);
    }
    // Ambient sci-fi station motion (spinning cores, hovering agent drones)
    const sec = now * 0.001;
    for (const prop of animatedProps) {
      prop.rotation.y = sec * (prop.userData.spin || 0.7);
    }
    for (const pawn of animatedPawns) {
      pawn.position.y = pawn.userData.baseY + Math.sin(sec * 2.4 + (pawn.userData.phase || 0)) * 0.08;
      if (pawn.userData.head) pawn.userData.head.rotation.y = sec * 1.4;
    }
    if (controls.enableDamping) controls.update();
    if (!document.hidden && (animatedProps.length > 0 || animatedPawns.length > 0)) busy = true;
    renderer.render(scene, camera);
    labels.render(scene, camera);
    declutter();
    if (busy) request();
  }

  // Labels stay readable (Lightweight §18): place them by priority and tuck
  // any label that would overlap a higher one into a marker that expands on
  // hover. Every name is also in the Places list.
  function declutter() {
    const els = Array.from(labelRoot.querySelectorAll(".stage3d-label, .stage3d-nameplate"));
    els.sort((a, b) => Number(b.dataset.priority || 0) - Number(a.dataset.priority || 0));
    const placed = [];
    for (const el of els) {
      el.classList.remove("is-tucked");
      if (el.style.display === "none") continue;
      const r = el.getBoundingClientRect();
      const hit = placed.some((p) => r.left < p.right + 4 && r.right > p.left - 4 && r.top < p.bottom + 2 && r.bottom > p.top - 2);
      if (hit) el.classList.add("is-tucked");
      else placed.push(r);
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
    obj.position.set(0, 0.5, PLATE / 2 + 0.3);
    return obj;
  }

  function siteGroup(site) {
    const g = new Group();
    g.userData.siteId = site.id;
    const partial = site.certainty === "partial" || site.certainty === "unknown";
    const plateColor = (site.selected || site.active ? C.raised : C.plate).clone();
    if (site.bands.pressure) plateColor.lerp(C.warning, PRESSURE_MIX[site.bands.pressure]);
    const plateMat = new MeshStandardMaterial({
      color: plateColor,
      roughness: 0.9, metalness: 0.05, transparent: partial, opacity: partial ? 0.55 : 1,
    });
    const plate = new Mesh(shared.plate, plateMat);
    plate.position.y = site.selected ? 0.3 : 0.15;
    plate.userData.siteId = site.id;
    g.add(plate);
    const edgeColor = site.major ? C.warning : site.selected ? C.ink : site.active || site.followed ? C.active : C.edge;
    const edgeMat = partial
      ? new LineDashedMaterial({ color: edgeColor, dashSize: 0.25, gapSize: 0.18 })
      : new LineBasicMaterial({ color: edgeColor });
    const edges = new LineSegments(new EdgesGeometry(shared.plate), edgeMat);
    edges.position.copy(plate.position);
    if (partial) edges.computeLineDistances();
    g.add(edges);
    if (site.followed || site.major) {
      const ring = new LineSegments(
        new EdgesGeometry(shared.ring),
        new LineBasicMaterial({ color: site.major ? C.warning : C.active }),
      );
      ring.position.y = 0.02;
      g.add(ring);
    }
    // D6 static glow: a soft additive halo under a site with agents present.
    // Static — never animated, never busy; the frame loop does not run for it.
    const glow = stageGlowLevel(site);
    if (glow > 0 && haloTexture) {
      const halo = new Mesh(shared.halo, new MeshBasicMaterial({
        map: haloTexture,
        color: site.major ? C.warning : (site.followed ? C.active : C.social),
        transparent: true,
        opacity: glow,
        blending: AdditiveBlending,
        depthWrite: false,
      }));
      halo.rotation.x = -Math.PI / 2;
      halo.position.y = 0.015;
      halo.scale.set(STAGE_GLOW.SIZE, STAGE_GLOW.SIZE, 1);
      halo.userData.glow = true;
      halo.renderOrder = -1;
      halo.raycast = () => {};
      g.add(halo);
    }
    if (site.bands.scar) {
      const scar = new LineSegments(
        new EdgesGeometry(shared.scar),
        new LineDashedMaterial({
          color: C.unknown, dashSize: 0.2, gapSize: 0.12,
          transparent: true, opacity: SCAR_OPACITY[site.bands.scar],
        }),
      );
      scar.position.y = plate.position.y + 0.16;
      scar.computeLineDistances();
      g.add(scar);
    }
    // Room-specific low-poly sci-fi station architecture
    const py = plate.position.y + 0.16;
    const sid = String(site.id || "");
    if (sid.includes("generator")) {
      const core = new Mesh(shared.core, new MeshStandardMaterial({ color: 0xffb020, emissive: 0xff8c00, emissiveIntensity: 0.9, roughness: 0.3 }));
      core.position.set(0, py + 0.52, -0.55);
      core.userData.spin = 1.2;
      g.add(core);
      animatedProps.push(core);
      const ringM = new Mesh(shared.torus, new MeshStandardMaterial({ color: 0x3ddcff, emissive: 0x3ddcff, emissiveIntensity: 0.5, roughness: 0.3 }));
      ringM.position.copy(core.position);
      ringM.rotation.x = Math.PI / 3;
      ringM.userData.spin = -0.8;
      g.add(ringM);
      animatedProps.push(ringM);
    } else if (sid.includes("relay")) {
      const mast = new Mesh(shared.pillar, new MeshStandardMaterial({ color: 0x5c6f7e, metalness: 0.5, roughness: 0.4 }));
      mast.position.set(0.65, py + 0.45, -0.65);
      g.add(mast);
      const dish = new Mesh(shared.dish, new MeshStandardMaterial({ color: 0x9bb8c4, emissive: 0x3ddcff, emissiveIntensity: 0.35, side: 2 }));
      dish.position.set(0.65, py + 0.96, -0.65);
      dish.rotation.z = 0.6;
      dish.userData.spin = 0.6;
      g.add(dish);
      animatedProps.push(dish);
    } else if (sid.includes("archive")) {
      for (const dx of [-0.55, 0, 0.55]) {
        const mono = new Mesh(shared.monolith, new MeshStandardMaterial({ color: 0x1d2733, emissive: 0x3ddcff, emissiveIntensity: 0.25, metalness: 0.6, roughness: 0.25 }));
        mono.position.set(dx, py + 0.52, -0.78);
        g.add(mono);
      }
    } else if (sid.includes("civic")) {
      for (const dx of [-0.85, 0.85]) {
        const pylon = new Mesh(shared.pillar, new MeshStandardMaterial({ color: 0x4b5c6b, emissive: 0xffb020, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.4 }));
        pylon.position.set(dx, py + 0.45, -0.85);
        g.add(pylon);
      }
      const hub = new Mesh(shared.torus, new MeshStandardMaterial({ color: 0xffb020, emissive: 0xffb020, emissiveIntensity: 0.4 }));
      hub.position.set(0, py + 0.12, 0);
      hub.rotation.x = Math.PI / 2;
      g.add(hub);
    } else if (sid.includes("transit")) {
      const arch = new Mesh(shared.torus, new MeshStandardMaterial({ color: 0x3ddcff, emissive: 0x3ddcff, emissiveIntensity: 0.45 }));
      arch.position.set(0, py + 0.55, -0.5);
      arch.scale.setScalar(1.35);
      g.add(arch);
    } else if (sid.includes("storage") || sid.includes("foundry") || sid.includes("vault")) {
      for (const dx of [-0.65, 0.65]) {
        const silo = new Mesh(shared.silo, new MeshStandardMaterial({ color: 0x4a5562, metalness: 0.5, roughness: 0.45 }));
        silo.position.set(dx, py + 0.32, -0.75);
        g.add(silo);
      }
    } else {
      const beacon = new Mesh(shared.pillar, new MeshStandardMaterial({ color: 0x4d5d6b, emissive: 0x9b6dff, emissiveIntensity: 0.35 }));
      beacon.position.set(-0.78, py + 0.45, -0.78);
      g.add(beacon);
    }

    // One distinct sci-fi drone pawn per agent; the first six carry their public handle as a nameplate.
    const named = site.tokens.slice(0, 6);
    const tokenCount = named.length + site.unnamed;
    const tokenMap = new Map();
    for (let i = 0; i < tokenCount; i++) {
      const tok = named[i];
      const accent = agentAccent(tok ? tok.handle : "");
      const pip = new Mesh(shared.pip, new MeshStandardMaterial({
        color: accent,
        roughness: 0.35,
        metalness: 0.35,
        emissive: accent,
        emissiveIntensity: tok ? 0.55 : 0.15,
      }));
      const baseY = plate.position.y + 0.44;
      pip.position.set(-0.75 + (i % 3) * 0.75, baseY, -0.2 + Math.floor(i / 3) * 0.6);
      pip.userData.baseY = baseY;
      pip.userData.phase = i * 1.1;
      const head = new Mesh(shared.pipHead, new MeshStandardMaterial({
        color: 0xffffff,
        emissive: accent,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      }));
      head.position.set(0, 0.42, 0);
      pip.add(head);
      pip.userData.head = head;
      g.add(pip);
      animatedPawns.push(pip);
      if (tok) {
        pip.userData.handle = tok.handle;
        const npel = document.createElement("div");
        npel.className = "stage3d-nameplate";
        npel.textContent = tok.handle;
        npel.dataset.priority = "-1";
        const nameplate = new CSS2DObject(npel);
        nameplate.position.set(pip.position.x, baseY + 0.72, pip.position.z);
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
      moreObj.position.set(0.95, plate.position.y + 0.45, 0.95);
      g.add(moreObj);
    }
    if (site.traces > 0) {
      const mark = new Mesh(shared.trace, new MeshBasicMaterial({ color: C.machine }));
      mark.position.set(PLATE / 2 - 0.35, plate.position.y + 0.19, PLATE / 2 - 0.35);
      g.add(mark);
    }
    g.add(label(site));
    g.position.set(site.x, 0, site.z);
    return g;
  }

  function routeLine(route, from, to) {
    const pts = [new Vector3(from.x, 0.06, from.z), new Vector3(to.x, 0.06, to.z)];
    const geo = new BufferGeometry().setFromPoints(pts);
    const mat = route.dashed
      ? new LineDashedMaterial({ color: C.route, dashSize: 0.45, gapSize: 0.3 })
      : new LineBasicMaterial({ color: C.route });
    const line = new Line(geo, mat);
    if (route.dashed) line.computeLineDistances();
    const out = new Group();
    out.add(line);
    if (route.oneWay) {
      const dir = new Vector3(to.x - from.x, 0, to.z - from.z);
      const len = dir.length();
      if (len > 0) {
        dir.normalize();
        const cone = new Mesh(shared.arrow, new MeshBasicMaterial({ color: C.route }));
        cone.position.set(from.x + dir.x * len * 0.62, 0.12, from.z + dir.z * len * 0.62);
        cone.quaternion.setFromUnitVectors(UP, dir);
        out.add(cone);
      }
    }
    return out;
  }

  // A rebuild drops the old scene, so no traveller may outlive it.
  function dropTravels() {
    for (const tr of travels) {
      if (tr.mesh) world.remove(tr.mesh);
      if (tr.mat) tr.mat.dispose();
      tr.mesh = null;
      tr.mat = null;
    }
    travels.length = 0;
  }

  // A rebuild keeps travellers in flight: detach their meshes from the old
  // scene and dispose them, but keep the records for rehomeTravels.
  function detachTravels() {
    for (const tr of travels) {
      if (tr.mesh) world.remove(tr.mesh);
      if (tr.mat) tr.mat.dispose();
      tr.mesh = null;
      tr.mat = null;
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
      const y = dest.mesh.position.y;
      const mat = new MeshStandardMaterial({
        color: C.social, roughness: 0.6, emissive: C.active, emissiveIntensity: 0.8,
      });
      const mesh = new Mesh(shared.pip, mat);
      mesh.position.set(a.position.x, y, a.position.z);
      world.add(mesh);
      tr.start = start;
      tr.mesh = mesh;
      tr.mat = mat;
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
    world.traverse((o) => {
      // Removing an ancestor does not detach CSS2D elements; do it explicitly.
      if (o.isCSS2DObject && o.element && o.element.parentNode) o.element.remove();
      if (o.material && !Object.values(shared).includes(o.geometry)) {
        if (o.geometry) o.geometry.dispose();
      }
      if (o.material) o.material.dispose();
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

  // Default framing that fits the whole layout at any aspect ratio: portrait
  // phones need more distance than the model's landscape default.
  function defaultView() {
    const v = stageDefaultView(model.radius);
    const position = new Vector3(...v.position);
    const halfH = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect);
    const need = (model.radius * 1.15) / Math.tan(halfH);
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
    const ring = new Mesh(shared.pulse, new MeshBasicMaterial({ color: C.warning, transparent: true, opacity: 0.9 }));
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
    const ring = new Mesh(shared.pulse, new MeshBasicMaterial({ color: C.warning, transparent: true, opacity: 0.55 }));
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
    obj.position.set(0, 1.4, -PLATE / 2);
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

  // D6 route travel: the token slides along the drawn route from the site it
  // was shown at to the site its move lands in. The destination token is
  // hidden while its traveller is in flight, then shown again.
  function startTravel(t) {
    if (reduce) return;
    // One traveller per handle: a newer move replaces one still in flight.
    for (let i = travels.length - 1; i >= 0; i--) {
      const old = travels[i];
      if (old.handle !== t.handle) continue;
      if (old.mesh) world.remove(old.mesh);
      if (old.mat) old.mat.dispose();
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
    const y = dest.mesh.position.y;
    const mat = new MeshStandardMaterial({
      color: C.social, roughness: 0.6, emissive: C.active, emissiveIntensity: 0.8,
    });
    const mesh = new Mesh(shared.pip, mat);
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
      mat,
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
      grp.traverse((o) => { if (o.material && o.material.color) mats.push(o.material); });
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
    for (const geo of Object.values(shared)) geo.dispose();
    if (haloTexture) haloTexture.dispose();
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
    renderer.dispose();
  }

  return { update, focus, reset, dispose, pause: pausePlayback };
}

window.NoemaWatchStage = { mount };
