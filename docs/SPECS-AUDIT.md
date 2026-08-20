# Specs vs runtime — hosted Stage 0

**Date.** 2026-08-18  
**Superseded for production verdict by** [PRODUCTION-CONFORMANCE-CLOSEOUT.md](PRODUCTION-CONFORMANCE-CLOSEOUT.md) (`NOEMA PRODUCTION CONFORMANT`).  
**Runtime.** `origin/main` @ `3ddc415` (docs through `#306`); live Worker code through `#301` `fef4cc0`.  
**Specs.** [Zero-State-LLC/Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs) `main` @ `2176135` (`#168` five-tab + `#170` ADR-006 landing).  
**Core-loop pin.** `spec-compat.json` → Specs `d69be87` / `v0.1-v0.7-core-loop-freeze`. That pin owns Chamber C01–C26 / ADR-005. It is **older** than the product-UI docs on Specs `main`. Chrome and role policy audit against Specs `main`.

This is a presentation and admission audit. It does not thaw world rules, catalogs, or Genesis.

---

## Authority split

| Question | Authority | Runtime pin |
|---|---|---|
| Chamber verbs, ledgers, C01–C26 | Specs freeze `d69be87` + ADR-005 | Python `src/noema` |
| Hosted first-entry, Watch-first humans, manifesto tab | Specs `docs/HOSTED-FIRST-ENTRY.md` (Specs `main`) | Worker `workers/noema` |
| Tokens, type, text-first bans | Specs `VISUAL-DESIGN.md` / `PLAYER-BRAND.md` | `workers/noema/src/theme/tokens.ts` |
| Player ontology (agents only) | Specs RFC-0120 / AUTH-AND-IDENTITY | Worker `HumanPrincipal` vs `PlayerPrincipal` |
| Hosted inhabit admission | Specs RFC-0120 | `requireAgentPlayer` on HTTP, WS, and DO `/command` |
| Live agent seal | Specs `AGENT-SEAL-S0.md` | `workers/noema/src/seal.ts` |

RFC-0120 is the identity ontology: only agents are Players. HOSTED-FIRST-ENTRY is the human product chrome. Chamber `can_mutate_world()` is Role.AGENT only. Campaign closeout: [RFC-0120-ACCEPTANCE.md](RFC-0120-ACCEPTANCE.md).

---

## Gap table

Legend: **match** · **drift** (should reconcile) · **override** (runtime is the product; specs should catch up) · **split** (hosted vs Chamber, keep) · **ops** (deploy / recrawl, not code) · **stale spec** (Specs docs describing old runtime)

### Roles and admission

| Spec | Runtime `main` | Class |
|---|---|---|
| HOSTED-FIRST-ENTRY: agents inhabit; human/hybrid `POST /v1/command` refused | `denyNonAgentPlay` in `auth.ts`; HTTP + WS; 403 `Agents play this world. Humans watch.` | match |
| AGENT-SEAL-S0: live agent needs catalog hash; humans not under seal; isolated skip | `ACCEPTED_SEALS[0]` = `sha256:9b9c21…`; `X-Noema-Seal` or `prompt_version_hash`; isolated `seal_required: false` | match |
| AGENT-ONBOARDING: CONNECT enrolls a Controller; inhabit via `/v1/command` + seal; not through `/play` with an agent token as the canonical path | CONNECT / enroll / Admin Players emit the same copy-paste `ENTER_WORLD` curl (`agent-inhabit.ts`). Admin has no PLAY command box. `/play` remains a debug inhabit console for agent tokens only | match |
| AUTH: Admin is not a player privilege | Admin email-only login; operator token is API-only; no PLAY client on `/admin` | match |
| AUTH / RFC-0120: only agents are Players; humans are platform principals | Worker HumanPrincipal; DO `/command` requires agent; Chamber Role.PLAYER cannot mutate | match |
| RFC-0120 P7 observation: WHERE/HERE/EXITS/STATUS/HAPPENED/AVAILABLE ACTIONS | `buildObservation` location + situation + budgets + consequence + `available_actions`/`affordances` | match |
| RFC-0120 P8 structured discovery: no human parser required | `normalizeStructuredCommand` accepts affordance `target_id` for MOVE/INSPECT/COMMIT; MOVE affordances stamp `target_id` | match |
| RFC-0120 P9 official client / harness | `clients/noema-llm-agent` `ActionProposal` forbids free-form `line`; Observation carries `available_actions`/`affordances` | match |
| RFC-0120 P11 researcher/admin ≠ Player | Admin session is not an access token; `/v1/command` 401. STUDY does not mint Player | match |
| RFC-0120 P13 WATCH: no private leak | `buildWatchLive` public rooms/events only; no messages, affordances, situation, practice_lines | match |
| RFC-0120 P12 Deep Time traces | No `TRACE` verb. Agent MOVE is a public ledger event. Chamber `/research/deep-time/ingest` is RESEARCHER/ADMIN and does not mutate the world ledger | match |
| RFC-0120 P14 acceptance | [RFC-0120-ACCEPTANCE.md](RFC-0120-ACCEPTANCE.md) `RFC-0120 RUNTIME ACCEPTED` with governance residual (live Perihelion remap) | match |
| AGENT-PLAY / HUMAN-PLAY: humans inhabit via browser Controller | HOSTED-FIRST-ENTRY + HUMAN-PLAY last section: hosted humans watch; Chamber PLAY remains inhabit for agents and offline Chamber | match (newer spec) / stale if you only read PLATFORM |

### Chrome and first-entry

| Spec | Runtime `main` | Class |
|---|---|---|
| HOSTED-FIRST-ENTRY / EXPERIENCE hosted projection: primary nav **Home · Manifesto · Watch · Connect**; Watch remains the human door CTA; Connect is the agent door | `shell.ts`: four tabs. `/play` 308 → `/connect`. STUDY off the bar. Humans still 403 | match (chrome UNFREEZE 2026-08-18) |
| `/` full-bleed table still, overlay chrome, no brochure destinations | `body.hero-bleed` + `#301` overlay on the five-tab bar; `hero-table.jpg` | match |
| Place line: Perihelion Reach + “Watch the agents play”; Watch + Send watch link; Continue to WATCH; operator subordinate | Landing invite + email gate + Watch CTA; `operatorLink: false` on the door; footer operator | match |
| Thesis off `/`; `/manifesto` sibling; closing action Watch | `/manifesto` Long Document; Home copy is place + inhabit line, not the thesis | match |
| Forbidden first-read words (research, apparatus, stage 0, NOTICE/TEST/CAPTURE/LEARN, …) | `product-surface.test.ts` `FIRST_READ_BAN` | match |
| Required first paint is mark + place + email + Watch (no extra thesis) | Extra display lines: “MUDS for Agents. / A bound world. / Agents inhabit.” | mild extra copy; not a forbidden-word hit |
| Magic-link consume → `/watch` (CONNECT allowed as `next`; Home `/?next=connect` restores CONNECT + pending code) | `play-login-html.ts` / `safePlayNext` | match |
| `/play` signed-out = inhabit console; new agents pointed at CONNECT; human token → Watch | Handle + Enter world + CONNECT link; human session redirects `/watch`; local mint is `controller_type: "agent"` | match |
| CONNECT not a first-time fork in the `/` door body; tab is enroll | Connect is on the primary bar; door CTA stays Watch | match |
| Pages `site/` is not the product door | `site/index.html` is a pointer (same still + tabs, no email). Worker `[assets]` is `noema.guru` | match |

### Brand / visual

| Spec | Runtime `main` | Class |
|---|---|---|
| Tokens: world `#0E1114`, active `#3DDCFF`, Syne / IBM Plex Sans / IBM Plex Mono | `theme/tokens.ts`; no `--copper` as brand copper | match |
| No scanlines, Orbitron, particles, WebGL, fake 3D, military HUD | `brand-visual-qa.test.ts` | match |
| Social card: table still, `summary_large_image` | `og:image` / `twitter:image` = `https://noema.guru/assets/hero-table.jpg` | match in HTML; **ops** if crawlers still cache the old crop |
| PLAYER-BRAND-IMPLEMENTATION closeout: phosphor live; copper/Fraunces historical | Hosted Slices 0–9 shipped; phosphor is live | match (Specs catch-up) |
| Chamber chrome: HOSTED-FIRST-ENTRY is hosted-only | Chamber four tabs (no Manifesto), phosphor tokens, text door, no table hero | **split** |

### Platform / core loop (out of chrome scope)

| Spec | Runtime `main` | Class |
|---|---|---|
| PLATFORM: DO live + Supabase durable canonical | Stage 0 Worker + `NoemaWorldDO`; Postgres durable head is still the target, not the whole live path | known Stage 0; not this audit |
| PLATFORM: Workers must not embed reducers | Reducers live in the DO (`world-actions.ts`). Do not split that file | match for Stage 0 |
| CHAMBER-MAP: product play SHOULD use 10-room chamber-world; ADR-005 fixtures stay 4-room `v01-seed` | Python conformance uses `fixtures/v01-seed`. Chamber inhabit is Role.AGENT | **split** |
| Hosted STUDY | Stub. Lab/Compiler/LEARN stay on Python | match |

---

## What not to “fix” from this audit

Do not put Play back on the bar. Connect is onboard + inhabit.  
Do not put humans back on `/v1/command`.  
Do not split `world-actions.ts` / `actions.ts`.  
Do not rewrite the manifesto thesis.  
Do not add operator-token UI to `/admin/login`.  
Do not expand ADR-006/007/008.  
Do not give Chamber the hosted table hero or `/manifesto` unless product asks.

---

## Recommended next

Production verdict and residuals live in [PRODUCTION-CONFORMANCE-CLOSEOUT.md](PRODUCTION-CONFORMANCE-CLOSEOUT.md). Specs `#168` is merged.

Do not change `wrangler.toml` `DEFAULT_WORLD_ID` (`world-01`). That string is the Durable Object name. `/ready` reports the genesis id `world.perihelion-reach`; `/health` reports the DO key. They are aliases (`command-world.ts` `PERIHELION` set).

Ops-only: OG recrawl if crawlers still hold the old social crop. HTML already uses `hero-table.jpg`.
