/**
 * Opt-in real Postgres tests. Fixed localhost:55441 / claim_team_test only;
 * never reads DATABASE_URL or falls back to application credentials.
 * The installed Neon HTTP client and Drizzle execute the actual store SQL;
 * only HTTP transport is replaced by independent local pg connections.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { Pool, type DatabaseError, type PoolClient } from "pg";
import { DrizzleGameStore } from "../arcade";
import { schema } from "../db";
import { claimTeamContract } from "./claim-team-contract";

const localUrl = "postgresql://postgres@127.0.0.1:55441/claim_team_test";
const local = describe.skipIf(process.env.RUN_CLAIM_TEAM_LOCAL_TEST !== "1");
const input = (code: string) => ({ code, displayName: "Fixture", passwordHash: "fixture-hash" });

local("atomic claims against isolated local Postgres", () => {
  const pool = new Pool({ connectionString: localUrl, options: "-c search_path=claim_team_local_test", max: 8 });
  const originalFetch = neonConfig.fetchFunction;
  const store = () => new DrizzleGameStore(drizzle(neon(localUrl), { schema }));

  beforeAll(async () => {
    await pool.query("CREATE SCHEMA claim_team_local_test");
    neonConfig.fetchFunction = async (_url: string, init: RequestInit) => {
      const query: { query: string; params: unknown[] } = JSON.parse(String(init.body));
      const client = await pool.connect();
      try {
        const result = await client.query({ text: query.query, values: query.params, rowMode: "array" });
        return new Response(JSON.stringify({
          fields: result.fields, command: result.command, rowCount: result.rowCount,
          rows: result.rows.map((row: unknown[]) => row.map(value =>
            value === null ? null : value instanceof Date ? value.toISOString() : String(value))),
        }), { status: 200 });
      } catch (error) {
        const pgError = error as DatabaseError;
        return new Response(JSON.stringify({ message: pgError.message, code: pgError.code,
          constraint: pgError.constraint, table: pgError.table, schema: pgError.schema }), { status: 400 });
      } finally { client.release(); }
    };
  });

  afterAll(async () => {
    neonConfig.fetchFunction = originalFetch;
    await pool.query("DROP SCHEMA IF EXISTS claim_team_local_test CASCADE");
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query(`
      DROP TABLE IF EXISTS invite_codes, site_users CASCADE;
      CREATE TABLE site_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        team_id TEXT NOT NULL UNIQUE,
        display_name TEXT NOT NULL, password_hash TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
      CREATE TABLE invite_codes (
        code TEXT PRIMARY KEY, team_id TEXT NOT NULL, used_by UUID, used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT now()
      );
    `);
    // An unnamed UNIQUE(team_id) gets the existing production-style
    // Postgres name. Confirm the real fixture, not a mocked error string.
    const constraints = await pool.query<{ conname: string }>(
      "SELECT conname FROM pg_constraint WHERE conrelid = 'site_users'::regclass AND contype = 'u'",
    );
    expect(constraints.rows).toEqual([{ conname: "site_users_team_id_key" }]);
  });

  claimTeamContract("DrizzleGameStore (local Postgres)", store);

  it("also rolls back a conflict with the repository-style team constraint name", async () => {
    await pool.query("ALTER TABLE site_users RENAME CONSTRAINT site_users_team_id_key TO site_users_team_id_unique");
    const claims = store();
    await claims.createInviteCode("1", "111111");
    await claims.createInviteCode("1", "222222");
    expect((await claims.claimTeam(input("111111"))).ok).toBe(true);
    await expect(claims.claimTeam(input("222222"))).resolves.toEqual({ ok: false, reason: "team_claimed" });
    expect((await pool.query("SELECT id FROM site_users")).rowCount).toBe(1);
    expect((await claims.getInviteByCode("222222"))?.usedBy).toBeNull();
    expect((await claims.getInviteByCode("222222"))?.usedAt).toBeNull();
  });

  // Wait for the server itself to confirm that independent claims overlap
  // at a lock, rather than relying on Promise.all scheduling alone.
  async function blockedClaimPids(count: number): Promise<number[]> {
    for (let attempt = 0; attempt < 100; attempt++) {
      const result = await pool.query<{ pid: number }>(`SELECT pid FROM pg_stat_activity
        WHERE datname = 'claim_team_test' AND wait_event_type = 'Lock'
          AND query LIKE '%WITH claimed_invite%'`);
      if (result.rows.length >= count) return result.rows.map(row => row.pid);
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error("Concurrent fixture claims did not overlap at the database lock");
  }

  async function releaseBlocker(client: PoolClient): Promise<void> {
    await client.query("ROLLBACK");
    client.release();
  }

  it("has one same-invite winner after two independent connections block on its row", async () => {
    const claims = store();
    await claims.createInviteCode("1", "111111");
    const blocker = await pool.connect();
    await blocker.query("BEGIN");
    await blocker.query("SELECT code FROM invite_codes WHERE code = '111111' FOR UPDATE");
    const pending = Promise.all([claims.claimTeam(input("111111")), claims.claimTeam(input("111111"))]);
    try {
      expect(new Set(await blockedClaimPids(2)).size).toBe(2);
    } finally { await releaseBlocker(blocker); }
    const results = await pending;
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.filter(result => !result.ok)).toEqual([{ ok: false, reason: "already_used" }]);
    expect((await pool.query("SELECT id FROM site_users")).rowCount).toBe(1);
    expect((await claims.getInviteByCode("111111"))?.usedBy).toBe((await claims.getUserByTeam("1"))?.id);
  });

  it("rolls back the losing invite when two connections race on one team constraint", async () => {
    const claims = store();
    await claims.createInviteCode("1", "111111");
    await claims.createInviteCode("1", "222222");
    const blocker = await pool.connect();
    await blocker.query("BEGIN");
    // An uncommitted fixture owner holds the unique key. Rolling it back
    // releases both competing inserts so only one real claim can commit.
    await blocker.query("INSERT INTO site_users (team_id, display_name, password_hash) VALUES ('1', 'Blocker', 'fixture')");
    const pending = Promise.all([claims.claimTeam(input("111111")), claims.claimTeam(input("222222"))]);
    try {
      expect(new Set(await blockedClaimPids(2)).size).toBe(2);
    } finally { await releaseBlocker(blocker); }
    const results = await pending;
    expect(results.filter(result => result.ok)).toHaveLength(1);
    expect(results.filter(result => !result.ok)).toEqual([{ ok: false, reason: "team_claimed" }]);
    expect((await pool.query("SELECT id FROM site_users")).rowCount).toBe(1);
    const winner = results.findIndex(result => result.ok);
    const invites = await Promise.all([claims.getInviteByCode("111111"), claims.getInviteByCode("222222")]);
    expect(invites[winner]?.usedBy).toBe((await claims.getUserByTeam("1"))?.id);
    expect(invites[1 - winner]?.usedBy).toBeNull();
    expect(invites[1 - winner]?.usedAt).toBeNull();
  });

  it("rolls back both writes when the insert fails after updating its invite", async () => {
    const claims = store();
    await claims.createInviteCode("1", "111111");
    await pool.query("ALTER TABLE site_users ADD CONSTRAINT fixture_insert_failure CHECK (display_name <> 'Fixture')");
    await expect(claims.claimTeam(input("111111"))).rejects.toMatchObject({ cause: { code: "23514" } });
    expect(await claims.getUserByTeam("1")).toBeNull();
    expect((await claims.getInviteByCode("111111"))?.usedBy).toBeNull();
    expect((await claims.getInviteByCode("111111"))?.usedAt).toBeNull();
    await pool.query("ALTER TABLE site_users DROP CONSTRAINT fixture_insert_failure");
    expect((await claims.claimTeam(input("111111"))).ok).toBe(true);
  });

  it("leaves neither write committed when the invite update fails", async () => {
    const claims = store();
    await claims.createInviteCode("1", "111111");
    await pool.query(`CREATE OR REPLACE FUNCTION reject_fixture_invite() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN RAISE EXCEPTION 'synthetic invite failure'; END; $$;
      CREATE TRIGGER fixture_invite_failure BEFORE UPDATE ON invite_codes
      FOR EACH ROW EXECUTE FUNCTION reject_fixture_invite();`);
    await expect(claims.claimTeam(input("111111"))).rejects.toMatchObject({ cause: { code: "P0001" } });
    expect(await claims.getUserByTeam("1")).toBeNull();
    expect((await claims.getInviteByCode("111111"))?.usedBy).toBeNull();
    await pool.query("DROP TRIGGER fixture_invite_failure ON invite_codes");
    expect((await claims.claimTeam(input("111111"))).ok).toBe(true);
  });
});
