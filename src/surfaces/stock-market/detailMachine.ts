import type { StockDetail } from "@/domain";

/**
 * Stock-detail load state machine for an expanded StockRow.
 *
 * Extracted from StockRow so the transition logic is unit-testable
 * without a DOM (issue #32). The component owns the async fetch;
 * this module owns every state transition.
 *
 * Contract:
 * - `idle` or `error` + EXPAND/RETRY → `loading` (retry is allowed).
 * - `loading` + EXPAND/RETRY → stays `loading` (in-flight guard:
 *   rapid toggles and retry clicks never duplicate requests).
 * - `ready` + EXPAND → stays `ready` (successful data is cached for
 *   the mounted row; reopening never refetches).
 * - `loading` + RESOLVE/REJECT → `ready` / `error`.
 * - RESOLVE/REJECT from any other state are ignored (stale
 *   responses cannot clobber newer state).
 *
 * Player identity is stable per mount: every StockRow is keyed by
 * playerId (see StockBoard/StockMarket), so no RESET event is needed.
 */
export type DetailState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; detail: StockDetail }
  | { status: "error" };

export type DetailEvent =
  | { type: "EXPAND" }
  | { type: "RETRY" }
  | { type: "RESOLVE"; detail: StockDetail }
  | { type: "REJECT" };

export function detailReducer(
  state: DetailState,
  event: DetailEvent
): DetailState {
  switch (event.type) {
    case "EXPAND":
    case "RETRY":
      // Intentional idle/error → loading transition. Loading and ready
      // are untouched: the in-flight guard and the ready cache hold.
      return state.status === "idle" || state.status === "error"
        ? { status: "loading" }
        : state;
    case "RESOLVE":
      return state.status === "loading"
        ? { status: "ready", detail: event.detail }
        : state;
    case "REJECT":
      return state.status === "loading" ? { status: "error" } : state;
  }
}

/**
 * Async orchestration for the detail fetch. Dependencies are injected
 * (rule 11) so tests can drive it with a fake fetch and a captured
 * state sink — no React needed.
 *
 * Guarantees:
 * - Never issues a request when one is in flight (belt and suspenders
 *   alongside the reducer's loading guard).
 * - Never issues a request for cached (`ready`) data.
 * - A rejection surfaces as `error`, which EXPAND/RETRY can recover.
 */
export function createDetailLoader(args: {
  playerId: string;
  fetchDetail: (playerId: string) => Promise<StockDetail>;
  getState: () => DetailState;
  dispatch: (event: DetailEvent) => void;
}): { load: () => Promise<void> } {
  let inFlight = false;

  async function load(): Promise<void> {
    const state = args.getState();
    if (state.status !== "idle" && state.status !== "error") return;
    if (inFlight) return;
    inFlight = true;
    args.dispatch({ type: state.status === "idle" ? "EXPAND" : "RETRY" });
    try {
      const detail = await args.fetchDetail(args.playerId);
      args.dispatch({ type: "RESOLVE", detail });
    } catch {
      args.dispatch({ type: "REJECT" });
    } finally {
      inFlight = false;
    }
  }

  return { load };
}
