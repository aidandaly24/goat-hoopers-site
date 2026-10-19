import type { CSSProperties } from "react";
import Link from "next/link";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import type { GuideRow } from "@/domain/team-player-guide";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { teamColorVar } from "@/ui/teamColors";
import { cs } from "./CourtsideStyles";
import { formatHomeStamp } from "./homeFormat";

/**
 * The players module's personal lead: the viewer's top three by modeled
 * value at editorial size, their watch/risers rows (form rows carry their
 * observed games; a note prints only for an actual injury designation),
 * and — once a completed week exists — the compact best/rough recap from
 * verified participation, with the guide's period and recap message. When
 * no week is verified yet, the guide's own recap status line discloses
 * why. Folded into the edition's players
 * module, never a separate section. Renders nothing when none of it has
 * real data. Faces resolve local portrait → directory ESPN identity →
 * initials.
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
  const best = playerGuide.best;
  const rough = playerGuide.rough;
  if (!players.length && !risers.length && !best.length) return null;
  const riserChip =
    watch.basis === "market" ? "Rising value · preseason market movement" : watch.label;
  const stamp = formatHomeStamp(market?.updatedAt);
  // A watch row's note renders only when it carries an actual injury
  // designation ("Status: …"). The guide's absence defaults — "No injury
  // designation in the supplied source", "Availability status unknown" —
  // are the absence of news, not content, and never print under a player.
  const designationNote = (row: GuideRow) => row.note.startsWith("Status: ") ? row.note : null;
  const guideRow = (row: GuideRow, value: string, note: string | null) => (
    <li key={row.id} className={cs("riser-row")}>
      <PlayerHeadshot
        portraitSrc={portraits[row.id]}
        espnId={row.espnId}
        name={row.name}
        teamId={team.id}
        size={44}
      />
      <span className={cs("riser-main")}>
        <Link href={`/player/${row.id}`} prefetch={false}>{row.name}</Link>
        {note && <span className={cs("riser-note")}>{note}</span>}
      </span>
      <strong className="gh-num">{value}</strong>
    </li>
  );
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
            {risers.map((row) =>
              guideRow(
                row,
                watch.basis === "market"
                  ? `Up ${row.value.toFixed(1)}%`
                  : `${row.value.toFixed(1)} FPPG${row.games !== null ? ` · ${row.games} GP` : ""}`,
                designationNote(row),
              ),
            )}
          </ol>
          <p className={cs("caption")}>{watch.message}</p>
        </div>
      )}
      {!!best.length && (
        <div className={cs("recap")} data-guide-recap>
          <h3 className={cs("lead-title")}>
            Week {playerGuide.previousWeek} recap <span>· your roster</span>
          </h3>
          <div className={cs("recap-groups")}>
            <div>
              <p className={cs("recap-label")}>Your best</p>
              <ol className={cs("riser-rows")}>
                {best.map((row) =>
                  guideRow(row, `${row.value.toFixed(1)} pts${row.games !== null ? ` · ${row.games} GP` : ""}`, row.note),
                )}
              </ol>
            </div>
            <div>
              <p className={cs("recap-label")}>The rough week</p>
              <ol className={cs("riser-rows")}>
                {rough.map((row) =>
                  guideRow(row, `${row.value.toFixed(1)} pts${row.games !== null ? ` · ${row.games} GP` : ""}`, row.note),
                )}
              </ol>
            </div>
          </div>
          <p className={cs("caption")}>{playerGuide.period} — {playerGuide.recapMessage}</p>
          <p className={cs("caption")}>{playerGuide.coverage}</p>
        </div>
      )}
      {!best.length && (
        <p className={cs("caption")} data-guide-recap-status>
          {playerGuide.period} · {playerGuide.recapMessage}
        </p>
      )}
      {market && stamp && (
        <p className={cs("caption", "lead-footnote")}>
          Modeled prices · {market.pricingBasis === "preseason" ? "Preseason" : "In-season"} pricing · computed {stamp}.
        </p>
      )}
    </div>
  );
}
