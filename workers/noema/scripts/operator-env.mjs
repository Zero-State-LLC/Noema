/**
 * Load operator secrets from a local 0600 file. Never log values.
 * Paths (first wins per key): $NOEMA_OPERATOR_ENV, ~/.config/noema/operator.env, workers/noema/.env
 */
import { homedir } from "node:os";
import { join } from "node:path";
import { readFileSync, statSync } from "node:fs";

export const DEFAULT_OPERATOR_ENV = join(homedir(), ".config/noema/operator.env");

export function parseOperatorEnv(text) {
  const out = {};
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (/^[A-Z][A-Z0-9_]*$/.test(key) && val) out[key] = val;
  }
  return out;
}

export function operatorEnvPaths(cwd = process.cwd()) {
  const extra = process.env.NOEMA_OPERATOR_ENV ? [process.env.NOEMA_OPERATOR_ENV] : [];
  return [...extra, DEFAULT_OPERATOR_ENV, join(cwd, ".env")];
}

export function loadOperatorEnv(cwd = process.cwd()) {
  const loaded = [];
  const values = {};
  for (const path of operatorEnvPaths(cwd)) {
    let st;
    try {
      st = statSync(path);
    } catch {
      continue;
    }
    if (!st.isFile()) continue;
    const parsed = parseOperatorEnv(readFileSync(path, "utf8"));
    for (const [k, v] of Object.entries(parsed)) {
      if (values[k] === undefined) values[k] = v;
    }
    loaded.push({ path, keys: Object.keys(parsed).sort(), mode: st.mode & 0o777 });
  }
  return { values, loaded };
}

/** operator secret (raw) vs already-minted admin JWT */
export function classifyAdminMaterial(raw) {
  const token = String(raw || "").trim();
  if (!token) return { ok: false, kind: null };
  const parts = token.split(".");
  if (parts.length === 3 && parts.every((p) => p.length > 0)) return { ok: true, kind: "admin_jwt" };
  if (token.length >= 8) return { ok: true, kind: "operator_secret" };
  return { ok: false, kind: null };
}

/**
 * @param {Record<string, string | undefined>} [envLike]
 * @param {Record<string, string | undefined>} [fileValues]
 */
export function resolveAdminMaterial(envLike, fileValues = {}) {
  const envSrc = envLike || {};
  const merged = { ...fileValues };
  for (const k of ["ADMIN_TOKEN", "ADMIN_OPERATOR_TOKEN"]) {
    if (envSrc[k]) merged[k] = envSrc[k];
  }
  const raw = merged.ADMIN_TOKEN || merged.ADMIN_OPERATOR_TOKEN || "";
  const classified = classifyAdminMaterial(raw);
  return { ...classified, present: Boolean(raw), source: envSrc.ADMIN_TOKEN
    ? "env.ADMIN_TOKEN"
    : envSrc.ADMIN_OPERATOR_TOKEN
      ? "env.ADMIN_OPERATOR_TOKEN"
      : fileValues.ADMIN_TOKEN
        ? "file.ADMIN_TOKEN"
        : fileValues.ADMIN_OPERATOR_TOKEN
          ? "file.ADMIN_OPERATOR_TOKEN"
          : null };
}
