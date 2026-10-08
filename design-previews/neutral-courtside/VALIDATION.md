# Neutral preview offline validation

Source: a327e9c. No fresh browser-rendered QA is claimed.

- Existing-component offline renderer passed.
- Focused preview and imported production typecheck: zero diagnostics, using installed Next ambient types.
- All 10 team disclosures and 228 roster references retained.
- 60 local image/style references resolve; 17 generated module maps have matching selectors.
- Synthetic appendix includes W/L, +/−/flat quotes, LIVE + dot, 1st/2nd/3rd ranks and Win/Loss/Selected badges on actual canvas, raised and hover roles. Production CSS classes and preview semantic aliases are verified. These are invented QA examples, not league data.
- Generated and treatment CSS parse; build/compare/portable/validation JavaScript syntax checks pass.
- Hosted static output hashes/resources/noindex checks pass; comparison JavaScript is identical and has no data-request API. No app component or shared stylesheet/token is edited. New public files are isolated review artifacts only; no build, install, DB, environment or game change.
- Full repository typecheck was attempted and remains blocked by missing vitest/vite in the reused existing install; no full-pass claim.
- Supported Chrome inspection timed out, IAB unavailable and a localhost source read was sandbox-denied. Fresh rendering, overflow, zoom, focus, contrast-on-render and interaction checks remain for independent review.

Calculated sRGB contrast for the represented foreground/background combinations (not rendered-state verification):

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
| chalk | ink / canvas | 13.49:1 |
| chalk | secondary / canvas | 5.21:1 |
| chalk | accent / canvas | 5.48:1 |
| chalk | positive / canvas | 7.18:1 |
| chalk | negative / canvas | 5.78:1 |
| chalk | live / canvas | 5.48:1 |
| chalk | champion / canvas | 5.64:1 |
| chalk | silver / canvas | 5.12:1 |
| chalk | bronze / canvas | 5.98:1 |
| chalk | live dot / canvas | 5.48:1 |
| chalk | focus / canvas | 7.18:1 |
| chalk | positive badge / surface | 7.82:1 |
| chalk | negative badge / surface | 6.31:1 |
| chalk | ink badge / 12% accent tint on canvas | 11.37:1 |
| chalk | ink / surface | 14.70:1 |
| chalk | secondary / surface | 5.68:1 |
| chalk | accent / surface | 5.97:1 |
| chalk | positive / surface | 7.82:1 |
| chalk | negative / surface | 6.31:1 |
| chalk | live / surface | 5.97:1 |
| chalk | champion / surface | 6.14:1 |
| chalk | silver / surface | 5.58:1 |
| chalk | bronze / surface | 6.52:1 |
| chalk | live dot / surface | 5.97:1 |
| chalk | focus / surface | 7.82:1 |
| chalk | positive badge / surface | 7.82:1 |
| chalk | negative badge / surface | 6.31:1 |
| chalk | ink badge / 12% accent tint on surface | 12.34:1 |
| chalk | ink / hover | 12.65:1 |
| chalk | secondary / hover | 4.88:1 |
| chalk | accent / hover | 5.13:1 |
| chalk | positive / hover | 6.73:1 |
| chalk | negative / hover | 5.42:1 |
| chalk | live / hover | 5.13:1 |
| chalk | champion / hover | 5.28:1 |
| chalk | silver / hover | 4.80:1 |
| chalk | bronze / hover | 5.60:1 |
| chalk | live dot / hover | 5.13:1 |
| chalk | focus / hover | 6.73:1 |
| chalk | positive badge / surface | 7.82:1 |
| chalk | negative badge / surface | 6.31:1 |
| chalk | ink badge / 12% accent tint on hover | 10.72:1 |
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
| slate | ink / canvas | 12.70:1 |
| slate | secondary / canvas | 5.15:1 |
| slate | accent / canvas | 6.56:1 |
| slate | positive / canvas | 7.23:1 |
| slate | negative / canvas | 5.82:1 |
| slate | live / canvas | 5.51:1 |
| slate | champion / canvas | 5.67:1 |
| slate | silver / canvas | 5.15:1 |
| slate | bronze / canvas | 6.02:1 |
| slate | live dot / canvas | 5.51:1 |
| slate | focus / canvas | 6.56:1 |
| slate | positive badge / surface | 7.96:1 |
| slate | negative badge / surface | 6.41:1 |
| slate | ink badge / 12% accent tint on canvas | 10.70:1 |
| slate | ink / surface | 13.98:1 |
| slate | secondary / surface | 5.67:1 |
| slate | accent / surface | 7.22:1 |
| slate | positive / surface | 7.96:1 |
| slate | negative / surface | 6.41:1 |
| slate | live / surface | 6.07:1 |
| slate | champion / surface | 6.25:1 |
| slate | silver / surface | 5.67:1 |
| slate | bronze / surface | 6.63:1 |
| slate | live dot / surface | 6.07:1 |
| slate | focus / surface | 7.22:1 |
| slate | positive badge / surface | 7.96:1 |
| slate | negative badge / surface | 6.41:1 |
| slate | ink badge / 12% accent tint on surface | 11.67:1 |
| slate | ink / hover | 12.00:1 |
| slate | secondary / hover | 4.87:1 |
| slate | accent / hover | 6.20:1 |
| slate | positive / hover | 6.83:1 |
| slate | negative / hover | 5.50:1 |
| slate | live / hover | 5.21:1 |
| slate | champion / hover | 5.36:1 |
| slate | silver / hover | 4.87:1 |
| slate | bronze / hover | 5.69:1 |
| slate | live dot / hover | 5.21:1 |
| slate | focus / hover | 6.20:1 |
| slate | positive badge / surface | 7.96:1 |
| slate | negative badge / surface | 6.41:1 |
| slate | ink badge / 12% accent tint on hover | 10.09:1 |
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
| linen | ink / canvas | 12.80:1 |
| linen | secondary / canvas | 5.30:1 |
| linen | accent / canvas | 6.70:1 |
| linen | positive / canvas | 7.06:1 |
| linen | negative / canvas | 5.69:1 |
| linen | live / canvas | 5.39:1 |
| linen | champion / canvas | 5.54:1 |
| linen | silver / canvas | 5.03:1 |
| linen | bronze / canvas | 5.88:1 |
| linen | live dot / canvas | 5.39:1 |
| linen | focus / canvas | 6.70:1 |
| linen | positive badge / surface | 7.77:1 |
| linen | negative badge / surface | 6.26:1 |
| linen | ink badge / 12% accent tint on canvas | 10.72:1 |
| linen | ink / surface | 14.09:1 |
| linen | secondary / surface | 5.84:1 |
| linen | accent / surface | 7.38:1 |
| linen | positive / surface | 7.77:1 |
| linen | negative / surface | 6.26:1 |
| linen | live / surface | 5.93:1 |
| linen | champion / surface | 6.10:1 |
| linen | silver / surface | 5.54:1 |
| linen | bronze / surface | 6.47:1 |
| linen | live dot / surface | 5.93:1 |
| linen | focus / surface | 7.38:1 |
| linen | positive badge / surface | 7.77:1 |
| linen | negative badge / surface | 6.26:1 |
| linen | ink badge / 12% accent tint on surface | 11.68:1 |
| linen | ink / hover | 11.94:1 |
| linen | secondary / hover | 4.94:1 |
| linen | accent / hover | 6.25:1 |
| linen | positive / hover | 6.58:1 |
| linen | negative / hover | 5.30:1 |
| linen | live / hover | 5.02:1 |
| linen | champion / hover | 5.17:1 |
| linen | silver / hover | 4.69:1 |
| linen | bronze / hover | 5.48:1 |
| linen | live dot / hover | 5.02:1 |
| linen | focus / hover | 6.25:1 |
| linen | positive badge / surface | 7.77:1 |
| linen | negative badge / surface | 6.26:1 |
| linen | ink badge / 12% accent tint on hover | 10.04:1 |

All represented small text pairs meet 4.5:1; focus/control/live indicators meet 3:1. Accent/surface is also the inverse button-label/fill pair. Badge accent fill is calculated as its production 12% sRGB color-mix over each actual parent, with main-ink label text; Win/Loss badge fills use the raised-surface role. Badges are labels, so their pale outlines are decorative, not input boundaries. The wide teams divider remains unchanged for comparable composition and needs its separate layout PR. Team/asset colors and other legacy rendered states still need actual browser review.
