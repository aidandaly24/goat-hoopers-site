import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { memoryAdapter } from "better-auth/adapters/memory";
import { getAuthTables } from "better-auth/db";
import { getTableConfig } from "drizzle-orm/pg-core";
import { createFriendsAuth, providerModels, type AccountMail } from "../friends-auth/provider";
import { providerSchema } from "../friends-auth/schema";
import { parseEnrollment } from "@/domain/friends-accounts";
import { resolveAccountUser } from "../account-identity";

const origin = "https://goat.test";
const initialPassword = "synthetic-password-only-1";
const changedPassword = "synthetic-password-only-2";
const resetPassword = "synthetic-password-only-3";

describe("friends accounts with the actual pinned provider", () => {
  it("matches every core field required by the installed provider schema", () => {
    const expected = getAuthTables({ ...providerModels, session: { modelName: "authSession" } });
    for (const table of Object.values(expected)) {
      const actual = getTableConfig(providerSchema[table.modelName as keyof typeof providerSchema]);
      expect(actual.columns.map((column) => Object.entries(providerSchema[table.modelName as keyof typeof providerSchema])
        .find(([, value]) => value === column)?.[0]).sort()).toEqual(["id", ...Object.keys(table.fields)].sort());
    }
  });

  it("runs verification → remembered login → change → reset → revocation while preserving the app UUID", async () => {
    const storage = { authUser: [], authAccount: [], authSession: [], authVerification: [], authRateLimit: [] };
    const mail: AccountMail[] = [];
    const config = { origin, secret: randomBytes(48).toString("hex"), secureCookies: true };
    const options = { database: memoryAdapter(storage), config, sendMail: async (message: AccountMail) => { mail.push(message); } };
    const publicAuth = createFriendsAuth(options);
    const enrollmentAuth = createFriendsAuth({ ...options, allowSignup: true });
    const call = (path: string, body?: unknown, cookie?: string) => publicAuth.handler(new Request(`${origin}/api/auth/${path}`, {
      method: body ? "POST" : "GET", headers: { Origin: origin, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }));
    expect((await call("sign-up/email", { name: "Synthetic manager", email: "manager@example.test", password: initialPassword })).ok).toBe(false);
    expect(storage.authUser).toHaveLength(0);

    const created = await enrollmentAuth.api.signUpEmail({ body: { name: "Synthetic manager", email: "manager@example.test",
      password: initialPassword, callbackURL: `${origin}/login` } });
    expect(created.token).toBeNull();
    expect(mail).toHaveLength(1);
    expect((await call("sign-in/email", { email: "manager@example.test", password: initialPassword })).ok).toBe(false);
    const verification = await publicAuth.handler(new Request(mail[0].url));
    expect(verification.status).toBe(302);

    const signIn = await call("sign-in/email", { email: "manager@example.test", password: initialPassword, rememberMe: true });
    expect(signIn.ok).toBe(true);
    const setCookie = signIn.headers.get("set-cookie")!;
    expect(setCookie).toContain("HttpOnly"); expect(setCookie).toContain("Secure");
    expect(setCookie.toLowerCase()).toContain("samesite=lax"); expect(setCookie).toContain("Max-Age=7776000");
    const cookie = signIn.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    const verified = await publicAuth.api.getSession({ headers: new Headers({ Cookie: cookie }) });
    expect(verified?.user.id).toBe(created.user.id);
    const user = { id: "00000000-0000-4000-8000-000000000118", teamId: "fixture-team", displayName: "Synthetic manager", createdAt: new Date() };
    const resolved = await resolveAccountUser({ verifySession: async () => verified ? { subject: verified.user.id, expiresAt: verified.session.expiresAt } : null,
      findIdentity: async (subject) => ({ subject, userId: user.id, provider: "better-auth", active: true }), getUserById: async () => user });
    expect(resolved?.id).toBe(user.id);
    expect(await resolveAccountUser({ verifySession: async () => verified ? { subject: verified.user.id, expiresAt: verified.session.expiresAt } : null,
      findIdentity: async () => null, getUserById: async () => user })).toBeNull();

    const second = await call("sign-in/email", { email: "manager@example.test", password: initialPassword });
    const secondCookie = second.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    expect((await call("change-password", { currentPassword: initialPassword, newPassword: changedPassword, revokeOtherSessions: true }, cookie)).ok).toBe(true);
    expect(await publicAuth.api.getSession({ headers: new Headers({ Cookie: secondCookie }) })).toBeNull();
    expect((await call("sign-in/email", { email: "manager@example.test", password: initialPassword })).ok).toBe(false);
    const changed = await call("sign-in/email", { email: "manager@example.test", password: changedPassword });
    expect(changed.ok).toBe(true);
    const changedCookie = changed.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
    const known = await call("request-password-reset", { email: "manager@example.test", redirectTo: `${origin}/reset-password` });
    const unknown = await call("request-password-reset", { email: "missing@example.test", redirectTo: `${origin}/reset-password` });
    expect(known.status).toBe(unknown.status); expect(await known.json()).toEqual(await unknown.json());
    const resetMail = mail.findLast((message) => message.kind === "reset")!;
    const resetToken = new URL(resetMail.url).pathname.split("/").at(-1)!;
    expect((await call("reset-password", { token: resetToken, newPassword: resetPassword })).ok).toBe(true);
    expect(await publicAuth.api.getSession({ headers: new Headers({ Cookie: changedCookie }) })).toBeNull();
    expect((await call("reset-password", { token: resetToken, newPassword: initialPassword })).ok).toBe(false);
    expect((await call("sign-in/email", { email: "manager@example.test", password: resetPassword })).ok).toBe(true);
    expect(storage.authUser).toHaveLength(1);
    expect(created.user.id).toBe(verified?.user.id);
  }, 15000);

  it("accepts only bounded enrollment fields and rejects client-owned identity claims", () => {
    const input = { kind: "invite", email: "manager@example.test", password: initialPassword, displayName: "Manager", inviteCode: "123456" };
    expect(parseEnrollment(input)?.kind).toBe("invite");
    expect(parseEnrollment({ ...input, userId: "forged-owner" })).toBeNull();
    expect(parseEnrollment({ ...input, inviteCode: "1234567" })).toBeNull();
    expect(parseEnrollment({ ...input, password: "x".repeat(129) })).toBeNull();
    expect(parseEnrollment({ ...input, kind: "existing", teamId: "forged-team" })).toBeNull();
  });
});
