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

/** Route literals the Worker router compares `path` against. */
export function extractRoutes(source) {
  const out = new Set();
  for (const m of String(source || "").matchAll(/path === "([^"]+)"/g)) out.add(m[1]);
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
 * 404 means the router never matched — the route is not in the running build.
 * Anything else means the handler ran and rejected, so the route IS deployed.
 * A network failure is indeterminate and must not read as either.
 */
export function classifyProbe(status) {
  if (status === null || status === undefined) return "UNDETERMINED";
  if (Number(status) === 404) return "ABSENT";
  return "PRESENT";
}

/** An added route that probes PRESENT means the publish carried it. */
export function summarize(results) {
  const absent = results.filter((r) => r.verdict === "ABSENT").map((r) => r.route);
  const present = results.filter((r) => r.verdict === "PRESENT").map((r) => r.route);
  const undetermined = results.filter((r) => r.verdict === "UNDETERMINED").map((r) => r.route);
  return {
    absent,
    present,
    undetermined,
    published: absent.length === 0 && undetermined.length === 0 && results.length > 0,
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
    let status = null;
    try {
      const res = await fetch(`${origin}${route}`, { method: "GET" });
      status = res.status;
    } catch {
      status = null;
    }
    const verdict = classifyProbe(status);
    results.push({ route, status, verdict });
    console.log(`  ${route} → ${status ?? "unreachable"} ${verdict}`);
  }
  const s = summarize(results);
  console.log(s.published ? "PUBLISHED: every added route answers on the live build" : "NOT PUBLISHED: added routes are absent from the live build");
}

if (import.meta.url === `file://${process.argv[1]}`) await main();
