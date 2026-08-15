import type { Env } from "./types";

export const POSTMARK_EMAIL_URL = "https://api.postmarkapp.com/email";

export type PostmarkMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: "play-magic-link" | "admin-magic-link" | "agent-bootstrap";
};

type PostmarkResponse = {
  ErrorCode?: number;
  MessageID?: string;
};

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
      accept: "application/json",
      "content-type": "application/json",
      "x-postmark-server-token": token,
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
  if (!res.ok || payload.ErrorCode !== 0 || !String(payload.MessageID || "").trim()) {
    throw new Error(`postmark delivery failed (${res.status}, code ${payload.ErrorCode ?? "unknown"})`);
  }
  return String(payload.MessageID);
}
