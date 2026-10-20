import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ServerCountdown } from "./ServerCountdown";

it("renders an explicit unverified state with no clock and no running seconds", () => {
  const html = renderToStaticMarkup(<ServerCountdown clock={null} deadlineMs={null} label="League opening"
    endedLabel="Opening reached" uncertaintyLabel="Exact opening time unconfirmed" />);
  expect(html).toContain("League opening");
  expect(html).toContain("Exact opening time unconfirmed");
  expect(html).toContain('data-server-clock="uncertain"');
  expect(html).not.toContain("02:00");
  expect(html).not.toContain('role="timer"');
});
