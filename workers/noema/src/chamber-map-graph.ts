export const CHAMBER_MAP_ROOM_IDS = [
  "room.civic-exchange",
  "room.relay-quarter",
  "room.foundry-corridor",
  "room.transit-ring",
  "room.infrastructure-vault",
  "room.archive",
  "room.outer-works",
  "room.storage-district",
  "room.generator-hall",
  "room.frontier-gate",
] as const;

export const CHAMBER_MAP_ENTRY_ROOM_ID = "room.civic-exchange";

const NAMES: Record<(typeof CHAMBER_MAP_ROOM_IDS)[number], { name: string; description: string }> = {
  "room.civic-exchange": { name: "Civic Exchange", description: "Central meeting and trade hub. High visibility." },
  "room.relay-quarter": { name: "Relay Quarter", description: "Primary communication infrastructure. Early degradation pressure." },
  "room.foundry-corridor": { name: "Foundry Corridor", description: "Production-focused corridor. Resource nodes and production infrastructure." },
  "room.transit-ring": { name: "Transit Ring", description: "Movement hub with multiple exits. Chokepoint potential." },
  "room.infrastructure-vault": { name: "Infrastructure Vault", description: "Hardened maintenance and logistics space. Defensible." },
  "room.archive": { name: "Archive", description: "Knowledge and document focus. Low material, high information." },
  "room.outer-works": { name: "Outer Works", description: "Edge location. Exploration gateway and risk." },
  "room.storage-district": { name: "Storage District", description: "Logistics node. High storage_bay potential." },
  "room.generator-hall": { name: "Generator Hall", description: "Power generation. Critical for production modifiers." },
  "room.frontier-gate": { name: "Frontier Gate", description: "Edge of known map. Leads toward later expansion." },
};

const LINKS: Array<[string, string, string, string]> = [
  ["room.civic-exchange", "room.relay-quarter", "north", "south"],
  ["room.civic-exchange", "room.transit-ring", "east", "west"],
  ["room.civic-exchange", "room.storage-district", "west", "east"],
  ["room.relay-quarter", "room.infrastructure-vault", "down", "up"],
  ["room.relay-quarter", "room.generator-hall", "east", "west"],
  ["room.foundry-corridor", "room.transit-ring", "south", "north"],
  ["room.foundry-corridor", "room.generator-hall", "west", "east"],
  ["room.transit-ring", "room.outer-works", "east", "west"],
  ["room.transit-ring", "room.frontier-gate", "south", "north"],
  ["room.storage-district", "room.infrastructure-vault", "north", "south"],
  ["room.civic-exchange", "room.archive", "down", "up"],
  ["room.outer-works", "room.frontier-gate", "south", "north"],
];

import type { GenesisRoom } from "./genesis";

export function chamberMapRooms(): Record<string, GenesisRoom> {
  const rooms: Record<string, GenesisRoom> = {};
  for (const id of CHAMBER_MAP_ROOM_IDS) {
    const n = NAMES[id];
    rooms[id] = { room_id: id, name: n.name, description: n.description, exits: [], entities: [] };
  }
  for (const [a, b, dirA, dirB] of LINKS) {
    rooms[a].exits.push({ direction: dirA, to_room_id: b });
    rooms[b].exits.push({ direction: dirB, to_room_id: a });
  }
  return rooms;
}
