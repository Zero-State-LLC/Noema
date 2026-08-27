let meta = #{
    name: "noema-grok-bridge",
    description: "Reconcile-first Grok Bridge for the MUD-native S0-S7 campaign against a partially implemented Noema runtime. Agents inhabit; humans watch. Default packet is GB-NOEMA-000.",
    when_to_use: "Close MUD-native interaction gaps in Zero-State-LLC/Noema against Noema-Specs. Never treat S0-S7 as greenfield. Start at GB-NOEMA-000 unless args.packet is set.",
    phases: [
        #{ title: "Pin", detail: "record spec_ref and runtime_ref SHAs; refuse floating main" },
        #{ title: "Ingest", detail: "read specs then runtime; agents-only inhabit is law" },
        #{ title: "Reconcile", detail: "ABSENT / PARTIAL / IMPLEMENTED_UNVERIFIED / VERIFIED / DRIFT" },
        #{ title: "Route", detail: "emit work packets; do not dispatch greenfield parser work" },
        #{ title: "Implement", detail: "closure packet only; skip on gb000" },
        #{ title: "Verify", detail: "independent spec/determinism/authority/parity/rollback" },
    ],
};

let status_schema = #{
    "type": "object",
    "required": ["ok", "evidence"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "evidence": #{ "type": "string" },
        "blocked": #{ "type": "boolean" },
        "block_reason": #{ "type": "string" },
        "classification": #{ "type": "string" },
        "next_packet": #{ "type": "string" },
        "artifacts": #{ "type": "array", "maxItems": 24, "items": #{ "type": "string" } },
    },
};

let receipt_schema = #{
    "type": "object",
    "required": ["ok", "evidence", "state"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "evidence": #{ "type": "string" },
        "state": #{ "type": "string" },
        "blocked": #{ "type": "boolean" },
        "block_reason": #{ "type": "string" },
        "canonical_actions_changed": #{ "type": "boolean" },
        "genesis_changed": #{ "type": "boolean" },
        "agent_protocol_changed": #{ "type": "boolean" },
        "settlement_changed": #{ "type": "boolean" },
        "reseed_performed": #{ "type": "boolean" },
        "human_inhabit_added": #{ "type": "boolean" },
        "commit_sha": #{ "type": "string" },
        "residual": #{ "type": "string" },
        "artifacts": #{ "type": "array", "maxItems": 24, "items": #{ "type": "string" } },
    },
};

let verdict_schema = #{
    "type": "object",
    "required": ["real", "reason", "evidence"],
    "properties": #{
        "real": #{ "type": "boolean" },
        "reason": #{ "type": "string" },
        "evidence": #{ "type": "string" },
        "thawed": #{ "type": "boolean" },
        "invented_facts": #{ "type": "boolean" },
        "human_inhabit": #{ "type": "boolean" },
        "greenfield_misread": #{ "type": "boolean" },
        "spec_pass": #{ "type": "boolean" },
        "determinism_pass": #{ "type": "boolean" },
        "authority_pass": #{ "type": "boolean" },
        "parity_pass": #{ "type": "boolean" },
        "rollback_pass": #{ "type": "boolean" },
    },
};

fn trimmed(s) {
    if type_of(s) == "string" {
        s.trim();
        s
    } else {
        ""
    }
}

fn text_of(x) {
    if type_of(x) == "string" { x } else { "" }
}

fn freeze_rules() {
    let s = "";
    s += "HARD CONSTRAINTS: ";
    s += "Genesis genesis.ef578f4ffceeccd0 / Perihelion Reach is frozen. ";
    s += "Published seal sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395. ";
    s += "No new canonical verbs. No Genesis change. No Perihelion reseed. ";
    s += "No Agent Protocol semantic change. No settlement semantic change. ";
    s += "No new Player class. No LLM parser authority. ";
    s += "No research score in PLAY. No v0.8 Phenomena. No wallet/x402/crypto. ";
    s += "Do not Recover Perihelion. Isolated worlds only for mutation (test.hosted-canonical.*). ";
    s += "If a packet requires any freeze surface, HALT and escalate — do not implement. ";
    s
}

fn agent_only_rules() {
    let s = "";
    s += "AGENTS INHABIT. HUMANS WATCH. There are no human Players on hosted Noema. ";
    s += "applyPlayerCommand returns 403 for controller_type human or hybrid. Do not undo that. ";
    s += "One Player ontology remains; hosted admission is gateway policy, not a second class. ";
    s += "Spec phrase 'humans and agents remain Players' is ontology. It does NOT authorize human inhabit. ";
    s += "Spec Feature A 'human command resolver' maps to the existing text-line adapter parseHumanCommand. ";
    s += "That function is a legacy name. It is not a human-player project and must not become one. ";
    s += "Structured Agent Protocol MUST NOT call parseHumanCommand (tasks T0.8). ";
    s += "Text-line inhabit (CONNECT command box / POST /v1/command string) is an agent surface. ";
    s += "WATCH and Home are spectator surfaces for humans. PLAY observations are for inhabiting agents. ";
    s += "S5 low-noise on PLAY is agent-consumable text, not a human-player accessibility mode. ";
    s += "S5 WATCH/Home a11y is for spectators. Do not add a human Play door or keyboard-inhabit client. ";
    s += "Do not mint human controller tokens that can command. Do not send PLAY letters. ";
    s += "Do not treat HUMAN-PLAY.md as permission to put humans on /v1/command. ";
    s
}

fn closure_rules() {
    let s = "";
    s += "RECONCILE FIRST. Runtime is ahead of the spec package in several slices. ";
    s += "Do not dispatch S0-S7 as greenfield. Dispatch as reconciliation/closure. ";
    s += "S0: parseHumanCommand already exists — complete it against the deterministic contract. ";
    s += "Do not tell any agent to build a command parser. ";
    s += "S1 starts with a presentation-authority audit of play-ui.ts heuristic/regex inference. ";
    s += "Presentation never invents entities, exits, affordances, causes, memories, or history. ";
    s += "S3/S6/S7 must project existing provenance; do not invent a second feed backend. ";
    s += "S4 macros coordinate ordinary commands; each step authenticates and settles independently. ";
    s += "Classifications: ABSENT, PARTIAL, IMPLEMENTED_UNVERIFIED, VERIFIED, plus DRIFT. ";
    s += "Critical path sequential: S0 then S1 then S2. After S1: S3 and S5 may proceed separately. ";
    s += "S4 after S0 contract. S6 after S3 public traces. S7 last from WATCH-safe projection. ";
    s
}

fn packet_known(pid) {
    let allowed = [
        "gb000",
        "gb101", "gb102", "gb103", "gb104",
        "gb201", "gb202", "gb203", "gb204", "gb205", "gb206",
        "gb301", "gb302", "gb303", "gb304", "gb305",
        "gb401", "gb402", "gb403", "gb404", "gb405", "gb406", "gb407", "gb408",
        "gb501", "gb502", "gb503", "gb504", "gb505", "gb506",
        "gb601", "gb602", "gb603", "gb604", "gb605", "gb606",
        "gb701", "gb702", "gb703", "gb704", "gb705", "gb706", "gb707",
        "gb801", "gb802", "gb803", "gb804", "gb805",
    ];
    for a in allowed {
        if a == pid { return true; }
    }
    false
}

fn packet_is_inventory(pid) {
    pid == "gb000"
}

fn packet_slice(pid) {
    if pid == "gb000" { return "campaign"; }
    let ch = pid.sub_string(2, 1);
    if ch == "1" { return "s0"; }
    if ch == "2" { return "s1"; }
    if ch == "3" { return "s2"; }
    if ch == "4" { return "s3"; }
    if ch == "5" { return "s4"; }
    if ch == "6" { return "s5"; }
    if ch == "7" { return "s6"; }
    if ch == "8" { return "s7"; }
    "unknown"
}

fn packet_lane(pid) {
    if pid == "gb000" { return "V"; }
    let sl = packet_slice(pid);
    if sl == "s0" || sl == "s2" || sl == "s4" { return "A"; }
    if sl == "s1" || sl == "s5" { return "B"; }
    if sl == "s3" { return "C"; }
    if sl == "s6" || sl == "s7" { return "D"; }
    "V"
}

fn packet_title(pid) {
    if pid == "gb000" { return "Reconcile S0-S7 against runtime at pinned SHA"; }
    if pid == "gb101" { return "S0 parser contract reconciliation (existing parseHumanCommand)"; }
    if pid == "gb102" { return "Safe local noun-resolution boundary (no hidden-id discovery)"; }
    if pid == "gb103" { return "Ambiguity lifecycle + observation revalidation"; }
    if pid == "gb104" { return "Parser equivalence/adversarial test matrix + T0.8 protocol bypass"; }
    if pid == "gb201" { return "Audit heuristic presentation derivation in play-ui.ts"; }
    if pid == "gb202" { return "RoomPresentationModel from authorized observation only"; }
    if pid == "gb203" { return "Replace inferred condition/affordance prose with sourced facts"; }
    if pid == "gb204" { return "Pin deterministic HERE/EXIT ordering"; }
    if pid == "gb205" { return "Bound contextual actions to spec max-3 policy"; }
    if pid == "gb206" { return "Consequence translation regression"; }
    if pid == "gb301" { return "Contextual HELP projection (non-mutating, no engine event)"; }
    if pid == "gb302" { return "help <topic> against existing action authority"; }
    if pid == "gb303" { return "help all explicit deep disclosure"; }
    if pid == "gb304" { return "Ambiguity selection in the agent text adapter"; }
    if pid == "gb305" { return "First-paint comprehension acceptance for agent observations"; }
    if pid == "gb401" { return "Canonical event/state trace-source inventory"; }
    if pid == "gb402" { return "TraceProjection schema + provenance contract"; }
    if pid == "gb403" { return "Repair trace projector"; }
    if pid == "gb404" { return "Construction trace projector"; }
    if pid == "gb405" { return "Public notice/institution trace projector"; }
    if pid == "gb406" { return "Trace staleness/invalidation"; }
    if pid == "gb407" { return "PLAY observation integration of traces"; }
    if pid == "gb408" { return "Redaction/adversarial trace tests"; }
    if pid == "gb501" { return "Preference-storage ADR (agent preferences, not human player prefs)"; }
    if pid == "gb502" { return "Alias grammar + CRUD on the text adapter"; }
    if pid == "gb503" { return "Alias recursion/depth protections"; }
    if pid == "gb504" { return "Bounded macro runner (coordinator, not a new atomic action)"; }
    if pid == "gb505" { return "Per-step observation revalidation"; }
    if pid == "gb506" { return "Macro settlement/auth/rate-limit adversarial tests"; }
    if pid == "gb601" { return "Low-noise preference contract (agent-consumable PLAY text)"; }
    if pid == "gb602" { return "PLAY low-noise renderer for inhabiting agents"; }
    if pid == "gb603" { return "WATCH low-noise renderer for human spectators"; }
    if pid == "gb604" { return "Spectator keyboard-only acceptance (WATCH/Home, not inhabit)"; }
    if pid == "gb605" { return "Spectator screen-reader/live-region acceptance"; }
    if pid == "gb606" { return "375x812 + desktop visual regression of spectator + observation text"; }
    if pid == "gb701" { return "Inventory current WATCH editorial rules (preserve existing machinery)"; }
    if pid == "gb702" { return "Formal NOW selector"; }
    if pid == "gb703" { return "Formal RECENTLY projection"; }
    if pid == "gb704" { return "Formal WORLD slow-state projection"; }
    if pid == "gb705" { return "Causal-edge admissibility contract (no temporal-proximity causation)"; }
    if pid == "gb706" { return "Causal-chain renderer"; }
    if pid == "gb707" { return "WATCH privacy/adversarial regression"; }
    if pid == "gb801" { return "Define Home live projection from WATCH (no second feed)"; }
    if pid == "gb802" { return "Add resilient Home live-world proof"; }
    if pid == "gb803" { return "Offline/stale/error fallback"; }
    if pid == "gb804" { return "Privacy + first-read QA"; }
    if pid == "gb805" { return "HTML/performance budget regression"; }
    "Unknown packet"
}

fn packet_files(pid) {
    let sl = packet_slice(pid);
    if sl == "s0" || sl == "s2" || sl == "s4" {
        return "workers/noema/src/actions.ts (parseHumanCommand, resolveVisibleEntity), workers/noema/src/play.ts, workers/noema/test/ parser and command tests.";
    }
    if sl == "s1" || sl == "s5" {
        return "workers/noema/src/play-ui.ts, play.ts, shell.ts, workers/noema/src/presentation/.";
    }
    if sl == "s3" {
        return "history/artifacts/scars/notices projectors; play-ui observation; no new feed store.";
    }
    if sl == "s6" || sl == "s7" {
        return "workers/noema/src/watch-live.ts, watch-phosphor.ts, landing.ts, site/index.html.";
    }
    "workers/noema/src/actions.ts, play-ui.ts, play.ts, watch-live.ts, landing.ts, AGENTS.md."
}

fn packet_exit(pid) {
    if pid == "gb000" {
        return "Exit: independent S0-S7 matrix at pinned SHAs; drift list; dependency-scoped packets; no runtime edits.";
    }
    if pid == "gb101" {
        return "Exit: existing parser classified PARTIAL with file:line evidence; remaining mismatches listed; no new parser module.";
    }
    if pid == "gb102" {
        return "Exit: text-line noun resolution cannot discover hidden/internal ids; structured protocol unchanged.";
    }
    if pid == "gb201" {
        return "Exit: every play-ui heuristic/regex inference catalogued; invented-fact risks labeled DRIFT; no visual redesign.";
    }
    if pid == "gb202" {
        return "Exit: RoomPresentationModel reads only authorized observation; no label-regex world facts.";
    }
    "Exit: packet title done against pinned specs; tests pass; freeze and agents-only intact; residual gaps listed."
}

fn campaign_reads() {
    let s = "";
    s += "Required reading order, from the PINNED SHAs (git show <ref>:path if the working tree is not the pin): ";
    s += "Noema-Specs/CONTEXT.md; ";
    s += "docs/MUD-NATIVE-INTERACTION-AND-WORLD-PRESENCE.md; ";
    s += "docs/MUD-NATIVE-INTERACTION-PLAN.md; ";
    s += "docs/MUD-NATIVE-INTERACTION-TASKS.md; ";
    s += "docs/PLAYER-ACTION-MAP.md; docs/ACTION-CONTRACTS.md; ";
    s += "docs/COMMAND-DISCOVERY.md; docs/MUD-DESIGN-CANON.md; ";
    s += "docs/WATCH.md; docs/WATCH-LIGHTWEIGHT-SPECTATOR.md; ";
    s += "docs/DEEP-TIME.md; docs/SECURITY.md; ";
    s += "HUMAN-PLAY.md is advisory prose only — not inhabit authorization. ";
    s += "Noema/AGENTS.md (hosted inhabit is agents-only); ";
    s += "workers/noema/src/actions.ts parseHumanCommand and resolveVisibleEntity; ";
    s += "workers/noema/src/play-ui.ts (heuristic condition/affordance inference); ";
    s += "workers/noema/src/play.ts, watch-live.ts, landing.ts; ";
    s += "existing parser/help/watch tests under workers/noema/test/. ";
    s
}

fn normalize_packet(raw) {
    let s = trimmed(raw);
    if s == "" { return "gb000"; }
    if s == "000" || s == "GB-NOEMA-000" || s == "gb-noema-000" { return "gb000"; }
    if s == "GB-NOEMA-000" { return "gb000"; }
    if s.len() >= 10 {
        let prefix = s.sub_string(0, 10);
        if prefix == "GB-NOEMA-" || prefix == "gb-noema-" {
            return "gb" + s.sub_string(10, s.len() - 10);
        }
    }
    if s.len() == 3 {
        return "gb" + s;
    }
    if s.len() == 5 && s.sub_string(0, 2) == "GB" {
        return "gb" + s.sub_string(2, 3);
    }
    s
}

let pid = "gb000";
let runtime_root = "/home/scrimshawlife/Noema";
let specs_root = "/home/scrimshawlife/Noema-Specs";
let spec_ref = "origin/main";
let runtime_ref = "origin/main";
if args != () {
    if args.packet != () {
        let asked = normalize_packet(args.packet);
        if asked != "" { pid = asked; }
    }
    if args.runtime_root != () {
        let rr = trimmed(args.runtime_root);
        if rr != "" { runtime_root = rr; }
    }
    if args.specs_root != () {
        let sr = trimmed(args.specs_root);
        if sr != "" { specs_root = sr; }
    }
    if args.spec_ref != () {
        let sr = trimmed(args.spec_ref);
        if sr != "" { spec_ref = sr; }
    }
    if args.runtime_ref != () {
        let rr = trimmed(args.runtime_ref);
        if rr != "" { runtime_ref = rr; }
    }
}

if !packet_known(pid) {
    pause("verification", "Pass args.packet as gb000 or gb101..gb805 (also GB-NOEMA-000). Default is gb000.");
}

let inventory = packet_is_inventory(pid);
let slice = packet_slice(pid);
let lane = packet_lane(pid);

phase("Pin");
log("Packet " + pid + " slice=" + slice + " lane=" + lane + " | runtime " + runtime_root + " @ " + runtime_ref + " | specs " + specs_root + " @ " + spec_ref);

let pin_p = "";
pin_p += "You are Grok Bridge PIN for Noema campaign MUD-NATIVE-INTERACTION. ";
pin_p += "READ ONLY. Use run_terminal_command, read_file, grep. Do not edit. ";
pin_p += "Runtime checkout: " + runtime_root + ". Requested runtime_ref: " + runtime_ref + ". ";
pin_p += "Specs checkout: " + specs_root + ". Requested spec_ref: " + spec_ref + ". ";
pin_p += "Record exact SHAs. If the ref is a branch name, resolve it (prefer origin/main, not a dirty local branch). ";
pin_p += "Local checkouts are often NOT on main — do not treat HEAD as the pin unless it equals the requested ref SHA. ";
pin_p += "Confirm specs contain docs/MUD-NATIVE-INTERACTION-AND-WORLD-PRESENCE.md at the spec SHA. ";
pin_p += "Confirm runtime AGENTS.md still says hosted inhabit is agents-only. ";
pin_p += freeze_rules();
pin_p += agent_only_rules();
pin_p += "Set ok=true only after you independently resolved both SHAs and confirmed the two files above. ";
pin_p += "evidence: YAML pin block with project, spec_repo, runtime_repo, spec_ref SHA, runtime_ref SHA, ";
pin_p += "campaign MUD-NATIVE-INTERACTION, genesis_mutation_allowed false, canonical_action_change_allowed false, ";
pin_p += "reseed_allowed false, v0_8_allowed false, human_inhabit_allowed false. ";
pin_p += "Set blocked=true if a repo is missing or the MUD-native spec is absent at the pin.";

let pinned = agent(pin_p, #{
    label: "pin:" + pid,
    capability_mode: "read-only",
    output_schema: status_schema,
});

let pin_ok = false;
let pin_ev = "";
let blocked = false;
let block_reason = "";
if pinned != () && pinned.success && pinned.output != () {
    if pinned.output.ok == true { pin_ok = true; }
    pin_ev = text_of(pinned.output.evidence);
    if pinned.output.blocked == true { blocked = true; }
    block_reason = text_of(pinned.output.block_reason);
} else {
    blocked = true;
    block_reason = "pin agent failed or returned no evidence";
}

if blocked {
    let msg = "Blocked at PIN " + pid + ": " + block_reason;
    log(msg);
    let p = write_scratch_file("report.md", msg + "\n\n" + pin_ev);
    complete(#{ summary: msg, packet: pid, blocked: true, path: p, evidence: pin_ev });
}

phase("Ingest");
let ingest_p = "";
ingest_p += "You are Grok Bridge INGEST for packet " + pid + " (" + packet_title(pid) + "). ";
ingest_p += "READ ONLY. Use graft ask / read_file / grep / git show <sha>:path. Do not edit. ";
ingest_p += "Runtime: " + runtime_root + " ref " + runtime_ref + ". Specs: " + specs_root + " ref " + spec_ref + ". ";
ingest_p += "Pin evidence:\n" + pin_ev + "\n";
ingest_p += freeze_rules();
ingest_p += agent_only_rules();
ingest_p += closure_rules();
ingest_p += campaign_reads();
ingest_p += "Authority ledger: CONTEXT constitutional; accepted RFC / protocol schema / feature spec normative; ";
ingest_p += "runtime is implementation_evidence; historical design docs advisory. ";
ingest_p += "Bridge does not silently rewrite specs. ";
ingest_p += "If spec text assumes a human Player inhabit loop, record it as SPEC-VS-RUNTIME and keep hosted agents-only. ";
ingest_p += "Set ok=true only after you actually opened the required docs and the affected runtime files for this packet. ";
ingest_p += "evidence: short OBSERVED notes with file:line. Empty evidence is invalid.";

let ingested = agent(ingest_p, #{
    label: "ingest:" + pid,
    capability_mode: "read-only",
    output_schema: status_schema,
});

let ingest_ok = false;
let ingest_ev = "";
if ingested != () && ingested.success && ingested.output != () {
    if ingested.output.ok == true { ingest_ok = true; }
    ingest_ev = text_of(ingested.output.evidence);
    if ingested.output.blocked == true {
        blocked = true;
        block_reason = text_of(ingested.output.block_reason);
    }
} else {
    ingest_ev = "ingest agent failed or returned no evidence";
}

if blocked {
    let msg = "Blocked at INGEST " + pid + ": " + block_reason;
    log(msg);
    let p = write_scratch_file("report.md", msg + "\n\n" + ingest_ev);
    complete(#{ summary: msg, packet: pid, blocked: true, path: p });
}

phase("Reconcile");
let rec_p = "";
rec_p += "You are Grok Bridge RECONCILE for packet " + pid + " slice " + slice + ". ";
rec_p += "READ ONLY. Reconstruct from the pinned runtime SHA. Do not trust prior chat analysis. ";
rec_p += "Runtime: " + runtime_root + ". Specs: " + specs_root + ". ";
rec_p += freeze_rules();
rec_p += agent_only_rules();
rec_p += closure_rules();
rec_p += "Pin:\n" + pin_ev + "\nIngest:\n" + ingest_ev + "\n";
if inventory {
    rec_p += "Rebuild the entire S0-S7 matrix. For each slice give state, evidence file:line, gaps, drift. ";
    rec_p += "Known starting hints (verify, do not copy blindly): ";
    rec_p += "S0 PARTIAL parseHumanCommand + aliases + AMBIGUOUS_TARGET; missing bare direction, walk, look-at, articles, clarification. ";
    rec_p += "S1 PARTIAL play-ui helpers + DRIFT label-regex inference (scar/market/archive). ";
    rec_p += "S2 PARTIAL help/helpText. S3 GAP traces. S4 GAP (only fixed aliases). ";
    rec_p += "S5 PARTIAL reduced motion/ARIA. S6 PARTIAL advanced WATCH. S7 GAP Home live proof. ";
    rec_p += "TX spec linking is DONE and is not a runtime slice. ";
} else {
    rec_p += "Classify THIS packet only: ABSENT / PARTIAL / IMPLEMENTED_UNVERIFIED / VERIFIED, plus DRIFT if behavior conflicts. ";
    rec_p += "Inspect first: " + packet_files(pid) + " ";
    rec_p += "Do not recommend building a new parser or a human Play client. ";
}
rec_p += "Set classification to the slice/packet state. Set ok=true only with file:line evidence you opened. ";
rec_p += "Set blocked=true if freeze or agents-only would have to move.";

let reconciled = agent(rec_p, #{
    label: "reconcile:" + pid,
    capability_mode: "read-only",
    output_schema: status_schema,
});

let rec_ok = false;
let rec_ev = "";
let classification = "";
if reconciled != () && reconciled.success && reconciled.output != () {
    if reconciled.output.ok == true { rec_ok = true; }
    rec_ev = text_of(reconciled.output.evidence);
    classification = text_of(reconciled.output.classification);
    if reconciled.output.blocked == true {
        blocked = true;
        block_reason = text_of(reconciled.output.block_reason);
    }
} else {
    rec_ev = "reconcile agent failed or returned no evidence";
}

if blocked {
    let msg = "Blocked at RECONCILE " + pid + ": " + block_reason;
    log(msg);
    let p = write_scratch_file("report.md", msg + "\n\n" + rec_ev);
    complete(#{ summary: msg, packet: pid, blocked: true, path: p });
}

phase("Route");
let route_p = "";
route_p += "You are Grok Bridge ROUTE for packet " + pid + " (" + packet_title(pid) + ") lane " + lane + ". ";
route_p += "READ ONLY. Do not edit the runtime. Emit the work-packet contract. ";
route_p += freeze_rules();
route_p += agent_only_rules();
route_p += closure_rules();
route_p += "Reconciliation:\n" + rec_ev + "\n";
if inventory {
    route_p += "Emit the full queue as work packets (gb101-gb805) using grok-bridge/work-packet-v1. ";
    route_p += "Each packet: identity, objective, authority specs, observed_runtime, constraints, acceptance, validation, delivery. ";
    route_p += "Mark S0 packets as closure of parseHumanCommand, never greenfield. ";
    route_p += "Mark S1-201 as authority audit first. ";
    route_p += "Mark S5-604/605 as spectator-only. ";
    route_p += "Recommended first implementation dispatch after this inventory: gb101 then gb201. ";
    route_p += "next_packet should be gb101. ";
} else {
    route_p += "Emit ONE work packet for " + pid + " in grok-bridge/work-packet-v1 YAML. ";
    route_p += "objective: " + packet_title(pid) + ". exit: " + packet_exit(pid) + ". ";
    route_p += "likely_files: " + packet_files(pid) + " ";
    route_p += "constraints must include no_new_canonical_verbs, no_genesis_change, no_reseed, ";
    route_p += "no_agent_protocol_change, no_settlement_change, no_llm_parser, no_human_inhabit. ";
    route_p += "If classification is VERIFIED, say so and recommend skip implement. ";
}
route_p += "Set ok=true only if the packet(s) are concrete and cite observed files. evidence: the YAML.";

let routed = agent(route_p, #{
    label: "route:" + pid,
    capability_mode: "read-only",
    output_schema: status_schema,
});

let route_ok = false;
let route_ev = "";
let next_packet = "";
if routed != () && routed.success && routed.output != () {
    if routed.output.ok == true { route_ok = true; }
    route_ev = text_of(routed.output.evidence);
    next_packet = text_of(routed.output.next_packet);
} else {
    route_ev = "route agent failed or returned no evidence";
}

let did_implement = false;
let impl_ok = false;
let impl_ev = "";
let impl_state = "SKIPPED";
let freeze_break = false;

if !inventory {
    phase("Implement");
    let impl_p = "";
    impl_p += "You are the lane " + lane + " coding agent for " + pid + ". ";
    impl_p += "This is a CLOSURE packet against an already partial runtime. Inspect first. ";
    impl_p += "Runtime: " + runtime_root + ". Specs: " + specs_root + ". ";
    impl_p += freeze_rules();
    impl_p += agent_only_rules();
    impl_p += closure_rules();
    impl_p += "Packet title: " + packet_title(pid) + ". ";
    impl_p += packet_exit(pid) + " ";
    impl_p += "Likely files: " + packet_files(pid) + " ";
    impl_p += "Work packet from Route:\n" + route_ev + "\n";
    impl_p += "Reconciliation:\n" + rec_ev + "\n";
    impl_p += "Do not build a new parser. Do not add human inhabit. Do not invent presentation facts. ";
    impl_p += "Do not change /v1/command, Agent Protocol meaning, settlement, Genesis, or WATCH redaction. ";
    impl_p += "Tests first when adding behavior. Run focused vitest from workers/noema. Isolated worlds only. ";
    impl_p += "Return a grok-bridge/work-receipt-v1 in evidence. ";
    impl_p += "state: IMPLEMENTED_UNVERIFIED or BLOCKED or NO_CHANGE. ";
    impl_p += "Attest canonical_actions_changed, genesis_changed, agent_protocol_changed, settlement_changed, ";
    impl_p += "reseed_performed, human_inhabit_added — all must be false or you must set blocked=true. ";
    impl_p += "If the work requires a freeze surface or human inhabit, stop and set blocked=true. ";
    impl_p += "Set ok=true only with commands you ran and files you changed.";
    let impl = agent(impl_p, #{
        label: "implement:" + pid,
        capability_mode: "all",
        isolation_worktree: true,
        output_schema: receipt_schema,
    });
    did_implement = true;
    if impl != () && impl.success && impl.output != () {
        if impl.output.ok == true { impl_ok = true; }
        impl_ev = text_of(impl.output.evidence);
        impl_state = text_of(impl.output.state);
        if impl_state == "" { impl_state = "IMPLEMENTED_UNVERIFIED"; }
        if impl.output.blocked == true {
            blocked = true;
            block_reason = text_of(impl.output.block_reason);
        }
        if impl.output.canonical_actions_changed == true { freeze_break = true; }
        if impl.output.genesis_changed == true { freeze_break = true; }
        if impl.output.agent_protocol_changed == true { freeze_break = true; }
        if impl.output.settlement_changed == true { freeze_break = true; }
        if impl.output.reseed_performed == true { freeze_break = true; }
        if impl.output.human_inhabit_added == true { freeze_break = true; }
    } else {
        impl_ev = "implement agent failed or returned no evidence";
        impl_state = "FAILED";
    }
}

if freeze_break {
    blocked = true;
    if block_reason == "" { block_reason = "implement attested a freeze or human-inhabit change"; }
}

phase("Verify");
let sk_p = "";
sk_p += "You are an independent Grok Bridge verifier. You did not implement this packet. ";
sk_p += "Default real=false. READ the pinned files and any worktree/diff yourself. ";
sk_p += "Packet " + pid + " (" + packet_title(pid) + "). Lane " + lane + ". ";
sk_p += "Runtime: " + runtime_root + ". Specs: " + specs_root + ". ";
sk_p += freeze_rules();
sk_p += agent_only_rules();
sk_p += packet_exit(pid) + " ";
sk_p += "Pin:\n" + pin_ev + "\nReconcile:\n" + rec_ev + "\nRoute:\n" + route_ev + "\n";
if did_implement {
    sk_p += "Implement state=" + impl_state + " ok=" + impl_ok.to_string() + "\n" + impl_ev + "\n";
} else {
    sk_p += "This run is inventory-only. Verify the matrix is independently evidenced, not copied from the prompt hints. ";
}
sk_p += "Five gates: SPEC (exact AC), DETERMINISM (equivalent inputs), AUTHORITY (no invented facts / no visibility leak), ";
sk_p += "PARITY (structured agent semantics unchanged; parser not on protocol path), ";
sk_p += "OPERATIONS (rollback without reseed). ";
sk_p += "Also fail if: human inhabit was added; parseHumanCommand was treated as greenfield; ";
sk_p += "presentation invents world facts; a second Home feed backend appeared; freeze thawed. ";
sk_p += "Set real=true only if every required gate PASSES with evidence you inspected. ";
sk_p += "Missing evidence => real=false. Set human_inhabit / thawed / invented_facts / greenfield_misread when seen.";

let skeptic = agent(sk_p, #{
    label: "verify:" + pid,
    capability_mode: "read-only",
    output_schema: verdict_schema,
});

let verified = false;
let v_reason = "no usable skeptic evidence";
let v_ev = "";
let thawed = false;
let human_inhabit = false;
let invented = false;
let greenfield = false;
if skeptic != () && skeptic.success && skeptic.output != () {
    v_reason = text_of(skeptic.output.reason);
    v_ev = text_of(skeptic.output.evidence);
    if skeptic.output.thawed == true { thawed = true; }
    if skeptic.output.human_inhabit == true { human_inhabit = true; }
    if skeptic.output.invented_facts == true { invented = true; }
    if skeptic.output.greenfield_misread == true { greenfield = true; }
    if skeptic.output.real == true && v_ev != "" && !thawed && !human_inhabit && !invented && !greenfield && !freeze_break {
        verified = true;
    }
}

let report = "";
report += "# noema-grok-bridge — " + pid + "\n\n";
report += "Title: " + packet_title(pid) + "\n";
report += "Slice: " + slice + " | Lane: " + lane + "\n";
report += "Runtime: " + runtime_root + " @ " + runtime_ref + "\n";
report += "Specs: " + specs_root + " @ " + spec_ref + "\n";
report += "Agents inhabit. Humans watch. No human Players.\n\n";
report += "## Pin ok=" + pin_ok.to_string() + "\n" + pin_ev + "\n\n";
report += "## Ingest ok=" + ingest_ok.to_string() + "\n" + ingest_ev + "\n\n";
report += "## Reconcile ok=" + rec_ok.to_string() + " classification=" + classification + "\n" + rec_ev + "\n\n";
report += "## Route ok=" + route_ok.to_string() + "\n" + route_ev + "\n\n";
if did_implement {
    report += "## Implement ok=" + impl_ok.to_string() + " state=" + impl_state + "\n" + impl_ev + "\n\n";
} else {
    report += "## Implement\nskipped (inventory packet)\n\n";
}
report += "## Verify real=" + verified.to_string();
report += " thawed=" + thawed.to_string();
report += " human_inhabit=" + human_inhabit.to_string();
report += " invented=" + invented.to_string();
report += " greenfield_misread=" + greenfield.to_string() + "\n";
report += v_reason + "\n" + v_ev + "\n\n";
report += "## Exit\n" + packet_exit(pid) + "\n";
if next_packet != "" {
    report += "\nNext packet: " + next_packet + "\n";
}
if blocked {
    report += "\nBLOCKED: " + block_reason + "\n";
}
if freeze_break {
    report += "\nREJECTED: freeze or human-inhabit attestation.\n";
}

let path = write_scratch_file("report.md", report);
let summary = pid + " verified=" + verified.to_string() + " class=" + classification;
if inventory { summary = pid + " inventory verified=" + verified.to_string(); }
if thawed { summary = pid + " REJECTED: freeze thawed"; }
if human_inhabit { summary = pid + " REJECTED: human inhabit"; }
if blocked { summary = pid + " BLOCKED: " + block_reason; }

complete(#{
    summary: summary,
    packet: pid,
    slice: slice,
    lane: lane,
    verified: verified,
    implemented: did_implement,
    implement_state: impl_state,
    classification: classification,
    next_packet: next_packet,
    thawed: thawed,
    human_inhabit: human_inhabit,
    blocked: blocked,
    path: path,
});
