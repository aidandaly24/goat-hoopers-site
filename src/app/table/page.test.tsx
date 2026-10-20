import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";
import { reigningChampionRosterId } from "@/data/history-2025";

const mocks = vi.hoisted(() => ({ user: vi.fn(), table: vi.fn() }));
vi.mock("@/app/actions", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/data/league", () => ({ getTableData: mocks.table }));
import TableRoute from "./page";

const championId = reigningChampionRosterId();
const mkTeam = (id: string) => ({
  id, name: `Team ${id}`, managerName: "Synthetic Manager", avatar: null,
  wins: 0, losses: 0, ties: 0, pointsFor: 0, pointsAgainst: 0,
});
const mkRow = (id: string, rank: number) => ({
  standing: {
    team: mkTeam(id), rank,
    wins: rank === 1 ? 3 : 1, losses: 0, ties: 0, pointsFor: 0, gamesBack: rank - 1,
  },
  streak: null,
});
const tableData = (ids: string[]) => ({
  season: null, hasResults: true,
  league: ids.map((id, i) => mkRow(id, i + 1)),
  value: null,
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue(null); // signed-out visitors get the plain board
});

test("the /table page crowns the canonical reigning champion's row", async () => {
  if (championId === null) throw new Error("fixture expects a known 2025 champion");
  mocks.table.mockResolvedValue(tableData([championId, "9"]));
  const html = renderToStaticMarkup(await TableRoute());
  expect(html.match(/data-champion-crown="badge"/g)).toHaveLength(1);
  expect(html).not.toContain('data-champion-crown="interactive"');
});

test("the board renders plainly with no crown when the champion id is not on it", async () => {
  mocks.table.mockResolvedValue(tableData(["9", "10"]));
  const html = renderToStaticMarkup(await TableRoute());
  expect(html).not.toContain("data-champion-crown");
  expect(html).not.toContain("Reigning champion");
});
