import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { stopOwned } from "../scripts/mud-local-acceptance.mjs";

type Diagnostic = { pid: number; process_group: number; stage: string; operation: string; signal: string | number | null; code?: string; errno?: number };
type Record = { phase: string; pid: number; cleanup_diagnostics?: Diagnostic[]; cleanup_reap_waits?: number };
const owned = { pid: 12345 }; // Synthetic only: every test using this pid injects kill.
const absent = () => Object.assign(new Error("synthetic absent"), { code: "ESRCH" });
const permission = () => Object.assign(new Error("SECRET message"), { code: "EPERM", errno: -1, stack: "SECRET stack", env: "SECRET env", path: "SECRET path" });
const record = (): Record => ({ phase: "retained-storage restart", pid: owned.pid });
// Existing exact-call controls pin the unchanged non-Darwin path explicitly.
const stopSynthetic = (child: { pid: number }, entry: Record, io: { kill: (pid: number, signal: string | number) => void; wait?: (ms: number) => Promise<void> }) =>
  stopOwned(child, entry, { platform: "linux", ...io });

describe("owned cleanup failure diagnostics (synthetic OS failures)", () => {
  it.each(["signal", "probe"])("keeps %s EPERM fail-closed and exact error identity", async operation => {
    const error = permission(), entry = record(), calls: unknown[] = [];
    const kill = (pid: number, signal: string | number) => {
      calls.push([pid, signal]);
      if (operation === "signal" || signal === 0) throw error;
    };
    await expect(stopSynthetic(owned, entry, { kill })).rejects.toBe(error);
    expect(calls).toEqual(operation === "signal" ? [[-owned.pid, "SIGTERM"]] : [[-owned.pid, "SIGTERM"], [-owned.pid, 0]]);
    expect(entry.cleanup_diagnostics).toEqual([{ pid: owned.pid, process_group: owned.pid, stage: "terminate", operation, signal: operation === "signal" ? "SIGTERM" : 0, code: "EPERM", errno: -1 }]);
    expect(JSON.stringify(entry)).not.toContain("SECRET");
    expect(entry.phase).toBe("retained-storage restart");
    expect(entry).not.toHaveProperty("cleaned_up");
  });

  it("treats ESRCH as ordinary absence without diagnostics", async () => {
    const entry = record(), calls: unknown[] = [];
    await stopSynthetic(owned, entry, { kill: (pid: number, signal: unknown) => { calls.push([pid, signal]); throw absent(); } });
    expect(calls).toEqual([[-owned.pid, "SIGTERM"], [-owned.pid, 0], [-owned.pid, 0], [-owned.pid, 0], [-owned.pid, 0]]);
    expect(entry).not.toHaveProperty("cleanup_diagnostics");
  });

  it("preserves escalation, original 100ms/40+30 waits and live-group timeout", async () => {
    const entry = record(), signals: unknown[] = [], waits: number[] = [];
    await expect(stopSynthetic(owned, entry, { kill: (pid: number, signal: unknown) => { expect(pid).toBe(-owned.pid); signals.push(signal); }, wait: async (ms: number) => { waits.push(ms); } })).rejects.toThrow("owned Wrangler/workerd process group must stop");
    expect(signals.filter(s => s !== 0)).toEqual(["SIGTERM", "SIGKILL"]);
    expect(signals.filter(s => s === 0)).toHaveLength(72);
    expect(waits).toEqual(Array(70).fill(100));
    expect(entry.cleanup_diagnostics).toEqual([{ pid: owned.pid, process_group: owned.pid, stage: "verify", operation: "wait", signal: null, code: "ERR_ASSERTION" }]);
  });

  it("permits ordinary successful SIGKILL escalation without failure evidence", async () => {
    const entry = record(), signals: unknown[] = [];
    let killed = false, waits = 0;
    await stopSynthetic(owned, entry, { kill: (pid: number, signal: unknown) => {
      expect(pid).toBe(-owned.pid);
      signals.push(signal);
      if (signal === "SIGKILL") killed = true;
      if (signal === 0 && killed) throw absent();
    }, wait: async () => { waits++; } });
    expect(signals.filter(s => s !== 0)).toEqual(["SIGTERM", "SIGKILL"]);
    expect(waits).toBe(40);
    expect(entry).not.toHaveProperty("cleanup_diagnostics");
  });

  it("records SIGKILL failure without retry or further probes", async () => {
    const entry = record(), error = permission(), calls: unknown[] = [];
    await expect(stopSynthetic(owned, entry, { kill: (_pid: number, signal: unknown) => { calls.push(signal); if (signal === "SIGKILL") throw error; }, wait: async () => {} })).rejects.toBe(error);
    expect(calls).toHaveLength(43);
    expect(entry.cleanup_diagnostics?.[0]).toMatchObject({ stage: "escalate", operation: "signal", signal: "SIGKILL", code: "EPERM" });
  });

  it("bounds records and excludes unsafe code, errno and accessor properties", async () => {
    const entry = record();
    let accessorReads = 0;
    const error = Object.assign(new Error("SECRET"), { code: "SECRET", errno: "SECRET" });
    Object.defineProperty(error, "stack", { get() { accessorReads++; throw new Error("SECRET"); } });
    for (let i = 0; i < 10; i++) await expect(stopSynthetic(owned, entry, { kill: () => { throw error; } })).rejects.toBe(error);
    expect(entry.cleanup_diagnostics).toHaveLength(4);
    expect(JSON.stringify(entry)).not.toContain("SECRET");
    expect(entry.cleanup_diagnostics?.[0]).not.toHaveProperty("code");
    expect(entry.cleanup_diagnostics?.[0]).not.toHaveProperty("errno");
    const getterError = Object.defineProperty({ code: "EPERM" }, "errno", { get() { accessorReads++; return -1; } });
    await expect(stopSynthetic(owned, record(), { kill: () => { throw getterError; } })).rejects.toBe(getterError);
    expect(accessorReads).toBe(0);
  });

  it("records injected wait failure and preserves thrown identity", async () => {
    const entry = record(), error = permission();
    await expect(stopSynthetic(owned, entry, { kill: () => {}, wait: async () => { throw error; } })).rejects.toBe(error);
    expect(entry.cleanup_diagnostics?.[0]).toMatchObject({ operation: "wait", signal: null });
  });
});

describe("Darwin bounded reaping (synthetic timing and permission controls)", () => {
  it.each(["SIGTERM", 0, "SIGKILL"])("retries transient %s EPERM but requires a later ESRCH", async target => {
    const entry = record(), waits: number[] = [], calls: unknown[] = [];
    let denied = false, killed = false;
    await stopOwned(owned, entry, { platform: "darwin", wait: async (ms: number) => { waits.push(ms); }, kill: (pid: number, signal: string | number) => {
      expect(pid).toBe(-owned.pid);
      calls.push(signal);
      if (signal === target && !denied) { denied = true; throw permission(); }
      if (signal === "SIGKILL") killed = true;
      if (signal === 0 && (target !== "SIGKILL" || killed)) throw absent();
    } });
    expect(denied).toBe(true);
    expect(waits).toEqual(Array(target === "SIGKILL" ? 41 : 1).fill(100));
    expect(entry.cleanup_reap_waits).toBe(1);
    expect(entry).not.toHaveProperty("cleanup_diagnostics");
    expect(calls.at(-1)).toBe(0);
    expect(JSON.stringify(entry)).not.toContain("SECRET");
  });

  it.each(["SIGTERM", 0, "SIGKILL"])("keeps persistent %s EPERM fatal after exactly ten shared waits", async target => {
    const entry = record(), waits: number[] = [], errors: Error[] = [], firstError = permission();
    await expect(stopOwned(owned, entry, { platform: "darwin", wait: async (ms: number) => { waits.push(ms); }, kill: (pid: number, signal: string | number) => {
      expect(pid).toBe(-owned.pid);
      if (signal === target) { const error = errors.length ? permission() : firstError; errors.push(error); throw error; }
    } })).rejects.toBe(firstError);
    expect(errors).toHaveLength(11);
    expect(waits).toEqual(Array(target === "SIGKILL" ? 50 : 10).fill(100));
    expect(entry.cleanup_reap_waits).toBe(10);
    expect(entry.cleanup_diagnostics).toEqual([{ pid: owned.pid, process_group: owned.pid, stage: target === "SIGKILL" ? "escalate" : "terminate", operation: target === 0 ? "probe" : "signal", signal: target, code: "EPERM", errno: -1 }]);
    expect(JSON.stringify(entry)).not.toContain("SECRET");
  });

  it("shares the ten waits across signal and probe instead of resetting per operation", async () => {
    const entry = record();
    let termErrors = 0, probeErrors = 0, waits = 0;
    const firstProbeError = permission();
    await expect(stopOwned(owned, entry, { platform: "darwin", wait: async () => { waits++; }, kill: (_pid: number, signal: string | number) => {
      if (signal === "SIGTERM" && termErrors++ < 5) throw permission();
      if (signal === 0) { probeErrors++; throw firstProbeError; }
    } })).rejects.toBe(firstProbeError);
    expect(waits).toBe(10);
    expect(probeErrors).toBe(6);
    expect(entry.cleanup_reap_waits).toBe(10);
    expect(entry.cleanup_diagnostics?.[0]).toMatchObject({ operation: "probe", signal: 0 });
  });

  it.each(["EACCES", "EINVAL", "EIO"])("does not retry %s on Darwin", async code => {
    const error = Object.assign(new Error("synthetic"), { code });
    let calls = 0, waits = 0;
    await expect(stopOwned(owned, record(), { platform: "darwin", kill: () => { calls++; throw error; }, wait: async () => { waits++; } })).rejects.toBe(error);
    expect(calls).toBe(1);
    expect(waits).toBe(0);
  });

  it("never accepts a live group after a transient EPERM", async () => {
    const entry = record();
    let calls = 0, waits = 0;
    await expect(stopOwned(owned, entry, { platform: "darwin", kill: () => { if (++calls === 1) throw permission(); }, wait: async () => { waits++; } })).rejects.toThrow("owned Wrangler/workerd process group must stop");
    expect(waits).toBe(71);
    expect(entry.cleanup_reap_waits).toBe(1);
    expect(entry.cleanup_diagnostics?.[0]).toMatchObject({ code: "ERR_ASSERTION", stage: "verify" });
  });

  it("keeps a later different error and a reaping-wait error exact", async () => {
    const error = Object.assign(new Error("later failure"), { code: "EACCES" });
    let calls = 0;
    await expect(stopOwned(owned, record(), { platform: "darwin", kill: () => { throw ++calls === 1 ? permission() : error; }, wait: async () => {} })).rejects.toBe(error);
    const entry = record(), waitError = permission();
    await expect(stopOwned(owned, entry, { platform: "darwin", kill: () => { throw permission(); }, wait: async () => { throw waitError; } })).rejects.toBe(waitError);
    expect(entry.cleanup_diagnostics?.[0]).toMatchObject({ operation: "wait", signal: null });
  });
});

describe("real production cleanup", () => {
  it("stops only its own spawned detached child without diagnostics", async () => {
    const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { detached: true, stdio: "ignore" });
    await once(child, "spawn");
    const entry = { phase: "test-own-child", pid: child.pid! };
    try {
      await stopOwned(child, entry);
      expect(child.signalCode).toBe("SIGTERM");
      expect(entry).not.toHaveProperty("cleanup_diagnostics");
    } finally {
      // Same production cleanup and same owned child only, even if assertion fails.
      await stopOwned(child, entry);
    }
  });
});
