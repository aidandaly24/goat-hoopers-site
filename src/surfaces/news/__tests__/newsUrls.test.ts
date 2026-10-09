/**
 * newsUrls.test.ts — the Newsroom URL contract (src/surfaces/news/newsUrls.ts).
 *
 * ?section= selects a section (Back/Forward/refresh-safe); ?story= and
 * ?revision= are legacy params from the retired fictional reader and must
 * be detected so the feed can show an honest "retired" notice instead of
 * a broken reader or a silently ignored param.
 */
import { describe, expect, it } from "vitest";
import {
  clearLegacyParamsHref,
  hasLegacyStoryParams,
  parseSectionParam,
  sectionHref,
} from "@/surfaces/news/newsUrls";

describe("parseSectionParam", () => {
  it("reads each valid section id", () => {
    expect(parseSectionParam("?section=latest")).toBe("latest");
    expect(parseSectionParam("?section=league")).toBe("league");
    expect(parseSectionParam("?section=rookies")).toBe("rookies");
    expect(parseSectionParam("?section=free-agency")).toBe("free-agency");
  });
  it("falls back to latest for missing, empty, or unknown values", () => {
    expect(parseSectionParam("")).toBe("latest");
    expect(parseSectionParam("?section=")).toBe("latest");
    expect(parseSectionParam("?section=bogus")).toBe("latest");
    expect(parseSectionParam("?section=ROOKIES")).toBe("latest");
    expect(parseSectionParam("?story=abc")).toBe("latest");
  });
  it("ignores unrelated params", () => {
    expect(parseSectionParam("?section=league&story=abc")).toBe("league");
  });
});

describe("hasLegacyStoryParams", () => {
  it("detects story and revision params", () => {
    expect(hasLegacyStoryParams("?story=abc")).toBe(true);
    expect(hasLegacyStoryParams("?revision=3")).toBe(true);
    expect(hasLegacyStoryParams("?story=abc&revision=3")).toBe(true);
    expect(hasLegacyStoryParams("?section=rookies&story=abc")).toBe(true);
  });
  it("is false for section-only and empty searches", () => {
    expect(hasLegacyStoryParams("?section=rookies")).toBe(false);
    expect(hasLegacyStoryParams("")).toBe(false);
  });
});

describe("sectionHref", () => {
  it("builds section hrefs (latest is the bare page)", () => {
    expect(sectionHref("latest")).toBe("/news");
    expect(sectionHref("league")).toBe("/news?section=league");
    expect(sectionHref("rookies")).toBe("/news?section=rookies");
    expect(sectionHref("free-agency")).toBe("/news?section=free-agency");
  });
});

describe("clearLegacyParamsHref", () => {
  it("strips story/revision while keeping the section", () => {
    expect(clearLegacyParamsHref("?section=rookies&story=abc")).toBe(
      "/news?section=rookies"
    );
    expect(clearLegacyParamsHref("?story=abc&revision=3")).toBe("/news");
    expect(clearLegacyParamsHref("?section=league")).toBe(
      "/news?section=league"
    );
    expect(clearLegacyParamsHref("")).toBe("/news");
  });
});
