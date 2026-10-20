import { beforeEach, expect, test, vi } from "vitest";
const mocks = vi.hoisted(() => ({ account: vi.fn(), member: vi.fn(), enabled: vi.fn(), enrollment: vi.fn() }));
vi.mock("@/data/friends-auth/config", () => ({ friendsAuthEnabled: mocks.enabled, friendsEnrollmentEnabled: mocks.enrollment }));
vi.mock("@/data/friends-auth/runtime", () => ({ getVerifiedAccount: mocks.account, getProviderUser: mocks.member }));
import { GET, dynamic } from "./route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.enabled.mockReturnValue(true); mocks.enrollment.mockReturnValue(true);
  mocks.account.mockResolvedValue({ subject: "fixture", sessionId: "fixture-session", name: "Manager" });
  mocks.member.mockResolvedValue({ teamId: "3" });
});
const request = (query = "") => new Request(`https://league.example/account/continue${query}`, { headers: { cookie: "fixture-session=new-computer" } });

test("new-session default goes directly to canonical home with fresh private session reads", async () => {
  const response = await GET(request());
  expect(response.status).toBe(303);
  expect(response.headers.get("location")).toBe("https://league.example/");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(dynamic).toBe("force-dynamic");
  const privateHeaders = mocks.account.mock.calls[0][0];
  expect(privateHeaders.get("cookie")).toBe("fixture-session=new-computer");
  expect(mocks.member).toHaveBeenCalledWith(privateHeaders);
});
test.each(["/team", "/account/password", "/stocks?player=123#history"])("preserves safe explicit return %s", async next => {
  expect((await GET(request(`?next=${encodeURIComponent(next)}`))).headers.get("location")).toBe(`https://league.example${next}`);
});
test("unsafe explicit return falls back to home", async () => {
  expect((await GET(request("?next=https://attacker.example"))).headers.get("location")).toBe("https://league.example/");
});
test("unclaimed account retains onboarding and its protected-route destination", async () => {
  mocks.member.mockResolvedValue(null);
  expect((await GET(request("?next=%2Fteam"))).headers.get("location")).toBe("https://league.example/account?next=%2Fteam");
});
test("unverified or signed-out accounts cannot skip login", async () => {
  mocks.account.mockResolvedValue(null);
  expect((await GET(request("?next=%2Faccount%2Fpassword"))).headers.get("location")).toBe("https://league.example/account/login?next=%2Faccount%2Fpassword");
  expect(mocks.member).not.toHaveBeenCalled();
});
test("enrollment-only mode retains its account setup screen", async () => {
  mocks.enabled.mockReturnValue(false);
  expect((await GET(request())).headers.get("location")).toBe("https://league.example/account");
  expect(mocks.member).not.toHaveBeenCalled();
});
test("disabled enrollment never opens provider reads", async () => {
  mocks.enrollment.mockReturnValue(false);
  expect((await GET(request())).headers.get("location")).toBe("https://league.example/login");
  expect(mocks.account).not.toHaveBeenCalled();
});
test("repeated visits recheck current membership rather than retaining the previous team", async () => {
  expect((await GET(request())).headers.get("location")).toBe("https://league.example/");
  mocks.member.mockResolvedValue(null);
  expect((await GET(request())).headers.get("location")).toBe("https://league.example/account");
  expect(mocks.account).toHaveBeenCalledTimes(2);
  expect(mocks.member).toHaveBeenCalledTimes(2);
});
test("an unavailable identity service fails closed rather than choosing home", async () => {
  mocks.account.mockRejectedValue(new Error("fixture unavailable"));
  await expect(GET(request())).rejects.toThrow("fixture unavailable");
  expect(mocks.member).not.toHaveBeenCalled();
});
