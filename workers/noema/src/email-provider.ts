import { sendPostmarkEmail } from "./postmark";
import { sendResendEmail } from "./resend";
import type { Env } from "./types";

export type TransactionalMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: "play-magic-link" | "admin-magic-link" | "agent-bootstrap";
};

export type EmailProvider = "resend" | "postmark";

/**
 * RFC-0032, as amended: Resend is the preferred Worker-composed adapter and
 * Postmark is the standby. Either alone is enough to attempt a send, so callers
 * gate on this rather than on one provider's key.
 */
export function hasTransactionalProvider(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY || env.POSTMARK_SERVER_TOKEN);
}

export async function sendTransactionalEmail(
  env: Env,
  mail: TransactionalMail,
  fetchImpl: typeof fetch = fetch,
): Promise<{ provider: EmailProvider; messageId: string }> {
  if (!hasTransactionalProvider(env)) throw new Error("no transactional email provider configured");
  let first: unknown = null;
  if (env.RESEND_API_KEY) {
    try {
      return { provider: "resend", messageId: await sendResendEmail(env, mail, fetchImpl) };
    } catch (e) {
      // Hold the preferred provider's failure. If the standby is not configured
      // it is the more useful error to surface, so callers keep seeing what they
      // saw before Postmark existed.
      first = e;
      if (!env.POSTMARK_SERVER_TOKEN) throw e;
      console.error("resend delivery failed; trying postmark standby", e instanceof Error ? e.message : "error");
    }
  }
  if (env.POSTMARK_SERVER_TOKEN) {
    try {
      return { provider: "postmark", messageId: await sendPostmarkEmail(env, mail, fetchImpl) };
    } catch (e) {
      if (first) {
        const a = first instanceof Error ? first.message : "error";
        const b = e instanceof Error ? e.message : "error";
        throw new Error(`all transactional providers failed (${a}; ${b})`);
      }
      throw e;
    }
  }
  throw first instanceof Error ? first : new Error("no transactional email provider configured");
}
