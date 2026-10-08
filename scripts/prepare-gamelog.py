#!/usr/bin/env python3
"""
Prepare game-log data for the price-history backfill.

Reads the Hugging Face parquet game logs (2021-22 through 2024-25),
maps player_name -> Sleeper player_id via normalized name matching,
computes approximate per-game fantasy PPG (ff/tf penalties are omitted), and
writes a JSON file for scripts/backfill-price-history.ts to price.

Usage: python3 scripts/prepare-gamelog.py
Reads: /tmp/gamelogs/gl_*.parquet, /tmp/sleeper_players.json
Writes: /tmp/gamelog_mapped.json
"""
import json
import re
import unicodedata
from collections import defaultdict

import pyarrow.parquet as pq

# League scoring (from Sleeper league 1387473752807190528).
# Legacy inputs do not retain ff/tf or raw box scores. Do not describe the
# derived output as exact live-league scoring or silently assume missing=0.
SCORING = {
    "pts": 0.5, "reb": 1.0, "ast": 1.0,
    "stl": 2.0, "blk": 2.0, "tov": -1.0, "fg3m": 0.5,
}
DD_BONUS = 1.0
TD_BONUS = 2.0
BONUS_40P = 2.0
BONUS_50P = 2.0
BONUS_AST15 = 2.0
BONUS_REB20 = 2.0

SUFFIXES = {"jr", "sr", "ii", "iii", "iv", "v"}

# Dataset quirks: truncated/misspelled names mapped by hand.
HAND_MAP = {
    "ga bitadze": "Goga Bitadze",  # first name truncated in the source
}


def normalize(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c))
    name = name.lower()
    name = re.sub(r"[^a-z ]", "", name)
    parts = [p for p in name.split() if p not in SUFFIXES]
    return " ".join(parts)


def game_fppg(r) -> float:
    total = (
        r["pts"] * SCORING["pts"]
        + r["reb"] * SCORING["reb"]
        + r["ast"] * SCORING["ast"]
        + r["stl"] * SCORING["stl"]
        + r["blk"] * SCORING["blk"]
        + r["tov"] * SCORING["tov"]
        + r["fg3m"] * SCORING["fg3m"]
    )
    cats10 = sum(
        1 for v in (r["pts"], r["reb"], r["ast"], r["stl"], r["blk"]) if v >= 10
    )
    if cats10 >= 3:
        total += TD_BONUS + DD_BONUS  # triple-double stacks on double-double
    elif cats10 == 2:
        total += DD_BONUS
    if r["pts"] >= 50:
        total += BONUS_50P + BONUS_40P
    elif r["pts"] >= 40:
        total += BONUS_40P
    if r["ast"] >= 15:
        total += BONUS_AST15
    if r["reb"] >= 20:
        total += BONUS_REB20
    return round(total, 2)


def main():
    # Sleeper directory: normalized name -> player_id.
    directory = json.load(open("/tmp/sleeper_players.json"))
    name_to_id = {}
    for pid, p in directory.items():
        full = p.get("full_name")
        if not full:
            continue
        key = normalize(full)
        # First write wins; duplicates (rare) keep the active player.
        if key not in name_to_id or p.get("active"):
            name_to_id[key] = pid

    games_by_player = defaultdict(list)
    unmapped = defaultdict(int)
    total_rows = 0

    for season in ("2021-22", "2022-23", "2023-24", "2024-25"):
        t = pq.read_table(f"/tmp/gamelogs/gl_{season}.parquet")
        df = t.to_pandas()
        for r in df.itertuples():
            total_rows += 1
            key = normalize(r.player_name)
            # Hand-map known dataset quirks before the directory lookup.
            if key in HAND_MAP:
                key = normalize(HAND_MAP[key])
            pid = name_to_id.get(key)
            if not pid:
                unmapped[r.player_name] += 1
                continue
            games_by_player[pid].append(
                {
                    "date": str(r.game_date),
                    "season": season,
                    "fppg": game_fppg(r._asdict()),
                    "minutes": round(float(r.minutes), 1),
                }
            )

    # Sort chronologically per player.
    for pid in games_by_player:
        games_by_player[pid].sort(key=lambda g: g["date"])

    out = {
        "players": {
            pid: {"games": games}
            for pid, games in games_by_player.items()
        }
    }
    json.dump(out, open("/tmp/gamelog_mapped.json", "w"))

    n_players = len(games_by_player)
    n_games = sum(len(games) for games in games_by_player.values())
    print(f"rows: {total_rows}, mapped players: {n_players}, mapped games: {n_games}")
    print(f"unmapped names: {len(unmapped)}")
    top_unmapped = sorted(unmapped.items(), key=lambda x: -x[1])[:15]
    for name, cnt in top_unmapped:
        print(f"  {name}: {cnt} games")


if __name__ == "__main__":
    main()
