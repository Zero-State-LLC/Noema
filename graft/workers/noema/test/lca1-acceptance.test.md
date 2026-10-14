# workers/noema/test/lca1-acceptance.test.ts

- memoryState · function · L11-L25 — function memoryState(initial: Record<string, unknown> = {})
- get · method · L15-L17 — async get(key: string)
- put · method · L18-L21 — async put(keyOrEntries: string | Record<string, unknown>, value?: unknown)
- lcaWorld · function · L27-L81 — function lcaWorld(): WorldRuntime
- Token · type · L83-L83 — type Token = { access_token: string };
- envWith · function · L85-L102 — function envWith(doInst: NoemaWorldDO): Env
- act · function · L104-L125 — async function act(env: Env, token: Token, requestId: string, command: string, args: Record<string, unknown> = {})
- watch · function · L127-L132 — async function watch(env: Env)
