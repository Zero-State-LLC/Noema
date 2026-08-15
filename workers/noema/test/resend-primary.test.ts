import { describe, expect, it, vi } from "vitest";
import { sendTransactionalEmail } from "../src/email-provider";
import { RESEND_EMAILS_URL, sendResendEmail } from "../src/resend";
import type { Env } from "../src/types";

const mail = {
  from: "NOEMA <play@noema.guru>",
  to: "player@example.com",
  subject: "Enter NOEMA",
  html: "<p>enter</p>",
  text: "enter",
  tag: "play-magic-link" as const,
};

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

describe("Resend adapter", () => {
  it("sends the expected Resend contract and returns the message id", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "re_123" }), { status: 200 }));
    const id = await sendResendEmail(env({ RESEND_API_KEY: "re_test", RESEND_FROM_EMAIL: "NOEMA <mail@noema.guru>" }), mail, fetchImpl);
    expect(id).toBe("re_123");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe(RESEND_EMAILS_URL);
    expect(init.headers.authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({
      from: "NOEMA <mail@noema.guru>",
      to: ["player@example.com"],
      tags: [{ name: "noema_message", value: "play-magic-link" }],
    });
  });

  it("fails on missing keys and invalid provider responses", async () => {
    await expect(sendResendEmail(env(), mail)).rejects.toThrow(/RESEND_API_KEY/);
    await expect(sendResendEmail(env({ RESEND_API_KEY: "bad" }), mail, vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "invalid" }), { status: 401 }),
    ))).rejects.toThrow(/401/);
  });
});

describe("transactional provider order", () => {
  it("uses Resend first and does not call Postmark when Resend succeeds", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "re_1" }), { status: 200 }));
    const result = await sendTransactionalEmail(env({ RESEND_API_KEY: "re", POSTMARK_SERVER_TOKEN: "pm" }), mail, fetchImpl);
    expect(result).toEqual({ provider: "resend", messageId: "re_1" });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("falls back from Resend to dormant Postmark", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "down" }), { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ErrorCode: 0, MessageID: "pm_1" }), { status: 200 }));
    const result = await sendTransactionalEmail(env({ RESEND_API_KEY: "re", POSTMARK_SERVER_TOKEN: "pm" }), mail, fetchImpl);
    expect(result).toEqual({ provider: "postmark", messageId: "pm_1" });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("fails closed when no provider is configured", async () => {
    await expect(sendTransactionalEmail(env(), mail)).rejects.toThrow(/no transactional email provider/);
  });
});
