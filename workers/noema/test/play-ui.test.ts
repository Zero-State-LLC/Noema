import { describe, expect, it } from "vitest";
import {
  BACKEND_GAPS,
  HOSTED_ACTIONS,
  containsHiddenHistory,
  deriveOpportunities,
  humanizeError,
  parsePlayCommand,
  playUiRuntimeSource,
  renderBondsHtml,
  renderPlayersHereHtml,
  renderServiceDesksHtml,
  resolveEntityTarget,
  routeDiagram,
  statusFromObservation,
  titleCaseLabel,
  trailFromResult,
} from "../src/play-ui";
import { playHtml } from "../src/play";
import { studyHtml } from "../src/study";

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

  it("projects self practice as Work rows and never as numbers", () => {
    const rows = statusFromObservation({
      world_name: "Test Reach",
      cycle: 4,
      location: GRID,
      practice_lines: [
        "You have been learning the rooms.",
        "You have been doing survey work.",
      ],
    });
    expect(rows.filter((r) => r.label === "Work").map((r) => r.value)).toEqual([
      "You have been learning the rooms.",
      "You have been doing survey work.",
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/XP|level|\b3\b track/i);
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

  it("parses repair/harvest/message/trade as Tier 1", () => {
    expect(parsePlayCommand("repair scarred-conduit", GRID.entities).ok).toBe(true);
    expect(parsePlayCommand("harvest market-post 2").ok).toBe(true);
    const msg = parsePlayCommand('message alice "hello"');
    expect(msg.ok).toBe(true);
    if (msg.ok) expect(msg.command).toBe("MESSAGE");
    const tr = parsePlayCommand("trade bob offer=energy:3 want=storage:1");
    expect(tr.ok).toBe(true);
    if (tr.ok) expect(tr.command).toBe("TRADE");
  });

  it("humanizes machine errors for players", () => {
    const h = humanizeError("BUDGET_EXCEEDED", "need energy");
    expect(h.primary).not.toBe("BUDGET_EXCEEDED");
    expect(h.primary.toLowerCase()).toMatch(/enough|resource|energy|budget/);
    expect(humanizeError("MOVE_REJECTED", "no exit").primary).toMatch(/cannot go/i);
  });

  it("derives local opportunities from observation", () => {
    const opps = deriveOpportunities(GRID);
    expect(opps.length).toBeGreaterThan(0);
    expect(opps.some((o) => /scarred|damage|failed/i.test(o.text))).toBe(true);
    expect(
      opps.every(
        (o) =>
          o.cmd.startsWith("inspect ") ||
          o.cmd.startsWith("move ") ||
          o.cmd.startsWith("repair ") ||
          o.cmd.startsWith("harvest ") ||
          o.cmd.startsWith("talk "),
      ),
    ).toBe(true);
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
    expect(HOSTED_ACTIONS).toContain("REPAIR");
    expect(HOSTED_ACTIONS).toContain("TRADE");
    expect(HOSTED_ACTIONS).toContain("ORG_CREATE");
    expect(BACKEND_GAPS).toContain("CONTEST_DECLARE");
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

  it("uses chamber workspace hierarchy", () => {
    expect(html).toMatch(/id="play-chamber"/);
    expect(html).toMatch(/WHERE/);
    expect(html).toMatch(/>HERE</);
    expect(html).toMatch(/>EXITS</);
    expect(html).toMatch(/id="cmd"/);
  });

  it("keeps command line and advanced details", () => {
    expect(html).toMatch(/id="cmd"/);
    expect(html).toMatch(/Advanced details/i);
    expect(html).toMatch(/id="token-paste"/);
  });

  it("avoids player-facing system jargon in primary chrome", () => {
    expect(html).not.toMatch(/PlayerPrincipal/);
    expect(html).not.toMatch(/Genesis/);
    expect(html).not.toMatch(/settlement internals/i);
    expect(html).toMatch(/WHERE/);
  });

  it("does not embed story seed ids in the shell", () => {
    expect(containsHiddenHistory(html)).toBe(false);
  });

  it("points production token hint at Admin Players", () => {
    expect(html).toMatch(/\/admin#players/);
    expect(html).toMatch(/id="play-health"/);
    expect(html).toMatch(/id="desk-list"/);
    expect(html).toMatch(/id="players-here"/);
    expect(html).toMatch(/id="bonds-card"/);
    expect(html).toMatch(/Leave world/);
  });

  it("embeds play-ui helpers instead of a forked copy", () => {
    expect(html).toContain("function deriveOpportunities");
    expect(html).toContain("function renderServiceDesksHtml");
    expect(playUiRuntimeSource()).toContain("function deriveOpportunities");
  });
});

describe("play-ui desks and players", () => {
  it("disables Talk when a World Service is UNAVAILABLE", () => {
    const html = renderServiceDesksHtml([
      {
        service_id: "service.contracts.01",
        display_name: "Contract Clerk",
        role: "agreements",
        status: "UNAVAILABLE",
        cannot: ["free-form legal authority"],
        line: "Agreement operations are not hosted.",
        suggested_cmds: [],
      },
    ]);
    expect(html).toMatch(/Talk unavailable/);
    expect(html).toMatch(/aria-disabled="true"/);
    expect(html).toMatch(/Cannot/);
    expect(html).not.toMatch(/data-cmd="talk contract clerk"/);
  });

  it("lists other players separately from objects", () => {
    const html = renderPlayersHereHtml([
      { player_id: "player.a", handle: "nacre" },
      { player_id: "player.b" },
    ]);
    expect(html).toMatch(/nacre/);
    expect(html).toMatch(/>b</);
    expect(html).toMatch(/aria-label="Other players"/);
    expect(html).toMatch(/Message nacre/);
    expect(html).toMatch(/Trade nacre/);
  });

  it("renders mail, trades, and orgs with honest empties", () => {
    const empty = renderBondsHtml({});
    expect(empty).toMatch(/No messages/);
    expect(empty).toMatch(/No open trades/);
    expect(empty).toMatch(/No public organizations/);
    expect(empty).toMatch(/Form organization/);
    const full = renderBondsHtml({
      messages: [{ message_id: "m1", sender_id: "player.a", text: "hello", delivered_cycle: 1 }],
      trades: [
        {
          trade_id: "trade.0001",
          proposer_id: "player.a",
          counterparty_id: "player.me",
          offered: { energy: 1 },
          requested: { compute: 1 },
          status: "OPEN",
          role: "counterparty",
        },
      ],
      organizations: [{ org_id: "org.x", name: "Compact", status: "ACTIVE", my_role: "member" }],
    });
    expect(full).toMatch(/hello/);
    expect(full).toMatch(/1 energy → 1 compute/);
    expect(full).toMatch(/accept trade\.0001/);
    expect(full).toMatch(/Compact/);
    expect(full).not.toMatch(/Leave Compact/);
    expect(full).not.toMatch(/data-cmd="leave /);
  });

  it("humanizes world-gate codes", () => {
    expect(humanizeError("WORLD_PAUSED", "paused").primary).toMatch(/paused/i);
    expect(humanizeError("WORLD_INCIDENT", "inc").primary).toMatch(/incident/i);
    expect(humanizeError("SETTLEMENT_BLOCKED", "block").primary).toMatch(/settlement|blocked/i);
  });
});

describe("STUDY stub", () => {
  it("is an honest not-open page without fake lab chrome", () => {
    const html = studyHtml();
    expect(html).not.toMatch(/id="m-trails"/);
    expect(html).toMatch(/not open/i);
    expect(html).not.toMatch(/aria-controls="panel-notice"/);
  });
});
