# workers/noema/test/agent-discovery-visibility.test.ts

- Offered · type · L7-L10 — type Offered = { action: string; verb: string; operation?: string; target_id?: string; label?: string; requires?: Record<string, number>; available: boolean; };
- Reply · type · L11-L19 — type Reply = { ok: boolean; error?: { code: string }; events?: Array<{ event_type: string; payload: Record<string, unknown> }>; observation: { location: { room_id: string; exits: Array<{ direction: string; to_room_id: string }>; entities: Array<{ entity_id: string }> }; affordances: Offered[]; available_actions: string[]; budgets: Record<string, number>; }; };
- discoveryVisibilityWorld · function · L24-L35 — function discoveryVisibilityWorld()
