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
 *   season's archetype name (display face) + tagline, the five metric bars
 *   (label + mono value with a visible percentile unit + bar; definitions
 *   in a keyboard/touch-accessible disclosure under each label, never
 *   hover-only), the season label, and the prior-manager note when the
 *   roster changed managers between seasons.
 * - A null archetype renders an honest empty state, never fake numbers.
 * - An unmeasured (null) metric renders as "—" with a visible "n/a" unit
 *   and an empty bar: unavailable is never dressed up as a measured value.
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
          <p className={styles.metricScale}>
            League percentiles (0–100) vs that season&apos;s GMs — higher is
            more of the named behavior
          </p>
          {METRIC_ORDER.map((id) => {
            const v = season.metrics[id];
            const { label, definition } = METRIC_INFO[id];
            return (
              <details key={id} className={styles.metric}>
                <summary className={styles.metricHead}>
                  <span className={styles.label}>
                    {label}
                    <span className={styles.info} aria-hidden="true">
                      i
                    </span>
                  </span>
                  <span className="gh-num">
                    {v === null ? (
                      <>
                        —
                        <span className={styles.unit}>n/a</span>
                      </>
                    ) : (
                      <>
                        {v}
                        <span className={styles.unit}>pct</span>
                      </>
                    )}
                  </span>
                </summary>
                <p className={styles.definition}>{definition}</p>
                <div
                  className={styles.barTrack}
                  role="img"
                  aria-label={
                    v === null
                      ? `${label}: unmeasured`
                      : `${label}: ${v}th percentile`
                  }
                >
                  <div
                    className={styles.barFill}
                    style={{ width: `${v ?? 0}%` }}
                  />
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
