/* Isolated noindex comparison for the existing Vercel public-files route. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const publicRoot = path.join(root, 'public');
const output = path.join(publicRoot, 'design-preview/neutral-courtside');
const assetDirectory = path.join(output, 'assets');
fs.mkdirSync(assetDirectory, { recursive: true });
const resources = new Map();
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function assetUrl(relative, from) {
  if (/^https?:/.test(relative)) throw Error('Unexpected remote resource: ' + relative);
  if (relative.startsWith('data:')) return relative;
  if (relative.startsWith('#')) return relative;
  const absolute = path.resolve(from, relative.split('#')[0]);
  if (!absolute.startsWith(root + path.sep)) throw Error('Resource outside repository');
  const bytes = fs.readFileSync(absolute);
  let url;
  if (absolute.startsWith(publicRoot + path.sep)) {
    url = '/' + path.relative(publicRoot, absolute).split(path.sep).join('/');
  } else {
    const destination = path.join(assetDirectory, path.basename(absolute));
    if (fs.existsSync(destination) && digest(fs.readFileSync(destination)) !== digest(bytes)) throw Error('Asset name collision');
    fs.copyFileSync(absolute, destination);
    url = '/design-preview/neutral-courtside/assets/' + path.basename(absolute);
  }
  resources.set(path.relative(root, absolute), { url, bytes: bytes.length, sha256: digest(bytes) });
  return url;
}
const noindex = '<meta name="robots" content="noindex,nofollow">';
let home = fs.readFileSync(path.join(__dirname, 'home.html'), 'utf8');
const styles = [];
home = home.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => {
  const file = path.resolve(__dirname, href);
  styles.push(fs.readFileSync(file, 'utf8').replace(/url\((['"]?)(.*?)\1\)/g,
    (match, quote, value) => `url("${assetUrl(value, path.dirname(file))}")`));
  return '';
});
home = home.replace('</head>', '<link rel="stylesheet" href="styles.css">' + noindex + '</head>');
home = home.replace(/(<img\b[^>]*?src=")([^"]+)(")/g, (_, before, src, after) => before + assetUrl(src, __dirname) + after);
home = home.replace(/(<link\b[^>]*?as="image"[^>]*?href=")([^"]+)(")/g, (_, before, src, after) => before + assetUrl(src, __dirname) + after);
const index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').replace('</head>', noindex + '</head>');
const generated = { 'index.html': index, 'home.html': home, 'styles.css': styles.join('\n'), 'compare.js': fs.readFileSync(path.join(__dirname, 'compare.js'), 'utf8') };
for (const [name, content] of Object.entries(generated)) fs.writeFileSync(path.join(output, name), content);
fs.writeFileSync(path.join(__dirname, 'hosted-manifest.json'), JSON.stringify({
  route: '/design-preview/neutral-courtside/index.html',
  sourceCommit: 'a327e9c960259025ffc736da7004408942736106',
  status: 'Review-only, noindex/nofollow, absent from navigation. Actual hosted HTTP review pending.',
  sourceSnapshotSha256: digest(fs.readFileSync(path.join(__dirname, 'home.html'))),
  generated: Object.fromEntries(Object.entries(generated).map(([name, content]) => [name, { bytes: Buffer.byteLength(content), sha256: digest(content) }])),
  resources: Object.fromEntries([...resources].sort(([a], [b]) => a.localeCompare(b))),
}, null, 2) + '\n');
console.log('Generated isolated hosted comparison:', path.relative(root, output), ';', resources.size, 'local approved resources, no API/DB/WebGL.');
