/** Synthetic causal diagnostic: actual producer → actual chart, with all I/O injected. */
import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { loadTeamHistoryState } from "../../src/data/team-value-history";
import { shiftHistoryDay } from "../../src/domain/team-value-history";
import { TeamValueHistoryChart } from "../../src/surfaces/season-hub/TeamValueHistoryChart";

test.each([14, 40])("%i supplied quote days survive producer and chart; there is no 14-day UI or pagination cap", async count => {
  const end = "2026-10-21";
  const quotes = Array.from({ length: count }, (_, index) => {
    const day = shiftHistoryDay(end, index - count + 1);
    return { quoteId: `synthetic-${day}`, playerId: "synthetic-player", priceCents: 10000 + index, nativeTimestamp: `${day}T04:00:00.000000` };
  });
  const state = await loadTeamHistoryState("1", {
    quotes: { readWindow: async () => ({ quotes, truncated: false }) },
    fetchAnchor: async () => ({ observedAt: "2026-10-21T11:00:00Z", teams: [{ id: "1", name: "Synthetic", players: ["synthetic-player"] }] }),
    fetchMoves: async () => [], now: () => new Date("2026-10-21T12:00:00Z"),
  });
  const envelope = state.envelope(state.leagueRange);
  expect(envelope.loadedRange).toEqual({ from: "2025-10-20", toExclusive: "2026-10-22" });
  expect(envelope.page.nextCursor).toBeNull();
  expect(envelope.points).toHaveLength(count);
  expect(envelope.points.every(point => point.priceKind === "recorded")).toBe(true);
  const html = renderToStaticMarkup(<TeamValueHistoryChart points={envelope.points} range={envelope.leagueRange} selectedDay={end} onSelectDay={() => {}} />);
  expect(html.match(/data-history-point=/g)).toHaveLength(count);
  expect(html).toContain(`${count} priced dates of 367 calendar days`);
  // No point is manufactured for the remaining calendar days.
  expect(html).toContain("data-history-gap");
});
