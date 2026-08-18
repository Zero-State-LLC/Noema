/** Private cognition fields are never a hosted command surface. */

export const PRIVATE_COGNITION_KEYS = new Set([
  "cognition",
  "prompt",
  "plan",
  "thought",
  "inner_monologue",
  "system_prompt",
  "private_cognition",
  "api_key",
  "secret",
  "access_token",
  "device_code",
  "chain_of_thought",
  "cot",
]);

const MAX_DEPTH = 16;

export function hasPrivateCognition(value: unknown, depth = 0): boolean {
  if (value == null || depth > MAX_DEPTH) return depth > MAX_DEPTH;
  if (Array.isArray(value)) {
    return value.some((child) => hasPrivateCognition(child, depth + 1));
  }
  if (typeof value !== "object") return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (PRIVATE_COGNITION_KEYS.has(key.toLowerCase())) return true;
    if (hasPrivateCognition(child, depth + 1)) return true;
  }
  return false;
}
