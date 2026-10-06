import Link from "next/link";
import type { PlayerMove, Team, Transaction } from "@/domain";
import { PlayerName } from "@/ui/PlayerRow";
import styles from "./TransactionSummary.module.css";

/**
 * TransactionSummary — one transaction as a readable sentence with every
 * player name linked to their player page and the acting team linked to
 * its team page. Built from the structured adds/drops on the domain
 * Transaction (not from the summary string), so names are never dead text.
 */
export function TransactionSummary({
  transaction,
  teams,
}: {
  transaction: Transaction;
  teams: Team[];
}) {
  const t = transaction;
  const teamById = new Map(teams.map((x) => [x.id, x]));

  const actor =
    t.teamIds.length === 1 ? teamById.get(t.teamIds[0]) : undefined;
  const actorNode = actor ? (
    <Link href={`/teams/${actor.id}`} className={styles.teamLink}>
      {actor.name}
    </Link>
  ) : (
    <>{t.teamIds.length > 1 ? "Multiple teams" : "A team"}</>
  );

  const linked = (moves: PlayerMove[]) =>
    moves.map((m, i) => (
      <span key={m.playerId}>
        {i > 0 && ", "}
        <PlayerName player={{ id: m.playerId, fullName: m.name }} />
      </span>
    ));

  return (
    <span>
      {actorNode}{" "}
      {t.type === "trade" && t.adds.length === 0 && t.drops.length === 0 ? (
        <>completed a trade</>
      ) : (
        <>
          {t.adds.length > 0 && <>added {linked(t.adds)}</>}
          {t.adds.length > 0 && t.drops.length > 0 && <>, </>}
          {t.drops.length > 0 && <>dropped {linked(t.drops)}</>}
          {t.adds.length === 0 && t.drops.length === 0 && <>made a roster move</>}
        </>
      )}
    </span>
  );
}
