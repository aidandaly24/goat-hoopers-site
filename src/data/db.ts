/**
 * db.ts — the site's own database. The second data door.
 *
 * The Sleeper API is read-only league data; this is the write world:
 * accounts, invite codes, sessions, scores, rewards. It lives in Vercel
 * Postgres (serverless needs real Postgres — SQLite can't work here).
 *
 * Contract: this module is the ONLY place that imports the drizzle client
 * or touches these tables. Everything else goes through the `GameStore`
 * abstraction in `./arcade`. The client is lazy: importing this module
 * never connects, so pages build and render even before the database is
 * provisioned. `getDb()` throws a descriptive error only when actually
 * called without `POSTGRES_URL` set.
 *
 * One-time provisioning (do this once, in the Vercel dashboard):
 * 1. Vercel dashboard → Storage → Create Database → Postgres.
 * 2. Connect it to the `goat-hoopers-site` project (this wires
 *    POSTGRES_URL and friends into the environment automatically).
 * 3. From this repo, with the env vars available locally:
 *      npx drizzle-kit push
 *    That creates the tables below. Done.
 */
import { sql } from "@vercel/postgres";
import { drizzle } from "drizzle-orm/vercel-postgres";
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/** League managers with site accounts. One row per Sleeper team. */
export const siteUsers = pgTable("site_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Sleeper roster_id. Unique: one account per team. */
  teamId: text("team_id").notNull().unique(),
  displayName: text("display_name").notNull(),
  /** bcrypt hash. Raw passwords never touch the database. */
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Single-use invite codes binding teams to accounts. */
export const inviteCodes = pgTable("invite_codes", {
  /** The code itself, e.g. "GH-7K2Q-9XMD". */
  code: text("code").primaryKey(),
  /** Sleeper roster_id this code claims. */
  teamId: text("team_id").notNull(),
  usedBy: uuid("used_by"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Login sessions. Only the SHA-256 hash of the cookie token is stored. */
export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => siteUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Recorded game scores, scoped to league weeks. */
export const gameScores = pgTable("game_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Game slug, matches `Game.id` in the registry. */
  gameId: text("game_id").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => siteUsers.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  /** League week label, e.g. "2026-W06". */
  week: text("week").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * FAAB rewards owed to managers. The site records who earned what;
 * the commissioner settles it (the Sleeper API exposes no FAAB
 * adjustment endpoint).
 */
export const rewards = pgTable("rewards", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => siteUsers.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  gameId: text("game_id").notNull(),
  week: text("week").notNull(),
  amountFaab: integer("amount_faab").notNull(),
  settled: boolean("settled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const schema = {
  siteUsers,
  inviteCodes,
  sessions,
  gameScores,
  rewards,
};

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

/**
 * The drizzle client, created on first use. Throws a descriptive error
 * when Vercel Postgres isn't wired up yet — callers should catch this
 * and render the provisioning notice instead of crashing the page.
 */
export function getDb(): Db {
  if (cached) return cached;
  if (!process.env.POSTGRES_URL) {
    throw new Error(
      "POSTGRES_URL is not set. Provision Vercel Postgres and connect it " +
        "to this project (see the provisioning steps at the top of " +
        "src/data/db.ts), then run `npx drizzle-kit push`.",
    );
  }
  cached = drizzle(sql, { schema });
  return cached;
}
