#!/usr/bin/env bash
# GOAT Hoopers 3D asset pipeline — builds every GLB into ../public/3d/
# and preview PNGs into ./previews/.
#
# Usage: ./build_all.sh [--previews] [--skip-hoopers]
#   --previews      also render preview PNGs (slow; ~1 min each on 2 CPUs)
#   --skip-hoopers  only rebuild props
#
# Requires: Blender extracted at ~/workspace/blender/blender-4.5.3-linux-x64/
# (see README.md). Each build runs headless: blender --background --python.

set -euo pipefail
cd "$(dirname "$0")"

BLENDER=~/workspace/blender/blender-4.5.3-linux-x64/blender
OUT=../public/3d
PREV=./previews
mkdir -p "$OUT" "$PREV"

PREVIEWS=0
SKIP_HOOPERS=0
for a in "$@"; do
  case "$a" in
    --previews) PREVIEWS=1 ;;
    --skip-hoopers) SKIP_HOOPERS=1 ;;
  esac
done

TEAMS="1 2 3 4 5 6 7 8 9 10 generic"

if [ "$SKIP_HOOPERS" -eq 0 ]; then
  for t in $TEAMS; do
    echo "=== hooper: $t ==="
    if [ "$PREVIEWS" -eq 1 ]; then
      "$BLENDER" --background --python build_hooper.py -- \
        --team "$t" --out "$OUT/hooper-$t.glb" \
        --preview "$PREV/hooper-$t.png" --preview-clip idle --preview-frame 15 \
        --preview-res 480 2>&1 | grep -E "GLB_WRITTEN|GLB_SUMMARY|Error|Traceback" || true
    else
      "$BLENDER" --background --python build_hooper.py -- \
        --team "$t" --out "$OUT/hooper-$t.glb" \
        2>&1 | grep -E "GLB_WRITTEN|GLB_SUMMARY|Error|Traceback" || true
    fi
  done
fi

echo "=== props ==="
declare -A PROPS=( [basketball]="bounce 38" [trophy]="celebrate 30" [crown]="spin 25" [hoop]="idle 1" )
for prop in basketball trophy crown hoop; do
  # shellcheck disable=SC2086
  set -- ${PROPS[$prop]}
  clip=$1; frame=$2
  echo "=== prop: $prop ==="
  if [ "$PREVIEWS" -eq 1 ]; then
    "$BLENDER" --background --python build_props.py -- \
      --prop "$prop" --out "$OUT/$prop.glb" \
      --preview "$PREV/$prop.png" --preview-clip "$clip" --preview-frame "$frame" \
      --preview-res 480 2>&1 | grep -E "GLB_WRITTEN|GLB_SUMMARY|Error|Traceback" || true
  else
    "$BLENDER" --background --python build_props.py -- \
      --prop "$prop" --out "$OUT/$prop.glb" \
      2>&1 | grep -E "GLB_WRITTEN|GLB_SUMMARY|Error|Traceback" || true
  fi
done

echo "=== done ==="
ls -la "$OUT"
