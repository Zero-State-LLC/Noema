import { describe, expect, it } from "vitest";
import { STALE_FENCE, STALE_HEAD, planTempoCommitFailure, type FenceHead } from "../src/settle-fence";

const head: FenceHead = { world_id: "world-01", revision: 45181, sequence: 86844, cycle: 10 };

describe("Noema#983 tempo-alarm commit failure", () => {
  it("lost settlement race resyncs to the durable revision instead of INCIDENT", () => {
    for (const code of [STALE_HEAD, STALE_FENCE, "DIGEST_LINEAGE_MISMATCH", "NONCONTIGUOUS_SEQUENCE", "DUPLICATE_EVENT_CONFLICT"]) {
      expect(planTempoCommitFailure(code, head)).toEqual({ mode: "resync", revision: 45181 });
    }
  });

  it("contention without a readable durable head still fails closed", () => {
    expect(planTempoCommitFailure(STALE_HEAD, null)).toEqual({ mode: "incident" });
  });

  it("non-contention failures still enter INCIDENT", () => {
    for (const code of ["RPC_ERROR", "INVALID_SCHEMA", "CONFLICT", ""]) {
      expect(planTempoCommitFailure(code, head)).toEqual({ mode: "incident" });
    }
  });
});
