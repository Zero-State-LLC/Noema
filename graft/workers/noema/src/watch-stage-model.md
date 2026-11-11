# workers/noema/src/watch-stage-model.ts

- LiveRoom · type · L34-L36 — type LiveRoom = PhosphorRoom & { traces?: Array<{ text?: unknown } | null>; };
- StageLive · type · L38-L42 — type StageLive = { projection?: string; rooms?: LiveRoom[] | null; recent_events?: PhosphorEvent[] | null; };
- StageContext · type · L44-L48 — type StageContext = { selectedId?: string; followRoomId?: string; majorRoomId?: string; };
- StageSite · type · L50-L63 — type StageSite = { id: string; name: string; x: number; z: number; certainty: PhosphorCertainty; active: boolean; players: number; handles: string[]; traces: number; selected: boolean; followed: boolean; major: boolean; };
- StageRoute · type · L65-L71 — type StageRoute = { from: string; to: string; direction: string; dashed: boolean; oneWay: boolean; };
- StageModel · type · L73-L78 — type StageModel = { sites: StageSite[]; routes: StageRoute[]; /** Distance from the layout centre to its farthest site, plus one grid step. */ radius: number; };
- StagePulse · type · L80-L85 — type StagePulse = { roomId: string; tier: PhosphorTier; ttl: number; sequence: number; };
- clean · function · L89-L96 — function clean(value: unknown, max: number): string
- stageLabelText · function · L99-L101 — function stageLabelText(name: unknown): string
- stageHandles · function · L104-L113 — function stageHandles(room: LiveRoom): string[]
- buildStageModel · function · L115-L166 — function buildStageModel(live: StageLive | null | undefined, ctx: StageContext = {}): StageModel
- tierOf · function · L168-L171 — function tierOf(raw: unknown): PhosphorTier
- newStagePulses · function · L179-L203 — function newStagePulses( events: PhosphorEvent[] | null | undefined, lastSequence: number | null, publicRoomIds: Iterable<string>, opts: { reduce?: boolean } = {}, ): { pulses: StagePulse[]; lastSequence: number | null }
- StageCameraLimits · type · L205-L211 — type StageCameraLimits = { minDistance: number; maxDistance: number; maxTargetRadius: number; minPolarAngle: number; maxPolarAngle: number; };
- stageCameraLimits · function · L213-L222 — function stageCameraLimits(radius: number): StageCameraLimits
- stageDefaultView · function · L225-L234 — function stageDefaultView(radius: number): { target: [number, number, number]; position: [number, number, number] }
- stageCameraTarget · function · L241-L251 — function stageCameraTarget( prev: StageContext, next: StageContext, majorPulseRoomId: string, spectatorMoved: boolean, ): string
