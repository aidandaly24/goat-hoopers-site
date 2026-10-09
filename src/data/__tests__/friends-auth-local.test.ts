/** Reuses the existing explicit local claim-fixture guard; never reads application URLs/secrets. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { randomBytes, createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { friendsSchema } from "../friends-auth/db";
import { enrollFriend, consumeAuthAttempt } from "../friends-auth/runtime";
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
    await enrollFriend({ ...input, kind: "existing", email: "existing@example.test" }, tokenHash, headers, dependencies);
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
});
