import type { Env, PlayerPrincipal } from "./types";

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

/**
 * Best-effort durable settle to Supabase Postgres via REST.
 * No-ops when service role is unset (local Stage 0 without secrets).
 * Idempotent on event_id when a unique constraint exists.
 */
export async function settleEvent(env: Env, principal: PlayerPrincipal, ev: SettlementEvent): Promise<boolean> {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

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
