import { settleEvent } from "./settle";
import type { CommandEnvelope, CommandResult, Env, Observation, PlayerPrincipal } from "./types";

interface Room {
  room_id: string;
  name: string;
  description: string;
  exits: Array<{ direction: string; to_room_id: string }>;
  entities: Array<{ entity_id: string; label: string; entity_type: string }>;
}

interface PlayerLoc {
  room_id: string;
  entered: boolean;
}

interface WorldState {
  world_id: string;
  cycle: number;
  sequence: number;
  rooms: Record<string, Room>;
  players: Record<string, PlayerLoc>;
  seen_idempotency: Record<string, CommandResult>;
  unsettled: Array<{ event_id: string; payload: Record<string, unknown> }>;
}

const SEED_ROOMS: Record<string, Room> = {
  "room.relay-quarter": {
    room_id: "room.relay-quarter",
    name: "Relay Quarter",
    description:
      "A text-first Chamber entry. Power hums under the floor. Routes lead outward; nothing here is painted.",
    exits: [
      { direction: "east", to_room_id: "room.transit-ring" },
      { direction: "down", to_room_id: "room.infra-vault" },
    ],
    entities: [
      { entity_id: "entity.relay-7", label: "relay-7", entity_type: "INFRASTRUCTURE" },
    ],
  },
  "room.transit-ring": {
    room_id: "room.transit-ring",
    name: "Transit Ring",
    description: "A ring corridor of faded waymarks. East returns to the Relay Quarter.",
    exits: [{ direction: "west", to_room_id: "room.relay-quarter" }],
    entities: [],
  },
  "room.infra-vault": {
    room_id: "room.infra-vault",
    name: "Infrastructure Vault",
    description: "Cables and cold air. Up returns to the Relay Quarter.",
    exits: [{ direction: "up", to_room_id: "room.relay-quarter" }],
    entities: [],
  },
};

function defaultState(world_id: string): WorldState {
  return {
    world_id,
    cycle: 0,
    sequence: 0,
    rooms: structuredClone(SEED_ROOMS),
    players: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

export class NoemaWorldDO {
  private state: DurableObjectState;
  private env: Env;
  private world: WorldState | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.endsWith("/health")) {
      await this.load();
      return Response.json({
        ok: true,
        world_id: this.world!.world_id,
        cycle: this.world!.cycle,
        sequence: this.world!.sequence,
        players: Object.keys(this.world!.players).length,
      });
    }

    if (request.method !== "POST") {
      return Response.json({ error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } }, { status: 405 });
    }

    const body = (await request.json()) as {
      principal: PlayerPrincipal;
      envelope: CommandEnvelope;
    };
    if (!body?.principal?.player_id || !body?.envelope?.command) {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "principal and envelope required" } },
        { status: 400 },
      );
    }

    const result = await this.applyCommand(body.principal, body.envelope);
    return Response.json(result, { status: result.ok ? 200 : 400 });
  }

  private async load(): Promise<void> {
    if (this.world) return;
    const stored = await this.state.storage.get<WorldState>("world");
    this.world =
      stored ||
      defaultState(this.env.DEFAULT_WORLD_ID || "world-01");
  }

  private async save(): Promise<void> {
    if (this.world) await this.state.storage.put("world", this.world);
  }

  private observe(principal: PlayerPrincipal): Observation {
    const w = this.world!;
    const loc = w.players[principal.player_id];
    const room_id = loc?.room_id || "room.relay-quarter";
    const room = w.rooms[room_id] || SEED_ROOMS["room.relay-quarter"];
    return {
      cycle: w.cycle,
      sequence: w.sequence,
      location: {
        room_id: room.room_id,
        name: room.name,
        description: room.description,
        exits: room.exits,
        entities: room.entities,
      },
      player_id: principal.player_id,
      available_actions: ["LOOK", "MOVE", "INSPECT", "WAIT"],
    };
  }

  private async applyCommand(principal: PlayerPrincipal, envl: CommandEnvelope): Promise<CommandResult> {
    await this.load();
    const w = this.world!;
    const request_id = envl.request_id || crypto.randomUUID();
    const idem = envl.idempotency_key || request_id;

    if (w.seen_idempotency[idem]) {
      return w.seen_idempotency[idem];
    }

    // Authority from principal only
    if (envl.player_id && envl.player_id !== principal.player_id) {
      return {
        ok: false,
        request_id,
        error: { code: "FORBIDDEN", message: "player_id does not match principal" },
      };
    }

    const cmd = envl.command.toUpperCase();
    const args = envl.arguments || {};
    const events: Array<{ event_id: string; event_type: string; sequence: number }> = [];
    let settled = false;

    const pushEvent = (event_type: string, payload: Record<string, unknown>) => {
      w.sequence += 1;
      const event_id = `evt.${w.sequence.toString().padStart(6, "0")}`;
      events.push({ event_id, event_type, sequence: w.sequence });
      return { event_id, event_type, sequence: w.sequence, payload };
    };

    if (cmd === "ENTER_WORLD" || cmd === "JOIN") {
      w.players[principal.player_id] = { room_id: "room.relay-quarter", entered: true };
      const ev = pushEvent("AGENT_ENTERED_WORLD", {
        player_id: principal.player_id,
        room_id: "room.relay-quarter",
      });
      settled = await settleEvent(this.env, principal, {
        event_id: ev.event_id,
        event_type: ev.event_type,
        sequence: ev.sequence,
        cycle: w.cycle,
        world_id: w.world_id,
        player_id: principal.player_id,
        controller_id: principal.controller_id,
        session_id: principal.session_id,
        payload: ev.payload,
      });
    } else if (cmd === "LOOK") {
      if (!w.players[principal.player_id]?.entered) {
        w.players[principal.player_id] = { room_id: "room.relay-quarter", entered: true };
      }
      const room_id = w.players[principal.player_id].room_id;
      const ev = pushEvent("LOOK", { player_id: principal.player_id, room_id });
      settled = await settleEvent(this.env, principal, {
        event_id: ev.event_id,
        event_type: ev.event_type,
        sequence: ev.sequence,
        cycle: w.cycle,
        world_id: w.world_id,
        player_id: principal.player_id,
        controller_id: principal.controller_id,
        session_id: principal.session_id,
        payload: ev.payload,
      });
    } else if (cmd === "MOVE") {
      const pl = w.players[principal.player_id];
      if (!pl?.entered) {
        return {
          ok: false,
          request_id,
          error: { code: "NOT_IN_WORLD", message: "ENTER_WORLD first" },
        };
      }
      const direction = String(args.direction || args.exit_id || "").toLowerCase();
      const room = w.rooms[pl.room_id];
      const exit = room?.exits.find(
        (e) => e.direction === direction || e.to_room_id === direction,
      );
      if (!exit) {
        return {
          ok: false,
          request_id,
          error: { code: "MOVE_REJECTED", message: `no exit ${direction || "(empty)"}` },
        };
      }
      pl.room_id = exit.to_room_id;
      const ev = pushEvent("MOVE", {
        player_id: principal.player_id,
        from: room.room_id,
        to: exit.to_room_id,
        direction: exit.direction,
      });
      settled = await settleEvent(this.env, principal, {
        event_id: ev.event_id,
        event_type: ev.event_type,
        sequence: ev.sequence,
        cycle: w.cycle,
        world_id: w.world_id,
        player_id: principal.player_id,
        controller_id: principal.controller_id,
        session_id: principal.session_id,
        payload: ev.payload,
      });
    } else if (cmd === "WAIT") {
      w.cycle += 1;
      pushEvent("WAIT", { player_id: principal.player_id, cycles: 1 });
    } else if (cmd === "INSPECT") {
      const pl = w.players[principal.player_id];
      if (!pl?.entered) {
        return {
          ok: false,
          request_id,
          error: { code: "NOT_IN_WORLD", message: "ENTER_WORLD first" },
        };
      }
      const room = w.rooms[pl.room_id];
      const target = String(args.entity_id || args.target || "").trim();
      const entity = room?.entities.find(
        (e) => e.entity_id === target || e.label === target,
      );
      if (!entity) {
        return {
          ok: false,
          request_id,
          error: {
            code: "INSPECT_FAILED",
            message: target ? `no visible entity ${target}` : "entity_id required",
          },
        };
      }
      const ev = pushEvent("INSPECT", {
        player_id: principal.player_id,
        entity_id: entity.entity_id,
        room_id: pl.room_id,
      });
      settled = await settleEvent(this.env, principal, {
        event_id: ev.event_id,
        event_type: ev.event_type,
        sequence: ev.sequence,
        cycle: w.cycle,
        world_id: w.world_id,
        player_id: principal.player_id,
        controller_id: principal.controller_id,
        session_id: principal.session_id,
        payload: {
          ...ev.payload,
          detail: `${entity.label} (${entity.entity_type}) is present and operational enough to inspect.`,
        },
      });
      // Attach inspect detail on observation via temporary entity note
      const obs = this.observe(principal);
      const resultInspect: CommandResult = {
        ok: true,
        request_id,
        observation: {
          ...obs,
          // Stage 0: surface inspect text in description suffix
          location: {
            ...obs.location,
            description: `${obs.location.description} You inspect ${entity.label}: ${entity.entity_type} — present and operational enough to inspect.`,
          },
        },
        events,
        provenance: {
          player_id: principal.player_id,
          controller_id: principal.controller_id,
          session_id: principal.session_id,
          agent_id: principal.agent_id,
        },
        settled,
      };
      w.seen_idempotency[idem] = resultInspect;
      await this.save();
      return resultInspect;
    } else if (cmd === "OBSERVE") {
      // pure observation — no durable event by default
    } else {
      return {
        ok: false,
        request_id,
        error: { code: "UNKNOWN_COMMAND", message: `unsupported command ${cmd}` },
      };
    }

    const result: CommandResult = {
      ok: true,
      request_id,
      observation: this.observe(principal),
      events,
      provenance: {
        player_id: principal.player_id,
        controller_id: principal.controller_id,
        session_id: principal.session_id,
        agent_id: principal.agent_id,
      },
      settled,
    };
    // Cap idempotency map
    w.seen_idempotency[idem] = result;
    const keys = Object.keys(w.seen_idempotency);
    if (keys.length > 200) {
      for (const k of keys.slice(0, keys.length - 200)) delete w.seen_idempotency[k];
    }
    await this.save();
    return result;
  }
}
