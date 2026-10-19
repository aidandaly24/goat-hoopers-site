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
import { buildPersonalizedHome } from "@/data/personalized-home";
import { PersonalizedHome } from "@/surfaces/season-hub/PersonalizedHome";
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
  // React.cache reuses the root ticker's existing request-local market result.
  // No additional refresh, deep player fetch or snapshot operation is introduced.
  const [market, news, guideSources] = viewer.kind === "member" ? await Promise.all([
    getStockMarketData().catch(() => null), getLeagueNewsEdition().catch(() => null), getHomePlayerGuideSources().catch(() => null),
  ]) : [null, null, null];
  const personal = buildPersonalizedHome(viewer, data, aiData.weekly, market, news, guideSources);
  const portraits = getCourtsidePortraits();
  return (
    <>
      <PersonalizedHome data={personal} portraits={portraits} />
      <CourtsideHome
        data={data}
        archive={getWeeklyArchive()}
        portraits={portraits}
        aiWeekly={aiData.weekly}
        viewerTeamId={viewer.kind === "member" ? viewer.teamId : undefined}
      />
    </>
  );
}
