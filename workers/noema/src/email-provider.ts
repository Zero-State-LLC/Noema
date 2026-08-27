import { sendResendEmail } from "./resend";
import type { Env } from "./types";

export type TransactionalMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: "play-magic-link" | "admin-magic-link" | "agent-bootstrap" | "device-enrollment-review";
};

export type EmailProvider = "resend";

/**
 * Resend is the Worker-composed transactional email provider. Supabase remains
 * the delivery fallback in the auth flows when Resend is unavailable.
 */
export function hasTransactionalProvider(env: Env): boolean {
  return Boolean(env.RESEND_API_KEY);
}

export async function sendTransactionalEmail(
  env: Env,
  mail: TransactionalMail,
  fetchImpl: typeof fetch = fetch,
): Promise<{ provider: EmailProvider; messageId: string }> {
  if (!hasTransactionalProvider(env)) throw new Error("no transactional email provider configured");
  return { provider: "resend", messageId: await sendResendEmail(env, mail, fetchImpl) };
}
