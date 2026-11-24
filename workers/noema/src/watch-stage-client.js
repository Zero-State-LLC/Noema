/**
 * WATCH Chamber stage renderer (Noema-Specs specify/watch-single-3d-stage.md).
 * Bundled to /assets/watch-stage.js and loaded only when the spectator picks 3D.
 * Draws on demand: a frame loop runs only while a pulse or camera ease is in
 * flight, never for an idle world, and never for a hidden document (WS3-08).
 * Labels are DOM text. The page's Places list stays the accessible authority.
 */
import {
  BoxGeometry, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DirectionalLight,
  EdgesGeometry, Group, HemisphereLight, Line, LineBasicMaterial, LineDashedMaterial,
  LineSegments, Mesh, MeshBasicMaterial, MeshStandardMaterial, PerspectiveCamera,
  Raycaster, RingGeometry, Scene, Vector2, Vector3, WebGLRenderer,
} from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import {
  STAGE_CAMERA_EASE_MS,
  buildStageModel,
  newStagePulses,
  stageBandLine,
  stageCameraLimits,
  stageCameraTarget,
  stageDefaultView,
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

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function mount(frame, opts) {
  const canvas = opts.canvas;
  const labelRoot = opts.labels;
  const reduce = !!opts.reduce;
  const onSelect = typeof opts.onSelect === "function" ? opts.onSelect : () => {};
  const onLost = typeof opts.onLost === "function" ? opts.onLost : () => {};
  const C = palette();

  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(C.world, 1);
  const labels = new CSS2DRenderer({ element: labelRoot });

  const scene = new Scene();
  scene.add(new HemisphereLight(C.ink, C.world, 0.95));
  const sun = new DirectionalLight(0xffffff, 0.55);
  sun.position.set(-6, 14, 8);
  scene.add(sun);
  const camera = new PerspectiveCamera(38, 1, 0.1, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.screenSpacePanning = false;
  controls.listenToKeyEvents(frame);

  const shared = {
    plate: new BoxGeometry(PLATE, 0.3, PLATE),
    ring: new BoxGeometry(PLATE + 0.5, 0.04, PLATE + 0.5),
    scar: new BoxGeometry(PLATE - 0.6, 0.02, PLATE - 0.6),
    pip: new CylinderGeometry(0.13, 0.13, 0.5, 12),
    trace: new BoxGeometry(0.3, 0.08, 0.3),
    arrow: new ConeGeometry(0.22, 0.6, 12),
    pulse: new RingGeometry(1.7, 1.95, 48),
  };
  let world = new Group();
  scene.add(world);
  let compass = null;

  let model = { sites: [], routes: [], radius: 8 };
  let ctx = {};
  let lastSeq = null;
  let pulses = [];
  let tween = null;
  let spectatorMoved = false;
  let framed = false;
  let frameId = 0;
  let dirty = false;
  let disposed = false;
  const groups = new Map();

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
    renderer.render(scene, camera);
    labels.render(scene, camera);
    declutter();
    if (busy) request();
  }

  // Labels stay readable (Lightweight §18): place them by priority and tuck
  // any label that would overlap a higher one into a marker that expands on
  // hover. Every name is also in the Places list.
  function declutter() {
    const els = Array.from(labelRoot.querySelectorAll(".stage3d-label"));
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
    const pips = Math.min(site.players, 6);
    for (let i = 0; i < pips; i++) {
      const pip = new Mesh(shared.pip, new MeshStandardMaterial({ color: C.social, roughness: 0.6 }));
      pip.position.set(-0.75 + (i % 3) * 0.75, plate.position.y + 0.4, -0.45 + Math.floor(i / 3) * 0.6);
      g.add(pip);
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

  function clearWorld() {
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

  function update(live, nextCtx) {
    if (disposed) return;
    const prevCtx = ctx;
    ctx = nextCtx || {};
    const prevRadius = model.radius;
    model = buildStageModel(live, ctx);
    clearWorld();
    for (const site of model.sites) {
      const g = siteGroup(site);
      groups.set(site.id, g);
      world.add(g);
    }
    for (const r of model.routes) {
      const a = groups.get(r.from);
      const b = groups.get(r.to);
      if (a && b) world.add(routeLine(r, a.position, b.position));
    }
    if (!framed || Math.abs(prevRadius - model.radius) > 0.01) {
      buildCompass(model.radius);
      applyLimits(model.radius);
    }
    // A rebuild drops the old scene; give still-running MAJOR pulses their ring back.
    for (const p of pulses) {
      if (p.tier === "MAJOR" && !p.ring && groups.has(p.roomId)) p.ring = majorRing(p.roomId);
    }
    const fresh = newStagePulses(live && live.recent_events, lastSeq, groups.keys(), {
      reduce,
      snapshotSequence: live && live.sequence,
    });
    lastSeq = fresh.lastSequence;
    let majorRoom = "";
    for (const p of fresh.pulses) {
      if (p.tier === "MAJOR") {
        majorRoom = p.roomId;
        p.ring = majorRing(p.roomId);
      }
      pulses.push(p);
    }
    if (!framed) {
      framed = true;
      const v = defaultView();
      controls.target.copy(v.target);
      camera.position.copy(v.position);
      controls.update();
    } else {
      const target = stageCameraTarget(prevCtx, ctx, majorRoom, spectatorMoved);
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
  controls.addEventListener("start", () => { spectatorMoved = true; tween = null; });
  controls.addEventListener("change", request);
  const onKey = (ev) => { if (CAMERA_KEYS.has(ev.key)) { spectatorMoved = true; tween = null; } };
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
    clearWorld();
    for (const geo of Object.values(shared)) geo.dispose();
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

  return { update, focus, reset, dispose };
}

window.NoemaWatchStage = { mount };
