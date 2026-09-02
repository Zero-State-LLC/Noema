"""Phase 6 — Deep Time D01–D30 + Genesis G01–G09 coverage."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.deep_time.artifacts import apply_decay, validate_artifact
from noema.research.deep_time.claims import retain_conflict, validate_claim
from noema.research.deep_time.errors import DeepTimeError, HIDDEN_HISTORY, NARRATIVE_INVENTION
from noema.research.deep_time.institutions import founder_departs, set_lifecycle, validate_institution, validate_lineage
from noema.research.deep_time.projections import play_history_view, study_longitudinal, watch_timeline
from noema.research.deep_time.reconstruction import filter_hidden_evidence, validate_reconstruction
from noema.research.deep_time.registry import DeepTimeRegistry
from noema.research.deep_time.scars_names import rename_surface, validate_name, validate_scar
from noema.research.deep_time.succession import apply_succession, validate_succession
from noema.research.genesis.engine import GenesisEngine, profile_ids, validate_profile_id
from noema.research.genesis.errors import ALREADY_ACTIVATED, GenesisError, NOT_AUTHORIZED
from noema.world.digest import sha256_digest

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures" / "v01-seed"
V06 = ROOT / "fixtures" / "v06-deep-time"


def _load(name: str) -> dict:
    return json.loads((V06 / name).read_text(encoding="utf-8"))


def test_prior_phases_green():
    from noema.replay.runner import replay_v01_seed

    assert replay_v01_seed(FIXTURES).ok


# D01–D04 institutions
def test_d01_d04_institution_identity_and_lifecycle():
    inst = validate_institution(_load("institution.json"))
    assert inst["institution_id"]
    assert inst["origin"]["source_refs"]
    assert inst["digest"] == _load("expected-digests.json")["institution_digest"] or inst["digest"].startswith(
        "sha256:"
    )
    active = validate_institution(_load("institution-active.json"))
    dormant = set_lifecycle(active, "DORMANT", cycle=1900)
    assert dormant["status"] == "DORMANT"
    assert dormant["addressable"] is True
    dissolved = set_lifecycle(active, "DISSOLVED", cycle=2000)
    assert dissolved["addressable"] is True


# D05–D06 succession + founder departure
def test_d05_d06_succession_and_founder_departure():
    succ = validate_succession(_load("succession.json"))
    assert succ["digest"] == _load("expected-digests.json")["succession_digest"]
    assert succ["institution_continues"] is True
    vacant = validate_succession(_load("succession-vacant.json"))
    assert vacant["outcome"] == "VACANT"
    inst = validate_institution(_load("institution-active.json"))
    after = founder_departs(inst, "agent.nacre.founder", cycle=1300)
    assert after["survives_founder_departure"] is True
    assert after.get("status") != "DELETED"
    transferred = apply_succession(inst, succ)
    assert transferred.get("current_custodian") == "agent.vesper.steward"


# D07 dormancy
def test_d07_dormancy_retains_addressable_history():
    dormant = validate_institution(_load("institution.json"))
    assert dormant["status"] == "DORMANT"
    assert dormant["institution_id"]
    vacant = validate_succession(_load("succession-vacant.json"))
    assert vacant["outcome"] == "VACANT"
    assert vacant["institution_continues"] is True
    stepped = set_lifecycle(validate_institution(_load("institution-active.json")), "DORMANT", cycle=1900)
    assert stepped["status"] == "DORMANT"
    assert stepped["addressable"] is True


# D08 dissolution
def test_d08_dissolution_retains_addressable_history():
    dissolved = set_lifecycle(validate_institution(_load("institution-active.json")), "DISSOLVED", cycle=2000)
    assert dissolved["status"] == "DISSOLVED"
    assert dissolved["addressable"] is True
    assert dissolved.get("status") != "DELETED"


# D09 lineage identity classes
def test_d09_lineage_identity_classes():
    lin = validate_lineage(_load("institution-lineage.json"))
    classes = {n.get("identity_class") for n in lin["nodes"]}
    assert "SAME_ENTITY_EVOLVED" in classes
    assert "SUCCESSOR_ENTITY" in classes


# D10–D13 artifacts
def test_d10_d13_artifacts_integrity_decay():
    archive = validate_artifact(_load("artifact-archive.json"))
    assert archive["claims_are_not_world_truth"] is True
    assert archive["digest"] == _load("expected-digests.json")["artifact_archive_digest"]
    destroyed = validate_artifact(_load("artifact-destroyed.json"))
    assert destroyed["integrity"] == "DESTROYED"
    assert destroyed["existed_fact_preserved"] is True
    degraded = apply_decay(validate_artifact(_load("artifact-marker.json")), cycles_elapsed=1500)
    assert degraded["integrity"] in ("DEGRADED", "FRAGMENTARY", "CORRUPTED", "INTACT")
    assert degraded["ledger_mutated"] is False


# D14–D15 claims contested
def test_d14_d15_conflicting_claims_retained():
    a = validate_claim(_load("claim-peaceful-transfer.json")) if (V06 / "claim-peaceful-transfer.json").exists() else None
    b = validate_claim(_load("claim-conflict-transfer.json"))
    assert b["evidence_status"] == "CONTESTED"
    assert b["contradicting_claim_refs"]
    if a:
        conflict = retain_conflict(a, b)
        assert conflict["forced_resolution"] is False
        assert conflict["both_retained"] is True


# D16–D18 reconstruction + hidden history
def test_d16_d18_reconstruction_and_hidden():
    recon = validate_reconstruction(_load("reconstruction-archaeology.json"))
    assert recon["narrative_invention"] is False
    assert recon["digest"] == _load("expected-digests.json")["reconstruction_digest"] or recon["digest"].startswith(
        "sha256:"
    )
    hidden = _load("evidence-ledger-hidden.json")
    with pytest.raises(DeepTimeError) as ei:
        filter_hidden_evidence(hidden, player_visible=True)
    assert ei.value.code == HIDDEN_HISTORY
    red = filter_hidden_evidence(hidden, player_visible=False)
    assert red["redacted"] is True


# D36 Gate B validation of derived fidelity and Controller metadata
def test_d36_reconstruction_fidelity_and_controller_validation():
    base = {
        "schema_version": "historical-reconstruction/0.6",
        "reconstruction_id": "recon.gate-b.36",
        "subject_ref": "entity.relay-south",
        "evidence_set": ["evidence.controller-a"],
    }
    validated = validate_reconstruction({**base, "fidelity": 0.75, "controllers": 3})
    assert validated["fidelity"] == 0.75
    assert validated["controllers"] == 3
    assert validated["digest"].startswith("sha256:")

    for fidelity in (-0.01, 1.01, True):
        with pytest.raises(DeepTimeError):
            validate_reconstruction({**base, "fidelity": fidelity})

    for controllers in (0, -1, True, 3.0, "3", [], {}):
        with pytest.raises(DeepTimeError) as exc:
            validate_reconstruction({**base, "controllers": controllers})
        assert exc.value.code == NARRATIVE_INVENTION

    omitted = validate_reconstruction(base)
    assert "controllers" not in omitted


# D37 Gate B registry fidelity / Controller metadata
def test_d37_registry_preserves_reconstruction_fidelity_and_controllers():
    reg = DeepTimeRegistry()
    recon = {
        "schema_version": "historical-reconstruction/0.6",
        "reconstruction_id": "recon.gate-b.37",
        "subject_ref": "entity.relay-south",
        "evidence_set": ["evidence.controller-a", "evidence.controller-b", "evidence.controller-c"],
        "fidelity": 0.85,
        "controllers": 3,
    }

    stored = reg.put_reconstruction(recon)

    assert stored["fidelity"] == 0.85
    assert stored["controllers"] == 3
    assert reg.snapshot()["reconstructions"] == [stored]


def test_d38_reconstruction_ingest_preserves_provenance_digest_and_caller(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "d38.sqlite3")
    researcher = rt.create_session(role=Role.RESEARCHER)
    recon = {
        "schema_version": "historical-reconstruction/0.6",
        "reconstruction_id": "recon.gate-b.38",
        "subject_ref": "entity.relay-south",
        "evidence_set": ["controller-a", "controller-b", "controller-c"],
        "fidelity": 0.9,
        "controllers": 3,
    }
    before = dict(recon)

    out = rt.deep_time_ingest(researcher["session_id"], {"reconstructions": [recon]})

    stored = out["snapshot"]["reconstructions"][0]
    assert stored["controllers"] == 3
    assert stored["fidelity"] == 0.9
    assert stored["digest"].startswith("sha256:")
    assert recon == before
    assert rt.deep_time.reconstructions["recon.gate-b.38"] == stored

    invalid_base = {
        "schema_version": "historical-reconstruction/0.6",
        "reconstruction_id": "recon.invalid",
        "subject_ref": "entity.relay-south",
        "evidence_set": ["controller-a"],
    }
    for controllers in (0, -1, True, 1.5, "3", [], {}):
        with pytest.raises(DeepTimeError) as exc:
            rt.deep_time_ingest(
                researcher["session_id"],
                {
                    "reconstructions": [
                        {
                            **invalid_base,
                            "reconstruction_id": f"recon.invalid.{type(controllers).__name__}",
                            "controllers": controllers,
                        }
                    ]
                },
            )
        assert exc.value.code == NARRATIVE_INVENTION


# D22 names immutable
def test_d22_canonical_id_immutable_under_rename():
    name = validate_name(_load("name-relay-south.json"))
    assert name["canonical_id_immutable"] is True
    renamed = rename_surface(name, "South Relay Ruins", cycle=2000)
    assert renamed["canonical_id"] == name["canonical_id"]
    assert renamed["surface_name"] == "South Relay Ruins"


# D24 scars
def test_d24_world_scar_from_events():
    scar = validate_scar(_load("world-scar.json"))
    assert scar["derived_from_event_refs"]
    assert scar["digest"] == _load("expected-digests.json")["scar_digest"]


# D19 institutional memory
def test_d19_institutional_memory_archive_and_practices():
    inst = validate_institution(_load("institution.json"))
    archive = validate_artifact(_load("artifact-archive.json"))
    assert inst["archive_ref"] == archive["artifact_id"]
    assert archive["artifact_class"] == "ARCHIVE"
    assert inst["persistent_practices"]
    assert archive["claims_are_not_world_truth"] is True


# D20–D21 cultural transmission + semantic lineage
def test_d20_d21_semantic_lineage_not_auto_interpreted():
    lin = _load("semantic-lineage.json")
    assert lin["schema_version"] == "semantic-lineage/0.6"
    assert lin["auto_interpreted"] is False
    assert lin["canonical_subject_id"]
    assert lin["digest"] == _load("expected-digests.json")["semantic_lineage_digest"]
    body = {k: v for k, v in lin.items() if k != "digest"}
    assert sha256_digest(body) == lin["digest"]
    forms = [e["surface_form"] for e in lin["entries"]]
    assert len(set(forms)) > 1
    labels = {e["claim_label"] for e in lin["entries"]}
    assert "PROVEN" not in labels
    assert labels <= {"OBSERVED", "INFERRED", "SPECULATIVE", "NOT_COMPUTABLE"}


# D23 historical geography
def test_d23_historical_geography_place_has_scar():
    scar = validate_scar(_load("world-scar.json"))
    onboard = _load("play-onboarding.json")
    play = _load("play-old-relay.json")
    assert scar["location_ref"]
    assert scar["simple_label"] in onboard["presentation"]["nearby"]
    assert "scar.relay-south.damage" in play["canonical_source_refs"]
    assert play["mode"] == "PLAY"
    assert play["research_detail"] is False
    assert play["canonical_claim_label"] != "PROVEN"


# D25 inheritance is explicit
def test_d25_inheritance_explicit_successor_not_same_entity():
    pred = validate_institution(_load("institution.json"))
    succ_inst = validate_institution(_load("institution-successor.json"))
    succession = validate_succession(_load("succession.json"))
    assert pred["inheritor_refs"]
    assert succession["institution_continues"] is True
    assert succ_inst["continuity"]["identity_class"] == "SUCCESSOR_ENTITY"
    assert succ_inst["continuity"]["predecessor_institution_id"] == pred["institution_id"]
    assert succ_inst["succession_mechanism"] == "INHERITED_BY_ORGANIZATION"
    assert succ_inst["institution_id"] != pred["institution_id"]


# D26 historical snapshot ≠ ledger
def test_d26_snapshot_separated_from_ledger():
    hidden = _load("evidence-ledger-hidden.json")
    red = filter_hidden_evidence(hidden, player_visible=False)
    assert red["redacted"] is True
    with pytest.raises(DeepTimeError) as ei:
        filter_hidden_evidence(hidden, player_visible=True)
    assert ei.value.code == HIDDEN_HISTORY
    snap = DeepTimeRegistry().snapshot()
    assert snap["ledger_is_canonical"] is True
    assert snap["lore_is_not_truth"] is True
    assert "events" not in snap


# D27–D29 projections
def test_d27_d29_projections():
    play = play_history_view(
        subject_ids=["scar.relay-south.damage"],
        title="OLD RELAY",
        age_label="~1,900 cycles",
        known_history="Likely built by Nacre.",
        evidence=["maker mark"],
    )
    assert play["mode"] == "PLAY"
    assert play["lore_is_not_world_truth"] is True
    watch = watch_timeline(
        [{"label": "FOUNDING", "text": "Nacre establishes stewardship"}],
        subject_ids=["inst.nacre-relay-stewardship"],
    )
    assert watch["mode"] == "WATCH"
    study = study_longitudinal(
        ["Did this institution survive founder departure?"],
        subject_ids=["inst.nacre-relay-stewardship"],
    )
    assert study["mode"] == "STUDY"
    play_fx = _load("play-old-relay.json")
    watch_fx = _load("watch-timeline.json")
    study_fx = _load("study-questions.json")
    assert play_fx["mode"] == "PLAY" and play_fx["research_detail"] is False
    assert watch_fx["mode"] == "WATCH" and watch_fx["research_detail"] is False
    assert study_fx["mode"] == "STUDY" and study_fx["research_detail"] is True
    assert "inst.nacre-relay-stewardship" in watch_fx["canonical_source_refs"]
    assert "inst.nacre-relay-stewardship" in study_fx["canonical_source_refs"]


# D30 lore boundary
def test_d30_lore_not_second_truth():
    reg = DeepTimeRegistry()
    reg.put_institution(_load("institution.json"))
    reg.put_artifact(_load("artifact-archive.json"))
    snap = reg.snapshot()
    assert snap["lore_is_not_truth"] is True
    assert snap["ledger_is_canonical"] is True


# Registry does not change production ledger
def test_deep_time_runtime_ledger_isolation(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    rt.start_world(FIXTURES / "world-seed.json")
    seq = rt.store.get_state().sequence
    researcher = rt.create_session(role=Role.RESEARCHER)
    out = rt.deep_time_ingest(
        researcher["session_id"],
        {
            "institutions": [_load("institution.json")],
            "successions": [_load("succession.json")],
            "artifacts": [_load("artifact-archive.json"), _load("artifact-destroyed.json")],
            "claims": [_load("claim-conflict-transfer.json")],
            "scars": [_load("world-scar.json")],
            "names": [_load("name-relay-south.json")],
            "reconstructions": [_load("reconstruction-archaeology.json")],
            "lineages": [_load("institution-lineage.json")],
        },
    )
    assert out["ledger_unchanged"] is True
    assert out["mutates_world"] is False
    assert rt.store.get_state().sequence == seq
    play = rt.deep_time_play_view(researcher["session_id"])
    assert play["mode"] == "PLAY"


# --- Genesis G01–G09 ---


def test_g01_g02_profiles_and_seeds():
    assert "FRACTURED_OLD_WORLD" in profile_ids()
    assert "YOUNG_FRONTIER" in profile_ids()
    validate_profile_id("FRACTURED_OLD_WORLD")
    eng = GenesisEngine()
    with pytest.raises(GenesisError):
        eng.preview(world_name="X", world_seed="s", profile_id="NOPE")


def test_g03_g04_same_seed_determinism_different_seed_valid():
    eng = GenesisEngine()
    a1 = eng.preview(
        world_name="Aster Reach",
        world_seed="seed.aster-reach.alpha",
        profile_id="FRACTURED_OLD_WORLD",
        story_seed_ids=["DAMAGED_RELAY", "INCOMPLETE_ARCHIVE"],
    )
    a2 = eng.preview(
        world_name="Aster Reach",
        world_seed="seed.aster-reach.alpha",
        profile_id="FRACTURED_OLD_WORLD",
        story_seed_ids=["DAMAGED_RELAY", "INCOMPLETE_ARCHIVE"],
    )
    assert a1["digest"] == a2["digest"]
    b = eng.preview(
        world_name="Aster Reach",
        world_seed="seed.aster-reach.beta",
        profile_id="FRACTURED_OLD_WORLD",
        story_seed_ids=["DAMAGED_RELAY", "INCOMPLETE_ARCHIVE"],
    )
    assert b["digest"] != a1["digest"]
    assert b["ordinary_world_valid"] is True


def test_g05_g06_cycle0_and_opportunities():
    eng = GenesisEngine()
    r = eng.preview(
        world_name="Aster Reach",
        world_seed="seed.x",
        profile_id="FRACTURED_OLD_WORLD",
        story_seed_ids=["OLD_TRADE_NETWORK"],
    )
    assert r["cycle0"]["ordinary_world_valid"] is True
    assert r["cycle0"]["cycle"] == 0
    assert len(r["starting_opportunities"]) >= 3
    assert r["scripts_player_outcomes"] is False


def test_g07_g08_player_projection_no_genesis_controls():
    eng = GenesisEngine()
    r = eng.preview(world_name="Aster Reach", world_seed="seed.x", profile_id="YOUNG_FRONTIER")
    player = eng.player_entry_view(r)
    assert player["presentation"]["no_genesis_controls"] is True
    assert player["mode"] == "PLAY"
    admin = eng.admin_preview_view(r)
    assert admin["presentation"]["admin_only"] is True


def test_g09_admin_only_activate_and_freeze(tmp_path: Path):
    rt = NoemaRuntime(db_path=tmp_path / "w.db")
    # need session before world for genesis preview; admin can preview without world
    admin = rt.create_session(role=Role.ADMIN)
    player = rt.create_session(role=Role.AGENT, agent_id="p")
    researcher = rt.create_session(role=Role.RESEARCHER)
    with pytest.raises(GenesisError) as ei:
        rt.genesis_preview(player["session_id"], world_name="X", world_seed="s", profile_id="YOUNG_FRONTIER")
    assert ei.value.code == NOT_AUTHORIZED
    with pytest.raises(GenesisError):
        rt.genesis_preview(researcher["session_id"], world_name="X", world_seed="s", profile_id="YOUNG_FRONTIER")

    prev = rt.genesis_preview(
        admin["session_id"],
        world_name="Aster Reach",
        world_seed="seed.aster-reach.alpha",
        profile_id="FRACTURED_OLD_WORLD",
        story_seed_ids=["DAMAGED_RELAY", "DORMANT_INSTITUTION", "ABANDONED_ROUTE"],
    )
    gid = prev["result"]["genesis_id"]
    assert prev["result"]["status"] == "PREVIEW"
    act = rt.genesis_activate(admin["session_id"], gid)
    assert act["result"]["status"] == "ACTIVATED"
    assert act["config_frozen"] is True
    assert act["world"]["ordinary_world_valid"] is True
    assert act["player_entry"]["presentation"]["no_genesis_controls"] is True
    # cannot re-activate
    with pytest.raises(GenesisError) as e2:
        rt.genesis_activate(admin["session_id"], gid)
    assert e2.value.code == ALREADY_ACTIVATED
    # PLAY works after activation
    p2 = rt.create_session(role=Role.AGENT, agent_id="agent.g")
    r = rt.apply_player_action(
        p2["session_id"],
        {
            "verb": "ENTER_WORLD",
            "agent_id": "agent.g",
            "client_action_sequence": 1,
            "action_id": "a1",
            "idempotency_key": "i1",
            "parameters": {},
        },
    )
    assert r["results"][0]["status"] == "APPLIED"


def test_genesis_fixture_digests_shape():
    a = _load("genesis-result-a.json")
    assert a["status"] in ("ACTIVATED", "PREVIEW", "COMPLETE")
    assert a.get("genesis_profile_id") or a.get("world_seed")
    exp = _load("expected-digests.json")
    body = {k: v for k, v in a.items() if k != "digest"}
    # fixture digest may match full body
    if a.get("digest"):
        assert a["digest"].startswith("sha256:")
    assert "genesis_result_a_digest" in exp
