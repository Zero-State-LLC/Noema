import { describe, expect, it } from "vitest";
import {
  adoptSequenceFromReceipt,
  missingSequences,
  summarizeChain,
} from "../scripts/settlement-chain.mjs";

describe("settlement-chain", () => {
  it("lists holes in 0..head without inventing rows", () => {
    expect(missingSequences([0, 1, 3], 0, 3)).toEqual([2]);
    expect(missingSequences([93, 94, 95], 93, 95)).toEqual([]);
  });

  it("treats pre-adopt holes as expected and requires post-adopt contiguity", () => {
    const sequences = [0, 70, 71, 73, 75, 93, 94, 95];
    const out = summarizeChain({ sequences, headSequence: 95, adoptSequence: 92 });
    expect(out.missing_at_or_before_adopt).toBeGreaterThan(0);
    expect(out.post_adopt_holes).toBe(0);
    expect(out.post_adopt_contiguous).toBe(true);
    expect(missingSequences(sequences, 0, 92)).toContain(76);
    expect(missingSequences(sequences, 93, 95)).toEqual([]);
  });

  it("flags a post-adopt hole", () => {
    const out = summarizeChain({ sequences: [93, 95], headSequence: 95, adoptSequence: 92 });
    expect(out.post_adopt_holes).toBe(1);
    expect(out.post_adopt_contiguous).toBe(false);
  });

  it("reads adopt sequence only from adopt-live receipts", () => {
    expect(
      adoptSequenceFromReceipt({
        sequence: 92,
        ledger_head_event_id: "settlement.adopt-live.world.perihelion-reach",
      }),
    ).toBe(92);
    expect(adoptSequenceFromReceipt({ sequence: 93, ledger_head_event_id: "evt.000093" })).toBe(null);
  });
});
