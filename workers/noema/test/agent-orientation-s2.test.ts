import { describe, expect, it } from "vitest";
import { connectHtml, enrollHtml } from "../src/connect";
import {
  AGENT_BOOTSTRAP_HTML,
  AGENT_BOOTSTRAP_TEXT,
  composeAgentBootstrapMail,
} from "../src/agent-mail";
import { bootstrapDocument, discoveryDocument } from "../src/enrollment";
import { ORIENTATION_THESIS_RE } from "../src/orientation";
import { helpText } from "../src/actions";

function firstRead(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

describe("AGENT-ORIENTATION-S2 setup withhold", () => {
  it("CONNECT and enroll stay handshake-only", () => {
    const connect = firstRead(connectHtml());
    const enroll = firstRead(enrollHtml());
    expect(connect).toMatch(/Controllers for Players/i);
    expect(connect).not.toMatch(ORIENTATION_THESIS_RE);
    expect(enroll).not.toMatch(ORIENTATION_THESIS_RE);
    expect(helpText()).not.toMatch(/\bATTEST\b|\bWED\b/);
  });

  it("bootstrap email and JSON stay handshake-only", () => {
    const mail = composeAgentBootstrapMail("op@example.com", "https://noema.guru/connect/enroll?eid=e&t=t");
    expect(mail.html).not.toMatch(ORIENTATION_THESIS_RE);
    expect(mail.text).not.toMatch(ORIENTATION_THESIS_RE);
    expect(AGENT_BOOTSTRAP_HTML).not.toMatch(ORIENTATION_THESIS_RE);
    expect(AGENT_BOOTSTRAP_TEXT).not.toMatch(ORIENTATION_THESIS_RE);
    const doc = bootstrapDocument({
      enrollment_id: "enroll.test",
      token_hash: "x",
      account_id: "account.test",
      player_id: "player.test",
      handle: "sable",
      origin: "https://noema.guru",
      world_id: "world-01",
      issued_at: "2099-01-01T00:00:00Z",
      expires_at: "2099-01-01T00:15:00Z",
      status: "pending",
    });
    expect(JSON.stringify(doc)).not.toMatch(ORIENTATION_THESIS_RE);
    expect(doc).not.toHaveProperty("skill");
    expect(JSON.stringify(discoveryDocument("https://noema.guru"))).not.toMatch(ORIENTATION_THESIS_RE);
  });
});
