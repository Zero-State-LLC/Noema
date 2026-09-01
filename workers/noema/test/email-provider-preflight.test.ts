import { describe, expect, it, vi } from "vitest";
import {
  evaluateDomainStatus,
  runEmailProviderPreflight,
  senderDomain,
} from "../scripts/email-provider-preflight.mjs";

describe("email provider production preflight", () => {
  it("extracts and normalizes the configured sender domain", () => {
    expect(senderDomain("PLAY@Noema.Guru")).toBe("noema.guru");
    expect(senderDomain("not-an-email")).toBe("");
  });

  it("requires the exact sender domain to be verified", () => {
    expect(evaluateDomainStatus({ data: [{ name: "noema.guru", status: "verified" }] }, "noema.guru"))
      .toMatchObject({ ok: true, present: true, status: "verified" });
    expect(evaluateDomainStatus({ data: [{ name: "other.example", status: "verified" }] }, "noema.guru"))
      .toMatchObject({ ok: false, present: false });
    expect(evaluateDomainStatus({ data: [{ name: "noema.guru", status: "pending" }] }, "noema.guru"))
      .toMatchObject({ ok: false, present: true, status: "pending" });
  });

  it("uses only the read-only domains endpoint and returns redacted evidence", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      data: [{ name: "noema.guru", status: "verified" }],
    }), { status: 200 }));
    const result = await runEmailProviderPreflight({
      env: { ...process.env, RESEND_API_KEY: "secret-value", RESEND_FROM_EMAIL: "play@noema.guru" },
      fetchImpl,
    });

    expect(fetchImpl).toHaveBeenCalledWith("https://api.resend.com/domains", expect.objectContaining({ method: "GET" }));
    expect(result).toEqual(expect.objectContaining({
      ok: true,
      domain: "noema.guru",
      read_only: true,
      sends_email: false,
    }));
    expect(JSON.stringify(result)).not.toContain("secret-value");
  });

  it("fails closed before network access when protected secrets are absent", async () => {
    const fetchImpl = vi.fn();
    const result = await runEmailProviderPreflight({
      env: { ...process.env, RESEND_API_KEY: "", RESEND_FROM_EMAIL: "" },
      fetchImpl,
    });
    expect(result).toMatchObject({ ok: false, code: "UNCONFIGURED" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
