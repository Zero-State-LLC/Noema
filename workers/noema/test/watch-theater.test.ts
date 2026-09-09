import { describe, expect, it } from "vitest";
import {
  NOT_PROJECTED_PUBLICLY,
  WITHHELD_FOLLOWED_SITE,
  WITHHELD_INSTITUTION,
  WITHHELD_LEDE,
  WITHHELD_NONE,
  WITHHELD_NOTICE_AUTHOR,
  agentsInPublicSitesCaption,
  followedSiteWithheld,
  heroFactValue,
  namedListLine,
  recentFactParts,
  theaterEventPool,
  watchTheaterInlineSource,
  withheldBandLines,
  withheldFromProjection,
} from "../src/watch-theater";
import { watchHtml } from "../src/watch";

describe("recentFactParts", () => {
  it("paints Who Where Consequence when the public fields exist", () => {
    expect(recentFactParts("reach-maint3", "Civic Exchange", "stocks recovered")).toEqual([
      "Who reach-maint3",
      "Where Civic Exchange",
      "Consequence stocks recovered",
    ]);
  });

  it("omits a slot when the public field is absent and never invents", () => {
    expect(recentFactParts("", "Civic Exchange", "")).toEqual(["Where Civic Exchange"]);
    expect(recentFactParts("  ", "", "  ")).toEqual([]);
    expect(recentFactParts("reach-maint3", "", "")).toEqual(["Who reach-maint3"]);
    expect(recentFactParts("", "", "stocks recovered")).toEqual(["Consequence stocks recovered"]);
  });
});

describe("heroFactValue", () => {
  it("keeps a public value and names an honest absence otherwise", () => {
    expect(heroFactValue("reach-maint3")).toBe("reach-maint3");
    expect(heroFactValue("")).toBe(NOT_PROJECTED_PUBLICLY);
    expect(heroFactValue("   ")).toBe(NOT_PROJECTED_PUBLICLY);
    expect(heroFactValue(undefined)).toBe(NOT_PROJECTED_PUBLICLY);
    expect(heroFactValue(null)).toBe(NOT_PROJECTED_PUBLICLY);
  });
});

describe("namedListLine", () => {
  it("lists unique public names and uses an honest empty", () => {
    expect(namedListLine("Actors", ["reach-maint3", "reach-maint3", "  ", "LUDUS"])).toBe(
      "Actors: reach-maint3, LUDUS",
    );
    expect(namedListLine("Sites", [])).toBe("Sites: none named");
    expect(namedListLine("", ["Civic Exchange"])).toBe("Named: Civic Exchange");
    expect(namedListLine("Actors", null)).toBe("Actors: none named");
    expect(namedListLine(undefined, undefined)).toBe("Named: none named");
  });
});

describe("agentsInPublicSitesCaption", () => {
  it("demotes occupancy to a secondary caption", () => {
    expect(agentsInPublicSitesCaption(0)).toBe("Agents in public sites: 0");
    expect(agentsInPublicSitesCaption(1)).toBe("Agents in public sites: 1");
    expect(agentsInPublicSitesCaption(2.9)).toBe("Agents in public sites: 2");
    expect(agentsInPublicSitesCaption(Number.NaN)).toBe("Agents in public sites: 0");
    expect(agentsInPublicSitesCaption(-3)).toBe("Agents in public sites: 0");
  });
});

describe("withheldFromProjection", () => {
  it("marks notice author and institution name only when those events lack an actor", () => {
    expect(withheldFromProjection("message_notice", "")).toBe(WITHHELD_NOTICE_AUTHOR);
    expect(withheldFromProjection("notice", "  ")).toBe(WITHHELD_NOTICE_AUTHOR);
    expect(withheldFromProjection("organization", "")).toBe(WITHHELD_INSTITUTION);
    expect(withheldFromProjection("message_notice", "reach-maint3")).toBe("");
    expect(withheldFromProjection("organization", "Reach Compact")).toBe("");
    expect(withheldFromProjection("production", "")).toBe("");
    expect(withheldFromProjection("", "")).toBe("");
  });
});

describe("withheldBandLines", () => {
  it("dedupes honest marks and stays visible when empty", () => {
    expect(withheldBandLines([])).toEqual([WITHHELD_NONE]);
    expect(withheldBandLines(undefined)).toEqual([WITHHELD_NONE]);
    expect(withheldBandLines(null)).toEqual([WITHHELD_NONE]);
    expect(withheldBandLines(["", "  "])).toEqual([WITHHELD_NONE]);
    expect(withheldBandLines([WITHHELD_NOTICE_AUTHOR, WITHHELD_NOTICE_AUTHOR, WITHHELD_INSTITUTION])).toEqual([
      WITHHELD_NOTICE_AUTHOR,
      WITHHELD_INSTITUTION,
    ]);
  });
});

describe("followedSiteWithheld", () => {
  it("names a followed agent site only as a public absence", () => {
    expect(followedSiteWithheld("agent", false)).toBe(WITHHELD_FOLLOWED_SITE);
    expect(followedSiteWithheld("agent", true)).toBe("");
    expect(followedSiteWithheld("site", false)).toBe("");
    expect(followedSiteWithheld("", false)).toBe("");
  });
});

describe("theaterEventPool", () => {
  it("keeps notable plus recent without inventing or duplicating", () => {
    const head = { sequence: 2, projection_id: "message_notice", line: "A report is circulating." };
    const events = [
      head,
      { sequence: 1, projection_id: "production", line: "Stocks recovered at Civic Exchange" },
      null,
    ];
    expect(theaterEventPool(head, events)).toEqual([
      head,
      { sequence: 1, projection_id: "production", line: "Stocks recovered at Civic Exchange" },
    ]);
    expect(theaterEventPool(null, [])).toEqual([]);
    expect(theaterEventPool(null, undefined)).toEqual([]);
    expect(theaterEventPool(null, null)).toEqual([]);
  });
});

const THEATER_INLINE_FNS = [
  theaterEventPool,
  recentFactParts,
  heroFactValue,
  namedListLine,
  agentsInPublicSitesCaption,
  withheldFromProjection,
  withheldBandLines,
  followedSiteWithheld,
];

describe("inlined theater helpers are self-contained", () => {
  it("rejects bundler keepNames __name in helper source", () => {
    const src = watchTheaterInlineSource();
    expect(src).not.toContain("__name");
    const main = watchHtml()
      .split("<script>")
      .map((s) => s.split("</script>")[0])
      .find((s) => s.includes("POLL_MS") && s.includes("theaterEventPool"));
    expect(main).toBeTruthy();
    expect(main).not.toContain("__name");
  });

  it("keeps each helper a leaf so wrangler cannot inject __name", () => {
    for (const fn of THEATER_INLINE_FNS) {
      const src = fn.toString();
      const body = src.slice(src.indexOf("{") + 1, src.lastIndexOf("}"));
      expect(body, fn.name).not.toMatch(/\bfunction\b/);
    }
  });

  it("runs the inlined source without a __name global", () => {
    const fns = new Function(
      `${watchTheaterInlineSource()}; return { theaterEventPool, heroFactValue, namedListLine, agentsInPublicSitesCaption };`,
    )() as {
      theaterEventPool: typeof theaterEventPool;
      heroFactValue: typeof heroFactValue;
      namedListLine: typeof namedListLine;
      agentsInPublicSitesCaption: typeof agentsInPublicSitesCaption;
    };
    expect(fns.heroFactValue("")).toBe(NOT_PROJECTED_PUBLICLY);
    expect(fns.namedListLine("Actors", ["reach-maint3"])).toBe("Actors: reach-maint3");
    expect(fns.agentsInPublicSitesCaption(0)).toBe("Agents in public sites: 0");
    expect(fns.theaterEventPool({ line: "A report is circulating." }, [
      { line: "A report is circulating." },
      { sequence: 1, actor_label: "reach-maint3", room_id: "room.civic-exchange", consequence: "Stocks recovered" },
    ])).toHaveLength(2);
  });
});

describe("watch HTML ships Gate D TEXT chrome", () => {
  const html = watchHtml();

  it("places the public now strip before Places and demotes occupancy", () => {
    expect(html.indexOf('id="watch-now-strip"')).toBeGreaterThan(-1);
    expect(html.indexOf('id="watch-now-strip"')).toBeLessThan(html.indexOf('id="watch-graph-label"'));
    expect(html).toContain("Public now");
    expect(html).toContain('id="watch-now-actors"');
    expect(html).toContain('id="watch-now-sites"');
    expect(html).toContain("Agents in public sites:");
    expect(html).not.toMatch(/<span class="k">Players<\/span>/);
    expect(html).toContain('id="watch-players"');
  });

  it("keeps a Withheld band and the spectator note", () => {
    expect(html).toContain('id="watch-withheld"');
    expect(html).toContain('id="watch-withheld-list"');
    expect(html).toContain(WITHHELD_LEDE);
    expect(html).toContain(WITHHELD_NONE);
    expect(html).toContain("This window is a projection, not the world.");
    expect(html).toContain('id="watch-hero-who"');
    expect(html).toContain('id="watch-hero-where"');
    expect(html).toContain("Followed");
  });
});
