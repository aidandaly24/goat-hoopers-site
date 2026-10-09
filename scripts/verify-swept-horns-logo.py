"""Offline artifact/consumer checks for the selected A logo; standard library only."""
from pathlib import Path
import hashlib
import json
import re
import subprocess
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FAMILY = ROOT / "design/brand/swept-horns"
BASE = "f5be2b7ee6821ed8f69e22ca8782abb2a7192ea8"
NS = "{http://www.w3.org/2000/svg}"
PALETTE = {"black": "#111111", "clay": "#A54429", "white": "#FFFFFF", "cream": "#F0D5B5"}
EXPECTED = {(kind, color) for kind in ("emblem", "micro", "horizontal", "primary") for color in PALETTE if not (kind == "horizontal" and color == "cream")}
CHECKS = []


def check(value, label):
    if not value:
        raise AssertionError(label)
    CHECKS.append(label)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def lettering(text):
    first = text.index("<g ", text.index("</title>"))
    depth = 0
    for match in re.finditer(r"<g\b[^>]*>|</g>", text[first:]):
        depth += -1 if match.group() == "</g>" else 1
        if depth == 0:
            return text[first + match.end():text.rindex("</svg>")]
    raise AssertionError("Unbalanced root emblem")


def anatomy(element):
    return {node.get("id"): tuple(child.get("d") for child in node.iter(NS + "path"))
            for node in element.iter() if node.get("id") in ("horns", "ears", "face-muzzle", "beard")}


manifest = json.loads((FAMILY / "PROVENANCE.json").read_text())
check(manifest["selection"] == "A swept horns btw", "Aidan's exact A selection recorded")
assets = manifest["source_assets"]
check(len(assets) == 15, "Complete 15-variant source family")
check({tuple(Path(row["path"]).stem.split("-")[-2:]) for row in assets} == EXPECTED,
      "All expected lockup/color pairs, no extra variant")
reference = ET.parse(FAMILY / "assets/GOAT-HOOPERS-emblem-black.svg").getroot()
# Pin the approved silhouette independently of palette and export transforms.
selected_anatomy = {"horns": ("M123 113C110 78 87 51 44 54C68 69 88 90 96 119L115 137Z", "M178 111C190 79 216 57 251 64C226 75 211 94 204 120L185 137Z"),
                    "ears": ("M119 119C98 102 64 103 38 119C58 145 85 150 119 137Z", "M181 119C202 102 236 103 262 119C242 145 215 150 181 137Z"),
                    "face-muzzle": ("M150 96C122 96 110 116 115 145L124 184C119 199 120 219 131 234C137 242 163 242 169 234C180 219 181 199 176 184L185 145C190 116 178 96 150 96Z",),
                    "beard": ("M133 233C133 251 140 266 150 279C160 266 167 251 167 233Z",)}
check(anatomy(reference) == selected_anatomy, "Selected A horns/ears/muzzle/beard paths pinned")
for row in assets:
    path = ROOT / row["path"]
    data = path.read_bytes()
    check(sha(data) == row["sha256"] and len(data) == row["bytes"], path.name + " manifest identity")
    element = ET.fromstring(data)
    kind, color = path.stem.split("-")[-2:]
    dimensions = {"horizontal": (1000, 365), "primary": (900, 900)}.get(kind, (640, 640))
    check((int(element.get("width")), int(element.get("height"))) == dimensions,
          path.name + " intrinsic size contract")
    check(element.get("viewBox") == "0 0 %d %d" % dimensions, path.name + " viewBox contract")
    check(anatomy(element) == selected_anatomy, path.name + " selected silhouette parity")
    check(not list(element.iter(NS + "circle")), path.name + " old circular face absent")
    ids = {node.get("id") for node in element.iter()}
    check(("basketball-seam" in ids) == (kind != "micro"), path.name + " size-appropriate seams")
    paint = {node.get(attr) for node in element.iter() for attr in ("fill", "stroke") if node.get(attr)}
    check(PALETTE[color] in paint and paint <= {PALETTE[color], "white", "black", "none"}, path.name + " palette/mask paint")
    check(all(node.tag not in {NS + x for x in ("script", "image", "foreignObject", "style", "text")} for node in element.iter()), path.name + " no executable/raster/font content")
    check(all(not key.endswith("href") and not key.lower().startswith("on") for node in element.iter() for key in node.attrib), path.name + " no external references/events")
    text = data.decode()
    check(text.count("<mask ") == 1 and 'mask="url(#' in text, path.name + " transparent cuts")
    if kind in ("horizontal", "primary"):
        original = (ROOT / row["original_source"]).read_text()
        check(lettering(text) == lettering(original), path.name + " byte-identical lettering suffix")
        check(sha(lettering(text).encode()) == row["wordmark_suffix_sha256"], path.name + " wordmark hash")

for row in manifest["runtime_assets"]:
    data = (ROOT / row["path"]).read_bytes()
    check(data == (ROOT / row["source"]).read_bytes(), row["path"] + " source byte parity")
    check(sha(data) == row["sha256"], row["path"] + " runtime hash")
favicon_text = (ROOT / "src/app/icon.svg").read_text()
favicon = ET.fromstring(favicon_text)
check(anatomy(favicon) == selected_anatomy, "Adaptive favicon preserves selected A anatomy")
check(favicon.find(NS + "style").text == "@media (prefers-color-scheme: dark) { #favicon-goat { fill: #F0D5B5; } }", "Favicon has one exact SVG-local dark palette rule")
check(next(node for node in favicon.iter() if node.get("id") == "favicon-goat").get("fill") == "#A54429", "Favicon default remains clay")
check(not list(favicon.iter(NS + "script")) and not list(favicon.iter(NS + "image")), "Adaptive favicon contains no script or embedded raster")
check(favicon.get("viewBox") == "0 0 640 640", "Adaptive favicon dimension contract")
check(not (ROOT / "src/app/favicon.ico").exists(), "No reintroduced default favicon")
check(json.loads((ROOT / "vercel.json").read_text())["git"]["deploymentEnabled"] is False,
      "Deployment hold preserved")
protected = ["design/brand/selected-hybrid", "src/ui", "src/surfaces", "src/app/layout.tsx", "DESIGN.md", "vercel.json", "package.json", "package-lock.json", "courtside-preview"]
changes = subprocess.check_output(["git", "diff", "--name-only", BASE, "--", *protected], cwd=ROOT, text=True)
check(not changes.strip(), "Historical source and concurrent owners unchanged")
for name in ("SiteHeader", "SiteFooter"):
    check('/courtside/GOAT-HOOPERS-horizontal-black.svg' in (ROOT / ("src/ui/" + name + ".tsx")).read_text(), name + " existing asset URL retained")
check('/courtside/GOAT-HOOPERS-emblem-clay.svg' in (ROOT / "src/surfaces/season-hub/CourtsideMoment.tsx").read_text(), "Homepage existing emblem URL retained")
print(json.dumps({"checks_passed": len(CHECKS), "source_variants": 15, "runtime_copies": 6,
                  "base_sha": BASE, "checks": CHECKS}, indent=2))
