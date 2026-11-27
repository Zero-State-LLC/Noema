"""Offline tests for codemode/: privacy, policy, shaping, search, generation, MCP client, sandbox runner."""

from __future__ import annotations

import ast
import json
import os
import subprocess
import sys
import textwrap
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from codemode import gen_wrappers, search_tools  # noqa: E402
from codemode.runtime import mcp, policy, privacy, shape  # noqa: E402
from codemode.skills.ci_failure_digest.ci_failure_digest import parse_failures  # noqa: E402


@pytest.fixture()
def vault(tmp_path: Path) -> privacy.Vault:
    return privacy.Vault(tmp_path / "vault.json")


# privacy -------------------------------------------------------------------


def test_tokenize_pii_is_stable_and_reversible(vault: privacy.Vault) -> None:
    text = "mail jane.doe@acme.io or (555) 123-4567; again jane.doe@acme.io; docs use owner@example.com"
    out = privacy.tokenize(text, vault, secrets=[])
    assert out == "mail [EMAIL_1] or [PHONE_1]; again [EMAIL_1]; docs use owner@example.com"
    assert privacy.detokenize({"to": ["[EMAIL_1]"], "n": 3}, vault) == {"to": ["jane.doe@acme.io"], "n": 3}
    vault.save()
    assert privacy.Vault(vault.path).value("[PHONE_1]") == "(555) 123-4567"
    assert oct(vault.path.stat().st_mode & 0o777) == "0o600"


def test_secrets_are_irreversible_and_never_stored(vault: privacy.Vault) -> None:
    jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9.c2lnbmF0dXJlLXNpZ25hdHVyZQ"
    text = (
        f"admin={jwt}\nAuthorization: Bearer abcdefghijklmnopqrstuvwxyz0123\n"
        "GH_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz0123456789AB\nCLOUDFLARE_API_TOKEN: s3cr3t-value-xyz\n"
        "plain exact-secret-value-123 here\nsecret: ${{ secrets.X }} max_tokens=4096 /etc/passwd: ok"
    )
    out = privacy.tokenize(text, vault, secrets=["exact-secret-value-123"])
    for leaked in (jwt, "abcdefghijklmnopqrstuvwxyz0123", "ghp_", "s3cr3t-value-xyz", "exact-secret-value-123"):
        assert leaked not in out
    assert "${{ secrets.X }}" in out and "max_tokens=4096" in out and "/etc/passwd: ok" in out
    vault.save()
    assert "SECRET" not in vault.path.read_text()


def test_registered_names_are_tokenized(vault: privacy.Vault) -> None:
    privacy.register_names(["Ada Lovelace", "Al", "Claude", "dependabot[bot]"], vault)
    out = privacy.tokenize("Ada Lovelace; Al; Claude; push git@github.com:o/r.git", vault, secrets=[])
    assert out == "[NAME_1]; Al; Claude; push git@github.com:o/r.git"


# policy --------------------------------------------------------------------


@pytest.mark.parametrize(
    "code",
    [
        'async () => cloudflare.request({ method: "POST", path: "/x" })',
        "async () => cloudflare.request({ method: 'delete', path: '/x' })",
        "async () => { const m = 'PUT'; return cloudflare.request({ method: m, path: '/x' }) }",
    ],
)
def test_cloudflare_execute_refuses_writes(code: str) -> None:
    with pytest.raises(policy.PolicyError):
        policy.check("cloudflare_api", "execute", {"code": code})


def test_cloudflare_execute_allows_reads() -> None:
    policy.check("cloudflare_api", "execute", {"code": 'async () => cloudflare.request({ method: "GET", path: "/accounts" })'})
    policy.check("cloudflare_api", "search", {"code": "async () => spec.paths"})


# shape and skills ----------------------------------------------------------


def test_shape_helpers() -> None:
    rows = [{"n": 1, "labels": [{"name": "bug"}]}, {"n": 2, "labels": [{"name": "bug"}, {"name": "ops"}]}]
    assert shape.count_by(rows, lambda r: [l["name"] for l in r["labels"]]) == [("bug", 2), ("ops", 1)]
    assert shape.get(rows[1], "labels.1.name") == "ops"
    assert "n" in shape.table(rows, ["n"]).splitlines()[0]
    log = "2026-11-26T13:15:02.0961069Z \x1b[31mFAIL\x1b[39m a\nok\n2026-11-26T13:15:02Z Error: boom"
    assert shape.grep_log(log, ["FAIL", "Error:"]) == ["FAIL a", "Error: boom"]


def test_parse_failures_vitest_and_pytest() -> None:
    vitest = [
        " FAIL  test/a.test.ts > suite > does a thing",
        "AssertionError: expected true to be false",
        " ❯ test/a.test.ts:12:5",
        "⎯⎯⎯⎯",
        "##[error]AssertionError: expected true to be false",
    ]
    pytest_lines = ["FAILED tests/test_x.py::test_y - AssertionError: nope"]
    got = parse_failures(vitest + pytest_lines)
    assert got[0] == {"file": "test/a.test.ts", "test": "suite > does a thing", "error": "AssertionError: expected true to be false", "where": "test/a.test.ts:12:5"}
    assert got[1]["test"] == "test_y" and got[1]["error"] == "AssertionError: nope"


def test_search_tools_finds_skill_first_then_tools() -> None:
    hits = search_tools.search_tools("ci failure", "names")
    assert hits[0] == "skill:ci_failure_digest"
    assert "github.job_log" in search_tools.search_tools("log", "names")
    full = search_tools.search_tools("job_log", "full", limit=1)[0]
    assert "def job_log(" in full


def test_every_tool_file_has_one_line_description() -> None:
    for path in (ROOT / "codemode" / "servers").glob("*/*.py"):
        if path.stem.startswith("_"):
            continue
        doc = ast.get_docstring(ast.parse(path.read_text()))
        assert doc and doc.strip(), path
        if path.stem != "__init__":
            assert any(isinstance(n, ast.FunctionDef) and n.name == path.stem for n in ast.parse(path.read_text()).body), path


# generation and MCP client -------------------------------------------------

FAKE_TOOLS = [
    {
        "name": "getThing",
        "description": "Get a thing by id. Longer detail follows.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "id": {"type": "string", "description": "thing id"},
                "kind": {"type": "string", "enum": ["a", "b"]},
                "tags": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["id"],
        },
        "annotations": {"readOnlyHint": True},
    },
    {"name": "fail", "description": "Always errors.", "inputSchema": {"type": "object", "properties": {}}},
]

FAKE_STDIO_SERVER = textwrap.dedent(
    """
    import json, sys
    TOOLS = json.loads(sys.argv[1])
    for line in sys.stdin:
        msg = json.loads(line)
        if "id" not in msg:
            continue
        m = msg["method"]
        if m == "initialize":
            result = {"protocolVersion": "2025-06-18", "capabilities": {"tools": {}}, "serverInfo": {"name": "fake"}}
        elif m == "tools/list":
            result = {"tools": TOOLS}
        elif m == "tools/call":
            p = msg["params"]
            if p["name"] == "fail":
                result = {"isError": True, "content": [{"type": "text", "text": "nope"}]}
            else:
                result = {"content": [{"type": "text", "text": json.dumps({"echo": p["arguments"]})}]}
        print(json.dumps({"jsonrpc": "2.0", "id": msg["id"], "result": result}), flush=True)
    """
)


def test_gen_wrappers_renders_typed_one_tool_per_file() -> None:
    fn, src = gen_wrappers.render("fake", FAKE_TOOLS[0], "test")
    assert fn == "get_thing"
    assert src.splitlines()[0] == '"""Get a thing by id."""'
    assert "def get_thing(id: str, *, kind: Literal['a', 'b'] | None = None, tags: list[str] | None = None) -> Any:" in src
    compile(src, "get_thing.py", "exec")


def test_mcp_stdio_roundtrip_maps_placeholders_back(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(privacy, "WORK", tmp_path)
    v = privacy.Vault()
    v.token("EMAIL", "real@acme.io")
    v.save()
    server = tmp_path / "fake_server.py"
    server.write_text(FAKE_STDIO_SERVER)
    spec = {"transport": "stdio", "command": sys.executable, "args": [str(server), json.dumps(FAKE_TOOLS)]}
    s = mcp.session("fake_stdio", spec)
    try:
        assert [t["name"] for t in s.list_tools()] == ["getThing", "fail"]
        assert mcp.call_tool("fake_stdio", "getThing", {"id": "[EMAIL_1]", "kind": None}) == {"echo": {"id": "real@acme.io"}}
        with pytest.raises(mcp.McpToolError):
            mcp.call_tool("fake_stdio", "fail", {})
    finally:
        s.close()
        mcp._SESSIONS.pop("fake_stdio", None)


class _FakeHttpMcp(BaseHTTPRequestHandler):
    def log_message(self, *args: object) -> None:  # quiet
        pass

    def do_POST(self) -> None:  # noqa: N802
        msg = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if "id" not in msg:
            self.send_response(202)
            self.end_headers()
            return
        if msg["method"] == "initialize":
            body = json.dumps({"jsonrpc": "2.0", "id": msg["id"], "result": {"protocolVersion": "2025-06-18"}})
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Mcp-Session-Id", "sess-1")
        else:
            assert self.headers.get("Mcp-Session-Id") == "sess-1"
            assert self.headers.get("Authorization") == "Bearer test-token-123"
            result = {"structuredContent": {"tool": msg["params"]["name"]}, "content": []}
            event = json.dumps({"jsonrpc": "2.0", "id": msg["id"], "result": result})
            body = f"event: message\ndata: {event}\n\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
        data = body.encode()
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


def test_mcp_http_sse_roundtrip(monkeypatch: pytest.MonkeyPatch) -> None:
    for var in ("NO_PROXY", "no_proxy"):
        monkeypatch.setenv(var, "*")
    monkeypatch.setenv("FAKE_MCP_TOKEN", "test-token-123")
    httpd = HTTPServer(("127.0.0.1", 0), _FakeHttpMcp)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    try:
        spec = {"transport": "http", "url": f"http://127.0.0.1:{httpd.server_port}/mcp", "token_env": "FAKE_MCP_TOKEN"}
        mcp.session("fake_http", spec)
        assert mcp.call_tool("fake_http", "whoami", {}) == {"tool": "whoami"}
    finally:
        httpd.shutdown()
        mcp._SESSIONS.pop("fake_http", None)


# sandbox runner ------------------------------------------------------------


def test_runner_sandboxes_and_tokenizes(tmp_path: Path) -> None:
    script = tmp_path / "task.py"
    script.write_text(
        textwrap.dedent(
            """
            import os, subprocess
            print("contact jane.doe@acme.io token", os.environ.get("GH_TOKEN"))
            print(open("codemode/config.json").read(1))
            for label, fn in [
                ("read", lambda: open("/etc/hostname").read()),
                ("write", lambda: open("README.md", "a")),
                ("exec", lambda: subprocess.run(["ls"])),
                ("system", lambda: os.system("true")),
                ("net", lambda: __import__("socket").create_connection(("example.com", 443), 2)),
                ("git-push", lambda: subprocess.run(["git", "push"])),
            ]:
                try:
                    fn()
                    print("ALLOWED", label)
                except PermissionError as exc:
                    print("DENIED", label, "codemode sandbox" in str(exc))
            open(os.path.join(os.environ["CODEMODE_WORK"], "ok.txt"), "w").write("x")
            print("WROTE work")
            """
        )
    )
    env = {**os.environ, "CODEMODE_WORK": str(tmp_path / "work"), "GH_TOKEN": "ghp_" + "x" * 36}
    proc = subprocess.run(
        [sys.executable, str(ROOT / "codemode" / "run.py"), str(script)],
        capture_output=True, text=True, cwd=ROOT, env=env, timeout=60,
    )
    assert proc.returncode == 0, proc.stderr
    out = proc.stdout.splitlines()
    assert out[0] == "contact [EMAIL_1] token None"
    assert out[1] == "{"
    for label in ("read", "write", "exec", "system", "net", "git-push"):
        assert f"DENIED {label} True" in out, (label, proc.stdout)
    assert "WROTE work" in out
    assert json.loads((tmp_path / "work" / "vault.json").read_text())["by_value"]["EMAIL"] == {"jane.doe@acme.io": 1}
