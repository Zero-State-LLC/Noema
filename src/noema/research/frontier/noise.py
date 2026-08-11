"""Seeded, bounded, versioned noise for observation projection only."""

from __future__ import annotations

import hashlib
from typing import Any

from noema.research.errors import INVALID_MUTATION, ResearchError
from noema.research.frontier.catalog import noise_model
from noema.world.digest import sha256_digest


def closed_noise_ids() -> list[str]:
    return [op["noise_model_id"] for op in noise_model()["operators"]]


def apply_noise(
    *,
    noise_model_id: str,
    seed_stream: str,
    target_field_path: str,
    parameters: dict[str, Any],
    source_value: Any = None,
    source_event_id: str | None = None,
) -> dict[str, Any]:
    if noise_model_id not in closed_noise_ids():
        raise ResearchError(INVALID_MUTATION, f"unknown noise model {noise_model_id}")
    # Deterministic result digest from identity of inputs
    identity = {
        "noise_model_id": noise_model_id,
        "version": "noise-model/0.2",
        "seed_stream": seed_stream,
        "target_field_path": target_field_path,
        "parameters": parameters,
        "source_value": source_value,
        "source_event_id": source_event_id,
    }
    result_digest = sha256_digest(identity)
    value = source_value
    if noise_model_id == "quantization" and isinstance(source_value, (int, float)):
        step = int((parameters or {}).get("step_millipoints") or 100)
        if step <= 0:
            step = 100
        # quantize millipoint-scale values
        mp = int(round(float(source_value) * 10)) if float(source_value) <= 100 else int(source_value)
        value = (mp // step) * step
    elif noise_model_id == "omission":
        value = None
    elif noise_model_id == "delay_staleness":
        value = {
            "value": source_value,
            "staleness_cycles": int((parameters or {}).get("staleness_cycles") or 0),
        }
    return {
        "noise_model_id": noise_model_id,
        "version": "noise-model/0.2",
        "seed_stream": seed_stream,
        "target_field_path": target_field_path,
        "parameters": parameters,
        "source_event_id": source_event_id,
        "result_value": value,
        "result_digest": result_digest,
        "mutates_world": False,
    }


def noise_seed_bytes(seed_stream: str, field_path: str) -> bytes:
    return hashlib.sha256(f"{seed_stream}:{field_path}".encode("utf-8")).digest()
