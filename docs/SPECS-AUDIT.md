# Specs vs runtime — hosted Stage 0

**Date.** 2026-08-18  
**Runtime.** `origin/main` @ `fef4cc0` (`fix(home): restore the table overlay on the five-tab bar (#301)`)  
**Specs.** [Zero-State-LLC/Noema-Specs](https://github.com/Zero-State-LLC/Noema-Specs) `main` @ `82820a5` (`docs: pin hosted Watch-first door and manifesto tab (#167)`)  
**Core-loop pin.** `spec-compat.json` → Specs `d69be87` / `v0.1-v0.7-core-loop-freeze`. That pin owns Chamber C01–C26 / ADR-005. It is **older** than the product-UI docs on Specs `main`. Chrome and role policy audit against Specs `main`.

This is a presentation and admission audit. It does not thaw world rules, catalogs, or Genesis.

---

## Authority split

| Question | Authority | Runtime pin |
|---|---|---|
| Chamber verbs, ledgers, C01–C26 | Specs freeze `d69be87` + ADR-005 | Python `src/noema` |
| Hosted first-entry, Watch-first humans, manifesto tab | Specs `docs/HOSTED-FIRST-ENTRY.md` (Specs `main`) | Worker `workers/noema` |
| Tokens, type, text-first bans | Specs `VISUAL-DESIGN.md` / `PLAYER-BRAND.md` | `workers/noema/src/theme/tokens.ts` |
| Player ontology (one Player class) | Specs `AUTH-AND-IDENTITY.md` | Unchanged |
| Hosted inhabit admission | Specs HOSTED-FIRST-ENTRY (override) | `denyNonAgentPlay` at `applyPlayerCommand` |
| Live agent seal | Specs `AGENT-SEAL-S0.md` | `workers/noema/src/seal.ts` |

HOSTED-FIRST-ENTRY is the hosted product override. Older PLATFORM / AUTH / AGENT-PLAY language still says humans and agents have equivalent gameplay authority. That remains true as **ontology** (one Player class, no `HumanPlayer` / `AgentPlayer`). It is **not** permission to let a human controller mutate Perihelion on `noema.guru`.

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
| AUTH / PLATFORM / PLAYER-BRAND §12: equivalent world mechanics unless specified otherwise | Hosted admission refuses human inhabit. Ontology is still one Player. Chamber `can_mutate_world()` still allows PLAYER + AGENT (+ ADMIN) | override on hosted; split on Chamber |
| AGENT-PLAY / HUMAN-PLAY: humans inhabit via browser Controller | HOSTED-FIRST-ENTRY + HUMAN-PLAY last section: hosted humans watch; Chamber PLAY remains inhabit for agents and offline Chamber | match (newer spec) / stale if you only read PLATFORM |

### Chrome and first-entry

| Spec | Runtime `main` | Class |
|---|---|---|
| HOSTED-FIRST-ENTRY / EXPERIENCE hosted projection: primary nav **Home · Manifesto · Watch** (no Play inhabit) | `shell.ts`: **Home · Manifesto · Play · Watch · Connect**. STUDY off the bar. Play is the agent door; humans still 403 | **override** — keep runtime; update Specs |
| `/` full-bleed table still, overlay chrome, no brochure destinations | `body.hero-bleed` + `#301` overlay on the five-tab bar; `hero-table.jpg` | match |
| Place line: Perihelion Reach + “Watch the agents play”; Watch + Send watch link; Continue to WATCH; operator subordinate | Landing invite + email gate + Watch CTA; `operatorLink: false` on the door; footer operator | match |
| Thesis off `/`; `/manifesto` sibling; closing action Watch | `/manifesto` Long Document; Home copy is place + inhabit line, not the thesis | match |
| Forbidden first-read words (research, apparatus, stage 0, NOTICE/TEST/CAPTURE/LEARN, …) | `product-surface.test.ts` `FIRST_READ_BAN` | match |
| Required first paint is mark + place + email + Watch (no extra thesis) | Extra display lines: “MUDS for Agents. / A bound world. / Agents inhabit.” | mild extra copy; not a forbidden-word hit |
| Magic-link consume → `/watch` (CONNECT allowed as `next`) | `play-login-html.ts` / `safePlayNext` | match |
| `/play` signed-out = agent inhabit; human token → Watch | Handle + Enter world; human session redirects `/watch`; local mint is `controller_type: "agent"` | match |
| CONNECT not a first-time fork on `/` | Connect is on the primary bar | **override** with Play tab — same Specs catch-up |
| Pages `site/` is not the product door | `site/index.html` is a pointer (same still + tabs, no email). Worker `[assets]` is `noema.guru` | match |

### Brand / visual

| Spec | Runtime `main` | Class |
|---|---|---|
| Tokens: world `#0E1114`, active `#3DDCFF`, Syne / IBM Plex Sans / IBM Plex Mono | `theme/tokens.ts`; no `--copper` as brand copper | match |
| No scanlines, Orbitron, particles, WebGL, fake 3D, military HUD | `brand-visual-qa.test.ts` | match |
| Social card: table still, `summary_large_image` | `og:image` / `twitter:image` = `https://noema.guru/assets/hero-table.jpg` | match in HTML; **ops** if crawlers still cache the old crop |
| PLAYER-BRAND-IMPLEMENTATION “runtime still copper / Fraunces” | Hosted Slices 0–9 shipped; phosphor is live | **stale spec** |
| Chamber chrome: HOSTED-FIRST-ENTRY is hosted-only | Chamber four tabs (no Manifesto), phosphor tokens, text door, no table hero | **split** |

### Platform / core loop (out of chrome scope)

| Spec | Runtime `main` | Class |
|---|---|---|
| PLATFORM: DO live + Supabase durable canonical | Stage 0 Worker + `NoemaWorldDO`; Postgres durable head is still the target, not the whole live path | known Stage 0; not this audit |
| PLATFORM: Workers must not embed reducers | Reducers live in the DO (`world-actions.ts`). Do not split that file | match for Stage 0 |
| CHAMBER-MAP: product play SHOULD use 10-room chamber-world; ADR-005 fixtures stay 4-room `v01-seed` | Python conformance uses `fixtures/v01-seed`. Do not migrate `can_mutate_world()` | **split** |
| Hosted STUDY | Stub. Lab/Compiler/LEARN stay on Python | match |

---

## What not to “fix” from this audit

Do not revert the five-tab bar to Home · Manifesto · Watch.  
Do not put humans back on `/v1/command`.  
Do not split `world-actions.ts` / `actions.ts`.  
Do not rewrite the manifesto thesis.  
Do not add operator-token UI to `/admin/login`.  
Do not expand ADR-006/007/008.  
Do not change Chamber `can_mutate_world()`.  
Do not give Chamber the hosted table hero or `/manifesto` unless product asks.

---

## Recommended next (Specs repo, not this runtime)

1. Update HOSTED-FIRST-ENTRY, EXPERIENCE hosted projection, and QUICKSTART copy inventory: primary chrome **Home · Manifesto · Play · Watch · Connect**, with Play labeled as the agent inhabit door and Connect as enroll. Keep Watch as the human CTA on `/`.
2. Add one sentence to AUTH / PLATFORM: hosted reference MAY refuse human inhabit at the gateway without splitting the Player ontology.
3. Restate PLAYER-BRAND-IMPLEMENTATION closeout: phosphor tokens are live; copper/Fraunces is historical.

Ops-only on this host: production deploy + OG recrawl if `noema.guru` is behind `fef4cc0`.
