# workers/noema/src/watch-stage-model.ts

- LiveRoom · type · L34-L36 — type LiveRoom = PhosphorRoom & { traces?: Array<{ text?: unknown } | null>; };
- StageLive · type · L38-L43 — type StageLive = { projection?: string; sequence?: number; rooms?: LiveRoom[] | null; recent_events?: PhosphorEvent[] | null; };
- StageContext · type · L45-L49 — type StageContext = { selectedId?: string; followRoomId?: string; majorRoomId?: string; };
- StageSite · type · L51-L64 — type StageSite = { id: string; name: string; x: number; z: number; certainty: PhosphorCertainty; active: boolean; players: number; handles: string[]; traces: number; selected: boolean; followed: boolean; major: boolean; };
- StageRoute · type · L66-L72 — type StageRoute = { from: string; to: string; direction: string; dashed: boolean; oneWay: boolean; };
- StageModel · type · L74-L79 — type StageModel = { sites: StageSite[]; routes: StageRoute[]; /** Distance from the layout centre to its farthest site, plus one grid step. */ radius: number; };
- StagePulse · type · L81-L86 — type StagePulse = { roomId: string; tier: PhosphorTier; ttl: number; sequence: number; };
- clean · function · L90-L97 — function clean(value: unknown, max: number): string
- stageLabelText · function · L100-L102 — function stageLabelText(name: unknown): string
- stageHandles · function · L105-L114 — function stageHandles(room: LiveRoom): string[]
- buildStageModel · function · L116-L167 — function buildStageModel(live: StageLive | null | undefined, ctx: StageContext = {}): StageModel
- tierOf · function · L169-L172 — function tierOf(raw: unknown): PhosphorTier
- newStagePulses · function · L182-L210 — function newStagePulses( events: PhosphorEvent[] | null | undefined, lastSequence: number | null, publicRoomIds: Iterable<string>, opts: { reduce?: boolean; snapshotSequence?: number } = {}, ): { pulses: StagePulse[]; lastSequence: number | null }
- StageCameraLimits · type · L212-L218 — type StageCameraLimits = { minDistance: number; maxDistance: number; maxTargetRadius: number; minPolarAngle: number; maxPolarAngle: number; };
- stageCameraLimits · function · L220-L229 — function stageCameraLimits(radius: number): StageCameraLimits
- stageDefaultView · function · L232-L241 — function stageDefaultView(radius: number): { target: [number, number, number]; position: [number, number, number] }
- stageCameraTarget · function · L248-L258 — function stageCameraTarget( prev: StageContext, next: StageContext, majorPulseRoomId: string, spectatorMoved: boolean, ): string
