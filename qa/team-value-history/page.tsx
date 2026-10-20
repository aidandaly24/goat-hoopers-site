import { TeamValueHistory } from "@/surfaces/season-hub/TeamValueHistory";
import { teamValueHistoryFixture } from "@/test/team-value-history-fixture";

export const dynamic = "force-dynamic";
export default async function Page({ searchParams }: { searchParams: Promise<{ state?: string; column?: string }> }) {
  const { state = "mixed", column } = await searchParams;
  const history = teamValueHistoryFixture(state);
  if (state === "long") history.team.name = "Synthetic Basketball Club With AnExceptionallyLongUnbrokenNameForNarrowReflow";
  return <main><p className="fixture-note">Synthetic history fixture. Every identity, price and move is invented for verification. No live league, account or database is used.</p>
    <div style={column === "narrow" ? { maxWidth: "27rem", margin: "auto" } : undefined}><TeamValueHistory history={history} detailEndpoint={`/api/history-detail?state=${encodeURIComponent(state)}`} pageEndpoint={`/api/history-summary?state=${encodeURIComponent(state)}`} /></div>
  </main>;
}
