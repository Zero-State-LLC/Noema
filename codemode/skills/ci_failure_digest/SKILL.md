---
name: ci_failure_digest
description: Why did CI fail? Digest the latest failed Actions run (or a given run) in any Noema repo into failing tests, assertion and file:line, without reading the 100 KB+ log.
---

# ci_failure_digest

Finds the latest failed workflow run, loops over its failed jobs, downloads each
job log (with retries), and parses vitest and pytest failures in code. Only the
digest is printed: a 105 KB Worker log becomes about 25 lines.

## Call it

```bash
python3 codemode/run.py codemode/skills/ci_failure_digest/ci_failure_digest.py                  # latest failure on Noema
python3 codemode/run.py codemode/skills/ci_failure_digest/ci_failure_digest.py --repo Noema-Specs
python3 codemode/run.py codemode/skills/ci_failure_digest/ci_failure_digest.py --branch my-branch
python3 codemode/run.py codemode/skills/ci_failure_digest/ci_failure_digest.py --run 45827258958
```

From another script:

```python
from codemode.skills.ci_failure_digest.ci_failure_digest import digest, render

d = digest("Noema", branch="feat/x")   # dict: repo, run, jobs[{name, failed_steps, summary, failures[{file,test,error,where}], ...}]
print(render(d, max_failures=5))
```

## Output

```text
Zero-State-LLC/Noema run 45827258958 (CI) on feat/wave3-… : 1 failed job(s)
- Worker regression | failed step: Run complete Worker suite | log 105 KB / 1193 lines
    Tests  8 failed | 3021 passed | 1 skipped (3030)
    test/closed-catalog.test.ts:108:23  closed event catalog conformance > still emits none of …
        AssertionError: expected [ 'BUDGET_EXCEEDED', …(3) ] to deeply equal [ … ]
```

## Notes

- Read-only. It does not re-run jobs or comment anywhere.
- Unknown log formats fall back to the first ten `##[error]` lines.
- Verified on 2026-11-26 against run 45827258958 (8 vitest failures, Worker regression job).
