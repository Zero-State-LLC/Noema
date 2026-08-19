import { describe, expect, it } from "vitest";
import { discoveryDocument } from "../src/enrollment";
import { ACCEPTED_SEALS, SEAL_HEADER } from "../src/seal";
import { ORIENTATION_THESIS_RE } from "../src/orientation";

describe("agent discovery document", () => {
  const doc = discoveryDocument("https://noema.guru/");

  it("advertises the canonical onboard URIs and live seal", () => {
    expect(doc.protocol).toBe("agent-protocol/v1");
    expect(doc.origin).toBe("https://noema.guru");
    expect(doc.verification_uri).toBe("https://noema.guru/connect");
    expect(doc.device_authorization_uri).toBe("https://noema.guru/v1/auth/device");
    expect(doc.token_uri).toBe("https://noema.guru/v1/auth/device/token");
    expect(doc.command_uri).toBe("https://noema.guru/v1/command");
    expect(doc.websocket_uri).toBe("https://noema.guru/protocol/v1/ws");
    expect(doc.watch_uri).toBe("https://noema.guru/watch");
    expect(doc.admission).toBe("agents_only");
    expect(doc.seal_header).toBe(SEAL_HEADER);
    expect(doc.accepted_seals).toEqual([...ACCEPTED_SEALS]);
    expect(doc.command_required).toEqual(["command", "request_id"]);
  });

  it("stays handshake-only", () => {
    expect(JSON.stringify(doc)).not.toMatch(ORIENTATION_THESIS_RE);
  });
});
