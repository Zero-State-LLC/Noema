import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import {
  approveDevice,
  approveDeviceReview,
  reviewDevicePage,
  denyDevice,
  denyDeviceReview,
  DEVICE_TTL_MS,
  DEVICE_TTL_SECONDS,
  DEVICE_POLL_INTERVAL_SECONDS,
  durableDeviceStore,
  GAME_SCOPES,
  memoryDeviceStore,
  parseDeviceRecord,
  pollDeviceToken,
  previewDevice,
  startDeviceEnrollment,
  verifyApprovedDeviceEnrollments,
} from "../src/device-enrollment";
import { verifyHs256 } from "../src/jwt";
import type { Env } from "../src/types";

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "test",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ...partial,
  } as Env;
}

function reviewEnv(partial: Partial<Env> = {}): Env {
  return env({ DEVICE_REVIEW_TOKEN_SECRET: "review-secret", RESEND_API_KEY: "resend-key", ...partial } as Partial<Env>);
}

function okResend(calls: unknown[] = []): typeof fetch {
  return (async (_input: RequestInfo | URL, init?: RequestInit) => {
    calls.push(JSON.parse(String(init?.body || "{}")));
    return Response.json({ id: "email_123" });
  }) as typeof fetch;
}

function reviewTokenFromMail(calls: unknown[], _action: "approve" | "deny" = "approve"): string {
  const text = String((calls.at(-1) as { text?: string })?.text || "");
  const match = text.match(/\/review\?token=([^\s]+)/);
  expect(match?.[1]).toBeTruthy();
  return decodeURIComponent(match![1]);
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

async function completeShortCodeEnrollment(store: ReturnType<typeof memoryDeviceStore>, e: Env, handle: string) {
  const started = await startDeviceEnrollment(
    e,
    new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
    { metadata: { runtime: handle } },
    { store },
  );
  const { user_code } = (await started.json()) as { user_code: string };
  const approved = await approveDevice(
    e,
    new Request("https://noema.guru/v1/auth/device/approve", {
      method: "POST",
      headers: { authorization: `Bearer ${await humanBearer(e)}` },
    }),
    { user_code },
    { store },
  );
  expect(approved.status).toBe(200);
  const body = (await approved.json()) as {
    approval_receipt: string;
    independent_control_receipt: string;
    controller_binding_digest: string;
  };
  expect(body.approval_receipt).toMatch(/^approval\./);
  expect(body.independent_control_receipt).toMatch(/^receipt\./);
  expect(body.controller_binding_digest).toMatch(/^[0-9a-f]{64}$/);
  const rec = await store.getByUserCode(user_code);
  expect(rec).not.toBeNull();
  return rec!;
}

describe("startDeviceEnrollment", () => {
  it("returns the production verification_uri regardless of the request origin", async () => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env({ NOEMA_ENV: "production" }),
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
    expect(body.verification_uri).toBe("https://noema.guru/connect");
  });

  it.each(["local", "test"])("uses the trusted request origin in %s", async (runtimeEnv) => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env({ NOEMA_ENV: runtimeEnv }),
      new Request("https://preview.example/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "openclaw" } },
      { store },
    );
    const body = (await res.json()) as { verification_uri: string };
    expect(body.verification_uri).toBe("https://preview.example/connect");
  });

  it("does not trust hostile forwarded-origin headers in local and test environments", async () => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env(),
      new Request("https://preview.example/v1/auth/device", {
        method: "POST",
        headers: {
          "X-Forwarded-Host": "evil.example",
          "X-Forwarded-Proto": "https",
          Forwarded: "host=evil.example;proto=https",
        },
      }),
      { metadata: { runtime: "openclaw" } },
      { store },
    );
    const body = (await res.json()) as { verification_uri: string };
    expect(body.verification_uri).toBe("https://preview.example/connect");
  });

  it("returns user_code, expiry, scopes, and no token", async () => {
    const store = memoryDeviceStore();
    const res = await startDeviceEnrollment(
      env(),
      new Request("https://example.com/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "openclaw" } },
      { store },
    );
    const body = (await res.json()) as {
      user_code: string;
      verification_uri: string;
      expires_in: number;
      interval: number;
      scopes: string[];
      access_token?: string;
    };
    expect(body.user_code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
    expect(body.verification_uri).toBe("https://example.com/connect");
    // Regression guard: expires_in was a hardcoded 600 while DEVICE_TTL_MS set the
    // real expiry. The client derives its polling deadline from this field, so a
    // drift between them would silently stop polling before the code expired.
    expect(body.expires_in).toBe(DEVICE_TTL_SECONDS);
    expect(body.expires_in).toBe(DEVICE_TTL_MS / 1000);
    expect(body.interval).toBe(DEVICE_POLL_INTERVAL_SECONDS);
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

  it("normalizes owner_email and sends focused review URL without changing device response shape", async () => {
    const store = memoryDeviceStore();
    const calls: unknown[] = [];
    const res = await startDeviceEnrollment(
      reviewEnv(),
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { metadata: { runtime: "openclaw" }, owner_email: " Owner@Example.COM " },
      { store, fetchImpl: okResend(calls) },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { device_code: string; review_delivery: string; access_token?: string };
    expect(body.review_delivery).toBe("sent");
    expect(body.access_token).toBeUndefined();
    expect(calls).toHaveLength(1);
    const mail = calls[0] as { to: string | string[]; text: string; html: string };
    expect(mail.to).toEqual(["owner@example.com"]);
    expect(mail.text).toContain("/v1/auth/device/review?token=");
    expect(mail.text).toContain("does not approve until you press Approve");
    expect(mail.text).not.toContain(body.device_code);
    expect(await store.getByDeviceCode(body.device_code)).not.toHaveProperty("access_token");
  });

  it("keeps fallback short-code approval when owner_email delivery fails or secret is absent", async () => {
    const store = memoryDeviceStore();
    const failed = await startDeviceEnrollment(
      reviewEnv(),
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { owner_email: "owner@example.com" },
      { store, fetchImpl: (async () => { throw new Error("mail down"); }) as typeof fetch },
    );
    expect(((await failed.json()) as { review_delivery: string }).review_delivery).toBe("failed");
    const unconfigured = await startDeviceEnrollment(
      env(),
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      { owner_email: "owner@example.com" },
      { store },
    );
    const body = (await unconfigured.json()) as { user_code: string; review_delivery: string };
    expect(body.review_delivery).toBe("unconfigured");
    const token = await humanBearer(env());
    const approved = await approveDevice(
      env(),
      new Request("https://noema.guru/v1/auth/device/approve", { method: "POST", headers: { authorization: `Bearer ${token}` } }),
      { user_code: body.user_code },
      { store },
    );
    expect(approved.status).toBe(200);
  });
});

describe("device review token URLs", () => {
  it("approves by opaque token, delivers credentials only to polling, and rejects replay", async () => {
    const store = memoryDeviceStore();
    const e = reviewEnv();
    const calls: unknown[] = [];
    const started = await startDeviceEnrollment(e, new Request("https://noema.guru/v1/auth/device", { method: "POST" }), { metadata: { runtime: "openclaw" }, owner_email: "owner@example.com" }, { store, fetchImpl: okResend(calls) });
    const { device_code } = (await started.json()) as { device_code: string };
    const token = reviewTokenFromMail(calls);
    const approved = await approveDeviceReview(e, new Request(`https://noema.guru/v1/auth/device/review/approve?token=${token}`), { store });
    expect(approved.status).toBe(200);
    const approval = (await approved.json()) as {
      access_token?: string;
      approval_receipt?: string;
      independent_control_receipt?: string;
    };
    expect(approval).not.toHaveProperty("access_token");
    expect(approval.approval_receipt).toMatch(/^approval\./);
    expect(approval.independent_control_receipt).toMatch(/^receipt\./);
    expect((await approveDeviceReview(e, new Request(`https://noema.guru/v1/auth/device/review/approve?token=${token}`), { store })).status).toBe(401);
    const polled = await pollDeviceToken(e, new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }), { device_code }, { store });
    expect(polled.status).toBe(200);
    expect(((await polled.json()) as { access_token?: string }).access_token).toBeTruthy();
  });

  it("denies by token and prevents polling receipt", async () => {
    const store = memoryDeviceStore();
    const e = reviewEnv();
    const calls: unknown[] = [];
    const started = await startDeviceEnrollment(e, new Request("https://noema.guru/v1/auth/device", { method: "POST" }), { owner_email: "owner@example.com" }, { store, fetchImpl: okResend(calls) });
    const { device_code } = (await started.json()) as { device_code: string };
    const denied = await denyDeviceReview(e, new Request(`https://noema.guru/v1/auth/device/review/deny?token=${reviewTokenFromMail(calls, "deny")}`), { store });
    expect(denied.status).toBe(200);
    const polled = await pollDeviceToken(e, new Request("https://noema.guru/v1/auth/device/token", { method: "POST" }), { device_code }, { store });
    expect(polled.status).toBe(401);
  });

  it("rejects expired, malformed, and mismatched world/runtime/scope tokens", async () => {
    const store = memoryDeviceStore();
    const e = reviewEnv();
    const now = Date.parse("2026-08-15T12:00:00Z");
    const calls: unknown[] = [];
    await startDeviceEnrollment(e, new Request("https://noema.guru/v1/auth/device", { method: "POST" }), { metadata: { runtime: "openclaw" }, owner_email: "owner@example.com" }, { store, now, fetchImpl: okResend(calls) });
    const token = reviewTokenFromMail(calls);
    expect((await approveDeviceReview(e, new Request("https://noema.guru/v1/auth/device/review/approve?token=not-a-token"), { store })).status).toBe(401);
    expect((await approveDeviceReview(e, new Request(`https://noema.guru/v1/auth/device/review/approve?token=${token}`), { store, now: now + DEVICE_TTL_MS + 1 })).status).toBe(409);

    const started2 = await startDeviceEnrollment(e, new Request("https://noema.guru/v1/auth/device", { method: "POST" }), { metadata: { runtime: "openclaw" }, owner_email: "owner@example.com" }, { store, now, fetchImpl: okResend(calls) });
    const { device_code } = (await started2.json()) as { device_code: string };
    const rec = await store.getByDeviceCode(device_code);
    await store.put({ ...rec!, review_world_id: "world.other" });
    expect((await approveDeviceReview(e, new Request(`https://noema.guru/v1/auth/device/review/approve?token=${reviewTokenFromMail(calls)}`), { store })).status).toBe(401);
  });
});


  it("GET renders review page without mutating; POST approve/deny mutate explicitly", async () => {
    const store = memoryDeviceStore();
    const e = reviewEnv();
    const calls: unknown[] = [];
    const started = await startDeviceEnrollment(e, new Request("https://noema.guru/v1/auth/device", { method: "POST" }), { metadata: { runtime: "openclaw" }, owner_email: "owner@example.com" }, { store, fetchImpl: okResend(calls) });
    const { device_code } = (await started.json()) as { device_code: string };
    const token = reviewTokenFromMail(calls);
    const page = await reviewDevicePage(e, new Request(`https://noema.guru/v1/auth/device/review?token=${token}`), { store });
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("Opening this link does not approve or deny anything");
    expect(html).toContain('method="post" action="/v1/auth/device/review/approve"');
    expect((await store.getByDeviceCode(device_code))?.status).toBe("pending");
    const approved = await approveDeviceReview(e, new Request("https://noema.guru/v1/auth/device/review/approve", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ token }) }), { store });
    expect(approved.status).toBe(200);
    expect((await store.getByDeviceCode(device_code))?.status).toBe("approved");
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

  it("is WATCH-safe: approval status is visible without controller identity or credentials", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const started = await startDeviceEnrollment(
      e,
      new Request("https://noema.guru/v1/auth/device", { method: "POST" }),
      {},
      { store },
    );
    const { user_code } = (await started.json()) as { user_code: string };
    const pending = await previewDevice(e, new Request(`https://noema.guru/v1/auth/device/preview?user_code=${user_code}`), { store });
    expect(((await pending.json()) as { status: string }).status).toBe("pending");

    await approveDevice(
      e,
      new Request("https://noema.guru/v1/auth/device/approve", {
        method: "POST",
        headers: { authorization: `Bearer ${await humanBearer(e)}` },
      }),
      { user_code },
      { store },
    );
    const approved = await previewDevice(e, new Request(`https://noema.guru/v1/auth/device/preview?user_code=${user_code}`), { store });
    const body = (await approved.json()) as Record<string, unknown>;
    expect(body.status).toBe("approved");
    expect(body).not.toHaveProperty("access_token");
    expect(body).not.toHaveProperty("controller_id");
    expect(body).not.toHaveProperty("player_id");
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
      approval_receipt: string;
      independent_control_receipt: string;
      controller_binding_digest: string;
    };
    expect(body.status).toBe("approved");
    expect(body.player_id).toMatch(/^player\./);
    expect(body.player_id).not.toBe("player.prabu");
    expect(body.access_token).toBeUndefined();
    expect(body.controller_id).toMatch(/^ctrl\.device\.[a-f0-9]{12}$/);
    expect(body.approval_receipt).toMatch(/^approval\./);
    expect(body.independent_control_receipt).toMatch(/^receipt\./);
    expect(body.controller_binding_digest).toMatch(/^[0-9a-f]{64}$/);
    const stored = await store.getByUserCode(user_code);
    expect(stored).not.toHaveProperty("access_token");
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

  it("verifies three independently approved enrollments and rejects contention/recovery gaps", async () => {
    const store = memoryDeviceStore();
    const e = env();
    const records = [
      await completeShortCodeEnrollment(store, e, "controller-a"),
      await completeShortCodeEnrollment(store, e, "controller-b"),
      await completeShortCodeEnrollment(store, e, "controller-c"),
    ];

    expect((await verifyApprovedDeviceEnrollments(records)).ok).toBe(true);
    expect(new Set(records.map((record) => record.controller_id)).size).toBe(3);
    expect(new Set(records.map((record) => record.approval_receipt)).size).toBe(3);
    expect(new Set(records.map((record) => record.independent_control_receipt)).size).toBe(3);

    const contention = records.map((record) => ({ ...record, controller_id: records[0].controller_id }));
    const contended = await verifyApprovedDeviceEnrollments(contention);
    expect(contended.ok).toBe(false);
    expect(contended.reason).toContain("contention");

    const recoveryRequired = records.map((record, index) => ({
      ...record,
      status: index === 0 ? "expired" as const : record.status,
    }));
    const recovered = await verifyApprovedDeviceEnrollments(recoveryRequired);
    expect(recovered.ok).toBe(false);
    expect(recovered.reason).toContain("approved or redeemed");
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
    expect(minted.player_id).toMatch(/^player\./);
    expect(minted.player_id).not.toBe("player.prabu");
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
    expect(stored).not.toHaveProperty("access_token");

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

  it("drops leftover access_token fields from stored JSON", () => {
    const rec = parseDeviceRecord({
      device_code: "abc",
      user_code: "ABCD-1234",
      status: "approved",
      access_token: "should-not-survive",
    });
    expect(rec?.device_code).toBe("abc");
    expect(rec).not.toHaveProperty("access_token");
  });
});
