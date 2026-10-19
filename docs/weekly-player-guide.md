# Personal weekly player guide

The personalized homepage reuses one public-data projection for all roster IDs.
`domain/team-player-guide.ts` defines the evidence boundary; the surface never
fetches data or starts a model call.

- Players to Watch in season: explicitly season-tagged EMA fantasy PPG across
  the printed number of observed games, with at least two games. This is form,
  not a weekly score projection. Known Out/IR/Suspended/Doubtful and verified
  zero-schedule players are omitted; unknown status remains labelled.
- Preseason: positive modeled-price change with a positive known prior snapshot,
  labelled Rising value / market movement. No fixed 24-hour interval is implied.
- Your Best and The Rough Week: descending/ascending actual recorded fantasy
  points in the exact completed previous source week, only for current roster
  members with verified positive games played. Known zero points remains valid;
  DNP, unknown games and missing points never become a poor-performance zero.
  Counts and supplied injury context remain visible; sparse cohorts may overlap.
- Source season/week/team and explicit half-open period dates must match. A
  future end instant or incomplete week cannot be ranked. Week 1 never borrows
  last season, and a season can legitimately cross the calendar-year boundary.

## Current live-source limitation

The additive `getHomePlayerGuideSources` hook only projects information already
loaded by the ticker's same-request market-input cache. It makes no additional
provider/SQL call and never invokes a snapshot save. The existing stat-profile
cache does not establish the season/window of its EMA; its game updater is not
wired. Existing matchup types do not supply verified player-level weekly points
and participation. Schedule/projection evidence is also unavailable. Therefore
`formSeason`, `completedWeek` and `scheduledGames` remain null. Production shows
honest unavailable states for those lists; synthetic fixture rows are never
used by the public route. Current injury flags alone do not describe last week's
participation. Season totals and market prices are never relabelled weekly form.

[Muse adapter issue #190](https://github.com/aidandaly24/goat-hoopers-site/issues/190)
claims separate new data/tests/docs paths. Muse must establish a supported source,
week completion, actual participation and provenance before Dot integrates it.
The issue requires a bounded shared slim cache, source/byte/TTL justification,
week/season boundary and sparse/injury tests, no paid call or per-player fanout,
and no production database/auth/infrastructure changes. Adapter ownership is
pending acknowledgment until Muse replies; the homepage core is independent.

## Current roster valuation

`domain/roster-value.ts` is a shared pure helper for the personal edition and
other team consumers. It sums unique current roster IDs in integer cents, keeps
missing quotes unknown, distinguishes a known empty roster from an unavailable
roster, and exposes priced/unpriced coverage. A partial sum is labelled a
known-value subtotal. League value ranks require complete current pricing for
every compared roster; equal totals share rank. Full player values and the top
three reuse the same source quotes. This is a current-roster snapshot, not a
historical team-value series or a sum of historical values for today's roster.
