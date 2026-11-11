# #793: display fallback is not physical presence

## Bounded repair and governing contract

This is a local defensive projection repair against runtime base
`88e111c5d9fc83203a7f414b0af2dade07cf2bec`, not a new presence policy.
The owner approved the issue-local repair addendum and local validation.

Requirements come from [issue #793 and its recorded operator decisions](https://github.com/Zero-State-LLC/Noema/issues/793),
[ADR 0002](adr/0002-presence-is-addressable-not-private.md), and compatibility-pinned
Noema-Specs `b86c4b09cf75b3027d87998eff0952c2421bf52d`
[`RESOURCE-ECONOMY.md`, attention/energy visibility](https://github.com/Zero-State-LLC/Noema-Specs/blob/b86c4b09cf75b3027d87998eff0952c2421bf52d/docs/RESOURCE-ECONOMY.md).
The later issue decisions retain independently authorized own-organization rosters,
safe public office-holder handles, legitimate message/trade history and explicit
permitted distant actions. ADR wording is not used to remove those entitlements.

`buildObservation` already checks entered, nonempty, valid retained observer-room
identity for social suggestions. The repair extracts that existing expression into
`observerRoomId` and also uses it for `players_here`. A useful entry-room display
fallback must not serve as evidence of co-location. The shared `otherPlayers`
candidate list is not globally filtered, and the repair does not mutate retained
occupancy or change action authorization, budgets or wire fields.

## Public-seam evidence

All new cases use the maintained `applyWorldCommand` observation seam: structured
LOOK, plus developer-text HELP carried by LOOK with `arguments.line = "help"`.
Developer HELP is not a new hosted Player entry route.

| Assertion | Executed evidence |
|---|---|
| Healthy valid occupancy lists the local other Player, not the remote Player | The preserved positive control passes before and after the repair. |
| Empty, absent and nonexistent retained observer-room identity do not create co-location | Six cases, three states × two carriers, first require command success, unchanged retained room and the useful entry-room display; each then requires `players_here: []`. |
| New tests detect the defect rather than an inert fixture | Unchanged fresh-base source: 1 pass / 6 intended assertion failures. Repaired source: 7 passes. Exact original-source reversal: the same 1 pass / 6 failures. Exact candidate restoration: 7 passes. |
| Independent existing entitlements and suggestion controls remain covered | The six maintained affected files passed 53 cases before the repair; the same 53 case identities and multiplicities plus the seven new cases passed afterward: 60 passes, no failures or pending cases. |

The fixture deliberately intervenes in retained observer-room state. This proves a
bounded defensive local projection defect, **not** a legal public command sequence
that corrupts occupancy, real hosted reachability, production disclosure, genuine
object eviction or canonical SQL settlement. The diagnostic test names and fixture
are retained exactly to preserve failing-first identity.

## Complete validation and publication gates

### Initial reviewed cohort

The initial candidate `60f3dca423bd1b4950633119336428e710ef5355` used base
`88e111c5d9fc83203a7f414b0af2dade07cf2bec`. Both independent WIP reviews and
committed-head identity checks passed with zero findings on that snapshot.
The following execution and graph figures belong to that initial cohort.

The complete built-asset Worker run passed **2,811 cases across 302 files**, with
zero failed or pending cases, exit 0 and no process timeout (195.826 seconds).
Its Worker source, test, script and asset input hashes were unchanged during the
run. All 2,797 registrations from the earlier `a9041e5` execution were preserved;
seven additional cases came from other operators' already-landed work and seven
are this repair's regressions. Those counts are cases, not assertion totals.

`npm run typecheck` passed with locally generated declarations. Its incidental
`worker-configuration.d.ts` delta was preserved outside Git and restored to the
exact committed declaration; a separate committed-declaration `tsc --noEmit`
then passed. Node 24.22.2, Python 3.11.15 and the exact compatibility-pinned Specs
checkout were used. No assertions, selectors or test deadlines were relaxed.

Deterministic wiring-only graph build/check passed, and a repeated build preserved
all graph-file hashes. All 11 edges incident to the new test and its helpers were
reviewed in both directions against actual imports/calls. The broader generated
delta catches up the base's already-stale WATCH and recently landed test index;
all 38 other affected source paths were verified byte-identical to the base or
already absent there. No unrelated product source was changed. The post-graph
affected rerun passed the same 60 cases. The optional LLM meaning tier was not built.

### Current-base integration after #863

Another operator landed #863 at `c2ce9d08650b37cb6ee62f45279aa56eb999261c`.
It changes dependency inputs, WATCH markup and accessibility test coverage, not
this repair's product paths. A clean local merge produced integration
`2fa72dc00616abae4e2de874cd38bad1066bc20f`; all 13 previously cleared candidate
blobs stayed identical and stable patch IDs matched before graph/doc refresh.
The shared dependency symlink was removed without touching its target, and an
owned `npm ci` installed the new main lockfile with unchanged package inputs.

The combined built-asset run passed **2,813 cases across 303 files**, zero failed
or pending, exit 0/no timeout in 138.89 seconds. All 2,811 prior case identities
and multiplicities remain; the two additional axe-shell cases are upstream work,
not extra presence regressions. All Worker execution inputs stayed unchanged.
Generated typecheck passed, then the incidental declaration delta was preserved
and exact committed bytes restored; post-graph committed `tsc --noEmit` passed.
The post-graph affected selection again passed the same 60 cases.

The refreshed native wiring graph passed freshness and identical-repeat hashes.
Its full delta versus the new base has 1,502 added, 2,822 removed and 352 changed
nodes; 1,907 added and 3,762 removed edges. All 11 new-test incident edges still
match actual imports/calls. All 40 other affected source paths are unchanged from
the new base or already absent there. The extra graph cards index #863's existing
WATCH/ambient types/axe source; they do not modify that upstream implementation.
Optional meaning tier remains unbuilt. Earlier CI on `60f3dca` is historical for
this base-sync gate, not proof of the refreshed PR head.

Independent Standards/Spec review, exact committed-byte follow-through,
exact-head GitHub CI and eligible code-owner approval are separate publication
and landing gates. Runtime repository auto-merge is currently disabled; this
repair does not alter that setting or authorize an administrator bypass.

This source snapshot is unmerged. Local execution and technical review do not
supply an eligible GitHub approving review, a deployment or issue acceptance.
Issue #793 remains OPEN for its separately scoped hosted/family-specific evidence
and operator acceptance. Issue #733 stays OPEN. No hosted campaign, provider/account
read, resource creation, billing/settings change or production deployment is part
of this repair.
