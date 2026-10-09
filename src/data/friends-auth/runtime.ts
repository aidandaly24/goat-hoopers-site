import { and, eq, sql } from "drizzle-orm";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import { parseAccountUsername, type EnrollmentInput, type RegistrationInput } from "@/domain/friends-accounts";
import type { SiteUser } from "@/domain/arcade";
import { inviteCodes, siteUsers } from "@/data/db";
import { resolveAccountUser } from "@/data/account-identity";
import { readFriendsAuthConfig, type FriendsAuthConfig } from "./config";
import { getFriendsDb, type FriendsDb } from "./db";
import { accountIdentities, authUser, providerSchema } from "./schema";
import { createFriendsAuth, type AccountMail } from "./provider";
import { sendAccountMail } from "./mail";

export function getFriendsAuth() {
  return createFriendsAuth({ database: drizzleAdapter(getFriendsDb(), { provider: "pg", schema: providerSchema, transaction: true }),
    config: readFriendsAuthConfig(), sendMail: (mail) => sendAccountMail(mail, consumeAuthAttempt), serverActions: true,
    background: (task) => after(async () => { try { await task; } catch { console.error("Account email delivery failed"); } }),
  });
}

type AccountDependencies = { db: FriendsDb; config: FriendsAuthConfig; queueMail: (mail: AccountMail[]) => void };

function queueCommittedMail(mail: AccountMail[], dependencies?: AccountDependencies) {
  if (dependencies) { dependencies.queueMail(mail); return; }
  after(async () => {
    for (const message of mail) {
      try { await sendAccountMail(message, consumeAuthAttempt); } catch { console.error("Account email delivery failed"); }
    }
  });
}

/** Verified email account, including an account without team membership. Never grants a SiteUser identity. */
export async function getVerifiedAccount(headers: Headers): Promise<{ subject: string; sessionId: string; name: string } | null> {
  const session = await getFriendsAuth().api.getSession({ headers, query: { disableCookieCache: true } });
  if (!session?.user.emailVerified || session.session.expiresAt <= new Date()) return null;
  return { subject: session.user.id, sessionId: session.session.id, name: session.user.name };
}

/** Email account registration is independent of team ownership and does not insert site_users or links. */
export async function registerAccount(input: RegistrationInput, requestHeaders: Headers, dependencies?: AccountDependencies) {
  const username = parseAccountUsername(input.username);
  if (!username) throw new Error("Choose a valid username");
  const config = dependencies?.config ?? readFriendsAuthConfig();
  if (!dependencies && (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)) throw new Error("Account email delivery is not configured");
  const mail: AccountMail[] = [];
  await (dependencies?.db ?? getFriendsDb()).transaction(async (tx) => {
    const auth = createFriendsAuth({ database: drizzleAdapter(tx, { provider: "pg", schema: providerSchema, transaction: false }),
      config, allowSignup: true, sendMail: async (message) => { mail.push(message); } });
    await auth.api.signUpEmail({ headers: requestHeaders, body: { email: input.email, password: input.password,
      name: username, callbackURL: `${config.origin}/account/login?notice=verified` } });
  });
  queueCommittedMail(mail, dependencies);
}

/** Claim/link authorization is rechecked and locked inside the ownership transaction. */
export async function claimAccountTeam(input: { inviteCode: string } | { legacyTokenHash: string }, requestHeaders: Headers,
  dependencies?: AccountDependencies) {
  const db = dependencies?.db ?? getFriendsDb();
  const auth = dependencies ? createFriendsAuth({ database: drizzleAdapter(db, { provider: "pg", schema: providerSchema, transaction: true }),
    config: dependencies.config, sendMail: async () => {} }) : getFriendsAuth();
  const verified = await auth.api.getSession({ headers: requestHeaders, query: { disableCookieCache: true } });
  if (!verified?.user.emailVerified) throw new Error("Verify your account email and sign in first");
  await db.transaction(async (tx) => {
    const principal = await tx.execute(sql`
      SELECT u.name FROM auth_session s JOIN auth_user u ON u.id = s.user_id
      WHERE s.id = ${verified.session.id} AND s.user_id = ${verified.user.id}
        AND s.expires_at > NOW() AND u.email_verified
      FOR UPDATE OF s, u
    `);
    if (principal.rows.length !== 1) throw new Error("Sign in to your email account again");
    const [linked] = await tx.select().from(accountIdentities).where(eq(accountIdentities.subject, verified.user.id));
    // An inactive mapping is not permission to replace an existing owner.
    if (linked) throw new Error("This account already has a team");
    let userId: string;
    if ("legacyTokenHash" in input) {
      const owner = await tx.execute(sql`
        SELECT u.id FROM site_users u JOIN sessions s ON s.user_id = u.id
        WHERE s.token_hash = ${input.legacyTokenHash} AND s.expires_at > NOW()
          AND s.created_at > NOW() - INTERVAL '5 minutes' FOR UPDATE OF u, s
      `);
      if (owner.rows.length !== 1) throw new Error("Confirm your existing team password again");
      userId = String(owner.rows[0].id);
      await tx.insert(accountIdentities).values({ subject: verified.user.id, userId });
    } else {
      const [invite] = await tx.select().from(inviteCodes).where(and(eq(inviteCodes.code, input.inviteCode),
        sql`${inviteCodes.usedBy} IS NULL`)).for("update");
      if (!invite) throw new Error("This team code is unavailable");
      userId = randomUUID();
      // The existing UNIQUE site_users.team_id is the final authority, including races on different codes.
      await tx.insert(siteUsers).values({ id: userId, teamId: invite.teamId,
        displayName: String(principal.rows[0].name), passwordHash: "!provider-only-account!" });
      await tx.insert(accountIdentities).values({ subject: verified.user.id, userId });
      await tx.update(inviteCodes).set({ usedBy: userId, usedAt: new Date() }).where(eq(inviteCodes.code, input.inviteCode));
    }
  });
}

/** Never accepts a recipient from the browser or exposes whether a team has a linked email. */
export async function requestTeamPasswordReset(teamId: string, requestHeaders: Headers, dependencies?: AccountDependencies) {
  const db = dependencies?.db ?? getFriendsDb();
  const [account] = await db.select({ email: authUser.email }).from(siteUsers)
    .innerJoin(accountIdentities, eq(accountIdentities.userId, siteUsers.id))
    .innerJoin(authUser, eq(authUser.id, accountIdentities.subject))
    .where(and(eq(siteUsers.teamId, teamId), eq(accountIdentities.active, true), eq(authUser.emailVerified, true)));
  if (!account) return;
  const config = dependencies?.config ?? readFriendsAuthConfig();
  const auth = dependencies ? createFriendsAuth({ database: drizzleAdapter(db, { provider: "pg", schema: providerSchema, transaction: true }),
    config, sendMail: async (message) => { dependencies.queueMail([message]); } }) : getFriendsAuth();
  await auth.api.requestPasswordReset({ headers: requestHeaders,
    body: { email: account.email, redirectTo: `${config.origin}/reset-password` } });
}

/** Exact provider session and active subject link; no legacy/email/team fallback. */
export async function getProviderUser(headers: Headers): Promise<SiteUser | null> {
  return (await getProviderIdentity(headers))?.user ?? null;
}

/** AI owner uses these validated IDs, then rechecks session/link/expiry atomically in paid admission. */
export async function getProviderIdentity(headers: Headers): Promise<{
  user: SiteUser; sessionId: string; subject: string; expiresAt: Date;
} | null> {
  const db = getFriendsDb();
  const verified = await getFriendsAuth().api.getSession({ headers, query: { disableCookieCache: true } });
  if (!verified?.user.emailVerified) return null;
  const user = await resolveAccountUser({
    verifySession: async () => {
      return { subject: verified.user.id, expiresAt: verified.session.expiresAt };
    },
    findIdentity: async (subject) => {
      const [link] = await db.select().from(accountIdentities).where(eq(accountIdentities.subject, subject));
      return link ? { ...link, provider: "better-auth" as const } : null;
    },
    getUserById: async (id) => {
      const [user] = await db.select({ id: siteUsers.id, teamId: siteUsers.teamId, displayName: siteUsers.displayName,
        createdAt: siteUsers.createdAt }).from(siteUsers).where(eq(siteUsers.id, id));
      return user ?? null;
    },
  });
  return user ? { user, sessionId: verified.session.id, subject: verified.user.id, expiresAt: verified.session.expiresAt } : null;
}

/** Fixed keys keep abuse storage bounded. The UPDATE predicate is the concurrency guarantee. */
export async function consumeAuthAttempt(key: string, max = 120, db: FriendsDb = getFriendsDb()): Promise<boolean> {
  const result = await db.execute(sql`
    INSERT INTO auth_attempt_windows (key, count, expires_at)
    VALUES (${key}, 1, NOW() + INTERVAL '15 minutes')
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN auth_attempt_windows.expires_at <= NOW() THEN 1 ELSE auth_attempt_windows.count + 1 END,
      expires_at = CASE WHEN auth_attempt_windows.expires_at <= NOW() THEN NOW() + INTERVAL '15 minutes' ELSE auth_attempt_windows.expires_at END
    WHERE auth_attempt_windows.expires_at <= NOW() OR auth_attempt_windows.count < ${max}
    RETURNING key
  `);
  return result.rows.length === 1;
}

/** Provider credentials + membership/link + invitation consumption commit together. */
export async function enrollFriend(input: EnrollmentInput, legacyTokenHash: string | null, requestHeaders: Headers,
  dependencies?: { db: FriendsDb; config: FriendsAuthConfig; queueMail: (mail: AccountMail[]) => void }) {
  const config = dependencies?.config ?? readFriendsAuthConfig();
  // Fail before consuming an invitation if delivery was not privately configured.
  if (!dependencies && (!process.env.RESEND_API_KEY || !process.env.AUTH_EMAIL_FROM)) throw new Error("Account email delivery is not configured");
  const mail: AccountMail[] = [];
  await (dependencies?.db ?? getFriendsDb()).transaction(async (tx) => {
    let owner: { id: string; displayName: string };
    if (input.kind === "existing") {
      if (!legacyTokenHash) throw new Error("Sign in to your existing account first");
      const result = await tx.execute(sql`
        SELECT u.id, u.display_name AS "displayName" FROM site_users u JOIN sessions s ON s.user_id = u.id
        WHERE s.token_hash = ${legacyTokenHash} AND s.expires_at > NOW() AND s.created_at > NOW() - INTERVAL '5 minutes'
        FOR UPDATE OF u, s
      `);
      const row = result.rows[0] as { id: string; displayName: string } | undefined;
      if (!row) throw new Error("Sign in again before setting up your email account");
      owner = row;
    } else {
      const [invite] = await tx.select().from(inviteCodes).where(and(eq(inviteCodes.code, input.inviteCode),
        sql`${inviteCodes.usedBy} IS NULL`)).for("update");
      if (!invite) throw new Error("Invitation is unavailable");
      const [user] = await tx.insert(siteUsers).values({ id: randomUUID(), teamId: invite.teamId,
        displayName: input.displayName, passwordHash: "!provider-only-account!" }).returning({ id: siteUsers.id, displayName: siteUsers.displayName });
      owner = user;
      await tx.update(inviteCodes).set({ usedBy: owner.id, usedAt: new Date() }).where(eq(inviteCodes.code, input.inviteCode));
    }
    // Adapter uses the outer transaction. Its internal transactions become supported pg savepoints.
    const auth = createFriendsAuth({ database: drizzleAdapter(tx, { provider: "pg", schema: providerSchema, transaction: false }),
      config, allowSignup: true, sendMail: async (message) => { mail.push(message); } });
    const result = await auth.api.signUpEmail({ headers: requestHeaders, body: {
      email: input.email, password: input.password, name: input.kind === "existing" ? input.displayName : owner.displayName, callbackURL: `${config.origin}/account/login?notice=verified`,
    } });
    // Duplicate-email synthetic responses fail the provider FK, rolling the entire enrollment back.
    await tx.insert(accountIdentities).values({ subject: result.user.id, userId: owner.id });
  });
  // Deliver only committed links. Never expose the email token in the HTTP result.
  queueCommittedMail(mail, dependencies);
}
