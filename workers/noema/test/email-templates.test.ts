import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const email = (name: string) => readFileSync(join(root, "docs/email", name), "utf8");

const href =
  "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type={{ .Type }}";

describe("auth email templates", () => {
  it("dashboard Magic Link keeps token_hash on RedirectTo", () => {
    const html = email("supabase-magic-link.html");
    expect(html).toContain(href.replace("&", "&amp;"));
    expect(html).not.toContain("https://noema.guru/admin/callback?token_hash=");
    expect(html).not.toContain("https://noema.guru/play/callback?token_hash=");
    expect(html).not.toMatch(/ADMIN_OPERATOR_TOKEN|17011984|OLD_TRADE_NETWORK/);
  });

  it("play and admin reference copies use the same token_hash contract", () => {
    for (const name of [
      "play-magic-link.html",
      "admin-magic-link.html",
      "play-magic-link.txt",
      "admin-magic-link.txt",
    ]) {
      const body = email(name);
      expect(body).toContain("{{ .RedirectTo }}");
      expect(body).toContain("{{ .TokenHash }}");
      expect(body).toContain("{{ .Type }}");
    }
    expect(email("play-magic-link.html")).toMatch(/PLAY|Player/);
    expect(email("admin-magic-link.html")).toContain("zer0state@zer0state.com");
    expect(email("admin-magic-link.html")).toMatch(/ADMIN|operator/i);
  });
});
