#!/usr/bin/env python3
"""Issue #198 — deterministic projection of the pinned ESPN fixture.

Reads the raw ESPN core API v2 by-athlete season-statistics fixture
(2026 season = 2025-26, type 2 = Regular Season) and emits a normalized
extract: one flat row per athlete, keyed by ESPN athlete ID parsed from
athlete.$ref (never a name join), carrying exactly the fields the
step-2 grader consumes:

    gamesPlayed, gamesStarted, minutes,
    avgPoints, avgRebounds, avgAssists, avgSteals, avgBlocks

Rules (frozen for this projection version):
- The raw fixture is verified against its pinned SHA-256 before use;
  a mismatch aborts. Grade by hash, never by re-fetch.
- Selection paths: items[].athlete.$ref -> athlete ID;
  items[].splits (single object, id "0", name "Total")
  .categories[].stats[] name/value pairs -> projected fields.
- Values are emitted exactly as published (no recomputation, no
  quantization in the projection; quantization is a model-manifest
  concern, not a projection concern).
- A stat absent from a row stays absent in the extract; a null stays
  null; a non-numeric value passes through verbatim so the
  absent/null/invalid distinctions survive. Nothing is zero-filled.
  An athlete with no row in the fixture has no row in the extract:
  absent = UNSCORED, never a zero line.
- Duplicate athlete IDs, duplicate stat names inside one row's split,
  or an unexpected split shape are hard errors (abort), never
  silently resolved.
- Serialization is deterministic: rows sorted by numeric athlete ID,
  fixed key order, compact separators, UTF-8, trailing newline.

Stdlib only. Usage:
    python3 extract_issue198.py [raw_fixture.json] [extract_out.json]
"""

import hashlib
import json
import re
import sys

SCRIPT_VERSION = "1.0.0"

SOURCE_URL = (
    "https://sports.core.api.espn.com/v2/sports/basketball/leagues/nba"
    "/seasons/2026/types/2/statistics/0/byathlete?limit=1000&page=1"
)
FETCHED_AT = "2026-10-20T14:50:58Z"
EXPECTED_RAW_SHA256 = (
    "5e4445cc9957d63416308564a7f6d217db3ff67b96fea5a37ad0d14b86e4bbc1"
)
EXPECTED_RAW_BYTES = 15353902

FIELDS = [
    "gamesPlayed",
    "gamesStarted",
    "minutes",
    "avgPoints",
    "avgRebounds",
    "avgAssists",
    "avgSteals",
    "avgBlocks",
]

UNITS = {
    "gamesPlayed": "games",
    "gamesStarted": "games",
    "minutes": "minutes (season total, as published)",
    "avgPoints": "points per game, as published",
    "avgRebounds": "rebounds per game, as published",
    "avgAssists": "assists per game, as published",
    "avgSteals": "steals per game, as published",
    "avgBlocks": "blocks per game, as published",
}

ATHLETE_ID_RE = re.compile(r"/athletes/(\d+)(?:\?|$)")


def fail(msg):
    raise SystemExit(f"extract_issue198: error: {msg}")


def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "espn-core-v2-byathlete-2026-type2.json"
    out = sys.argv[2] if len(sys.argv) > 2 else "espn-byathlete-2026-type2.extract.json"

    raw = open(src, "rb").read()
    if len(raw) != EXPECTED_RAW_BYTES:
        fail(f"raw fixture is {len(raw)} bytes, expected {EXPECTED_RAW_BYTES}")
    digest = hashlib.sha256(raw).hexdigest()
    if digest != EXPECTED_RAW_SHA256:
        fail(f"raw fixture SHA-256 {digest} != pinned {EXPECTED_RAW_SHA256}")

    doc = json.loads(raw.decode("utf-8"))
    items = doc["items"]
    if doc["count"] != len(items):
        fail(f"count field {doc['count']} != {len(items)} items")

    rows = []
    seen_ids = set()
    gp_below_20 = 0
    for item in items:
        ref = item["athlete"]["$ref"]
        m = ATHLETE_ID_RE.search(ref)
        if not m:
            fail(f"cannot parse athlete ID from $ref {ref!r}")
        athlete_id = m.group(1)
        if athlete_id in seen_ids:
            fail(f"duplicate athlete ID {athlete_id}")
        seen_ids.add(athlete_id)

        split = item["splits"]
        if not isinstance(split, dict) or split.get("id") != "0" or split.get("name") != "Total":
            fail(f"athlete {athlete_id}: unexpected split shape "
                 f"(id={split.get('id')!r}, name={split.get('name')!r})")

        stats = {}
        for category in split["categories"]:
            for stat in category["stats"]:
                name = stat["name"]
                if name in stats:
                    fail(f"athlete {athlete_id}: duplicate stat name {name!r}")
                stats[name] = stat.get("value")

        row = {"id": athlete_id}
        for field in FIELDS:
            if field in stats:
                row[field] = stats[field]
        gp = stats.get("gamesPlayed")
        if isinstance(gp, (int, float)) and gp < 20:
            gp_below_20 += 1
        rows.append(row)

    rows.sort(key=lambda r: int(r["id"]))

    extract = {
        "metadata": {
            "artifact": "issue-198 normalized extract (projection) of ESPN core API v2 by-athlete season statistics",
            "sourceUrl": SOURCE_URL,
            "fetchedAt": FETCHED_AT,
            "season": {
                "year": 2026,
                "display": "2025-26",
                "type": 2,
                "typeName": "Regular Season",
                "status": "completed (regular season 2025-10-21 to 2026-04-13)",
                "selectionBasis": "season/type taken from the source URL and each row's season/seasonType $refs in the fixture itself",
            },
            "split": {"id": "0", "name": "Total"},
            "page": {
                "count": doc["count"],
                "pageIndex": doc["pageIndex"],
                "pageSize": doc["pageSize"],
                "pageCount": doc["pageCount"],
            },
            "rawFixture": {
                "sha256": EXPECTED_RAW_SHA256,
                "bytes": EXPECTED_RAW_BYTES,
                "hashScope": "the SHA-256 is over the exact raw decoded bytes of the fixture file, not over gzip bytes or any JSON reserialization",
            },
            "transform": {
                "script": "extract_issue198.py",
                "version": SCRIPT_VERSION,
                "selectionPaths": [
                    "items[].athlete.$ref -> id (regex /athletes/(\\d+))",
                    "items[].splits[id=0,name=Total].categories[].stats[] (name/value) -> the 8 projected fields",
                ],
                "duplicatePolicy": "duplicate athlete ID, duplicate stat name within a row, or unexpected split shape aborts the extraction; nothing is silently resolved or dropped",
                "missingPolicy": "absent stat stays absent, null stays null, non-numeric value passes through verbatim; no zero-filling anywhere; an athlete with no fixture row has no extract row (absent = UNSCORED)",
                "valuePolicy": "values emitted exactly as published; no recomputation and no quantization in the projection",
                "serialization": "rows sorted by numeric athlete ID; fixed key order (id, then fields in FIELDS order); compact separators; UTF-8; single trailing newline",
            },
            "fields": FIELDS,
            "units": UNITS,
            "displayNames": "not present in this payload: each row's athlete object carries only a $ref, so the extract is ID-keyed with no name field; identity never comes from a name join",
            "coverage": {
                "rowsEmitted": len(rows),
                "uniqueAthleteIds": len(seen_ids),
                "modelEligibleGpGte20": len(rows) - gp_below_20,
                "observedGpBelow20": gp_below_20,
                "eligibilityNote": "observed IDs = every row emitted; model-eligible IDs (under the counterproposal's E) = rows with gamesPlayed >= 20; low-GP rows are preserved, not filtered out",
            },
        },
        "athletes": rows,
    }

    text = json.dumps(extract, ensure_ascii=False, separators=(",", ":")) + "\n"
    with open(out, "w", encoding="utf-8") as fh:
        fh.write(text)
    print(f"wrote {out}: {len(rows)} rows, {len(text.encode('utf-8'))} bytes")


if __name__ == "__main__":
    main()
