import type { ManagerArchetype, MetricId } from "@/domain";
import { ARCHETYPES, METRIC_INFO } from "@/domain";
import { Card } from "@/ui/Card";
import { SectionHeading } from "@/ui/SectionHeading";
import styles from "./GmArchetypeCard.module.css";

/**
 * teams — the GM IQ card: one manager's archetype from real season behavior.
 *
 * Contract:
 * - Receives `archetype` (ManagerArchetype | null). Renders the current
 *   season's archetype name (display face) + tagline, the five percentile
 *   bars (label + mono .gh-num value + bar; definitions as tooltips),
 *   the season label, and the prior-manager note when the roster changed
 *   managers between seasons.
 * - A null archetype renders an honest empty state, never fake numbers.
 * - Pure presentational: no fetching (rule 6), ui primitives + --gh-*
 *   tokens only (rule 5), mobile-first with 2-col desktop (rule 7).
 */
const METRIC_ORDER: MetricId[] = [
  "draftCapital",
  "tradeFrequency",
  "wireAggression",
  "youthPreference",
  "patience",
];

export function GmArchetypeCard({
  archetype,
}: {
  archetype: ManagerArchetype | null;
}) {
  const season =
    archetype && archetype.seasons.length > 0
      ? archetype.seasons[archetype.seasons.length - 1]
      : null;

  if (!season) {
    return (
      <Card>
        <SectionHeading eyebrow="GM IQ" title="No archetype yet" />
        <p className={styles.empty}>
          No completed-season GM data on file for this manager — archetypes
          are computed from real season behavior, never invented.
        </p>
      </Card>
    );
  }

  const info = ARCHETYPES[season.archetype];

  return (
    <Card>
      <SectionHeading eyebrow="GM IQ" title={info.name} />
      <div className={styles.body}>
        <div className={styles.intro}>
          <p className={styles.tagline}>{info.tagline}</p>
          <p className={styles.season}>
            <span className="gh-num">{season.season}</span> season · computed
            from real in-season behavior
          </p>
          {season.priorManagerNote && (
            <p className={styles.priorNote}>{season.priorManagerNote}</p>
          )}
        </div>
        <div className={styles.metrics}>
          {METRIC_ORDER.map((id) => {
            const v = season.metrics[id];
            const label = METRIC_INFO[id].label;
            return (
              <div key={id} className={styles.metric}>
                <div className={styles.metricHead}>
                  <span title={METRIC_INFO[id].definition}>{label}</span>
                  <span className="gh-num">{v === null ? "—" : v}</span>
                </div>
                <div
                  className={styles.barTrack}
                  role="img"
                  aria-label={`${label}: ${
                    v === null ? "unmeasured" : `${v}th percentile`
                  }`}
                >
                  <div
                    className={styles.barFill}
                    style={{ width: `${v ?? 0}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
