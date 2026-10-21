# News, move dates and display-name search

This fixture builds the actual home, news, transactions and trade-analyzer Next
routes with the real shell and consumers. All league/market/news inputs are
synthetic; RSS normalization runs against literal fixture XML. History reads
return no data. There are no provider, database, account or score operations.

```sh
python3 qa/news-date/prepare.py /tmp/goat-news-date
python3 qa/team-value-history/serve.py /tmp/goat-news-date 4377
python3 qa/news-date/browser.py /tmp/goat-news-date http://127.0.0.1:4377
```

The existing scaffolder/server is reused read-only; no active history fixtures or
source files are changed. Browser requests are GET-only and loopback-only, with
external avatar requests fulfilled from a local pixel.

The receipt covers RSS/cache missing summaries and legitimate prose; home versus
Transactions at the same original instant across league-midnight/winter boundaries
and Los Angeles/UTC/Tokyo browsers; and accented/unaccented directory/trade searches
with unchanged displayed names, player IDs and duplicate guards. Desktop and narrow
layouts are measured. Optional browser arguments select case-name prefixes for
targeted reruns. No stock-history audit or completed-week behavior is asserted.

Move dates use the existing league `America/New_York` timezone with visible
EDT/EST and year labels. The original instant stays in `time.dateTime`.

The existing `NewsFeed.RelativeTime` effect has one lint finding on main. The
baseline/current diagnostics are compared exactly; this repair changes summary
rendering only and leaves that timestamp effect untouched.
