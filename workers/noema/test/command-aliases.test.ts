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
    return applyWorldCommand(w, agent, envl, async () => true, { admission: "developer" });
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

  it("#782 T4.1 hosted agent admission isolates alias/macro syntax and never mutates command_aliases", async () => {
    const w = world();
    const enterRes = await applyWorldCommand(
      w,
      agent,
      { request_id: "h-enter", idempotency_key: "h-enter", command: "ENTER", arguments: {} },
      async () => true,
    );
    expect(enterRes.ok).toBe(true);
    // Pre-seed a colliding alias on player state to prove hosted structured dispatch ignores it.
    w.players[agent.player_id].command_aliases = { eastwalk: "move east", ii: "wait" };

    // Hosted default admission (no { admission: "developer" }): alias set is ignored and does not mutate state.
    const aliasAttempt = await applyWorldCommand(
      w,
      agent,
      { request_id: "h-alias", idempotency_key: "h-alias", command: "LOOK", arguments: { line: "alias set zz wait" } },
      async () => true,
    );
    expect(aliasAttempt.ok).toBe(true);
    expect(w.players[agent.player_id].command_aliases?.zz).toBeUndefined();

    // Colliding alias or do-macro passed via line under default admission executes only structured LOOK, not eastwalk/wait.
    const macroAttempt = await applyWorldCommand(
      w,
      agent,
      { request_id: "h-macro", idempotency_key: "h-macro", command: "LOOK", arguments: { line: "do eastwalk; wait" } },
      async () => true,
    );
    expect(macroAttempt.ok).toBe(true);
    expect(w.players[agent.player_id].room_id).toBe("room.hub");
  });

  it("#782 T4.2 AC18 deterministic expansion, cycle rejection, cap, reserved synonyms, and prototype safety", () => {
    // Reserved verbs and synonyms are refused case-insensitively.
    for (const reserved of ["LOOK", "l", "examine", "x", "move", "go", "walk", "say", "msg", "tell", "alias", "do", "help", "wait"]) {
      expect(isReservedAliasName(reserved), reserved).toBe(true);
      expect(parseAliasCommand(`alias set ${reserved} wait`)?.ok, reserved).toBe(false);
    }
    // Prototype-pollution keys are refused and never expanded from Object.prototype.
    expect(parseAliasCommand("alias set constructor wait")?.ok).toBe(false);
    expect(parseAliasCommand("alias set toString wait")?.ok).toBe(false);
    expect(parseAliasCommand("alias set __proto__ wait")?.ok).toBe(false);
    expect(expandAliases("constructor", {})).toEqual({ line: "constructor" });
    expect(expandAliases("toString", {})).toEqual({ line: "toString" });

    // Direct, 2-node, and 3-node cycles terminate cleanly with an error.
    expect(expandAliases("a", { a: "a" }).error).toMatch(/deep/i);
    expect(expandAliases("a", { a: "b", b: "a" }).error).toMatch(/deep/i);
    expect(expandAliases("a", { a: "b", b: "c", c: "a" }).error).toMatch(/deep/i);

    // Deterministic expansion across repeated invocations.
    const map = { e1: "move east", e2: "e1" };
    expect(expandAliases("e2", map)).toEqual({ line: "move east" });
    expect(expandAliases("e2", map)).toEqual({ line: "move east" });

    // Pollution cap: at most MAX_ALIASES (16) aliases; 17th is refused without overwriting existing entries.
    let aliases: Record<string, string> = {};
    for (let i = 0; i < 16; i++) {
      const cmd = parseAliasCommand(`alias set a${i} look`);
      expect(cmd?.ok).toBe(true);
      aliases = applyAliasCommand(aliases, cmd!).aliases;
    }
    expect(Object.keys(aliases)).toHaveLength(16);
    const over = applyAliasCommand(aliases, parseAliasCommand("alias set overflow look")!);
    expect(over.text).toMatch(/At most 16/i);
    expect(over.aliases.overflow).toBeUndefined();
    expect(Object.keys(over.aliases)).toHaveLength(16);
  });

  it("#782 T4.3/T4.4 per-step fresh observation re-resolution and stop-on-failure (world block & settle refusal)", async () => {
    const w = world();
    expect((await run(w, "enter", "s-enter")).ok).toBe(true);

    // Step 1 moves east -> room.east; Step 2 looks and must observe Coldline (fresh observation).
    const moved = await run(w, "do move east; look", "s-move-look");
    expect(moved.ok).toBe(true);
    expect(w.players[agent.player_id].room_id).toBe("room.east");
    expect(moved.observation?.room?.name).toBe("Coldline");

    // Step 2 fails on blocked exit ("south" does not exist in room.east); Step 3 ("move west") must NOT run.
    const blocked = await run(w, "do look; move south; move west", "s-block");
    expect(blocked.ok).toBe(false);
    expect(w.players[agent.player_id].room_id).toBe("room.east");

    // Settlement failure on step 2 halts before step 3.
    let settleCalls = 0;
    const settleFail = await applyWorldCommand(
      w,
      agent,
      { request_id: "s-settle", idempotency_key: "s-settle", command: "LOOK", arguments: { line: "do look; move west; move east" } },
      async () => {
        settleCalls += 1;
        return settleCalls !== 2;
      },
      { admission: "developer" },
    );
    expect(settleFail.ok).toBe(false);
    expect(settleCalls).toBe(2);
    expect(w.players[agent.player_id].room_id).toBe("room.east");
  });

  it("#782 T4.5/TX.4 macro event and settlement equivalence against direct commands", async () => {
    const wMacro = world();
    const wDirect = world();
    expect((await run(wMacro, "enter", "eq-e")).ok).toBe(true);
    expect((await run(wDirect, "enter", "eq-e")).ok).toBe(true);

    let macroSettles = 0;
    const macroRes = await applyWorldCommand(
      wMacro,
      agent,
      { request_id: "eq-m", idempotency_key: "eq-m", command: "LOOK", arguments: { line: "do move east; wait" } },
      async () => {
        macroSettles += 1;
        return true;
      },
      { admission: "developer" },
    );

    let directSettles = 0;
    const d1 = await applyWorldCommand(
      wDirect,
      agent,
      { request_id: "eq-d1", idempotency_key: "eq-d1", command: "MOVE", arguments: { direction: "east" } },
      async () => {
        directSettles += 1;
        return true;
      },
      { admission: "developer" },
    );
    const d2 = await applyWorldCommand(
      wDirect,
      agent,
      { request_id: "eq-d2", idempotency_key: "eq-d2", command: "WAIT", arguments: {} },
      async () => {
        directSettles += 1;
        return true;
      },
      { admission: "developer" },
    );

    expect(macroRes.ok).toBe(true);
    expect(d1.ok && d2.ok).toBe(true);
    expect(macroSettles).toBe(directSettles);
    expect(wMacro.players[agent.player_id].room_id).toBe(wDirect.players[agent.player_id].room_id);
    expect(wMacro.sequence).toBe(wDirect.sequence);
    expect(wMacro.cycle).toBe(wDirect.cycle);
    expect((macroRes.events || []).map((e) => e.event_type)).toEqual((d2.events || []).map((e) => e.event_type));
  });
});
