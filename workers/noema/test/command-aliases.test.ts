import { describe, expect, it } from "vitest";
import {
  applyAliasCommand,
  expandAliases,
  isReservedAliasName,
  macroStepsFromLine,
  parseAliasCommand,
} from "../src/command-aliases";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

describe("S4 alias helpers", () => {
  it("refuses reserved names and bounds expansion depth", () => {
    expect(isReservedAliasName("look")).toBe(true);
    expect(parseAliasCommand("alias set look wait")?.ok).toBe(false);
    const loop = expandAliases("a", { a: "b", b: "a" });
    expect(loop.error).toMatch(/deep/i);
  });

  it("splits do-macros and rejects nesting", () => {
    expect(macroStepsFromLine("do look; wait").steps).toEqual(["look", "wait"]);
    expect(macroStepsFromLine("do look; do wait").error).toMatch(/nest/i);
  });

  it("lists and sets aliases", () => {
    const set = parseAliasCommand("alias set ii inspect scarred-conduit");
    expect(set && set.ok && set.op === "set").toBe(true);
    const applied = applyAliasCommand({}, set!);
    expect(applied.aliases.ii).toBe("inspect scarred-conduit");
    expect(expandAliases("ii", applied.aliases).line).toBe("inspect scarred-conduit");
  });
});

describe("S4 inhabit path", () => {
  function world(): WorldRuntime {
    return {
      world_id: "world.test",
      world_name: "Test Reach",
      cycle: 0,
      sequence: 0,
      entry_room_id: "room.hub",
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Grid Anchor",
          description: "A frontier anchor.",
          exits: [{ direction: "east", to_room_id: "room.east" }],
          entities: [],
        },
        "room.east": {
          room_id: "room.east",
          name: "Coldline",
          description: "A thin route.",
          exits: [{ direction: "west", to_room_id: "room.hub" }],
          entities: [],
        },
      },
      players: {},
      trades: {},
      messages: [],
      organizations: {},
      seen_idempotency: {},
      unsettled: [],
    };
  }
  const agent: PlayerPrincipal = {
    player_id: "player.agent",
    agent_id: "agent.agent",
    session_id: "sess.test",
    controller_id: "ctrl.agent.agent",
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
  async function run(w: WorldRuntime, line: string, key: string) {
    const envl: CommandEnvelope = {
      request_id: key,
      idempotency_key: key,
      command: "LOOK",
      arguments: { line },
    };
    return applyWorldCommand(w, agent, envl, async () => true);
  }

  it("stores aliases off-ledger and expands them to ordinary LOOK", async () => {
    const w = world();
    expect((await run(w, "enter", "e")).ok).toBe(true);
    const set = await run(w, "alias set ii look", "a");
    expect(set.ok).toBe(true);
    expect(set.events || []).toHaveLength(0);
    expect(w.players[agent.player_id]?.command_aliases?.ii).toBe("look");
    const used = await run(w, "ii", "u");
    expect(used.ok).toBe(true);
    expect(used.events?.some((ev) => ev.event_type === "LOOK" || ev.event_type === "OBSERVATION_GENERATED")).toBe(
      true,
    );
  });

  it("runs do look; wait as two independent steps and stops on failure", async () => {
    const w = world();
    expect((await run(w, "enter", "e2")).ok).toBe(true);
    const seq = w.sequence;
    const ok = await run(w, "do look; wait", "m");
    expect(ok.ok).toBe(true);
    expect(w.sequence).toBeGreaterThan(seq);
    const bad = await run(w, "do look; frobnicate", "m2");
    expect(bad.ok).toBe(false);
  });
});
