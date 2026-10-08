# PR63 synthetic browser fixture

Run with database/import URLs absent:

```sh
env -u DATABASE_URL -u PRICE_HISTORY_IMPORT_URL npx vite src/test/live-ticker --config src/test/live-ticker/vite.config.mts
```

Open http://127.0.0.1:8816 in the supported existing browser. The fixture
renders the production CombinedTicker and runs the production
createLiveGamesPoller with injected synthetic slates and a manual clock.
Vite aliases only the ticker's useLiveGames binding to this test binding;
the real poller is imported by relative path. No application server runs,
and fetch is blocked. This does not verify the hosted Next/RSC path.

Cold idle mount starts at local Oct 9 03:00 on Oct 8 finals. Advancing two
hours must issue another request without a visibility event; old finals
stay absent. Roll the provider to live, advance two hours again, and use
Scores only to inspect score rendering. Overnight live mount starts at
Oct 8 23:59:30. Choose finals and advance one minute: finals expire and
discovery resumes within two hours. The observations show request spacing
and the next timer. Test empty/failure fallback and online recovery with
the provider buttons; unmount must remove the timer.

Check 320/390px widths, score text, the external link attributes and hidden
duplicate copies. News/Stocks/Scores rotate every 15 real seconds. Adding
`?reduced` exercises the component's reduced-motion JS branch through a
test-only matchMedia stub; native OS reduced-motion CSS is not emulated.
