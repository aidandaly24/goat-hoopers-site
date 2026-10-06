# Art Direction Research — GOAT Hoopers Redesign

Researched 2026-10-06 via web search + text-fetch of source sites. Goal: kill the "AI slop" look (generic dark + gold + Anton/Inter) and find a distinctive, human, basketball-culture visual direction for the fantasy league site.

---

## 1. Puzzmo (Zach Gage × Orta Therox, Hearst)

The daily puzzle hub built by Zach Gage. What makes it feel crafted:

- **The layout concept IS the art direction.** The homepage is structured like a *newspaper games page* — columns of puzzle widgets, not a grid of feature cards. One structural idea ("a page read like a newspaper") does more work than any palette. Steal: our site should have one memorable structural concept too, not just a theme.
- **Progress "memorialized in pencil."** Solved puzzles show hand-drawn pencil marks on the page — the texture is newsprint + handwriting, not glassmorphism. Digital craft imitating analog rituals.
- **Warm, playful, rounded visual language.** Chunky rounded wordmark, flat illustrations with thick hand-drawn outlines, cream/paper background with orange and primary-color accents. It feels like a *breakfast companion*, not a SaaS product.
- **Social is a surface, not a feature.** Leaderboards, a community accolades feed, group stat-tracking, and instant live multiplayer are woven into the page layout — the equivalent for us: league chat, power rankings, and rivalries should be first-class surfaces, not buried tabs.
- **Editorial curation over algorithmic content.** Gage explicitly designs for "contemporary culture, not golf and yachts" — the content voice is opinionated and modern. Design lesson: the site's *copy voice* is part of the art direction.

*(Font names not verifiable from text sources — would need a live CSS inspection.)*

## 2. NYT Games / Wordle

What makes them feel editorial and timeless:

- **Typography carries 170 years of authority.** NYT Cheltenham headlines + the blackletter Fraktur masthead lineage (Ed Benguiat's 1967 refinement). The lesson: timelessness comes from committing to *one* typographic tradition, not from avoiding trends.
- **Wordle's restraint is a color decision.** Near-grayscale UI with exactly two signal colors (green/yellow feedback). Meditative, not minimal-by-template. Our equivalent: pick one or two signal colors for stat states (win/loss, hot/cold) and let everything else be ink and paper.
- **A human editor is the brand.** Wordle got a dedicated editor (Tracy Bennett) curating the word list — "editorial" is literal, not a vibe. For the league site: a "commissioner's desk" voice, weekly power-ranking writeups, matchup previews written like a columnist — that human authorship is what kills the AI feel.
- **Game cards with distinct identities.** The NYT Games app redesign gives each game its own card branding with progress surfaced on the card. Distinct per-surface branding > one global card component.

## 3. Sleeper (fantasy sports app)

How they do data density with personality:

- **Dark interface, but owned:** blue/purple/white with gray secondary text. (Note: this is adjacent to the AI-slop purple gradient — we should NOT borrow this palette; Sleeper owns it in fantasy.)
- **"Digital playground" framing.** The personality comes from a *mascot* — their little digital sports character — not from styling tricks. A character is cheaper and more distinctive than any gradient.
- **Chat-first, not table-first.** Tabs for Pick'em / Contests / **Chat**; league conversation is a core surface alongside the data. Data density is handled by minimalism + conversation, not by cramming more tables.
- **Two-column mobile pick displays, live feed, push notifications** — density via progressive disclosure and live updates rather than visible-everything dashboards.

## 4. Award-winning sports sites (Awwwards sports vertical, 2026)

- **"No Football Colors" (Awwwards HM, May 2026, by Local Studio)** — a media/e-commerce site "celebrating football as aesthetic culture," decoding and documenting the game. Type: **Obviously** (a condensed display serif) + **Poly** (a soft rounded serif). The move: treat *your sport as aesthetic culture* and write about it editorially. This is the closest reference to what GOAT Hoopers could be: a league site that's also a *culture publication*.
- **Audi F1 "Feel Every Second" (Awwwards HM, Apr 2026)** — built on *Formula 1 dashboard cues*: telemetry, precise technical readouts, "premium, modern and technically precise." The steal for fantasy: dense stats can look like **instruments, not dashboards** — lap-time typography, live deltas, telemetry strips.
- **Real font data from current sports sites** (via maxibestof.one, 2026): the actual vernacular is **condensed display grotesques + clean grotesques + monospace for data + serif accents**:
  - Druk + PP Neue Montreal (Champions for Good Club)
  - Azeret Mono + Manrope (Oreca)
  - ABC Diatype + Roboto Mono (Postnew)
  - Instrument Serif + PP Neue Montreal (Odd Ritual)
  - Neue Haas Grotesk (Good Sport Magazine)
  - GT Pressura Mono + Denim (Merrell) — **Pressura is a monospace built for stat tables**
  - Inter + Oldschool Grotesk + Protokoll (Veo)
  - Nivis Gear uses **Lo-Res OT** (pixel/display mono) + PP Neue Montreal
  - Nba Represent: New Science + Roboto Mono
- Pattern: **nobody** in the award-winning sports set is doing dark+gold+Anton/Inter. The 2026 sports vernacular is: condensed display type, monospace stat readouts, serif italic accents, light or off-black canvases.

## 5. Basketball culture aesthetics

What the culture's actual visual language is:

- **Flyer typography:** the working fonts are condensed + loud + hand-done — **Accidental Presidency** (tall condensed), **Bebas Neue Bold**, **Bowlby One** (chunky), **Finger Paint** (hand-painted), **Abuget** (graffiti script), Breakaway, Montserrat. The classic pairing: *bold condensed headline + graffiti script accent*.
- **AND1 era (1998–2005):** trash-talk tee culture ("the blacktop as a stage"), grainy VHS mixtape footage, DIY xerox energy. Gritty, low-fi, loud — basketball culture is *not* polished corporate.
- **Vintage trading cards:** halftone dot gradients, holographic/diamond **refractor foil** inserts, distressed screen-printed texture, 2:3 card ratios with rounded corners. Card culture = collectibility, which is exactly what fantasy rosters want to feel like.
- **Jersey typography:** condensed bold athletic block lettering built for broadcast clarity (Google Fonts equivalents: **Tourney**, **Graduate**).
- **Anti-patterns to avoid** (from a sports-brand UI blueprint found in research): black-and-neon "sports tech" skin; graffiti/gold-chain/boombox *clichés* as shortcuts; **every headline condensed-uppercase** (monotony); a vintage-newspaper *costume* with faux aging (decoration without structure). The trap is using culture as clip-art instead of as structure.

---

## Synthesis: 3 candidate art directions

### A. "The Broadcast Desk"
*One-line pitch:* A Sunday sports-section desk crossed with a live broadcast truck — editorial authority, stats rendered like instruments.

- **Type pairing:** Barlow Condensed (800, headlines — set huge, sentence case, *not* all-caps-everything) + Instrument Serif italic (accents: power-ranking titles, pull quotes, commissioner's column) + IBM Plex Mono (all stat tables, scores, deltas — tabular numerals everywhere) + Barlow (body).
- **Color story:** Warm paper canvas `#F5F1E8`, ink `#16150F`, one signal orange `#E8590C` (court/rust), one deep green `#2F6B4F` for "win" states, muted gray `#8A8578` for rules/lines. Light theme is itself the differentiator — every AI-slop fantasy site is dark.
- **Texture approach:** Halftone dot patterns on section headers, hairline rules and ticket-stub perforations as dividers, box scores set like newspaper agate type, subtle paper grain. Craft = print craft.
- **Usability:** Best of the three for dense data. Mono tabular figures make stat tables scannable; light canvas keeps long tables readable; serif accents give voice without cluttering.

### B. "Blacktop Zine"
*One-line pitch:* A photocopied streetball zine wheat-pasted on a fence — maximalist, hand-pasted, loud.

- **Type pairing:** Bebas Neue Bold (headlines, tilted -2°) + Permanent Marker (handwritten callouts: "chud of the week", trash talk) + Space Mono (data) + Archivo (body).
- **Color story:** Asphalt black `#101010`, wheat-paste cream `#EFE6D5`, spray orange `#FF4D00`, volt `#D8FF3D` as the single shock accent.
- **Texture approach:** Photocopy grain, torn-paper edges, masking-tape strips, marker underlines, collage layering, stamp/inked badges. Player photos get duotone + halftone treatment.
- **Usability:** Highest personality, highest risk. Dense tables fight the collage aesthetic — would need strict "zine frame, clean table inside" discipline. Best for hero/moments pages, hardest for standings/transactions.

### C. "The Card Shop" (Trading-Card Culture)
*One-line pitch:* The league as a collector's card set — every team a card, holo-foil inserts for the champions.

- **Type pairing:** Tourney or Graduate (athletic block headlines — actual jersey lettering DNA) + Zilla Slab (card names, labels) + IBM Plex Mono (stats on card backs) + Inter-adjacent clean sans for body… (swap to **Barlow** to avoid the slop combo).
- **Color story:** Deep felt green `#0E3B2E` or midnight navy `#101828`, card-stock cream `#F8F4E9`, true foil gold `#C9A227` used as *material* (gradient refractor sheen, not flat #FFD700), refractor rainbow reserved for champion/insert moments only.
- **Texture approach:** Holographic refractor gradients on hover, embossed borders, halftone player imagery, 2:3 card ratios with rounded corners, "slab label" components for awards (mimics graded-card slabs).
- **Usability:** Medium. Cards are great for teams/players/awards but card chrome fights dense tables — standings and transactions would need a "card back" (clean mono table) treatment. Strongest for identity and collectibility feel.

---

## Recommendation

**Go with A — "The Broadcast Desk" — as the base system, with C's card motifs as accent moments.**

Why A wins:
1. **It's the anti-slop move with substance.** Light paper + ink + one signal orange is instantly, unmistakably not dark+gold+Anton/Inter, and not Sleeper's dark purple. It differentiates on *canvas*, the hardest thing to fake.
2. **It's the real 2026 sports vernacular.** Condensed display + mono data + serif italic accents is what award-winning sports sites are actually shipping (Druk, Azeret Mono, GT Pressura, Instrument Serif). We'd be speaking the culture's current language, not a template's.
3. **Dense fantasy data stays usable.** Standings, rosters, transactions, and box scores live in mono tabular type on a light canvas — the most legible possible treatment — while personality comes from the display type, halftone, rules, and editorial voice. B and C both make tables fight the aesthetic; A makes the aesthetic *serve* the tables.
4. **The editorial layer is the personality engine.** A "commissioner's desk" voice — power rankings written like a columnist, matchup previews, the "chud of the week" in marker-style serif italic — gives the human-made feel no palette can. This is the Puzzmo/NYT lesson: craft lives in *voice + structure*, not decoration.

How to fold in C: team pages and player profiles get the trading-card treatment (2:3 cards, refractor-foil hover on the champion's card, slab labels for awards like "Waiver Wire Pickup of the Week"). Card culture as *moments*, not as the page system. Skip B's zine maximalism for the site chrome — but steal its energy for hype-video title cards and social graphics, where collage doesn't have to hold tables.

What to explicitly ban in the build: Anton/Inter pairing, flat gold `#FFD700` on dark, purple-blue gradients, all-caps condensed *everything*, generic rounded cards with drop shadows, graffiti clip-art. The slop checklist goes in the PR review notes.
