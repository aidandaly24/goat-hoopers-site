/**
 * news.test.ts — sectionCoverageStatus (src/domain/news.ts).
 *
 * "latest" never needs identity inputs. The classified sections go
 * UNAVAILABLE — never silently empty — when the input they depend on
 * is unknown: without rosters nobody can be called a league player or
 * a free agent; without the draft board there is no Rookie Wire;
 * without the directory there is no name matching at all.
 */
import { describe, expect, it } from "vitest";
import type { NewsCoverage } from "@/domain/news";
import { sectionCoverageStatus } from "@/domain/news";

const OK: NewsCoverage = { rosters: "ok", directory: "ok", draft: "ok" };

describe("sectionCoverageStatus", () => {
  it("everything available when all inputs are ok", () => {
    expect(sectionCoverageStatus("latest", OK)).toBe("available");
    expect(sectionCoverageStatus("league", OK)).toBe("available");
    expect(sectionCoverageStatus("rookies", OK)).toBe("available");
    expect(sectionCoverageStatus("free-agency", OK)).toBe("available");
  });
  it("latest stays available when everything else is unknown", () => {
    const unknown: NewsCoverage = {
      rosters: "unknown",
      directory: "unknown",
      draft: "unknown",
    };
    expect(sectionCoverageStatus("latest", unknown)).toBe("available");
    expect(sectionCoverageStatus("league", unknown)).toBe("unavailable");
    expect(sectionCoverageStatus("rookies", unknown)).toBe("unavailable");
    expect(sectionCoverageStatus("free-agency", unknown)).toBe("unavailable");
  });
  it("roster failure makes league + free-agency unavailable, not rookies", () => {
    const c: NewsCoverage = { ...OK, rosters: "unknown" };
    expect(sectionCoverageStatus("league", c)).toBe("unavailable");
    expect(sectionCoverageStatus("free-agency", c)).toBe("unavailable");
    expect(sectionCoverageStatus("rookies", c)).toBe("available");
  });
  it("draft failure makes only rookies unavailable", () => {
    const c: NewsCoverage = { ...OK, draft: "unknown" };
    expect(sectionCoverageStatus("rookies", c)).toBe("unavailable");
    expect(sectionCoverageStatus("league", c)).toBe("available");
    expect(sectionCoverageStatus("free-agency", c)).toBe("available");
  });
  it("directory failure makes every classified section unavailable", () => {
    const c: NewsCoverage = { ...OK, directory: "unknown" };
    expect(sectionCoverageStatus("league", c)).toBe("unavailable");
    expect(sectionCoverageStatus("rookies", c)).toBe("unavailable");
    expect(sectionCoverageStatus("free-agency", c)).toBe("unavailable");
  });
});
