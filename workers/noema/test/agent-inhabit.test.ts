import { describe, expect, it } from "vitest";
import { agentInhabitSnippet, LIVE_AGENT_SEAL } from "../src/agent-inhabit";
import { adminHtml } from "../src/admin";
import { connectHtml, enrollHtml } from "../src/connect";
import { ACCEPTED_SEALS } from "../src/seal";

describe("agent inhabit snippet", () => {
  it("emits seal, request_id, and ENTER_WORLD without a hardcoded host", () => {
    const snip = agentInhabitSnippet({
      base: "http://127.0.0.1:8787",
      token: "tok.example",
    });
    expect(LIVE_AGENT_SEAL).toBe(ACCEPTED_SEALS[0]);
    expect(snip).toContain("export NOEMA_BASE=http://127.0.0.1:8787");
    expect(snip).toContain("export TOKEN=tok.example");
    expect(snip).toContain(`export NOEMA_SEAL=${LIVE_AGENT_SEAL}`);
    expect(snip).toContain("x-noema-seal");
    expect(snip).toContain('"request_id":"1"');
    expect(snip).toContain('"command":"ENTER_WORLD"');
    expect(snip).not.toContain("https://noema.guru");
    expect(snip).not.toContain("/v1/auth/device/token");
  });
});

describe("CONNECT inhabit contract", () => {
  it("shows the live inhabit curl on the token door", () => {
    const html = connectHtml();
    expect(html).toContain("ENTER_WORLD");
    expect(html).toContain("request_id");
    expect(html).toContain("x-noema-seal");
    expect(html).toContain(LIVE_AGENT_SEAL);
    expect(html).toContain("controller_type: \"agent\"");
    expect(html).not.toMatch(/export NOEMA_BASE=https:\/\/noema\.guru/);
    expect(html).not.toContain("POST /v1/auth/device/token");
    expect(html).toContain("connect-work");
    expect(html).toContain('id="play-chamber"');
    expect(html).toContain("Enter world");
    expect(enrollHtml()).toContain(LIVE_AGENT_SEAL);
    expect(enrollHtml()).toContain("ENTER_WORLD");
  });

  it("admin mint is inhabit copy, not a PLAY command box", () => {
    const html = adminHtml();
    expect(html).toContain("ENTER_WORLD");
    expect(html).toContain(LIVE_AGENT_SEAL);
    expect(html).toContain("humans watch — this token cannot command");
    expect(html).toContain("function inhabitSnippet(token)");
    expect(html).not.toContain('id="cmd"');
    expect(html).not.toMatch(/api\("\/v1\/command"/);
    expect(html).not.toMatch(/fetch\("\/v1\/command"/);
    expect(html).not.toMatch(/export NOEMA_BASE=https:\/\/noema\.guru/);
  });
});
