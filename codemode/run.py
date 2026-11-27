#!/usr/bin/env python3
"""Run a code-mode script in the sandbox and print its output with PII and secrets tokenized.

    python3 codemode/run.py path/to/script.py [args...]
    python3 codemode/run.py -c 'from codemode.servers.github import list_issues; ...'
    python3 codemode/run.py - < script.py

The script runs in a child Python (-I -B) with a scrubbed environment and the
audit-hook guard from runtime/guard.py. Its stdout and stderr pass through
runtime/privacy.py before they are printed, so emails, phone numbers,
registered names and secrets never reach the model's context. Output over the
configured limit is cut: filter in code and print only what you need.
"""

from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path

KIT = Path(__file__).resolve().parent
ROOT = KIT.parent
sys.path.insert(0, str(ROOT))

from codemode.runtime import WORK, config  # noqa: E402
from codemode.runtime.privacy import Vault, secret_values, tokenize  # noqa: E402

BOOTSTRAP = r"""
import sys
from pathlib import Path
root, label, argv = sys.argv[1], sys.argv[2], sys.argv[3:]
source = sys.stdin.read()
sys.path.insert(0, root)
from codemode.runtime import WORK, adopt_secrets, config
from codemode.runtime import guard
from urllib.parse import urlsplit
cfg = config()
box = cfg["sandbox"]
adopt_secrets(box["secret_env"])
hosts = list(box["allow_hosts"])
hosts += [urlsplit(s["url"]).hostname for s in cfg["servers"].values() if s.get("url")]
guard.install(
    root=Path(root),
    writable=[Path(root, w) for w in box["writable"]] + [WORK],
    allow_exec=box["allow_exec"] + [s["command"] for s in cfg["servers"].values() if s.get("command")],
    git_subcommands=box["allow_git_subcommands"],
    allow_hosts=hosts,
)
sys.argv = [label, *argv]
code = compile(source, label, "exec")
exec(code, {"__name__": "__main__", "__file__": label, "__builtins__": __builtins__})
"""


def _child_env(box: dict) -> dict[str, str]:
    env = {k: os.environ[k] for k in box["pass_env"] + box["secret_env"] if k in os.environ}
    env["TMPDIR"] = str(WORK / "tmp")
    env["CODEMODE_WORK"] = str(WORK)
    return env


def main(argv: list[str]) -> int:
    if not argv or argv[0] in ("-h", "--help"):
        print(__doc__.strip())
        return 0 if argv else 2
    if argv[0] == "-c":
        if len(argv) < 2:
            print("run.py: -c needs code", file=sys.stderr)
            return 2
        source, label, rest = argv[1], "<codemode -c>", argv[2:]
    elif argv[0] == "-":
        source, label, rest = sys.stdin.read(), "<codemode stdin>", argv[1:]
    else:
        path = Path(argv[0]).resolve()
        source, label, rest = path.read_text(encoding="utf-8"), str(path), argv[1:]

    box = config()["sandbox"]
    (WORK / "tmp").mkdir(parents=True, exist_ok=True)
    cmd = [sys.executable, "-I", "-B", "-X", "utf8", "-c", BOOTSTRAP, str(ROOT), label, *rest]
    try:
        proc = subprocess.run(
            cmd,
            input=source,
            capture_output=True,
            text=True,
            cwd=ROOT,
            env=_child_env(box),
            timeout=box["timeout_seconds"],
        )
        out, err, code = proc.stdout, proc.stderr, proc.returncode
    except subprocess.TimeoutExpired as exc:
        out = exc.stdout.decode() if isinstance(exc.stdout, bytes) else (exc.stdout or "")
        err = f"codemode: timed out after {box['timeout_seconds']}s; poll in code with a deadline instead.\n"
        code = 124

    vault = Vault()
    secrets = secret_values(dict(os.environ)) + [os.environ[k] for k in box["secret_env"] if os.environ.get(k)]
    out = tokenize(out, vault, secrets)
    err = tokenize(err, vault, secrets)
    vault.save()

    limit = int(box["max_output_chars"])
    if len(out) > limit:
        out = out[:limit] + f"\n[codemode: output cut at {limit} of {len(out)} chars; filter in code and print less]\n"
    if len(err) > limit // 2:
        err = err[-(limit // 2):]
    sys.stdout.write(out)
    sys.stderr.write(err)
    return code


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
