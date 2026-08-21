import { describe, expect, it } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import { mintControllerToken } from "../src/auth";
import { SUCCESSOR_WORLD_ID } from "../src/genesis";
import { resolvePlayWorld } from "../src/command-world";
import worker from "../src/index";
import { ACCEPTED_SEALS } from "../src/seal";
import type { Env } from "../src/types";

describe("PLAY does not follow the frozen Admin allowlist", () => {
  it("maps world.perihelion-reach to the successor default DO, not world-01", () => {
    const r = resolvePlayWorld("world.perihelion-reach", SUCCESSOR_WORLD_ID);
    expect(r).toEqual({ kind: "default", world_id: SUCCESSOR_WORLD_ID });
  });
});

type DoCall = { op: string; name?: string; url?: string };

function mockWorldDo(calls: DoCall[]) {
  return {
    idFromName(name: string) {
      calls.push({ op: "idFromName", name });
      return { name };
    },
    get(id: { name: string }) {
      return {
        fetch: async (url: string) => {
          calls.push({ op: "fetch", name: id.name, url: String(url) });
          return new Response(
            JSON.stringify({
              ok: true,
              world_id: id.name,
              sequence: 0,
              cycle: 0,
              meta: { status: "ACTIVE", genesis_id: "genesis.test", revision: 1 },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          );
        },
      };
    },
  };
}

function env(calls: DoCall[]): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret-admin-frozen-allowlist",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: SUCCESSOR_WORLD_ID,
    ADMIN_OPERATOR_TOKEN: "operator-token-value-ok",
    WORLD_DO: mockWorldDo(calls),
  } as unknown as Env;
}

async function adminToken() {
  const minted = await mintAdminSession(env([]), "operator-token-value-ok");
  if (minted instanceof Response) throw new Error("failed to mint admin");
  return minted.access_token;
}

describe("GET /v1/admin/overview frozen allowlist", () => {
  it("omitted world_id hits the successor default DO", async () => {
    const calls: DoCall[] = [];
    const token = await adminToken();
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/admin/overview", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env(calls),
    );
    expect(res.status).toBe(200);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual([SUCCESSOR_WORLD_ID]);
  });

  it("world_id=world.perihelion-reach hits the frozen world-01 DO", async () => {
    const calls: DoCall[] = [];
    const token = await adminToken();
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/admin/overview?world_id=world.perihelion-reach", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env(calls),
    );
    expect(res.status).toBe(200);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual(["world-01"]);
  });

  it("rejects an unknown admin world_id before DO lookup", async () => {
    const calls: DoCall[] = [];
    const token = await adminToken();
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/admin/overview?world_id=world.other", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      env(calls),
    );
    expect(res.status).toBe(400);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("INVALID_REQUEST");
    expect(calls.some((c) => c.op === "idFromName")).toBe(false);
  });
});

describe("POST /v1/admin/lifecycle frozen allowlist", () => {
  it("recover with frozen world_id hits world-01, not the successor", async () => {
    const calls: DoCall[] = [];
    const token = await adminToken();
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/admin/lifecycle", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ action: "recover", world_id: "world.perihelion-reach", reason: "operator" }),
      }),
      env(calls),
    );
    expect(res.status).toBe(200);
    expect(calls.filter((c) => c.op === "idFromName").map((c) => c.name)).toEqual(["world-01"]);
  });
});

describe("POST /v1/command PLAY stays on successor", () => {
  it("does not route perihelion-reach PLAY to world-01", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const minted = await mintControllerToken(e, {
      handle: "reach-maint3",
      controllerType: "agent",
      playerId: "player.reach-maint3",
    });
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/command", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${minted.access_token}`,
          "X-Noema-Seal": ACCEPTED_SEALS[0] || "",
        },
        body: JSON.stringify({
          request_id: "play-frozen",
          command: "LOOK",
          arguments: {},
          world_id: "world.perihelion-reach",
        }),
      }),
      e,
    );
    expect(res.status).not.toBe(500);
    const named = calls.filter((c) => c.op === "idFromName").map((c) => c.name);
    expect(named).not.toContain("world-01");
    expect(named).toContain(SUCCESSOR_WORLD_ID);
  });
});
