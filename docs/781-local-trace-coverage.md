# Bounded local S3 trace-coverage evidence

## Status and applicability

**OBSERVED:** PRs [839](https://github.com/Zero-State-LLC/Noema/pull/839) and [840](https://github.com/Zero-State-LLC/Noema/pull/840) landed local coverage additions. This seal records their evidence at runtime base `7ee7a20485fcd8c54dac0f71344fe36cf052fefd`; a later documentation merge does not replace those source pins.

This is not full S3/T3.5/R4 acceptance. Refs #781, #733, #837: all remain OPEN at seal preparation. The historical [R4 matrix](R4-NATIVE-INTERACTION-MATRIX-20261102.md) and [frozen S2 assertion map](780-whole-spec-assertions.json) are unchanged; no task state or follow-up is upgraded here. README/KANBAN and other audit documents remain outside this one-file seal.

Normative compatibility pin: [`b86c4b09cf75b3027d87998eff0952c2421bf52d`](https://github.com/Zero-State-LLC/Noema-Specs/tree/b86c4b09cf75b3027d87998eff0952c2421bf52d). Applicable requirements are [S3/TASKS124–172](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/MUD-NATIVE-INTERACTION-TASKS.md#L124-L172) and [security requirements338–344](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/MUD-NATIVE-INTERACTION-AND-WORLD-PRESENCE.md#L338-L344). Maintained Agent and spectator obligations apply; retired human PLAY/HELP behavior is not revived.

## Landed source and executed gates

| Packet | Reviewed candidate | Actual squash merge | Separate main-push CI | Actual Worker result |
|---|---|---|---|---|
| 839 | `1586407ee7548824c7b89df934d4565d83d027cb` | `a4289e135fd1314c174fc041cb8cb4efbd2ece50` | [42424854048](https://github.com/Zero-State-LLC/Noema/actions/runs/42424854048) | 2437 passed / 0 failed / 0 pending |
| 840 | `62ea5eea549f48cec212ad6de34335f0b836f90b` | `7ee7a20485fcd8c54dac0f71344fe36cf052fefd` | [42427712954](https://github.com/Zero-State-LLC/Noema/actions/runs/42427712954) | 2447 passed / 0 failed / 0 pending |

Each packet's reviewed and merged trees matched exactly, its remote source branch was deleted, and its main-push CI executed the complete Worker suite, typecheck, AGENTS check and offline Python suite successfully. Both Python runs reported **589 passed / 3 PostgreSQL-service skips / 0 failures or errors**. Those service-dependent cases were not exercised against a provisioned external database.

PR-head CI was separately pinned: [839/42424121867](https://github.com/Zero-State-LLC/Noema/actions/runs/42424121867) and [840/42427513402](https://github.com/Zero-State-LLC/Noema/actions/runs/42427513402). Local final cohorts used Node22.23.1/Python3.11.15; local Python import origin was verified in the task checkout. Native graph freshness, diff and frozen-file checks passed. Graft meaning remained unbuilt; wiring freshness and inspected edge deltas do not establish global semantic-graph accuracy.

Independent Standards and pinned-Spec technical reviews passed on each candidate. GitHub had no eligible submitted approving review at either merge. Separate operator-authorized review-rule exceptions were recorded and exactly read back before the head-pinned squash/admin merges: [839/comment6714389081](https://github.com/Zero-State-LLC/Noema/pull/839#issuecomment-6714389081), [840/comment6714760726](https://github.com/Zero-State-LLC/Noema/pull/840#issuecomment-6714760726). These are not GitHub approvals or authority for this documentation PR or any later PR. Review protection was unchanged.

## Finite observable inventory

The two packets add **20 registered tests**: ten per packet, with earlier registration multiplicities preserved. Runner totals rose from 2427 to 2437 to 2447. Count assertion records as a multiset: identical test names already exist in the baseline, so a dictionary keyed only by file/name undercounts totals.

Source: [839 mounted residue module](https://github.com/Zero-State-LLC/Noema/blob/a4289e135fd1314c174fc041cb8cb4efbd2ece50/workers/noema/test/s3-mounted-residue-next10.test.ts); [840 authored-text module](https://github.com/Zero-State-LLC/Noema/blob/7ee7a20485fcd8c54dac0f71344fe36cf052fefd/workers/noema/test/s3-authored-text-boundaries.test.ts); [840 generated-client case and fake-DOM instrument](https://github.com/Zero-State-LLC/Noema/blob/7ee7a20485fcd8c54dac0f71344fe36cf052fefd/workers/noema/test/watch-live.test.ts).

| Packet | Registered case title |
|---|---|
| 839 | N01 private rumor does not become a trace; public twin does |
| 839 | N02 public rumor must concern this room or a visible entity here |
| 839 | N03 hidden owned work does not create an org mark; visible twin does |
| 839 | N04 occupied office has no vacant memorial; vacancy does |
| 839 | N05 only the current last board entry becomes a notice |
| 839 | N06 cleared board has no retained notice after fixture reconstruction |
| 839 | N07 cleared shout has no retained notice after fixture reconstruction |
| 839 | N08 cleared institution notice has no retained projection |
| 839 | N09 cleared trade notice has no retained projection |
| 839 | N10 trace wire is capped deduplicated and provenance-free |
| 840 | T35 LOOK board preserves literal bounded public text on JSON wire |
| 840 | T35 LOOK institution notice retains literal public text |
| 840 | T35 LOOK shout preserves literal normalized public text |
| 840 | T35 LOOK trade notice retains literal public text |
| 840 | T35 WATCH excludes board but keeps a visible scar |
| 840 | T35 WATCH excludes institution_notice but keeps a visible scar |
| 840 | T35 WATCH excludes shout but keeps a visible scar |
| 840 | T35 WATCH excludes trade_notice but keeps a visible scar |
| 840 | T35 WATCH visible hostile-looking scar is literal; hidden twin is excluded |
| 840 | T35 generated WATCH uses fresh text nodes, never HTML sinks, for scar on startup and Refresh |

### What those oracles establish

- Packet839 exercises mounted gateway→fixture object→Agent LOOK read-time projection. PRIVATE/off-site rumors, hidden owned work and occupied-office controls are paired with permitted counterparts. Latest-board selection and retained source collection are checked. Clearing board/shout/institution/trade source is a controlled read-time intervention, not elapsed-time expiry or proof of authority to change it. Cap/deduplication/public-field assertions apply to the bounded trace wire, not every observation or spectator field.
- Packet840's four LOOK cases assert current literal JSON text treatment and the public field allowlist. Board specifically exercises the current truncation bound; literal markup in JSON is not an HTML-sanitization or browser-escaping claim. Each WATCH exclusion isolates one forbidden notice family with a required visible scar, below the cap so truncation cannot mask admission. The visible/hidden scar oracle is scoped to traces, not unrelated event/narrative fields.
- The generated WATCH client consumes an actual permitted projection. Functional `innerHTML`, `outerHTML` and `insertAdjacentHTML` recorders must remain empty before text-node assertions. Startup must render; Refresh must create new nodes carrying a different permitted value. The existing harness globally evaluates the trusted generated script against fake globals and restores them; it is neither an isolated VM sandbox nor a browser HTML parser.

### Sensitivity and fixture history

The packets have **23 credited private source-fault probes** (12 + 11), with intended failures, exact source restoration and focused GREEN. They are instrument evidence, not 23 shipped defects or exhaustive independent mutation of every assertion. Per-case probes retain their actual source/test/helper context rather than being relabeled as runs on a later combined head.

N06 initially reused a cached LOOK request ID across reconstructed fixtures; unique test-only IDs corrected the scaffold, and earlier dependent cases were rerun. Packet840 initially miscounted its board oracle's literal prefix; the expected length was corrected as fixture work. Neither was a production repair.

Packet840's first hidden-filter-only perturbation was inert because the downstream projector also rejects hidden entities. It is uncredited reported history: its standalone log was overwritten by the replacement, so that replacement RED log is not proof of the earlier GREEN run. The credited replacement corrupts the raw-entity visibility handoff; it does not establish sensitivity to removal of the upstream filter alone. Its separate scar-label fault and HTML-sink fault establish only their exercised comparisons; the latter failed the startup sink assertion, not an independently isolated Refresh-only mutation.

## Remaining evidence boundary

Local fixture reconstruction is not genuine hosted eviction. Seeded fields are not source-authoring authorization, canonical SQL persistence or independent hosted participant delivery. Source clearing is not live scheduler or expiry proof. Fake-DOM text insertion is not real-browser XSS prevention, browser legibility, assistive-technology QA, or WATCH/Home parity. No deployment or hosted campaign was run for these packets.

The matrix's hosted all-family provenance/readback, browser/security, expiry and broader product gates remain separate. This document changes no issue disposition, frozen gate state, canonical world, Genesis data or production policy. Future hosted actions, acceptance decisions and review-rule exceptions require their own applicable authority and evidence.

## Supplement — bounded localhost real-browser trace observation

The original seal above is retained verbatim as the historical record of PR839/PR840. A separately authorized localhost browser probe subsequently exercised source `6227eafd774ecff7148ffeb0fd472f67559dccf4` (the PR841 documentation merge). This supplement and its [scrubbed machine-readable receipt](781-local-browser-trace-receipt.json) add an evidence layer; they do not relabel the earlier fake-DOM tests as browser runs or replace their source pins.

**OBSERVED:** actual headless Chrome/156.0.8078.80, 1365×900 desktop viewport, shipped `watchHtml()` text renderer and actual `buildWatchLive` projections over synthetic inputs. Four isolated cases populated board, shout, institution notice and trade notice respectively, each paired with a permitted visible scar and hidden control. Every credited case displayed exactly the permitted trace as a fresh native text node (DOM node type 3), with no trace image/script element and no benign handler execution. A fresh local HTTP read was observed; changed values appeared in new nodes through the actual manual Refresh handler. Exclusion assertions are trace-scoped, not a certification of every other public field.

| Observation | Result and boundary |
|---|---|
| Four clean source-family controls | PASS: required permitted trace present; forbidden notice and hidden-source text absent from traces |
| Manual Refresh | PASS: changed permitted value, fresh node identity and a new local read; not untouched polling or WebSocket proof |
| One private generated-HTML sink fault | EXPECTED DETECTION: replacing one text-node insertion with HTML insertion created an image and executed only the benign boolean control |
| Exact clean restoration | PASS: byte-verified clean HTML again produced literal text, no trace image/script and no control execution |
| Teardown | Owned Node process exited and listener rejected a new connection; isolated browser acknowledged closure. Browser OS-PID exit was not separately verified |

The control affected only an outside-repository generated HTML copy, never production source. Clean and faulty pages used the same local network/CSP policy, explicitly permitting the benign handler; its observed execution establishes that this policy did not silently rescue this particular control. The private control is sensitivity evidence, not a shipped defect or an independently mutated proof of every exclusion predicate. Its raw payload and local target identifiers are omitted from the public receipt.

Setup findings remain separate from product behavior: native hidden-tab visibility initially suppressed reads, corrected by activating the owned tab; native Pause also suppresses manual Refresh. Credited checks ran visibly and unpaused, with only the observed 10000ms WATCH polling interval stopped by test-owned instrumentation. An initial expected-value prefix was corrected against the explicit fixture input before that case was credited.

**Limits:** localhost HTTP fixture only, not a deployed Worker or live WebSocket; synthetic read-time projection, not canonical SQL, source-authoring permission, sequence/settlement progression or expiry. The harness had a local network-containment CSP rather than production response headers, blocked external fonts, and omitted `/ready`, leaving the separate shell readiness badge at “not ready.” No availability or layout-quality verdict follows from that badge or these screenshots. A single benign payload and WATCH text view do not establish production-wide XSS prevention, all injection classes, other modes, mobile, accessibility, Home parity or full T3.5/S3/R4 acceptance.

Repository HEAD and renderer/projector source hashes were unchanged by the probe. This two-file documentation supplement preserves the original 20-test/23-probe inventory, historical matrix and frozen assertion map without changing their task states. The browser control is counted separately from those earlier source-fault probes. No issue closure, deployment, spending or new merge-rule exception follows from the browser result.
