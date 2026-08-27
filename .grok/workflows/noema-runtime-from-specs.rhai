let meta = #{
    name: "noema-runtime-from-specs",
    description: "Implement Noema runtime from Noema-Specs through M0-M8 with freeze compliance, settlement proof, agent inhabit, WATCH truth, and versioned releases",
    when_to_use: "Build or harden Zero-State-LLC/Noema against Zero-State-LLC/Noema-Specs. Specs are authority. Start at M0 unless args.milestone is set.",
    phases: [
        #{ title: "Select", detail: "pick the milestone (default M0)" },
        #{ title: "Read", detail: "governing Specs + live pins before any edit" },
        #{ title: "Implement", detail: "smallest runtime change; isolated worlds only" },
        #{ title: "Prove", detail: "tests, scripts, OBSERVED evidence" },
        #{ title: "Verify", detail: "fail-closed skeptic on freeze and proof" },
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
        "stale_claims": #{ "type": "boolean" },
        "milestone_done": #{ "type": "boolean" },
        "next_milestone": #{ "type": "string" },
        "artifacts": #{ "type": "array", "maxItems": 16, "items": #{ "type": "string" } },
        "ready_status": #{ "type": "string" },
        "genesis_id": #{ "type": "string" },
        "seal": #{ "type": "string" },
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
    s += "HARD CONSTRAINTS (do not violate): ";
    s += "Genesis genesis.ef578f4ffceeccd0 / Perihelion Reach is frozen. ";
    s += "Published seal sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395. ";
    s += "No new Player verbs. No live room-set edit. No Genesis reseed. ";
    s += "Do not open v0.8 Phenomena, event-catalog/0.3, crypto, x402, HP, quests. ";
    s += "ADR-002: private cognition off-wire. ADR-005/008: Python is digest/replay authority. ";
    s += "Hosted DO is live writer; Postgres is durable head (RFC-0016/0017). ";
    s += "ADR-006/007: atomic rooms; do not invent a 10-room live map. ";
    s += "Humans watch; agents inhabit. One Player ontology. ";
    s += "Claim labels only: OBSERVED / INFERRED / SPECULATIVE / NOT_COMPUTABLE. ";
    s += "Specs win on conflict unless an Accepted ADR/RFC says otherwise. ";
    s += "Never invent world rules in the runtime repo. ";
    s += "Unfreeze admission/seal/Genesis/verbs/room-bound only with UNFREEZE + RFC/ADR. ";
    s
}

fn milestone_exit(mid) {
    if mid == "m0" {
        return "Exit: written baseline pin table + no false production-bootstrap-blocked claims.";
    }
    if mid == "m1" {
        return "Exit: re-runnable isolated settlement proof; production ACTIVE/HEALTHY; no reseed.";
    }
    if mid == "m2" {
        return "Exit: noema-replay EQUIVALENT on fixtures/v01-seed; C01-C26 green or waived with reason.";
    }
    if mid == "m3" {
        return "Exit: POST /v1/command golden path + fail path under frozen seal; no DOM; token never in prompts.";
    }
    if mid == "m4" {
        return "Exit: WATCH shows only real public Perihelion rooms/exits; spectator can answer what/where/who.";
    }
    if mid == "m5" {
        return "Exit: hosted isolated matrix pass count improved; remaining skips listed; never claim Perihelion digest equivalence.";
    }
    if mid == "m6" {
        return "Exit: at least two P0 textures (GC5 MESSAGE bands, GC9 maintenance custom) observable in PLAY projections.";
    }
    if mid == "m7" {
        return "Exit: ready/play_blocked/incident/recover match ops docs; fail-closed settlement outage bounds.";
    }
    if mid == "m8" {
        return "Exit: next offline research package green, or scheduled with owners. Host STUDY stays stub.";
    }
    "Exit: report status only."
}

fn milestone_read_list(mid) {
    let s = "";
    if mid == "m0" {
        s += "Noema-Specs: SPEC-CHECKLIST.md, docs/HOSTED-ALPHA-FREEZE.md, docs/HOSTED-COMPATIBILITY-LAYERS.md, docs/SPEC-FREEZE-CORE-LOOP.md, docs/FIRST-WORLD-SPEC-FREEZE.md. ";
        s += "Noema: docs/DATA-STORES.md, docs/RUNTIME-READINESS-2026-08-13.md, spec-compat.json. ";
        s += "Live: curl GET https://noema.guru/ready and GET https://noema.guru/health. ";
        return s;
    }
    if mid == "m1" {
        s += "RFC-0016, RFC-0017, Noema workers/noema/src/settle.ts, incident-recover.ts, scripts/isolated-ack.mjs, test/isolated-settlement-proof.test.ts. ";
        return s;
    }
    if mid == "m2" {
        s += "ADR-005, ADR-008, docs/SPEC-FREEZE-CORE-LOOP.md, fixtures/v01-seed, noema-replay, C01-C26 conformance. ";
        return s;
    }
    if mid == "m3" {
        s += "RFC-0115, AGENT-SEAL-S0, workers/noema/src/seal.ts, scripts/agent-golden-path.mjs, scripts/agent-golden-fail.mjs. POST /v1/command only. ";
        return s;
    }
    if mid == "m4" {
        s += "WATCH-LIGHTWEIGHT-SPECTATOR, workers/noema/src/watch-live.ts, watch-phosphor.ts, live GET https://noema.guru/v1/watch/live. ";
        return s;
    }
    if mid == "m5" {
        s += "workers/noema/test/conformance hosted matrix, spec-compat hosted_runtime.chamber_suite. Isolated worlds only. ";
        return s;
    }
    if mid == "m6" {
        s += "GC5-FIRST-SLICE / RFC-0009, GC9 / RFC-0013, workers/noema/src/communication.ts, culture.ts, play-ui.ts. ";
        return s;
    }
    if mid == "m7" {
        s += "AUTH-AND-IDENTITY, ADMIN-LIVE-OPERATIONS, incident-recover.ts, /ready play_blocked, operator digests. ";
        return s;
    }
    s += "Specs v0.2-v0.7 package docs. Implement Python offline only. Host STUDY stays stub. ";
    s
}

let mid = "m0";
let runtime_root = "/home/scrimshawlife/Noema";
let specs_root = "/home/scrimshawlife/Noema-Specs";
let include_m9 = false;
if args != () {
    if args.milestone != () {
        let asked = trimmed(args.milestone);
        if asked != "" { mid = asked; }
    }
    if args.runtime_root != () {
        let rr = trimmed(args.runtime_root);
        if rr != "" { runtime_root = rr; }
    }
    if args.specs_root != () {
        let sr = trimmed(args.specs_root);
        if sr != "" { specs_root = sr; }
    }
    if args.include_m9 == true { include_m9 = true; }
}

let known = false;
let allowed = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9"];
for a in allowed {
    if a == mid { known = true; }
}
if !known {
    pause("verification", "Pass args.milestone as one of m0..m8 (m9 only with include_m9=true). Default is m0.");
}

if mid == "m9" && !include_m9 {
    let skip = "M9 hosted research surfaces are skipped until M0-M7 are solid. Pass include_m9=true only after an explicit Specs+product unfreeze of STUDY.";
    let p = write_scratch_file("report.md", skip);
    complete(#{ summary: skip, milestone: "m9", skipped: true, path: p });
}

phase("Select");
log("Milestone " + mid + " | runtime " + runtime_root + " | specs " + specs_root);

phase("Read");
let read_p = "";
read_p += "You are executing milestone " + mid + " of noema-runtime-from-specs. ";
read_p += "READ FIRST. Use curl, read_file, grep, list_dir. Do not edit yet. ";
read_p += "Runtime checkout: " + runtime_root + ". Specs checkout: " + specs_root + ". ";
read_p += freeze_rules();
read_p += "Governing docs: " + milestone_read_list(mid);
read_p += milestone_exit(mid);
read_p += " M0 first action (also when args.milestone is omitted): curl GET /ready and GET /health; ";
read_p += "read docs/DATA-STORES.md and SPEC-CHECKLIST.md plus freeze docs before any edit. ";
read_p += " Fetch live https://noema.guru/ready and /health when the milestone needs production truth. ";
read_p += "Set ok=true only if you independently inspected those sources. ";
read_p += "Set stale_claims=true if SPEC-CHECKLIST or freeze notes contradict OBSERVED /ready. ";
read_p += "Set blocked=true if freeze, missing secrets, or a Specs defect stops work. ";
read_p += "evidence: short OBSERVED facts (status, genesis, sequence, file:line). ";
read_p += "Empty evidence is invalid. Do not invent pins.";

let gathered = agent(read_p, #{
    label: "read:" + mid,
    capability_mode: "read-only",
    output_schema: status_schema,
});

let read_ok = false;
let read_ev = "";
let stale = false;
let blocked = false;
let block_reason = "";
if gathered != () && gathered.success && gathered.output != () {
    if gathered.output.ok == true { read_ok = true; }
    read_ev = text_of(gathered.output.evidence);
    if gathered.output.stale_claims == true { stale = true; }
    if gathered.output.blocked == true { blocked = true; }
    block_reason = text_of(gathered.output.block_reason);
} else {
    blocked = true;
    block_reason = "read agent failed or returned no evidence";
}

if blocked && !stale {
    let msg = "Blocked at " + mid + ": " + block_reason;
    log(msg);
    let p = write_scratch_file("report.md", msg + "\n\n" + read_ev);
    complete(#{ summary: msg, milestone: mid, blocked: true, path: p, evidence: read_ev });
}

let did_implement = false;
let impl_ev = "";
let impl_ok = false;
if mid != "m0" || stale {
    phase("Implement");
    let impl_p = "";
    impl_p += "You are implementing milestone " + mid + " in the Noema runtime. ";
    impl_p += "Runtime: " + runtime_root + ". Specs: " + specs_root + ". ";
    impl_p += freeze_rules();
    impl_p += "Read governing Specs (doc + schema + RFC/ADR) BEFORE editing. ";
    impl_p += milestone_read_list(mid);
    impl_p += milestone_exit(mid);
    impl_p += " Smallest change that meets the exit. Isolated worlds only for mutation (test.hosted-canonical.*). ";
    impl_p += "Never mutate Perihelion identity. Never POST invent verbs. ";
    impl_p += "If Specs are ambiguous, open a minimal Specs PR (defect only) — do not invent semantics. ";
    impl_p += "M0: correct stale checklist/docs against OBSERVED /ready only. ";
    impl_p += "M1: isolated settlement proof script/tests; p_allow_bootstrap=false on production /v1/command. ";
    impl_p += "M2: Python Chamber replay EQUIVALENT; do not treat Perihelion as C01-C26. ";
    impl_p += "M3: POST /v1/command golden + fail scripts with X-Noema-Seal; no operator test-world door as the happy path. ";
    impl_p += "M4: WATCH public subgraph = live rooms only (about 5 on Perihelion, not 10). ";
    impl_p += "M5: isolated hosted matrix only. ";
    impl_p += "M6: surface existing P0 textures; do not fake archive claims. ";
    impl_p += "M7: ops/incident/identity hardening. ";
    impl_p += "M8: Python offline packages only; STUDY stub stays. ";
    impl_p += "Prefer tests and scripts over new architecture essays. ";
    impl_p += "Set ok=true only with commands you ran. artifacts: files changed. evidence: OBSERVED proof.";
    let impl = agent(impl_p, #{
        label: "implement:" + mid,
        capability_mode: "all",
        output_schema: status_schema,
    });
    did_implement = true;
    if impl != () && impl.success && impl.output != () {
        if impl.output.ok == true { impl_ok = true; }
        impl_ev = text_of(impl.output.evidence);
        if impl.output.blocked == true {
            blocked = true;
            block_reason = text_of(impl.output.block_reason);
        }
    } else {
        impl_ev = "implement agent failed or returned no evidence";
    }
}

phase("Prove");
let prove_p = "";
prove_p += "Prove milestone " + mid + " against shipped code. ";
prove_p += "Runtime: " + runtime_root + ". Specs: " + specs_root + ". ";
prove_p += freeze_rules();
prove_p += milestone_exit(mid);
prove_p += " Run the real tests/scripts (vitest in workers/noema, isolated-ack.mjs, agent-golden-path.mjs, python replay as appropriate). ";
prove_p += "Do not print tokens. Do not automate /play DOM. Do not reseed. ";
prove_p += "Capture OBSERVED hashes/revisions/HTTP codes in evidence. ";
prove_p += "Set ok=true only if you ran the commands. milestone_done=true only if exit criteria hold.";
let proved = agent(prove_p, #{
    label: "prove:" + mid,
    capability_mode: "execute",
    output_schema: status_schema,
});
let prove_ok = false;
let prove_ev = "";
if proved != () && proved.success && proved.output != () {
    if proved.output.ok == true { prove_ok = true; }
    prove_ev = text_of(proved.output.evidence);
} else {
    prove_ev = "prove agent failed or returned no evidence";
}

phase("Verify");
let sk_p = "";
sk_p += "Adversarially verify milestone " + mid + ". Default real=false. ";
sk_p += "Runtime: " + runtime_root + ". Specs: " + specs_root + ". ";
sk_p += freeze_rules();
sk_p += "Read the actual files and command outputs. Set real=true only with independent evidence that: ";
sk_p += "(1) exit criteria hold, (2) Genesis/seal/verbs/rooms were not thawed, ";
sk_p += "(3) proof used POST /v1/command for inhabit (not operator test-world as the only path) when mid is m3, ";
sk_p += "(4) claims are labeled OBSERVED/INFERRED/SPECULATIVE. ";
sk_p += "Set thawed=true if any freeze surface moved without UNFREEZE. ";
sk_p += "Missing evidence => real=false.";
let skeptic = agent(sk_p, #{
    label: "verify:" + mid,
    capability_mode: "read-only",
    output_schema: verdict_schema,
});

let verified = false;
let v_reason = "no usable skeptic evidence";
let v_ev = "";
let thawed = false;
if skeptic != () && skeptic.success && skeptic.output != () {
    v_reason = text_of(skeptic.output.reason);
    v_ev = text_of(skeptic.output.evidence);
    if skeptic.output.thawed == true { thawed = true; }
    if skeptic.output.real == true && v_ev != "" && !thawed { verified = true; }
}

let report = "";
report += "# noema-runtime-from-specs — " + mid + "\n\n";
report += "Runtime: " + runtime_root + "\n";
report += "Specs: " + specs_root + "\n\n";
report += "## Read\n" + read_ev + "\n\n";
if did_implement {
    report += "## Implement ok=" + impl_ok.to_string() + "\n" + impl_ev + "\n\n";
}
report += "## Prove ok=" + prove_ok.to_string() + "\n" + prove_ev + "\n\n";
report += "## Verify real=" + verified.to_string() + " thawed=" + thawed.to_string() + "\n";
report += v_reason + "\n" + v_ev + "\n\n";
report += "## Exit\n" + milestone_exit(mid) + "\n";
if blocked {
    report += "\nBLOCKED: " + block_reason + "\n";
}

let path = write_scratch_file("report.md", report);
let summary = mid + " verified=" + verified.to_string() + " proved=" + prove_ok.to_string();
if thawed { summary = mid + " REJECTED: freeze thawed"; }
if blocked { summary = mid + " BLOCKED: " + block_reason; }

complete(#{
    summary: summary,
    milestone: mid,
    verified: verified,
    proved: prove_ok,
    implemented: did_implement,
    thawed: thawed,
    blocked: blocked,
    path: path,
});
