/** Live league data and source-controlled editions feed the courtside home surface. */
import {
  getCourtsideHomeData,
  getWeeklyArchive,
  getCourtsidePortraits,
  getAiDecidesData,
} from "@/data/league";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GOAT Hoopers — Fantasy Basketball League",
  alternates: { canonical: "/" },
};

export const revalidate = 300;

export default async function Home() {
  const [data, aiData] = await Promise.all([getCourtsideHomeData(), getAiDecidesData()]);
  return (
    <CourtsideHome
      data={data}
      archive={getWeeklyArchive()}
      portraits={getCourtsidePortraits()}
      aiWeekly={aiData.weekly}
    />
  );
}
