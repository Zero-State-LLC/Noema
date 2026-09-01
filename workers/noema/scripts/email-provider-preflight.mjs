#!/usr/bin/env node
/**
 * Read-only Resend production preflight.
 *
 * Verifies that the configured sender belongs to a verified Resend domain.
 * It never calls the email-send endpoint and never prints credentials.
 */
import { pathToFileURL } from "node:url";

const DOMAINS_URL = "https://api.resend.com/domains";

export function senderDomain(fromEmail) {
  const value = String(fromEmail || "").trim().toLowerCase();
  const match = value.match(/^[^@\s]+@([^@\s]+)$/);
  return match?.[1] || "";
}

export function evaluateDomainStatus(body, expectedDomain) {
  const rows = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const row = rows.find((candidate) =>
    String(candidate?.name || "").trim().toLowerCase() === expectedDomain,
  );
  const status = String(row?.status || "").trim().toLowerCase();
  return {
    ok: Boolean(row) && status === "verified",
    domain: expectedDomain,
    present: Boolean(row),
    status: status || null,
  };
}

export async function runEmailProviderPreflight({ env = process.env, fetchImpl = fetch } = {}) {
  const key = env.RESEND_API_KEY || "";
  const domain = senderDomain(env.RESEND_FROM_EMAIL);
  if (!key || !domain) {
    return {
      ok: false,
      code: "UNCONFIGURED",
      message: "Set RESEND_API_KEY and RESEND_FROM_EMAIL as protected production secrets.",
    };
  }

  const response = await fetchImpl(DOMAINS_URL, {
    method: "GET",
    headers: { authorization: `Bearer ${key}`, accept: "application/json" },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }
  const result = evaluateDomainStatus(body, domain);
  return { ...result, http: response.status, read_only: true, sends_email: false };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runEmailProviderPreflight();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.ok ? 0 : 1);
}
