/**
 * Player-production loader regressions (dot HOLD on PR #254, issue #224 P4).
 *
 * These tests drive the REAL getPlayerDetail with only the Sleeper client
 * mocked out. The loader must:
 * - map a stats-fetch (or league-lookup) REJECTION to `source-unavailable`,
 *   never to `no-recorded-stats` — a failed fetch cannot establish absence;
 * - preserve the season whenever the league lookup succeeded;
 * - map a successful-but-empty line to `no-recorded-stats` with the season;
 * - project a real all-zero line as AVAILABLE (valid zero-production),
 *   never as an unavailable state;
 * - never let a production-join failure blank the rest of the detail.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../sleeper", async (importOriginal) => {
  const original = await importOriginal<typeof import("../sleeper")>();
  return {
    ...original,
    fetchRosters: vi.fn(),
    fetchUsers: vi.fn(),
    fetchPlayerDirectory: vi.fn(),
    fetchDrafts: vi.fn(),
    fetchLeague: vi.fn(),
    fetchSeasonStats: vi.fn(),
    fetchNbaState: vi.fn(),
    fetchTransactions: vi.fn(),
  };
});

import {
  fetchRosters,
  fetchUsers,
  fetchPlayerDirectory,
  fetchDrafts,
  fetchLeague,
  fetchSeasonStats,
  fetchNbaState,
  fetchTransactions,
} from "../sleeper";
import { getPlayerDetail } from "../league";

const league = { season: "2026" };
const ZERO_LINE = {
  gp: 1, gs: 0, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tpm: 0,
  fga: 0, fgm: 0, fta: 0, ftm: 0,
};

beforeEach(() => {
  vi.mocked(fetchRosters).mockResolvedValue([]);
  vi.mocked(fetchUsers).mockResolvedValue([]);
  vi.mocked(fetchPlayerDirectory).mockResolvedValue({});
  vi.mocked(fetchDrafts).mockResolvedValue([]);
  vi.mocked(fetchNbaState).mockRejectedValue(new Error("offline"));
  vi.mocked(fetchTransactions).mockResolvedValue([]);
  vi.mocked(fetchLeague).mockResolvedValue(league as never);
  vi.mocked(fetchSeasonStats).mockResolvedValue({});
});

describe("production join failure states", () => {
  it("a stats-fetch rejection is source-unavailable, not no-recorded-stats — and the page detail survives", async () => {
    vi.mocked(fetchSeasonStats).mockRejectedValue(new Error("sleeper 500"));
    const detail = await getPlayerDetail("4864");
    expect(detail).not.toBeNull();
    expect(detail!.player.id).toBe("4864");
    expect(detail!.production).toEqual({
      state: "unavailable",
      reason: "source-unavailable",
      season: "2026",
    });
  });

  it("a league-lookup rejection is source-unavailable with unknown season — the page detail survives", async () => {
    vi.mocked(fetchLeague).mockRejectedValue(new Error("sleeper 500"));
    const detail = await getPlayerDetail("4864");
    expect(detail).not.toBeNull();
    expect(detail!.production).toEqual({
      state: "unavailable",
      reason: "source-unavailable",
      season: null,
    });
  });

  it("a successful-but-empty line is no-recorded-stats with the season — not a failure", async () => {
    vi.mocked(fetchSeasonStats).mockResolvedValue({ "4864": {} });
    const detail = await getPlayerDetail("4864");
    expect(detail!.production).toEqual({
      state: "unavailable",
      reason: "no-recorded-stats",
      season: "2026",
    });
  });

  it("a real all-zero line is AVAILABLE zero-production — never an unavailable state", async () => {
    vi.mocked(fetchSeasonStats).mockResolvedValue({ "4864": ZERO_LINE });
    const detail = await getPlayerDetail("4864");
    const summary = detail?.production;
    if (summary?.state !== "available") throw new Error("expected available");
    expect(summary.production.season).toBe("2026");
    expect(summary.production.gp).toBe(1);
    expect(summary.production.averages).toMatchObject({
      pts: 0.0, reb: 0.0, ast: 0.0, stl: 0.0, blk: 0.0, tpm: 0.0, min: 0.0,
      fgPct: null, ftPct: null,
    });
  });
});
