import { enrichEntity } from "./actions";
import { isHiddenRoom } from "./construction";
import { persistDeepTime } from "./deep-time";
import type { Cycle0World, GenesisResult } from "./genesis";
import {
  buildWatchLive,
  heldFromSnapshot,
  type HeldHeadline,
  type WatchPlayerIn,
  type WatchRoomIn,
  type WatchSourceEvent,
} from "./watch-live";
import { buildWatchMap } from "./watch-map";
import {
  appendOperatorWatchLine,
  buildOperatorWatch,
  lineFromObservation,
  type OperatorWatchLine,
} from "./operator-watch";
import { publicCulturePulses } from "./culture";
import { adminPressureView, publicPressurePulses } from "./pressure";
import { publicRumorPulses } from "./rumor";
import { publicEmergencyPulses } from "./emergency";
import { requireAgentPlayer } from "./auth";
import {
  applyControllingSession,
  applyWorldLifecycle,
  commandForOps,
  countLivePlayers,
  expireStalePresence,
  inferActorKind,
  listLivePlayers,
  listSystemActors,
  parseOperatorId,
  isMutatingCommand,
  isUsableLiveWorld,
  mutationBlocked,
  nextSettlementHealth,
  type LifecycleAction,
  type SettlementHealth,
  type WorldOpStatus,
} from "./ops";
import {
  CADENCE_MS,
  composeDigest,
  DEFAULT_DIGEST_CONFIG,
  DIGEST_CADENCES,
  nextWindows,
  type DigestConfig,
  type DigestEvent,
  type OperatorDigest,
} from "./operator-digests";
import type { DeviceRecord } from "./device-enrollment";
import type { EnrollmentRecord } from "./enrollment";
import type { RevocationRecord } from "./controller-revocation";
import { runIncidentRecover } from "./incident-recover";
import {
  commitAdoptedLiveHead,
  canonicalEventsForCommit,
  commandResultHttpStatus,
  commitCanonicalSettlement,
  getWorldHead,
  replayUnsettled,
  resolveSoftSettlementFailure,
  settleEvent,
  settleGenesisActivation,
  shouldRestoreFromHead,
  worldFromHead,
} from "./settle";
import { checkExpectedHead, isContentionSettlementFail } from "./settle-fence";
import { buildRollbackEvidence } from "./rollback-evidence";
import { buildCompatibilityEvidence } from "./compatibility-evidence";
import {
  admitTestWorldId,
  lifecycleRequestedWorldId,
  recoverBoundWorldId,
  resolveLoadWorldId,
  withIsolatedBootstrapEvent,
} from "./test-world";
import { ATTEST_WORLD_ID, MINI_ENTRY_ROOM_ID, attestChamberState, miniChamberState } from "./mini-chamber";
import type { CommandEnvelope, CommandResult, Env, PlayerPrincipal } from "./types";
import {
  applyWorldCommand,
  buildObservation,
  ensureSuccessorMaterialsCache,
  evictLeftoverHumanOccupancy,
  migrateWorldRuntime,
  runPinnedTempoResolve,
  type RoomState,
  type WorldRuntime,
} from "./world-actions";
import {
  advanceTempoAdmissionClock,
  changeTempoMode,
  isPlayerTempoPinned,
  nextTempoAlarmAt,
  operatorTempoTrigger,
  pinPlayerTempo,
  publicTempoProjection,
  type TempoMode,
} from "./player-tempo";

type WorldState = WorldRuntime;
type Room = RoomState;

interface WorldMeta {
  status: WorldOpStatus;
  genesis_id?: string;
  cycle0_digest?: string;
  profile_id?: string;
  story_seed_ids?: string[];
  world_seed?: string;
  config_frozen: boolean;
  activated_at?: string;
  settlement_id?: string;
  settlement_ok?: boolean;
  revision?: number;
  writer_generation?: string;
  settlement_health?: SettlementHealth;
  do_digest?: string;
}

const DEMO_ROOMS: Record<string, Room> = {
  "room.relay-quarter": {
    room_id: "room.relay-quarter",
    name: "Relay Quarter",
    description:
      "A text-first Chamber entry. Power hums under the floor. Routes lead outward; nothing here is painted.",
    exits: [
      { direction: "east", to_room_id: "room.transit-ring" },
      { direction: "down", to_room_id: "room.infra-vault" },
    ],
    entities: [{ entity_id: "entity.relay-7", label: "relay-7", entity_type: "INFRASTRUCTURE" }],
  },
  "room.transit-ring": {
    room_id: "room.transit-ring",
    name: "Transit Ring",
    description: "A ring corridor of faded waymarks. East returns to the Relay Quarter.",
    exits: [{ direction: "west", to_room_id: "room.relay-quarter" }],
    entities: [],
  },
  "room.infra-vault": {
    room_id: "room.infra-vault",
    name: "Infrastructure Vault",
    description: "Cables and cold air. Up returns to the Relay Quarter.",
    exits: [{ direction: "up", to_room_id: "room.relay-quarter" }],
    entities: [],
  },
};

function demoState(world_id: string): WorldState {
  const rooms = structuredClone(DEMO_ROOMS) as Record<string, Room>;
  for (const room of Object.values(rooms)) {
    room.entities = room.entities.map((e) => enrichEntity(e));
  }
  return {
    world_id,
    world_name: "Demo Chamber",
    world_seed: "demo-pre-genesis",
    cycle: 0,
    sequence: 0,
    entry_room_id: "room.relay-quarter",
    rooms,
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
}

/** Isolated test worlds get the mini chamber. Production / demo keep DEMO_ROOMS. */
export function bootstrapWorldState(world_id: string): WorldState {
  if (world_id === ATTEST_WORLD_ID) return attestChamberState(world_id);
  if (admitTestWorldId(world_id).ok) return miniChamberState(world_id);
  return demoState(world_id);
}

export function cycle0ToWorld(c0: Cycle0World): WorldState {
  const rooms: Record<string, Room> = {};
  for (const [id, r] of Object.entries(c0.rooms)) {
    rooms[id] = {
      room_id: r.room_id,
      name: r.name,
      description: r.description,
      exits: r.exits,
      entities: r.entities.map((e) => enrichEntity(e)),
    };
  }
  const w: WorldState = {
    world_id: c0.world_id,
    world_name: c0.world_name,
    world_seed: c0.world_seed,
    cycle: 0,
    sequence: 0,
    entry_room_id: c0.entry_room_id,
    rooms,
    players: {},
    trades: {},
    messages: [],
    organizations: {},
    seen_idempotency: {},
    unsettled: [],
  };
  // SEMANTIC-EVOLUTION §7 / DEEP-TIME §2.4 / ECONOMY-EWM §7: genesis seeds
  // become live world state. Before this, the Cycle 0 document carried
  // initial_co_evolution / scar_seeds / lore_prototypes / signaling_styles
  // that never left the genesis digest (audit G6/D5).
  if (c0.initial_co_evolution || c0.initial_beliefs || c0.signaling_styles) {
    const seed = (c0.initial_co_evolution || {}) as Record<string, unknown>;
    const rec = (v: unknown): Record<string, number> =>
      v && typeof v === "object" ? (v as Record<string, number>) : {};
    w.co_evolution = {
      // genesis emits harvest_pressure as a scalar 0 — live state is per-room
      harvest_pressure: rec(seed.harvest_pressure),
      regen_mod: rec(seed.regen_mod),
      protocol_strength: rec(seed.protocol_strength),
      genesis_seeds: {
        ...(c0.initial_beliefs ? { initial_beliefs: c0.initial_beliefs } : {}),
        ...(c0.signaling_styles ? { signaling_styles: c0.signaling_styles as Record<string, string> } : {}),
      },
    };
  }
  if (c0.scar_seeds?.length) {
    w.scars = c0.scar_seeds.map((s) => ({ ...s }));
  }
  if (c0.lore_prototypes?.length) {
    w.lore_attractors = c0.lore_prototypes.map((l) => ({ ...l }));
  }
  if (w.scars || w.lore_attractors) persistDeepTime(w as never);
  return w;
}

export class NoemaWorldDO {
  private state: DurableObjectState;
  private env: Env;
  private world: WorldState | null = null;
  private meta: WorldMeta | null = null;
  private previews: Record<string, GenesisResult> = {};
  private requestedWorldId: string | null = null;
  private allowCanonicalBootstrap = false;
  /** §4A hold: last served headline, presentation-only. WATCH stays non-mutating (no storage write). */
  private watchHeld: HeldHeadline | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  /** Admin genesis routes may target perihelion-reach-2; do not require admitTestWorldId. */
  private bindAdminGenesisWorld(request: Request): void {
    const headerWorld = (request.headers.get("x-noema-world-id") || "").trim();
    if (headerWorld) this.requestedWorldId = headerWorld;
  }

  private async watchSnapshot() {
    await this.load();
    const marker =
      this.meta!.status === "PAUSED"
        ? "maintenance"
        : this.meta!.status === "INCIDENT"
          ? "incident"
          : this.meta!.settlement_health === "DEGRADED" || this.meta!.settlement_health === "BLOCKING"
            ? "stale"
            : undefined;
    const digestEvents = (await this.state.storage.get<DigestEvent[]>("digest_events")) || [];
    const players: WatchPlayerIn[] = Object.entries(this.world!.players || {}).map(([player_id, p]) => ({
      player_id,
      handle: p.handle,
      room_id: p.room_id,
      entered: p.entered,
      last_seen_ms: p.last_seen_ms,
      actor_kind: p.actor_kind,
      practice: p.practice,
      focus: p.focus,
    }));
    const events: WatchSourceEvent[] = digestEvents.slice(-80).map((ev) => ({
      event_type: ev.event_type,
      sequence: ev.sequence,
      cycle: ev.cycle,
      handle: ev.handle,
      player_id: ev.player_id,
      actor_kind: inferActorKind(ev.player_id || "", this.world!.players[ev.player_id || ""]?.actor_kind),
      at: ev.at,
      payload: ev.payload,
    }));
    const reconstructions = Object.values(this.world!.reconstructions || {}).map((r: any) => ({
      fidelity: r.fidelity ?? 0,
      controllers: r.controllers ?? 1,
      visibility: r.visibility || "PUBLIC",
    }));
    const reconstruction_fidelity = reconstructions.length
      ? (reconstructions.find((r: any) => (r.visibility || "").toUpperCase() === "PUBLIC")?.fidelity || reconstructions[0].fidelity || 0)
      : 0;
    const controllers = reconstructions.length ? reconstructions[0].controllers : 1;
    const snap = buildWatchLive({
      world_id: this.world!.world_id,
      cycle: this.world!.cycle,
      sequence: this.world!.sequence,
      rooms: this.world!.rooms as Record<string, WatchRoomIn>,
      players,
      events,
      held: this.watchHeld,
      handles: Object.fromEntries(
        Object.entries(this.world!.players || {}).map(([id, p]) => [id, p.handle]),
      ),
      world_status: this.meta!.status,
      freshness: marker,
      public_pulses: [
        ...publicCulturePulses(
          this.world!.culture,
          this.world!.cycle,
          Object.values(this.world!.reconstructions || {}).map((r) => ({
            subject_ref: r.subject_ref,
            visibility: r.visibility,
            claim: r.claim,
            epistemic: r.epistemic,
            author_id: r.author_player_id,
          })),
        ),
        ...publicPressurePulses(this.world!.pressure, this.world!.cycle),
        ...publicRumorPulses(this.world!.rumor),
        ...(this.world!.institution_pulses || []),
        ...publicEmergencyPulses(this.world!.organizations, this.world!.cycle),
      ],
      rumor: this.world!.rumor,
      organizations: Object.values(this.world!.organizations || {}).map((o) => ({
        org_id: o.org_id,
        name: o.name,
        offices: o.offices,
      })),
      // Gate B (phase2 wiring): forward fidelity + controllerCount from reconstructions / deep_time_ingest
      reconstructions,
      reconstruction_fidelity,
      controllers,
    });
    this.watchHeld = heldFromSnapshot(snap);
    return snap;
  }

  private async operatorWatchSnapshot(operatorId?: string) {
    await this.load();
    const lines = (await this.state.storage.get<OperatorWatchLine[]>("operator_watch_lines")) || [];
    return buildOperatorWatch({
      world_id: this.world!.world_id,
      cycle: this.world!.cycle,
      sequence: this.world!.sequence,
      rooms: this.world!.rooms,
      players: this.world!.players,
      lines,
      operator_id: operatorId,
    });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const text = typeof message === "string" ? message : "";
    if (text === "pause") return;
    try {
      ws.send(JSON.stringify(await this.watchSnapshot()));
    } catch {
      ws.send(JSON.stringify({ pin: "watch-live/1.0", freshness: "unavailable" }));
    }
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.endsWith("/ratelimit") || path === "/ratelimit") {
      if (request.method !== "POST") return new Response("method not allowed", { status: 405 });
      const body = (await request.json().catch(() => ({}))) as {
        key?: string;
        limit?: number;
        windowMs?: number;
        now?: number;
      };
      const key = String(body.key || "");
      const limit = Number(body.limit);
      const windowMs = Number(body.windowMs);
      const now = Number(body.now) || Date.now();
      if (!key || !Number.isFinite(limit) || !Number.isFinite(windowMs) || limit < 1 || windowMs < 1) {
        return Response.json({ error: "invalid ratelimit" }, { status: 400 });
      }
      const storageKey = `rl:${key}`;
      const prev = (await this.state.storage.get<number[]>(storageKey)) || [];
      const hits = prev.filter((t) => t > now - windowMs);
      if (hits.length >= limit) {
        await this.state.storage.put(storageKey, hits);
        return Response.json({ allowed: false });
      }
      hits.push(now);
      await this.state.storage.put(storageKey, hits);
      return Response.json({ allowed: true });
    }

    if (path.endsWith("/enroll") || path === "/enroll") {
      const bag =
        (await this.state.storage.get<Record<string, EnrollmentRecord>>("enrollments")) || {};
      if (request.method === "PUT") {
        const rec = (await request.json()) as EnrollmentRecord;
        if (!rec?.enrollment_id) return Response.json({ error: "enrollment_id required" }, { status: 400 });
        bag[rec.enrollment_id] = rec;
        await this.state.storage.put("enrollments", bag);
        return Response.json({ ok: true });
      }
      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        if (id) {
          const rec = bag[id];
          if (!rec) return new Response("{}", { status: 404 });
          return Response.json(rec);
        }
        return Response.json({ records: Object.values(bag) });
      }
      return new Response("method not allowed", { status: 405 });
    }

    if (path.endsWith("/revoke") || path === "/revoke") {
      const bag =
        (await this.state.storage.get<Record<string, RevocationRecord>>("revocations")) || {};
      if (request.method === "PUT") {
        const rec = (await request.json()) as RevocationRecord;
        if (!rec?.kind || !rec?.id) return Response.json({ error: "kind and id required" }, { status: 400 });
        bag[`${rec.kind}:${rec.id}`] = rec;
        await this.state.storage.put("revocations", bag);
        return Response.json({ ok: true });
      }
      if (request.method === "GET") {
        const kind = url.searchParams.get("kind") || "";
        const id = url.searchParams.get("id") || "";
        const rec = bag[`${kind}:${id}`];
        if (!rec) return new Response("{}", { status: 404 });
        return Response.json(rec);
      }
      return new Response("method not allowed", { status: 405 });
    }

    if (path.endsWith("/device") || path === "/device") {
      const bag = (await this.state.storage.get<Record<string, DeviceRecord>>("devices")) || {};
      if (request.method === "PUT") {
        const rec = (await request.json()) as DeviceRecord;
        if (!rec?.device_code) return Response.json({ error: "device_code required" }, { status: 400 });
        bag[rec.device_code] = rec;
        await this.state.storage.put("devices", bag);
        return Response.json({ ok: true });
      }
      if (request.method === "GET") {
        const deviceCode = url.searchParams.get("device_code");
        const userCode = (url.searchParams.get("user_code") || "").replace(/[^a-fA-F0-9]/g, "").toUpperCase();
        const reviewTokenHash = url.searchParams.get("review_token_hash") || "";
        if (deviceCode) {
          const rec = bag[deviceCode];
          if (!rec) return new Response("{}", { status: 404 });
          return Response.json(rec);
        }
        if (userCode) {
          const rec = Object.values(bag).find((r) => r.user_code.replace(/-/g, "") === userCode);
          if (!rec) return new Response("{}", { status: 404 });
          return Response.json(rec);
        }
        if (reviewTokenHash) {
          const rec = Object.values(bag).find((r) => r.review_token_hash === reviewTokenHash);
          if (!rec) return new Response("{}", { status: 404 });
          return Response.json(rec);
        }
        // No resolvable lookup key — same as unknown id (do not list the bag).
        return new Response("{}", { status: 404 });
      }
      return new Response("method not allowed", { status: 405 });
    }

    if (request.method === "GET" && path.endsWith("/health")) {
      this.bindAdminGenesisWorld(request);
      await this.load();
      return Response.json({
        ok: true,
        world_id: this.world!.world_id,
        world_name: this.world!.world_name || null,
        cycle: this.world!.cycle,
        sequence: this.world!.sequence,
        players: countLivePlayers(this.world!.players),
        status: this.meta!.status,
        settlement_health: this.meta!.settlement_health || "HEALTHY",
        genesis_id: this.meta!.genesis_id || null,
        playable: isUsableLiveWorld(this.world),
      });
    }

    if (request.method === "GET" && path.endsWith("/watch")) {
      return Response.json(await this.watchSnapshot());
    }
    if (request.method === "GET" && path.endsWith("/watch-map")) {
      const live = await this.watchSnapshot();
      const w = this.world;
      return Response.json(
        buildWatchMap({
          live,
          scars: (w as { scars?: Array<{ room_id?: string; strength: number; visibility: string; domain: string }> } | null)?.scars,
          harvest_pressure: w?.co_evolution?.harvest_pressure,
          protocol_strength: w?.co_evolution?.protocol_strength,
          reconstructions: Object.values(w?.reconstructions || {}).map((r) => ({
            fidelity: (r as { fidelity?: number }).fidelity,
            visibility: r.visibility,
          })),
        }),
      );
    }

    if (request.method === "GET" && path.endsWith("/admin-watch")) {
      const operatorId = parseOperatorId(url.searchParams.get("operator_id"));
      return Response.json(await this.operatorWatchSnapshot(operatorId));
    }

    if (path.endsWith("/watch-stream") && request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      try {
        pair[1].send(JSON.stringify(await this.watchSnapshot()));
      } catch {
        pair[1].send(JSON.stringify({ pin: "watch-live/1.0", freshness: "unavailable" }));
      }
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    if (request.method === "GET" && path.endsWith("/admin-status")) {
      const rawStoredWorld = await this.state.storage.get<WorldState>("world");
      const compatibilityEvidence = buildCompatibilityEvidence(rawStoredWorld);
      await this.load();
      const roomList = Object.values(this.world!.rooms);
      const digestEvents = (await this.state.storage.get<DigestEvent[]>("digest_events")) || [];
      const rollbackEvidence = await buildRollbackEvidence(this.world!, digestEvents);
      return Response.json({
        world_id: this.world!.world_id,
        world_name: this.world!.world_name,
        cycle: this.world!.cycle,
        sequence: this.world!.sequence,
        persisted_player_count: Object.keys(this.world!.players || {}).length,
        players_present: countLivePlayers(this.world!.players),
        player_ids: listLivePlayers(this.world!.players).map((p) => p.player_id),
        live_players: listLivePlayers(this.world!.players),
        system_actors: listSystemActors(this.world!.players),
        rooms: roomList.map((r) => ({
          room_id: r.room_id,
          name: r.name,
          entity_count: r.entities.length,
          exit_count: r.exits.length,
        })),
        room_count: roomList.length,
        entity_count: roomList.reduce((n, r) => n + r.entities.length, 0),
        unsettled_count: this.world!.unsettled.length,
        entry_room_id: this.world!.entry_room_id,
        settlement_health: this.meta!.settlement_health || "HEALTHY",
        rollback_evidence: rollbackEvidence,
        compatibility_evidence: compatibilityEvidence,
        meta: this.publicMeta(),
        preview_count: Object.keys(this.previews).length,
        player_tempo: publicTempoProjection(this.world!, Date.now()),
        pressure: adminPressureView(this.world!.pressure),
        emergency_scopes: Object.values(this.world!.organizations || {}).flatMap((o) =>
          (o.emergency_scopes || []).map((s) => ({
            scope_id: s.scope_id,
            institution_id: s.institution_id,
            holder_player_id: s.holder_player_id,
            capability: s.capability,
            target_ref: s.target_ref,
            start_cycle: s.start_cycle,
            end_cycle: s.end_cycle,
            status: s.status,
            succession: s.succession || null,
          })),
        ),
        offices: Object.values(this.world!.organizations || {}).flatMap((o) =>
          Object.values(o.offices || {}).map((office) => ({
            office_id: office.office_id,
            institution_id: office.institution_id,
            display_name: office.display_name,
            status: office.status,
            holder_player_id: office.holder_player_id || null,
            authority_profile: office.authority_profile,
            succession: office.succession || null,
          })),
        ),
      });
    }

    if (request.method === "POST" && path.endsWith("/admin-lifecycle")) {
      const body = (await request.json()) as { action?: string; reason?: string; world_id?: string };
      const bound = lifecycleRequestedWorldId(body.world_id || request.headers.get("x-noema-world-id"));
      this.requestedWorldId = bound;
      await this.load();
      const action = String(body.action || "").toLowerCase();
      if (action === "recover") {
        const stored = await this.state.storage.get<WorldState>("world");
        const boundWorld = recoverBoundWorldId(bound, stored?.world_id, this.world?.world_id);
        if (!boundWorld.ok) {
          return Response.json(
            { error: { code: boundWorld.code, message: boundWorld.message } },
            { status: 403 },
          );
        }
        const recovered = await runIncidentRecover(
          {
            status: this.meta!.status,
            settlement: (this.meta!.settlement_health || "HEALTHY") as SettlementHealth,
            storedWorld: stored,
            currentWorld: this.world!,
            genesisId: this.meta!.genesis_id || null,
            writerGeneration: this.meta!.writer_generation || "do.1",
          },
          {
            getHead: (worldId) =>
              worldId === boundWorld.world_id
                ? getWorldHead(this.env, worldId)
                : Promise.resolve(null),
            adoptLiveHead: (input) =>
              input.world.world_id === boundWorld.world_id
                ? commitAdoptedLiveHead(this.env, input)
                : Promise.resolve({ ok: false, code: "WORLD_FORBIDDEN" }),
          },
        );
        if (!recovered.ok) {
          return Response.json({ error: { code: recovered.code, message: recovered.message } }, { status: recovered.http });
        }
        this.world = recovered.world;
        migrateWorldRuntime(this.world);
        this.meta!.revision = recovered.revision;
        this.meta!.status = recovered.status;
        this.meta!.settlement_health = recovered.settlement;
        this.meta!.settlement_ok = true;
        await this.state.storage.put("world_meta", this.meta);
        await this.save();
        await this.scheduleTempoAlarm(Date.now());
        return Response.json({
          ok: true,
          status: this.meta!.status,
          settlement_health: this.meta!.settlement_health,
          revision: this.meta!.revision ?? null,
          recover_mode: recovered.mode,
          head_present: recovered.head_present,
          reason: body.reason || null,
        });
      }
      const decided = applyWorldLifecycle(
        this.meta!.status,
        action as LifecycleAction,
        (this.meta!.settlement_health || "HEALTHY") as SettlementHealth,
      );
      if (!decided.ok) {
        return Response.json({ error: { code: decided.code, message: decided.message } }, { status: decided.http });
      }
      this.meta!.status = decided.status;
      await this.state.storage.put("world_meta", this.meta);
      return Response.json({
        ok: true,
        status: this.meta!.status,
        settlement_health: this.meta!.settlement_health || "HEALTHY",
        reason: body.reason || null,
      });
    }

    if (request.method === "POST" && path.endsWith("/admin-tempo")) {
      const body = (await request.json()) as {
        action?: string;
        mode?: TempoMode;
        reason?: string;
        now?: number;
      };
      await this.load();
      const now = typeof body.now === "number" ? body.now : Date.now();
      const action = String(body.action || "").toLowerCase();
      if (action === "pin") {
        const pinned = pinPlayerTempo(this.world!, {
          mode: body.mode || "OBSERVED_LIVE",
          now,
          reason: body.reason || "admin pin",
          defaultWorldId: this.env.DEFAULT_WORLD_ID,
        });
        if (!pinned.ok) {
          return Response.json({ error: { code: pinned.code, message: pinned.message } }, { status: 409 });
        }
        await this.save();
        await this.scheduleTempoAlarm(now);
        return Response.json({ ok: true, player_tempo: publicTempoProjection(this.world!, now) });
      }
      if (action === "mode") {
        const changed = changeTempoMode(this.world!, {
          mode: body.mode || "OBSERVED_LIVE",
          now,
          reason: body.reason || "",
          defaultWorldId: this.env.DEFAULT_WORLD_ID,
        });
        if (!changed.ok) {
          return Response.json({ error: { code: changed.code, message: changed.message } }, { status: 409 });
        }
        await this.save();
        await this.scheduleTempoAlarm(now);
        return Response.json({ ok: true, player_tempo: publicTempoProjection(this.world!, now) });
      }
      if (action === "step" || action === "batch_close") {
        const trigger = action === "step" ? "OPERATOR_STEP" : "OPERATOR_BATCH_CLOSE";
        const closed = operatorTempoTrigger(this.world!, { trigger, now });
        if (!closed.ok) {
          return Response.json({ error: { code: closed.code, message: closed.message } }, { status: 409 });
        }
        if (closed.should_resolve) {
          const resolved = await runPinnedTempoResolve(
            this.world!,
            async () => true,
            now,
            (events) => this.commitTempoResolution(events),
          );
          if (!resolved.ok) {
            await this.save();
            return Response.json({ error: resolved.result.error }, { status: 409 });
          }
        }
        await this.save();
        await this.scheduleTempoAlarm(now);
        return Response.json({ ok: true, player_tempo: publicTempoProjection(this.world!, now) });
      }
      return Response.json({ error: { code: "INVALID_REQUEST", message: "Unknown tempo admin action." } }, { status: 400 });
    }

    if (request.method === "GET" && path.endsWith("/digests")) {
      await this.load();
      const cfg = await this.loadDigestConfig();
      const history = (await this.state.storage.get<OperatorDigest[]>("digest_history")) || [];
      return Response.json({ ok: true, config: cfg, digests: history.slice(-24).reverse() });
    }

    if (request.method === "POST" && path.endsWith("/digest-config")) {
      const body = (await request.json()) as Partial<DigestConfig>;
      const prev = await this.loadDigestConfig();
      const next: DigestConfig = {
        ...prev,
        enabled: body.enabled ?? prev.enabled,
        cadence: DIGEST_CADENCES.includes(body.cadence as DigestConfig["cadence"])
          ? (body.cadence as DigestConfig["cadence"])
          : prev.cadence,
        depth: body.depth === "BRIEF" || body.depth === "STANDARD" || body.depth === "DETAILED" ? body.depth : prev.depth,
        dashboard: body.dashboard ?? prev.dashboard,
        email: body.email ?? prev.email,
        include_controller_breakdown: body.include_controller_breakdown ?? prev.include_controller_breakdown,
        include_research_notices: body.include_research_notices ?? prev.include_research_notices,
      };
      await this.state.storage.put("digest_config", next);
      return Response.json({ ok: true, config: next, previous: prev });
    }

    if (request.method === "POST" && path.endsWith("/digest-tick")) {
      await this.load();
      const produced = await this.tickDigests(Date.now());
      return Response.json({ ok: true, produced: produced.length, digests: produced });
    }

    // Store preview (does not mutate live world authority)
    if (request.method === "POST" && path.endsWith("/genesis-preview-store")) {
      this.bindAdminGenesisWorld(request);
      await this.loadMeta();
      const body = (await request.json()) as { result: GenesisResult };
      if (!body?.result?.genesis_id) {
        return Response.json({ error: { code: "INVALID_REQUEST", message: "result required" } }, { status: 400 });
      }
      // Load previews map
      this.previews = (await this.state.storage.get<Record<string, GenesisResult>>("genesis_previews")) || {};
      this.previews[body.result.genesis_id] = body.result;
      // Cap preview cache
      const keys = Object.keys(this.previews);
      if (keys.length > 20) {
        for (const k of keys.slice(0, keys.length - 20)) delete this.previews[k];
      }
      await this.state.storage.put("genesis_previews", this.previews);
      // Prove live world unchanged: return digests of world before/after (same object)
      await this.load();
      return Response.json({
        ok: true,
        stored_genesis_id: body.result.genesis_id,
        live_world_id: this.world!.world_id,
        live_sequence: this.world!.sequence,
        live_status: this.meta!.status,
        note: "Preview stored; live world authority unchanged.",
      });
    }

    if (request.method === "GET" && path.endsWith("/genesis-preview-get")) {
      this.bindAdminGenesisWorld(request);
      const gid = url.searchParams.get("genesis_id") || "";
      this.previews = (await this.state.storage.get<Record<string, GenesisResult>>("genesis_previews")) || {};
      const p = this.previews[gid];
      if (!p) return Response.json({ error: { code: "NOT_FOUND", message: "unknown preview" } }, { status: 404 });
      return Response.json({ result: p });
    }

    // Atomic activation
    if (request.method === "POST" && path.endsWith("/genesis-activate")) {
      this.bindAdminGenesisWorld(request);
      await this.loadMeta();
      const body = (await request.json()) as {
        genesis_id: string;
        admin_session_id: string;
        force?: boolean;
        world_id?: string;
      };
      if (!body?.genesis_id) {
        return Response.json({ error: { code: "INVALID_REQUEST", message: "genesis_id required" } }, { status: 400 });
      }
      const envName = (this.env.NOEMA_ENV || "local").toLowerCase();
      const forceSupersede = Boolean(body.force) && envName !== "production";
      if (this.meta!.status === "ACTIVE" && this.meta!.config_frozen && !forceSupersede) {
        return Response.json(
          {
            error: {
              code: "ALREADY_ACTIVATED",
              message:
                "Genesis already activated for this world; new Genesis requires a new world (or force:true on non-production)",
              current_genesis_id: this.meta!.genesis_id,
            },
          },
          { status: 409 },
        );
      }
      if (this.meta!.status === "ACTIVE" && this.meta!.config_frozen && forceSupersede) {
        // Non-production operator supersede of rehearsal/demo activation only
      }
      this.previews = (await this.state.storage.get<Record<string, GenesisResult>>("genesis_previews")) || {};
      const preview = this.previews[body.genesis_id];
      if (!preview) {
        return Response.json({ error: { code: "INVALID_SEED", message: "unknown genesis preview" } }, { status: 400 });
      }
      if (!preview.validation?.ok || !preview.ordinary_world_valid) {
        return Response.json(
          {
            error: {
              code: "VALIDATION_FAILED",
              message: "Cycle 0 validation failed",
              details: preview.validation?.errors || [],
            },
          },
          { status: 400 },
        );
      }
      if (preview.genesis_id === "genesis.ef578f4ffceeccd0" && preview.world_id !== "world.perihelion-reach") {
        return Response.json(
          { error: { code: "INVALID_SEED", message: "frozen genesis cannot activate on another world" } },
          { status: 400 },
        );
      }
      if (body.world_id && preview.world_id !== body.world_id) {
        return Response.json(
          { error: { code: "INVALID_REQUEST", message: "world_id does not match preview" } },
          { status: 400 },
        );
      }

      // Atomic write: world + meta
      const nextWorld = cycle0ToWorld(preview.cycle0);
      const nextMeta: WorldMeta = {
        status: "ACTIVE",
        genesis_id: preview.genesis_id,
        cycle0_digest: preview.cycle0_digest,
        profile_id: preview.genesis_profile_id,
        // Story seeds stored in admin meta only — never in PLAY observations
        story_seed_ids: preview.story_seed_ids,
        world_seed: preview.world_seed,
        config_frozen: true,
        activated_at: new Date().toISOString(),
        do_digest: preview.cycle0_digest,
      };

      const superseded = this.meta!.status === "ACTIVE" && this.meta!.config_frozen && forceSupersede
        ? { previous_genesis_id: this.meta!.genesis_id, previous_digest: this.meta!.cycle0_digest }
        : null;

      this.world = nextWorld;
      this.meta = nextMeta;
      await this.state.storage.put({
        world: nextWorld,
        world_meta: nextMeta,
      });

      const settlement = await settleGenesisActivation(this.env, {
        genesis_id: preview.genesis_id,
        world_id: preview.world_id,
        cycle0_digest: preview.cycle0_digest,
        world_seed: preview.world_seed,
        profile_id: preview.genesis_profile_id,
        story_seed_ids: preview.story_seed_ids,
        admin_session_id: body.admin_session_id || "asess.unknown",
      });

      this.meta.settlement_id = settlement.settlement_id;
      this.meta.settlement_ok = settlement.settled;
      await this.state.storage.put("world_meta", this.meta);

      const digest_match = !settlement.settled || this.meta.do_digest === preview.cycle0_digest;

      return Response.json({
        ok: true,
        result: {
          ...preview,
          status: "ACTIVATED",
          config_frozen: true,
        },
        world: {
          world_id: nextWorld.world_id,
          world_name: nextWorld.world_name,
          cycle: 0,
          sequence: 0,
          entry_room_id: nextWorld.entry_room_id,
          room_count: Object.keys(nextWorld.rooms).length,
        },
        meta: this.publicMeta(),
        superseded,
        settlement: {
          settlement_id: settlement.settlement_id,
          settled: settlement.settled,
          do_digest: this.meta.do_digest,
          cycle0_digest: preview.cycle0_digest,
          digest_match,
          note: settlement.settled
            ? "Postgres settlement recorded"
            : "Settlement soft-failed or unset (SUPABASE_*); DO remains live authority",
        },
        config_frozen: true,
      });
    }

    // Reseed — forbidden when ACTIVE genesis frozen; production blocked at Worker
    if (request.method === "POST" && path.endsWith("/admin-reseed")) {
      await this.loadMeta();
      if (this.meta!.status === "ACTIVE" && this.meta!.config_frozen) {
        return Response.json(
          { error: { code: "POLICY_DENIED", message: "reseed forbidden after Genesis activation" } },
          { status: 403 },
        );
      }
      const world_id = this.env.DEFAULT_WORLD_ID || "world-01";
      this.world = demoState(world_id);
      this.meta = { status: "DEMO_SEED", config_frozen: false };
      await this.state.storage.put({ world: this.world, world_meta: this.meta });
      return Response.json({
        ok: true,
        world_id: this.world.world_id,
        cycle: this.world.cycle,
        sequence: this.world.sequence,
        room_count: Object.keys(this.world.rooms).length,
        note: "Demo chamber restored. Not a Genesis activation.",
      });
    }

    if (request.method !== "POST") {
      return Response.json({ error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } }, { status: 405 });
    }

    const body = (await request.json()) as {
      principal: PlayerPrincipal;
      envelope: CommandEnvelope;
      world_id?: string;
      allow_bootstrap?: boolean;
    };
    if (!body?.principal?.player_id || !body?.envelope?.command) {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "principal and envelope required" } },
        { status: 400 },
      );
    }

    const agent = requireAgentPlayer(body.principal);
    if (agent instanceof Response) return agent;

    // Consult the player ledger for liveness. Missing records are created only by
    // ENTER_WORLD below, never as a side effect of LOOK or another action.
    await this.load();
    let playerRec = this.world?.players?.[agent.player_id];
    const lifecycle = playerRec?.lifecycle_status || "ACTIVE";
    if (lifecycle !== "ACTIVE") {
      return Response.json({
        ok: false,
        request_id: body.envelope?.request_id || "unknown",
        error: { code: "PLAYER_UNAVAILABLE", message: "This Player is no longer active." }
      }, { status: 403 });
    }

    const headerWorld = url.searchParams.get("world_id") || request.headers.get("x-noema-world-id");
    const requested = String(body.world_id || headerWorld || "").trim();
    const admitted = admitTestWorldId(requested, this.env.DEFAULT_WORLD_ID);
    this.requestedWorldId = admitted.ok ? admitted.world_id : null;
    this.allowCanonicalBootstrap = admitted.ok && body.allow_bootstrap === true;
    // Preview health/store may bind a successor id on this isolate. PLAY must
    // not keep that in-memory world; reload from storage / DEFAULT_WORLD_ID.
    if (!admitted.ok) {
      this.world = null;
      this.meta = null;
    }

    try {
      const result = await this.applyCommand(agent, body.envelope);
      return Response.json(result, { status: commandResultHttpStatus(result) });
    } catch (e) {
      console.error("do/command", e instanceof Error ? e.stack || e.message : e);
      return Response.json({
        ok: false,
        request_id: body.envelope?.request_id || "unknown",
        error: { code: "COMMAND_FAILED", message: "The world could not apply that action." },
      });
    }
  }

  private publicMeta(): Record<string, unknown> {
    const m = this.meta!;
    return {
      status: m.status,
      genesis_id: m.genesis_id || null,
      cycle0_digest: m.cycle0_digest || null,
      profile_id: m.profile_id || null,
      // story seeds only for admin meta path — included here but admin UI must not leak to product
      story_seed_ids: m.story_seed_ids || null,
      world_seed: m.world_seed || null,
      config_frozen: m.config_frozen,
      activated_at: m.activated_at || null,
      settlement_id: m.settlement_id || null,
      settlement_ok: m.settlement_ok ?? null,
      settlement_health: m.settlement_health || "HEALTHY",
      do_digest: m.do_digest || null,
      revision: m.revision ?? null,
    };
  }

  private async loadMeta(): Promise<void> {
    if (this.meta) return;
    const stored = await this.state.storage.get<WorldMeta>("world_meta");
    this.meta = stored || { status: "DEMO_SEED", config_frozen: false };
  }

  private async load(): Promise<void> {
    await this.loadMeta();
    if (!this.world) {
      const stored = await this.state.storage.get<WorldState>("world");
      const worldId = resolveLoadWorldId(this.requestedWorldId, this.env.DEFAULT_WORLD_ID);
      if (shouldRestoreFromHead(stored)) {
        const head = await getWorldHead(this.env, worldId);
        this.world = worldFromHead(head, bootstrapWorldState(worldId));
      } else {
        this.world = stored || bootstrapWorldState(worldId);
      }
      // migrate old states without entry_room_id / budgets / entity runtime fields
      if (!this.world.entry_room_id) {
        this.world.entry_room_id = admitTestWorldId(worldId).ok
          ? MINI_ENTRY_ROOM_ID
          : "room.relay-quarter";
      }
      migrateWorldRuntime(this.world);
    } else {
      migrateWorldRuntime(this.world);
    }
    const filledHarvest = ensureSuccessorMaterialsCache(this.world);
    if (expireStalePresence(this.world.players) || filledHarvest) {
      await this.save();
    }
  }

  private dropDisposableSystemActors(): number {
    if (!this.world?.players) return 0;
    let n = 0;
    for (const [id, p] of Object.entries(this.world.players)) {
      const handle = String(p.handle || "");
      if (/^(reach-maint|tester)/i.test(handle)) continue;
      if (p.actor_kind !== "system") continue;
      delete this.world.players[id];
      n += 1;
    }
    if (Array.isArray(this.world.messages) && this.world.messages.length > 20) {
      this.world.messages = this.world.messages.slice(-20);
    }
    this.world.seen_idempotency = {};
    this.world.trades = {};
    return n;
  }

  private async save(): Promise<boolean> {
    if (!this.world) return true;
    const put = () => this.state.storage.put("world", this.world);
    try {
      await put();
      return true;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("TOOBIG")) throw e;
      const dropped = this.dropDisposableSystemActors();
      const bytes = JSON.stringify(this.world).length;
      console.error("save TOOBIG; dropped disposable system actors", dropped, "bytes", bytes);
      try {
        await put();
        return true;
      } catch (e2) {
        const msg2 = e2 instanceof Error ? e2.message : String(e2);
        if (!msg2.includes("TOOBIG")) throw e2;
        console.error("save still TOOBIG after compact", "bytes", bytes);
        return false;
      }
    }
  }

  private async applyCommand(principal: PlayerPrincipal, envl: CommandEnvelope): Promise<CommandResult> {
    await this.load();
    evictLeftoverHumanOccupancy(this.world!, principal.player_id);
    const mutating = isMutatingCommand(commandForOps(envl.command, envl.arguments));
    const health = this.meta!.settlement_health || "HEALTHY";
    if (mutating && this.env.SUPABASE_URL && this.env.SUPABASE_SERVICE_ROLE_KEY) {
      const durable = await getWorldHead(this.env, this.world!.world_id);
      if (durable && typeof durable.revision === "number") {
        const durableRev = durable.revision;
        const localRev = this.meta!.revision ?? 0;
        const gate = checkExpectedHead(localRev, {
          world_id: this.world!.world_id,
          revision: durableRev,
          sequence: durable.sequence,
          cycle: durable.cycle,
          writer_generation: durable.writer_generation,
        }, this.meta!.writer_generation || "do.1");
        if (!gate.ok) {
          this.world = worldFromHead(durable, this.world!);
          migrateWorldRuntime(this.world);
          this.meta!.revision = durableRev;
          await this.save();
        }
      }
    }
    const w = this.world!;
    const replayKey = envl.idempotency_key || envl.request_id;
    const idempotentReplay = Boolean(
      replayKey && w.seen_idempotency?.[`${principal.player_id}::${replayKey}`],
    );
    if (mutating) {
      const gate = mutationBlocked(this.meta!.status, health);
      if (gate) {
        return {
          ok: false,
          request_id: envl.request_id || "unknown",
          error: { code: gate.code, message: gate.message },
        };
      }
      const player = w.players[principal.player_id];
      const session = applyControllingSession(player?.controlling_session_id, principal.session_id, true);
      if (player) player.controlling_session_id = session.session_id;
    }

    if (mutating && w.unsettled?.length) {
      // Pre-canonical candidates have no revision/digest lineage and cannot be
      // folded into the atomic settlement contract.  Do not turn DO-local
      // history into canonical facts by replaying it through the legacy sink.
      if (this.env.SUPABASE_URL && this.env.SUPABASE_SERVICE_ROLE_KEY) {
        this.meta!.status = "INCIDENT";
        this.meta!.settlement_health = "BLOCKING";
        await this.state.storage.put("world_meta", this.meta);
        return {
          ok: false,
          request_id: envl.request_id || "unknown",
          error: { code: "UNMIGRATED_UNSETTLED_HISTORY", message: "operator snapshot import is required before canonical mutation" },
        };
      }
      w.unsettled = await replayUnsettled(this.env, w.world_id, w.unsettled);
    }

    // Reducers may mutate only behind a durable commit.  Preserve the precise
    // pre-command state so an RPC rejection cannot become DO-only truth.
    const before = structuredClone(w);
    let result: CommandResult;
    try {
      result = await applyWorldCommand(w, principal, envl, async (ev) => {
        // applyWorldCommand emits candidates one-by-one.  They are collected in
        // result.events and committed as one batch below, after the final state
        // is known.  Never write a candidate separately here.
        void ev;
        return true;
      }, {
        now: Date.now(),
        worldPaused: this.meta!.status === "PAUSED",
      });
    } catch (e) {
      console.error("applyWorldCommand", e instanceof Error ? e.stack || e.message : e);
      this.world = before;
      const code = isUsableLiveWorld(w) ? "COMMAND_FAILED" : "WORLD_NOT_READY";
      const message =
        code === "WORLD_NOT_READY"
          ? "The world has no playable location yet."
          : "The world could not apply that action.";
      return {
        ok: false,
        request_id: envl.request_id || "unknown",
        error: { code, message },
        observation: {
          cycle: w.cycle || 0,
          sequence: w.sequence || 0,
          world_name: w.world_name || w.world_id || "Unknown World",
          player_id: principal.player_id,
          in_world: false,
          available_actions: [],
          consequence: message,
        },
      };
    }
    if (mutating && w.players[principal.player_id]) {
      w.players[principal.player_id].controlling_session_id = principal.session_id;
    }
    const ledgerEvents = canonicalEventsForCommit(result.events);
    if (mutating && result.ok && ledgerEvents.length && this.env.SUPABASE_URL && this.env.SUPABASE_SERVICE_ROLE_KEY) {
      const durable = await getWorldHead(this.env, w.world_id);
      // Fail closed: a missing durable head must never auto-bootstrap the
      // production world (a Postgres outage/restore window would otherwise
      // re-emit a sequence-0 WORLD_BOOTSTRAP over live history). Bootstrapping
      // requires the explicit per-request admit (isolated worlds) or the
      // operator env latch set only for a genesis activation window.
      const operatorLatch =
        (this.env as { NOEMA_ALLOW_PROD_BOOTSTRAP?: string }).NOEMA_ALLOW_PROD_BOOTSTRAP === "1";
      const bootstrapEmpty = !durable && (this.allowCanonicalBootstrap || operatorLatch);
      const toCommit = bootstrapEmpty
        ? withIsolatedBootstrapEvent(ledgerEvents, w.world_id, this.meta!.genesis_id)
        : ledgerEvents;
      const committed = await commitCanonicalSettlement(this.env, {
        settlement_id: `settlement.${toCommit.map((event) => event.event_id).join(".")}`,
        expected_revision: this.meta!.revision ?? 0,
        writer_generation: this.meta!.writer_generation || "do.1",
        genesis_id: this.meta!.genesis_id || null,
        status: this.meta!.status,
        settlement_health: "HEALTHY",
        world: w,
        principal,
        events: toCommit,
        previous_digest: durable?.ledger_head_digest ?? null,
        allow_bootstrap: bootstrapEmpty,
      });
      if (!committed.ok) {
        // Soft-restore sequence drift (PR #363). Contention races stay ACTIVE with resync.
        // Other durable failures still INCIDENT via resolveSoftSettlementFailure.
        if (isContentionSettlementFail(committed.code)) {
          const head = await getWorldHead(this.env, w.world_id);
          if (head && typeof head.revision === "number") {
            this.world = worldFromHead(head, before);
            migrateWorldRuntime(this.world);
            this.meta!.revision = head.revision;
          } else {
            this.world = before;
          }
          // Prefer SETTLEMENT_RESYNC for sequence-class soft codes; else race message.
          const soft = await resolveSoftSettlementFailure({
            code: committed.code,
            before: this.world,
            request_id: envl.request_id || "unknown",
            getHead: (worldId) => getWorldHead(this.env, worldId),
            writer_generation: this.meta!.writer_generation || "do.1",
          });
          if (soft.mode === "soft_restore") {
            this.world = soft.world || this.world;
            this.meta!.settlement_ok = soft.metaPatch.settlement_ok;
            this.meta!.settlement_health = soft.metaPatch.settlement_health;
            this.meta!.status = soft.metaPatch.status;
            if (typeof soft.metaPatch.revision === "number") {
              this.meta!.revision = soft.metaPatch.revision;
            }
            await this.state.storage.put("world_meta", this.meta);
            await this.save();
            return soft.result;
          }
          // Contention without soft code: no INCIDENT, ask retry
          this.meta!.settlement_ok = true;
          this.meta!.settlement_health = "HEALTHY";
          this.meta!.status = "ACTIVE";
          await this.state.storage.put("world_meta", this.meta);
          await this.save();
          return {
            ok: false,
            request_id: envl.request_id || "unknown",
            error: {
              code: committed.code,
              message: "That action lost the settlement race. Observe and try again.",
            },
          };
        }
        const soft = await resolveSoftSettlementFailure({
          code: committed.code,
          before,
          request_id: envl.request_id || "unknown",
          getHead: (worldId) => getWorldHead(this.env, worldId),
          writer_generation: this.meta!.writer_generation || "do.1",
        });
        this.world = soft.world || before;
        this.meta!.settlement_ok = soft.metaPatch.settlement_ok;
        this.meta!.settlement_health = soft.metaPatch.settlement_health;
        this.meta!.status = soft.metaPatch.status;
        if (typeof soft.metaPatch.revision === "number") {
          this.meta!.revision = soft.metaPatch.revision;
        } else if (soft.mode === "incident") {
          this.meta!.settlement_health = nextSettlementHealth(health, false);
        }
        await this.state.storage.put("world_meta", this.meta);
        await this.save();
        return soft.result;
      }
      this.meta!.revision = committed.revision;
      this.meta!.settlement_ok = true;
      this.meta!.settlement_health = "HEALTHY";
      await this.state.storage.put("world_meta", this.meta);
    }
    if (result.ok && result.events?.length && !idempotentReplay) {
      await this.recordDigestEvents(principal, result.events, w.cycle);
    }
    if (result.ok) {
      const actor = w.players[principal.player_id];
      if (actor) {
        if (principal.controller_type) actor.controller_type = principal.controller_type;
        const oid = parseOperatorId(principal.operator_id);
        if (oid) actor.operator_id = oid;
      }
    }
    if (
      result.ok &&
      !idempotentReplay &&
      inferActorKind(principal.player_id, w.players[principal.player_id]?.actor_kind) === "system"
    ) {
      await this.recordOperatorWatch(principal, envl, result);
    }
    const keys = Object.keys(w.seen_idempotency || {});
    if (keys.length > 200) {
      for (const k of keys.slice(0, keys.length - 200)) delete w.seen_idempotency[k];
    }
    const persisted = await this.save();
    if (mutating && !persisted) {
      return {
        ok: false,
        request_id: envl.request_id || "unknown",
        error: { code: "COMMAND_FAILED", message: "The world could not persist that action." },
      };
    }
    await this.scheduleTempoAlarm(Date.now());
    return result;
  }

  private async scheduleTempoAlarm(now: number): Promise<void> {
    if (!this.world || !isPlayerTempoPinned(this.world)) return;
    const next = nextTempoAlarmAt(this.world.player_tempo, now);
    if (next == null) {
      await this.state.storage.deleteAlarm();
      return;
    }
    await this.state.storage.setAlarm(next);
  }

  private async commitTempoResolution(events: NonNullable<CommandResult["events"]>): Promise<boolean> {
    const ledgerEvents = canonicalEventsForCommit(events);
    if (!ledgerEvents.length || !this.env.SUPABASE_URL || !this.env.SUPABASE_SERVICE_ROLE_KEY) return true;
    const durable = await getWorldHead(this.env, this.world!.world_id);
    const operatorLatch =
      (this.env as { NOEMA_ALLOW_PROD_BOOTSTRAP?: string }).NOEMA_ALLOW_PROD_BOOTSTRAP === "1";
    const bootstrapEmpty = !durable && (this.allowCanonicalBootstrap || operatorLatch);
    const toCommit = bootstrapEmpty
      ? withIsolatedBootstrapEvent(ledgerEvents, this.world!.world_id, this.meta!.genesis_id)
      : ledgerEvents;
    const principal: PlayerPrincipal = {
      player_id: "player.system-tempo",
      agent_id: "agent.system-tempo",
      session_id: "sess.system-tempo",
      controller_id: "ctrl.system-tempo",
      controller_type: "agent",
      scopes: ["noema.world.observe"],
      protocol_version: "1",
      authentication_context: "tempo-alarm",
    };
    const committed = await commitCanonicalSettlement(this.env, {
      settlement_id: `settlement.${toCommit.map((event) => event.event_id).join(".")}`,
      expected_revision: this.meta!.revision ?? 0,
      writer_generation: this.meta!.writer_generation || "do.1",
      genesis_id: this.meta!.genesis_id || null,
      status: this.meta!.status,
      settlement_health: "HEALTHY",
      world: this.world!,
      principal,
      events: toCommit,
      previous_digest: durable?.ledger_head_digest ?? null,
      allow_bootstrap: bootstrapEmpty,
    });
    if (!committed.ok) {
      this.meta!.settlement_ok = false;
      this.meta!.settlement_health = "BLOCKING";
      this.meta!.status = "INCIDENT";
      await this.state.storage.put("world_meta", this.meta);
      return false;
    }
    this.meta!.revision = committed.revision;
    this.meta!.settlement_ok = true;
    this.meta!.settlement_health = "HEALTHY";
    await this.state.storage.put("world_meta", this.meta);
    return true;
  }

  async alarm(): Promise<void> {
    await this.load();
    if (!this.world || !isPlayerTempoPinned(this.world)) return;
    const now = Date.now();
    const adv = advanceTempoAdmissionClock(this.world, now);
    if (adv.should_resolve) {
      const resolved = await runPinnedTempoResolve(
        this.world,
        async () => true,
        now,
        (events) => this.commitTempoResolution(events),
      );
      if (!resolved.ok) {
        await this.save();
        await this.scheduleTempoAlarm(now);
        return;
      }
      if (resolved.events.length) {
        const actor: PlayerPrincipal = {
          player_id: "player.system-tempo",
          agent_id: "agent.system-tempo",
          session_id: "sess.system-tempo",
          controller_id: "ctrl.system-tempo",
          controller_type: "agent",
          scopes: ["noema.world.observe"],
          protocol_version: "1",
          authentication_context: "tempo-alarm",
        };
        await this.recordDigestEvents(actor, resolved.events, this.world.cycle);
      }
    }
    await this.save();
    await this.scheduleTempoAlarm(now);
  }

  private async loadDigestConfig(): Promise<DigestConfig> {
    return (await this.state.storage.get<DigestConfig>("digest_config")) || { ...DEFAULT_DIGEST_CONFIG };
  }

  private async recordDigestEvents(
    principal: PlayerPrincipal,
    events: NonNullable<CommandResult["events"]>,
    cycle: number,
  ): Promise<void> {
    const handle = this.world?.players[principal.player_id]?.handle;
    const now = Date.now();
    const fallbackRoom = this.world?.rooms[this.world.players[principal.player_id]?.room_id || ""]?.name;
    const rows: DigestEvent[] = events.map((ev) => {
      const payloadRoom =
        typeof ev.payload?.room_id === "string" ? this.world?.rooms[ev.payload.room_id]?.name : undefined;
      return {
        event_id: ev.event_id,
        event_type: ev.event_type,
        sequence: ev.sequence,
        cycle,
        player_id: principal.player_id,
        handle,
        at: now,
        payload: { ...(ev.payload || {}), room_name: payloadRoom || fallbackRoom },
      };
    });
    const prev = (await this.state.storage.get<DigestEvent[]>("digest_events")) || [];
    const next = [...prev, ...rows];
    await this.state.storage.put("digest_events", next.slice(-2000));
  }

  private async recordOperatorWatch(
    principal: PlayerPrincipal,
    envl: CommandEnvelope,
    result: CommandResult,
  ): Promise<void> {
    const player = this.world?.players[principal.player_id];
    const roomId = player?.room_id;
    const room = roomId ? this.world?.rooms[roomId] : undefined;
    const phrased = lineFromObservation({
      command: commandForOps(envl.command, envl.arguments),
      consequence: result.observation?.consequence,
      location: result.observation?.location,
      situation: result.observation?.situation,
    });
    const prev = (await this.state.storage.get<OperatorWatchLine[]>("operator_watch_lines")) || [];
    const next = appendOperatorWatchLine(prev, {
      at: Date.now(),
      handle: player?.handle || principal.player_id.replace(/^player\./, ""),
      room_id: room && !isHiddenRoom(room) ? room.room_id : undefined,
      room_name: room && !isHiddenRoom(room) ? room.name : undefined,
      command: phrased.command,
      line: phrased.line,
      glyph: phrased.glyph,
      operator_id: parseOperatorId(principal.operator_id) || parseOperatorId(player?.operator_id),
    });
    await this.state.storage.put("operator_watch_lines", next);
  }

  private async tickDigests(now: number): Promise<OperatorDigest[]> {
    const cfg = await this.loadDigestConfig();
    if (!cfg.enabled || cfg.cadence === "OFF" || this.meta?.status === "ARCHIVED") return [];
    const lastEnd = (await this.state.storage.get<number>("digest_last_end")) || now - CADENCE_MS[cfg.cadence];
    const windows = nextWindows(lastEnd, cfg.cadence, now);
    if (!windows.length) return [];
    const events = (await this.state.storage.get<DigestEvent[]>("digest_events")) || [];
    const w = this.world!;
    const snap = {
      world_id: w.world_id,
      world_name: w.world_name,
      world_status: this.meta!.status,
      settlement_health: this.meta!.settlement_health || "HEALTHY",
      players_present: countLivePlayers(w.players),
      open_trades: Object.values(w.trades || {}).filter((t) => t.status === "OPEN").length,
    };
    const history = (await this.state.storage.get<OperatorDigest[]>("digest_history")) || [];
    const produced: OperatorDigest[] = [];
    for (const win of windows) {
      produced.push(composeDigest(events, snap, cfg, win));
    }
    const nextHist = [...history, ...produced].slice(-24);
    await this.state.storage.put({
      digest_history: nextHist,
      digest_last_end: windows[windows.length - 1].end,
    });
    return produced;
  }
}
