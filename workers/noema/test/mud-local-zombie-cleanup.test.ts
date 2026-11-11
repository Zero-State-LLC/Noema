import { describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { stopOwned } from "../scripts/mud-local-acceptance.mjs";

// The supervisor deliberately cannot dispatch libuv's child-exit callback during
// Atomics.wait. Its detached child therefore remains unreaped, without a compiler
// or a mocked kill. Both processes finish themselves even if cleanup rejects.
async function unreapedGroup(blockMs: number) {
  const supervisor = spawn(process.execPath, ["-e", `
    const { spawn } = require('node:child_process');
    const child = spawn(process.execPath, ['-e',
      "process.stdout.write('ready'); process.stdin.once('data', () => process.exit(0)); setTimeout(() => process.exit(2), 5000)"
    ], { detached: true, stdio: ['pipe', 'pipe', 'inherit'] });
    child.once('error', () => process.exit(3));
    child.once('exit', () => process.exit(0));
    child.stdout.once('data', () => {
      process.stdout.write(String(child.pid) + '\\n');
      child.stdin.end('exit\\n');
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ${blockMs});
    });
    setTimeout(() => process.exit(4), 7000);
  `], { stdio: ["ignore", "pipe", "pipe"] });
  const exited = new Promise<number | null>((resolve, reject) => {
    supervisor.once("exit", resolve);
    supervisor.once("error", reject);
  });
  let output = "", stderr = "";
  supervisor.stdout.on("data", chunk => { output += chunk.toString(); });
  supervisor.stderr.on("data", chunk => { stderr += chunk.toString(); });
  try {
    const deadline = Date.now() + 3000;
    while (!output.includes("\n") && Date.now() < deadline && supervisor.exitCode === null) await delay(5);
    const pid = Number(output.trim());
    expect(Number.isSafeInteger(pid)).toBe(true);
    expect(pid, `supervisor output: ${output}, stderr: ${stderr}`).toBeGreaterThan(1);
    return { pid, exited };
  } catch (error) {
    await exited;
    throw error;
  }
}

function groupError(pid: number): NodeJS.ErrnoException | undefined {
  try { process.kill(-pid, 0); return undefined; }
  catch (error) { return error as NodeJS.ErrnoException; }
}

async function observeZombiePermission(pid: number) {
  const deadline = Date.now() + 300;
  let error: NodeJS.ErrnoException | undefined;
  do {
    error = groupError(pid);
    if (error?.code === "EPERM") return;
    await delay(2);
  } while (Date.now() < deadline);
  expect(error?.code, "Darwin must actually expose the unreaped owned group as EPERM").toBe("EPERM");
}

describe.skipIf(process.platform === "win32")("real OS owned group cleanup", () => {
  it("waits for an actually unreaped detached Node child before proving group absence", async () => {
    const helper = await unreapedGroup(600);
    try {
      if (process.platform === "darwin") await observeZombiePermission(helper.pid);
      const entry: { phase: string; pid: number; cleanup_reap_waits?: number } = { phase: "real-node-zombie", pid: helper.pid };
      await stopOwned({ pid: helper.pid }, entry);
      if (process.platform === "darwin") {
        expect(entry.cleanup_reap_waits).toBeGreaterThan(0);
        expect(entry.cleanup_reap_waits).toBeLessThanOrEqual(10);
      }
      expect(groupError(helper.pid)?.code).toBe("ESRCH");
      expect(entry).not.toHaveProperty("cleanup_diagnostics");
    } finally {
      expect(await helper.exited).toBe(0);
      expect(groupError(helper.pid)?.code).toBe("ESRCH");
    }
  }, 10_000);

  it.runIf(process.platform === "darwin")("rejects a real unreaped group that outlasts the bounded grace", async () => {
    const helper = await unreapedGroup(3000);
    try {
      await observeZombiePermission(helper.pid);
      const entry: { phase: string; pid: number; cleanup_reap_waits?: number; cleanup_diagnostics?: object[] } = { phase: "real-held-zombie", pid: helper.pid };
      await expect(stopOwned({ pid: helper.pid }, entry)).rejects.toMatchObject({ code: "EPERM" });
      expect(entry.cleanup_reap_waits).toBe(10);
      expect(entry.cleanup_diagnostics).toEqual([expect.objectContaining({ pid: helper.pid, process_group: helper.pid, operation: "signal", signal: "SIGTERM", code: "EPERM" })]);
      expect(groupError(helper.pid)?.code).toBe("EPERM");
    } finally {
      expect(await helper.exited).toBe(0);
      expect(groupError(helper.pid)?.code).toBe("ESRCH");
    }
  }, 10_000);

  it("still closes an ordinary live owned detached child", async () => {
    const child = spawn(process.execPath, ["-e", "setTimeout(() => process.exit(0), 3000)"], { detached: true, stdio: "ignore" });
    const exited = once(child, "exit");
    await once(child, "spawn");
    try {
      const entry = { phase: "real-live-child", pid: child.pid! };
      await stopOwned(child, entry);
      expect(entry).not.toHaveProperty("cleanup_diagnostics");
      expect(groupError(child.pid!)?.code).toBe("ESRCH");
    } finally {
      await exited;
    }
  }, 10_000);
});
