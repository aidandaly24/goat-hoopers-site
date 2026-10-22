#!/usr/bin/env python3
"""
Offline regression for scripts/validate-gamelog-2025-26.py (issue #217).

Covers the dot's PR #252 re-review items: the reverse cross-check must
actually compute ESPN-positive-but-unmapped identities (it previously
hardcoded an empty list), and the documented CLI must honor --out and
--directory (the previous hand-rolled option parsing silently ignored
--out and overwrote the committed default receipt). Also covers the
minutes HOLD: the source minutes column is an MM.SS clock float, and
every committed mapped value must equal its conversion.

Run: python3 scripts/test_validate_gamelog_2025_26.py
"""
import hashlib
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("validate", HERE / "validate-gamelog-2025-26.py")
validate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validate)


class CrossCheckTest(unittest.TestCase):
    def test_detects_espn_positive_player_missing_from_dataset(self):
        season_players = {"111": 50, "222": 30}
        id_map = {"111": "9001", "222": "9002", "333": "9003"}
        espn_gp = {"9001": 50, "9002": 31, "9003": 12}
        check, players = validate.cross_check(season_players, id_map, espn_gp)
        self.assertEqual(check["exact"], 1)
        self.assertEqual(len(check["discrepancies"]), 1)
        self.assertEqual(check["offByOne"], 1)
        # 333 played 12 ESPN games but has no mapped rows: must surface.
        self.assertEqual([d["sleeperId"] for d in check["espnPositivePlayersUnmapped"]], ["333"])
        self.assertEqual(players["111"]["status"], "exact")

    def test_zero_game_identity_is_not_unmapped_positive(self):
        check, _ = validate.cross_check({}, {"111": "9001"}, {"9001": 0})
        self.assertEqual(check["espnPositivePlayersUnmapped"], [])

    def test_no_cross_check_bucket(self):
        check, _ = validate.cross_check({"111": 5}, {}, {})
        self.assertEqual(check["noEspnCrossCheck"], ["111"])


class MinutesConversionTest(unittest.TestCase):
    """Clock-vs-decimal regression for the PR #252 minutes HOLD: the
    source minutes column is an MM.SS clock float, and the validator's
    conversion must agree with the mapper's on the dot's examples."""

    def test_dot_execution_review_examples(self):
        self.assertEqual(validate.source_minutes_to_decimal(48.53), 48.9)  # Sengun 48:53
        self.assertEqual(validate.source_minutes_to_decimal(29.41), 29.7)  # Wembanyama 29:41
        self.assertEqual(validate.source_minutes_to_decimal(31.32), 31.5)  # Flagg 31:32
        self.assertEqual(validate.source_minutes_to_decimal(47.03), 47.1)  # Durant 47:03
        self.assertEqual(validate.source_minutes_to_decimal(30.6), 31.0)   # Towns: raw 30.6 = 31:00
        self.assertEqual(validate.clock_string(48.53), "48:53")
        self.assertEqual(validate.clock_string(30.6), "31:00")

    def test_out_of_encoding_refused(self):
        with self.assertRaises(ValueError):
            validate.source_minutes_to_seconds(12.75)


class MinutesCheckTest(unittest.TestCase):
    def _inputs(self, mapped_minutes):
        mapped = {"players": {"2308": {"games": [
            {"date": "2025-10-21 00:00:00", "season": "2025-26",
             "fppg": 40.0, "minutes": mapped_minutes}]}}}
        records = [{"sleeperId": "2308",
                    "raw": {"game_date": "2025-10-21", "minutes": 48.53,
                            "game_id": "0022500001", "team": "HOU"}}]
        return mapped, records

    def test_converted_minutes_pass(self):
        check = validate.minutes_check(*self._inputs(48.9))
        self.assertEqual(check["rowsChecked"], 1)
        self.assertEqual(check["mismatches"], 0)

    def test_decimal_misreading_is_caught(self):
        # The pre-fix stored value for raw 48.53 was round(48.53, 1) = 48.5.
        check = validate.minutes_check(*self._inputs(48.5))
        self.assertEqual(check["mismatches"], 1)
        self.assertEqual(check["mismatchExamples"][0]["expectedMinutes"], 48.9)


class CommittedDatasetMinutesTest(unittest.TestCase):
    """Whole-dataset regression on the committed files: every mapped
    2025-26 minutes value must equal the conversion of its sidecar raw
    value, and the decoded team-game totals must keep the legal-total
    scatter recorded in the receipt."""

    @classmethod
    def setUpClass(cls):
        root = HERE.parent
        cls.mapped = json.loads((root / "data" / "gamelog_mapped.json").read_text())
        cls.records = json.loads(
            (root / "data" / "gamelog_2025-26_provenance.json").read_text())["records"]

    def test_every_mapped_minutes_matches_raw_conversion(self):
        check = validate.minutes_check(self.mapped, self.records)
        self.assertEqual(check["rowsChecked"], 26648)
        self.assertEqual(check["mismatches"], 0)
        self.assertEqual(check["seconds60CarryRows"], 77)

    def test_team_game_totals_scatter(self):
        totals = validate.team_game_totals(self.records)
        self.assertEqual(totals["teamGames"], 2460)
        self.assertEqual(totals["deltaSecondsVsLegal"],
                         {"-1": 63, "0": 2021, "1": 314, "2": 56, "3": 6})

    def test_spot_checks_verify_against_committed_data(self):
        checks = validate.build_spot_checks(self.mapped, self.records)
        self.assertEqual(len(checks), 3)
        towns = checks[2]["players"]["Karl-Anthony Towns"]
        self.assertEqual(towns["sourceRawMinutes"], 30.6)
        self.assertEqual(towns["mappedMinutes"], 31.0)


class CliTest(unittest.TestCase):
    def test_out_and_directory_are_honored(self):
        root = HERE.parent
        default_receipt = root / "data" / "gamelog_2025-26_validation.json"
        before = hashlib.sha256(default_receipt.read_bytes()).hexdigest()
        extract = {"athletes": [{"id": "6430", "gamesPlayed": 1}]}
        with tempfile.TemporaryDirectory() as tmp:
            tmp = Path(tmp)
            (tmp / "extract.json").write_text(json.dumps(extract))
            (tmp / "directory.json").write_text(json.dumps({"1000": {"full_name": "Test Player"}}))
            out = tmp / "receipt.json"
            proc = subprocess.run(
                [sys.executable, str(HERE / "validate-gamelog-2025-26.py"),
                 str(tmp / "extract.json"), "--directory", str(tmp / "directory.json"),
                 "--out", str(out)],
                capture_output=True, text=True)
            self.assertEqual(proc.returncode, 0, proc.stderr)
            self.assertTrue(out.exists(), "receipt was not written to --out path")
            receipt = json.loads(out.read_text())
            self.assertIn("gamesPlayedCrossCheck", receipt)
        after = hashlib.sha256(default_receipt.read_bytes()).hexdigest()
        self.assertEqual(before, after, "default receipt must not be overwritten when --out is given")


if __name__ == "__main__":
    unittest.main()
