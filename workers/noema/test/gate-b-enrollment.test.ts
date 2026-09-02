/**
 * Gate B: multi-controller enrollment + reconstructionLines fidelity/contention tests.
 */
import { describe, expect, it } from "vitest";
import {
  requestAgentEnrollment,
  verifyEnrollmentIndependence,
  playerIdFromDeviceController,
} from "../src/device-enrollment";
import {
  reconstructionLines,
  controllerContentionLabels,
} from "../src/reconstruction";
import type { ReconstructionRecord } from "../src/reconstruction";

describe("requestAgentEnrollment (Gate B multi-controller)", () => {
  it("allocates distinct controller_ids and player_ids for 3 controllers", async () => {
    const result = await requestAgentEnrollment([
      { label: "controller-a" },
      { label: "controller-b" },
      { label: "controller-c" },
    ]);
    expect(result.receipts).toHaveLength(3);
    expect(result.contention).toHaveLength(0);
    const cids = result.receipts.map((r) => r.controller_id);
    expect(new Set(cids).size).toBe(3);
    const pids = result.receipts.map((r) => r.player_id);
    expect(new Set(pids).size).toBe(3);
  });

  it("produces a sha256 controller_binding_digest for each receipt", async () => {
    const result = await requestAgentEnrollment([{ label: "a" }, { label: "b" }, { label: "c" }]);
    for (const r of result.receipts) {
      expect(r.controller_binding_digest).toMatch(/^[0-9a-f]{64}$/);
    }
  });

  it("verifyEnrollmentIndependence passes a clean 3-receipt batch", async () => {
    const result = await requestAgentEnrollment([
      { label: "x" }, { label: "y" }, { label: "z" },
    ]);
    const check = verifyEnrollmentIndependence(result);
    expect(check.ok).toBe(true);
  });

  it("verifyEnrollmentIndependence rejects duplicate labels", async () => {
    const result = await requestAgentEnrollment([
      { label: "dup" }, { label: "dup" }, { label: "c" },
    ]);
    const check = verifyEnrollmentIndependence(result);
    expect(check.ok).toBe(false);
  });

  it("rejects batch with fewer than 3 receipts", async () => {
    const result = await requestAgentEnrollment([{ label: "a" }, { label: "b" }]);
    const check = verifyEnrollmentIndependence(result);
    expect(check.ok).toBe(false);
    expect(check.reason).toMatch(/need 3/);
  });
});

describe("controllerContentionLabels", () => {
  it("returns distinct controller labels from evidence refs", () => {
    const refs = [
      { kind: "LIVE_INSPECT" as const, subject_ref: "entity.foo", source_entity_id: "ctrl.device.aaa", cycle: 1 },
      { kind: "ARCHIVE_CLAIM" as const, subject_ref: "entity.foo", source_entity_id: "ctrl.device.bbb", cycle: 1 },
      { kind: "LIVE_INSPECT" as const, subject_ref: "entity.foo", source_entity_id: "ctrl.device.aaa", cycle: 2 },
    ];
    const labels = controllerContentionLabels(refs);
    expect(labels).toHaveLength(2);
    expect(labels[0]).toBe("device.aaa");
    expect(labels[1]).toBe("device.bbb");
  });
});

describe("reconstructionLines (Gate B fidelity + contention)", () => {
  const makeRec = (overrides: Partial<ReconstructionRecord> = {}): ReconstructionRecord => ({
    reconstruction_id: "recon.1",
    author_player_id: "player.test",
    subject_ref: "entity.oak",
    claim: "The oak is ancient",
    evidence_refs: [],
    created_cycle: 1,
    status: "RECORDED",
    visibility: "PUBLIC",
    epistemic: "OPEN",
    ...overrides,
  });

  it("emits fidelity line when fidelity is set", () => {
    const lines = reconstructionLines([makeRec({ fidelity: 0.75 })], {});
    expect(lines.some((l) => l.startsWith("Fidelity:"))).toBe(true);
    expect(lines.some((l) => l.includes("0.75"))).toBe(true);
  });

  it("does not emit fidelity line when fidelity is absent", () => {
    const lines = reconstructionLines([makeRec()], {});
    expect(lines.some((l) => l.startsWith("Fidelity:"))).toBe(false);
  });

  it("emits Contention line for CONTESTED records with 2+ controllers", () => {
    const rec = makeRec({
      epistemic: "CONTESTED",
      evidence_refs: [
        { kind: "LIVE_INSPECT", subject_ref: "entity.oak", source_entity_id: "ctrl.device.aaa", cycle: 1 },
        { kind: "ARCHIVE_CLAIM", subject_ref: "entity.oak", source_entity_id: "ctrl.device.bbb", cycle: 1 },
      ],
    });
    const lines = reconstructionLines([rec], {});
    expect(lines.some((l) => l.startsWith("Contention:"))).toBe(true);
  });

  it("does not emit Contention line for OPEN records", () => {
    const rec = makeRec({
      epistemic: "OPEN",
      evidence_refs: [
        { kind: "LIVE_INSPECT", subject_ref: "entity.oak", source_entity_id: "ctrl.device.aaa", cycle: 1 },
        { kind: "ARCHIVE_CLAIM", subject_ref: "entity.oak", source_entity_id: "ctrl.device.bbb", cycle: 1 },
      ],
    });
    const lines = reconstructionLines([rec], {});
    expect(lines.some((l) => l.startsWith("Contention:"))).toBe(false);
  });

  it("uses displayName from names map", () => {
    const lines = reconstructionLines([makeRec({ subject_ref: "entity.oak" })], { "entity.oak": "Great Oak" });
    expect(lines[0]).toBe("Reconstruction: Great Oak");
  });
});
