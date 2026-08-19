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

export type EmailProvider = "resend";

export async function sendTransactionalEmail(
  env: Env,
  mail: TransactionalMail,
  fetchImpl: typeof fetch = fetch,
): Promise<{ provider: EmailProvider; messageId: string }> {
  if (!env.RESEND_API_KEY) throw new Error("no transactional email provider configured");
  return { provider: "resend", messageId: await sendResendEmail(env, mail, fetchImpl) };
}
