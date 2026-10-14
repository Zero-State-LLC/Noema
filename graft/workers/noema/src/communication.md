# workers/noema/src/communication.ts

- LongRangeBand · type · L26-L26 — type LongRangeBand = "UNREACHABLE" | "DELAYED" | "IMMEDIATE";
- longRangeBand · function · L28-L36 — function longRangeBand( best: number | null, failBelow = LONG_RANGE_MIN_CONDITION, immediateAt = SAME_CYCLE_MIN_CONDITION, ): LongRangeBand
- RelayLike · type · L38-L44 — type RelayLike = { entity_id: string; label: string; entity_type: string; condition?: number; in_progress?: boolean; };
- isRelayEntity · function · L46-L51 — function isRelayEntity(e: RelayLike): boolean
- bestLiveRelayCondition · function · L54-L62 — function bestLiveRelayCondition(relays: RelayLike[]): number | null
- longRangeDeliverable · function · L64-L69 — function longRangeDeliverable( best: number | null, min = LONG_RANGE_MIN_CONDITION, ): boolean
- PendingMessage · type · L71-L79 — type PendingMessage = { message_id: string; sender_id: string; recipient_id: string; text: string; sent_cycle: number; deliver_at_cycle: number; claim?: import("./rumor").ClaimPayload; };
- collectLiveRelays · function · L81-L92 — function collectLiveRelays( rooms: Record<string, { entities?: RelayLike[] }>, ): RelayLike[]
