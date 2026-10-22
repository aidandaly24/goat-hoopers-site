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

Minutes are verified, not assumed: the source `minutes` column is a
clock-time MM.SS float (48.53 = 48:53), not decimal minutes. This
script recomputes every appended-season mapped minutes value from the
sidecar's raw source value through the conversion below and fails the
run on any mismatch; it also re-derives the spot-check lines from the
sidecar and asserts them against the recorded Basketball-Reference
clock/counting evidence. See the receipt's minutesRepresentation block.

Usage: python3 scripts/validate-gamelog-2025-26.py ESPN_EXTRACT_JSON
         [--directory SLEEPER_PLAYERS_JSON] [--out RECEIPT_JSON]
The extract is espn-byathlete-2026-type2.extract.json from the #198
artifacts (athletes: [{id, gamesPlayed, ...}]).
"""
import argparse
import hashlib
import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SEASON = "2025-26"


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def source_minutes_to_seconds(raw) -> int:
    """Decode the source `minutes` clock float to whole seconds.

    The parquet `minutes` column is NOT decimal minutes: the integer
    part is whole minutes and the two-digit fractional part is seconds
    (48.53 = 48:53). A seconds part of exactly 60 is the encoding's own
    carry (30.6 = 31:00; Basketball-Reference lists Karl-Anthony Towns
    at 31:00 for the 2025-10-22 game whose raw value is 30.6). Above
    60 the row is not in this encoding — refuse. Identical conversion
    to scripts/prepare-gamelog.py; minutes_check below keeps the two
    honest by recomputing every mapped row from the raw sidecar.
    """
    value = float(raw)
    whole = math.floor(value)
    seconds = round((value - whole) * 100)
    if seconds > 60:
        raise ValueError(f"source minutes {raw!r} implies {seconds} seconds")
    return whole * 60 + seconds


def source_minutes_to_decimal(raw) -> float:
    """Decimal minutes at the mapped file's 0.1-minute convention.

    Integer arithmetic only: (10 * total_seconds + 30) // 60 is
    round-half-up of total_seconds / 6, so 47:03 -> 47.1 exactly (the
    float path would give 47.0). Storage error at most 0.05 min (3 s).
    """
    total_seconds = source_minutes_to_seconds(raw)
    return ((total_seconds * 10 + 30) // 60) / 10


def clock_string(raw) -> str:
    total_seconds = source_minutes_to_seconds(raw)
    return f"{total_seconds // 60}:{total_seconds % 60:02d}"


def minutes_check(mapped, records):
    """Recompute every appended-season mapped minutes value from the
    provenance sidecar's raw source value. Returns counts and up to
    five mismatch examples; the caller fails the run on any mismatch.
    """
    raw_by_key = {}
    for r in records:
        if r["sleeperId"] is not None:
            raw_by_key[(r["sleeperId"], str(r["raw"]["game_date"])[:10])] = r["raw"]["minutes"]
    checked = mismatches = carry_rows = 0
    examples = []
    for pid, entry in mapped["players"].items():
        for g in entry["games"]:
            if g["season"] != SEASON:
                continue
            checked += 1
            # Mapped dates carry the source timestamp suffix
            # ("2025-10-21 00:00:00"); the join key is the ISO day.
            raw = raw_by_key.get((pid, g["date"][:10]))
            expected = source_minutes_to_decimal(raw) if raw is not None else None
            if raw is not None and round((float(raw) - math.floor(float(raw))) * 100) == 60:
                carry_rows += 1
            if expected is None or abs(g["minutes"] - expected) > 1e-9:
                mismatches += 1
                if len(examples) < 5:
                    examples.append({"sleeperId": pid, "date": g["date"][:10],
                                     "sourceRawMinutes": raw,
                                     "mappedMinutes": g["minutes"],
                                     "expectedMinutes": expected})
    return {"rowsChecked": checked, "mismatches": mismatches,
            "seconds60CarryRows": carry_rows, "mismatchExamples": examples}


def team_game_totals(records):
    """Decoded per-team game totals vs the legal 240 + 25/OT minutes.

    Computed from the sidecar alone. Genuine clock seconds from the
    source feed scatter a few seconds around the legal total (the
    feed's own per-player rounding); a decimal misreading of the same
    values lands minutes short per team-game, so this distribution is
    the committed evidence for the MM.SS decoding.
    """
    totals = defaultdict(int)
    for r in records:
        raw = r["raw"]
        totals[(raw["game_id"], raw["team"])] += source_minutes_to_seconds(raw["minutes"])
    deltas = Counter()
    for total in totals.values():
        legal = 14400 + 1500 * round((total - 14400) / 1500)
        deltas[total - legal] += 1
    return {"teamGames": len(totals),
            "deltaSecondsVsLegal": {str(d): deltas[d] for d in sorted(deltas)}}


# Recorded Basketball-Reference evidence (box scores fetched 2026-10-22).
# Every computable field is re-derived from the sidecar/mapped data and
# asserted in build_spot_checks; a disagreement fails the run rather
# than letting the receipt certify stale evidence.
SPOT_CHECKS = [
    {"game": "2025-10-21 HOU @ OKC (final 124-125 2OT)", "players": [
        {"name": "Alperen Sengun", "sleeperId": "2308", "date": "2025-10-21",
         "clock": "48:53", "counting": {"pts": 39, "reb": 11, "ast": 7, "stl": 2, "blk": 1, "tov": 4, "fg3m": 5}},
        {"name": "Kevin Durant", "sleeperId": "1433", "date": "2025-10-21",
         "clock": "47:03", "counting": {"pts": 23, "reb": 9, "ast": 3, "stl": 0, "blk": 0, "tov": 4, "fg3m": 0}},
    ]},
    {"game": "2025-10-22 SAS @ DAL (final 125-92)", "players": [
        {"name": "Victor Wembanyama", "sleeperId": "2577", "date": "2025-10-22",
         "clock": "29:41", "counting": {"pts": 40, "reb": 15, "ast": 1, "stl": 1, "blk": 3, "tov": 0, "fg3m": 1}},
        {"name": "Cooper Flagg", "sleeperId": "4760", "date": "2025-10-22",
         "clock": "31:32", "counting": {"pts": 10, "reb": 10, "ast": 0, "stl": 1, "blk": 0, "tov": 3, "fg3m": 0}},
    ]},
    {"game": "2025-10-22 CLE @ NYK (final 111-119)", "players": [
        {"name": "Karl-Anthony Towns", "sleeperId": "1613", "date": "2025-10-22",
         "clock": "31:00", "counting": {"pts": 19, "reb": 11, "ast": 2, "stl": 0, "blk": 0, "tov": 3, "fg3m": 1}},
    ]},
]


def build_spot_checks(mapped, records):
    """Verify the recorded spot checks against the committed data.

    For each player: the sidecar raw counting line and the decoded
    clock must equal the recorded Basketball-Reference evidence, and
    the mapped minutes must equal the conversion of the raw value.
    Raises SystemExit on any disagreement.
    """
    raw_by_key = {(r["sleeperId"], str(r["raw"]["game_date"])[:10]): r["raw"]
                  for r in records if r["sleeperId"] is not None}
    out = []
    for entry in SPOT_CHECKS:
        players = {}
        for p in entry["players"]:
            raw = raw_by_key.get((p["sleeperId"], p["date"]))
            if raw is None:
                raise SystemExit(f"spot check: no sidecar row for {p['name']} on {p['date']}")
            for field, expected in p["counting"].items():
                if int(raw[field]) != expected:
                    raise SystemExit(
                        f"spot check: {p['name']} {field} sidecar {raw[field]} "
                        f"!= recorded {expected}")
            decoded = clock_string(raw["minutes"])
            if decoded != p["clock"]:
                raise SystemExit(
                    f"spot check: {p['name']} decoded clock {decoded} "
                    f"!= recorded {p['clock']} (raw {raw['minutes']})")
            games = [g for g in mapped["players"][p["sleeperId"]]["games"]
                     if g["date"][:10] == p["date"] and g["season"] == SEASON]
            if len(games) != 1:
                raise SystemExit(f"spot check: mapped row for {p['name']} on {p['date']} not unique")
            expected_minutes = source_minutes_to_decimal(raw["minutes"])
            if abs(games[0]["minutes"] - expected_minutes) > 1e-9:
                raise SystemExit(
                    f"spot check: {p['name']} mapped minutes {games[0]['minutes']} "
                    f"!= conversion {expected_minutes}")
            counting = " / ".join(f"{raw[f]} {f}" for f in
                                  ("pts", "reb", "ast", "stl", "blk", "tov", "fg3m"))
            players[p["name"]] = {
                "line": f"{counting} / {p['clock']}",
                "sourceRawMinutes": raw["minutes"],
                "mappedMinutes": games[0]["minutes"],
            }
        out.append({
            "game": entry["game"],
            "source": "basketball-reference.com box score",
            "players": players,
            "result": ("counting fields exact for every player; minutes: the "
                       "source raw value decodes to the recorded clock time "
                       "exactly (MM.SS encoding) and the mapped decimal "
                       "minutes are its conversion at 0.1-minute storage "
                       "precision"),
        })
    return out


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

    mcheck = minutes_check(mapped, records)
    if mcheck["mismatches"]:
        print(f"minutes check FAILED: {mcheck['mismatches']} of {mcheck['rowsChecked']} "
              f"mapped 2025-26 minutes values do not equal the conversion of their "
              f"raw source value; examples: {mcheck['mismatchExamples']}", file=sys.stderr)
        raise SystemExit(1)
    totals = team_game_totals(records)
    spot_checks = build_spot_checks(mapped, records)

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
        "minutesRepresentation": {
            "sourceEncoding": "clock-time float MM.SS: the integer part is whole minutes and the two-digit fractional part is seconds (48.53 = 48:53). The source minutes column is NOT decimal minutes.",
            "conversion": "totalSeconds = 60 * floor(raw) + round(100 * frac(raw)); mappedMinutes = round-half-up(totalSeconds / 60) at 0.1-minute storage precision, computed in integer arithmetic ((10 * totalSeconds + 30) // 60) / 10. A raw seconds part of 60 is the encoding's own carry into the next minute (30.6 = 31:00).",
            "storageTolerance": "mapped minutes are within 0.05 minute (3 s) of the exact decoded value; the decoded value itself matches Basketball-Reference clock readings to the second on every spot check",
            "evidence": [
                "all 26,648 raw values at rev d480e56 have a whole-hundredth fractional part (max deviation 3.4e-13) with implied seconds in 0..60, never 61..99 as decimal hundredths would",
                "Basketball-Reference clock readings match the decoded source value to the second for all 15 players checked: the five spot-check players below plus all ten Cleveland players in game 0022500003 (2025-10-22 CLE @ NYK: Mobley 35:56, Mitchell 35:53, Merrill 28:22, Allen 28:13, Wade 28:07, Ball 23:29, Tyson 20:13, Nance 16:59, Proctor 16:06, Porter 6:43)",
                "decoded per-team game totals equal the legal 240 + 25/OT minutes within the deltaSecondsVsLegal scatter below for every team-game; a decimal reading of the same values lands ~2 minutes short per team-game",
                "the seconds-60 carry is externally confirmed: raw 30.6 for Karl-Anthony Towns, 2025-10-22 CLE @ NYK, against Basketball-Reference's 31:00",
            ],
            "teamGameTotals": totals,
            "priorBug": "PR #252 heads dff7d9f..05691e6 stored round(raw, 1), reading the clock float as decimal minutes (48.53 -> 48.5 instead of 48.9; understatement up to 0.4 min on seconds-60 rows). The receipt at those heads also mislabeled the spot checks 'exact on every field': the counting fields were exact, and the raw source minutes were exact as clock readings, but the mapped decimal minutes were not the recorded times. fppg never used minutes and is unaffected. Fixed by converting in scripts/prepare-gamelog.py (source_minutes_to_decimal) and regenerating only the appended season; the provenance sidecar is byte-identical (raw values unchanged) and no pre-2025-26 row changed.",
        },
        "minutesCheck": mcheck,
        "spotChecks": spot_checks,
        "players": players,
    }
    Path(args.out).write_text(json.dumps(receipt, indent=1) + "\n")
    print(f"receipt -> {args.out}: joined {check['joinedPlayers']}, exact {check['exact']}, "
          f"discrepancies {len(check['discrepancies'])}, no-cross-check {len(check['noEspnCrossCheck'])}, "
          f"espn-positive unmapped {len(check['espnPositivePlayersUnmapped'])}, "
          f"duplicate dates {duplicate_dates}, "
          f"minutes checked {mcheck['rowsChecked']} (mismatches {mcheck['mismatches']}, "
          f"seconds-60 carry rows {mcheck['seconds60CarryRows']})")


if __name__ == "__main__":
    main()
