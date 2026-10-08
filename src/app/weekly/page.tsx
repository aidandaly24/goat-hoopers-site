import { getWeeklyArchive } from "@/data/league";
import { CourtsideArchive } from "@/surfaces/season-hub/CourtsideArchive";

export const metadata = { title: "Weekly archive · GOAT Hoopers" };

export default function WeeklyArchive() {
  return <CourtsideArchive editions={getWeeklyArchive()} />;
}
