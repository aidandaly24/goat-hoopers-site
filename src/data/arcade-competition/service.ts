import "server-only";
import { headers } from "next/headers";
import { createRankedRuntime } from "../ranked-free-throw/runtime";
import { ArcadeCompetitionStore } from "./store";
import { readCompetitionCalendar } from "./config";
import { readFinality } from "./finality";
import type { CompetitionArchive, CompetitionBoard } from "@/domain/arcade/competition-period";
import type { RankedScope } from "@/domain/arcade/ranked-free-throw";
import { reconcileWindowOpen } from "@/domain/arcade/reconcile-window";
import { authorizeReconcile, emptyReconcileBody } from "./reconcile-auth";

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
  const access = authorizeReconcile(request.headers, process.env, Date.now());
  if (access.status !== "allowed") return response({ status: access.status }, access.status === "unauthorized" ? 401 : 503);
  const url = new URL(request.url);
  if (request.method !== "POST") return response({ status: "empty_post_required" }, 405);
  if (request.url.length > 2048 || url.pathname !== "/api/arcade/competition/reconcile" || url.search || url.hash ||
    request.headers.has("content-length") && request.headers.get("content-length") !== "0" || !await emptyReconcileBody(request)) return response({ status: "empty_post_required" }, 400);
  const inWindow = () => reconcileWindowOpen(access.window, Date.now());
  if (!inWindow()) return response({ status: "unauthorized" }, 401);
  const runtime = createRankedRuntime(), calendar = readCompetitionCalendar(process.env);
  if (runtime.configuration.status !== "ready" || !calendar) return response({ status: "held" }, 503);
  try {
    const store = runtime.store() as ArcadeCompetitionStore;
    if (!inWindow()) return response({ status: "unauthorized" }, 401);
    const done = new Set((await store.archives()).map(p => p.id));
    if (!inWindow()) return response({ status: "unauthorized" }, 401);
    const due = calendar.filter(p => !done.has(p.id)).slice(0, 2);
    const records = new Map(await Promise.all(due.map(async p => [p.id, await readFinality(p, { fetch, now: Date.now })] as const)));
    if (!inWindow()) return response({ status: "unauthorized" }, 401);
    const finalized = await store.reconcile(calendar, runtime.configuration, records, access.window);
    return response({ status: "ready", finalized });
  } catch (error) { return response({ status: error instanceof Error && error.message === "reconcile_window_closed" ? "unauthorized" : "unavailable" },
    error instanceof Error && error.message === "reconcile_window_closed" ? 401 : 503); }
}
