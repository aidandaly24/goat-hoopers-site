import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { cachedData, teams } from "@/surfaces/ai-decides/test/fixtures";

const mocks = vi.hoisted(() => ({ user: vi.fn(), data: vi.fn(), teams: vi.fn() }));
vi.mock("@/app/actions", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/data/league", () => ({ getAiDecidesData: mocks.data, getTeams: mocks.teams }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
import Page from "./page";

describe("AI page session admission", () => {
  beforeEach(() => { mocks.data.mockResolvedValue(cachedData()); mocks.teams.mockResolvedValue(teams); mocks.user.mockReset(); });
  it("keeps cached picks/editor available when a configured session store rejects", async () => {
    mocks.user.mockRejectedValue(new Error("private database failure"));
    const element = await Page();
    expect(element.props.signedIn).toBe(false); expect(element.props.authUnavailable).toBe(true);
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Cached test pick"); expect(html).toContain("Session verification unavailable");
    expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Let AI decide/);
    expect(html).toMatch(/<textarea[^>]*id="ai-question"/); expect(html).not.toMatch(/<textarea[^>]*disabled/);
    expect(html).not.toContain("private database failure"); expect(html).not.toContain('href="/login"');
  });
  it("distinguishes an ordinary signed-out session from lookup failure", async () => {
    mocks.user.mockResolvedValue(null);
    const element = await Page(), html = renderToStaticMarkup(element);
    expect(element.props.authUnavailable).toBe(false); expect(html).toContain('href="/login"');
    expect(html).not.toContain("Session verification unavailable");
  });
  it("allows current authenticated admission while leaving authorization to the server", async () => {
    mocks.user.mockResolvedValue({ id: "synthetic-user" });
    const element = await Page(), html = renderToStaticMarkup(element);
    expect(element.props.signedIn).toBe(true); expect(element.props.authUnavailable).toBe(false);
    expect(html).toMatch(/<button(?![^>]*disabled)[^>]*>Let AI decide/);
  });
  it("passes current team pictures through the slim page projection", async () => {
    mocks.user.mockResolvedValue(null);
    mocks.teams.mockResolvedValue(teams.map(t => ({ ...t, managerName: "Not needed by this page" })));
    const element = await Page();
    expect(element.props.teams).toEqual(teams);
    const html = renderToStaticMarkup(element);
    expect(html).toContain("https://sleepercdn.com/avatars/thumbs/fixture-avatar-6");
    expect(html).toContain("https://sleepercdn.com/avatars/thumbs/fixture-avatar-10");
    expect(html).not.toContain("Not needed by this page");
  });
});
