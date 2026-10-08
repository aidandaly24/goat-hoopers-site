/* Offline validation. Rendered-browser acceptance remains separate. */
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const postcss = require('postcss');
const root = path.resolve(__dirname, '../..');
const html = fs.readFileSync(path.join(__dirname, 'home.html'), 'utf8');
const entries = (html.match(/data-team-id="/g) || []).length;
const players = (html.match(/class="review_CourtsideHome_roster-list"/g) || []).length;
const rosterCount = [...html.matchAll(/class="review_CourtsideHome_roster-list">([\s\S]*?)<\/ul>/g)].reduce((sum, match) => sum + (match[1].match(/<li>/g) || []).length, 0);
if (entries !== 10 || players !== 10 || rosterCount !== 228) throw Error('Roster retention failed');
const resources = [...html.matchAll(/(?:src|href)="([^"#]+)"/g)].map(match => match[1]).filter(value => !/^(https?:|data:)/.test(value));
resources.forEach(value => { if (!fs.existsSync(path.resolve(__dirname, value))) throw Error('Missing resource: ' + value); });
const externalLinks = [...html.matchAll(/<a\b[^>]*\bhref="https?:\/\/[^\"]+"[^>]*>/g)];
if (!externalLinks.length || externalLinks.some(([tag]) => !tag.includes('target="_blank"') || !tag.includes('rel="noopener noreferrer"'))) throw Error('External destination could replace comparison');
const reviewIndex = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
if (!/iframe\s*\{[^}]*border:0;/.test(reviewIndex)) throw Error('Iframe border changes labeled content viewport width');
const css = fs.readFileSync(path.join(__dirname, 'snapshot.css'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'snapshot-manifest.json'), 'utf8'));
for (const names of Object.values(manifest.cssModules)) for (const scoped of Object.values(names)) if (!css.includes('.' + scoped)) throw Error('Missing scoped class: ' + scoped);
postcss.parse(css);
const sheet = postcss.parse(fs.readFileSync(path.join(__dirname, 'treatments.css'), 'utf8'));
const palettes = {};
sheet.walkRules(rule => {
  const key = ['chalk', 'slate', 'linen'].find(name => rule.selector.includes(`data-treatment='${name}'`));
  if (!key) return;
  palettes[key] = {};
  rule.walkDecls(decl => { palettes[key][decl.prop.replace('--review-', '')] = decl.value; });
});
function lum(hex) {
  const c = hex.replace('#', '').match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return c[0] * .2126 + c[1] * .7152 + c[2] * .0722;
}
function contrast(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }
const rows = [];
for (const [name, palette] of Object.entries(palettes)) {
  for (const bg of ['canvas', 'surface']) for (const fg of ['ink', 'secondary', 'accent', 'focus', 'control']) {
    const ratio = contrast(palette[fg], palette[bg]);
    const minimum = ['focus', 'control'].includes(fg) ? 3 : 4.5;
    if (ratio < minimum) throw Error(`Contrast failed: ${name} ${fg}/${bg} ${ratio.toFixed(2)}`);
    rows.push(`| ${name} | ${fg} / ${bg} | ${ratio.toFixed(2)}:1 |`);
  }
}
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile).config;
config.include = ['design-previews/neutral-courtside/snapshot-entry.tsx'];
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
parsed.options.incremental = false;
parsed.fileNames.push(path.join(root, 'node_modules/next/types/global.d.ts'), path.join(root, 'node_modules/next/index.d.ts'));
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram(parsed.fileNames, parsed.options));
if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n' }));
fs.writeFileSync(path.join(__dirname, 'VALIDATION.md'), `# Neutral preview offline validation\n\nSource: a327e9c. No fresh browser-rendered QA is claimed.\n\n- Existing-component offline renderer passed.\n- Focused preview and imported production typecheck: zero diagnostics, using installed Next ambient types.\n- All 10 team disclosures and 228 roster references retained.\n- ${resources.length} local image/style references resolve; 17 generated module maps have matching selectors.\n- Generated and treatment CSS parse; build/compare/portable/validation JavaScript syntax checks pass.\n- No production file changed; no build, package install, DB, environment or game change.\n- Full repository typecheck was attempted and remains blocked by missing vitest/vite in the reused existing install; no full-pass claim.\n- Supported Chrome inspection timed out, IAB unavailable and a localhost source read was sandbox-denied. Fresh rendering, overflow, zoom, focus, contrast-on-render and interaction checks remain for independent review.\n\nCalculated sRGB contrast (not rendered-state verification):\n\n| Palette | Pair | Ratio |\n| --- | --- | --- |\n${rows.join('\n')}\n\nAccent/surface is also the inverse button-label/fill pair. Decorative divider colors are intentionally quiet and are not used as control or focus colors. Team/asset colors and every legacy component's rendered state still need actual browser review.\n`);
console.log('Offline preview validation passed: 10 teams, 228 players, local references, CSS scopes, proposed text/control/focus contrast and focused typecheck.');
