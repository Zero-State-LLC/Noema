import { enrichEntity } from "./actions";
import type { Cycle0World, GenesisResult, GenesisRoom } from "./genesis";
import { redactedPublicWorld } from "./genesis";
import {
  applyControllingSession,
  commandForOps,
  countLivePlayers,
  expireStalePresence,
  listLivePlayers,
  listSystemActors,
  isMutatingCommand,
  mutationBlocked,
  nextSettlementHealth,
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
import { settleEvent, settleGenesisActivation } from "./settle";
import type { CommandEnvelope, CommandResult, Env, PlayerPrincipal } from "./types";
import {
  applyWorldCommand,
  buildObservation,
  migrateWorldRuntime,
  type RoomState,
  type WorldRuntime,
} from "./world-actions";

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

function cycle0ToWorld(c0: Cycle0World): WorldState {
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
  return {
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
}

export class NoemaWorldDO {
  private state: DurableObjectState;
  private env: Env;
  private world: WorldState | null = null;
  private meta: WorldMeta | null = null;
  private previews: Record<string, GenesisResult> = {};

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "GET" && path.endsWith("/health")) {
      await this.load();
      return Response.json({
        ok: true,
        world_id: this.world!.world_id,
        cycle: this.world!.cycle,
        sequence: this.world!.sequence,
        players: countLivePlayers(this.world!.players),
        status: this.meta!.status,
        settlement_health: this.meta!.settlement_health || "HEALTHY",
        genesis_id: this.meta!.genesis_id || null,
      });
    }

    if (request.method === "GET" && path.endsWith("/watch")) {
      await this.load();
      const marker =
        this.meta!.status === "PAUSED"
          ? "maintenance"
          : this.meta!.status === "INCIDENT"
            ? "incident"
            : this.meta!.settlement_health === "DEGRADED" || this.meta!.settlement_health === "BLOCKING"
              ? "stale"
              : undefined;
      return Response.json(
        redactedPublicWorld({
          world_id: this.world!.world_id,
          cycle: this.world!.cycle,
          sequence: this.world!.sequence,
          rooms: this.world!.rooms as Record<string, GenesisRoom>,
          players_present: countLivePlayers(this.world!.players),
          world_status: this.meta!.status,
          freshness: marker,
        }),
      );
    }

    if (request.method === "GET" && path.endsWith("/admin-status")) {
      await this.load();
      const roomList = Object.values(this.world!.rooms);
      return Response.json({
        world_id: this.world!.world_id,
        world_name: this.world!.world_name,
        cycle: this.world!.cycle,
        sequence: this.world!.sequence,
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
        meta: this.publicMeta(),
        preview_count: Object.keys(this.previews).length,
      });
    }

    if (request.method === "POST" && path.endsWith("/admin-lifecycle")) {
      await this.load();
      const body = (await request.json()) as { action?: string; reason?: string };
      const action = String(body.action || "").toLowerCase();
      const current = this.meta!.status;
      if (action === "pause") {
        if (current !== "ACTIVE" && current !== "PAUSED") {
          return Response.json(
            { error: { code: "INVALID_STATE", message: `cannot pause from ${current}` } },
            { status: 409 },
          );
        }
        this.meta!.status = "PAUSED";
      } else if (action === "resume") {
        if (current !== "PAUSED") {
          return Response.json(
            { error: { code: "INVALID_STATE", message: `cannot resume from ${current}` } },
            { status: 409 },
          );
        }
        if ((this.meta!.settlement_health || "HEALTHY") === "BLOCKING") {
          return Response.json(
            { error: { code: "RECOVERY_REQUIRED", message: "settlement must recover before resume" } },
            { status: 409 },
          );
        }
        this.meta!.status = "ACTIVE";
      } else if (action === "incident") {
        this.meta!.status = "INCIDENT";
      } else {
        return Response.json({ error: { code: "INVALID_REQUEST", message: "action=pause|resume|incident" } }, { status: 400 });
      }
      await this.state.storage.put("world_meta", this.meta);
      return Response.json({
        ok: true,
        status: this.meta!.status,
        settlement_health: this.meta!.settlement_health || "HEALTHY",
        reason: body.reason || null,
      });
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
      const gid = url.searchParams.get("genesis_id") || "";
      this.previews = (await this.state.storage.get<Record<string, GenesisResult>>("genesis_previews")) || {};
      const p = this.previews[gid];
      if (!p) return Response.json({ error: { code: "NOT_FOUND", message: "unknown preview" } }, { status: 404 });
      return Response.json({ result: p });
    }

    // Atomic activation
    if (request.method === "POST" && path.endsWith("/genesis-activate")) {
      await this.loadMeta();
      const body = (await request.json()) as {
        genesis_id: string;
        admin_session_id: string;
        force?: boolean;
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
    };
    if (!body?.principal?.player_id || !body?.envelope?.command) {
      return Response.json(
        { error: { code: "INVALID_REQUEST", message: "principal and envelope required" } },
        { status: 400 },
      );
    }

    const result = await this.applyCommand(body.principal, body.envelope);
    return Response.json(result, { status: result.ok ? 200 : 400 });
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
      this.world = stored || demoState(this.env.DEFAULT_WORLD_ID || "world-01");
      // migrate old states without entry_room_id / budgets / entity runtime fields
      if (!this.world.entry_room_id) this.world.entry_room_id = "room.relay-quarter";
      migrateWorldRuntime(this.world);
    }
    if (expireStalePresence(this.world.players)) {
      await this.save();
    }
  }

  private async save(): Promise<void> {
    if (this.world) await this.state.storage.put("world", this.world);
  }

  private async applyCommand(principal: PlayerPrincipal, envl: CommandEnvelope): Promise<CommandResult> {
    await this.load();
    const w = this.world!;
    const mutating = isMutatingCommand(commandForOps(envl.command, envl.arguments));
    const health = this.meta!.settlement_health || "HEALTHY";
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

    let settleOk = true;
    const result = await applyWorldCommand(w, principal, envl, async (ev) => {
      const ok = await settleEvent(this.env, principal, {
        event_id: ev.event_id,
        event_type: ev.event_type,
        sequence: ev.sequence,
        cycle: w.cycle,
        world_id: w.world_id,
        player_id: principal.player_id,
        controller_id: principal.controller_id,
        session_id: principal.session_id,
        payload: ev.payload,
      });
      if (!ok && this.env.SUPABASE_URL && this.env.SUPABASE_SERVICE_ROLE_KEY) settleOk = false;
      return ok;
    });
    if (mutating && w.players[principal.player_id]) {
      w.players[principal.player_id].controlling_session_id = principal.session_id;
    }
    if (mutating && this.env.SUPABASE_URL && this.env.SUPABASE_SERVICE_ROLE_KEY) {
      const next = nextSettlementHealth(health, settleOk);
      this.meta!.settlement_health = next;
      this.meta!.settlement_ok = settleOk;
      if (next === "BLOCKING") this.meta!.status = "INCIDENT";
      await this.state.storage.put("world_meta", this.meta);
    }
    if (result.ok && result.events?.length) {
      await this.recordDigestEvents(principal, result.events, w.cycle);
    }
    const keys = Object.keys(w.seen_idempotency);
    if (keys.length > 200) {
      for (const k of keys.slice(0, keys.length - 200)) delete w.seen_idempotency[k];
    }
    await this.save();
    return result;
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
