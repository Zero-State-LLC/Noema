/**
 * GC6-S1 Player-authored reconstruction. Not canonical history.
 * Authority: Noema-Specs RFC-0024 / docs/GC6-S1-RECONSTRUCTION.md.
 */

import { deterministicId } from "./ids";

import type { ArchiveClaim, DiscoveryState } from "./discovery";
import { ensureDiscovery, isArchiveClaim } from "./discovery";

export const RECONSTRUCTION_CATALOG_ID = "reconstruction-catalog/gc6-s1";
export const HOSTED_EVIDENCE_KINDS = ["ARCHIVE_CLAIM", "LIVE_INSPECT"] as const;
export type ReconstructionKind = (typeof HOSTED_EVIDENCE_KINDS)[number];
export type ReconstructionVisibility = "PRIVATE" | "INSTITUTIONAL" | "PUBLIC";
export type ReconstructionStatus = "RECORDED" | "SUPERSEDED";
export type ReconstructionEpistemic = "OPEN" | "CONTESTED";

export type ReconstructionEvidence = {
  kind: ReconstructionKind;
  subject_ref: string;
  source_entity_id: string;
  label?: ArchiveClaim;
  cycle: number;
};

export type ReconstructionRecord = {
  reconstruction_id: string;
  author_player_id: string;
  subject_ref: string;
  claim: string;
  evidence_refs: ReconstructionEvidence[];
  created_cycle: number;
  supersedes_reconstruction_id?: string;
  status: ReconstructionStatus;
  visibility: ReconstructionVisibility;
  epistemic: ReconstructionEpistemic;
  org_id?: string;
  /** Deep Time: fidelity vs evidence fragments. Not ledger rewrite. */
  fidelity?: number;
};

export function allocateReconstructionId(seq?: number, cycle?: number, subject?: string): string {
  // ADR-008: derived from committed world facts, not an implicit random stream.
  return deterministicId("recon", seq, cycle, subject);
}

export function parseVisibility(raw: string | undefined | null): ReconstructionVisibility {
  const v = String(raw || "PRIVATE").trim().toUpperCase();
  if (v === "PUBLIC") return "PUBLIC";
  if (v === "INSTITUTIONAL") return "INSTITUTIONAL";
  return "PRIVATE";
}

export function parseEvidenceKind(raw: string | undefined | null): ReconstructionKind | null {
  const v = String(raw || "").trim().toUpperCase();
  if (v === "ARCHIVE" || v === "ARCHIVE_CLAIM") return "ARCHIVE_CLAIM";
  if (v === "INSPECT" || v === "LIVE_INSPECT") return "LIVE_INSPECT";
  return null;
}

export function evidenceAccessible(
  discovery: DiscoveryState | undefined,
  kind: ReconstructionKind,
  subject: string,
): ArchiveClaim | null {
  const snap = ensureDiscovery(discovery);
  if (kind === "ARCHIVE_CLAIM") {
    const claim = snap.archives[subject];
    return isArchiveClaim(claim) ? claim : null;
  }
  const obs = snap.inspects[subject];
  return isArchiveClaim(obs) ? obs : null;
}

export function epistemicFromEvidence(refs: ReconstructionEvidence[]): ReconstructionEpistemic {
  const archive = refs.find((r) => r.kind === "ARCHIVE_CLAIM")?.label;
  const inspect = refs.find((r) => r.kind === "LIVE_INSPECT")?.label;
  if (archive && inspect && archive !== inspect) return "CONTESTED";
  return "OPEN";
}

export function visibleTo(
  rec: ReconstructionRecord,
  playerId: string,
  orgRole: string | null,
): boolean {
  if (rec.author_player_id === playerId) return true;
  if (rec.visibility === "PUBLIC") return true;
  if (rec.visibility === "INSTITUTIONAL" && orgRole) return true;
  return false;
}

/**
 * Gate B: multi-controller contention labels for WATCH evidence lines.
 * Returns a deterministic label for each distinct controller_id contributing
 * evidence to a reconstruction, for display in WATCH output.
 */
export function controllerContentionLabels(
  refs: ReconstructionEvidence[],
): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const ref of refs) {
    const cid = ref.source_entity_id;
    if (cid && !seen.has(cid)) {
      seen.add(cid);
      labels.push(cid.replace(/^ctrl\./, "").slice(0, 16));
    }
  }
  return labels;
}

export function reconstructionLines(
  recs: ReconstructionRecord[],
  names: Record<string, string | undefined>,
): string[] {
  const out: string[] = [];
  for (const rec of recs) {
    const isContested = rec.epistemic === "CONTESTED";
    const status = isContested ? "Contested" : "Recorded";
    const n = rec.evidence_refs.length;
    const subject = rec.subject_ref.replace(/^entity\./, "");
    const displayName = names[rec.subject_ref] ?? names[subject] ?? subject;
    const account = rec.claim.trim().slice(0, 160);
    out.push(`Reconstruction: ${displayName}`);
    out.push(`Based on: ${n} accessible source${n === 1 ? "" : "s"}`);
    if (account) out.push(`Account: ${account}`);
    out.push(`Status: ${status}`);
    // Gate B: emit fidelity line when present (WATCH evidence support)
    if (typeof rec.fidelity === "number") {
      out.push(`Fidelity: ${rec.fidelity.toFixed(2)}`);
    }
    // Gate B: emit contention line when multiple independent controllers contributed
    const controllers = controllerContentionLabels(rec.evidence_refs);
    if (isContested && controllers.length >= 2) {
      out.push(`Contention: ${controllers.join(", ")}`);
    }
  }
  return out.slice(0, 20);
}
