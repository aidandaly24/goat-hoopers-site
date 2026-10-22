#!/usr/bin/env python3
"""
Offline regression for scripts/merge-gamelog-season.py (issue #217).

Covers the cases the dot's exact-head review of PR #252 named: an
incoming duplicate (two rows for the same player/date inside the season
file), an overlap with a date already in the base, a wrong-season row,
and the append-only invariant (stripping the new season reproduces the
base exactly). Stdlib only; run with:

    python3 -m unittest scripts.test_merge_gamelog_season
    # or
    python3 scripts/test_merge_gamelog_season.py
"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("merge-gamelog-season.py")
SEASON = "2025-26"


def game(date, season=SEASON, fppg=10.0):
    return {"date": f"{date} 00:00:00", "season": season, "fppg": fppg, "minutes": 20.0}


BASE = {"players": {
    "111": {"games": [game("2024-11-01", "2024-25", 8.0)]},
    "222": {"games": [game("2024-11-02", "2024-25", 9.0)]},
}}


def run_merge(base, addition):
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "base.json").write_text(json.dumps(base))
        (tmp / "season.json").write_text(json.dumps(addition))
        proc = subprocess.run(
            [sys.executable, str(SCRIPT), str(tmp / "base.json"),
             str(tmp / "season.json"), str(tmp / "out.json"), SEASON],
            capture_output=True, text=True)
        out = None
        if (tmp / "out.json").exists():
            out = json.loads((tmp / "out.json").read_text())
        return proc, out


class MergeGamelogSeasonTest(unittest.TestCase):
    def test_appends_and_keeps_old_span_unchanged(self):
        addition = {"players": {
            "111": {"games": [game("2025-11-01")]},
            "333": {"games": [game("2025-11-01"), game("2025-11-03")]},
        }}
        proc, out = run_merge(BASE, addition)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        stripped = {"players": {
            pid: {"games": [g for g in e["games"] if g["season"] != SEASON]}
            for pid, e in out["players"].items()}}
        stripped = {"players": {p: e for p, e in stripped["players"].items() if e["games"]}}
        self.assertEqual(stripped, BASE)
        self.assertEqual(len(out["players"]["333"]["games"]), 2)

    def test_rejects_duplicate_within_incoming_season(self):
        # Two rows for the same player/date, neither in the base: the
        # pre-fix validator passed both because its seen set never grew.
        addition = {"players": {"111": {"games": [game("2025-11-01"), game("2025-11-01", fppg=99.0)]}}}
        proc, _ = run_merge(BASE, addition)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("duplicate", proc.stderr)

    def test_rejects_overlap_with_base_date(self):
        addition = {"players": {"111": {"games": [game("2024-11-01")]}}}
        proc, _ = run_merge(BASE, addition)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("duplicate", proc.stderr)

    def test_rejects_wrong_season_row(self):
        addition = {"players": {"111": {"games": [game("2025-11-01", "2024-25")]}}}
        proc, _ = run_merge(BASE, addition)
        self.assertNotEqual(proc.returncode, 0)
        self.assertIn("non-2025-26", proc.stderr)


if __name__ == "__main__":
    unittest.main()
