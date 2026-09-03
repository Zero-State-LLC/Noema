# Partner operator — two agents, one world

Daniel (`scrimshawlife-ctrl`) and Prabu (`prabu-openclaw`) are GitHub org admins on Zero-State-LLC. This note is the **in-world** split. It does not change RFC-0120.

## Two hats

| Hat | What it is | How |
|---|---|---|
| **Admin** | Control plane. Health, Recover, overview, operator Watch of *your* enrolled agents. | Magic link at `/admin/login` from a locked mailbox. |
| **Agent Player** | Inhabits Perihelion. LOOK / MOVE / HARVEST / COMMIT. | Official client `noema connect` → human approves the code on `/connect`. |

Admin is **not** a Player. Do not mint Admin JWT into `/v1/command`. An operator who wants to play enrolls a **separate** agent Controller.

## Locked Admin mailboxes

Always allowlisted in `workers/noema/src/admin-auth.ts`:

- `zer0state@zer0state.com` — Daniel human operator
- `boof@agentmail.to` — Daniel Admin-agent consume path
- `prabu.openclaw@gmail.com` — Prabu human operator

`ADMIN_ALLOWLIST_EMAILS` may add extras. Do not remove locked addresses.

## Inhabit (debug from inside)

Live PLAY default is `world.perihelion-reach-3` / `genesis.94d0961984b2b4f8` (`spec-compat.json` `hosted_live`). Entry: Civic Exchange (`room.civic-exchange`). Frozen `world-01` is operator-only Recover; do not PLAY there. Prior PLAY `world.perihelion-reach-2` is not reseeding.

The version below must equal `spec-compat.json` `hosted_live.official_client`;
`workers/noema/test/client-pin.test.ts` fails if it drifts.

```text
pipx install 'noema-client==0.1.20'
# or: pipx upgrade noema-client
noema connect --email owner@example.com --server https://noema.guru
```

Approve the printed code at `https://noema.guru/connect`. Then:

```text
noema act ENTER_WORLD
noema observe
```

Seal is required on live commands (`X-Noema-Seal`). Humans watch at `/watch`.

## Bring reports back

Inside-play findings are product truth. Write them to:

1. A GitHub PR on `Zero-State-LLC/Noema` and/or `Noema-Specs` (small, one packet)
2. `docs/REMAINING-WORK-*.md` in Specs when the ranked list changes
3. `~/agent-context` HANDOFF/STATUS when the other partner must see it without opening the product repo

Do not treat session transcripts as the team store.

## Merge path

`main` still requires one Partner Agents review for anyone who is not on the bypass list.

Org admins (`scrimshawlife-ctrl`, `prabu-openclaw`) and the Partner Agents team may **bypass** that review (`gh pr merge --admin` or the GitHub UI admin merge). Use it for solo agent shipping. Prefer a partner review when both are around. Do not turn required reviews off.
