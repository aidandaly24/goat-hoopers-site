import "server-only";
import { headers } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { createRankedRuntime } from "../ranked-free-throw/runtime";
import { ArcadeCompetitionStore } from "./store";
import { readCompetitionCalendar } from "./config";
import { readFinality } from "./finality";
import type { CompetitionArchive, CompetitionBoard } from "@/domain/arcade/competition-period";
import type { RankedScope } from "@/domain/arcade/ranked-free-throw";

export type CompetitionView = { status: "held" | "unavailable" } | { status: "ready"; board: CompetitionBoard };
export async function loadCompetitionView(kind: "weekly" | "all-time" | "archive", periodId: string | null = null, gameId = "free-throw", scope: RankedScope = "everyone"): Promise<CompetitionView> {
  if (gameId !== "free-throw") return { status: "held" }; // Other games remain unranked until they have a validated server adapter.
  const runtime = createRankedRuntime(), config = runtime.configuration;
  if (config.status !== "ready") return { status: "held" };
  try {
    const store = runtime.store();
    if (!(store instanceof ArcadeCompetitionStore)) return { status: "unavailable" };
    let viewer: string | null = null;
    try { viewer = (await runtime.account(await headers()))?.subject ?? null; } catch { /* public board remains public */ }
    const board = await store.board(kind, periodId, config, viewer, scope);
    return kind === "archive" && board.periodId !== periodId ? { status: "unavailable" } : { status: "ready", board };
  } catch { return { status: "unavailable" }; }
}
export async function loadCompetitionArchives(): Promise<{ status: "held" | "unavailable" | "ready"; archives: CompetitionArchive[] }> {
  const runtime = createRankedRuntime();
  if (runtime.configuration.status !== "ready") return { status: "held", archives: [] };
  try { return { status: "ready", archives: await (runtime.store() as ArcadeCompetitionStore).archives() }; }
  catch { return { status: "unavailable", archives: [] }; }
}
const response = (value: unknown, status = 200) => Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
export async function competitionRead(request: Request) {
  const params = new URL(request.url).searchParams;
  const kind = params.get("kind") ?? "weekly", periodId = params.get("periodId"), gameId = params.get("gameId") ?? "free-throw", scope = params.get("scope") ?? "everyone";
  if (request.method !== "GET" || request.url.length > 2048 || [...params.keys()].some(k => !["kind", "periodId", "gameId", "scope"].includes(k) || params.getAll(k).length !== 1) || !["everyone", "league"].includes(scope) ||
    !["weekly", "all-time", "archive"].includes(kind) || !/^[a-z0-9-]{1,80}$/.test(gameId) || periodId !== null && !/^[a-z0-9-]{3,80}$/.test(periodId) || kind === "archive" && !periodId) return response({ status: "invalid_query" }, 400);
  return response(await loadCompetitionView(kind as "weekly" | "all-time" | "archive", periodId, gameId, scope as RankedScope));
}

/** Disabled separately from gameplay. No arbitrary request-provided calendar/finality evidence. */
export async function competitionReconcile(request: Request) {
  if (process.env.GOAT_ARCADE_RECONCILE_ENABLED !== "1") return response({ status: "disabled" }, 503);
  const secret = process.env.COMMISSIONER_KEY, actual = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  if (!secret || actual.byteLength !== expected.byteLength || !timingSafeEqual(actual, expected)) return response({ status: "unauthorized" }, 401);
  if (request.method !== "POST" || request.headers.has("content-length") && request.headers.get("content-length") !== "0") return response({ status: "empty_post_required" }, 400);
  if (request.body) { const reader = request.body.getReader(); const first = await reader.read(); await reader.cancel(); if (!first.done && first.value.length) return response({ status: "empty_post_required" }, 400); }
  const runtime = createRankedRuntime(), calendar = readCompetitionCalendar(process.env);
  if (runtime.configuration.status !== "ready" || !calendar) return response({ status: "held" }, 503);
  try {
    const store = runtime.store() as ArcadeCompetitionStore;
    const done = new Set((await store.archives()).map(p => p.id));
    const due = calendar.filter(p => !done.has(p.id)).slice(0, 2);
    const records = new Map(await Promise.all(due.map(async p => [p.id, await readFinality(p, { fetch, now: Date.now })] as const)));
    const finalized = await store.reconcile(calendar, runtime.configuration, records);
    return response({ status: "ready", finalized });
  } catch { return response({ status: "unavailable" }, 503); }
}
