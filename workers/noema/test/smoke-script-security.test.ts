import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { admitLocalSmokeBase, pickInspectTarget, pickMoveDirection } from "../scripts/smoke.mjs";

const script = join(dirname(fileURLToPath(import.meta.url)), "../scripts/smoke.mjs");

describe("local smoke script security boundary", () => {
  it("admits only loopback HTTP targets", () => {
    expect(admitLocalSmokeBase("").base).toBe("http://127.0.0.1:8787");
    expect(admitLocalSmokeBase("http://localhost:8787/").ok).toBe(true);
    expect(admitLocalSmokeBase("http://[::1]:8787").ok).toBe(true);
    expect(admitLocalSmokeBase("https://preview.example.workers.dev").ok).toBe(false);
    expect(admitLocalSmokeBase("https://noema.guru").ok).toBe(false);
    expect(admitLocalSmokeBase("http://192.168.1.20:8787").ok).toBe(false);
    expect(admitLocalSmokeBase("http://127.0.0.1:8787/nested").ok).toBe(false);
    expect(admitLocalSmokeBase("http://user@127.0.0.1:8787").ok).toBe(false);
  });

  it("fails before network access for a hosted BASE", () => {
    const result = spawnSync(process.execPath, [script], {
      env: { ...process.env, BASE: "https://preview.example.workers.dev" },
      encoding: "utf8",
    });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/use npm run smoke:hosted/i);
  });

  it("picks the first visible inspect target and move direction", () => {
    const obs = {
      location: {
        room_id: "room.relay-quarter",
        entities: [{ entity_id: "entity.relay-7", label: "Relay 7" }],
        exits: [{ direction: "east", to_room_id: "room.transit-ring" }],
      },
    };
    expect(pickInspectTarget(obs)).toBe("entity.relay-7");
    expect(pickMoveDirection(obs)).toBe("east");
    expect(pickInspectTarget({})).toBeNull();
    expect(pickMoveDirection({})).toBeNull();
  });
});
