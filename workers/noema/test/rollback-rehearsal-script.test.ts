import { describe, expect, it } from "vitest";
import {
  admitWorkerName,
  admitWorldId,
  assertProductionUnchanged,
  compareDurableSnapshot,
  parseWorkersDevUrl,
  REHEARSAL_WORLD,
} from "../scripts/rollback-rehearsal.mjs";

function production(version = "version-a") {
  return {
    health: { status: "ok" },
    version: { worker_version_id: version, world_id: "world.perihelion-reach-3" },
    ready: {
      ready: true,
      settlement_health: "HEALTHY",
      world: { world_id: "world.perihelion-reach-3", genesis_id: "genesis.live" },
    },
  };
}

function durable(state = "sha256:state") {
  return {
    world_id: REHEARSAL_WORLD,
    genesis_id: "genesis.rehearsal",
    cycle0_digest: "sha256:cycle0",
    status: "ACTIVE",
    settlement_health: "HEALTHY",
    cycle: 1,
    sequence: 2,
    rollback_evidence: {
      state_digest: state,
      history_digest: "sha256:history",
      history_count: 2,
      history_head_event_id: "evt.2",
      history_head_sequence: 2,
    },
  };
}

describe("rollback rehearsal safety gates", () => {
  it("admits only dedicated rollback Worker names", () => {
    expect(admitWorkerName("noema-rollback-rehearsal-555-20260825").ok).toBe(true);
    expect(admitWorkerName("noema-gateway").ok).toBe(false);
    expect(admitWorkerName("noema-gateway-production").ok).toBe(false);
    expect(admitWorkerName("preview-worker").ok).toBe(false);
  });

  it("admits only the isolated rehearsal world", () => {
    expect(admitWorldId(REHEARSAL_WORLD).ok).toBe(true);
    expect(admitWorldId("world-01").ok).toBe(false);
    expect(admitWorldId("world.perihelion-reach-3").ok).toBe(false);
    expect(admitWorldId("test.hosted-canonical.other").ok).toBe(false);
  });

  it("extracts only a workers.dev deployment URL", () => {
    expect(parseWorkersDevUrl("Deployed https://noema-rollback-rehearsal-555.example.workers.dev"))
      .toBe("https://noema-rollback-rehearsal-555.example.workers.dev");
    expect(parseWorkersDevUrl("https://noema.guru")).toBeNull();
  });

  it("fails if production identity changes", () => {
    expect(() => assertProductionUnchanged(production(), production())).not.toThrow();
    expect(() => assertProductionUnchanged(production(), production("version-b"))).toThrow(/production identity changed/);
  });

  it("fails if A-B-A durable evidence changes", () => {
    expect(() => compareDurableSnapshot("same", durable(), durable())).not.toThrow();
    expect(() => compareDurableSnapshot("changed", durable(), durable("sha256:other"))).toThrow(/state_digest/);
  });
});
