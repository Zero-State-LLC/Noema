import { describe, expect, it } from "vitest";
import { composePlayMail, PLAY_MAIL_FROM, PLAY_MAIL_SUBJECT } from "../src/play-mail";
import { POSTMARK_EMAIL_URL, sendPostmarkEmail } from "../src/postmark";
import type { Env } from "../src/types";

function env(partial: Partial<Env> = {}): Env {
  return {
    TOKEN_SIGNING_SECRET: "test-signing-secret",
    NOEMA_ENV: "production",
    NOEMA_PROTOCOL_VERSION: "1",
    DEFAULT_WORLD_ID: "world-01",
    ...partial,
  } as Env;
}

const mail = {
  from: PLAY_MAIL_FROM,
  to: "player@x.io",
  subject: PLAY_MAIL_SUBJECT,
  html: "<p>hi</p>",
  text: "hi",
  tag: "play-magic-link" as const,
};

describe("sendPostmarkEmail", () => {
  it("throws when POSTMARK_SERVER_TOKEN is missing", async () => {
    await expect(sendPostmarkEmail(env(), mail)).rejects.toThrow(/POSTMARK_SERVER_TOKEN/);
  });

  it("POSTs the Postmark contract and returns MessageID", async () => {
    let url = "";
    let headers: Record<string, string> = {};
    let body = "";
    const fetchImpl: typeof fetch = async (input, init) => {
      url = String(input);
      headers = Object.fromEntries(new Headers(init?.headers).entries());
      body = String(init?.body || "");
      return new Response(JSON.stringify({ ErrorCode: 0, MessageID: "pm-1" }), { status: 200 });
    };
    const id = await sendPostmarkEmail(
      env({
        POSTMARK_SERVER_TOKEN: "pm_test",
        POSTMARK_FROM_EMAIL: "NOEMA <verified@noema.guru>",
        POSTMARK_MESSAGE_STREAM: "auth",
      }),
      mail,
      fetchImpl,
    );
    expect(id).toBe("pm-1");
    expect(url).toBe(POSTMARK_EMAIL_URL);
    expect(headers["x-postmark-server-token"]).toBe("pm_test");
    expect(headers.accept).toBe("application/json");
    const parsed = JSON.parse(body);
    expect(parsed).toEqual({
      From: "NOEMA <verified@noema.guru>",
      To: "player@x.io",
      Subject: PLAY_MAIL_SUBJECT,
      HtmlBody: "<p>hi</p>",
      TextBody: "hi",
      MessageStream: "auth",
      Tag: "play-magic-link",
    });
  });

  it.each([
    [500, { ErrorCode: 0, MessageID: "pm-1" }],
    [200, { ErrorCode: 10, MessageID: "pm-1" }],
    [200, { ErrorCode: 0 }],
  ])("rejects invalid delivery response %#", async (status, payload) => {
    await expect(
      sendPostmarkEmail(
        env({ POSTMARK_SERVER_TOKEN: "pm_test" }),
        mail,
        async () => new Response(JSON.stringify(payload), { status }),
      ),
    ).rejects.toThrow(/postmark delivery failed/);
  });
});

describe("composePlayMail", () => {
  it("is a Player letter with a concrete callback href", () => {
    const href = "https://noema.guru/play/callback?token_hash=abc&type=magiclink";
    const composed = composePlayMail("Ada@X.io", href);
    expect(composed.to).toBe("ada@x.io");
    expect(composed.subject).toBe("Enter NOEMA");
    expect(composed.text).toContain("ENTER NOEMA");
    expect(composed.text).toContain(href);
    expect(composed.text).toContain("Perihelion Reach");
    expect(composed.html).toContain("ENTER NOEMA");
    expect(composed.html).toContain(href.replace(/&/g, "&amp;"));
    expect(composed.html).not.toMatch(/privileged administrative|OPEN ADMIN/i);
  });
});
