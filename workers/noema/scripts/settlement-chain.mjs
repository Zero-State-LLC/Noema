/**
 * Pure settlement-chain helpers for inspect-settlement.
 * No I/O. Does not invent events or fill holes.
 */

export function missingSequences(present, fromInclusive, toInclusive) {
  const set = new Set((present || []).map((n) => Number(n)).filter((n) => Number.isFinite(n)));
  const from = Number(fromInclusive);
  const to = Number(toInclusive);
  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) return [];
  const missing = [];
  for (let s = from; s <= to; s++) {
    if (!set.has(s)) missing.push(s);
  }
  return missing;
}

/**
 * Adopt snapshots the live DO sequence and does not invent ledger 0..n.
 * Holes at or before adopt_sequence are expected. Post-adopt must be contiguous.
 */
export function summarizeChain({ sequences, headSequence, adoptSequence }) {
  const seqs = (sequences || []).map((n) => Number(n)).filter((n) => Number.isFinite(n));
  const head = Number(headSequence);
  const adopt = adoptSequence == null ? null : Number(adoptSequence);
  const allMissing = Number.isFinite(head) ? missingSequences(seqs, 0, head) : [];
  const preOrAtAdopt =
    adopt == null || !Number.isFinite(adopt) ? allMissing : allMissing.filter((s) => s <= adopt);
  const postMissing =
    adopt == null || !Number.isFinite(adopt) || !Number.isFinite(head)
      ? []
      : missingSequences(seqs, adopt + 1, head);
  return {
    event_rows: seqs.length,
    head_sequence: Number.isFinite(head) ? head : null,
    adopt_sequence: adopt != null && Number.isFinite(adopt) ? adopt : null,
    missing_at_or_before_adopt: preOrAtAdopt.length,
    post_adopt_holes: postMissing.length,
    post_adopt_contiguous: adopt != null && Number.isFinite(adopt) && postMissing.length === 0,
    missing_sample: allMissing.slice(0, 40),
  };
}

export function adoptSequenceFromReceipt(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.ledger_head_event_id || "");
  if (!id.startsWith("settlement.adopt-live.")) return null;
  const seq = Number(row.sequence);
  return Number.isFinite(seq) ? seq : null;
}

/** True when GET /rest/v1/ returned a parseable OpenAPI document. */
export function openApiAvailable(status, body) {
  return (
    status === 200 &&
    !!body &&
    typeof body === "object" &&
    body.parse_error !== true &&
    body.paths != null &&
    typeof body.paths === "object"
  );
}

/** Look up an RPC by name in OpenAPI paths. Never hits /rest/v1/rpc/*. */
export function openApiRpcPresent(spec, rpcName) {
  if (!spec || typeof spec !== "object") return false;
  const paths = spec.paths;
  if (!paths || typeof paths !== "object") return false;
  const name = String(rpcName || "");
  if (!name) return false;
  const suffix = `/rpc/${name}`;
  return Object.keys(paths).some((p) => p === name || p === suffix || p.endsWith(suffix));
}
