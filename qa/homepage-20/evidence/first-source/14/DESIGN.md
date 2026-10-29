# Direction 14 — Franchise Wall / League Register

The user question is “Who is in this league, and what matters for my team?” The
first action is to open a team or its full roster; the selected current pairing
is adjacent, and a member can use the first franchise row’s My team link or the
separate personal desk’s primary My team action.

## Composition

The ten franchises form a compact continuous register rather than ten banners
or separate cards. Large, tightly set team names, manager handles, numbered
franchise marks and canonical team-color underlines establish identity. Each row
contains a real local portrait (or labelled initials), its highest modeled player
and value, the current opponent and a native full-roster disclosure. Only the
two selected franchises receive a white paper field. The 2025 champion is labelled
in its ordinary row; there is no dedicated champion showcase.

A court desk pairs the original arena photograph with current scores and manager
identities. The photograph keeps its 16:9 crop and carries no overlaid text. It
links to free-throw practice. Selecting View pairing updates the desk from the
current directory matchup, retains button focus on desktop, and moves focus to
the court heading on phones. The default member pair uses the member’s own team.
The desk is sticky inside the opening register on wide screens, then stops before
the personal desk.

A white working sheet separates the member’s roster value, full 24-player value
list, top three values, observed-form watch, team wire and completed-week
performers from the league register. Completed-week points and GP retain their
exact supplied source period and coverage. A player shared between best and
rough selections appears once with explicit overlap attribution.

Below it, all five saved AI pairs form an open comparison list with probabilities,
actual returned choices, separate confidence and native provenance disclosures.
The lower notebook retains all three dated sample takes, sourced stats, opinions
and selection reasons. Standings, league happenings, transactions, unavailable
Power/statistics, market/trade destinations, the genuine game preview, both
weekly archive entries and source details remain accessible.

## Type and material

The palette uses the canonical Paper + Slate semantic roles from base.css and
src/ui/tokens.css. Existing Inter supplies names and editorial hierarchy; Geist
Mono supplies dates, franchise numbers, scores and financial figures. White is
reserved for selected rows and the member work area. Team colors occur only as
small decorative identity marks; essential text remains readable neutral ink.
No new font, asset, scene runtime, framework or service was introduced. No motion
is authored; the shared reduced-motion reset remains active.

## Responsive behavior and controls

At desktop widths the register and court desk share the opening spread. On
phones the current pairing and useful court image precede the searchable
register, followed by the member sheet and complete lower inventory. All names
wrap. Rosters become one-column lists on the smallest layout. Standings retain
rank, name, W/L/T and PF without a page-level scroll container.

Search matches team, manager or any full roster-player name; a live count and an
empty-result message expose the result. Register order supports franchise
number, team name, roster size and points for. Standings have a separate useful
sort select. Native roster disclosure states survive search and sorting. A
nonmodal navigation disclosure provides every league destination; Escape closes
it and restores focus. Native links and details avoid modal traps. Phone
controls/disclosures use 44px targets; text links embedded in prose retain inline
semantics. Keyboard focus uses the shared visible focus role.

## Honesty and states

A prominent compact warning labels all current records, scores, prices, form,
news and AI as synthetic. The source’s current known 0.0 and null Pending score
remain distinct and the matchup is Incomplete. Old Oct 5–11 draft editorial is
labelled stale and separate from the current Week 3 pairing. The fixture’s old
edition narrative names a different opponent from its edition pair IDs; this is
explained in the dated context disclosure and never drives the current pair.

?ai=stale labels the desk and saved slate visibly stale, retaining the dated saved
probabilities. ?ai=missing retains all five current pair identities and explicit
Unavailable output. Each actual returned model choice is printed directly,
including when it differs from the larger probability. Model, prompt, timestamp,
evidence and unavailable input-snapshot/baseline states are in each disclosure.
No AI generation, data calls, pricing history, additional statistics or awards
are invented. Observed form, modeled prices and dated editorial use separate
labels and periods. Public mode has no member data; it retains league context,
all ten faces and the full directory.

## Verification — static fixture, Chromium

Checked 2026-10-29 at the authored static route on 127.0.0.1:4198, using installed
Playwright and /usr/bin/chromium. This evidence applies to the authored HTML,
not the production Next.js/auth/backend runtime.

- Member and public at 1440, 390 and 320 CSS pixels: ready hook rendered, zero
  JavaScript page errors, no page-width overflow with every native disclosure
  open, ten directory teams, ten faces, five saved pairs, ten standings rows and
  228 unique directory player destinations. Member retains all 24 values.
- Separately enlarged every element’s computed font size to 200% at 1440 CSS
  pixels, with every disclosure open: no page-width overflow. This is a synthetic
  text-enlargement check, not a claim of physical browser zoom acceptance.
- Functional manager and player search, empty search result, roster-size sort,
  standings alphabetical sort, pairing selection and desktop focus restoration
  passed. Keyboard Tab reached the skip link; Enter opened Menu and Escape
  closed it and restored summary focus.
- Stale and missing AI states passed visible status checks in both the court
  desk and saved-slate section. Five current pairs remain in both states.
- Rendered desktop opening, phone opening, member desk and lower notebook were
  visually inspected. Local image load checks found no broken image URLs.
- Opaque rendered color-pair contrast calculations: main ink/paper 12.70:1;
  secondary/paper 5.15:1; secondary/white 5.67:1; accent/paper 6.56:1;
  white/accent 7.22:1; live-state ink/paper 5.51:1. Team marks are decorative.

Index SHA-256: `5b92cf1309c5e351bde1b5593dcee9db2fe8c449bdb19ed6cf50defcfd369768`

## Limits

The links target the repository’s documented production routes. This static
server does not prove the full Arcade play/reset/exit flow, Next history
restoration, real authentication, live data, physical-device behavior or a
screen-reader pass. No production source, shared inventory, branch, commit,
GitHub state or deployment was changed. The first submission was authored blind
to other directions and previous mock screenshots. No remaining implementation
blocker.
