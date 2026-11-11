# workers/noema/src/watch-stage-model.ts

- LiveRoom · type · L35-L37 — type LiveRoom = PhosphorRoom & { traces?: Array<{ text?: unknown } | null>; };
- StageLive · type · L39-L44 — type StageLive = { projection?: string; sequence?: number; rooms?: LiveRoom[] | null; recent_events?: PhosphorEvent[] | null; };
- StageContext · type · L46-L50 — type StageContext = { selectedId?: string; followRoomId?: string; majorRoomId?: string; };
- StageSite · type · L52-L65 — type StageSite = { id: string; name: string; x: number; z: number; certainty: PhosphorCertainty; active: boolean; players: number; handles: string[]; traces: number; selected: boolean; followed: boolean; major: boolean; };
- StageRoute · type · L67-L73 — type StageRoute = { from: string; to: string; direction: string; dashed: boolean; oneWay: boolean; };
- StageModel · type · L75-L80 — type StageModel = { sites: StageSite[]; routes: StageRoute[]; /** Distance from the layout centre to its farthest site, plus one grid step. */ radius: number; };
- StagePulse · type · L82-L87 — type StagePulse = { roomId: string; tier: PhosphorTier; ttl: number; sequence: number; };
- clean · function · L91-L98 — function clean(value: unknown, max: number): string
- stageLabelText · function · L101-L103 — function stageLabelText(name: unknown): string
- stageHandles · function · L106-L115 — function stageHandles(room: LiveRoom): string[]
- buildStageModel · function · L117-L168 — function buildStageModel(live: StageLive | null | undefined, ctx: StageContext = {}): StageModel
- tierOf · function · L170-L173 — function tierOf(raw: unknown): PhosphorTier
- newStagePulses · function · L183-L211 — function newStagePulses( events: PhosphorEvent[] | null | undefined, lastSequence: number | null, publicRoomIds: Iterable<string>, opts: { reduce?: boolean; snapshotSequence?: number } = {}, ): { pulses: StagePulse[]; lastSequence: number | null }
- StageCameraLimits · type · L213-L219 — type StageCameraLimits = { minDistance: number; maxDistance: number; maxTargetRadius: number; minPolarAngle: number; maxPolarAngle: number; };
- stageCameraLimits · function · L221-L230 — function stageCameraLimits(radius: number): StageCameraLimits
- stageDefaultView · function · L233-L242 — function stageDefaultView(radius: number): { target: [number, number, number]; position: [number, number, number] }
- stageCameraTarget · function · L249-L259 — function stageCameraTarget( prev: StageContext, next: StageContext, majorPulseRoomId: string, spectatorMoved: boolean, ): string
