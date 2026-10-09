import { afterEach, expect, it, vi } from "vitest";
const spies = vi.hoisted(() => ({ handler: vi.fn(async () => Response.json({ ok: true })),
  consume: vi.fn(async () => true), enroll: vi.fn(async () => {}) }));
vi.mock("../friends-auth/runtime", () => ({ getFriendsAuth: () => ({ handler: spies.handler }),
  consumeAuthAttempt: spies.consume, enrollFriend: spies.enroll }));
vi.mock("../friends-auth/config", () => ({ friendsAuthEnabled: () => true, friendsEnrollmentEnabled: () => true,
  readFriendsAuthConfig: () => ({ origin: "https://goat.test" }) }));
import { handleFriendsAuth, handleEnrollment } from "../friends-auth/http";
afterEach(() => vi.clearAllMocks());

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
