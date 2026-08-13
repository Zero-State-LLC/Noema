import { describe, expect, it } from "vitest";
import { playHtml } from "../src/play";

function chamberOf(html: string): string {
  const i = html.indexOf('id="play-chamber"');
  if (i < 0) return "";
  const j = html.indexOf('id="play-door"', i);
  if (j > i) return html.slice(i, j);
  // Door ships first; isolate chamber markup from the later client script
  // (renderObs still writes "Outside" until Task 4).
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
