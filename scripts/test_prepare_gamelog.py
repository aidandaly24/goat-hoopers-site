#!/usr/bin/env python3
"""
Offline regression for the minutes conversion in prepare-gamelog.py
(issue #217, PR #252 minutes HOLD).

The source parquet `minutes` column is a clock-time MM.SS float
(48.53 = 48:53), not decimal minutes. The mapper previously stored
round(float(minutes), 1) — reading the clock float as decimal —
which understated minutes by up to 0.4 per row. These tests pin the
conversion: the dot's three execution-review examples, the externally
confirmed seconds-60 carry, boundary seconds, float-fuzz inputs, and
refusal of values outside the encoding.

Run: python3 scripts/test_prepare_gamelog.py
"""
import importlib.util
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("prepare", HERE / "prepare-gamelog.py")
prepare = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prepare)


class SourceMinutesTest(unittest.TestCase):
    def test_dot_execution_review_examples(self):
        # Raw source value -> Basketball-Reference clock -> mapped decimal.
        self.assertEqual(prepare.source_minutes_to_decimal(48.53), 48.9)   # Sengun 48:53
        self.assertEqual(prepare.source_minutes_to_decimal(29.41), 29.7)   # Wembanyama 29:41
        self.assertEqual(prepare.source_minutes_to_decimal(31.32), 31.5)   # Flagg 31:32

    def test_half_tenth_rounds_up_exactly(self):
        # 47:03 = 47.05 decimal: the float path round(47.05, 1) gives
        # 47.0 (47.05 is stored as 47.04999...); integer math gives 47.1.
        self.assertEqual(prepare.source_minutes_to_decimal(47.03), 47.1)

    def test_seconds_sixty_is_a_carry(self):
        # Raw 30.6 is 31:00 — Basketball-Reference lists Karl-Anthony
        # Towns at 31:00 for 2025-10-22 CLE @ NYK.
        self.assertEqual(prepare.source_minutes_to_seconds(30.6), 31 * 60)
        self.assertEqual(prepare.source_minutes_to_decimal(30.6), 31.0)
        self.assertEqual(prepare.source_minutes_to_decimal(0.6), 1.0)

    def test_boundaries(self):
        self.assertEqual(prepare.source_minutes_to_decimal(0.0), 0.0)
        self.assertEqual(prepare.source_minutes_to_decimal(12.0), 12.0)
        self.assertEqual(prepare.source_minutes_to_seconds(35.56), 35 * 60 + 56)
        self.assertEqual(prepare.source_minutes_to_decimal(35.56), 35.9)
        self.assertEqual(prepare.source_minutes_to_seconds(10.59), 10 * 60 + 59)

    def test_float_fuzz_inputs(self):
        # Parquet floats arrive as e.g. 48.529999999999994; the implied
        # seconds must still decode to the whole hundredth.
        self.assertEqual(prepare.source_minutes_to_seconds(48.529999999999994), 48 * 60 + 53)
        self.assertEqual(prepare.source_minutes_to_seconds(29.409999999999997), 29 * 60 + 41)

    def test_out_of_encoding_values_are_refused(self):
        # Implied seconds above 60 cannot be MM.SS clock values (true
        # decimal patch rows in older-season files look like this);
        # converting them silently would corrupt the row.
        with self.assertRaises(ValueError):
            prepare.source_minutes_to_seconds(12.75)
        with self.assertRaises(ValueError):
            prepare.source_minutes_to_decimal(26.883333333333333)


if __name__ == "__main__":
    unittest.main()
