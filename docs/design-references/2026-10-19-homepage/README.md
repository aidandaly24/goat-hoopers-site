# Approved homepage design reference

For Muse's canonical [PR207](https://github.com/aidandaly24/goat-hoopers-site/pull/207), coordinated in
[issue #201](https://github.com/aidandaly24/goat-hoopers-site/issues/201).
This branch contains reference artifacts only. Do not merge it as an application
implementation or ship its fixture values.

| Mode | Desktop | Phone |
| --- | --- | --- |
| Signed in | [Full screenshot](member-desktop.png) | [Full screenshot](member-phone.png) |
| Public | [Full screenshot](public-desktop.png) | [Full screenshot](public-phone.png) |

[Download the interactive HTML](homepage-preview.html?raw=1) and open it in a
browser, or serve it over local HTTP. All images, fonts, scripts and fixture
data are embedded. Its labeled public/member toggle does not change an account.
The source preview follows the requested restrained hierarchy and the
repo's Paper + Slate palette, Inter/Geist typography and approved assets.

- [Implementation request and remaining review fixes](MUSE-REQUEST.md)
- [Detailed component/data handoff](IMPLEMENTATION-HANDOFF.txt)
- [Section preservation checklist](CONTENT-PRESERVATION.txt)
- [Preview-only browser evidence](preview-checks.json)
- [STUD / CHUD close-up](stud-chud.png)
- [AI rows with actual team avatar assets](ai-team-avatars.png)

The complete lower homepage is retained: all ten teams, 228 roster references,
own/league watches, personal guide/news/move states, STUD/CHUD retrospective
examples, all five AI pairings, league faces, wire, champion, standings/stats/
moves, Stocks/Arcade and the full weekly archive.

Valuation, historical chart and AI figures are visibly **fixtures**. The
Jokić/Embiid lookbacks reuse existing 2025–26 NBA sample editorial; they are not
verified award winners. Identity and avatar images are the explicit October 8
source snapshot. They must not replace current provider data in production.

The preview clock targets the accepted first NBA tip, October 20, 2026 at
19:00Z, shown as **3:00pm EDT** using `America/New_York`. It uses a labeled local
device clock and is not evidence that production sleep recovery is fixed.
Target display switches to EST for winter dates. Scroll reveals, optional
desktop court depth, reduced motion and no-JS visible defaults were checked
separately; screenshots show settled layouts, not animation.

The mock was rendered from the earlier PR207 `0c54dd62` source. The handoff also
records source-inspected gaps at `74f6d7136b7ec55f7d03571e30401cd5e60b22ff`.
No current production DB, saved AI or historical team-ownership series was read.
Only Muse's eventual exact final implementation head can receive release review.
