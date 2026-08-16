import { describe, expect, it } from "vitest";
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
  });
});

describe("playReady", () => {
  it("is ready when ACTIVE and HEALTHY", () => {
    const r = playReady("ACTIVE", "HEALTHY");
    expect(r.ready).toBe(true);
    expect(r.play_blocked).toBe(false);
    expect(r.code).toBeNull();
  });

  it("blocks PAUSED", () => {
    const r = playReady("PAUSED", "HEALTHY");
    expect(r.ready).toBe(false);
    expect(r.code).toBe("WORLD_PAUSED");
  });

  it("blocks INCIDENT", () => {
    expect(playReady("INCIDENT", "HEALTHY").code).toBe("WORLD_INCIDENT");
  });

  it("blocks settlement BLOCKING", () => {
    expect(playReady("ACTIVE", "BLOCKING").code).toBe("SETTLEMENT_BLOCKED");
  });

  it("treats NOT_ACTIVE as not ready", () => {
    const r = playReady("NOT_ACTIVE", "HEALTHY");
    expect(r.ready).toBe(false);
    expect(r.code).toBe("WORLD_NOT_READY");
  });

  it("allows DEMO_SEED", () => {
    expect(playReady("DEMO_SEED", "HEALTHY").ready).toBe(true);
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
