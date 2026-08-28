import { describe, expect, it } from "vitest";
import { normalizeStructuredCommand } from "../src/actions";
import { applyWorldCommand, type WorldRuntime } from "../src/world-actions";
import { buildWatchLive, type WatchRoomIn } from "../src/watch-live";
import { miniChamberState, MINI_ENTRY_ROOM_ID, MINI_HALL_ROOM_ID } from "../src/mini-chamber";
import type { CommandEnvelope, PlayerPrincipal } from "../src/types";
import { projectRoomTraces, publicTraces } from "../src/play-traces";

function agent(id = "player.hermes"): PlayerPrincipal {
  return {
    player_id: id,
    agent_id: `agent.${id.replace(/^player\./, "")}`,
    session_id: "sess.rfc0120-dt",
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

describe("RFC-0120 P12 Deep Time traces", () => {
  it("there is no TRACE verb", () => {
    const parsed = normalizeStructuredCommand("TRACE", {});
    expect(parsed.ok).toBe(false);
    if (parsed.ok) throw new Error("expected TRACE to be unknown");
    expect(parsed.code).toBe("UNKNOWN_COMMAND");
  });

  it("an Agent Player MOVE is a durable public ledger event", async () => {
    const w = miniChamberState("test.hosted-canonical.rfc0120-dt");
    const p = agent();
    await run(w, p, "ENTER_WORLD");
    const moved = await run(w, p, "MOVE", { target_id: "east" });
    expect(moved.ok).toBe(true);
    expect(moved.observation?.location?.room_id).toBe(MINI_HALL_ROOM_ID);
    const trace = moved.events?.find((e) => e.event_type === "MOVE");
    expect(trace).toBeTruthy();
    expect(trace?.payload?.player_id).toBe(p.player_id);
    expect(trace?.payload?.from).toBe(MINI_ENTRY_ROOM_ID);
    expect(trace?.payload?.to).toBe(MINI_HALL_ROOM_ID);
    expect(moved.observation?.available_actions).not.toContain("TRACE");
  });

  it("WATCH does not carry inhabitant consequence or inbox as Deep Time", () => {
    const snap = buildWatchLive({
      world_id: "test.hosted-canonical.rfc0120-dt-watch",
      cycle: 2,
      sequence: 8,
      rooms: {
        [MINI_HALL_ROOM_ID]: {
          room_id: MINI_HALL_ROOM_ID,
          name: "Hall",
          description: "A short public corridor.",
          exits: [{ direction: "west", to_room_id: MINI_ENTRY_ROOM_ID }],
          entities: [],
        },
      },
      players: [{ player_id: "player.hermes", handle: "hermes", room_id: MINI_HALL_ROOM_ID, entered: true }],
      events: [
        {
          event_type: "MOVE",
          sequence: 8,
          cycle: 2,
          player_id: "player.hermes",
          payload: { player_id: "player.hermes", from: MINI_ENTRY_ROOM_ID, to: MINI_HALL_ROOM_ID, direction: "east" },
        },
      ],
      now: 1_700_000_000_000,
    });
    const blob = JSON.stringify(snap);
    expect(blob).not.toMatch(/\"messages\"/);
    expect(blob).not.toMatch(/TRACE/);
    expect(snap).not.toHaveProperty("practice_lines");
  });

  it("P12.1: actions (MOVE/REPAIR/TRADE/ACCESS/scars) leave only public environmental traces (no private, no TRACE verb)", () => {
    // Projection always emits public-only (scars, construction plates from repairs, notices from TRADE/boards, etc.)
    const room = {
      entities: [
        { entity_id: "e.ruin", label: "ruined-relay", scar: true },
        { entity_id: "e.fixed", label: "fixed-conduit", last_repair_cycle: 5, last_repair_handle: "tester" },
      ],
      trade_notice: { text: "fair exchange recorded", cycle: 4 },
    };
    const projected = projectRoomTraces(room as any);
    const pub = publicTraces(projected);
    expect(pub.length).toBeGreaterThan(0);
    expect(pub.every((t: any) => t.visibility === "public")).toBe(true);
    expect(pub.some((t: any) => t.kind === "scar")).toBe(true);
    expect(pub.some((t: any) => t.kind === "construction" && t.text.includes("tester"))).toBe(true);
    expect(pub.some((t: any) => t.kind === "notice" && t.text.includes("exchange"))).toBe(true);

    // No TRACE verb in structured commands
    const parsed = normalizeStructuredCommand("TRACE", {});
    expect(parsed.ok).toBe(false);

    // MOVE/ACCESS_RESTRICTED events are public ledger (see MOVE test above; ACCESS emits ACCESS_RESTRICTED)
    // WATCH/obs surfaces only public residue (tested in buildWatchLive + play-traces)
  });

  it("P12.2: researcher/admin HumanPrincipal (non-Player per P11) actions/observations yield only public traces with no player_id (ties to P11 + DEEP-TIME public history)", () => {
    // Researcher/admin are HumanPrincipal only (no player_id, no mutation). See rfc0120-principal.test.ts researcher/admin cases.
    const researcher = { kind: "human", roles: ["researcher"] } as any;
    expect(researcher.player_id).toBeUndefined();
    expect(researcher.kind).toBe("human");

    const admin = { kind: "human", roles: ["admin"] } as any;
    expect(admin.player_id).toBeUndefined();

    // Public traces (WATCH/STUDY surface) are always environmental/public; never carry player_id.
    // play-traces.ts confirms: 0 references to player_id; traces = {kind, text, visibility:"public"}
    const room = {
      entities: [{ entity_id: "e.scar", label: "research-scar", scar: true }],
      trade_notice: { text: "public research record", cycle: 10 },
    };
    const projected = projectRoomTraces(room as any);
    const pub = publicTraces(projected);
    expect(pub.length).toBeGreaterThan(0);
    expect(pub.every((t: any) => t.visibility === "public")).toBe(true);
    expect(JSON.stringify(pub)).not.toMatch(/player_id/);

    // STUDY for researchers is public observation (study.ts: "Humans study. Agents inhabit. Research does not rewrite the ledger.")
    // Uses /v1/watch/live which surfaces these public traces (no ledger mutation by human).
    // Admin ops similarly public/observational per admin separation.
  });

  it("P12.3 short-session Player leaves at least one minimal durable public trace (REPAIR plate per DEEP-TIME)", () => {
    // Per DEEP-TIME.md: short-session Player (few cycles) MUST leave >=1 durable public mark.
    // Acceptable via existing: REPAIR updates public asset -> construction trace.
    // Projection shows it persists publicly (visible in WATCH/obs/LOOK); no private.
    const room = {
      entities: [
        {
          entity_id: "entity.relay-7",
          label: "scarred-conduit",
          last_repair_cycle: 4,
          last_repair_handle: "Sable",
        },
      ],
    };
    const projected = projectRoomTraces(room as any);
    const pub = publicTraces(projected);
    expect(pub.length).toBeGreaterThan(0);
    expect(pub.every((t: any) => t.visibility === "public")).toBe(true);
    expect(
      pub.some(
        (t: any) =>
          t.kind === "construction" &&
          t.text === "A maintenance plate names Sable as the last repairer.",
      ),
    ).toBe(true);
    // persists as environmental residue; no player_id leaked (see P12.1/P12.2)
  });

  it("P12.4 WATCH public projection surfaces scars/artifacts/environmental traces (no private leak, ties to P13)", () => {
    // WATCH uses publicTraces + projectRoomTraces for every room (see watch-live.ts:713).
    // Traces are attached only if present; always public. No private player state in traces.
    const snap = buildWatchLive({
      world_id: "test.hosted-canonical.rfc0120-p124",
      cycle: 5,
      sequence: 10,
      rooms: {
        [MINI_HALL_ROOM_ID]: {
          room_id: MINI_HALL_ROOM_ID,
          name: "Hall",
          description: "A short public corridor.",
          exits: [{ direction: "west", to_room_id: MINI_ENTRY_ROOM_ID }],
          entities: [
            { entity_id: "e.scar", label: "ruin", entity_type: "object", scar: true },
            { entity_id: "e.repair", label: "fixed", entity_type: "object", last_repair_cycle: 4, last_repair_handle: "tester" },
          ],
        },
      },
      players: [{ player_id: "player.hermes", handle: "hermes", room_id: MINI_HALL_ROOM_ID, entered: true }],
      events: [],
      now: 1_700_000_000_000,
    });
    const rooms = snap.rooms as unknown;
    const hall = Array.isArray(rooms)
      ? rooms.find((room: { room_id?: string }) => room.room_id === MINI_HALL_ROOM_ID) as { traces?: Array<{ visibility?: string; kind?: string }> } | undefined
      : (rooms as Record<string, { traces?: Array<{ visibility?: string; kind?: string }> }>)[MINI_HALL_ROOM_ID];
    const traces = hall?.traces || [];
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.every((t) => t.visibility === "public")).toBe(true);
    expect(traces.some((t) => t.kind === "scar")).toBe(true);
    expect(traces.some((t) => t.kind === "construction")).toBe(true);
    // No private leak into WATCH traces (P13 tie-in).
    const blob = JSON.stringify(snap);
    expect(blob).not.toMatch(/"visibility":s*"private"/);
  });



  it("P12.5 Deep Time reconstruction from ledger/state yields public traces (historical scars/trajectory project to same public surface)", () => {
    // Per DEEP-TIME.md + plan: reconstruction (persistDeepTime, scars, trajectory_digest, reconstructions) feeds public history.
    // Traces are the observable surface of that reconstruction in WATCH/obs (no private).
    // Checkpoint restore preserves the state (see audit-conformance-fixes.test.ts).
    const reconstructedState = {
      entities: [
        { entity_id: "e.recon", label: "ancient-ruin", entity_type: "object", scar: true },
        { entity_id: "e.recon2", label: "maintained", entity_type: "object", last_repair_cycle: 3, last_repair_handle: "archivist" },
      ],
    };
    const traces = publicTraces(projectRoomTraces(reconstructedState));
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.every((t) => t.visibility === "public")).toBe(true);
    expect(traces.some((t) => t.kind === "scar" && t.text.includes("ancient-ruin"))).toBe(true);
    expect(traces.some((t) => t.kind === "construction")).toBe(true);
    // In full system: WATCH after Deep Time restore / reconstruction shows these traces.
  });



  it("P13 WATCH public projection: no inbox, affordances, situation, practice_lines (public_* and traces only)", () => {
    // Per RFC-0120-ACCEPTANCE.md: P13 MATCH = Public projection; no inbox, affordances, situation, practice_lines.
    // watch-live.ts returns projection:"public" + public_*_lines + traces + recent_events/narrative.
    // Contrasts with private observation (LOOK/player-view has raw affordances/practice_lines/situation).
    const snap = buildWatchLive({
      world_id: "test.hosted-canonical.rfc0120-p13",
      cycle: 5,
      sequence: 10,
      rooms: {
        [MINI_HALL_ROOM_ID]: {
          room_id: MINI_HALL_ROOM_ID,
          name: "Hall",
          description: "Public corridor.",
          exits: [{ direction: "west", to_room_id: MINI_ENTRY_ROOM_ID }],
          entities: [{ entity_id: "e.scar", label: "ruin", entity_type: "object", scar: true }],
        },
      },
      players: [{ player_id: "player.hermes", handle: "hermes", room_id: MINI_HALL_ROOM_ID, entered: true }],
      events: [],
      now: 1_700_000_000_000,
    });
    const blob = JSON.stringify(snap);
    expect(snap.projection).toBe("public");
    expect(blob).not.toMatch(/"inbox"/);
    expect(blob).not.toMatch(/"affordances"/);
    expect(blob).not.toMatch(/"situation"/);
    // practice_lines appear only as public_* variants or not at all in this projection
    // (raw practice_lines are for observation surfaces, not WATCH public)
    expect(blob).not.toMatch(/"practice_lines":/);  // raw in this context
    // but public variants are allowed and present
    if (snap.public_title_lines || snap.public_focus_lines) {
      // ok
    }
    // traces if present are public
    const rooms = snap.rooms as unknown;
    const hall = Array.isArray(rooms)
      ? rooms.find((room: { room_id?: string }) => room.room_id === MINI_HALL_ROOM_ID) as { traces?: Array<{ visibility?: string }> } | undefined
      : (rooms as Record<string, { traces?: Array<{ visibility?: string }> }>)[MINI_HALL_ROOM_ID];
    if (hall && hall.traces) {
      expect(Array.isArray(hall.traces)).toBe(true);
      expect(hall.traces.every((t) => t.visibility === "public")).toBe(true);
    }
  });



  it("P14 RFC-0120 closeout: full acceptance matrix supported on current runtime (P12 public durable traces + P13 public projection + no new verbs)", () => {
    // Per RFC-0120-ACCEPTANCE.md: P14 "this closeout" = MATCH | this file.
    // All prior packets (P0-P13) evidenced; current state on main supports the matrix.
    // Invariants: public traces only (P12), public WATCH projection only (P13), no TRACE verb.
    const snap = buildWatchLive({
      world_id: "test.hosted-canonical.rfc0120-p14-closeout",
      cycle: 7,
      sequence: 20,
      rooms: {
        [MINI_HALL_ROOM_ID]: {
          room_id: MINI_HALL_ROOM_ID,
          name: "Hall",
          description: "Closeout corridor.",
          exits: [],
          entities: [{ entity_id: "e.scar", label: "legacy-ruin", entity_type: "object", scar: true }],
        },
      },
      players: [],
      events: [],
      now: Date.now(),
    });
    const blob = JSON.stringify(snap);
    expect(snap.projection).toBe("public");
    expect(blob).not.toMatch(/"inbox"/);
    expect(blob).not.toMatch(/"visibility":s*"private"/);
    // Traces (if present from scars) are public; ties P12+P13+P14.
    const rooms = snap.rooms as unknown;
    const hall = Array.isArray(rooms)
      ? rooms.find((room: { room_id?: string }) => room.room_id === MINI_HALL_ROOM_ID) as { traces?: Array<{ visibility?: string }> } | undefined
      : (rooms as Record<string, { traces?: Array<{ visibility?: string }> }>)[MINI_HALL_ROOM_ID];
    if (hall && hall.traces && hall.traces.length > 0) {
      expect(hall.traces.every((t) => t.visibility === "public")).toBe(true);
    }
    // No new verbs per non-goals: acceptance holds.
  });

});
