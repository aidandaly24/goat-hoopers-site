import type { Metadata } from "next";
import { getCurrentUser } from "@/app/actions";
import { getAiDecidesData, getTeams } from "@/data/league";
import { AiDecides } from "@/surfaces/ai-decides/AiDecides";

export const metadata: Metadata = { title: "AI Decides | GOAT Hoopers", description: "Published weekly model picks and a decision playground for your own questions." };

/** Thin page. Load cached picks/identities through data; the server owns admission. */
export default async function AiDecidesPage() {
  const [data, teams, user] = await Promise.all([getAiDecidesData(), getTeams(), getCurrentUser()]);
  return <AiDecides data={data} teams={teams.map(({ id, name }) => ({ id, name }))} signedIn={user !== null} />;
}
