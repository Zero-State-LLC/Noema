import type { Env } from "./types";

export const RESEND_EMAILS_URL = "https://api.resend.com/emails";

export type ResendMail = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendResendEmail(
  env: Env,
  mail: ResendMail,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const key = env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY not set");
  const res = await fetchImpl(RESEND_EMAILS_URL, {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: mail.from,
      to: [mail.to],
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  if (!res.ok) {
    throw new Error(`resend ${res.status}`);
  }
}
