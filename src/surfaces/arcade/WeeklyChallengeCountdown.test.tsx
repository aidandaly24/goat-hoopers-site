import { expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { HeldRankedOpening } from "./WeeklyChallengeCountdown";
import { WEEK_ONE_RANKED_OPENING } from "@/domain/arcade/challenge-opening";
import type { ServerClockAnchor } from "@/domain/server-clock";

const clock = (asOfMs: number): ServerClockAnchor => ({ asOfMs, upperServerNowAtReceiptMs: asOfMs,
  exchange: { sequence: 1, sentAtMonoMs: 0, receivedAtMonoMs: 0 } });

it("does not advertise an expired launch date or zero countdown after the server-confirmed opening", () => {
  const html = renderToStaticMarkup(<HeldRankedOpening clock={clock(WEEK_ONE_RANKED_OPENING.startsAtMs + 1)} failed={false} refresh={() => {}} />);
  expect(html).toContain("Ranked rounds are currently closed");
  expect(html).toContain("Local practice remains available");
  expect(html).not.toContain("00:00");
  expect(html).not.toContain("Scheduled ranked opening");
  expect(html).not.toContain("Ranked opening in");
});

it("retains the announced future opening only when a server clock confirms it is future", () => {
  const html = renderToStaticMarkup(<HeldRankedOpening clock={clock(WEEK_ONE_RANKED_OPENING.startsAtMs - 10000)} failed={false} refresh={() => {}} />);
  expect(html).toContain("Scheduled ranked opening");
  expect(html).toContain("Reaching zero does not open entries");
});

it("does not claim the old schedule is upcoming when the server clock is unknown", () => {
  const html = renderToStaticMarkup(<HeldRankedOpening clock={null} failed={true} refresh={() => {}} />);
  expect(html).not.toContain("Scheduled ranked opening");
  expect(html).toContain("Server clock unavailable");
});
