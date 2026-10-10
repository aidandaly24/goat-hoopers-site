import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AiDecides } from "./AiDecides";
import { cachedData, teams } from "./test/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const data = () => {
  const value = cachedData();
  value.week1Refresh = { status: "available", message: "Fixture: one-time refresh available." };
  value.weekly.matchups = Array.from({ length: 5 }, (_, i) => ({ ...value.weekly.matchups[0], matchupId: `fixture-${i}`, teamIds: [String(i * 2 + 1), String(i * 2 + 2)] }));
  return value;
};
describe("Week 1 operator display", () => {
  it("hides the feature when switched off, signed out or auth unavailable", () => {
    const value = data();
    const render = (signedIn: boolean, authUnavailable = false) => renderToStaticMarkup(createElement(AiDecides, { data: value, teams, signedIn, authUnavailable }));
    expect(render(false)).not.toContain("One-time Week 1 refresh");
    expect(render(true, true)).not.toContain("One-time Week 1 refresh");
    delete value.week1Refresh; expect(render(true)).not.toContain("One-time Week 1 refresh");
  });
  it("shows explicit paid action copy without making a render-time call", () => {
    const refreshWeek1 = vi.fn();
    const html = renderToStaticMarkup(createElement(AiDecides, { data: data(), teams, signedIn: true, refreshWeek1 }));
    expect(html).toContain("Refresh Week1 predictions");
    expect(html).toContain("One-time paid model batch for all five");
    expect(html).toContain("shared daily token budget");
    expect(html).toContain("original batch remains archived");
    expect(html).toContain('aria-describedby="ai-week1-refresh-note"');
    expect(html).not.toContain("Publish weekly previews");
    expect(refreshWeek1).not.toHaveBeenCalled();
  });
  it.each(["sealed", "published", "unavailable"] as const)("shows %s server state without a paid action", status => {
    const value = data(); value.week1Refresh = { status, message: `Fixture server state: ${status}` };
    const html = renderToStaticMarkup(createElement(AiDecides, { data: value, teams, signedIn: true }));
    expect(html).toContain(`Fixture server state: ${status}`);
    expect(html).not.toContain("Refresh Week1 predictions");
    expect(html.includes("Reload saved picks")).toBe(status === "sealed");
  });
  it("blocks AI unavailability, incomplete picks and a later week", () => {
    const value = data();
    const render = () => renderToStaticMarkup(createElement(AiDecides, { data: value, teams, signedIn: true }));
    value.availability.status = "unavailable";
    expect(render()).toMatch(/aria-disabled="true"[^>]*>Refresh Week1 predictions/);
    value.availability.status = "available"; value.weekly.matchups.pop();
    expect(render()).toMatch(/aria-disabled="true"[^>]*>Refresh Week1 predictions/);
    value.weekly = data().weekly; value.weekly.week = 2;
    expect(render()).toMatch(/aria-disabled="true"[^>]*>Refresh Week1 predictions/);
  });
});
