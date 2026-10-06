/**
 * arcade.ts — the GameStore abstraction. Dependency inversion in practice.
 *
 * `GameStore` is the contract every arcade feature programs against:
 * accounts, invites, sessions, scores, rewards. Pages and surfaces receive
 * a GameStore — they never import `DrizzleGameStore` or `./db` directly.
 * That keeps every feature testable against `FakeGameStore` with zero
 * database, and lets the storage backend change without touching a
 * single surface.
 *
 * `getGameStore()` is the composition root's factory: it hands out the
 * real Drizzle-backed store. It throws the same descriptive error as
 * `getDb()` when Postgres isn't provisioned — callers catch it and
 * render the provisioning notice.
 */
import { and, desc, eq, isNull } from "drizzle-orm";
import { GAMES } from "@/domain/arcade";
import type {
  Game,
  GameHubSummary,
  GameScore,
  InviteCode,
  LeaderboardEntry,
  Reward,
  SiteUser,
} from "@/domain/arcade";
import {
  claimAttempts,
  gameScores,
  getDb,
  inviteCodes,
  rewards,
  sessions,
  siteUsers,
  type Db,
} from "./db";

export type NewUser = {
  teamId: string;
  displayName: string;
  passwordHash: string;
};

export type NewScore = {
  gameId: string;
  userId: string;
  score: number;
  week: string;
};

export type NewReward = {
  userId: string;
  displayName: string;
  gameId: string;
  week: string;
  amountFaab: number;
};

export type SessionRecord = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

/** Failed code entries before a client is locked out of the claim flow. */
export const MAX_CLAIM_ATTEMPTS = 5;
/** How long the lockout lasts after 5 failures. */
export const CLAIM_LOCKOUT_MS = 15 * 60 * 1000;

/**
 * The full contract for the arcade's persistence. One method per
 * operation the features need — no more, no less. If a new game needs
 * a new query, it gets a new method here first.
 */
export type GameStore = {
  // --- users ---
  getUserByTeam(teamId: string): Promise<SiteUser | null>;
  getUserById(id: string): Promise<SiteUser | null>;
  /** Returns the bcrypt hash for login verification. Never expose to clients. */
  getPasswordHash(teamId: string): Promise<string | null>;
  createUser(input: NewUser): Promise<SiteUser>;

  // --- invite codes ---
  getInviteByCode(code: string): Promise<InviteCode | null>;
  listInviteCodes(): Promise<InviteCode[]>;
  createInviteCode(teamId: string, code: string): Promise<InviteCode>;
  /** Marks a code consumed by a user. Returns false if already used. */
  consumeInviteCode(code: string, userId: string): Promise<boolean>;
  /** Deletes unused codes for a team (used by "regenerate"). */
  deleteUnusedCodesForTeam(teamId: string): Promise<void>;

  // --- claim brute-force guard ---
  /** Failed code-entry attempts for a client (by IP hash). Null if none. */
  getClaimAttempts(
    ipHash: string,
  ): Promise<{ attempts: number; lockedUntil: Date | null } | null>;
  /**
   * Records one failed code entry. Returns the new attempt count and
   * whether the client is now locked out (5 failures = 15 min lock).
   */
  recordFailedClaimAttempt(
    ipHash: string,
  ): Promise<{ attempts: number; locked: boolean }>;
  /** Clears the counter after a successful claim. */
  clearClaimAttempts(ipHash: string): Promise<void>;

  // --- sessions ---
  createSession(record: SessionRecord): Promise<void>;
  getSessionUser(
    tokenHash: string,
  ): Promise<{ user: SiteUser; expiresAt: Date } | null>;
  deleteSession(tokenHash: string): Promise<void>;

  // --- scores & leaderboards ---
  createScore(input: NewScore): Promise<GameScore>;
  getLeaderboard(gameId: string, week: string): Promise<LeaderboardEntry[]>;

  // --- rewards ---
  createReward(input: NewReward): Promise<Reward>;
  getRewards(userId: string): Promise<Reward[]>;
  setRewardSettled(id: string, settled: boolean): Promise<void>;
};

function toSiteUser(row: typeof siteUsers.$inferSelect): SiteUser {
  return {
    id: row.id,
    teamId: row.teamId,
    displayName: row.displayName,
    createdAt: row.createdAt,
  };
}

function toInviteCode(row: typeof inviteCodes.$inferSelect): InviteCode {
  return {
    code: row.code,
    teamId: row.teamId,
    usedBy: row.usedBy,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
  };
}

/** The production store, backed by Vercel Postgres via Drizzle. */
export class DrizzleGameStore implements GameStore {
  private db: Db;

  constructor(db: Db = getDb()) {
    this.db = db;
  }

  async getUserByTeam(teamId: string): Promise<SiteUser | null> {
    const rows = await this.db
      .select()
      .from(siteUsers)
      .where(eq(siteUsers.teamId, teamId))
      .limit(1);
    return rows[0] ? toSiteUser(rows[0]) : null;
  }

  async getUserById(id: string): Promise<SiteUser | null> {
    const rows = await this.db
      .select()
      .from(siteUsers)
      .where(eq(siteUsers.id, id))
      .limit(1);
    return rows[0] ? toSiteUser(rows[0]) : null;
  }

  async getPasswordHash(teamId: string): Promise<string | null> {
    const rows = await this.db
      .select({ passwordHash: siteUsers.passwordHash })
      .from(siteUsers)
      .where(eq(siteUsers.teamId, teamId))
      .limit(1);
    return rows[0]?.passwordHash ?? null;
  }

  async createUser(input: NewUser): Promise<SiteUser> {
    const rows = await this.db.insert(siteUsers).values(input).returning();
    const row = rows[0];
    if (!row) throw new Error("createUser: insert returned no row");
    return toSiteUser(row);
  }

  async getInviteByCode(code: string): Promise<InviteCode | null> {
    const rows = await this.db
      .select()
      .from(inviteCodes)
      .where(eq(inviteCodes.code, code))
      .limit(1);
    return rows[0] ? toInviteCode(rows[0]) : null;
  }

  async listInviteCodes(): Promise<InviteCode[]> {
    const rows = await this.db.select().from(inviteCodes);
    return rows.map(toInviteCode);
  }

  async createInviteCode(teamId: string, code: string): Promise<InviteCode> {
    const rows = await this.db
      .insert(inviteCodes)
      .values({ code, teamId })
      .returning();
    const row = rows[0];
    if (!row) throw new Error("createInviteCode: insert returned no row");
    return toInviteCode(row);
  }

  async consumeInviteCode(code: string, userId: string): Promise<boolean> {
    const rows = await this.db
      .update(inviteCodes)
      .set({ usedBy: userId, usedAt: new Date() })
      .where(
        and(eq(inviteCodes.code, code), isNull(inviteCodes.usedBy)),
      )
      .returning({ code: inviteCodes.code });
    return rows.length > 0;
  }

  async deleteUnusedCodesForTeam(teamId: string): Promise<void> {
    await this.db
      .delete(inviteCodes)
      .where(
        and(
          eq(inviteCodes.teamId, teamId),
          isNull(inviteCodes.usedBy),
        ),
      );
  }

  async getClaimAttempts(
    ipHash: string,
  ): Promise<{ attempts: number; lockedUntil: Date | null } | null> {
    const rows = await this.db
      .select()
      .from(claimAttempts)
      .where(eq(claimAttempts.ipHash, ipHash))
      .limit(1);
    const row = rows[0];
    return row
      ? { attempts: row.attempts, lockedUntil: row.lockedUntil }
      : null;
  }

  async recordFailedClaimAttempt(
    ipHash: string,
  ): Promise<{ attempts: number; locked: boolean }> {
    const now = new Date();
    const existing = await this.getClaimAttempts(ipHash);
    const attempts = (existing?.attempts ?? 0) + 1;
    const locked = attempts >= MAX_CLAIM_ATTEMPTS;
    const lockedUntil = locked
      ? new Date(now.getTime() + CLAIM_LOCKOUT_MS)
      : null;
    await this.db
      .insert(claimAttempts)
      .values({ ipHash, attempts, lockedUntil })
      .onConflictDoUpdate({
        target: claimAttempts.ipHash,
        set: { attempts, lockedUntil },
      });
    return { attempts, locked };
  }

  async clearClaimAttempts(ipHash: string): Promise<void> {
    await this.db
      .delete(claimAttempts)
      .where(eq(claimAttempts.ipHash, ipHash));
  }

  async createSession(record: SessionRecord): Promise<void> {
    await this.db.insert(sessions).values(record);
  }

  async getSessionUser(
    tokenHash: string,
  ): Promise<{ user: SiteUser; expiresAt: Date } | null> {
    const rows = await this.db
      .select({ session: sessions, user: siteUsers })
      .from(sessions)
      .innerJoin(siteUsers, eq(sessions.userId, siteUsers.id))
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1);
    const row = rows[0];
    if (!row) return null;
    if (row.session.expiresAt.getTime() < Date.now()) {
      await this.deleteSession(tokenHash);
      return null;
    }
    return { user: toSiteUser(row.user), expiresAt: row.session.expiresAt };
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
  }

  async createScore(input: NewScore): Promise<GameScore> {
    const rows = await this.db.insert(gameScores).values(input).returning();
    const row = rows[0];
    if (!row) throw new Error("createScore: insert returned no row");
    return {
      id: row.id,
      gameId: row.gameId,
      userId: row.userId,
      score: row.score,
      week: row.week,
      createdAt: row.createdAt,
    };
  }

  async getLeaderboard(
    gameId: string,
    week: string,
  ): Promise<LeaderboardEntry[]> {
    // Best score per user for the week, ranked. Ties share display order
    // by earliest achievement.
    const rows = await this.db
      .select({
        score: gameScores.score,
        createdAt: gameScores.createdAt,
        displayName: siteUsers.displayName,
        teamId: siteUsers.teamId,
        userId: siteUsers.id,
      })
      .from(gameScores)
      .innerJoin(siteUsers, eq(gameScores.userId, siteUsers.id))
      .where(
        and(eq(gameScores.gameId, gameId), eq(gameScores.week, week)),
      )
      .orderBy(desc(gameScores.score), gameScores.createdAt);
    const best = new Map<string, (typeof rows)[number]>();
    for (const row of rows) {
      if (!best.has(row.userId)) best.set(row.userId, row);
    }
    return [...best.values()].map((row, i) => ({
      rank: i + 1,
      score: row.score,
      displayName: row.displayName,
      teamId: row.teamId,
      isCurrentUser: false,
    }));
  }

  async createReward(input: NewReward): Promise<Reward> {
    const rows = await this.db.insert(rewards).values(input).returning();
    const row = rows[0];
    if (!row) throw new Error("createReward: insert returned no row");
    return toReward(row);
  }

  async getRewards(userId: string): Promise<Reward[]> {
    const rows = await this.db
      .select()
      .from(rewards)
      .where(eq(rewards.userId, userId))
      .orderBy(desc(rewards.createdAt));
    return rows.map(toReward);
  }

  async setRewardSettled(id: string, settled: boolean): Promise<void> {
    await this.db
      .update(rewards)
      .set({ settled })
      .where(eq(rewards.id, id));
  }
}

function toReward(row: typeof rewards.$inferSelect): Reward {
  return {
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    gameId: row.gameId,
    week: row.week,
    amountFaab: row.amountFaab,
    settled: row.settled,
    createdAt: row.createdAt,
  };
}

/**
 * In-memory GameStore for tests and local development without a database.
 * Implements the same contract — if it diverges from DrizzleGameStore,
 * that's a bug in one of them.
 */
export class FakeGameStore implements GameStore {
  private users = new Map<string, SiteUser & { passwordHash: string }>();
  private invites = new Map<string, InviteCode>();
  private sessionsMap = new Map<string, SessionRecord>();
  private scores: GameScore[] = [];
  private rewardsList: Reward[] = [];
  private seq = 0;

  private nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}-fake-${this.seq}`;
  }

  async getUserByTeam(teamId: string): Promise<SiteUser | null> {
    for (const u of this.users.values()) {
      if (u.teamId === teamId) {
        const { passwordHash: _ph, ...user } = u;
        return user;
      }
    }
    return null;
  }

  async getUserById(id: string): Promise<SiteUser | null> {
    const u = this.users.get(id);
    if (!u) return null;
    const { passwordHash: _ph, ...user } = u;
    return user;
  }

  async getPasswordHash(teamId: string): Promise<string | null> {
    for (const u of this.users.values()) {
      if (u.teamId === teamId) return u.passwordHash;
    }
    return null;
  }

  async createUser(input: NewUser): Promise<SiteUser> {
    const user = {
      id: this.nextId("user"),
      createdAt: new Date(),
      ...input,
    };
    this.users.set(user.id, user);
    const { passwordHash: _ph, ...publicUser } = user;
    return publicUser;
  }

  async getInviteByCode(code: string): Promise<InviteCode | null> {
    return this.invites.get(code) ?? null;
  }

  async listInviteCodes(): Promise<InviteCode[]> {
    return [...this.invites.values()];
  }

  async createInviteCode(teamId: string, code: string): Promise<InviteCode> {
    const invite: InviteCode = {
      code,
      teamId,
      usedBy: null,
      usedAt: null,
      createdAt: new Date(),
    };
    this.invites.set(code, invite);
    return invite;
  }

  async consumeInviteCode(code: string, userId: string): Promise<boolean> {
    const invite = this.invites.get(code);
    if (!invite || invite.usedBy) return false;
    invite.usedBy = userId;
    invite.usedAt = new Date();
    return true;
  }

  async deleteUnusedCodesForTeam(teamId: string): Promise<void> {
    for (const [code, invite] of this.invites) {
      if (invite.teamId === teamId && !invite.usedBy) this.invites.delete(code);
    }
  }

  private claimAttemptsMap = new Map<
    string,
    { attempts: number; lockedUntil: Date | null }
  >();

  async getClaimAttempts(
    ipHash: string,
  ): Promise<{ attempts: number; lockedUntil: Date | null } | null> {
    return this.claimAttemptsMap.get(ipHash) ?? null;
  }

  async recordFailedClaimAttempt(
    ipHash: string,
  ): Promise<{ attempts: number; locked: boolean }> {
    const prev = this.claimAttemptsMap.get(ipHash);
    const attempts = (prev?.attempts ?? 0) + 1;
    const locked = attempts >= MAX_CLAIM_ATTEMPTS;
    this.claimAttemptsMap.set(ipHash, {
      attempts,
      lockedUntil: locked
        ? new Date(Date.now() + CLAIM_LOCKOUT_MS)
        : null,
    });
    return { attempts, locked };
  }

  async clearClaimAttempts(ipHash: string): Promise<void> {
    this.claimAttemptsMap.delete(ipHash);
  }

  async createSession(record: SessionRecord): Promise<void> {
    this.sessionsMap.set(record.tokenHash, record);
  }

  async getSessionUser(
    tokenHash: string,
  ): Promise<{ user: SiteUser; expiresAt: Date } | null> {
    const record = this.sessionsMap.get(tokenHash);
    if (!record) return null;
    if (record.expiresAt.getTime() < Date.now()) {
      this.sessionsMap.delete(tokenHash);
      return null;
    }
    const user = await this.getUserById(record.userId);
    if (!user) return null;
    return { user, expiresAt: record.expiresAt };
  }

  async deleteSession(tokenHash: string): Promise<void> {
    this.sessionsMap.delete(tokenHash);
  }

  async createScore(input: NewScore): Promise<GameScore> {
    const score: GameScore = {
      id: this.nextId("score"),
      createdAt: new Date(),
      ...input,
    };
    this.scores.push(score);
    return score;
  }

  async getLeaderboard(
    gameId: string,
    week: string,
  ): Promise<LeaderboardEntry[]> {
    const relevant = this.scores
      .filter((s) => s.gameId === gameId && s.week === week)
      .sort((a, b) => b.score - a.score || a.createdAt.getTime() - b.createdAt.getTime());
    const best = new Map<string, GameScore>();
    for (const s of relevant) {
      if (!best.has(s.userId)) best.set(s.userId, s);
    }
    const entries: LeaderboardEntry[] = [];
    let rank = 0;
    for (const s of best.values()) {
      rank += 1;
      const user = await this.getUserById(s.userId);
      entries.push({
        rank,
        score: s.score,
        displayName: user?.displayName ?? "Unknown",
        teamId: user?.teamId ?? "",
        isCurrentUser: false,
      });
    }
    return entries;
  }

  async createReward(input: NewReward): Promise<Reward> {
    const reward: Reward = {
      id: this.nextId("reward"),
      settled: false,
      createdAt: new Date(),
      ...input,
    };
    this.rewardsList.push(reward);
    return reward;
  }

  async getRewards(userId: string): Promise<Reward[]> {
    return this.rewardsList
      .filter((r) => r.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async setRewardSettled(id: string, settled: boolean): Promise<void> {
    const reward = this.rewardsList.find((r) => r.id === id);
    if (reward) reward.settled = settled;
  }
}

let storeInstance: GameStore | null = null;

/**
 * Composition root for the arcade's persistence. Server components and
 * actions call this — never `new DrizzleGameStore()` directly — so the
 * store stays a parameter the app can swap (e.g. FakeGameStore in tests).
 */
export function getGameStore(): GameStore {
  if (!storeInstance) storeInstance = new DrizzleGameStore();
  return storeInstance;
}

/**
 * Everything the arcade hub needs for enriched game cards: the registry
 * plus each game's weekly leader and the viewer's own best score.
 *
 * Dependency inversion: the store arrives as a parameter, never via
 * getGameStore() inside — tests pass a FakeGameStore. A failing game
 * degrades to "no scores yet", never to a failed page.
 */
export async function getArcadeHubData(
  store: GameStore,
  week: string,
  user: SiteUser | null,
): Promise<GameHubSummary[]> {
  return Promise.all(
    GAMES.map(async (game) => {
      let entries: LeaderboardEntry[] = [];
      try {
        entries = await store.getLeaderboard(game.id, week);
      } catch {
        entries = [];
      }
      const mine = user
        ? entries.find((e) => e.teamId === user.teamId)
        : undefined;
      const leader = entries[0] ?? null;
      return {
        game,
        leader: leader
          ? { ...leader, isCurrentUser: user?.teamId === leader.teamId }
          : null,
        myBest: mine?.score ?? null,
      };
    }),
  );
}
