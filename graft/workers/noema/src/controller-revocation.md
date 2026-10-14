# workers/noema/src/controller-revocation.ts

- RevocationKind · type · L6-L6 — type RevocationKind = "controller" | "jti";
- RevocationRecord · type · L8-L14 — type RevocationRecord = { kind: RevocationKind; id: string; controller_id: string; revoked_at: string; revoked_by: string; };
- RevocationStore · interface · L16-L19 — interface RevocationStore
- memoryRevocationStore · function · L21-L32 — function memoryRevocationStore(seed: RevocationRecord[] = []): RevocationStore
- put · method · L24-L26 — async put(rec)
- get · method · L27-L30 — async get(kind, id)
- durableRevocationStore · function · L34-L52 — function durableRevocationStore(env: Env): RevocationStore
- put · method · L37-L40 — async put(rec)
- get · method · L41-L50 — async get(kind, id)
- isControllerRevoked · function · L54-L62 — async function isControllerRevoked( store: RevocationStore, controllerId: string, jti?: string, ): Promise<boolean>
