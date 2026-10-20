import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AiDecides } from "./AiDecides";
import { cachedData, teams } from "./test/fixtures";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const data = () => {
  const value = cachedData();
  value.week1Refresh = { status: "available", message: "Fixture: one-time refresh available." };
  value.weekly.matchups = Array.from({ length: 5 }, (_, i) => {
    const teamIds: [string, string] = [String(i * 2 + 1), String(i * 2 + 2)];
    return { ...value.weekly.matchups[0], matchupId: `fixture-${i}`, teamIds, result: { ...value.weekly.matchups[0].result!, choice: teamIds[0], probabilities: [{ choice: teamIds[0], probability: .38 }, { choice: teamIds[1], probability: .62 }] } };
  });
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
  it.each(["changed", "unverified"] as const)("keeps the server-authorized one-shot action enabled for a complete %s-settings slate", status => {
    const value = data(); value.weekly.status = "stale";
    value.weekly.sourceCompatibility = { status, currentWindow: true, savedStarterCount: 10, currentStarterCount: status === "changed" ? 11 : null, savedPolicy: "legacy-ten-starters", message: "Saved settings differ or are unverified; original inputs are retained." };
    const refreshWeek1 = vi.fn(), html = renderToStaticMarkup(createElement(AiDecides, { data: value, teams, signedIn: true, refreshWeek1 }));
    expect(html).toMatch(/aria-disabled="false"[^>]*>Refresh Week1 predictions/);
    expect(refreshWeek1).not.toHaveBeenCalled();
    value.weekly.matchups[0].status = "unavailable"; value.weekly.matchups[0].result = null;
    expect(renderToStaticMarkup(createElement(AiDecides, { data: value, teams, signedIn: true }))).toMatch(/aria-disabled="true"[^>]*>Refresh Week1 predictions/);
  });
  it("keeps an ordinary expired or malformed-notice slate disabled", () => {
    const value = data(); value.weekly.status = "stale";
    const render = () => renderToStaticMarkup(createElement(AiDecides, { data: value, teams, signedIn: true }));
    expect(render()).toMatch(/aria-disabled="true"[^>]*>Refresh Week1 predictions/);
    value.weekly.sourceCompatibility = { status: "changed", currentWindow: false, savedStarterCount: 10, currentStarterCount: 11, savedPolicy: "legacy-ten-starters", message: "Settings changed after the saved window ended." };
    expect(render()).toMatch(/aria-disabled="true"[^>]*>Refresh Week1 predictions/);
    Object.assign(value.weekly, { sourceCompatibility: { status: "unverified" } });
    expect(render()).toMatch(/aria-disabled="true"[^>]*>Refresh Week1 predictions/);
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
