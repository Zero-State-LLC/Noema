import { describe, expect, it } from "vitest";
import { contestOfficeProfile, parseContestForm } from "../src/contest";
import {
  DEFAULT_BUDGETS,
  cloneBudgets,
  enrichEntity,
  helpText,
  parseHumanCommand,
} from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { emptyTreasury } from "../src/offices";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";

/**
 * GC7-S3 isolated INFORMATION_CONTEST.
 * Authority: Noema-Specs docs/GC7-S3-INFORMATION-CONTEST.md / RFC-0042.
 * Isolated world id only. Chamber help names CONTEST.
 */

const STAKE = { energy: 8, influence: 10, compute: 4 };

function principal(id: string): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id}`,
    session_id: "sess.test",
    controller_id: `ctrl.${id}`,
    controller_type: "human",
    scopes: ["noema.player.read", "noema.world.observe", "noema.action.submit"],
    protocol_version: "1",
    authentication_context: "test",
  };
}

function world(): WorldRuntime {
  return {
    world_id: "test.hosted-canonical.gc7-s3",
    world_name: "Test",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.hub",
    rooms: {
      "room.hub": {
        room_id: "room.hub",
        name: "Hub",
        description: "Grid.",
        exits: [{ direction: "east", to_room_id: "room.east" }],
        entities: [
          enrichEntity({
            entity_id: "entity.ledger",
            label: "scarred-ledger",
            entity_type: "ARTIFACT",
            archive_subject_entity_id: "entity.relay-7",
            archive_claim: "OPERATING",
          }),
          enrichEntity({
            entity_id: "entity.relay-7",
            label: "scarred-conduit",
            entity_type: "INFRASTRUCTURE",
            condition: 70,
          }),
        ],
      },
      "room.east": {
        room_id: "room.east",
        name: "East",
        description: "Away.",
        exits: [{ direction: "west", to_room_id: "room.hub" }],
        entities: [],
      },
    },
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    contests: {},
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

describe("GC7-S3 mapper", () => {
  it("parses INFORMATION_CONTEST and keeps INFORMATION_WAR closed", () => {
    expect(parseContestForm("information")).toBe("INFORMATION_CONTEST");
    expect(parseContestForm("INFORMATION_CONTEST")).toBe("INFORMATION_CONTEST");
    expect(parseContestForm("INFORMATION_WAR")).toBeNull();
    expect(contestOfficeProfile("INFORMATION_CONTEST")).toBe("ACCESS_RESTRICTED_ARCHIVE");
    const parsed = parseHumanCommand("contest information scarred-ledger stake=energy:8,influence:10,compute:4");
    expect(parsed.ok).toBe(true);
    if (parsed.ok && parsed.action.verb === "COMMIT") {
      expect(parsed.action.arguments.operation).toBe("CONTEST_DECLARE");
      expect(parsed.action.arguments.contest_form).toBe("INFORMATION_CONTEST");
    }
    expect(helpText()).toMatch(/\bCONTEST\b/);
  });
});

describe("GC7-S3 information contest", () => {
  it("declares on a visible artifact, seals INSPECT, and does not leak the claim", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    w.players[p.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    const declared = await run(w, p, "CONTEST_DECLARE", {
      contest_form: "INFORMATION_CONTEST",
      target: { kind: "ENTITY", entity_id: "entity.ledger" },
      stake: STAKE,
      seed_stream_id: "stream.contest.info",
    });
    expect(declared.ok).toBe(true);
    expect(JSON.stringify(declared.observation?.contests || [])).not.toMatch(
      /hidden|hp|health|hitpoints|OPERATING|archive_claim/i,
    );
    const contest = Object.values(w.contests || {})[0];
    expect(contest.contest_form).toBe("INFORMATION_CONTEST");
    expect(contest.declarer_id).toBe(p.player_id);

    const waited = await run(w, p, "WAIT");
    expect(waited.ok).toBe(true);
    const types = waited.events?.map((e) => e.event_type) || [];
    expect(types).toContain("CONTEST_RESOLVED");
    const update = waited.events?.find(
      (e) => e.event_type === "ENTITY_UPDATE" && e.payload?.field === "inspect_restricted_until",
    );
    expect(update?.payload?.to).toBeGreaterThan(w.cycle);
    expect(JSON.stringify(waited.events || [])).not.toMatch(/archive_claim/i);
    expect(w.rooms["room.hub"].entities.find((e) => e.entity_id === "entity.ledger")?.archive_claim).toBe(
      "OPERATING",
    );

    const inspect = await run(w, p, "INSPECT", { entity_id: "entity.ledger" });
    expect(inspect.ok).toBe(false);
    expect(inspect.error?.code).toBe("FORBIDDEN");
    expect(JSON.stringify(inspect)).not.toMatch(/OPERATING|archive_claim/i);
  });

  it("rejects missing targets and visible non-records", async () => {
    const w = world();
    const p = principal("player.nacre");
    await run(w, p, "ENTER_WORLD");
    const missing = await run(w, p, "CONTEST_DECLARE", {
      contest_form: "INFORMATION_CONTEST",
      target: { kind: "ENTITY", entity_id: "entity.no-such" },
      stake: STAKE,
    });
    expect(missing.ok).toBe(false);
    expect(missing.error?.code).toBe("NOT_FOUND");

    const remote = await run(w, p, "MOVE", { direction: "east" });
    expect(remote.ok).toBe(true);
    const away = await run(w, p, "CONTEST_DECLARE", {
      contest_form: "INFORMATION_CONTEST",
      target: { kind: "ENTITY", entity_id: "entity.ledger" },
      stake: STAKE,
    });
    expect(away.ok).toBe(false);
    expect(away.error?.code).toBe("NOT_FOUND");

    w.players[p.player_id].room_id = "room.hub";
    const infra = await run(w, p, "CONTEST_DECLARE", {
      contest_form: "INFORMATION_CONTEST",
      target: { kind: "ENTITY", entity_id: "entity.relay-7" },
      stake: STAKE,
    });
    expect(infra.ok).toBe(false);
    expect(infra.error?.code).toBe("FORBIDDEN");
  });

  it("requires ACCESS_RESTRICTED_ARCHIVE when acting_for an institution", async () => {
    const w = world();
    const founder = principal("player.nacre");
    const archivist = principal("player.vesper");
    await run(w, founder, "ENTER_WORLD");
    await run(w, archivist, "ENTER_WORLD");
    w.players[founder.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    w.players[archivist.player_id].budgets = cloneBudgets(DEFAULT_BUDGETS);
    expect(
      (
        await run(w, founder, "COMMIT", {
          operation: "ORG_CREATE",
          name: "Line",
          charter: "Keep the record.",
          org_id: "org.line",
        })
      ).ok,
    ).toBe(true);
    expect(
      (
        await run(w, founder, "COMMIT", {
          operation: "ORG_MEMBER_ADD",
          org_id: "org.line",
          agent_id: archivist.player_id,
          role: "member",
        })
      ).ok,
    ).toBe(true);
    expect(
      (
        await run(w, founder, "COMMIT", {
          operation: "ORG_OFFICE_CREATE",
          org_id: "org.line",
          display_name: "Custodian",
          authority_profile: "OPERATE_NAMED_ASSET",
        })
      ).ok,
    ).toBe(true);
    const wrongOffice = Object.keys(w.organizations["org.line"].offices || {})[0];
    expect(
      (
        await run(w, founder, "COMMIT", {
          operation: "ORG_OFFICE_ASSIGN",
          org_id: "org.line",
          office_id: wrongOffice,
          agent_id: archivist.player_id,
        })
      ).ok,
    ).toBe(true);
    const treasury = w.organizations["org.line"].treasury || emptyTreasury();
    treasury.energy = 40;
    treasury.influence = 30;
    treasury.compute = 20;
    w.organizations["org.line"].treasury = treasury;

    const wrong = await run(w, archivist, "CONTEST_DECLARE", {
      contest_form: "INFORMATION_CONTEST",
      target: { kind: "ENTITY", entity_id: "entity.ledger" },
      stake: STAKE,
      acting_for: "org.line",
    });
    expect(wrong.ok).toBe(false);
    expect(wrong.error?.code).toBe("FORBIDDEN");

    expect(
      (
        await run(w, founder, "COMMIT", {
          operation: "ORG_OFFICE_CREATE",
          org_id: "org.line",
          display_name: "Archivist",
          authority_profile: "ACCESS_RESTRICTED_ARCHIVE",
        })
      ).ok,
    ).toBe(true);
    const archiveOffice = Object.values(w.organizations["org.line"].offices || {}).find(
      (o) => o.display_name === "Archivist",
    )!.office_id;
    expect(
      (
        await run(w, founder, "COMMIT", {
          operation: "ORG_OFFICE_ASSIGN",
          org_id: "org.line",
          office_id: archiveOffice,
          agent_id: archivist.player_id,
        })
      ).ok,
    ).toBe(true);

    const declared = await run(w, archivist, "CONTEST_DECLARE", {
      contest_form: "INFORMATION_CONTEST",
      target: { kind: "ENTITY", entity_id: "entity.ledger" },
      stake: STAKE,
      acting_for: "org.line",
    });
    expect(declared.ok).toBe(true);
    expect(Object.values(w.contests || {})[0].acting_for).toBe("org.line");
    expect(Object.values(w.contests || {})[0].declarer_id).toBe(archivist.player_id);
  });
});
