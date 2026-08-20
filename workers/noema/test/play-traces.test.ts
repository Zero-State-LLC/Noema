import { describe, expect, it } from "vitest";
import { projectRoomTraces, publicTraces } from "../src/play-traces";
import { roomPresentationModel } from "../src/play-ui";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

function agent(id: string): PlayerPrincipal {
  return {
    player_id: `player.${id}`,
    agent_id: `agent.${id}`,
    session_id: `sess.${id}`,
    controller_id: `ctrl.agent.${id}`,
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function repairWorld(): WorldRuntime {
  return {
    world_id: "world.test",
    world_name: "Test Reach",
    cycle: 4,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Grid Anchor",
        description: "A frontier anchor. Damaged relay trunk.",
        exits: [],
        entities: [
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 35,
          }),
        ],
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
  key?: string,
) {
  const envl: CommandEnvelope = {
    request_id: key || `req.${command}.${p.player_id}.${Math.random().toString(16).slice(2)}`,
    idempotency_key: key || `idem.${command}.${p.player_id}.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

describe("S3 play traces", () => {
  it("projects public scars and drops them when the source is gone", () => {
    const room = {
      entities: [{ label: "scarred-conduit", scar: true }],
    };
    const traces = projectRoomTraces(room);
    expect(publicTraces(traces)).toEqual([
      { kind: "scar", text: "A scar remains (scarred-conduit).", visibility: "public" },
    ]);
    expect(traces[0].source_state_ref).toEqual({ kind: "entity", entity_id: "", field: "scar" });
    expect(projectRoomTraces({ entities: [] })).toEqual([]);
  });

  it("never leaks hidden rooms, hidden entities, or entity ids", () => {
    expect(
      projectRoomTraces({
        hidden: true,
        entities: [{ label: "scarred-conduit", scar: true }],
        board: [{ text: "secret", cycle: 1 }],
      }),
    ).toEqual([]);
    expect(
      projectRoomTraces({
        entities: [{ label: "scarred-conduit", scar: true, hidden: true }],
      }),
    ).toEqual([]);
    const text = JSON.stringify(
      publicTraces(
        projectRoomTraces({
          entities: [{ entity_id: "entity.scar.1", label: "scarred-conduit", scar: true }],
        }),
      ),
    );
    expect(text).not.toMatch(/entity\./);
    expect(text).not.toMatch(/source_state_ref/);
  });

  it("caps at 3 and prefers scars over notices", () => {
    const traces = projectRoomTraces({
      entities: [
        { label: "a-scar", scar: true },
        { label: "b-scar", scar: true },
        { label: "c-work", in_progress: true },
      ],
      shout: { text: "a shout", cycle: 2 },
    });
    expect(traces.length).toBe(3);
    expect(traces.map((t) => t.kind)).toEqual(["scar", "scar", "construction"]);
  });

  it("LOOK observation includes traces from current residue", async () => {
    const w: WorldRuntime = {
      world_id: "world.test",
      world_name: "Test Reach",
      cycle: 4,
      sequence: 0,
      entry_room_id: "room.hub",
      rooms: {
        "room.hub": {
          room_id: "room.hub",
          name: "Grid Anchor",
          description: "A frontier anchor.",
          exits: [],
          entities: [
            enrichEntity({
              entity_id: "entity.scar.1",
              label: "scarred-workshop",
              entity_type: "INFRASTRUCTURE",
              scar: true,
            }),
          ],
        },
      },
      players: {},
      trades: {},
      messages: [],
      organizations: {},
      seen_idempotency: {},
      unsettled: [],
    };
    const lookAgent = agent("agent");
    const enter: CommandEnvelope = {
      request_id: "e",
      idempotency_key: "e",
      command: "ENTER_WORLD",
      arguments: {},
    };
    expect((await applyWorldCommand(w, lookAgent, enter, async () => true)).ok).toBe(true);
    const look = await applyWorldCommand(
      w,
      lookAgent,
      { request_id: "l", idempotency_key: "l", command: "LOOK", arguments: {} },
      async () => true,
    );
    expect(look.ok).toBe(true);
    const traces = look.observation?.location?.traces || [];
    expect(traces.some((t) => t.kind === "scar" && t.text.includes("scarred-workshop"))).toBe(true);
    expect(JSON.stringify(traces)).not.toMatch(/entity\.scar/);
    expect(JSON.stringify(traces)).not.toMatch(/source_state_ref/);
    const model = roomPresentationModel({ location: look.observation?.location as never });
    expect(model.traces.length).toBeGreaterThan(0);
  });

  it("public traces omit source refs and entity ids (AC 16 public wire)", () => {
    const traces = projectRoomTraces({
      entities: [{ entity_id: "entity.scar.1", label: "scarred-conduit", scar: true }],
    });
    const pub = publicTraces(traces);
    expect(pub[0]).toEqual({
      kind: "scar",
      text: "A scar remains (scarred-conduit).",
      visibility: "public",
    });
    expect(JSON.stringify(pub)).not.toMatch(/entity\.|source_state_ref|player\./);
    expect(traces[0].source_state_ref).toEqual({
      kind: "entity",
      entity_id: "entity.scar.1",
      field: "scar",
    });
  });

  it("projects a repair plate from last_repair_* and drops it when cleared (AC 17)", () => {
    const traces = projectRoomTraces({
      entities: [
        {
          entity_id: "entity.relay-7",
          label: "scarred-conduit",
          last_repair_cycle: 4,
          last_repair_handle: "Sable",
        },
      ],
    });
    expect(
      traces.some(
        (t) =>
          t.kind === "construction" && t.text === "A maintenance plate names Sable as the last repairer.",
      ),
    ).toBe(true);
    expect(traces[0].source_state_ref).toEqual({
      kind: "entity",
      entity_id: "entity.relay-7",
      field: "last_repair",
    });
    expect(projectRoomTraces({ entities: [{ label: "scarred-conduit" }] })).toEqual([]);
  });

  it("does not plate a handle that looks like an id", () => {
    expect(
      projectRoomTraces({
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "relay",
            last_repair_cycle: 1,
            last_repair_handle: "player.sable",
          },
        ],
      }).filter((t) => t.kind === "construction" && t.text.includes("maintenance plate")),
    ).toEqual([]);
  });

  it("hidden room still projects nothing when plate fields are present", () => {
    expect(
      projectRoomTraces({
        hidden: true,
        entities: [
          {
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            scar: true,
            last_repair_handle: "Sable",
            last_repair_cycle: 1,
          },
        ],
      }),
    ).toEqual([]);
  });

  it("cap 3 prefers scar then plate then unfinished work", () => {
    const traces = projectRoomTraces({
      entities: [
        { entity_id: "e1", label: "a-scar", scar: true },
        { entity_id: "e2", label: "b-scar", scar: true },
        { entity_id: "e3", label: "c-work", last_repair_cycle: 1, last_repair_handle: "Sable" },
        { entity_id: "e4", label: "d-work", in_progress: true },
      ],
      shout: { text: "a shout", cycle: 2 },
    });
    expect(traces.map((t) => t.kind)).toEqual(["scar", "scar", "construction"]);
    expect(traces[2].text).toMatch(/maintenance plate/);
  });

  it("AC 15: second agent sees the plate after the originator leaves", async () => {
    const w = repairWorld();
    const sable = agent("sable");
    const rhea = agent("rhea");
    expect((await run(w, sable, "ENTER_WORLD")).ok).toBe(true);
    w.players[sable.player_id].handle = "Sable";
    w.players[sable.player_id].budgets.storage = 15;
    const repaired = await run(w, sable, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-7",
    });
    expect(repaired.ok).toBe(true);
    expect((await run(w, sable, "LEAVE_WORLD")).ok).toBe(true);
    expect(w.players[sable.player_id].entered).toBe(false);

    expect((await run(w, rhea, "ENTER_WORLD")).ok).toBe(true);
    const look = await run(w, rhea, "LOOK");
    expect(look.ok).toBe(true);
    const traces = look.observation?.location?.traces || [];
    expect(traces.some((t) => t.text === "A maintenance plate names Sable as the last repairer.")).toBe(
      true,
    );
    expect(JSON.stringify(traces)).not.toMatch(/player\.sable|entity\.relay-7|source_state_ref/);
    expect(look.observation?.players_here?.some((p) => p.player_id === sable.player_id)).toBeFalsy();
  });

  it("S-MARK-10: ≤10 acts, REPAIR residue legible to a later agent", async () => {
    const w = repairWorld();
    const sable = agent("sable");
    const rhea = agent("rhea");
    let acts = 0;
    expect((await run(w, sable, "ENTER_WORLD")).ok).toBe(true);
    acts += 1;
    w.players[sable.player_id].handle = "Sable";
    w.players[sable.player_id].budgets.storage = 15;
    const repaired = await run(w, sable, "COMMIT", {
      operation: "REPAIR",
      entity_id: "entity.relay-7",
    });
    expect(repaired.ok).toBe(true);
    acts += 1;
    expect(repaired.observation?.consequence).toMatch(/repaired/i);
    expect((await run(w, sable, "LEAVE_WORLD")).ok).toBe(true);
    acts += 1;
    expect((await run(w, rhea, "ENTER_WORLD")).ok).toBe(true);
    acts += 1;
    const look = await run(w, rhea, "LOOK");
    expect(look.ok).toBe(true);
    acts += 1;
    expect(acts).toBeLessThanOrEqual(10);
    expect(
      (look.observation?.location?.traces || []).some((t) =>
        t.text.includes("A maintenance plate names Sable"),
      ),
    ).toBe(true);
  });
});
