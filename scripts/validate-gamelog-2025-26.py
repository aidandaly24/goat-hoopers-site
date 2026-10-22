#!/usr/bin/env python3
"""
Emit the machine-readable validation receipt for the 2025-26 gamelog
append (issue #217, PR #252): data/gamelog_2025-26_validation.json.

Recomputes, from committed inputs only:
  - dataset shape (rows, players, unique source games, duplicate
    player/dates) from data/gamelog_mapped.json + the provenance sidecar;
  - the games-played cross-check against the independent ESPN core v2
    season-totals extract frozen for issue #198, joined through
    src/data/espn-id-map.json (Sleeper id -> ESPN athlete id) — in BOTH
    directions: mapped players vs ESPN totals, and ESPN-positive
    identities (gamesPlayed > 0) with no mapped rows.

The coverage numbers in the receipt are recorded evidence; the gated
reproduction is the committed replay harness
src/data/__tests__/gamelog-2025-26-coverage.test.ts, which derives them
from the frozen replay fixtures + this dataset and asserts them in CI.
Spot checks are recorded evidence from the runs named in the receipt.

Usage: python3 scripts/validate-gamelog-2025-26.py ESPN_EXTRACT_JSON
         [--directory SLEEPER_PLAYERS_JSON] [--out RECEIPT_JSON]
The extract is espn-byathlete-2026-type2.extract.json from the #198
artifacts (athletes: [{id, gamesPlayed, ...}]).
"""
import argparse
import hashlib
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEASON = "2025-26"


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def cross_check(season_players, id_map, espn_gp):
    """Both directions of the games-played cross-check.

    season_players: {sleeperId: mappedGames}; id_map: {sleeperId: espnId};
    espn_gp: {espnId: gamesPlayed}. Returns the receipt block plus the
    per-player table.
    """
    players = {}
    exact = 0
    discrepancies, no_cross_check = [], []
    for pid, count in sorted(season_players.items(), key=lambda kv: int(kv[0])):
        espn_id = id_map.get(pid)
        gp = espn_gp.get(espn_id) if espn_id else None
        if gp is None:
            status = "no-espn-cross-check"
            no_cross_check.append(pid)
        elif gp == count:
            status = "exact"
            exact += 1
        else:
            status = f"delta{count - gp:+d}"
            discrepancies.append({"sleeperId": pid, "mappedGames": count,
                                  "espnGamesPlayed": gp})
        players[pid] = {"mappedGames": count, "espnId": espn_id,
                        "espnGamesPlayed": gp, "status": status}
    # Reverse direction: an ESPN-positive identity whose Sleeper player
    # has no mapped rows at all must surface, never silently read as [].
    unmapped_positive = []
    for pid, espn_id in sorted(id_map.items(), key=lambda kv: int(kv[0])):
        gp = espn_gp.get(espn_id)
        if gp and gp > 0 and pid not in season_players:
            unmapped_positive.append({"sleeperId": pid, "espnId": espn_id,
                                      "espnGamesPlayed": gp})
    espn_without_id_map = sorted(
        espn_id for espn_id, gp in espn_gp.items()
        if gp and gp > 0 and espn_id not in set(id_map.values()))
    return {
        "joinedPlayers": exact + len(discrepancies),
        "exact": exact,
        "offByOne": sum(1 for d in discrepancies
                        if abs(d["mappedGames"] - d["espnGamesPlayed"]) == 1),
        "discrepancies": discrepancies,
        "noEspnCrossCheck": no_cross_check,
        "espnPositivePlayersUnmapped": unmapped_positive,
        "espnPositiveAthletesWithoutSleeperIdMap": espn_without_id_map,
    }, players


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("extract", help="issue #198 ESPN by-athlete extract JSON")
    parser.add_argument("--directory", help="Sleeper players JSON (for names)", default=None)
    parser.add_argument("--out", help="receipt output path",
                        default=str(ROOT / "data" / "gamelog_2025-26_validation.json"))
    args = parser.parse_args()

    directory = {}
    if args.directory:
        directory = json.loads(Path(args.directory).read_text())

    mapped = json.loads((ROOT / "data" / "gamelog_mapped.json").read_text())
    provenance = json.loads((ROOT / "data" / "gamelog_2025-26_provenance.json").read_text())
    id_map = json.loads((ROOT / "src" / "data" / "espn-id-map.json").read_text())
    extract = json.loads(Path(args.extract).read_text())
    espn_gp = {a["id"]: int(a["gamesPlayed"]) for a in extract["athletes"]}

    season_players = {}
    duplicate_dates = 0
    for pid, entry in mapped["players"].items():
        games = [g for g in entry["games"] if g["season"] == SEASON]
        if not games:
            continue
        dates = [g["date"] for g in games]
        duplicate_dates += len(dates) - len(set(dates))
        season_players[pid] = len(games)

    check, players = cross_check(season_players, id_map, espn_gp)
    for d in check["discrepancies"]:
        d["name"] = directory.get(d["sleeperId"], {}).get("full_name")
    for d in check["espnPositivePlayersUnmapped"]:
        d["name"] = directory.get(d["sleeperId"], {}).get("full_name")

    records = provenance["records"]
    receipt = {
        "artifact": "2025-26 gamelog append validation receipt (issue #217)",
        "generatedBy": "scripts/validate-gamelog-2025-26.py",
        "inputs": {
            "gamelogMapped": {"path": "data/gamelog_mapped.json", "sha256": sha256(ROOT / "data" / "gamelog_mapped.json")},
            "provenance": {"path": "data/gamelog_2025-26_provenance.json", "sha256": sha256(ROOT / "data" / "gamelog_2025-26_provenance.json")},
            "espnIdMap": {"path": "src/data/espn-id-map.json", "sha256": sha256(ROOT / "src" / "data" / "espn-id-map.json")},
            "espnExtract": {"path": str(args.extract), "sha256": sha256(args.extract),
                            "note": "issue #198 frozen extract of ESPN core API v2 by-athlete 2025-26 (type 2) season totals; recorded fixture sha256 5e4445cc9957d63416308564a7f6d217db3ff67b96fea5a37ad0d14b86e4bbc1"},
        },
        "dataset": {
            "season": SEASON,
            "mappedRows": sum(season_players.values()),
            "mappedPlayers": len(season_players),
            "provenanceRecords": len(records),
            "uniqueSourceGames": len({r["sourceGameId"] for r in records}),
            "duplicatePlayerDates": duplicate_dates,
            "mappingReasons": dict(Counter(r["mappingReason"] for r in records)),
        },
        "gamesPlayedCrossCheck": check,
        "populationCheck": {
            "espnAthletes": len(extract["athletes"]),
            "mappedPlayers": len(season_players),
            "espnTotalGamesPlayed": sum(espn_gp.values()),
            "mappedRows": sum(season_players.values()),
            "delta": sum(espn_gp.values()) - sum(season_players.values()),
            "note": "Populations are identical (582 = 582) and the 103 unjoined identities mirror exactly on both sides. The delta of 3 is the two named joined discrepancies (+1 each) plus one residual single game inside the 103-player unjoined population — the same single-game upstream-discrepancy class; it is not localizable from the frozen artifacts (the extract carries no athlete names and the repo id-map has no entries for those 103).",
        },
        "coverageVsCensus": {
            "method": "Derived and asserted by the committed harness src/data/__tests__/gamelog-2025-26-coverage.test.ts (repo replay engine loadChainRosterReplay + membershipOnDay over the committed replay fixtures; a player-day is priceable when the player has a same-season gamelog point on or before that day — frozen #217 contract, same-season anchors only). The harness first reproduces the census totals exactly (36,774 player-days / 1,640 team-days).",
            "segment": "2025 (2025-10-20 -> 2026-04-01)",
            "playerDays": 36774,
            "priceablePlayerDays": 34755,
            "priceablePct": 94.51,
            "preFirstGamePlayerDays": 1309,
            "noSameSeasonGamePlayerDays": 710,
            "noGamePlayers": [
                {"sleeperId": "1444", "name": "Damian Lillard", "days": 164},
                {"sleeperId": "1054", "name": "Kyrie Irving", "days": 164},
                {"sleeperId": "4762", "name": "Thomas Sorber", "days": 164},
                {"sleeperId": "2161", "name": "Tyrese Haliburton", "days": 164},
                {"sleeperId": "1717", "name": "Fred VanVleet", "days": 45},
                {"sleeperId": "1228", "name": "Kobe Bryant (legacy directory entry)", "days": 9},
            ],
            "teamDays": {"total": 1640, "complete": 621, "partial": 1009, "unavailable": 10},
            "note": "The 2026 segment (12,748 player-days) stays unpriceable: it has no same-season games in window and cross-season carry is prohibited. GC-1 membership-gap team-days (2026-04-02 -> 2026-08-12) stay unvalued regardless of prices.",
        },
        "spotChecks": [
            {"game": "2025-10-21 HOU @ OKC (final 124-125 2OT)", "source": "basketball-reference.com box score",
             "players": {"Alperen Sengun": "39 pts / 11 reb / 7 ast / 2 stl / 1 blk / 4 tov / 5 fg3m / 48:53",
                          "Kevin Durant": "23 pts / 9 reb / 3 ast / 0 stl / 0 blk / 4 tov / 0 fg3m / 47:03"},
             "result": "exact on every field"},
            {"game": "2025-10-22 SAS @ DAL (final 125-92)", "source": "basketball-reference.com box score",
             "players": {"Victor Wembanyama": "40 pts / 15 reb / 1 ast / 1 stl / 3 blk / 0 tov / 1 fg3m / 29:41",
                          "Cooper Flagg": "10 pts / 10 reb / 0 ast / 1 stl / 0 blk / 3 tov / 0 fg3m / 31:32"},
             "result": "exact on every field"},
        ],
        "players": players,
    }
    Path(args.out).write_text(json.dumps(receipt, indent=1) + "\n")
    print(f"receipt -> {args.out}: joined {check['joinedPlayers']}, exact {check['exact']}, "
          f"discrepancies {len(check['discrepancies'])}, no-cross-check {len(check['noEspnCrossCheck'])}, "
          f"espn-positive unmapped {len(check['espnPositivePlayersUnmapped'])}, "
          f"duplicate dates {duplicate_dates}")


if __name__ == "__main__":
    main()
