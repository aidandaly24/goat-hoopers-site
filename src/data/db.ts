/**
 * db.ts — the site's own database. The second data door.
 *
 * The Sleeper API is read-only league data; this is the write world:
 * accounts, invite codes, sessions, scores, rewards. It lives in Neon
 * (serverless Postgres — serverless needs real Postgres, SQLite can't
 * work here).
 *
 * Contract: this module is the ONLY place that imports the drizzle client
 * or touches these tables. Everything else goes through the `GameStore`
 * abstraction in `./arcade`. The client is lazy: importing this module
 * never connects, so pages build and render even before the database is
 * provisioned. `getDb()` throws a descriptive error only when actually
 * called without `DATABASE_URL` set.
 *
 * One-time provisioning (do this once):
 * 1. Create a free Neon project at neon.tech, copy the pooled connection
 *    string.
 * 2. Set it as `DATABASE_URL` in the Vercel project settings
 *    (and in `.env.local` for local dev).
 * 3. From this repo: `npx drizzle-kit push`
 *    That creates the tables below. Done.
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  real,
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
  /** The code itself: a 6-digit number, e.g. "482910". */
  code: text("code").primaryKey(),
  /** Sleeper roster_id this code claims. */
  teamId: text("team_id").notNull(),
  usedBy: uuid("used_by"),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * Brute-force guard for the claim flow. Failed code entries are counted
 * per client IP; 5 failures locks the IP out for 15 minutes. Successful
 * claims clear the counter.
 */
export const claimAttempts = pgTable("claim_attempts", {
  /** SHA-256 of the client IP. We never store raw IPs. */
  ipHash: text("ip_hash").primaryKey(),
  attempts: integer("attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
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

/**
 * Stock market price history. One row per player per snapshot; the loader
 * writes a snapshot each time it recomputes prices (at most daily —
 * fundamentals refresh daily, so anything more frequent is write
 * amplification on Neon's free tier). Rows older than 30 days are pruned on
 * write, so this table stays small.
 *
 * Until the database is provisioned (see top of file) the stock market
 * simply runs without history — prices still compute, change % shows as
 * "new". The site must never crash on a missing database.
 */
export const stockSnapshots = pgTable("stock_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Sleeper player_id. */
  playerId: text("player_id").notNull(),
  /** Price in cents — integers dodge float drift. */
  priceCents: integer("price_cents").notNull(),
  snapshotAt: timestamp("snapshot_at").defaultNow().notNull(),
});

/**
 * Player fundamentals cache for the stock market (valuation v2). One row
 * per player, UPSERTED — never grows. Refreshed from Sleeper's stats feed
 * at most once a day; the valuation engine reads only this table, never
 * the network, so page loads stay fast and Neon stays quiet.
 *
 * Trailing production (fppg) is computed in our league's scoring from
 * raw season totals. emaFppg/emaGames implement the in-season Bayesian
 * update (see emaUpdate in transform.ts); null/0 in the preseason, when
 * prices run on trailing production + pedigree alone.
 */
export const playerStatCache = pgTable("player_stat_cache", {
  /** Sleeper player_id. */
  playerId: text("player_id").primaryKey(),
  /** Trailing fantasy PPG (0.65 × last season + 0.35 × season before), null if never played. */
  fppg: real("fppg"),
  /** Estimated career NBA minutes (sums the seasons we have). */
  careerMinutes: integer("career_minutes").default(0).notNull(),
  /** Games in the trailing window. */
  gamesPlayed: integer("games_played").default(0).notNull(),
  /** In-season exponential moving average of game fppg; null until games are played. */
  emaFppg: real("ema_fppg"),
  /** Games folded into emaFppg. */
  emaGames: integer("ema_games").default(0).notNull(),
  /** Earliest league rookie-draft overall pick; null if never drafted. */
  leaguePick: integer("league_pick"),
  /**
   * Per-season history: [{ season: "2025", fppg: 21.0, games: 74 }, …],
   * newest first, up to 5 seasons. Powers the "last 5 seasons" view —
   * real production, not model artifacts.
   */
  seasonHistory: jsonb("season_history"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * Reconstructed + live price history for the player stock market.
 * One row per player per game (gamelog) or per season (backtest).
 * Live daily snapshots continue to land in `stock_snapshots`; this table
 * is the deep history that makes the price chart real instead of a flat
 * line.
 *
 * Retention: rolling 5-season window (see pruneSuperseded in stocks.ts).
 * `backtest` points are deleted when `gamelog` coverage arrives for the
 * same player+season, and anything older than 5 seasons is pruned.
 * `live` rows are never written here — they stay in stock_snapshots.
 */
export const priceHistory = pgTable("price_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Sleeper player_id. */
  playerId: text("player_id").notNull(),
  /** Game date (gamelog) or season-end date (backtest). */
  date: timestamp("date").notNull(),
  /** Price in cents — integers dodge float drift. */
  priceCents: integer("price_cents").notNull(),
  /** 'gamelog' | 'backtest'. Never 'live' — live stays in stock_snapshots. */
  source: text("source").notNull(),
  /** Season label, e.g. "2024-25". */
  season: text("season").notNull(),
});

export const schema = {
  siteUsers,
  inviteCodes,
  claimAttempts,
  sessions,
  gameScores,
  rewards,
  stockSnapshots,
  playerStatCache,
  priceHistory,
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
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Create a free Neon project, set " +
        "DATABASE_URL (see the provisioning steps at the top of " +
        "src/data/db.ts), then run `npx drizzle-kit push`.",
    );
  }
  cached = drizzle(neon(url), { schema });
  return cached;
}
