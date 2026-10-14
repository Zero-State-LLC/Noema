# workers/noema/src/access-policy.ts

- AccessPolicyMode · type · L11-L11 — type AccessPolicyMode = "DENY" | "CLEAR" | "ALLOW_ONLY";
- AccessPolicyScope · type · L12-L12 — type AccessPolicyScope = "EXIT" | "ROOM";
- parseAccessMode · function · L14-L20 — function parseAccessMode(raw: string): AccessPolicyMode | null
- parseAccessScope · function · L22-L27 — function parseAccessScope(raw: string): AccessPolicyScope | null
- parseAccessPolicyLine · function · L29-L113 — function parseAccessPolicyLine( parts: string[], ctx: { players?: Array<{ player_id: string; handle?: string }>; selfId?: string } = {}, ): | { ok: true; action: { verb: "COMMIT"; arguments: { operation: "ACCESS_POLICY"; scope: AccessPolicyScope; mode: AccessPolicyMode; applies_to: string; acting_for?: string; expires_cycle?: number; direction?: string; }; }; display: string; } | { ok: false; error: string; code?: string }
