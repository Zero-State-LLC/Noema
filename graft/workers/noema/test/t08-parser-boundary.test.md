# workers/noema/test/t08-parser-boundary.test.ts

- WorldRuntime · type · L28-L28 — type WorldRuntime = import("../src/world-actions").WorldRuntime;
- PlayerPrincipal · type · L29-L29 — type PlayerPrincipal = import("../src/types").PlayerPrincipal;
- world · function · L42-L60 — function world(): WorldRuntime
- Mode · type · L62-L62 — type Mode = { admission: "developer" } | undefined;
- run · function · L63-L65 — async function run(w: WorldRuntime, id: string, command: string, args: Record<string, unknown> = {}, mode?: Mode)
- reachedParser · function · L76-L76 — reachedParser = (text: string)
