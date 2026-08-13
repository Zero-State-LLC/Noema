import { describe, expect, it } from "vitest";
import {
  applyControllingSession,
  isMutatingCommand,
  mutationBlocked,
  nextSettlementHealth,
} from "../src/ops";

describe("command mutation class", () => {
  it("treats LOOK/INSPECT/HELP as non-mutating", () => {
    expect(isMutatingCommand("LOOK")).toBe(false);
    expect(isMutatingCommand("inspect relay")).toBe(false);
    expect(isMutatingCommand("HELP")).toBe(false);
  });

  it("treats MOVE/MESSAGE/TRADE/COMMIT as mutating", () => {
    expect(isMutatingCommand("MOVE")).toBe(true);
    expect(isMutatingCommand("message nacre hi")).toBe(true);
    expect(isMutatingCommand("TRADE")).toBe(true);
    expect(isMutatingCommand("COMMIT")).toBe(true);
  });
});

describe("PAUSED / INCIDENT / settlement bound", () => {
  it("rejects mutation while PAUSED", () => {
    const g = mutationBlocked("PAUSED", "HEALTHY");
    expect(g?.code).toBe("WORLD_PAUSED");
  });

  it("rejects mutation while INCIDENT", () => {
    expect(mutationBlocked("INCIDENT", "HEALTHY")?.code).toBe("WORLD_INCIDENT");
  });

  it("allows mutation while ACTIVE and HEALTHY", () => {
    expect(mutationBlocked("ACTIVE", "HEALTHY")).toBeNull();
  });

  it("allows one additional mutating batch after first settle fail", () => {
    expect(nextSettlementHealth("HEALTHY", false)).toBe("DEGRADED");
    expect(mutationBlocked("ACTIVE", "DEGRADED")).toBeNull();
    expect(nextSettlementHealth("DEGRADED", false)).toBe("BLOCKING");
    expect(mutationBlocked("ACTIVE", "BLOCKING")?.code).toBe("SETTLEMENT_BLOCKED");
  });

  it("returns HEALTHY after a successful settle", () => {
    expect(nextSettlementHealth("DEGRADED", true)).toBe("HEALTHY");
    expect(nextSettlementHealth("BLOCKING", true)).toBe("HEALTHY");
  });
});

describe("session takeover", () => {
  it("binds the first mutating session", () => {
    const r = applyControllingSession(undefined, "sess.1", true);
    expect(r.takeover).toBe(false);
    expect(r.session_id).toBe("sess.1");
  });

  it("takes over when a new session mutates", () => {
    const r = applyControllingSession("sess.1", "sess.2", true);
    expect(r.takeover).toBe(true);
    expect(r.previous_session_id).toBe("sess.1");
    expect(r.session_id).toBe("sess.2");
  });

  it("does not take over on read-only commands", () => {
    const r = applyControllingSession("sess.1", "sess.2", false);
    expect(r.takeover).toBe(false);
    expect(r.session_id).toBe("sess.1");
  });
});
