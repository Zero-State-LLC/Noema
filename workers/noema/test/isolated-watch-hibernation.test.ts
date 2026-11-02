import { afterEach, describe, expect, it, vi } from "vitest";
import { NoemaWorldDO } from "../src/world-do";
import type { Env } from "../src/types";

const TARGET = "test.hosted-canonical.watch-hibernation";
const DEFAULT = "test.hosted-canonical.watch-default";

function wake(attachment: unknown, retainedWorld?: string, configuredTarget: string | undefined = TARGET) {
  const writes: string[] = [];
  const sent: unknown[] = [];
  const state = {
    storage: {
      async get(key: string) {
        return key === "world" && retainedWorld ? { world_id: retainedWorld } : undefined;
      },
      async put(key: string) { writes.push(key); },
    },
  } as unknown as DurableObjectState;
  const env = { NOEMA_ENV: "test", DEFAULT_WORLD_ID: DEFAULT,
    ...(configuredTarget === undefined ? {} : { ISOLATED_WATCH_WORLD_ID: configuredTarget }),
  } as Env;
  const socket = {
    deserializeAttachment: () => attachment,
    send: (message: string) => sent.push(JSON.parse(message)),
  } as unknown as WebSocket;
  return { object: new NoemaWorldDO(state, env), socket, writes, sent };
}

afterEach(() => vi.unstubAllGlobals());

describe("hibernated isolated WATCH stream", () => {
  it("attaches only the validated configured target before accepting a stream", async () => {
    const attachments: unknown[] = [];
    const accepted: unknown[] = [];
    const writes: string[] = [];
    const server = {
      serializeAttachment(value: unknown) { attachments.push(value); },
      send(_message: string) {},
    };
    vi.stubGlobal("WebSocketPair", class {
      0 = {};
      1 = server;
    });
    const NativeResponse = Response;
    vi.stubGlobal("Response", class extends NativeResponse {
      constructor(body: BodyInit | null, init?: ResponseInit & { webSocket?: unknown }) {
        super(body, { ...init, status: init?.status === 101 ? 200 : init?.status });
        if (init?.status === 101) Object.defineProperty(this, "status", { value: 101 });
      }
    });
    let retainedWorld: string | undefined;
    const state = {
      storage: {
        async get(key: string) { return key === "world" && retainedWorld ? { world_id: retainedWorld } : undefined; },
        async put(key: string) { writes.push(key); },
      },
      acceptWebSocket(ws: unknown) { accepted.push(ws); },
    } as unknown as DurableObjectState;
    const env = { NOEMA_ENV: "test", DEFAULT_WORLD_ID: DEFAULT, ISOLATED_WATCH_WORLD_ID: TARGET } as Env;
    const object = new NoemaWorldDO(state, env);
    const stream = (worldId: string) => object.fetch(new Request("https://do/watch-stream", {
      headers: { Upgrade: "websocket", "x-noema-world-id": worldId },
    }));
    expect((await stream(DEFAULT)).status).toBe(403);
    expect(attachments).toEqual([]);
    expect(accepted).toEqual([]);
    retainedWorld = DEFAULT;
    expect((await stream(TARGET)).status).toBe(403);
    expect(attachments).toEqual([]);
    expect(accepted).toEqual([]);
    retainedWorld = undefined;
    expect((await stream(TARGET)).status).toBe(101);
    expect(attachments).toEqual([{ kind: "isolated-watch", world_id: TARGET }]);
    expect(accepted).toEqual([server]);
    expect(writes).toEqual([]);

    const legacy = new NoemaWorldDO(state, { NOEMA_ENV: "production", DEFAULT_WORLD_ID: DEFAULT } as Env);
    expect((await legacy.fetch(new Request("https://do/watch-stream", { headers: { Upgrade: "websocket" } }))).status).toBe(101);
    expect(attachments).toEqual([{ kind: "isolated-watch", world_id: TARGET }]);
  });

  it("polls the configured target after constructor reconstruction without a retained world", async () => {
    const h = wake({ kind: "isolated-watch", world_id: TARGET });
    await h.object.webSocketMessage(h.socket, "poll");
    expect(h.sent).toHaveLength(1);
    expect(h.sent[0]).toMatchObject({ world_id: TARGET });
    expect(h.writes).toEqual([]);
  });

  it("refuses a mismatched retained world before any load or write", async () => {
    const h = wake({ kind: "isolated-watch", world_id: TARGET }, DEFAULT);
    await h.object.webSocketMessage(h.socket, "poll");
    expect(h.sent).toEqual([{ pin: "watch-live/1.0", freshness: "unavailable" }]);
    expect(h.writes).toEqual([]);
  });

  it("never falls back to the default for an absent, forged or reconfigured binding", async () => {
    for (const [attachment, configured] of [
      [undefined, TARGET],
      [{ kind: "isolated-watch", world_id: DEFAULT }, TARGET],
      [{ kind: "isolated-watch", world_id: TARGET }, "test.hosted-canonical.other-target"],
      [{ world_id: TARGET }, TARGET],
    ] as const) {
      const h = wake(attachment, undefined, configured);
      await h.object.webSocketMessage(h.socket, "poll");
      expect(h.sent).toEqual([{ pin: "watch-live/1.0", freshness: "unavailable" }]);
      expect(h.writes).toEqual([]);
    }
  });

  it("refuses a configured target outside test without loading the default", async () => {
    const h = wake({ kind: "isolated-watch", world_id: TARGET });
    const state = { storage: {
      async get() { return undefined; },
      async put(key: string) { h.writes.push(key); },
    } } as unknown as DurableObjectState;
    const production = new NoemaWorldDO(state,
      { NOEMA_ENV: "production", DEFAULT_WORLD_ID: DEFAULT, ISOLATED_WATCH_WORLD_ID: TARGET } as Env);
    await production.webSocketMessage(h.socket, "poll");
    expect(h.sent).toEqual([{ pin: "watch-live/1.0", freshness: "unavailable" }]);
    expect(h.writes).toEqual([]);
  });
});
