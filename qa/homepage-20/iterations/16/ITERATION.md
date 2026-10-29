# Direction 16 — original-author iteration

## Concrete changes

Reviewer 08 and reviewer 12 advanced the two-edition hypothesis and identified the same opening costs: a giant repeated member identity, actions below the matchup, public phone scores delayed by the court, ambiguous roster-number boxes, repeated face actions and a tight standings spread. This revision preserves the audience split and changes those costs directly.

- Member: the 40px phone/68px desktop nameplate becomes a 24px/28px working identity. My team and View roster are adjacent immediately below/beside it. The checked timestamp is a compact line. Workspace anchors move after the matchup/value desk, rather than consuming the opening. The member matchup no longer repeats the action group.
- Public: desktop retains the broad original arena beside the current pairing. Phone orders both team/score rows ahead of the court, with a 32px functional title. Dated stale-draft context and both score states remain visible.
- Removed the boxed `01`/`02` identity ornaments from matchups, member identity and directory. Actual roster IDs remain in AI provenance and the verification hooks; there are no unlabeled rank-like boxes in the visible page.
- Replaced the overlapping shared-reference eyebrow/slogan with one League reference heading. AI Decides and happenings remain separate useful sections. Renamed the face index concisely; each value itself is now the price link, replacing ten repeated Price details labels while retaining every team/player/price destination. Phone faces use one compact portrait/player/owner/value row per team, which gives long identities room to wrap.
- Widened the standings side of the desktop directory split and added explicit separation around the team, W–L and PF columns. Full standings and roster content remain intact.
- Converted font-size declarations to root-relative units and added flexible wrapping where enlarged type needs it. The requested root-font 200% test now changes body text from 16px to 32px, instead of leaving pixel-sized text unchanged. No page-level overflow clipping is used.

The semantic palette, owned arena, synthetic/date labels, current zero/null states, complete shared inventory, distinct observed-form/price/editorial bases, saved returned choices and independent confidence are retained. No source app, production file, service, branch, commit or network data was changed.

## Measured opening changes

Local Chromium/Playwright at 390×844, after the existing fonts loaded; positions are document CSS pixels. These measurements describe the fixture and method, not a universal device result.

| Opening element | Frozen original | Iteration |
| --- | ---: | ---: |
| Member View roster action, workspace copy | y899 | y338 |
| Member second team/score row, bottom | y798 | y644 |
| Public second team/score row, bottom | y906 | y608 |
| Public original court, top | y417 | y794 |

At 320px, the second member row ends at y728 and the public row at y673, both within the 844px check viewport. The public court moves later only on phone; its broad desktop composition is preserved. Both editions remain visibly different at the same width.

## Checks on the final HTML

HTML SHA-256: `548194cbf937f413572fd95edba56759b826a32cb4ddd2ef1bf0650363564106`.

- Public/member at 1440, 390 and 320 CSS px, plus 390px with `html { font-size:200%!important }`: document width equals viewport and no JavaScript errors. The enlarged member heading is 48px versus 24px; public is 64px versus 32px. Body text is 32px versus 16px.
- Separately opened every native details element, including the menu, in both modes at 390, 320 and root-font 200% at 390. No page-width overflow; all images decode; editorial stat periods follow the stats without collision. No remote requests observed.
- Every ready state has exactly ten directory teams, ten faces, five saved AI pairs and 228 unique directory `/player/id` references. Member retains all 24 valuation rows. Public has zero personal wrappers, valuation rows, completed-week personal performers or personal wire.
- Exercised ready, stale and missing AI in both editions. Ready has five split bars. Stale has five visibly stale rows and no bars, retaining probabilities and returned choices. Missing shows unavailable and no saved pair rows/bars. The first returned choice remains Ware the Hoes At? with confidence 20%, independent of its 35% probability and Reaves Dropper’s 65%.
- Verified the current known 0.0 and Pending score labels in both modes and all AI states.
- Player search for Damian Lillard returns one team and opens its full roster. Manager search for TommyDieselfuel returns one team. Unmatched search shows the empty state; clearing restores all teams. A–Z team and standings sorting both place Huff n’ Puff first.
- Opened navigation, focused its last destination and pressed Escape: menu closes and focus returns to its summary.
- Visually inspected both revised 390px openings and the 1440px directory/standings spread. Bulk final captures and independent pixel review remain coordinator-owned.

The original files remain byte-identical: original HTML `3265e24909b626087c2741f39d46a4f5bd8e89e7158ab45df46e3c255ce1c958`; original DESIGN.md `a18d1ab78d5087b9b9b4f4b1e53aef75ccc903ab33ad2ceb1e5aae94e94eefe3`.

No remaining implementation blockers. Static checks do not establish external routes, authentication, backend behavior, native browser zoom, screen-reader acceptance, physical-device behavior or game operation. This iteration is ready for the coordinator’s common audit and capture pass.
