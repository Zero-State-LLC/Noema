/**
 * RFC-0017 hosted cycle fence. Pure settlement outcomes.
 * DO is live writer; durable head is the recoverability record.
 */

export const STALE_HEAD = "STALE_HEAD";

export type FenceHead = {
  world_id: string;
  revision: number;
  ledger_head_event_id?: string | null;
  state_digest?: string | null;
  writer_generation?: string | null;
  sequence: number;
  cycle: number;
};

export type FenceCheck = { ok: true } | { ok: false; code: typeof STALE_HEAD };

export function checkExpectedHead(
  expectedRevision: number,
  durable: FenceHead | null,
): FenceCheck {
  if (!durable) return { ok: true };
  if (durable.revision !== expectedRevision) return { ok: false, code: STALE_HEAD };
  return { ok: true };
}

export function nextRevision(durable: FenceHead | null): number {
  return (durable?.revision ?? 0) + 1;
}

export type CrashPoint =
  | "before_write"
  | "during_write"
  | "after_commit_before_ack"
  | null;

export type MemStore = {
  head: FenceHead | null;
  events: Record<string, true>;
  committed: boolean;
};

/** In-memory CAS settlement for crash/retry tests. */
export function settleBatch(
  store: MemStore,
  expectedRevision: number,
  eventIds: string[],
  next: Omit<FenceHead, "revision"> & { revision?: number },
  crash: CrashPoint = null,
): { ok: true; head: FenceHead } | { ok: false; code: string } {
  if (crash === "before_write") return { ok: false, code: "CRASH_BEFORE_WRITE" };
  const gate = checkExpectedHead(expectedRevision, store.head);
  if (!gate.ok) return gate;
  if (crash === "during_write") return { ok: false, code: "CRASH_DURING_WRITE" };
  for (const id of eventIds) store.events[id] = true;
  const head: FenceHead = {
    ...next,
    revision: nextRevision(store.head),
    world_id: next.world_id,
    sequence: next.sequence,
    cycle: next.cycle,
  };
  store.head = head;
  store.committed = true;
  if (crash === "after_commit_before_ack") return { ok: false, code: "ACK_LOST" };
  return { ok: true, head };
}

export function retrySettle(
  store: MemStore,
  expectedRevision: number,
  eventIds: string[],
  next: Omit<FenceHead, "revision"> & { revision?: number },
): { ok: true; head: FenceHead } | { ok: false; code: string } {
  if (store.committed && eventIds.every((id) => store.events[id])) {
    return store.head ? { ok: true, head: store.head } : { ok: false, code: "MISSING_HEAD" };
  }
  const durableRev = store.head?.revision ?? 0;
  const expected = store.committed ? durableRev : expectedRevision;
  return settleBatch(store, expected, eventIds, next, null);
}

export function restoreOrIncident(head: FenceHead | null): { ok: true; head: FenceHead } | { ok: false; code: "INCIDENT" } {
  if (!head || typeof head.revision !== "number") return { ok: false, code: "INCIDENT" };
  return { ok: true, head };
}
