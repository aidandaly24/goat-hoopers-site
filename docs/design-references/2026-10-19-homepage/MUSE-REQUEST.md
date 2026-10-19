# Implementation request for Muse — PR207

Aidan approved this revised visual direction for implementation and asked Dot
to share these references here. Keep PR207 as the sole implementation branch;
this reference branch introduces no production components or data behavior.

## Champion treatment — latest design correction

Remove the standalone tiny crown in the large black box beside the reigning-
champion text, immediately above “Know who you’re playing.” Delete that tile's
wrapper and reserved layout column too; do not leave an empty black panel.
Keep the champion identity, season/history/record/profile link and the existing
crown on the profile picture. No duplicate standalone decorative crown panel.
This supersedes the crown tile visible in the preserved screenshots. Muse owns
this ChampionShowcase composition change within PR207; no shared TeamAvatar
badge change is requested, and PR209 ownership remains separate.

## Default landing after login — cross-owner contract

The personalized homepage at `/` is Aidan's default destination after login.
The separate account/routing task owns redirect defaults and settings polish;
Muse owns the homepage and should coordinate that interface without taking over
those auth files. On the first navigation after successful login, the existing
server-verified session and claimed roster ID must already produce the correct
personal edition, without a manual reload or stale signed-out/other-team view.
Keep private viewer state request-scoped. Verify claimed, unclaimed, unavailable,
logout and account-switch cases with the routing owner; an unresolved team must
not be guessed from URL/display-name/client storage. Record a first-navigation
browser receipt with the final auth and homepage SHAs used together.

## Required composition and retained content

- Match the signed-in screenshot: court on the left, personal identity/record/
  matchup/own AI desk beside it; large headshots plus prominent team value and
  its meaningful chart **below the court**. Keep the full in-page value list,
  pricing coverage, computation time and valid rank accessible.
- Apply the same visual system to the public view. Integrate personalization
  naturally; retain every default content section rather than replacing it
  with links. The full team directory, source disclosures, player watches,
  news/moves, league faces, champion, standings/stats, tools and archive remain.
- Put all five league AI pairings down-page, with current team/manager avatars.
  Player headshots belong to player content. Preserve pairing selection and
  notes/provenance access. Use saved, ID-matched real results only.
- Only **STUD** and **CHUD** are oversized behind portraits; period subtitles
  remain small. Use genuinely supported last-season retrospective evidence now,
  or explicitly labeled editorial examples/unavailable states. Once weeks are
  complete, use the previous completed fantasy week and dates, never an
  incomplete current week. Do not invent award winners or treat DNP as poor form.
- Add restrained reveal/stagger/depth feedback that serves hierarchy. Keep
  keyboard/touch actions accessible, honor live reduced-motion changes and
  keep baseline content visible without JS. Avoid decorative loops and emojis.

## Remaining review fixes at 74f6d713

1. **Placement:** the new value/trend panel lives in the earlier face-off hero
   and the court follows full-width. That differs from the approved layout.
   Keep the court-side personal desk and the below-court faces/value/chart.
2. **Metric meaning:** `rosterValueTrend` reprices today's currently priced
   roster from player snapshots, with changing contributing coverage and an
   appended current modeled quote. It does not establish historical roster
   membership or historical team portfolio performance. If retained as an
   alternative metric, label it “Current roster repriced from recorded player
   quotes”, distinguish coverage and the current modeled endpoint, and do not
   present its raw delta as a comparable portfolio return. The requested
   historical team chart needs historical membership and at least two genuine,
   comparable recorded observations; otherwise show an honest unavailable state.
3. **Count/coverage:** one prior recorded player snapshot plus today's appended
   modeled quote is not two recorded historical team observations. A rising
   partial sum can reflect additional quote coverage. Add meaningful tests for
   roster changes, source basis, coverage gaps and actual recorded endpoints.
4. **Countdown:** retain the accepted epoch target `2026-10-20T19:00:00Z` and
   distinguish first NBA tip from unpublished Sleeper scoring-start time.
   Format the target through `Intl.DateTimeFormat('en-US', {timeZone:
   'America/New_York', timeZoneName:'short', ...})`, yielding 3:00pm EDT for
   this target and EST for winter targets. Test both DST transitions. Repair
   hydration/sample age and real device sleep/resume when the monotonic clock
   stalls; a new detector baseline is not a fresh trusted time sample. Reconcile
   conservatively or expose uncertainty. Keep one court clock, zero/started
   behavior, hidden-tab pause/resume and archive/no-edition visibility correct.
5. **Current identity:** use stable roster IDs and current Sleeper names/images
   without redeploy. APK's provider read found a new avatar ID, but no production
   rendered image was inspected, so the reported avatar symptom is unresolved.
   Coordinate with APK; `TeamAvatar` is shared with PR207/209. A 300s fetch
   setting or the mock rename test is not measured production freshness proof.

## Reply and review request

Please confirm you can open the four screenshots and interactive HTML, then
confirm you own the implementation round on PR207. Return a short requirement
checklist, the full new commit SHA, real-data/unavailable-state decisions and
desktop/390px/320px/zoom/long-name evidence. Include tests, typecheck, production
build and surface-contract results for that exact head. Preserve source-context,
AI matching, authentic historical/weekly periods, archive access and all-player
valuation disclosures. Update the stale QA capture/assertion entrypoint too.

Dot and Muse must agree on the exact final changes/head and resolve blockers
before merge. This design reference does not authorize fixture facts in
production, new paid AI generation, provider/DB mutations or an automatic merge.
