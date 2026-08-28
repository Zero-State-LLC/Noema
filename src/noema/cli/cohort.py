"""Safe LCA-2 cohort process and evidence orchestration.

This module launches the official ``noema`` public CLI. It does not implement
client decisions, gameplay verbs, enrollment, browser automation, or protocol
logic.
"""
from __future__ import annotations

import argparse
import base64
import copy
import hashlib
import json
import os
import re
import shutil
import signal
import stat
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, BinaryIO

from noema.cli.preflight import build_preflight

CONFIG_SCHEMA = "noema-lca2-cohort-config/1.0"
MANIFEST_SCHEMA = "noema-lca2-cohort-manifest/1.0"
STATE_SCHEMA = "noema-lca2-cohort-state/1.0"
PROCESS_LOG_SCHEMA = "noema-lca2-cohort-process-log/1.0"
VERIFICATION_SCHEMA = "noema-lca2-cohort-verification/1.0"
REPORT_SCHEMA = "noema-lca2-cohort-report/1.0"
PARTICIPANT_EVIDENCE_SCHEMA = "noema-lca2-participant-evidence/1.0"
HUMAN_APPROVAL_SCHEMA = "noema-lca2-human-approval/1.0"
LIVE_ACK = "I_ACKNOWLEDGE_LIVE_AGENT_MUTATION"

PROCESS_STATUSES = frozenset({"PENDING", "RUNNING", "SUCCEEDED", "CRASHED", "CANCELLED"})
RUN_STATUSES = frozenset(
    {
        "PREPARED",
        "AWAITING_HUMAN_APPROVAL",
        "RUNNING",
        "SUCCEEDED",
        "SIMULATED",
        "FAILED",
        "CANCELLED",
    }
)
CLAIM_STATUSES = frozenset({"OBSERVED", "INFERRED", "BLOCKED", "DEFERRED", "SPECULATIVE"})
VERDICTS = frozenset({"PREPARATION", "OPEN", "BLOCKED", "COMPLETE", "NOT_COMPUTABLE", "REJECTED"})

_LABEL = re.compile(r"^[a-z][a-z0-9-]{0,39}$")
_CONTEXT = re.compile(r"^[a-zA-Z0-9._-]{1,96}$")
_ENV_NAME = re.compile(r"^[A-Z_][A-Z0-9_]*$")
_PRIVATE_KEY = re.compile(
    r"(^|_)(prompt|planner|plan|cognition|thought|observation|world_text|memory|private_state|chain_of_thought|cot)($|_)",
    re.I,
)
_SECRET_KEY = re.compile(r"(^|_)(token|secret|password|api_key|private_key|bearer|email|device_code)($|_)", re.I)
_SECRET_ARG = re.compile(r"(^bearer\s+|eyJ[A-Za-z0-9_-]+\.|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})")
_SECRET_VALUE = re.compile(
    r"(?:^bearer\s+|(?:access|refresh|approval|receipt|device)[_-]?(?:token|code)[=:._-]|"
    r"\b(?:sk|pk|api|tok|secret)[_-][A-Za-z0-9_-]{12,}\b|eyJ[A-Za-z0-9_-]{8,}\.)",
    re.I,
)
_BROWSER = re.compile(r"(playwright|selenium|chromedriver|geckodriver|xdg-open|open-browser|webbrowser)", re.I)
_PRIVILEGED_ENV = re.compile(r"(ADMIN|SERVICE_ROLE|HUMAN_SESSION|OPERATOR_TOKEN)", re.I)
_ALLOWED_PARTICIPANT_KEYS = frozenset({"label", "argv", "decision_context", "env_from"})
_ALLOWED_EVIDENCE_KEYS = frozenset(
    {
        "schema_version",
        "claim_status",
        "controller_reference",
        "independent_control_receipt",
        "reconnect_tested",
        "onboarding_path",
        "client_version",
        "world_id",
        "credential_binding_digest",
        "controller_binding_digest",
        "contention_evidence_digest",
        "ordering_evidence_digest",
        "budget_settlement_evidence_digest",
        "acceptance_authority_digest",
        "receipts",
    }
)
_ALLOWED_RECEIPT_KEYS = frozenset({"case", "observed", "code"})
_RECEIPT_EXPECTATIONS = {
    "partial_enrollment": "BLOCKED",
    "duplicate_enrollment": "REJECTED",
    "expired_enrollment": "REJECTED",
    "wrong_world": "REJECTED",
    "malformed_action": "REJECTED",
    "unauthorized_action": "REJECTED",
    "duplicate_action": "REJECTED",
    "accepted_action": "COMPLETE",
    "reconnect": "COMPLETE",
}
_REQUIRED_NEGATIVE_CASES = frozenset(
    {
        "partial_enrollment",
        "duplicate_enrollment",
        "expired_enrollment",
        "wrong_world",
        "malformed_action",
        "unauthorized_action",
        "duplicate_action",
    }
)
_CRITICAL_PREFLIGHT_REASONS = frozenset(
    {
        "worker_tests_not_green",
        "worker_typecheck_not_green",
        "pins_missing_or_disagree",
        "world_blocked",
        "repository_dirty",
        "canonical_head_incomplete",
    }
)


class CohortError(ValueError):
    """Fail-closed configuration or lifecycle error."""


def _canonical(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def _digest(value: Any) -> str:
    return "sha256:" + hashlib.sha256(_canonical(value).encode("utf-8")).hexdigest()


def _file_digest(path: Path) -> str:
    try:
        return "sha256:" + hashlib.sha256(path.read_bytes()).hexdigest()
    except OSError as exc:
        raise CohortError(f"client executable cannot be integrity-bound: {path}") from exc


def _atomic_json(path: Path, value: Any, *, mode: int = 0o600) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.{os.getpid()}.{threading.get_ident()}.tmp")
    data = json.dumps(value, indent=2, sort_keys=True, ensure_ascii=True) + "\n"
    tmp.write_text(data, encoding="utf-8")
    os.chmod(tmp, mode)
    os.replace(tmp, path)


def _load_json(path: Path) -> dict[str, Any]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise CohortError(f"missing required file: {path}") from exc
    except (OSError, json.JSONDecodeError) as exc:
        raise CohortError(f"invalid JSON file: {path}") from exc
    if not isinstance(value, dict):
        raise CohortError(f"JSON object required: {path}")
    return value


def _assert_contained(path: Path, root: Path) -> None:
    try:
        path.resolve(strict=False).relative_to(root.resolve(strict=True))
    except (OSError, ValueError) as exc:
        raise CohortError(f"private path escapes prepared run directory: {path}") from exc


def _assert_owned(mode_path: Path, *, directory: bool, mode: int) -> os.stat_result:
    try:
        info = mode_path.lstat()
    except OSError as exc:
        raise CohortError(f"private path cannot be inspected: {mode_path}") from exc
    expected_kind = stat.S_ISDIR if directory else stat.S_ISREG
    if not expected_kind(info.st_mode) or stat.S_ISLNK(info.st_mode):
        raise CohortError(f"private path must be a {'directory' if directory else 'regular file'}: {mode_path}")
    if stat.S_IMODE(info.st_mode) != mode:
        raise CohortError(f"private path must have mode {mode:04o}: {mode_path}")
    if hasattr(os, "getuid") and info.st_uid != os.getuid():
        raise CohortError(f"private path must be owned by the current user: {mode_path}")
    return info


def _private_dir(path: Path) -> None:
    try:
        path.mkdir(parents=True, exist_ok=True, mode=0o700)
        os.chmod(path, 0o700, follow_symlinks=False)
    except OSError as exc:
        raise CohortError(f"private directory permissions cannot be enforced: {path}") from exc
    _assert_owned(path, directory=True, mode=0o700)


def _looks_secret_value(value: str) -> bool:
    if not value or value.startswith("sha256:"):
        return False
    if _SECRET_ARG.search(value) or _SECRET_VALUE.search(value):
        return True
    if _CONTEXT.fullmatch(value):
        return False
    compact = re.sub(r"[^A-Za-z0-9_-]", "", value)
    return (
        len(compact) >= 32
        and any(c.islower() for c in compact)
        and any(c.isupper() for c in compact)
        and any(c.isdigit() for c in compact)
    )


def _public_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _public_value(child) for key, child in value.items()}
    if isinstance(value, list):
        return [_public_value(child) for child in value]
    if isinstance(value, str) and _looks_secret_value(value):
        return "[REDACTED]"
    return value


def _reject_private_or_secret(value: Any, path: tuple[str, ...] = ()) -> None:
    if isinstance(value, dict):
        env_mapping = path and path[-1] == "env_from"
        for key, child in value.items():
            key_s = str(key)
            if not env_mapping and (_PRIVATE_KEY.search(key_s) or _SECRET_KEY.search(key_s)):
                raise CohortError(f"secret or private cognition field is forbidden: {'.'.join(path + (key_s,))}")
            _reject_private_or_secret(child, path + (key_s,))
        return
    if isinstance(value, list):
        for index, child in enumerate(value):
            _reject_private_or_secret(child, path + (str(index),))
        return
    if isinstance(value, str) and (not path or "env_from" not in path):
        if _SECRET_ARG.search(value):
            raise CohortError(f"literal credential or email is forbidden: {'.'.join(path)}")


def _render_argv(argv: list[str], values: dict[str, str]) -> list[str]:
    rendered: list[str] = []
    for item in argv:
        try:
            rendered.append(item.format_map(values))
        except KeyError as exc:
            raise CohortError(f"unknown argv placeholder: {exc.args[0]}") from exc
    return rendered


def _validate_public_cli(argv: list[str], *, mode: str, server: str, world_id: str, config_dir: str) -> None:
    if not argv or Path(argv[0]).name != "noema":
        raise CohortError("participant argv must invoke the official public `noema` executable")
    executable = Path(argv[0])
    if argv[0] != "noema" and not executable.is_absolute():
        raise CohortError("participant argv must use `noema` from PATH or an absolute executable path")
    if argv.count("play") != 1:
        raise CohortError("participant argv must use the bounded public `noema play` command")
    if "connect" in argv:
        raise CohortError("cohort processes may not automate enrollment; a human must run `noema connect`")
    joined = " ".join(argv)
    if _BROWSER.search(joined):
        raise CohortError("browser automation is forbidden")
    for arg in argv:
        if _SECRET_ARG.search(arg) or arg in {"--email", "--token", "--access-token", "--device-code"}:
            raise CohortError("literal credentials, email, and enrollment material are forbidden in argv")
    option_values: dict[str, str | None] = {}
    value_options = {"--server", "--world-id", "--config-dir"}
    flag_options = {"--isolated"}
    index = 1
    while index < len(argv):
        arg = argv[index]
        option, equals, inline = arg.partition("=")
        if option in value_options:
            if option in option_values:
                raise CohortError(f"duplicate participant option is forbidden: {option}")
            if equals:
                if not inline:
                    raise CohortError(f"participant option requires a value: {option}")
                option_values[option] = inline
            else:
                if index + 1 >= len(argv) or argv[index + 1].startswith("--"):
                    raise CohortError(f"participant option requires a value: {option}")
                option_values[option] = argv[index + 1]
                index += 1
        elif option in flag_options:
            if equals or option in option_values:
                raise CohortError(f"duplicate or valued participant flag is forbidden: {option}")
            option_values[option] = None
        index += 1
    if mode == "isolated" and "--isolated" not in option_values:
        raise CohortError("isolated argv must pass the official client's --isolated guard")
    if mode == "live" and "--isolated" in option_values:
        raise CohortError("live argv must not contain --isolated")
    if mode == "live" and "--world-id" in option_values:
        raise CohortError("live argv must use the hosted world binding and omit --world-id")
    if str(option_values.get("--server") or "").rstrip("/") != server:
        raise CohortError("participant argv server binding must exactly match the prepared server")
    if str(option_values.get("--config-dir") or "") != config_dir:
        raise CohortError("participant argv config-dir must exactly match its private credential directory")
    if mode == "isolated" and option_values.get("--world-id") != world_id:
        raise CohortError("isolated argv world-id must exactly match the prepared world")


def _validate_config(source: dict[str, Any], *, mode: str, run_dir: Path) -> dict[str, Any]:
    if mode not in {"isolated", "live"}:
        raise CohortError("mode must be isolated or live")
    if source.get("schema_version") not in {None, CONFIG_SCHEMA}:
        raise CohortError(f"unsupported config schema: {source.get('schema_version')}")
    _reject_private_or_secret(source)
    server = str(source.get("server") or "").rstrip("/")
    world_id = str(source.get("world_id") or "")
    repository = Path(source.get("repository") or ".").expanduser().resolve()
    participants = source.get("participants")
    if not server or not world_id:
        raise CohortError("server and world_id are required")
    if not isinstance(participants, list) or len(participants) != 3:
        raise CohortError("exactly three participant process definitions are required")
    if mode == "isolated" and not world_id.startswith("test.hosted-canonical."):
        raise CohortError("isolated mode requires world_id test.hosted-canonical.*")
    if mode == "live" and (server != "https://noema.guru" or world_id.startswith("test.hosted-canonical.")):
        raise CohortError("live mode is pinned to https://noema.guru and a non-isolated world")
    if mode == "isolated" and server == "https://noema.guru":
        raise CohortError("isolated mode categorically cannot target https://noema.guru")

    max_log_bytes = source.get("max_log_bytes", 65536)
    timeout = source.get("process_timeout_seconds", 900)
    if not isinstance(max_log_bytes, int) or not 1024 <= max_log_bytes <= 1_048_576:
        raise CohortError("max_log_bytes must be between 1024 and 1048576")
    if not isinstance(timeout, (int, float)) or not 1 <= float(timeout) <= 86400:
        raise CohortError("process_timeout_seconds must be between 1 and 86400")
    preflight = source.get("preflight")
    if not isinstance(preflight, dict):
        raise CohortError("preflight must contain the non-secret Gate B baseline input")

    run_material = {
        "mode": mode,
        "server": server,
        "world_id": world_id,
        "participants": participants,
        "preflight": preflight,
    }
    run_id = "run.lca2.cohort." + hashlib.sha256(_canonical(run_material).encode()).hexdigest()[:16]
    normalized: list[dict[str, Any]] = []
    labels: set[str] = set()
    contexts: set[str] = set()
    argv_digests: set[str] = set()
    env_sources: set[str] = set()

    for index, raw in enumerate(participants, start=1):
        if not isinstance(raw, dict):
            raise CohortError("each participant must be an object")
        unknown = set(raw) - _ALLOWED_PARTICIPANT_KEYS
        if unknown:
            raise CohortError(f"unsupported participant fields: {', '.join(sorted(unknown))}")
        label = str(raw.get("label") or "")
        decision_context = str(raw.get("decision_context") or "")
        argv = raw.get("argv")
        env_from = raw.get("env_from") or {}
        if not _LABEL.fullmatch(label) or label in labels:
            raise CohortError("participant labels must be unique lowercase opaque labels")
        if not _CONTEXT.fullmatch(decision_context) or decision_context in contexts:
            raise CohortError("decision_context values must be unique opaque identifiers")
        if not isinstance(argv, list) or not argv or any(not isinstance(item, str) or not item for item in argv):
            raise CohortError("participant argv must be a non-empty string array")
        if not isinstance(env_from, dict):
            raise CohortError("env_from must map child variable names to source variable names")
        for target, source_name in env_from.items():
            if not isinstance(target, str) or not isinstance(source_name, str):
                raise CohortError("env_from names must be strings")
            if not _ENV_NAME.fullmatch(target) or not _ENV_NAME.fullmatch(source_name):
                raise CohortError("env_from names must be uppercase environment variable names")
            if _PRIVATE_KEY.search(target) or _PRIVATE_KEY.search(source_name):
                raise CohortError("planner, prompt, cognition, observation, and memory environment inputs are forbidden")
            if _PRIVILEGED_ENV.search(target) or _PRIVILEGED_ENV.search(source_name):
                raise CohortError("admin, service-role, human-session, and operator credentials are forbidden")
            if source_name in env_sources:
                raise CohortError("participant env_from source variables must be independent")
            env_sources.add(source_name)

        participant_root = run_dir / "participants" / label
        paths = {
            "work_dir": participant_root / "work",
            "config_dir": participant_root / "config",
            "credential_dir": participant_root / "credentials",
            "model_context_dir": participant_root / "model-context",
            "action_history_dir": participant_root / "action-history",
            "idempotency_dir": participant_root / "idempotency",
            "log_dir": participant_root / "logs",
            "evidence_dir": participant_root / "evidence",
        }
        namespace = f"cohort.{run_id.rsplit('.', 1)[-1]}.{index}.{label}"
        values = {
            "server": server,
            "world_id": world_id,
            "run_id": run_id,
            "label": label,
            "mode": mode,
            "idempotency_namespace": namespace,
            **{key: str(path) for key, path in paths.items()},
        }
        rendered = _render_argv(list(argv), values)
        _validate_public_cli(
            rendered,
            mode=mode,
            server=server,
            world_id=world_id,
            config_dir=str(paths["credential_dir"]),
        )
        executable_path = Path(rendered[0]).resolve() if Path(rendered[0]).is_absolute() else None
        if executable_path is None:
            found = shutil.which(rendered[0])
            if not found:
                raise CohortError(f"client executable is unavailable during preparation: {rendered[0]}")
            executable_path = Path(found).resolve()
        if not executable_path.is_file() or not os.access(executable_path, os.X_OK):
            raise CohortError(f"client executable is unavailable during preparation: {rendered[0]}")
        argv_digest = _digest(rendered)
        if argv_digest in argv_digests:
            raise CohortError("each process must have independent rendered argv")
        argv_digests.add(argv_digest)
        labels.add(label)
        contexts.add(decision_context)
        normalized.append(
            {
                "slot": index,
                "label": label,
                "decision_context": decision_context,
                "world_id": world_id,
                "argv": rendered,
                "argv_digest": argv_digest,
                "client_executable_path": str(executable_path),
                "client_executable_digest": _file_digest(executable_path),
                "env_from": dict(sorted(env_from.items())),
                "idempotency_namespace": namespace,
                "paths": {key: str(path) for key, path in paths.items()},
            }
        )

    return {
        "schema_version": MANIFEST_SCHEMA,
        "source_digest": _digest(source),
        "run_id": run_id,
        "mode": mode,
        "server": server,
        "world_id": world_id,
        "repository": str(repository),
        "max_log_bytes": max_log_bytes,
        "process_timeout_seconds": float(timeout),
        "participants": normalized,
        "preflight": copy.deepcopy(preflight),
        "safety": {
            "exact_process_count": 3,
            "browser_automation": "FORBIDDEN",
            "shared_planner": "FORBIDDEN",
            "private_observations": "FORBIDDEN",
            "client_boundary": "official-noema-public-cli",
            "isolated_completion_claim": "FORBIDDEN",
        },
    }


def prepare(config_path: Path, run_dir: Path, *, mode: str) -> dict[str, Any]:
    config_path = config_path.expanduser().resolve(strict=True)
    source = _load_json(config_path)
    run_dir = run_dir.expanduser().resolve()
    _private_dir(run_dir)
    manifest = _validate_config(source, mode=mode, run_dir=run_dir)
    manifest["source_config_path"] = str(config_path)
    manifest_path = run_dir / "manifest.json"
    if manifest_path.exists():
        existing = _load_manifest(run_dir)
        if existing.get("source_digest") != manifest["source_digest"] or existing.get("mode") != mode:
            raise CohortError("run_dir already contains a different prepared cohort")
        return {
            "run_id": existing.get("run_id"),
            "mode": mode,
            "status": _load_state(run_dir)["status"],
            "verdict": "PREPARATION",
        }

    for participant in manifest["participants"]:
        for path in participant["paths"].values():
            _private_dir(Path(path))
        _private_dir(Path(participant["paths"]["work_dir"]) / "home")
        _private_dir(Path(participant["paths"]["work_dir"]) / "tmp")
        context_record = {
            "label": participant["label"],
            "decision_context": participant["decision_context"],
            "idempotency_namespace": participant["idempotency_namespace"],
            "shared_planner": False,
            "private_observations_shared": False,
        }
        _atomic_json(Path(participant["paths"]["model_context_dir"]) / "decision-context.json", context_record)

    status = "AWAITING_HUMAN_APPROVAL" if mode == "live" else "PREPARED"
    state = {
        "schema_version": STATE_SCHEMA,
        "run_id": manifest["run_id"],
        "mode": mode,
        "manifest_digest": _digest(manifest),
        "status": status,
        "processes": [
            {"slot": p["slot"], "label": p["label"], "status": "PENDING", "pid": None, "start_ticks": None}
            for p in manifest["participants"]
        ],
        "reason": None,
    }
    _atomic_json(manifest_path, manifest)
    _atomic_json(run_dir / "state.json", state)
    if mode == "live":
        approvals_dir = run_dir / "approvals"
        _private_dir(approvals_dir)
        for participant in manifest["participants"]:
            _atomic_json(
                approvals_dir / f"{participant['label']}.request.json",
                {
                    "schema_version": HUMAN_APPROVAL_SCHEMA,
                    "run_id": manifest["run_id"],
                    "label": participant["label"],
                    "required_fields": [
                        "approved",
                        "enrollment_status",
                        "approval_receipt",
                        "independent_control_receipt",
                        "credential_binding_digest",
                        "controller_binding_digest",
                    ],
                    "write_completed_receipt_to": str(approvals_dir / f"{participant['label']}.json"),
                },
            )
        _atomic_json(
            run_dir / "human-approval-required.json",
            {
                "run_id": manifest["run_id"],
                "status": "AWAITING_HUMAN_APPROVAL",
                "required_ack": LIVE_ACK,
                "browser_automation": "FORBIDDEN",
                "instructions": [
                    {
                        "label": p["label"],
                        "command": [
                            "noema",
                            "--server",
                            manifest["server"],
                            "--config-dir",
                            p["paths"]["credential_dir"],
                            "connect",
                        ],
                    }
                    for p in manifest["participants"]
                ],
                "approval_receipts": [str(approvals_dir / f"{p['label']}.json") for p in manifest["participants"]],
            },
        )
    return {"run_id": manifest["run_id"], "mode": mode, "status": status, "verdict": "PREPARATION"}


def _load_manifest(run_dir: Path) -> dict[str, Any]:
    manifest = _load_json(run_dir / "manifest.json")
    if manifest.get("schema_version") != MANIFEST_SCHEMA:
        raise CohortError("unsupported or missing cohort manifest")
    if len(manifest.get("participants") or []) != 3:
        raise CohortError("manifest must retain exactly three participants")
    source_path = Path(str(manifest.get("source_config_path") or ""))
    if not source_path.is_absolute():
        raise CohortError("prepared manifest lacks an authoritative source config")
    expected = _validate_config(_load_json(source_path), mode=str(manifest.get("mode") or ""), run_dir=run_dir)
    expected["source_config_path"] = str(source_path)
    state = _load_json(run_dir / "state.json")
    if manifest != expected or state.get("manifest_digest") != _digest(expected):
        raise CohortError("prepared manifest integrity check failed")
    return manifest


def _load_state(run_dir: Path) -> dict[str, Any]:
    state = _load_json(run_dir / "state.json")
    if state.get("schema_version") != STATE_SCHEMA or state.get("status") not in RUN_STATUSES:
        raise CohortError("invalid cohort state")
    return state


def _pid_start_ticks(pid: int) -> int | None:
    try:
        return int(Path(f"/proc/{pid}/stat").read_text(encoding="utf-8").split()[21])
    except (OSError, ValueError, IndexError):
        return None


def _pid_alive(pid: int | None, start_ticks: int | None) -> bool:
    if not isinstance(pid, int) or pid <= 0:
        return False
    current = _pid_start_ticks(pid)
    if start_ticks is not None and current != start_ticks:
        return False
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def _process_environment(participant: dict[str, Any], *, mode: str) -> dict[str, str]:
    keep = ("PATH", "PYTHONPATH", "VIRTUAL_ENV", "LANG", "LC_ALL", "SSL_CERT_FILE", "REQUESTS_CA_BUNDLE")
    env = {key: os.environ[key] for key in keep if key in os.environ}
    missing: list[str] = []
    for target, source_name in participant.get("env_from", {}).items():
        value = os.environ.get(source_name)
        if value is None:
            missing.append(source_name)
        else:
            env[target] = value
    if missing:
        raise CohortError(f"missing participant environment sources: {', '.join(sorted(missing))}")
    paths = participant["paths"]
    env.update(
        {
            "HOME": str(Path(paths["work_dir"]) / "home"),
            "TMPDIR": str(Path(paths["work_dir"]) / "tmp"),
            "XDG_CONFIG_HOME": paths["config_dir"],
            "NOEMA_CONFIG_DIR": paths["credential_dir"],
            "NOEMA_COHORT_MODE": mode,
            "NOEMA_COHORT_LABEL": participant["label"],
            "NOEMA_COHORT_WORLD_ID": participant.get("world_id", ""),
            "NOEMA_MODEL_CONTEXT_DIR": paths["model_context_dir"],
            "NOEMA_ACTION_HISTORY_DIR": paths["action_history_dir"],
            "NOEMA_IDEMPOTENCY_DIR": paths["idempotency_dir"],
            "NOEMA_IDEMPOTENCY_NAMESPACE": participant["idempotency_namespace"],
            "NOEMA_COHORT_EVIDENCE_FILE": str(Path(paths["evidence_dir"]) / "participant.json"),
        }
    )
    return env


def _resolve_executable(argv: list[str], env: dict[str, str]) -> str:
    executable = argv[0]
    if os.sep in executable:
        path = Path(executable)
        if not path.is_file() or not os.access(path, os.X_OK):
            raise CohortError(f"client executable is unavailable: {executable}")
        return str(path)
    resolved = shutil.which(executable, path=env.get("PATH"))
    if not resolved:
        raise CohortError(f"client executable is unavailable: {executable}")
    return resolved


class _StreamDigest:
    def __init__(self, stream: BinaryIO) -> None:
        self.stream = stream
        self.digest = hashlib.sha256()
        self.byte_count = 0
        self.thread = threading.Thread(target=self._run, daemon=True)

    def _run(self) -> None:
        while True:
            chunk = self.stream.read(65536)
            if not chunk:
                return
            self.byte_count += len(chunk)
            self.digest.update(chunk)

    def start(self) -> None:
        self.thread.start()

    def finish(self) -> dict[str, Any]:
        self.thread.join(timeout=5)
        return {"bytes": self.byte_count, "sha256": "sha256:" + self.digest.hexdigest()}


def _terminate_processes(processes: list[subprocess.Popen[bytes]], *, grace_seconds: float = 2.0) -> None:
    for proc in processes:
        if proc.poll() is None:
            try:
                os.killpg(proc.pid, signal.SIGTERM)
            except OSError:
                pass
    deadline = time.monotonic() + max(0.0, grace_seconds)
    while time.monotonic() < deadline and any(proc.poll() is None for proc in processes):
        time.sleep(0.05)
    for proc in processes:
        if proc.poll() is None:
            try:
                os.killpg(proc.pid, signal.SIGKILL)
            except OSError:
                pass


def _credential_marker(path: Path) -> str | None:
    credential = path / "credential.json"
    if not credential.exists() and not credential.is_symlink():
        return None
    try:
        _assert_owned(credential, directory=False, mode=0o600)
        return "sha256:" + hashlib.sha256(credential.read_bytes()).hexdigest()
    except OSError as exc:
        raise CohortError(f"credential file cannot be safely read: {credential}") from exc


def _jwt_identity(token: str) -> str | None:
    parts = token.split(".")
    if len(parts) != 3:
        return None
    try:
        payload = json.loads(base64.urlsafe_b64decode(parts[1] + "=" * (-len(parts[1]) % 4)))
    except (ValueError, json.JSONDecodeError):
        return None
    if not isinstance(payload, dict):
        return None
    for key in ("controller_id", "player_id", "sub"):
        value = payload.get(key)
        if isinstance(value, str) and value:
            return value
    return None


def _credential_controller_binding(path: Path) -> str:
    credential = path / "credential.json"
    _assert_owned(credential, directory=False, mode=0o600)
    value = _load_json(credential)
    identities: set[str] = set()
    for key in ("controller_reference", "controller_id", "player_id", "subject", "sub"):
        identity = value.get(key)
        if isinstance(identity, str) and identity:
            identities.add(identity)
    for key in ("access_token", "token"):
        token = value.get(key)
        if isinstance(token, str):
            identity = _jwt_identity(token)
            if identity:
                identities.add(identity)
    if len(identities) != 1:
        raise CohortError(f"credential must admit exactly one controller identity: {credential}")
    return _digest(next(iter(identities)))


def _recheck_private_boundaries(run_dir: Path, manifest: dict[str, Any], *, live: bool) -> None:
    _assert_owned(run_dir, directory=True, mode=0o700)
    for participant in manifest["participants"]:
        for raw_path in participant["paths"].values():
            path = Path(raw_path)
            _assert_contained(path, run_dir)
            _assert_owned(path, directory=True, mode=0o700)
        for suffix in ("home", "tmp"):
            path = Path(participant["paths"]["work_dir"]) / suffix
            _assert_contained(path, run_dir)
            _assert_owned(path, directory=True, mode=0o700)
        if live:
            credential = Path(participant["paths"]["credential_dir"]) / "credential.json"
            _assert_contained(credential, run_dir)
            _assert_owned(credential, directory=False, mode=0o600)


def _baseline_preflight(manifest: dict[str, Any]) -> tuple[dict[str, Any], list[str]]:
    result = build_preflight(copy.deepcopy(manifest["preflight"]), repository=manifest["repository"])
    reasons = sorted(set(result.get("verdict_reasons") or []) & _CRITICAL_PREFLIGHT_REASONS)
    return result, reasons


def _load_human_approvals(run_dir: Path, manifest: dict[str, Any]) -> dict[str, Any]:
    rows: list[dict[str, Any]] = []
    missing: list[str] = []
    blocked: list[str] = []
    rejected: list[str] = []
    approval_receipts: set[str] = set()
    independence_receipts: set[str] = set()
    for participant in manifest["participants"]:
        label = participant["label"]
        path = run_dir / "approvals" / f"{label}.json"
        if not path.is_file():
            missing.append(label)
            continue
        try:
            value = _load_json(path)
            _reject_private_or_secret(value)
        except CohortError:
            rejected.append(f"{label}:approval_receipt_invalid")
            continue
        allowed = {
            "schema_version",
            "run_id",
            "label",
            "approved",
            "enrollment_status",
            "approval_receipt",
            "independent_control_receipt",
            "credential_binding_digest",
            "controller_binding_digest",
        }
        if set(value) - allowed or value.get("schema_version") != HUMAN_APPROVAL_SCHEMA:
            rejected.append(f"{label}:approval_receipt_invalid")
            continue
        if value.get("run_id") != manifest["run_id"] or value.get("label") != label:
            rejected.append(f"{label}:approval_binding_mismatch")
            continue
        status = str(value.get("enrollment_status") or "").upper()
        if status in {"DUPLICATE", "EXPIRED"}:
            rejected.append(f"{label}:{status.lower()}_enrollment")
            continue
        if value.get("approved") is not True or status == "PARTIAL":
            blocked.append(f"{label}:partial_enrollment")
            continue
        approval_receipt = str(value.get("approval_receipt") or "")
        independence_receipt = str(value.get("independent_control_receipt") or "")
        credential_binding = str(value.get("credential_binding_digest") or "")
        controller_binding = str(value.get("controller_binding_digest") or "")
        if status != "COMPLETE" or not approval_receipt or not independence_receipt or not credential_binding or not controller_binding:
            blocked.append(f"{label}:approval_or_independence_receipt_missing")
            continue
        if _looks_secret_value(approval_receipt) or _looks_secret_value(independence_receipt):
            rejected.append(f"{label}:secret_like_approval_receipt")
            continue
        approval_receipts.add(approval_receipt)
        independence_receipts.add(independence_receipt)
        rows.append(
            {
                "label": label,
                "status": "COMPLETE",
                "approval_receipt_digest": _digest(approval_receipt),
                "independent_control_receipt_digest": _digest(independence_receipt),
                "credential_binding_digest": credential_binding,
                "controller_binding_digest": controller_binding,
            }
        )
    if len(approval_receipts) != len(rows) or len(independence_receipts) != len(rows):
        rejected.append("duplicate_human_or_independence_receipt")
    if rejected:
        verdict = "REJECTED"
    elif missing or blocked or len(rows) != 3:
        verdict = "BLOCKED"
    else:
        verdict = "OPEN"
    return {
        "verdict": verdict,
        "missing_labels": sorted(missing),
        "reasons": sorted(set(blocked + rejected)),
        "approvals": sorted(rows, key=lambda row: row["label"]),
    }


def classify_receipt(receipt: dict[str, Any]) -> dict[str, Any]:
    """Classify one non-secret orchestration receipt without interpreting gameplay."""
    if not isinstance(receipt, dict) or set(receipt) - _ALLOWED_RECEIPT_KEYS:
        return {"case": "unknown", "status": "REJECTED", "matched": False, "code": "MALFORMED_RECEIPT"}
    _reject_private_or_secret(receipt)
    case = str(receipt.get("case") or "")
    observed = str(receipt.get("observed") or "").upper()
    expected = _RECEIPT_EXPECTATIONS.get(case)
    if expected is None or observed not in VERDICTS:
        return {"case": case or "unknown", "status": "REJECTED", "matched": False, "code": "UNKNOWN_RECEIPT"}
    return {
        "case": case,
        "status": expected,
        "matched": observed == expected,
        "code": _public_value(str(receipt.get("code") or "")) or None,
    }


def run_cohort(
    run_dir: Path,
    *,
    mode: str,
    ack: str | None = None,
) -> tuple[int, dict[str, Any]]:
    run_dir = run_dir.expanduser().resolve()
    manifest = _load_manifest(run_dir)
    state = _load_state(run_dir)
    if manifest["mode"] != mode:
        raise CohortError(f"prepared mode is {manifest['mode']}, not {mode}")
    if state["status"] == "RUNNING":
        raise CohortError("cohort is already running")
    if state["status"] in {"SUCCEEDED", "SIMULATED"}:
        verdict = "NOT_COMPUTABLE" if mode == "isolated" else "OPEN"
        return 0, {"run_id": manifest["run_id"], "status": state["status"], "verdict": verdict}

    if mode == "live":
        _recheck_private_boundaries(run_dir, manifest, live=False)
        approvals = _load_human_approvals(run_dir, manifest)
        markers = {
            p["label"]: _credential_marker(Path(p["paths"]["credential_dir"])) for p in manifest["participants"]
        }
        missing_credentials = sorted(label for label, marker in markers.items() if marker is None)
        shared_credentials = len({marker for marker in markers.values() if marker is not None}) != len(
            [marker for marker in markers.values() if marker is not None]
        )
        if ack != LIVE_ACK or approvals["verdict"] != "OPEN" or missing_credentials or shared_credentials:
            state["status"] = "AWAITING_HUMAN_APPROVAL"
            state["reason"] = "live_ack_approvals_receipts_or_private_credentials_missing"
            _atomic_json(run_dir / "state.json", state)
            rejected = approvals["verdict"] == "REJECTED" or shared_credentials
            return (2 if rejected else 3), {
                "run_id": manifest["run_id"],
                "status": state["status"],
                "verdict": "REJECTED" if rejected else "BLOCKED",
                "required_ack": LIVE_ACK,
                "approval_verdict": approvals["verdict"],
                "approval_reasons": approvals["reasons"],
                "missing_approval_labels": approvals["missing_labels"],
                "missing_credential_labels": missing_credentials,
                "shared_credentials": shared_credentials,
            }
        approval_by_label = {row["label"]: row for row in approvals["approvals"]}
        controller_bindings = {
            participant["label"]: _credential_controller_binding(Path(participant["paths"]["credential_dir"]))
            for participant in manifest["participants"]
        }
        binding_mismatches = sorted(
            participant["label"]
            for participant in manifest["participants"]
            if approval_by_label[participant["label"]]["credential_binding_digest"]
            != markers[participant["label"]]
            or approval_by_label[participant["label"]]["controller_binding_digest"]
            != controller_bindings[participant["label"]]
        )
        duplicate_controller_bindings = len(set(controller_bindings.values())) != len(controller_bindings)
        if binding_mismatches or duplicate_controller_bindings:
            state["status"] = "AWAITING_HUMAN_APPROVAL"
            state["reason"] = "approval_controller_or_credential_binding_mismatch"
            _atomic_json(run_dir / "state.json", state)
            return 2, {
                "run_id": manifest["run_id"],
                "status": state["status"],
                "verdict": "REJECTED",
                "approval_reasons": [f"{label}:credential_or_controller_binding_mismatch" for label in binding_mismatches]
                + (["duplicate_controller_binding"] if duplicate_controller_bindings else []),
            }
        _atomic_json(
            run_dir / "human-approval.json",
            {
                "run_id": manifest["run_id"],
                "verdict": "OPEN",
                "ack_digest": _digest(ack),
                "approvals": approvals["approvals"],
                "credential_boundaries": "THREE_DISTINCT_PRIVATE_FILES",
            },
        )

    preflight, preflight_reasons = _baseline_preflight(manifest)
    if preflight_reasons:
        state["reason"] = "critical_preflight_blocked"
        _atomic_json(run_dir / "state.json", state)
        return 2, {
            "run_id": manifest["run_id"],
            "status": state["status"],
            "verdict": "REJECTED",
            "reasons": preflight_reasons,
            "preflight_verdict": preflight["verdict"],
        }

    prepared: list[tuple[dict[str, Any], dict[str, str], list[str]]] = []
    _recheck_private_boundaries(run_dir, manifest, live=mode == "live")
    for participant in manifest["participants"]:
        env = _process_environment(participant, mode=mode)
        argv = list(participant["argv"])
        resolved = Path(_resolve_executable(argv, env)).resolve()
        if (
            str(resolved) != participant.get("client_executable_path")
            or _file_digest(resolved) != participant.get("client_executable_digest")
        ):
            raise CohortError(f"prepared client executable integrity check failed: {participant['label']}")
        argv[0] = str(resolved)
        prepared.append((participant, env, argv))

    cancel_path = run_dir / "cancel.requested"
    try:
        cancel_path.unlink()
    except FileNotFoundError:
        pass
    state["status"] = "RUNNING"
    state["reason"] = None
    state["processes"] = [
        {"slot": p["slot"], "label": p["label"], "status": "PENDING", "pid": None, "start_ticks": None}
        for p in manifest["participants"]
    ]
    _atomic_json(run_dir / "state.json", state)

    processes: list[subprocess.Popen[bytes]] = []
    captures: list[tuple[_StreamDigest, _StreamDigest]] = []
    try:
        for participant, env, argv in prepared:
            proc = subprocess.Popen(
                argv,
                cwd=participant["paths"]["work_dir"],
                env=env,
                stdin=subprocess.DEVNULL,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                start_new_session=True,
            )
            assert proc.stdout is not None and proc.stderr is not None
            out = _StreamDigest(proc.stdout)
            err = _StreamDigest(proc.stderr)
            out.start()
            err.start()
            processes.append(proc)
            captures.append((out, err))
        state["processes"] = [
            {
                "slot": participant["slot"],
                "label": participant["label"],
                "status": "RUNNING",
                "pid": proc.pid,
                "start_ticks": _pid_start_ticks(proc.pid),
            }
            for (participant, _, _), proc in zip(prepared, processes, strict=True)
        ]
        _atomic_json(run_dir / "state.json", state)
    except Exception:
        _terminate_processes(processes)
        state["status"] = "FAILED"
        state["reason"] = "process_spawn_failed"
        _atomic_json(run_dir / "state.json", state)
        raise

    cancelled = False
    timed_out = False
    started = time.monotonic()
    try:
        while any(proc.poll() is None for proc in processes):
            if cancel_path.exists():
                cancelled = True
                _terminate_processes(processes)
                break
            if time.monotonic() - started >= manifest["process_timeout_seconds"]:
                timed_out = True
                _terminate_processes(processes)
                break
            time.sleep(0.05)
    except KeyboardInterrupt:
        cancelled = True
        _terminate_processes(processes)
    finally:
        if cancel_path.exists():
            cancelled = True
        for proc in processes:
            try:
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                _terminate_processes([proc], grace_seconds=0)
                proc.wait(timeout=2)

    process_records: list[dict[str, Any]] = []
    for (participant, _, _), proc, (out_capture, err_capture) in zip(prepared, processes, captures, strict=True):
        stdout_meta = out_capture.finish()
        stderr_meta = err_capture.finish()
        if cancelled or timed_out or proc.returncode is not None and proc.returncode < 0:
            process_status = "CANCELLED" if cancelled or timed_out else "CRASHED"
        else:
            process_status = "SUCCEEDED" if proc.returncode == 0 else "CRASHED"
        if process_status not in PROCESS_STATUSES:
            raise CohortError("internal invalid process status")
        record = {
            "schema_version": PROCESS_LOG_SCHEMA,
            "run_id": manifest["run_id"],
            "slot": participant["slot"],
            "label": participant["label"],
            "argv_digest": participant["argv_digest"],
            "idempotency_namespace": participant["idempotency_namespace"],
            "status": process_status,
            "exit_code": proc.returncode,
            "stdout": stdout_meta,
            "stderr": stderr_meta,
            "content_retained": False,
        }
        encoded = _canonical(record).encode("utf-8")
        if len(encoded) > manifest["max_log_bytes"]:
            raise CohortError("process metadata log exceeded configured bound")
        _atomic_json(Path(participant["paths"]["log_dir"]) / "process.json", record)
        process_records.append(
            {
                "slot": participant["slot"],
                "label": participant["label"],
                "status": process_status,
                "pid": None,
                "start_ticks": None,
                "exit_code": proc.returncode,
                "stdout_sha256": stdout_meta["sha256"],
                "stderr_sha256": stderr_meta["sha256"],
            }
        )

    if cancelled:
        final_status, reason, verdict, code = "CANCELLED", "cancellation_requested", "REJECTED", 130
    elif timed_out:
        final_status, reason, verdict, code = "FAILED", "process_timeout", "REJECTED", 1
    elif any(p["status"] != "SUCCEEDED" for p in process_records):
        final_status, reason, verdict, code = "FAILED", "participant_process_crashed", "REJECTED", 1
    elif mode == "isolated":
        final_status, reason, verdict, code = (
            "SIMULATED",
            "isolated_runs_cannot_claim_external_completion",
            "NOT_COMPUTABLE",
            0,
        )
    else:
        final_status, reason, verdict, code = "SUCCEEDED", None, "OPEN", 0
    state.update({"status": final_status, "reason": reason, "processes": process_records})
    _atomic_json(run_dir / "state.json", state)
    return code, {
        "run_id": manifest["run_id"],
        "mode": mode,
        "status": final_status,
        "reason": reason,
        "verdict": verdict,
    }


def cohort_status(run_dir: Path) -> dict[str, Any]:
    run_dir = run_dir.expanduser().resolve()
    manifest = _load_manifest(run_dir)
    state = _load_state(run_dir)
    processes = []
    for record in state.get("processes") or []:
        processes.append(
            {
                "slot": record.get("slot"),
                "label": record.get("label"),
                "status": record.get("status"),
                "alive": _pid_alive(record.get("pid"), record.get("start_ticks")),
                "exit_code": record.get("exit_code"),
            }
        )
    if state["status"] == "RUNNING" and processes and not any(process["alive"] for process in processes):
        state["status"] = "FAILED"
        state["reason"] = "orphaned_or_crashed_process_group"
        _atomic_json(run_dir / "state.json", state)
    verdict = {
        "PREPARED": "PREPARATION",
        "AWAITING_HUMAN_APPROVAL": "BLOCKED",
        "RUNNING": "OPEN",
        "SUCCEEDED": "OPEN",
        "SIMULATED": "NOT_COMPUTABLE",
        "FAILED": "REJECTED",
        "CANCELLED": "REJECTED",
    }[state["status"]]
    return {
        "run_id": manifest["run_id"],
        "mode": manifest["mode"],
        "status": state["status"],
        "reason": state.get("reason"),
        "verdict": verdict,
        "processes": processes,
    }


def stop_cohort(run_dir: Path, *, grace_seconds: float = 2.0) -> dict[str, Any]:
    run_dir = run_dir.expanduser().resolve()
    manifest = _load_manifest(run_dir)
    state = _load_state(run_dir)
    (run_dir / "cancel.requested").write_text("cancel\n", encoding="utf-8")
    killed: list[str] = []
    for record in state.get("processes") or []:
        pid = record.get("pid")
        if _pid_alive(pid, record.get("start_ticks")):
            try:
                os.killpg(pid, signal.SIGTERM)
                killed.append(str(record.get("label")))
            except OSError:
                pass
    if killed:
        time.sleep(min(max(grace_seconds, 0.0), 5.0))
        for record in state.get("processes") or []:
            pid = record.get("pid")
            if _pid_alive(pid, record.get("start_ticks")):
                try:
                    os.killpg(pid, signal.SIGKILL)
                except OSError:
                    pass
    if state["status"] == "RUNNING":
        state["status"] = "CANCELLED"
        state["reason"] = "cancellation_requested"
        state["processes"] = [
            {
                **record,
                "status": "CANCELLED" if record.get("status") in {"PENDING", "RUNNING"} else record.get("status"),
                "pid": None,
                "start_ticks": None,
            }
            for record in state.get("processes") or []
        ]
        _atomic_json(run_dir / "state.json", state)
    return {"run_id": manifest["run_id"], "cancellation_requested": True, "signalled_labels": sorted(killed)}


def _participant_evidence(participant: dict[str, Any]) -> tuple[dict[str, Any] | None, list[str]]:
    path = Path(participant["paths"]["evidence_dir"]) / "participant.json"
    if not path.is_file():
        return None, ["participant_evidence_missing"]
    try:
        evidence = _load_json(path)
        unknown = set(evidence) - _ALLOWED_EVIDENCE_KEYS
        if unknown:
            raise CohortError(f"unsupported participant evidence fields: {', '.join(sorted(unknown))}")
        _reject_private_or_secret(evidence)
    except CohortError:
        return None, ["participant_evidence_invalid"]
    reasons: list[str] = []
    if evidence.get("schema_version") != PARTICIPANT_EVIDENCE_SCHEMA:
        reasons.append("participant_evidence_schema_invalid")
    if evidence.get("claim_status") not in CLAIM_STATUSES:
        reasons.append("participant_claim_status_invalid")
    receipts = evidence.get("receipts") or []
    if not isinstance(receipts, list) or any(not isinstance(receipt, dict) for receipt in receipts):
        reasons.append("participant_receipts_invalid")
    return evidence, reasons


def build_verification(run_dir: Path) -> dict[str, Any]:
    run_dir = run_dir.expanduser().resolve()
    manifest = _load_manifest(run_dir)
    state = _load_state(run_dir)
    reasons: list[str] = []
    execution_by_label = {p.get("label"): p for p in state.get("processes") or []}
    participant_rows: list[dict[str, Any]] = []
    preflight_participants: list[dict[str, Any]] = []

    if state["status"] not in {"SUCCEEDED", "SIMULATED"}:
        reasons.append("execution_not_successful")
    if len(execution_by_label) != 3:
        reasons.append("exactly_three_process_results_required")

    controller_refs: set[str] = set()
    receipt_refs: set[str] = set()
    observed_cases: set[str] = set()
    rejected_evidence = False
    approval_rows = {}
    approval_path = run_dir / "human-approval.json"
    if manifest["mode"] == "live" and approval_path.is_file():
        approval_rows = {row.get("label"): row for row in _load_json(approval_path).get("approvals") or []}
    acceptance_authorities: set[str] = set()
    for participant in manifest["participants"]:
        process = execution_by_label.get(participant["label"]) or {}
        evidence, evidence_reasons = _participant_evidence(participant)
        reasons.extend(f"{participant['label']}:{reason}" for reason in evidence_reasons)
        if process.get("status") != "SUCCEEDED":
            reasons.append(f"{participant['label']}:process_not_succeeded")
        projected: dict[str, Any] = {}
        if evidence:
            projected = {
                key: evidence.get(key)
                for key in sorted(_ALLOWED_EVIDENCE_KEYS - {"receipts", "independent_control_receipt"})
                if key in evidence
            }
            if evidence.get("independent_control_receipt"):
                projected["independent_control_receipt_digest"] = _digest(evidence["independent_control_receipt"])
            classifications: list[dict[str, Any]] = []
            for receipt_value in evidence.get("receipts") or []:
                try:
                    classification = classify_receipt(receipt_value)
                except CohortError:
                    classification = {
                        "case": "unknown",
                        "status": "REJECTED",
                        "matched": False,
                        "code": "PRIVATE_OR_SECRET_RECEIPT",
                    }
                classifications.append(classification)
                if classification["matched"]:
                    observed_cases.add(classification["case"])
                else:
                    rejected_evidence = True
                    reasons.append(f"{participant['label']}:receipt_classification_mismatch")
            projected["receipt_classifications"] = sorted(
                classifications, key=lambda row: (row["case"], row["status"], str(row["code"]))
            )
            if manifest["mode"] == "live":
                if evidence.get("claim_status") != "OBSERVED":
                    reasons.append(f"{participant['label']}:live_evidence_not_observed")
                if evidence.get("reconnect_tested") is not True:
                    reasons.append(f"{participant['label']}:reconnect_evidence_incomplete")
                controller = str(evidence.get("controller_reference") or "")
                receipt = str(evidence.get("independent_control_receipt") or "")
                if not controller or not receipt:
                    reasons.append(f"{participant['label']}:independence_receipt_incomplete")
                if evidence.get("world_id") != manifest["world_id"]:
                    reasons.append(f"{participant['label']}:world_binding_mismatch")
                    rejected_evidence = True
                controller_refs.add(controller)
                receipt_refs.add(receipt)
                approval = approval_rows.get(participant["label"]) or {}
                if evidence.get("credential_binding_digest") != approval.get("credential_binding_digest"):
                    reasons.append(f"{participant['label']}:credential_approval_binding_mismatch")
                    rejected_evidence = True
                expected_controller_binding = _digest(controller) if controller else None
                if (
                    evidence.get("controller_binding_digest") != expected_controller_binding
                    or evidence.get("controller_binding_digest") != approval.get("controller_binding_digest")
                ):
                    reasons.append(f"{participant['label']}:controller_approval_binding_mismatch")
                    rejected_evidence = True
                for field in (
                    "contention_evidence_digest",
                    "ordering_evidence_digest",
                    "budget_settlement_evidence_digest",
                    "acceptance_authority_digest",
                ):
                    value = evidence.get(field)
                    if not isinstance(value, str) or not re.fullmatch(r"sha256:[0-9a-f]{64}", value):
                        reasons.append(f"{participant['label']}:{field}_missing_or_invalid")
                authority = evidence.get("acceptance_authority_digest")
                if isinstance(authority, str):
                    acceptance_authorities.add(authority)
            preflight_participants.append(
                {
                    "label": participant["label"],
                    "controller_reference": evidence.get("controller_reference"),
                    "independent_control_receipt": _digest(evidence.get("independent_control_receipt"))
                    if evidence.get("independent_control_receipt")
                    else None,
                    "reconnect_tested": evidence.get("reconnect_tested"),
                    "onboarding_path": evidence.get("onboarding_path"),
                    "client_version": evidence.get("client_version"),
                }
            )
        participant_rows.append(
            {
                "slot": participant["slot"],
                "label": participant["label"],
                "process_status": process.get("status"),
                "exit_code": process.get("exit_code"),
                "argv_digest": participant["argv_digest"],
                "idempotency_namespace": participant["idempotency_namespace"],
                "evidence": projected or None,
            }
        )

    if manifest["mode"] == "live" and (len(controller_refs) != 3 or len(receipt_refs) != 3):
        reasons.append("three_distinct_external_independence_receipts_required")
        rejected_evidence = True
    if manifest["mode"] == "live":
        reasons.extend(f"negative_receipt_missing:{case}" for case in sorted(_REQUIRED_NEGATIVE_CASES - observed_cases))
        if len(acceptance_authorities) != 1:
            reasons.append("single_acceptance_authority_binding_required")

    preflight_source = copy.deepcopy(manifest["preflight"])
    preflight_source["run_id"] = manifest["run_id"]
    preflight_source["participants"] = preflight_participants
    approval_present = approval_path.is_file() and _load_json(approval_path).get("verdict") == "OPEN"
    preflight_source["operator_receipts"] = (
        [{"label": "cohort-human-approval", "approved": True, "approval_evidence": "local-explicit-attestation"}]
        if approval_present and manifest["mode"] == "live"
        else []
    )
    preflight = build_preflight(preflight_source, repository=manifest["repository"])
    if preflight.get("verdict") != "OPEN":
        reasons.extend(f"preflight:{reason}" for reason in preflight.get("verdict_reasons") or [])

    if rejected_evidence or state["status"] in {"FAILED", "CANCELLED"} or bool(
        set(preflight.get("verdict_reasons") or []) & _CRITICAL_PREFLIGHT_REASONS
    ):
        verdict = "REJECTED"
    elif manifest["mode"] == "isolated":
        verdict = "NOT_COMPUTABLE"
        reasons.append("isolated_or_simulated_run_cannot_complete")
    elif reasons:
        verdict = "BLOCKED"
    else:
        verdict = "COMPLETE"
    if verdict not in VERDICTS:
        raise CohortError("internal invalid verification verdict")

    return {
        "schema_version": VERIFICATION_SCHEMA,
        "run_id": manifest["run_id"],
        "mode": manifest["mode"],
        "execution_status": state["status"],
        "verdict": verdict,
        "verdict_reasons": sorted(set(reasons)),
        "participants": participant_rows,
        "preflight": preflight,
        "claim_boundary": {
            "external_independence": "NOT_CLAIMED" if manifest["mode"] == "isolated" else "REQUIRES_DISTINCT_OBSERVED_RECEIPTS",
            "isolated_completion": "FORBIDDEN",
            "process_output_content": "DISCARDED; ONLY BOUNDED COUNTS_AND_DIGESTS_RETAINED",
            "private_observations": "NOT_COLLECTED",
        },
    }


def verify_cohort(run_dir: Path) -> tuple[int, dict[str, Any]]:
    result = build_verification(run_dir)
    _atomic_json(run_dir.expanduser().resolve() / "verification.json", result)
    return (0 if result["verdict"] == "COMPLETE" else 1), result


def build_report(run_dir: Path) -> dict[str, Any]:
    verification = build_verification(run_dir)
    return {
        "schema_version": REPORT_SCHEMA,
        "run_id": verification["run_id"],
        "mode": verification["mode"],
        "execution_status": verification["execution_status"],
        "verdict": verification["verdict"],
        "verdict_reasons": verification["verdict_reasons"],
        "participants": verification["participants"],
        "preflight_verdict": verification["preflight"].get("verdict"),
        "preflight_reasons": verification["preflight"].get("verdict_reasons") or [],
        "claim_boundary": verification["claim_boundary"],
    }


def _print(value: Any) -> None:
    print(json.dumps(value, indent=2, sort_keys=True, ensure_ascii=True))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="noema-lca",
        description="Safe three-process LCA-2 cohort orchestration through the official noema CLI",
    )
    root = parser.add_subparsers(dest="command", required=True)
    cohort = root.add_parser("cohort", help="manage one three-controller lifecycle")
    sub = cohort.add_subparsers(dest="cohort_command", required=True)

    p_prepare = sub.add_parser("prepare", help="validate config and create three private process contexts")
    p_prepare.add_argument("--config", type=Path, required=True)
    p_prepare.add_argument("--run-dir", type=Path, required=True)
    p_prepare.add_argument("--mode", choices=["isolated", "live"], required=True)

    p_run = sub.add_parser("run", help="run exactly three official client processes")
    run_sub = p_run.add_subparsers(dest="run_mode", required=True)
    p_isolated = run_sub.add_parser("isolated", help="run an isolated cohort; never claims completion")
    p_isolated.add_argument("--run-dir", type=Path, required=True)
    p_live = run_sub.add_parser("live", help="run a human-approved live cohort")
    p_live.add_argument("--run-dir", type=Path, required=True)
    p_live.add_argument("--ack", default=None, help=f"must exactly equal {LIVE_ACK}")

    p_status = sub.add_parser("status", help="show state without exposing process output or credentials")
    p_status.add_argument("--run-dir", type=Path, required=True)
    p_stop = sub.add_parser("stop", help="request cancellation and terminate remaining process groups")
    p_stop.add_argument("--run-dir", type=Path, required=True)
    p_stop.add_argument("--grace-seconds", type=float, default=2.0)
    p_verify = sub.add_parser("verify", help="apply fail-closed completion and preflight rules")
    p_verify.add_argument("--run-dir", type=Path, required=True)
    p_report = sub.add_parser("report", help="emit deterministic redacted evidence JSON")
    p_report.add_argument("--run-dir", type=Path, required=True)
    p_report.add_argument("--output", type=Path, default=None)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    try:
        if args.command != "cohort":
            raise CohortError("unknown command")
        if args.cohort_command == "prepare":
            result = prepare(args.config, args.run_dir, mode=args.mode)
            code = 0
        elif args.cohort_command == "run":
            code, result = run_cohort(
                args.run_dir,
                mode=args.run_mode,
                ack=getattr(args, "ack", None),
            )
        elif args.cohort_command == "status":
            result, code = cohort_status(args.run_dir), 0
        elif args.cohort_command == "stop":
            result, code = stop_cohort(args.run_dir, grace_seconds=args.grace_seconds), 0
        elif args.cohort_command == "verify":
            code, result = verify_cohort(args.run_dir)
        elif args.cohort_command == "report":
            result = build_report(args.run_dir)
            if args.output:
                _atomic_json(args.output, result, mode=0o644)
            code = 0
        else:  # pragma: no cover - argparse owns command selection
            raise CohortError("unknown command")
        _print(result)
        return code
    except CohortError as exc:
        print(json.dumps({"error": "COHORT_BLOCKED", "message": str(exc)}, sort_keys=True), file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
