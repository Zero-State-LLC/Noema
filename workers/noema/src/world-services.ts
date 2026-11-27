/**
 * First-world World Services — convenience adapters, not Players.
 * Authority: Noema-Specs WORLD-SERVICES.md & RFC-0140 (WS01..WS06 + WS02 supersession).
 */

import type { ClearingTapeEntry } from "./shops";

export type ServiceStatus = "AVAILABLE" | "DEGRADED" | "UNAVAILABLE" | "SUPERSEDED";

export type WorldServiceId =
  | "service.exchange.01"
  | "service.quartermaster.01"
  | "service.registry.01"
  | "service.relay.01"
  | "service.archive.01"
  | "service.contracts.01";

export interface WorldServiceDef {
  service_id: WorldServiceId;
  ws: string;
  display_name: string;
  role: string;
  aliases: string[];
  operations: string[];
  cannot: string[];
}

export interface ServiceView {
  service_id: WorldServiceId;
  display_name: string;
  role: string;
  status: ServiceStatus;
  operations: string[];
  cannot: string[];
  line: string;
  suggested_cmds: string[];
  local_clearing_tape?: ClearingTapeEntry[];
}

export const WORLD_SERVICE_CATALOG: WorldServiceDef[] = [
  {
    service_id: "service.exchange.01",
    ws: "WS01",
    display_name: "Exchange Broker",
    role: "trade interface",
    aliases: ["broker", "exchange", "trader"],
    operations: ["show open trades", "show local clearing tape (last 5 fills)", "prepare TRADE propose/accept/reject/cancel/fulfill"],
    cannot: ["invent prices", "force a trade", "create a global order book"],
  },
  {
    service_id: "service.quartermaster.01",
    ws: "WS02",
    display_name: "Quartermaster",
    role: "resource / storage interface",
    aliases: ["quartermaster", "stores", "yard"],
    operations: ["show observable stock", "prepare HARVEST", "cold-start node-backed emergency swap when no stocked stall operates here"],
    cannot: ["bank", "invent supply", "change harvest cost"],
  },
  {
    service_id: "service.registry.01",
    ws: "WS03",
    display_name: "Registrar",
    role: "institutions and membership",
    aliases: ["registrar", "registry", "clerk of record"],
    operations: ["show public orgs", "prepare ORG_CREATE / invite / join / leave"],
    cannot: ["invent organizations", "new governance"],
  },
  {
    service_id: "service.relay.01",
    ws: "WS04",
    display_name: "Relay Keeper",
    role: "infrastructure operations",
    aliases: ["keeper", "relay keeper", "relay"],
    operations: ["report condition", "prepare REPAIR"],
    cannot: ["auto-repair", "change costs", "mutate routes"],
  },
  {
    service_id: "service.archive.01",
    ws: "WS05",
    display_name: "Archivist",
    role: "records and evidence",
    aliases: ["archivist", "archive", "records"],
    operations: ["surface known records", "INSPECT artifacts"],
    cannot: ["reveal hidden history", "invent lore"],
  },
  {
    service_id: "service.contracts.01",
    ws: "WS06",
    display_name: "Contract Clerk",
    role: "agreements and civic contracts",
    aliases: ["contract clerk", "contracts", "clerk"],
    operations: ["show agreements and open civic contracts", "prepare CONTRACT_POST / CONTRACT_FULFILL"],
    cannot: ["free-form legal authority"],
  },
];

export interface RoomHint {
  room_id: string;
  name: string;
  description: string;
  entities: Array<{
    label: string;
    entity_type: string;
    infra_type?: string;
    condition?: number;
    harvestable?: boolean;
    stock_amount?: number;
    repairable?: boolean;
  }>;
  /** RFC-0140: whether an operational barter_stall with >=1 OPEN listing exists in this room. */
  has_stocked_barter_stall?: boolean;
  /** RFC-0140: room-local WS01 clearing tape (last <=5 fills within 20 cycles). */
  local_clearing_tape?: ClearingTapeEntry[];
  /** RFC-0140: active organizations / open contracts counts for WS03/WS06 presence. */
  active_org_count?: number;
  open_contract_count?: number;
}

export function servicesAtRoom(room: RoomHint): ServiceView[] {
  const out: ServiceView[] = [];
  const add = (
    id: WorldServiceId,
    status: ServiceStatus,
    line: string,
    cmds: string[],
    tape?: ClearingTapeEntry[],
  ) => {
    const def = WORLD_SERVICE_CATALOG.find((s) => s.service_id === id)!;
    if (out.some((s) => s.service_id === id)) return;
    out.push({
      service_id: def.service_id,
      display_name: def.display_name,
      role: def.role,
      status,
      operations: def.operations,
      cannot: def.cannot,
      line,
      suggested_cmds: cmds,
      ...(tape && tape.length ? { local_clearing_tape: tape } : {}),
    });
  };

  // WS01: Exchange Broker at Civic Exchange or rooms with a barter_stall / local clearing tape.
  const hasBarterStall = room.entities.some((e) => e.infra_type === "barter_stall");
  if (room.room_id === "room.civic-exchange" || hasBarterStall || (room.local_clearing_tape?.length ?? 0) > 0) {
    const tapeCount = room.local_clearing_tape?.length ?? 0;
    const line =
      tapeCount > 0
        ? `Exchange desk: ${tapeCount} recent room-local clearing fill${tapeCount === 1 ? "" : "s"} recorded. No global order book.`
        : "Exchange desk: local barter stalls and peer trades only. I do not invent prices or create an order book.";
    add(
      "service.exchange.01",
      "AVAILABLE",
      line,
      ["help trade"],
      room.local_clearing_tape,
    );
  }

  // WS03 & WS06: Registrar and Contract Clerk at Civic Exchange / Archive or when contracts exist.
  if (room.room_id === "room.civic-exchange" || room.room_id === "room.archive") {
    add(
      "service.registry.01",
      "AVAILABLE",
      `Registrar: ${room.active_org_count ?? 0} active public organization${room.active_org_count === 1 ? "" : "s"} on record.`,
      ["help org"],
    );
  }
  if (room.room_id === "room.civic-exchange" || (room.open_contract_count ?? 0) > 0) {
    add(
      "service.contracts.01",
      "AVAILABLE",
      `Contract clerk: ${room.open_contract_count ?? 0} open civic contract${room.open_contract_count === 1 ? "" : "s"} in this room.`,
      ["help agreement"],
    );
  }

  // Authorized fields only. Do not invent desks from room/name/description regex.
  const damaged = room.entities.find(
    (e) =>
      (e.entity_type || "").toUpperCase() === "INFRASTRUCTURE" &&
      (e.repairable === true || (e.condition != null && e.condition < 100)),
  );
  if (damaged) {
    const cond = damaged.condition;
    const status: ServiceStatus = cond != null && cond < 25 ? "DEGRADED" : "AVAILABLE";
    const line =
      cond != null
        ? `Relay office: observable condition ${cond}%. I can explain repair requirements. I will not repair it for you.`
        : "Relay office: I can report known routes and prepare a REPAIR. Confirm the action yourself.";
    add("service.relay.01", status, line, [`inspect ${damaged.label}`, `repair ${damaged.label}`]);
  }

  const records = room.entities.filter((e) => (e.entity_type || "").toUpperCase() === "ARTIFACT");
  if (records.length) {
    add(
      "service.archive.01",
      "AVAILABLE",
      "Archive terminal: known records only. Unknown remains unknown. I am not an oracle.",
      records.slice(0, 2).map((e) => `inspect ${e.label}`),
    );
  }

  const node = room.entities.find((e) => e.harvestable || (e.stock_amount != null && e.stock_amount > 0));
  if (node) {
    // RFC-0140: WS02 deterministically transitions to SUPERSEDED when an operational
    // barter_stall in this room has >= 1 OPEN listing.
    const superseded = Boolean(room.has_stocked_barter_stall);
    const status: ServiceStatus = superseded ? "SUPERSEDED" : "AVAILABLE";
    const line = superseded
      ? "Stores [SUPERSEDED]: an operational barter stall is serving this room. Emergency salvage swaps are paused while resident storefronts operate."
      : "Stores: I can show observable stock, prepare HARVEST, or execute node-backed emergency salvage swaps while no stocked stall operates here.";
    add(
      "service.quartermaster.01",
      status,
      line,
      superseded ? [`inspect ${node.label}`, `harvest ${node.label}`] : [`inspect ${node.label}`, `harvest ${node.label}`, "swap emergency_ration_charge"],
    );
  }
  return out;
}

export function resolveService(raw: string, present: ServiceView[]): ServiceView | null {
  const q = raw.trim().toLowerCase();
  if (!q) return null;
  const defs = WORLD_SERVICE_CATALOG;
  const hit = present.find((s) => {
    if (s.service_id === q || s.display_name.toLowerCase() === q) return true;
    const def = defs.find((d) => d.service_id === s.service_id);
    return def?.aliases.some((a) => q === a || q.includes(a) || a.includes(q));
  });
  return hit || null;
}

export function isServiceConsultLine(line: string): boolean {
  const v = line.trim().split(/\s+/)[0]?.toLowerCase() || "";
  return v === "talk" || v === "use" || v === "consult" || v === "service";
}

export function consultLine(service: ServiceView): string {
  const cmds = service.suggested_cmds.length ? ` Confirm yourself: ${service.suggested_cmds.join(" · ")}` : "";
  const denied = service.cannot.length ? ` I will not: ${service.cannot.join("; ")}.` : "";
  return `${service.display_name} [${service.status}]. ${service.line}${denied}${cmds}`;
}
