import { describe, expect, it } from "vitest";
import {
  BACKEND_GAPS,
  HOSTED_ACTIONS,
  containsHiddenHistory,
  deriveOpportunities,
  humanizeError,
  lookCopyFromObservation,
  parsePlayCommand,
  playUiRuntimeSource,
  renderBondsHtml,
  renderEntityListHtml,
  renderLookHtml,
  renderPlayersHereHtml,
  renderServiceDesksHtml,
  renderTrailHtml,
  resolveEntityTarget,
  routeDiagram,
  statusFromObservation,
  titleCaseLabel,
  trailFromResult,
  waitingCopy,
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

  it("projects social memory as Tie rows without numbers", () => {
    const rows = statusFromObservation({
      world_name: "Test Reach",
      cycle: 4,
      location: GRID,
      social_memory_lines: ["You have found Vesper reliable in trade."],
    });
    expect(rows.filter((r) => r.label === "Tie").map((r) => r.value)).toEqual([
      "You have found Vesper reliable in trade.",
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/reputation|72/i);
  });

  it("does not put culture lines on STATUS Work/Tie rows", () => {
    const rows = statusFromObservation({
      world_name: "Test Reach",
      cycle: 4,
      location: GRID,
      culture_lines: ["This site has a maintenance custom."],
    });
    expect(rows.some((r) => String(r.value).includes("maintenance custom"))).toBe(false);
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
    expect(BACKEND_GAPS).not.toContain("AGREEMENT_FORM");
    expect(BACKEND_GAPS).not.toContain("AGREEMENT_TERMINATE");
    expect(BACKEND_GAPS).not.toContain("ACCESS_POLICY");
    expect(BACKEND_GAPS).not.toContain("CONTEST_DECLARE");
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

  it("keeps collapsed Advanced token paste for operator-issued tokens", () => {
    expect(html).toMatch(/id="token-primary"/);
    expect(html).toMatch(/id="token-paste"/);
    expect(html).toMatch(/operator-issued access token/i);
    expect(html).not.toMatch(/Admin → Players/);
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

  it("shims esbuild keepNames __name so inlined toPlayerView can run", () => {
    expect(html).toContain("const __name = function(fn) { return fn; }");
    expect(playUiRuntimeSource()).toContain("const __name = function(fn) { return fn; }");
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

  it("discloses another Player's public title without counts", () => {
    const html = renderPlayersHereHtml([
      {
        player_id: "player.sable",
        handle: "sable",
        public_practice_lines: ["sable is known for survey work."],
      },
    ]);
    expect(html).toMatch(/sable is known for survey work/);
    expect(html).not.toMatch(/XP|track\.surveyor/);
    const rows = statusFromObservation({
      world_name: "Test Reach",
      cycle: 4,
      location: GRID,
      players_here: [
        {
          player_id: "player.sable",
          handle: "sable",
          public_practice_lines: ["sable is known for survey work."],
        },
      ],
    });
    expect(rows.filter((r) => r.label === "Here").map((r) => r.value)).toEqual([
      "1",
      "sable is known for survey work.",
    ]);
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

  it("humanizes AUTHORITY_CONFLICT and parses office create scope args", () => {
    const h = humanizeError("AUTHORITY_CONFLICT", "Overlapping offices have no published precedence.");
    expect(h.primary).not.toBe("AUTHORITY_CONFLICT");
    expect(h.primary.toLowerCase()).toMatch(/precedence|object_set|office/);
    expect(h.advanced).toMatch(/AUTHORITY_CONFLICT/);
    const parsed = parsePlayCommand(
      'office create org.x name="Relay" profile=OPERATE_NAMED_ASSET object_set=entity.relay precedence=lead',
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.command).toBe("COMMIT");
      expect(parsed.arguments.object_set).toEqual(["entity.relay"]);
      expect(parsed.arguments.office_precedence).toBe("lead");
    }
  });
});

describe("play-ui HTML escaping", () => {
  const xss = '<img src=x onerror=alert(1)>';

  it("escapes player handles and mail text before innerHTML", () => {
    const players = renderPlayersHereHtml([{ player_id: "p1", handle: xss }]);
    expect(players).not.toContain("<img");
    expect(players).toContain("&lt;img");
    const mail = renderBondsHtml({
      messages: [{ message_id: "m1", sender_id: "p1", text: xss, delivered_cycle: 1 }],
    });
    expect(mail).not.toContain("<img");
    expect(mail).toContain("&lt;img");
  });

  it("escapes entity labels, org names, and trail titles", () => {
    const ents = renderEntityListHtml([{ entity_id: "e1", label: xss, entity_type: "RUIN" }]);
    expect(ents).not.toContain("<img");
    expect(ents).toContain("&lt;img");
    const orgs = renderBondsHtml({
      organizations: [{ org_id: "org.x", name: xss, status: "ACTIVE", my_role: "member" }],
    });
    expect(orgs).not.toContain("<img");
    expect(orgs).toContain("&lt;img");
    const trail = renderTrailHtml([{ kind: "you", title: xss, detail: xss }]);
    expect(trail).not.toContain("<img");
    expect(trail).toContain("&lt;img");
  });
});

const LOOK_OBS = {
  world_name: "Perihelion Reach",
  cycle: 0,
  sequence: 95,
  in_world: true,
  location: {
    room_id: "room.relay-quarter",
    name: "Relay Quarter",
    description: "A frontier station on the old commercial spine.",
    exits: [{ direction: "east", to_room_id: "room.transit-ring", to_room_name: "Coldline" }],
    entities: [] as Array<{ entity_id: string; label: string; entity_type: string }>,
  },
};

function evalPlayRuntime<T>(expr: string, extra = ""): T {
  const src = playUiRuntimeSource();
  return (0, eval)(`(function(){\n${src}\n${extra}\nreturn (${expr});\n})()`) as T;
}

describe("play HUD observation path", () => {
  it("renders a room name from a successful ENTER/LOOK observation", () => {
    const look = lookCopyFromObservation(LOOK_OBS);
    expect(look.roomName).toBe("Relay Quarter");
    expect(look.roomDesc).toMatch(/frontier station/i);
    expect(look.worldLine).toBe("Perihelion Reach");
    expect(`${look.worldLine} ${look.roomName} ${look.roomDesc}`).not.toContain("__name is not defined");

    const html = renderLookHtml({ name: look.roomName, description: look.roomDesc });
    expect(html).toContain("Relay Quarter");
    expect(html).toContain("frontier station");
    expect(html).not.toContain("__name is not defined");

    const trail = trailFromResult({
      display: "You look around.",
      command: "LOOK",
      ok: true,
      observation: LOOK_OBS,
    });
    expect(trail.some((t) => t.kind === "local" && /Relay Quarter/.test(t.title))).toBe(true);
    expect(JSON.stringify(trail)).not.toContain("__name is not defined");
  });

  it("never paints __name is not defined into WHERE or trail", () => {
    const leaked = "__name is not defined";
    expect(humanizeError(undefined, leaked).primary).not.toContain("__name");
    expect(humanizeError(undefined, leaked).primary).toMatch(/could not show that place/i);
    expect(humanizeError(undefined, leaked).advanced).toMatch(/INTERNAL/);
    expect(humanizeError("COMMAND_FAILED", leaked).primary).not.toContain("__name");
    expect(waitingCopy({ message: leaked, worldName: "Perihelion Reach" }).roomDesc).not.toContain(
      "__name",
    );
    expect(lookCopyFromObservation(null, { message: leaked }).roomDesc).not.toContain("__name");
    expect(lookCopyFromObservation(LOOK_OBS, { message: leaked }).roomName).toBe("Relay Quarter");
    const fail = trailFromResult({
      display: "look",
      command: "LOOK",
      ok: false,
      errorPrimary: leaked,
    });
    expect(fail[0].kind).toBe("fail");
    expect(fail[0].title).not.toContain("__name");
  });

  it("evals the inlined runtime with wrangler keepNames __name and paints the room", () => {
    const extra = `
      const cleanLive = /* @__PURE__ */ __name((arr) => (arr || []).map((l) => String(l || "").trim()).filter(Boolean), "clean");
      if (cleanLive(["Relay Quarter"])[0] !== "Relay Quarter") throw new Error("shim failed");
    `;
    const painted = evalPlayRuntime<{
      view: { locationName: string; locationDescription: string };
      look: string;
      wait: { roomDesc: string };
      trail: Array<{ kind: string; title: string }>;
    }>(
      `{
        view: toPlayerView(${JSON.stringify(LOOK_OBS)}),
        look: renderLookHtml({ name: "Relay Quarter", description: "A frontier station on the old commercial spine." }),
        wait: waitingCopy({ message: "__name is not defined", worldName: "Perihelion Reach" }),
        trail: trailFromResult({ display: "look", command: "LOOK", ok: true, observation: ${JSON.stringify(LOOK_OBS)} })
      }`,
      extra,
    );
    expect(painted.view.locationName).toBe("Relay Quarter");
    expect(painted.view.locationDescription).toMatch(/frontier station/i);
    expect(painted.look).toContain("Relay Quarter");
    expect(painted.wait.roomDesc).not.toContain("__name");
    expect(painted.trail.some((t) => /Relay Quarter/.test(t.title))).toBe(true);
    expect(JSON.stringify(painted)).not.toContain("__name is not defined");
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
