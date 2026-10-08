/* Package the reviewed layout, colors, fonts and approved assets into one file. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const sources = new Map();
function embed(relative, from) {
  if (/^(data:|https?:|#)/.test(relative)) return relative;
  const absolute = path.resolve(from, relative.split('#')[0]);
  if (!absolute.startsWith(root + path.sep)) throw Error('Resource outside repo');
  const bytes = fs.readFileSync(absolute);
  const type = mime[path.extname(absolute)];
  if (!type) throw Error('Unknown asset type: ' + absolute);
  sources.set(path.relative(root, absolute), { bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex') });
  return `data:${type};base64,${bytes.toString('base64')}`;
}
let home = fs.readFileSync(path.join(__dirname, 'home.html'), 'utf8');
home = home.replace(/<link rel="stylesheet" href="([^"]+)">/g, (_, href) => {
  const file = path.resolve(__dirname, href);
  const css = fs.readFileSync(file, 'utf8').replace(/url\((['"]?)(.*?)\1\)/g, (match, quote, value) => `url("${embed(value, path.dirname(file))}")`);
  return '<style>' + css + '</style>';
});
home = home.replace(/(<img\b[^>]*?src=")([^"]+)(")/g, (_, before, src, after) => before + embed(src, __dirname) + after);
home = home.replace(/(<link\b[^>]*?as="image"[^>]*?href=")([^"]+)(")/g, (_, before, src, after) => before + embed(src, __dirname) + after);
const attribute = home.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let index = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
index = index.replace('src="home.html"', `srcdoc="${attribute}"`);
index = index.replace('<a href="home.html" target="_blank" rel="noopener">Open snapshot by itself ↗</a>', '<span>Portable review · all visual assets embedded</span>');
index = index.replace(/<noscript>[\s\S]*?<\/noscript>/, '<noscript><p>The default Chalk snapshot remains readable in the frame. Enable JavaScript to switch treatment or layout width.</p></noscript>');
index = index.replace('<script src="compare.js"></script>', '<script>' + fs.readFileSync(path.join(__dirname, 'compare.js'), 'utf8') + '</script>');
const delivery = path.resolve(root, '../GOAT-Hoopers-neutral-comparison.html');
fs.writeFileSync(delivery, index);
fs.writeFileSync(path.join(__dirname, 'portable-manifest.json'), JSON.stringify({
  fileName: path.basename(delivery), sizeBytes: Buffer.byteLength(index),
  sha256: crypto.createHash('sha256').update(index).digest('hex'),
  sourceCommit: 'a327e9c960259025ffc736da7004408942736106',
  notes: 'All visual resources embedded. Navigation links remain the real live-site destinations. No WebGL required. No new browser verification claimed.',
  assets: Object.fromEntries([...sources].sort(([a], [b]) => a.localeCompare(b))),
}, null, 2) + '\n');
console.log('Portable file:', delivery, Buffer.byteLength(index), 'bytes;', sources.size, 'approved existing resources embedded.');
