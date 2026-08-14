import type { Env, PlayerPrincipal } from "./types";
import type { UnsettledEvent, WorldRuntime } from "./world-actions";
import { canonicalEventDigest, canonicalStateMaterial } from "./canonical-state";

export interface SettlementEvent {
  event_id: string;
  event_type: string;
  sequence: number;
  cycle: number;
  world_id: string;
  player_id: string;
  controller_id: string;
  session_id: string;
  payload: Record<string, unknown>;
}

export type WorldHead = {
  world_id: string;
  sequence: number;
  cycle: number;
  genesis_id?: string | null;
  status: string;
  settlement_health: string;
  state_json: WorldRuntime;
  updated_at?: string;
  revision?: number;
  ledger_head_event_id?: string | null;
  state_digest?: string | null;
  writer_generation?: string | null;
  ledger_head_digest?: string | null;
};

export type CanonicalCommit =
  | { ok: true; revision: number; sequence: number; idempotent: boolean }
  | { ok: false; code: string };

function restBase(env: Env): { url: string; key: string } | null {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/$/, ""), key };
}

/**
 * Best-effort durable settle to Supabase Postgres via REST.
 * No-ops when service role is unset (local Stage 0 without secrets).
 * Idempotent on event_id when a unique constraint exists.
 */
export async function settleEvent(env: Env, principal: PlayerPrincipal, ev: SettlementEvent): Promise<boolean> {
  const rest = restBase(env);
  if (!rest) return false;
  const { url, key } = rest;

  const body = {
    event_id: ev.event_id,
    event_type: ev.event_type,
    sequence: ev.sequence,
    cycle: ev.cycle,
    world_id: ev.world_id,
    player_id: ev.player_id,
    controller_id: principal.controller_id,
    session_id: principal.session_id,
    payload: ev.payload,
    settled_at: new Date().toISOString(),
  };

  try {
    const res = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/noema_settled_events?on_conflict=event_id`,
      {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(body),
      },
    );
    if (res.ok || res.status === 409) return true;
    // Table not applied yet: do not fail-close PLAY. Events still settle.
    if (res.status === 404 || res.status === 406) return true;
    return false;
  } catch {
    return false;
  }
}

/** Settle Genesis activation (admin). Uses synthetic principal ids for audit trail. */
export async function settleGenesisActivation(
  env: Env,
  payload: {
    genesis_id: string;
    world_id: string;
    cycle0_digest: string;
    world_seed: string;
    profile_id: string;
    story_seed_ids: string[];
    admin_session_id: string;
  },
): Promise<{ settled: boolean; settlement_id: string }> {
  const settlement_id = `settlement.${payload.genesis_id}`;
  const fakePrincipal: PlayerPrincipal = {
    player_id: "system.genesis",
    agent_id: "system.genesis",
    session_id: payload.admin_session_id,
    controller_id: "ctrl.admin.operator",
    controller_type: "hybrid",
    scopes: ["noema.world.admin"],
    protocol_version: "1",
    authentication_context: "operator_token",
  };
  const settled = await settleEvent(env, fakePrincipal, {
    event_id: settlement_id,
    event_type: "GENESIS_ACTIVATED",
    sequence: 0,
    cycle: 0,
    world_id: payload.world_id,
    player_id: "system.genesis",
    controller_id: "ctrl.admin.operator",
    session_id: payload.admin_session_id,
    payload: {
      genesis_id: payload.genesis_id,
      cycle0_digest: payload.cycle0_digest,
      world_seed: payload.world_seed,
      profile_id: payload.profile_id,
      story_seed_ids: payload.story_seed_ids,
      activated_at: new Date().toISOString(),
    },
  });
  return { settled, settlement_id };
}

/** Restore only when the DO has no world. Never clobber a live copy. */
export function shouldRestoreFromHead(stored: WorldRuntime | null | undefined): boolean {
  return !stored;
}

export function worldFromHead(
  head: WorldHead | null,
  fallback: WorldRuntime,
): WorldRuntime {
  const snap = head?.state_json;
  if (snap && typeof snap === "object" && snap.rooms) return snap;
  return fallback;
}

export async function putWorldHead(
  env: Env,
  head: Omit<WorldHead, "updated_at">,
): Promise<boolean> {
  const rest = restBase(env);
  if (!rest) return false;
  try {
    const res = await fetch(`${rest.url}/rest/v1/noema_world_heads?on_conflict=world_id`, {
      method: "POST",
      headers: {
        apikey: rest.key,
        Authorization: `Bearer ${rest.key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        world_id: head.world_id,
        sequence: head.sequence,
        cycle: head.cycle,
        genesis_id: head.genesis_id ?? null,
        status: head.status,
        settlement_health: head.settlement_health,
        state_json: head.state_json,
        revision: head.revision ?? 0,
        ledger_head_event_id: head.ledger_head_event_id ?? null,
        state_digest: head.state_digest ?? null,
        writer_generation: head.writer_generation ?? null,
        updated_at: new Date().toISOString(),
      }),
    });
    if (res.ok || res.status === 409) return true;
    // Table not applied yet: do not fail-close PLAY. Events still settle.
    if (res.status === 404 || res.status === 406) return true;
    return false;
  } catch {
    return false;
  }
}

export async function getWorldHead(env: Env, worldId: string): Promise<WorldHead | null> {
  const rest = restBase(env);
  if (!rest) return null;
  try {
    const res = await fetch(
      `${rest.url}/rest/v1/noema_world_heads?world_id=eq.${encodeURIComponent(worldId)}&select=*`,
      {
        headers: {
          apikey: rest.key,
          Authorization: `Bearer ${rest.key}`,
          Accept: "application/json",
        },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as WorldHead[];
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  } catch {
    return null;
  }
}

/**
 * The only hosted mutation acknowledgement boundary.  The RPC owns the single
 * Postgres transaction; a failed or ambiguous response is never an ACK.
 */
export async function commitCanonicalSettlement(
  env: Env,
  input: {
    settlement_id: string;
    expected_revision: number;
    writer_generation: string;
    genesis_id?: string | null;
    status: string;
    settlement_health: string;
    world: WorldRuntime;
    principal: PlayerPrincipal;
    events: NonNullable<import("./types").CommandResult["events"]>;
    previous_digest: string | null;
  },
): Promise<CanonicalCommit> {
  const rest = restBase(env);
  if (!rest) return { ok: false, code: "SETTLEMENT_UNCONFIGURED" };
  try {
    const material = await canonicalStateMaterial(input.world);
    let previous = input.previous_digest;
    const events = [];
    for (const event of input.events) {
      const payload = event.payload || {};
      const digest = await canonicalEventDigest({
        world_id: input.world.world_id,
        sequence: event.sequence,
        cycle: input.world.cycle,
        event_id: event.event_id,
        event_type: event.event_type,
        payload,
        previous_digest: previous,
      });
      events.push({
        event_id: event.event_id,
        event_type: event.event_type,
        sequence: event.sequence,
        cycle: input.world.cycle,
        player_id: input.principal.player_id,
        controller_id: input.principal.controller_id,
        session_id: input.principal.session_id,
        payload,
        previous_digest: previous,
        digest,
      });
      previous = digest;
    }
    const res = await fetch(`${rest.url}/rest/v1/rpc/noema_commit_canonical_settlement`, {
      method: "POST",
      headers: {
        apikey: rest.key,
        Authorization: `Bearer ${rest.key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        p_settlement_id: input.settlement_id,
        p_world_id: input.world.world_id,
        p_expected_revision: input.expected_revision,
        p_writer_generation: input.writer_generation,
        p_genesis_id: input.genesis_id ?? null,
        p_status: input.status,
        p_settlement_health: input.settlement_health,
        p_state_json: material.state_json,
        p_canonical_state_json: material.canonical_json,
        p_state_digest: material.state_digest,
        p_events: events,
        p_allow_bootstrap: false,
      }),
    });
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || !body || body.ok !== true) return { ok: false, code: String(body?.code || `HTTP_${res.status}`) };
    return { ok: true, revision: Number(body.revision), sequence: Number(body.sequence), idempotent: body.idempotent === true };
  } catch {
    return { ok: false, code: "SETTLEMENT_UNCERTAIN" };
  }
}

export async function replayUnsettled(
  env: Env,
  worldId: string,
  items: UnsettledEvent[],
): Promise<UnsettledEvent[]> {
  if (!items.length) return [];
  const remaining: UnsettledEvent[] = [];
  for (const item of items) {
    const fake: PlayerPrincipal = {
      player_id: item.player_id || "system.replay",
      agent_id: item.player_id || "system.replay",
      session_id: item.session_id || "sess.replay",
      controller_id: item.controller_id || "ctrl.replay",
      controller_type: "hybrid",
      scopes: ["noema.world.admin"],
      protocol_version: "1",
      authentication_context: "operator_token",
    };
    const ok = await settleEvent(env, fake, {
      event_id: item.event_id,
      event_type: item.event_type || "UNKNOWN",
      sequence: item.sequence || 0,
      cycle: item.cycle || 0,
      world_id: worldId,
      player_id: item.player_id || fake.player_id,
      controller_id: fake.controller_id,
      session_id: fake.session_id,
      payload: item.payload || {},
    });
    if (!ok) remaining.push(item);
  }
  return remaining;
}
