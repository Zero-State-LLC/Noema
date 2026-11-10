import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { stopOwned } from "../scripts/mud-local-acceptance.mjs";

type Diagnostic = { pid: number; process_group: number; stage: string; operation: string; signal: string | number | null; code?: string; errno?: number };
type Record = { phase: string; pid: number; cleanup_diagnostics?: Diagnostic[] };
const owned = { pid: 12345 }; // Synthetic only: every test using this pid injects kill.
const absent = () => Object.assign(new Error("synthetic absent"), { code: "ESRCH" });
const permission = () => Object.assign(new Error("SECRET message"), { code: "EPERM", errno: -1, stack: "SECRET stack", env: "SECRET env", path: "SECRET path" });
const record = (): Record => ({ phase: "retained-storage restart", pid: owned.pid });

describe("owned cleanup failure diagnostics (synthetic OS failures)", () => {
  it.each(["signal", "probe"])("keeps %s EPERM fail-closed and exact error identity", async operation => {
    const error = permission(), entry = record(), calls: unknown[] = [];
    const kill = (pid: number, signal: string | number) => {
      calls.push([pid, signal]);
      if (operation === "signal" || signal === 0) throw error;
    };
    await expect(stopOwned(owned, entry, { kill })).rejects.toBe(error);
    expect(calls).toEqual(operation === "signal" ? [[-owned.pid, "SIGTERM"]] : [[-owned.pid, "SIGTERM"], [-owned.pid, 0]]);
    expect(entry.cleanup_diagnostics).toEqual([{ pid: owned.pid, process_group: owned.pid, stage: "terminate", operation, signal: operation === "signal" ? "SIGTERM" : 0, code: "EPERM", errno: -1 }]);
    expect(JSON.stringify(entry)).not.toContain("SECRET");
    expect(entry.phase).toBe("retained-storage restart");
    expect(entry).not.toHaveProperty("cleaned_up");
  });

  it("treats ESRCH as ordinary absence without diagnostics", async () => {
    const entry = record(), calls: unknown[] = [];
    await stopOwned(owned, entry, { kill: (pid: number, signal: unknown) => { calls.push([pid, signal]); throw absent(); } });
    expect(calls).toEqual([[-owned.pid, "SIGTERM"], [-owned.pid, 0], [-owned.pid, 0], [-owned.pid, 0], [-owned.pid, 0]]);
    expect(entry).not.toHaveProperty("cleanup_diagnostics");
  });

  it("preserves escalation, original 100ms/40+30 waits and live-group timeout", async () => {
    const entry = record(), signals: unknown[] = [], waits: number[] = [];
    await expect(stopOwned(owned, entry, { kill: (pid: number, signal: unknown) => { expect(pid).toBe(-owned.pid); signals.push(signal); }, wait: async (ms: number) => { waits.push(ms); } })).rejects.toThrow("owned Wrangler/workerd process group must stop");
    expect(signals.filter(s => s !== 0)).toEqual(["SIGTERM", "SIGKILL"]);
    expect(signals.filter(s => s === 0)).toHaveLength(72);
    expect(waits).toEqual(Array(70).fill(100));
    expect(entry.cleanup_diagnostics).toEqual([{ pid: owned.pid, process_group: owned.pid, stage: "verify", operation: "wait", signal: null, code: "ERR_ASSERTION" }]);
  });

  it("permits ordinary successful SIGKILL escalation without failure evidence", async () => {
    const entry = record(), signals: unknown[] = [];
    let killed = false, waits = 0;
    await stopOwned(owned, entry, { kill: (pid: number, signal: unknown) => {
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
    await expect(stopOwned(owned, entry, { kill: (_pid: number, signal: unknown) => { calls.push(signal); if (signal === "SIGKILL") throw error; }, wait: async () => {} })).rejects.toBe(error);
    expect(calls).toHaveLength(43);
    expect(entry.cleanup_diagnostics?.[0]).toMatchObject({ stage: "escalate", operation: "signal", signal: "SIGKILL", code: "EPERM" });
  });

  it("bounds records and excludes unsafe code, errno and accessor properties", async () => {
    const entry = record();
    let accessorReads = 0;
    const error = Object.assign(new Error("SECRET"), { code: "SECRET", errno: "SECRET" });
    Object.defineProperty(error, "stack", { get() { accessorReads++; throw new Error("SECRET"); } });
    for (let i = 0; i < 10; i++) await expect(stopOwned(owned, entry, { kill: () => { throw error; } })).rejects.toBe(error);
    expect(entry.cleanup_diagnostics).toHaveLength(4);
    expect(JSON.stringify(entry)).not.toContain("SECRET");
    expect(entry.cleanup_diagnostics?.[0]).not.toHaveProperty("code");
    expect(entry.cleanup_diagnostics?.[0]).not.toHaveProperty("errno");
    const getterError = Object.defineProperty({ code: "EPERM" }, "errno", { get() { accessorReads++; return -1; } });
    await expect(stopOwned(owned, record(), { kill: () => { throw getterError; } })).rejects.toBe(getterError);
    expect(accessorReads).toBe(0);
  });

  it("records injected wait failure and preserves thrown identity", async () => {
    const entry = record(), error = permission();
    await expect(stopOwned(owned, entry, { kill: () => {}, wait: async () => { throw error; } })).rejects.toBe(error);
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
