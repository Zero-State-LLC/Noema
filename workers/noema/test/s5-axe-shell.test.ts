/**
 * #783 automated shell check. jsdom plus axe-core, not a screen reader,
 * not a native keyboard pass, and not a contrast measurement.
 */
import { JSDOM } from "jsdom";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { landingHtml } from "../src/landing";
import { watchHtml } from "../src/watch";

const DISABLED = ["color-contrast", "color-contrast-enhanced"];

async function seriousViolations(html: string) {
  const staticHtml = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const dom = new JSDOM(staticHtml, { url: "https://noema.local/watch", runScripts: "dangerously" });
  const script = dom.window.document.createElement("script");
  script.textContent = axe.source;
  dom.window.document.head.appendChild(script);
  const runner = (dom.window as unknown as { axe: typeof axe }).axe;
  const results = await new Promise<axe.AxeResults>((resolve, reject) => {
    runner.run(
      dom.window.document,
      { rules: Object.fromEntries(DISABLED.map((id) => [id, { enabled: false }])) },
      (err, out) => (err ? reject(err) : resolve(out)),
    );
  });
  const found = results.violations
    .filter((row) => row.impact === "critical" || row.impact === "serious")
    .map((row) => ({ id: row.id, impact: row.impact, nodes: row.nodes.length }));
  dom.window.close();
  return found;
}

describe("#783 axe shell", () => {
  it("WATCH shell has no serious or critical axe violations aside from unmeasured contrast", async () => {
    expect(await seriousViolations(watchHtml())).toEqual([]);
  });

  it("Home shell has no serious or critical axe violations aside from unmeasured contrast", async () => {
    expect(await seriousViolations(landingHtml())).toEqual([]);
  });
});
