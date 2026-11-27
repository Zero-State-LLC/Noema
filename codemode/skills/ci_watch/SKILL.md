---
name: ci_watch
description: Wait for CI across the Noema repos (given repo:branch pairs, or every open PR) and get one line per target, without polling through the conversation.
---

# ci_watch

Polls `commit_checks` in code (`flow.poll_until`) until every target's check
runs have completed or the timeout passes, then prints one line per target:
all green, still running, or the failed check names with a pointer to
`ci_failure_digest`.

## Call it

```bash
python3 codemode/run.py codemode/skills/ci_watch/ci_watch.py --open-prs
python3 codemode/run.py codemode/skills/ci_watch/ci_watch.py Noema:feat/codemode-mcp Noema-Specs:feat/docs-state-machines
python3 codemode/run.py codemode/skills/ci_watch/ci_watch.py --open-prs --timeout 120
```

Keep `--timeout` under the runner's 300-second limit; call again to keep waiting.

From another script:

```python
from codemode.skills.ci_watch.ci_watch import watch, render
print(render(watch([("Noema", "main", None)], timeout=60)))
```

## Output

```text
Noema#972 feat/codemode-mcp: 3 checks; all green
Noema-Specs#473 feat/docs-state-machines: 1 checks; all green
noema-client#56 feat/agent-state-machine: 1 checks; FAILED: test (digest: ci_failure_digest.py --repo noema-client --branch feat/agent-state-machine)
```

## Notes

- Read-only: it never re-runs, merges or comments.
- Saved from the ad-hoc script used to watch the four Noema PRs on 2026-11-26
  (seven runs); verified with `--open-prs` the same day.
