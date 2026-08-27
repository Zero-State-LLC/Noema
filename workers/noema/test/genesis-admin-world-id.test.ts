import { describe, expect, it } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import {
  EWM_ISOLATED_WORLD_ID,
  FROZEN_GENESIS_ID,
  resolveAdminGenesisWorldId,
  SUCCESSOR_WORLD_ID,
} from "../src/genesis";
import worker from "../src/index";
import type { Env } from "../src/types";
import { NoemaWorldDO } from "../src/world-do";

describe("resolveAdminGenesisWorldId", () => {
  it("omitted uses DEFAULT_WORLD_ID", () => {
    const r = resolveAdminGenesisWorldId(undefined, { NOEMA_ENV: "local", DEFAULT_WORLD_ID: "world-01" });
    expect(r).toEqual({ ok: true, world_id: "world-01" });
  });

  it("local allows world.perihelion-reach-2", () => {
    const r = resolveAdminGenesisWorldId("world.perihelion-reach-2", { NOEMA_ENV: "local", DEFAULT_WORLD_ID: "world-01" });
    expect(r).toEqual({ ok: true, world_id: "world.perihelion-reach-2" });
  });

  it("production allows successor override", () => {
    const r = resolveAdminGenesisWorldId("world.perihelion-reach-2", {
      NOEMA_ENV: "production",
      DEFAULT_WORLD_ID: "world-01",
    });
    expect(r).toEqual({ ok: true, world_id: "world.perihelion-reach-2" });
  });

  it("production still rejects other explicit ids", () => {
    const r = resolveAdminGenesisWorldId("world.other", {
      NOEMA_ENV: "production",
      DEFAULT_WORLD_ID: "world-01",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INVALID_REQUEST");
  });

  it("admits isolated EWM test world", () => {
    const r = resolveAdminGenesisWorldId(EWM_ISOLATED_WORLD_ID, {
      NOEMA_ENV: "production",
      DEFAULT_WORLD_ID: "world.perihelion-reach-2",
    });
    expect(r).toEqual({ ok: true, world_id: EWM_ISOLATED_WORLD_ID });
  });

  it("admits EWM product world in production", () => {
    const r = resolveAdminGenesisWorldId("world.perihelion-reach-3", {
      NOEMA_ENV: "production",
      DEFAULT_WORLD_ID: "world.perihelion-reach-2",
    });
    expect(r).toEqual({ ok: true, world_id: "world.perihelion-reach-3" });
  });

  it("rejects other explicit ids", () => {
    const r = resolveAdminGenesisWorldId("world.other", { NOEMA_ENV: "local", DEFAULT_WORLD_ID: "world-01" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INVALID_REQUEST");
  });
});

type DoCall = {
  op: string;
  name?: string;
  url?: string;
  body?: Record<string, unknown> | null;
  headers?: Record<string, string>;
};

function mockWorldDo(calls: DoCall[]) {
  return {
    idFromName(name: string) {
      calls.push({ op: "idFromName", name });
      return { name };
    },
    get(id: { name: string }) {
      return {
        fetch: async (url: string, init?: RequestInit) => {
          const raw =
            init?.headers instanceof Headers
              ? Object.fromEntries(init.headers.entries())
              : ((init?.headers || {}) as Record<string, string>);
          calls.push({
            op: "fetch",
            name: id.name,
            url: String(url),
            headers: raw,
            body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null,
          });
          if (String(url).includes("/health")) {
            return new Response(JSON.stringify({ ok: true, sequence: 0, world_id: id.name }), {
              status: 200,
              headers: { "content-type": "application/json" },
            });
          }
          return new Response(JSON.stringify({ ok: true, world_id: id.name }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      };
    },
  };
}

function env(calls: DoCall[], noemaEnv = "local", defaultWorldId = "world-01"): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret-admin-genesis-world",
    NOEMA_ENV: noemaEnv,
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: defaultWorldId,
    ADMIN_OPERATOR_TOKEN: "operator-token-value-ok",
    WORLD_DO: mockWorldDo(calls),
  } as unknown as Env;
}

async function adminToken(noemaEnv = "local") {
  const minted = await mintAdminSession(env([], noemaEnv), "operator-token-value-ok");
  if (minted instanceof Response) throw new Error("failed to mint admin");
  return minted.access_token;
}

async function adminPost(
  path: string,
  body: Record<string, unknown>,
  calls: DoCall[],
  noemaEnv = "local",
) {
  const token = await adminToken(noemaEnv);
  const req = new Request(`https://noema.local${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  return worker.fetch(req, env(calls, noemaEnv));
}

const SUCCESSOR_PREVIEW = {
  world_name: "Perihelion Reach",
  world_seed: "perihelion-successor-rehearsal-01",
  profile_id: "FRACTURED_OLD_WORLD",
  story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
  world_id: SUCCESSOR_WORLD_ID,
};

describe("POST /v1/admin/genesis/preview world_id routing", () => {
  it("omitted uses DEFAULT_WORLD_ID and does not pass world_id into preview", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost(
      "/v1/admin/genesis/preview",
      {
        world_name: "Perihelion Reach",
        world_seed: "perihelion-rehearsal-01",
        profile_id: "FRACTURED_OLD_WORLD",
        story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
      },
      calls,
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { result: { world_id: string } };
    expect(data.result.world_id).toBe("world.perihelion-reach");
    const named = calls.filter((c) => c.op === "idFromName");
    expect(named.map((c) => c.name)).toEqual(["world-01"]);
    const fetches = calls.filter((c) => c.op === "fetch");
    expect(fetches.length).toBeGreaterThan(0);
    expect(fetches.every((c) => c.headers?.["x-noema-world-id"] === "world-01")).toBe(true);
  });

  it("local routes successor world_id to its DO with x-noema-world-id", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost("/v1/admin/genesis/preview", SUCCESSOR_PREVIEW, calls);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { result: { world_id: string; genesis_id: string } };
    expect(data.result.world_id).toBe(SUCCESSOR_WORLD_ID);
    expect(data.result.genesis_id).not.toBe(FROZEN_GENESIS_ID);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual([SUCCESSOR_WORLD_ID]);
    const fetches = calls.filter((c) => c.op === "fetch");
    expect(fetches.some((c) => String(c.url).includes("/genesis-preview-store"))).toBe(true);
    expect(fetches.every((c) => c.headers?.["x-noema-world-id"] === SUCCESSOR_WORLD_ID)).toBe(true);
  });

  it("production routes successor preview to successor DO", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost("/v1/admin/genesis/preview", SUCCESSOR_PREVIEW, calls, "production");
    expect(res.status).toBe(200);
    const data = (await res.json()) as { result: { world_id: string; genesis_id: string } };
    expect(data.result.world_id).toBe(SUCCESSOR_WORLD_ID);
    expect(data.result.genesis_id).not.toBe(FROZEN_GENESIS_ID);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual([SUCCESSOR_WORLD_ID]);
    expect(calls.filter((c) => c.op === "fetch").every((c) => c.headers?.["x-noema-world-id"] === SUCCESSOR_WORLD_ID)).toBe(true);
  });

  it("rejects other explicit ids", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost(
      "/v1/admin/genesis/preview",
      { ...SUCCESSOR_PREVIEW, world_id: "world.other" },
      calls,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string } };
    expect(data.error.code).toBe("INVALID_REQUEST");
    expect(calls.some((c) => c.op === "idFromName")).toBe(false);
  });
});

describe("POST /v1/admin/genesis/activate world_id routing", () => {
  it("local successor activate fetches the successor DO with world_id and header", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost(
      "/v1/admin/genesis/activate",
      { genesis_id: "genesis.successor", confirm: true, world_id: SUCCESSOR_WORLD_ID },
      calls,
    );
    expect(res.status).toBe(200);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual([SUCCESSOR_WORLD_ID]);
    const act = calls.find((c) => String(c.url).includes("/genesis-activate"));
    expect(act?.headers?.["x-noema-world-id"]).toBe(SUCCESSOR_WORLD_ID);
    expect(act?.body?.world_id).toBe(SUCCESSOR_WORLD_ID);
  });

  it("production routes successor activate to successor DO", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost(
      "/v1/admin/genesis/activate",
      { genesis_id: "genesis.successor", confirm: true, world_id: SUCCESSOR_WORLD_ID },
      calls,
      "production",
    );
    expect(res.status).toBe(200);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual([SUCCESSOR_WORLD_ID]);
    const act = calls.find((c) => String(c.url).includes("/genesis-activate"));
    expect(act?.headers?.["x-noema-world-id"]).toBe(SUCCESSOR_WORLD_ID);
    expect(act?.body?.world_id).toBe(SUCCESSOR_WORLD_ID);
  });

  it("omitted activate uses DEFAULT_WORLD_ID and does not send DO world_id", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost(
      "/v1/admin/genesis/activate",
      { genesis_id: FROZEN_GENESIS_ID, confirm: true },
      calls,
    );
    expect(res.status).toBe(200);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual(["world-01"]);
    const act = calls.find((c) => String(c.url).includes("/genesis-activate"));
    expect(act?.headers?.["x-noema-world-id"]).toBe("world-01");
    expect(act?.body?.world_id).toBeUndefined();
  });

  it("keeps production force 403", async () => {
    const calls: DoCall[] = [];
    const res = await adminPost(
      "/v1/admin/genesis/activate",
      { genesis_id: FROZEN_GENESIS_ID, confirm: true, force: true },
      calls,
      "production",
    );
    expect(res.status).toBe(403);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("POLICY_DENIED");
    expect(data.error.message).toBe("force supersede forbidden in production");
  });
});

function memoryState(initial: Record<string, unknown> = {}): DurableObjectState {
  const bag = new Map<string, unknown>(Object.entries(initial));
  return {
    storage: {
      async get(key: string) {
        return bag.get(key);
      },
      async put(keyOrEntries: string | Record<string, unknown>, value?: unknown) {
        if (typeof keyOrEntries === "string") {
          bag.set(keyOrEntries, value);
        } else {
          for (const [k, v] of Object.entries(keyOrEntries)) bag.set(k, v);
        }
      },
    },
  } as unknown as DurableObjectState;
}

function stubPreview(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "genesis-result/0.6",
    genesis_id: "genesis.test-preview",
    world_id: SUCCESSOR_WORLD_ID,
    world_name: "Perihelion Reach",
    status: "VALIDATED",
    world_seed: "perihelion-successor-rehearsal-01",
    genesis_profile_id: "FRACTURED_OLD_WORLD",
    story_seed_ids: ["OLD_TRADE_NETWORK", "LOST_ARCHIVE"],
    ordinary_world_valid: true,
    validation: { ok: true, errors: [] },
    starting_opportunities: ["exploration"],
    config_frozen: false,
    admin_only: true,
    scripts_player_outcomes: false,
    lore_is_final: false,
    cycle0: {
      world_id: SUCCESSOR_WORLD_ID,
      world_name: "Perihelion Reach",
      world_seed: "perihelion-successor-rehearsal-01",
      cycle: 0,
      sequence: 0,
      entry_room_id: "room.civic-exchange",
      rooms: {},
      institutions: [],
      artifacts: [],
      tensions: [],
      scars: [],
      resources: [],
      opportunities: ["exploration"],
    },
    cycle0_digest: "sha256:test",
    preview_summary: {},
    ...overrides,
  };
}

function doEnv(): Env {
  return {
    NOEMA_ENV: "local",
    DEFAULT_WORLD_ID: "world-01",
    NOEMA_PROTOCOL_VERSION: "1",
  } as Env;
}

describe("world-do genesis world_id", () => {
  it("honors x-noema-world-id on preview-store without admitTestWorldId", async () => {
    const world = new NoemaWorldDO(memoryState(), doEnv());
    const preview = stubPreview();
    const res = await world.fetch(
      new Request("https://do/genesis-preview-store", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": SUCCESSOR_WORLD_ID },
        body: JSON.stringify({ result: preview }),
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { live_world_id: string; stored_genesis_id: string };
    expect(data.stored_genesis_id).toBe(preview.genesis_id);
    expect(data.live_world_id).toBe(SUCCESSOR_WORLD_ID);
  });

  it("honors x-noema-world-id on health used by preview", async () => {
    const world = new NoemaWorldDO(memoryState(), doEnv());
    const res = await world.fetch(
      new Request("https://do/health", {
        method: "GET",
        headers: { "x-noema-world-id": SUCCESSOR_WORLD_ID },
      }),
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { world_id: string };
    expect(data.world_id).toBe(SUCCESSOR_WORLD_ID);
  });

  it("activate refuses frozen genesis on another world", async () => {
    const preview = stubPreview({
      genesis_id: FROZEN_GENESIS_ID,
      world_id: SUCCESSOR_WORLD_ID,
      cycle0: { ...stubPreview().cycle0, world_id: SUCCESSOR_WORLD_ID },
    });
    const world = new NoemaWorldDO(
      memoryState({ genesis_previews: { [FROZEN_GENESIS_ID]: preview } }),
      doEnv(),
    );
    const res = await world.fetch(
      new Request("https://do/genesis-activate", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": SUCCESSOR_WORLD_ID },
        body: JSON.stringify({
          genesis_id: FROZEN_GENESIS_ID,
          admin_session_id: "asess.test",
          world_id: SUCCESSOR_WORLD_ID,
        }),
      }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("INVALID_SEED");
    expect(data.error.message).toBe("frozen genesis cannot activate on another world");
  });

  it("activate refuses world_id that does not match preview", async () => {
    const preview = stubPreview();
    const world = new NoemaWorldDO(
      memoryState({ genesis_previews: { [preview.genesis_id]: preview } }),
      doEnv(),
    );
    const res = await world.fetch(
      new Request("https://do/genesis-activate", {
        method: "POST",
        headers: { "content-type": "application/json", "x-noema-world-id": SUCCESSOR_WORLD_ID },
        body: JSON.stringify({
          genesis_id: preview.genesis_id,
          admin_session_id: "asess.test",
          world_id: "world-01",
        }),
      }),
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as { error: { code: string; message: string } };
    expect(data.error.code).toBe("INVALID_REQUEST");
    expect(data.error.message).toBe("world_id does not match preview");
  });
});
