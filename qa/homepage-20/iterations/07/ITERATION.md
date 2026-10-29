# 07 — Schedule board author revision

This is author 07's revision after reading the independent critiques from reviewer 05 and reviewer 08. It preserves the complete five-pair slate as the lead. It is not a new independent direction. The original `directions/07/index.html` and `DESIGN.md` were copied, and only this iteration folder was edited.

## Final-review marker correction

Reviewer 05's final check identified one P2: the public desktop `FEATURED` label wrapped as `FEATUR` / `ED` in its narrow gutter. The only HTML/CSS correction adds a class to that public marker and applies the existing deliberate vertical treatment with `white-space: nowrap`. The label remains **FEATURED**; member **YOURS**, body type, columns, pairings and all other content remain unchanged. No clipping or overflow suppression was introduced.

Final corrected `index.html` SHA-256:

```text
1c320a838eb70c81820c1bdc2de38d670b1ca5dd838e228b4a9d520581733dfb
```

On this exact HTML, installed Chromium/Playwright was rerun for public and member at 1440px, 390px, 320px and 390px with root font at 200%. Each case passed normal and all-native-disclosures-open document-width checks, without script errors. Public `FEATURED` is one text fragment, stays inside its marker box and ends before the team column at every size; its box is 15 × 62.86px normally and 30 × 125.72px at 200%. Member `YOURS` retains its original horizontal desktop/vertical phone treatment. The corrected public 1440px row was also visually inspected in memory.

These reruns additionally confirmed ten teams, ten faces, five saved pairs, 228 unique roster links, 24 member values, 0.0 versus five Pending scores and all five returned-choice labels at 35%. Root-font 200% gives 32px body text. Both frozen original hashes printed below remain unchanged. Sources are stopped and ready for root's recapture and reviewer 05's correction check.

## What changed and why

**The phone reaches the pairing sooner.** The week heading is a short working title. My team and View roster sit immediately below it. The redundant introductory sentence and owner/action preamble no longer occupy separate phone blocks. Comparison links remain usable in native Menu. The fixture notice stays visible above the title; its complete wording remains in the footer. On phones the arena crop follows the first pairing; desktop retains the restrained arena beside the title. All five current pairings still precede the personal desk.

**The model choice is explicit.** Every ready or stale row now prints the returned away-team choice with its actual **35%**, even though the home-team probability is **65%**. The distribution remains labeled home/away. A quiet line exposes **Confidence 20% · separate signal** and the saved timestamp without opening provenance. The full model, prompt, roster IDs, evidence, saved time and unavailable input fields remain in native details. Missing results still show Unavailable; nothing is generated or inferred from the bar.

**The member desk groups related information.** Identity/standing, modeled total/coverage and the three highest modeled values share a compact desktop row. The complete 24-value disclosure and unavailable-history statement follow it directly. The phone stacks those same groups with smaller gaps. The team/roster actions are already available above the slate, so the desk no longer repeats that action block. Body text remains 16px at the normal root size, secondary text 14px and metadata 12px.

**Directory rows keep related fields together.** The team, manager, current record, roster count and current opponent form one identity block. The top modeled player and price stay alongside it on desktop and directly below it on phone. A single roster disclosure follows. Redundant opponent subheadings and large inter-row gaps were removed; the face context was not split into another gallery. Previous-season records and NeuralNets' prior-manager attribution remain in the full roster details.

**Text enlargement affects the text.** Existing type sizes were converted from pixels to root-relative units. Thus setting the root to 200% changes normal body text from 16px to 32px. Names, controls, probability labels and table cells wrap; numerical and name columns receive flexible allocations. The 320px case remains a separate check.

## Measured before/after

Using the same installed Chromium, fixture, loaded fonts, closed disclosures and member view:

| Rendered measure | Frozen original | Iteration |
| --- | ---: | ---: |
| First pairing top, 390px viewport | 563px | 248px |
| First pairing top, 1440px viewport | 512px | 431px |
| Personal section height, 1440px | 573px | 374px |
| Personal section height, 390px | 842px | 723px |
| First directory team height, 390px | 383px | 272px |
| First directory team height, 1440px | 191px | 179px |

These are layout measurements, not a statistical usability score. No body text was reduced to obtain these gains. The phone title was deliberately shortened, and the desk's identity/total are subordinate to the five-pair slate.

## Actual checks on the final HTML

Installed headless Chromium through Playwright at `/qa/homepage-20/iterations/07/index.html`:

- Member and public at 1440px, 390px and 320px: document width equals viewport width both normally and with **every** native disclosure open, including Menu. No page errors were reported.
- Member and public at 390px with `document.documentElement.style.fontSize = '200%'`: computed body text is 32px; document width stays 390px, normally and with every disclosure open. No overflow clipping rule was added.
- In each of those eight viewport/state cases: ten directory teams, ten face hooks, five saved pair hooks and 228 unique roster profile links remain. Member keeps one personal section and all 24 roster values; public has no personal section. Zero remains 0.0, and five null away scores remain Pending.
- All ready rows retain the returned choice at 35%, the 65%/35% distribution, separate 20% confidence and the actual saved time. Stale and missing AI were checked for both views at 390px, with five pairings retained and all disclosures open.
- Player, manager and team search, empty results, Clear restoring focus, team name/count sorts and standings name/PF sorts pass. Ten standings rows remain, with source PF divided by 100.
- Keyboard checks pass for the first focusable skip link, native Menu opening, comparison-link availability and Escape closing/restoring Menu focus. Reduced-motion media emulation retains static content.
- Normal 390px member opening, 390px public directory and 1440px member desk were visually inspected in memory. Root owns the common capture set and independent final pixel review.

Original file integrity was checked by SHA-256 after the work:

```text
directions/07/index.html
f1eb269acc6ba41bb38001b3d27536158ddb7ca3e465fabe02040ce84f225c46
directions/07/DESIGN.md
adda8180082c7ef3abadd24190d7970e163cd8ce0fdc2fb676128c9c18a0d055
```

No blockers remain for capture and review. This static fixture does not establish production routing, authentication, APIs, actual Arcade gameplay, physical-device behavior or spoken screen-reader behavior. No production files, dependencies, services or original direction files were changed; no commits or pushes were made.
