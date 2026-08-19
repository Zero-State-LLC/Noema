import { describe, expect, it } from "vitest";
import { projectRoomTraces } from "../src/play-traces";
import { roomPresentationModel } from "../src/play-ui";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { enrichEntity } from "../src/actions";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

describe("S3 play traces", () => {
  it("projects public scars and drops them when the source is gone", () => {
    const room = {
      entities: [{ label: "scarred-conduit", scar: true }],
    };
    const traces = projectRoomTraces(room);
    expect(traces).toEqual([
      { kind: "scar", text: "A scar remains (scarred-conduit).", visibility: "public" },
    ]);
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
      projectRoomTraces({
        entities: [{ label: "scarred-conduit", scar: true }],
      }),
    );
    expect(text).not.toMatch(/entity\./);
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
    const enter: CommandEnvelope = {
      request_id: "e",
      idempotency_key: "e",
      command: "ENTER_WORLD",
      arguments: {},
    };
    expect((await applyWorldCommand(w, agent, enter, async () => true)).ok).toBe(true);
    const look = await applyWorldCommand(
      w,
      agent,
      { request_id: "l", idempotency_key: "l", command: "LOOK", arguments: {} },
      async () => true,
    );
    expect(look.ok).toBe(true);
    const traces = look.observation?.location?.traces || [];
    expect(traces.some((t) => t.kind === "scar" && t.text.includes("scarred-workshop"))).toBe(true);
    expect(JSON.stringify(traces)).not.toMatch(/entity\.scar/);
    const model = roomPresentationModel({ location: look.observation?.location as never });
    expect(model.traces.length).toBeGreaterThan(0);
  });
});
