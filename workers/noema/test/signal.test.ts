import { describe, expect, it } from "vitest";
import { normalizeStructuredCommand } from "../src/actions";
import { parseActionSignal, signalFromArgs } from "../src/signal";

describe("parseActionSignal", () => {
  it("allows missing signal", () => {
    expect(parseActionSignal(undefined)).toEqual({ ok: true });
    expect(signalFromArgs({})).toEqual({ ok: true });
  });

  it("accepts ASP fields", () => {
    const r = parseActionSignal({
      certainty: 0.8,
      grounding: "observed",
      stochasticity: 0.1,
      assumptions: ["entity.salvage-cache"],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.signal).toEqual({
      certainty: 0.8,
      grounding: "observed",
      stochasticity: 0.1,
      assumptions: ["entity.salvage-cache"],
    });
  });

  it("rejects bad certainty and grounding", () => {
    expect(parseActionSignal({ certainty: 1.2 }).ok).toBe(false);
    expect(parseActionSignal({ grounding: "vibes" }).ok).toBe(false);
  });
});

describe("MESSAGE signal gate", () => {
  it("attaches optional signal on MESSAGE", () => {
    const r = normalizeStructuredCommand("MESSAGE", {
      recipient_id: "player.tester",
      text: "stock is low",
      signal: { "@C": 0.7, "@G": "inferred-from-stock" },
    });
    expect(r.ok).toBe(true);
    if (r.ok && r.action.verb === "MESSAGE") {
      expect(r.action.arguments.signal).toEqual({ certainty: 0.7, grounding: "inferred-from-stock" });
    }
  });

  it("rejects ungrounded malformed signal without applying", () => {
    const r = normalizeStructuredCommand("MESSAGE", {
      recipient_id: "player.tester",
      text: "hi",
      signal: { certainty: 9 },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("INVALID_REQUEST");
  });
});
