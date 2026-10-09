/** Reuses the existing explicit local claim-fixture guard; never reads application URLs/secrets. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { friendsSchema } from "../friends-auth/db";
import { claimAccountTeam, enrollFriend, consumeAuthAttempt, registerAccount, requestTeamPasswordReset } from "../friends-auth/runtime";
import { createFriendsAuth, type AccountMail } from "../friends-auth/provider";
import { providerSchema, accountIdentities } from "../friends-auth/schema";

describe.skipIf(process.env.RUN_CLAIM_TEAM_LOCAL_TEST !== "1")("one disposable PostgreSQL friends-auth flow", () => {
  const pool = new Pool({ connectionString: "postgresql://postgres@127.0.0.1:55441/claim_team_test",
    options: "-c search_path=friends_auth_local_test", max: 4 });
  const db = drizzle(pool, { schema: friendsSchema });
  const config = { origin: "https://goat.test", secret: randomBytes(48).toString("hex"), secureCookies: true };
  const mail: AccountMail[] = [];
  let ownsSchema = false;
  const dependencies = { db, config, queueMail: (messages: AccountMail[]) => { mail.push(...messages); } };
  const headers = new Headers({ Origin: config.origin });
  const input = { kind: "invite" as const, email: "new@example.test", password: "synthetic-password-only", displayName: "Synthetic", inviteCode: "123456" };

  beforeAll(async () => {
    await pool.query("CREATE SCHEMA friends_auth_local_test");
    ownsSchema = true;
    await pool.query(`CREATE TABLE site_users (id UUID PRIMARY KEY, team_id TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now());
      CREATE TABLE invite_codes (code TEXT PRIMARY KEY, team_id TEXT NOT NULL, used_by UUID, used_at TIMESTAMP, created_at TIMESTAMP NOT NULL DEFAULT now());
      CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id UUID NOT NULL REFERENCES site_users(id), expires_at TIMESTAMP NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT now());`);
    const migration = await readFile(new URL("../../../db/friends-auth/0000_friends_auth.sql", import.meta.url), "utf8");
    await pool.query(migration.replaceAll('"public".', '"friends_auth_local_test".'));
    await pool.query(await readFile(new URL("../../../db/friends-auth/0001_account_usernames.sql", import.meta.url), "utf8"));
  });
  afterAll(async () => { if (ownsSchema) await pool.query("DROP SCHEMA friends_auth_local_test CASCADE"); await pool.end(); });

  it("atomically claims, preserves an existing UUID/hash, rolls back failures, and shares durable caps", async () => {
    await pool.query("INSERT INTO invite_codes(code,team_id) VALUES ('123456','fixture-new'),('234567','fixture-duplicate')");
    const attempts = await Promise.allSettled([enrollFriend(input, null, headers, dependencies), enrollFriend(input, null, headers, dependencies)]);
    expect(attempts.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await pool.query("SELECT id FROM site_users")).rowCount).toBe(1);
    expect((await pool.query("SELECT id FROM auth_user")).rowCount).toBe(1);
    expect((await pool.query("SELECT subject FROM account_identities")).rowCount).toBe(1);
    expect(mail).toHaveLength(1);
    await expect(enrollFriend({ ...input, inviteCode: "234567" }, null, headers, dependencies)).rejects.toBeDefined();
    expect((await pool.query("SELECT used_by FROM invite_codes WHERE code='234567'")).rows[0].used_by).toBeNull();
    expect((await pool.query("SELECT id FROM site_users")).rowCount).toBe(1);

    const existingId = "00000000-0000-4000-8000-000000000119";
    const tokenHash = createHash("sha256").update("synthetic-session-only").digest("hex");
    await pool.query("INSERT INTO site_users(id,team_id,display_name,password_hash) VALUES ($1,'fixture-existing','Existing','fixture-hash-unchanged')", [existingId]);
    await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES ($1,$2,NOW()+INTERVAL '1 hour')", [tokenHash, existingId]);
    await enrollFriend({ ...input, kind: "existing", email: "existing@example.test", displayName: "existing_person" }, tokenHash, headers, dependencies);
    const [link] = await db.select().from(accountIdentities).where(eq(accountIdentities.userId, existingId));
    expect(link.userId).toBe(existingId);
    expect((await pool.query("SELECT password_hash FROM site_users WHERE id=$1", [existingId])).rows[0].password_hash).toBe("fixture-hash-unchanged");
    const auth = createFriendsAuth({ database: drizzleAdapter(db, { provider: "pg", schema: providerSchema, transaction: true }),
      config, sendMail: async () => {} });
    const existingMail = mail.at(-1)!;
    expect((await auth.handler(new Request(existingMail.url))).status).toBe(302);
    const login = await auth.api.signInEmail({ body: { email: "existing@example.test", password: input.password }, asResponse: true });
    expect(login.ok).toBe(true);
    const cookie = login.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    const session = await auth.api.getSession({ headers: new Headers({ Cookie: cookie }) });
    expect(session?.user.id).toBe(link.subject);
    const caps = await Promise.all(Array.from({ length: 4 }, () => consumeAuthAttempt("fixture-cap", 2, db)));
    expect(caps.filter(Boolean)).toHaveLength(2);
  }, 20000);

  const auth = () => createFriendsAuth({ database: drizzleAdapter(db, { provider: "pg", schema: providerSchema, transaction: true }),
    config, sendMail: async (message) => { mail.push(message); } });
  async function verifiedAccount(email: string) {
    await registerAccount({ email, password: input.password, username: email.split("@")[0].replaceAll("-", "_") }, headers, dependencies);
    const verification = mail.findLast((message) => message.to === email && message.kind === "verify")!;
    expect((await auth().handler(new Request(verification.url))).status).toBe(302);
    const login = await auth().api.signInEmail({ body: { email, password: input.password }, asResponse: true });
    expect(login.ok).toBe(true);
    return new Headers({ Origin: config.origin, Cookie: login.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ") });
  }

  it("registers and recovers an unclaimed account without granting an app identity", async () => {
    const before = (await pool.query("SELECT id FROM site_users")).rowCount;
    const actor = await verifiedAccount("unclaimed@example.test");
    await expect(registerAccount({ email: "other@example.test", password: input.password, username: "UNCLAIMED" }, headers, dependencies)).rejects.toBeDefined();
    expect((await pool.query("SELECT id FROM auth_user WHERE email='other@example.test'")).rowCount).toBe(0);
    expect((await pool.query("SELECT id FROM site_users")).rowCount).toBe(before);
    const session = await auth().api.getSession({ headers: actor });
    expect(session?.user.emailVerified).toBe(true);
    expect((await pool.query("SELECT subject FROM account_identities WHERE subject=$1", [session!.user.id])).rowCount).toBe(0);
    await auth().api.requestPasswordReset({ body: { email: "unclaimed@example.test", redirectTo: `${config.origin}/reset-password` } });
    expect(mail.findLast((message) => message.to === "unclaimed@example.test")?.kind).toBe("reset");
    const mailCount = mail.length;
    await requestTeamPasswordReset("missing-team", headers, dependencies);
    expect(mail).toHaveLength(mailCount);
  }, 20000);

  it("has exactly one concurrent claimant and never transfers a claimed team or reuses its code", async () => {
    const actors = await Promise.all([verifiedAccount("claim-a@example.test"), verifiedAccount("claim-b@example.test")]);
    await pool.query("INSERT INTO invite_codes(code,team_id) VALUES ('345678','fixture-once'),('456789','fixture-once')");
    const blocker = await pool.connect();
    await blocker.query("BEGIN");
    await blocker.query("SELECT code FROM invite_codes WHERE code='345678' FOR UPDATE");
    const pending = Promise.allSettled(actors.map((actor) => claimAccountTeam({ inviteCode: "345678" }, actor, dependencies)));
    try {
      const deadline = Date.now() + 8000;
      let waiting = 0;
      while (Date.now() < deadline) {
        waiting = (await pool.query("SELECT pid FROM pg_stat_activity WHERE datname=current_database() AND wait_event_type='Lock' AND query LIKE '%invite_codes%' AND pid <> pg_backend_pid()")).rowCount ?? 0;
        if (waiting >= 2) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      expect(waiting).toBe(2);
    } finally { await blocker.query("ROLLBACK"); blocker.release(); }
    const results = await pending;
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const owner = (await pool.query("SELECT id FROM site_users WHERE team_id='fixture-once'")).rows[0].id;
    expect((await pool.query("SELECT used_by FROM invite_codes WHERE code='345678'")).rows[0].used_by).toBe(owner);
    await expect(claimAccountTeam({ inviteCode: "345678" }, actors[1], dependencies)).rejects.toBeDefined();
    const loser = actors[results.findIndex((result) => result.status === "rejected")];
    await expect(claimAccountTeam({ inviteCode: "456789" }, loser, dependencies)).rejects.toBeDefined();
    expect((await pool.query("SELECT id FROM site_users WHERE team_id='fixture-once'")).rows).toEqual([{ id: owner }]);
    expect((await pool.query("SELECT used_by FROM invite_codes WHERE code='456789'")).rows[0].used_by).toBeNull();
    expect((await pool.query("SELECT user_id FROM account_identities WHERE user_id=$1", [owner])).rowCount).toBe(1);
    const beforeMail = mail.length;
    await requestTeamPasswordReset("fixture-once", headers, dependencies);
    expect(mail).toHaveLength(beforeMail + 1);
    expect(mail.at(-1)?.kind).toBe("reset");
    await pool.query("UPDATE account_identities SET active=false WHERE user_id=$1", [owner]);
    await requestTeamPasswordReset("fixture-once", headers, dependencies);
    expect(mail).toHaveLength(beforeMail + 1);
  }, 30000);

  it("links an existing owner only with fresh proof, preserving its UUID and password hash", async () => {
    const actor = await verifiedAccount("link-existing@example.test");
    const owner = "00000000-0000-4000-8000-000000000120";
    const proof = createHash("sha256").update("synthetic-owner-proof").digest("hex");
    await pool.query("INSERT INTO site_users(id,team_id,display_name,password_hash) VALUES ($1,'fixture-link','Existing','unchanged-owner-hash')", [owner]);
    await pool.query("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES ($1,$2,NOW()+INTERVAL '1 hour',NOW()-INTERVAL '6 minutes')", [proof, owner]);
    await expect(claimAccountTeam({ legacyTokenHash: proof }, actor, dependencies)).rejects.toBeDefined();
    await pool.query("UPDATE sessions SET created_at=NOW() WHERE token_hash=$1", [proof]);
    await claimAccountTeam({ legacyTokenHash: proof }, actor, dependencies);
    expect((await pool.query("SELECT user_id FROM account_identities WHERE user_id=$1", [owner])).rows).toEqual([{ user_id: owner }]);
    expect((await pool.query("SELECT password_hash FROM site_users WHERE id=$1", [owner])).rows[0].password_hash).toBe("unchanged-owner-hash");
    await expect(claimAccountTeam({ legacyTokenHash: proof }, actor, dependencies)).rejects.toBeDefined();
  }, 20000);
});
