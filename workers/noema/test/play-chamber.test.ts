import { describe, expect, it } from "vitest";
import { playHtml } from "../src/play";
import {
  renderLookHtml,
  renderTrailHtml,
  playUiRuntimeSource,
  renderExitTokensHtml,
  renderEntityListHtml,
  renderOpportunitiesHtml,
  renderPlayersHereHtml,
} from "../src/play-ui";

function chamberOf(html: string): string {
  const i = html.indexOf('id="play-chamber"');
  if (i < 0) return "";
  const j = html.indexOf('id="play-door"', i);
  if (j > i) return html.slice(i, j);
  // Door ships first; isolate chamber markup from the later client script.
  const script = html.indexOf("<script", i);
  return script > i ? html.slice(i, script) : html.slice(i);
}

describe("play chamber HTML", () => {
  const html = playHtml();
  const chamber = chamberOf(html);

  it("ships door + chamber; body is not in chamber by default", () => {
    expect(html).toContain('id="play-door"');
    expect(html).toContain('id="play-chamber"');
    expect(html).not.toMatch(/<body[^>]*class="[^"]*is-chamber/);
    expect(html).toContain("/v1/play/login/request");
    expect(html).not.toContain("/v1/admin/login/request");
  });

  it("hides chamber until body.is-chamber", () => {
    expect(html).toMatch(/#play-chamber\{[^}]*display:\s*none/);
    expect(html).toMatch(/body\.is-chamber\s+#play-chamber/);
    expect(html).toMatch(/body\.is-chamber\s+\.top/);
    expect(html).toMatch(/body\.is-chamber\s+\.foot/);
  });

  it("chamber has masthead, scrollback, rail, composer", () => {
    expect(chamber).toContain("ch-mast");
    expect(chamber).toContain("ch-scroll");
    expect(chamber).toContain("ch-rail");
    expect(chamber).toContain('id="cmd"');
    expect(chamber).toContain('id="leave"');
    expect(chamber).toContain('id="trail"');
    expect(chamber).toContain('id="exit-list"');
    expect(chamber).toContain("HERE");
    expect(chamber).toContain("EXITS");
  });

  it("chamber default copy is not Outside / Enter world", () => {
    expect(chamber).not.toMatch(/Outside/);
    expect(chamber).not.toMatch(/Enter world/);
    expect(html).toMatch(/Enter world/);
  });

  it("defines syntax color roles", () => {
    expect(html).toContain(".role-place");
    expect(html).toContain(".role-you");
    expect(html).toContain(".role-here");
    expect(html).toContain(".role-fail");
    expect(html).toContain(".role-ok");
  });
});

describe("look and trail text", () => {
  it("LOOK is a WHERE block with copper roles, no exit essay when rail is open", () => {
    const html = renderLookHtml({
      name: "The Broken Exchange",
      description: "Dust, copper, a stalled ledger.",
      condition: "crane seized · repairable",
    });
    expect(html).toContain("WHERE");
    expect(html).toContain("role-place");
    expect(html).toContain("The Broken Exchange");
    expect(html).toContain("Dust, copper");
    expect(html).toContain("CONDITION");
    expect(html).toContain("crane seized");
    expect(html).not.toMatch(/east →/);
  });

  it("LOOK appends exits line only when asked (mobile rail collapsed)", () => {
    const html = renderLookHtml({
      name: "Quay",
      description: "Water.",
      exitsLine: "east · quay",
    });
    expect(html).toContain("exits: east · quay");
  });

  it("trail rows use the four kinds and role classes", () => {
    const html = renderTrailHtml([
      { kind: "you", title: "look" },
      { kind: "local", title: "nacre is here" },
      { kind: "world", title: "The crane ticks once and stops." },
      { kind: "fail", title: "Not enough energy.", detail: "energy 0" },
    ]);
    expect(html).toContain("role-you");
    expect(html).toContain("role-here");
    expect(html).toContain("role-fail");
    expect(html).toContain("YOU");
    expect(html).toContain("LOCAL");
    expect(html).toContain("WORLD");
    expect(html).toContain("FAIL");
    expect(html).toContain("look");
    expect(html).toContain("energy 0");
    expect(html).not.toContain("CONTEST_DECLARE");
  });

  it("serializes the new helpers into the page runtime", () => {
    expect(playUiRuntimeSource()).toContain("function renderLookHtml");
    expect(playUiRuntimeSource()).toContain("function renderTrailHtml");
  });
});

describe("rail tokens", () => {
  it("exits are teal data-cmd tokens", () => {
    const html = renderExitTokensHtml([
      { direction: "east", to_room_id: "room.quay", to_room_name: "Quay" },
    ]);
    expect(html).toContain('data-cmd="move east"');
    expect(html).toContain("role-here");
    expect(html).toContain("east");
    expect(html).not.toMatch(/class="btn move"/);
  });

  it("entities are tokens with inspect/repair cmds", () => {
    const html = renderEntityListHtml([
      {
        entity_id: "e1",
        label: "crane",
        entity_type: "fixture",
        repairable: true,
      },
    ]);
    expect(html).toContain('data-cmd="inspect crane"');
    expect(html).toContain('data-cmd="repair crane"');
    expect(html).toContain("role-here");
    expect(html).not.toMatch(/class="ent"/);
    expect(html).not.toMatch(/class="glyph"/);
  });

  it("opportunities are tokens not opp cards", () => {
    const html = renderOpportunitiesHtml({
      room_id: "room.x",
      name: "X",
      description: "",
      exits: [{ direction: "east", to_room_id: "room.y", to_room_name: "Y" }],
      entities: [],
    });
    expect(html).toContain("data-cmd=");
    expect(html).not.toMatch(/class="opp"/);
  });

  it("players here stay message/trade cmds as tokens", () => {
    const html = renderPlayersHereHtml([{ player_id: "p1", handle: "nacre" }]);
    expect(html).toContain("nacre");
    expect(html).toContain("data-cmd=");
    expect(html).toContain("role-here");
    expect(html).not.toMatch(/class="ent player-here"/);
  });
});

describe("chamber client session", () => {
  const html = playHtml();
  it("toggles is-chamber and never paints Outside in the empty LOOK", () => {
    expect(html).toContain('classList.toggle("is-chamber"');
    expect(html).toContain('id="ch-cycle"');
    expect(html).not.toMatch(/textContent = "Outside"/);
    expect(html).not.toMatch(/Nothing visible until you enter/);
  });
  it("still auto-enters when noema.play.token is set", () => {
    expect(html).toContain('sessionStorage.getItem("noema.play.token")');
    expect(html).toContain("enterWorld(tok)");
    expect(html).toContain('await sendCommand("enter")');
    expect(html).toContain('await sendCommand("look")');
  });
  it("leave clears the play token", () => {
    expect(html).toContain('sessionStorage.removeItem("noema.play.token")');
  });
});
