/** Live league data and source-controlled editions feed the courtside home surface. */
import {
  getCourtsideHomeData,
  getWeeklyArchive,
  getCourtsidePortraits,
  getAiDecidesData,
} from "@/data/league";
import { AiDecidesHomeEntry } from "@/surfaces/ai-decides/AiWeekly";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";

export const revalidate = 300;

export default async function Home() {
  const [data, aiData] = await Promise.all([getCourtsideHomeData(), getAiDecidesData()]);
  return (
    <CourtsideHome
      data={data}
      archive={getWeeklyArchive()}
      portraits={getCourtsidePortraits()}
      aiEntry={<AiDecidesHomeEntry data={aiData} teams={(data.hub?.teams ?? []).map(({ id, name }) => ({ id, name }))} />}
    />
  );
}
