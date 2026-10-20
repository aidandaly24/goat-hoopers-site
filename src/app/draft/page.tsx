/**
 * /draft — the league's rookie draft board.
 *
 * Thin page: loads via the data loader, hands the domain object to the
 * surface.
 */
import { getDraftBoard } from "@/data/league";
import { reigningChampionRosterId } from "@/data/history-2025";
import { DraftBoard } from "@/surfaces/draft/DraftBoard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rookie Draft Board | GOAT Hoopers",
  description:
    "The GOAT Hoopers rookie draft board, round by round.",
  alternates: { canonical: "/draft" },
};

export default async function DraftPage() {
  const board = await getDraftBoard();
  return <DraftBoard picks={board.picks} teams={board.teams} championTeamId={reigningChampionRosterId()} />;
}
