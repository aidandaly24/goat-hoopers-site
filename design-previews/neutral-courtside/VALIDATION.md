# Neutral preview offline validation

Source: a327e9c. No fresh browser-rendered QA is claimed.

- Existing-component offline renderer passed.
- Focused preview and imported production typecheck: zero diagnostics, using installed Next ambient types.
- All 10 team disclosures and 228 roster references retained.
- 60 local image/style references resolve; 17 generated module maps have matching selectors.
- Generated and treatment CSS parse; build/compare/portable/validation JavaScript syntax checks pass.
- No production file changed; no build, package install, DB, environment or game change.
- Full repository typecheck was attempted and remains blocked by missing vitest/vite in the reused existing install; no full-pass claim.
- Supported Chrome inspection timed out, IAB unavailable and a localhost source read was sandbox-denied. Fresh rendering, overflow, zoom, focus, contrast-on-render and interaction checks remain for independent review.

Calculated sRGB contrast (not rendered-state verification):

| Palette | Pair | Ratio |
| --- | --- | --- |
| chalk | ink / canvas | 13.49:1 |
| chalk | secondary / canvas | 5.21:1 |
| chalk | accent / canvas | 5.48:1 |
| chalk | focus / canvas | 7.18:1 |
| chalk | control / canvas | 3.05:1 |
| chalk | ink / surface | 14.70:1 |
| chalk | secondary / surface | 5.68:1 |
| chalk | accent / surface | 5.97:1 |
| chalk | focus / surface | 7.82:1 |
| chalk | control / surface | 3.33:1 |
| slate | ink / canvas | 12.70:1 |
| slate | secondary / canvas | 5.15:1 |
| slate | accent / canvas | 6.56:1 |
| slate | focus / canvas | 6.56:1 |
| slate | control / canvas | 3.41:1 |
| slate | ink / surface | 13.98:1 |
| slate | secondary / surface | 5.67:1 |
| slate | accent / surface | 7.22:1 |
| slate | focus / surface | 7.22:1 |
| slate | control / surface | 3.76:1 |
| linen | ink / canvas | 12.80:1 |
| linen | secondary / canvas | 5.30:1 |
| linen | accent / canvas | 6.70:1 |
| linen | focus / canvas | 6.70:1 |
| linen | control / canvas | 3.19:1 |
| linen | ink / surface | 14.09:1 |
| linen | secondary / surface | 5.84:1 |
| linen | accent / surface | 7.38:1 |
| linen | focus / surface | 7.38:1 |
| linen | control / surface | 3.51:1 |

Accent/surface is also the inverse button-label/fill pair. Decorative divider colors are intentionally quiet and are not used as control or focus colors. Team/asset colors and every legacy component's rendered state still need actual browser review.
