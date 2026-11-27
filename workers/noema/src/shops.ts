/**
 * RFC-0140: Full-Reserve Barter Storefronts (`barter_stall`), Atomic `TRADE`
 * shop phases (`stock`/`withdraw`/`list`/`unlist`/`fulfill`), local clearing
 * tape (`WS01`), and `WS02` cold-start emergency swaps / supersession.
 * Authority: Noema-Specs rfcs/RFC-0140-storefronts-barter-and-supersession.md
 * Machine contract: shop-catalog.0.1.json (event-catalog/0.2 compatible).
 */

import shopCatalogJson from "./shop-catalog.0.1.json";
import { deterministicId } from "./ids";
import {
  itemSpec,
  playerCarriedItems,
  type ItemArchetypeId,
  type PortableItem,
} from "./items";
import {
  consumeMaterialLots,
  creditMaterialLot,
  normalizeMaterialLots,
  totalMaterialLots,
  type LotGrade,
  type MaterialArchetype,
  type MaterialLot,
} from "./lots";

export const SHOP_CATALOG_ID = shopCatalogJson.catalog_id as "shop-catalog/0.1";
export const STALL_MIN_OPERATIONAL_CONDITION = shopCatalogJson.constructible_class.min_operational_condition;
export const STALL_ZERO_SPOILAGE_MIN_CONDITION = shopCatalogJson.constructible_class.zero_spoilage_min_condition;
export const STALL_PER_RESOURCE_CAP = shopCatalogJson.escrow_caps.per_resource_cap;
export const STALL_TOTAL_LOTS_CAP = shopCatalogJson.escrow_caps.total_material_lots_cap;
export const STALL_DISCRETE_ITEMS_CAP = shopCatalogJson.escrow_caps.discrete_items_cap;
export const STALL_MAX_OPEN_LISTINGS = shopCatalogJson.escrow_caps.max_open_listings_per_stall;
export const STALL_MAX_FILLS_PER_LISTING = shopCatalogJson.escrow_caps.max_fills_per_listing;
export const WS01_CLEARING_TAPE_CAP = shopCatalogJson.world_services.ws01_local_clearing_tape_cap;
export const WS01_CLEARING_WINDOW_CYCLES = shopCatalogJson.world_services.ws01_local_clearing_window_cycles;
export const WS02_EMERGENCY_SWAPS = shopCatalogJson.world_services.ws02_emergency_swaps;

export type StallResourceKey = "energy" | "compute" | "influence";
export const STALL_TRANSFERABLE_RESOURCES: readonly StallResourceKey[] = [
  "energy",
  "compute",
  "influence",
];

export type ListingKind = "SELL_OFFER" | "BUY_ORDER" | "CORE_SWAP";

export type ItemPredicate = {
  archetype: ItemArchetypeId;
  min_condition?: number;
  min_quality?: "WORN" | "STANDARD" | "TEMPERED";
};

export type BarterAssetSpec =
  | { kind: "RESOURCE"; resource: StallResourceKey; amount: number }
  | { kind: "LOT"; material: MaterialArchetype; grade?: LotGrade; amount: number }
  | { kind: "ITEM"; item_id?: string; predicate?: ItemPredicate; count?: number }
  | { kind: "CARGO"; amount: number };

export type ShopListing = {
  listing_id: string;
  stall_id: string;
  room_id: string;
  owner_id: string;
  listing_kind: ListingKind;
  offer_asset: BarterAssetSpec;
  ask_asset: BarterAssetSpec;
  max_fills: number;
  fills_remaining: number;
  created_cycle: number;
  status: "OPEN" | "CLOSED";
};

export type BarterStallState = {
  stall_id: string;
  room_id: string;
  resources: Record<StallResourceKey, number>;
  material_lots: MaterialLot[];
  item_ids: string[];
  listings: ShopListing[];
};

export type ClearingTapeEntry = {
  cycle: number;
  room_id: string;
  stall_id: string;
  listing_kind: ListingKind;
  offer_summary: string;
  ask_summary: string;
};

const QUALITY_RANK: Record<string, number> = { WORN: 0, MAKESHIFT: 0, STANDARD: 1, TEMPERED: 2 };

export function emptyStallState(stallId: string, roomId: string): BarterStallState {
  return {
    stall_id: stallId,
    room_id: roomId,
    resources: { energy: 0, compute: 0, influence: 0 },
    material_lots: [],
    item_ids: [],
    listings: [],
  };
}

export function isStallResourceKey(raw: string): raw is StallResourceKey {
  return raw === "energy" || raw === "compute" || raw === "influence";
}

export function sanitizeBarterAsset(raw: unknown): BarterAssetSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const kind = String(obj.kind || "").trim().toUpperCase();
  if (kind === "RESOURCE") {
    const res = String(obj.resource || "").trim().toLowerCase();
    const amount = Math.floor(Number(obj.amount) || 0);
    if (!isStallResourceKey(res) || amount <= 0) return null;
    return { kind: "RESOURCE", resource: res, amount };
  }
  if (kind === "LOT") {
    const mat = String(obj.material || "").trim().toUpperCase();
    const amount = Math.floor(Number(obj.amount) || 0);
    if (
      (mat !== "FERROUS_ORE" && mat !== "SILICA_CELL" && mat !== "SALVAGE_COMPOSITE") ||
      amount <= 0
    ) {
      return null;
    }
    const gRaw = obj.grade ? String(obj.grade).trim().toUpperCase() : undefined;
    const grade = gRaw === "WORN" || gRaw === "SOUND" || gRaw === "REFINED" ? gRaw : undefined;
    return { kind: "LOT", material: mat as MaterialArchetype, ...(grade ? { grade } : {}), amount };
  }
  if (kind === "CARGO") {
    const amount = Math.floor(Number(obj.amount) || 0);
    if (amount <= 0) return null;
    return { kind: "CARGO", amount };
  }
  if (kind === "ITEM") {
    const item_id = obj.item_id ? String(obj.item_id).trim() : undefined;
    const rawPred = obj.predicate && typeof obj.predicate === "object" ? (obj.predicate as Record<string, unknown>) : undefined;
    let predicate: ItemPredicate | undefined;
    if (rawPred?.archetype) {
      const arch = String(rawPred.archetype).trim().toLowerCase() as ItemArchetypeId;
      if (arch !== "depleted_cell" && !itemSpec(arch)) return null;
      const minCond = rawPred.min_condition != null ? Math.max(0, Math.floor(Number(rawPred.min_condition))) : undefined;
      const mqRaw = rawPred.min_quality ? String(rawPred.min_quality).trim().toUpperCase() : undefined;
      const minQuality = mqRaw === "WORN" || mqRaw === "STANDARD" || mqRaw === "TEMPERED" ? mqRaw : undefined;
      predicate = { archetype: arch, ...(minCond != null ? { min_condition: minCond } : {}), ...(minQuality ? { min_quality: minQuality } : {}) };
    }
    if (!item_id && !predicate) return null;
    return { kind: "ITEM", ...(item_id ? { item_id } : {}), ...(predicate ? { predicate } : {}), count: 1 };
  }
  return null;
}

export function itemMatchesPredicate(item: PortableItem, pred: ItemPredicate): boolean {
  if (item.archetype !== pred.archetype) return false;
  if (pred.min_condition != null && item.condition < pred.min_condition) return false;
  if (pred.min_quality != null && (QUALITY_RANK[item.quality] ?? 0) < (QUALITY_RANK[pred.min_quality] ?? 0)) {
    return false;
  }
  return true;
}

/**
 * Deterministic selection order (shop-catalog/0.1):
 * 1. unequipped before equipped
 * 2. lowest condition first
 * 3. lexicographic entity_id
 */
export function selectMatchingItem(
  candidates: PortableItem[],
  predicate?: ItemPredicate,
  explicitItemId?: string,
): PortableItem | undefined {
  let pool = candidates;
  if (explicitItemId) {
    pool = pool.filter((it) => it.item_id === explicitItemId);
  }
  if (predicate) {
    pool = pool.filter((it) => itemMatchesPredicate(it, predicate));
  }
  if (!pool.length) return undefined;
  return [...pool].sort((a, b) => {
    const ae = a.equipped_slot ? 1 : 0;
    const be = b.equipped_slot ? 1 : 0;
    if (ae !== be) return ae - be;
    if (a.condition !== b.condition) return a.condition - b.condition;
    return a.item_id.localeCompare(b.item_id);
  })[0];
}

export function stallEscrowedItems(
  stall: BarterStallState,
  items: Record<string, PortableItem> | undefined,
): PortableItem[] {
  if (!items) return [];
  return stall.item_ids
    .map((id) => items[id])
    .filter((it): it is PortableItem => Boolean(it && it.location.kind === "CONTAINER" && it.location.container_entity_id === stall.stall_id));
}

const GRADE_RANK: Record<LotGrade, number> = { WORN: 0, SOUND: 1, REFINED: 2 };

/** Exact bipartite feasibility check: can `slots` each be assigned a distinct escrowed item? */
function canAllocateDistinctItems(
  escrowed: PortableItem[],
  slots: Array<{ item_id?: string; predicate?: ItemPredicate }>,
): boolean {
  if (slots.length > escrowed.length) return false;
  if (!slots.length) return true;
  const adj: number[][] = slots.map((slot) => {
    const edges: number[] = [];
    for (let j = 0; j < escrowed.length; j++) {
      const it = escrowed[j];
      if (slot.item_id && it.item_id !== slot.item_id) continue;
      if (slot.predicate && !itemMatchesPredicate(it, slot.predicate)) continue;
      edges.push(j);
    }
    return edges;
  });
  const matchItem = new Array<number>(escrowed.length).fill(-1);
  const dfs = (u: number, seen: boolean[]): boolean => {
    for (const v of adj[u]) {
      if (seen[v]) continue;
      seen[v] = true;
      if (matchItem[v] === -1 || dfs(matchItem[v], seen)) {
        matchItem[v] = u;
        return true;
      }
    }
    return false;
  };
  for (let u = 0; u < slots.length; u++) {
    if (!dfs(u, new Array<boolean>(escrowed.length).fill(false))) return false;
  }
  return true;
}

/** Check whether a stall has 100% full reserve to cover `offer_asset * fills` jointly with all other OPEN listings. */
export function stallHasFullReserve(
  stall: BarterStallState,
  items: Record<string, PortableItem> | undefined,
  offer: BarterAssetSpec,
  fills: number,
  excludeListingId?: string,
): boolean {
  const n = Math.max(1, Math.floor(fills));
  const openOther = stall.listings.filter((l) => l.status === "OPEN" && l.listing_id !== excludeListingId);
  if (offer.kind === "RESOURCE") {
    const committed = openOther
      .filter((l) => l.offer_asset.kind === "RESOURCE" && l.offer_asset.resource === offer.resource)
      .reduce((acc, l) => acc + (l.offer_asset.kind === "RESOURCE" ? l.offer_asset.amount * l.fills_remaining : 0), 0);
    return (stall.resources[offer.resource] ?? 0) >= committed + offer.amount * n;
  }
  if (offer.kind === "LOT" || offer.kind === "CARGO") {
    const combinedOffers: Array<{ asset: BarterAssetSpec; fills: number }> = [
      ...openOther
        .filter((l) => l.offer_asset.kind === "LOT" || l.offer_asset.kind === "CARGO")
        .map((l) => ({ asset: l.offer_asset, fills: l.fills_remaining })),
      { asset: offer, fills: n },
    ];
    const lotDemands: Array<{ material: MaterialArchetype; minGrade: LotGrade; total: number }> = [];
    let cargoTotal = 0;
    for (const entry of combinedOffers) {
      if (entry.asset.kind === "LOT") {
        lotDemands.push({
          material: entry.asset.material,
          minGrade: entry.asset.grade || "WORN",
          total: entry.asset.amount * entry.fills,
        });
      } else if (entry.asset.kind === "CARGO") {
        cargoTotal += entry.asset.amount * entry.fills;
      }
    }
    // Allocate stricter grade demands first (REFINED -> SOUND -> WORN), then verify remaining pool covers CARGO.
    lotDemands.sort((a, b) => GRADE_RANK[b.minGrade] - GRADE_RANK[a.minGrade]);
    let remLots = normalizeMaterialLots(stall.material_lots);
    for (const demand of lotDemands) {
      const check = consumeMaterialLots(
        remLots,
        { [demand.material]: demand.total },
        { minGrade: demand.minGrade },
      );
      if (!check.ok) return false;
      remLots = check.lots;
    }
    return totalMaterialLots(remLots) >= cargoTotal;
  }
  if (offer.kind === "ITEM") {
    if (offer.item_id && n > 1) return false;
    if (!offer.item_id && !offer.predicate) return false;
    const escrowed = stallEscrowedItems(stall, items);
    const slots: Array<{ item_id?: string; predicate?: ItemPredicate }> = [];
    for (const l of openOther) {
      if (l.offer_asset.kind !== "ITEM") continue;
      const count = Math.max(0, Math.floor(l.fills_remaining));
      if (l.offer_asset.item_id && count > 1) return false;
      for (let i = 0; i < count; i++) {
        slots.push({ item_id: l.offer_asset.item_id, predicate: l.offer_asset.predicate });
      }
    }
    for (let i = 0; i < n; i++) {
      slots.push({ item_id: offer.item_id, predicate: offer.predicate });
    }
    return canAllocateDistinctItems(escrowed, slots);
  }
  return false;
}

export function allocateListingId(stallId: string, cycle: number, seq: number): string {
  return deterministicId("listing", stallId, cycle, seq);
}

export function summarizeAsset(asset: BarterAssetSpec): string {
  if (asset.kind === "RESOURCE") return `${asset.amount} ${asset.resource}`;
  if (asset.kind === "LOT") return `${asset.amount} ${asset.grade ? `${asset.grade} ` : ""}${asset.material}`;
  if (asset.kind === "CARGO") return `${asset.amount} cargo`;
  if (asset.kind === "ITEM") return asset.predicate?.archetype || asset.item_id || "item";
  return "asset";
}

export function roomHasSupersedingStall(
  stalls: Record<string, BarterStallState> | undefined,
  roomEntities: Array<{ entity_id: string; infra_type?: string; condition?: number; in_progress?: boolean; scar?: boolean }>,
): boolean {
  if (!stalls) return false;
  for (const ent of roomEntities) {
    if (ent.infra_type !== "barter_stall") continue;
    if (ent.in_progress || ent.scar) continue;
    if ((ent.condition ?? 0) < STALL_MIN_OPERATIONAL_CONDITION) continue;
    const st = stalls[ent.entity_id];
    if (!st) continue;
    if (st.listings.some((l) => l.status === "OPEN" && l.fills_remaining > 0)) {
      return true;
    }
  }
  return false;
}

export function roomMarketBand(
  stalls: Record<string, BarterStallState> | undefined,
  roomEntities: Array<{ entity_id: string; infra_type?: string; condition?: number; in_progress?: boolean; scar?: boolean }>,
): "stocked" | "sparse" | "empty" | undefined {
  const roomStalls = roomEntities.filter(
    (e) => e.infra_type === "barter_stall" && !e.in_progress && !e.scar && (e.condition ?? 0) >= STALL_MIN_OPERATIONAL_CONDITION,
  );
  if (!roomStalls.length) return undefined;
  let openFills = 0;
  for (const ent of roomStalls) {
    const st = stalls?.[ent.entity_id];
    if (!st) continue;
    for (const l of st.listings) {
      if (l.status === "OPEN" && l.fills_remaining > 0) openFills += l.fills_remaining;
    }
  }
  if (openFills >= 3) return "stocked";
  if (openFills >= 1) return "sparse";
  return "empty";
}

export function recentLocalClearingTape(
  tape: ClearingTapeEntry[] | undefined,
  roomId: string,
  nowCycle: number,
): ClearingTapeEntry[] {
  return (tape || [])
    .filter((t) => t.room_id === roomId && nowCycle - t.cycle <= WS01_CLEARING_WINDOW_CYCLES)
    .slice(-WS01_CLEARING_TAPE_CAP);
}

export function selectPlayerItemForAsset(
  items: Record<string, PortableItem> | undefined,
  playerId: string,
  asset: Extract<BarterAssetSpec, { kind: "ITEM" }>,
): PortableItem | undefined {
  return selectMatchingItem(playerCarriedItems(items, playerId), asset.predicate, asset.item_id);
}

export function depositLotIntoStall(
  stall: BarterStallState,
  material: MaterialArchetype,
  grade: LotGrade,
  amount: number,
): boolean {
  if (totalMaterialLots(stall.material_lots) + amount > STALL_TOTAL_LOTS_CAP) return false;
  stall.material_lots = creditMaterialLot(stall.material_lots, material, grade, amount);
  return true;
}

export function withdrawLotFromStall(
  stall: BarterStallState,
  material: MaterialArchetype,
  amount: number,
  minGrade: LotGrade = "WORN",
): { ok: true; consumed: MaterialLot[] } | { ok: false } {
  const res = consumeMaterialLots(stall.material_lots, { [material]: amount }, { minGrade });
  if (!res.ok) return { ok: false };
  stall.material_lots = normalizeMaterialLots(res.lots);
  return { ok: true, consumed: res.consumed };
}
