import type { AccountIdentity, VerifiedAccountSession } from "@/domain/arcade/account-identity";
import type { SiteUser } from "@/domain/arcade/types";

/** Future provider composition root supplies verified sessions and unique persisted links. */
export type AccountIdentityReader = {
  verifySession(): Promise<VerifiedAccountSession | null>;
  findIdentity(subject: string): Promise<AccountIdentity | null>;
  getUserById(userId: string): Promise<SiteUser | null>;
};

/**
 * Dormant read seam: preserve getCurrentUser's SiteUser|null contract at cutover.
 * There is no email/name/team fallback and no legacy-cookie fallback after reset.
 * Database/provider failures propagate so protected callers can fail closed.
 * This function does not authenticate a caller-supplied session or mint sessions.
 */
export async function resolveAccountUser(
  reader: AccountIdentityReader,
  now: Date = new Date(),
): Promise<SiteUser | null> {
  const session = await reader.verifySession();
  if (!session || !session.subject || !Number.isFinite(now.getTime()) ||
      !Number.isFinite(session.expiresAt.getTime()) || session.expiresAt <= now) return null;
  const identity = await reader.findIdentity(session.subject);
  if (!identity || !identity.active || identity.provider !== "better-auth" ||
      identity.subject !== session.subject || !identity.userId) return null;
  const user = await reader.getUserById(identity.userId);
  return user?.id === identity.userId ? user : null;
}
