# Electric tactics court — complete homepage correction

Local concept02 only. Source: `homepage-corrections/02/index.html`, `app.js`, and `style.css`. The original `polished/02` and earlier captures are preserved. This is an offline fixture, not a production integration or publication.

## Surface contract

User question: what is happening in the league, and what matters to my team? Primary action: read the current matchup and follow the relevant team/player/tool. Relevant states: member/public; ready, stale and missing saved AI; supplied zero versus Pending scoring; modeled values versus form and completed-week results; dated draft editorial versus current synthetic fixture; unavailable history and Lineup Power. Narrow layout: the court becomes vertical, with wings around the centre pairing, followed by the same open field notes in document flow. Forbidden patterns: replaceable readers, viewport-bound workspaces, collapsed essential sections, internal reading scrollers, invented live facts, repeated generic feature cards, autoplay or delayed reveals.

## Content map — all sections rendered on initial load

| Court position | Open homepage material | Depth / next action |
| --- | --- | --- |
| Centre circle | Week3 pairing and 0.0 / Pending distinction on the court; all five incomplete pairings below; saved choice, both probabilities, independent confidence, timestamp; secondary model/input notes retain model/prompt/evidence and absent snapshot/baseline | AI Decides; team profiles |
| Left wing, member | Reaves Dropper, manager, record, standing; modeled FAAB total/subtotal, pricing coverage and computation basis/time; top three values with known historical price changes; three form-watch rows; five unique completed-week performers, period, GP, overlap and eligibility qualifications; team wire | Your team; full24-player roster; Stocks and trade analyzer. Raw24-value appendix is intentionally replaced by the top-three summary and full-roster destination |
| Left wing, public | A compact public league introduction, explanation of modeled prices, unavailable history/power; public franchise previews appear in the baseline section | All ten franchises below; Stocks and trade analyzer. No personal values or `/team` link |
| Right wing | All ten current standings with rank, manager, record, PF; member marked without reordering; supplied playoff places/start week | Public team profiles; prior-season history |
| Left baseline | Dated draft edition; its upcoming/no-score opening-week game; one lead and two subordinate player takes; labeled NBA/college stat periods, opinions; secondary selection/source disclosures retain reasons and check dates; three dated happenings | Player and team profiles; source destinations |
| Sideline | Three current synthetic moves, date/week/type, explicit missing add/drop detail | Transactions, intel, trade analyzer |
| Right baseline | Three featured clubs (Reaves Dropper, the defending champion, NeuralNets): approved face, anchor modeled value, manager, roster count, qualified2025 record and full-roster links. A compact ten-team index keeps every club searchable with its manager, roster count and direct roster link | Search checks all228 source names and displays matching player links. Sort by standing/name/roster count |
| After the court notes | Both dated archive entries, draft status, historical final versus upcoming/no-score distinction, secondary edition notes retain original source/check dates; source register and data boundaries are secondary | Weekly archive, history, playable Free Throw destination |

The court summary and field-note labels describe the same positions. Court links jump to material already present below and focus its heading. Each field-note label links back to the court. Native document scrolling supplies the complete reading experience; no interaction is needed to reveal the homepage. Search/sort refine the compact directory. Native secondary disclosures hold precise model, editorial-selection and source details; scores, dates, status, coverage, takes and primary actions are visible by default. Escape closes a focused disclosure and returns focus to its summary.

## Art and craft

The cobalt/cyan court, flat SVG linework, spatial positions, Oswald headings and Space Mono figures remain concept02’s identity. The field notes use open paper, editorial columns, a dense slate, standings and franchise rows instead of six interchangeable panels. The phone court rearranges its positions rather than shrinking desktop coordinates. Essential text stays visible before any interaction; there is no scene motion or scroll observer.

Read this round: repository AGENTS.md; affected homepage/data/contract portions of ARCHITECTURE.md and DESIGN.md; `.agents/skills/goat-hoopers-design/SKILL.md` and its visual hierarchy, navigation/accessibility and motion references; own `polished/02` source/ART; `reference-notes/craft.md`. No peer implementation or concept16 correction was inspected. The supplied craft record informed semantic roles (better-colors), content-led whole-page architecture (Hallmark / Elaya), context-sensitive phone placement (adapt), explicit native interaction/focus (Rauno / accessibility), visible content and no unearned motion (Emil / pbakaus / accessible-animation). Those principles are applied through the supplied local record; this document does not claim a new external-source audit.

Only existing `../../data.js` is imported. Existing approved local portraits and the original local Oswald/Space Mono files are reused. No assets, fonts, dependencies or external services were added. The ten raw profiles and24-value appendix were intentionally curated down after checking the whole-page reading length. Paint/type roles are declared locally; palette literals remain in their declarations. There is no `goatStudy` compatibility API; `body.dataset.homepageReady='02'` signals completed render/font readiness.

## Verification and limits

Actual bounded results are in `CHECKS.json`; rerun with `node qa/homepage-structures/homepage-corrections/02/verify.mjs` while the repository is served on localhost4207. The script uses existing Chromium and Playwright, without installation.200% means doubled root font size, not browser zoom. Verification is an emulated static fixture; it does not establish physical-phone, screen-reader, authenticated, live-provider, Next route, or production-destination behavior. Deep links retain their source URLs, but their application screens are outside this local static test.

Temporary viewport crops were inspected locally; root owns the four full-page review captures. Independent review remains pending. No push, commit, PR, comment, Library/service upload, merge, deploy, production/shared-data/helper change or release action was performed.

### Final density-correction results

- 10/10 targeted final renders passed: member ready at1440/390/320 and100%/200% root text; public ready at1440/390; member stale/missing at390. No horizontal page overflow, missing main section, internal reading scroller, console error or external runtime request. Six essential field-note sections, three player stories, three featured clubs and the complete compact ten-team index remained visible.
- 60/60 actual keyboard Enter paths (six court positions in each final render) focused the correct heading within the viewport. Search typed “Embiid” returned one team/one player; keyboard End/Enter on sort led with Ware the Hoes At? at27 rostered.
- All14 secondary disclosures opened together at320px/200% root text without horizontal overflow. Escape closed the focused disclosure and restored its summary. Live reduced-motion change retained the roster jump with zero active animations.
- The first returned choice remains Ware the Hoes At? at35%, its counterpart65%, and independent confidence20%. The displayed score remains0.0/Pending. NeuralNets’2025 record retains “Under the previous manager as QBs Gremlins.”
- Both local font families loaded. All six used portrait instances decoded. Desktop court targets measured at least170.25px in their smaller dimension; this is not a claim about inline prose link sizes.
- Final member document heights:1440px→8,512px,390px→16,218px,320px→17,243px. This remains a substantial long homepage. The full roster dump and default precise-provenance dump are removed; deeper notes are secondary disclosures. Enlarged-text heights are recorded in CHECKS.json.
- JavaScript syntax passed. Final index/app/style SHA-256 values are recorded in CHECKS.json. The earlier36-case exploratory pass preceded the final density correction and is not presented as final-source evidence.

Only viewport crops were made for author inspection. Physical devices, screen readers, real application destination screens and independent final full-page review remain unverified. No release action is pending; the work is intentionally local-only.
