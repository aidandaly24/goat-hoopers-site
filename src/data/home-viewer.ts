import type { HomeViewer } from "@/domain/personalized-home";

type Dependencies = {
  /** Existing server session resolver verifies the active identity/team link. */
  member: () => Promise<{ teamId: string } | null>;
  /** Existing verified email account resolver, including accounts without a team. */
  account: () => Promise<{ subject: string } | null>;
  hasMembership: (subject: string) => Promise<boolean>;
};

/** Request-local read. No module state, shared cache, user ID, email or token DTO. */
export async function loadHomeViewer({ member, account, hasMembership }: Dependencies): Promise<HomeViewer> {
  try {
    const user = await member();
    if (user) return { kind: "member", teamId: user.teamId };
    const verified = await account();
    if (!verified) return { kind: "signed_out" };
    // An inactive/orphaned link is never permission to offer another ownership claim.
    return await hasMembership(verified.subject) ? { kind: "signed_out" } : { kind: "unclaimed" };
  } catch {
    return { kind: "unavailable" };
  }
}

/** One indexed existence read only for a verified account without resolved membership. */
export async function hasHomeMembership(subject: string): Promise<boolean> {
  const [{ getFriendsDb }, { accountIdentities }, { eq }] = await Promise.all([
    import("./friends-auth/db"), import("./friends-auth/schema"), import("drizzle-orm"),
  ]);
  const rows = await getFriendsDb().select({ subject: accountIdentities.subject }).from(accountIdentities)
    .where(eq(accountIdentities.subject, subject)).limit(1);
  return rows.length > 0;
}
