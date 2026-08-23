import { describe, expect, it } from "vitest";
import worker from "../src/index";
import type { Env } from "../src/types";
import {
  actorKindFromPrincipal,
  applyControllingSession,
  applyWorldLifecycle,
  isUsableLiveWorld,
  planIncidentRecover,
  commandForOps,
  countEnteredPlayers,
  countLivePlayers,
  expireStalePresence,
  inferActorKind,
  isMutatingCommand,
  listSystemActors,
  mutationBlocked,
  nextSettlementHealth,
  playReady,
} from "../src/ops";

describe("command mutation class", () => {
  it("treats LOOK/INSPECT/HELP as non-mutating", () => {
    expect(isMutatingCommand("LOOK")).toBe(false);
    expect(isMutatingCommand("inspect relay")).toBe(false);
    expect(isMutatingCommand("HELP")).toBe(false);
  });

  it("treats MOVE/MESSAGE/TRADE/COMMIT as mutating", () => {
    expect(isMutatingCommand("MOVE")).toBe(true);
    expect(isMutatingCommand("message nacre hi")).toBe(true);
    expect(isMutatingCommand("TRADE")).toBe(true);
    expect(isMutatingCommand("COMMIT")).toBe(true);
  });

  it("maps PLAY LOOK+line to the real verb for gates", () => {
    expect(isMutatingCommand(commandForOps("LOOK", { line: "leave" }))).toBe(true);
    expect(isMutatingCommand(commandForOps("LOOK", { line: "message nacre \"hi\"" }))).toBe(true);
    expect(isMutatingCommand(commandForOps("LOOK", { line: "enter" }))).toBe(true);
    expect(isMutatingCommand(commandForOps("LOOK", { line: "look" }))).toBe(false);
    expect(isMutatingCommand(commandForOps("LOOK", { line: "talk broker" }))).toBe(false);
  });

  it("treats ENTER_WORLD as mutating so it settles on the ledger", () => {
    expect(isMutatingCommand("ENTER_WORLD")).toBe(true);
    expect(isMutatingCommand("JOIN")).toBe(true);
  });

  it("treats WAIT as mutating so incident and settlement gates apply", () => {
    expect(isMutatingCommand("WAIT")).toBe(true);
    expect(isMutatingCommand("wait")).toBe(true);
    expect(isMutatingCommand(commandForOps("LOOK", { line: "wait" }))).toBe(true);
  });

  it("counts only entered Players as present", () => {
    expect(
      countEnteredPlayers({
        a: { entered: true },
        b: { entered: false },
        c: { entered: true },
      }),
    ).toBe(2);
  });

  it("treats missing last_seen as stale and counts only live humans", () => {
    const now = 1_700_000_000_000;
    const players = {
      "player.abc123abc123": { entered: true, last_seen_ms: now - 60_000, actor_kind: "live" as const },
      "player.deadbeef0001": { entered: true },
      "player.smoke-human": { entered: true, last_seen_ms: now - 1000, actor_kind: "system" as const },
    };
    expect(countLivePlayers(players, now)).toBe(1);
    expireStalePresence(players, now);
    expect(players["player.deadbeef0001"].entered).toBe(true);
    expect(players["player.smoke-human"].entered).toBe(true);
    expect(inferActorKind("player.deadbeef0001")).toBe("live");
    expect(inferActorKind("player.alice")).toBe("system");
    expect(listSystemActors(players).map((r) => r.player_id)).toEqual(["player.smoke-human"]);
    expect(
      actorKindFromPrincipal({
        player_id: "player.x",
        issued_by: "admin",
        controller_type: "human",
      }),
    ).toBe("system");
  });
});

describe("PAUSED / INCIDENT / settlement bound", () => {
  it("rejects mutation while PAUSED", () => {
    const g = mutationBlocked("PAUSED", "HEALTHY");
    expect(g?.code).toBe("WORLD_PAUSED");
  });

  it("rejects mutation while INCIDENT", () => {
    expect(mutationBlocked("INCIDENT", "HEALTHY")?.code).toBe("WORLD_INCIDENT");
  });

  it("allows mutation while ACTIVE and HEALTHY", () => {
    expect(mutationBlocked("ACTIVE", "HEALTHY")).toBeNull();
  });

  it("allows one additional mutating batch after first settle fail", () => {
    expect(nextSettlementHealth("HEALTHY", false)).toBe("DEGRADED");
    expect(mutationBlocked("ACTIVE", "DEGRADED")).toBeNull();
    expect(nextSettlementHealth("DEGRADED", false)).toBe("BLOCKING");
    expect(mutationBlocked("ACTIVE", "BLOCKING")?.code).toBe("SETTLEMENT_BLOCKED");
  });

  it("returns HEALTHY after a successful settle", () => {
    expect(nextSettlementHealth("DEGRADED", true)).toBe("HEALTHY");
    expect(nextSettlementHealth("BLOCKING", true)).toBe("HEALTHY");
  });
});

describe("applyWorldLifecycle", () => {
  it("closes INCIDENT to ACTIVE when settlement is not BLOCKING", () => {
    const degraded = applyWorldLifecycle("INCIDENT", "close", "DEGRADED");
    expect(degraded).toEqual({ ok: true, status: "ACTIVE" });
    const healthy = applyWorldLifecycle("INCIDENT", "close", "HEALTHY");
    expect(healthy).toEqual({ ok: true, status: "ACTIVE" });
  });

  it("refuses to close INCIDENT while settlement is BLOCKING", () => {
    const r = applyWorldLifecycle("INCIDENT", "close", "BLOCKING");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("RECOVERY_REQUIRED");
      expect(r.http).toBe(409);
    }
  });

  it("does not close INCIDENT from ACTIVE or PAUSED", () => {
    expect(applyWorldLifecycle("ACTIVE", "close", "HEALTHY").ok).toBe(false);
    expect(applyWorldLifecycle("PAUSED", "close", "HEALTHY").ok).toBe(false);
  });

  it("keeps pause / resume / declare-incident rules", () => {
    expect(applyWorldLifecycle("ACTIVE", "pause", "HEALTHY")).toEqual({ ok: true, status: "PAUSED" });
    expect(applyWorldLifecycle("PAUSED", "resume", "HEALTHY")).toEqual({ ok: true, status: "ACTIVE" });
    expect(applyWorldLifecycle("PAUSED", "resume", "BLOCKING").ok).toBe(false);
    expect(applyWorldLifecycle("ACTIVE", "incident", "HEALTHY")).toEqual({ ok: true, status: "INCIDENT" });
  });
});

describe("planIncidentRecover", () => {
  it("restores ACTIVE and HEALTHY from INCIDENT when a durable head exists", () => {
    const r = planIncidentRecover("INCIDENT", "BLOCKING", 4);
    expect(r).toEqual({ ok: true, restore: true, adopt: false, status: "ACTIVE", settlement: "HEALTHY" });
  });

  it("adopts a usable live DO when the canonical head is missing", () => {
    const r = planIncidentRecover("INCIDENT", "BLOCKING", null, true);
    expect(r).toEqual({ ok: true, restore: false, adopt: true, status: "ACTIVE", settlement: "HEALTHY" });
  });

  it("refuses recover without a durable head or usable live world", () => {
    const r = planIncidentRecover("INCIDENT", "BLOCKING", null);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.code).toBe("RECOVERY_REQUIRED");
      expect(r.http).toBe(409);
    }
  });

  it("does not recover from ACTIVE", () => {
    expect(planIncidentRecover("ACTIVE", "HEALTHY", 3).ok).toBe(false);
  });
});

describe("isUsableLiveWorld", () => {
  it("requires a stored world with rooms and a sequence", () => {
    expect(isUsableLiveWorld(null)).toBe(false);
    expect(isUsableLiveWorld({ world_id: "world.perihelion-reach", sequence: 92, rooms: {} })).toBe(false);
    expect(isUsableLiveWorld({
      world_id: "world.perihelion-reach",
      sequence: 92,
      rooms: { "room.relay-quarter": { room_id: "room.relay-quarter" } },
    })).toBe(true);
    expect(isUsableLiveWorld({
      world_id: "test.hosted-canonical.seed",
      sequence: -1,
      rooms: { "room.anchor": { room_id: "room.anchor" } },
    })).toBe(true);
    expect(isUsableLiveWorld({
      world_id: "test.hosted-canonical.seed",
      sequence: -2,
      rooms: { "room.anchor": { room_id: "room.anchor" } },
    })).toBe(false);
  });
});

describe("playReady", () => {
  it("is ready when ACTIVE and HEALTHY", () => {
    const r = playReady("ACTIVE", "HEALTHY");
    expect(r.ready).toBe(true);
    expect(r.play_blocked).toBe(false);
    expect(r.code).toBeNull();
  });

  it("stays ready inside the one-batch settlement bound", () => {
    const r = playReady("ACTIVE", "DEGRADED");
    expect(r.ready).toBe(true);
    expect(r.play_blocked).toBe(false);
    expect(r.code).toBeNull();
  });

  it("blocks PAUSED", () => {
    const r = playReady("PAUSED", "HEALTHY");
    expect(r.ready).toBe(false);
    expect(r.play_blocked).toBe(true);
    expect(r.code).toBe("WORLD_PAUSED");
  });

  it("blocks INCIDENT", () => {
    const r = playReady("INCIDENT", "HEALTHY");
    expect(r.ready).toBe(false);
    expect(r.play_blocked).toBe(true);
    expect(r.code).toBe("WORLD_INCIDENT");
  });

  it("fail-closes /ready when the settlement bound is exceeded", () => {
    const r = playReady("ACTIVE", "BLOCKING");
    expect(r.ready).toBe(false);
    expect(r.play_blocked).toBe(true);
    expect(r.code).toBe("SETTLEMENT_BLOCKED");
  });

  it("treats NOT_ACTIVE as not ready", () => {
    const r = playReady("NOT_ACTIVE", "HEALTHY");
    expect(r.ready).toBe(false);
    expect(r.play_blocked).toBe(true);
    expect(r.code).toBe("WORLD_NOT_READY");
  });

  it("allows DEMO_SEED", () => {
    expect(playReady("DEMO_SEED", "HEALTHY").ready).toBe(true);
  });

  it("blocks ACTIVE when the live snapshot is not playable", () => {
    const r = playReady("ACTIVE", "HEALTHY", false);
    expect(r.ready).toBe(false);
    expect(r.play_blocked).toBe(true);
    expect(r.code).toBe("WORLD_NOT_READY");
  });
});

function readyEnv(
  health: { status?: number; body?: Record<string, unknown> } | "throw",
): Env {
  return {
    NOEMA_ENV: "production",
    DEFAULT_WORLD_ID: "world-01",
    WORLD_DO: {
      idFromName: () => "id",
      get: () => ({
        fetch: async () => {
          if (health === "throw") throw new Error("secret table xyz");
          return new Response(JSON.stringify(health.body || {}), {
            status: health.status ?? 200,
          });
        },
      }),
    },
  } as unknown as Env;
}

describe("GET /ready play_blocked mapping", () => {
  it("keeps PLAY open while settlement is still inside the one-batch bound", async () => {
    const res = await worker.fetch(
      new Request("https://noema.guru/ready"),
      readyEnv({ body: { ok: true, status: "ACTIVE", settlement_health: "DEGRADED", playable: true } }),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ready?: boolean; play_blocked?: boolean; code?: string | null };
    expect(body.ready).toBe(true);
    expect(body.play_blocked).toBe(false);
    expect(body.code).toBeNull();
  });

  it("sets play_blocked when settlement BLOCKING", async () => {
    const res = await worker.fetch(
      new Request("https://noema.guru/ready"),
      readyEnv({ body: { ok: true, status: "ACTIVE", settlement_health: "BLOCKING", playable: true } }),
    );
    const body = (await res.json()) as { ready?: boolean; play_blocked?: boolean; code?: string };
    expect(res.status).toBe(200);
    expect(body.ready).toBe(false);
    expect(body.play_blocked).toBe(true);
    expect(body.code).toBe("SETTLEMENT_BLOCKED");
  });

  it("sets play_blocked when the world is INCIDENT", async () => {
    const res = await worker.fetch(
      new Request("https://noema.guru/ready"),
      readyEnv({ body: { ok: true, status: "INCIDENT", settlement_health: "HEALTHY", playable: true } }),
    );
    const body = (await res.json()) as { play_blocked?: boolean; code?: string };
    expect(body.play_blocked).toBe(true);
    expect(body.code).toBe("WORLD_INCIDENT");
  });

  it("fail-closes with typed play_blocked when the DO is unavailable", async () => {
    const down = await worker.fetch(
      new Request("https://noema.guru/ready"),
      readyEnv({ status: 503, body: { ok: false } }),
    );
    const downBody = (await down.json()) as { ready?: boolean; play_blocked?: boolean; code?: string };
    expect(down.status).toBe(200);
    expect(downBody.ready).toBe(false);
    expect(downBody.play_blocked).toBe(true);
    expect(downBody.code).toBe("WORLD_NOT_READY");

    const thrown = await worker.fetch(new Request("https://noema.guru/ready"), readyEnv("throw"));
    const text = await thrown.text();
    expect(thrown.status).toBe(200);
    expect(text).not.toContain("secret table");
    const thrownBody = JSON.parse(text) as { ready?: boolean; play_blocked?: boolean; code?: string };
    expect(thrownBody.ready).toBe(false);
    expect(thrownBody.play_blocked).toBe(true);
    expect(thrownBody.code).toBe("WORLD_NOT_READY");
  });
});

describe("session takeover", () => {
  it("binds the first mutating session", () => {
    const r = applyControllingSession(undefined, "sess.1", true);
    expect(r.takeover).toBe(false);
    expect(r.session_id).toBe("sess.1");
  });

  it("takes over when a new session mutates", () => {
    const r = applyControllingSession("sess.1", "sess.2", true);
    expect(r.takeover).toBe(true);
    expect(r.previous_session_id).toBe("sess.1");
    expect(r.session_id).toBe("sess.2");
  });

  it("does not take over on read-only commands", () => {
    const r = applyControllingSession("sess.1", "sess.2", false);
    expect(r.takeover).toBe(false);
    expect(r.session_id).toBe("sess.1");
  });
});

describe("/health reports the running Worker version", () => {
  it("echoes the Cloudflare version_metadata binding", async () => {
    const env = {
      NOEMA_ENV: "production",
      NOEMA_PROTOCOL_VERSION: "1",
      DEFAULT_WORLD_ID: "world.perihelion-reach-3",
      CF_VERSION: { id: "abc123", tag: "v9", timestamp: "2026-08-23T01:00:00Z" },
    } as unknown as Parameters<typeof worker.fetch>[1];
    const res = await worker.fetch(new Request("https://noema.guru/health"), env);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.worker_version_id).toBe("abc123");
    expect(body.deployed_at).toBe("2026-08-23T01:00:00Z");
  });

  it("omits the fields rather than guessing when the binding is absent", async () => {
    const env = {
      NOEMA_ENV: "local",
      NOEMA_PROTOCOL_VERSION: "1",
      DEFAULT_WORLD_ID: "world-01",
    } as unknown as Parameters<typeof worker.fetch>[1];
    const res = await worker.fetch(new Request("https://noema.guru/health"), env);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.worker_version_id).toBeUndefined();
    expect(body.status).toBe("ok");
  });
});
