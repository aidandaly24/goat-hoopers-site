# Twenty independent homepage studies

Twenty actual fresh-context authors completed twenty first submissions. Each received the same league information fixture, accessibility constraints and isolation rules, plus a different composition starting hypothesis. The full authorship ledger records `/root/mock01` through `/root/mock20`, each started with `fork_turns: none`. Root supplied data, tokens, gallery and audit infrastructure; each author supplied their own complete HTML, CSS, section structure and controls. Blindness was an instruction boundary in a shared filesystem, not technical isolation.

Every first submission remains unchanged in `directions/NN/` and has an additional frozen source copy under `evidence/first-source/NN/`. The first-round freeze is `9e4fb6ac941469f684b342c1387c8cb4563a3e81`. Later repairs and design iterations are separate files, never replacements disguised as the originals.

## Browse and compare

Run the static server described in [README.md](README.md), then open [the QA gallery](index.html). Choose member/public and desktop/phone. Each direction links to its complete actual render, working mock and author rationale. The gallery preserves all twenty alternatives, seven separately labelled enlargement repairs, and three separately labelled design iterations. The previous #271 benchmark remains available at `64b9971f88ad1f73f5bd00ac0fdef9019909561b`.

- [All twenty desktop openings](evidence/contact-desktop.jpg)
- [All twenty phone openings](evidence/contact-phone.jpg)
- [Before / after member phone openings](evidence/comparison-phone.jpg)
- [Author ledger](author-ledger.json)
- [Shared information and truthfulness brief](BRIEF.md)

The portable HTML deliverable contains full-resolution optimized images of all 80 original states, the 12 design-iteration states and four preserved benchmark states. It is self-contained and is an image comparison tool. Managed Chromium blocks file:// navigation with ERR_BLOCKED_BY_ADMINISTRATOR; browser checks instead render the already-readable HTML bytes with no network requests. A normal local-file launch is not independently verified in this managed browser. The repository gallery additionally opens the actual interactive mocks and separate repaired versions. The original JPEGs remain available here, each below 900 KB.

## Independent critique and shortlist

Three authors outside the initial six-direction shortlist examined actual pixels before sharing their conclusions. They did not review their own directions or read one another's critiques before submitting. They did not give formal PR approval.

| Critic | Proposed advances | Useful distinction |
| --- | --- | --- |
| [05](critiques/reviewer05.md) | 07, 01, 18; reserve 09 | League slate, editorial publication, athletic opening |
| [08](critiques/reviewer08.md) | 07, 16, 18 | Integrated schedule, genuinely separate editions, bounded scene |
| [12](critiques/reviewer12.md) | 09, 16, 18 | Dense working reference, audience hierarchy, night practice |

Root selected **07, 16 and 18** for further exploration because they retain different structural ideas and address the user's request for useful league identity. This is a qualitative decision, not a statistical result, an assertion that these are objectively best, or the user's final choice. **01** remains the editorial alternative and **09** the density reference. All twenty remain selectable.

| Direction | First version's concrete cost | Intended iteration |
| --- | --- | --- |
| 07 · Schedule Board | Long phone introduction, generous personal/directory gaps, confidence quieter than probability | Shorten the preamble and working desk while retaining the complete five-pair lead; show returned choice and independent confidence explicitly |
| 16 · Two Editions | Large repeated member nameplate; public phone court comes before the complete matchup; ambiguous identity numbers | Put useful member actions beside a smaller identity, show both public phone score states before the court, retain different audience priorities |
| 18 · Night Practice + Paper | Static game HUD can appear live; lower repeated labels; enlarged-text overflow | Clearly label the static practice preview, preserve early actions and paper body, compact result rows and retain repaired reflow |

Measured fixture changes at 390px: 07’s first pairing moves from y563 to y248; 16’s View roster action moves from y899 to y338, and its public second score row ends at y608 rather than y906. These describe layout positions, not measured user success. Direction 18 visibly labels its static preview and integrates all ten leading faces into directory rows.

Each original author revises their own selected direction in `iterations/NN/`, documenting the actual changes and checks in `ITERATION.md`. Revision work does not increase the initial independent author count beyond twenty.

## Evidence and its limits

All **80 original full-page captures** succeeded: twenty directions × public/member × 1440px desktop/390px phone. Captures include the actual footer and section order. They use bounded viewport tiles with recorded integer offsets and separately checked top/middle/bottom pixels to avoid the known tall-render wrap failure. Temporary PNG tiles are not retained; the full-height JPEGs and native top/middle/bottom cuts are retained. Capture-only animation/sticky normalization preserves the page's content, links and controls; it is documented in each capture record. This establishes the captured static composition, not every sticky/animated interaction.

The initial root audit passed **186 of 200 specific browser cases**. Directions 03, 04, 06, 10, 11, 18 and 19 each overflowed in both 390px root-font-enlargement cases. All normal 390px, 320px reflow, stale and missing cases passed the generic audit. The seven separate repairs subsequently passed **70 of 70** equivalent cases and have **28 new full captures**. The first versions retain their recorded limitations.

Root's common audit checks document width, page errors, ten team containers, ten faces, all 228 roster references, public/member separation, five saved pairs when available, visible pending/sample state, native roster disclosure and directory search when present. Root-font enlargement is a particular CSS method and is separate from browser zoom and 320px reflow. Generic stale/missing text matching is a smoke check, not an exhaustive semantic oracle. Pixel-sized type in some initial concepts does not double merely because the root font changes; that initial method is not a universal text-enlargement pass. The three selected iterations convert type to root-relative units and the targeted check records actual 32px body text. Selected iterations pass 30/30 common cases plus six additional public/member interaction cases: Lillard/no-match/reset search, directory and standings name sort, native roster activation, menu Enter/Escape/focus return, enlarged text with disclosures open, and AI status inspected inside its actual schedule/saved-pick section.

The separate destination audit found all required league destinations and all 24 unique personal valuation player links in every first submission. Current metrics, prices, form, news, wire examples and AI outputs are synthetic. Actual dated approved names, rosters and draft editorial are preserved with period labels. Known `0.0`, pending/null, stale saved output, unavailable history/Power and small-cohort limitations remain distinct. The supplied model's actual returned choice is intentionally the 35% team in the leading example; a larger probability is not substituted for the returned choice.

Final independent pixel checks are recorded separately for [07](critiques/final05-07.md), [16](critiques/final08-16.md) and [18](critiques/final12-18.md). The first 07 final check found a nonblocking FEATURED marker wrap; its author corrected the actual label treatment before the final recapture; the critic independently confirmed the unbroken contained label on the corrected source. These checks evaluate normal-state actual pixels and specific probes, not every state or release readiness. No final Muse agreement is implied.

These static mocks do not establish live Next.js routing, authentication, production data transformations, screen-reader speech, physical-device usability or an end-to-end game flow. Screenshots cannot prove hidden provenance or every control. There are no performance claims about production based on this static exercise. Personal names shown are the same approved league identities, not new fetched account data. Public rendering excludes the personal sections; the shared synthetic fixture intentionally contains both editions for comparison and is not an authentication or security boundary.

## Scope and design references

Only `qa/homepage-20/` changes on this branch relative to #271. Production routes/components, configuration, database, dependencies, credentials, paid services, Muse's Week 2/3D lane and the preserved arena study remain unchanged. Draft #272 targets the QA #271 branch, not `main`. No merge, deployment or formal approval is authorized by this experiment.

The shared brief applies the repository's design skill, existing Inter/Geist typography and semantic tokens. It also carries the useful supplied primary-source craft lessons: returning visitors' jobs and authentic client material from [Hallmark](https://github.com/Nutlope/hallmark), deliberate visual hierarchy from [Rauno](https://rauno.me/craft/contrasting-aesthetics), and restrained functional motion from [Emil](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md). No external skill installer, hooks or services were installed. Original court/game imagery is bounded and purposeful; the immersive arena remains a separate option.
