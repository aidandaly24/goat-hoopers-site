import { afterEach, expect, it, vi } from "vitest";
const spies = vi.hoisted(() => ({ handler: vi.fn(async () => Response.json({ ok: true })),
  consume: vi.fn(async () => true), enroll: vi.fn(async () => {}), register: vi.fn(async () => {}),
  claim: vi.fn(async (_input: unknown, _headers: Headers) => {}), resetTeam: vi.fn(async () => {}), enabled: true, enrollment: true }));
vi.mock("../friends-auth/runtime", () => ({ getFriendsAuth: () => ({ handler: spies.handler }),
  consumeAuthAttempt: spies.consume, enrollFriend: spies.enroll, registerAccount: spies.register,
  claimAccountTeam: spies.claim, requestTeamPasswordReset: spies.resetTeam }));
vi.mock("../friends-auth/config", () => ({ friendsAuthEnabled: () => spies.enabled, friendsEnrollmentEnabled: () => spies.enrollment,
  readFriendsAuthConfig: () => ({ origin: "https://goat.test" }) }));
import { handleFriendsAuth, handleEnrollment, handleAccountAction } from "../friends-auth/http";
afterEach(() => { vi.clearAllMocks(); spies.enabled = true; spies.enrollment = true; });

it("mounts provider email reset callbacks but rejects public signup and unsafe requests", async () => {
  const link = new Request("https://goat.test/api/auth/reset-password/synthetic-token?callbackURL=https://goat.test/reset-password");
  expect((await handleFriendsAuth(link)).ok).toBe(true);
  expect(spies.handler).toHaveBeenCalledOnce();
  expect((await handleFriendsAuth(new Request("https://goat.test/api/auth/sign-up/email", { method: "POST" }))).status).toBe(404);
  expect((await handleFriendsAuth(new Request("https://goat.test/api/auth/change-password", { method: "POST", headers: { Origin: "https://outside.test" } }))).status).toBe(403);
  expect(spies.handler).toHaveBeenCalledOnce();
  expect((await handleEnrollment(new Request("https://goat.test/api/accounts/enroll", { method: "POST", headers: { Origin: "https://goat.test", "Content-Type": "application/json" }, body: "x".repeat(16385) }))).status).toBe(413);
  expect(spies.enroll).not.toHaveBeenCalled();
});

const post = (body: unknown, origin = "https://goat.test", cookie?: string) => new Request("https://goat.test/api/accounts/test", {
  method: "POST", headers: { Origin: origin, "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) }, body: JSON.stringify(body),
});

it("registers without a code but rejects client-supplied membership and the old combined invite signup", async () => {
  const account = { username: "synthetic", email: "synthetic@example.test", password: "synthetic-only-password" };
  spies.enabled = false;
  expect((await handleAccountAction(post(account), "register")).ok).toBe(true);
  expect(spies.register).toHaveBeenCalledWith(account, expect.any(Headers));
  expect((await handleAccountAction(post({ ...account, teamId: "1" }), "register")).status).toBe(400);
  expect((await handleEnrollment(post({ ...account, kind: "invite", inviteCode: "123456" }))).status).toBe(400);
  expect(spies.enroll).not.toHaveBeenCalled();
  expect((await handleAccountAction(post({ inviteCode: "123456" }), "claim")).status).toBe(503);
  expect(spies.claim).not.toHaveBeenCalled();
});

it("allows bounded team recovery during enrollment, without accepting or returning an email", async () => {
  spies.enabled = false;
  const response = await handleAccountAction(post({ teamId: "1" }), "reset-team-password");
  expect(await response.json()).toEqual({ ok: true });
  expect(spies.resetTeam).toHaveBeenCalledWith("1", expect.any(Headers));
  expect((await handleAccountAction(post({ teamId: "1", email: "forged@example.test" }), "reset-team-password")).status).toBe(400);
  expect(spies.resetTeam).toHaveBeenCalledOnce();
  expect((await handleAccountAction(post({ teamId: "1" }, "https://outside.test"), "reset-team-password")).status).toBe(403);
  spies.consume.mockResolvedValueOnce(false);
  expect((await handleAccountAction(post({ teamId: "1" }), "reset-team-password")).status).toBe(429);
});

it("links only server-validated legacy ownership, not an app UUID or team selected by the browser", async () => {
  expect((await handleAccountAction(post({ userId: "forged" }), "link-existing")).status).toBe(400);
  expect((await handleAccountAction(post({}), "link-existing")).status).toBe(400);
  expect(spies.claim).not.toHaveBeenCalled();
  const cookie = `gh_session=${"a".repeat(64)}`;
  expect((await handleAccountAction(post({}, "https://goat.test", cookie), "link-existing")).ok).toBe(true);
  const ownership = spies.claim.mock.calls[0][0];
  expect(ownership).toHaveProperty("legacyTokenHash");
  expect(ownership).not.toHaveProperty("userId");
  expect(ownership).not.toHaveProperty("teamId");
  expect((await handleAccountAction(post({ inviteCode: "123456", userId: "forged" }), "claim")).status).toBe(400);
});
