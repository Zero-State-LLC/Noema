#!/usr/bin/env python3
"""Offline demo of the frozen core loop (no network).

Usage (from repo root, venv active):

  python scripts/core_loop_demo.py
"""

from __future__ import annotations

import json
import tempfile
from pathlib import Path

from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.research.frontier.genomes import genome_content_digest, validate_genome

ROOT = Path(__file__).resolve().parents[1]


def load(rel: str) -> dict:
    return json.loads((ROOT / rel).read_text(encoding="utf-8"))


def main() -> None:
    with tempfile.TemporaryDirectory() as td:
        rt = NoemaRuntime(db_path=Path(td) / "demo.db")
        steps: list[str] = []

        admin = rt.create_session(role=Role.ADMIN)
        prev = rt.genesis_preview(
            admin["session_id"],
            world_name="Demo Reach",
            world_seed="seed.demo.core-loop",
            profile_id="FRACTURED_OLD_WORLD",
            story_seed_ids=["DAMAGED_RELAY", "INCOMPLETE_ARCHIVE"],
        )
        act = rt.genesis_activate(admin["session_id"], prev["result"]["genesis_id"])
        steps.append(f"GENESIS world={act['result']['world_id']}")

        player = rt.create_session(role=Role.AGENT, agent_id="agent.demo")
        for seq, verb, params in [
            (1, "ENTER_WORLD", {}),
            (2, "LOOK", {"attention_spent": 1}),
            (3, "WAIT", {"cycles": 1}),
        ]:
            rt.apply_player_action(
                player["session_id"],
                {
                    "verb": verb,
                    "agent_id": "agent.demo",
                    "client_action_sequence": seq,
                    "action_id": f"a{seq}",
                    "idempotency_key": f"i{seq}",
                    "parameters": params,
                },
            )
        steps.append(f"PLAY trajectories={len(rt.list_trajectories())} seq={rt.store.get_state().sequence}")

        researcher = rt.create_session(role=Role.RESEARCHER)
        state = rt.store.get_state()
        genome = dict(validate_genome(load("fixtures/v02-frontier/parent-genome.json")))
        genome["affected_rooms"] = [state.active_agents["agent.demo"]["room_id"]]
        genome["content_digest"] = genome_content_digest(genome)
        req = dict(load("fixtures/v02-frontier/frontier-request.json"))
        req["request_id"] = "fdrq.demo"
        fout = rt.run_frontier(
            researcher["session_id"],
            req,
            {"template.strategic-baseline": genome},
            inject=True,
            explicit_mutation_plans=[
                [{"operator_id": "MUT_RESOURCE_SCARCITY", "params": {"intensity_millipoints": 600}}]
            ],
        )
        steps.append(f"FRONTIER inject={len(fout['injection_events'])}")

        oout = rt.run_observatory(researcher["session_id"])
        steps.append(f"OBSERVATORY status={oout.get('status')} world_mutation={oout['world_mutation']}")

        cap = rt.capture_as_test(
            researcher["session_id"],
            intent=load("fixtures/v05-compiler/capture-intent.json"),
            lab_result=load("fixtures/v05-compiler/source-lab-result-ready.json"),
            unit_manifest=load("fixtures/v05-compiler/unit-manifest.json"),
        )
        steps.append(f"CAPTURE status={cap['status']} test={cap['captured_test']['captured_test_id']}")

        learn = rt.rebuild_learn(
            researcher["session_id"],
            sources=[{"captured_test": cap["captured_test"], "source_ref": "demo"}],
        )
        steps.append(f"LEARN behaviors={len(learn['behaviors'])} edges={len(learn['edges'])}")

        dt = rt.deep_time_ingest(
            researcher["session_id"],
            {
                "institutions": [load("fixtures/v06-deep-time/institution.json")],
                "scars": [load("fixtures/v06-deep-time/world-scar.json")],
            },
        )
        steps.append(f"DEEP_TIME ledger_unchanged={dt['ledger_unchanged']}")

        print("NOEMA core-loop demo")
        print("====================")
        for s in steps:
            print(" •", s)
        print("ready:", rt.ready())
        print("OK")


if __name__ == "__main__":
    main()
