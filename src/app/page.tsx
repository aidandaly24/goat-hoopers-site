/** Live league data and source-controlled editions feed the courtside home surface. */
import {
  getCourtsideHomeData,
  getWeeklyArchive,
  getCourtsidePortraits,
} from "@/data/league";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";

export const revalidate = 300;

export default async function Home() {
  const data = await getCourtsideHomeData();
  return (
    <CourtsideHome
      data={data}
      archive={getWeeklyArchive()}
      portraits={getCourtsidePortraits()}
    />
  );
}
