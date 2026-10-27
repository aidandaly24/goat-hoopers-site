# Full-page review captures

- [Default league edition · desktop · light](public-desktop-full.png)
- [Personalized edition · desktop · dark](member-dark-full.png)
- [Default league edition · 390px · dark](public-390-full.png)
- [Personalized edition · 390px · dark](member-390-full.png)
- [Personalized edition · phone opening](member-dark-mobile-top.png)

These are actual Chromium captures of the isolated full-page prototype, using
the real homepage components and dated approved media/identity fixtures. Current
scores, values, news, form and saved picks are synthetic. No live auth or backend
is exercised. The scenes currently contain original geometry only: the public
Polyfork downloads were blocked before any file arrived.

The browser probe passed 18 checks across exact public/member text/link and
228-player preservation, one scene with no idle/scroll frames, keyboard roster
disclosure/search/sorting, standings sorting, 390px and 320px public/member
reflow, 44px review controls, 200% text, reduced motion, Save-Data, still mode,
live reduced-motion disposal/reopen, actual WebGL context loss, missing editorial,
and no browser errors/external requests. The one scene measured 19,446 triangles
and 56 calls; software Chromium is not a hardware-GPU/mobile-device benchmark.

[Measured text samples](contrast.json) cover the actual heading, team disclosure
and review caption backgrounds in both themes. Light ratios: 12.70 / 12.70 /
5.15; dark: 15.46 / 15.46 / 9.74. This is sampled contrast evidence, not a claim
of complete accessibility certification. Screen readers and physical devices
remain untested. Check the draft PR's final-head evidence for the commit tested;
the reproducible browser command writes its exact revision to `checks.json`.

The requested Library attachment batch failed in the official upload helper
at its initial tools/list network call, before prepare/upload/finalize. No
Library item or ID was created, and the write was not retried by another route.
These repository captures and local originals remain available for parent
delivery. This failure is separate from Polyfork's HTTP 403 asset blocker.

Muse's standalone streetball spike remains an independent asset/scene study;
this branch proves the whole-page content and lifecycle composition. [The
coordination reply](https://github.com/aidandaly24/goat-hoopers-site/issues/190#issuecomment-6453354244)
records that comparison. Neither study is integrated into production.
