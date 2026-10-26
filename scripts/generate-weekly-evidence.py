#!/usr/bin/env python3
"""Generate a weekly player-evidence receipt for a completed fantasy week.

Why this exists (issue #190): Sleeper exposes no per-player counted points
for NBA lock-in leagues after a week closes.

- Public REST matchup reads report each starter's FINAL game of the week and
  silently ignore locks (verified 2026-10-26: roster 8 REST total 250.5 vs
  the official leg total 247.5).
- The authenticated GraphQL matchup leg is the ground truth for the official
  team total, the eleven starters, and the lock map (`starters_games`), but
  it carries no per-player points.
- Sleeper's GraphQL player-stats fields are not implemented for the NBA
  ("Sorry, nba stats are not yet implemented").

So this operator-run generator reconstructs each starter's counted points:
the locked game's box score when the leg records a lock, otherwise the
player's final played game of the week. Box scores come from ESPN's public
summary endpoint (the same source the site already uses for live games) and
are scored with the league's own `scoring_settings`. A receipt is only
trustworthy because it is reconciled per team against the leg's official
points:

- residual 0            -> status "verified"
- 0 < |residual| <= 4   -> status "verified-foul-residual" (ESPN box scores
                           do not itemise technical/flagrant fouls; Sleeper
                           scores tf/ff at -2 each, which bounds the gap)
- otherwise             -> status "unreconciled"; the adapter refuses to
                           serve that team rather than publish wrong numbers

Usage:
    SLEEPER_JWT=<raw token, no "Bearer"> \
      python3 scripts/generate-weekly-evidence.py --week 1 [--season 2026]

The token is read from the environment only and never written anywhere.
Output: src/data/weekly-receipts/<season>-week-<NN>.json
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

LEAGUE_ID = "1387473752807190528"
ET = ZoneInfo("America/New_York")
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ESPN uses a few abbreviations that differ from Sleeper's.
ESPN_ABBR_ALIAS = {"GS": "GSW", "NO": "NOP", "NY": "NYK", "SA": "SAS",
                   "UTAH": "UTA", "WSH": "WAS"}


def http_json(url):
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as res:
                return json.load(res)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2)


def gql(query, token):
    """GraphQL via curl: Sleeper's chunked responses truncate under urllib."""
    payload = json.dumps({"query": query})
    for attempt in range(3):
        proc = subprocess.run(
            ["curl", "-s", "--retry", "2", "https://api.sleeper.app/graphql",
             "-H", f"Authorization: {token}", "-H", "X-Platform: web",
             "-H", "Content-Type: application/json", "-d", payload],
            capture_output=True, text=True, timeout=60)
        try:
            data = json.loads(proc.stdout)
            if data.get("data"):
                return data["data"]
        except json.JSONDecodeError:
            pass
        if attempt == 2:
            raise RuntimeError(f"GraphQL query failed: {proc.stdout[:200]}")
        time.sleep(2)


def fantasy_points(line, settings):
    cats = sum(1 for k in ("pts", "reb", "ast", "stl", "blk") if line[k] >= 10)
    value = (line["pts"] * settings["pts"] + line["reb"] * settings["reb"]
             + line["ast"] * settings["ast"] + line["stl"] * settings["stl"]
             + line["blk"] * settings["blk"] + line["to"] * settings["to"]
             + line["tpm"] * settings["tpm"])
    # A triple-double earns both the double-double and triple-double bonuses
    # (verified against Jokić's 2026-10-24 game: Sleeper 51.0, not 50.0).
    if cats >= 3:
        value += settings["dd"] + settings["td"]
    elif cats == 2:
        value += settings["dd"]
    # The 50-point bonus stacks on the 40-point bonus (verified the same way).
    if line["pts"] >= 50:
        value += settings["bonus_pt_40p"] + settings["bonus_pt_50p"]
    elif line["pts"] >= 40:
        value += settings["bonus_pt_40p"]
    if line["ast"] >= 15:
        value += settings["bonus_ast_15p"]
    if line["reb"] >= 20:
        value += settings["bonus_reb_20p"]
    # tf/ff (-2 each) cannot be applied: ESPN box scores do not itemise them.
    return round(value, 2)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--week", type=int, required=True)
    parser.add_argument("--season", default="2026")
    args = parser.parse_args()
    token = os.environ.get("SLEEPER_JWT")
    if not token:
        sys.exit("SLEEPER_JWT env var is required (raw token, no 'Bearer')")

    me = gql("{ me { user_id display_name } }", token)
    print("authenticated as", me["me"]["display_name"], me["me"]["user_id"])

    league = http_json(f"https://api.sleeper.app/v1/league/{LEAGUE_ID}")
    settings = league["scoring_settings"]

    legs = gql(
        "{ matchup_legs(round:%d, league_id:\"%s\") "
        "{ roster_id points starters starters_games } }" % (args.week, LEAGUE_ID),
        token)["matchup_legs"]

    def games_for(week):
        rows = gql(
            "{ scores(week:%d, season:\"%s\", season_type:\"regular\", "
            "sport:\"nba\") { game_id week status start_time metadata } }"
            % (week, args.season), token)["scores"]
        return sorted(rows, key=lambda g: g["start_time"])

    week_games = games_for(args.week)
    next_games = games_for(args.week + 1)
    starts_at = datetime.fromtimestamp(week_games[0]["start_time"] / 1000, timezone.utc)
    if next_games:
        ends_at = datetime.fromtimestamp(next_games[0]["start_time"] / 1000, timezone.utc)
    else:
        ends_at = datetime.fromtimestamp(week_games[-1]["start_time"] / 1000, timezone.utc)

    with open(os.path.join(REPO_ROOT, "src/data/espn-id-map.json")) as fh:
        id_map = json.load(fh)
    espn_to_sleeper = {v: k for k, v in id_map.items() if v}

    # Match each Sleeper game to its ESPN event by ET date + team pair.
    events = {}
    dates = sorted({datetime.fromtimestamp(g["start_time"] / 1000, ET).strftime("%Y-%m-%d")
                    for g in week_games})
    for date in dates:
        board = http_json("https://site.api.espn.com/apis/site/v2/sports/"
                          f"basketball/nba/scoreboard?dates={date.replace('-', '')}")
        for event in board.get("events", []):
            comp = event["competitions"][0]
            abbr = {c["homeAway"]: ESPN_ABBR_ALIAS.get(c["team"]["abbreviation"],
                                                       c["team"]["abbreviation"])
                    for c in comp["competitors"]}
            events[(date, abbr["away"], abbr["home"])] = event["id"]

    # lines[game_id][sleeper_player_id] = stat line (minutes > 0 only)
    lines = {}
    for game in week_games:
        md = game["metadata"]
        date = datetime.fromtimestamp(game["start_time"] / 1000, ET).strftime("%Y-%m-%d")
        event_id = events.get((date, md["away_team"]["team"], md["home_team"]["team"]))
        if not event_id:
            sys.exit(f"no ESPN event matched Sleeper game {game['game_id']}")
        summary = http_json("https://site.api.espn.com/apis/site/v2/sports/"
                            f"basketball/nba/summary?event={event_id}")
        per = {}
        for team in (summary.get("boxscore") or {}).get("players", []):
            for stat in team.get("statistics", []):
                keys = stat.get("keys", [])
                for athlete in stat.get("athletes", []):
                    if athlete.get("didNotPlay"):
                        continue
                    sleeper_id = espn_to_sleeper.get(str(athlete["athlete"]["id"]))
                    if not sleeper_id:
                        continue
                    raw = dict(zip(keys, athlete.get("stats", [])))

                    def num(key):
                        value = raw.get(key)
                        return float(value) if value not in (None, "", "--") else 0.0

                    def made(key):
                        return float(str(raw.get(key) or "0-0").split("-")[0])

                    if num("minutes") <= 0:
                        continue
                    per[sleeper_id] = {
                        "min": num("minutes"), "pts": num("points"),
                        "reb": num("rebounds"), "ast": num("assists"),
                        "stl": num("steals"), "blk": num("blocks"),
                        "to": num("turnovers"),
                        "tpm": made("threePointFieldGoalsMade-threePointFieldGoalsAttempted"),
                    }
        lines[str(game["game_id"])] = per

    game_ids = [str(g["game_id"]) for g in week_games]
    teams = []
    for leg in sorted(legs, key=lambda row: row["roster_id"]):
        locks = leg.get("starters_games") or {}
        if isinstance(locks, str):
            locks = json.loads(locks)
        players = []
        computed = 0.0
        for sleeper_id in leg["starters"]:
            played = [(gid, lines[gid][sleeper_id]) for gid in game_ids
                      if sleeper_id in lines.get(gid, {})]
            games_played = len(played)
            locked_game = locks.get(sleeper_id)
            counted_game = None
            counted = None
            if locked_game and str(locked_game) in lines and sleeper_id in lines[str(locked_game)]:
                counted_game = str(locked_game)
                counted = fantasy_points(lines[counted_game][sleeper_id], settings)
            elif played:
                counted_game, line = played[-1]
                counted = fantasy_points(line, settings)
            if counted is not None:
                computed += counted
            players.append({
                "playerId": sleeper_id,
                "gamesPlayed": games_played,
                "countedPoints": counted,
                "countedGameId": counted_game,
                "locked": counted_game is not None and counted_game == str(locked_game),
            })
        players.sort(key=lambda p: (p["countedPoints"] is None,
                                    -(p["countedPoints"] or 0), p["playerId"]))
        official = leg["points"]
        residual = round(computed - official, 2) if official is not None else None
        if residual == 0:
            status = "verified"
        elif residual is not None and abs(residual) <= 4:
            status = "verified-foul-residual"
        else:
            status = "unreconciled"
        teams.append({
            "teamId": str(leg["roster_id"]),
            "officialPoints": official,
            "computedPoints": round(computed, 2),
            "residual": residual,
            "status": status,
            "players": players,
        })
        print(f"roster {leg['roster_id']}: official={official} "
              f"computed={round(computed, 2)} residual={residual} status={status}")

    receipt = {
        "season": args.season,
        "week": args.week,
        "startsAt": starts_at.isoformat().replace("+00:00", "Z"),
        "endsAt": ends_at.isoformat().replace("+00:00", "Z"),
        "generatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "generator": "scripts/generate-weekly-evidence.py",
        "source": ("Sleeper authenticated matchup leg (starters, lock map, "
                   "official totals) + ESPN box scores scored with the "
                   "league's scoring_settings"),
        "teams": teams,
    }
    out_dir = os.path.join(REPO_ROOT, "src/data/weekly-receipts")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{args.season}-week-{args.week:02d}.json")
    with open(out_path, "w") as fh:
        json.dump(receipt, fh, indent=2)
        fh.write("\n")
    print("wrote", out_path)


if __name__ == "__main__":
    main()
