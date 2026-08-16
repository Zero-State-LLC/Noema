import { describe, expect, it } from "vitest";
import { allowOriginValue, applyCors, isAllowedOrigin, isPublicReadPath } from "../src/cors";

function req(url: string, origin?: string, method = "GET"): Request {
  const headers: Record<string, string> = {};
  if (origin) headers.Origin = origin;
  return new Request(url, { method, headers });
}

describe("CORS allowlist", () => {
  it("treats watch/health/ready as public GET", () => {
    expect(isPublicReadPath("/v1/watch/live")).toBe(true);
    expect(isPublicReadPath("/health")).toBe(true);
    expect(isPublicReadPath("/ready")).toBe(true);
    expect(isPublicReadPath("/v1/command")).toBe(false);
    expect(isPublicReadPath("/v1/play/login/consume")).toBe(false);
  });

  it("allows noema.guru and the workers.dev gateway; rejects random sites", () => {
    expect(isAllowedOrigin("https://noema.guru")).toBe(true);
    expect(isAllowedOrigin("https://www.noema.guru")).toBe(true);
    expect(isAllowedOrigin("https://noema-gateway.zer0state-noema.workers.dev")).toBe(true);
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin("http://localhost:8787", { NOEMA_ENV: "production" })).toBe(false);
    expect(isAllowedOrigin("http://localhost:8787", { NOEMA_ENV: "local" })).toBe(true);
  });

  it("public WATCH GET stays * from any origin", () => {
    const r = req("https://noema.guru/v1/watch/live", "https://evil.example");
    expect(allowOriginValue(r, { NOEMA_ENV: "production" })).toBe("*");
    const out = applyCors(new Response("{}", { status: 200 }), r, { NOEMA_ENV: "production" });
    expect(out.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("mutating command from a foreign origin gets no ACAO", () => {
    const r = req("https://noema.guru/v1/command", "https://evil.example", "POST");
    expect(allowOriginValue(r, { NOEMA_ENV: "production" })).toBeNull();
    const out = applyCors(new Response("{}", { status: 200 }), r, { NOEMA_ENV: "production" });
    expect(out.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("mutating command from noema.guru reflects that origin", () => {
    const r = req("https://noema.guru/v1/command", "https://noema.guru", "POST");
    expect(allowOriginValue(r, { NOEMA_ENV: "production" })).toBe("https://noema.guru");
    const out = applyCors(new Response("{}", { status: 200 }), r, { NOEMA_ENV: "production" });
    expect(out.headers.get("Access-Control-Allow-Origin")).toBe("https://noema.guru");
    expect(out.headers.get("Access-Control-Allow-Headers")).toMatch(/Authorization/);
  });
});
