import { expect, test, vi } from "vitest";
import { teamValueHistoryDetailFixture, teamValueHistoryFixture } from "@/test/team-value-history-fixture";
import { createTeamHistoryClient } from "./TeamValueHistoryClient";

const request = { teamId: "synthetic-team", generation: "synthetic-history-v1", day: "2026-10-19" };
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json" } });

test("fetches one selected date through an injected same-origin endpoint and preserves query/signal", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(teamValueHistoryDetailFixture(request.day)));
  const controller = new AbortController(), client = createTeamHistoryClient(fetcher, { detail: "/api/history-detail?fixture=1" });
  await expect(client.detail(request, controller.signal)).resolves.toMatchObject({ day: request.day });
  expect(fetcher).toHaveBeenCalledOnce();
  expect(fetcher.mock.calls[0][0]).toBe("/api/history-detail?fixture=1&teamId=synthetic-team&generation=synthetic-history-v1&day=2026-10-19");
  expect(fetcher.mock.calls[0][1]).toMatchObject({ signal: controller.signal, credentials: "same-origin", cache: "no-store" });
});
test.each(["https://example.com/api/history", "//example.com/api/history", "/teams/1", "/api/../private", "/api/history#fragment"])("rejects unsafe endpoint %s before any request", async endpoint => {
  const fetcher = vi.fn<typeof fetch>();
  await expect(createTeamHistoryClient(fetcher, { detail: endpoint }).detail(request, new AbortController().signal)).rejects.toThrow();
  expect(fetcher).not.toHaveBeenCalled();
});
test.each(["team", "day", "generation", "price", "failed-move"])("rejects a foreign or misleading detail payload: %s", async mode => {
  const value = teamValueHistoryDetailFixture(request.day);
  if (mode === "team") value.teamId = "other-team";
  if (mode === "day") value.day = "2026-10-18";
  if (mode === "generation") value.generation = "other-generation";
  if (mode === "price") value.players[0].price = null;
  if (mode === "failed-move") (value.moves[0] as unknown as { status: string }).status = "failed";
  const client = createTeamHistoryClient(vi.fn<typeof fetch>().mockResolvedValue(json(value)), { detail: "/api/history" });
  await expect(client.detail(request, new AbortController().signal)).rejects.toMatchObject({ kind: "invalid" });
});
test("preserves generation409 and source503 without inventing data", async () => {
  for (const [status, kind] of [[409, "changed"], [503, "unavailable"]] as const) {
    const client = createTeamHistoryClient(vi.fn<typeof fetch>().mockResolvedValue(new Response("", { status })), { detail: "/api/history" });
    await expect(client.detail(request, new AbortController().signal)).rejects.toMatchObject({ kind });
  }
});
test("enforces a bounded body even without Content-Length", async () => {
  const client = createTeamHistoryClient(vi.fn<typeof fetch>().mockResolvedValue(new Response(" ".repeat(256 * 1024 + 1))), { detail: "/api/history" });
  await expect(client.detail(request, new AbortController().signal)).rejects.toMatchObject({ kind: "invalid" });
});
test("keeps an abort distinct from an unavailable source", async () => {
  const controller = new AbortController(); controller.abort();
  const fetcher = vi.fn<typeof fetch>().mockImplementation(async (_url, init) => { init?.signal?.throwIfAborted(); return json({}); });
  await expect(createTeamHistoryClient(fetcher, { detail: "/api/history" }).detail(request, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
});
test("loads only the requested summary page and checks its range/generation", async () => {
  const envelope = teamValueHistoryFixture(), fetcher = vi.fn<typeof fetch>().mockResolvedValue(json(envelope));
  const client = createTeamHistoryClient(fetcher, { page: "/api/history-summary" });
  await expect(client.page({ ...request, range: envelope.requestedRange, cursor: "next-page" }, new AbortController().signal)).resolves.toMatchObject({ version: 1 });
  expect(fetcher).toHaveBeenCalledOnce();
  expect(String(fetcher.mock.calls[0][0])).toContain("cursor=next-page");
  fetcher.mockResolvedValue(json({ ...envelope, generation: "changed" }));
  await expect(client.page({ ...request, range: envelope.requestedRange }, new AbortController().signal)).rejects.toMatchObject({ kind: "invalid" });
});
