import { describe, expect, it, vi } from "vitest";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { createImportDb } from "../../db";
import { AI_BUDGET, AiDeciderStore, PostgresAiPersistence, emptyBudgetState, validBudgetState } from "../store";
import { fingerprint, identity, NOW, TestPersistence } from "./fixtures";

describe("durable shared spending/abuse policy under CAS contention", () => {
  it("allows at most two overlapping users and one in-flight call per user", async () => {
    const p = new TestPersistence();
    const responses = await Promise.allSettled(Array.from({ length: 10 }, (_, n) => new AiDeciderStore(p).reserve(identity(n + 1), fingerprint(n), 100, NOW)));
    expect(responses.filter(r => r.status === "fulfilled" && r.value.status === "reserved")).toHaveLength(2);
    // Contention beyond the bounded retries fails closed; it cannot admit another paid call.
    expect(responses.filter(r => r.status === "rejected").every(r => r.status === "rejected" && r.reason.message === "state_unavailable")).toBe(true);
    expect(p.control!.state.requests).toBe(2); expect(p.conflicts).toBeGreaterThan(0);
    const again = await new AiDeciderStore(p).reserve(identity(1), fingerprint(100), 100, NOW);
    expect(again.status).toBe("busy");
  });
  it.each(["requests", "tokens"])("never exceeds the global daily %s budget during overlapping reservations", async field => {
    const p = new TestPersistence();
    p.control!.state.requests = field === "requests" ? AI_BUDGET.globalDay - 1 : 0;
    p.control!.state.tokens = field === "tokens" ? AI_BUDGET.globalTokensDay - 100 : 0;
    const stores = [new AiDeciderStore(p), new AiDeciderStore(p)];
    const results = await Promise.all(stores.map((s, i) => s.reserve(identity(i + 1), fingerprint(i), 100, NOW)));
    expect(results.filter(r => r.status === "reserved")).toHaveLength(1);
    expect(results.filter(r => r.status === "rate_limited")).toHaveLength(1);
    expect(p.control!.state.requests).toBeLessThanOrEqual(AI_BUDGET.globalDay);
    expect(p.control!.state.tokens).toBeLessThanOrEqual(AI_BUDGET.globalTokensDay);
  });
  it("enforces per-user hourly and daily counters across independent store instances", async () => {
    const p = new TestPersistence();
    let n = 0;
    for (let hour = 0; hour < 4; hour++) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const store = new AiDeciderStore(p), time = NOW + hour * 3600000;
        const r = await store.reserve(identity(), fingerprint(n++), 100, time);
        expect(r.status).toBe("reserved");
        if (r.status === "reserved") await store.finish(r.leaseId, 30, false, false, time);
      }
      expect((await new AiDeciderStore(p).reserve(identity(), fingerprint(n++), 100, NOW + hour * 3600000)).status).toBe("rate_limited");
    }
    expect((await new AiDeciderStore(p).reserve(identity(), fingerprint(n++), 100, NOW + 4 * 3600000)).status).toBe("rate_limited");
    expect(p.control!.state.requests).toBe(20); expect(p.control!.state.tokens).toBe(2000);
  });
  it("counts timeouts without refund, retains leases, and suppresses duplicates after completion", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    const r = await s.reserve(identity(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("fixture");
    await s.finish(r.leaseId, null, true, true, NOW);
    expect(p.control!.state.leases).toHaveLength(1); expect(p.control!.state.tokens).toBe(100);
    expect((await new AiDeciderStore(p).reserve(identity(), fingerprint(), 100, NOW + 61000)).status).toBe("duplicate");
    expect((await new AiDeciderStore(p).reserve(identity(), fingerprint(2), 100, NOW + 61000)).status).toBe("reserved");
  });
  it("pauses repeated refusal/error signals and excessive denials for the current hour", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    for (let n = 0; n < 3; n++) {
      const r = await s.reserve(identity(), fingerprint(n), 100, NOW);
      if (r.status !== "reserved") throw new Error("fixture");
      await s.finish(r.leaseId, 50, true, false, NOW);
    }
    expect((await s.reserve(identity(), fingerprint(4), 100, NOW)).status).toBe("rate_limited");
    expect((await s.reserve(identity(), fingerprint(4), 100, NOW + 3600000)).status).toBe("reserved");
  });
  it("kills new calls on usage overrun, missing state, disabled state or revoked identity", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    const r = await s.reserve(identity(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("fixture");
    await s.finish(r.leaseId, 101, false, false, NOW);
    expect(p.control!.enabled).toBe(false); expect(p.control!.state.tokens).toBe(101);
    expect((await s.reserve(identity(), fingerprint(2), 100, NOW)).status).toBe("disabled");
    p.control = null; await expect(s.reserve(identity(), fingerprint(2), 100, NOW)).rejects.toThrow("state_unavailable");
    p.control = { enabled: true, revision: 0, state: emptyBudgetState(NOW) }; p.revoked.add(identity().userId);
    await expect(s.reserve(identity(), fingerprint(2), 100, NOW)).rejects.toThrow("state_unavailable");
    expect(p.control.state.requests).toBe(0);
  });
  it.each([false, true])("settles a completion exactly once under overlap and CAS retries, unknown spend: %s", async unknown => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    const r = await s.reserve(identity(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("fixture");
    const compare = p.compareControl.bind(p);
    let retries = 2;
    vi.spyOn(p, "compareControl").mockImplementation(async (...args) => retries-- > 0 ? false : compare(...args));
    await Promise.all([s.finish(r.leaseId, 150, true, unknown, NOW), new AiDeciderStore(p).finish(r.leaseId, 150, true, unknown, NOW)]);
    await s.finish(r.leaseId, 150, true, unknown, NOW);
    expect(p.control!.state.tokens).toBe(150); expect(p.control!.enabled).toBe(false);
    expect(p.control!.state.users[identity().userId].signals).toBe(1);
    expect(p.control!.state.leases).toHaveLength(unknown ? 1 : 0);
    if (unknown) expect(p.control!.state.leases[0].completed).toBe(true);
    expect(p.compareControl).toHaveBeenCalledTimes(4);
  });
  it("retains unknown reservations and makes duplicate completion a no-op", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    const r = await s.reserve(identity(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("fixture");
    await s.finish(r.leaseId, null, true, false, NOW);
    const completed = structuredClone(p.control);
    await s.finish(r.leaseId, null, true, false, NOW);
    expect(p.control).toEqual(completed); expect(p.control!.state.tokens).toBe(100);
    expect((await s.reserve(identity(), fingerprint(2), 100, NOW)).status).toBe("busy");
  });
  it("still charges a known overrun when completion crosses a UTC day boundary", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    const r = await s.reserve(identity(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("fixture");
    await s.finish(r.leaseId, 150, true, false, NOW + 86400000);
    expect(p.control!.state.tokens).toBe(150); expect(p.control!.enabled).toBe(false);
  });
  it("fails closed when completion CAS retries exhaust, retaining the original reservation", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    const r = await s.reserve(identity(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("fixture");
    const control = structuredClone(p.control);
    const compare = vi.spyOn(p, "compareControl").mockResolvedValue(false);
    await expect(s.finish(r.leaseId, 150, true, false, NOW)).rejects.toThrow("state_unavailable");
    expect(compare).toHaveBeenCalledTimes(8); expect(p.control).toEqual(control);
  });
  it("compacts old signals/fingerprints and safely resets the next UTC day", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    const r = await s.reserve(identity(), fingerprint(), 100, NOW);
    if (r.status !== "reserved") throw new Error("fixture");
    await s.finish(r.leaseId, null, true, false, NOW);
    await s.reserve(identity(2), fingerprint(2), 100, NOW + AI_BUDGET.retentionMs + 1);
    expect(p.control!.state.users[identity().userId]).toBeUndefined();
    expect(p.control!.state.duplicates).toHaveLength(1); expect(p.control!.state.requests).toBe(1);
    expect(JSON.stringify(p.control!.state)).not.toMatch(/prompt|password|tokenHash|apiKey|ipAddress/);
    await expect(s.reserve(identity(2), fingerprint(3), 100, NOW)).rejects.toThrow("state_unavailable");
  });
  it("rejects corrupt counter/lease shapes instead of resetting them", async () => {
    const p = new TestPersistence(), s = new AiDeciderStore(p);
    for (const raw of [{}, { ...emptyBudgetState(NOW), tokens: -1 }, { ...emptyBudgetState(NOW), requests: 1.5 }, { ...emptyBudgetState(NOW), leases: [{}] }]) {
      expect(validBudgetState(raw)).toBe(false);
      p.control!.state = raw as ReturnType<typeof emptyBudgetState>;
      await expect(s.available()).rejects.toThrow("state_unavailable");
    }
  });
});

describe("actual Postgres adapter boundary, without a database", () => {
  it("uses parameterized version CAS and active session predicates in one SQL mutation", async () => {
    const db = createImportDb("postgresql://postgres@localhost/unused");
    const execute = vi.spyOn(db, "execute").mockResolvedValue({ rows: [{ revision: 1 }], rowCount: 1, fields: [], command: "UPDATE", rowAsArray: false });
    expect(await new PostgresAiPersistence(db).compareControl(0, emptyBudgetState(NOW), identity())).toBe(true);
    const query = new PgDialect().sqlToQuery(execute.mock.calls[0][0] as SQL);
    expect(query.sql).toContain("AND revision ="); expect(query.sql).toContain("AND enabled = true AND EXISTS");
    expect(query.sql).toContain("s.expires_at > now()"); expect(query.sql).toContain("u.team_id");
    expect(query.params).toContain(identity().tokenHash); expect(query.sql).not.toContain(identity().tokenHash);
  });
  it("returns conflicts and propagates missing tables/transport failures", async () => {
    const db = createImportDb("postgresql://postgres@localhost/unused");
    vi.spyOn(db, "execute").mockResolvedValue({ rows: [], rowCount: 0, fields: [], command: "UPDATE", rowAsArray: false });
    const p = new PostgresAiPersistence(db);
    expect(await p.compareControl(0, emptyBudgetState(NOW), identity())).toBe(false);
    vi.mocked(db.execute).mockRejectedValue(new Error("synthetic-state-failure"));
    await expect(p.readControl()).rejects.toThrow("synthetic-state-failure");
  });
});
