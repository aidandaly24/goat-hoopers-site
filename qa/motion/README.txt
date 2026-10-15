GOAT Hoopers local motion QA

This fixture renders the real homepage, header and controls with invented domain
inputs and existing local fonts/assets. It imports no runtime league loaders,
account services or AI provider. Next link/navigation adapters are fixture-only;
this does not verify Next routing or signed-in flows.

No package installation is needed. Use the repository's existing dependencies.
Start: node node_modules/vite/bin/vite.js --config qa/motion/vite.config.mts --configLoader native
Open: http://127.0.0.1:8796/
Build: node node_modules/vite/bin/vite.js build --config qa/motion/vite.config.mts --configLoader native
The build is a compile check; its assets are not a standalone preview export.

Focused regression tests:
node node_modules/vitest/vitest.mjs run src/surfaces/season-hub/CourtsideDialog.test.tsx src/surfaces/season-hub/CourtsideFeature.test.tsx src/surfaces/season-hub/homepageSorting.test.ts src/test/homepage-controls.test.ts --maxWorkers=1 --configLoader native --cache=false --fsModuleCachePath qa/motion/.cache/vitest

The fixture button runs bounded native-dialog interruption checks. The explicit
MediaQueryList probe tests the React component's live preference subscription.
CSS retains Chrome's actual OS preference, so that probe is not OS/media emulation.
The forced preference is restored after each run. Numeric values are synthetic
and remain unchanged. Caches, compiled output and screenshots stay ignored.

Observed in the user's Mac Chrome, 2026-10-11:
- 27 fixture checks pass at 1440x900, 390x844 and 320x720 (native reduced=false).
- Keyboard Enter opens without the pointer enhancement; Close receives focus.
- Tab from Close reaches a dialog link. Escape closes and restores trigger focus.
- Search, Clear, team sorting and native roster expansion work at 320 pixels.
- Light and dark notes surfaces are readable; a long title clears Close at 320.

Not verified: Safari, physical touch, a screen reader, actual OS reduced-motion
CSS matching, signed-in behavior, live provider/data responses or Next navigation.
Native dialog behavior is retained; no custom focus trap or delayed JS close.

Local screenshots: evidence/desktop-notes-light.jpg, desktop-notes-dark.jpg,
mobile-notes-light.jpg, 320-long-title-notes.jpg and 320-directory-search-expanded.jpg.
