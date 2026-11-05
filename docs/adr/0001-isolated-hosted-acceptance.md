# Hosted acceptance runs only on an isolated Worker and a separate database

Hosted acceptance evidence (for example #733's gates) is gathered only on a freshly deployed, no-route Worker with `NOEMA_ENV=test`, admitted `test.hosted-canonical.*` worlds, and its own Supabase project, then torn down; never against the production Worker, its world, or the production database. We chose this over reusing the production Supabase project with test-only rows because a service-role key there can write production data, so any runner bug would land in production; the cost is one extra project and a migration push per acceptance campaign.

## Consequences

- The runner refuses the production Worker name, the production database reference and a dirty source tree, and records the production Worker version before and after as a control.
- Hosted evidence is pinned to one source commit, one Worker version and one world; it does not transfer to production or to another version.
