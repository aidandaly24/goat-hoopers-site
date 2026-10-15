import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

describe("GET /api/health", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("reports ok without a database and leaks no config", async () => {
    vi.stubEnv("DATABASE_URL", "");
    const res = await GET();
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.checks).toEqual({ database: "not_configured" });
    expect(JSON.stringify(body)).not.toMatch(/postgres|DATABASE_URL/i);
  });
});
