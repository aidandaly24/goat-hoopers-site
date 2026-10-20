import { FreeThrowPractice } from "@/surfaces/arcade/free-throw/FreeThrowPractice";
import { PRACTICE_ASSETS, PRACTICE_COURT } from "@/domain/arcade/free-throw";
/** Same public practice composition as the early return in the actual [gameId] page. */
export default function PracticeFixture() {
  return <FreeThrowPractice court={PRACTICE_COURT} assets={PRACTICE_ASSETS} />;
}
