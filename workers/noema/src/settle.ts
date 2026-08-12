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

  // Prefer a simple noema_settled_events table if present; else skip quietly.
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
    const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/noema_settled_events`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify(body),
    });
    // 201 created, 200 upsert, 409 conflict → treat as settled/idempotent
    if (res.ok || res.status === 409) return true;
    // Table may not exist yet (404/PGRST) — fail soft for Stage 0
    return false;
  } catch {
    return false;
  }
}
