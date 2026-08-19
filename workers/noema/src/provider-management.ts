import type { Env } from "./types";

const RESEND_DOMAINS_URL = "https://api.resend.com/domains";

export interface ProviderStatus {
  configured: boolean;
  healthy: boolean | null;
  message: string;
  details: Record<string, unknown>;
}

function projectRef(url?: string): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".supabase.co") ? host.slice(0, -".supabase.co".length) : null;
  } catch {
    return null;
  }
}

function safeMessage(value: unknown): string {
  return value instanceof Error ? value.message.slice(0, 240) : "provider request failed";
}

async function responseJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>;
}

export function providerConfiguration(env: Env) {
  return {
    supabase: {
      url: Boolean(env.SUPABASE_URL),
      service_role: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      management_token: Boolean(env.SUPABASE_ACCESS_TOKEN),
      project_ref: env.SUPABASE_PROJECT_REF || projectRef(env.SUPABASE_URL) || null,
    },
    resend: {
      api_key: Boolean(env.RESEND_API_KEY),
      from_email: env.RESEND_FROM_EMAIL || null,
      priority: "primary",
    },
    capabilities: {
      inspect: true,
      send_controlled_test: Boolean(env.RESEND_API_KEY),
      apply_fixed_supabase_checks: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
      rotate_credentials: false,
    },
  };
}

export async function verifyResend(env: Env, fetchImpl: typeof fetch = fetch): Promise<ProviderStatus> {
  if (!env.RESEND_API_KEY) {
    return { configured: false, healthy: false, message: "RESEND_API_KEY not configured", details: {} };
  }
  try {
    const res = await fetchImpl(RESEND_DOMAINS_URL, {
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, accept: "application/json" },
    });
    const payload = await responseJson(res);
    const domains = Array.isArray(payload.data) ? payload.data as Array<Record<string, unknown>> : [];
    const domain = domains.find((item) => item.name === "noema.guru") || null;
    const healthy = res.ok && domain?.status === "verified";
    return {
      configured: true,
      healthy,
      message: healthy ? "Resend API and noema.guru domain are verified" : "Resend verification failed",
      details: {
        status: res.status,
        domain_present: Boolean(domain),
        domain_status: domain?.status ?? null,
        region: domain?.region ?? null,
        priority: "primary",
      },
    };
  } catch (error) {
    return { configured: true, healthy: false, message: safeMessage(error), details: {} };
  }
}

export async function verifySupabase(env: Env, fetchImpl: typeof fetch = fetch): Promise<ProviderStatus> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return { configured: false, healthy: false, message: "SUPABASE_URL or service role key not configured", details: {} };
  }
  const canonicalWorldId = env.SUPABASE_CANONICAL_WORLD_ID || "world.perihelion-reach";
  const url = `${env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/noema_world_heads?world_id=eq.${encodeURIComponent(canonicalWorldId)}&select=world_id,revision,writer_generation,sequence,state_digest,settlement_health&limit=1`;
  try {
    const res = await fetchImpl(url, {
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE_KEY,
        authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        accept: "application/json",
      },
    });
    const rows = (await res.json().catch(() => [])) as unknown;
    const row = Array.isArray(rows) && rows[0] && typeof rows[0] === "object" ? rows[0] as Record<string, unknown> : null;
    const healthy = res.ok && Boolean(row) && row?.world_id === canonicalWorldId &&
      row?.settlement_health === "HEALTHY" && typeof row?.state_digest === "string";
    return {
      configured: true,
      healthy,
      message: healthy ? "Canonical settlement head is present and healthy" : "Canonical settlement verification failed",
      details: {
        status: res.status,
        project_ref: env.SUPABASE_PROJECT_REF || projectRef(env.SUPABASE_URL),
        expected_world_id: canonicalWorldId,
        head_present: Boolean(row),
        world_id: row?.world_id ?? null,
        revision: row?.revision ?? null,
        writer_generation: row?.writer_generation ?? null,
        sequence: row?.sequence ?? null,
        state_digest: row?.state_digest ?? null,
        settlement_health: row?.settlement_health ?? null,
      },
    };
  } catch (error) {
    return { configured: true, healthy: false, message: safeMessage(error), details: {} };
  }
}

export async function providerOverview(env: Env, fetchImpl: typeof fetch = fetch) {
  const [supabase, resend] = await Promise.all([
    verifySupabase(env, fetchImpl),
    verifyResend(env, fetchImpl),
  ]);
  return {
    configuration: providerConfiguration(env),
    providers: { supabase, resend },
    ready_for_deploy: supabase.healthy === true && resend.healthy === true,
    secrets_exposed: false,
  };
}
