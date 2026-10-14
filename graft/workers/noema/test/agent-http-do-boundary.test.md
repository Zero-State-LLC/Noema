# workers/noema/test/agent-http-do-boundary.test.ts

- Observation · type · L13-L18 — type Observation = { player_id: string; location: { room_id: string }; available_actions: string[]; affordances: Array<{ action: string; verb: string; target_id?: string; available: boolean }>; };
- Result · type · L19-L19 — type Result = { ok: boolean; error?: { code: string; message: string }; observation: Observation };
