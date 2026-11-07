/** Live league data and source-controlled editions feed the courtside home surface. */
import {
  getCourtsideHomeData,
  getWeeklyArchive,
  getCourtsidePortraits,
  getAiDecidesData,
  getStockMarketData,
  getLeagueNewsEdition,
  getHomePlayerGuideSources,
  getRosterSnapshotHistory,
  getHomeLineupPowerSource,
  buildHomeLineupPower,
} from "@/data/league";
import { headers } from "next/headers";
import { getCurrentUser } from "@/app/actions";
import { friendsAuthEnabled } from "@/data/friends-auth/config";
import { getVerifiedAccount } from "@/data/friends-auth/runtime";
import { hasHomeMembership, loadHomeViewer } from "@/data/home-viewer";
import { buildHomeFaces, buildPersonalizedHome } from "@/data/personalized-home";
import { getTeamValueHistory } from "@/data/team-value-history";
import { buildHomeWeeklyContext } from "@/data/home-weekly-context";
import { WEEKLY_EVIDENCE_RECEIPTS } from "@/data/weekly-player-evidence";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GOAT Hoopers — Fantasy Basketball League",
  alternates: { canonical: "/" },
};

// Membership is request-private. Only the existing public source loaders cache data.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, aiData, viewer, powerSource] = await Promise.all([getCourtsideHomeData(), getAiDecidesData(),
    loadHomeViewer({ member: getCurrentUser, account: async () => friendsAuthEnabled()
      ? getVerifiedAccount(await headers()) : null, hasMembership: hasHomeMembership }),
    getHomeLineupPowerSource(),
  ]);
  // React.cache reuses the root ticker's existing request-local market result
  // for every visitor, so the league faces strip costs no additional refresh,
  // deep player fetch or snapshot operation. The personalized summary — and
  // the news/guide loads that feed it — stay member-only, as before.
  const market = await getStockMarketData().catch(() => null);
  // The recorded snapshot history is member-only too: one batched read of
  // the viewer's own roster's retained snapshots, feeding the roster-value
  // trend. Signed-out and unlinked visitors never trigger it.
  const viewerRosterIds = viewer.kind === "member"
    ? data.directory.find(entry => entry.identity.id === viewer.teamId)?.players.map(player => player.id) ?? [] : [];
  // The recorded team-value history (issue #217) is member-only too: the
  // replayed series for the viewer's own team, read-only from recorded
  // quotes + the Sleeper feed. Null keeps the section's prior fallback.
  const [news, guideSources, snapshotHistory, teamHistory] = viewer.kind === "member" ? await Promise.all([
    getLeagueNewsEdition().catch(() => null), getHomePlayerGuideSources().catch(() => null),
    getRosterSnapshotHistory(viewerRosterIds).catch(() => null),
    getTeamValueHistory(viewer.teamId).catch(() => null),
  ]) : [null, null, null, null];
  const weeklyContext = buildHomeWeeklyContext(data, WEEKLY_EVIDENCE_RECEIPTS, viewer.kind === "member" ? viewer.teamId : null, guideSources);
  const personal = buildPersonalizedHome(viewer, data, aiData.weekly, market, news, weeklyContext.guideSources, snapshotHistory);
  const faces = buildHomeFaces(data, market);
  // One surface: the edition itself is personalized in place.
  return (
    <CourtsideHome
      data={data}
      archive={getWeeklyArchive()}
      portraits={getCourtsidePortraits()}
      aiWeekly={aiData.weekly}
      viewerTeamId={viewer.kind === "member" ? viewer.teamId : undefined}
      personal={personal}
      faces={faces}
      teamHistory={teamHistory}
      weeklyRecap={weeklyContext.recap}
      lineupPower={buildHomeLineupPower(data, powerSource)}
    />
  );
}
