import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SiteHeader, type SiteHeaderUser } from "./SiteHeader";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

const logoutAction = async () => {};

function render(user: SiteHeaderUser): string {
  return renderToStaticMarkup(createElement(SiteHeader, { user, logoutAction }));
}

describe("SiteHeader account chip", () => {
  it("shows the member's Sleeper avatar inside the chip when Sleeper has one", () => {
    const html = render({ displayName: "aidan", teamId: "1", avatar: "fixture-avatar-1" });
    expect(html).toContain(
      'src="https://sleepercdn.com/avatars/thumbs/fixture-avatar-1"',
    );
    // The image replaces the initial disc's letter.
    expect(html).not.toContain(">A</span>");
  });

  it("falls back to the initial disc when the member has no Sleeper avatar", () => {
    const html = render({ displayName: "aidan", teamId: "1", avatar: null });
    expect(html).not.toContain("sleepercdn.com/avatars");
    expect(html).toContain(">A</span>");
  });

  it("renders no account chip when signed out", () => {
    const html = render(null);
    expect(html).not.toContain("sleepercdn.com/avatars");
    expect(html).not.toContain("Log out");
    expect(html).toContain("Log in");
  });
});
