"""C1's non-normative examples: seed facts, not golden wire trajectories.

Inputs are the real Specs examples/mud-play-craft documents and their linked
examples/chamber-world seed, NOT the hosted miniChamber or v01 replay seed.
Investigated at Specs b86c4b09cf75b3027d87998eff0952c2421bf52d.

Supported checks deliberately stop at static descriptions, topology, local
entity facts, budget vocabulary/defaults and the native offline observation
boundary. PRESSURE prose, condition bands, repair outcomes, arrival balances
and HAPPENED are illustrative, not reducer expectations. The human first-paint
three-action cap is not a constraint on the full Agent action catalogue.
"""

from __future__ import annotations

from copy import deepcopy
from pathlib import Path
import re

import pytest

from specs_checkout import require_specs
from noema.app.runtime import NoemaRuntime
from noema.auth.roles import Role
from noema.observations.project import project_agent_observation
from noema.world.state import load_seed

ROOT = Path(__file__).resolve().parents[1]
CANDIDATES = (ROOT.parent / "Noema-Specs", Path("/home/scrimshawlife/Noema-Specs"))
SPECS = next((p for p in CANDIDATES if p.is_dir()), CANDIDATES[0])
ROOMS = ("civic-exchange", "relay-quarter", "foundry-corridor")
LAYERS = ("PRESSURE", "HERE", "EXITS", "STATUS", "HAPPENED", "AVAILABLE HERE")


@pytest.fixture(scope="module")
def inputs():
    folder = SPECS / "examples" / "mud-play-craft"
    paths = [folder / "README.md", *(folder / f"projection-{r}.md" for r in ROOMS)]
    for path in paths:
        require_specs(path, f"C1 presentation example {path.name}")
        assert path.is_file(), path
    readme = paths[0].read_text(encoding="utf-8")
    link = re.search(r"\*\*Seed:\*\* \[world-seed.json\]\(([^)]+)\)", readme)
    assert link, "C1 README must identify its seed, not a hosted fallback"
    seed_path = (folder / link[1]).resolve()
    assert seed_path == (SPECS / "examples/chamber-world/world-seed.json").resolve()
    require_specs(seed_path, "C1 linked Chamber 10-room seed")
    # Byte-for-byte guard: neither loading nor projecting may rewrite inputs.
    originals = {p: p.read_bytes() for p in [*paths, seed_path]}
    assert "Non-normative presentation fixtures" in readme
    assert "using only seed-backed names, exits, and entities" in readme
    assert "illustrative defaults from seed `budget_defaults`" in readme
    yield seed_path, {r: paths[i + 1].read_text(encoding="utf-8") for i, r in enumerate(ROOMS)}
    for path, original in originals.items():
        assert path.read_bytes() == original, f"read-only input changed: {path}"


def _presentation(text):
    """Read the first fenced Human PLAY example, never later failure sketches."""
    blocks = re.findall(r"```text\n(.*?)\n```", text, re.DOTALL)
    assert blocks, "missing Human PLAY presentation"
    lines = blocks[0].splitlines()
    positions = [lines.index(layer) for layer in LAYERS]
    assert positions == sorted(positions), "Feature B layers out of order"
    sections = {}
    for i, layer in enumerate(LAYERS):
        end = positions[i + 1] if i + 1 < len(positions) else len(lines)
        sections[layer] = [line for line in lines[positions[i] + 1:end] if line]
    return lines, sections


@pytest.mark.parametrize("slug", ROOMS)
def test_example_room_description_and_local_entities_are_seed_backed(inputs, slug):
    seed_path, documents = inputs
    state = load_seed(seed_path)
    document = documents[slug]
    room_id = f"room.{slug}"
    assert f"**Seed:** `{room_id}`" in document
    room = state.rooms[room_id]
    lines, sections = _presentation(document)
    assert lines[:4] == [room["name"], "", room["description"], ""]
    local = [state.entities[eid] for eid in room["entity_ids"]]
    if not local:
        assert sections["HERE"] == ["(no one else here)", "(no local interactables)"]
    else:
        assert {line.split(" (", 1)[0] for line in sections["HERE"]} == {
            ent["properties"]["label"] for ent in local
        }
    # Every explicitly identified entity belongs here, not elsewhere in the map.
    assert set(re.findall(r"`(entity\.[\w-]+)`", document)) == set(room["entity_ids"])
    for entity in local:
        label = entity["properties"]["label"]
        here = next(line for line in sections["HERE"] if line.startswith(label + " ("))
        values = entity["state"]
        if "available" in values:
            assert f"stock {values['available']}/{values['capacity']}" in here
            assert f"available {values['available']}/{values['capacity']}" in document
            assert f"regen {values['regen_per_cycle']}/cycle" in document
        if "condition" in values:
            assert f"condition {values['condition']}" in document
        if "power_stability" in values:
            assert f"power_stability {values['power_stability']}" in document


@pytest.mark.parametrize("slug", ROOMS)
def test_example_exits_and_visible_command_targets_match_seed(inputs, slug):
    seed_path, documents = inputs
    state = load_seed(seed_path)
    _, sections = _presentation(documents[slug])
    exits = [e for e in state.exits.values() if e["from_room_id"] == f"room.{slug}"]
    expected = []
    for exit_record in exits:
        line = f"{exit_record['direction'].lower()} — {state.rooms[exit_record['to_room_id']]['name']}"
        if exit_record.get("conditions"):
            assert exit_record["conditions"] == ["ACCESS_TOKEN"]
            line += " (access token required)"
        if exit_record.get("traversal_cost"):
            assert set(exit_record["traversal_cost"]) == {"energy"}
            line += f" (costs {exit_record['traversal_cost']['energy']} energy)"
        expected.append(line)
    assert sorted(sections["EXITS"]) == sorted(expected)
    targets = {state.entities[eid]["properties"]["label"]: state.entities[eid]
               for eid in state.rooms[f"room.{slug}"]["entity_ids"]}
    for command in sections["AVAILABLE HERE"]:
        verb, _, target = command.partition(" ")
        if verb == "walk":
            assert target in {e["direction"].lower() for e in exits if not e.get("conditions")}
        elif verb in {"inspect", "harvest", "repair"}:
            assert target in targets
            if verb == "harvest":
                assert targets[target]["properties"].get("resource_node") is True
            if verb == "repair":
                assert targets[target]["entity_type"] == "INFRASTRUCTURE"
        else:
            assert command in {"look", "wait"}


@pytest.mark.parametrize("slug", ROOMS)
def test_example_status_uses_seed_budget_vocabulary_not_arrival_wire_balances(inputs, slug):
    seed_path, documents = inputs
    state = load_seed(seed_path)
    _, sections = _presentation(documents[slug])
    status = " ".join(sections["STATUS"])
    pairs = re.findall(r"([a-z]+) ([0-9]+)", status)
    assert len(pairs) == len(state.budget_defaults)
    assert {key for key, _ in pairs} == set(state.budget_defaults)
    # Only Civic's fresh entry claims defaults. Relay/Foundry describe arrivals,
    # not authoritative movement costs, so never assert their sample balances.
    if slug == "civic-exchange":
        assert {key: int(value) for key, value in pairs} == state.budget_defaults


@pytest.mark.parametrize("slug", ROOMS)
def test_native_offline_projection_observes_only_local_seed_facts_without_writes(inputs, slug, tmp_path):
    seed_path, _ = inputs
    seed = load_seed(seed_path)
    runtime = NoemaRuntime(db_path=tmp_path / "c1.sqlite3", research_capture=False)
    try:
        runtime.start_world(seed_path)
        agent_id = next(iter(seed.registered_agents))
        session = runtime.create_session(role=Role.AGENT, agent_id=agent_id,
                                         scopes=["noema.action.submit"])
        # Native authorized offline entry to each example room is setup, not a
        # reconstruction of the illustrative arrival or a hosted world command.
        entered = runtime.apply_player_action(session["session_id"], {
            "verb": "ENTER_WORLD", "agent_id": agent_id,
            "action_id": f"c1.{slug}", "idempotency_key": f"c1.{slug}",
            "client_action_sequence": 1, "parameters": {"room_id": f"room.{slug}"},
        })
        assert entered["results"][0]["status"] == "APPLIED"
        state = runtime.store.get_state()
        before = deepcopy(vars(state))
        head = runtime.store.ledger_head()
        observation = project_agent_observation(state, agent_id)
        assert observation == entered["observation"]
        assert project_agent_observation(state, agent_id) == observation
        assert vars(state) == before
        assert runtime.store.ledger_head() == head
        location = observation["LOCATION"]
        room = seed.rooms[f"room.{slug}"]
        assert location["room_id"] == room["room_id"]
        assert location["name"] == room["name"]
        assert location["description"] == room["description"]
        assert {e["entity_id"]: (e["entity_type"], e["label"])
                for e in location["entities"]} == {
            eid: (seed.entities[eid]["entity_type"], seed.entities[eid]["properties"]["label"])
            for eid in room["entity_ids"]
        }
        assert {e["exit_id"]: e["to_room_id"] for e in location["exits"]} == {
            e["exit_id"]: e["to_room_id"] for e in seed.exits.values()
            if e["from_room_id"] == room["room_id"]
        }
        # This offline wire exposes identity summaries, not human stock/bands,
        # global entities, exit destination names, or the illustrative HAPPENED.
        assert all(set(e) == {"entity_id", "entity_type", "label"} for e in location["entities"])
        assert all(set(e) == {"exit_id", "to_room_id"} for e in location["exits"])
        assert observation["STATUS"]["budgets"] == seed.budget_defaults
        assert observation["VISIBLE_EVENTS"] == []
        assert "HAPPENED" not in observation
        # No human max-three assertion on the Agent catalogue.
        assert {"LOOK", "MOVE", "INSPECT", "HARVEST", "REPAIR"} <= set(observation["AVAILABLE_ACTIONS"])
        seed_before = deepcopy(vars(seed))
        absent = project_agent_observation(seed, agent_id)
        assert absent["status"] == "NOT_IN_WORLD"
        assert absent["LOCATION"] is None
        assert absent["AVAILABLE_ACTIONS"] == ["ENTER_WORLD"]
        assert vars(seed) == seed_before
        assert seed.active_agents == {}
    finally:
        runtime.store.close()
