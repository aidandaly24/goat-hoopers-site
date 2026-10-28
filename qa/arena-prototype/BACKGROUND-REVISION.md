# Continuous backdrop revision — review candidate

Aidan's rejection was forwarded verbatim to Muse in #190 comment 6454594162.
Muse agreed with this direction in 6454614263 and promised a fresh visual review.
Older WIP passes are not approval of this revision or permission to integrate it.

Actual scoped CSS now uses one continuous grey/slate body field, one fixed
guarded arena and one shared translucent reading veil. All section/wrap
backgrounds are transparent; header, captions and footer use the same field.
The repeated poster and alternating opaque reading planes are gone. Existing
theme-derived text/control roles retain readable contrast over the scene.

Muse's specific notes are addressed: all ten faces form an unclipped grid, the
phone matchup pair stacks, roster name/photos/caption occupy distinct rows,
and the closing photo is desaturated. The compact WT badge was reproduced and
corrected using scoped nowrap, line-height and compact font sizing. Team-name
labels use the readable text role rather than dark inline team colors. All
initials fit on one line; conservative face-label contrast is 7.91:1 light and
5.99:1 dark. Original avatar/crown behavior and every fact/control remain.

Actual Muse handoff #268 at 24b36aef62923251bf9b3a56656bd5c9f2ed3bbc was
inspected without merging. The three local GLB hashes, resource counts, world
bounds and pixels were checked before placement. The scoreboard's validated
transform-only clip remains inert. No remote module, zoom suppression,
auto-rotate or perpetual loop from the spike was copied. Provenance and raw
inspection records are retained under assets/polyfork.

All four current full-height JPEGs in review/ are new, under 900KB and complete
through their actual footer. Bounded viewport tiles avoid Chromium's 8192px
capture limit. Independent top/middle/bottom pixel checks and actual-JPEG OCR
verify section order and footer. Six states each have six normal-size viewport
crops in review/continuous. Historical PNG originals remain unchanged and must
not be delivered as current complete-page screenshots.

The isolated app passes 18 browser checks, six backdrop/contrast/badge cases,
scoped TypeScript, ESLint and its Vite production build. The repository-wide
Next build has two separate blockers: Turbopack rejects this checkout's shared
node_modules symlink; --webpack compiles but generated types reject the existing
optional AccountPage argument at src/app/account/page.tsx:9. The identical
signature exists in the prototype base. Global typecheck passed before Next
generated those checks; afterward it reports that same existing route error.
The production route is outside this prototype's scope and is unchanged.

Fresh final-head Muse visual judgment remains pending before user handoff.
An earlier WIP status/review comment to #190 was rejected by automatic approval
review for missing exact-destination/payload authorization; it did not post and
was not rerouted. Parent owns final review, artifact delivery and any permission
resolution. No production route change, merge or deployment occurred.
