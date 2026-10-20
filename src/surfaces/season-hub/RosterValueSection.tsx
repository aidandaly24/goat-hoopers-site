import type { CSSProperties } from "react";
import Link from "next/link";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import { PlayerHeadshot } from "@/ui/PlayerHeadshot";
import { SectionHeading } from "@/ui/SectionHeading";
import { teamColorVar } from "@/ui/teamColors";
import { cs } from "./CourtsideStyles";
import { formatHomeStamp } from "./homeFormat";
import { RosterValuationDetails } from "./CourtsideFeature";
import { ValueTrendLine } from "./ValueTrendLine";

/**
 * Below the court, the member's roster value in the approved composition:
 * the top faces LARGE over the team's outlined name, and the team value at
 * display size — rendered exactly once on the page, here — with the
 * recorded repricing chart or its honest unavailable state, and the full
 * all-player valuation disclosure. Portraits resolve through the same
 * fixed Sleeper→ESPN map as everywhere else; a face never falls back to
 * an initials disc at this size unless no portrait exists at all.
 */
export function RosterValueSection({ summary, portraits }: {
  summary: HomeTeamSummary;
  portraits: Record<string, string>;
}) {
  const { team, valuation, coverage, market } = summary;
  const total = valuation.total;
  const dollars = total !== null ? Math.floor(total) : null;
  const cents = total !== null ? Math.round((total - Math.floor(total)) * 100) : null;
  const stamp = formatHomeStamp(market?.updatedAt);
  return (
    <section className={cs("value-section")} data-roster-value aria-label="The value of your roster">
      <SectionHeading
        eyebrow="The value of your roster"
        title="Built around your players."
        action={<Link className={cs("text-link")} href={`/teams/${team.id}#team-roster`} prefetch={false}>Full roster valuation</Link>}
      />
      <div className={cs("value-layout")}>
        <div className={cs("value-faces")} style={{ "--card-glow": teamColorVar(team.id) } as CSSProperties}>
          <p className={cs("value-outline")} aria-hidden="true">{team.name}</p>
          {!!summary.players.length && (
            <ul className={cs("value-face-list")}>
              {summary.players.map((player) => (
                <li key={player.id}>
                  <Link href={`/player/${player.id}`} prefetch={false} className={cs("value-face")}>
                    <PlayerHeadshot portraitSrc={portraits[player.id]} espnId={player.espnId} name={player.name} teamId={team.id} size={188} />
                    <span className={cs("value-face-pos")}>{player.position ?? "Position unavailable"}</span>
                    <span className={cs("value-face-name")}>{player.name}</span>
                    <span className={cs("value-face-price", "gh-num")}>${player.value.toFixed(2)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className={cs("chip", "value-faces-chip")}>Your roster · Featured faces</p>
        </div>
        <div className={cs("value-panel")}>
          <p className={cs("desk-label")}>Team value · FAAB</p>
          {total === null || dollars === null || cents === null ? (
            <p className={cs("value-unavailable")} data-value-unavailable>
              Roster value unavailable — no current modeled price could be verified for this roster, so no total is shown rather than a partial one dressed as complete.
            </p>
          ) : (
            <>
              <p className={cs("value-big", "gh-num")} data-team-value>
                ${dollars.toLocaleString("en-US")}<span className={cs("value-cents")}>.{String(cents).padStart(2, "0")}</span>
              </p>
              <p className={cs("value-meta")}>
                {valuation.complete
                  ? `All ${coverage.roster} roster players priced.`
                  : `Known-value subtotal · ${coverage.priced} of ${coverage.roster} priced · ${valuation.unpriced} unpriced — unknown is never $0.`}
                {market && <> Modeled prices · {market.pricingBasis === "preseason" ? "Preseason" : "In-season"} pricing{stamp ? ` · computed ${stamp}` : ""}.</>}
              </p>
              {valuation.rank && (
                <p className={cs("value-rank")}>
                  Roster value <span className="gh-num">No. {valuation.rank.rank} of {valuation.rank.teams}</span>{valuation.rank.tied ? " · tied" : ""} · comparable complete rosters only
                </p>
              )}
              {summary.valueTrend
                ? <ValueTrendLine trend={summary.valueTrend} />
                : (
                  <p className={cs("trend-unavailable")} data-trend-unavailable>
                    Recorded team-value history unavailable — fewer than two recorded price snapshots exist for this roster, so no line is drawn.
                  </p>
                )}
            </>
          )}
          <RosterValuationDetails summary={summary} />
        </div>
      </div>
    </section>
  );
}
