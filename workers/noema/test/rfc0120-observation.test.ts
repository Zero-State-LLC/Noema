import { describe, expect, it } from "vitest";
import { HUMAN_WATCH_MESSAGE, mintControllerToken } from "../src/auth";
import { mintAdminSession } from "../src/admin-auth";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { buildWatchLive } from "../src/watch-live";
import { miniChamberState, MINI_ENTRY_ROOM_ID, MINI_HALL_ROOM_ID } from "../src/mini-chamber";
import { env, hit, OPERATOR, type DoCall } from "./conformance/harness";
import type { CommandEnvelope, ObservationAffordance, PlayerPrincipal } from "../src/types";

function agent(id = "player.hermes"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id.replace(/^player\./, "")}`,
    session_id: "sess.rfc0120",
    controller_id: `ctrl.agent.${id.replace(/^player\./, "")}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "controller_token",
  };
}

async function run(w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `r.${command}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${command}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function fromAffordance(aff: ObservationAffordance): { command: string; args: Record<string, unknown> } {
  const args: Record<string, unknown> = {};
  if (aff.target_id) args.target_id = aff.target_id;
  if (aff.operation) args.operation = aff.operation;
  return { command: aff.action, args };
}

describe("RFC-0120 P7 agent observation contract", () => {
  it("first LOOK answers WHERE / HERE / EXITS / STATUS / AVAILABLE ACTIONS without a line parser", async () => {
    const w = miniChamberState("test.hosted-canonical.rfc0120-obs");
    const p = agent();
    const entered = await run(w, p, "ENTER_WORLD");
    expect(entered.ok).toBe(true);
    const look = await run(w, p, "LOOK");
    expect(look.ok).toBe(true);
    const obs = look.observation;
    expect(obs?.location?.room_id).toBe(MINI_ENTRY_ROOM_ID);
    expect(obs?.location?.name).toBe("Anchor");
    expect(obs?.location?.description).toMatch(/landing/i);
    expect(obs?.location?.exits?.some((e) => e.direction === "east")).toBe(true);
    expect(obs?.location?.entities?.some((e) => e.entity_id === "entity.way-lamp")).toBe(true);
    expect(obs?.situation?.place).toBe("Anchor");
    expect(obs?.budgets).toEqual(expect.objectContaining({ attention: expect.any(Number), energy: expect.any(Number) }));
    expect(obs?.available_actions).toEqual(expect.arrayContaining(["INSPECT", "MOVE"]));
    expect(obs?.available_actions).not.toEqual(expect.arrayContaining(["WED", "ATTEST"]));
    expect(obs?.affordances?.some((a) => a.action === "INSPECT" && a.target_id === "entity.way-lamp")).toBe(true);
    expect(obs?.affordances?.some((a) => a.action === "MOVE" && a.target_id === "east")).toBe(true);
    expect(JSON.stringify(obs || {})).not.toMatch(/point of the game|you should |being tested/i);
  });
});

describe("RFC-0120 P8 structured action discovery", () => {
  it("MOVE and INSPECT from affordances do not need arguments.line", async () => {
    const w = miniChamberState("test.hosted-canonical.rfc0120-act");
    const p = agent();
    await run(w, p, "ENTER_WORLD");
    const look = await run(w, p, "LOOK");
    const inspectAff = look.observation?.affordances?.find(
      (a) => a.available && a.action === "INSPECT" && a.target_id === "entity.way-lamp",
    );
    expect(inspectAff).toBeTruthy();
    const inspected = await run(w, p, fromAffordance(inspectAff!).command, fromAffordance(inspectAff!).args);
    expect(inspected.ok).toBe(true);
    expect(inspected.observation?.consequence).toMatch(/way-lamp|lamp/i);

    const moveAff = inspected.observation?.affordances?.find(
      (a) => a.available && a.action === "MOVE" && a.target_id === "east",
    );
    expect(moveAff).toBeTruthy();
    const moved = await run(w, p, fromAffordance(moveAff!).command, fromAffordance(moveAff!).args);
    expect(moved.ok).toBe(true);
    expect(moved.observation?.location?.room_id).toBe(MINI_HALL_ROOM_ID);
    expect(moved.observation?.consequence).toMatch(/Hall/);
  });
});

describe("RFC-0120 P13 WATCH isolation", () => {
  it("WATCH live has no inhabitant inbox, affordances, or situation", () => {
    const snap = buildWatchLive({
      world_id: "test.hosted-canonical.rfc0120-watch",
      cycle: 1,
      sequence: 4,
      rooms: {
        [MINI_ENTRY_ROOM_ID]: {
          room_id: MINI_ENTRY_ROOM_ID,
          name: "Anchor",
          description: "A small public landing.",
          exits: [{ direction: "east", to_room_id: MINI_HALL_ROOM_ID }],
          entities: [{ entity_id: "entity.way-lamp", label: "way-lamp", entity_type: "PROP" }],
        },
      },
      players: [{ player_id: "player.hermes", handle: "hermes", room_id: MINI_ENTRY_ROOM_ID, entered: true }],
      events: [],
      now: 1_700_000_000_000,
    });
    const blob = JSON.stringify(snap);
    expect(snap).not.toHaveProperty("messages");
    expect(snap).not.toHaveProperty("affordances");
    expect(snap).not.toHaveProperty("available_actions");
    expect(snap).not.toHaveProperty("situation");
    expect(snap).not.toHaveProperty("practice_lines");
    expect(blob).not.toMatch(/"messages"/);
    expect(blob).not.toMatch(/noema\.action\.submit/);
  });
});

describe("RFC-0120 P11 admin is not a Player", () => {
  it("admin session cannot inhabit via /v1/command", async () => {
    const calls: DoCall[] = [];
    const e = env(calls);
    const admin = await mintAdminSession(e, OPERATOR);
    expect(admin).not.toBeInstanceOf(Response);
    const access = (admin as { access_token: string }).access_token;
    const res = await hit(
      "/v1/command",
      {
        body: { request_id: "admin-look", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${access}` },
      },
      calls,
    );
    expect([401, 403]).toContain(res.status);
    const body = (await res.json()) as { ok?: boolean; error?: { message?: string } };
    expect(body.ok).not.toBe(true);
    expect(body.error?.message).toMatch(/invalid or unsupported access token|Agents play this world/i);
  });

  it("agent token still inhabits HTTP command with the live seal", async () => {
    const calls: DoCall[] = [];
    const minted = await mintControllerToken(env(calls), { handle: "hermes", controllerType: "agent" });
    const res = await hit(
      "/v1/command",
      {
        body: { request_id: "agent-look", command: "LOOK", arguments: {} },
        headers: { Authorization: `Bearer ${minted.access_token}` },
      },
      calls,
    );
    expect(res.status).toBe(200);
  });
});
