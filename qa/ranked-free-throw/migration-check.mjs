// Atomicity/compatibility proof on the existing fixed disposable PostgreSQL target.
import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { Pool } from "pg";

if (process.env.RUN_CLAIM_TEAM_LOCAL_TEST !== "1") throw new Error("Explicit existing local PostgreSQL opt-in required");
const schema = `ranked_migration_${randomUUID().replaceAll("-", "")}`;
const pool = new Pool({ host: "127.0.0.1", port: 55441, database: "claim_team_test", user: "postgres", ssl: false,
  max: 1, connectionTimeoutMillis: 1500, options: `-c search_path=${schema}` });
const client = await pool.connect(), migration = await readFile("migrations/ranked-free-throw.sql", "utf8");
const report = { target: "127.0.0.1:55441/claim_team_test", migrationSha256: createHash("sha256").update(migration).digest("hex"), checks: [] };
let ownsSchema = false;
const record = check => { report.checks.push(check); console.log(check); };
async function snapshot() {
  const result = {};
  for (const table of ["site_users", "game_scores", "rewards", "auth_user"]) {
    result[table] = (await client.query(`SELECT coalesce(jsonb_agg(to_jsonb(t) ORDER BY id),'[]'::jsonb) AS rows FROM ${table} t`)).rows[0].rows;
  }
  return result;
}
try {
  assert.equal((await client.query("SELECT current_database() AS db")).rows[0].db, "claim_team_test");
  await client.query(`CREATE SCHEMA ${schema}`); ownsSchema = true;
  await client.query(`CREATE TABLE site_users(id uuid PRIMARY KEY,team_id text NOT NULL UNIQUE,display_name text NOT NULL,password_hash text NOT NULL,created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE invite_codes(code text PRIMARY KEY,team_id text NOT NULL,used_by uuid,used_at timestamp,created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE sessions(token_hash text PRIMARY KEY,user_id uuid REFERENCES site_users(id),expires_at timestamp NOT NULL,created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE game_scores(id uuid PRIMARY KEY,game_id text NOT NULL,user_id uuid REFERENCES site_users(id),score integer NOT NULL,week text NOT NULL,created_at timestamp NOT NULL DEFAULT now());
    CREATE TABLE rewards(id uuid PRIMARY KEY,user_id uuid REFERENCES site_users(id),display_name text NOT NULL,game_id text NOT NULL,week text NOT NULL,amount_faab integer NOT NULL,settled boolean NOT NULL DEFAULT false,created_at timestamp NOT NULL DEFAULT now());`);
  await client.query((await readFile("db/friends-auth/0000_friends_auth.sql", "utf8")).replaceAll('"public".', `"${schema}".`));
  await client.query(await readFile("db/friends-auth/0001_account_usernames.sql", "utf8"));
  const legacy = randomUUID();
  await client.query("INSERT INTO site_users(id,team_id,display_name,password_hash) VALUES($1,'1','Synthetic legacy owner','unchanged-synthetic-hash')", [legacy]);
  await client.query("INSERT INTO game_scores(id,game_id,user_id,score,week) VALUES($1,'synthetic-legacy',$2,7,'2026-W42')", [randomUUID(), legacy]);
  await client.query("INSERT INTO rewards(id,user_id,display_name,game_id,week,amount_faab) VALUES($1,$2,'Synthetic legacy owner','synthetic-legacy','2026-W42',0)", [randomUUID(), legacy]);
  await client.query("INSERT INTO auth_user(id,name,email,email_verified,created_at,updated_at) VALUES('synthetic-existing-person','existing_person','existing@example.test',true,now(),now())");
  const before = await snapshot();
  // A late collision occurs after table/index creation, exercising the SQL transaction.
  await client.query("CREATE FUNCTION guard_ranked_free_throw_run() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$");
  let error;
  try { await client.query(migration); } catch (caught) { error = caught; await client.query("ROLLBACK"); }
  assert.equal(error?.code, "42723");
  assert.deepEqual((await client.query("SELECT to_regclass('ranked_free_throw_runs') AS runs,to_regclass('ranked_free_throw_scores') AS scores")).rows, [{ runs: null, scores: null }]);
  assert.deepEqual(await snapshot(), before);
  record("Late migration failure rolls back new tables/indexes while existing auth/legacy rows remain unchanged");
  await client.query("DROP FUNCTION guard_ranked_free_throw_run()"); await client.query(migration);
  assert.deepEqual(await snapshot(), before);
  record("Successful additive migration preserves existing provider identities, legacy accounts, scores and ledger rows");
  error = undefined;
  try { await client.query(migration); } catch (caught) { error = caught; await client.query("ROLLBACK"); }
  assert.equal(error?.code, "42P07"); assert.deepEqual(await snapshot(), before);
  assert.ok((await client.query("SELECT to_regclass('ranked_free_throw_runs') AS table_name")).rows[0].table_name);
  record("Accidental reapplication fails closed; the original additive installation and legacy reads remain intact");
  record("App rollback can retain new tables and use original legacy reads; no destructive down migration is required");
  if (process.env.QA_REPORT_PATH) await writeFile(process.env.QA_REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.query("ROLLBACK");
  if (ownsSchema) await client.query(`DROP SCHEMA ${schema} CASCADE`);
  client.release(); await pool.end();
}
