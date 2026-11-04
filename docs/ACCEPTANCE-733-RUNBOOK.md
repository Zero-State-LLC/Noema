# #733 hosted-gates acceptance runbook

Runs the remaining #733 hosted gates (G1 isolation, G2 trace readback, G3 browser, R0) on a **throwaway no-route Worker** against a **separate** Supabase project. Nothing touches `noema-gateway`, `noema.guru`, the Perihelion world, or project `dezykkherxlaysxyvgbs`.

## One-time setup (operator)

```bash
bash workers/noema/scripts/acceptance-733-setup.sh --dry-run   # preview, executes nothing
bash workers/noema/scripts/acceptance-733-setup.sh
```

It checks tools, logs in to Cloudflare (`env -u CLOUDFLARE_API_TOKEN`, account `315fb44b…`) and Supabase, reuses an existing `noema-733-acceptance` project if `supabase projects list -o json` shows one (never the production ref), otherwise creates it (the Supabase CLI prompts for the database password, hidden; it is never passed on a command line), runs `supabase db push`, and writes `~/.config/noema/acceptance.env` (mode 600; only `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`). It ends with booleans only. Re-run any time; it is idempotent (an existing project is reused, not recreated). It refuses the production ref.

## Per phase (each live phase needs its own go)

Run from `workers/noema`. After `deploy`, pass `--run <id>` (printed by deploy).

| Step | Command | Expect |
|---|---|---|
| Preview | `node scripts/acceptance-733.mjs plan` | action list; no network |
| Deploy | `node scripts/acceptance-733.mjs deploy` | `{"ok":true,"run_id":…,"version":…}`; refuses a dirty git working tree (`git status --porcelain` must be empty) so `source_commit` is honest; the ephemeral secrets file is created exclusively (0600) and removed on exit/SIGINT/SIGTERM/SIGHUP |
| G1 | `… g1 --run <id>` | exit 0; `g1_isolation.passed: true` in state |
| G2 | `… g2 --run <id>` | exit 0; `g2_s3_readback.passed: true` |
| G3 | `… g3-urls --run <id>` | URLs, viewports, sentinel; the browser agent drives them, saves JSON |
| R0 | `… r0 --run <id>` | exit 0; room-stack fields true |
| Receipt | `… receipt --run <id> [--g3 g3.json] [--out FILE]` | `noema-733-hosted-gates/1`, redacted, `production_worker_version_control.unchanged: true`, `source_tree_clean: true` |
| Teardown | `… teardown --run <id>` | `npx wrangler delete --config wrangler.acceptance.jsonc --name noema-733-acc-<utc> --force`; stored admin token scrubbed |

`--g3 g3.json` is validated against an allowlist (booleans: `passed`, `keyboard_ok`, `skip_link_ok`, `pause_refresh_ok`, `reduced_motion_ok`, `aria_live_bounded`, `contrast_ok`, `home_degradation_ok`, `sentinel_absent`; number: `min_contrast`; strings: `notes`, `browser`); unknown keys are dropped, wrong types are refused, and the file can never set `status` or any non-G3 receipt field.

The receipt carries `gates: { g1, g2, g3, r0, c9 }`, each `passed | failed | pending | not_covered`, and `all_required_passed` (true only when g1, g2, g3 and r0 are all `passed`; c9 is optional). A missing/unrun phase is `pending` and a G3 never recorded stays `pending`; neither counts as passed. A recorded G3 is `passed` only when **every** boolean check above is present and `true`; a missing check makes it `failed`.

A failing check stops that phase and records `false`; exit is non-zero. Fix or report, do not hand-edit state.

State and generated secrets: `~/.config/noema/acceptance-runs/<run-id>.json` (mode 600). Tokens never enter receipts; a redaction pass strips JWTs, bearer tokens, keys, 32+ hex/uuid ids and Supabase URLs.

## Not covered by the runner

AC17 (stale traces), WS ACT hosted frames, human comprehension (T6.5), C9 ticks: recorded as `not_covered` / `not_run_by_runner`.

## Never

- Never run `wrangler deploy`/`secret`/`delete` against `noema-gateway`, or use `deploy-stage0.sh` for this.
- Never put the production Supabase project in `acceptance.env`.
- Never paste keys or tokens in chat or on a command line; the wizard reads them hidden.
- Never skip teardown; the receipt is pinned to a version id and needs no live Worker.
