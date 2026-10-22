#!/usr/bin/env python3
"""
Offline regression for scripts/validate-gamelog-2025-26.py (issue #217).

Covers the dot's PR #252 re-review items: the reverse cross-check must
actually compute ESPN-positive-but-unmapped identities (it previously
hardcoded an empty list), and the documented CLI must honor --out and
--directory (the previous hand-rolled option parsing silently ignored
--out and overwrote the committed default receipt).

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
