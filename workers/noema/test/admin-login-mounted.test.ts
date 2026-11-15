import { afterEach, expect, it, vi } from "vitest";
import worker from "../src/index";
import { resolveAdmin } from "../src/admin-auth";
import { mintHs256, verifyHs256 } from "../src/jwt";
import type { Env } from "../src/types";

// Every value here is synthetic. Never substitute a real tenant or credential.
const PROVIDER = "https://auth-fixture.invalid";
const VERIFY = `${PROVIDER}/auth/v1/verify`;
const MAIL = "ops@example.com";
const SUBJECT = "00000000-0000-4000-8000-000000000001";
const SIGNING = "fixture-only-signing-material-not-a-real-secret";
const SERVICE = "fixture-only-provider-configuration";
const HASH = "fixture-only-otp-input";
const PRIVATE_UPSTREAM = "fixture-only-upstream-detail";
const PROVIDER_ACCESS = "fixture-only-provider-access";
const PROVIDER_REFRESH = "fixture-only-provider-refresh";
const EXPECTED_OPERATOR = "op.mail.af3c82544f648b38";
const EXPECTED_SUCCESS_KEYS = [
  "access_token", "expires_in", "role", "session_id", "token_type",
];
type Output = {
  response: Response;
  raw: string;
  body: Record<string, unknown>;
};
type Reply = () => Response | Promise<Response>;

function providerSuccess(): Response {
  return new Response(JSON.stringify({
    user: { id: SUBJECT, email: MAIL, role: "authenticated" },
    access_token: PROVIDER_ACCESS,
    refresh_token: PROVIDER_REFRESH,
  }), { status: 200 });
}

function createMountedAdminLoginHarness(overrides: Partial<Env> = {}) {
  let reply: Reply = providerSuccess;
  const calls: Array<{ url: string; method: string; body: unknown }> = [];
  const worldCalls: string[] = [];
  const forbidWorld = (name: string): never => {
    worldCalls.push(name);
    throw new Error("unexpected fixture WORLD_DO access");
  };
  const env = {
    TOKEN_SIGNING_SECRET: SIGNING,
    NOEMA_ENV: "production", // Tests deployed admission semantics, not a real host.
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "fixture-world-not-production",
    ADMIN_ALLOWLIST_EMAILS: MAIL,
    SUPABASE_URL: PROVIDER,
    SUPABASE_SERVICE_ROLE_KEY: SERVICE,
    WORLD_DO: {
      idFromName: () => forbidWorld("idFromName"),
      get: () => forbidWorld("get"),
    },
    ...overrides,
  } as unknown as Env;
  vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push({
      url,
      method: init?.method || "GET",
      body: JSON.parse(String(init?.body || "null")) as unknown,
    });
    if (url !== VERIFY) throw new Error("unexpected fixture network destination");
    return reply(); // Never delegates to the host's real fetch.
  }));
  return {
    env, calls, worldCalls,
    setReply(next: Reply) { reply = next; },
    async consume(body: Record<string, unknown>): Promise<Output> {
      const response = await worker.fetch(new Request(
        "https://admin-fixture.invalid/v1/admin/login/consume", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      ), env);
      const raw = await response.text();
      return { response, raw, body: JSON.parse(raw) as Record<string, unknown> };
    },
  };
}

function safeRefusal(out: Output, status: number, code: string) {
  expect(out.response.status).toBe(status);
  expect(Object.keys(out.body)).toEqual(["error"]);
  const error = out.body.error as Record<string, unknown>;
  expect(Object.keys(error).sort()).toEqual(["code", "message", "retryable"]);
  expect(error.code).toBe(code);
  expect(out.response.headers.get("cache-control")).toBe("no-store");
  for (const value of [HASH, PRIVATE_UPSTREAM, PROVIDER_ACCESS, PROVIDER_REFRESH, SUBJECT, MAIL, SERVICE, SIGNING]) {
    expect(out.raw.includes(value)).toBe(false);
  }
}

async function legacySuccess(h: ReturnType<typeof createMountedAdminLoginHarness>, out: Output) {
  expect(out.response.status).toBe(200);
  expect(Object.keys(out.body).sort()).toEqual(EXPECTED_SUCCESS_KEYS);
  expect(out.body.role).toBe("ADMIN");
  expect(out.body.token_type).toBe("bearer");
  expect(out.body.expires_in).toBe(3600); // Existing legacy contract, NOT a derivative lifetime choice.
  expect(typeof out.body.access_token).toBe("string");
  expect(String(out.body.session_id).startsWith("asess.")).toBe(true);
  expect(out.response.headers.get("cache-control")).toBe("no-store");
  const token = String(out.body.access_token);
  const claims = await verifyHs256(token, SIGNING);
  expect(claims.typ).toBe("admin-access");
  expect(claims.amr).toBe("email_magic_link"); // Legacy label, not provider flow attestation.
  expect(claims.operator_id).toBe(EXPECTED_OPERATOR);
  expect(claims.session_id).toBe(out.body.session_id);
  const principal = await resolveAdmin(new Request("https://admin-fixture.invalid/admin", {
    headers: { Authorization: `Bearer ${token}` },
  }), h.env);
  expect(principal).not.toBeInstanceOf(Response);
  if (principal instanceof Response) throw new Error("fixture Admin resolution refused");
  expect(principal.role).toBe("ADMIN");
  expect(principal.operator_id).toBe(EXPECTED_OPERATOR);
  expect(h.worldCalls).toEqual([]);
  for (const value of [MAIL, SUBJECT, HASH, PRIVATE_UPSTREAM, PROVIDER_ACCESS, PROVIDER_REFRESH, SERVICE, SIGNING]) {
    expect(out.raw.includes(value)).toBe(false);
    expect(JSON.stringify(claims).includes(value)).toBe(false);
  }
  return claims;
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });


it("AM01 mounted hash login returns only a valid legacy Admin credential", async () => {
  const h = createMountedAdminLoginHarness();
  const out = await h.consume({ token_hash: HASH, type: "email" });
  await legacySuccess(h, out);
  expect(h.calls).toEqual([{
    url: VERIFY, method: "POST", body: { type: "email", token_hash: HASH },
  }]);
});

it("AM02 missing proof refuses before provider traffic", async () => {
  const h = createMountedAdminLoginHarness();
  const out = await h.consume({ token_hash: "   ", code: "   " });
  safeRefusal(out, 400, "INVALID_REQUEST");
  expect(h.calls).toHaveLength(0);
  expect(h.worldCalls).toEqual([]);
  await legacySuccess(h, await h.consume({ token_hash: HASH }));
  expect(h.calls).toHaveLength(1); // Connected same-recorder positive control.
});

it("AM03 unconfigured provider refuses before traffic and recovers when configured", async () => {
  const h = createMountedAdminLoginHarness({ SUPABASE_SERVICE_ROLE_KEY: "" });
  safeRefusal(await h.consume({ token_hash: HASH }), 503, "NOT_CONFIGURED");
  expect(h.calls).toHaveLength(0);
  expect(h.worldCalls).toEqual([]);
  h.env.SUPABASE_SERVICE_ROLE_KEY = SERVICE; // Synthetic fixture intervention only.
  await legacySuccess(h, await h.consume({ token_hash: HASH }));
  expect(h.calls).toHaveLength(1);
});

it("AM04 provider role text cannot bypass the Admin mailbox gate", async () => {
  const h = createMountedAdminLoginHarness();
  h.setReply(() => new Response(JSON.stringify({
    user: { id: SUBJECT, email: "not-allowed@example.com", role: "ADMIN" },
    access_token: PROVIDER_ACCESS,
  }), { status: 200 }));
  const denied = await h.consume({ token_hash: HASH });
  safeRefusal(denied, 401, "NOT_AUTHORIZED");
  expect(denied.raw.includes("not-allowed@example.com")).toBe(false);
  expect(h.calls).toHaveLength(1);
  expect(h.worldCalls).toEqual([]);
  h.setReply(providerSuccess);
  await legacySuccess(h, await h.consume({ token_hash: HASH }));
  expect(h.calls).toHaveLength(2);
});

it("AM05 provider client errors become uniform private 401 refusals", async () => {
  const h = createMountedAdminLoginHarness();
  for (const status of [400, 404, 429]) {
    h.setReply(() => new Response(PRIVATE_UPSTREAM, { status }));
    safeRefusal(await h.consume({ token_hash: HASH }), 401, "NOT_AUTHORIZED");
  }
  expect(h.calls).toHaveLength(3);
  expect(h.worldCalls).toEqual([]);
  h.setReply(providerSuccess);
  await legacySuccess(h, await h.consume({ token_hash: HASH }));
  expect(h.calls).toHaveLength(4);
});

it("AM06 provider server errors become private upstream refusals", async () => {
  const h = createMountedAdminLoginHarness();
  for (const status of [500, 503]) {
    h.setReply(() => new Response(PRIVATE_UPSTREAM, { status }));
    safeRefusal(await h.consume({ token_hash: HASH }), 502, "UPSTREAM");
  }
  expect(h.calls).toHaveLength(2);
  expect(h.worldCalls).toEqual([]);
  h.setReply(providerSuccess);
  await legacySuccess(h, await h.consume({ token_hash: HASH }));
  expect(h.calls).toHaveLength(3);
});

it("AM07 provider transport exceptions are private and do not poison the next login", async () => {
  const h = createMountedAdminLoginHarness();
  h.setReply(() => { throw new Error(PRIVATE_UPSTREAM); });
  safeRefusal(await h.consume({ token_hash: HASH }), 502, "UPSTREAM");
  expect(h.calls).toHaveLength(1);
  expect(h.worldCalls).toEqual([]);
  h.setReply(providerSuccess);
  await legacySuccess(h, await h.consume({ token_hash: HASH }));
  expect(h.calls).toHaveLength(2);
});

it("AM08 partial confirmation HTTP200 without mailbox is not Admin success", async () => {
  const h = createMountedAdminLoginHarness();
  h.setReply(() => new Response(JSON.stringify({ msg: PRIVATE_UPSTREAM }), { status: 200 }));
  safeRefusal(await h.consume({ token_hash: HASH }), 401, "NOT_AUTHORIZED");
  expect(h.calls).toHaveLength(1);
  expect(h.worldCalls).toEqual([]);
  h.setReply(providerSuccess);
  await legacySuccess(h, await h.consume({ token_hash: HASH }));
  expect(h.calls).toHaveLength(2);
});

it("AM09 a valid legacy Admin bearer cannot become a Human through mounted me", async () => {
  const h = createMountedAdminLoginHarness();
  const login = await h.consume({ token_hash: HASH });
  await legacySuccess(h, login);
  const before = h.calls.length;
  const response = await worker.fetch(new Request("https://admin-fixture.invalid/v1/me", {
    headers: { Authorization: `Bearer ${String(login.body.access_token)}` },
  }), h.env);
  const raw = await response.text();
  safeRefusal({ response, raw, body: JSON.parse(raw) as Record<string, unknown> }, 401, "NOT_AUTHORIZED");
  expect(h.calls).toHaveLength(before);
  expect(h.worldCalls).toEqual([]);
});

it("AM10 caller identity and Account text do not rewrite legacy attribution", async () => {
  const h = createMountedAdminLoginHarness();
  const attacker = "fixture-caller-operator-not-authority";
  const out = await h.consume({
    token_hash: HASH,
    operator_id: attacker,
    identity_id: "fixture-caller-principal-not-authority",
    account_id: "fixture-caller-account-not-authority",
    role: "ADMIN",
  });
  const claims = await legacySuccess(h, out);
  expect(claims.operator_id).toBe(EXPECTED_OPERATOR);
  expect(claims.operator_id).not.toBe(attacker);
  expect(claims.account_id).toBeUndefined();
  expect(claims.identity_id).toBeUndefined();
  expect(h.calls).toEqual([{
    url: VERIFY, method: "POST", body: { type: "magiclink", token_hash: HASH },
  }]);
});

// Fixed synthetic clock and signing material; never a production rotation.
const REVALIDATION_NOW_MS = 1_800_000_000_000;
const REVALIDATION_NOW_S = 1_800_000_000;
const REVALIDATION_OTHER_SIGNING = "fixture-only-unrelated-revalidation-key";

async function createAdminRevalidationFixture() {
  vi.spyOn(Date, "now").mockReturnValue(REVALIDATION_NOW_MS);
  const mounted = createMountedAdminLoginHarness();
  const login = await mounted.consume({ token_hash: HASH });
  const claims = await legacySuccess(mounted, login);
  return { mounted, token: String(login.body.access_token), claims };
}
type AdminRevalidationFixture = Awaited<ReturnType<typeof createAdminRevalidationFixture>>;

function readRevalidationAdmin(f: AdminRevalidationFixture, token: string) {
  return resolveAdmin(new Request("https://admin-fixture.invalid/admin", {
    headers: { Authorization: ["Bearer", token].join(" ") },
  }), f.mounted.env);
}

async function expectRevalidationRefusal(
  f: AdminRevalidationFixture, token: string, status: number, message: string,
) {
  const result = await readRevalidationAdmin(f, token);
  expect(result, "legacy Admin refusal must be a Response").toBeInstanceOf(Response);
  if (!(result instanceof Response)) throw new Error("fixture expected refusal");
  const raw = await result.text();
  const body = JSON.parse(raw) as Record<string, unknown>;
  safeRefusal({ response: result, raw, body }, status, "NOT_AUTHORIZED");
  expect((body.error as Record<string, unknown>).message).toBe(message);
  expect(f.mounted.calls).toHaveLength(1);
  expect(f.mounted.worldCalls).toEqual([]);
}

async function expectRevalidationSuccess(f: AdminRevalidationFixture) {
  const principal = await readRevalidationAdmin(f, f.token);
  expect(principal).not.toBeInstanceOf(Response);
  if (principal instanceof Response) throw new Error("fixture healthy Admin refused");
  expect(principal).toEqual({
    role: "ADMIN", session_id: f.claims.session_id,
    scopes: ["noema.world.admin", "noema.simulation.admin"],
    authentication_context: "email_magic_link", operator_id: EXPECTED_OPERATOR,
  });
  expect(f.mounted.calls).toHaveLength(1);
  expect(f.mounted.worldCalls).toEqual([]);
}

it("AV01 malformed compact credentials refuse without poisoning a valid session", async () => {
  const f = await createAdminRevalidationFixture();
  const rejectedToken = "fixture-not-a-compact-token";
  await expectRevalidationRefusal(f, rejectedToken, 401, "malformed token");
  await expectRevalidationSuccess(f);
});

it("AV02 payload editing without a new signature cannot rewrite the operator", async () => {
  const f = await createAdminRevalidationFixture();
  const parts = f.token.split(".");
  parts[1] = Buffer.from(JSON.stringify({
    ...f.claims, operator_id: "op.fixture-tampered",
  })).toString("base64url");
  const rejectedToken = parts.join(".");
  await expectRevalidationRefusal(f, rejectedToken, 401, "bad signature");
  await expectRevalidationSuccess(f);
});

it("AV03 credentials signed by unrelated fixture material refuse", async () => {
  const f = await createAdminRevalidationFixture();
  const rejectedToken = await mintHs256(f.claims, REVALIDATION_OTHER_SIGNING);
  await expectRevalidationRefusal(f, rejectedToken, 401, "bad signature");
  await expectRevalidationSuccess(f);
});

it("AV04 an unsupported algorithm header refuses before Admin admission", async () => {
  const f = await createAdminRevalidationFixture();
  const parts = f.token.split(".");
  parts[0] = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
  const rejectedToken = parts.join(".");
  await expectRevalidationRefusal(f, rejectedToken, 401, "unsupported alg none");
  await expectRevalidationSuccess(f);
});

it("AV05 a signed non-Admin credential type cannot borrow an Admin role", async () => {
  const f = await createAdminRevalidationFixture();
  const rejectedToken = await mintHs256({ ...f.claims, typ: "platform" }, SIGNING);
  await expectRevalidationRefusal(f, rejectedToken, 403,
    "not an ADMIN session — use operator login");
  await expectRevalidationSuccess(f);
});

it("AV06 the Admin credential type cannot compensate for a non-Admin role", async () => {
  const f = await createAdminRevalidationFixture();
  const rejectedToken = await mintHs256({ ...f.claims, role: "HUMAN" }, SIGNING);
  await expectRevalidationRefusal(f, rejectedToken, 403,
    "not an ADMIN session — use operator login");
  await expectRevalidationSuccess(f);
});
