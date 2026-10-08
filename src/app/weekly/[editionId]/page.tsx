import { notFound } from "next/navigation";
import {
  getCourtsideHomeData,
  getWeeklyArchive,
  getWeeklyEdition,
  getCourtsidePortraits,
} from "@/data/league";
import { CourtsideHome } from "@/surfaces/season-hub/CourtsideHome";

export default async function WeeklyEditionPage({
  params,
}: {
  params: Promise<{ editionId: string }>;
}) {
  const { editionId } = await params;
  if (!getWeeklyEdition(editionId)) notFound();
  const data = await getCourtsideHomeData(editionId);
  return (
    <CourtsideHome
      data={data}
      archive={getWeeklyArchive()}
      portraits={getCourtsidePortraits()}
      archived
    />
  );
}
