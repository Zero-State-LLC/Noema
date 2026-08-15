import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import {
  approveDevice,
  denyDevice,
  DEVICE_TTL_MS,
  durableDeviceStore,
  memoryDeviceStore,
  parseDeviceRecord,
  pollDeviceToken,
  previewDevice,
  startDeviceEnrollment,
} from "../src/device-enrollment";
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
      // Admin scopes dropped; only requested game scopes kept (same for every runtime).
      expect(body.scopes).toEqual(["noema.player.read"]);
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
    const body = (await res.json()) as { player_id: string; access_token?: string; status: string };
    expect(body.status).toBe("approved");
    expect(body.player_id).toBe("player.prabu");
    expect(body.access_token).toBeUndefined();
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
    const { device_code, user_code } = (await started.json()) as {
      device_code: string;
      user_code: string;
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
    const minted = (await first.json()) as { access_token: string; status: string; player_id: string };
    expect(minted.status).toBe("approved");
    expect(minted.player_id).toBe("player.prabu");
    expect(minted.access_token.length).toBeGreaterThan(20);

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
