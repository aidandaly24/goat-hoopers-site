import { and, eq, sql } from "drizzle-orm";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { after } from "next/server";
import { randomUUID } from "node:crypto";
import type { EnrollmentInput } from "@/domain/friends-accounts";
import type { SiteUser } from "@/domain/arcade";
import { inviteCodes, siteUsers } from "@/data/db";
import { resolveAccountUser } from "@/data/account-identity";
import { readFriendsAuthConfig, type FriendsAuthConfig } from "./config";
import { getFriendsDb, type FriendsDb } from "./db";
import { accountIdentities, providerSchema } from "./schema";
import { createFriendsAuth, type AccountMail } from "./provider";
import { sendAccountMail } from "./mail";

export function getFriendsAuth() {
  return createFriendsAuth({ database: drizzleAdapter(getFriendsDb(), { provider: "pg", schema: providerSchema, transaction: true }),
    config: readFriendsAuthConfig(), sendMail: sendAccountMail, serverActions: true,
    background: (task) => after(async () => { try { await task; } catch { console.error("Account email delivery failed"); } }),
  });
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
      email: input.email, password: input.password, name: owner.displayName, callbackURL: `${config.origin}/login?notice=verified`,
    } });
    // Duplicate-email synthetic responses fail the provider FK, rolling the entire enrollment back.
    await tx.insert(accountIdentities).values({ subject: result.user.id, userId: owner.id });
  });
  // Deliver only committed links. Never expose the email token in the HTTP result.
  if (dependencies) { dependencies.queueMail(mail); return; }
  after(async () => {
    for (const message of mail) {
      try { await sendAccountMail(message); } catch { console.error("Account verification delivery failed"); }
    }
  });
}
