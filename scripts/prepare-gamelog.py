#!/usr/bin/env python3
"""
Prepare game-log data for the price-history backfill.

Reads the Hugging Face parquet game logs (2021-22 through 2025-26),
maps player_name -> Sleeper player_id via normalized name matching,
computes approximate per-game fantasy PPG (ff/tf penalties are omitted), and
writes a JSON file for scripts/backfill-price-history.ts to price.

Usage: python3 scripts/prepare-gamelog.py [season ...]
  Seasons default to all five. Pass one season (e.g. 2025-26) to map only
  that season, e.g. as input to scripts/merge-gamelog-season.py.
Reads: $GAMELOG_DIR (default /tmp/gamelogs) — game_logs/game_logs_<season>.parquet
  or legacy gl_<season>.parquet; $SLEEPER_PLAYERS (default /tmp/sleeper_players.json)
Writes: $GAMELOG_OUT (default /tmp/gamelog_mapped.json)
  Optional $GAMELOG_PROVENANCE_OUT: also write a per-row provenance sidecar
  retaining the source join keys the mapped shape discards (source player
  and game IDs, the full raw stat line, the Sleeper ID it mapped to, and
  the mapping reason) — data/README.md asks for exactly this on a new
  source revision. $GAMELOG_SOURCE_REVISION is recorded in the sidecar.

Note: the committed data/gamelog_mapped.json rows for 2021-22..2024-25 predate
the Bitadze hand-map below; a full regeneration would add those 217 rows and
remains a separate approval (see data/README.md). The 2025-26 append was done
by mapping that season alone and merging with merge-gamelog-season.py, which
asserts every pre-existing row is unchanged.
"""
import hashlib
import json
import os
import re
import sys
import unicodedata
from collections import defaultdict

import pyarrow.parquet as pq

ALL_SEASONS = ("2021-22", "2022-23", "2023-24", "2024-25", "2025-26")

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
    "hansen yang": "Yang Hansen",  # source uses Western order; Sleeper lists family name first
}

# Directory duplicates the name matcher cannot resolve: normalized name ->
# Sleeper player_id, pinned by identity evidence (team + espn-id-map entry).
ID_OVERRIDES = {
    # Two active "Jaylin Williams" entries exist; 2845 is a team-less
    # duplicate, 2475 is the OKC player (and the espn-id-map identity).
    "jaylin williams": "2475",
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
    seasons = tuple(sys.argv[1:]) or ALL_SEASONS
    gamelog_dir = os.environ.get("GAMELOG_DIR", "/tmp/gamelogs")
    # Sleeper directory: normalized name -> player_id.
    directory = json.load(open(os.environ.get("SLEEPER_PLAYERS", "/tmp/sleeper_players.json")))
    name_to_id = {}
    for pid, p in directory.items():
        full = p.get("full_name")
        if not full:
            continue
        key = normalize(full)
        # First write wins; duplicates (rare) keep the active player.
        if key not in name_to_id or p.get("active"):
            name_to_id[key] = pid
    for key, pid in ID_OVERRIDES.items():
        if pid in directory:
            name_to_id[key] = pid

    games_by_player = defaultdict(list)
    unmapped = defaultdict(int)
    total_rows = 0
    provenance_out = os.environ.get("GAMELOG_PROVENANCE_OUT")
    provenance = []

    def json_safe(value):
        if value is None or isinstance(value, (str, int, float, bool)):
            return value
        if hasattr(value, "item"):
            return value.item()
        return str(value)

    for season in seasons:
        candidates = [
            os.path.join(gamelog_dir, "game_logs", f"game_logs_{season}.parquet"),
            os.path.join(gamelog_dir, f"gl_{season}.parquet"),
        ]
        path = next((p for p in candidates if os.path.exists(p)), candidates[0])
        file_sha256 = hashlib.sha256(open(path, "rb").read()).hexdigest()
        t = pq.read_table(path)
        df = t.to_pandas()
        for r in df.itertuples():
            total_rows += 1
            raw = r._asdict()
            raw_key = normalize(r.player_name)
            if raw_key in ID_OVERRIDES:
                reason = "id-override"
            elif raw_key in HAND_MAP:
                reason = "hand-map"
            else:
                reason = "directory-name"
            key = raw_key
            # Hand-map known dataset quirks before the directory lookup.
            if key in HAND_MAP:
                key = normalize(HAND_MAP[key])
            pid = name_to_id.get(key)
            if provenance_out:
                provenance.append({
                    "season": season,
                    "sourceFile": os.path.basename(path),
                    "sourceFileSha256": file_sha256,
                    "sourcePlayerId": json_safe(raw.get("player_id")),
                    "sourcePlayerName": r.player_name,
                    "sourceGameId": json_safe(raw.get("game_id")),
                    "sleeperId": pid,
                    "mappingReason": reason if pid else "unmapped",
                    # "Index" is the itertuples row number, not a source column.
                    "raw": {k: json_safe(v) for k, v in raw.items() if k != "Index"},
                })
            if not pid:
                unmapped[r.player_name] += 1
                continue
            games_by_player[pid].append(
                {
                    "date": str(r.game_date),
                    "season": season,
                    "fppg": game_fppg(raw),
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
    json.dump(out, open(os.environ.get("GAMELOG_OUT", "/tmp/gamelog_mapped.json"), "w"))

    if provenance_out:
        sidecar = {
            "source": "cbratkovics/nba-game-logs",
            "sourceRevision": os.environ.get("GAMELOG_SOURCE_REVISION"),
            "records": provenance,
        }
        json.dump(sidecar, open(provenance_out, "w"), separators=(",", ":"))
        print(f"provenance: {len(provenance)} records -> {provenance_out}")

    n_players = len(games_by_player)
    n_games = sum(len(games) for games in games_by_player.values())
    print(f"rows: {total_rows}, mapped players: {n_players}, mapped games: {n_games}")
    print(f"unmapped names: {len(unmapped)}")
    top_unmapped = sorted(unmapped.items(), key=lambda x: -x[1])[:15]
    for name, cnt in top_unmapped:
        print(f"  {name}: {cnt} games")


if __name__ == "__main__":
    main()
