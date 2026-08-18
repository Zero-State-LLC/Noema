"""Wire-facing action/observation models. No private fields."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ActionProposal(BaseModel):
    model_config = ConfigDict(extra="forbid")

    action: str
    target_id: str | None = None
    arguments: dict[str, Any] = Field(default_factory=dict)


class Observation(BaseModel):
    model_config = ConfigDict(extra="allow")

    cycle: int | None = None
    sequence: int | None = None
    obs_seq: int | None = None
    world_name: str | None = None
    location: dict[str, Any] | None = None
    available_actions: list[str] = Field(default_factory=list)
    affordances: list[dict[str, Any]] = Field(default_factory=list)
    in_world: bool | None = None
    world_status: str | None = None


class ActResult(BaseModel):
    ok: bool
    request_id: str
    observation: Observation | None = None
    error: dict[str, Any] | None = None
    idempotency_key: str | None = None
    raw: dict[str, Any] = Field(default_factory=dict)
