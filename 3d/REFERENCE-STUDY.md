# Reference Study — 3D Character Design Language

Studied 2026-10-06. References saved in `3d/references/`.
Goal: understand what makes professional stylized 3D characters feel *designed* vs *generated*, then apply to the GOAT Hoopers hoopers.

## 1. Quaternius — Ultimate Modular Characters (`quaternius-modular-men.jpg`, `poly-pizza-hoodie.jpg`)

**Proportions:** ~3.5–4 heads tall. Slightly chunky but NOT chibi — reads as a capable little person, not a toy. Limbs are thick (forearms nearly as wide as upper arms), hands oversized (~1.3x natural). Feet simple wedges.

**Face construction (the critical lesson):**
- Eyes: two small dark rounded rectangles, set WIDE apart (roughly one eye-width between them, sometimes more). No whites, no pupils, no catchlights. They read as "shadows" not "eyeballs."
- Brows: none, or a single angled quad for expression. The punk character has one angry brow slash — that's the whole personality.
- Nose: a single small vertical quad or nothing at all.
- Mouth: thin horizontal slit, or absent. Never a smirk, never teeth.
- **Total face elements: 2–4 quads.** Our v3 has eyes + catchlights + thick brows + asymmetric smirk = ~8 elements. The reference proves LESS is more — personality comes from pose and silhouette, not facial detail.

**Color blocking:** 2–3 flat colors per character, hard boundaries at garment seams. No gradients, no texture. Skin is ONE flat tone. The visual interest is in the *boundaries* (where sleeve meets skin, where vest meets shirt), not in surface detail.

**Materials:** Fully matte. Flat shading (faceted, not smooth) — the polygon facets ARE the detail. Light catches edges geometrically.

**Silhouette:** Every character readable at thumbnail size. Accessories (hat, crown, mohawk, helmet) extend the silhouette upward/outward — never inward detail.

## 2. Funko Pop (`funko-pop.jpg`)

**Proportions:** Head is ~45–50% of total height. Body is a stub — arms barely reach hips. This is the extreme-chibi end.

**Face construction:**
- Eyes: two LARGE perfect circles, solid black (or solid color). They dominate the face — each eye ~15% of head width.
- Nose: tiny triangle, centered, almost invisible.
- Mouth: absent or a 2mm line.
- Brows: thin angled lines ONLY when the character needs attitude (Loki's angry brows).
- **Key insight:** the eyes are *graphic shapes*, not anatomy. They're decals on a surface.

**What transfers to hoopers:** If we go chibi, the eyes must be BIG and SIMPLE. Our v3's "alive eyes with catchlights" is trying to be Pixar; Funko proves you don't need it. Big black ovals > detailed eyes.

## 3. Fall Guys (`fall-guys.jpg`)

**Proportions:** Bean — no neck, no waist definition. Head and torso are one continuous capsule. ~2 heads tall total.

**Face construction:**
- White/cream oval faceplate (HIGH contrast against body color) with two vertical black pill eyes.
- No nose. No mouth. No brows. Ever.
- **The faceplate is the design move:** it creates a "mask" that makes the tiny eyes pop. Our hoopers could use a faceplate-like contrast zone.

**Color:** Saturated, playful, clashing-on-purpose (pink + teal + purple). Fall Guys commits to maximal color; our team-color variants should be equally bold, not muted.

**What transfers:** The courage to be simple. Two pills for eyes. That's the whole face. And it works because the BODY is expressive (waving, leaning, costumes).

## 4. Basketball product photography (`basketball-texture.jpg`, `basketball-macro.jpg`)

**Pebble grain:** The pebbles are SMALL and DENSE — roughly 2–3mm across on a real ball, ~40–50 pebbles across the diameter. Our v3 Voronoi scale was too large (looked like orange peel, not leather). Scale DOWN the bump.

**Seams:** Recessed channels ~2mm wide, DARK (near-black in the crevice), with a slight raised lip on each side. The seam is a *valley*, not a line. Our v3 seams were "thinner and darker" but still read as painted lines — they need actual depth (normal map valley + AO darkening).

**Color:** Deep burnt orange (#C75B12-ish), NOT bright orange. Significant variation across panels — some panels darker from wear. Slight sheen on the pebble tops (worn smooth) vs matte in the valleys.

**What transfers:** Smaller pebble scale, true recessed seams with depth, burnt-orange base with per-panel variation.

## Design decisions for v4 (traceable to references)

| # | Change | Reference | Why |
|---|--------|-----------|-----|
| 1 | Simplify face: two black oval eyes + optional single brow slash, remove catchlights and smirk | Quaternius (2–4 quad faces), Fall Guys (pill eyes, no mouth) | Faces were the busiest part of v3; references prove minimal faces read as more designed |
| 2 | Enlarge eyes to ~12–15% of head width, set wider apart | Funko Pop (eyes dominate face as graphic shapes) | Bigger, simpler eyes = more character at thumbnail size |
| 3 | Flatten-shade the body (faceted) instead of smooth | Quaternius (facets ARE the detail) | Facets catch light geometrically; smooth shading looked blobby/generic |
| 4 | Harden color boundaries at garment seams; 3 flat colors max per variant | Quaternius (hard boundaries, no gradients) | v3 had soft material blends that read as "AI smooth" |
| 5 | Basketball: halve pebble scale, deepen seams into valleys, shift to burnt orange | Product photography (2–3mm pebbles, valley seams, #C75B12) | v3 ball looked like an orange, not leather |
| 6 | Add silhouette accessories per team (headband variants, wristband) | Quaternius (hat/crown/mohawk extend silhouette) | Gives each team a readable thumbnail identity beyond color |

## What we are NOT copying

- Not going full Funko (head too big for a basketball player — needs to read as athletic)
- Not going full Fall Guys (bean has no limbs for jersey/number reads)
- Target: Quaternius proportions (~3.5 heads) + Funko/Fall-Guys face minimalism + bold team color blocking

---

## 7. v4 Pivot — From Reference Study to Reference Base (2026-10-06)

**Decision:** Instead of procedurally approximating the references, use an actual Quaternius model (CC0, "Universal Base Characters" pack, downloaded via Aidan's Mac) as the base geometry.

**Why:** The study proved the gap was in *topology and construction*, not just proportions. Procedural primitives (spheres, cylinders) cannot replicate:
- Proper edge flow around joints (shoulders, hips, knees)
- Subtle muscle definition that reads as "athletic" not "lumpy"
- Clean UVs for texture-based faces

**What we keep from Quaternius (the reference IS the model):**
- Full body mesh (7,281 verts, professional topology)
- Minimal face: painted small dark eyes, subtle mouth, no brows — exactly the "2-4 quad" lesson from §1
- Humanoid rig (root → pelvis → spine → head, full arm/leg chains)
- Matte PBR materials with baked AO in the texture

**What we add (team identity + basketball read):**
- Sleeveless jersey (team primary color) + shorts (team secondary) — hard color blocking per §1
- White/contrast trim at neckline, hem, waistband — the "boundary interest" from §1
- Basketball prop (burnt orange #C75B12, recessed seams per §4) parented to right hand

**What we author (animation):**
- 4 clips on the Quaternius rig: idle, spin, jump, dunk (same names as v3 — viewer contract preserved)
- Bone axis map probed empirically (see build_hooper_v4.py header)

**Traceability:** Every v4 design decision points to a specific reference observation above. The face is Quaternius's (not ours). The color blocking is Quaternius's 2-3-flat-colors rule. The basketball is product-photo-driven.
