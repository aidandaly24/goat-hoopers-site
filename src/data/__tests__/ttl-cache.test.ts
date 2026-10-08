/**
 * ttl-cache.test.ts — cold/warm/expiry/failure coverage for the shared
 * TTL cache (src/data/cache.ts). The clock is injected; no timers, no
 * network.
 */
import { describe, expect, it } from "vitest";
import { createTtlCache } from "@/data/cache";

const TTL = 60_000;

function fakeClock(start = 0) {
  let t = start;
  return {
    now: () => t,
    advance: (ms: number) => {
      t += ms;
    },
  };
}

describe("createTtlCache", () => {
  it("cold: loads once and returns the value", async () => {
    const clock = fakeClock();
    let loads = 0;
    const cache = createTtlCache(async () => {
      loads++;
      return "v1";
    }, { ttlMs: TTL, now: clock.now });

    expect(cache.peek()).toBeNull();
    expect(await cache.get()).toBe("v1");
    expect(loads).toBe(1);
    expect(cache.peek()).toEqual({ fetchedAt: 0, value: "v1" });
  });

  it("warm: within TTL the loader is not called again", async () => {
    const clock = fakeClock();
    let loads = 0;
    const cache = createTtlCache(async () => {
      loads++;
      return loads;
    }, { ttlMs: TTL, now: clock.now });

    expect(await cache.get()).toBe(1);
    clock.advance(TTL - 1);
    expect(await cache.get()).toBe(1);
    expect(loads).toBe(1);
  });

  it("expiry: past TTL triggers exactly one refresh", async () => {
    const clock = fakeClock();
    let loads = 0;
    const cache = createTtlCache(async () => {
      loads++;
      return `v${loads}`;
    }, { ttlMs: TTL, now: clock.now });

    expect(await cache.get()).toBe("v1");
    clock.advance(TTL);
    expect(await cache.get()).toBe("v2");
    expect(loads).toBe(2);
  });

  it("failure on expired: serves last-good instead of throwing", async () => {
    const clock = fakeClock();
    let fail = false;
    const cache = createTtlCache(async () => {
      if (fail) throw new Error("upstream down");
      return "good";
    }, { ttlMs: TTL, now: clock.now });

    expect(await cache.get()).toBe("good");
    clock.advance(TTL + 1);
    fail = true;
    expect(await cache.get()).toBe("good");
    // The failed refresh must not evict the last-good value.
    expect(cache.peek()?.value).toBe("good");
  });

  it("failure on cold: throws and leaves the cache empty", async () => {
    const clock = fakeClock();
    const cache = createTtlCache(async () => {
      throw new Error("upstream down");
    }, { ttlMs: TTL, now: clock.now });

    await expect(cache.get()).rejects.toThrow("upstream down");
    expect(cache.peek()).toBeNull();
    // A later successful load recovers normally.
    const recovering = createTtlCache(async () => "recovered", {
      ttlMs: TTL,
      now: clock.now,
    });
    expect(await recovering.get()).toBe("recovered");
  });

  it("concurrent: overlapping gets share one in-flight load", async () => {
    const clock = fakeClock();
    let loads = 0;
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    const cache = createTtlCache(async () => {
      loads++;
      await gate;
      return "shared";
    }, { ttlMs: TTL, now: clock.now });

    const pending = [cache.get(), cache.get(), cache.get()];
    // Let the three gets start; they must collapse onto one load.
    await Promise.resolve();
    await Promise.resolve();
    expect(loads).toBe(1);
    release();
    const results = await Promise.all(pending);
    expect(results).toEqual(["shared", "shared", "shared"]);
    expect(loads).toBe(1);
  });
});
