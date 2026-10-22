import Link from "next/link";
import type { HomeTeamSummary } from "@/domain/personalized-home";
import type { TeamValueHistoryEnvelope } from "@/domain/team-value-history";
import { SectionHeading } from "@/ui/SectionHeading";
import { cs } from "./CourtsideStyles";
import { formatHomeStamp } from "./homeFormat";
import { RosterValuationDetails } from "./CourtsideFeature";
import { ValueTrendLine } from "./ValueTrendLine";
import { RosterPortraitStage } from "./RosterPortraitStage";
import { TeamValueHistory } from "./TeamValueHistory";
import styles from "./RosterValueSection.module.css";

/**
 * Below the court, the member's roster value in the approved composition:
 * overlapping player cutouts over the team's filled name, and the value at
 * display size — rendered exactly once on the page, here — with the
 * recorded repricing chart or its honest unavailable state, and the full
 * all-player valuation disclosure. Portraits resolve through the same
 * fixed Sleeper→ESPN map as everywhere else; a face never falls back to
 * an initials disc at this size unless no portrait exists at all.
 *
 * When the recorded team-value history envelope is available (issue
 * #217), it supersedes the repricing trend line: the chart below the
 * panel is the true replayed series with explicit gaps, and detail
 * loads on inspection through the v1 routes.
 */
export function RosterValueSection({ summary, portraits, teamHistory }: {
  summary: HomeTeamSummary;
  portraits: Record<string, string>;
  teamHistory?: TeamValueHistoryEnvelope | null;
}) {
  const { team, valuation, coverage, market } = summary;
  const total = valuation.total;
  const dollars = total !== null ? Math.floor(total) : null;
  const cents = total !== null ? Math.round((total - Math.floor(total)) * 100) : null;
  const stamp = formatHomeStamp(market?.updatedAt);
  return (
    <section className={styles.section} data-roster-value aria-label="The value of your roster">
      <SectionHeading
        eyebrow="Player values"
        title="Your roster."
        action={<Link className={cs("text-link")} href={`/teams/${team.id}#team-roster`} prefetch={false}>Full roster valuation</Link>}
      />
      <div className={styles.layout}>
        <RosterPortraitStage team={team} players={summary.players} portraits={portraits} />
        <div className={styles.panel}>
          <p className={styles.label}>Roster value · FAAB</p>
          {total === null || dollars === null || cents === null ? (
            <p className={styles.unavailable} data-value-unavailable>
              Roster value unavailable. Current player prices could not be verified.
            </p>
          ) : (
            <>
              <p className={styles.total} data-team-value>
                ${dollars.toLocaleString("en-US")}<span className={styles.cents}>.{String(cents).padStart(2, "0")}</span>
              </p>
              <p className={styles.meta}>
                {valuation.complete
                  ? `${coverage.roster} of ${coverage.roster} players priced`
                  : `Known-value subtotal · ${coverage.priced} of ${coverage.roster} priced · ${valuation.unpriced} unpriced`}
                {market && <> · {market.pricingBasis === "preseason" ? "Preseason" : "In-season"} modeled prices{stamp ? ` · updated ${stamp}` : ""}</>}
              </p>
              {valuation.rank && (
                <p className={styles.rank}>
                  {valuation.rank.tied ? "Joint value rank" : "Value rank"} <span className="gh-num">No. {valuation.rank.rank} of {valuation.rank.teams}</span>
                </p>
              )}
              {!teamHistory && (summary.valueTrend
                ? <ValueTrendLine trend={summary.valueTrend} />
                : (
                  <p className={cs("trend-unavailable")} data-trend-unavailable>
                    Recorded team-value history unavailable — fewer than two recorded price snapshots exist for this roster, so no line is drawn.
                  </p>
                ))}
            </>
          )}
          <RosterValuationDetails summary={summary} />
        </div>
      </div>
      {teamHistory && (
        <TeamValueHistory
          history={teamHistory}
          detailEndpoint="/api/team-value-history/detail"
          pageEndpoint="/api/team-value-history/summary"
          currentValue={{ team: { id: team.id }, market, valuation: {
            total: valuation.total, priced: valuation.priced, unpriced: valuation.unpriced,
            complete: valuation.complete, knownRoster: valuation.knownRoster,
          } }}
        />
      )}
    </section>
  );
}
