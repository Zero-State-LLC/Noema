import { describe, expect, it } from "vitest";
import { connectHtml } from "../src/connect";
import worker from "../src/index";
import type { Env } from "../src/types";

/** Inline CONNECT scripts. Index scan, not a tag-filter regexp. */
function scriptOf(html: string): string {
  const chunks: string[] = [];
  const lower = html.toLowerCase();
  let from = 0;
  while (from < html.length) {
    const open = lower.indexOf("<script", from);
    if (open === -1) break;
    const openEnd = html.indexOf(">", open);
    if (openEnd === -1) break;
    const close = lower.indexOf("</script", openEnd + 1);
    if (close === -1) break;
    chunks.push(html.slice(openEnd + 1, close));
    from = close + "</script".length;
  }
  return chunks.join("\n");
}

describe("PROMETHEUS Slice B — CONNECT enroll honesty", () => {
  it("treats the short code as the primary path when review email cannot send", () => {
    const html = connectHtml();
    expect(html).toContain("<h2>Enter the short code</h2>");
    expect(html).toContain("Agents inhabit this world. Humans approve.");
    expect(html).toContain("Enter the short code the agent printed.");
    expect(html.indexOf("<h2>Enter the short code</h2>")).toBeLessThan(html.indexOf("Sign up"));
    expect(html.indexOf("<h2>Enter the short code</h2>")).toBeLessThan(html.indexOf("pipx install noema-client"));
    expect(html).not.toContain("Fallback: enter the short code");
    expect(html).not.toContain("That is the primary path.");
    expect(html).not.toMatch(/one-click/i);
    expect(html).not.toContain("The primary path is one command:");
    expect(html).toContain("not live until the review mailer can send");
    expect(html).toMatch(/<pre id="cli-install"><code>pipx install noema-client\nnoema connect<\/code><\/pre>/);
    expect(html).not.toMatch(/<pre id="cli-install"><code>pipx install noema-client\nnoema connect --email/);
  });

  it("does not claim one-click email even when review mail can send", () => {
    const html = connectHtml(false, null, { reviewEmailReady: true });
    expect(html).toContain("<h2>Enter the short code</h2>");
    expect(html).not.toMatch(/one-click/i);
    expect(html).not.toContain("That is the primary path.");
    expect(html).not.toContain("Fallback: enter the short code");
    expect(html).toContain("noema connect --email owner@example.com");
    expect(html).toContain("Opening that link does not approve");
    expect(html).toMatch(/<pre id="cli-install"><code>pipx install noema-client\nnoema connect<\/code><\/pre>/);
  });

  it("preview and approve copy name the controller, display code, and 5s poll", () => {
    const html = connectHtml();
    const script = scriptOf(html);
    expect(script).toContain('row("Code"');
    expect(script).toContain('row("Controller"');
    expect(script).toContain('row("Status"');
    expect(script).toContain('row("Expires"');
    expect(script).toContain('row("Runtime"');
    expect(script).toContain('Approved controller "');
    expect(script).toContain("polls every 5 seconds or less");
    expect(html).not.toContain("Agent approved. Return to the agent terminal.");
  });

  it("does not auto-drive a stale saved code into the approve path", () => {
    const html = connectHtml();
    const script = scriptOf(html);
    expect(script).not.toContain('location.replace("/connect?connect_code=" + encodeURIComponent(saved))');
    expect(script).not.toMatch(/if \(saved && !deep\) \{\s*location\.replace/);
    expect(html).toContain("Look up saved code");
    expect(html).toContain("Clear saved code");
    expect(script).toContain("This page will not approve it automatically.");
    expect(script).toContain("function showSavedPrompt");
    expect(script).toMatch(/if \(deep\) \{[\s\S]*lookup\(\);[\s\S]*\} else if \(saved\) \{[\s\S]*showSavedPrompt\(saved\)/);
    expect(script).not.toMatch(/const pending = deep \|\| saved;[\s\S]*lookup\(\)/);
  });

  it("GET /connect without review secrets serves the unconfigured short-code copy", async () => {
    const env = { NOEMA_ENV: "production" } as unknown as Env;
    const res = await worker.fetch(new Request("https://noema.guru/connect"), env);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("Enter the short code");
    expect(html).not.toContain("Fallback: enter the short code");
    expect(html).not.toMatch(/one-click/i);
    expect(html).toContain("not live until the review mailer can send");
  });
});
