# workers/noema/test/gc7-s2.test.ts

- principal · function · L24-L35 — function principal(id: string): PlayerPrincipal
- world · function · L37-L68 — function world(): WorldRuntime
- run · function · L70-L83 — async function run( w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, )
- fundTreasury · function · L85-L93 — function fundTreasury(w: WorldRuntime, orgId = "org.line")
- createOrg · function · L95-L105 — async function createOrg(w: WorldRuntime, founder: PlayerPrincipal, orgId = "org.line")
- addMember · function · L107-L117 — async function addMember(w: WorldRuntime, founder: PlayerPrincipal, member: PlayerPrincipal, orgId = "org.line")
- createOffice · function · L119-L136 — async function createOffice( w: WorldRuntime, founder: PlayerPrincipal, profile: "OPERATE_RESOURCE_ACCOUNT" | "OPERATE_NAMED_ASSET", displayName: string, orgId = "org.line", )
- assignOffice · function · L138-L152 — async function assignOffice( w: WorldRuntime, founder: PlayerPrincipal, officeId: string, holder: PlayerPrincipal, orgId = "org.line", )
