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

function doorOf(html: string): string {
  const i = html.indexOf('id="play-door"');
  if (i < 0) return "";
  const j = html.indexOf('id="play-chamber"', i);
  return j > i ? html.slice(i, j) : html.slice(i);
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
    expect(chamber).toContain('id="world-strip"');
    expect(chamber).toContain('id="signal-feed"');
    expect(chamber).toContain('id="action-rail"');
    expect(chamber).toContain("HERE");
    expect(chamber).toContain("EXITS");
    expect(chamber).toContain("AVAILABLE HERE");
    expect(chamber).toContain('id="rumor-list"');
    expect(chamber).toContain('id="comms-list"');
    expect(chamber).toContain('id="archive-list"');
    expect(chamber).toContain("Unconfirmed. A record says");
    expect(chamber).toContain('id="world-key"');
    expect(chamber).toContain("<summary>Key</summary>");
    expect(chamber).toContain('id="just-happened"');
    expect(html).toContain('id="handle"');
    expect(html).not.toContain('value="player1"');
  });

  it("declares a 640px mobile contract: 44px targets, 16px command, sticky composer", () => {
    expect(html).toMatch(/@media\(max-width:640px\)/);
    expect(html).toMatch(/min-height:44px/);
    expect(html).toMatch(/\.cmdform input[^}]*font-size:16px/);
    expect(html).toMatch(/\.ch-cmd\{[^}]*position:sticky/);
    expect(html).toMatch(/overflow-x:clip/);
  });

  it("first ninety: authed arrival skips the second door and silences ENTER/LOOK", () => {
    expect(chamber).toContain('id="arrive-handle"');
    expect(chamber).toContain("What should they call you here?");
    expect(html).toContain("is-arrive");
    expect(html).toContain("silent: true");
    expect(html).toMatch(/sendCommand\("enter", \{ silent: true \}\)/);
    expect(html).toMatch(/sendCommand\("look", \{ silent: true \}\)/);
    expect(html).toContain("firstSessionActs");
    expect(html).toContain("paintHappened");
    expect(html).toContain("applyDisclosure");
    expect(html).toContain("firstStrainLine");
    expect(html).toContain("BUDGET_EXCEEDED");
    expect(html).toContain("show-exits");
    expect(html).toContain("show-bonds");
    expect(chamber).toContain('id="strain-line"');
    expect(chamber).toContain('id="bite-status"');
    expect(chamber).not.toContain("Connect an agent");
  });

  it("phone Chamber is room + command; Here sheet closed", () => {
    expect(chamber).toContain('id="here-open"');
    expect(chamber).toContain('id="here-close"');
    expect(chamber).toContain('id="here-sheet"');
    expect(chamber).toContain('aria-expanded="false"');
    expect(chamber).toMatch(/aria-controls="here-sheet"/);
    expect(html).toMatch(/@media\(max-width:900px\)[\s\S]*#here-open\{[^}]*display:block/);
    expect(html).toMatch(/@media\(min-width:901px\)[\s\S]*#here-open\{[^}]*display:none/);
    expect(html).toMatch(/\.hint-more/);
    expect(html).toMatch(/@media\(max-width:900px\)[\s\S]*\.hint-more\{[^}]*display:none/);
    expect(html).toContain("trade nacre");
    expect(html).toMatch(/#trail li:nth-child\(n\+6\)/);
    expect(html).toContain("Escape");
    expect(html).toMatch(/\$\("cmd"\)\.focus/);
    expect(chamber).not.toMatch(/id="here-sheet"[^>]*\sopen\b/);
  });

  it("declares one-shot semantic motion and honors reduced-motion", () => {
    expect(html).toMatch(/animation:signal-in 200ms[^;]* 1 both/);
    expect(html).toMatch(/animation:threshold-in 240ms[^;]* 1 both/);
    expect(html).toMatch(/animation:panel-in 160ms[^;]* 1 both/);
    expect(html).toMatch(/transition:opacity 160ms/);
    expect(html).not.toMatch(/animation:[^;]*infinite/);
    expect(html).not.toMatch(/scanline/i);
    expect(html).not.toMatch(/glitch/i);
    expect(html).toContain("pulseThreshold");
    expect(html).toContain('classList.add("threshold-in")');
    expect(html).toMatch(
      /@media\(prefers-reduced-motion:reduce\)[\s\S]*#signal-feed li\.signal-new[\s\S]*animation:none!important;transition:none!important/,
    );
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

  it("door Advanced is a reachable token paste, not a hidden chamber control", () => {
    const door = doorOf(html);
    expect(door).toContain('id="token-paste"');
    expect(door).toMatch(/<details[\s\S]*id="token-paste"/);
    expect(door).not.toMatch(/id="token-primary"[^>]*\bhidden\b/);
    expect(door).not.toMatch(/<[^>]*\bhidden\b[^>]*id="token-paste"/);
    expect(door).not.toMatch(/id="token-paste"[^>]*\bhidden\b/);
    expect(chamber).toContain('id="token-paste-adv"');
    expect(chamber).not.toContain('id="token-paste"');
    expect(html).toContain("paste it under Advanced.");
    expect(html).not.toContain("paste it under Advanced details.");
  });

  it("colors the room name with primary text, not copper", () => {
    expect(html).toMatch(/#room-name\{[^}]*var\(--color-text-primary\)/);
    expect(html).not.toContain("var(--copper)");
  });
});

describe("look and trail text", () => {
  it("LOOK is a WHERE block with place roles, no exit essay when rail is open", () => {
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
    expect(playUiRuntimeSource()).toContain("const __name = function(fn) { return fn; }");
    expect(playUiRuntimeSource()).toContain("function lookCopyFromObservation");
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
    expect(html).toContain("tok-list");
    expect(html).not.toContain("ent-list");
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
    expect(html).toContain('await sendCommand("enter", { silent: true })');
    expect(html).toContain('await sendCommand("look", { silent: true })');
  });
  it("paints Chamber from stored token before health and enterWorld", () => {
    const boot = html.slice(html.lastIndexOf("(async () => {"));
    const getTok = boot.indexOf('sessionStorage.getItem("noema.play.token")');
    const paint = boot.indexOf("setSessionUi(true)");
    const health = boot.indexOf("/health");
    const enter = boot.indexOf("enterWorld");
    expect(getTok).toBeGreaterThanOrEqual(0);
    expect(paint).toBeGreaterThan(getTok);
    expect(health).toBeGreaterThan(paint);
    expect(enter).toBeGreaterThan(health);
    expect(html).toContain('classList.toggle("is-chamber"');
  });
  it("leave clears the play token", () => {
    expect(html).toContain('sessionStorage.removeItem("noema.play.token")');
  });
  it("sendCommand drops a rejected token to the door", () => {
    const start = html.indexOf("async function sendCommand");
    const end = html.indexOf("async function enterWorld", start);
    const send = html.slice(start, end > start ? end : undefined);
    expect(send).toContain('e.code === "NOT_AUTHORIZED"');
    expect(send).toContain("setSessionUi(false)");
    expect(send).toContain("state.token = null");
    expect(send).toContain('sessionStorage.removeItem("noema.play.token")');
    expect(html).toMatch(
      /sendCommand[\s\S]*NOT_AUTHORIZED[\s\S]*sessionStorage\.removeItem\("noema\.play\.token"\)[\s\S]*setSessionUi\(false\)/
    );
    // leave + sendCommand (+ enterWorld) all clear storage — not only leave
    const removes = html.match(/sessionStorage\.removeItem\("noema\.play\.token"\)/g) || [];
    expect(removes.length).toBeGreaterThanOrEqual(2);
  });
});
