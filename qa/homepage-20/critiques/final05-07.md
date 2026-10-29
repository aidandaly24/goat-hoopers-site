# Final pixel check — iteration 07

**Ready for final design comparison. No P1 blocker found in the inspected evidence.** One nonblocking P2 label-wrap issue remains below. This is an independent design check, not formal PR or release approval.

Reviewed iteration HTML SHA-256: `f024a059ec698fd661f3e2993a38d99b7200ab59a574f20233cf7d4908e69818`. It matches both `iteration-07-captures.json` and the actual `iterations/07/index.html` checked during the focused control probe.

## Intended changes materialized

- **Phone first task:** the new member opening puts My team and View roster directly below the week heading. Both identities, 0.0/Pending scores, returned choice, distribution, confidence, saved time and provenance disclosure all appear before the court thumbnail. The original phone top put the court and a membership introduction ahead of the first pairing and offered only My team there. Public now exposes Explore the teams in the same early position. This fixes the specific hierarchy cost identified in the first critique while preserving the five-pair schedule hypothesis.
- **Saved result honesty:** the first pair visibly says `Returned choice: Ware the Hoes At? (35%)`; the distribution separately says `65% home` and `35% away`. `Confidence 20% · separate signal` and the saved timestamp are visible without opening provenance. The first three rows in the desktop top repeat that clear structure. The larger probability is not presented as the returned choice.
- **Court placement:** on phone the court supports the board after the first pair. Desktop retains its bounded supporting crop above the schedule. No essential matchup text is placed on the photo.
- **Directory:** the new middle captures put the current opponent under its own team/manager/record, while the linked leading modeled player remains alongside. This shortens the scan between identity and opponent and retains the integrated-face approach. It remains an open directory rather than becoming a second portrait gallery.

## Full-page continuity and visual condition

All four new full pages reach the final footer. Member sequence remains: five current/saved pair rows → team/value desk → scouting and completed-week/team-wire context → three dated editorial takes → happenings/source desk → market/trade/practice tools → complete directory with modeled faces → standings, unavailable stats/Power, transactions and both archive entries → footer. Public keeps the league/scouting context and shared reference while omitting the personal desk.

Native middle and bottom cuts show readable search/sort controls, row boundaries, player names, both archive entries and footer destinations. The final phone footer links remain inside the page. I saw no content clipping, colliding controls or obvious low-contrast essential text in these cuts. The slate/paper hierarchy remains consistent with the original. This is a visual observation, not a new measured contrast or universal accessibility claim.

**P2 — public desktop featured marker:** in `iteration-07-public-desktop-top.jpg`, the narrow left marker breaks `FEATURED` into `FEATUR` / `ED`. The word remains present and the actual team information is unaffected, so this does not block the comparison. Give that desktop marker enough width, use a shorter marker, or apply the deliberate phone-style vertical treatment; do not hide the label or introduce page overflow to keep it on one line.

## Actual checks and limits

I inspected these new files:

- All four `iteration-07-{member,public}-{desktop,phone}.jpg` full pages.
- All twelve corresponding native `-top.jpg`, `-middle.jpg` and `-bottom.jpg` cuts.
- Original `07-member-phone-top.jpg`, `07-member-desktop-top.jpg` and `07-member-desktop-middle.jpg` for the direct before/after comparison; the original broader critique remains in `reviewer05.md`.
- `iteration-07-verification.json` and `iteration-07-captures.json`.

Root reports all ten common cases passing, including separate 320px reflow and root-font 200% cases for member/public, plus preserved content in all four full captures. The manifest's section/footer positions agree with the visible sequence. Those are root's test results, not my independently repeated enlargement tests.

I additionally used installed Chromium/Playwright against the correct `qa/homepage-20/iterations/07/index.html` at 390×844 in member and public modes. In both, the menu opened with Enter, Escape closed it and restored summary focus, and Member/Public comparison links remained available inside Menu. The first pair's actual rendered text included the 35% returned choice, 65%/35% distribution, separate 20% confidence and saved time. The actual source hash matched the frozen hash above.

I did not repeat the entire search/sort matrix, measure contrast, run assistive technology, verify production routes/authentication or test physical devices. No design/source file was edited. No remaining blocker was identified for this static comparison.

## Correction follow-up — featured marker resolved

**Latest status: ready for final design comparison, with the previously recorded P2 resolved.** The original finding and frozen hash above remain as review history.

Final corrected HTML SHA-256, independently checked against `iterations/07/index.html`: `1c320a838eb70c81820c1bdc2de38d670b1ca5dd838e228b4a9d520581733dfb`.

I inspected the refreshed `iteration-07-public-desktop-top.jpg` and the actual public page in installed Chromium at 1440×1000. `FEATURED` now uses a deliberate vertical treatment as one unbroken word, rather than the previous `FEATUR` / `ED` wrap. The actual text range has one rectangle, at x132–147 and y486–548.86. It stays inside the first row and is clearly separated from the team links, which begin at x204. No label clipping, team-name collision or score collision was visible.

Root reports the refreshed four captures, ten common cases and targeted controls/states passing. I did not repeat that entire matrix for this correction; my new check was limited to the changed marker, its surrounding row and the final source hash. No source/design file was edited. No remaining finding blocks the static gallery comparison.
