import { describe, expect, it, vi } from "vitest";
import worker from "../src/index";
import { providerConfiguration, providerOverview, verifyPostmark, verifySupabase } from "../src/provider-management";
import type { Env } from "../src/types";

function env(overrides: Partial<Env> = {}): Env {
  return {
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    WORLD_DO: {} as DurableObjectNamespace,
    ASSETS: {} as Fetcher,
    ...overrides,
  };
}

describe("admin provider management", () => {
  it("reports only redacted configuration presence", () => {
    const config = providerConfiguration(env({
      SUPABASE_URL: "https://project-ref.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "secret-service-role",
      POSTMARK_SERVER_TOKEN: "secret-postmark",
      POSTMARK_MESSAGE_STREAM: "outbound",
    }));
    expect(config.supabase).toEqual({
      url: true,
      service_role: true,
      management_token: false,
      project_ref: "project-ref",
    });
    expect(config.postmark.server_token).toBe(true);
    expect(JSON.stringify(config)).not.toContain("secret-service-role");
    expect(JSON.stringify(config)).not.toContain("secret-postmark");
  });

  it("verifies the Postmark server and configured stream", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ Name: "NOEMA", DeliveryType: "Live" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ID: "outbound", ServerID: 42 }), { status: 200 }));
    const result = await verifyPostmark(env({ POSTMARK_SERVER_TOKEN: "pm", POSTMARK_MESSAGE_STREAM: "outbound" }), fetchImpl);
    expect(result.healthy).toBe(true);
    expect(result.details).toMatchObject({ server_name: "NOEMA", stream_id: "outbound" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][1].headers).toEqual({ "X-Postmark-Server-Token": "pm" });
  });

  it("fails closed when Postmark is missing or rejects the token", async () => {
    expect((await verifyPostmark(env())).healthy).toBe(false);
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    const result = await verifyPostmark(env({ POSTMARK_SERVER_TOKEN: "bad" }), fetchImpl);
    expect(result.healthy).toBe(false);
    expect(result.details.server_status).toBe(401);
  });

  it("verifies the exact canonical Perihelion head boundary", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      world_id: "world.perihelion-reach",
      revision: 9,
      writer_generation: 3,
      sequence: 75,
      state_digest: "sha256:abc",
      settlement_health: "HEALTHY",
    }]), { status: 200 }));
    const result = await verifySupabase(env({
      SUPABASE_URL: "https://project-ref.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "role",
    }), fetchImpl);
    expect(result.healthy).toBe(true);
    expect(result.details).toMatchObject({ world_id: "world.perihelion-reach", sequence: 75, project_ref: "project-ref" });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toContain("noema_world_heads");
    expect(init.headers.authorization).toBe("Bearer role");
  });

  it("fails deployment readiness when either integration boundary is unhealthy", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url.includes("supabase.co")) return new Response(JSON.stringify([]), { status: 200 });
      return new Response("{}", { status: 401 });
    });
    const result = await providerOverview(env({
      SUPABASE_URL: "https://project-ref.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "role",
      POSTMARK_SERVER_TOKEN: "bad",
    }), fetchImpl as typeof fetch);
    expect(result.ready_for_deploy).toBe(false);
    expect(result.secrets_exposed).toBe(false);
  });

  it("rejects provider routes without an admin session", async () => {
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/admin/providers"),
      env({ TOKEN_SIGNING_SECRET: "signing-secret" }),
    );
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: { code: "NOT_AUTHORIZED" } });
  });

  it("serves redacted provider readiness to a minted admin session", async () => {
    const e = env({
      TOKEN_SIGNING_SECRET: "signing-secret",
      ADMIN_OPERATOR_TOKEN: "operator-secret",
      SUPABASE_URL: "https://project-ref.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-secret",
      POSTMARK_SERVER_TOKEN: "postmark-secret",
    });
    const sessionRes = await worker.fetch(
      new Request("https://noema.guru/v1/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ admin_token: "operator-secret" }),
      }),
      e,
    );
    const session = await sessionRes.json() as { access_token: string };
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("supabase.co")) {
        return new Response(JSON.stringify([{
          world_id: "world.perihelion-reach",
          revision: 1,
          writer_generation: 1,
          sequence: 75,
          state_digest: "sha256:abc",
          settlement_health: "HEALTHY",
        }]), { status: 200 });
      }
      if (url.endsWith("/server")) return new Response(JSON.stringify({ Name: "NOEMA", DeliveryType: "Live" }), { status: 200 });
      return new Response(JSON.stringify({ ID: "outbound", ServerID: 42 }), { status: 200 });
    }));
    try {
      const res = await worker.fetch(
        new Request("https://noema.guru/v1/admin/providers", {
          headers: { authorization: `Bearer ${session.access_token}` },
        }),
        e,
      );
      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).not.toContain("service-role-secret");
      expect(text).not.toContain("postmark-secret");
      expect(JSON.parse(text)).toMatchObject({ ready_for_deploy: true, secrets_exposed: false });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("rate-limits admin session mint when the durable throttle refuses", async () => {
    const e = env({
      TOKEN_SIGNING_SECRET: "signing-secret",
      ADMIN_OPERATOR_TOKEN: "operator-secret",
      WORLD_DO: {
        idFromName: (name: string) => name,
        get: () => ({
          fetch: async () => new Response(JSON.stringify({ allowed: false }), { status: 200 }),
        }),
      } as unknown as DurableObjectNamespace,
    });
    const res = await worker.fetch(
      new Request("https://noema.guru/v1/admin/session", {
        method: "POST",
        headers: { "content-type": "application/json", "CF-Connecting-IP": "198.51.100.9" },
        body: JSON.stringify({ admin_token: "operator-secret" }),
      }),
      e,
    );
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: { code: "RATE_LIMITED", retryable: true } });
  });
});
