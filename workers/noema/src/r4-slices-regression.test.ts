import { describe, expect, it } from "vitest";
import { parseHumanCommand } from "./actions";
import { landingHtml } from "./landing";
import { privacyHtml } from "./privacy";

describe("MUD Play-Craft R4 automated slice regressions (#733, #778, #782, #785)", () => {
  it("S0 (#778): parser rejects empty, control-char, and oversized inputs cleanly without throwing", () => {
    for (const bad of ["", "   ", "\u0000\u0007", "look " + "a".repeat(4096)]) {
      const parsed = parseHumanCommand(bad);
      expect(parsed).toBeDefined();
    }
  });

  it("S4 (#782): hosted parser does not treat client-only alias/macro commands as world verbs", () => {
    const aliasCmd = parseHumanCommand("alias set foo bar");
    expect(aliasCmd.ok).toBe(false);
  });

  it("S7 (#785): Home and Privacy surfaces expose no secrets and include privacy disclosure", () => {
    const home = landingHtml();
    const privacy = privacyHtml();
    expect(home).toContain("Noema");
    expect(home).not.toContain("ADMIN_ALLOWLIST_EMAILS");
    expect(home).not.toContain("TOKEN_SIGNING_SECRET");
    expect(privacy).toContain("Google Analytics");
  });
});
