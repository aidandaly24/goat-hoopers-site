# 07 — The club in three streams

Source-ready and frozen for root capture. Implemented only this directory's static homepage and local detail views. The parent build followup superseded the discovery-only stop in PLAN.md. No publication, shared presentation, production edit, dependency, credential, live data, auth, AI, market, database or storage call was made.

Preview: `http://127.0.0.1:4207/qa/homepage-personal-20/07/?persona=reaves` (also `neural` / `guest`). Append `&stage=structure` for the same content and geometry with neutral color/image treatment. `html[data-persona]` tracks the labelled demo selector; `html[data-personal-study-ready="07"]` is set after fonts and images settle.

## Implemented product architecture

The accepted unequal, simultaneous streams are preserved: signal-orange team/focus player; pale pistachio player notes; ultramarine opponent/league. They use one document scrollbar, unframed content and staggered endings. A compact header and one grouped footer complete the website. At 1440 and 1120 CSS px, all three streams remain side by side; enlarged text reflows the league stream below the other two while preserving every item.

Reaves leads with Joel Embiid's supplied completed-Week-2 points, five visible player-evidence entries, the correct current pairing, all other games and current league context. NeuralNets leads with Giannis Antetokounmpo, three visible evidence entries, its own opponent and current records. Missing prices and its unavailable score support interpretation; they are not a repair chore or team identity. Its partial subtotal remains labelled 16/22 priced. No inferred tie/leader, complete value, ranking or trend appears.

Guest has a complete public edition: league introduction/court, ten team/manager entries, all five games, current standings excerpt and real-site entry. It reads no private roster, player-evidence, quote, personal-change or saved-model data. Member full rosters and complete public standings use local detail destinations. The home already shows useful content without opening those destinations.

Player focus is an editorial selection, not a ranking or recommendation. Synthetic dates, evidence scope and current matchup remain separate. The source explanation states that this prototype has no personal last-visit baseline. Existing-site exits are marked, labelled and open a new tab. All fixture destinations remain available in the header/footer.

## Working typography and imagery

- Display: existing licensed Barlow Condensed Regular, mixed case, approximately 64px team name (53.6px at narrower desktop), 32–36px section heads. The single focus player has a smaller display name. No synthetic display bold is used.
- Reading: Georgia / Times New Roman / serif, 17px main reading copy, 16px support. The center's prose measure differs from the compact game lists.
- Controls and data names: Verdana / Geneva / sans-serif; 13px principal controls and game names, 14px player-note names, with smaller supporting metadata. Long names wrap intrinsically. Navigation and explicit inspection controls retain visible focus.
- Numeric data: local IBM Plex Mono Regular and tabular figures; 14–16px ordinary numeric content, 46px single focus-player points, 26.4px current matchup scores. Unknown values use words rather than numeric substitutes.
- Assets: exact supplied black GOAT logo, approved Joel/Giannis portraits and approved arena image. Portraits remain at 300px maximum. The guest court uses its natural landscape ratio. The original local Barlow/IBM font files and OFL notices are unchanged; no download was needed. System DejaVu Sans supplies the small arrow glyph where the browser's control fallback lacks it.

The full-page sanity captures were visually inspected: Reaves 1440, NeuralNets 1120, Guest 1440. The guest arena was corrected to retain a modest natural landscape height; the final captures and browser evidence were regenerated afterward.

## Authored action contracts

`journeys.json` provides the stable selectors, expected results and return/focus target for all three useful actions in every persona. The selectors are `#first-action`, `#second-action`, `#third-action` on the home.

Member actions open the focus player, full local team/roster and correct matchup. Detail navigation focuses `#page-title`. `[data-return]` returns home; browser Back also works. Return restores the originating control and document scroll position. History restoration is explicitly manual so the browser and local navigation do not race each other. Roster search/clear is local and reports its count. The guest's first two actions open a public matchup and team summary; its third is the labelled existing-site sign-in link.

## Actual primary-source reading and application

[pbakaus — adapt](https://www.ui-skills.com/skills/pbakaus/adapt) opened successfully during discovery. Read the full extracted skill text, including Assess Adaptation Challenge, Desktop Adaptation, Implement/Verify Adaptations, content-driven breakpoints and input-method guidance. Applied selectively: simultaneous desktop reading, intrinsic long-name wrapping, content reflow for enlarged text and ordinary keyboard/touch-capable controls. No reference script or install command ran. The source did not provide this art direction or section order.

[Rauno Freiberg — Invisible Details of Interaction Design](https://rauno.me/craft/interaction-design) opened successfully during discovery. Read the complete extracted article; embedded gesture videos/demos were not exercised. Spatial Consistency and Scroll Landmarks informed the source-link → detail → restored-place journey. Frequency & Novelty informed immediate frequent actions rather than repeated entrance effects. Fitts's Law informed named inspection controls next to their person/game. Gesture physics, morphing and ornamental motion were unused.

Read the assigned brief, whole author brief/inventory, actual production homepage composition and personalization contracts, repo ownership/data guidance and verified local font catalog as recorded in PLAN.md. Before build, re-read this plan/brief/inventory and the complete latest data-only fixture. Its current PF values come from the shared fixture, not from earlier plan prose. No peer source, old prototype, rejected catalog or unrelated dashboard imagery was inspected.

## Bounded browser evidence

Run: `node qa/homepage-personal-20/07/browser-check.cjs` from the repository root. Uses the available Playwright package and `/usr/bin/chromium`; no package/browser installation. `node --check qa/homepage-personal-20/07/app.js` passed as well.

Final result in `browser-evidence.json`: **PASS**.

- 24 matrix cases: Reaves/Neural/Guest × 1440/1120 CSS px × normal/reduced motion × 100%/200% root text. Four supporting/capture page visits bring the recorded home-check total to 28. Viewport height was 1000px.
- No horizontal document overflow in any recorded home case. Normal desktop cases retain all three unequal, side-by-side fields. All images loaded; no browser page errors.
- 18 actual primary-action journeys: three actions × three personas × two widths. Local details, headings, correct roster sizes, price coverage, missing values, model period and qualified previous-manager history were checked. Local return focus and scroll restored; both return-link and browser-Back paths were exercised.
- Both guest sign-in clicks opened the expected `https://goathoopers.com/login` new-tab destination. The test intercepted those requests before network access. Live auth/site behavior is not claimed.
- Local roster search and clear, native persona selection, preserved structure-stage query, public-only guest content and complete external destination discoverability passed.
- Structure/color stream rectangles matched exactly; image visibility was neutralized without removing its geometry.

The 200% check enlarged root text with CSS; it is not a claim of physical-device or browser-zoom testing. Reduced motion was emulated in system Chromium. No phone captures, hardware/browser-engine sweep, live production flow or application-wide typecheck/build is claimed; production code was not changed. Root owns final complete captures and packaging.

## Targeted root cleanup

Removed only the decorative 01/02/03 spans from the three member and three guest stream headers. Useful section labels, CSS, content and interactions are unchanged. The previous bounded browser evidence predates this text-only cleanup; no full unchanged matrix was rerun. JavaScript syntax passed after the edit. Root owns the targeted recapture and geometry/content confirmation.

## Frozen source hashes

SHA-256 after the targeted stream-number cleanup:

```
6c7dc40cd466e14d211dc91b26d75dc71562112fc40d5092c2f3e8d435051b6a  index.html
5742de3698e562112ded3da27725ed429feced128a398a182e1338e9dae27a8f  style.css
1ddf4d3225c9370ffcf0effce0ba78675d9e3c8a7b9d1377cee4e74a0cfca5d2  app.js
```

No remaining blocker. Source frozen pending concrete root review findings.
