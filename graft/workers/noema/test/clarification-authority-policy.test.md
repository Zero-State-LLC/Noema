# workers/noema/test/clarification-authority-policy.test.ts

- actor · function · L7-L14 — function actor(id: string): PlayerPrincipal
- rig · function · L15-L71 — function rig()
- send · function · L28-L35 — async function send(p: PlayerPrincipal, command: string, args: Record<string, unknown> = {})
- enter · function · L36-L39 — async function enter(p: PlayerPrincipal)
- grant · function · L40-L63 — async function grant(founder: PlayerPrincipal, holder: PlayerPrincipal, profile: "GRANT_ACCESS" | "OPERATE_NAMED_ASSET" = "GRANT_ACCESS")
- projection · function · L64-L69 — function projection(orgId: string, people: PlayerPrincipal[])
- relays · function · L72-L77 — function relays(w: WorldRuntime)
- submit · function · L161-L164 — submit = (r: ReturnType<typeof rig>, organization: string)
- assertAuthorityPolicyEastMove · function · L251-L272 — async function assertAuthorityPolicyEastMove()
