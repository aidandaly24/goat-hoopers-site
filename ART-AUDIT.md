# Why the site looks AI — brutal audit (2026-10-06)

## The core problem
The design uses the single most common AI-generated aesthetic: **dark navy + gold accent + condensed display font + Inter body + card grids**. This is what every AI design tool produces when asked for "premium." Aidan's eye is right.

## Specific tells

### 1. Typography: the AI default stack
- **Anton** for display + **Inter** for body + **Geist Mono** for numbers. This exact trio (or Oswald/Bebas + Inter) appears in ~80% of AI-generated "premium dark" sites. Anton is a fine font but it's become the "I asked an AI for a bold headline font" signal.
- Every heading is `text-transform: uppercase` with slight letter-spacing. AI loves this because it makes any font look "designed."
- No typographic risks: no oversized numbers, no mixed sizes, no editorial contrast. Everything is the "right" size.

### 2. Card monoculture
- Literally everything is a `Card`: same `border-radius`, same `1px border`, same padding, same subtle top-sheen gradient. Standings, transactions, intel, teams — all identical containers.
- AI reaches for cards because they're safe: they create visual order without requiring actual layout decisions. A human art director would vary the containers: some sections borderless, some full-bleed, some overlapping.

### 3. The eyebrow-title formula
- Every section: small-caps gold eyebrow (0.7rem, 700 weight, 0.18em tracking) + big Anton title. Repeated identically across 10+ surfaces.
- This is the AI section-header template. It looks "designed" at a glance but reveals itself through repetition — a human would vary the introductions.

### 4. Gold everywhere = gold nowhere
- Gold eyebrow, gold hover states, gold badges, gold gradient text in hero, gold hairline under header, gold glow shadows. The accent color appears ~15 times per page.
- Rule: an accent used everywhere is not an accent. Real art direction rations the hero color.

### 5. Perfect symmetry, zero risk
- Hero is centered text. All content is max-width centered. Grids are even. Nothing overlaps, bleeds, tilts, or breaks the container.
- AI never takes layout risks because risks can look broken. But "never broken" reads as "never human."

### 6. Texture that's afraid of itself
- Film grain exists but at 5% opacity — invisible. The "arena glow" is three radial gradients at 6-10% opacity — invisible.
- These were added to check the "texture" box, not to be seen. Real texture should be *felt*.

### 7. Spacing without rhythm
- Everything on the same 8px scale with generous, even whitespace. No tight clusters, no dramatic gaps, no overlapping elements.
- Human editorial design varies density: tight score clusters next to airy feature moments.

### 8. "Broadcast" in name only
- Comments say "broadcast energy" but the visuals are SaaS dashboard: cards, badges, pills, tables.
- Real broadcast graphics: HUGE numbers, angled cuts, score bugs, lower thirds, ticker tapes, team-color takeovers. The site borrows the vocabulary without the visuals.

## What basketball culture actually looks like
(To be filled from research — streetball flyers, vintage cards, playground aesthetics.)
