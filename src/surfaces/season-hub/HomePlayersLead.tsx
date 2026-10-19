import type { CSSProperties } from "react";
import Link from "next/link";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { teamColorVar } from "@/ui/teamColors";
import { cs } from "./CourtsideStyles";
import { formatHomeStamp } from "./homeFormat";

/**
 * The players module's personal lead: the viewer's top three by modeled
 * value at editorial size, then their watch/risers rows when real data
 * exists — folded into the edition's players module, never a separate
 * roster-value section. Renders nothing when neither has real data.
 * Faces resolve local portrait → directory ESPN identity → initials.
 */
export function HomePlayersLead({
  summary,
  portraits,
}: {
  summary: HomeTeamSummary;
  portraits: Record<string, string>;
}) {
  const { players, playerGuide, team, market } = summary;
  const watch = playerGuide.watch;
  const risers = watch.basis === "unavailable" ? [] : watch.rows;
  if (!players.length && !risers.length) return null;
  const riserChip =
    watch.basis === "market" ? "Rising value · preseason market movement" : watch.label;
  const stamp = formatHomeStamp(market?.updatedAt);
  return (
    <div className={cs("your-lead")} data-your-lead>
      {!!players.length && (
        <>
          <h3 className={cs("lead-title")}>
            Your top three <span>· {team.name}</span>
          </h3>
          <ol className={cs("your-top3")}>
            {players.map((player) => (
              <li
                key={player.id}
                className={cs("your-card")}
                style={{ "--card-glow": teamColorVar(team.id) } as CSSProperties}
              >
                <Link href={`/player/${player.id}`} prefetch={false} className={cs("your-card-link")}>
                  <PlayerHeadshot
                    portraitSrc={portraits[player.id]}
                    espnId={player.espnId}
                    name={player.name}
                    teamId={team.id}
                    size={104}
                  />
                  <span className={cs("your-card-name")}>{player.name}</span>
                  <span className={cs("your-card-meta")}>{player.position ?? "Position unavailable"}</span>
                  <span className={cs("your-card-price", "gh-num")}>${player.value.toFixed(1)}</span>
                  {player.changePct !== null && (
                    <span className={cs("move-chip", player.changePct > 0 ? "move-up" : player.changePct < 0 ? "move-down" : "move-flat")}>
                      {player.changePct > 0 ? "+" : player.changePct < 0 ? "−" : ""}
                      {Math.abs(player.changePct).toFixed(1)}%
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
      {!!risers.length && (
        <div className={cs("risers")}>
          <p className={cs("risers-head")}>
            <span className={cs("chip")}>{riserChip}</span>
            <span className={cs("risers-title")}>On your roster</span>
          </p>
          <ol className={cs("riser-rows")}>
            {risers.map((row) => (
              <li key={row.id} className={cs("riser-row")}>
                <PlayerHeadshot
                  portraitSrc={portraits[row.id]}
                  espnId={row.espnId}
                  name={row.name}
                  teamId={team.id}
                  size={44}
                />
                <Link href={`/player/${row.id}`} prefetch={false}>{row.name}</Link>
                <strong className="gh-num">
                  {watch.basis === "market" ? `Up ${row.value.toFixed(1)}%` : `${row.value.toFixed(1)} FPPG`}
                </strong>
              </li>
            ))}
          </ol>
        </div>
      )}
      {market && stamp && (
        <p className={cs("caption", "lead-footnote")}>
          Modeled prices · {market.pricingBasis === "preseason" ? "Preseason" : "In-season"} pricing · computed {stamp}.
        </p>
      )}
    </div>
  );
}
