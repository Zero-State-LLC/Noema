import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SCRIPT = path.resolve(__dirname, "../scripts/acceptance-733-setup.sh");
const PROD_REF = "dezykkherxlaysxyvgbs";

/** PATH of stubs that log any invocation: dry-run must never call them. */
function stubbed() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "acc-setup-"));
  const bin = path.join(dir, "bin");
  fs.mkdirSync(bin);
  const log = path.join(dir, "calls.log");
  for (const name of ["node", "npx", "wrangler", "supabase", "curl", "openssl", "git"]) {
    fs.writeFileSync(path.join(bin, name), `#!/bin/sh\necho "${name} $*" >> "${log}"\nexit 0\n`, { mode: 0o755 });
  }
  const home = path.join(dir, "home");
  fs.mkdirSync(home);
  return { dir, bin, log, home };
}

function run(args: string[], s = stubbed()) {
  const sysBin = "/usr/bin:/bin";
  const r = spawnSync("/bin/bash", [SCRIPT, ...args], {
    env: { PATH: `${s.bin}:${sysBin}`, HOME: s.home, NOEMA_ACCEPTANCE_ENV: path.join(s.home, ".config/noema/acceptance.env") } as unknown as NodeJS.ProcessEnv,
    encoding: "utf8",
    input: "",
  });
  return { ...s, status: r.status, out: `${r.stdout}${r.stderr}` };
}

describe("acceptance-733-setup.sh", () => {
  it("is syntactically valid bash", () => {
    expect(spawnSync("bash", ["-n", SCRIPT], { encoding: "utf8" }).status).toBe(0);
  });

  it("--dry-run prints every step, executes nothing, writes nothing", () => {
    const r = run(["--dry-run"]);
    expect(r.status).toBe(0);
    for (const frag of ["wrangler whoami", "wrangler login", "315fb44b61212825452aad0ca566ea42", "supabase login",
      "supabase projects create noema-733-acceptance", "supabase link", "supabase db push", "acceptance.env", "mode 600"]) {
      expect(r.out, frag).toContain(frag);
    }
    expect(r.out).toContain("CLOUDFLARE_API_TOKEN");
    expect(fs.existsSync(r.log)).toBe(false);
    expect(fs.existsSync(path.join(r.home, ".config"))).toBe(false);
    expect(r.out).not.toContain(PROD_REF + " ");
  });

  it("refuses the production Supabase project ref", () => {
    const bad = run(["--validate-ref", PROD_REF]);
    expect(bad.status).not.toBe(0);
    expect(bad.out).toMatch(/production/i);
    expect(run(["--validate-ref", "Not-A-Ref"]).status).not.toBe(0);
    expect(run(["--validate-ref", "abcdefghijklmnopqrst"]).status).toBe(0);
  });

  it("rejects unknown arguments", () => {
    expect(run(["--bogus"]).status).not.toBe(0);
  });
});
