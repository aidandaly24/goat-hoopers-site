#!/usr/bin/env python3
"""
Append one season of mapped game logs into the committed gamelog file.

Usage: python3 scripts/merge-gamelog-season.py BASE SEASON_JSON OUT SEASON

Reads the base mapped file (data/gamelog_mapped.json) and a single-season
mapped file produced by prepare-gamelog.py, appends only games of SEASON,
and writes OUT. The point of doing it this way: regenerating the whole file
would rewrite pre-existing seasons (the committed rows predate the Bitadze
hand-map), which is a separate approval. This script asserts the invariant
instead — removing SEASON's games from the output must reproduce BASE
exactly, player for player, game for game.
"""
import json
import sys


def main():
    base_path, season_path, out_path, season = sys.argv[1:5]
    base = json.load(open(base_path))
    addition = json.load(open(season_path))

    merged = {"players": {}}
    for pid, entry in base["players"].items():
        merged["players"][pid] = {"games": list(entry["games"])}

    added_games = 0
    new_players = 0
    for pid, entry in addition["players"].items():
        games = entry["games"]
        if any(g["season"] != season for g in games):
            raise SystemExit(f"season file contains a non-{season} game for {pid}")
        if pid not in merged["players"]:
            merged["players"][pid] = {"games": []}
            new_players += 1
        existing_dates = {g["date"] for g in merged["players"][pid]["games"]}
        for g in games:
            if g["date"] in existing_dates:
                raise SystemExit(f"duplicate game date {g['date']} for {pid}")
            merged["players"][pid]["games"].append(g)
            added_games += 1
        merged["players"][pid]["games"].sort(key=lambda g: g["date"])

    # Invariant: stripping the appended season reproduces the base exactly.
    stripped = {
        "players": {
            pid: {"games": [g for g in e["games"] if g["season"] != season]}
            for pid, e in merged["players"].items()
        }
    }
    stripped = {"players": {p: e for p, e in stripped["players"].items() if e["games"]}}
    if stripped != base:
        raise SystemExit("invariant failed: pre-existing rows changed")

    json.dump(merged, open(out_path, "w"))
    total = sum(len(e["games"]) for e in merged["players"].values())
    print(f"added {added_games} {season} games ({new_players} new players); "
          f"total players: {len(merged['players'])}, total games: {total}")


if __name__ == "__main__":
    main()
