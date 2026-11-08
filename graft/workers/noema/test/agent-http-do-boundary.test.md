# workers/noema/test/agent-http-do-boundary.test.ts

- Observation · type · L14-L19 — type Observation = { player_id: string; location: { room_id: string }; available_actions: string[]; affordances: Array<{ action: string; verb: string; target_id?: string; available: boolean }>; };
- Result · type · L20-L20 — type Result = { ok: boolean; error?: { code: string; message: string }; observation: Observation };
