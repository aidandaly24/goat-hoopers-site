import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
const store = vi.hoisted(() => ({ getGameStore: vi.fn(() => { throw new Error("No database work permitted"); }) }));
const account = vi.hoisted(() => ({ getCurrentUser: vi.fn(() => { throw new Error("No account work permitted"); }) }));
vi.mock("@/data/arcade", () => store);
vi.mock("@/app/actions", () => account);
import GamePage from "./page";

it("renders an unplayable registered concept without account, score or database reads", async () => {
  const html = renderToStaticMarkup(await GamePage({ params: Promise.resolve({ gameId: "82-0-predictions" }) }));
  expect(html).toContain("Under construction");
  expect(html).toContain("This game is not playable yet");
  expect(html).toContain("Entries, scores, rankings and prizes are not open");
  expect(html).toContain('href="/arcade/free-throw"');
  expect(html).toContain('href="/arcade/ranked-free-throw"');
  expect(html).not.toMatch(/drizzle|provisioned|10 FAAB|before opening night|Weekly leaderboard/);
  expect(store.getGameStore).not.toHaveBeenCalled();
  expect(account.getCurrentUser).not.toHaveBeenCalled();
});
it("keeps unknown game routes as 404s", async () => {
  await expect(GamePage({ params: Promise.resolve({ gameId: "unknown-game" }) })).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
});
