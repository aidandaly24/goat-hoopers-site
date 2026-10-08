/**
 * /history — the trophy room.
 *
 * Thin page: loads league history via the data loader, hands the domain
 * objects to the history surface. Champions, records, and Hall of Fame —
 * all real, verified against the 2025 Sleeper season.
 */
import { getLeagueHistory } from "@/data/history";
import { TrophyRoom } from "@/surfaces/history/TrophyRoom";

export const revalidate = 3600; // history barely changes; refresh hourly

export const metadata = {
  title: "Trophy Room | GOAT Hoopers",
  description:
    "Every champion, every record, every legend in GOAT Hoopers history.",
};

export default async function HistoryPage() {
  const history = await getLeagueHistory();
  return <TrophyRoom history={history} />;
}
