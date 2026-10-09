#!/usr/bin/env bash
# GOAT Hoopers 3D asset pipeline — builds approved prop GLBs into ../public/3d/
# and preview PNGs into ./previews/.
#
# Usage: ./build_all.sh [--previews]
#   --previews      also render preview PNGs (slow; ~1 min each on 2 CPUs)
#   Rejected hooper authoring sources are historical; do not publish them.
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
for a in "$@"; do
  case "$a" in
    --previews) PREVIEWS=1 ;;
    --skip-hoopers) ;; # legacy option; props are now the only output
  esac
done

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
