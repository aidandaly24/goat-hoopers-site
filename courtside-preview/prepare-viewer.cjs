/* Copy installed Three modules only for optional on-click figurine inspection.
 * No vendored dependency tree is committed and no network is required. */
const { mkdirSync, readFileSync, writeFileSync, symlinkSync, existsSync } = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const three = path.resolve(path.dirname(require.resolve('three')), '..');
mkdirSync(path.join(__dirname, 'vendor'), { recursive: true });
for (const [source, target] of [
  ['build/three.module.js', 'three.module.js'],
  ['build/three.core.js', 'three.core.js'],
  ['examples/jsm/loaders/GLTFLoader.js', 'GLTFLoader.js'],
  ['examples/jsm/utils/BufferGeometryUtils.js', 'BufferGeometryUtils.js'],
  ['examples/jsm/utils/SkeletonUtils.js', 'SkeletonUtils.js'],
  ['LICENSE', 'THREE-LICENSE.txt'],
]) {
  const bytes = readFileSync(path.join(three, source));
  const output = target.endsWith('.js')
    ? bytes.toString().replace(/from 'three'/g, "from './three.module.js'").replace(/from '\.\.\/utils\/(BufferGeometryUtils|SkeletonUtils)\.js'/g, "from './$1.js'")
    : bytes;
  writeFileSync(path.join(__dirname, 'vendor', target), output);
}
const models = path.join(__dirname, 'assets/hoopers');
if (!existsSync(models)) symlinkSync(path.relative(path.dirname(models), path.join(root, 'public/3d')), models, 'dir');
console.log('Optional viewer prepared from installed Three and existing GLBs.');
