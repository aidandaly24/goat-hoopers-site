/**
 * Season-stats card render regressions (dot HOLD on PR #254, issue #224 P4).
 *
 * The card must keep three states visually distinct:
 * - available: dated stat grid + source/GP/GS note;
 * - source-unavailable: feed failure — never worded as absence;
 * - no-recorded-stats: neutral dated absence — never "the season just
 *   tipped off", never a DNP inference.
 * A real all-zero line renders as zero production, never as absence.
 */
import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { PlayerDetail, ProductionSummary } from "@/domain";
import { PlayerPage } from "./PlayerPage";

const player = {
  id: "4864",
  fullName: "Yaxel Lendeborg",
  position: "PF",
  nbaTeam: "GSW",
  espnId: null,
};

const detail = (production?: ProductionSummary): PlayerDetail => ({
  player,
  team: null,
  transactions: [],
  draftPick: null,
  production,
});

const render = (production?: ProductionSummary) =>
  renderToStaticMarkup(<PlayerPage detail={detail(production)} teams={[]} />);

const AVAILABLE: ProductionSummary = {
  state: "available",
  production: {
    version: 1,
    kind: "season-average",
    season: "2026",
    source: "sleeper-stats",
    gp: 1,
    gs: 1,
    averages: {
      min: 29.0, pts: 12.0, reb: 3.0, ast: 2.0, stl: 1.0,
      blk: 0.0, tpm: 1.0, fgPct: 45.5, ftPct: 33.3,
    },
  },
};

const ZERO: ProductionSummary = {
  state: "available",
  production: {
    version: 1,
    kind: "season-average",
    season: "2026",
    source: "sleeper-stats",
    gp: 1,
    gs: 0,
    averages: {
      min: 0.0, pts: 0.0, reb: 0.0, ast: 0.0, stl: 0.0,
      blk: 0.0, tpm: 0.0, fgPct: null, ftPct: null,
    },
  },
};

test("available state renders the dated stat grid with source and GP/GS", () => {
  const html = render(AVAILABLE);
  expect(html).toContain("Season stats");
  for (const value of ["12.0", "3.0", "2.0", "29.0", "45.5%", "33.3%"]) {
    expect(html).toContain(value);
  }
  expect(html).toContain("2026");
  expect(html).toContain("1 GP");
  expect(html).toContain("Sleeper stat feed");
  expect(html).not.toContain("tipped off");
  expect(html).not.toContain("be reached");
});

test("source-unavailable is worded as a feed failure, never as absence", () => {
  const html = render({
    state: "unavailable",
    reason: "source-unavailable",
    season: "2026",
  });
  expect(html).toContain("Season stats");
  expect(html).toContain("be reached");
  expect(html).toContain("2026");
  expect(html).not.toContain("no recorded line");
  expect(html).not.toContain("tipped off");
});

test("no-recorded-stats is neutral and dated — no tip-off or DNP inference", () => {
  const html = render({
    state: "unavailable",
    reason: "no-recorded-stats",
    season: "2026",
  });
  expect(html).toContain("has no recorded line");
  expect(html).toContain("2026");
  expect(html).not.toContain("tipped off");
  expect(html).not.toContain("DNP");
  expect(html).not.toContain("be reached");
});

test("a real all-zero line renders zero production, never absence copy", () => {
  const html = render(ZERO);
  expect(html).toContain("0.0");
  expect(html).toContain("2026");
  expect(html).not.toContain("no recorded line");
  expect(html).not.toContain("be reached");
  expect(html).not.toContain("tipped off");
});
