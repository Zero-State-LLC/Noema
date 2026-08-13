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

  it("play and admin letters share the token_hash contract and stay distinct", () => {
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
    const play = email("play-magic-link.html");
    const admin = email("admin-magic-link.html");
    expect(play).toContain("ENTER NOEMA");
    expect(play).toContain("Player account");
    expect(play).toContain("Perihelion Reach");
    expect(play).not.toMatch(/privileged administrative|Do not forward/);
    expect(admin).toContain("OPEN ADMIN");
    expect(admin).toContain("NOEMA ADMIN");
    expect(admin).toContain("privileged administrative access");
    expect(admin).toContain("Do not forward or share this message.");
    expect(admin).toContain("Operator Plane");
    expect(admin).not.toContain("ENTER NOEMA");
    expect(play).not.toContain("OPEN ADMIN");
  });
});
