# Ticker route scope — issue #224 / audit A7

The root header receives a named `@ticker` parallel slot. Its matched
home page and `[...segments]/page.tsx` share a private server `Ticker`
component that returns `null` before loading market or news for
`account`, `admin`, `login`, `signup`, `claim`, `forgot-password`, and
`reset-password`, including their nested routes. League and content pages
retain the existing ticker. Whole-segment matching keeps `/accounting`
distinct from `/account`.

This deliberately removes the ticker from utility flows. Previously the
root layout rendered it on every page; there was no existing hidden-route
filter. The change does not claim to recover work that was already skipped.

The gate belongs inside the slot because hiding its output in the parent
does not prevent server execution. Matching utility routes explicitly also
clears a previous ticker on client navigation; Next retains unmatched
parallel slots. `default.tsx` supplies a safe null hard-navigation fallback.
The implicit primary slot also has a required `[...segments]/page.tsx` fallback
that invokes Next `notFound()` for otherwise-unhandled URLs. Without a matching
primary fallback, the ticker catch-all could change the URL while soft navigation
retained the previous primary page. Specific pages and handlers keep precedence.
No pathname middleware, request-header mutation, client data endpoint, or
route-group migration is introduced.

The ticker still uses the existing loader/cache functions, at most 25 quote
DTOs and 12 headline DTOs, and the same all-or-nothing outage fallback. Its
news/stocks/scores UI, polling, header account lookup, and footer are
unchanged. A utility route's own content may independently require league
data; this claim concerns the ticker's calls only.

A route-varying slot may invoke the existing loaders on public-to-public
navigation where the previous root layout retained its ticker. Existing
cache behavior is preserved, but no unchanged navigation cost, paid-service
savings, byte reduction, or client chunk elimination is claimed. Client
asset presence is reported by the fixture rather than assumed.

Verification combines offline loader/DTO/outage contracts with
`qa/ticker-scope/verify.mjs`, which builds the actual root/slot shape on the
repository's Node 22 / Next runtime in normal CI. Its synthetic adapters
keep credentials absent and external I/O blocked. HTML and Flight probes
verify server route matching; they do not establish browser soft-navigation
mount/unmount behavior or a production deployment. The reusable
`qa/ticker-scope/browser-regression.mjs` checks a hydrated real Link to an
unknown URL, Back, Forward and reload, including same-document assertions so a
hard navigation cannot mask retained content. Actual browser route
transitions and joint exact-head review remain acceptance gates before
release. `ARCHITECTURE.md` is reserved by Muse's #225; the routing-note
handoff is recorded in #224 instead of editing that file concurrently.
