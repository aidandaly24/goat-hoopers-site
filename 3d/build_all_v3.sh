#!/bin/bash
# Historical hooper batch: archive-only output, never public delivery
cd "$(dirname "$0")"
BLENDER=~/workspace/blender/blender-4.5.3-linux-x64/blender
OUT=./archive/hoopers
mkdir -p "$OUT"

for team in 1 2 3 4 5 6 7 8 9 10 generic; do
  if [ "$team" = "generic" ]; then
    tflag="generic"
    ofile="$OUT/hooper-generic.glb"
  else
    tflag="$team"
    ofile="$OUT/hooper-$team.glb"
  fi
  echo "=== Building hooper $team ==="
  $BLENDER --background --python build_hooper_v3.py -- \
    --team $tflag --out $ofile 2>&1 | grep -E "GLB_WRITTEN|Error|Traceback" | head -3
done

echo "=== Building basketball ==="
$BLENDER --background --python build_basketball_v2.py -- \
  --out $OUT/basketball.glb 2>&1 | grep -E "GLB_WRITTEN|Error|Traceback" | head -3

echo "=== Done ==="
ls -lh $OUT/*.glb | awk '{print $9, $5}'
