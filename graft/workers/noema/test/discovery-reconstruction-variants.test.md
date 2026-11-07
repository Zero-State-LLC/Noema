# workers/noema/test/discovery-reconstruction-variants.test.ts

- reconstructionPrincipal · function · L6-L10 — function reconstructionPrincipal(name: string): PlayerPrincipal
- reconstructionWorld · function · L11-L19 — function reconstructionWorld(): WorldRuntime
- reconstructionScene · function · L20-L39 — async function reconstructionScene()
- invoke · function · L25-L30 — invoke = (p: PlayerPrincipal, command: string, args: Record<string, unknown> = {}, settle: Parameters<typeof applyWorldCommand>[3] = async () => true, admission: "developer" | "hosted" = "hosted")
- observe · function · L35-L35 — observe = (p: PlayerPrincipal)
- follow · function · L36-L37 — follow = (p: PlayerPrincipal, cmd: string, settle?: Parameters<typeof applyWorldCommand>[3])
- ReconstructionScene · type · L40-L40 — type ReconstructionScene = Awaited<ReturnType<typeof reconstructionScene>>;
- reconstructionProjection · function · L41-L47 — function reconstructionProjection(w: WorldRuntime)
- reconstructionOffer · function · L48-L54 — function reconstructionOffer(s: ReconstructionScene, result: Awaited<ReturnType<ReconstructionScene["observe"]>>, operation: string, id?: string)
- reconstructionEvidence · function · L55-L68 — async function reconstructionEvidence(s: ReconstructionScene, kind: "inspect" | "archive" | "both")
