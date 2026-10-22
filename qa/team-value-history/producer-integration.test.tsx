import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { historyDetailMatchesPoint, isTeamValueHistoryDetail } from "@/domain/team-value-history";
import { TeamValueHistory } from "@/surfaces/season-hub/TeamValueHistory";
import { TeamValueHistoryDetail } from "@/surfaces/season-hub/TeamValueHistoryDetail";
import { integratedEnvelope, integratedDetail, integratedSummary, integratedDeps } from "./integrated-producer-fixture";
import { getTeamValueHistory } from "@/data/team-value-history";
import { summarizeRosterValue } from "@/domain/roster-value";

const detailUrl = (generation: string, day: string) => new URL(`https://fixture.invalid/api/team-value-history/detail?${new URLSearchParams({ teamId: "1", generation, day })}`);

test("the actual history producer and headline sum agree on identical inputs; a later model does not rewrite saved history", async () => {
  const deps = integratedDeps(), ids = ["101", "102", "103"];
  const rows = await deps.quotes!.readWindow({ playerIds: ids, fromDay: "2025-10-20", toDay: "2026-10-21" });
  const at = rows.quotes.map(quote => quote.nativeTimestamp).sort().at(-1)!;
  const quotes = rows.quotes.filter(quote => quote.nativeTimestamp === at).map(quote => ({ playerId: quote.playerId, price: quote.priceCents / 100 }));
  const headline = summarizeRosterValue(ids, quotes), history = (await getTeamValueHistory("1", deps))!;
  expect(headline.complete).toBe(true); expect(headline.total).toBe(660);
  expect(history.points.at(-1)?.subtotalCents).toBe(Math.round(headline.total! * 100));
  expect(history.currentQuote?.subtotalCents).toBe(66000);
  const newer = summarizeRosterValue(ids, quotes.map((quote, index) => ({ ...quote, price: quote.price + (index === 0 ? 1 : 0) })));
  expect(newer.total).toBe(661);
  expect(history.points.at(-1)?.subtotalCents).toBe(66000);
  expect(history.points.at(-1)?.valuationAt).toBe(`${at}Z`);
});

test("real wired producer output matches consumer point/detail identity and retains exact quote time", async () => {
  const h = (await integratedEnvelope())!;
  expect(h.generation).toMatch(/^th2:2026-10-20T12:00:00.000Z:[0-9a-f]{24}$/);
  expect(h.points).toHaveLength(3);
  const d = await (await integratedDetail(detailUrl(h.generation, "2026-10-19"))).json();
  expect(isTeamValueHistoryDetail(d)).toBe(true);
  expect(historyDetailMatchesPoint(d, h.points.at(-1)!)).toBe(true);
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={d} />);
  expect(html).toContain("2026-10-19T04:00:00.123456Z");
  expect(html).toContain("season-boundary reconciliation");
  expect(renderToStaticMarkup(<TeamValueHistory history={h} />)).toContain("data-history-timeline");
});

test("actual membership-only and gap responses render distinct roster states without new points", async () => {
  const h = (await integratedEnvelope())!;
  const known = await (await integratedDetail(detailUrl(h.generation, "2025-11-01"))).json();
  expect(known.rosterCount).toBe(4); expect(known.priced).toBe(0); expect(known.subtotalCents).toBeNull();
  const html = renderToStaticMarkup(<TeamValueHistoryDetail detail={known} />);
  expect(html).toContain("Synthetic historical-only player104"); expect(html).toContain("completed startup draft");
  const gap = await (await integratedDetail(detailUrl(h.generation, "2026-06-01"))).json();
  expect(gap.rosterCount).toBeNull(); expect(gap.players).toEqual([]);
  expect(renderToStaticMarkup(<TeamValueHistoryDetail detail={gap} />)).toContain("The historical roster is unavailable");
  expect(h.points.some(p => p.day === known.day || p.day === gap.day)).toBe(false);
});

test("same-cutoff evidence correction produces actual409, while later request clock preserves the pinned view", async () => {
  const a = (await integratedEnvelope())!, b = (await integratedEnvelope(true))!;
  expect(a.asOf).toBe(b.asOf); expect(a.generation).not.toBe(b.generation);
  expect((await integratedDetail(detailUrl(a.generation, "2026-10-09"), true)).status).toBe(409);
  const accepted = await integratedDetail(detailUrl(b.generation, "2026-10-09"), true, true);
  expect(accepted.status).toBe(200); expect((await accepted.json()).generation).toBe(b.generation);
  const url = new URL(`https://fixture.invalid/api/team-value-history/summary?${new URLSearchParams({ teamId: "1", generation: b.generation, from: "2026-10-01", toExclusive: "2026-10-21" })}`);
  const summary = await integratedSummary(url, true, true);
  expect(summary.status).toBe(200); expect((await summary.json()).asOf).toBe(a.asOf);
});
