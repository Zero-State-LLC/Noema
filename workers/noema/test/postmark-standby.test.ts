import { describe, expect, it, vi } from "vitest";
import { hasTransactionalProvider, sendTransactionalEmail } from "../src/email-provider";
import { POSTMARK_EMAIL_URL, sendPostmarkEmail } from "../src/postmark";
import { RESEND_EMAILS_URL } from "../src/resend";
import type { Env } from "../src/types";

function env(overrides: Partial<Env> = {}): Env {
  return {
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    WORLD_DO: {} as DurableObjectNamespace,
    ASSETS: {} as Fetcher,
    ...overrides,
  };
}

const mail = {
  from: "NOEMA <access@noema.guru>",
  to: "player@example.com",
  subject: "Enter NOEMA",
  html: "<html>link</html>",
  text: "link",
  tag: "play-magic-link" as const,
};

const ok = (body: unknown, status = 200) =>
  vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }));

describe("RFC-0032 Postmark provider contract", () => {
  it("posts the documented request shape", async () => {
    const fetchImpl = ok({ MessageID: "pm-1", ErrorCode: 0 });
    const id = await sendPostmarkEmail(
      env({ POSTMARK_SERVER_TOKEN: "tok", POSTMARK_MESSAGE_STREAM: "outbound" }),
      mail,
      fetchImpl as unknown as typeof fetch,
    );
    expect(id).toBe("pm-1");
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(POSTMARK_EMAIL_URL);
    expect((init.headers as Record<string, string>)["X-Postmark-Server-Token"]).toBe("tok");
    expect(JSON.parse(String(init.body))).toEqual({
      From: mail.from,
      To: mail.to,
      Subject: mail.subject,
      HtmlBody: mail.html,
      TextBody: mail.text,
      MessageStream: "outbound",
      Tag: "play-magic-link",
    });
  });

  it("defaults the message stream to outbound and honours the sender override", async () => {
    const fetchImpl = ok({ MessageID: "pm-2", ErrorCode: 0 });
    await sendPostmarkEmail(
      env({ POSTMARK_SERVER_TOKEN: "tok", POSTMARK_FROM_EMAIL: "override@noema.guru" }),
      mail,
      fetchImpl as unknown as typeof fetch,
    );
    const body = JSON.parse(String((fetchImpl.mock.calls[0] as [string, RequestInit])[1].body));
    expect(body.MessageStream).toBe("outbound");
    expect(body.From).toBe("override@noema.guru");
  });

  it("refuses a 200 that carries a non-zero ErrorCode", async () => {
    const fetchImpl = ok({ MessageID: "pm-3", ErrorCode: 406, Message: "inactive recipient" });
    await expect(sendPostmarkEmail(
      env({ POSTMARK_SERVER_TOKEN: "tok" }), mail, fetchImpl as unknown as typeof fetch,
    )).rejects.toThrow(/ErrorCode 406/);
  });

  it("refuses a 200 with an empty MessageID", async () => {
    const fetchImpl = ok({ ErrorCode: 0 });
    await expect(sendPostmarkEmail(
      env({ POSTMARK_SERVER_TOKEN: "tok" }), mail, fetchImpl as unknown as typeof fetch,
    )).rejects.toThrow(/postmark delivery failed/);
  });

  it("never puts the token, recipient, body, or callback in the error", async () => {
    const fetchImpl = ok({ ErrorCode: 401, Message: "bad token" }, 401);
    const e = await sendPostmarkEmail(
      env({ POSTMARK_SERVER_TOKEN: "super-secret-token" }), mail, fetchImpl as unknown as typeof fetch,
    ).catch((err: Error) => err);
    const message = (e as Error).message;
    expect(message).not.toContain("super-secret-token");
    expect(message).not.toContain(mail.to);
    expect(message).not.toContain(mail.html);
    expect(message).not.toContain("bad token");
  });
});

describe("RFC-0032 standby ordering", () => {
  it("counts either provider as configured", () => {
    expect(hasTransactionalProvider(env())).toBe(false);
    expect(hasTransactionalProvider(env({ RESEND_API_KEY: "r" }))).toBe(true);
    expect(hasTransactionalProvider(env({ POSTMARK_SERVER_TOKEN: "p" }))).toBe(true);
  });

  it("prefers Resend and does not touch Postmark when it succeeds", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === RESEND_EMAILS_URL) return new Response(JSON.stringify({ id: "rs-1" }), { status: 200 });
      throw new Error("postmark must not be called");
    });
    const sent = await sendTransactionalEmail(
      env({ RESEND_API_KEY: "r", POSTMARK_SERVER_TOKEN: "p" }),
      mail,
      fetchImpl as unknown as typeof fetch,
    );
    expect(sent).toEqual({ provider: "resend", messageId: "rs-1" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls to Postmark when Resend fails", async () => {
    const fetchImpl = vi.fn(async (url: string) => {
      if (url === RESEND_EMAILS_URL) return new Response("{}", { status: 502 });
      return new Response(JSON.stringify({ MessageID: "pm-9", ErrorCode: 0 }), { status: 200 });
    });
    const sent = await sendTransactionalEmail(
      env({ RESEND_API_KEY: "r", POSTMARK_SERVER_TOKEN: "p" }),
      mail,
      fetchImpl as unknown as typeof fetch,
    );
    expect(sent).toEqual({ provider: "postmark", messageId: "pm-9" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("sends through Postmark alone when Resend is not configured", async () => {
    const fetchImpl = ok({ MessageID: "pm-only", ErrorCode: 0 });
    const sent = await sendTransactionalEmail(
      env({ POSTMARK_SERVER_TOKEN: "p" }), mail, fetchImpl as unknown as typeof fetch,
    );
    expect(sent.provider).toBe("postmark");
  });

  it("surfaces the Resend error unchanged when no standby is configured", async () => {
    const fetchImpl = ok({}, 502);
    await expect(sendTransactionalEmail(
      env({ RESEND_API_KEY: "r" }), mail, fetchImpl as unknown as typeof fetch,
    )).rejects.toThrow(/resend delivery failed/);
  });

  it("reports both failures when both providers fail", async () => {
    const fetchImpl = vi.fn(async () => new Response("{}", { status: 502 }));
    await expect(sendTransactionalEmail(
      env({ RESEND_API_KEY: "r", POSTMARK_SERVER_TOKEN: "p" }),
      mail,
      fetchImpl as unknown as typeof fetch,
    )).rejects.toThrow(/all transactional providers failed/);
  });

  it("still refuses to send with no provider at all", async () => {
    await expect(sendTransactionalEmail(env(), mail)).rejects.toThrow(
      "no transactional email provider configured",
    );
  });
});
