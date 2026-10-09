/* Offline review renderer. Reads current components; never changes production. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('esbuild');
const postcss = require('postcss');
const root = path.resolve(__dirname, '../..');
const css = new Map();
const cssNames = new Map();
const scope = file => 'review_' + path.basename(file).replace(/\.module\.css$/, '').replace(/\W/g, '_');

function unwrapGlobals(selector) {
  const saved = [];
  let start;
  while ((start = selector.indexOf(':global(')) !== -1) {
    let end = start + 8, depth = 1;
    for (; end < selector.length && depth; end++) {
      if (selector[end] === '(') depth++;
      if (selector[end] === ')') depth--;
    }
    if (depth) throw Error('Unbalanced global selector');
    const value = selector.slice(start + 8, end - 1);
    const token = `__GLOBAL_${saved.length}__`;
    saved.push(value);
    selector = selector.slice(0, start) + token + selector.slice(end);
  }
  return { selector, saved };
}

function moduleCss(file) {
  const names = {};
  const sheet = postcss.parse(fs.readFileSync(file, 'utf8'), { from: file });
  sheet.walkRules(rule => {
    if (rule.parent.type === 'atrule' && /keyframes$/.test(rule.parent.name)) return;
    let { selector, saved } = unwrapGlobals(rule.selector);
    selector = selector.replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => {
      names[name] = `${scope(file)}_${name}`;
      return '.' + names[name];
    });
    saved.forEach((value, i) => { selector = selector.replace(`__GLOBAL_${i}__`, value); });
    rule.selector = selector;
  });
  css.set(path.relative(root, file), sheet.toString());
  cssNames.set(path.relative(root, file), names);
  return names;
}

async function run() {
  const manifestFile = path.join(__dirname, 'snapshot-manifest.json');
  const previousOrder = fs.existsSync(manifestFile)
    ? Object.keys(JSON.parse(fs.readFileSync(manifestFile, 'utf8')).cssModules) : [];
  const order = new Map(previousOrder.map((file, index) => [file, index]));
  const ordered = map => [...map].sort(([a], [b]) =>
    (order.get(a) ?? Infinity) - (order.get(b) ?? Infinity) || a.localeCompare(b));
  const result = await esbuild.build({
    entryPoints: [path.join(__dirname, 'snapshot-entry.tsx')],
    bundle: true, write: false, platform: 'node', format: 'cjs', jsx: 'automatic',
    external: ['react', 'react-dom/server', 'node:*'],
    plugins: [{ name: 'review-only-adapters', setup(build) {
      build.onResolve({ filter: /^next\/(link|navigation)$/ }, args => ({ path: args.path, namespace: 'review-stub' }));
      build.onResolve({ filter: /^@\/three\// }, args => ({ path: args.path, namespace: 'review-stub' }));
      build.onLoad({ filter: /.*/, namespace: 'review-stub' }, args => ({ contents:
        args.path === 'next/link'
          ? 'const React=require("react");module.exports=({href,prefetch,children,...props})=>React.createElement("a",{...props,href},children);'
          : args.path === 'next/navigation' ? 'exports.usePathname=()=>"/";'
          : 'module.exports={};', loader: 'js' }));
      build.onLoad({ filter: /\.module\.css$/ }, args => ({ contents: `export default ${JSON.stringify(moduleCss(args.path))}`, loader: 'js' }));
      build.onLoad({ filter: /\.css$/ }, args => ({ contents: '', loader: 'js' }));
    }}],
  });
  const mod = { exports: {} };
  vm.runInThisContext('(function(require,module,exports,__dirname){' + result.outputFiles[0].text + '\n})', { filename: 'neutral-review-renderer.cjs' })(require, mod, mod.exports, __dirname);
  let html = mod.exports.render();
  html = html.replaceAll('/courtside/', '../../public/courtside/');
  html = html.replaceAll('../../public/courtside/GOAT-HOOPERS-horizontal-white.svg', 'assets/GOAT-HOOPERS-horizontal-black.svg');
  const payload = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'courtside-preview/data.js'), 'utf8'), payload);
  payload.window.CLUBHOUSE_DATA.snapshot.teams.forEach(team => {
    html = html.replaceAll(`https://sleepercdn.com/avatars/thumbs/${team.avatar}`, `../../courtside-preview/assets/team-${team.id}.jpg`);
  });
  // Review controls cannot impersonate live application interactions.
  html = html.replace(/(<input\b[^>]*)(\/?>)/g, '$1 disabled=""$2')
    .replace(/(<select\b[^>]*)(>)/g, '$1 disabled=""$2')
    .replace(/(<button\b[^>]*)(>)/g, '$1 disabled=""$2');
  html = html.replace(/href="\/(?!\/)([^"]*)"/g, 'href="https://goathoopers.com/$1"');
  html = html.replace(/<a\b[^>]*\bhref="https?:\/\/[^\"]+"[^>]*>/g, tag =>
    tag.slice(0, -1) + ' target="_blank" rel="noopener noreferrer">');
  html = html.replaceAll('Live roster check', 'Review roster snapshot');
  const example = fs.readFileSync(path.join(__dirname, 'state-examples.html'), 'utf8');
  const template = example.match(/  <section[\s\S]*?<\/section>/)[0];
  const states = example.replace(template, Object.entries({ canvas: 'Canvas', surface: 'Raised surface', hover: 'Row hover' }).map(([background, label]) =>
    template.replaceAll('{{background}}', background).replaceAll('{{label}}', label)).join('\n'));
  const head = '<!doctype html><html lang="en" data-treatment="chalk"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>GOAT Hoopers · neutral palette review snapshot</title><link rel="stylesheet" href="../../src/ui/tokens.css"><link rel="stylesheet" href="../../src/ui/courtside-tokens.css"><link rel="stylesheet" href="../../src/app/globals.css"><link rel="stylesheet" href="snapshot.css"><link rel="stylesheet" href="treatments.css"></head><body><p class="review-notice">Palette review · frozen Oct 8 sample content · application controls disabled. Live-site and source links open in a separate tab, preserving this comparison. <a href="#review-semantic-states">Inspect synthetic color-state examples</a>.</p>';
  fs.writeFileSync(path.join(__dirname, 'home.html'), head + html + states + '</body></html>\n');
  fs.writeFileSync(path.join(__dirname, 'snapshot.css'), '/* Generated from current production CSS modules. Do not hand-edit. */\n' + ordered(css).map(([, value]) => value).join('\n'));
  fs.writeFileSync(path.join(__dirname, 'snapshot-manifest.json'), JSON.stringify({
    baseCommit: 'a327e9c960259025ffc736da7004408942736106',
    data: 'courtside-preview/data.js (frozen Oct 8 sample fixture; no network)',
    components: ['CourtsideHome', 'SiteHeader', 'SiteFooter', 'MobileNav', 'CombinedTicker'],
    adapters: ['Next Link to plain anchor', 'pathname fixed to /', 'optional Three viewer omitted', 'buttons/search/sort disabled; native details retained', 'local approved avatar assets', 'approved black horizontal logo variant'],
    cssModules: Object.fromEntries(ordered(cssNames)),
  }, null, 2) + '\n');
  console.log('Rendered current Courtside component tree and', css.size, 'CSS modules. No network, install, Next build or production write.');
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
