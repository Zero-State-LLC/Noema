/**
 * Dual-register labels. Authority: Noema-Specs docs/EXPERIENCE-TERMINOLOGY.md
 * Closed function so PLAY can serialize it without module scope.
 */

export type Register = "player" | "operator" | "research" | "schema";

export type ConceptId =
  | "experiment"
  | "subject"
  | "observation"
  | "metric"
  | "emergent_behavior"
  | "dataset"
  | "telemetry"
  | "operator"
  | "chamber"
  | "canonical_head"
  | "world_event_director"
  | "capability"
  | "relay_integrity"
  | "cycle"
  | "world"
  | "place"
  | "messages"
  | "trades"
  | "organizations"
  | "work"
  | "tie"
  | "record"
  | "lot"
  | "inherited"
  | "here";

export function label(concept: ConceptId, register: Register = "player"): string {
  const player: Record<string, string> = {
    experiment: "event",
    subject: "player",
    observation: "signal",
    metric: "index",
    emergent_behavior: "adaptation",
    dataset: "archive",
    telemetry: "telemetry",
    operator: "",
    chamber: "the Reach",
    canonical_head: "the world as it stands",
    world_event_director: "pressure",
    capability: "practice",
    relay_integrity: "Relay",
    cycle: "Cycle",
    world: "World",
    place: "Place",
    messages: "Messages",
    trades: "Trades",
    organizations: "Organizations",
    work: "Work",
    tie: "Tie",
    record: "Record",
    lot: "Lot",
    inherited: "Inherited",
    here: "Here",
  };
  const operator: Record<string, string> = {
    ...player,
    experiment: "experiment",
    observation: "observation",
    metric: "metric",
    emergent_behavior: "emergence candidate",
    dataset: "dataset",
    operator: "operator",
    chamber: "Chamber",
    canonical_head: "canonical head",
    world_event_director: "WED",
    capability: "capability",
  };
  const research: Record<string, string> = {
    ...operator,
    observation: "Observation",
    capability: "capability candidate",
  };
  const schema: Record<string, string> = {
    experiment: "experiment_id",
    subject: "player_id",
    observation: "Observation",
    metric: "metric",
    emergent_behavior: "emergence_candidate",
    dataset: "reproducibility_bundle",
    telemetry: "telemetry",
    operator: "admin",
    chamber: "Chamber",
    canonical_head: "head",
    world_event_director: "WED",
    capability: "capability_candidate",
    relay_integrity: "entity.condition",
    cycle: "cycle",
    world: "world_name",
    place: "location.name",
    messages: "messages",
    trades: "trades",
    organizations: "organizations",
    work: "practice_lines",
    tie: "social_memory_lines",
    record: "discovery_lines",
    lot: "lot_lines",
    inherited: "inherited_lines",
    here: "players_here",
  };
  const tables: Record<string, Record<string, string>> = { player, operator, research, schema };
  return (tables[register] || player)[concept] || concept;
}

export const PLAYER_FORBIDDEN = [
  "experiment",
  "subject",
  "capability candidate",
  "consciousness",
  "NOTICE",
  "CAPTURE",
  "LEARN",
  "apparatus",
] as const;
