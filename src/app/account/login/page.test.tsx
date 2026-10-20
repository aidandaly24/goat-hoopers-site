import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), enrollment: vi.fn() }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("@/data/friends-auth/config", () => ({ friendsEnrollmentEnabled: mocks.enrollment }));
vi.mock("@/data/friends-auth/runtime", () => ({ getVerifiedAccount: mocks.account }));
import EmailLoginPage from "./page";
const visit = (params = {}) => EmailLoginPage({ searchParams: Promise.resolve(params) });
beforeEach(() => { vi.resetAllMocks(); mocks.enrollment.mockReturnValue(true); mocks.account.mockResolvedValue(null); });
test("new sessions get a home-default form with explicit safe return support", async () => {
  expect((await visit()).props.returnTo).toBe("/");
  expect((await visit({ next: "/account/password" })).props.returnTo).toBe("/account/password");
  expect((await visit({ next: "https://attacker.example" })).props.returnTo).toBe("/");
});
test("repeat login visits use the fresh membership continuation rather than settings", async () => {
  mocks.account.mockResolvedValue({ subject: "fixture" });
  await expect(visit()).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/account/continue;307;" });
});
test("security re-verification never auto-skips the login form", async () => {
  mocks.account.mockResolvedValue({ subject: "fixture" });
  expect((await visit({ notice: "reverify" })).props.mode).toBe("login");
});
test("disabled enrollment does not touch account services", async () => {
  mocks.enrollment.mockReturnValue(false);
  await expect(visit()).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/login;307;" });
  expect(mocks.account).not.toHaveBeenCalled();
});
