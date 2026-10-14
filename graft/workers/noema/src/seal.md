# workers/noema/src/seal.ts

- parseSeal · function · L13-L16 — function parseSeal(raw: unknown): string | null
- acceptedSeals · function · L18-L20 — function acceptedSeals(list: readonly string[] = ACCEPTED_SEALS): string[]
- SealWorldKind · type · L22-L22 — type SealWorldKind = "default" | "isolated" | "deny";
- checkLiveAgentSeal · function · L24-L46 — function checkLiveAgentSeal(input: { controllerType: string; worldKind: SealWorldKind; presented: string | null; catalog?: readonly string[]; }): | { ok: true; seal: string | null } | { ok: false; code: "SEAL_REQUIRED" | "SEAL_MISMATCH"; message: string }
- sealHelloFields · function · L48-L56 — function sealHelloFields( worldId?: string, defaultWorldId?: string, catalog: readonly string[] = ACCEPTED_SEALS, ): { seal_required: boolean; accepted_seals?: string[] }
