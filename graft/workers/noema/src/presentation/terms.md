# workers/noema/src/presentation/terms.ts

- Register · type · L6-L6 — type Register = "player" | "operator" | "research" | "schema";
- ConceptId · type · L8-L33 — type ConceptId = | "experiment" | "subject" | "observation" | "metric" | "emergent_behavior" | "dataset" | "telemetry" | "operator" | "chamber" | "canonical_head" | "world_event_director" | "capability" | "relay_integrity" | "cycle" | "world" | "place" | "messages" | "trades" | "organizations" | "work" | "tie" | "record" | "lot" | "inherited" | "here";
- label · function · L35-L110 — function label(concept: ConceptId, register: Register = "player"): string
