# workers/noema/test/adr-006-world-bound.test.ts

- SeedRoom · type · L37-L37 — type SeedRoom = { room_id?: string; hidden?: boolean; tags?: string[] };
- loadJson · function · L39-L41 — function loadJson(path: string): { rooms?: SeedRoom[] }
- principal · function · L43-L54 — function principal(id: string): PlayerPrincipal
- isolatedWorld · function · L56-L102 — function isolatedWorld(): WorldRuntime
- run · function · L104-L117 — async function run( w: WorldRuntime, p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, )
- publicRoomIds · function · L119-L124 — function publicRoomIds(w: WorldRuntime): string[]
- listedDests · function · L126-L128 — function listedDests(obs: Observation | undefined): string[]
- listedDirs · function · L130-L132 — function listedDirs(obs: Observation | undefined): string[]
- moveAffordances · function · L134-L139 — function moveAffordances(obs: Observation | undefined): string
- assertNoHiddenRoute · function · L141-L153 — function assertNoHiddenRoute(obs: Observation | undefined)
