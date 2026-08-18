import { describe, expect, it } from "vitest";
import { mintAdminSession } from "../src/admin-auth";
import {
  bootstrapDocument,
  decideAgentEnrollment,
  ENROLLMENT_TTL_MS,
  getBootstrapDocument,
  memoryEnrollmentStore,
  previewAgentEnrollment,
  requestAgentEnrollment,
} from "../src/enrollment";
import type { Env } from "../src/types";

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ADMIN_OPERATOR_TOKEN: "operator-token-ok",
    ...partial,
  } as Env;
}

describe("RFC-0033 agent bootstrap", () => {
  it("GET/preview does not issue a credential", async () => {
    const store = memoryEnrollmentStore();
    const sent: Array<{ href?: string; html: string; text: string }> = [];
    const reqRes = await requestAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll", { method: "POST" }),
      { email: "ops@example.com", handle: "hermes" },
      {
        store,
        sendMail: async (mail) => {
          sent.push(mail);
        },
      },
    );
    expect(reqRes.status).toBe(200);
    const created = (await reqRes.json()) as { enrollment_id: string };
    const href = sent[0].text.match(/https:\/\/noema\.guru\/connect\/enroll\?[^\s]+/)?.[0];
    expect(href).toBeTruthy();
    expect(sent[0].html + sent[0].text).not.toMatch(/access_token|eyJ/);

    const preview = await previewAgentEnrollment(env(), new Request(href!), { store });
    expect(preview.status).toBe(200);
    const body = (await preview.json()) as { status: string; access_token?: string };
    expect(body.status).toBe("pending");
    expect(body.access_token).toBeUndefined();
    const rec = await store.get(created.enrollment_id);
    expect(rec?.status).toBe("pending");
  });

  it("expired and replayed decide fail closed; deny issues no token", async () => {
    const store = memoryEnrollmentStore();
    const sent: string[] = [];
    const now = Date.parse("2026-08-15T12:00:00Z");
    await requestAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll"),
      { email: "ops@example.com", handle: "hermes" },
      {
        store,
        now,
        sendMail: async (mail) => {
          sent.push(mail.text);
        },
      },
    );
    const href = sent[0].match(/eid=([^&]+)&t=([^\s]+)/);
    expect(href).toBeTruthy();
    const enrollment_id = decodeURIComponent(href![1]);
    const token = decodeURIComponent(href![2]);

    const expired = await decideAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll/decide"),
      { enrollment_id, token, decision: "approve" },
      { store, now: now + ENROLLMENT_TTL_MS + 1 },
    );
    expect(expired.status).toBe(409);

    const denied = await decideAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll/decide"),
      { enrollment_id, token, decision: "deny" },
      { store, now },
    );
    expect(denied.status).toBe(200);
    expect(((await denied.json()) as { status: string }).status).toBe("denied");

    const replay = await decideAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll/decide"),
      { enrollment_id, token, decision: "approve" },
      { store, now },
    );
    expect(replay.status).toBe(409);
  });

  it("approve issues a distinct agent controller token once", async () => {
    const store = memoryEnrollmentStore();
    const sent: string[] = [];
    await requestAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll"),
      { email: "ops@example.com", handle: "hermes" },
      {
        store,
        sendMail: async (mail) => {
          sent.push(mail.text);
        },
      },
    );
    const href = sent[0].match(/eid=([^&]+)&t=([^\s]+)/)!;
    const enrollment_id = decodeURIComponent(href[1]);
    const token = decodeURIComponent(href[2]);
    const approved = await decideAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll/decide"),
      { enrollment_id, token, decision: "approve" },
      { store, operatorId: "op.mail.dddddddddddddddd" },
    );
    expect(approved.status).toBe(200);
    const body = (await approved.json()) as { access_token: string; player_id: string; controller_type: string };
    expect(body.controller_type).toBe("agent");
    expect(body.player_id).toBe("player.hermes");
    expect(body.access_token.length).toBeGreaterThan(20);
    const { verifyHs256 } = await import("../src/jwt");
    const claims = await verifyHs256(body.access_token, "test-signing-secret");
    expect(claims.operator_id).toBe("op.mail.dddddddddddddddd");
    expect(claims.issued_by).toBe("admin");

    const again = await decideAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll/decide"),
      { enrollment_id, token, decision: "approve" },
      { store },
    );
    expect(again.status).toBe(409);
  });

  it("bootstrap document has no secrets and binds enrollment", async () => {
    const store = memoryEnrollmentStore();
    const sent: string[] = [];
    await requestAgentEnrollment(
      env(),
      new Request("https://noema.guru/v1/admin/agent/enroll"),
      { email: "ops@example.com", handle: "hermes" },
      {
        store,
        sendMail: async (mail) => {
          sent.push(mail.text);
        },
      },
    );
    const href = sent[0].match(/eid=([^&]+)&t=([^\s]+)/)!;
    const enrollment_id = decodeURIComponent(href[1]);
    const token = decodeURIComponent(href[2]);
    const res = await getBootstrapDocument(
      env(),
      new Request(`https://noema.guru/v1/agent/bootstrap/${enrollment_id}?t=${encodeURIComponent(token)}`),
      enrollment_id,
      { store },
    );
    expect(res.status).toBe(200);
    const doc = (await res.json()) as ReturnType<typeof bootstrapDocument>;
    expect(doc.schema_version).toBe("noema-agent-bootstrap/1.0");
    expect(doc.origin).toBe("https://noema.guru");
    expect(doc.player_id).toBe("player.hermes");
    expect(JSON.stringify(doc)).not.toMatch(/access_token|refresh_token|token_hash/);
    expect(doc.profile).toEqual({
      mode: "game-only",
      isolated: true,
      inherits_operator_session: false,
    });

    const wrong = await getBootstrapDocument(
      env(),
      new Request(`https://noema.guru/v1/agent/bootstrap/${enrollment_id}?t=nope`),
      enrollment_id,
      { store },
    );
    expect(wrong.status).toBe(404);
  });

  it("admin session helper still exists for decide wiring", async () => {
    const minted = await mintAdminSession(env(), "operator-token-ok");
    expect(minted).not.toBeInstanceOf(Response);
    if (minted instanceof Response) return;
    expect(minted.role).toBe("ADMIN");
  });
});
