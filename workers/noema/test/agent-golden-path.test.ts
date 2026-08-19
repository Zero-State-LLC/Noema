/**
 * Sealed golden path + fail surface. Drives shipped applyWorldCommand / checkLiveAgentSeal.
 * Isolated world only. No /play DOM. Token never appears.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { applyPlayerCommand } from "../src/protocol-ws";
import { ACCEPTED_SEALS, checkLiveAgentSeal, parseSeal } from "../src/seal";
import type { CommandEnvelope, Env, PlayerPrincipal } from "../src/types";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";

const HERE = dirname(fileURLToPath(import.meta.url));
const LIVE = ACCEPTED_SEALS[0];
const ISOLATED = "test.hosted-canonical.golden-path";

function agent(): PlayerPrincipal {
  return {
    player_id: "player.gold",
    agent_id: "agent.gold",
    session_id: "sess.gold",
    controller_id: "ctrl.gold",
    controller_type: "agent",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: ISOLATED,
    world_name: "Golden",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.a",
    rooms: {
      "room.a": {
        room_id: "room.a",
        name: "A",
        description: "Start.",
        exits: [{ direction: "east", to_room_id: "room.b" }],
        entities: [{ entity_id: "entity.box", label: "Box", entity_type: "SITE", condition: 40 }],
      },
      "room.b": {
        room_id: "room.b",
        name: "B",
        description: "East.",
        exits: [{ direction: "west", to_room_id: "room.a" }],
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

async function act(w: WorldRuntime, command: string, args: Record<string, unknown> = {}) {
  const envl: CommandEnvelope = {
    request_id: `g.${command}`,
    idempotency_key: `g.${command}.${Math.random().toString(36).slice(2, 8)}`,
    command,
    arguments: args,
  };
  return applyWorldCommand(w, agent(), envl, async () => true);
}

describe("golden path ENTER LOOK MOVE INSPECT", () => {
  it("changes room on MOVE and inspects a co-located entity", async () => {
    const w = world();
    const entered = await act(w, "ENTER_WORLD");
    expect(entered.ok).toBe(true);
    const looked = await act(w, "LOOK");
    expect(looked.ok).toBe(true);
    const from = looked.observation?.location?.room_id;
    expect(from).toBe("room.a");
    const inspected = await act(w, "INSPECT", { entity_id: "entity.box" });
    expect(inspected.ok).toBe(true);
    const moved = await act(w, "MOVE", { direction: "east" });
    expect(moved.ok).toBe(true);
    expect(moved.observation?.location?.room_id).toBe("room.b");
    expect(moved.observation?.location?.room_id).not.toBe(from);
    expect(w.world_id).toBe(ISOLATED);
    expect(w.world_id).not.toBe("world.perihelion-reach");
  });

  it("invalid MOVE does not relocate", async () => {
    const w = world();
    await act(w, "ENTER_WORLD");
    const bad = await act(w, "MOVE", { direction: "no-such-exit" });
    expect(bad.ok).toBe(false);
    expect(w.players[agent().player_id]?.room_id).toBe("room.a");
  });
});

describe("live seal fail-closed", () => {
  it("requires the frozen hash and rejects a mismatch", () => {
    expect(LIVE).toBe("sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395");
    const ok = checkLiveAgentSeal({
      controllerType: "agent",
      worldKind: "default",
      presented: parseSeal(LIVE),
    });
    expect(ok).toEqual({ ok: true, seal: LIVE });
    const miss = checkLiveAgentSeal({
      controllerType: "agent",
      worldKind: "default",
      presented: parseSeal("sha256:0000000000000000000000000000000000000000000000000000000000000000"),
    });
    expect(miss.ok).toBe(false);
    if (!miss.ok) expect(miss.code).toBe("SEAL_MISMATCH");
    const none = checkLiveAgentSeal({
      controllerType: "agent",
      worldKind: "default",
      presented: null,
    });
    expect(none.ok).toBe(false);
    if (!none.ok) expect(none.code).toBe("SEAL_REQUIRED");
  });

  it("applyPlayerCommand does not route a mismatched live seal", async () => {
    let routed = false;
    const res = await applyPlayerCommand(
      { NOEMA_ENV: "production", DEFAULT_WORLD_ID: "world-01" } as Env,
      new Request("https://noema.local/v1/command", {
        headers: { "X-Noema-Seal": "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" },
      }),
      agent(),
      { request_id: "r1", command: "LOOK" },
      async () => {
        routed = true;
        return new Response("{}", { status: 200 });
      },
    );
    expect(routed).toBe(false);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("SEAL_MISMATCH");
  });
});

describe("official client refuses live play briefs", () => {
  it("agent CLI suppresses --goal/--prompt and exits before network", () => {
    const src = readFileSync(join(HERE, "../../../src/noema/cli/agent.py"), "utf8");
    expect(src).toContain("refused_play_flag");
    expect(src).toContain('help=argparse.SUPPRESS');
    expect(src).toMatch(/--goal/);
    expect(src).toMatch(/--prompt/);
    const harness = readFileSync(join(HERE, "../../../src/noema/harness/seal.py"), "utf8");
    expect(harness).toContain('FORBIDDEN_FLAG_NAMES = ("goal", "prompt", "system", "brief")');
  });
});
