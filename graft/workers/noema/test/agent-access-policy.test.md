# workers/noema/test/agent-access-policy.test.ts

- agent · function · L6-L17 — function agent(id: string): PlayerPrincipal
- world · function · L19-L61 — function world(): WorldRuntime
- run · function · L63-L76 — async function run( w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, )
- seatGrant · function · L78-L96 — async function seatGrant(w: WorldRuntime, founder: PlayerPrincipal): Promise<string>
