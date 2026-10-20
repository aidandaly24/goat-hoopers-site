import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { imageAlreadyFailed, SiteHeader, type SiteHeaderUser } from "./SiteHeader";

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

// Regression: an avatar that 404s in the SSR HTML fires its error event
// before hydration attaches onError, so the handler never runs and the
// chip would keep the broken image. On attach, AccountAvatar inspects
// the rendered <img> and routes this settled state through the same
// failed-id fallback as a live error. This repo's harness renders
// static markup only (no DOM, effects never run), so the pre-hydration
// scenario is pinned at the decision predicate the attach check uses;
// the component tests above pin the two render outcomes it switches
// between (avatar image vs. initials).
describe("imageAlreadyFailed (pre-hydration avatar failure)", () => {
  it("treats a settled image with no natural width as already failed", () => {
    // The state the dot reproduced in Chromium for a pre-hydration 404:
    // complete: true, naturalWidth: 0 after hydration had finished.
    expect(imageAlreadyFailed({ complete: true, naturalWidth: 0 })).toBe(true);
  });

  it("keeps an image that loaded successfully", () => {
    expect(imageAlreadyFailed({ complete: true, naturalWidth: 100 })).toBe(false);
  });

  it("does not fall back for an image that is still loading", () => {
    expect(imageAlreadyFailed({ complete: false, naturalWidth: 0 })).toBe(false);
  });
});
