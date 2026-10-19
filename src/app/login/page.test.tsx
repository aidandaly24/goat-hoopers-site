import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ member: vi.fn(), legacyMember: vi.fn(), home: vi.fn(), enabled: vi.fn(), enrollment: vi.fn() }));
vi.mock("@/app/actions", () => ({ getCurrentUser: mocks.member, getLegacyCurrentUser: mocks.legacyMember }));
vi.mock("@/data/league", () => ({ getSeasonHubData: mocks.home }));
vi.mock("@/data/friends-auth/config", () => ({ friendsAuthEnabled: mocks.enabled, friendsEnrollmentEnabled: mocks.enrollment }));
import LoginPage from "./page";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.member.mockResolvedValue(null); mocks.legacyMember.mockResolvedValue(null);
  mocks.enabled.mockReturnValue(true); mocks.enrollment.mockReturnValue(true);
  mocks.home.mockResolvedValue({ standings: [] });
});
const visit = (params = {}) => LoginPage({ searchParams: Promise.resolve(params) });
test("new computer email login defaults to home without loading league data", async () => {
  const page = await visit();
  expect(page.props.mode).toBe("login"); expect(page.props.returnTo).toBe("/");
  expect(mocks.home).not.toHaveBeenCalled();
});
test("an intentional team login retains its safe return", async () => {
  expect((await visit({ notice: "team", next: "/team" })).props.returnTo).toBe("/team");
  expect((await visit({ next: "//attacker.example" })).props.returnTo).toBe("/");
});
test("already signed-in and repeated/back visits skip the login form", async () => {
  mocks.member.mockResolvedValue({ teamId: "3" });
  await expect(visit()).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/;307;" });
  await expect(visit({ next: "/team" })).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/team;307;" });
});
test("explicit security re-verification still displays the form", async () => {
  mocks.member.mockResolvedValue({ teamId: "3" });
  expect((await visit({ notice: "reverify", next: "/account/password" })).props.mode).toBe("login");
});
test("legacy proof/enrollment is not skipped for an existing member", async () => {
  mocks.legacyMember.mockResolvedValue({ teamId: "3" });
  expect((await visit({ legacy: "1" })).props.enrollment).toBe(true);
  expect(mocks.legacyMember).toHaveBeenCalled(); expect(mocks.member).not.toHaveBeenCalled();
});
