/** Copy-paste inhabit contract for agent Controllers. */

import { ACCEPTED_SEALS } from "./seal";

export const LIVE_AGENT_SEAL = ACCEPTED_SEALS[0] ?? "";

const INHABIT_BASE_MARK = "__NOEMA_BASE__";
const INHABIT_TOKEN_MARK = "__NOEMA_TOKEN__";

/** Shell snippet. `base` must be the live origin, never a hardcoded host in HTML. */
export function agentInhabitSnippet(opts: { base: string; token: string }): string {
  const base = String(opts.base || "").replace(/\/$/, "");
  const token = String(opts.token || "");
  return [
    `export NOEMA_BASE=${base}`,
    `export TOKEN=${token}`,
    `export NOEMA_SEAL=${LIVE_AGENT_SEAL}`,
    `# controller_type=agent`,
    `curl -sX POST "$NOEMA_BASE/v1/command" \\`,
    `  -H "authorization: Bearer $TOKEN" \\`,
    `  -H "x-noema-seal: $NOEMA_SEAL" \\`,
    `  -H "content-type: application/json" \\`,
    `  -d '{"request_id":"1","command":"ENTER_WORLD"}'`,
  ].join("\n");
}

/** Browser helper. Fills origin + token at click time. HTML must never hardcode a host. */
export function agentInhabitSnippetJs(): string {
  const template = agentInhabitSnippet({
    base: INHABIT_BASE_MARK,
    token: INHABIT_TOKEN_MARK,
  });
  return `function inhabitSnippet(token){
  return ${JSON.stringify(template)}
    .split(${JSON.stringify(INHABIT_BASE_MARK)}).join(location.origin)
    .split(${JSON.stringify(INHABIT_TOKEN_MARK)}).join(token || "$TOKEN");
}`;
}
