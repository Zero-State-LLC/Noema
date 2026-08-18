import { describe, expect, it } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import { mintControllerToken } from "../src/auth";
import worker from "../src/index";
import { mintHs256 } from "../src/jwt";
import { admitTestWorldId, isolatedLedgerEventId, resolveLoadWorldId } from "../src/test-world";
import { RATE_LIMIT_DO_NAME } from "../src/rate-limit";
import { ACCEPTED_SEALS } from "../src/seal";
import type { Env } from "../src/types";

const SIGNING = "test-signing-secret-isolated-world";

type DoCall = { op: string; name?: string; body?: Record<string, unknown> | null };

function mockWorldDo(calls: DoCall[]) {
  return {
    idFromName(name: string) {
      calls.push({ op: "idFromName", name });
      return { name };
    },
    get(id: { name: string }) {
      return {
        fetch: async (_url: string, init?: RequestInit) => {
          calls.push({
            op: "fetch",
            name: id.name,
            body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null,
          });
          return new Response(JSON.stringify({ ok: true, world_id: id.name }), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        },
      };
    },
  };
}

function env(calls: DoCall[], defaultWorldId = "world-01"): Env {
  return {
    TOKEN_SIGNING_SECRET: SIGNING,
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: defaultWorldId,
    ADMIN_OPERATOR_TOKEN: "operator-token-value-ok",
    WORLD_DO: mockWorldDo(calls),
  } as unknown as Env;
}

async function playerToken() {
  const minted = await mintControllerToken(env([]), { handle: "probe", controllerType: "agent" });
  return minted.access_token;
}

async function adminToken() {
  const minted = await mintAdminSession(env([]), "operator-token-value-ok");
  if (minted instanceof Response) throw new Error("failed to mint admin");
  return minted.access_token;
}

async function hit(
  path: string,
  body: Record<string, unknown>,
  headers: Record<string, string>,
  calls: DoCall[],
  defaultWorldId?: string,
) {
  const hdrs: Record<string, string> = { "content-type": "application/json", ...headers };
  const liveSeal = ACCEPTED_SEALS[0];
  if (hdrs.Authorization && !hdrs["X-Noema-Seal"] && liveSeal) {
    hdrs["X-Noema-Seal"] = liveSeal;
  }
  const req = new Request(`https://noema.local${path}`, {
    method: "POST",
    headers: hdrs,
    body: JSON.stringify(body),
  });
  return worker.fetch(req, env(calls, defaultWorldId));
}

describe("isolatedLedgerEventId", () => {
  it("namespaces isolated worlds and leaves Perihelion bare", () => {
    expect(isolatedLedgerEventId("test.hosted-canonical.ack-s0", 0)).toBe("evt.tw.ack-s0.000000");
    expect(isolatedLedgerEventId("world.perihelion-reach", 0)).toBe("evt.000000");
    expect(isolatedLedgerEventId("world-01", 1)).toBe("evt.000001");
  });
});

describe("admitTestWorldId", () => {
  it("admits test.hosted-canonical.<suffix>", () => {
    const a = admitTestWorldId("test.hosted-canonical.verify-1");
    expect(a).toEqual({ ok: true, world_id: "test.hosted-canonical.verify-1" });
  });

  it("denies Perihelion before any other check", () => {
    const denied = admitTestWorldId("world.perihelion-reach");
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.code).toBe("WORLD_FORBIDDEN");
  });

  it("denies DEFAULT_WORLD_ID and world-01", () => {
    expect(admitTestWorldId("world-01").ok).toBe(false);
    expect(admitTestWorldId("world.custom-default", "world.custom-default").ok).toBe(false);
  });

  it("denies empty, prefix-only, and arbitrary ids", () => {
    expect(admitTestWorldId("").ok).toBe(false);
    expect(admitTestWorldId("test.hosted-canonical").ok).toBe(false);
    expect(admitTestWorldId("test.hosted-canonical.").ok).toBe(false);
    expect(admitTestWorldId("org.other").ok).toBe(false);
  });

  it("DO load uses requested id and does not fall back when set", () => {
    expect(resolveLoadWorldId("test.hosted-canonical.a", "world-01")).toBe("test.hosted-canonical.a");
    expect(resolveLoadWorldId(null, "world-01")).toBe("world-01");
  });
});

describe("POST /v1/operator/test-world/command", () => {
  const envelope = {
    world_id: "test.hosted-canonical.verify-1",
    request_id: "r1",
    command: "LOOK",
    arguments: {},
  };

  it("denies Perihelion before DO lookup", async () => {
    const calls: DoCall[] = [];
    const player = await playerToken();
    const admin = await adminToken();
    const res = await hit(
      "/v1/operator/test-world/command",
      { ...envelope, world_id: "world.perihelion-reach" },
      { Authorization: `Bearer ${player}`, "X-Noema-Admin-Token": admin },
      calls,
    );
    expect(res.status).toBe(403);
    expect(calls.some((c) => c.op === "idFromName")).toBe(false);
  });

  it("denies default world id before DO lookup", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      { ...envelope, world_id: "world-01" },
      { Authorization: `Bearer ${await playerToken()}`, "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("denies arbitrary world ids before DO lookup", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      { ...envelope, world_id: "world.someone-else" },
      { Authorization: `Bearer ${await playerToken()}`, "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("rejects a missing Player bearer", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      envelope,
      { "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("rejects a missing signed admin header", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      envelope,
      { Authorization: `Bearer ${await playerToken()}` },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("rejects Player-only dual-auth", async () => {
    const calls: DoCall[] = [];
    const player = await playerToken();
    const res = await hit(
      "/v1/operator/test-world/command",
      envelope,
      { Authorization: `Bearer ${player}`, "X-Noema-Access-Token": player },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("rejects admin-only dual-auth", async () => {
    const calls: DoCall[] = [];
    const admin = await adminToken();
    const res = await hit(
      "/v1/operator/test-world/command",
      envelope,
      { Authorization: `Bearer ${admin}`, "X-Noema-Admin-Token": admin },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("rejects an unsigned raw operator token in X-Noema-Admin-Token", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      envelope,
      {
        Authorization: `Bearer ${await playerToken()}`,
        "X-Noema-Admin-Token": "operator-token-value-ok",
      },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("rejects a Player access token placed in the admin header", async () => {
    const calls: DoCall[] = [];
    const player = await playerToken();
    const res = await hit(
      "/v1/operator/test-world/command",
      envelope,
      { Authorization: `Bearer ${player}`, "X-Noema-Admin-Token": player },
      calls,
    );
    expect(res.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("routes dual-auth admitted commands to the test world id", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      envelope,
      { Authorization: `Bearer ${await playerToken()}`, "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(200);
    expect(calls.map((c) => c.op)).toEqual(["idFromName", "fetch"]);
    expect(calls[0].name).toBe("test.hosted-canonical.verify-1");
    expect(calls[0].name).not.toBe("world-01");
    expect(calls[1].body?.world_id).toBe("test.hosted-canonical.verify-1");
    expect(calls[1].body?.allow_bootstrap).toBe(true);
  });
});

describe("POST /v1/operator/test-world/lifecycle", () => {
  it("denies Perihelion recover before DO lookup", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/lifecycle",
      { world_id: "world.perihelion-reach", action: "recover" },
      { Authorization: `Bearer ${await playerToken()}`, "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("denies default world recover before DO lookup", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/lifecycle",
      { world_id: "world-01", action: "recover" },
      { Authorization: `Bearer ${await playerToken()}`, "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(403);
    expect(calls).toEqual([]);
  });

  it("rejects missing dual-auth", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/lifecycle",
      { world_id: "test.hosted-canonical.ack-s0", action: "recover" },
      {},
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("rejects non-recover actions", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/lifecycle",
      { world_id: "test.hosted-canonical.ack-s0", action: "pause" },
      { Authorization: `Bearer ${await playerToken()}`, "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(400);
    expect(calls).toEqual([]);
  });

  it("routes recover to the admitted test world only", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/lifecycle",
      { world_id: "test.hosted-canonical.ack-s0", action: "recover" },
      { Authorization: `Bearer ${await playerToken()}`, "X-Noema-Admin-Token": await adminToken() },
      calls,
    );
    expect(res.status).toBe(200);
    expect(calls.map((c) => c.op)).toEqual(["idFromName", "fetch"]);
    expect(calls[0].name).toBe("test.hosted-canonical.ack-s0");
    expect(calls[0].name).not.toBe("world-01");
    expect(calls[1].body?.action).toBe("recover");
    expect(calls[1].body?.world_id).toBe("test.hosted-canonical.ack-s0");
  });
});

describe("POST /v1/command world routing", () => {
  it("rejects an isolated world_id without dual-auth", async () => {
    const calls: DoCall[] = [];
    const player = await playerToken();
    const res = await hit(
      "/v1/command",
      { request_id: "r2", command: "LOOK", arguments: {}, world_id: "test.hosted-canonical.sneak" },
      { Authorization: `Bearer ${player}` },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls.filter((c) => c.name !== RATE_LIMIT_DO_NAME)).toEqual([]);
  });

  it("keeps PLAY on DEFAULT_WORLD_ID without bootstrap when world_id is omitted", async () => {
    const calls: DoCall[] = [];
    const player = await playerToken();
    const res = await hit(
      "/v1/command",
      { request_id: "r2b", command: "LOOK", arguments: {} },
      { Authorization: `Bearer ${player}` },
      calls,
    );
    expect(res.status).toBe(200);
    const worldCalls = calls.filter((c) => c.name !== RATE_LIMIT_DO_NAME);
    expect(worldCalls[0].name).toBe("world-01");
    expect(worldCalls[1].body?.allow_bootstrap).toBe(false);
    expect(worldCalls[1].body?.world_id).toBe("world-01");
  });

  it("does not accept a forged signed header as PLAY authority", async () => {
    const forged = await mintHs256(
      {
        typ: "admin-access",
        role: "ADMIN",
        scopes: ["noema.world.admin"],
        session_id: "asess.x",
        exp: Math.floor(Date.now() / 1000) + 60,
      },
      SIGNING,
    );
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/command",
      { request_id: "r3", command: "LOOK" },
      { "X-Noema-Admin-Token": forged },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });
});
