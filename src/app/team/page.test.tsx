import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), detail: vi.fn(), value: vi.fn(), rewards: vi.fn(), enabled: vi.fn() }));
vi.mock("@/app/actions", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/data/league", () => ({ getTeamDetail: mocks.detail, getTeamRosterValue: mocks.value }));
vi.mock("@/data/arcade", () => ({ getGameStore: () => ({ getRewards: mocks.rewards }) }));
vi.mock("@/data/friends-auth/config", () => ({ friendsAuthEnabled: mocks.enabled }));
import TeamRoute from "./page";
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "fixture-user", teamId: "3", displayName: "Fixture Manager" });
  mocks.detail.mockResolvedValue({ team: { id: "3", name: "Fixture Club", managerName: "Fixture Manager", avatar: null, wins: 3, losses: 2, ties: 0, pointsFor: 123456, pointsAgainst: 100000 }, players: [] });
  mocks.value.mockResolvedValue(null); mocks.rewards.mockResolvedValue([]); mocks.enabled.mockReturnValue(true);
});
test("settings follows the team identity while retaining its protected destination", async () => {
  const html = renderToStaticMarkup(await TeamRoute());
  expect(html.indexOf('href="/account"')).toBeGreaterThan(html.indexOf('<h1'));
  expect(html).toContain('Account settings');
  expect(mocks.detail).toHaveBeenCalledWith("3"); expect(mocks.value).toHaveBeenCalledWith("3");
});
test("the existing auth flag still hides the settings action", async () => {
  mocks.enabled.mockReturnValue(false);
  expect(renderToStaticMarkup(await TeamRoute())).not.toContain('href="/account"');
});
test("signed-out visitors retain the intentional protected-team login return", async () => {
  mocks.user.mockResolvedValue(null);
  await expect(TeamRoute()).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/login?notice=team&next=%2Fteam;307;" });
  expect(mocks.detail).not.toHaveBeenCalled();
});
test("missing team and reward failures retain the existing fallbacks", async () => {
  mocks.detail.mockResolvedValueOnce(null);
  await expect(TeamRoute()).rejects.toMatchObject({ digest: "NEXT_REDIRECT;replace;/teams;307;" });
  mocks.rewards.mockRejectedValueOnce(new Error("fixture unavailable"));
  expect(renderToStaticMarkup(await TeamRoute())).toContain("Fixture Club");
});
