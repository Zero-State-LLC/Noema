/**
 * Hosted alpha freeze. Fail this file = you moved a frozen surface.
 * Unfreeze: see docs/HOSTED-ALPHA-FREEZE.md.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { HUMAN_WATCH_MESSAGE } from "../src/auth";
import { discoveryDocument } from "../src/enrollment";
import { landingHtml } from "../src/landing";
import { ACCEPTED_SEALS } from "../src/seal";
import { productShell } from "../src/shell";

const HERE = dirname(fileURLToPath(import.meta.url));
const COMPAT = JSON.parse(readFileSync(join(HERE, "../../../spec-compat.json"), "utf8")) as {
  release_channel?: string;
  frozen_release?: {
    status?: string;
    runtime_git?: string;
    specs_git?: string;
    worker_version_id?: string;
    genesis_id?: string;
    seal?: string;
  };
};

const FROZEN_SEAL = "sha256:9b9c211c156a9b49e700fa39e409733099a38df9d95c7f6fb90ca3e9e740a395";
const FROZEN_RUNTIME = "3fd1d9e9af47b4ce6e654fa6c2f902ec6d87e3fe";
const FROZEN_SPECS = "2176135c94f8e2aae7dd4ef9bf9cf1f4ff768d6b";
const FROZEN_WORKER = "7a482c37-3c93-48b6-bc68-ed02819b510e";

describe("hosted alpha freeze", () => {
  it("pins the deployed product, not a moving main tip", () => {
    expect(COMPAT.release_channel).toBe("alpha");
    expect(COMPAT.frozen_release?.status).toBe("frozen");
    expect(COMPAT.frozen_release?.runtime_git).toBe(FROZEN_RUNTIME);
    expect(COMPAT.frozen_release?.specs_git).toBe(FROZEN_SPECS);
    expect(COMPAT.frozen_release?.worker_version_id).toBe(FROZEN_WORKER);
    expect(COMPAT.frozen_release?.genesis_id).toBe("genesis.ef578f4ffceeccd0");
    expect(COMPAT.frozen_release?.seal).toBe(FROZEN_SEAL);
  });

  it("keeps the published live seal", () => {
    expect(ACCEPTED_SEALS[0]).toBe(FROZEN_SEAL);
  });

  it("keeps agents-only inhabit copy", () => {
    expect(HUMAN_WATCH_MESSAGE).toBe("Agents play this world. Humans watch.");
  });

  it("keeps four-tab chrome and Watch-first Home", () => {
    const nav = productShell({ title: "T", active: "home", body: "x" }).match(
      /<nav class="nav"[\s\S]*?<\/nav>/,
    )?.[0];
    expect(nav).toMatch(/>Home</);
    expect(nav).toMatch(/>Manifesto</);
    expect(nav).toMatch(/>Watch</);
    expect(nav).toMatch(/>Connect</);
    expect(nav).not.toMatch(/>Play</);
    expect(nav).not.toMatch(/>Study</);
    const door = landingHtml();
    expect(door).toContain("Send watch link");
    expect(door).toContain("/assets/hero-table.jpg");
    expect(door).toContain("hero-bleed");
  });

  it("keeps discovery admission and seal advertisement", () => {
    const doc = discoveryDocument("https://noema.guru");
    expect(doc["admission"]).toBe("agents_only");
    expect(doc["seal_header"]).toBe("X-Noema-Seal");
    expect(doc["accepted_seals"]).toEqual([FROZEN_SEAL]);
    expect(doc["command_uri"]).toBe("https://noema.guru/v1/command");
    expect(doc["device_authorization_uri"]).toBe("https://noema.guru/v1/auth/device");
  });
});
