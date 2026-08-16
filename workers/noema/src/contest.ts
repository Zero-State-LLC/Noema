/**
 * GC7-S0 contest rhythm on existing v0.2 events.
 * Authority: Noema-Specs docs/GC7-FIRST-SLICE.md / RFC-0011 / CONTEST-RESOLUTION.md
 * CONTEST_RESOLVE is world-side. No HP. No SCAN/ATTACK. Help does not advertise CONTEST.
 */

import { sha256Hex } from "./genesis";
import type { Budgets } from "./actions";

export const CONFLICT_CATALOG_ID = "conflict-catalog/gc7-s0";
export const CONTEST_RULES_VERSION = "contest-rules/0.2.0";

export const CONTEST_FORMS = [
  "RESOURCE_SEIZURE",
  "INFRASTRUCTURE_DISRUPTION",
  "ACCESS_CONTEST",
  "PRESENCE_PRESSURE",
] as const;

export type ContestForm = (typeof CONTEST_FORMS)[number];

export const FORBIDDEN_CONTEST_VERBS = ["scan", "attack", "hit", "kill", "quest"] as const;

export const DECLARE_COST: Partial<Budgets> = { compute: 2, influence: 1 };
export const DEFEND_COST: Partial<Budgets> = { compute: 1 };

export const MAX_OPEN_PER_AGENT = 2;
export const MAX_OPEN_PER_ROOM = 3;

export type ContestTarget =
  | { kind: "ENTITY"; entity_id: string }
  | { kind: "EXIT"; exit_id: string }
  | { kind: "ROOM"; room_id: string }
  | { kind: "AGENT"; agent_id: string }
  | { kind: "HOLDING"; holder_id: string; resource: string; amount: number };

export type StakeMap = Record<string, number>;

export type OpenContest = {
  contest_id: string;
  declarer_id: string;
  defender_id?: string;
  acting_for?: string;
  defender_acting_for?: string;
  contest_form: ContestForm;
  target: ContestTarget;
  room_id: string;
  stake: StakeMap;
  defender_stake: StakeMap;
  expires_cycle: number;
  seed_stream_id: string;
  status: "OPEN" | "CLOSED";
};

export function contestOfficeProfile(
  form: ContestForm,
): "OPERATE_RESOURCE_ACCOUNT" | "OPERATE_NAMED_ASSET" {
  return form === "RESOURCE_SEIZURE" ? "OPERATE_RESOURCE_ACCOUNT" : "OPERATE_NAMED_ASSET";
}

type FormSpec = {
  minimum_stake: StakeMap;
  stake_weights_millipoints: StakeMap;
  defense_weights_millipoints: StakeMap;
  max_duration_cycles: number;
  success_threshold_millipoints: number;
  partial_threshold_millipoints: number;
  max_seizure_amount: number;
  max_condition_delta: number;
  partial_condition_delta?: number;
  restriction_duration_cycles?: number;
  max_disable_cycles?: number;
  allowed_target_kinds: ContestTarget["kind"][];
};

export const FORM_SPECS: Record<ContestForm, FormSpec> = {
  RESOURCE_SEIZURE: {
    minimum_stake: { energy: 8, influence: 4 },
    stake_weights_millipoints: { energy: 40, influence: 50, compute: 10, storage: 30, attention: 5 },
    defense_weights_millipoints: { energy: 30, influence: 50, compute: 10, storage: 20 },
    max_duration_cycles: 8,
    success_threshold_millipoints: 150,
    partial_threshold_millipoints: 0,
    max_seizure_amount: 5,
    max_condition_delta: 0,
    allowed_target_kinds: ["ENTITY", "HOLDING"],
  },
  INFRASTRUCTURE_DISRUPTION: {
    minimum_stake: { energy: 10, influence: 6, compute: 2 },
    stake_weights_millipoints: { energy: 45, influence: 40, compute: 15, storage: 5, attention: 5 },
    defense_weights_millipoints: { energy: 25, influence: 45, compute: 15, storage: 10 },
    max_duration_cycles: 6,
    success_threshold_millipoints: 120,
    partial_threshold_millipoints: -50,
    max_seizure_amount: 0,
    max_condition_delta: 25,
    partial_condition_delta: 12,
    allowed_target_kinds: ["ENTITY"],
  },
  ACCESS_CONTEST: {
    minimum_stake: { energy: 6, influence: 8 },
    stake_weights_millipoints: { energy: 25, influence: 55, compute: 15, storage: 5, attention: 10 },
    defense_weights_millipoints: { energy: 20, influence: 55, compute: 15, storage: 5 },
    max_duration_cycles: 10,
    success_threshold_millipoints: 100,
    partial_threshold_millipoints: -30,
    max_seizure_amount: 0,
    max_condition_delta: 0,
    restriction_duration_cycles: 8,
    allowed_target_kinds: ["EXIT", "ROOM"],
  },
  PRESENCE_PRESSURE: {
    minimum_stake: { energy: 12, influence: 10, compute: 4 },
    stake_weights_millipoints: { energy: 40, influence: 40, compute: 20, storage: 5, attention: 10 },
    defense_weights_millipoints: { energy: 35, influence: 40, compute: 20, storage: 5 },
    max_duration_cycles: 4,
    success_threshold_millipoints: 180,
    partial_threshold_millipoints: 50,
    max_seizure_amount: 0,
    max_condition_delta: 0,
    max_disable_cycles: 3,
    allowed_target_kinds: ["AGENT"],
  },
};

const FORM_SET = new Set<string>(CONTEST_FORMS);
const BUDGET_KEYS = new Set(["energy", "compute", "storage", "influence", "attention"]);

export const MODIFIERS = {
  infra_condition_divisor: 10,
  infra_condition_weight_millipoints: 5,
  org_mutual_defense_cap_millipoints: 200,
  seed_perturbation_range_millipoints: 50,
};

export function parseContestForm(raw: string): ContestForm | null {
  const t = String(raw || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .trim();
  if (t === "resource seizure" || t === "seizure") return "RESOURCE_SEIZURE";
  if (t === "infrastructure disruption" || t === "disruption" || t === "infra") {
    return "INFRASTRUCTURE_DISRUPTION";
  }
  if (t === "access contest" || t === "access") return "ACCESS_CONTEST";
  if (t === "presence pressure" || t === "presence") return "PRESENCE_PRESSURE";
  const upper = String(raw || "").toUpperCase().replace(/[-\s]+/g, "_");
  return FORM_SET.has(upper) ? (upper as ContestForm) : null;
}

export function isForbiddenContestVerb(raw: string): boolean {
  return (FORBIDDEN_CONTEST_VERBS as readonly string[]).includes(String(raw || "").toLowerCase());
}

export function sanitizeStake(raw: Record<string, number> | undefined | null): StakeMap | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const out: StakeMap = {};
  for (const [key, value] of Object.entries(raw)) {
    const name = String(key).toLowerCase();
    if (!BUDGET_KEYS.has(name)) return null;
    if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) return null;
    out[name] = value;
  }
  return Object.keys(out).length ? out : null;
}

export function meetsMinimumStake(stake: StakeMap, form: ContestForm): boolean {
  const need = FORM_SPECS[form].minimum_stake;
  for (const [k, v] of Object.entries(need)) {
    if ((stake[k] || 0) < v) return false;
  }
  return true;
}

export function stakePower(stake: StakeMap, weights: StakeMap): number {
  let power = 0;
  for (const [r, amt] of Object.entries(stake || {})) {
    power += (Number(amt) || 0) * (weights[r] || 0);
  }
  return power;
}

export function infraModifier(condition: number): number {
  const c = Math.max(0, Math.floor(condition));
  return Math.floor(c / MODIFIERS.infra_condition_divisor) * MODIFIERS.infra_condition_weight_millipoints;
}

export async function seedPerturbation(seedStreamId: string, contestId: string): Promise<number> {
  const hex = await sha256Hex(`${seedStreamId}:${contestId}:${CONTEST_RULES_VERSION}`);
  const u32 = parseInt(hex.slice(0, 8), 16) >>> 0;
  const draw = u32 % 1000;
  const R = MODIFIERS.seed_perturbation_range_millipoints;
  return (draw % (2 * R + 1)) - R;
}

export type ContestOutcome = "SUCCESS" | "PARTIAL_SUCCESS" | "FAILURE" | "EXPIRED" | "ABORTED";

export function outcomeFromScore(form: ContestForm, score: number): ContestOutcome {
  const spec = FORM_SPECS[form];
  if (score >= spec.success_threshold_millipoints) return "SUCCESS";
  if (score >= spec.partial_threshold_millipoints) return "PARTIAL_SUCCESS";
  return "FAILURE";
}

export function scoreContest(input: {
  form: ContestForm;
  declarer_stake: StakeMap;
  defender_stake: StakeMap;
  infra_condition: number;
  org_defense_support_millipoints?: number;
  seed_perturbation: number;
}): { score: number; declarer_power: number; defender_power: number; infra_mod: number } {
  const spec = FORM_SPECS[input.form];
  const declarer_power = stakePower(input.declarer_stake, spec.stake_weights_millipoints);
  const defender_power = stakePower(input.defender_stake, spec.defense_weights_millipoints);
  const infra_mod = infraModifier(input.infra_condition);
  const org = Math.max(
    0,
    Math.min(
      input.org_defense_support_millipoints || 0,
      MODIFIERS.org_mutual_defense_cap_millipoints,
    ),
  );
  const score = declarer_power - defender_power - infra_mod - org + input.seed_perturbation;
  return { score, declarer_power, defender_power, infra_mod };
}

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v)).join(",")}]`;
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(",")}}`;
}

export async function resolutionDigest(input: {
  contest_id: string;
  outcome: ContestOutcome;
  score_millipoints: number;
  declarer_stake_spent: StakeMap;
  defender_stake_spent: StakeMap;
  seed_stream_id: string;
}): Promise<string> {
  const material = [
    input.contest_id,
    input.outcome,
    String(input.score_millipoints),
    canonicalJson(input.declarer_stake_spent),
    canonicalJson(input.defender_stake_spent),
    input.seed_stream_id,
    CONTEST_RULES_VERSION,
  ].join(":");
  return `sha256:${await sha256Hex(material)}`;
}

export function seizureAmount(form: ContestForm, outcome: ContestOutcome, available: number): number {
  if (outcome !== "SUCCESS" && outcome !== "PARTIAL_SUCCESS") return 0;
  const max = FORM_SPECS[form].max_seizure_amount;
  const want = outcome === "PARTIAL_SUCCESS" ? Math.ceil(max / 2) : max;
  return Math.max(0, Math.min(want, Math.max(0, available)));
}

export function disruptionAfter(
  form: ContestForm,
  outcome: ContestOutcome,
  before: number,
): number | null {
  if (outcome !== "SUCCESS" && outcome !== "PARTIAL_SUCCESS") return null;
  const spec = FORM_SPECS[form];
  const delta =
    outcome === "SUCCESS" ? spec.max_condition_delta : (spec.partial_condition_delta ?? 0);
  if (!delta) return null;
  return Math.max(0, before - delta);
}

export function targetKindAllowed(form: ContestForm, kind: ContestTarget["kind"]): boolean {
  return FORM_SPECS[form].allowed_target_kinds.includes(kind);
}

export function defaultExpiresCycle(cycle: number, form: ContestForm): number {
  return cycle + 1;
}

export function maxExpiresCycle(cycle: number, form: ContestForm): number {
  return cycle + FORM_SPECS[form].max_duration_cycles;
}

export function publicContestProjection(c: OpenContest): {
  contest_id: string;
  contest_form: ContestForm;
  room_id: string;
  status: string;
  expires_cycle: number;
} {
  return {
    contest_id: c.contest_id,
    contest_form: c.contest_form,
    room_id: c.room_id,
    status: c.status,
    expires_cycle: c.expires_cycle,
  };
}
