/**
 * GM IQ — manager archetypes from real season behavior.
 *
 * Each manager gets an archetype computed from what they actually did in a
 * completed season: how much they traded, how aggressively they worked the
 * wire, whether they hoarded picks or spent them, how young their roster
 * was, and how long they held players before dropping them.
 *
 * The pipeline is pure (rule 11's seam for the read path):
 *
 *   RawGmMetrics2025 (baked season artifact, src/data/)
 *     -> buildArchetypeProfiles (percentiles across the league's managers)
 *     -> assignArchetype (first match wins on the decision table below)
 *
 * Percentiles are computed WITHIN each season (a manager's rank against the
 * other nine GMs that season), so the gates stay meaningful if the league's
 * behavior shifts over time.
 *
 * Decision table (first match wins):
 *   1. tradeFrequency >= 90                                -> trade-addict
 *   2. wireAggression >= 85 && patience <= 15               -> dynasty-terrorist
 *   3. youthPreference <= 40 && draftCapital <= 35
 *      && wireAggression >= 50                             -> win-now
 *   4. draftCapital <= 10 (mortgaged the future)           -> win-now
 *   5. draftCapital >= 75 && wireAggression <= 30           -> hoarder
 *   6. youthPreference >= 85 && draftCapital >= 40         -> prospect-goblin
 *   7. youthPreference >= 60 && patience >= 60             -> rebuilder
 *   8. fixhimAdds >= 8                                    -> fix-him
 *   9. homerHerfindahl >= 0.088                           -> homer
 *  10. fallthrough                                        -> chaotic-neutral
 *
 * Honest limitations (also documented on the artifact):
 * - wireAggression is add VOLUME, not FAAB dollars — the 2025 season used
 *   rolling waivers, and no waiver_bid values exist in the transaction data.
 * - A manager with no timed add->drop stints keeps patience = null
 *   (unmeasured): it is never imputed, is shown as unavailable, and can
 *   never satisfy a measured-patience archetype gate. Patience percentiles
 *   are computed within the measured-only cohort.
 * - Roster 8 changed managers between seasons: the 2025 archetype describes
 *   slennox's management, never the current manager's (see priorManagerNote).
 */

export type MetricId =
  | "draftCapital"
  | "tradeFrequency"
  | "wireAggression"
  | "youthPreference"
  | "patience";

/** Labels and honest definitions for the five archetype metrics. */
export const METRIC_INFO: Record<
  MetricId,
  { label: string; definition: string }
> = {
  draftCapital: {
    label: "Draft capital",
    definition:
      "Round-weighted net future rookie picks acquired via trade (2026+ seasons only; R1=3, R2=2, R3+=1).",
  },
  tradeFrequency: {
    label: "Trade frequency",
    definition: "Trades participated in (each side counted once).",
  },
  wireAggression: {
    label: "Free-agent aggression",
    definition:
      "Waiver + free-agent adds (volume). 2025 used rolling waivers; no FAAB bids exist in the transaction data.",
  },
  youthPreference: {
    label: "Young-player preference",
    definition:
      "Inverse of final-roster mean age (younger roster = higher percentile).",
  },
  patience: {
    label: "Patience",
    definition:
      "Median days between adding and dropping the same player. Managers with no timed stints are shown as unmeasured — unmeasured metrics never satisfy an archetype gate.",
  },
};

export type ArchetypeId =
  | "win-now"
  | "rebuilder"
  | "prospect-goblin"
  | "trade-addict"
  | "hoarder"
  | "homer"
  | "chaotic-neutral"
  | "fix-him"
  | "dynasty-terrorist";

/** The nine archetypes — playful/roasty voice, computed from real behavior. */
export const ARCHETYPES: Record<
  ArchetypeId,
  { name: string; tagline: string }
> = {
  "win-now": {
    name: "The Win-Now GM",
    tagline: "The future is a rumor. The trophy is now.",
  },
  rebuilder: {
    name: "The Rebuilder",
    tagline: "Trust the process. Again.",
  },
  "prospect-goblin": {
    name: "The Prospect Goblin",
    tagline: "Has never met a 19-year-old he wouldn't stash.",
  },
  "trade-addict": {
    name: "The Trade Addict",
    tagline: "The trade block is his homepage.",
  },
  hoarder: {
    name: "The Hoarder",
    tagline: "Those picks are for looking at, not spending.",
  },
  homer: {
    name: "The Homer",
    tagline: "No bias here. Just loyalty.",
  },
  "chaotic-neutral": {
    name: "The Chaotic Neutral GM",
    tagline: "Nobody knows what he's doing. Including him.",
  },
  "fix-him": {
    name: "The \u201cI Can Fix Him\u201d GM",
    tagline: "Your trash is his treasure. Literally.",
  },
  "dynasty-terrorist": {
    name: "The Dynasty Terrorist",
    tagline: "He adds them. He drops them. He remembers none of them.",
  },
};

/**
 * Raw per-manager GM metrics for one season, as baked into the season
 * artifact (src/data/gm-archetypes-2025.ts). Lives here per rule 3:
 * the domain owns the league concept, the data layer only records it.
 */
export type RawGmMetrics2025 = {
  /** Season's Sleeper display name. */
  managerName: string;
  /** Season's team name, where known from league history. */
  teamName: string | null;
  /** Round-weighted net future rookie picks acquired (see METRIC_INFO). */
  draftCapital: number;
  /** Trades participated in. */
  trades: number;
  /** Waiver + free-agent adds (volume; no FAAB bids in 2025 data). */
  adds: number;
  /** Mean final-roster age in years. */
  avgAgeYears: number;
  /** Median add->drop tenure in days; null = no timed stints. */
  medianTenureDays: number | null;
  /** NBA-team concentration Herfindahl of the final roster. */
  homerHerfindahl: number;
  /** Reclamation adds (within 14d of another manager's drop). */
  fixhimAdds: number;
};

/** One season of GM behavior: percentiles, archetype, and attribution. */
export type SeasonArchetype = {
  /** e.g. "2025". */
  season: string;
  /** The manager whose behavior this describes. */
  managerName: string;
  /**
   * Never null for honest attribution: when a roster changed managers
   * between seasons, this names who actually managed that season.
   * Null when the manager is unchanged.
   */
  priorManagerNote: string | null;
  /** 0-100 percentiles within the season (null = unmeasurable). */
  metrics: Record<MetricId, number | null>;
  archetype: ArchetypeId;
};

/** Per-season GM history for one roster. v1 has one entry ("2025"). */
export type ManagerArchetype = {
  /** Sleeper roster id (as string, matching the Team domain). */
  rosterId: string;
  seasons: SeasonArchetype[];
};

/**
 * Percentile rank of v within values: round(100 * (# strictly below v) /
 * (n - 1)). Ties share the value — equal managers get equal percentiles.
 * With one or fewer values there is nothing to rank against, so the
 * result is the neutral 50.
 *
 * The strict-below tie convention is intentional. Precondition: `values`
 * must be the cohort `v` is ranked within — ranking a value against a
 * cohort it was not drawn from is meaningless. Callers guard this by
 * building the cohort and the ranked value from the same observations
 * (e.g. patience percentiles use the measured-tenure cohort only, and a
 * null tenure is never ranked at all).
 */
export function percentileRank(values: number[], v: number): number {
  const n = values.length;
  if (n <= 1) return 50;
  const below = values.filter((x) => x < v).length;
  return Math.round((100 * below) / (n - 1));
}

/**
 * The raw (non-percentile) signals assignArchetype needs beyond the five
 * metrics. Kept as one parameter so the decision table stays a pure
 * function of observable behavior.
 */
export type ArchetypeSignals = {
  /** 0-100 percentiles within the season (null = unmeasurable; a null metric never satisfies a gate). */
  metrics: Record<MetricId, number | null>;
  /** Reclamation adds (within 14d of another manager's drop). */
  fixhimAdds: number;
  /** NBA-team concentration Herfindahl of the final roster. */
  homerHerfindahl: number;
};

/**
 * Assign an archetype via the decision table (first match wins — see the
 * module doc comment). Gates needing a metric treat null as "no match",
 * so an unmeasurable metric can never trigger an archetype.
 */
export function assignArchetype(signals: ArchetypeSignals): ArchetypeId {
  const { metrics, fixhimAdds, homerHerfindahl } = signals;
  const atLeast = (id: MetricId, t: number): boolean => {
    const v = metrics[id];
    return v !== null && v >= t;
  };
  const atMost = (id: MetricId, t: number): boolean => {
    const v = metrics[id];
    return v !== null && v <= t;
  };

  if (atLeast("tradeFrequency", 90)) return "trade-addict";
  if (atLeast("wireAggression", 85) && atMost("patience", 15))
    return "dynasty-terrorist";
  if (
    atMost("youthPreference", 40) &&
    atMost("draftCapital", 35) &&
    atLeast("wireAggression", 50)
  )
    return "win-now";
  if (atMost("draftCapital", 10)) return "win-now";
  if (atLeast("draftCapital", 75) && atMost("wireAggression", 30))
    return "hoarder";
  if (atLeast("youthPreference", 85) && atLeast("draftCapital", 40))
    return "prospect-goblin";
  if (atLeast("youthPreference", 60) && atLeast("patience", 60))
    return "rebuilder";
  if (fixhimAdds >= 8) return "fix-him";
  if (homerHerfindahl >= 0.088) return "homer";
  return "chaotic-neutral";
}

/** Roster 8 changed managers between seasons — never attribute 2025 to NeuralNets. */
const PRIOR_MANAGER_NOTE_ROSTER_8 =
  "2025 \u00b7 managed then by slennox (QBs Gremlins) \u2014 not the current manager.";

/**
 * Build one ManagerArchetype per roster from a season's raw metrics.
 * Computes the five 0-100 percentiles per manager (youth from negated
 * avgAgeYears). A null tenure is preserved as an unmeasured (null)
 * patience metric: it ranks nobody, satisfies no measured-patience gate,
 * and renders as unavailable. Patience percentiles for measured managers
 * are computed within the measured-tenure cohort only. Pure: same raw
 * in, same profiles out.
 */
export function buildArchetypeProfiles(
  raw: Record<string, RawGmMetrics2025>,
): ManagerArchetype[] {
  const entries = Object.entries(raw);
  const draftCapitals = entries.map(([, r]) => r.draftCapital);
  const tradeCounts = entries.map(([, r]) => r.trades);
  const addCounts = entries.map(([, r]) => r.adds);
  const youthScores = entries.map(([, r]) => -r.avgAgeYears);
  const measuredTenures = entries
    .map(([, r]) => r.medianTenureDays)
    .filter((t): t is number => t !== null);

  return entries
    .map(([rosterId, r]) => {
      const metrics: Record<MetricId, number | null> = {
        draftCapital: percentileRank(draftCapitals, r.draftCapital),
        tradeFrequency: percentileRank(tradeCounts, r.trades),
        wireAggression: percentileRank(addCounts, r.adds),
        youthPreference: percentileRank(youthScores, -r.avgAgeYears),
        patience:
          r.medianTenureDays === null
            ? null
            : percentileRank(measuredTenures, r.medianTenureDays),
      };
      const archetype = assignArchetype({
        metrics,
        fixhimAdds: r.fixhimAdds,
        homerHerfindahl: r.homerHerfindahl,
      });
      const season: SeasonArchetype = {
        season: "2025",
        managerName: r.managerName,
        priorManagerNote:
          rosterId === "8" ? PRIOR_MANAGER_NOTE_ROSTER_8 : null,
        metrics,
        archetype,
      };
      return { rosterId, seasons: [season] };
    })
    .sort((a, b) => Number(a.rosterId) - Number(b.rosterId));
}

/**
 * The last stored season's archetype. "Current" means last stored, not
 * automatically the current manager: a season's archetype describes the
 * manager who ran that season (see priorManagerNote), and the roster 8
 * exception must not be read as a claim of safe multi-season attribution.
 */
export function currentArchetype(p: ManagerArchetype): ArchetypeId | null {
  return p.seasons.length > 0
    ? p.seasons[p.seasons.length - 1].archetype
    : null;
}
