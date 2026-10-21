# Trade Analyzer narrow and enlarged-text regression

Builds the actual `/trade-analyzer` page, consumer, CSS and shared shell with
synthetic slim quotes. It reuses the existing news/date fixture scaffolder and
production Next server without changing those QA files. No provider, database,
account, credentials or score operations are used. The browser blocks non-GET
and external requests; avatar images are fulfilled from a local pixel.

```sh
python3 qa/trade-layout/prepare.py /tmp/goat-trade-layout
python3 qa/team-value-history/serve.py /tmp/goat-trade-layout 4382
python3 qa/trade-layout/browser.py /tmp/goat-trade-layout http://127.0.0.1:4382
```

The browser runs six actual-route journeys: 1440px/100%, 1280px/200%,
390px/200%, 320px/100%, and 320px/200% with both normal and reduced motion.
Each measures eight states: empty, accented result, selected accented player,
long-name result, both sides priced, unbroken-name result, three selected
players, and the full clipboard-failure label. It checks page/root bounds,
unclipped complete player names, and 44px minimum targets. Keyboard selection,
unaccented search, same-/cross-side duplicate exclusion, canonical URL reload,
and removal returning a player to the picker are exercised. All prices, names
and verdict inputs are synthetic, not assertions about live valuations.

`--baseline` records the same journeys without requiring the defective layout
to fit. The retained baseline used main
`d25036edf16f14b10332fa591aa388b3dd527a01`: the ordinary selected Alperen Şengün
state measured scrollWidth547 at viewport320 with 200% root text; adversarial
names were wider. The candidate measures320 in every corresponding state.

`receipt.json` records before/after dimensions and exact tested source blobs.
Raw browser JSON, build logs and screenshots remain in the disposable output
directory. This is local Chromium production-Next evidence; no physical phone,
live provider, production request or independent-review result is claimed.
Only TradeAnalyzer.module.css changes in product source. Search, identifiers,
selection/URL behavior, pricing, verdicts, backend and shared shell are unchanged.
