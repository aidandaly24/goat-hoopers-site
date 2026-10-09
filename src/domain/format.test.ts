import { describe, expect, it } from "vitest";
import { UNAVAILABLE_TOTAL, fmtTotal, totalLabel } from "./format";
import { toTeam } from "@/data/transform";
import type { RawRoster } from "@/data/sleeper";

/**
 * Fixture builder for a Sleeper roster whose settings match the confirmed
 * /teams/1 + /teams/5 symptom: PF is a known zero, PA is absent from the
 * raw payload (fpts_against undefined at runtime even though the raw type
 * claims `number`). The cast documents that source-contract gap.
 */
function preseasonRoster(
  rosterId: number,
  overrides: Partial<{
    fpts: number;
    fpts_decimal: number;
    fpts_against: number;
    fpts_against_decimal: number;
  }> = {}
): RawRoster {
  return {
    roster_id: rosterId,
    owner_id: "owner",
    players: [],
    settings: {
      wins: 0,
      losses: 0,
      ties: 0,
      fpts: 0,
      fpts_decimal: 0,
      fpts_against: undefined as unknown as number,
      fpts_against_decimal: undefined as unknown as number,
      ...overrides,
    },
  };
}

describe("fmtTotal", () => {
  it("formats a known zero as 0.0, not unavailable", () => {
    expect(fmtTotal(0)).toBe("0.0");
  });

  it("formats an ordinary positive total with one decimal", () => {
    expect(fmtTotal(12345)).toBe("123.5");
    expect(fmtTotal(5025)).toBe("50.3");
  });

  it("renders missing input as the unavailable glyph", () => {
    expect(fmtTotal(null)).toBe(UNAVAILABLE_TOTAL);
    expect(fmtTotal(undefined)).toBe(UNAVAILABLE_TOTAL);
  });

  it("never leaks NaN or Infinity strings", () => {
    expect(fmtTotal(NaN)).toBe(UNAVAILABLE_TOTAL);
    expect(fmtTotal(Infinity)).toBe(UNAVAILABLE_TOTAL);
    expect(fmtTotal(-Infinity)).toBe(UNAVAILABLE_TOTAL);
  });
});

describe("totalLabel", () => {
  it("labels a known total with its value", () => {
    expect(totalLabel("Points against", 12345)).toBe("Points against 123.5");
  });

  it("distinguishes a known zero from missing input", () => {
    expect(totalLabel("Points against", 0)).toBe("Points against 0.0");
    expect(totalLabel("Points against", null)).toBe(
      "Points against not yet recorded"
    );
    expect(totalLabel("Points against", undefined)).toBe(
      "Points against not yet recorded"
    );
    expect(totalLabel("Points against", NaN)).toBe(
      "Points against not yet recorded"
    );
  });
});

describe("/teams/1 and /teams/5 PA fixtures (issue #94)", () => {
  it("renders PA as unavailable when fpts_against is absent, keeps PF 0.0", () => {
    for (const rosterId of [1, 5]) {
      const team = toTeam(preseasonRoster(rosterId), undefined);
      // Raw symptom reproduced: domain value is nonfinite at runtime.
      expect(Number.isFinite(team.pointsAgainst)).toBe(false);
      expect(fmtTotal(team.pointsAgainst)).toBe(UNAVAILABLE_TOTAL);
      expect(totalLabel("Points against", team.pointsAgainst)).toBe(
        "Points against not yet recorded"
      );
      // Known-zero PF is preserved, not coerced to unavailable.
      expect(fmtTotal(team.pointsFor)).toBe("0.0");
    }
  });

  it("renders a healthy team's PA normally", () => {
    const team = toTeam(
      preseasonRoster(2, { fpts: 100, fpts_against: 50, fpts_against_decimal: 25 }),
      undefined
    );
    expect(fmtTotal(team.pointsAgainst)).toBe("50.3");
    expect(totalLabel("Points against", team.pointsAgainst)).toBe(
      "Points against 50.3"
    );
  });
});
