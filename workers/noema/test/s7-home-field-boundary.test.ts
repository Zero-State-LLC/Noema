/**
 * #785 T7.3 local field boundary. Not a hosted readback and not a human first-read.
 */
import { describe, expect, it } from "vitest";
import { homeExcerptFromLive } from "../src/landing";

describe("#785 home excerpt field boundary", () => {
  it("reads public lines and drops private, research, and command fields", () => {
    const lines = homeExcerptFromLive({
      private_message: "secret-body-sentinel",
      research: { score: 400, label: "hidden-research-score" },
      command: "MOVE",
      narrative: {
        now: { line: "The relay dimmed.", research_score: 400, text: "secret-body-sentinel" },
        recently: [{ line: "A plate remains.", xp: 12, message: "secret-body-sentinel" }],
        world: { players_present: 0 },
      },
    });
    const joined = lines.join("\n");
    expect(joined).toContain("The relay dimmed.");
    expect(joined).toContain("A plate remains.");
    expect(joined).not.toMatch(/secret-body-sentinel|hidden-research-score|research_score|\bxp\b|MOVE/);
  });
});
