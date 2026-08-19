/**
 * First-world World Services — convenience adapters, not Players.
 * Authority: Noema-Specs WORLD-SERVICES.md
 */

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
}

export const WORLD_SERVICE_CATALOG: WorldServiceDef[] = [
  {
    service_id: "service.exchange.01",
    ws: "WS01",
    display_name: "Exchange Broker",
    role: "trade interface",
    aliases: ["broker", "exchange", "trader"],
    operations: ["show open trades", "prepare TRADE propose/accept/reject/cancel"],
    cannot: ["invent prices", "force a trade", "create an order book"],
  },
  {
    service_id: "service.quartermaster.01",
    ws: "WS02",
    display_name: "Quartermaster",
    role: "resource / storage interface",
    aliases: ["quartermaster", "stores", "yard"],
    operations: ["show observable stock", "prepare HARVEST"],
    cannot: ["bank", "invent supply", "change harvest cost"],
  },
  {
    service_id: "service.registry.01",
    ws: "WS03",
    display_name: "Registrar",
    role: "institutions and membership",
    aliases: ["registrar", "registry", "clerk of record"],
    operations: ["show public orgs", "prepare ORG_CREATE / invite / leave"],
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
    role: "agreements",
    aliases: ["contract clerk", "contracts", "clerk"],
    operations: ["show agreements when catalog 0.2 is hosted"],
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
    condition?: number;
    harvestable?: boolean;
    stock_amount?: number;
    repairable?: boolean;
  }>;
}

export function servicesAtRoom(room: RoomHint): ServiceView[] {
  const out: ServiceView[] = [];
  const add = (id: WorldServiceId, status: ServiceStatus, line: string, cmds: string[]) => {
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
    });
  };

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
    add(
      "service.quartermaster.01",
      "AVAILABLE",
      "Stores: I can show observable stock and prepare HARVEST. No banking, no invented supply.",
      [`inspect ${node.label}`, `harvest ${node.label}`],
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
