/**
 * Player occupancy rekeying, device-agent rebinding, and legacy human eviction helpers
 * extracted from world-actions.ts to keep world lifecycle concerns modular.
 */

import { playerIdFromDeviceController } from "./identity";
import type { PlayerPrincipal, WorldRuntime } from "./types";

/** Move live occupancy from a leftover human-bound Player id onto the device Agent Player. */
export function rekeyLivePlayerId(w: WorldRuntime, from: string, to: string): void {
  if (!from || !to || from === to) return;
  if (!w.players || typeof w.players !== "object") w.players = {};
  const src = w.players[from];
  if (src) {
    if (!w.players[to] || (!w.players[to].entered && src.entered)) {
      w.players[to] = src;
    }
    delete w.players[from];
  }
  const dest = w.players[to];
  if (dest) dest.controller_type = "agent";

  const idKeys = [
    "player_id",
    "from",
    "to",
    "proposer_id",
    "counterparty_id",
    "sender_id",
    "recipient_id",
    "holder_player_id",
    "agent_id",
    "acting_for",
    "broken_by",
  ];
  const rewriteRecord = (obj: Record<string, unknown> | undefined) => {
    if (!obj) return;
    for (const key of idKeys) {
      if (obj[key] === from) obj[key] = to;
    }
  };
  for (const ev of w.unsettled || []) {
    if (ev.player_id === from) ev.player_id = to;
    rewriteRecord(ev.payload);
  }
  for (const msg of w.pending_messages || []) {
    rewriteRecord(msg as unknown as Record<string, unknown>);
  }
  for (const ev of w.public_social_events || []) {
    rewriteRecord(ev as unknown as Record<string, unknown>);
  }

  if (w.seen_idempotency) {
    for (const key of Object.keys(w.seen_idempotency)) {
      if (!key.startsWith(`${from}::`)) continue;
      w.seen_idempotency[`${to}::${key.slice(from.length + 2)}`] = w.seen_idempotency[key];
      delete w.seen_idempotency[key];
    }
  }
  for (const trade of Object.values(w.trades || {})) {
    if (trade.proposer_id === from) trade.proposer_id = to;
    if (trade.counterparty_id === from) trade.counterparty_id = to;
  }
  for (const msg of w.messages || []) {
    if (msg.sender_id === from) msg.sender_id = to;
    if (msg.recipient_id === from) msg.recipient_id = to;
  }
  for (const org of Object.values(w.organizations || {})) {
    for (const member of org.members || []) {
      if (member.agent_id === from) member.agent_id = to;
    }
    for (const office of Object.values(org.offices || {})) {
      if (office.holder_player_id === from) office.holder_player_id = to;
    }
  }
}

export function rebindDeviceAgentOccupancy(w: WorldRuntime, principal: PlayerPrincipal): PlayerPrincipal {
  const canonical = playerIdFromDeviceController(principal.controller_id);
  if (!canonical || canonical === principal.player_id) return principal;
  rekeyLivePlayerId(w, principal.player_id, canonical);
  return { ...principal, player_id: canonical };
}

export function evictLeftoverHumanOccupancy(w: WorldRuntime, actingPlayerId: string): void {
  for (const [id, p] of Object.entries(w.players || {})) {
    if (id === actingPlayerId) continue;
    if (p.controller_type === "human" || p.controller_type === "hybrid") {
      p.entered = false;
    }
  }
}
