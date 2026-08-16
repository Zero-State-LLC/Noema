import { isUsableLiveWorld, planIncidentRecover, type SettlementHealth, type WorldOpStatus } from "./ops";
import { worldFromHead, type CanonicalCommit, type WorldHead } from "./settle";
import type { WorldRuntime } from "./world-actions";

export type AdoptLiveHeadInput = {
  settlement_id: string;
  writer_generation: string;
  genesis_id?: string | null;
  status: string;
  settlement_health: string;
  world: WorldRuntime;
};

export type IncidentRecoverOk = {
  ok: true;
  world: WorldRuntime;
  status: "ACTIVE";
  settlement: "HEALTHY";
  revision: number;
  mode: "restore" | "adopt";
  head_present: true;
};

export type IncidentRecoverErr = { ok: false; code: string; message: string; http: number };

/**
 * Operator recover for INCIDENT.
 * Existing head → restore into the DO.
 * Missing head + stored live world → persist that snapshot as the first head.
 * Missing head + no usable stored world → 409. Never invents ledger events.
 */
export async function runIncidentRecover(
  input: {
    status: WorldOpStatus;
    settlement: SettlementHealth;
    storedWorld: WorldRuntime | null | undefined;
    currentWorld: WorldRuntime;
    genesisId?: string | null;
    writerGeneration: string;
    settlementId?: string;
  },
  deps: {
    getHead: (worldId: string) => Promise<WorldHead | null>;
    adoptLiveHead: (input: AdoptLiveHeadInput) => Promise<CanonicalCommit>;
  },
): Promise<IncidentRecoverOk | IncidentRecoverErr> {
  const worldId = input.storedWorld?.world_id || input.currentWorld.world_id;
  const head = await deps.getHead(worldId);
  const headRevision = typeof head?.revision === "number" ? head.revision : null;
  const planned = planIncidentRecover(
    input.status,
    input.settlement,
    headRevision,
    isUsableLiveWorld(input.storedWorld),
  );
  if (!planned.ok) return planned;

  if (planned.restore) {
    if (!head) {
      return { ok: false, code: "RECOVERY_REQUIRED", message: "no durable world head to restore", http: 409 };
    }
    return {
      ok: true,
      world: worldFromHead(head, input.currentWorld),
      status: "ACTIVE",
      settlement: "HEALTHY",
      revision: typeof head.revision === "number" ? head.revision : 0,
      mode: "restore",
      head_present: true,
    };
  }

  const live = input.storedWorld;
  if (!isUsableLiveWorld(live) || !live) {
    return { ok: false, code: "RECOVERY_REQUIRED", message: "no durable world head to restore", http: 409 };
  }
  const snapshot = structuredClone(input.currentWorld.rooms ? input.currentWorld : live);
  snapshot.unsettled = [];
  const adopted = await deps.adoptLiveHead({
    settlement_id: input.settlementId || `settlement.adopt-live.${live.world_id}`,
    writer_generation: input.writerGeneration,
    genesis_id: input.genesisId ?? null,
    status: "ACTIVE",
    settlement_health: "HEALTHY",
    world: snapshot,
  });
  if (!adopted.ok) {
    return {
      ok: false,
      code: adopted.code || "LIVE_HEAD_ADOPT_FAILED",
      message: "live world snapshot was not persisted as the canonical head",
      http: 409,
    };
  }
  const verify = await deps.getHead(live.world_id);
  if (!verify || verify.world_id !== live.world_id) {
    return {
      ok: false,
      code: "HEAD_PRESENT_FALSE",
      message: "adopted head was not readable after persist",
      http: 409,
    };
  }
  return {
    ok: true,
    world: snapshot,
    status: "ACTIVE",
    settlement: "HEALTHY",
    revision: adopted.revision,
    mode: "adopt",
    head_present: true,
  };
}
