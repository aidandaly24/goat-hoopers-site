import { describe, expect, it, vi } from "vitest";
import type { StockDetail } from "@/domain";
import {
  createDetailLoader,
  detailReducer,
  type DetailEvent,
  type DetailState,
} from "./detailMachine";

// Minimal valid StockDetail for resolve paths.
function fakeDetail(): StockDetail {
  return {
    playerId: "1",
    factors: [],
    seasonHistory: [],
    spark: [],
  };
}

function reduceAll(
  events: DetailEvent[],
  from: DetailState = { status: "idle" }
): DetailState {
  return events.reduce(detailReducer, from);
}

describe("detailReducer", () => {
  it("idle + EXPAND → loading", () => {
    expect(detailReducer({ status: "idle" }, { type: "EXPAND" })).toEqual({
      status: "loading",
    });
  });

  it("error + EXPAND → loading (re-expansion retries, issue #32)", () => {
    expect(detailReducer({ status: "error" }, { type: "EXPAND" })).toEqual({
      status: "loading",
    });
  });

  it("error + RETRY → loading", () => {
    expect(detailReducer({ status: "error" }, { type: "RETRY" })).toEqual({
      status: "loading",
    });
  });

  it("idle + RETRY → loading", () => {
    expect(detailReducer({ status: "idle" }, { type: "RETRY" })).toEqual({
      status: "loading",
    });
  });

  it("loading + EXPAND/RETRY stays loading (in-flight guard)", () => {
    const loading: DetailState = { status: "loading" };
    expect(detailReducer(loading, { type: "EXPAND" })).toBe(loading);
    expect(detailReducer(loading, { type: "RETRY" })).toBe(loading);
  });

  it("ready + EXPAND stays ready (cache: reopening never refetches)", () => {
    const ready: DetailState = { status: "ready", detail: fakeDetail() };
    expect(detailReducer(ready, { type: "EXPAND" })).toBe(ready);
    expect(detailReducer(ready, { type: "RETRY" })).toBe(ready);
  });

  it("loading + RESOLVE → ready with the detail", () => {
    const detail = fakeDetail();
    expect(
      detailReducer({ status: "loading" }, { type: "RESOLVE", detail })
    ).toEqual({ status: "ready", detail });
  });

  it("loading + REJECT → error", () => {
    expect(detailReducer({ status: "loading" }, { type: "REJECT" })).toEqual(
      { status: "error" }
    );
  });

  it("stale RESOLVE/REJECT outside loading are ignored", () => {
    const idle: DetailState = { status: "idle" };
    const error: DetailState = { status: "error" };
    const ready: DetailState = { status: "ready", detail: fakeDetail() };
    expect(
      detailReducer(idle, { type: "RESOLVE", detail: fakeDetail() })
    ).toBe(idle);
    expect(detailReducer(idle, { type: "REJECT" })).toBe(idle);
    expect(detailReducer(error, { type: "REJECT" })).toBe(error);
    expect(
      detailReducer(ready, { type: "RESOLVE", detail: fakeDetail() })
    ).toBe(ready);
  });

  it("full failure→retry→success path", () => {
    const detail = fakeDetail();
    const end = reduceAll([
      { type: "EXPAND" },
      { type: "REJECT" },
      { type: "EXPAND" },
      { type: "RESOLVE", detail },
    ]);
    expect(end).toEqual({ status: "ready", detail });
  });
});

describe("createDetailLoader", () => {
  function harness(
    fetchDetail: (playerId: string) => Promise<StockDetail>
  ) {
    let state: DetailState = { status: "idle" };
    const seen: DetailState[] = [];
    const loader = createDetailLoader({
      playerId: "1",
      fetchDetail,
      getState: () => state,
      dispatch: (event) => {
        state = detailReducer(state, event);
        seen.push(state);
      },
    });
    return { loader, getState: () => state, seen };
  }

  it("expand → failure → close/reopen → success makes exactly two requests", async () => {
    const fetchDetail = vi
      .fn<(playerId: string) => Promise<StockDetail>>()
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce(fakeDetail());
    const { loader, getState } = harness(fetchDetail);

    await loader.load(); // first expand: fails
    expect(getState().status).toBe("error");
    await loader.load(); // re-expand: retries
    expect(getState().status).toBe("ready");
    expect(fetchDetail).toHaveBeenCalledTimes(2);
    expect(fetchDetail).toHaveBeenNthCalledWith(1, "1");
    expect(fetchDetail).toHaveBeenNthCalledWith(2, "1");
  });

  it.each([
    ["network failure", new Error("network down")],
    ["non-2xx response", new Error("HTTP 500")],
    ["invalid JSON", new SyntaxError("Unexpected token")],
  ])("%s is recoverable via re-expansion", async (_label, failure) => {
    const fetchDetail = vi
      .fn<(playerId: string) => Promise<StockDetail>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce(fakeDetail());
    const { loader, getState } = harness(fetchDetail);

    await loader.load();
    expect(getState().status).toBe("error");
    await loader.load();
    expect(getState().status).toBe("ready");
    expect(fetchDetail).toHaveBeenCalledTimes(2);
  });

  it("reopening a ready row reuses cached detail (no refetch)", async () => {
    const fetchDetail = vi.fn(() => Promise.resolve(fakeDetail()));
    const { loader, getState } = harness(fetchDetail);

    await loader.load();
    expect(getState().status).toBe("ready");
    await loader.load(); // reopen
    await loader.load(); // reopen again
    expect(fetchDetail).toHaveBeenCalledTimes(1);
  });

  it("concurrent loads while loading do not duplicate requests", async () => {
    let resolve!: (d: StockDetail) => void;
    const gate = new Promise<StockDetail>((r) => (resolve = r));
    const fetchDetail = vi.fn(() => gate);
    const { loader, getState } = harness(fetchDetail);

    const first = loader.load();
    const second = loader.load();
    const third = loader.load();
    resolve(fakeDetail());
    await Promise.all([first, second, third]);

    expect(fetchDetail).toHaveBeenCalledTimes(1);
    expect(getState().status).toBe("ready");
  });

  it("a rejection while a second load waits does not corrupt state", async () => {
    const fetchDetail = vi
      .fn<(playerId: string) => Promise<StockDetail>>()
      .mockRejectedValueOnce(new Error("nope"))
      .mockResolvedValueOnce(fakeDetail());
    const { loader, getState } = harness(fetchDetail);

    await loader.load();
    expect(getState().status).toBe("error");
    // Retry succeeds; a third call finds ready and no-ops.
    await loader.load();
    await loader.load();
    expect(getState().status).toBe("ready");
    expect(fetchDetail).toHaveBeenCalledTimes(2);
  });
});
