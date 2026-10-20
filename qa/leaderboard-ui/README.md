# Leaderboard UI fixture

This fixture builds production Next with the real root layout, Arcade pages,
leaderboard consumers, ranked input recorder and browser transport. Source reads,
availability and score acceptance use explicit synthetic in-memory responders.
The input court replaces the unchanged renderer so browser checks can focus on
UI and request state; the real recorder and server replay still process inputs.
There is no sign-in setup, database, provider, production request or test score.

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

The current score response confirms saved statistics, not a new personal or
global record. Saved-round feedback makes that distinction. Record-specific
celebrations require the backend owner's separate authoritative contract.
