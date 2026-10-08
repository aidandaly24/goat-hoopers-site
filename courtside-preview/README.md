# Courtside weekly homepage review

A local homepage concept for GOAT Hoopers: arena and story opening, a painted
court weekly bulletin, a darker gym-wall directory, then archive and arena footer.
This is an isolated artifact for panel review. The live Next.js homepage is not
replaced by this concept.

From the repository root, with the existing dependencies installed:

```sh
node courtside-preview/build-data.cjs
node courtside-preview/prepare-viewer.cjs
python3 -m http.server 8790 --bind 127.0.0.1
```

Open <http://127.0.0.1:8790/courtside-preview/>. Serve the repository root because
the shared UI tokens are referenced from `src/ui/`. `prepare-viewer.cjs` copies
only the required installed Three modules into ignored local output and links
the existing league GLBs. No new package, CDN or 3D engine is needed.

The generated data payload is committed so the bulletin itself opens without
a build. The optional figurine action requires the preparation step above.

- `#watch`: this week's three player stories.
- `#teams`: searchable team directory with native roster disclosures.
- `#archive`: two sample editorial editions.
- `#edition/2026-W40`: a recap of the verified 2025 final.

Search covers every one of the 228 roster players, not just featured anchors.
Order can switch from league order to 2025 finish. Player names and team profile
actions point to existing live routes. The other navigation actions point to
the existing market, arcade, and manager-team routes.

The editorial fixtures are proposed drafts, not previously published Muse
editions. The current edition is preseason and has no live score. Its two NBA
lookbacks and college watch have explicit period labels. The only shown scores
belong to the archived 2025 final. All fixtures are dated October 8, 2026;
this artifact does not claim to be an automatically refreshed live site.

Only the supplied Reaves Dropper and Josh Diddy's Roster embroidered samples
are used. Logos are the approved selected hybrid kit. Originals and source kits
were preserved. See [asset provenance](ASSET-PROVENANCE.json),
[design decisions](DESIGN.md), and [verification](VERIFICATION.md).

Desktop and mobile review screenshots are retained locally and in ChatGPT Library.
They are excluded from the public repository; the required website assets ship
with this comparison and the production homepage.
