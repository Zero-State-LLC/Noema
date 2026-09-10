/**
 * MAP-only Three.js stage. Bundled to /assets/watch-map-gl.js.
 * Event-born redraw only. No ambient loops and no idle rAF.
 */
import {
  AmbientLight,
  BoxGeometry,
  BufferGeometry,
  Color,
  DirectionalLight,
  Line,
  LineBasicMaterial,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { MAP_CAM_FOV_DEG, MAP_ROOM_GAP, mapCameraPose, mapHoldStageRooms, mapLabelScreenItems } from "./watch-map-gl";

export type StageRoom = {
  room_id?: string;
  name?: string;
  x?: number;
  y?: number;
  players_present?: number;
  exits?: Array<{ to_room_id?: string }>;
  active?: boolean;
};

export type StageFrame = {
  rooms?: StageRoom[];
  focusRoomId?: string;
  followRoomId?: string;
  majorRoomId?: string;
};

type LostFn = () => void;

const GROUND = 0x161b20;
const BOX = 0x1f262e;
const INK = 0xc4bfb6;
const ACTIVE = 0x3ddcff;
const MAJOR = 0xffb020;

function roomPos(n: StageRoom): Vector3 {
  return new Vector3(Number(n.x || 0) * MAP_ROOM_GAP, 0, Number(n.y || 0) * MAP_ROOM_GAP);
}

function boxHeight(n: StageRoom, followId: string): number {
  const here = Math.min(Number(n.players_present || 0), 3) * 0.16;
  const follow = n.room_id && n.room_id === followId ? 0.22 : 0;
  return 0.36 + here + follow;
}

function boxColor(n: StageRoom, followId: string, majorId: string): number {
  if (n.room_id && n.room_id === majorId) return MAJOR;
  if (n.room_id && n.room_id === followId) return ACTIVE;
  if (n.active) return ACTIVE;
  return BOX;
}

export function mountWatchMapGl(
  canvas: HTMLCanvasElement,
  opts?: { reduce?: boolean; onLost?: LostFn; labels?: HTMLElement | null },
): { update: (frame: StageFrame) => void; focus: (roomId: string, easeMs: number) => void; dispose: () => void } {
  const reduce = Boolean(opts && opts.reduce);
  const onLost = opts && opts.onLost;
  const overlay = opts && opts.labels;
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  renderer.setClearColor(new Color(GROUND));
  const scene = new Scene();
  scene.add(new AmbientLight(0xc8d4dc, 0.88));
  const key = new DirectionalLight(0xe8e4dc, 0.7);
  key.position.set(4, 8, 3);
  scene.add(key);
  const camera = new PerspectiveCamera(MAP_CAM_FOV_DEG, 16 / 9, 0.1, 80);
  const nodes: Record<string, Vector3> = {};
  let raf = 0;
  let lastFocus = "";
  let lastFollow = "";
  let lastRooms: StageRoom[] = [];
  let lastLook = { lookX: 0, lookY: 0.55, lookZ: 0 };
  let disposed = false;

  function canvasAspect(): number {
    const w = canvas.clientWidth || 0;
    const h = canvas.clientHeight || 0;
    return w > 2 && h > 2 ? w / h : 16 / 9;
  }

  function applyPose(focusId: string): { lookX: number; lookY: number; lookZ: number } {
    const pose = mapCameraPose({ rooms: lastRooms, focusId, aspect: canvasAspect() });
    camera.position.set(pose.eyeX, pose.eyeY, pose.eyeZ);
    camera.lookAt(pose.lookX, pose.lookY, pose.lookZ);
    lastLook = { lookX: pose.lookX, lookY: pose.lookY, lookZ: pose.lookZ };
    return pose;
  }

  function paintLabels(): void {
    if (!overlay) return;
    overlay.hidden = false;
    const w = canvas.clientWidth || overlay.clientWidth || 0;
    const h = canvas.clientHeight || overlay.clientHeight || 0;
    // A zero-size canvas (hidden tab, mid-layout) cannot project anything.
    // Keep the last painted names instead of wiping the overlay to nothing.
    if (w < 2 || h < 2) return;
    const items = mapLabelScreenItems({
      rooms: lastRooms,
      pose: {
        eyeX: camera.position.x,
        eyeY: camera.position.y,
        eyeZ: camera.position.z,
        lookX: lastLook.lookX,
        lookY: lastLook.lookY,
        lookZ: lastLook.lookZ,
      },
      aspect: canvasAspect(),
      width: w,
      height: h,
      focusId: lastFocus,
      followId: lastFollow,
    });
    // Rooms exist but none projected (pose not settled yet): hold the last
    // agreed names rather than flashing an empty sketch. Marked as held.
    if (!items.length && lastRooms.length && overlay.childElementCount > 0) {
      overlay.classList.add("is-held");
      return;
    }
    overlay.classList.remove("is-held");
    overlay.replaceChildren();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const li = document.createElement("li");
      li.className = item.focus ? "map-room-label is-focus" : "map-room-label";
      li.textContent = item.name;
      li.style.left = item.x + "px";
      li.style.top = item.y + "px";
      overlay.appendChild(li);
    }
  }

  function stopRaf(): void {
    if (!raf) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
    raf = 0;
  }

  function paint(): void {
    if (disposed) return;
    renderer.render(scene, camera);
    paintLabels();
  }

  function fit(): void {
    if (disposed) return;
    const w = canvas.clientWidth || 0;
    const h = canvas.clientHeight || 0;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (lastRooms.length) applyPose(lastFocus);
    paint();
  }

  function clearScene(): void {
    while (scene.children.length > 2) {
      const child = scene.children[scene.children.length - 1];
      scene.remove(child);
    }
    for (const k of Object.keys(nodes)) delete nodes[k];
  }

  function addRooms(rooms: StageRoom[], followId: string, majorId: string): void {
    const publicIds: Record<string, number> = {};
    for (let i = 0; i < rooms.length; i++) {
      const id = String(rooms[i].room_id || "");
      if (id) publicIds[id] = 1;
    }
    for (let i = 0; i < rooms.length; i++) {
      const n = rooms[i];
      const id = String(n.room_id || "");
      if (!id) continue;
      const at = roomPos(n);
      nodes[id] = at;
      const h = boxHeight(n, followId);
      const mesh = new Mesh(
        new BoxGeometry(1.15, h, 1.15),
        new MeshLambertMaterial({ color: boxColor(n, followId, majorId) }),
      );
      mesh.position.set(at.x, h / 2, at.z);
      scene.add(mesh);
      const exits = Array.isArray(n.exits) ? n.exits : [];
      for (let e = 0; e < exits.length; e++) {
        const to = String((exits[e] && exits[e].to_room_id) || "");
        if (!to || !publicIds[to]) continue;
        let dest: StageRoom | null = null;
        for (let j = 0; j < rooms.length; j++) {
          if (rooms[j].room_id === to) dest = rooms[j];
        }
        if (!dest) continue;
        const b = roomPos(dest);
        const geo = new BufferGeometry().setFromPoints([
          new Vector3(at.x, 0.08, at.z),
          new Vector3(b.x, 0.08, b.z),
        ]);
        scene.add(new Line(geo, new LineBasicMaterial({ color: INK })));
      }
    }
  }

  function lookAtRoom(id: string): void {
    applyPose(id);
  }

  function onContextLost(ev: Event): void {
    if (ev && typeof (ev as { preventDefault?: () => void }).preventDefault === "function") {
      (ev as { preventDefault: () => void }).preventDefault();
    }
    stopRaf();
    disposed = true;
    if (onLost) onLost();
  }

  canvas.addEventListener("webglcontextlost", onContextLost);
  let ro: ResizeObserver | null = null;
  if (typeof ResizeObserver === "function") {
    ro = new ResizeObserver(function () {
      fit();
    });
    ro.observe(canvas);
  }
  fit();

  return {
    update(frame: StageFrame) {
      if (disposed) return;
      fit();
      // An empty frame (map behind live, poll gap) never wipes the sketch.
      const rooms = mapHoldStageRooms(frame.rooms, lastRooms);
      lastRooms = rooms;
      clearScene();
      addRooms(rooms, String(frame.followRoomId || ""), String(frame.majorRoomId || ""));
      lastFollow = String(frame.followRoomId || "");
      const focus = String(frame.focusRoomId || lastFocus || "");
      lastFocus = focus;
      applyPose(focus);
      paint();
    },
    focus(roomId: string, easeMs: number) {
      if (disposed) return;
      const id = String(roomId || "");
      if (!id || !nodes[id]) return;
      if (id === lastFocus && !raf) return;
      lastFocus = id;
      if (reduce || !(easeMs > 0) || typeof requestAnimationFrame !== "function") {
        stopRaf();
        lookAtRoom(id);
        paint();
        return;
      }
      const dest = mapCameraPose({ rooms: lastRooms, focusId: id, aspect: canvasAspect() });
      const from = camera.position.clone();
      const to = new Vector3(dest.eyeX, dest.eyeY, dest.eyeZ);
      const started = Date.now();
      stopRaf();
      const tick = (): void => {
        const u = Math.min(1, (Date.now() - started) / easeMs);
        const e = u * u * (3 - 2 * u);
        camera.position.lerpVectors(from, to, e);
        camera.lookAt(dest.lookX, dest.lookY, dest.lookZ);
        paint();
        if (u < 1) raf = requestAnimationFrame(tick);
        else raf = 0;
      };
      raf = requestAnimationFrame(tick);
    },
    dispose() {
      stopRaf();
      disposed = true;
      if (overlay) overlay.replaceChildren();
      if (ro) ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      renderer.dispose();
    },
  };
}

const g = globalThis as { NoemaWatchMapGl?: { mount: typeof mountWatchMapGl } };
g.NoemaWatchMapGl = { mount: mountWatchMapGl };
