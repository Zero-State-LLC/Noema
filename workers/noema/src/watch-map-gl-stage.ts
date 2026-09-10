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

const GROUND = 0x0e1114;
const BOX = 0x1c232b;
const INK = 0xa8a39a;
const ACTIVE = 0x3ddcff;
const MAJOR = 0xffb020;
const GAP = 2.2;

function roomPos(n: StageRoom): Vector3 {
  return new Vector3(Number(n.x || 0) * GAP, 0, Number(n.y || 0) * GAP);
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
  opts?: { reduce?: boolean; onLost?: LostFn },
): { update: (frame: StageFrame) => void; focus: (roomId: string, easeMs: number) => void; dispose: () => void } {
  const reduce = Boolean(opts && opts.reduce);
  const onLost = opts && opts.onLost;
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "low-power" });
  renderer.setPixelRatio(1);
  renderer.setClearColor(new Color(GROUND));
  const scene = new Scene();
  scene.add(new AmbientLight(0xb8c4cc, 0.7));
  const key = new DirectionalLight(0xe8e4dc, 0.55);
  key.position.set(4, 8, 3);
  scene.add(key);
  const camera = new PerspectiveCamera(40, 16 / 9, 0.1, 80);
  camera.position.set(4, 7, 9);
  camera.lookAt(0, 0, 0);
  const nodes: Record<string, Vector3> = {};
  let raf = 0;
  let lastFocus = "";
  let disposed = false;

  function stopRaf(): void {
    if (!raf) return;
    if (typeof cancelAnimationFrame === "function") cancelAnimationFrame(raf);
    raf = 0;
  }

  function paint(): void {
    if (disposed) return;
    renderer.render(scene, camera);
  }

  function fit(): void {
    if (disposed) return;
    const w = canvas.clientWidth || 0;
    const h = canvas.clientHeight || 0;
    if (w < 2 || h < 2) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
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
    const at = nodes[id];
    const target = at || new Vector3(0, 0, 0);
    camera.position.set(target.x + 3.4, 6.4, target.z + 5.2);
    camera.lookAt(target.x, 0.2, target.z);
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
      const rooms = Array.isArray(frame.rooms) ? frame.rooms : [];
      clearScene();
      addRooms(rooms, String(frame.followRoomId || ""), String(frame.majorRoomId || ""));
      if (!lastFocus && rooms[0] && rooms[0].room_id) lookAtRoom(String(rooms[0].room_id));
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
      const dest = nodes[id];
      const from = camera.position.clone();
      const to = new Vector3(dest.x + 3.4, 6.4, dest.z + 5.2);
      const started = Date.now();
      stopRaf();
      const tick = (): void => {
        const u = Math.min(1, (Date.now() - started) / easeMs);
        const e = u * u * (3 - 2 * u);
        camera.position.lerpVectors(from, to, e);
        camera.lookAt(dest.x, 0.2, dest.z);
        paint();
        if (u < 1) raf = requestAnimationFrame(tick);
        else raf = 0;
      };
      raf = requestAnimationFrame(tick);
    },
    dispose() {
      stopRaf();
      disposed = true;
      if (ro) ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      renderer.dispose();
    },
  };
}

const g = globalThis as { NoemaWatchMapGl?: { mount: typeof mountWatchMapGl } };
g.NoemaWatchMapGl = { mount: mountWatchMapGl };
