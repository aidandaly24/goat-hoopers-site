#!/usr/bin/env python3
"""Fetch only approved public Polyfork metadata/GLB data. Never run asset code.

Fail before saving a GLB if its static glTF structure is outside this review's
limits. Structural inspection is followed by required visual inspection in the
local review app; a successful audit alone is not visual approval.
"""
import hashlib
import json
import pathlib
import struct
import urllib.request

ROOT = pathlib.Path(__file__).parent
IDS = ("yard-basketball-post-b71ee3", "match-scoreboard-58f51e", "trophy-cabinet-e963ac")


def get(url):
    request = urllib.request.Request(url, headers={"User-Agent": "GOAT-design-review/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        data = response.read(2_000_001)
    if len(data) > 2_000_000:
        raise ValueError("Review byte limit exceeded")
    return data


def inspect_glb(data, *, allow_transform_clips=False):
    if len(data) < 20 or struct.unpack_from("<4sII", data) != (b"glTF", 2, len(data)):
        raise ValueError("Invalid GLB 2 header")
    length, kind = struct.unpack_from("<II", data, 12)
    if kind != 0x4E4F534A or length + 20 > len(data):
        raise ValueError("Invalid GLB JSON chunk")
    model = json.loads(data[20:20 + length])
    if model.get("extensionsRequired") or model.get("skins"):
        raise ValueError("Unsupported required extension or skin")
    if model.get("animations") and not allow_transform_clips:
        raise ValueError("Animation data needs separate inspection before static import")
    for key, limit in (("nodes", 128), ("meshes", 64), ("materials", 16), ("accessors", 256)):
        if len(model.get(key, [])) > limit:
            raise ValueError(f"{key} resource budget exceeded")
    clips = []
    for clip in model.get("animations", []):
        paths = []
        for channel in clip.get("channels", []):
            target = channel["target"]
            if target["path"] not in ("rotation", "translation", "scale") or target["node"] >= len(model["nodes"]):
                raise ValueError("Unexpected animation target")
            paths.append({"node": target["node"], "path": target["path"]})
        for sampler in clip.get("samplers", []):
            if sampler.get("interpolation", "LINEAR") not in ("LINEAR", "STEP", "CUBICSPLINE"):
                raise ValueError("Unknown animation interpolation")
            if max(model["accessors"][sampler[key]]["count"] for key in ("input", "output")) > 2000:
                raise ValueError("Animation accessor budget exceeded")
        clips.append({"name": clip.get("name"), "channels": paths, "playback": "disabled"})
    if any("uri" in entry for key in ("buffers", "images") for entry in model.get(key, [])):
        raise ValueError("External asset URI is prohibited")
    triangles = 0
    for mesh in model.get("meshes", []):
        for primitive in mesh["primitives"]:
            if primitive.get("mode", 4) != 4:
                raise ValueError("Unexpected primitive mode")
            accessor = model["accessors"][primitive["indices"]]
            triangles += accessor["count"] // 3
    if triangles > 3000:
        raise ValueError("Prop triangle budget exceeded")
    return {"bytes": len(data), "sha256": hashlib.sha256(data).hexdigest(), "triangles": triangles,
            "nodes": len(model.get("nodes", [])), "meshes": len(model.get("meshes", [])),
            "materials": len(model.get("materials", [])),
            "positionBounds": [{"min": entry.get("min"), "max": entry.get("max")} for entry in model["accessors"] if entry.get("type") == "VEC3" and "min" in entry],
            "externalUris": False, "requiredExtensions": [], "animations": len(clips), "clips": clips,
            "animationPlayback": "disabled", "scriptsExecuted": False}


if __name__ == "__main__":
    records = []
    for asset_id in IDS:
        metadata_url = f"https://polyfork.dev/api/assets/{asset_id}"
        glb_url = f"https://polyfork.dev/cdn/{asset_id}.glb"
        metadata = json.loads(get(metadata_url))
        binary = get(glb_url)
        inspection = inspect_glb(binary, allow_transform_clips=asset_id == "match-scoreboard-58f51e")
        (ROOT / "assets" / f"{asset_id}.json").write_text(json.dumps(metadata, indent=2) + "\n")
        (ROOT / "assets" / f"{asset_id}.glb").write_bytes(binary)
        records.append({"id": asset_id, "metadataUrl": metadata_url, "glbUrl": glb_url, **inspection})
    (ROOT / "assets" / "inspection.json").write_text(json.dumps(records, indent=2) + "\n")
    print(json.dumps(records, indent=2))
