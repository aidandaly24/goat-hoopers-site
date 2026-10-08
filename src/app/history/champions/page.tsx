/**
 * /history/champions — the Champions' Wall.
 *
 * Every banner the league has ever hung, plus the empty frame waiting for
 * this season's winner.
 */
import { getLeagueHistory } from "@/data/history";
import { ChampionsWall } from "@/surfaces/history/ChampionsWall";

export const revalidate = 3600;

export const metadata = {
  title: "Champions' Wall | GOAT Hoopers",
  description: "Every GOAT Hoopers champion, hanging forever.",
};

export default async function ChampionsPage() {
  const history = await getLeagueHistory();
  return <ChampionsWall champions={history.champions} />;
}
