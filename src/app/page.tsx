/** Live league data and source-controlled editions feed the courtside home surface. */
import {
  getCourtsideHomeData,
  getWeeklyArchive,
  getCourtsidePortraits,
  getAiDecidesData,
  getStockMarketData,
  getLeagueNewsEdition,
  getHomePlayerGuideSources,
} from "@/data/league";
import { headers } from "next/headers";
import { getCurrentUser } from "@/app/actions";
import { friendsAuthEnabled } from "@/data/friends-auth/config";
import { getVerifiedAccount } from "@/data/friends-auth/runtime";
import { hasHomeMembership, loadHomeViewer } from "@/data/home-viewer";
import { buildHomeFaces, buildPersonalizedHome } from "@/data/personalized-home";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GOAT Hoopers — Fantasy Basketball League",
  alternates: { canonical: "/" },
};

// Membership is request-private. Only the existing public source loaders cache data.
export const dynamic = "force-dynamic";

export default async function Home() {
  const [data, aiData, viewer] = await Promise.all([getCourtsideHomeData(), getAiDecidesData(),
    loadHomeViewer({ member: getCurrentUser, account: async () => friendsAuthEnabled()
      ? getVerifiedAccount(await headers()) : null, hasMembership: hasHomeMembership }),
  ]);
  // React.cache reuses the root ticker's existing request-local market result
  // for every visitor, so the league faces strip costs no additional refresh,
  // deep player fetch or snapshot operation. The personalized summary — and
  // the news/guide loads that feed it — stay member-only, as before.
  const market = await getStockMarketData().catch(() => null);
  const [news, guideSources] = viewer.kind === "member" ? await Promise.all([
    getLeagueNewsEdition().catch(() => null), getHomePlayerGuideSources().catch(() => null),
  ]) : [null, null];
  const personal = buildPersonalizedHome(viewer, data, aiData.weekly, market, news, guideSources);
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
    />
  );
}
