# Review and resource boundaries

## Adopted policy

The owner adopted these decisions in the review-boundary interview and confirmed their docs-only reconciliation on 2026-11-12 UTC:

- Review readiness is resource-free. Preview creation requires a separate, bounded authorization.
- Automatic previews are off by default for **all Noema-runtime pull requests**, not just PR881. Previews may still be separately requested; this is not a ban on authorized preview work.
- Gated auto-squash is the target landing workflow: required checks and eligible independent code-owner approval first. Automation schedules a merge; it does not approve the change, waive a gate or authorize deployment.
- Configuration-based readiness assurance is sufficient under the conditions below; an exhaustive proof of the provider's closed webhook implementation is not required. This is operating assurance, not an absolute backend guarantee or a provisioning grant.

These policies do not change live settings. A read-only configuration observation found Automatic branching already off; no toggle, save, disconnection or migration change is needed merely to attain that setting. Repository auto-merge was still disabled at the recorded observation; adopting the target workflow does not enable it.

## Required evidence seam

For each **separately authorized** branch/PR publication or review-readiness transition:

1. Resolve the exact target repository, candidate head/base, authorization and current ownership. Fetch the actual base ref; a PR's reported base SHA can lag it.
2. Recheck the persisted target integration's **Automatic branching off** setting and the target project's existing branch inventory immediately before the transition. Preserve production deployment and other settings. Evidence snapshots are not evergreen clearance.
3. Hold if the configuration drifts, the required evidence is unavailable, or unexplained resources are present. Do not manufacture assurance with a save, disconnection, branch deletion or migration change.
4. Perform only the specifically authorized source-control transition, then read back its exact target and inspect the branch inventory again.
5. Stop and report unexplained new resources or configuration drift. Do not assume concurrent changes were caused by this transition or delete a resource without authority.

Compare the actual fresh baseline; separately authorized existing previews are not prohibited. Creating provider resources, changing billing/data/production behavior, and granting acceptance remain separate decisions. The isolated hosted-acceptance requirements in [ADR0001](adr/0001-isolated-hosted-acceptance.md) are unchanged.

## Recorded research, not an evergreen guarantee

The 2026-11-12 UTC read-only observation matched the Noema runtime repository, with Automatic branching off, production deployment on for main and working directory dot. The values persisted across reload. The target branch page showed production main and the preview empty state. Supabase changes only was checked but disabled; the disabled Branch limit displayed0, which was **not** qualified as a zero-resource hard cap. No settings or resource mutation occurred.

At public Studio commit [afe5b4e](https://github.com/supabase/supabase/tree/afe5b4ed58586a43c7fd4cb05e49535b65629d66), the [GitHub form](https://github.com/supabase/supabase/blob/afe5b4ed58586a43c7fd4cb05e49535b65629d66/apps/studio/components/interfaces/Settings/Integrations/GithubIntegration/GitHubIntegrationConnectionForm.tsx#L640-L729) maps Automatic branching to `new_branch_per_pr` on a project–repository connection. Supabase changes only filters creation; it is not a no-creation guarantee. The [save path](https://github.com/supabase/supabase/blob/afe5b4ed58586a43c7fd4cb05e49535b65629d66/apps/studio/components/interfaces/Settings/Integrations/GithubIntegration/GitHubIntegrationConnectionForm.tsx#L345-L383) requests both a connection update and a production-branch operation with `Promise.allSettled`; separate switches do not make an unnecessary Save changes an isolated read.

The inspected client does not define the hosted GitHub event handler. It does not prove every ready_for_review path, toggle-time retention of existing previews, or continuity of production after a toggle. No such toggle or live event experiment was run. An old preview SKIPPED message or a sample monitoring Action's event list cannot replace the accepted configuration evidence seam. See the [first-party integration guide](https://supabase.com/docs/guides/deployment/branching/github-integration).

## Preservation and publication

Public records use sanitized observations and public source pins, not private infrastructure identifiers, raw authenticated responses, credentials, nonces or private MESSAGE bodies. Existing task IDs, original execution receipts and historical failures retain their meanings.

This reconciliation authorizes no source/test/workflow change, integration/repository setting change, new provider resource, production operation, merge, issue closure or acceptance promotion. PR881 and PR851 retain their draft states. Issue733 remains open; the frozen777/source and native/hosted gates are not renewed or waived. Normal eligible review remains independent of owner policy adoption and CI.

[Decision rationale](adr/0003-resource-free-review-readiness.md) · [Release glossary](release/GLOSSARY.md) · [WAIT contract](WAIT-OUTCOME-COMPATIBILITY-850.md)
