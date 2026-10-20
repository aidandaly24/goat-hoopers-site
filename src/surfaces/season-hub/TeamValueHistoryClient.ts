import {
  isTeamValueHistoryDetail, isTeamValueHistoryEnvelope,
  type TeamHistoryRange, type TeamValueHistoryDetail, type TeamValueHistoryEnvelope,
} from "@/domain/team-value-history";

const MAX_BYTES = 256 * 1024;
export class TeamHistoryReadError extends Error {
  constructor(readonly kind: "changed" | "unavailable" | "invalid", message: string) { super(message); }
}

async function boundedJson(response: Response): Promise<unknown> {
  if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) throw new TeamHistoryReadError("invalid", "History response exceeded its limit");
  if (!response.body) throw new TeamHistoryReadError("invalid", "History response was empty");
  const reader = response.body.getReader(), decoder = new TextDecoder();
  let length = 0, body = "";
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > MAX_BYTES) { await reader.cancel(); throw new TeamHistoryReadError("invalid", "History response exceeded its limit"); }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } catch (error) {
    if (error instanceof TeamHistoryReadError || (error instanceof Error && error.name === "AbortError")) throw error;
    throw new TeamHistoryReadError("invalid", "History response could not be read");
  } finally { reader.releaseLock(); }
}

/** Injected browser transport. The server supplies paths and serializable data only. */
export function createTeamHistoryClient(fetcher: typeof fetch, endpoints: { detail?: string; page?: string }) {
  async function read(endpoint: string | undefined, params: Record<string, string>, signal: AbortSignal) {
    if (!endpoint || !endpoint.startsWith("/api/") || endpoint.includes("\\") || endpoint.includes("#")) {
      throw new TeamHistoryReadError("unavailable", "History details are unavailable");
    }
    const url = new URL(endpoint, "https://history.invalid");
    if (url.origin !== "https://history.invalid" || !url.pathname.startsWith("/api/")) throw new TeamHistoryReadError("invalid", "Invalid history endpoint");
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const response = await fetcher(`${url.pathname}${url.search}`, { signal, credentials: "same-origin", headers: { Accept: "application/json" }, cache: "no-store" });
    if (response.status === 409) throw new TeamHistoryReadError("changed", "History has changed. Refresh the page to inspect the new history.");
    if (!response.ok) throw new TeamHistoryReadError("unavailable", "History details could not be loaded.");
    return boundedJson(response);
  }
  return {
    async detail(request: { teamId: string; generation: string; day: string }, signal: AbortSignal): Promise<TeamValueHistoryDetail> {
      const value = await read(endpoints.detail, request, signal);
      if (!isTeamValueHistoryDetail(value) || value.teamId !== request.teamId || value.generation !== request.generation || value.day !== request.day) {
        throw new TeamHistoryReadError("invalid", "History details did not match this date.");
      }
      return value;
    },
    async page(request: { teamId: string; generation: string; range: TeamHistoryRange; cursor?: string }, signal: AbortSignal): Promise<TeamValueHistoryEnvelope> {
      const value = await read(endpoints.page, { teamId: request.teamId, generation: request.generation, from: request.range.from, toExclusive: request.range.toExclusive,
        ...(request.cursor ? { cursor: request.cursor } : {}) }, signal);
      if (!isTeamValueHistoryEnvelope(value) || value.team.id !== request.teamId || value.generation !== request.generation
        || value.requestedRange.from !== request.range.from || value.requestedRange.toExclusive !== request.range.toExclusive) {
        throw new TeamHistoryReadError("invalid", "History page did not match this range.");
      }
      return value;
    },
  };
}
