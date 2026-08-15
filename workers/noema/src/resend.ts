import type { Env } from "./types";

export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export type ResendMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  tag: "play-magic-link" | "admin-magic-link";
};

type ResendResponse = { id?: string; message?: string };

export async function sendResendEmail(
  env: Env,
  mail: ResendMail,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const res = await fetchImpl(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL || mail.from,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tags: [{ name: "noema_message", value: mail.tag }],
    }),
  });
  const payload = (await res.json().catch(() => ({}))) as ResendResponse;
  if (!res.ok || !String(payload.id || "").trim()) {
    throw new Error(`resend delivery failed (${res.status}${payload.message ? `: ${payload.message}` : ""})`);
  }
  return String(payload.id);
}
