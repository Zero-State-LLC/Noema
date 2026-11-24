# WAIT outcome compatibility — issues850 and779

## Adopted reading

The owner adopted the existing-Spec compatibility reading: an accepted, complete WAIT may retain an internal wait classification while its public HAPPENED outcome is ok. Its consequence describes only actual observed rest or clearly identified regeneration. Failure/partial precedence is preserved; no recovery or global clock advance is inferred merely because WAIT was accepted.

This settles the compatibility-choice gate, not implementation review, full T1.4/S1 qualification, readiness, merge or issue disposition. It requires no new public wait token, no rewrite of the legacy R1 public-ok assertion, and no change to canonical timing, budgets or magnitudes.

## Outcome matrix

Apply rejection first, then partial success before complete WAIT classification:

| Input | Internal classification | Public outcome | Consequence |
|---|---|---|---|
| Rejected action, including WAIT | fail | fail | Honest reason; no fabricated rest. |
| Accepted partial action | partial | partial | Honest partial effect. |
| Accepted complete WAIT | wait | ok | Actual observed rest/regeneration, including zero at a cap. |
| Other accepted complete action | ok | ok | Actual observed changes. |

## Governing sources

Runtime compatibility Specs are pinned at `b86c4b09cf75b3027d87998eff0952c2421bf52d`. The following owning sections were compared with actual Specs main `69353da2079adece6cae5dbc7f1d800fc7d07c7b` and were identical at the cited spans. The open Specs395 branch is not the basis for treating a proposed requirement as enacted canon.

- [T1.4, lines67–72](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/MUD-NATIVE-INTERACTION-TASKS.md#L67-L72): translate success/failure/partial/wait into concise world-native consequences, preferring four-beat craft.
- [Feature B, lines117–164](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/MUD-NATIVE-INTERACTION-AND-WORLD-PRESENCE.md#L117-L164): world-native HAPPENED, without unsupported claims.
- [Craft5.1 and5.3](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/MUD-PLAY-CRAFT.md#L177-L235): OK|FAIL template, observable rest/regeneration and honest partial effects.
- [Canonical WAIT](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/PLAYER-ACTION-MAP.md#L677-L690): WAIT alone does not advance the global clock.
- [RFC0120 applicability](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/MUD-PLAY-CRAFT-CLOSEOUT.md#L8-L10): retain world-true consequence craft without reviving hosted human PLAY/parser obligations.

These sections do not require a literal public wait token or prescribe a specific internal enum. The adopted reading distinguishes action/result classification from its public rendering.

## Source attribution and evidence limits

At runtime main `c2ce9d08650b37cb6ee62f45279aa56eb999261c`, the helper does not yet contain the separate internal wait classification. Draft [PR851](https://github.com/Zero-State-LLC/Noema/pull/851) head `f9c4d2a480a080340cac19a1e9a779de47fc1351` contains it in [HappenedBeat/fourBeatFromResult](https://github.com/Zero-State-LLC/Noema/blob/f9c4d2a480a080340cac19a1e9a779de47fc1351/workers/noema/src/play-ui.ts#L70-L174), and [lowNoiseRoomText](https://github.com/Zero-State-LLC/Noema/blob/f9c4d2a480a080340cac19a1e9a779de47fc1351/workers/noema/src/play-ui.ts#L258-L266) maps that discriminator to public ok. This is branch-local implementation, not merged behavior or proof of integration with current main. PR metadata's reported base `38d8fd81b0296ba3b5fdd2c3528222b012b53413` is not the freshly resolved main ref.

The recorded read-only head checks were build=success, Worker regression=success and Supabase Preview=skipped, with no submitted reviews. No tests were rerun by this documentation reconciliation. Old candidate `86813cbdac92e3f7df7776b9ed504dbced0cda92` and its2536-pass/1-failure result remain historical; the original assertions and receipts are not rewritten or presented as current-head execution.

Issue850 remains open for accountable disposition. Issue779 retains its T1.1–T1.8 IDs and acceptance states, including T1.4 IMPLEMENTING; viewport/ordering, comprehension and hosted evidence remain independent. Source review, eligible GitHub approval, current-main integration and safe readiness are separate gates. No closure or acceptance promotion follows from adopting the reading.

[World glossary](../GLOSSARY.md) · [Release/resource boundaries](REVIEW-RESOURCE-BOUNDARIES.md)
