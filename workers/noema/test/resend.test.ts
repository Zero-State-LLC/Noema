import { describe, expect, it } from "vitest";
import { composePlayMail, PLAY_MAIL_FROM, PLAY_MAIL_SUBJECT } from "../src/play-mail";
import { sendResendEmail } from "../src/resend";
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

describe("sendResendEmail", () => {
  it("throws when RESEND_API_KEY is missing", async () => {
    await expect(
      sendResendEmail(env(), {
        from: PLAY_MAIL_FROM,
        to: "a@x.io",
        subject: "s",
        html: "<p>x</p>",
        text: "x",
      }),
    ).rejects.toThrow(/RESEND_API_KEY/);
  });

  it("POSTs to Resend with bearer key and mailbox fields", async () => {
    let url = "";
    let headers: Record<string, string> = {};
    let body = "";
    const fetchImpl = async (u: string, init?: RequestInit) => {
      url = u;
      headers = Object.fromEntries(new Headers(init?.headers).entries());
      body = String(init?.body || "");
      return new Response(JSON.stringify({ id: "re_1" }), { status: 200 });
    };
    await sendResendEmail(
      env({ RESEND_API_KEY: "re_test" }),
      {
        from: PLAY_MAIL_FROM,
        to: "player@x.io",
        subject: PLAY_MAIL_SUBJECT,
        html: "<p>hi</p>",
        text: "hi",
      },
      fetchImpl,
    );
    expect(url).toBe("https://api.resend.com/emails");
    expect(headers.authorization).toBe("Bearer re_test");
    const parsed = JSON.parse(body) as {
      from: string;
      to: string[];
      subject: string;
      html: string;
      text: string;
    };
    expect(parsed.from).toBe(PLAY_MAIL_FROM);
    expect(parsed.to).toEqual(["player@x.io"]);
    expect(parsed.subject).toBe(PLAY_MAIL_SUBJECT);
    expect(parsed.html).toContain("hi");
    expect(parsed.text).toBe("hi");
  });
});

describe("composePlayMail", () => {
  it("is a Player letter with a concrete callback href", () => {
    const href = "https://noema.guru/play/callback?token_hash=abc&type=magiclink";
    const mail = composePlayMail("Ada@X.io", href);
    expect(mail.to).toBe("ada@x.io");
    expect(mail.subject).toBe("Enter NOEMA");
    expect(mail.text).toContain("ENTER NOEMA");
    expect(mail.text).toContain(href);
    expect(mail.text).toContain("Perihelion Reach");
    expect(mail.html).toContain("ENTER NOEMA");
    expect(mail.html).toContain(href.replace(/&/g, "&amp;"));
    expect(mail.html).not.toMatch(/privileged administrative|OPEN ADMIN/i);
  });
});
