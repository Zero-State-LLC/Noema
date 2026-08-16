/** Private cognition fields are never a hosted command surface. */

const PRIVATE_COGNITION_KEYS = new Set([
  "cognition",
  "prompt",
  "plan",
  "thought",
  "inner_monologue",
  "system_prompt",
  "private_cognition",
]);

export function hasPrivateCognition(value: unknown, depth = 0): boolean {
  if (!value || typeof value !== "object" || depth > 2) return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (PRIVATE_COGNITION_KEYS.has(key.toLowerCase())) return true;
    if (child && typeof child === "object" && hasPrivateCognition(child, depth + 1)) return true;
  }
  return false;
}
