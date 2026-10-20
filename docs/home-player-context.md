# Compact homepage player context

Implements the presentation portion of [issue224](https://github.com/aidandaly24/goat-hoopers-site/issues/224).

`ScoutingNotebook` uses supplied guide rows first, then the supplied top-value
roster summary. Each compact row identifies its basis: modeled price movement,
observed EMA/sample size, current modeled asset price, or a dated editorial
selection. Player names retain their profile links. Team identity, actual supplied
status and cited editorial sources remain available. It fetches no extra data.

`FormGuideWire` renders actual weekly points and GP only from the existing
`CompletedPlayerWeek` domain gate. Small or overlapping high/low selections are
deduplicated; ties disclose displayed/eligible coverage. Other supported cohorts
show highest and lowest totals alongside playing volume, without an unsupported
underperformance verdict. A played zero is retained; DNP and unknown GP are
excluded. No completed source week means a compact status, and an empty available
wire consumes no column. Real headlines, moves and an unavailable-news notice stay.

The existing `Reveal` wrapper never hides waiting content. Its finite entrance
starts at any intersection, including tall modules with enlarged text. Initial
reduced motion/hidden documents skip it. Preference/visibility changes, animation
completion and unmount release observers/listeners; queued callbacks cannot
restart a cancelled entrance. Small hover/focus feedback uses existing tokens.

## Evidence and limits

The offline [fixture](../qa/home-player-context/README.md) exercises production
components with synthetic inputs and forbids network in static verification.
Nineteen static cases cover all ten teams, legitimate zero/GP, DNP, six distinct
participants, tied six/four-player selections, value-only fallback, preseason,
source failure, missing edition and public state. An independent read-only
review also exercised eight production-effect Reveal lifecycle cases.

Mac Chrome checks covered 320px long names, 390px normal/enlarged text, 1440px
desktop, light/dark themes, failed portrait fallback, native disclosure and player
link navigation/Back. Saved screenshots and measured DOM results accompany the
fixture. These are component/browser checks, not full Next routing or source-data
validation. Reduced-motion lifecycle is tested with synthetic media-query events;
the Mac's system preferences are unchanged.

The additional combined320px/200% text check reproduces the independent history
review's pre-existing whole-page overflow: page scroll width359px. The owned
notebook/form sections each stay within256px and do not overflow. Existing league
standings stat tracks and the activity-feed own-team tag extend beyond the page;
portrait-stage visual bounds are separately clipped. These shared layout findings
are returned to Muse's independent audit, rather than modifying the held history
implementation or claiming that the whole page passes this combined case.

The local locked install failed with ENOSPC; the installed default Node25 also
does not satisfy the pinned Vitest5 engine. Full Vitest, TypeScript and production
Next build remain required on the final source head before integration. The tiny
fixture uses lock-verified React packages and an existing esbuild runtime; it does
not replace those gates.

The production home source still supplies no `formSeason`, `scheduledGames` or
`completedWeek`. This change does not claim automatic weekly population. Held
source PR197 remains points-only with unknown GP and no exact completed-period
contract, so it is not promoted into this recap. PR225 history-owned files and
held218/222/223 are untouched. Player/pick asset Value and legal-lineup Power
remain separate work with their accepted owners in224.
