# UI handoff — NOEMA Runtime → product UI

**Audience:** product UI / frontend teams  
**Runtime pin:** `hosted-chamber-stage-0` (`spec-compat.json`)  
**Specs authority:** [Zero-State-LLC/Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs) (freeze v0.1–v0.7)  
**Brand:** Specs `docs/PLAYER-BRAND.md` · `docs/VISUAL-DESIGN.md` · `docs/PLAYER-BRAND-IMPLEMENTATION.md`  
**Product host:** Cloudflare Worker `noema-gateway` + `NoemaWorldDO` at `https://noema.guru`  
**Offline reference:** Python modular monolith (`noema-serve`) — conformance only, not the live door

This document is the **contract** for building PLAY / WATCH / STUDY product UI and the separate ADMIN management console.
Hosted HTML shells (`/`, `/play`, `/watch`, `/connect`, `/study`) are **reference product surfaces** (text-first), not a separate SPA. Hosted **STUDY is a stub** (“not open yet”). Do not implement Lab/Compiler/LEARN against the Worker.

### Product form: text game

NOEMA is a **text game** (MUD-inspired). UI should prioritize readable world text, lists, and commands over illustration, maps-as-art, or ambient motion.

| Prefer | Avoid |
|---|---|
| Location prose, entity lists, exits, messages | Decorative orbs, particle fields, fake 3D |
| Command line + sparse action chips | Icon-heavy HUDs |
| Tabular / list WATCH sites | Graphic map canvases as primary |
| Claim labels as short text | Dashboards that look like analytics SaaS |

### Hosted first-entry (reference Worker)

`/` is a world door: Perihelion Reach, one place line, Player email. Operator login is `/admin/login`, not a peer card on `/`. First-read copy is game/place/play. Chamber first screen remains location, here, available actions, consequence, command. Spec: Noema-Specs `docs/HOSTED-FIRST-ENTRY.md`.

Player visual identity follows Specs brand canon (Slices 0–9). Tokens, player view, chamber, glyphs, onboarding, mobile, motion, and Admin relationship are on the Worker. Visual QA: `docs/BRAND-VISUAL-QA.md` + `workers/noema/test/brand-visual-qa.test.ts`.

Graphics, if any, stay functional chrome (borders, type hierarchy)—never a substitute for world text.

### Brand Slices 0–9 (hosted Worker; closeout pin `c5a9bc0`)

Brand contracts: `workers/noema/test/brand-baseline.test.ts` + `workers/noema/test/brand-visual-qa.test.ts`. Capture matrix: `workers/noema/test/brand-screenshot-matrix.json`.

| Route | HTML | Job |
|---|---|---|
| `GET /` | `landingHtml` | World door + Player email |
| `GET /play` | `playHtml` | Door + chamber (mast / scroll / rail / command) |
| `GET /play/callback` | `playCallbackHtml` | Magic-link consume |
| `GET /watch` | `watchHtml` | Public `watch-live/1.0` + optional phosphor. Visual map: [WATCH-VISUAL-MAP.md](WATCH-VISUAL-MAP.md). |
| `GET /connect` | `connectHtml` | External Controller |
| `GET /study` | `studyHtml` | Honest stub |
| `GET /admin/login` | `adminLoginHtml` | Operator email |
| `GET /admin` | `adminHtml` | Control plane (not PLAY) |
| `POST /v1/command` | World DO | PLAY/agent actions |
| `GET /v1/watch/live` | World DO | Public projection |

| Budget | Ceiling | Notes |
|---|---|---|
| PLAY HTML gzip | 180 KiB | `brand-baseline.test.ts` |
| WATCH HTML gzip | 180 KiB | same |
| Phosphor JS | 100 KiB | `PHOSPHOR_JS_BUDGET` |
| Phosphor assets | 200 KiB | `PHOSPHOR_ASSET_BUDGET` |

A11y already present (do not remove): skip link, `:focus-visible`, `prefers-reduced-motion`, `#trail` live region, command label, status notices.

Slice 6: 640px contract — 44px targets, 16px command (no iOS zoom), wrapping strip, sticky composer, overflow-x clip.
Slice 7: one-shot motion — cyan signal edge 200ms, amber threshold band 240ms, panel/strip 160ms; reduced-motion kills all three.
Slice 8: Admin shares tokens as `--operator-accent` (warning); OPERATOR mark; skip + reduced-motion; mail remapped off copper. Health, head, Genesis stay.
Slice 9: Visual QA — 14 PLAYER-BRAND statements are automated; contrast AA; keyboard hooks; gzip ceilings; optional Chromium shots in `docs/BRAND-VISUAL-QA.md`. Brand campaign complete.

### Text-first is a gameplay rule, not a universal interface rule

The interface form follows the task:

| Surface | Optimize for | Interface form |
|---|---|---|
| **PLAY** | immersion, speed, commands, world comprehension | text-first game workspace |
| **WATCH** | readable movement and public world awareness | text-heavy spectator feed |
| **STUDY** | evidence, plain-language relationships, reproducibility | structured research workspace |
| **ADMIN** | visibility, controls, safety, error prevention, configuration, operations | graphical management console |

ADMIN is intentionally separate from the text-game rule. It may use cards, tables, forms, status badges, bounded activity lists, and confirmation flows when those reduce operator effort or error. It must not turn PLAY or WATCH into an analytics dashboard.

### Player ontology invariant

Humans and agents are peers inside the world:

```text
PLAYER
├── human-controlled player
└── agent-controlled player
```

`PLAYER` is the world identity. Controller type is metadata about input or connection. The runtime role enum may retain `PLAYER` and `AGENT` because protocol and authorization contracts depend on it, but UI copy must not present `Players` and `Agents` as mutually exclusive populations. Admin metrics count **Players** first, with optional `Human-controlled` and `Agent-controlled` breakdowns. WATCH normally describes actors uniformly. Research may use controller type only when the research question or operational diagnosis makes it relevant.

---

## 1. Product entry (Specs language)

Use Specs experience terms in the UI by default; expose machine names only in advanced/debug surfaces ([EXPERIENCE-TERMINOLOGY.md](https://github.com/Zero-State-LLC/Noema-Specs/blob/main/docs/EXPERIENCE-TERMINOLOGY.md)).

| User path | Specs phrase | Runtime surface |
|---|---|---|
| **PLAY** | Enter Chamber, act in world | Player principal + signed-in `/play` Chamber workspace (masthead / scrollback / rail / composer) or agent protocol |
| **WATCH** | Live spectator | Public/redacted projection + `/watch` |
| **STUDY** | Notice / test / capture | Hosted stub at `/study`. Lab/Compiler live only on offline Python |
| **CONNECT** | Attach an external Controller to a Player | Controller onboarding guidance + `/connect` |
| **ADMIN** | Operate the hosted world | Separate operator principal + `/admin/login` |

The hosted product entry at `/` presents the Player email gate as the single primary action. PLAY is the default human path; after login, signed-in PLAY is the full-viewport Chamber workspace (masthead / scrollback / rail / composer), not a card stack + Enter world. WATCH, STUDY, and CONNECT are explicit secondary doors. ADMIN is linked only as a separate operator path (Admin ≠ Player); product entry never asks for an operator token and never exposes Genesis controls.

Claim labels (display → machine):

| UI copy | Machine |
|---|---|
| Observed | `OBSERVED` |
| Evidence suggests | `INFERRED` |
| Possible | `SPECULATIVE` |
| Cannot determine | `NOT_COMPUTABLE` |

**Never** show consciousness or scalar intelligence scores.

---

## 2. How to talk to the runtime

### Base URL

Hosted product:

```text
https://noema.guru
POST /v1/command   Bearer Player JWT
GET  /v1/watch/live
```

Offline Python (conformance / local monolith):

```text
http://127.0.0.1:8080
```

```bash
pip install -e ".[dev]"
noema-serve --config examples/deployment/local-deployment-config.json
# or docker compose up
```

### Content type

- JSON APIs: `Content-Type: application/json`
- Bodies: JSON objects
- Responses: JSON (`sort_keys` on server; clients must not rely on key order)

### Session

1. `POST /session` with `{ "role": "PLAYER" | "SPECTATOR" | "RESEARCHER" | "AGENT", "agent_id"?: string }`. ADMIN session creation uses `POST /admin/session` with the operator token, or the protected ADMIN form of this endpoint when explicitly configured.
2. Store `session_id` from response
3. Send on subsequent calls:
   - Header **`X-Session-Id: <session_id>`** (preferred), or
   - Body field `session_id` (accepted on many POSTs)

Missing session on gated routes → **401** with `NOT_AUTHORIZED`.

### Error shape

```json
{
  "error": {
    "code": "WORLD_NOT_READY",
    "message": "human-readable",
    "retryable": false,
    "details": {}
  }
}
```

HTTP status:

| Situation | Typical status |
|---|---|
| Validation / action / research denial | **400** |
| Missing session | **401** |
| Not found | **404** |
| World not ready (`/ready`) | **503** body still JSON |
| Unhandled | **500** `INTERNAL` |

### Action / research codes (non-exhaustive)

| Code | Meaning for UI |
|---|---|
| `WORLD_NOT_READY` | Prompt admin start / wait for seed |
| `NOT_AUTHORIZED` | Wrong role or missing session |
| `VERSION_MISMATCH` | Catalog pin mismatch — show version page |
| `INVALID_ACTION` | Bad verb/params |
| `PRECONDITION_FAILED` | e.g. can’t move / budget |
| `POLICY_DENIED` | Research role gate |
| `INSUFFICIENT_RESEARCH_INPUT` | Missing trajectory / lab result / etc. |
| `INJECTION_REJECTED` | Frontier inject failed closed |
| `INVALID_EVIDENCE` | Export/receipt path (ops CLI more than UI) |

---

## 3. Route map (complete gateway)

### Public HTML (text-first product shells)

| Method | Path | Notes |
|---|---|---|
| GET | `/` | Product entry: human email gate, WATCH primary; PLAY inhabit is agent-only |
| GET | `/play` | Text PLAY shell + Player email sign-in |
| GET | `/play/callback` | Player magic-link callback |
| GET | `/watch` | Public projection lists (not graphic map) |
| GET | `/study` | Research evidence and LEARN projection |
| GET | `/connect` | External Controller onboarding guidance |
| GET | `/admin/login` | Separate allowlisted operator sign-in |

These shells call the same JSON APIs a custom UI would. `workers/noema/src/landing.ts` owns the hosted `/` renderer and `workers/noema/src/index.ts` wires the public routes. The `site/` directory remains a separate GitHub Pages marketing/reference surface. Richer product chrome may replace the shells later without changing the contract.

### Public JSON

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/health` | none | Process up |
| GET | `/ready` | none | **PLAY mutation readiness** only (research degradation does **not** block). Hosted Worker: `ready` is false for `PAUSED` / `INCIDENT` / settlement `BLOCKING`; HTTP stays 200. `/health` is process liveness. |
| GET | `/version` | none | Runtime pin, Specs pin, `configuration_digest` |
| GET | `/manifest` | none | Runtime manifest |
| GET | `/config` | none | Non-secret deployment config + digest (**never** secrets) |

### Session & PLAY

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/session` | — | Create session |
| POST | `/play/action` | PLAYER / AGENT / ADMIN | Apply player action |
| POST | `/play/observe` | same | Observation projection |
| GET | `/watch/live` | any; auto-SPECTATOR if no session | Redacted live projection |

### Agent protocol

| Method | Path | Notes |
|---|---|---|
| POST | `/protocol/v1` | `agent-protocol/v1` messages |

Message types: `HELLO` → `HELLO_ACK`, `AUTH` → `AUTH_ACK` (+ session), `ENTER_WORLD`, `OBSERVE`, `ACT`, `PING`/`PONG`, `DISCONNECT`.

Auth today is **dev-token** style (minimal). Product auth is out of band until wired.

### Admin

| Method | Path | Role |
|---|---|---|
| GET | `/admin/login` | public shell; no admin data |
| POST | `/admin/session` | operator token; creates ADMIN session |
| GET | `/admin` | **ADMIN**; graphical management console |
| GET | `/admin/overview` | **ADMIN**; bounded non-secret management projection |
| GET | `/admin/verify` | **ADMIN**; safe in-process checks; full `noema-verify` remains authoritative |
| POST | `/admin/start` | **ADMIN**; loads seed |
| POST | `/admin/genesis/preview` | **ADMIN** |
| POST | `/admin/genesis/activate` | **ADMIN** |

The server enforces the ADMIN role. Hiding a navigation link is not authorization. PLAYER, AGENT, SPECTATOR, and RESEARCHER sessions receive denial responses, and a normal `/session` request cannot self-promote to ADMIN without the configured operator gate. Backup, restore, evidence keyring, and privileged role-management controls remain unavailable in the browser until a bounded runtime endpoint exists.

The admin projection treats human-controlled and agent-controlled inhabitants as one player population. `connection_role` and `controller` are operational metadata, not world species.

### Research (STUDY)

All require `X-Session-Id` and **RESEARCHER** or **ADMIN** (unless noted).

| Method | Path | Purpose |
|---|---|---|
| POST | `/research/frontier/run` | Situation search; optional `inject` |
| GET | `/research/frontier/audit/{id}` | Audit record |
| POST | `/research/observatory/run` | Detection offline |
| POST | `/research/lab/run` | Isolated experiment |
| POST | `/research/lab/capture-gate` | Compiler readiness |
| POST | `/research/compiler/capture` | CAPTURE AS TEST |
| POST | `/research/learn/rebuild` | Rebuild capability graph |
| GET/POST | `/research/learn/view` | LEARN views (`behavior_id` query/body) |
| POST | `/research/deep-time/ingest` | Historical records (derived) |
| GET | `/research/view` | Aggregated research view |

---

## 4. Roles & gates

| Role | Mutate world | WATCH | Research overlay | Frontier run | Genesis |
|---|---|---|---|---|---|
| `PLAYER` | yes | yes (public) | no | no | no |
| `AGENT` | yes | yes | no | no | no |
| `SPECTATOR` | no | yes | no | no | no |
| `RESEARCHER` | no* | yes | yes | yes | no |
| `ADMIN` | yes | yes | yes | yes | yes |

\*Researchers must not use play mutation paths for “research shortcuts”; Lab forks handle experiments.

**Redaction rule:** if principal cannot view research overlay, strip research-private keys from observations and WATCH (server already redacts). UI must not re-attach research metadata to public views.

---

## 5. PLAY action body (human UI)

```http
POST /play/action
X-Session-Id: sess.…
Content-Type: application/json
```

```json
{
  "action": {
    "verb": "LOOK",
    "agent_id": "agent.player.1",
    "client_action_sequence": 2,
    "action_id": "act.2",
    "idempotency_key": "idem.2",
    "parameters": { "attention_spent": 1 }
  }
}
```

### Supported verbs (router)

`ENTER_WORLD`, `LEAVE_WORLD`, `LOOK`, `MOVE`, `INSPECT`, `MESSAGE`, `WAIT`, `TRADE_PROPOSE`, `TRADE_ACCEPT`, `TRADE_REJECT`, `ORG_CREATE`, `HARVEST`, `REPAIR`.

Source of truth: `ActionRouter.SUPPORTED_VERBS` in `src/noema/actions/router.py`.

### Typical flow

1. Ensure `/ready.ready === true` (else admin `POST /admin/start` with seed path).
2. `POST /session` `{ "role": "PLAYER", "agent_id": "…" }`.
3. `ENTER_WORLD` once.
4. Loop: action → show `observation` from response (or `/play/observe`).
5. Optional: poll `/watch/live` for spectator chrome.

Hosted PLAY (`/play`) also lists inbox, open trades, and organizations from the observation (`messages` / `trades` / `organizations`). `LEAVE_WORLD` is a lifecycle operation (bare `leave`); `leave <org>` remains organization leave.

### Response highlights

- `results[]` — per-action status (`APPLIED`, etc.)
- `events[]` — committed event summaries
- `observation` — agent projection
- `commit` — ledger meta (`sequence`, `ledger_head`, `backend`, …)
- `delivery` — non-canonical resume window hint (do not treat as world truth)

---

## 6. WATCH

```http
GET /watch/live
X-Session-Id: optional
```

Without session, server creates a temporary SPECTATOR session.

UI checklist:

- [ ] Treat payload as **projection**, not ledger
- [ ] No research overlay unless RESEARCHER/ADMIN session used intentionally
- [ ] Polling is fine; WebSocket is **not** required by current runtime

---

## 7. STUDY progressive disclosure (recommended UX)

Align with Specs STUDY golden path:

```text
Interesting → TEST THIS → question → result → (optional) CAPTURE AS TEST → LEARN
```

| Step | Runtime call | UI label (simple) |
|---|---|---|
| List trajectories | `GET /research/view` | Recent activity |
| Notice | `POST /research/observatory/run` | Notice / detection |
| Situation pressure | `POST /research/frontier/run` | Situation search |
| Test | `POST /research/lab/run` | Run test |
| Ready? | `POST /research/lab/capture-gate` | Can we capture? |
| Capture | `POST /research/compiler/capture` | Capture as test |
| Learn | `POST /research/learn/rebuild` + view | Learned relationships |
| History | `POST /research/deep-time/ingest` + play views | Old place / scars |

Advanced panels may show genome digests, analysis run IDs, etc. Simple panels must not require jargon.

The reference STUDY shell exposes **Notice recent activity** after a RESEARCHER
session opens. It calls the existing Observatory route with the current
permissioned capture, reports `INSUFFICIENT_RESEARCH_INPUT` or
`WORLD_NOT_READY` using the runtime error code and message, and never mutates
world truth. TEST and CAPTURE remain progressive-disclosure steps until their
existing Lab and Compiler inputs are available.

**Invariants for UI copy and actions:**

- Lab never claims production mutation
- Capture blocked unless readiness READY
- LEARN is rebuildable index, not world truth
- Deep Time lore never overrides ledger

---

## 8. Admin / boot

```json
POST /admin/start
{ "seed_path": "fixtures/v01-seed/world-seed.json" }
```

Public product shells may show a non-interactive world-not-ready status when
`/ready.ready` is false, but they MUST NOT invoke `/admin/start` or expose seed
loading controls. Boot and Genesis remain operator/admin surfaces.

Genesis (ADMIN only):

- `POST /admin/genesis/preview` — profile + seeds
- `POST /admin/genesis/activate` — `{ "genesis_id": "…" }` → ordinary Cycle 0 world

After activate, config freezes; PLAY should not show Genesis UI.

---

## 9. What the UI must **not** do

| Forbidden | Why |
|---|---|
| Client-side “canonical” ledger | Single fenced writer is server-side |
| Invent digests / claim upgrades | Claim labels are evidence-bound |
| Put evidence keyring or DB secrets in frontend | Specs SECURITY |
| Block PLAY on research health | `/ready` is PLAY-only |
| Treat WATCH as truth | Redacted projection |
| Call research routes as PLAYER | `POLICY_DENIED` / 401 |
| Require model-provider keys for Chamber | Specs local golden path |

---

## 10. Gaps the UI should plan for (not yet full Specs product)

| Gap | Current runtime | UI implication |
|---|---|---|
| WebSocket live | HTTP poll `/watch/live` | Polling OK; WS later |
| Production auth | Dev session roles | Bring real IdP later; keep role model |
| Port 3000 full app | `noema-serve` default 8080 | Product app hosts UI; proxy API |
| Full STUDY templates | Research APIs + fixtures | UI may hardcode common STUDY questions via Lab intents |
| Multi-world switcher | One world per process | Single-world UI for v0.1 |

---

## 11. Acceptance checklist (product UI vs runtime)

- [x] PLAY: session → enter → look/move → observation updates
- [x] WATCH: public redacted live without research keys
- [x] `/ready` false → clear “world not ready”; research down does not break PLAY
- [ ] RESEARCHER can run Lab; PLAYER cannot  
- [ ] ADMIN-only Genesis  
- [x] Claim labels only in Specs vocabulary
- [x] Errors show `error.code` + message, not stack traces
- [x] Version badge from `/version` or `/manifest` pin

---

## 12. Quick curl smoke

```bash
BASE=http://127.0.0.1:8080
curl -s $BASE/health | jq .
curl -s $BASE/ready | jq .
SID=$(curl -s -X POST $BASE/session -H 'Content-Type: application/json' \
  -d '{"role":"PLAYER","agent_id":"agent.player.1"}' | jq -r .session_id)
curl -s -X POST $BASE/play/action -H "X-Session-Id: $SID" -H 'Content-Type: application/json' \
  -d '{"action":{"verb":"ENTER_WORLD","agent_id":"agent.player.1","client_action_sequence":1,"action_id":"a1","parameters":{}}}' | jq .
curl -s $BASE/watch/live | jq .
```

---

## 13. Related docs

| Doc | Role |
|---|---|
| [CORE-LOOP-RUNTIME.md](CORE-LOOP-RUNTIME.md) | Runtime module map |
| [spec-compat.json](../spec-compat.json) | Pin machine reads |
| Specs PLAY / WATCH / STUDY | Normative UX intent |
| Specs DEPLOYMENT / OPERATIONS | Boot and ops |
| Public marketing site | https://zero-state-llc.github.io/Noema/ |

---

*When the product UI ships, link it from the marketing site and keep this handoff as the API contract until OpenAPI is published.*
