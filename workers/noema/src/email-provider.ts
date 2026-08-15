import { sendPostmarkEmail } from "./postmark";
import { sendResendEmail } from "./resend";
import type { Env } from "./types";

export type TransactionalMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: "play-magic-link" | "admin-magic-link";
};

export type EmailProvider = "resend" | "postmark";

export async function sendTransactionalEmail(
  env: Env,
  mail: TransactionalMail,
  fetchImpl: typeof fetch = fetch,
): Promise<{ provider: EmailProvider; messageId: string }> {
  const failures: string[] = [];
  if (env.RESEND_API_KEY) {
    try {
      return { provider: "resend", messageId: await sendResendEmail(env, mail, fetchImpl) };
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "resend failed");
    }
  }
  if (env.POSTMARK_SERVER_TOKEN) {
    try {
      return { provider: "postmark", messageId: await sendPostmarkEmail(env, mail, fetchImpl) };
    } catch (error) {
      failures.push(error instanceof Error ? error.message : "postmark failed");
    }
  }
  if (!failures.length) throw new Error("no transactional email provider configured");
  throw new Error(failures.join("; "));
}
