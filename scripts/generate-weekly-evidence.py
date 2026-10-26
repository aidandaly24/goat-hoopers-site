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
  substituted for a locked game. Presence proves a zero ONLY when it is
  validated: an explicit DNP record (`didNotPlay`), or a complete stat
  line whose minutes parse to a numeric zero. An athlete entry with
  absent or truncated stats (missing minutes, a "--" placeholder, a
  missing counting field) is NOT presence — it is unproven, exactly like
  a missing lock, and never defaults any field to 0.

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


# Stat fields a box-score line must carry — present and parseable — before
# the line (or a zero built on it) can be admitted as evidence. A line
# missing any of these is truncated, not a zero.
REQUIRED_STAT_KEYS = (
    "minutes", "points", "rebounds", "assists", "steals", "blocks",
    "turnovers", "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
)


def _parse_number(value):
    """Parse one numeric stat field; absent/placeholder values raise."""
    if value in (None, "", "--"):
        raise ValueError("stat field is absent")
    return float(value)


def _parse_made(value):
    """Parse the made half of a "made-attempted" stat field."""
    if not isinstance(value, str) or "-" not in value:
        raise ValueError("made-attempted field is absent or malformed")
    made, attempted = value.split("-", 1)
    _parse_number(attempted)
    return _parse_number(made)


def parse_stat_line(keys, stats):
    """Validate one athlete's raw stat line.

    Returns the scored line dict, or None when the line is incomplete:
    stats shorter than the key list (truncated), a required field absent
    from the keys, or a required value missing/unparseable. Incomplete
    lines are unproven evidence — no field ever defaults to 0.
    """
    if not keys or not stats or len(stats) < len(keys):
        return None
    if any(key not in keys for key in REQUIRED_STAT_KEYS):
        return None
    raw = dict(zip(keys, stats))
    try:
        return {
            "min": _parse_number(raw["minutes"]),
            "pts": _parse_number(raw["points"]),
            "reb": _parse_number(raw["rebounds"]),
            "ast": _parse_number(raw["assists"]),
            "stl": _parse_number(raw["steals"]),
            "blk": _parse_number(raw["blocks"]),
            "to": _parse_number(raw["turnovers"]),
            "tpm": _parse_made(
                raw["threePointFieldGoalsMade-threePointFieldGoalsAttempted"]),
        }
    except (ValueError, TypeError):
        return None


def parse_box_score_players(team_boxes, espn_to_sleeper):
    """Parse one game's ESPN box score into (lines, validated presence).

    `lines[sleeper_id]` holds validated stat lines with minutes > 0.
    `presence` holds only VALIDATED presence: an explicit DNP record, or
    a complete stat line (including a validated zero-minutes line). An
    athlete whose stats are absent or truncated appears in neither map —
    his presence is unproven, so a lock on this game for him is missing
    evidence, never a proven zero.

    Coverage is validated per expected team before anything is admitted:
    a team container with no statistics, or recording no athletes at all,
    raises ValueError — an empty half of a box score can never be papered
    over by the other team's rows.
    """
    if len(team_boxes) < 2:
        raise ValueError("box score does not cover both teams")
    per = {}
    present = set()
    for team in team_boxes:
        statistics = team.get("statistics") or []
        if not statistics:
            raise ValueError(
                "a team box score has no statistics; coverage is unproven")
        athletes_seen = 0
        for stat in statistics:
            keys = stat.get("keys", [])
            for athlete in stat.get("athletes", []):
                athletes_seen += 1
                sleeper_id = espn_to_sleeper.get(
                    str((athlete.get("athlete") or {}).get("id")))
                if not sleeper_id:
                    continue
                if athlete.get("didNotPlay"):
                    # An explicit DNP record affirmatively proves the
                    # player was recorded for this game and did not play.
                    present.add(sleeper_id)
                    continue
                line = parse_stat_line(keys, athlete.get("stats"))
                if line is None:
                    # Absent/truncated stats: unproven, never a zero.
                    continue
                present.add(sleeper_id)
                if line["min"] > 0:
                    per[sleeper_id] = line
        if athletes_seen == 0:
            raise ValueError(
                "a team box score records no athletes; coverage is unproven")
    return per, present


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
    records the player as present without an appearance. `presence` here
    is validated presence only (see `parse_box_score_players`): an
    athlete entry with absent/truncated stats never reaches it, so it
    can never certify a zero. When the locked game has no evidence for
    the player at all, the row is missing evidence: no other game is
    ever substituted.
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

    # lines[game_id][sleeper_player_id] = validated stat line (minutes
    # > 0 only); presence[game_id] = validated presence only (explicit
    # DNP, or a complete stat line including a zero-minutes one), so a
    # locked game's proven non-appearance can be told apart from missing
    # or truncated evidence.
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
        try:
            per, present = parse_box_score_players(team_boxes,
                                                   espn_to_sleeper)
        except ValueError as err:
            sys.exit(f"ESPN summary for event {event_id} has no complete "
                     f"box score ({err}); refusing to generate from "
                     "partial data")
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

    class BoxScoreParsing(unittest.TestCase):
        """Raw-summary fixtures: the parser, not a preconstructed presence
        set, decides what is proven — that is where the P2 lived."""
        KEYS = ["minutes", "points",
                "fieldGoalsMade-fieldGoalsAttempted",
                "threePointFieldGoalsMade-threePointFieldGoalsAttempted",
                "freeThrowsMade-freeThrowsAttempted",
                "rebounds", "assists", "turnovers", "steals", "blocks",
                "offensiveRebounds", "defensiveRebounds", "fouls",
                "plusMinus"]
        ID_MAP = {"e1": "p1", "e2": "p2"}

        def stats(self, minutes="30", points="10", reb="5", ast="3",
                  to="1", stl="1", blk="0", tpm="2-5"):
            return [minutes, points, "4-9", tpm, "0-0", reb, ast, to,
                    stl, blk, "1", "4", "2", "+3"]

        def team(self, athletes, keys=None):
            return {"statistics": [
                {"keys": self.KEYS if keys is None else keys,
                 "athletes": athletes}]}

        def athlete(self, espn_id, stats, dnp=False):
            return {"athlete": {"id": espn_id}, "didNotPlay": dnp,
                    "stats": stats}

        def boxes(self, p1_stats, dnp=False):
            return [self.team([self.athlete("e1", p1_stats, dnp)]),
                    self.team([self.athlete("e2", self.stats())])]

        def picked_for_lock(self, per, present):
            return select_counted_game_for_player(
                "p1", [], "g1", {"g1": per}, {"g1": present}, settings)

        def test_missing_minutes_value_is_unproven(self):
            per, present = parse_box_score_players(
                self.boxes(self.stats(minutes="")), self.ID_MAP)
            self.assertNotIn("p1", present)
            self.assertNotIn("p1", per)
            self.assertIn("p2", per)  # the valid athlete still parses
            picked = self.picked_for_lock(per, present)
            self.assertTrue(picked["missingLockEvidence"])
            self.assertIsNone(picked["countedPoints"])

        def test_placeholder_minutes_is_unproven(self):
            # The traced counterexample shape: minutes recorded as "--"
            # with the rest of the row placeholders, didNotPlay false.
            stats = ["--"] * len(self.KEYS)
            per, present = parse_box_score_players(
                self.boxes(stats), self.ID_MAP)
            self.assertNotIn("p1", present)
            picked = self.picked_for_lock(per, present)
            self.assertTrue(picked["missingLockEvidence"])

        def test_truncated_stat_line_is_unproven(self):
            per, present = parse_box_score_players(
                self.boxes(self.stats()[:3]), self.ID_MAP)
            self.assertNotIn("p1", present)
            self.assertNotIn("p1", per)
            picked = self.picked_for_lock(per, present)
            self.assertTrue(picked["missingLockEvidence"])

        def test_missing_counting_field_is_unproven(self):
            per, present = parse_box_score_players(
                self.boxes(self.stats(points="")), self.ID_MAP)
            self.assertNotIn("p1", present)
            self.assertNotIn("p1", per)
            picked = self.picked_for_lock(per, present)
            self.assertTrue(picked["missingLockEvidence"])

        def test_absent_counting_key_is_unproven(self):
            keys = [k for k in self.KEYS if k != "steals"]
            stats = self.stats()
            del stats[self.KEYS.index("steals")]
            boxes = [self.team([self.athlete("e1", stats)], keys=keys),
                     self.team([self.athlete("e2", self.stats())])]
            per, present = parse_box_score_players(boxes, self.ID_MAP)
            self.assertNotIn("p1", present)
            self.assertNotIn("p1", per)

        def test_complete_zero_line_certifies_a_proven_zero(self):
            zero = self.stats(minutes="0", points="0", reb="0", ast="0",
                              to="0", stl="0", blk="0", tpm="0-0")
            per, present = parse_box_score_players(
                self.boxes(zero), self.ID_MAP)
            self.assertIn("p1", present)
            self.assertNotIn("p1", per)  # recorded, but never appeared
            picked = self.picked_for_lock(per, present)
            self.assertEqual(picked["countedPoints"], 0.0)
            self.assertEqual(picked["countedGameId"], "g1")
            self.assertFalse(picked["missingLockEvidence"])

        def test_explicit_dnp_certifies_a_proven_zero(self):
            per, present = parse_box_score_players(
                self.boxes([], dnp=True), self.ID_MAP)
            self.assertIn("p1", present)
            picked = self.picked_for_lock(per, present)
            self.assertEqual(picked["countedPoints"], 0.0)
            self.assertFalse(picked["missingLockEvidence"])

        def test_valid_line_parses_into_a_line(self):
            per, present = parse_box_score_players(
                self.boxes(self.stats()), self.ID_MAP)
            self.assertIn("p1", present)
            self.assertEqual(per["p1"]["pts"], 10.0)
            self.assertEqual(per["p1"]["tpm"], 2.0)
            picked = self.picked_for_lock(per, present)
            self.assertFalse(picked["missingLockEvidence"])
            self.assertIsNotNone(picked["countedPoints"])

        def test_one_empty_team_fails_coverage(self):
            valid = self.team([self.athlete("e2", self.stats())])
            with self.assertRaises(ValueError):
                parse_box_score_players([valid, {"statistics": []}],
                                        self.ID_MAP)
            with self.assertRaises(ValueError):
                parse_box_score_players(
                    [valid, self.team([])], self.ID_MAP)

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
    for case in (CountedGameSelection, BoxScoreParsing,
                 ResidualClassification, WindowAndCompletion):
        suite.addTests(loader.loadTestsFromTestCase(case))
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    sys.exit(main())
