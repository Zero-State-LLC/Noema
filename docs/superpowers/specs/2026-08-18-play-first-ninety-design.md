# PLAY first 90 seconds — arrive in a place

**Status:** approved — implementing  
**Date:** 2026-08-18  
**Host:** `https://noema.guru` (`/`, `/play`, Chamber)  
**Does not reseed or Recover Perihelion.**  
**Admin ≠ Player.** Humans and agents remain the same Player class.  
**No tutorial wall. No `AGENT_PLAYER`. No new command language.**

The human PLAY surface currently reads as a research console that happens to contain a room. This document is the contract to invert that: first 90 seconds are arrival in Perihelion Reach.

---

# 1. Diagnosis

Concrete sources of complexity on the live human path (`/` → letter → `/play/callback` → `/play` → auto `ENTER_WORLD` + `LOOK` → first typed act). Ranked by how much they destroy “I am in a place.”

| Rank | Source | Why it damages arrival | Where it lives now |
|------|--------|------------------------|--------------------|
| 1 | **Desktop Chamber is an operator desk** | First in-world paint shows WHERE + room + condition + signals + six system drawers + trail + HERE + EXITS + AVAILABLE HERE + STATUS (world, place, exit count, nearby count, cycle, relay %, practice, lots, ties, reports, five budgets, messages, trades, orgs) + 14-glyph Key + Advanced IDs. The room is one card in a dashboard. | `play.ts` chamber + `toPlayerView()` |
| 2 | **Protocol and identity leak on first paint** | “Access token”, “Public minting is disabled”, “controller token”, `player` / `controller` / `sequence` codes, glyph legend, `CONDITION`, `AVAILABLE HERE`, cycle labels, relay integrity. These are how a runtime is operated, not how a place is entered. | `/play` door Advanced; rail STATUS / Key / Advanced |
| 3 | **Two doors, two jobs, then a third** | `/` already takes email. `/play` repeats email, then asks handle, then Advanced, then **Enter world**, plus **Connect an agent**. After a magic link the human still configures a session. | `landing.ts` + `playHtml()` `#play-door` |
| 4 | **Secondary product surfaces compete at the threshold** | Home and `/play` door ship primary nav: Home · Play · Watch · Connect. Footer: PLAY · WATCH · CONNECT · operator. Health chip: `ACTIVE · healthy`. First load is a product suite. | `shell.ts` |
| 5 | **The dictionary is offered as the game** | Desktop hint lists look, move, inspect, talk, message, trade, accept, form, leave, help. Rail lists up to eight affordances plus inspect/repair/harvest chips on every entity. That is an API catalog. Orientation already forbids a full verb dictionary on first OBSERVE. | `#cmd-hint`, `#action-rail`, entity tokens |
| 6 | **Arrival is already a log** | Authed `/play` silently runs `enter` then `look`. Trail and Just happened fill with system steps before the human has chosen anything. The first screen is aftermath, not arrival. | `enterWorld()` → `sendCommand("enter")` + `sendCommand("look")` |
| 7 | **Labels speak system, not place** | Kickers: Play, World entry, WHERE, CONDITION, HERE, EXITS, AVAILABLE HERE, STATUS, Signals, Key, Advanced details. Uppercase section machinery. | Chamber + callback |
| 8 | **Phone sheet is necessary but not sufficient** | ≤900px hides the rail behind **Here** and cuts the hint to look · help. Desktop first session is unchanged. Even on phone, auto-LOOK + trail + closed rumor/traffic drawers still compete once they have content. | `2026-08-18-play-mobile-chamber-design.md` |
| 9 | **Handle is a form field, not a name you take in a place** | Name is collected on a login card next to token paste. | `#handle` on `#play-door` |
| 10 | **LOOK is the encouraged first typed act after LOOK already ran** | Hint placeholder is `look`. The meaningful local act (walk the obvious door, inspect the worn thing) is buried. | `#cmd` placeholder + hint |

The doctrine already states the five answers and “no research labels on first entry.” The hosted Worker violates that on **desktop first Chamber** and on the **`/play` door**. Mobile subtraction (#272) only treated stacked rail, not the fantasy.

---

# 2. Redesign Principles

Each principle is a decision rule plus a test.

1. **Place before protocol.** If a string names a runtime, credential, ID, cycle, sequence, genesis, budget, or operator, it is not first-session copy. **Test:** grep first-screen markup + first LOOK paint for `token`, `controller`, `sequence`, `cycle`, `player.`, `genesis`, `budget`, `Advanced`. Zero hits.

2. **One job per surface.** `/` sends the letter. Callback consumes it. Chamber is the place. `/play` is not a second login. **Test:** an authed human hitting `/play` never sees email, token paste, or Connect.

3. **Five answers, nothing else.** First Chamber paint answers only: where, what is here, what matters, what I can do, what just happened (empty until *they* act). **Test:** a 375px and 1100px screenshot of first Chamber contains no Key, no Advanced, no STATUS table, no WATCH/CONNECT, no verb wall.

4. **Subtract before you add.** Do not invent a map, HUD, character sheet, or tutorial. Hide existing regions. **Test:** first-screen DOM node count for painted lists is lower than today’s desktop Chamber; no new route.

5. **Local acts, not the dictionary.** Surface at most **three** acts derived from the live room (same affordances agents already get). Full verb list stays in `help` and in later disclosure. **Test:** first paint shows ≤3 act controls; `help` still returns the existing verb help.

6. **Consequence is one sentence in the room.** Success, fail, partial, and wait all land in the same Just happened line, world-native, no event IDs. **Test:** after first MOVE/INSPECT, the player can point to one sentence that names what changed; `#trail` is not required to understand it.

7. **Same Player, quieter first paint.** Agents keep Agent Protocol, HELLO, OBSERVE, ACT. Humans keep `POST /v1/command`. Only HTML disclosure changes. **Test:** isolated and live command envelopes unchanged; no `AGENT_PLAYER`; no new verb.

---

# 3. First 90 Seconds Contract

Normative. A new human who has never opened the docs.

### Beat 0 — Page load (`/`)

**Feel:** a door, not a product.

**Visible**
- Place: “Perihelion Reach”
- One invitation line (keep: “A frontier station on a worn trade line. Enter the world.”)
- Email field + one button: **Send play link**
- If a session already exists: **Continue** only

**Hidden**
- Watch, Connect, Study as peer nav (see §4)
- Operator login (footer is enough, or `/admin/login` unlinked from first paint)
- Runtime chip (`ACTIVE · healthy`)
- Token, handle, Advanced

**Feel:** I am asking to enter a place. Not installing a client.

### Beat 1 — Letter

Existing PLAY letter. Subject stays world-native (**Enter NOEMA**). One link. Not Admin.

**Feel:** a key arrived. Open it.

### Beat 2 — Callback (`/play/callback`)

**Visible:** one line: “Opening the door…”  
**Hidden:** “World entry”, “Confirming the play link”, token_hash, type.  
On success, go to Chamber, not back to a login card.

If no handle in session: Chamber shows a single name field **in the place** (see Beat 3). Do not bounce to `#play-door`.

**Feel:** the door is opening. No paperwork.

### Beat 3 — First Chamber (after ENTER + first LOOK, before they type)

The runtime may still `ENTER_WORLD` + `LOOK` so the room is true. The **UI must not narrate those as the player’s actions.**

**Exact information hierarchy (top → bottom)**

1. **Place name** — the room title. Display type. No `WHERE` kicker.
2. **Place prose** — the room description. One short block.
3. **What matters** — at most one strain line, only if live (`situation.strain` / condition / worn thing). If the room is quiet, omit. Do not invent pressure.
4. **What is here** — at most **four** named things already in the room (people, objects). Names only, not type enums (`INFRASTRUCTURE`).
5. **What I can do** — at most **three** local acts, as words the player could type (`inspect the crane`, `walk east`, `wait`). One of them is the encouraged act (below).
6. **Command line** — one field, placeholder = the encouraged act. Send.
7. **What just happened** — present, **empty**. No “You enter the world.” No auto-LOOK trail.

**Visible chrome:** a mute way out (Leave) and the word NOEMA. Nothing else.

**Deliberately hidden (first Chamber, both viewports)**

Key, Advanced, player/controller/sequence IDs, STATUS table, world strip, cycle, relay %, budgets, Signals, Rumors, Traffic, Archive, Contested, Unclaimed, Offices, route ASCII, 14-glyph legend, Connect an agent, Watch, verb-wall hint, `look` as the only suggested act after LOOK already ran.

**Single most encouraged first action**

Pick **one** from live room, in this order:

1. If a worn / seized / thin named thing is in the room → **inspect &lt;that name&gt;**
2. Else if there is exactly one obvious exit with a destination name → **walk &lt;direction&gt;** (command remains `move &lt;dir&gt;`; the label may say walk)
3. Else → **wait**

Why: LOOK already happened. The next act must change something the player can see (a closer sentence, a new room, or time passing). `help` is available but not encouraged.

**Consequence (after that first act)**

- Placement: the Just happened region, directly under the place prose, **above** the command line on phone (sticky line allowed). One sentence.
- Tone: concrete, third-or-second person, no codes. “The crane’s seize is a snapped stay, not rust.” / “You cannot go that way.” / “The hall is quieter than the exchange.”
- Failure uses the same slot. No red stack traces. No `NONCONTIGUOUS_SEQUENCE`.
- Partial: say what happened and what did not. “You look closer. The stay is still seized.”
- Delayed (WAIT): “Time passes.” If the room did not change, say that. Do not fill the trail with WORLD/YOU/LOCAL rows as the primary signal.

**Feel at each micro-step**

| Step | Feel |
|------|------|
| `/` | A place has a door. |
| Letter | I was invited. |
| Callback | I am going through. |
| First Chamber | I am standing somewhere specific. |
| Choosing the offered act | The next thing is obvious. |
| Consequence | The place answered me. |

If they cannot say, after the consequence, **where they are** and **what changed**, the contract failed.

---

# 4. Information Architecture

### Minimal UI regions (core PLAY view)

| Region | Job | First 90s |
|--------|-----|-----------|
| **Place** | Name + prose + optional strain | Always |
| **Here** | Named beings/objects in this room | Always, ≤4 names |
| **Do** | Local acts | Always, ≤3 |
| **Say** | Command line + Send | Always |
| **Happened** | One consequence sentence | Always present; empty until *their* act |
| **Leave** | Exit the world | Always, visually quiet |

That is the whole first view. Desktop and phone use the **same regions**. Desktop does **not** get the encyclopedia rail on first session.

### Progressive disclosure

| When | Reveal |
|------|--------|
| After first *player-chosen* consequence | Short trail, last **3** lines, under Happened. Kinds stay you/local/world/fail but **labels are optional**; the sentence is enough. |
| After first MOVE or after 3 acts | Named exits (destination if known). Still not a map. |
| After first other Player is in the room | Their handle in Here. Talk becomes an offered act if it was not. |
| After first social attempt (talk / message / trade) | Bonds (open trades, recent messages) in an overflow **Here** sheet. |
| After first resource denial | The one missing pressure (energy, attention, …) in Happened and, from then on, a single quiet status word. Not a five-budget table. |
| After 5 player acts **or** after they open Here | Full Here sheet (current mobile sheet): remaining objects, remaining acts, Key, Advanced. |
| Never automatic | WATCH, CONNECT, STUDY, Admin, Genesis, cycle counter, sequence, glyph atlas |

Phone **Here** control from #272 stays, but it is **empty of encyclopedia** until the disclosure gates above. First tap of Here before 5 acts still shows only Here names + Do acts + exits (if earned).

### Must never appear on the first screen

```
Access token / controller token / public minting
player_id / controller_id / sequence / session
cycle / genesis / relay integrity %
Energy Compute Storage Attention Influence (as a table)
Key / 14 glyphs
Advanced details
AVAILABLE HERE as a heading
WHERE / CONDITION as machinery labels
Signals / Rumors / Traffic / Archive / Offices / Contested / Unclaimed
Connect an agent
Watch / Study as peer chrome
ACTIVE · healthy
Verb wall (trade nacre offer=…, form, leave <org>, help-as-primary)
Auto-trail of ENTER / LOOK
```

---

# 5. Interaction & Feedback Rules

### Input model

Keep the existing human line → existing verbs (`LOOK`, `MOVE`, `WAIT`, `INSPECT`, `TALK`, `MESSAGE`, `TRADE`, …). Do not invent a second language.

- Typed line in `#cmd` is canonical.
- Offered acts are the **same strings** the engine already accepts (or the existing display alias that already maps, e.g. walk → `move`).
- Tap an offered act = send that command (complete lines) or fill the field (incomplete, e.g. `inspect `).
- `help` remains the full dictionary. It is not on first paint.

### Surfacing acts

From live observation only (`affordances` + obvious inspect/move/wait as in §3).

- Cap **3** on first paint.
- Prefer concrete objects over abstract verbs (`inspect the crane` not `INSPECT`).
- Never list the global verb set.
- After disclosure gates, the Here sheet may grow toward today’s rail. Still no hint-wall.

### Consequence presentation

One region: Happened.

| Kind | Rule |
|------|------|
| Success | One sentence. Names the place or the thing that changed. |
| Failure | One sentence. Says why in the world (“That way is closed.”) not the code. |
| Partial | What worked + what did not, one or two clauses. |
| Delayed / WAIT | “Time passes.” plus whether the room is the same. |

Do not dual-write the same fact into Happened, trail, Signals, and STATUS on first session. Trail is the archive after the first consequence.

### Status and resources

- Hidden until they bite.
- First denial: Happened explains the bite. Then **one** quiet indicator may persist (the resource that failed).
- World/settlement health only if PLAY is actually blocked (`play_blocked`). Copy is “The Reach is still. Wait.” not `INCIDENT` / `BLOCKING`.

---

# 6. Acceptance Criteria

1. A new human can go from `/` email submit to standing in a named room without seeing token, controller, sequence, or Connect.
2. After first Chamber paint, they can answer “Where am I?” with the room name without scrolling on a 375×812 viewport.
3. After first Chamber paint, they can point to ≤4 named things that are here.
4. After first Chamber paint, at most one strain line is visible, and only if the live room already has that strain.
5. After first Chamber paint, they are offered ≤3 acts, one of which is inspect-the-worn-thing, walk-the-obvious-exit, or wait.
6. First Chamber paint does not contain Key, Advanced, STATUS table, budgets, cycle, or a verb wall.
7. Authed `/play` does not show the email form, Advanced token paste, or “Connect an agent.”
8. ENTER + LOOK may run, but Happened stays empty and trail does not show those lines until the human chooses an act.
9. Within 90 seconds of Chamber paint, a new player can perform the offered act and then correctly say what changed, using only the Happened sentence.
10. Failure of that act still uses Happened, with no error code or stack visible.
11. Home first paint does not present Watch or Connect as equal doors to entering the world.
12. Agents still attach via `/connect` + device enroll + `POST /v1/command`; no new Player class; no new verbs; Spectator `/watch` is unchanged for people who navigate there.

---

# 7. Migration / Compatibility

| Surface | Compatibility |
|---------|----------------|
| Player ontology | Unchanged. Human Controller, same `PlayerPrincipal`, same scopes. |
| Agent Protocol | Unchanged. HELLO / AUTH / ACT / OBSERVE. Private cognition still rejected. |
| `/v1/command` | Unchanged envelope. Optional `world_id` rules from #270 stay. |
| Spectator | `/watch` and `/v1/watch/live` stay public projections. They are simply not offered as first-load peers. |
| Mobile Here sheet (#272) | Kept. First-session content inside it is reduced to match this contract. |
| CONNECT | Stays for agents. Link leaves first-session PLAY. |
| STUDY / Admin | Stay off first-session PLAY. |

**Must change at noema.guru (reference Worker)**

- `#play-door` skipped when `noema.play.token` is present; handle collected in Chamber if missing.
- First Chamber paint: hide strip, signals, sys drawers, Key, Advanced, STATUS, verb-wall; cap Here/Do.
- Stop painting auto ENTER/LOOK into trail and Happened.
- Home/play chrome: Watch/Connect not peer-primary on first load (footer or a later “more” is enough).
- Copy: drop WHERE / AVAILABLE HERE / World entry / token lecture from first path.

**Must not change**

- World Engine verbs, settlement, Genesis pin, Recover policy, Admin plane, isolated test-world dual-auth.

---

# 8. Implementation Guidance

Do these in order. Each step should be shippable alone and should reduce perceived complexity even if later steps slip.

1. **Skip the second door.** If session token exists, `/play` opens Chamber. If handle missing, one name field in Place, then continue. Highest reduction per line changed.

2. **Silence arrival logs.** Do not push ENTER/LOOK into trail or Happened. First human act owns Happened.

3. **Hide the encyclopedia.** First session: CSS + paint flags to hide Key, Advanced, STATUS, strip, signals, sys drawers, desktop rail dump. Reuse the Here sheet; do not delete the markup.

4. **Cap Here and Do.** Paint ≤4 names and ≤3 local acts using existing `toPlayerView` / affordances. Choose the encouraged act per §3. Placeholder = that act.

5. **Rewrite first-path copy.** Remove WHERE / CONDITION / AVAILABLE HERE / Play kicker / token lecture / Connect from first paint. Place name is the title.

6. **Quiet the product chrome on `/` and `/play`.** One enter path. Watch/Connect not in the primary nav on those routes (keep URLs).

7. **Disclosure gates.** Implement the table in §4 so the current rail can return after play, not on arrival.

### Copy to write (world-native)

| Slot | Copy |
|------|------|
| Home invite | Keep: “A frontier station on a worn trade line. Enter the world.” |
| Email button | “Send the key” or keep “Send play link” |
| Callback | “Opening the door…” |
| Missing handle | “What should they call you here?” |
| Empty Happened | (blank — no “Nothing yet”) |
| Quiet room, no strain | (omit the matters line) |
| PLAY blocked | “The Reach is still. Wait.” |
| Leave | “Leave” (not “Leave world” if we can; “world” is ok if needed) |
| Here control | “Here” (keep) |
| Offered inspect | “inspect the &lt;name&gt;” |
| Offered move | “walk east” (sends `move east`) |
| Offered wait | “wait” |
| Auto-LOOK trail | none |

### Empty states

- No one else here: omit people; do not say “0 players.”
- No strain: omit the matters line.
- No second exit: do not show an empty EXITS header.
- After leave: `/` door, not a session debugger.

### Out of scope for this contract

Tutorials, character creation, scripted quests, new verbs, Recover, Genesis, research labels, Admin on PLAY.
