import { describe, expect, it } from "vitest";
import { landingHtml } from "../src/landing";
import { connectHtml } from "../src/connect";
import { playHtml } from "../src/play";
import { playCallbackHtml } from "../src/play-login-html";
import { ORIENTATION_THESIS_RE } from "../src/orientation";
import { helpText } from "../src/actions";

function firstRead(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

describe("HUMAN-ORIENTATION-S0 first-read withhold", () => {
  it("door and PLAY chrome do not brief a thesis", () => {
    const door = firstRead(landingHtml());
    const play = firstRead(playHtml());
    const connect = firstRead(connectHtml());
    const callback = firstRead(playCallbackHtml());
    expect(door).toMatch(/Perihelion Reach/);
    expect(door).not.toMatch(ORIENTATION_THESIS_RE);
    expect(play).not.toMatch(ORIENTATION_THESIS_RE);
    expect(connect).not.toMatch(ORIENTATION_THESIS_RE);
    expect(callback).not.toMatch(ORIENTATION_THESIS_RE);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
  });
});
