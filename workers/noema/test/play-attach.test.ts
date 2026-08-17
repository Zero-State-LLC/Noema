import { describe, expect, it } from "vitest";
import { mintControllerToken } from "../src/auth";
import { canonicalWorldState } from "../src/canonical-state";
import worker from "../src/index";
import { countEnteredPlayers, countLivePlayers, playReady } from "../src/ops";
import { humanizeError, waitingCopy } from "../src/play-ui";
import { playCallbackHtml } from "../src/play-login-html";
import { playHtml } from "../src/play";
import type { CommandEnvelope, Env, PlayerPrincipal } from "../src/types";
import { applyWorldCommand, buildObservation, migrateWorldRuntime, type WorldRuntime } from "../src/world-actions";

function principal(id = "player.a7a22752ad02"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: "agent.ada",
    session_id: "sess.play",
    controller_id: "ctrl.human.ada",
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "controller_token",
    amr: "email_magic_link",
    identity_id: "11111111-2222-3333-4444-555555555555",
  };
}

function emptySnapshot(): WorldRuntime {
  return {
    world_id: "world.perihelion-reach",
    world_name: "Perihelion Reach",
    cycle: 0,
    sequence: 94,
    entry_room_id: "room.relay-quarter",
    rooms: {},
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

function perihelionWorld(): WorldRuntime {
  return {
    world_id: "world.perihelion-reach",
    world_name: "Perihelion Reach",
    cycle: 0,
    sequence: 94,
    entry_room_id: "room.relay-quarter",
    rooms: {
      "room.relay-quarter": {
        room_id: "room.relay-quarter",
        name: "Relay Quarter",
        description: "A frontier station on a worn trade line. Power hums under the floor.",
        exits: [{ direction: "east", to_room_id: "room.transit-ring" }],
        entities: [
          { entity_id: "entity.relay-7", label: "relay-7", entity_type: "INFRASTRUCTURE", condition: 70 },
        ],
      },
      "room.transit-ring": {
        room_id: "room.transit-ring",
        name: "Transit Ring",
        description: "A ring corridor of faded waymarks.",
        exits: [{ direction: "west", to_room_id: "room.relay-quarter" }],
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

async function run(
  w: WorldRuntime,
  p: PlayerPrincipal,
  command: string,
  args: Record<string, unknown> = {},
) {
  const envl: CommandEnvelope = {
    request_id: `r.${Math.random().toString(16).slice(2)}`,
    idempotency_key: `i.${Math.random().toString(16).slice(2)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, p, envl, async () => true);
}

function liveDo(world: WorldRuntime) {
  return {
    idFromName: () => ({ name: world.world_id }),
    get: () => ({
      fetch: async (url: string, init?: RequestInit) => {
        const path = String(url);
        if (path.includes("/health")) {
          return Response.json({
            ok: true,
            world_id: world.world_id,
            world_name: world.world_name,
            cycle: world.cycle,
            sequence: world.sequence,
            players: countLivePlayers(world.players),
            status: "ACTIVE",
            settlement_health: "HEALTHY",
            genesis_id: "genesis.ef578f4ffceeccd0",
            playable: Object.keys(world.rooms || {}).length > 0,
          });
        }
        const body = init?.body ? (JSON.parse(String(init.body)) as { principal: PlayerPrincipal; envelope: CommandEnvelope }) : null;
        if (!body?.principal || !body.envelope) {
          return Response.json({ error: { code: "INVALID_REQUEST", message: "principal and envelope required" } }, { status: 400 });
        }
        const result = await applyWorldCommand(world, body.principal, body.envelope, async () => true);
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    }),
  };
}

async function authedCommand(world: WorldRuntime, envelope: CommandEnvelope) {
  const env = {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world.perihelion-reach",
    WORLD_DO: liveDo(world),
  } as unknown as Env;
  const minted = await mintControllerToken(env, {
    handle: "ada",
    controllerType: "human",
    playerId: "player.a7a22752ad02",
    identityId: "11111111-2222-3333-4444-555555555555",
    amr: "email_magic_link",
  });
  return worker.fetch(
    new Request("https://noema.guru/v1/command", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${minted.access_token}` },
      body: JSON.stringify(envelope),
    }),
    env,
  );
}

describe("play attach — empty world snapshot", () => {
  it("LOOK on an empty snapshot returns WORLD_NOT_READY instead of throwing", async () => {
    const w = emptySnapshot();
    const p = principal();
    const result = await run(w, p, "LOOK", { line: "look" });
    expect(result.ok).toBe(false);
    expect(result.error?.code).toBe("WORLD_NOT_READY");
    expect(result.error?.message).not.toMatch(/internal error/i);
    expect(result.observation?.world_name).toBe("Perihelion Reach");
    expect(result.observation?.in_world).toBe(false);
    expect(result.observation?.location).toBeUndefined();
    expect(w.players[p.player_id]?.entered).not.toBe(true);
  });

  it("ENTER on an empty snapshot is fail-closed and does not bind a player", async () => {
    const w = emptySnapshot();
    const r = await run(w, principal(), "LOOK", { line: "enter" });
    expect(r.ok).toBe(false);
    expect(r.error?.code).toBe("WORLD_NOT_READY");
    expect(Object.keys(w.players).every((id) => !w.players[id].entered)).toBe(true);
  });

  it("buildObservation does not throw when rooms are missing", () => {
    expect(() => buildObservation(emptySnapshot(), principal(), "look")).not.toThrow();
    const obs = buildObservation(emptySnapshot(), principal(), "look");
    expect(obs.world_name).toBe("Perihelion Reach");
    expect(obs.location).toBeUndefined();
    expect(obs.in_world).toBe(false);
  });

  it("authenticated PLAY session against an empty snapshot is a typed 400, not INTERNAL", async () => {
    const res = await authedCommand(emptySnapshot(), {
      request_id: "web.empty-look",
      idempotency_key: "web.empty-look",
      command: "LOOK",
      arguments: { line: "look" },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as {
      ok?: boolean;
      error?: { code?: string; message?: string };
      observation?: { world_name?: string };
    };
    expect(body.ok).toBe(false);
    expect(body.error?.code).toBe("WORLD_NOT_READY");
    expect(body.error?.message).not.toMatch(/internal error/i);
    expect(body.observation?.world_name).toBe("Perihelion Reach");
  });
});

describe("play attach — canonical head snapshot", () => {
  it("ENTER then LOOK on a head snapshot (no seen_idempotency) binds the player and returns a location", async () => {
    const head = canonicalWorldState(perihelionWorld()) as WorldRuntime;
    expect(head.seen_idempotency).toBeUndefined();
    const p = principal();
    const entered = await run(head, p, "LOOK", { line: "enter" });
    expect(entered.ok).toBe(true);
    expect(entered.error).toBeUndefined();
    expect(head.players[p.player_id]?.entered).toBe(true);
    expect(head.players[p.player_id]?.room_id).toBe("room.relay-quarter");
    expect(entered.observation?.in_world).toBe(true);
    expect(entered.observation?.location?.name).toMatch(/Relay/);
    expect(countEnteredPlayers(head.players)).toBe(1);
    expect(countLivePlayers(head.players)).toBe(1);

    const looked = await run(head, p, "LOOK", { line: "look" });
    expect(looked.ok).toBe(true);
    expect(looked.error).toBeUndefined();
    expect(looked.observation?.location?.description).toMatch(/frontier station/i);
    expect(looked.observation?.sequence).toBeGreaterThan(0);
    expect(looked.observation?.in_world).toBe(true);
  });

  it("LOOK before ENTER on a head snapshot is NOT_IN_WORLD, not COMMAND_FAILED", async () => {
    const head = canonicalWorldState(perihelionWorld()) as WorldRuntime;
    const looked = await run(head, principal(), "LOOK", { line: "look" });
    expect(looked.ok).toBe(false);
    expect(looked.error?.code).toBe("NOT_IN_WORLD");
    expect(looked.error?.message).toMatch(/enter/i);
    expect(looked.observation?.world_name).toBe("Perihelion Reach");
    expect(looked.observation?.in_world).toBe(false);
    expect(countEnteredPlayers(head.players)).toBe(0);
  });

  it("migrate + ENTER then LOOK matches the Durable Object load path from a head", async () => {
    const head = canonicalWorldState(perihelionWorld()) as WorldRuntime;
    migrateWorldRuntime(head);
    expect(head.seen_idempotency).toEqual({});
    const p = principal();
    const entered = await run(head, p, "LOOK", { line: "enter" });
    expect(entered.ok).toBe(true);
    const looked = await run(head, p, "LOOK", { line: "look" });
    expect(looked.ok).toBe(true);
    expect(looked.observation?.location?.name).toMatch(/Relay/);
  });

  it("authenticated magic-link session ENTER then LOOK attaches against a head snapshot", async () => {
    const head = canonicalWorldState(perihelionWorld()) as WorldRuntime;
    const enter = await authedCommand(head, {
      request_id: "web.head-enter",
      idempotency_key: "web.head-enter",
      command: "LOOK",
      arguments: { line: "enter" },
    });
    expect(enter.status).toBe(200);
    const entered = (await enter.json()) as {
      ok?: boolean;
      error?: { code?: string };
      observation?: { in_world?: boolean; location?: { name?: string }; sequence?: number };
    };
    expect(entered.ok).toBe(true);
    expect(entered.error).toBeUndefined();
    expect(entered.observation?.in_world).toBe(true);
    expect(entered.observation?.location?.name).toMatch(/Relay/);
    expect(head.players["player.a7a22752ad02"]?.entered).toBe(true);
    expect(countLivePlayers(head.players)).toBe(1);

    const look = await authedCommand(head, {
      request_id: "web.head-look",
      idempotency_key: "web.head-look",
      command: "LOOK",
      arguments: { line: "look" },
    });
    expect(look.status).toBe(200);
    const looked = (await look.json()) as {
      ok?: boolean;
      observation?: { location?: { description?: string }; sequence?: number };
    };
    expect(looked.ok).toBe(true);
    expect(looked.observation?.location?.description).toMatch(/frontier station/i);
    expect(looked.observation?.sequence).not.toBeUndefined();

    const env = {
      TOKEN_SIGNING_SECRET: "test-signing-secret",
      NOEMA_ENV: "production",
      NOEMA_PROTOCOL_VERSION: "1",
      DEFAULT_WORLD_ID: "world.perihelion-reach",
      WORLD_DO: liveDo(head),
    } as unknown as Env;
    const ready = await worker.fetch(new Request("https://noema.guru/ready"), env);
    const readyBody = (await ready.json()) as { ready?: boolean; world?: { players?: number; playable?: boolean } };
    expect(readyBody.ready).toBe(true);
    expect(readyBody.world?.playable).toBe(true);
    expect(readyBody.world?.players).toBeGreaterThanOrEqual(1);
  });

  it("ENTER then LOOK still attaches when the head snapshot has an org without members", async () => {
    const live = perihelionWorld();
    live.organizations = {
      "org.worn-compact": {
        org_id: "org.worn-compact",
        name: "Worn Compact",
        charter: "hold the relay",
        status: "ACTIVE",
        creator_id: "player.prior",
        members: undefined as unknown as [],
        created_cycle: 0,
      },
    };
    const head = canonicalWorldState(live) as WorldRuntime;
    const p = principal();
    const entered = await run(head, p, "LOOK", { line: "enter" });
    expect(entered.ok).toBe(true);
    expect(entered.observation?.location?.name).toMatch(/Relay/);
    const looked = await run(head, p, "LOOK", { line: "look" });
    expect(looked.ok).toBe(true);
    expect(looked.observation?.in_world).toBe(true);
  });
});

describe("play attach — live Perihelion Reach", () => {
  it("ENTER then LOOK hydrates world name, player bind, and WHERE", async () => {
    const w = perihelionWorld();
    const p = principal();
    const entered = await run(w, p, "LOOK", { line: "enter" });
    expect(entered.ok).toBe(true);
    expect(w.players[p.player_id]?.entered).toBe(true);
    expect(w.players[p.player_id]?.room_id).toBe("room.relay-quarter");
    expect(entered.observation?.world_name).toBe("Perihelion Reach");
    expect(entered.observation?.in_world).toBe(true);
    expect(entered.observation?.location?.name).toMatch(/Relay/);
    expect(entered.observation?.location?.description).toMatch(/frontier station/i);

    const looked = await run(w, p, "LOOK", { line: "look" });
    expect(looked.ok).toBe(true);
    expect(looked.error).toBeUndefined();
    expect(looked.observation?.location?.description).toBeTruthy();
    expect(looked.observation?.consequence).toMatch(/Relay/);
  });

  it("LOOK before ENTER is NOT_IN_WORLD with a typed reason and world name, not INTERNAL", async () => {
    const looked = await run(perihelionWorld(), principal(), "LOOK", { line: "look" });
    expect(looked.ok).toBe(false);
    expect(looked.error?.code).toBe("NOT_IN_WORLD");
    expect(looked.error?.message).not.toMatch(/internal error/i);
    expect(looked.observation?.world_name).toBe("Perihelion Reach");
    expect(looked.observation?.in_world).toBe(false);
  });
});

describe("play attach presentation", () => {
  it("waiting copy uses the typed reason instead of blank dashes + internal error", () => {
    const empty = waitingCopy({
      code: "WORLD_NOT_READY",
      message: "The world has no playable location yet.",
      worldName: "Perihelion Reach",
    });
    expect(empty.worldLine).toBe("Perihelion Reach");
    expect(empty.roomDesc).toMatch(/not ready/i);
    expect(empty.roomDesc).not.toMatch(/internal error/i);
    expect(empty.roomDesc).not.toBe("Waiting for the world.");

    const look = waitingCopy({
      code: "NOT_IN_WORLD",
      message: "Enter the world first.",
      worldName: "Perihelion Reach",
    });
    expect(look.roomDesc).toMatch(/enter/i);
    expect(look.roomDesc).not.toMatch(/internal error/i);

    expect(humanizeError("INTERNAL", "internal error").primary).not.toBe("internal error");
  });

  it("playReady fail-closes when the live snapshot is not playable", () => {
    const r = playReady("ACTIVE", "HEALTHY", false);
    expect(r.ready).toBe(false);
    expect(r.play_blocked).toBe(true);
    expect(r.code).toBe("WORLD_NOT_READY");
  });

  it("magic-link callback stores the play handle so ENTER is not skipped", () => {
    const html = playCallbackHtml();
    expect(html).toContain("noema.play.handle");
    expect(html).toContain("data.handle");
    const play = playHtml();
    expect(play).toContain("waitingCopy");
    expect(play).toMatch(/handle\.length < 2[\s\S]*preToken|preToken[\s\S]*handle\.length < 2/);
  });
});
