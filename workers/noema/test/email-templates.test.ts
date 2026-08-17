import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AGENT_BOOTSTRAP_HTML, AGENT_BOOTSTRAP_TEXT, composeAgentBootstrapMail } from "../src/agent-mail";
import { renderAdminMailHtml, renderAdminMailText } from "../src/admin-mail";
import { applyEnrollmentHref, applyMagicLinkHref, stripSubjectHeader } from "../src/mail-template";
import { renderPlayMailHtml, renderPlayMailText } from "../src/play-mail";

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
    expect(play).toContain("Follow this link to enter and play.");
    expect(play).toContain("You will enter the world.");
    expect(play).toContain("works once");
    expect(play).toContain("Player account");
    expect(play).toContain("Perihelion Reach");
    expect(play).not.toMatch(/privileged administrative|Do not forward/);
    expect(admin).toContain("OPEN ADMIN");
    expect(admin).toContain("NOEMA ADMIN");
    expect(admin).toContain("privileged administrative access");
    expect(admin).toContain("Do not forward or share this message.");
    expect(admin).toContain("OPERATOR AGENT BRIEF");
    expect(admin).toContain("/v1/admin/login/consume");
    expect(admin).toContain('{"action":"recover"}');
    expect(admin).toContain("Operator Plane");
    expect(admin).not.toMatch(/ADMIN_OPERATOR_TOKEN|Activate Genesis|access_token|Bearer /);
    expect(admin).not.toContain("ENTER NOEMA");
    expect(play).not.toContain("OPEN ADMIN");
  });

  it("Worker-composed PLAY/ADMIN letters match docs/email after href fill", () => {
    const href = "https://noema.guru/play/callback?token_hash=abc&type=magiclink";
    expect(renderPlayMailHtml(href)).toBe(applyMagicLinkHref(email("play-magic-link.html"), href));
    expect(renderPlayMailText(href)).toBe(applyMagicLinkHref(stripSubjectHeader(email("play-magic-link.txt")), href));
    const adminHref = "https://noema.guru/admin/callback?token_hash=abc&type=magiclink";
    expect(renderAdminMailHtml(adminHref)).toBe(applyMagicLinkHref(email("admin-magic-link.html"), adminHref));
    expect(renderAdminMailText(adminHref)).toBe(applyMagicLinkHref(stripSubjectHeader(email("admin-magic-link.txt")), adminHref));
  });

  it("agent bootstrap letter is review-only and matches docs/email", () => {
    const href = "https://noema.guru/connect/enroll?eid=enroll.example.01&t=secret";
    expect(AGENT_BOOTSTRAP_HTML).toBe(email("agent-bootstrap.html"));
    expect(AGENT_BOOTSTRAP_TEXT).toBe(stripSubjectHeader(email("agent-bootstrap.txt")));
    const mail = composeAgentBootstrapMail("Ops@Example.com", href);
    expect(mail.to).toBe("ops@example.com");
    expect(mail.subject).toBe("Review agent enrollment");
    expect(mail.html).toBe(applyEnrollmentHref(email("agent-bootstrap.html"), href, true));
    expect(mail.text).toContain("REVIEW ENROLLMENT");
    expect(mail.text).toContain(href);
    expect(mail.html + mail.text).not.toMatch(/access_token|refresh_token|Bearer |re_|ADMIN_OPERATOR|curl |sk-/i);
    expect(mail.html).not.toContain("ENTER NOEMA");
    expect(mail.html).not.toContain("OPEN ADMIN");
  });
});
