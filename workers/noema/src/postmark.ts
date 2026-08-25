import type { Env } from "./types";

export const POSTMARK_EMAIL_URL = "https://api.postmarkapp.com/email";

export type PostmarkMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: "play-magic-link" | "admin-magic-link" | "agent-bootstrap" | "device-enrollment-review";
};

type PostmarkResponse = { MessageID?: string; ErrorCode?: number; Message?: string };

/**
 * RFC-0032 standby adapter. Postmark is attempted only when Resend is absent or
 * fails; see `email-provider.ts` for the ordering. Errors carry the status and
 * Postmark's ErrorCode and nothing else — never the token, callback URL, message
 * body, or recipient (RFC-0032 provider contract).
 */
export async function sendPostmarkEmail(
  env: Env,
  mail: PostmarkMail,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const token = env.POSTMARK_SERVER_TOKEN;
  if (!token) throw new Error("POSTMARK_SERVER_TOKEN not set");
  const res = await fetchImpl(POSTMARK_EMAIL_URL, {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      From: env.POSTMARK_FROM_EMAIL || mail.from,
      To: mail.to,
      Subject: mail.subject,
      HtmlBody: mail.html,
      TextBody: mail.text,
      MessageStream: env.POSTMARK_MESSAGE_STREAM || "outbound",
      Tag: mail.tag,
    }),
  });
  const payload = (await res.json().catch(() => ({}))) as PostmarkResponse;
  const messageId = String(payload.MessageID || "").trim();
  // Success is all three, not just the status: Postmark answers 200 with a
  // non-zero ErrorCode for several rejection classes.
  if (!res.ok || Number(payload.ErrorCode ?? 0) !== 0 || !messageId) {
    throw new Error(`postmark delivery failed (${res.status}, ErrorCode ${Number(payload.ErrorCode ?? 0)})`);
  }
  return messageId;
}
