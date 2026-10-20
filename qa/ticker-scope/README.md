# Server ticker route-scope regression

Run `node qa/ticker-scope/verify.mjs` on the repository's Node22 CI runtime after
`npm ci --include=dev`. CI runs this after the existing homepage boundary probe.
The script builds one temporary production Next.js app with webpack, starts it
on an OS-selected `127.0.0.1` port, prints JSON evidence, then stops the process
and removes only its own temporary directory. It does not run against the site.

The fixture copies the actual production root layout, global CSS, entire
`@ticker` route subtree (excluding tests), optional catch-all page, null default
and route policy. Actual SiteHeader, SiteChrome, ThemeBootstrap, theme controls,
footer and CombinedTicker remain in the render tree. Synthetic primary content
matches the route matrix; an explicit unknown-path branch calls notFound().
A specific synthetic player route tests dynamic params/metadata, and synthetic
API/robots routes test handler precedence. No actual account/content page loader
is executed.
The installed Next parallel-routes documentation warns that unmatched slots can
retain old state on soft navigation. The production ticker slot matches every
path and explicitly returns null for utility segments; HTML and Flight requests
here verify that server matching. No hydrated browser soft-navigation claim is
made by this harness.

Only these fixture substitutions apply:

- Exactly one asserted `next/font/google` import in the copied root layout is
  replaced with a local font stub. Production font calls/configuration stay in
  that copy, and production source is untouched. No font request is made.
- `@/data/league` resolves to synthetic market/news adapters, a null season
  footer projection and a team loader that throws if accidentally reached.
  Both ticker loaders append a small request-ID-tagged JSON line to the owned
  temporary probe log. No production cache, valuation producer or DB is loaded.
- `@/app/actions` resolves to async signed-out/no-op server-action fixtures;
  no session credential, sign-in, logout mutation or account store is accessed.
- `@/data/espn-client` resolves to a client hook returning null. There is no
  hydration or score polling here. Actual CombinedTicker markup/props remain.

The child build/server environment has an explicit small allowlist and no app,
provider or database credentials. The existing `block-external.mjs` fetch guard
is preloaded, plus this fixture's raw socket guard, which permits outbound TCP
only to numeric `127.0.0.1` and rejects Unix sockets. Parent requests/assets also
use only the private numeric loopback origin. Temporary build/probe files are
the only writes.

The JSON matrix covers hard HTML and Flight for every excluded first segment
(`account`, `admin`, `login`, `signup`, `claim`, `forgot-password`,
`reset-password`), including nested paths; content paths; and prefix collisions
such as `/accounting`. Each excluded request must produce zero market/news
calls and no ticker DTO sentinels. Each content request must call each adapter
exactly once and send only25 stock/12 headline identities from larger inputs.
Deep source-field sentinels must never reach either transport. Empty results,
each independent outage, market-only and news-only fallbacks retain the current
Promise.all fail-soft semantics. The actual header/main/footer and inherited root metadata must remain. The
specific dynamic route must override the generic catch-all and emit its own
metadata. Unknown paths must retain a 404 boundary/noindex (bot HTML404; streamed
Flight may use HTTP200 only with Next's explicit404 control signal). API and
metadata-route requests, including an RSC header, must retain handler precedence
and execute no ticker loaders.

The script also fetches the JavaScript assets referenced by one excluded HTML
response and reports asset count/bytes and whether ticker code remains present.
A null server slot does not by itself promise client-bundle elimination; this
measurement is reported without broadening production scope.

Moving the ticker from the retained root layout to a matching parallel page may
rerun its loaders for content-to-content soft navigation. The matrix reports
one call per source per explicit content server request, not equality with the
old retained-root navigation cost. Provider/cache/valuation side-effect behavior
is unchanged source outside this fixture; any hydrated navigation cost claim
requires a separate browser measurement.

Local creation checks use `node --check` and a small compiler syntax pass only.
The connected Mac has incomplete dependencies and little free disk, so no local
Next build is attempted. Only a successful exact-head Node22 CI run establishes
that this production Next boundary passed. This probe does not establish real
browser transitions, auth behavior, provider freshness, pricing, database
behavior or production deployment.
