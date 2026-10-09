/**
 * Server actions — the app layer's glue between forms and the GameStore.
 *
 * These are the only place that touches cookies, and the only place that
 * calls `getGameStore()` outside of page loaders. Surfaces never import
 * this file; forms receive the action they need... in practice the forms
 * here are co-located with their routes and import these directly, which
 * is fine — the dependency-inversion boundary that matters is
 * pages/surfaces ↔ GameStore, and that holds: actions go through the
 * store contract, never the drizzle client.
 *
 * Security notes:
 * - Passwords are bcrypt-hashed (12 rounds). Raw passwords are never
 *   logged, never stored, never returned.
 * - The `gh_session` cookie holds the raw token; the DB holds only its
 *   SHA-256 hash. Cookie: httpOnly, sameSite=lax, secure in production,
 *   90-day max-age ("remember me" is the default).
 * - Invite codes are single-use and device-free: claiming from a phone
 *   then playing on a laptop just works.
 * - Admin actions are gated by COMMISSIONER_KEY, checked server-side.
 *   The key never leaves the server.
 */
"use server";

import { createHash, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  MAX_CLAIM_ATTEMPTS,
  getGameStore,
  type GameStore,
} from "@/data/arcade";
import type { SiteUser } from "@/domain/arcade";
import { friendsAuthEnabled, friendsEnrollmentEnabled } from "@/data/friends-auth/config";

const SESSION_COOKIE = "gh_session";
/** 90 days, in seconds. "Remember me" is the default. */
const SESSION_MAX_AGE = 90 * 24 * 60 * 60;

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Friendly error when Postgres isn't provisioned yet. */
function storeUnavailable(): { ok: false; error: string } {
  return {
    ok: false,
    error:
      "The arcade database isn't provisioned yet. Aidan needs to create " +
      "the Vercel Postgres database first (see ARCHITECTURE.md).",
  };
}

function getStore(): GameStore | null {
  try {
    return getGameStore();
  } catch {
    return null;
  }
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function newToken(): string {
  return randomBytes(32).toString("hex");
}

async function startSession(userId: string): Promise<void> {
  const store = getStore();
  if (!store) return;
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
  await store.createSession({ tokenHash: hashToken(token), userId, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * The currently logged-in user, or null. Server components call this —
 * never the client.
 */
export async function getCurrentUser(): Promise<SiteUser | null> {
  if (friendsAuthEnabled()) {
    const { getProviderUser } = await import("@/data/friends-auth/runtime");
    return getProviderUser(await headers());
  }
  return getLegacyCurrentUser();
}

/** Used only to prove existing ownership during additive enrollment, never provider authorization. */
export async function getLegacyCurrentUser(): Promise<SiteUser | null> {
  const store = getStore();
  if (!store) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const record = await store.getSessionUser(hashToken(token));
  return record?.user ?? null;
}

/** Normalize a code the way it was generated: digits only, trimmed. */
function normalizeCode(code: string): string {
  return code.replace(/\D/g, "").slice(0, 6);
}

/** A 6-digit numeric invite code, e.g. "482910". */
function randomCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

async function uniqueCode(store: GameStore): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = randomCode();
    if (!(await store.getInviteByCode(code))) return code;
  }
  throw new Error("Could not generate a unique invite code");
}

/** SHA-256 of the client IP. Raw IPs are never stored (see claimAttempts). */
async function getClientIpHash(): Promise<string> {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Claim a team with an invite code and set a password. Consumes the code,
 * creates the account, and logs the user in.
 *
 * Brute-force guard: 5 wrong codes from one client locks it out for
 * 15 minutes. Successful claims clear the counter.
 */
export async function claimAccount(
  code: string,
  password: string,
  displayName: string,
): Promise<ActionResult> {
  if (friendsAuthEnabled()) return { ok: false, error: "Use the email account signup form." };
  const store = getStore();
  if (!store) return storeUnavailable();

  const ipHash = await getClientIpHash();
  const attemptState = await store.getClaimAttempts(ipHash);
  if (attemptState?.lockedUntil && attemptState.lockedUntil > new Date()) {
    const mins = Math.ceil(
      (attemptState.lockedUntil.getTime() - Date.now()) / 60000,
    );
    return {
      ok: false,
      error: `Too many wrong tries — try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
    };
  }

  const fail = async (error: string): Promise<ActionResult> => {
    const { attempts, locked } = await store.recordFailedClaimAttempt(ipHash);
    if (locked) {
      return {
        ok: false,
        error: "Too many wrong tries — try again in 15 minutes.",
      };
    }
    const left = MAX_CLAIM_ATTEMPTS - attempts;
    return {
      ok: false,
      error: `${error} (${left} ${left === 1 ? "try" : "tries"} left.)`,
    };
  };

  const normalized = normalizeCode(code);
  if (normalized.length !== 6) {
    return fail("That code doesn't look right — it should be 6 digits.");
  }
  const invite = await store.getInviteByCode(normalized);
  if (!invite) return fail("That code doesn't exist.");
  if (invite.usedBy) return fail("That code was already used.");
  if (password.length < 8) {
    return { ok: false, error: "Password needs to be at least 8 characters." };
  }
  const name = displayName.trim();
  if (!name) return { ok: false, error: "Pick a display name." };

  const existing = await store.getUserByTeam(invite.teamId);
  if (existing) {
    return fail("This team is already claimed.");
  }

  const passwordHash = await hash(password, 12);
  // The store performs the claim atomically: account creation and
  // invite consumption happen as one database operation. The prechecks
  // above are UX only — claimTeam is the concurrency guarantee.
  const result = await store.claimTeam({
    code: normalized,
    displayName: name,
    passwordHash,
  });
  if (!result.ok) {
    if (result.reason === "invalid_code") {
      return fail("That code doesn't exist.");
    }
    if (result.reason === "already_used") {
      return fail("That code was already used.");
    }
    return fail("This team is already claimed.");
  }
  const user = result.user;
  await store.clearClaimAttempts(ipHash);
  await startSession(user.id);
  redirect("/arcade");
}

/** Log in with team + password. */
export async function login(
  teamId: string,
  password: string,
): Promise<ActionResult> {
  if (friendsAuthEnabled()) return { ok: false, error: "Use your email to log in, or set up your existing account." };
  const store = getStore();
  if (!store) return storeUnavailable();

  const passwordHash = await store.getPasswordHash(teamId);
  if (!passwordHash) {
    return { ok: false, error: "No account for that team yet — claim it first." };
  }
  const user = await store.getUserByTeam(teamId);
  if (!user) {
    return { ok: false, error: "No account for that team yet — claim it first." };
  }
  const valid = await compare(password, passwordHash);
  if (!valid) return { ok: false, error: "Wrong password." };
  await startSession(user.id);
  redirect("/arcade");
}

/** A fresh legacy sign-in proves the existing app UUID; it never signs into the provider runtime. */
export async function loginForEnrollment(teamId: string, password: string): Promise<ActionResult> {
  if (!friendsEnrollmentEnabled()) return { ok: false, error: "Email account setup is not active yet." };
  const { consumeAuthAttempt } = await import("@/data/friends-auth/runtime");
  if (!await consumeAuthAttempt("legacy-enrollment-login", 30)) return { ok: false, error: "Too many attempts; try again in 15 minutes." };
  if (!teamId || teamId.length > 40 || password.length > 128) return { ok: false, error: "Check your team and password." };
  const store = getStore();
  if (!store) return storeUnavailable();
  const passwordHash = await store.getPasswordHash(teamId);
  const user = await store.getUserByTeam(teamId);
  if (!passwordHash || !user || !await compare(password, passwordHash)) return { ok: false, error: "Check your team and password." };
  await startSession(user.id);
  redirect("/account/setup");
}

/** Log out: kill the server session and clear the cookie. */
export async function logout(): Promise<void> {
  if (friendsEnrollmentEnabled()) {
    const { getFriendsAuth } = await import("@/data/friends-auth/runtime");
    await getFriendsAuth().api.signOut({ headers: await headers() });
  }
  const store = getStore();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (store && token) {
    await store.deleteSession(hashToken(token));
  }
  cookieStore.delete(SESSION_COOKIE);
  redirect("/");
}

function commissionerKeyValid(provided: string): boolean {
  const expected = process.env.COMMISSIONER_KEY;
  if (!expected || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** List all invite codes with their status. Commissioner only. */
export async function getInviteOverview(
  commissionerKey: string,
): Promise<
  | { ok: true; codes: import("@/domain/arcade").InviteCode[] }
  | { ok: false; error: string }
> {
  if (!commissionerKeyValid(commissionerKey)) {
    return { ok: false, error: "Wrong commissioner key." };
  }
  const store = getStore();
  if (!store) return storeUnavailable();
  return { ok: true, codes: await store.listInviteCodes() };
}

/**
 * Generate invite codes for every team that doesn't already have an
 * unused one. Commissioner only.
 */
export async function ensureInviteCodes(
  commissionerKey: string,
  teams: { id: string }[],
): Promise<ActionResult> {
  if (!commissionerKeyValid(commissionerKey)) {
    return { ok: false, error: "Wrong commissioner key." };
  }
  const store = getStore();
  if (!store) return storeUnavailable();
  const existing = await store.listInviteCodes();
  const hasUnused = new Set(
    existing.filter((c) => !c.usedBy).map((c) => c.teamId),
  );
  for (const team of teams) {
    if (!hasUnused.has(team.id)) {
      await store.createInviteCode(team.id, await uniqueCode(store));
    }
  }
  return { ok: true };
}

/** Invalidate a team's unused codes and issue a fresh one. Commissioner only. */
export async function regenerateInviteCode(
  commissionerKey: string,
  teamId: string,
): Promise<ActionResult> {
  if (!commissionerKeyValid(commissionerKey)) {
    return { ok: false, error: "Wrong commissioner key." };
  }
  const store = getStore();
  if (!store) return storeUnavailable();
  await store.deleteUnusedCodesForTeam(teamId);
  await store.createInviteCode(teamId, await uniqueCode(store));
  return { ok: true };
}
