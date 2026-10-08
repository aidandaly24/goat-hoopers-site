# Historical inputs and source audit

These files are inputs to a retrospective FAAB estimate. They are not recorded
site quotes, a complete historical league market, or exact current-league scores.

`source-audit.json` pins hashes of both committed inputs and four public parquet
files. Every one of the 103,531 committed game rows for 918 players was reproduced
using the legacy mapper/scorer against
[cbratkovics/nba-game-logs revision b77dc9bc](https://huggingface.co/datasets/cbratkovics/nba-game-logs/tree/b77dc9bc0dad5ef46ed1fe99a7b71c8cc728cbcb).
This establishes content correspondence. PR #25 did not record the original
download revision, so this audit does not reconstruct that download history.
All compared parquet rows have `source=kaggle_v515`; the
[dataset card](https://huggingface.co/datasets/cbratkovics/nba-game-logs/blob/b77dc9bc0dad5ef46ed1fe99a7b71c8cc728cbcb/README.md)
identifies Eoin Moore's Kaggle NBA box-score dataset, version 515. Its CC0 label
refers to Kaggle packaging; the card also describes personal/noncommercial use
and underlying NBA terms. This audit makes no broader licensing claim.

The pinned source has 1,230 regular-season games in each of 2021–22, 2022–23 and
2023–24, but 1,223 in 2024–25. Its card identifies seven missing games. The
legacy mapper drops another 235 rows: 217 Goga Bitadze rows (`ga Bitadze` upstream)
plus 18 unmatched rows. The checked-in mapper now contains a Bitadze hand-map,
so regenerating it would introduce those 217 rows. This PR deliberately leaves
the committed game data unchanged. Approve source/mapping expansions separately.
Name matching discarded source player IDs, game IDs and raw box scores; the
mapping has no durable manual identity audit. Recover these fields when
approving a new source revision rather than treating name matching as authority.

Public league scoring was checked on 2026-10-08 through `src/data/sleeper.ts`:
`pts=.5, reb=1, ast=1, stl=2, blk=2, to=-1, tpm=.5, dd=1, td=2`, plus
`bonus_pt_40p=2, bonus_pt_50p=2, bonus_ast_15p=2, bonus_reb_20p=2, ff=-2, tf=-2`.
The legacy scorer maps `tov` to `to`, `fg3m` to `tpm`, and stacks the achievement
bonuses. It omits `ff` and `tf`; neither field is present in these parquets.
The derived JSON cannot repair those omissions or re-score changed formulas.
Source/aggregate discrepancies must not all be attributed to those penalties.

Sleeper's 2023 stat entry for Wembanyama (`2577`) has 71 games, 2,106 minutes and
32.77 fantasy PPG under that scoring. It is his 2023–24 rookie season, confirming
the start-year convention independently of string arithmetic. Yearly fallback
for `2023` therefore belongs on June 30, 2024, labeled `2023-24`.

Use these limitations in `source.limitations` when preparing an artifact. The
manifest records frozen input/model/output hashes, scoring, source revision and
assumptions. A changed model requires a new reviewed artifact; old quotes cannot
be recovered from estimates. Early career minutes/experience and yearly
30-minutes-per-game estimates remain approximations. Historical injury and
sentiment are neutral; live EMA ingestion is still unwired. No convergence to
today's site price is promised.
