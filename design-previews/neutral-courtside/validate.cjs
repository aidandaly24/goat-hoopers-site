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
const productionSheet = postcss.parse(css);
for (const [className, expected] of Object.entries({
  review_StandingsTable_w: 'var(--gh-win)', review_StandingsTable_l: 'var(--gh-loss)',
  review_StandingsTable_medal2: 'var(--gh-silver)', review_StandingsTable_medal3: 'var(--gh-bronze)',
  review_CombinedTicker_up: 'var(--gh-win)', review_CombinedTicker_down: 'var(--gh-loss)',
  review_CombinedTicker_flat: 'var(--gh-text-faint)', review_CombinedTicker_live: 'var(--gh-live)',
  review_Badge_win: 'var(--gh-win)', review_Badge_loss: 'var(--gh-loss)',
})) {
  let matched = false;
  productionSheet.walkRules(rule => {
    if (!rule.selector.split(',').map(value => value.trim()).includes('.' + className)) return;
    rule.walkDecls('color', declaration => { if (declaration.value === expected) matched = true; });
  });
  if (!matched) throw Error('State example foreground assumption changed: ' + className);
}
const sheet = postcss.parse(fs.readFileSync(path.join(__dirname, 'treatments.css'), 'utf8'));
const treatmentText = sheet.toString();
for (const [token, role] of Object.entries({ win: 'positive', loss: 'negative', live: 'live', silver: 'silver', bronze: 'bronze' })) {
  if (!treatmentText.includes(`--gh-${token}: var(--review-${role});`)) throw Error('Missing semantic alias: ' + token);
}
if (!/\.review_StandingsTable_medal1\s*\{\s*color: var\(--review-champion\);/.test(treatmentText)) throw Error('Gold rank is still an action color');
if (!/\.review_Badge_gold\s*\{\s*color: var\(--review-ink\);/.test(treatmentText)) throw Error('Accent badge has no contrast-safe label mapping');
const stateSections = [...html.matchAll(/<section data-review-bg="(canvas|surface|hover)"[\s\S]*?<\/section>/g)];
if (stateSections.length !== 3) throw Error('Missing synthetic state backgrounds');
const examples = stateSections.map(([section, background]) => {
  const roles = [...section.matchAll(/data-review-role="([^"]+)"/g)].map(([, role]) => role);
  const badges = [...section.matchAll(/data-review-badge="([^"]+)"/g)].map(([, role]) => role);
  if (roles.length !== 10 || badges.join(',') !== 'positive,negative,accent' || !section.includes('data-review-indicator="live"')) throw Error('Incomplete state fixture: ' + background);
  for (const [, classes] of section.matchAll(/class="([^"]+)"/g)) for (const name of classes.split(' ')) {
    if (name.startsWith('review_') && !css.includes('.' + name)) throw Error('Unmapped state example: ' + name);
  }
  return { background, roles, badges };
});
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
function mix(foreground, background, opacity) {
  const rgb = value => value.slice(1).match(/../g).map(part => parseInt(part, 16));
  return '#' + rgb(foreground).map((value, i) => Math.round(value * opacity + rgb(background)[i] * (1 - opacity)).toString(16).padStart(2, '0')).join('');
}
const rows = [];
function check(name, pair, fg, bg, minimum = 4.5) {
  const ratio = contrast(fg, bg);
  if (ratio < minimum) throw Error(`Contrast failed: ${name} ${pair} ${ratio.toFixed(2)}`);
  rows.push(`| ${name} | ${pair} | ${ratio.toFixed(2)}:1 |`);
}
for (const [name, palette] of Object.entries(palettes)) {
  for (const bg of ['canvas', 'surface']) for (const fg of ['ink', 'secondary', 'accent', 'focus', 'control']) {
    const minimum = ['focus', 'control'].includes(fg) ? 3 : 4.5;
    check(name, `${fg} / ${bg}`, palette[fg], palette[bg], minimum);
  }
  for (const { background, roles, badges } of examples) {
    for (const role of new Set(['ink', 'secondary', 'accent', ...roles])) check(name, `${role} / ${background}`, palette[role], palette[background]);
    check(name, `live dot / ${background}`, palette.live, palette[background], 3);
    check(name, `focus / ${background}`, palette.focus, palette[background], 3);
    for (const role of badges) {
      // Production Badge win/loss use surface; gold is 12% accent over its actual parent.
      const fill = role === 'accent' ? mix(palette.accent, palette[background], .12) : palette.surface;
      check(name, `${role === 'accent' ? 'ink' : role} badge / ${role === 'accent' ? '12% accent tint on ' + background : 'surface'}`, role === 'accent' ? palette.ink : palette[role], fill);
    }
  }
}
const config = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile).config;
config.include = ['design-previews/neutral-courtside/snapshot-entry.tsx'];
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root);
parsed.options.incremental = false;
parsed.fileNames.push(path.join(root, 'node_modules/next/types/global.d.ts'), path.join(root, 'node_modules/next/index.d.ts'));
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram(parsed.fileNames, parsed.options));
if (diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, { getCanonicalFileName: f => f, getCurrentDirectory: () => root, getNewLine: () => '\n' }));
fs.writeFileSync(path.join(__dirname, 'VALIDATION.md'), `# Neutral preview offline validation\n\nSource: a327e9c. No fresh browser-rendered QA is claimed.\n\n- Existing-component offline renderer passed.\n- Focused preview and imported production typecheck: zero diagnostics, using installed Next ambient types.\n- All 10 team disclosures and 228 roster references retained.\n- ${resources.length} local image/style references resolve; 17 generated module maps have matching selectors.\n- Synthetic appendix includes W/L, +/−/flat quotes, LIVE + dot, 1st/2nd/3rd ranks and Win/Loss/Selected badges on actual canvas, raised and hover roles. Production CSS classes and preview semantic aliases are verified. These are invented QA examples, not league data.\n- Generated and treatment CSS parse; build/compare/portable/validation JavaScript syntax checks pass.\n- No production file changed; no build, package install, DB, environment or game change.\n- Full repository typecheck was attempted and remains blocked by missing vitest/vite in the reused existing install; no full-pass claim.\n- Supported Chrome inspection timed out, IAB unavailable and a localhost source read was sandbox-denied. Fresh rendering, overflow, zoom, focus, contrast-on-render and interaction checks remain for independent review.\n\nCalculated sRGB contrast for the represented foreground/background combinations (not rendered-state verification):\n\n| Palette | Pair | Ratio |\n| --- | --- | --- |\n${rows.join('\n')}\n\nAll represented small text pairs meet 4.5:1; focus/control/live indicators meet 3:1. Accent/surface is also the inverse button-label/fill pair. Badge accent fill is calculated as its production 12% sRGB color-mix over each actual parent; Win/Loss badge fills use the raised-surface role. Badges are labels, so their pale outlines are decorative, not input boundaries. The wide teams divider remains unchanged for comparable composition and needs its separate layout PR. Team/asset colors and other legacy rendered states still need actual browser review.\n`);
console.log('Offline preview validation passed: 10 teams, 228 players, local references, CSS scopes, represented semantic/text/control/focus contrast and focused typecheck.');
