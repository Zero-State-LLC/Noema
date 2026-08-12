import { describe, expect, it } from "vitest";
import {
  BACKEND_GAPS,
  HOSTED_ACTIONS,
  containsHiddenHistory,
  deriveOpportunities,
  humanizeError,
  parsePlayCommand,
  resolveEntityTarget,
  routeDiagram,
  statusFromObservation,
  titleCaseLabel,
  trailFromResult,
} from "../src/play-ui";
import { playHtml } from "../src/play";

const GRID: Parameters<typeof deriveOpportunities>[0] = {
  room_id: "room.relay-quarter",
  name: "Grid Anchor",
  description:
    "A frontier anchor on the old commercial spine. Advanced systems, poor maintenance, contested access.",
  condition: "Infrastructure shows damage.",
  exits: [
    { direction: "east", to_room_id: "room.transit-ring", to_room_name: "Coldline" },
    { direction: "south", to_room_id: "room.civic-exchange", to_room_name: "Contract Town" },
  ],
  entities: [
    { entity_id: "entity.relay-7", label: "scarred-conduit", entity_type: "INFRASTRUCTURE" },
    { entity_id: "entity.scar-conduit", label: "failed-claim", entity_type: "RUIN" },
  ],
};

describe("play-ui helpers", () => {
  it("titles entity labels for humans", () => {
    expect(titleCaseLabel("scarred-conduit")).toBe("Scarred Conduit");
  });

  it("resolves human-readable inspect targets", () => {
    const ents = GRID.entities;
    expect(resolveEntityTarget("scarred conduit", ents)?.entity_id).toBe("entity.relay-7");
    expect(resolveEntityTarget("Scarred Conduit", ents)?.entity_id).toBe("entity.relay-7");
    expect(resolveEntityTarget("entity.relay-7", ents)?.entity_id).toBe("entity.relay-7");
    expect(resolveEntityTarget("missing thing", ents)).toBeNull();
  });

  it("parses commands without controller selector", () => {
    const p = parsePlayCommand("inspect scarred conduit", GRID.entities);
    expect(p.ok).toBe(true);
    if (p.ok) {
      expect(p.command).toBe("INSPECT");
      expect(p.arguments.entity_id).toBe("entity.relay-7");
    }
    const m = parsePlayCommand("move east");
    expect(m.ok && m.command).toBe("MOVE");
  });

  it("does not pretend strategic verbs work when hosted gap", () => {
    const r = parsePlayCommand("repair relay");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.toLowerCase()).toMatch(/not available/);
  });

  it("humanizes machine errors for players", () => {
    const h = humanizeError("PRECONDITION_FAILED", "need energy");
    expect(h.primary).not.toBe("PRECONDITION_FAILED");
    expect(h.primary.toLowerCase()).toMatch(/cannot|yet|blocked|need/);
    expect(humanizeError("MOVE_REJECTED", "no exit").primary).toMatch(/cannot go/i);
  });

  it("derives local opportunities from observation", () => {
    const opps = deriveOpportunities(GRID);
    expect(opps.length).toBeGreaterThan(0);
    expect(opps.some((o) => /scarred|damage|failed/i.test(o.text))).toBe(true);
    expect(opps.every((o) => o.cmd.startsWith("inspect ") || o.cmd.startsWith("move "))).toBe(true);
  });

  it("builds a minimal route diagram from exits", () => {
    const d = routeDiagram("Grid Anchor", GRID.exits);
    expect(d.hasRoutes).toBe(true);
    const text = d.lines.join("\n");
    expect(text).toMatch(/YOU/);
    expect(text).toMatch(/Coldline|Contract Town/);
  });

  it("status surface uses only known observation fields", () => {
    const rows = statusFromObservation({
      world_name: "Perihelion Reach",
      cycle: 0,
      sequence: 9,
      location: GRID,
    });
    expect(rows.some((r) => r.label === "World" && r.value === "Perihelion Reach")).toBe(true);
    expect(rows.some((r) => r.label === "Place")).toBe(true);
    expect(JSON.stringify(rows)).not.toMatch(/Energy|Storage/);
  });

  it("trail distinguishes you / local / fail", () => {
    const ok = trailFromResult({
      display: "You inspect Scarred Conduit.",
      command: "INSPECT",
      ok: true,
      observation: {
        location: {
          ...GRID,
          description: GRID.description + " You inspect scarred conduit: damaged infrastructure.",
        },
      },
    });
    expect(ok[0].kind).toBe("you");
    expect(ok.some((t) => t.kind === "local")).toBe(true);
    const fail = trailFromResult({
      display: "You move north.",
      command: "MOVE",
      ok: false,
      errorPrimary: "You cannot go that way from here.",
    });
    expect(fail[0].kind).toBe("fail");
  });

  it("redaction helper catches genesis seeds", () => {
    expect(containsHiddenHistory("OLD_TRADE_NETWORK")).toBe(true);
    expect(containsHiddenHistory("Grid Anchor")).toBe(false);
  });

  it("documents hosted vs gap actions", () => {
    expect(HOSTED_ACTIONS).toContain("INSPECT");
    expect(BACKEND_GAPS).toContain("REPAIR");
    expect(BACKEND_GAPS).toContain("TRADE_PROPOSE");
  });
});

describe("play shell HTML", () => {
  const html = playHtml();

  it("removes controller selector from normal PLAY", () => {
    expect(html).not.toMatch(/id="ctype"/);
    expect(html).not.toMatch(/<option value="agent"/);
    expect(html).toMatch(/Enter world/);
    expect(html).toMatch(/\/connect/);
  });

  it("uses the five-section information hierarchy", () => {
    expect(html).toMatch(/What is here/i);
    expect(html).toMatch(/What matters here/i);
    expect(html).toMatch(/What you can do/i);
    expect(html).toMatch(/What just happened/i);
    expect(html).toMatch(/loc-name|Current condition/i);
  });

  it("keeps command line and advanced details", () => {
    expect(html).toMatch(/id="cmd"/);
    expect(html).toMatch(/Advanced details/i);
    expect(html).toMatch(/id="token-paste"/);
  });

  it("avoids player-facing system jargon in primary chrome", () => {
    // Primary headings / lead should not push Chamber / Genesis / settlement
    expect(html).not.toMatch(/PlayerPrincipal/);
    expect(html).not.toMatch(/Genesis/);
    expect(html).not.toMatch(/settlement internals/i);
    // Lead copy
    expect(html).toMatch(/Read the place/);
  });

  it("does not embed story seed ids in the shell", () => {
    expect(containsHiddenHistory(html)).toBe(false);
  });
});
