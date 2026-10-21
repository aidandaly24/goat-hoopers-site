# Leaderboard UI fixture

This fixture builds production Next with the real root layout, Arcade pages,
leaderboard consumers, ranked input recorder and browser transport. Source reads,
availability and score acceptance use explicit synthetic in-memory responders.
The input court replaces the unchanged renderer so browser checks can focus on
UI and request state; the real recorder and server replay still process inputs.
There is no live sign-in setup, database, provider, production request or test score.

```sh
python3 qa/leaderboard-ui/prepare.py /tmp/goat-leaderboard-ui
python3 qa/team-value-history/serve.py /tmp/goat-leaderboard-ui 4365
python3 qa/leaderboard-ui/browser.py /tmp/goat-leaderboard-ui http://127.0.0.1:4365
```

The server inherits the existing sanitized environment and loopback network
guard. Only synthetic localhost run/score POSTs are permitted by the browser.
The checks cover weekly/all-time/League navigation, unsupported games, held,
failed and genuinely empty boards, request races, accepted-save refresh and
rejected/recovered-result feedback. 200% means root text size, not page zoom.

The original functional receipts predate the authoritative PR238 record contract.
The separate record consumer uses only its validated accepted submit feedback.
Run the browser command with `records` to exercise first/beaten/tied/below,
missing/malformed/misbound feedback, lost-response recovery, retry and duplicate
response suppression. `review/records.json` records the separate source identities.
Only `beaten` receives the record effect; recovery never recreates it.

Target only the header navigation with `header-shortcuts` as the browser command’s
third argument. Its receipt covers hydrated ranked navigation, Back, explicit local
practice and 1440px / 320px at 200% root text. Other unchanged checks retain their
prior source identities in `review/receipt.json`.

The separate minigame bugbash copies the actual static preview route and uses
synthetic, runtime-validated NBA directory/selected-roster reads. Run:

```sh
python3 qa/leaderboard-ui/bugbash.py /tmp/goat-leaderboard-ui http://127.0.0.1:4365
python3 qa/leaderboard-ui/browser.py /tmp/goat-leaderboard-ui http://127.0.0.1:4365 expiry
```

`review/bugbash.json` covers header/card/direct navigation, keyboard entry, both
local games, development status before legacy account/store loading, signed-out,
disabled, unavailable and recovery states, archive/scope/period mismatches and
source-failure retries. Desktop and320px/200% root text pass. The extra expiry
probe confirms disabled save, available new-round control and zero score POSTs.
An optional third bugbash argument is a separately retained prior-source fixture
origin, used only to reproduce the old development-route instructions.

The focused auth/layout regression fixture copies the real account login page,
AccountForm and continuation route. Only the isolated fixture aliases auth reads
and the same-origin sign-in response to a synthetic cookie; no provider account,
credentials or product configuration is used. Use the local Next canonical host:

```sh
python3 qa/leaderboard-ui/auth-layout.py /tmp/goat-leaderboard-ui http://localhost:4365
```

It covers validated ranked/run return paths, unsafe/ambiguous queries, expired
auth during start/save/result checks, saved recovery without record replay, and
ordinary/long-name Priced In active and reveal states. All synthetic auth writes
stay on loopback. Its case-name arguments select narrow reruns. The receipt in
`review/auth-layout.json` preserves the exact source identities and reused auth
evidence separately from the final long-name wrapping checks.
