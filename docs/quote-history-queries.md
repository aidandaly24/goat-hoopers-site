# Quote and detail history reads — issue #17

The bounded query slice follows [the corrected contract](https://github.com/aidandaly24/goat-hoopers-site/issues/17#issuecomment-6053086571), based on main `bf86c6359e6c2c226ba2348e5ab8393697fdf750`.

`StockStore.getQuoteHistory(ids)` returns at most one live point per unique requested player. One parameterized query selects `player_id`, `price_cents`, and `snapshot_at` from `stock_snapshots`, using `DISTINCT ON (player_id)` and `ORDER BY player_id, snapshot_at DESC, id DESC`. PostgreSQL chooses the latest timestamp without a JavaScript date round trip; the UUID resolves exact timestamp ties. The player filter applies in SQL, and there is no global limit. An empty set runs zero queries. Missing live data/read failures return no baseline, including reconstructed-only players. Zero prior prices retain existing null change/percent semantics. [PostgreSQL's DISTINCT ON contract](https://www.postgresql.org/docs/current/sql-select.html#SQL-DISTINCT) requires the leading order expressions to match the distinct key.

The quote loader uses the existing shared candidate selector. Valuation, quote/mover semantics, publication/retention, and cache ownership are unchanged. `getStockStore` accepts an injected `Db` for offline clients; production still resolves the existing lazy client, and explicit null uses the no-op store.

`getPricePath(id)` runs two selected-player queries: reconstructed dates/cents/source, ordered by date/source/UUID, and the latest ten live dates/cents, ordered by timestamp/UUID. The player filter precedes the live limit, so unrelated or dense players cannot consume its window. Reconstruction remains full resolution **for that selected player** before sampling; its transfer is not capped at forty rows. The store merges reconstruction followed by oldest-to-newest live points and samples to forty. The detail loader keeps the last 39 historical points and the pricing engine's unchanged current modeled point, preserving its date/source. No chart history enters public quote payloads. Available sources survive a missing counterpart table; estimates remain labelled as reconstruction.

## Reproducible offline evidence

Run on supported Node 22 with database/import URLs empty and both local-DB opt-ins disabled:

```sh
npm test -- src/data/__tests__/stock-queries.test.ts src/data/__tests__/quote-history-loader.test.ts src/data/__tests__/price-history.test.ts --reporter=verbose --disableConsoleIntercept
```

The fixtures use actual Drizzle query generation and result decoding with an in-memory HTTP-row model. They inspect generated SQL/parameters and assert requested-set bounds, 1/50/200-player cardinality, sparse/interleaved histories, microsecond and exact timestamp ties, unrelated-player starvation, duplicate/empty/absent/unusual IDs, no-DB/missing-table fallback, reconstructed-only null baselines, chart sources/dates, candidate membership, and equivalence of valid quote prices/changes/trends/movers. They do **not execute SQL**.

The dense fixture has ten candidates, 120 reconstructed rows and 30 observed snapshots per candidate. The before queries are frozen read shapes from the base commit; the after queries call the revised store.

| Fixture read | Before queries | After queries | Before returned rows | After returned rows | Before JSON bytes | After JSON bytes |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Quotes, all ten candidates | 2 | 1 | 1,300 | 10 | 121,402 | 381 |
| Detail, one selected candidate | 2 | 2 | 130 | 130 | 12,142 | 5,612 |

Bytes are UTF-8 serialized row-array bytes returned by the fake transport, excluding HTTP framing, compression and driver/network overhead. In the old single-player detail read, nine of the ten globally limited live rows belonged to other candidates; the after read returns ten rows for the selected player. Dense detail equivalence is checked against the valid pre-change full-candidate history, which supplied ten live points per candidate. Quote transfer includes zero reconstructed rows after this change.

These are fixture measurements, not live performance, database scan-cost, billing or latency measurements. Actual PostgreSQL execution, query plans, index benefit and preview timing remain unverified. This slice creates/connects no test database and makes no schema/index, migration/import, refresh/publication, caching, deployment or settings changes. Publication is held for the parent coordinator's independent exact-head review.
