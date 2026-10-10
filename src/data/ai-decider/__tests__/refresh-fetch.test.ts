import { describe, expect, it, vi } from "vitest";
import { createPatchedFetcher } from "next/dist/server/lib/patch-fetch";
import { fetchCache } from "@/app/api/ai-decides/weekly/refresh/route";

/** Exercise the installed Next fetch implementation, with no network or DB. */
function patched(mode?: typeof fetchCache) {
  const upstream = vi.fn(async () => new Response("fresh"));
  const cache = {
    generateCacheKey: vi.fn(async () => "synthetic-source"),
    lock: vi.fn(async () => () => {}),
    get: vi.fn(async () => ({ isStale: false, value: { kind: "FETCH", revalidate: 86400, data: { status: 200, headers: {}, body: Buffer.from("cached").toString("base64"), url: "https://synthetic.invalid/source" } } })),
    set: vi.fn(async () => {}),
  };
  const work = { route: "/api/ai-decides/weekly/refresh", forceDynamic: true, isStaticGeneration: false, isDraftMode: false, fetchCache: mode, incrementalCache: cache, nextFetchId: 1 };
  const stores = { workAsyncStorage: { getStore: () => work }, workUnitAsyncStorage: { getStore: () => ({ type: "request", implicitTags: { tags: [] } }) } } as unknown as Parameters<typeof createPatchedFetcher>[1];
  return { fetch: createPatchedFetcher(upstream, stores), upstream, cache };
}

describe("rerun source freshness under installed Next", () => {
  it("bypasses persistent source caches for both ordinary helper TTLs", async () => {
    expect(fetchCache).toBe("force-no-store");
    const h = patched(fetchCache);
    for (const revalidate of [300, 86400]) expect(await (await h.fetch("https://synthetic.invalid/source", { next: { revalidate } })).text()).toBe("fresh");
    expect(h.upstream).toHaveBeenCalledTimes(2);
    expect(h.cache.generateCacheKey).not.toHaveBeenCalled(); expect(h.cache.get).not.toHaveBeenCalled(); expect(h.cache.set).not.toHaveBeenCalled();
  });
  it("demonstrates that force-dynamic alone retains the normal explicit cache", async () => {
    const h = patched();
    expect(await (await h.fetch("https://synthetic.invalid/source", { next: { revalidate: 86400 } })).text()).toBe("cached");
    expect(h.cache.get).toHaveBeenCalledTimes(1); expect(h.upstream).not.toHaveBeenCalled();
  });
});
