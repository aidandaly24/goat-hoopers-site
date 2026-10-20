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
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uuid,
  index,
  uniqueIndex,
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
}, (table) => [index("sessions_user_id_idx").on(table.userId)]);

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
}, (table) => [index("game_scores_game_week_idx").on(table.gameId, table.week)]);

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
}, (table) => [index("rewards_user_id_idx").on(table.userId)]);

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
}, (table) => [
  // The market page loads newest-first snapshots on every view
  // (ORDER BY snapshot_at DESC LIMIT n). Without this index Postgres
  // sorts the whole table each time — a Neon free-tier tax.
  index("stock_snapshots_snapshot_at_idx").on(table.snapshotAt.desc()),
]);

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
  date: timestamp("date", { withTimezone: true }).notNull(),
  /** Price in cents — integers dodge float drift. */
  priceCents: integer("price_cents").notNull(),
  /** 'gamelog' | 'backtest'. Never 'live' — live stays in stock_snapshots. */
  source: text("source").notNull(),
  /** Season label, e.g. "2024-25". */
  season: text("season").notNull(),
}, (table) => [uniqueIndex("price_history_point_unique").on(table.playerId, table.date, table.source)]);

/** Singleton publication manifest, committed atomically with its points. */
export const priceHistoryImportState = pgTable("price_history_import_state", {
  id: text("id").primaryKey(),
  datasetId: text("dataset_id").notNull(),
  manifest: jsonb("manifest").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Team value history (#217): the normalized Sleeper transaction archive the
 * roster replay runs on. One row per transaction per league, for both
 * league seasons (2025: 1282883196567977984, 2026: 1387473752807190528).
 *
 * Failed transactions are STORED (status is kept verbatim) — the replay
 * filters to status = 'complete' at read time, never by deleting evidence.
 * adds/drops keep Sleeper's shape: a map of player_id -> roster_id, null
 * when that side of the move is empty. The week bucket a record was
 * retrieved from is provenance only; Sleeper buckets are NOT event time
 * (the 2026 league's preseason moves all sit in bucket 1). Ordering comes
 * from effective_at (Sleeper's status_updated), tie-broken by
 * transaction_id, per the replay contract agreed on #217.
 *
 * retrieved_at is when OUR ingest fetched the record — the source audit
 * keeps retrieval time strictly separate from source effective time.
 */
export const sleeperTransactions = pgTable("sleeper_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Sleeper transaction_id. Unique per league (re-ingest dedupes on it). */
  transactionId: text("transaction_id").notNull(),
  /** Sleeper league_id (a 64-bit snowflake — always text, never a number). */
  leagueId: text("league_id").notNull(),
  /** Sleeper league season year, e.g. "2025". */
  season: text("season").notNull(),
  /** 'free_agent' | 'waiver' | 'trade' | 'commissioner' (Sleeper verbatim). */
  type: text("type").notNull(),
  /** Sleeper status verbatim: 'complete', 'failed', … — never filtered here. */
  status: text("status").notNull(),
  /** Effective time: Sleeper's status_updated, the replay ordering key. */
  effectiveAt: timestamp("effective_at", { withTimezone: true }).notNull(),
  /** Sleeper's created timestamp for the transaction. */
  sourceCreatedAt: timestamp("source_created_at", { withTimezone: true }).notNull(),
  /** Week bucket the record was retrieved from. Provenance, not event time. */
  week: integer("week"),
  /** Sleeper roster_ids involved in the move. */
  rosterIds: jsonb("roster_ids").notNull(),
  /** player_id -> roster_id for players joining a roster; null if none. */
  adds: jsonb("adds"),
  /** player_id -> roster_id for players leaving a roster; null if none. */
  drops: jsonb("drops"),
  /** FAAB bid in whole dollars (settings.waiver_bid), null when not a bid. */
  waiverBid: integer("waiver_bid"),
  /** Sleeper's settings object verbatim (carries waiver_bid and more). */
  settings: jsonb("settings"),
  /** Sleeper's metadata object verbatim, when present. */
  metadata: jsonb("metadata"),
  /** The complete original transaction object, as retrieved. */
  rawPayload: jsonb("raw_payload").notNull(),
  /** When our ingest retrieved this record from Sleeper. */
  retrievedAt: timestamp("retrieved_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("sleeper_transactions_league_txn_unique").on(table.leagueId, table.transactionId),
  // The replay scans one league's completed moves in effective-time order.
  index("sleeper_transactions_replay_idx").on(table.leagueId, table.status, table.effectiveAt),
]);

/**
 * Team value history (#217): replay output — who was actually on each
 * roster on each UTC calendar day. One row per league + roster slot + day
 * per replay generation. Franchise identity is the roster SLOT within its
 * league (roster 8 changed owners between seasons; the series follows the
 * slot, per #217).
 *
 * roster_status is CONFIDENCE ONLY — the presentation contract's
 * TeamHistoryRosterStatus ('verified' | 'replayed' | 'ambiguous' |
 * 'unavailable') — and never an origin: 'boundary-reconciliation' is a
 * move/evidence origin (see roster_boundary_moves), not a roster status.
 *
 * - 'verified' / 'replayed': membership is established at this date;
 *   player_ids holds the rostered player_ids, sorted for determinism.
 *   Dated snapshots stay valid at their supported dates; nothing here
 *   retroactively assigns an undated move a date.
 * - 'ambiguous': membership over the surrounding interval cannot be
 *   established (e.g. the offseason keeper boundary — the cut set is
 *   derived by reconciling the previous season's final roster against
 *   this season's lineage, but offseason cuts are not transactions in
 *   either league's feed, so no effective day is proven). player_ids is
 *   EMPTY and roster_count is NULL: no membership is promoted into a
 *   valued roster. roster_evidence carries the reconciliation reasoning
 *   (string refs: source transaction ids, boundary move ids,
 *   human-readable notes). Only when a member COUNT is independently
 *   supported despite unknown identities may roster_count carry it —
 *   still with no player list and no priced value.
 * - 'unavailable': no support exists at all; same empty shape.
 */
export const rosterSnapshotsDaily = pgTable("roster_snapshots_daily", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Sleeper league_id (text snowflake). */
  leagueId: text("league_id").notNull(),
  /** Sleeper league season year, e.g. "2025". */
  season: text("season").notNull(),
  /** Sleeper roster slot within the league (1–10). */
  rosterId: integer("roster_id").notNull(),
  /** UTC calendar day this coverage row describes. */
  date: date("date").notNull(),
  /**
   * Sleeper player_ids rostered that day, sorted for determinism.
   * Non-empty only for 'verified' / 'replayed'; MUST be [] when the day
   * is 'ambiguous' or 'unavailable' (membership unestablished).
   */
  playerIds: jsonb("player_ids").notNull(),
  /**
   * Independently supported member count when identities are unknown
   * (ambiguous days); NULL when no count is supported. For
   * verified/replayed days it mirrors player_ids length or stays NULL —
   * the snapshot's own length is authoritative there.
   */
  rosterCount: integer("roster_count"),
  /** 'verified' | 'replayed' | 'ambiguous' | 'unavailable' — confidence only. */
  rosterStatus: text("roster_status").notNull(),
  /**
   * Evidence/reasoning refs for this day's coverage: source transaction
   * ids, roster_boundary_moves ids, coverage notes. The presentation
   * contract's rosterEvidence; null when there is nothing to cite.
   */
  rosterEvidence: jsonb("roster_evidence"),
  /** Replay run that produced this row (the envelope generation). */
  generation: text("generation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("roster_snapshots_daily_unique").on(table.leagueId, table.rosterId, table.date, table.generation),
  index("roster_snapshots_daily_range_idx").on(table.leagueId, table.rosterId, table.date),
]);

/**
 * Team value history (#217): DERIVED boundary moves — the reconciliation
 * evidence behind ambiguous roster coverage, kept separate from both the
 * sourced transaction archive and roster confidence. Offseason keeper
 * cuts exist in neither league's transaction feed, so the boundary
 * between seasons is reconstructed by reconciling the previous season's
 * final roster against the next season's opening lineage; each derived
 * membership delta lands here as a move whose ORIGIN is
 * 'boundary-reconciliation' — an origin, never a roster status, and never
 * proof a cut happened on a chosen date.
 *
 * When the effective time is unknown the timing stays unknown:
 * precision = 'unknown' with effective_at NULL and day NULL. Nothing in
 * this table assigns the move a date the evidence does not support.
 */
export const rosterBoundaryMoves = pgTable("roster_boundary_moves", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Sleeper league_id of the season the move is derived against. */
  leagueId: text("league_id").notNull(),
  /** Sleeper league season year the move is derived against. */
  season: text("season").notNull(),
  /** Sleeper roster slot within the league (1–10). */
  rosterId: integer("roster_id").notNull(),
  /** Move origin; for this table always 'boundary-reconciliation'. */
  origin: text("origin").notNull(),
  /** 'boundary-reconciliation' (the derived cut/keep reconciliation). */
  type: text("type").notNull(),
  /** 'derived' — computed by reconciliation, never a sourced record. */
  status: text("status").notNull(),
  /** 'instant' | 'day' | 'unknown' — how precisely timing is known. */
  precision: text("precision").notNull(),
  /** Effective time when precision = 'instant'; NULL otherwise. */
  effectiveAt: timestamp("effective_at", { withTimezone: true }),
  /** UTC calendar day when precision = 'day'; NULL otherwise. */
  day: date("day"),
  /** player_id -> roster_id for derived joins; null if none. */
  adds: jsonb("adds"),
  /** player_id -> roster_id for derived leaves; null if none. */
  drops: jsonb("drops"),
  /** Reconciliation reasoning / human-readable evidence note. */
  note: text("note"),
  /** Replay run that produced this row (the envelope generation). */
  generation: text("generation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  index("roster_boundary_moves_roster_idx").on(table.leagueId, table.rosterId),
]);

/**
 * Team value history (#217): the derived daily value series — one row per
 * league + roster slot + UTC day per generation, joining a roster snapshot
 * to the prices eligible on that day.
 *
 * subtotal_cents is NULLABLE on purpose: null means the value is UNKNOWN,
 * never zero. A point is 'complete' only when every rostered player was
 * priced; 'partial' points are labeled subtotals and carry priced_set_id
 * (deltas are only meaningful across an identical priced set);
 * 'unavailable' points have no eligible price at all. An explicit
 * 'unavailable' point may exist for an ambiguous/unavailable roster day
 * (priced_count 0, subtotal NULL, roster_count NULL — the count is
 * unknown, not zero — provenance 'unavailable', continuity_id NULL): it
 * records that no valuation exists; it creates no line and no inferred
 * value. Days whose roster is merely ambiguous usually carry NO point at
 * all. roster_count is NULL whenever the day's member count is not
 * independently supported. provenance_class
 * separates 'recorded' (quotes captured contemporaneously, from
 * stock_snapshots) from 'reconstructed' (retrospective model estimates)
 * and 'mixed'; the two are never blended silently. continuity_id is the
 * producer's explicit segment assertion — renderers connect points only
 * within a shared non-null continuity id, so gaps, season rollovers,
 * source switches and standalone annual estimates (standalone = true,
 * continuity_id null) break the line.
 *
 * Recorded points persist HERE, with their source references (original
 * stock_snapshots row ids + timestamps in source_refs), because
 * stock_snapshots prunes after 30 days — this table is the durable record
 * the pruning would otherwise erase.
 */
export const teamValuePoints = pgTable("team_value_points", {
  id: uuid("id").defaultRandom().primaryKey(),
  /** Sleeper league_id (text snowflake). */
  leagueId: text("league_id").notNull(),
  /** Sleeper league season year, e.g. "2025". */
  season: text("season").notNull(),
  /** Sleeper roster slot within the league (1–10). */
  rosterId: integer("roster_id").notNull(),
  /** UTC calendar day the point describes. */
  date: date("date").notNull(),
  /** Explicit valuation cutoff for the day; null when no price was eligible. */
  valuationAt: timestamp("valuation_at", { withTimezone: true }),
  /** Sum of priced players in integer cents. NULL = unknown, never zero. */
  subtotalCents: integer("subtotal_cents"),
  /** Players with an eligible price in this point. */
  pricedCount: integer("priced_count").notNull(),
  /**
   * Players on the day's roster snapshot; NULL when the roster/count is
   * not independently supported (ambiguous or unavailable days) — an
   * unknown count is never recorded as zero.
   */
  rosterCount: integer("roster_count"),
  /** 'complete' | 'partial' | 'unavailable'. */
  status: text("status").notNull(),
  /** 'recorded' | 'reconstructed' | 'mixed' | 'unavailable'. */
  provenanceClass: text("provenance_class").notNull(),
  /** Producer-asserted segment id; null breaks the rendered line. */
  continuityId: text("continuity_id"),
  /** Identity of the priced player set; required for partial-point deltas. */
  pricedSetId: text("priced_set_id"),
  /** Isolated season-end estimate (not part of any daily line). */
  standalone: boolean("standalone").default(false).notNull(),
  /**
   * Per-point source proof: recorded points carry each player's original
   * quote row id + recorded timestamp; reconstructed points carry the
   * dataset/model version + input cutoff.
   */
  sourceRefs: jsonb("source_refs"),
  /** Series generation that produced this row. */
  generation: text("generation").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [
  uniqueIndex("team_value_points_unique").on(table.leagueId, table.rosterId, table.date, table.generation),
  index("team_value_points_range_idx").on(table.leagueId, table.rosterId, table.date),
]);

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
  priceHistoryImportState,
  sleeperTransactions,
  rosterSnapshotsDaily,
  rosterBoundaryMoves,
  teamValuePoints,
};

export type Db = ReturnType<typeof drizzle<typeof schema>>;

/** Explicit import connection; never falls back to ambient application credentials. */
export function createImportDb(url: string): Db {
  return drizzle(neon(url), { schema });
}

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
