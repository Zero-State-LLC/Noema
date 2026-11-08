import { expect, it as provenanceCase } from "vitest";
import { laterTraceInputs, projectRoomTraces, publicTraces } from "../src/play-traces";

// Retained-state projection fixture, not authority to create or rename an org.
function provenanceFixture() {
  const organization = {
    org_id: "org.audit-co-op.781abc01",
    name: "Audit_Co-op",
    offices: { steward: { status: "VACANT", display_name: "Steward" } },
  };
  const organizations: Record<string, typeof organization> = {
    [organization.org_id]: organization,
  };
  const input = {
    room_id: "room.audit",
    entities: [{ entity_id: "entity.audit-bench", owner_id: organization.org_id }],
    orgs: Object.values(organizations),
  };
  return { organization, organizations, input };
}

function projectedOrgTraces(input: ReturnType<typeof provenanceFixture>["input"]) {
  return projectRoomTraces(laterTraceInputs(input));
}

provenanceCase.each(["insignia", "memorial"] as const)(
  "resolves the %s trace reference to its canonical organization",
  (field) => {
    const { organization, organizations, input } = provenanceFixture();
    const trace = projectedOrgTraces(input).find((t) => t.source_state_ref.field === field);
    expect(trace).toBeDefined();
    const reference = trace!.source_state_ref;
    expect(reference.kind).toBe("org");
    if (reference.kind !== "org") throw new Error("Expected organization provenance");
    expect(organizations[reference.org_id], "Canonical organization reference must resolve").toBe(organization);
    expect(reference).toEqual({ kind: "org", org_id: organization.org_id, field });
  },
);

provenanceCase("preserves exact public copy and fields without mutating canonical-shaped input", () => {
  const { organization, input } = provenanceFixture();
  const before = structuredClone(input);
  const visible = publicTraces(projectedOrgTraces(input));
  expect(visible).toEqual([
    { kind: "notice", text: "Marks of Audit Co op remain here.", visibility: "public" },
    { kind: "notice", text: "Steward of Audit Co op stands vacant.", visibility: "public" },
  ]);
  for (const trace of visible) expect(Object.keys(trace).sort()).toEqual(["kind", "text", "visibility"]);
  expect(JSON.stringify(visible)).not.toContain(organization.org_id);
  expect(JSON.stringify(visible)).not.toContain("source_state_ref");
  expect(input).toEqual(before);
});

provenanceCase("a controlled display-name change does not retarget canonical provenance", () => {
  const { organization, organizations, input } = provenanceFixture();
  const before = projectedOrgTraces(input);
  organization.name = "Renamed_Co-op"; // Read-time intervention, not rename authority.
  const after = projectedOrgTraces(input);
  expect(after.map((trace) => trace.source_state_ref)).toEqual(before.map((trace) => trace.source_state_ref));
  for (const trace of after) {
    const reference = trace.source_state_ref;
    expect(reference.kind).toBe("org");
    if (reference.kind !== "org") throw new Error("Expected organization provenance");
    expect(organizations[reference.org_id]).toBe(organization);
  }
  expect(publicTraces(after).map((trace) => trace.text)).toEqual([
    "Marks of Renamed Co op remain here.",
    "Steward of Renamed Co op stands vacant.",
  ]);
});

provenanceCase("hidden owned work does not publish an organization mark or memorial", () => {
  const { input } = provenanceFixture();
  expect(projectedOrgTraces(input)).toHaveLength(2);
  const hiddenInput = { ...input, entities: input.entities.map((entity) => ({ ...entity, hidden: true })) };
  const before = structuredClone(hiddenInput);
  expect(projectedOrgTraces(hiddenInput)).toEqual([]);
  expect(hiddenInput).toEqual(before);
});
