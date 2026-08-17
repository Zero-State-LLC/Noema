import { describe, expect, it } from "vitest";
import {
  CONSTRUCTION_CATALOG_ID,
  SHARE_COST,
  SHARE_FAMILY_CLOSED,
  SHARE_MAX_CO_OWNERS,
} from "../src/construction";
import { helpText } from "../src/actions";
import { projectionIdForEvent } from "../src/watch-live";

describe("GC2-S24 mapper", () => {
  it("closes SHARE at five and does not add a sixth stamp", () => {
    expect(CONSTRUCTION_CATALOG_ID).toBe("construction-catalog/gc2-s24");
    expect(SHARE_COST).toEqual({ compute: 1 });
    expect(SHARE_FAMILY_CLOSED).toBe(true);
    expect(SHARE_MAX_CO_OWNERS).toBe(5);
    expect(projectionIdForEvent("ENTITY_UPDATE", { operation: "SHARE" })).toBeNull();
    expect(helpText()).not.toMatch(/\bBUILD\b|\bSHARE\b/i);
  });
});
