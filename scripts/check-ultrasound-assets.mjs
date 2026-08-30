import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const app = join(root, 'apps', 'regional-anesthesia-trainer');
const assetDir = join('assets', 'ultrasound', 'adductor-canal', 'v0.1');
const expectedAssets = [
  {
    file: 'proximal.webp',
    bytes: 10316,
    sha256: '5cca43dce93fc4fa160a7e75de5cf55c8e26988ee9e9a0e8f273d41a85e1c20b',
  },
  {
    file: 'proximal-mid.webp',
    bytes: 9616,
    sha256: '168f341a8705a991ab7f60ac9d924a520670d9a5d3cb4e536e43c121d81403ef',
  },
  {
    file: 'mid.webp',
    bytes: 10296,
    sha256: 'd75c7b6da5196f1b00ae7fc133dd45f42a67d022c22b98ec578e6926b2385447',
  },
  {
    file: 'mid-distal.webp',
    bytes: 10386,
    sha256: '427b346f1fd34a857005d13126315813e68109185ec576a015245276763c8f0b',
  },
  {
    file: 'distal.webp',
    bytes: 10014,
    sha256: '9a4bb737bcdbb02367488eeea66301dac71c776efb7cc629fe24cab9178037c1',
  },
];
const textExtensions = new Set(['.ts', '.tsx', '.js', '.mjs', '.json', '.css', '.html']);
const ignoredDirectories = new Set(['.git', 'node_modules', 'dist']);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function verifyWebP(path, expected, label) {
  assert(existsSync(path), `${label} missing: ${relative(root, path)}`);
  const bytes = readFileSync(path);
  assert(bytes.length === expected.bytes, `${label} byte size changed: expected ${expected.bytes}, got ${bytes.length}`);
  assert(bytes.subarray(0, 4).toString('ascii') === 'RIFF', `${label} is not a RIFF container`);
  assert(bytes.subarray(8, 12).toString('ascii') === 'WEBP', `${label} is not a WebP binary`);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  assert(sha256 === expected.sha256, `${label} SHA-256 mismatch: ${sha256}`);
  assert(bytes.length < 100_000, `${label} exceeds the P1 per-frame asset budget`);
}

function verifyStack(baseDir, label) {
  const expectedFiles = expectedAssets.map((asset) => asset.file).sort();
  const actualFiles = readdirSync(baseDir).filter((file) => extname(file) === '.webp').sort();
  assert(
    JSON.stringify(actualFiles) === JSON.stringify(expectedFiles),
    `${label} stack mismatch: expected ${expectedFiles.join(', ')}, got ${actualFiles.join(', ')}`,
  );

  let totalBytes = 0;
  for (const expected of expectedAssets) {
    const path = join(baseDir, expected.file);
    verifyWebP(path, expected, `${label} ${expected.file}`);
    totalBytes += expected.bytes;
  }
  assert(totalBytes < 150_000, `${label} stack exceeds the P1 total asset budget`);
}

function walk(dir, visit) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, visit);
    else visit(path);
  }
}

function verifyNoEmbeddedImageData() {
  walk(root, (path) => {
    if (!textExtensions.has(extname(path))) return;
    const text = readFileSync(path, 'utf8');
    const rel = relative(root, path);
    assert(!/data:image\//i.test(text), `embedded image data URI found in ${rel}`);
    assert(!/[A-Za-z0-9+/]{4096,}={0,2}/.test(text), `probable embedded Base64 payload found in ${rel}`);
    assert(!/(?:^|[/\\])chunk\d*\.ts$/i.test(path), `binary text chunk file found: ${rel}`);
  });

  const abandonedChunkDir = join(app, 'src', 'assets', 'adductorRealistic');
  assert(!existsSync(abandonedChunkDir), `abandoned chunk directory exists: ${relative(root, abandonedChunkDir)}`);
}

verifyStack(join(app, 'public', assetDir), 'source ultrasound');
verifyNoEmbeddedImageData();

if (process.argv.includes('--dist')) verifyStack(join(app, 'dist', assetDir), 'built ultrasound');

const totalBytes = expectedAssets.reduce((sum, asset) => sum + asset.bytes, 0);
console.log(`ULTRASOUND ASSET P1 PASS (${expectedAssets.length} WebP frames, ${totalBytes} bytes total)`);
