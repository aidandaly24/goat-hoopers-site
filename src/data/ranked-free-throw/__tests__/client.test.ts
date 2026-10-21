import { expect, it, vi } from "vitest";
import { createRankedClient } from "../client";
import { configuration, policy, replayContext, run, sampleScore, submission } from "./fixtures";
import { compareRecord } from "@/domain/arcade/ranked-record-feedback";

const admission = { status: "created", run: { ...run, userId: undefined, state: undefined }, rules: policy, replayContext };
const board = { status: "ready", gameId: "free-throw", rulesVersion: configuration.rulesVersion, ruleSetId: policy.ruleSetId,
  scope: "everyone", calendar: policy.calendar, period: run.period,
  entries: [{ ...sampleScore, rank: 1, username: "hooper", teamId: null, isCurrentUser: true }] };
const transport = (value: unknown, status = 200) => vi.fn(async () => Response.json(value, { status }));

it("decodes admission, persisted stats/evidence and the bounded board via same-origin no-store requests", async () => {
  const fetcher = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>()
    .mockResolvedValueOnce(Response.json(admission, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ status: "saved", score: sampleScore }, { status: 201 }))
    .mockResolvedValueOnce(Response.json({ status: "saved", score: sampleScore }))
    .mockResolvedValueOnce(Response.json(board));
  const client = createRankedClient(fetcher);
  expect(await client.start()).toMatchObject({ ok: true, value: { rules: policy, replayContext } });
  expect(await client.submit(submission)).toEqual({ ok: true, value: { ...sampleScore, recordFeedback: null } });
  expect(await client.result(run.id)).toEqual({ ok: true, value: sampleScore });
  expect(await client.leaderboard("everyone")).toMatchObject({ ok: true, value: { entries: [{ score: 2, longestStreak: 2 }] } });
  expect(fetcher.mock.calls.every(([url, init]) => url.startsWith("/api/arcade/free-throw/") && init?.cache === "no-store" && init.credentials === "same-origin")).toBe(true);
  expect(fetcher.mock.calls[0][1]?.body).toBe("{}"); expect(JSON.parse(String(fetcher.mock.calls[1][1]?.body))).toEqual(submission);
});

it("exposes valid accepted feedback but drops it on recovery, including nested or malformed metadata", async () => {
  const feedback = { version: 1, scoreId: sampleScore.id, acceptedAtMs: sampleScore.achievedAtMs, periodId: "test-week-1",
    scoreVersion: "a".repeat(64), scope: "everyone", personalBest: compareRecord(2, 0), weeklyRecord: compareRecord(2, 2), allTimeRecord: compareRecord(2, 2) };
  const body = { status: "saved", score: { ...sampleScore, recordFeedback: feedback }, recordFeedback: feedback };
  const client = createRankedClient(transport(body));
  expect(await client.submit(submission)).toEqual({ ok: true, value: { ...sampleScore, recordFeedback: feedback } });
  expect(await client.result(run.id)).toEqual({ ok: true, value: sampleScore });
  for (const bad of [undefined, { ...feedback, scoreId: sampleScore.runId }, { ...feedback, weeklyRecord: { previousScore: 2, outcome: "beaten" } }]) {
    expect(await createRankedClient(transport({ ...body, recordFeedback: bad })).submit(submission)).toEqual({ ok: true, value: { ...sampleScore, recordFeedback: null } });
  }
  expect(await createRankedClient(transport({ ...body, status: "already_submitted" })).submit(submission)).toEqual({ ok: false, status: "invalid_response" });
});

it.each([{ score: 999 }, { outcomes: [1, 0] }, { longestStreak: 0 }, { accuracy: 50 }, { attempts: 0 }, { inputs: [] }, { gameId: "other" }])
  ("rejects inconsistent successful receipts: %j", async changed => {
    expect(await createRankedClient(transport({ status: "saved", score: { ...sampleScore, ...changed } })).submit(submission))
      .toEqual({ ok: false, status: "invalid_response" });
  });

it("rejects invalid calendars/oversized boards and handles failure and cancellation without retrying a POST", async () => {
  expect(await createRankedClient(transport({ ...board, entries: Array(101).fill(board.entries[0]) })).leaderboard("everyone")).toEqual({ ok: false, status: "invalid_response" });
  expect(await createRankedClient(transport({ ...board, calendar: { timeZone: "bad" } })).leaderboard("league")).toEqual({ ok: false, status: "invalid_response" });
  expect(await createRankedClient(transport({ status: "not_found" }, 404)).result(run.id)).toEqual({ ok: false, status: "not_found" });
  const failed = vi.fn(async () => { throw new Error("offline"); }), client = createRankedClient(failed);
  expect(await client.submit(submission)).toEqual({ ok: false, status: "network" }); expect(failed).toHaveBeenCalledTimes(1);
  const abort = new AbortController(); abort.abort();
  expect(await client.result(run.id, abort.signal)).toEqual({ ok: false, status: "aborted" });
});
