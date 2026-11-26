/**
 * RFC-0143: Deterministic Seeded CRIME_DETECTED Producer, Forensic INVESTIGATE,
 * Accountable Institutional SANCTION, and Severity-Scaled Rehabilitation.
 * Authority: Noema-Specs rfcs/RFC-0143-crime-producer-and-accountable-enforcement.md
 * Machine contract: crime-enforcement-catalog.0.1.json (event-catalog/0.2 compatible).
 */

import crimeCatalogJson from "./crime-enforcement-catalog.0.1.json";
import { deterministicId } from "./ids";
import { sha256Hex } from "./genesis";
import { infraClassOf, isInProgress } from "./construction";
import type { EntityRuntime, PlayerRuntime } from "./actions";
import type { ContestForm, OpenContest } from "./contest";

export const CRIME_CATALOG_ID = crimeCatalogJson.catalog_id as "crime-enforcement-catalog/0.1";
export const CRIME_DOMAIN_TAG = crimeCatalogJson.domain_tag;
export const CRIME_DETECTION_CONFIG = crimeCatalogJson.detection;
export const CRIME_SANCTION_CONFIG = crimeCatalogJson.sanction;
export const REHAB_TRADES_BY_SEVERITY = crimeCatalogJson.rehabilitation_trades_by_severity;
export const INVESTIGATE_COST = CRIME_DETECTION_CONFIG.investigate_cost;
export const SANCTION_BASE_COST = CRIME_SANCTION_CONFIG.base_cost;
export const ARC_LANCE_INFLUENCE_DISCOUNT = CRIME_SANCTION_CONFIG.arc_lance_influence_discount;
export const SANCTION_WINDOW_CYCLES = CRIME_SANCTION_CONFIG.window_cycles;
export const SANCTION_ROOM_RESTRICTION_CYCLES = CRIME_SANCTION_CONFIG.room_restriction_duration_cycles;

export function pruneExpiredResidues(residues: CrimeResidue[] | undefined, nowCycle: number): CrimeResidue[] {
  if (!residues?.length) return [];
  return residues.filter((r) => !r.resolved && nowCycle <= r.expires_cycle);
}

export type CrimeSeverity = "MINOR" | "MODERATE" | "MAJOR";
export type CrimeCategory =
  | "UNAUTHORIZED_EXTRACTION"
  | "SABOTAGE"
  | "ACCESS_VIOLATION"
  | "SEIZURE"
  | "POLICY_VIOLATION"
  | "OTHER";
export type CrimeDetectionMethod =
  | "WITNESS"
  | "INFRASTRUCTURE_SENSOR"
  | "INVESTIGATION"
  | "SELF_REPORT";

export type CrimeResidue = {
  residue_id: string;
  room_id: string;
  subject_id: string;
  victim_id?: string;
  category: CrimeCategory;
  severity: CrimeSeverity;
  source_event_ids: string[];
  draw: number;
  threshold_mp: number;
  created_cycle: number;
  expires_cycle: number;
  resolved: boolean;
  sensor_entity_id?: string;
  witness_ids: string[];
};

export type CrimeDetectionRecord = {
  detection_id: string;
  room_id: string;
  subject_id: string;
  victim_id?: string;
  category: CrimeCategory;
  severity: CrimeSeverity;
  source_event_ids: string[];
  detection_method: CrimeDetectionMethod;
  detected_cycle: number;
  sanctioned: boolean;
  sanctioned_by?: string;
  sanctioned_cycle?: number;
};

export function rehabTradesForSeverity(severity?: string | null): number {
  if (severity === "MAJOR") return REHAB_TRADES_BY_SEVERITY.MAJOR;
  if (severity === "MODERATE") return REHAB_TRADES_BY_SEVERITY.MODERATE;
  return REHAB_TRADES_BY_SEVERITY.MINOR;
}

export function sanctionInfluenceDebit(severity: CrimeSeverity): number {
  return CRIME_SANCTION_CONFIG.severity_influence_debit[severity] ?? 3;
}

export async function seededCrimeDraw(seedStreamId: string, sourceEventId: string): Promise<number> {
  const hex = await sha256Hex(`${seedStreamId}:${sourceEventId}:${CRIME_DOMAIN_TAG}`);
  const u32 = parseInt(hex.slice(0, 8), 16) >>> 0;
  return u32 % 1000;
}

export function detectionBaseMillipoints(form: ContestForm): number {
  if (form === "INFRASTRUCTURE_DISRUPTION") return 350;
  if (form === "RESOURCE_SEIZURE") return 300;
  if (form === "PRESENCE_PRESSURE") return 200;
  if (form === "ACCESS_CONTEST") return 250;
  return 200;
}

export function classifyContestCrime(input: {
  contest: OpenContest;
  violatedNonAggression: boolean;
  seizedItemId?: string;
  targetIsBarterStall: boolean;
  usedBreachCharge: boolean;
  weaponAssisted: boolean;
  conditionAfter?: number;
}): { category: CrimeCategory; severity: CrimeSeverity } | null {
  if (input.violatedNonAggression) {
    return { category: "POLICY_VIOLATION", severity: "MAJOR" };
  }
  const form = input.contest.contest_form;
  if (form === "RESOURCE_SEIZURE") {
    const severity: CrimeSeverity =
      input.seizedItemId || input.targetIsBarterStall ? "MAJOR" : "MODERATE";
    return { category: "SEIZURE", severity };
  }
  if (form === "INFRASTRUCTURE_DISRUPTION") {
    const severity: CrimeSeverity =
      input.usedBreachCharge || (input.conditionAfter != null && input.conditionAfter < 25)
        ? "MAJOR"
        : "MODERATE";
    return { category: "SABOTAGE", severity };
  }
  if (form === "PRESENCE_PRESSURE") {
    const severity: CrimeSeverity = input.weaponAssisted ? "MODERATE" : "MINOR";
    return { category: "OTHER", severity };
  }
  return null;
}

export function countWitnessesAndSensor(input: {
  roomId: string;
  roomEntities: EntityRuntime[];
  players: Record<string, PlayerRuntime>;
  subjectId: string;
  subjectOrgMemberIds?: Set<string>;
}): { sensorEntityId?: string; witnessIds: string[]; sensorBonusMp: number; witnessBonusMp: number } {
  const sensor = input.roomEntities.find((e) => {
    const cls = infraClassOf(e);
    if (cls !== "relay" && cls !== "defensive_work") return false;
    if (isInProgress(e) || e.scar) return false;
    return (e.condition ?? 0) >= CRIME_DETECTION_CONFIG.sensor_min_condition;
  });
  const witnessIds = Object.entries(input.players)
    .filter(([pid, p]) => {
      if (!p.entered || p.room_id !== input.roomId) return false;
      if (pid === input.subjectId) return false;
      if (input.subjectOrgMemberIds?.has(pid)) return false;
      return true;
    })
    .map(([pid]) => pid)
    .sort();
  const sensorBonusMp = sensor ? CRIME_DETECTION_CONFIG.sensor_bonus_mp : 0;
  const witnessBonusMp =
    CRIME_DETECTION_CONFIG.witness_bonus_per_player_mp *
    Math.min(CRIME_DETECTION_CONFIG.max_counted_witnesses, witnessIds.length);
  return {
    sensorEntityId: sensor?.entity_id,
    witnessIds,
    sensorBonusMp,
    witnessBonusMp,
  };
}

/**
 * Strict event-catalog/0.2 CRIME_DETECTED payload builder (RFC-0129 + RFC-0143).
 * Always sets influence_delta: 0, influence_applied: 0 on detection (sanction is separate).
 */
export function buildCrimeDetectedPayload(input: {
  detection_id: string;
  subject_id: string;
  victim_id?: string;
  severity: CrimeSeverity;
  category: CrimeCategory;
  room_id: string;
  source_event_ids: string[];
  detection_method: CrimeDetectionMethod;
  sensor_entity_id?: string;
  witness_ids?: string[];
  visibility?: "PUBLIC" | "PARTIES";
}): Record<string, unknown> {
  const visibility = input.visibility || "PUBLIC";
  const flags: Array<"PUBLIC_HISTORY" | "ORG_REVIEW_ELIGIBLE" | "ACCESS_REVIEW_ELIGIBLE"> = [
    "ACCESS_REVIEW_ELIGIBLE",
    "ORG_REVIEW_ELIGIBLE",
  ];
  if (visibility === "PUBLIC") flags.unshift("PUBLIC_HISTORY");
  return {
    detection_id: input.detection_id,
    subject_id: input.subject_id,
    ...(input.victim_id ? { victim_id: input.victim_id } : {}),
    severity: input.severity,
    category: input.category,
    room_id: input.room_id,
    source_event_ids: input.source_event_ids,
    detection_method: input.detection_method,
    ...(input.sensor_entity_id ? { sensor_entity_id: input.sensor_entity_id } : {}),
    ...(input.witness_ids?.length ? { witness_ids: input.witness_ids.slice(0, 32) } : {}),
    influence_delta: 0,
    influence_applied: 0,
    flags,
    visibility,
  };
}

export async function evaluateContestCrime(input: {
  contest: OpenContest;
  sourceEventId: string;
  cycle: number;
  roomEntities: EntityRuntime[];
  players: Record<string, PlayerRuntime>;
  subjectOrgMemberIds?: Set<string>;
  victimId?: string;
  violatedNonAggression: boolean;
  seizedItemId?: string;
  targetIsBarterStall: boolean;
  usedBreachCharge: boolean;
  weaponAssisted: boolean;
  weaponSignatureMp: number;
  conditionAfter?: number;
}): Promise<
  | { kind: "NONE" }
  | { kind: "DETECTED"; record: CrimeDetectionRecord; payload: Record<string, unknown> }
  | { kind: "RESIDUE"; residue: CrimeResidue }
> {
  const classified = classifyContestCrime({
    contest: input.contest,
    violatedNonAggression: input.violatedNonAggression,
    seizedItemId: input.seizedItemId,
    targetIsBarterStall: input.targetIsBarterStall,
    usedBreachCharge: input.usedBreachCharge,
    weaponAssisted: input.weaponAssisted,
    conditionAfter: input.conditionAfter,
  });
  if (!classified) return { kind: "NONE" };

  const draw = await seededCrimeDraw(input.contest.seed_stream_id, input.sourceEventId);
  const env = countWitnessesAndSensor({
    roomId: input.contest.room_id,
    roomEntities: input.roomEntities,
    players: input.players,
    subjectId: input.contest.declarer_id,
    subjectOrgMemberIds: input.subjectOrgMemberIds,
  });
  const threshold_mp = Math.min(
    CRIME_DETECTION_CONFIG.max_immediate_threshold_mp,
    detectionBaseMillipoints(input.contest.contest_form) +
      Math.max(0, Math.floor(input.weaponSignatureMp || 0)) +
      env.sensorBonusMp +
      env.witnessBonusMp,
  );
  const sourceIds = [input.sourceEventId];

  if (draw < threshold_mp) {
    const detection_id = deterministicId("crime", input.contest.contest_id, input.sourceEventId, input.cycle);
    const detection_method: CrimeDetectionMethod =
      env.witnessIds.length > 0 ? "WITNESS" : "INFRASTRUCTURE_SENSOR";
    const record: CrimeDetectionRecord = {
      detection_id,
      room_id: input.contest.room_id,
      subject_id: input.contest.declarer_id,
      victim_id: input.victimId,
      category: classified.category,
      severity: classified.severity,
      source_event_ids: sourceIds,
      detection_method,
      detected_cycle: input.cycle,
      sanctioned: false,
    };
    const payload = buildCrimeDetectedPayload({
      detection_id,
      subject_id: record.subject_id,
      victim_id: record.victim_id,
      severity: record.severity,
      category: record.category,
      room_id: record.room_id,
      source_event_ids: record.source_event_ids,
      detection_method,
      sensor_entity_id: env.sensorEntityId,
      witness_ids: env.witnessIds,
      visibility: "PUBLIC",
    });
    return { kind: "DETECTED", record, payload };
  }

  const residue_id = deterministicId("residue", input.contest.contest_id, input.sourceEventId, input.cycle);
  const residue: CrimeResidue = {
    residue_id,
    room_id: input.contest.room_id,
    subject_id: input.contest.declarer_id,
    victim_id: input.victimId,
    category: classified.category,
    severity: classified.severity,
    source_event_ids: sourceIds,
    draw,
    threshold_mp,
    created_cycle: input.cycle,
    expires_cycle: input.cycle + CRIME_DETECTION_CONFIG.residue_ttl_cycles,
    resolved: false,
    sensor_entity_id: env.sensorEntityId,
    witness_ids: env.witnessIds,
  };
  return { kind: "RESIDUE", residue };
}

export function evaluateInvestigation(input: {
  residues: CrimeResidue[];
  roomId: string;
  cycle: number;
  hasChronoLens: boolean;
}): {
  matched?: { residue: CrimeResidue; record: CrimeDetectionRecord; payload: Record<string, unknown> };
} {
  const bonus =
    CRIME_DETECTION_CONFIG.investigate_base_bonus_mp +
    (input.hasChronoLens ? CRIME_DETECTION_CONFIG.investigate_chrono_lens_extra_mp : 0);
  const live = input.residues
    .filter((r) => r.room_id === input.roomId && !r.resolved && input.cycle <= r.expires_cycle)
    .sort((a, b) => a.created_cycle - b.created_cycle || a.residue_id.localeCompare(b.residue_id));
  for (const r of live) {
    const boosted = Math.min(CRIME_DETECTION_CONFIG.max_investigated_threshold_mp, r.threshold_mp + bonus);
    if (r.draw < boosted) {
      r.resolved = true;
      const detection_id = deterministicId("crime.inv", r.residue_id, input.cycle);
      const record: CrimeDetectionRecord = {
        detection_id,
        room_id: r.room_id,
        subject_id: r.subject_id,
        victim_id: r.victim_id,
        category: r.category,
        severity: r.severity,
        source_event_ids: r.source_event_ids,
        detection_method: "INVESTIGATION",
        detected_cycle: input.cycle,
        sanctioned: false,
      };
      const payload = buildCrimeDetectedPayload({
        detection_id,
        subject_id: record.subject_id,
        victim_id: record.victim_id,
        severity: record.severity,
        category: record.category,
        room_id: record.room_id,
        source_event_ids: record.source_event_ids,
        detection_method: "INVESTIGATION",
        sensor_entity_id: r.sensor_entity_id,
        witness_ids: r.witness_ids,
        visibility: "PUBLIC",
      });
      return { matched: { residue: r, record, payload } };
    }
  }
  return {};
}

export function roomCrimeBand(
  roomId: string,
  residues: CrimeResidue[] | undefined,
  detections: CrimeDetectionRecord[] | undefined,
  nowCycle: number,
): "detected" | "trace" | undefined {
  const hasRecentDetection = (detections || []).some(
    (d) => d.room_id === roomId && nowCycle - d.detected_cycle <= CRIME_SANCTION_CONFIG.window_cycles,
  );
  if (hasRecentDetection) return "detected";
  const hasLiveTrace = (residues || []).some(
    (r) => r.room_id === roomId && !r.resolved && nowCycle <= r.expires_cycle,
  );
  if (hasLiveTrace) return "trace";
  return undefined;
}
