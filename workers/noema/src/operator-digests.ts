/**
 * Operator Digests — derived Admin summaries of settled activity.
 * Specs: docs/OPERATOR-DIGESTS.md
 * Observational only. Not world truth.
 */

export const DIGEST_CADENCES = ["OFF", "PT15M", "PT30M", "PT1H", "PT5H", "PT10H", "PT24H"] as const;
export type DigestCadence = (typeof DIGEST_CADENCES)[number];
export type DigestDepth = "BRIEF" | "STANDARD" | "DETAILED";

export const CADENCE_MS: Record<DigestCadence, number> = {
  OFF: 0,
  PT15M: 15 * 60 * 1000,
  PT30M: 30 * 60 * 1000,
  PT1H: 60 * 60 * 1000,
  PT5H: 5 * 60 * 60 * 1000,
  PT10H: 10 * 60 * 60 * 1000,
  PT24H: 24 * 60 * 60 * 1000,
};

export interface DigestConfig {
  enabled: boolean;
  cadence: DigestCadence;
  depth: DigestDepth;
  dashboard: boolean;
  email: boolean;
  include_controller_breakdown: boolean;
  include_research_notices: boolean;
}

export const DEFAULT_DIGEST_CONFIG: DigestConfig = {
  enabled: true,
  cadence: "PT30M",
  depth: "STANDARD",
  dashboard: true,
  email: false,
  include_controller_breakdown: false,
  include_research_notices: false,
};

export interface DigestEvent {
  event_id: string;
  event_type: string;
  sequence: number;
  cycle: number;
  player_id?: string;
  handle?: string;
  at: number;
  payload?: Record<string, unknown>;
}

export interface DigestSnapshot {
  world_id: string;
  world_name?: string;
  world_status: string;
  settlement_health: string;
  players_present: number;
  human_controlled?: number;
  agent_controlled?: number;
  open_trades: number;
}

export interface OperatorDigest {
  digest_id: string;
  world_id: string;
  window_start: number;
  window_end: number;
  generated_at: number;
  cadence: DigestCadence;
  depth: DigestDepth;
  source_sequence_start: number;
  source_sequence_end: number;
  missed: boolean;
  generation_mode: "deterministic";
  text: string;
}

export function cadenceElapsed(lastEnd: number, cadence: DigestCadence, now: number): boolean {
  const ms = CADENCE_MS[cadence];
  if (!ms) return false;
  return now - lastEnd >= ms;
}

function nameOf(ev: DigestEvent): string {
  return ev.handle || ev.player_id?.replace(/^player\./, "") || "A Player";
}

function locName(payload?: Record<string, unknown>): string | undefined {
  const n = payload?.to_room_name || payload?.room_name || payload?.location_name;
  return typeof n === "string" ? n : undefined;
}

export function composeDigest(
  events: DigestEvent[],
  snap: DigestSnapshot,
  cfg: DigestConfig,
  window: { start: number; end: number; missed?: boolean },
): OperatorDigest {
  const inWin = events
    .filter((e) => e.at >= window.start && e.at < window.end)
    .sort((a, b) => a.sequence - b.sequence);
  const seqs = inWin.map((e) => e.sequence);
  const seqStart = seqs.length ? Math.min(...seqs) : 0;
  const seqEnd = seqs.length ? Math.max(...seqs) : 0;

  const counts = {
    move: 0,
    inspect: 0,
    trade_proposed: 0,
    trade_accepted: 0,
    trade_rejected: 0,
    harvest: 0,
    repair: 0,
    org: 0,
    entered: 0,
    messages: 0,
  };
  const lines: string[] = [];
  const movers = new Map<string, Set<string>>();
  const inspectors = new Map<string, number>();

  for (const ev of inWin) {
    const who = nameOf(ev);
    switch (ev.event_type) {
      case "MOVE": {
        counts.move += 1;
        const loc = locName(ev.payload) || "another site";
        if (!movers.has(who)) movers.set(who, new Set());
        movers.get(who)!.add(loc);
        break;
      }
      case "INSPECT":
        counts.inspect += 1;
        inspectors.set(who, (inspectors.get(who) || 0) + 1);
        break;
      case "TRADE_PROPOSED":
        counts.trade_proposed += 1;
        break;
      case "TRADE_ACCEPTED":
        counts.trade_accepted += 1;
        break;
      case "TRADE_REJECTED":
        counts.trade_rejected += 1;
        break;
      case "ENTITY_UPDATE":
        if (ev.payload?.kind === "repair" || ev.payload?.operation === "REPAIR") counts.repair += 1;
        break;
      case "RESOURCE_TRANSFER":
        if (ev.payload?.kind === "harvest" || ev.payload?.from === "node") counts.harvest += 1;
        break;
      case "ORG_CREATE":
      case "ORG_MEMBER_ADD":
      case "ORG_MEMBER_REMOVE":
        counts.org += 1;
        break;
      case "AGENT_ENTERED_WORLD":
        counts.entered += 1;
        break;
      case "MESSAGE":
      case "MESSAGE_DELIVERED":
        counts.messages += 1;
        break;
      default:
        break;
    }
  }

  const header = `${(snap.world_name || snap.world_id).toUpperCase()} — ${cfg.cadence.replace("PT", "").toLowerCase()} DIGEST`;
  const activity: string[] = [];
  if (cfg.depth === "BRIEF") {
    activity.push(`${snap.players_present} Players active.`);
    if (counts.trade_proposed) activity.push(`${counts.trade_proposed} trades proposed.`);
    if (counts.repair) activity.push(`${counts.repair} infrastructure updates.`);
    if (counts.entered) activity.push(`${counts.entered} Players entered.`);
    if (counts.move) activity.push(`${counts.move} movements.`);
    if (!activity.length) activity.push("No settled Player activity in this window.");
  } else {
    for (const [who, locs] of movers) {
      activity.push(`${who} moved toward ${[...locs].slice(0, 3).join(" and ")}.`);
    }
    for (const [who, n] of inspectors) {
      activity.push(`${who} inspected ${n} target${n === 1 ? "" : "s"}.`);
    }
    if (counts.trade_proposed || counts.trade_accepted) {
      activity.push(
        `Trades: ${counts.trade_proposed} proposed, ${counts.trade_accepted} settled, ${counts.trade_rejected} closed.`,
      );
    }
    if (counts.repair) activity.push(`Infrastructure: ${counts.repair} repair update${counts.repair === 1 ? "" : "s"}.`);
    if (counts.harvest) activity.push(`Harvest: ${counts.harvest} transfer${counts.harvest === 1 ? "" : "s"}.`);
    if (counts.org) activity.push(`Organizations: ${counts.org} membership/charter change${counts.org === 1 ? "" : "s"}.`);
    if (counts.entered) activity.push(`${counts.entered} Player${counts.entered === 1 ? "" : "s"} entered the world.`);
    if (counts.messages) activity.push(`${counts.messages} private message events delivered (text omitted).`);
    if (!activity.length) activity.push("No settled Player activity in this window.");
    if (cfg.depth === "DETAILED") {
      activity.push(
        `Event classes — move ${counts.move}, inspect ${counts.inspect}, trade ${counts.trade_proposed}/${counts.trade_accepted}, seq ${seqStart}–${seqEnd}.`,
      );
    }
  }

  const system = [
    `World ${snap.world_status}`,
    `Settlement ${snap.settlement_health.toLowerCase()}`,
    snap.world_status === "INCIDENT" ? "Incident referenced — see World lifecycle." : "No digest-time incident inferred.",
  ];
  if (cfg.include_controller_breakdown && snap.human_controlled != null) {
    system.push(
      `Players active: ${snap.players_present} (human-controlled ${snap.human_controlled}, agent-controlled ${snap.agent_controlled ?? 0})`,
    );
  }

  const text = [
    header,
    window.missed ? "(recovered missed window)" : "",
    "",
    "Players active",
    String(snap.players_present),
    "",
    "Key activity",
    ...activity.map((l) => `- ${l}`),
    "",
    "System",
    ...system,
  ]
    .filter((l, i, a) => !(l === "" && a[i - 1] === ""))
    .join("\n");

  const digest_id = `digest.${snap.world_id}.${window.end}.${seqEnd}`;
  return {
    digest_id,
    world_id: snap.world_id,
    window_start: window.start,
    window_end: window.end,
    generated_at: window.end,
    cadence: cfg.cadence,
    depth: cfg.depth,
    source_sequence_start: seqStart,
    source_sequence_end: seqEnd,
    missed: Boolean(window.missed),
    generation_mode: "deterministic",
    text,
  };
}

export function nextWindows(
  lastEnd: number,
  cadence: DigestCadence,
  now: number,
): Array<{ start: number; end: number; missed: boolean }> {
  const ms = CADENCE_MS[cadence];
  if (!ms || now < lastEnd + ms) return [];
  const out: Array<{ start: number; end: number; missed: boolean }> = [];
  let start = lastEnd;
  while (start + ms <= now) {
    const end = start + ms;
    out.push({ start, end, missed: end < now - ms });
    start = end;
    if (out.length >= 8) break;
  }
  if (out.length > 1) {
    for (let i = 0; i < out.length - 1; i++) out[i].missed = true;
    out[out.length - 1].missed = false;
  }
  return out;
}
