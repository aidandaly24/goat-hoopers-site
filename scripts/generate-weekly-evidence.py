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
are scored with the league's own `scoring_settings`. Generation is
fail-closed — a receipt is only written when the week is provably complete
and every counted game is proven:

- Every week-tagged game must report Sleeper status "complete" and a final
  ESPN status; any other state aborts generation. Completion is never
  inferred from score sums.
- The end boundary is the next week's first tip from Sleeper `scores`.
  When that source is absent generation aborts; no boundary is ever
  substituted from this week's games.
- Every game must match an ESPN event and return a box score; a missing
  event or an empty/partial box score aborts generation.
- An explicit lock whose game has no box-score evidence for the player
  (no stat line, and the box score does not even record the player as
  present) is MISSING evidence: the starter's row is emitted unproven and
  the team is forced "unreconciled". Another played game is NEVER
  substituted for a locked game. (A box score that affirmatively records
  the player as present with no appearance — DNP / 0 minutes — proves the
  locked game counts as zero instead.)

Each team is then reconciled against the leg's official points:

- residual 0                     -> status "verified": exact actuals.
- residual a positive multiple   -> status "estimated-foul-residual": ESPN
  of 2, at most +4                  box scores do not itemise technical /
                                    flagrant fouls, which Sleeper scores at
                                    -2 each, so such a residual is fully
                                    explained by fouls the box score cannot
                                    show — but it is NOT attributable to any
                                    individual player. These rows are
                                    estimates, bounded by the disclosed
                                    residual, and are never actuals: the
                                    adapter withholds them from the
                                    exact-points contract and serves them
                                    only through the explicitly estimated
                                    showcase contract.
- anything else (negative, odd,  -> status "unreconciled"; the adapter
  or larger residuals, or any       refuses to serve that team rather than
  missing lock evidence)            publish wrong numbers.

Usage:
    SLEEPER_JWT=<raw token, no "Bearer"> \
      python3 scripts/generate-weekly-evidence.py --week 1 [--season 2026]

Offline self-tests (fixtures only, no network or token):
    python3 scripts/generate-weekly-evidence.py --self-test

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

# The largest team residual (computed - official) still explainable by
# technical/flagrant fouls ESPN box scores cannot itemise (-2 each).
MAX_FOUL_RESIDUAL = 4.0
EPSILON = 0.011


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


def classify_residual(residual):
    """Map a team residual (computed - official) to its evidence status.

    Only two shapes are provable: exactly zero, or a positive multiple of
    the -2 technical/flagrant unit within the disclosed bound (the missing
    fouls inflate the box-score sum above the official total). A negative
    or non-multiple residual is NOT explained by un-itemised fouls.
    """
    if residual is None:
        return "unreconciled"
    if abs(residual) <= EPSILON:
        return "verified"
    if residual > 0 and residual <= MAX_FOUL_RESIDUAL + EPSILON:
        units = residual / 2.0
        if abs(units - round(units)) <= EPSILON:
            return "estimated-foul-residual"
    return "unreconciled"


def resolve_week_window(week_games, next_games):
    """(starts_at, ends_at) for the receipt, from Sleeper `scores` only.

    `ends_at` is the next week's first tip — an exclusive scheduling
    bound. It is never substituted from this week's games: when the next
    week's source rows are absent the week cannot be bounded, so this
    raises instead of guessing.
    """
    if not week_games:
        raise ValueError("no games returned for the requested week")
    if not next_games:
        raise ValueError(
            "no games returned for the following week; the end boundary "
            "cannot be established from source and is never substituted")
    starts_at = datetime.fromtimestamp(week_games[0]["start_time"] / 1000,
                                       timezone.utc)
    ends_at = datetime.fromtimestamp(next_games[0]["start_time"] / 1000,
                                     timezone.utc)
    return starts_at, ends_at


def require_completed_week(week_games):
    """Fail closed unless every week-tagged game reports final status."""
    not_final = [str(g["game_id"]) for g in week_games
                 if g.get("status") != "complete"]
    if not_final:
        raise ValueError(
            "week is not provably complete: Sleeper scores status is not "
            f"'complete' for games {', '.join(not_final)}")


def select_counted_game_for_player(player_id, played, locked_game, lines,
                                   presence, settings):
    """Pick a starter's counted game under the lock-in rules.

    `played` is the player's [(game_id, line)] appearances (minutes > 0),
    in week order. Returns a dict with countedPoints / countedGameId /
    locked / missingLockEvidence.

    With an explicit lock the counted game is the locked game — proven by
    its box-score line, or proven zero when the box score affirmatively
    records the player as present without an appearance. When the locked
    game has no evidence for the player at all, the row is missing
    evidence: no other game is ever substituted.
    """
    if locked_game:
        locked_id = str(locked_game)
        line = (lines.get(locked_id) or {}).get(player_id)
        if line is not None:
            return {"countedPoints": fantasy_points(line, settings),
                    "countedGameId": locked_id, "locked": True,
                    "missingLockEvidence": False}
        if player_id in (presence.get(locked_id) or set()):
            # The box score records the player in this game with no
            # appearance (DNP / 0 minutes): the locked game provably
            # counts as zero.
            return {"countedPoints": 0.0, "countedGameId": locked_id,
                    "locked": True, "missingLockEvidence": False}
        return {"countedPoints": None, "countedGameId": None,
                "locked": True, "missingLockEvidence": True}
    if played:
        counted_game, line = played[-1]
        return {"countedPoints": fantasy_points(line, settings),
                "countedGameId": counted_game, "locked": False,
                "missingLockEvidence": False}
    return {"countedPoints": None, "countedGameId": None, "locked": False,
            "missingLockEvidence": False}


def build_receipt(season, week, legs, settings, lines, presence, game_ids,
                  starts_at, ends_at, generated_at):
    """Assemble a receipt dict from already-fetched source data (pure)."""
    teams = []
    for leg in sorted(legs, key=lambda row: row["roster_id"]):
        locks = leg.get("starters_games") or {}
        if isinstance(locks, str):
            locks = json.loads(locks)
        players = []
        computed = 0.0
        evidence_complete = True
        for sleeper_id in leg["starters"]:
            played = [(gid, lines[gid][sleeper_id]) for gid in game_ids
                      if sleeper_id in lines.get(gid, {})]
            picked = select_counted_game_for_player(
                sleeper_id, played, locks.get(sleeper_id), lines, presence,
                settings)
            if picked["missingLockEvidence"]:
                evidence_complete = False
            if picked["countedPoints"] is not None:
                computed += picked["countedPoints"]
            players.append({
                "playerId": sleeper_id,
                "gamesPlayed": len(played),
                "countedPoints": picked["countedPoints"],
                "countedGameId": picked["countedGameId"],
                "locked": picked["locked"],
            })
        players.sort(key=lambda p: (p["countedPoints"] is None,
                                    -(p["countedPoints"] or 0), p["playerId"]))
        official = leg["points"]
        residual = round(computed - official, 2) if official is not None else None
        # Missing lock evidence (or a missing official total) fails the
        # team closed no matter what the residual happens to be: a
        # coincidental sum never verifies an unproven counted game.
        status = classify_residual(residual) if evidence_complete \
            else "unreconciled"
        teams.append({
            "teamId": str(leg["roster_id"]),
            "officialPoints": official,
            "computedPoints": round(computed, 2),
            "residual": residual,
            "status": status,
            "evidenceComplete": evidence_complete,
            "players": players,
        })
    return {
        "season": season,
        "week": week,
        "startsAt": starts_at.isoformat().replace("+00:00", "Z"),
        "endsAt": ends_at.isoformat().replace("+00:00", "Z"),
        "generatedAt": generated_at.isoformat().replace("+00:00", "Z"),
        "generator": "scripts/generate-weekly-evidence.py",
        "source": ("Sleeper authenticated matchup leg (starters, lock map, "
                   "official totals) + ESPN box scores scored with the "
                   "league's scoring_settings"),
        "teams": teams,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--week", type=int)
    parser.add_argument("--season", default="2026")
    parser.add_argument("--self-test", action="store_true",
                        help="run the offline fixture tests and exit")
    args = parser.parse_args()
    if args.self_test:
        return run_self_tests()
    if args.week is None:
        parser.error("--week is required unless --self-test is given")
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
    if any(leg.get("points") is None for leg in legs):
        sys.exit("a matchup leg carries no official points; refusing to "
                 "generate a receipt for an unscored week")

    def games_for(week):
        rows = gql(
            "{ scores(week:%d, season:\"%s\", season_type:\"regular\", "
            "sport:\"nba\") { game_id week status start_time metadata } }"
            % (week, args.season), token)["scores"]
        return sorted(rows, key=lambda g: g["start_time"])

    week_games = games_for(args.week)
    next_games = games_for(args.week + 1)
    try:
        require_completed_week(week_games)
        starts_at, ends_at = resolve_week_window(week_games, next_games)
    except ValueError as err:
        sys.exit(f"refusing to generate: {err}")

    with open(os.path.join(REPO_ROOT, "src/data/espn-id-map.json")) as fh:
        id_map = json.load(fh)
    espn_to_sleeper = {v: k for k, v in id_map.items() if v}

    # Match each Sleeper game to its ESPN event by ET date + team pair,
    # keeping the event's completion flag for the finality check.
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
            completed = (event.get("status") or {}).get("type", {}).get("completed")
            events[(date, abbr["away"], abbr["home"])] = (event["id"], completed)

    # lines[game_id][sleeper_player_id] = stat line (minutes > 0 only);
    # presence[game_id] = every mapped player the box score records at all
    # (including DNP / 0-minute rows), so a locked game's non-appearance
    # can be told apart from missing evidence.
    lines = {}
    presence = {}
    for game in week_games:
        md = game["metadata"]
        date = datetime.fromtimestamp(game["start_time"] / 1000, ET).strftime("%Y-%m-%d")
        matched = events.get((date, md["away_team"]["team"], md["home_team"]["team"]))
        if not matched:
            sys.exit(f"no ESPN event matched Sleeper game {game['game_id']}")
        event_id, board_completed = matched
        summary = http_json("https://site.api.espn.com/apis/site/v2/sports/"
                            f"basketball/nba/summary?event={event_id}")
        competitions = (summary.get("header") or {}).get("competitions") or []
        summary_completed = None
        if competitions:
            summary_completed = (competitions[0].get("status") or {}) \
                .get("type", {}).get("completed")
        if board_completed is not True and summary_completed is not True:
            sys.exit(f"ESPN event {event_id} for Sleeper game "
                     f"{game['game_id']} is not final; refusing to "
                     "generate from an in-progress game")
        team_boxes = (summary.get("boxscore") or {}).get("players") or []
        if len(team_boxes) < 2:
            sys.exit(f"ESPN summary for event {event_id} has no complete "
                     "box score; refusing to generate from partial data")
        per = {}
        present = set()
        for team in team_boxes:
            for stat in team.get("statistics", []):
                keys = stat.get("keys", [])
                for athlete in stat.get("athletes", []):
                    sleeper_id = espn_to_sleeper.get(str(athlete["athlete"]["id"]))
                    if not sleeper_id:
                        continue
                    present.add(sleeper_id)
                    if athlete.get("didNotPlay"):
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
        if not per:
            sys.exit(f"ESPN summary for event {event_id} produced no "
                     "player lines; refusing to generate from partial data")
        lines[str(game["game_id"])] = per
        presence[str(game["game_id"])] = present

    game_ids = [str(g["game_id"]) for g in week_games]
    receipt = build_receipt(args.season, args.week, legs, settings, lines,
                            presence, game_ids, starts_at, ends_at,
                            datetime.now(timezone.utc))
    for team in receipt["teams"]:
        print(f"roster {team['teamId']}: official={team['officialPoints']} "
              f"computed={team['computedPoints']} residual={team['residual']} "
              f"status={team['status']} "
              f"evidenceComplete={team['evidenceComplete']}")

    out_dir = os.path.join(REPO_ROOT, "src/data/weekly-receipts")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{args.season}-week-{args.week:02d}.json")
    with open(out_path, "w") as fh:
        json.dump(receipt, fh, indent=2)
        fh.write("\n")
    print("wrote", out_path)


def run_self_tests():
    """Offline fixtures for the fail-closed rules (no network, no token)."""
    import unittest

    settings = {"pts": 0.5, "reb": 1.0, "ast": 1.0, "stl": 2.0, "blk": 2.0,
                "to": -1.0, "tpm": 0.5, "dd": 1.0, "td": 2.0,
                "bonus_pt_40p": 2.0, "bonus_pt_50p": 2.0,
                "bonus_ast_15p": 2.0, "bonus_reb_20p": 2.0}

    def line(pts):
        return {"min": 30.0, "pts": float(pts), "reb": 0.0, "ast": 0.0,
                "stl": 0.0, "blk": 0.0, "to": 0.0, "tpm": 0.0}

    class CountedGameSelection(unittest.TestCase):
        def test_lock_absent_from_lines_never_falls_back(self):
            # The review fixture: the locked game has no line for the
            # player while another played game exists. The old code
            # substituted the played game and cleared the lock.
            lines = {"g1": {}, "g2": {"p1": line(20)}}
            presence = {"g1": {"someone-else"}, "g2": {"p1"}}
            played = [("g2", line(20))]
            picked = select_counted_game_for_player(
                "p1", played, "g1", lines, presence, settings)
            self.assertTrue(picked["missingLockEvidence"])
            self.assertIsNone(picked["countedPoints"])
            self.assertIsNone(picked["countedGameId"])
            self.assertTrue(picked["locked"])

        def test_lock_with_line_counts_the_locked_game(self):
            lines = {"g1": {"p1": line(10)}, "g2": {"p1": line(40)}}
            presence = {"g1": {"p1"}, "g2": {"p1"}}
            played = [("g1", line(10)), ("g2", line(40))]
            picked = select_counted_game_for_player(
                "p1", played, "g1", lines, presence, settings)
            self.assertEqual(picked["countedGameId"], "g1")
            self.assertEqual(picked["countedPoints"], 5.0)
            self.assertTrue(picked["locked"])
            self.assertFalse(picked["missingLockEvidence"])

        def test_lock_proven_zero_when_box_score_records_presence(self):
            lines = {"g1": {}, "g2": {"p1": line(20)}}
            presence = {"g1": {"p1"}, "g2": {"p1"}}
            played = [("g2", line(20))]
            picked = select_counted_game_for_player(
                "p1", played, "g1", lines, presence, settings)
            self.assertEqual(picked["countedPoints"], 0.0)
            self.assertEqual(picked["countedGameId"], "g1")
            self.assertFalse(picked["missingLockEvidence"])

        def test_unlocked_counts_final_played_game(self):
            lines = {"g1": {"p1": line(10)}, "g2": {"p1": line(40)}}
            played = [("g1", line(10)), ("g2", line(40))]
            picked = select_counted_game_for_player(
                "p1", played, None, lines, {}, settings)
            self.assertEqual(picked["countedGameId"], "g2")
            self.assertFalse(picked["locked"])

        def test_missing_lock_evidence_fails_the_team_closed(self):
            legs = [{"roster_id": 1, "points": 10.0, "starters": ["p1"],
                     "starters_games": {"p1": "g1"}}]
            lines = {"g1": {}, "g2": {"p1": line(20)}}
            presence = {"g1": set(), "g2": {"p1"}}
            receipt = build_receipt(
                "2026", 1, legs, settings, lines, presence, ["g1", "g2"],
                datetime(2026, 10, 20, 19, tzinfo=timezone.utc),
                datetime(2026, 10, 26, 23, tzinfo=timezone.utc),
                datetime(2026, 10, 26, 17, tzinfo=timezone.utc))
            team = receipt["teams"][0]
            # Residual here is -10 (nothing counted); the point of the
            # fixture is that evidence completeness, not the sum, decides.
            self.assertFalse(team["evidenceComplete"])
            self.assertEqual(team["status"], "unreconciled")

    class ResidualClassification(unittest.TestCase):
        def test_bands(self):
            self.assertEqual(classify_residual(0.0), "verified")
            self.assertEqual(classify_residual(2.0), "estimated-foul-residual")
            self.assertEqual(classify_residual(4.0), "estimated-foul-residual")
            self.assertEqual(classify_residual(-2.0), "unreconciled")
            self.assertEqual(classify_residual(1.0), "unreconciled")
            self.assertEqual(classify_residual(3.0), "unreconciled")
            self.assertEqual(classify_residual(2.5), "unreconciled")
            self.assertEqual(classify_residual(6.0), "unreconciled")
            self.assertEqual(classify_residual(None), "unreconciled")

    class WindowAndCompletion(unittest.TestCase):
        def test_end_boundary_is_never_substituted(self):
            games = [{"game_id": "g1", "start_time": 1792522800000,
                      "status": "complete"}]
            with self.assertRaises(ValueError):
                resolve_week_window(games, [])

        def test_incomplete_week_fails_closed(self):
            games = [{"game_id": "g1", "status": "in_progress"},
                     {"game_id": "g2", "status": "complete"}]
            with self.assertRaises(ValueError):
                require_completed_week(games)
            require_completed_week([{"game_id": "g2", "status": "complete"}])

    suite = unittest.TestSuite()
    loader = unittest.TestLoader()
    for case in (CountedGameSelection, ResidualClassification,
                 WindowAndCompletion):
        suite.addTests(loader.loadTestsFromTestCase(case))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
