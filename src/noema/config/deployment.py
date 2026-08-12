"""Resolved non-secret deployment config validation (Specs deployment-config.schema.json).

Pure-Python validator — no jsonschema dependency. Enforces required fields,
nested additionalProperties:false, enums, and hard rejection of secret-like keys.
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

from noema.world.digest import sha256_digest

SCHEMA_VERSION = "deployment-config/1.0"
ENVS = frozenset({"local", "test", "staging", "production", "research-isolated"})
LOG_LEVELS = frozenset({"debug", "info", "warn", "error"})
STORAGE_ADAPTERS = frozenset({"filesystem", "s3-compatible", "none"})
SANDBOX = frozenset({"strict", "permissive"})
NETWORK = frozenset({"deny-by-default", "allowlist", "permissive"})
SHA256_RE = re.compile(r"^sha256:[A-Fa-f0-9]{64}$")
WORLD_ID_RE = re.compile(r"^[A-Za-z0-9_.:-]+$")

# Keys that MUST never appear in resolved config (OPERATIONS / DEPLOYMENT).
SECRET_KEY_FRAGMENTS = (
    "password",
    "secret",
    "token",
    "api_key",
    "apikey",
    "private_key",
    "credential",
    "auth_secret",
    "signing_key",
)

TOP_LEVEL_ALLOWED = frozenset(
    {
        "schema_version",
        "env",
        "app_url",
        "api_url",
        "ws_url",
        "log_level",
        "host",
        "port",
        "worker_count",
        "request_timeout_ms",
        "database",
        "object_storage",
        "redis",
        "world",
        "replay",
        "security",
        "research",
        "feature_flags",
        "observability",
        "providers",
        "architecture",
    }
)

TOP_REQUIRED = (
    "schema_version",
    "env",
    "app_url",
    "database",
    "object_storage",
    "world",
    "replay",
    "security",
    "architecture",
)


class ConfigError(ValueError):
    """Deployment config failed validation."""


def configuration_digest(config: dict[str, Any]) -> str:
    """Canonical non-secret configuration digest (noema-jcs/1 + sha256)."""
    return sha256_digest(config)


def default_local_config(*, port: int = 8080, host: str = "0.0.0.0") -> dict[str, Any]:
    """Minimal valid local modular-monolith config for this runtime."""
    empty = sha256_digest({})
    return {
        "schema_version": SCHEMA_VERSION,
        "env": "local",
        "app_url": f"http://localhost:{port}",
        "api_url": f"http://localhost:{port}",
        "ws_url": f"ws://localhost:{port}/ws",
        "log_level": "info",
        "host": host,
        "port": port,
        "worker_count": 1,
        "request_timeout_ms": 30000,
        "database": {"engine": "postgresql", "pool_min": 1, "pool_max": 10},
        "object_storage": {
            "adapter": "filesystem",
            "local_path": "./var/objects",
            "bucket": "noema-local",
        },
        "redis": {"enabled": False},
        "world": {
            "world_id": "world-01",
            "world_seed_digest": empty,
            "tick_interval_ms": 1000,
            "snapshot_interval": 100,
            "max_agents": 10,
            "budget_defaults": {
                "attention": 8,
                "compute": 64,
                "energy": 80,
                "influence": 40,
                "storage": 16,
            },
        },
        "replay": {
            "deterministic_mode": True,
            "replay_verify": True,
            "storage_path": "./var/replays",
        },
        "security": {
            "sandbox_mode": "strict",
            "outbound_network_policy": "deny-by-default",
            "rate_limit_per_minute": 60,
            "max_action_payload_bytes": 32768,
            "allowed_agent_origins": [f"http://localhost:{port}"],
        },
        "research": {
            "enabled": False,
            "public_dataset_opt_in": False,
            "trajectory_retention_days": 30,
            "capture_agent_messages": True,
            "capture_tool_calls": True,
            "capture_self_reports": False,
        },
        "feature_flags": {
            "frontier_director": False,
            "phenomenon_compiler": False,
            "deep_time": True,
            "agent_institutions": False,
            "phenomena_lab": False,
        },
        "observability": {
            "metrics_enabled": True,
            "otel_service_name": "noema-local",
            "otel_exporter_configured": False,
            "sentry_configured": False,
        },
        "providers": {
            "openai_configured": False,
            "anthropic_configured": False,
            "google_configured": False,
            "xai_configured": False,
            "openrouter_configured": False,
        },
        "architecture": {
            "shape": "modular-monolith",
            "modules": [
                "http-websocket-server",
                "gateway-auth",
                "agent-registry",
                "action-router",
                "world-engine-state",
                "event-ledger",
                "observation-engine",
                "messaging",
                "scheduler",
                "snapshots",
                "replay",
                "spectator-projection",
                "research-capture",
            ],
        },
    }


def load_deployment_config(path: Path | str | None = None) -> dict[str, Any]:
    """Load and validate a deployment config file, or return default local config."""
    if path is None:
        cfg = default_local_config()
        validate_deployment_config(cfg)
        return cfg
    p = Path(path)
    if not p.is_file():
        raise ConfigError(f"deployment config not found: {p}")
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ConfigError(f"deployment config JSON error: {exc}") from exc
    if not isinstance(data, dict):
        raise ConfigError("deployment config must be a JSON object")
    validate_deployment_config(data)
    return data


def validate_deployment_config(cfg: dict[str, Any]) -> list[str]:
    """Validate against Specs deployment-config rules. Raises ConfigError on failure.

    Returns a list of warnings (empty when fully clean).
    """
    errors: list[str] = []
    warnings: list[str] = []

    # Secret-like keys anywhere in the tree
    for path in _walk_keys(cfg):
        leaf = path.split(".")[-1].lower()
        if any(frag in leaf for frag in SECRET_KEY_FRAGMENTS):
            errors.append(f"secret-like key forbidden: {path}")

    # Top-level additionalProperties: false
    for key in cfg:
        if key not in TOP_LEVEL_ALLOWED:
            errors.append(f"unknown top-level property: {key}")

    for req in TOP_REQUIRED:
        if req not in cfg:
            errors.append(f"missing required property: {req}")

    if cfg.get("schema_version") != SCHEMA_VERSION:
        errors.append(f"schema_version must be {SCHEMA_VERSION!r}")

    if cfg.get("env") not in ENVS:
        errors.append(f"env must be one of {sorted(ENVS)}")

    if not isinstance(cfg.get("app_url"), str) or not cfg.get("app_url"):
        errors.append("app_url must be a non-empty string")

    if "log_level" in cfg and cfg["log_level"] not in LOG_LEVELS:
        errors.append(f"log_level must be one of {sorted(LOG_LEVELS)}")

    if "port" in cfg:
        port = cfg["port"]
        if not isinstance(port, int) or not (1 <= port <= 65535):
            errors.append("port must be integer 1..65535")

    # database
    db = cfg.get("database")
    if isinstance(db, dict):
        _no_extra(db, {"engine", "pool_min", "pool_max"}, "database", errors)
        if db.get("engine") != "postgresql":
            errors.append("database.engine must be 'postgresql'")
    elif "database" in cfg:
        errors.append("database must be an object")

    # object_storage
    os_ = cfg.get("object_storage")
    if isinstance(os_, dict):
        _no_extra(os_, {"adapter", "bucket", "local_path"}, "object_storage", errors)
        if os_.get("adapter") not in STORAGE_ADAPTERS:
            errors.append(f"object_storage.adapter must be one of {sorted(STORAGE_ADAPTERS)}")
    elif "object_storage" in cfg:
        errors.append("object_storage must be an object")

    # redis
    redis = cfg.get("redis")
    if isinstance(redis, dict):
        _no_extra(redis, {"enabled"}, "redis", errors)
        if "enabled" in redis and not isinstance(redis["enabled"], bool):
            errors.append("redis.enabled must be boolean")

    # world
    world = cfg.get("world")
    if isinstance(world, dict):
        _no_extra(
            world,
            {
                "world_id",
                "world_seed_digest",
                "tick_interval_ms",
                "snapshot_interval",
                "max_agents",
                "budget_defaults",
            },
            "world",
            errors,
        )
        if "world_id" not in world:
            errors.append("world.world_id required")
        elif not isinstance(world["world_id"], str) or not WORLD_ID_RE.match(world["world_id"]):
            errors.append("world.world_id invalid pattern")
        if "max_agents" not in world:
            errors.append("world.max_agents required")
        elif not isinstance(world["max_agents"], int) or world["max_agents"] < 1:
            errors.append("world.max_agents must be integer >= 1")
        dig = world.get("world_seed_digest")
        if dig is not None and (not isinstance(dig, str) or not SHA256_RE.match(dig)):
            errors.append("world.world_seed_digest must match sha256:<64 hex>")
        budgets = world.get("budget_defaults")
        if isinstance(budgets, dict):
            _no_extra(
                budgets,
                {"attention", "compute", "energy", "influence", "storage"},
                "world.budget_defaults",
                errors,
            )
    elif "world" in cfg:
        errors.append("world must be an object")

    # replay
    replay = cfg.get("replay")
    if isinstance(replay, dict):
        _no_extra(replay, {"deterministic_mode", "replay_verify", "storage_path"}, "replay", errors)
        if "deterministic_mode" not in replay:
            errors.append("replay.deterministic_mode required")
        elif not isinstance(replay["deterministic_mode"], bool):
            errors.append("replay.deterministic_mode must be boolean")
    elif "replay" in cfg:
        errors.append("replay must be an object")

    # security
    sec = cfg.get("security")
    if isinstance(sec, dict):
        _no_extra(
            sec,
            {
                "sandbox_mode",
                "outbound_network_policy",
                "rate_limit_per_minute",
                "max_action_payload_bytes",
                "allowed_agent_origins",
            },
            "security",
            errors,
        )
        if sec.get("sandbox_mode") not in SANDBOX:
            errors.append(f"security.sandbox_mode must be one of {sorted(SANDBOX)}")
        if sec.get("outbound_network_policy") not in NETWORK:
            errors.append(
                f"security.outbound_network_policy must be one of {sorted(NETWORK)}"
            )
    elif "security" in cfg:
        errors.append("security must be an object")

    # architecture
    arch = cfg.get("architecture")
    if isinstance(arch, dict):
        _no_extra(arch, {"shape", "modules"}, "architecture", errors)
        if arch.get("shape") != "modular-monolith":
            errors.append("architecture.shape must be 'modular-monolith'")
    elif "architecture" in cfg:
        errors.append("architecture must be an object")

    # research / observability / providers — optional nested, no secrets, no extra props
    if isinstance(cfg.get("research"), dict):
        _no_extra(
            cfg["research"],
            {
                "enabled",
                "public_dataset_opt_in",
                "trajectory_retention_days",
                "capture_agent_messages",
                "capture_tool_calls",
                "capture_self_reports",
            },
            "research",
            errors,
        )
    if isinstance(cfg.get("observability"), dict):
        _no_extra(
            cfg["observability"],
            {
                "metrics_enabled",
                "otel_service_name",
                "otel_exporter_configured",
                "sentry_configured",
            },
            "observability",
            errors,
        )
    if isinstance(cfg.get("providers"), dict):
        _no_extra(
            cfg["providers"],
            {
                "openai_configured",
                "anthropic_configured",
                "google_configured",
                "xai_configured",
                "openrouter_configured",
            },
            "providers",
            errors,
        )
        for k, v in cfg["providers"].items():
            if not isinstance(v, bool):
                errors.append(f"providers.{k} must be boolean presence flag")

    if errors:
        raise ConfigError("; ".join(errors))
    return warnings


def _no_extra(obj: dict[str, Any], allowed: set[str], prefix: str, errors: list[str]) -> None:
    for key in obj:
        if key not in allowed:
            errors.append(f"unknown property: {prefix}.{key}")


def _walk_keys(obj: Any, prefix: str = "") -> list[str]:
    paths: list[str] = []
    if isinstance(obj, dict):
        for k, v in obj.items():
            path = f"{prefix}.{k}" if prefix else str(k)
            paths.append(path)
            paths.extend(_walk_keys(v, path))
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            paths.extend(_walk_keys(v, f"{prefix}[{i}]"))
    return paths
