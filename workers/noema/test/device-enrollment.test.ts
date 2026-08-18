import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import {
  approveDevice,
  denyDevice,
  DEVICE_TTL_MS,
  durableDeviceStore,
  GAME_SCOPES,
  memoryDeviceStore,
  parseDeviceRecord,
  pollDeviceToken,
  previewDevice,
  startDeviceEnrollment,
} from "../src/device-enrollment";
import { verifyHs256 } from "../src/jwt";
import type { Env } from "../src/types";

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ...partial,
  } as Env;
}

async function humanBearer(e = env()) {
  const minted = await mintControllerToken(e, {
    handle: "prabu",
    controllerType: "human",
    playerId: "player.prabu",
    amr: "email_magic_link",
  });
  return minted.access_token;
}

describe("startDeviceEnrollment", () => {
  it("returns user_code, production verification_uri, 600s expiry, and no token", async () => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env(),
      new Request("https://example.com/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "openclaw" } },
      { store },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      device_code: string;
      user_code: string;
      verification_uri: string;
      expires_in: number;
      interval: number;
      scopes: string[];
    };
    expect(body.user_code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(body.verification_uri).toBe("https://noema.guru/connect");
    expect(body.expires_in).toBe(600);
    expect(body.interval).toBe(5);
    expect(body.scopes).toEqual([
      "noema.player.read",
      "noema.world.observe",
      "noema.action.submit",
    ]);
    expect(JSON.stringify(body)).not.toMatch(/access_token/);
    expect((body as { controller_id?: string }).controller_id).toMatch(/^ctrl\.device\.[a-f0-9]{12}$/);
  });

  it("mints controller_id at enroll and ignores a client-supplied id", async () => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env(),
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { controller_id: "ctrl.device.injected01" } as { metadata?: { runtime?: string }; scopes?: string[] },
      { store },
    );
    const body = (await res.json()) as { controller_id: string; device_code: string };
    expect(body.controller_id).toMatch(/^ctrl\.device\.[a-f0-9]{12}$/);
    expect(body.controller_id).not.toBe("ctrl.device.injected01");
    const rec = await store.getByDeviceCode(body.device_code);
    expect(rec?.controller_id).toBe(body.controller_id);
  });

  it("treats runtime labels as display-only", async () => {
    const store = memoryDeviceStore();
    for (const runtime of ["openclaw", "hermes", "grok-bot"]) {
      const res = await startDeviceEnrollment(
        env(),
        new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
        { metadata: { runtime }, scopes: ["noema.player.read", "noema.world.admin"] },
        { store },
      );
      const body = (await res.json()) as { scopes: string[] };
      // Admin dropped; always echo full GAME_SCOPES (matches minted JWT).
      expect(body.scopes).toEqual([
        "noema.player.read",
        "noema.world.observe",
        "noema.action.submit",
      ]);
    }
  });
});

describe("previewDevice", () => {
  it("returns public fields and never a token", async () => {
    const store = memoryDeviceStore();
    const started = await startDeviceEnrollment(
      env(),
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "hermes" } },
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const res = await previewDevice(
      env(),
      new Request(`https://noema.guru/v1/auth/device/preview?user_code=${user_code}`),
      { store },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; runtime: string; access_token?: string };
    expect(body.status).toBe("pending");
    expect(body.runtime).toBe("hermes");
    expect(body.access_token).toBeUndefined();
  });
});

describe("approveDevice", () => {
  it("binds the approver player_id and does not return an access token", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "openclaw" } },
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const token = await humanBearer(e);
    const res = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }),
      { user_code },
      { store },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      player_id: string;
      access_token?: string;
      status: string;
      controller_id: string;
    };
    expect(body.status).toBe("approved");
    expect(body.player_id).toBe("player.prabu");
    expect(body.access_token).toBeUndefined();
    expect(body.controller_id).toMatch(/^ctrl\.device\.[a-f0-9]{12}$/);
    const stored = await store.getByUserCode(user_code);
    expect(stored?.access_token).toBeUndefined();
    expect(stored?.status).toBe("approved");
  });

  it("rejects an agent bearer", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const agent = await mintControllerToken(e, { handle: "bot", controllerType: "agent" });
    const res = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${agent.access_token}` },
      }),
      { user_code },
      { store },
    );
    expect(res.status).toBe(403);
  });
});

describe("denyDevice", () => {
  it("marks denied", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const token = await humanBearer(e);
    const res = await denyDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/deny", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }),
      { user_code },
      { store },
    );
    expect(res.status).toBe(200);
    expect(((await res.json()) as { status: string }).status).toBe("denied");
  });

  it("fail-closed: poll after deny returns 401 and no access_token", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { device_code, user_code } = (await started.json()) as {
      device_code: string;
      user_code: string;
    };
    const token = await humanBearer(e);
    await denyDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/deny", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }),
      { user_code },
      { store },
    );
    const res = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store },
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { access_token?: string };
    expect(body.access_token).toBeUndefined();
  });
});

describe("pollDeviceToken", () => {
  it("returns authorization_pending then the token once", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { device_code, user_code, controller_id } = (await started.json()) as {
      device_code: string;
      user_code: string;
      controller_id: string;
    };
    const pending = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store },
    );
    expect(pending.status).toBe(200);
    expect(((await pending.json()) as { status: string }).status).toBe("authorization_pending");

    const human = await humanBearer(e);
    await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${human}` },
      }),
      { user_code },
      { store },
    );
    const first = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store },
    );
    const minted = (await first.json()) as {
      access_token: string;
      status: string;
      player_id: string;
      controller_id: string;
      scopes: string[];
    };
    expect(minted.status).toBe("approved");
    expect(minted.player_id).toBe("player.prabu");
    expect(minted.controller_id).toBe(controller_id);
    expect(minted.access_token.length).toBeGreaterThan(20);
    expect(minted.scopes).toEqual([...GAME_SCOPES]);
    const claims = await verifyHs256(minted.access_token, "test-signing-secret");
    expect(claims.typ).toBe("access");
    expect(claims.controller_type).toBe("agent");
    expect(claims.controller_id).toBe(controller_id);
    expect(claims.scopes).toEqual([...GAME_SCOPES]);
    const stored = await store.getByDeviceCode(device_code);
    expect(stored?.status).toBe("redeemed");
    expect(stored?.access_token).toBeUndefined();

    const second = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store },
    );
    expect(second.status).toBe(401);
  });

  it("expires pending enrollments", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const now = Date.parse("2026-08-15T12:00:00Z");
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store, now },
    );
    const { device_code } = (await started.json()) as { device_code: string };
    const res = await pollDeviceToken(
      e,
      new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }),
      { device_code },
      { store, now: now + DEVICE_TTL_MS + 1 },
    );
    expect(res.status).toBe(401);
  });
});

describe("approveDevice fail-closed after expiry", () => {
  it("rejects approve after DEVICE_TTL_MS with 409", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const now = Date.parse("2026-08-15T12:00:00Z");
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store, now },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const token = await humanBearer(e);
    const res = await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      }),
      { user_code },
      { store, now: now + DEVICE_TTL_MS + 1 },
    );
    expect(res.status).toBe(409);
  });
});

describe("durableDeviceStore", () => {
  it("is exported", () => {
    expect(typeof durableDeviceStore).toBe("function");
  });
});

describe("parseDeviceRecord", () => {
  it("rejects list bags and other non-records", () => {
    expect(parseDeviceRecord({ records: [] })).toBeNull();
    expect(parseDeviceRecord({ records: [{ device_code: "x" }] })).toBeNull();
    expect(parseDeviceRecord(null)).toBeNull();
    expect(parseDeviceRecord({})).toBeNull();
  });

  it("accepts a DeviceRecord-shaped object", () => {
    const rec = parseDeviceRecord({
      device_code: "abc",
      device_code_hash: "h",
      user_code: "ABCD-1234",
      scopes: [],
      runtime: "openclaw",
      status: "pending",
      player_id: null,
      controller_id: null,
      issued_at: "2026-01-01T00:00:00Z",
      expires_at: "2026-01-01T00:10:00Z",
    });
    expect(rec?.device_code).toBe("abc");
    expect(rec?.user_code).toBe("ABCD-1234");
    expect(rec?.status).toBe("pending");
  });
});
