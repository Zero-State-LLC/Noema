/**
 * RFC-0138 & RFC-0144: Bounded, escrowed WS06 Civic Contracts
 * (REPAIR_TARGET, ATTEST_ROOM, DELIVER_LOT, CRAFT_ITEM).
 * Deterministic completion predicates; zero unbounded debt or free-text execution.
 */

import { deterministicId } from "./ids";
import type { Budgets, EntityRuntime, Organization, PlayerRuntime } from "./actions";
import { ensureTreasury } from "./offices";
import type { EvidenceFragment } from "./deep-time";
import type { MaterialArchetype } from "./lots";
import type { CraftableArchetypeId } from "./items";

export const CONTRACT_CATALOG_ID = "contracts-catalog/rfc-0138";
export const MAX_OPEN_CONTRACTS_PER_ORG = 3;
export const DEFAULT_CONTRACT_DURATION = 24;
export const MAX_CONTRACT_REWARD_STORAGE = 5;
export const MAX_CONTRACT_REWARD_INFLUENCE = 3;
export const MAX_CONTRACT_REWARD_ENERGY = 10;

export type ContractKind = "REPAIR_TARGET" | "ATTEST_ROOM" | "DELIVER_LOT" | "CRAFT_ITEM";
export type ContractRewardResource = "storage" | "influence" | "energy";
export type ContractStatus = "OPEN" | "FULFILLED" | "EXPIRED";

export type CivicContract = {
  contract_id: string;
  org_id: string;
  poster_id: string;
  room_id: string;
  kind: ContractKind;
  target_entity_id?: string;
  target_condition?: number;
  target_count?: number;
  /** RFC-0144: DELIVER_LOT target material archetype (SOUND+). */
  target_material?: MaterialArchetype;
  /** RFC-0144: CRAFT_ITEM target item archetype (SOUND+, condition >= 80). */
  target_item_archetype?: CraftableArchetypeId;
  reward_resource: ContractRewardResource;
  reward_amount: number;
  posted_cycle: number;
  expires_cycle: number;
  status: ContractStatus;
  fulfilled_by?: string;
  fulfilled_cycle?: number;
};

export function parseContractKind(raw: unknown): ContractKind | null {
  const s = String(raw || "").trim().toUpperCase().replace(/[-\s]+/g, "_");
  if (s === "REPAIR_TARGET" || s === "REPAIR") return "REPAIR_TARGET";
  if (s === "ATTEST_ROOM" || s === "ATTEST") return "ATTEST_ROOM";
  if (s === "DELIVER_LOT" || s === "DELIVER") return "DELIVER_LOT";
  if (s === "CRAFT_ITEM" || s === "CRAFT") return "CRAFT_ITEM";
  return null;
}

export function allocateContractId(seq: number, cycle: number, subject: string): string {
  return deterministicId("contract", seq, cycle, subject);
}

export function clampContractReward(resource: ContractRewardResource, raw: unknown): number {
  const n = Math.floor(Number(raw ?? 1));
  const cap =
    resource === "storage"
      ? MAX_CONTRACT_REWARD_STORAGE
      : resource === "energy"
        ? MAX_CONTRACT_REWARD_ENERGY
        : MAX_CONTRACT_REWARD_INFLUENCE;
  const min = resource === "energy" ? 2 : 1;
  if (!Number.isFinite(n) || n < min) return min;
  return Math.min(cap, n);
}

export function openContractsForOrg(
  contracts: Record<string, CivicContract> | undefined,
  orgId: string,
): CivicContract[] {
  return Object.values(contracts || {}).filter((c) => c.org_id === orgId && c.status === "OPEN");
}

export function contractPredicateHolds(
  contract: CivicContract,
  roomEntities: EntityRuntime[],
  evidenceFragments: EvidenceFragment[] | undefined,
): boolean {
  if (contract.status !== "OPEN") return false;
  if (contract.kind === "DELIVER_LOT" || contract.kind === "CRAFT_ITEM") {
    // Delivery predicates are verified atomically against fulfiller inventory/lots in CONTRACT_FULFILL.
    return true;
  }
  if (contract.kind === "REPAIR_TARGET") {
    const target = roomEntities.find((e) => e.entity_id === contract.target_entity_id);
    if (!target || target.scar || target.in_progress) return false;
    const minCond = Math.max(50, Math.min(100, contract.target_condition ?? 80));
    return (target.condition ?? 0) >= minCond;
  }
  // ATTEST_ROOM: at least target_count independent controller ATTESTs on room entities since posted_cycle.
  const entityIds = new Set(roomEntities.map((e) => e.entity_id));
  const need = Math.max(1, Math.min(3, contract.target_count ?? 2));
  const controllers = new Set<string>();
  for (const f of evidenceFragments || []) {
    if (f.kind !== "ATTEST") continue;
    if (f.cycle < contract.posted_cycle) continue;
    if (f.subject_ref !== contract.room_id && !entityIds.has(f.subject_ref)) continue;
    controllers.add(f.controller_id || f.player_id);
  }
  return controllers.size >= need;
}

export function expireDueContracts(
  contracts: Record<string, CivicContract> | undefined,
  organizations: Record<string, Organization> | undefined,
  players: Record<string, PlayerRuntime> | undefined,
  cycle: number,
): CivicContract[] {
  const expired: CivicContract[] = [];
  for (const c of Object.values(contracts || {})) {
    if (c.status !== "OPEN" || cycle <= c.expires_cycle) continue;
    c.status = "EXPIRED";
    if (c.reward_resource === "storage" || c.reward_resource === "energy") {
      const org = organizations?.[c.org_id];
      if (org) {
        const vault = ensureTreasury(org);
        vault[c.reward_resource] = (vault[c.reward_resource] ?? 0) + c.reward_amount;
      }
    } else if (c.reward_resource === "influence") {
      const poster = players?.[c.poster_id];
      if (poster) {
        poster.budgets.influence = (poster.budgets.influence ?? 0) + c.reward_amount;
      }
    }
    expired.push(c);
  }
  return expired;
}

export function applyContractPayout(
  contract: CivicContract,
  fulfillerBudgets: Budgets,
): { granted: number; resource: ContractRewardResource } {
  if (contract.reward_resource === "storage") {
    const free = Math.max(0, fulfillerBudgets.storage ?? 0);
    const granted = Math.min(free, contract.reward_amount);
    fulfillerBudgets.storage = free - granted;
    return { granted, resource: "storage" };
  }
  if (contract.reward_resource === "energy") {
    const before = Math.max(0, Math.floor(fulfillerBudgets.energy ?? 0));
    const after = Math.min(80, before + contract.reward_amount);
    fulfillerBudgets.energy = after;
    return { granted: after - before, resource: "energy" };
  }
  fulfillerBudgets.influence = (fulfillerBudgets.influence ?? 0) + contract.reward_amount;
  return { granted: contract.reward_amount, resource: "influence" };
}
