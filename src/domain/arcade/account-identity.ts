import type { SiteUser } from "./types";

/** Provider credentials can change; the existing site account UUID never does. */
export type AccountIdentity = {
  provider: "better-auth";
  subject: string;
  userId: SiteUser["id"];
  active: boolean;
};

/** Returned only by a server-side provider session verification, never request JSON. */
export type VerifiedAccountSession = {
  subject: string;
  expiresAt: Date;
};

/** Minimal private inventory for reviewing a credential reset; contains no credentials. */
export type AccountDependency = {
  source: "sessions" | "game_scores" | "rewards" | "invite_codes" | "ai_budget";
  userId: string;
};

/** Read-only reconciliation. An orphan or ambiguous mapping blocks a reset. */
export function auditAccountIdentity(
  users: readonly Pick<SiteUser, "id" | "teamId">[],
  dependencies: readonly AccountDependency[],
  identities: readonly AccountIdentity[],
): { ok: boolean; preserveUserIds: string[]; problems: string[] } {
  const problems: string[] = [];
  const userIds = new Set<string>();
  const teams = new Set<string>();
  for (const user of users) {
    if (!user.id || userIds.has(user.id)) problems.push("duplicate_or_empty_user_id");
    if (!user.teamId || teams.has(user.teamId)) problems.push("duplicate_or_empty_team_id");
    userIds.add(user.id);
    teams.add(user.teamId);
  }
  for (const ref of dependencies) {
    if (!userIds.has(ref.userId)) problems.push(`orphan:${ref.source}`);
  }
  const subjects = new Set<string>();
  const linkedUsers = new Set<string>();
  for (const identity of identities) {
    if (identity.provider !== "better-auth" || !identity.subject || subjects.has(identity.subject)) {
      problems.push("invalid_or_duplicate_subject");
    }
    if (!userIds.has(identity.userId)) problems.push("orphan:account_identity");
    if (linkedUsers.has(identity.userId)) problems.push("duplicate_identity_for_user");
    subjects.add(identity.subject);
    linkedUsers.add(identity.userId);
  }
  return { ok: problems.length === 0, preserveUserIds: [...userIds].sort(), problems };
}
