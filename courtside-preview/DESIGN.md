# Courtside bulletin design decisions

## Brief and references

The arena, selected goat/basketball Clubhouse logo, embroidered fabric, and
league content are the useful identity. The previous preview's lower page
became a flat dark directory with small repeated metadata. This concept carries
court and gym materials through the whole page and makes this week's stories
the first reading task.

The reference-led workflow used the official
[Anthropic frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
and [OpenAI frontend-app-builder skill](https://github.com/openai/plugins/blob/main/plugins/build-web-apps/skills/frontend-app-builder/SKILL.md).
Three ImageGen section concepts were created before implementing this artifact:
opening, weekly stories, and directory/archive. They guided composition rather
than supplying website pixels. No generated mockup or invented portrait is used
by the page. The user approved proceeding with best judgment overnight.

## Complexity assessment

| Class | Necessary decision |
| --- | --- |
| Essential | A dated edition, three distinct editorial roles, actual roster ownership, explicit statistical periods, ten teams and all 228 roster references. |
| Imported | Existing Team/Player contracts, Sleeper IDs, approved logo/fabric exports, existing arena and league GLBs, shared UI token location. |
| Accidental | Avoid a new CMS, scheduler, database, animation engine, component registry, or another player-detail loader for a design review. |
| Transitional | The static artifact and frozen fixtures provide review before a production surface is selected. The optional module preparation is local output only. |
| Unknown | Panel preference for this composition and the eventual live weekly publishing seam; resolve after reviewing these captures. |

One semantic HTML composition, one data payload, native disclosures/dialogs and
CSS layout are enough. The optional existing figurine viewer remains bounded
to its dialog. There is no scroll listener, pinning, scrolljacking or continuous
decorative rendering loop. A single small emblem settles once when visible;
Offscreen and hidden-page animation pauses; reduced-motion mode is complete and static.

## Fidelity ledger

| Point | Final implementation and comparison |
| --- | --- |
| Opening balance | About 42% arena and 58% story in the opening grid. The source image is cropped to remove its baked title; the headline stays outside it. Mobile uses a 176 px scene before the story. |
| Materials | Teal gym opening → light mineral court → deeper teal teams → mineral archive → shallow arena strip. Painted arcs occupy outer margins and avoid the prose column. |
| Typography | Local Inter for prose/identity and Geist Mono for numeric values. Body copy 16–17 px, secondary 14 px, provenance 12 px, section headings 28–36 px. The supplied outlined logo retains its own lettering. |
| Weekly hierarchy | One larger Jokić lead with a larger actual portrait/name, two smaller supporting stories. Around the League shares the weekly surface and comes before the evergreen directory. |
| Fabric | Exact supplied rectangular, raised-stitch WebP exports, not the pointed or invented banners in the generated concepts. Only rosters 1 and 5 receive the approved fabric images. |
| Directory | Ten compact native disclosure rows, strong identity and 2025 record, current opponent and roster count. All 228 references and profile/figurine actions remain accessible on expansion. |
| Footer | Archive returns to the weekly mineral color and a short arena strip restores scene continuity. No unrelated visual theme appears late in the page. |
| Motion | One optional 750 ms emblem settle, then static. Existing figurine loads only on request, pauses when hidden and disposes on close. Reduced motion suppresses decorative motion. |

The final accepted concepts and browser captures were visually inspected.
Intentional differences: actual short source headshots replace the mockups'
invented full-body portraits; actual 228-player ownership replaces generated
roster text; real rectangular exports replace mockup pennant shapes; one sort
control replaces the mockup's duplicate filters. These changes preserve the
brief and supplied assets. The initial render's clipped arena title and low
lead portrait were corrected before final capture.

## Copy comparison

Existing draft matchup, three player opinions/stat values, and three actual wire
items are retained. Repeated prior-season context is consolidated into one
weekly introduction and a shared source disclosure, while each statistical set
keeps its own NBA/college period. Team summaries show prior record/finish once;
full roster and historical-owner notes move into the disclosure. No new result,
award, score, player ownership, team honor, or forecast was invented.

New navigation/section copy is functional: “This week's players,” “Know who
you're playing,” “Every week has a story,” search/order controls, and roster
actions. Draft/sample labels remain visible. The source dates and evidence
remain discoverable without repeating 8–10 px labels throughout the layout.
