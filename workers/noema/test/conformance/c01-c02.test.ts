import { describe, expect, it } from "vitest";
import { adminToken, hit, playerToken, type DoCall } from "./harness";

describe("C01 protocol negotiation", () => {
  it("compatible HELLO returns HELLO_ACK agent-protocol/v1", async () => {
    const res = await hit(
      "/protocol/v1",
      {
        body: {
          type: "HELLO",
          request_id: "req-hello-ok-001",
          body: { supported_protocols: ["agent-protocol/v1"] },
        },
      },
      [],
    );
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      type: string;
      body: { selected_protocol: string; transports?: string[]; websocket_uri?: string };
    };
    expect(j.type).toBe("HELLO_ACK");
    expect(j.body.selected_protocol).toBe("agent-protocol/v1");
    expect(j.body.transports).toEqual(["websocket", "http"]);
    expect(j.body.websocket_uri).toBe("/protocol/v1/ws");
  });

  it("incompatible HELLO does not AUTH and returns NO_COMPATIBLE_PROTOCOL", async () => {
    const res = await hit(
      "/protocol/v1",
      {
        body: {
          type: "HELLO",
          request_id: "req-hello-bad-001",
          body: { supported_protocols: ["agent-protocol/v0", "thought-stream/9.9"] },
        },
      },
      [],
    );
    expect(res.status).toBe(400);
    const j = (await res.json()) as { type: string; error: { code: string } };
    expect(j.type).toBe("ERROR");
    expect(j.error.code).toBe("NO_COMPATIBLE_PROTOCOL");
  });
});

describe("C02 identity authz denial", () => {
  it("missing bearer is denied on /v1/command", async () => {
    const res = await hit(
      "/v1/command",
      { body: { request_id: "r1", command: "LOOK", arguments: {} } },
      [],
    );
    expect(res.status).toBe(401);
  });

  it("Player token cannot call /v1/admin/overview", async () => {
    const res = await hit(
      "/v1/admin/overview",
      { method: "GET", headers: { Authorization: `Bearer ${await playerToken()}` } },
      [],
    );
    expect([401, 403]).toContain(res.status);
  });

  it("isolated command without admin header is denied", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      {
        headers: { Authorization: `Bearer ${await playerToken()}` },
        body: {
          world_id: "test.hosted-canonical.verify-1",
          request_id: "r1",
          command: "LOOK",
          arguments: {},
        },
      },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls).toEqual([]);
  });

  it("isolated perihelion world_id is 403 before DO lookup", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/operator/test-world/command",
      {
        headers: {
          Authorization: `Bearer ${await playerToken()}`,
          "X-Noema-Admin-Token": await adminToken(),
        },
        body: {
          world_id: "world.perihelion-reach",
          request_id: "r1",
          command: "LOOK",
          arguments: {},
        },
      },
      calls,
    );
    expect(res.status).toBe(403);
    expect(calls.some((c) => c.op === "idFromName")).toBe(false);
  });

  it("PLAY /v1/command isolated world_id without admin is denied before DO lookup", async () => {
    const calls: DoCall[] = [];
    const res = await hit(
      "/v1/command",
      {
        headers: { Authorization: `Bearer ${await playerToken()}` },
        body: {
          world_id: "test.hosted-canonical.sneak",
          request_id: "r1",
          command: "LOOK",
          arguments: {},
        },
      },
      calls,
    );
    expect(res.status).toBe(401);
    expect(calls.some((c) => c.op === "idFromName")).toBe(false);
  });
});
