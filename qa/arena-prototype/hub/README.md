# Home court — functional arena exploration

The current brief keeps the arena and rejects emulating the older homepage
layouts/styles. Earlier content remains an inventory, not a visual template.
The previous scrolling study and its images at 8739293194622cd7e7026af57ede2f2c99eb9cef
remain unchanged. They do not demonstrate acceptance of this concept.

Run the existing QA Vite config from the repository root; open `/arena.html`.
`?view=member` selects the synthetic member fixture. `?scene=still` skips 3D.
`#place=standings` demonstrates direct destination restoration. `/index.html`
retains the prior study. A QA-only Link shim keeps Home/logo in the arena entry;
all other destinations retain their original hrefs. This entry is not a
production route or a deployment.

User question: where do I go in our league's home court? Primary action: choose
a physical destination, then inspect its readable HTML. The overview is an
actual WebGL arena with six projected DOM labels and selectable scene objects.
The jumbotron opens matchups/saved picks; bench opens roster/form/team wire;
billboards open player evidence/editorial; scorer's table opens standings;
concourse opens directory/news/archive; hoop links to existing playable Arcade.
The shared site header keeps its destination/account/theme controls. The full
league edition remains a single unfiltered content view preserving the original
homepage text, links, disclosures, tables and ten-team/228-player inventory.

Selection opens a native modal reader immediately and makes a finite 180ms
desktop camera move. Readers scroll normally. Phones use named destinations,
44px scene targets and full-height sheets. Keyboard users can skip to the
directory, activate a destination, traverse within the reader and close with
Escape. Close restores the overview and trigger focus; Back/Forward restore
the previous destination. A direct reader URL has a safe overview/focus return.
Repeated Close cannot issue duplicate history traversals. Ordinary links keep
their real destinations; this isolated fixture does not implement those pages.

Sample member entry highlights their bench and shows roster count/table rank;
the featured matchup remains available from the arena. Values and standings
are explicitly synthetic fixture data. Table rank is not Power. No Power,
historical value line, news, result, recap contribution or AI evidence is
invented to fill a data gap. Core recap/Power work stays with its owners and
is not copied from their branches.

Still mode, reduced motion, Save-Data and failed WebGL retain the same places
and HTML. Reduced motion/Save-Data skip scene/model imports. Live preference
changes dispose/reopen one renderer. Rendering occurs for local asset load,
resize and deliberate camera inspection; there is no idle/scroll animation.
The renderer retains visibility guards, context-loss fallback, abort/disposal,
DPR <=1.5 and <=1.6M drawing pixels. Only the three previously inspected local
Polyfork GLBs are reused, with inherited provenance. All other geometry is
original. No downloaded code, remote module, asset/service purchase or new
dependency is involved.

Muse's ownership response is #190 comment6457327435: their scene/camera
composition proof and #268 branch remain untouched; this `hub/` tree is Dot's
guarded navigation proof. Claim/input records:6457053844,6457108912,6457405817.
Their skeleton source was requested for read-only comparison; fresh exact-head
visual review is still required. The current Library helper resolved but could
not download the three older image references, so no pixel-inspection claim is
made for those files. Repo fidelity images were inspected for content context;
none of their old homepage layouts is the new design brief.

Validation commands (with the local app running):

```sh
node qa/arena-prototype/hub/verify.mjs
node qa/arena-prototype/hub/verify-menu.mjs
node node_modules/typescript/bin/tsc --noEmit -p qa/arena-prototype/tsconfig.json
node node_modules/eslint/bin/eslint.js qa/arena-prototype/hub
node node_modules/vite/bin/vite.js build --config qa/arena-prototype/vite.config.mts
```

The browser script writes actual desktop/phone overview and opened-reader JPEGs
plus checks.json to `/tmp/goat-hub-review` (override HUB_EVIDENCE). It checks
physical scene picking, modal/focus/history behavior, exact content/link parity,
table/directory controls, mobile/200% text, preference changes, failure fallback,
resource/idle bounds and no external requests/writes. Evidence is an offline
Vite fixture in software Chromium, not production Next navigation, a real
logged-in account, a physical phone, GPU benchmark or screen-reader session.
The previously recorded root Next build blockers are not changed by this QA
entry. No production integration or release is authorized by this prototype.

Read-only Hallmark input from the earlier recorded public source review is
applied selectively: retain real content/wiring, let GOAT identity lead, use
hierarchy and open rows, and avoid decorative nested cards. It is not a template
for this arena. No external skill/hooks/package or automated Hallmark run was
installed. This prototype's current images are in hub/review; older study
captures outside that folder remain prior-concept references only.

A final scoped reader-action correction replaces an inherited inverted strip
whose secondary label lost contrast in dark mode. Actual public matchup
readers at 1440/390 in both themes now measure secondary-label contrast
6.89:1 dark / 4.87:1 light; activation still scrolls to saved picks and Escape
returns to the arena. Action-contrast receipts and recaptured affected views
are stored beside the base 18-case interaction receipt. Runtime source IDs
and each image's capture source are explicit in artifacts.json.

The expanded-navigation regression is reproduced at b445b581: the disclosure
became a separate grid item and reduced the arena to zero height (750→0px
desktop,523→0px phone). The QA entry now groups the unchanged SiteHeader and
its disclosure sibling into one header grid item. verify-menu.mjs exercises
eight expanded/closed states across public/member,1440/390/320, both themes,
200% text, still and reduced-motion modes. It checks stage dimensions, natural
menu flow, no horizontal overflow, renderer count, Escape/focus restoration,
reader activation afterward and repeat open/close. Shared header and scene
files are unchanged. Older overview captures do not prove this menu state.
