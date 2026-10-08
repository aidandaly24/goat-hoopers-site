/**
 * cache.ts — one tiny read-through TTL cache for public, read-only data.
 *
 * Why this exists: some upstream payloads are expensive to rebuild on every
 * request (the ~2.5MB Sleeper player directory; the generated news feed that
 * the root layout and /news each recompute). This helper keeps one cached
 * value per instance with a documented TTL, dedupes in-flight loads, and
 * serves the last-good value when a refresh fails. It never caches anything
 * session-scoped: callers must only put public data through it (rule: no
 * account/session state crosses requests — see "account/session privacy").
 *
 * Freshness contract (documented per call site):
 * - "hit": value is within TTL — served, no load.
 * - "expired": value is past TTL — one refresh is attempted (concurrent
 *   callers share the in-flight load); a failed refresh serves the
 *   last-good value instead of throwing.
 * - "empty": nothing cached yet — a failed load throws and the caller
 *   decides how to degrade (null / empty feed / etc).
 *
 * Serverless note: the cache lives in module memory, so it is per-instance.
 * A cold start refetches once; warm instances reuse. That is the documented
 * freshness — it is not a durable cross-instance store.
 */

export type TtlCacheOptions = {
  /** How long a cached value stays fresh, in milliseconds. */
  ttlMs: number;
  /** Injectable clock (tests). Defaults to Date.now. */
  now?: () => number;
};

export type TtlCache<T> = {
  /** The cached value, loading it first when empty or expired. */
  get: () => Promise<T>;
  /** Inspect the current cache state (tests/debugging). Never mutates. */
  peek: () => { fetchedAt: number; value: T } | null;
};

export function createTtlCache<T>(
  load: () => Promise<T>,
  { ttlMs, now = () => Date.now() }: TtlCacheOptions,
): TtlCache<T> {
  let cached: { fetchedAt: number; value: T } | null = null;
  let inFlight: Promise<T> | null = null;

  async function refresh(): Promise<T> {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const value = await load();
        cached = { fetchedAt: now(), value };
        return value;
      } catch (err) {
        // Last-good fallback: a failed refresh must not evict what we had.
        if (cached) return cached.value;
        throw err;
      } finally {
        inFlight = null;
      }
    })();
    return inFlight;
  }

  return {
    get: async () => {
      const at = now();
      if (cached && at - cached.fetchedAt < ttlMs) return cached.value;
      return refresh();
    },
    peek: () => cached,
  };
}
