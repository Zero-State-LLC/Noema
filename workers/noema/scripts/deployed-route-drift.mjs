#!/usr/bin/env node
/**
 * Deployed-route drift: which routes exist on main that the live build lacks?
 *
 * `/version` tells you the build id changed. It does not tell you WHICH feature
 * landed, so "is repair X live?" has been answered by reading commit order —
 * inference, and wrong the moment a publish interleaves with a merge.
 *
 * A route is a public discriminator. A deployed handler rejects a bad request
 * (401/400/405); an absent route falls through to 404. Noema #571 used that pair
 * by hand to show the enrollment repairs were merged and not live. This makes it
 * repeatable.
 *
 * Usage:
 *   node scripts/deployed-route-drift.mjs --live-ref <commit> [--probe <origin>]
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ROUTE_SOURCE = "workers/noema/src/index.ts";

/**
 * Routes the Worker router matches, as `METHOD path`.
 *
 * The method is not decoration. 27 of 50 routes are POST-only, and a POST-only
 * route probed with GET falls through the router to 404 — indistinguishable
 * from absent. The first real run of this script reported two live routes as
 * ABSENT for exactly that reason.
 */
export function extractRoutes(source) {
  const text = String(source || "");
  const out = new Set();
  for (const m of text.matchAll(/method === "([A-Z]+)"\s*&&\s*path === "([^"]+)"/g)) {
    out.add(`${m[1]} ${m[2]}`);
  }
  // Routes matched on path alone answer any method; GET is the safe probe.
  for (const m of text.matchAll(/(?<!method === "[A-Z]{1,10}" && )path === "([^"]+)"/g)) {
    const path = m[1];
    if (![...out].some((r) => r.endsWith(` ${path}`))) out.add(`ANY ${path}`);
  }
  return [...out].sort();
}

export function diffRoutes(liveSource, mainSource) {
  const live = new Set(extractRoutes(liveSource));
  const main = new Set(extractRoutes(mainSource));
  return {
    added: [...main].filter((r) => !live.has(r)).sort(),
    removed: [...live].filter((r) => !main.has(r)).sort(),
  };
}

/**
 * Only GET is probed. Sending the real method would mean POSTing to endpoints
 * like `/v1/auth/device/review/approve` against production, which could approve
 * a live device enrollment. A drift detector must never mutate the thing it
 * measures, so a non-GET route is reported as unprobeable rather than guessed.
 */
export function isProbeable(route) {
  const method = String(route).split(" ")[0];
  return method === "GET" || method === "ANY";
}

/**
 * 404 means the router never matched — the route is not in the running build.
 * Anything else means the handler ran and rejected, so the route IS deployed.
 * A network failure is indeterminate and must not read as either.
 */
export function classifyProbe(status) {
  if (status === null || status === undefined) return "UNDETERMINED";
  if (Number(status) === 404) return "ABSENT";
  return "PRESENT";
}

/**
 * An added route that probes PRESENT means the publish carried it.
 *
 * `published` speaks only for routes actually probed. Unprobeable POST routes
 * are counted and reported so partial coverage is visible rather than implied,
 * and a run that probed nothing is never "published".
 */
export function summarize(results) {
  const pick = (v) => results.filter((r) => r.verdict === v).map((r) => r.route);
  const absent = pick("ABSENT");
  const present = pick("PRESENT");
  const undetermined = pick("UNDETERMINED");
  const unprobeable = pick("UNPROBEABLE");
  return {
    absent,
    present,
    undetermined,
    unprobeable,
    published: absent.length === 0 && undetermined.length === 0 && present.length > 0,
  };
}

function arg(name) {
  const i = process.argv.indexOf(name);
  return i === -1 ? null : process.argv[i + 1];
}

async function main() {
  const liveRef = arg("--live-ref");
  if (!liveRef) {
    console.error("--live-ref <commit> is required (the commit the live build was cut from)");
    process.exit(2);
  }
  const liveSource = execFileSync("git", ["show", `${liveRef}:${ROUTE_SOURCE}`], { encoding: "utf8" });
  const mainSource = readFileSync(ROUTE_SOURCE, "utf8");
  const { added, removed } = diffRoutes(liveSource, mainSource);

  console.log(`live-ref ${liveRef}`);
  console.log(`routes added since the live build: ${added.length ? added.join(", ") : "(none)"}`);
  if (removed.length) console.log(`routes removed on main: ${removed.join(", ")}`);
  if (!added.length) return;

  const origin = arg("--probe");
  if (!origin) return;

  const results = [];
  for (const route of added) {
    const path = route.slice(route.indexOf(" ") + 1);
    if (!isProbeable(route)) {
      results.push({ route, status: null, verdict: "UNPROBEABLE" });
      console.log(`  ${route} → not probed (non-GET; would mutate production)`);
      continue;
    }
    let status = null;
    try {
      const res = await fetch(`${origin}${path}`, { method: "GET" });
      status = res.status;
    } catch {
      status = null;
    }
    const verdict = classifyProbe(status);
    results.push({ route, status, verdict });
    console.log(`  ${route} → ${status ?? "unreachable"} ${verdict}`);
  }
  const s = summarize(results);
  if (s.published) {
    console.log(`PUBLISHED: every probed route answers on the live build (${s.present.length} probed, ${s.unprobeable.length} not probeable)`);
  } else {
    console.log(`NOT PUBLISHED: ${s.absent.length} absent, ${s.undetermined.length} undetermined, ${s.unprobeable.length} not probeable`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
