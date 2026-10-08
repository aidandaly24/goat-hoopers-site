import { describe, expect, it } from "vitest";
import { decodeTrade, encodeTradeUrl } from "./tradeUrl";
import { stocks } from "./__tests__/fixtures";

const ids = (picks: ReturnType<typeof decodeTrade>) => ({
  a: picks.a.map((p) => p.playerId),
  b: picks.b.map((p) => p.playerId),
});

describe("trade share URLs", () => {
  it("restores known picks in order with their original quotes", () => {
    const picks = decodeTrade(new URLSearchParams("a=303,101&b=202"), stocks);
    expect(ids(picks)).toEqual({ a: ["303", "101"], b: ["202"] });
    expect(picks.a[0]).toBe(stocks[2]);
  });

  it("trims IDs, drops unknown/empty IDs and excludes duplicates across both sides", () => {
    const params = new URLSearchParams("a=,101,%20101%20,missing,303,&b=303,202,202,101");
    expect(ids(decodeTrade(params, stocks))).toEqual({ a: ["101", "303"], b: ["202"] });
  });

  it("accepts empty, absent and malformed encoded parameters without throwing", () => {
    for (const query of ["", "a=&b=", "a=%E0%A4%A,%ZZ&b=missing", "a=,,,&&b=,%00"]) {
      expect(ids(decodeTrade(new URLSearchParams(query), stocks))).toEqual({ a: [], b: [] });
    }
    expect(ids(decodeTrade(new URLSearchParams("a=,,&b=,"), [{ ...stocks[0], playerId: "" }])))
      .toEqual({ a: [], b: [] });
  });

  it("keeps the first repeated side parameter, matching existing share links", () => {
    expect(ids(decodeTrade(new URLSearchParams("a=101&a=303&b=202&b=404"), stocks)))
      .toEqual({ a: ["101"], b: ["202"] });
  });

  it("serializes current picks over stale URL picks without losing unrelated params or hash", () => {
    const href = "https://example.invalid/trade-analyzer?utm=league&tag=one&tag=two&a=404&b=303#trade";
    const picks = { a: [stocks[0], stocks[2]], b: [stocks[1]] };
    const url = new URL(encodeTradeUrl(href, picks));
    expect(url.origin + url.pathname).toBe("https://example.invalid/trade-analyzer");
    expect(url.searchParams.get("a")).toBe("101,303");
    expect(url.searchParams.get("b")).toBe("202");
    expect(url.searchParams.get("utm")).toBe("league");
    expect(url.searchParams.getAll("tag")).toEqual(["one", "two"]);
    expect(url.hash).toBe("#trade");
    expect(ids(decodeTrade(url.searchParams, stocks))).toEqual(ids(picks));
  });

  it("deletes empty side params, collapses repeated sides and retains unknown params", () => {
    const url = new URL(encodeTradeUrl(
      "https://example.invalid/trade-analyzer?a=101&a=303&b=202&b=404&keep=1",
      { a: [], b: [stocks[3]] }
    ));
    expect(url.searchParams.has("a")).toBe(false);
    expect(url.searchParams.getAll("b")).toEqual(["404"]);
    expect(url.searchParams.get("keep")).toBe("1");
    expect(encodeTradeUrl("https://example.invalid/trade-analyzer?a=101#trade", { a: [], b: [] }))
      .toBe("https://example.invalid/trade-analyzer#trade");
  });

  it("canonicalization is stable for malformed incoming links", () => {
    const href = "https://example.invalid/trade-analyzer?x=%ZZ&a=101,101,unknown&b=101,202#trade";
    const first = encodeTradeUrl(href, decodeTrade(new URL(href).searchParams, stocks));
    expect(encodeTradeUrl(first, decodeTrade(new URL(first).searchParams, stocks))).toBe(first);
    expect(new URL(first).searchParams.get("x")).toBe("%ZZ");
  });
});
