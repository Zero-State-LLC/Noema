import type { Env } from "./types";

/** Same named DO as device/enrollment bags. Kept local to avoid auth↔enrollment import cycles. */
const ENROLLMENT_DO_NAME = "__noema_enrollments__";

export type RevocationKind = "controller" | "jti";

export type RevocationRecord = {
  kind: RevocationKind;
  id: string;
  controller_id: string;
  revoked_at: string;
  revoked_by: string;
};

export interface RevocationStore {
  put(rec: RevocationRecord): Promise<void>;
  get(kind: RevocationKind, id: string): Promise<RevocationRecord | null>;
}

export function memoryRevocationStore(seed: RevocationRecord[] = []): RevocationStore {
  const map = new Map(seed.map((r) => [`${r.kind}:${r.id}`, { ...r }]));
  return {
    async put(rec) {
      map.set(`${rec.kind}:${rec.id}`, { ...rec });
    },
    async get(kind, id) {
      const rec = map.get(`${kind}:${id}`);
      return rec ? { ...rec } : null;
    },
  };
}

export function durableRevocationStore(env: Env): RevocationStore {
  const stub = env.WORLD_DO.get(env.WORLD_DO.idFromName(ENROLLMENT_DO_NAME));
  return {
    async put(rec) {
      const res = await stub.fetch("https://do/revoke", { method: "PUT", body: JSON.stringify(rec) });
      if (!res.ok) throw new Error("revocation persist failed");
    },
    async get(kind, id) {
      const res = await stub.fetch(
        `https://do/revoke?kind=${encodeURIComponent(kind)}&id=${encodeURIComponent(id)}`,
      );
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("revocation load failed");
      const body = (await res.json()) as Partial<RevocationRecord>;
      if (!body?.kind || !body?.id) return null;
      return body as RevocationRecord;
    },
  };
}

export async function isControllerRevoked(
  store: RevocationStore,
  controllerId: string,
  jti?: string,
): Promise<boolean> {
  if (await store.get("controller", controllerId)) return true;
  if (jti && (await store.get("jti", jti))) return true;
  return false;
}
